from datetime import datetime, timedelta
import random
from pathlib import Path
import json

MIN_NUMBER = 50
MAX_NUMBER = 10000

PATH_TO_WORDS = Path("data/ods8.txt")
ALL_WORDS = PATH_TO_WORDS.read_text().lower().split("\n")

PATH_TO_SCRABBLE_SCORE = Path("data/letters_score.json")
SCRABBLE_SCORE = json.loads(PATH_TO_SCRABBLE_SCORE.read_text())

EXPORT_FOLDER = Path("days")

# List of possible values
first_possible_key = ["starts_with"]
first_possible_value = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "r",
    "s",
    "t",
    "u",
    "v",
]

last_possible_key = ["contains", "ends_with"]
last_possible_value = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "r",
    "s",
    "t",
    "u",
    "v",
    "z",
    "ou",
    "au",
    "oi",
    "in",
    "an",
    "on",
    "en",
    "un",
    "ien",
    "ille",
    "elle",
    "il",
    "sc",
    "ch",
    "ph",
    "gn",
    "qu",
    "gu",
    "ss",
    "tt",
    "ff",
    "ll",
    "mm",
]


def generate_a_first_criteria():
    first_key = random.choice(first_possible_key)
    first_value = random.choice(first_possible_value)

    return first_key, first_value


def generate_a_last_criteria():
    last_key = random.choice(last_possible_key)
    last_value = random.choice(last_possible_value)

    return last_key, last_value


def get_all_words_matching_criteria(first_key, first_value, last_key, last_value):
    words_matching_first_criteria = get_all_words_that_match_criteria(
        first_key, first_value
    )
    words_matching_last_criteria = get_all_words_that_match_criteria(
        last_key, last_value
    )

    # Find the intersection of the two lists
    words_matching_both_criteria = set(words_matching_first_criteria).intersection(
        words_matching_last_criteria
    )

    return list(words_matching_both_criteria)


def get_all_words_that_match_criteria(criteria_key, criteria_value):
    if criteria_key == "starts_with":
        return get_all_words_starting_with(criteria_value)
    elif criteria_key == "ends_with":
        return get_all_words_ending_with(criteria_value)
    elif criteria_key == "contains":
        return get_all_words_containing(criteria_value)
    else:
        raise ValueError(f"Unknown criteria key: {criteria_key}")


def get_all_words_starting_with(letter):
    return [word for word in ALL_WORDS if word.startswith(letter)]


def get_all_words_ending_with(letter):
    return [word for word in ALL_WORDS if word.endswith(letter)]


def get_all_words_containing(letter):
    return [word for word in ALL_WORDS if letter in word]


def get_first_criterias():
    first_criterias = [generate_a_first_criteria() for _ in range(3)]

    return first_criterias


def get_last_criterias():
    last_criterias = [generate_a_last_criteria() for _ in range(3)]

    return last_criterias


def get_criteria_and_words_until_condition_are_satisfied():
    while True:
        first_criterias = get_first_criterias()
        last_criterias = get_last_criterias()
        list_of_list_of_words = []

        # For each combination of first and last criteria, find the words that match
        list_of_list_of_words = get_all_combination(first_criterias, last_criterias)
        if list_of_list_of_words:
            return first_criterias, last_criterias, list_of_list_of_words


def get_all_combination(first_criterias, last_criterias):
    list_of_list_of_words = []
    for first_key, first_value in first_criterias:
        for last_key, last_value in last_criterias:
            words = get_all_words_matching_criteria(
                first_key, first_value, last_key, last_value
            )
            list_of_list_of_words.append(words)

            if len(words) < MIN_NUMBER or len(words) > MAX_NUMBER:
                print("Dommage, on recommence", len(words), "mots trouvés")
                return None
            print("YEAH")
    return list_of_list_of_words


def get_scrabble_score(word):
    score = 0
    for letter in word:
        score += SCRABBLE_SCORE[letter]
    return score


def generate_all_data():
    first_criterias, last_criterias, list_of_list_of_words = (
        get_criteria_and_words_until_condition_are_satisfied()
    )

    export_dict = {"criterias": [], "solutions_points": []}
    index = 0
    # Top line before
    for last_key, last_value in last_criterias:
        export_dict["criterias"].append({last_key: last_value})

    # Left column after
    for first_key, first_value in first_criterias:
        export_dict["criterias"].append({first_key: first_value})

    for first_key, first_value in first_criterias:
        for last_key, last_value in last_criterias:
            solution_points_dict = generate_all_solution_points_for_one_criteria(
                list_of_list_of_words[index],
            )
            export_dict["solutions_points"].append(solution_points_dict)
            index += 1
    return export_dict


def generate_all_solution_points_for_one_criteria(words):

    solution_scores = {word: get_scrabble_score(word) for word in words}

    return solution_scores


def generate_dates(first_day, day):
    date_format = "%d-%m-%Y"
    date = (datetime.strptime(first_day, date_format) + timedelta(days=day)).strftime(
        date_format
    )
    return date


def main():
    first_day = "03-07-2024"
    day = 0
    while True:
        date = generate_dates(first_day, day)
        generated_dict = generate_all_data()

        export_file_path = EXPORT_FOLDER / f"grid_{date}.json"
        export_file_path.write_text(json.dumps(generated_dict, indent=4))
        day += 1


if __name__ == "__main__":
    main()

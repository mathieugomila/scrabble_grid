const gridContainer = document.querySelector('.grid-container');
const INDEX_EDITABLE_TEXT = [5, 6, 7, 9, 10, 11, 13, 14, 15];

let today_grid_dict = {}
let current_score = 0;

let best_solution_words = [];

let max_score = 0;

let spellcheck = false;

/////////////////// INFO //////////////////////
function days_since_start() {
    const now = new Date();
    const then = new Date("2024-07-03T00:00:00+02:00");
    const diffInMs = now - then;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    return diffInDays;
}

function set_page_title() {
    const daySinceStart = days_since_start();
    const title_str = `SCRABBLE_GRID jour n°${daySinceStart}`;
    document.title = title_str;

    let title_element = document.getElementById("title");
    title_element.textContent = title_str;
    title_element.outerHTML = `<h2 id="title">${title_element.outerHTML}</h2>`;
}



/////////////////// GRID //////////////////////
function add_non_editable_text(nonEditableCaseIndex) {
    const nonEditableText = document.createElement('span');
    nonEditableText.classList.add('grid-item');
    nonEditableText.textContent = '-';

    nonEditableText.setAttribute('non-editable-data-index', nonEditableCaseIndex);

    gridContainer.appendChild(nonEditableText);
}

function add_editable_text(editableCaseIndex) {
    const textElement = document.createElement('div');
    textElement.classList.add('grid-item');

    const inputElement = document.createElement('textarea');
    inputElement.type = 'text';
    inputElement.classList.add('grid-item-input');
    inputElement.setAttribute('editable-data-index', editableCaseIndex);
    inputElement.style.border = 'none';
    inputElement.spellcheck = spellcheck;
    inputElement.wrap = 'on';


    const spanElement = document.createElement('span');
    spanElement.classList.add('grid-item-score');
    inputElement.setAttribute('score-text-data-index', editableCaseIndex);
    spanElement.textContent = 'TBD';

    textElement.appendChild(inputElement);
    textElement.appendChild(spanElement);

    gridContainer.appendChild(textElement);
}

function create_grid() {
    let editableCaseIndex = 0;
    let nonEditableCaseIndex = 0;
    for (let i = 0; i < 16; i++) {
        if (INDEX_EDITABLE_TEXT.includes(i)) {
            add_editable_text(editableCaseIndex);
            editableCaseIndex++;
            continue;
        }
        add_non_editable_text(nonEditableCaseIndex);
        nonEditableCaseIndex++;
    }
}

/////////////////// SET CRITERIAS TEXT //////////////////////
function get_date_in_str_format() {
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    const year = date.getFullYear();

    day = day < 10 ? '0' + day : day;
    month = month < 10 ? '0' + month : month;

    return `${day}-${month}-${year}`;
}

function set_one_criteria_text(index, criteria) {
    let text = "";
    if (criteria["starts_with"]) {
        const letter_starts_with = criteria["starts_with"].toUpperCase();
        text = `Commence par ${letter_starts_with}`;
    }
    else if (criteria["contains"]) {
        const letter_contains = criteria["contains"].toUpperCase();
        text = `Contient ${letter_contains}`;
    }
    else if (criteria["ends_with"]) {
        const letter_ends_with = criteria["ends_with"].toUpperCase();
        text = `Finis par ${letter_ends_with}`;
    }

    // index + 1 because data-index 0 correspond to the top left corner
    const textElement = document.querySelector(`[non-editable-data-index="${index + 1}"]`);
    textElement.textContent = text;
}

async function set_criterias_text() {
    // Load the data of the day
    const today_date = get_date_in_str_format();
    const today_file = await fetch(`days/grid_${today_date}.json`);
    const today_data = await today_file.json();

    today_grid_dict = today_data;

    // From json, get the criterias
    const criterias = today_grid_dict["criterias"];

    // For each criteria, set the text in the grid
    const NUMBER_OF_CRITERIAS = 6;
    for (let i = 0; i < NUMBER_OF_CRITERIAS; i++) {
        set_one_criteria_text(i, criterias[i]);
    }
}

/////////////////// COUNT SCORE //////////////////////
function get_text_for_one_case(editableCaseIndex) {
    const textElement = document.querySelector(`[editable-data-index="${editableCaseIndex}"]`);
    return textElement.value.toLowerCase();
}

function get_max_score_for_one_case(editableCaseIndex) {
    const solutions = today_grid_dict["solutions_points"];
    const solution_for_case = solutions[editableCaseIndex];

    let max_score = 0;
    let best_word = ""
    for (const key in solution_for_case) {
        max_score = Math.max(max_score, solution_for_case[key]);
        best_word = key;
    }
    best_solution_words.push(best_word);

    return max_score;
}

function count_score_for_one_case(editableCaseIndex) {
    const text = get_text_for_one_case(editableCaseIndex);

    // If the text is empty, return 0
    if (text === "") {
        return 0;
    }

    // Try to find if text is one of the solution of the day
    const solutions = today_grid_dict["solutions_points"];
    const solution_for_case = solutions[editableCaseIndex];
    if (solution_for_case[text] === undefined) {
        return 0;
    }

    return solution_for_case[text];
}

function indicate_score_for_one_case(editableCaseIndex, score) {
    const textElement = document.querySelector(`[score-text-data-index="${editableCaseIndex}"]`).nextElementSibling;
    const max_score_for_case = get_max_score_for_one_case(editableCaseIndex);
    textElement.textContent = `${score} / ${max_score_for_case}`;
}

function count_score() {
    let score = 0;
    for (let i = 0; i < 9; i++) {
        const case_score = count_score_for_one_case(i);
        score += case_score;
        indicate_score_for_one_case(i, case_score);
    }

    current_score = score;
}

function on_modified_text_event() {
    count_score();
    indicate_score();
    set_default_text_for_shared_button();
    set_color_based_on_text();
}

function add_on_modified_text_event() {
    const editableTextElements = document.querySelectorAll('.grid-item-input');
    editableTextElements.forEach(element => {
        element.addEventListener('input', on_modified_text_event);
    });
}

function indicate_score() {
    const textElement = document.querySelector(`[non-editable-data-index="0"]`);
    textElement.textContent = `Score: ${current_score} / ${max_score}`;
}

function remove_color_for_case(editableCaseIndex) {
    const textElement = document.querySelector(`[editable-data-index="${editableCaseIndex}"]`);
    textElement.classList.remove('empty', 'unknown', 'bad', 'medium', 'good', 'perfect');
}

function get_type_for_case(editableCaseIndex) {
    const case_text = get_text_for_one_case(editableCaseIndex);
    const case_score = count_score_for_one_case(editableCaseIndex);

    const best_score_possible_for_case = get_max_score_for_one_case(editableCaseIndex);

    if (case_text === "") {
        return "empty";
    }
    else if (case_score == 0) {
        return "unknown";
    }
    else if (case_score <= (0.35 * best_score_possible_for_case)) {
        return "bad";
    }
    else if (case_score <= (0.65 * best_score_possible_for_case)) {
        return "medium";
    }
    else if (case_score < best_score_possible_for_case) {
        return "good";
    }
    else if (case_score === best_score_possible_for_case) {
        return "perfect";
    }
}

function set_color_based_on_text() {
    for (let i = 0; i < 9; i++) {
        const case_type = get_type_for_case(i);

        const textElement = document.querySelector(`[editable-data-index="${i}"]`);
        remove_color_for_case(i);

        textElement.classList.add(case_type);
    }
}

/////////////////// SHARE BUTTON //////////////////////

function calculate_max_score() {
    let max_score = 0;
    best_solution_words = [];
    for (let i = 0; i < 9; i++) {
        max_score += get_max_score_for_one_case(i);
    }
    console.log(`[SPOILER CAREFUL]Best solution: ${best_solution_words}`);
    return max_score;
}

function get_detail_per_case() {

    let detail_per_case = "";

    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            const case_type = get_type_for_case(3 * x + y);
            if (case_type === "empty") {
                detail_per_case += "🔲";
            }
            else if (case_type === "unknown") {
                detail_per_case += "🟥";
            }
            else if (case_type === "bad") {
                detail_per_case += "🟧";
            }
            else if (case_type === "medium") {
                detail_per_case += "🟨";
            }
            else if (case_type === "good") {
                detail_per_case += "🟩";
            }
            else if (case_type === "perfect") {
                detail_per_case += "🟪";
            }
        }
        detail_per_case += "\n";
    }
    return detail_per_case;
}

async function on_shared_button_clicked() {
    const daySinceStar = days_since_start();
    const intro_text = `#SCRABBLE_GRID jour n°${daySinceStar}`;
    const score_text = `Mon score du jour est de ${current_score} points ! [Max possible: ${max_score} points]`;
    const url = `Viens jouer sur ${window.location.href}`;
    const detail_per_case = get_detail_per_case();

    const text_to_share = `${intro_text}\n\n${score_text}\n\n${detail_per_case}\n\n${url}`;

    try {
        await navigator.clipboard.writeText(text_to_share);
        document.getElementById("validateButton").firstChild.nodeValue = `Score copié dans le presse-papier`;
    } catch (err) {
        console.log('Erreur, texte non copié', err);
    }
}

function add_on_shared_button_event() {
    document.getElementById("validateButton").addEventListener('click', on_shared_button_clicked);
}

function set_default_text_for_shared_button() {
    document.getElementById("validateButton").firstChild.nodeValue = `Cliquez ici pour partager votre score`;
}

/////////////////// HELPER //////////////////////
function add_on_helper_button_event() {
    document.getElementById("helperButton").addEventListener('click', on_helper_button_clicked);
}

function on_helper_button_clicked() {
    spellcheck = !spellcheck;
    for (let i = 0; i < 9; i++) {
        const textElement = document.querySelector(`[editable-data-index="${i}"]`);
        textElement.spellcheck = spellcheck;
    }
    set_helper_button_text();
}

function set_helper_button_text() {
    // Modiy helperButton text
    const helperButton = document.getElementById("helperButton");
    helperButton.textContent = spellcheck ? "[Aide] Cliquez pour DÉSACTIVER la correction automatique" : "[Aide] Cliquez pour ACTIVER la correction automatique";
}


/////////////////// MAIN //////////////////////

async function main() {
    set_page_title();
    create_grid();
    await set_criterias_text();

    // Edit Text Cases
    add_on_modified_text_event();
    max_score = calculate_max_score();
    indicate_score();
    count_score(); // Count score at the beginning (To indicate the score for each case)
    set_color_based_on_text();

    // Share Button
    set_default_text_for_shared_button();
    add_on_shared_button_event();

    // Helper Button
    add_on_helper_button_event();
    set_helper_button_text();
}


main();



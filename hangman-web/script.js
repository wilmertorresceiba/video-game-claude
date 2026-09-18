// Bancos de palabras en inglés organizados por categoría.
// El servicio https://dictionaryapi.dev se consume para obtener la
// definición de la palabra elegida y mostrarla como pista.
const CATEGORIES = {
  fruits: {
    label: "Frutas",
    words: ["apple", "banana", "orange", "grape", "mango", "lemon", "cherry", "peach", "melon", "kiwi"],
  },
  animals: {
    label: "Animales",
    words: ["tiger", "elephant", "giraffe", "dolphin", "penguin", "rabbit", "monkey", "eagle", "turtle", "zebra"],
  },
  countries: {
    label: "Países",
    words: ["colombia", "mexico", "canada", "france", "japan", "brazil", "germany", "egypt", "india", "peru"],
  },
  professions: {
    label: "Profesiones",
    words: ["doctor", "teacher", "engineer", "lawyer", "painter", "farmer", "dentist", "pilot", "chef", "nurse"],
  },
  objects: {
    label: "Objetos",
    words: ["chair", "window", "mirror", "candle", "pencil", "bottle", "hammer", "blanket", "camera", "wallet"],
  },
  sports: {
    label: "Deportes",
    words: ["soccer", "tennis", "boxing", "cycling", "hockey", "golf", "surfing", "rowing", "archery", "diving"],
  },
};

const MAX_WRONG = 6;
const BODY_PARTS = ["part-head", "part-body", "part-left-arm", "part-right-arm", "part-left-leg", "part-right-leg"];

const setupEl = document.getElementById("setup");
const gameEl = document.getElementById("game");
const categoryGridEl = document.getElementById("category-grid");
const categoryNameEl = document.getElementById("category-name");
const attemptsLeftEl = document.getElementById("attempts-left");
const wordDisplayEl = document.getElementById("word-display");
const keyboardEl = document.getElementById("keyboard");
const hintBtn = document.getElementById("hint-btn");
const hintTextEl = document.getElementById("hint-text");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlay-title");
const overlayMsgEl = document.getElementById("overlay-msg");
const retryBtn = document.getElementById("retry-btn");
const changeCategoryBtn = document.getElementById("change-category-btn");

let state = {
  categoryKey: null,
  word: "",
  guessed: new Set(),
  wrongCount: 0,
  finished: false,
};

function buildCategoryButtons() {
  Object.entries(CATEGORIES).forEach(([key, category]) => {
    const btn = document.createElement("button");
    btn.className = "category-btn";
    btn.textContent = category.label;
    btn.addEventListener("click", () => startGame(key));
    categoryGridEl.appendChild(btn);
  });
}

function pickWord(categoryKey) {
  const words = CATEGORIES[categoryKey].words;
  return words[Math.floor(Math.random() * words.length)];
}

function startGame(categoryKey) {
  state = {
    categoryKey,
    word: pickWord(categoryKey),
    guessed: new Set(),
    wrongCount: 0,
    finished: false,
  };

  setupEl.hidden = true;
  gameEl.hidden = false;
  overlayEl.classList.add("hidden");

  categoryNameEl.textContent = CATEGORIES[categoryKey].label;
  attemptsLeftEl.textContent = MAX_WRONG;
  hintTextEl.textContent = "";
  hintBtn.disabled = false;

  BODY_PARTS.forEach((id) => document.getElementById(id).classList.add("hidden"));

  buildKeyboard();
  renderWord();
}

function buildKeyboard() {
  keyboardEl.innerHTML = "";
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code).toLowerCase();
    const btn = document.createElement("button");
    btn.className = "key-btn";
    btn.textContent = letter.toUpperCase();
    btn.dataset.letter = letter;
    btn.addEventListener("click", () => handleGuess(letter));
    keyboardEl.appendChild(btn);
  }
}

function renderWord() {
  wordDisplayEl.textContent = state.word
    .split("")
    .map((letter) => (state.guessed.has(letter) ? letter.toUpperCase() : "_"))
    .join(" ");
}

function setKeyState(letter, cssClass) {
  const btn = keyboardEl.querySelector(`[data-letter="${letter}"]`);
  if (btn) {
    btn.disabled = true;
    btn.classList.add(cssClass);
  }
}

function handleGuess(letter) {
  if (state.finished || state.guessed.has(letter)) return;

  state.guessed.add(letter);

  if (state.word.includes(letter)) {
    setKeyState(letter, "correct");
    renderWord();
    checkWin();
  } else {
    state.wrongCount++;
    setKeyState(letter, "wrong");
    updateHangmanDrawing();
    attemptsLeftEl.textContent = MAX_WRONG - state.wrongCount;
    checkLoss();
  }
}

function updateHangmanDrawing() {
  for (let i = 0; i < state.wrongCount; i++) {
    document.getElementById(BODY_PARTS[i])?.classList.remove("hidden");
  }
}

function checkWin() {
  const won = state.word.split("").every((letter) => state.guessed.has(letter));
  if (won) endGame(true);
}

function checkLoss() {
  if (state.wrongCount >= MAX_WRONG) endGame(false);
}

function endGame(won) {
  state.finished = true;
  hintBtn.disabled = true;

  if (!won) {
    wordDisplayEl.textContent = state.word.toUpperCase();
  }

  overlayTitleEl.textContent = won ? "¡Ganaste!" : "Perdiste";
  overlayMsgEl.textContent = won
    ? "Adivinaste la palabra correctamente."
    : `La palabra era: ${state.word.toUpperCase()}`;
  overlayEl.classList.remove("hidden");
}

async function fetchHint() {
  hintBtn.disabled = true;
  hintTextEl.textContent = "Buscando pista...";

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${state.word}`);
    if (!response.ok) throw new Error("No encontrada");

    const data = await response.json();
    const definition = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;

    hintTextEl.textContent = definition ? `Pista: ${definition}` : "No hay pista disponible para esta palabra.";
  } catch (err) {
    hintTextEl.textContent = "No se pudo obtener la pista (servicio no disponible).";
  }
}

hintBtn.addEventListener("click", fetchHint);
retryBtn.addEventListener("click", () => startGame(state.categoryKey));
changeCategoryBtn.addEventListener("click", () => {
  overlayEl.classList.add("hidden");
  gameEl.hidden = true;
  setupEl.hidden = false;
});

document.addEventListener("keydown", (event) => {
  if (gameEl.hidden || state.finished) return;
  const letter = event.key.toLowerCase();
  if (letter.length === 1 && letter >= "a" && letter <= "z") {
    handleGuess(letter);
  }
});

buildCategoryButtons();

/// state management / local storage
const localStorageKeySuffix = "-" + window.location.hostname + window.location.pathname;
const localStorageKeyState = "bingo-state" + localStorageKeySuffix;

const state = {
  min: 1,
  max: 75,
  next: null,
  history: [],
};

function loadStateFromLocalStorage() {
  try {
    const stateStr = localStorage.getItem(localStorageKeyState);
    if (!stateStr) return;
    const _state = JSON.parse(stateStr);
    const { min, max, next, history } = _state;
    if (isInt(min) && isInt(max) && max > min && (next === null || isIntArray(next)) && isIntArray(history)) {
      state.min = min;
      state.max = max;
      state.next = next;
      state.history = history;
    } else {
      throw new Error("Invalid state");
    }
  } catch (err) {
    console.error("Couldn't parse state from local storage", err);
  }
}

function isInt(num) {
  return typeof num === "number" && isFinite(num) && !isNaN(num) && parseInt(num) === num;
}
function isIntArray(nums) {
  return Array.isArray(nums) && nums.every((num) => isInt(num));
}

function saveStateToLocalStorage() {
  const stateStr = JSON.stringify(state);
  localStorage.setItem(localStorageKeyState, stateStr);
}

/// ui manipulation
const textGameSettings = document.getElementById("game-settings");
const textCurrentNumber = document.getElementById("current-number");
const containerHistory = document.getElementById("history-numbers");
const btnNextNumber = document.getElementById("btn-next-number");

function renderInitialUIFromState() {
  textGameSettings.innerText = `${pad(state.min)} - ${pad(state.max)}`;
  textCurrentNumber.innerText = state.history.length > 0 ? pad(state.history.at(-1)) : "?".repeat(pad(0).length);
  textCurrentNumber.style.color = getRandomColor();

  deleteAllChildren(containerHistory);
  for (const num of state.history.slice(0, -1)) {
    prependNumberToHistoryUI(num);
  }
}

function pad(num) {
  const maxDigits = String(Math.max(Math.abs(state.min), Math.abs(state.max))).length;
  const curNumLength = String(Math.abs(num)).length;
  return `${num < 0 ? "-" : ""}${"0".repeat(maxDigits - curNumLength)}${Math.abs(num)}`;
}

function deleteAllChildren(node) {
  node.replaceChildren();
}

function prependNumberToHistoryUI(num) {
  const textNode = document.createElement("p");
  textNode.innerText = pad(num);
  textNode.style.color = getRandomColor();
  containerHistory.prepend(textNode);
}

function setNextNumberUI(num) {
  textCurrentNumber.innerText = pad(num);
  textCurrentNumber.style.color = getRandomColor();
}

function addCurrentNumberToHistoryUI() {
  if (state.history.length > 0) {
    prependNumberToHistoryUI(state.history.at(-1));
  }
}

const colors = [
  "aqua",
  "aquamarine",
  "beige",
  "blueviolet",
  "burlywood",
  "chocolate",
  "coral",
  "cornflowerblue",
  "crimson",
  "darkcyan",
  "deeppink",
  "deepskyblue",
  "dodgerblue",
  "fuchsia",
  "gold",
  "greenyellow",
  "khaki",
  "lavender",
  "lightskyblue",
  "lime",
  "orange",
  "orangered",
  "papayawhip",
  "peachpuff",
  "pink",
  "plum",
  "royalblue",
  "salmon",
  "sandybrown",
  "springgreen",
  "tan",
  "tomato",
  "turqoise",
  "violet",
  "wheat",
  "yellow",
];

function getRandomColor() {
  const ix = Math.floor(Math.random() * colors.length);
  return colors[ix];
}

/// game logic
function nextNumber() {
  addCurrentNumberToHistoryUI();
  const numRemainingNumbers = state.max - state.min + 1 - state.history.length;
  if (numRemainingNumbers === 0) {
    textCurrentNumber.innerText = "end";
    btnNextNumber.disabled = true;
    return;
  }
  let nextNumber = null;
  if (state.next === null) {
    nextNumber = getNextNumberBruteForce();
  } else {
    nextNumber = getNextNumberFromPreparedList();
  }
  state.history.push(nextNumber);
  setNextNumberUI(nextNumber);
  saveStateToLocalStorage();
}

function getNextNumberBruteForce() {
  while (true) {
    const nextNumber = randInt(state.min, state.max);
    if (state.history.includes(nextNumber) === false) return nextNumber;
  }
}
function getNextNumberFromPreparedList() {
  return state.next.pop();
}

function randInt(a, b) {
  const range = b - a + 1;
  const randomInt = Math.floor(Math.random() * range);
  return a + randomInt;
}

/// dialog / new game
const dialogNewGame = document.getElementById("dialog-modal-new-game");
const inputNewGameMin = document.getElementById("input-new-game-min");
const inputNewGameMax = document.getElementById("input-new-game-max");

function openDialogNewGame() {
  dialogNewGame.showModal();
}

function closeDialogNewGame() {
  dialogNewGame.close();
}

function startNewGame() {
  const min = parseInt(inputNewGameMin.value);
  const max = parseInt(inputNewGameMax.value);
  if (isInt(min) && isInt(max) && max > min) {
    dialogNewGame.close();
    state.min = min;
    state.max = max;
    state.history = [];
    state.next = prepareNextNumbers();
    saveStateToLocalStorage();
    renderInitialUIFromState();
    btnNextNumber.disabled = false;
  }
}

function prepareNextNumbers() {
  if (state.max - state.min > 1000) return null;
  const allNumbers = new Array(state.max - state.min + 1).fill(null).map((_, ix) => state.min + ix);
  return getShuffledArray(allNumbers);
}
function getShuffledArray(array) {
  return array
    .map((value) => ({ value, sortOrder: Math.random() }))
    .sort((a, b) => b.sortOrder - a.sortOrder)
    .map(({ value }) => value);
}

/// init
loadStateFromLocalStorage();
renderInitialUIFromState();

const colors = [
  "#B6424C", // red
  "#CD5937", // tuscan-orange
  "#FDC030", // sunglow
  "#BDCB4C", // pear
  "#2B9B62", // eucalyptus
  "#37797B", // faded-jade
  "#1E53A3", // fun-blue
  "#A5397A", // tyrian-purple
];

window.onload = function () {
  const input = document.getElementById("input");
  const switchRandomRainbowColor = document.getElementById("switch");
  const switchOptions = document.querySelectorAll(
    ".switch-container .option-label"
  );
  const output = document.getElementById("output");

  function updateRainbowText() {
    createRainbowText(input, switchRandomRainbowColor, output);
  }
  function updateSwitchLabels() {
    const isRainbowColorSelected = switchRandomRainbowColor.checked;
    switchOptions[isRainbowColorSelected ? 0 : 1].classList.remove("selected");
    switchOptions[isRainbowColorSelected ? 1 : 0].classList.add("selected");
  }

  input.focus();
  input.addEventListener("input", function (event) {
    updateRainbowText();
  });
  switchRandomRainbowColor.addEventListener("input", () => {
    updateSwitchLabels();
    updateRainbowText();
  });
  initButtonEffect();
  updateSwitchLabels();
  updateRainbowText();
};

const regexIsNonWhitespace = /\S/;
function createRainbowText(input, switchRandomRainbowColor, output) {
  const isRainbowColorSelected = switchRandomRainbowColor.checked;
  input = input.value;
  output.innerHTML = "";
  let colorIndex = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const span = document.createElement("span");
    span.innerText = char;
    const color = isRainbowColorSelected
      ? colors[colorIndex % colors.length]
      : pickRandomColor();
    if (isRainbowColorSelected && regexIsNonWhitespace.test(char)) {
      colorIndex++;
    }
    span.style.color = color;
    output.appendChild(span);
  }
}

function pickRandomColor() {
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}

function copyToClipboard() {
  const formattedText = output.innerHTML;
  const blob = new Blob([formattedText], { type: "text/html" });
  const clipboardItem = new ClipboardItem({
    "text/html": blob,
    "text/plain": new Blob([input.value], { type: "text/plain" }),
  });
  navigator.clipboard.write([clipboardItem]);
}

let timestampLastAbortedTouchStartEvent = new Date().getTime();
let timestampLastTouchEndEvent = new Date().getTime();
function initButtonEffect() {
  for (let btn of document.querySelectorAll(".bubbly-button")) {
    ["mousedown", "touchstart"].forEach(function (evt) {
      btn.addEventListener(evt, function () {
        let t = new Date().getTime();
        if (t - timestampLastTouchEndEvent < 100) {
          timestampLastAbortedTouchStartEvent = t;
          return;
        }
        btn.classList.add("touch-start");
      });
    });
    ["mouseup", "touchend"].forEach(function (evt) {
      btn.addEventListener(evt, function (event) {
        let t = new Date().getTime();
        if (t - timestampLastAbortedTouchStartEvent < 100) return;
        timestampLastTouchEndEvent = t;
        copyToClipboard();
        animateBubblyButton(event);
      });
    });
  }
}
function animateBubblyButton(event) {
  event.target.classList.remove("touch-start");
  //reset animation
  event.target.classList.remove("animate");

  event.target.classList.add("animate");
  setTimeout(function () {
    event.target.classList.remove("animate");
  }, 700);
}

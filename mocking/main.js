window.onload = function () {
    const input = document.getElementById("input");
    const switchRandomAlternateCase = document.getElementById("switch");
    const switchOptions = document.querySelectorAll(".switch-container .option-label");
    const output = document.getElementById("output");
    const outputCopy = document.getElementById("output-copy");

    function updateMemeText() {
        createMemeText(input, switchRandomAlternateCase, output, outputCopy);
    }
    function updateSwitchLabels() {
        const alternateCase = switchRandomAlternateCase.checked;
        switchOptions[alternateCase ? 0:1].classList.remove("selected");
        switchOptions[alternateCase ? 1:0].classList.add("selected");
    }

    input.focus();
    input.addEventListener("input", function (event) {
        updateMemeText();
    });
    switchRandomAlternateCase.addEventListener("input", () => {
        updateSwitchLabels();
        updateMemeText();
    })
    initButtonEffect();
    updateSwitchLabels();
    updateMemeText();
};

function createMemeText (input, switchRandomAlternateCase, output, outputCopy) {
    const alternateCase = switchRandomAlternateCase.checked;
    input = input.value;
    let string1 = "", string2 = "", b = true, d = 0, random = 0;
    input = input.toLowerCase().replace(/ß/g,"ss").replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue");
    for (let i=0; i<input.length; i++) {
        if ("abcdefghijklmnopqrstuvwxyz".includes(input[i])) {
            if (alternateCase) {
                string1 += b ? input[i] : input[i].toUpperCase();
                string2 += b ? input[i].toUpperCase() : input[i];
                if (input[i] === "i") { d += b ? 1 : -1; }
                if (input[i] === "l") { d += b ? -1 : 1; }
                b = !b;
            } else {
                random = Math.random();
                if (input[i] === "i") random = 0;
                if (input[i] === "l") random = 1;
                string1 += random < 0.5 ? input[i] : input[i].toUpperCase();
            }
        } else {
            string1 += input[i];
            string2 += input[i];
        }
    }
    const r = d >= 0 ? string1 : string2;

    if (output.innerText !== r) {
        output.innerText = r;
        outputCopy.value = r;
    }
}

function copyToClipboard () {
    let el = document.getElementById("output-copy");
    el.select();
    el.setSelectionRange(0, el.value.length); /*For mobile devices*/
    document.execCommand("copy");
    el.blur();
}

let timestampLastAbortedTouchStartEvent = (new Date()).getTime();
let timestampLastTouchEndEvent = (new Date()).getTime();
function initButtonEffect () {
    for (let btn of document.querySelectorAll(".bubbly-button")) {
        ['mousedown', 'touchstart'].forEach( function(evt) {
            btn.addEventListener(evt, function () {
                let t = (new Date()).getTime();
                if (t - timestampLastTouchEndEvent < 100) {
                    timestampLastAbortedTouchStartEvent = t;
                    return;
                }
                btn.classList.add("touch-start");
            });
        });
        ['mouseup', 'touchend'].forEach( function(evt) {
            btn.addEventListener(evt, function (event) {
                let t = (new Date()).getTime();
                if (t - timestampLastAbortedTouchStartEvent < 100) return;
                timestampLastTouchEndEvent = t;
                copyToClipboard();
                animateBubblyButton(event);
            });
        });
    }
}
function animateBubblyButton (event) {
    event.target.classList.remove("touch-start");
    //reset animation
    event.target.classList.remove("animate");

    event.target.classList.add("animate");
    setTimeout(function() {
        event.target.classList.remove("animate");
    }, 700);
}
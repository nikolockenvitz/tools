window.onload = function () {
    let input = document.getElementById("input");
    let output = document.getElementById("output");
    let outputCopy = document.getElementById("output-copy");

    input.focus();
    setInterval(function () {
        createMemeText(input, output, outputCopy);
    }, 100);
};

function createMemeText (input, output, outputCopy) {
    input = input.value;
    let string1 = "", string2 = "", b = true, d = 0, r;
    input = input.toLowerCase().replace("ß","ss").replace("ä","ae").replace("ö","oe").replace("ü","ue");
    for (let i=0; i<input.length; i++) {
        if ("abcdefghijklmnopqrstuvwxyz".includes(input[i])) {
            string1 += b ? input[i] : input[i].toUpperCase();
            string2 += b ? input[i].toUpperCase() : input[i];
            if (input[i] === "i") { d += b ? 1 : -1; }
            if (input[i] === "l") { d += b ? -1 : 1; }
            b = !b;
        } else {
            string1 += input[i];
            string2 += input[i];
        }
    }
    if (d >= 0) {
        r = string1;
    } else {
        r = string2;
    }

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
}
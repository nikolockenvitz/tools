const url = new URL(window.location.href);
const KEY_CODE_ENTER = 13;
const KEY_CODE_SPACE = 32;

let laws = {};

const lawShortNameMapping = {
    "gdpr": "dsgvo",
    "uwg": "uwg_2004",
};

const NOT_FOUND = "- ?";

window.onload = function () {
    document.getElementById("submit-search").addEventListener("click", function () {
        showParagraph();
        if (!isMobile()) focusSearchInput();
    });
    const search = document.getElementById("search");
    onKeyPress(KEY_CODE_ENTER, search, function (event) {
        event.preventDefault();
        showParagraph();
        if (isMobile()) search.blur();
    });
    search.addEventListener("input", function () {
        search.classList.remove("error");
    });
    focusSearchInput();
    showParagraphIfInURL();
};

function onKeyPress (keyCode, element, eventHandler) {
    element.addEventListener("keyup", function (event) {
        if (event.keyCode === keyCode) {
            eventHandler(event);
        }
    });
}

function focusSearchInput () {
    const searchInput = document.getElementById("search");
    searchInput.focus();
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
}

function showParagraphIfInURL () {
    const urlQuery = url.searchParams.get("s");
    const urlHash = url.hash.slice(1);
    const search = urlQuery || urlHash;
    if (search) {
        document.getElementById("search").value = search;
        showParagraph();
    }
}

async function showParagraph () {
    const wrapper = document.getElementById("container-law-wrapper");
    const search = document.getElementById("search").value;
    let { lawShortName, paragraphNumber } = getLawAndParagraphFromSearch(search);
    if (lawShortName === undefined || paragraphNumber === undefined) {
        document.getElementById("search").classList.add("error");
        return;
    }
    document.getElementById("search").classList.remove("error");
    lawShortName = mapLawShortName(lawShortName);

    try {
        var { paragraphTitle, paragraphText } = await getParagraphTitleAndText(lawShortName, paragraphNumber);
    } catch {}
    if (paragraphTitle === undefined || paragraphText === undefined) {
        paragraphTitle = NOT_FOUND;
        paragraphText = "---";
    }

    let templ = document.querySelector("template");
    let clone = templ.content.cloneNode(true);
    clone.querySelector(".title").textContent = getCompleteParagraphTitle(lawShortName, paragraphNumber, paragraphTitle);
    clone.querySelector(".title").setAttribute("title", getCompleteLawTitle(lawShortName));
    insertMarkdownIntoDiv(clone.querySelector(".text"), paragraphText);

    const btnClose = clone.querySelector(".close");
    function onClickClose (event) {
        let container = event.target;
        while (!container.classList.contains("container")) {
            container = container.parentElement;
            if (container === null) return;
        }
        container.parentElement.removeChild(container);
    };
    btnClose.addEventListener("click", onClickClose);
    onKeyPress(KEY_CODE_ENTER, btnClose, onClickClose);
    onKeyPress(KEY_CODE_SPACE, btnClose, onClickClose);

    const btnCopy = clone.querySelector(".copy")
    function onClickCopy () {
        let shareUrl = url;
        shareUrl.hash = "";
        shareUrl.searchParams.set("s", search);
        copyTextToClipboard(shareUrl.toString(), btnCopy);
    };
    btnCopy.addEventListener("click", onClickCopy);
    onKeyPress(KEY_CODE_ENTER, btnCopy, onClickCopy);
    onKeyPress(KEY_CODE_SPACE, btnCopy, onClickCopy);

    addUrlsToExternalLinks(clone, {
        lawShortName,
        paragraphNumber,
        paragraphTitle
    });

    wrapper.prepend(clone);
}

function getLawAndParagraphFromSearch (search) {
    search = search.toLowerCase().trim();

    /* assumptions:
     * - name of law starts with a letter
     * - if name includes numbers it will be after an underscore
     * - paragraph starts with a number and can include letters at the end
     */

    const regexes = [
        {
            // law name (only letters) + optional whitespace + paragraph
            r: new RegExp("^([a-z]+)\\s*([0-9]{1}[^\\s]*)$"),
            lawFirst: true,
        },
        {
            // law name (letters/numbers) + whitespace + paragraph
            r: new RegExp("^([a-z]+_[^\\s]+)\\s+([0-9]{1}[^\\s]*)$"),
            lawFirst: true,
        },
        {
            // paragraph + whitespace + law name
            r: new RegExp("^([0-9]{1}[^\\s]*)\\s+([a-z]{1}[^\\s]*)$"),
            lawFirst: false,
        },
        {
            // paragraph (only numbers) + (no whitespace) + law name
            r: new RegExp("^([0-9]+)([a-z]{1}[^\\s]*)$"),
            lawFirst: false,
        },
    ];
    for (const regex of regexes) {
        const matches = regex.r.exec(search);
        if (matches) {
            return {
                lawShortName: matches[regex.lawFirst ? 1 : 2],
                paragraphNumber: matches[regex.lawFirst ? 2 : 1],
            };
        }
    }

    return { lawShortName: undefined, paragraphNumber: undefined };
}

function mapLawShortName (lawShortName) {
    if (lawShortName in lawShortNameMapping) {
        return lawShortNameMapping[lawShortName];
    }
    return lawShortName;
}

async function getParagraphTitleAndText (lawShortName, paragraphNumber) {
    if (lawShortName === "dsgvo") {
        return { paragraphTitle: "", paragraphText: "" };
    }
    if (laws[lawShortName] === undefined) {
        await loadLaw(lawShortName);
    }
    return extractParagraphTitleAndText(laws[lawShortName], paragraphNumber, getSymbolForParagraphs(lawShortName));
}

function getSymbolForParagraphs (lawShortName) {
    if (["gg", "dsgvo", "bgbeg"].includes(lawShortName)) {
        return "Art";
    }
    return "§";
}

async function loadLaw (lawShortName) {
    const response = await fetch(getLawUrl(lawShortName));
    laws[lawShortName] = await response.text();
}

function getLawUrl (lawName) {
    return `https://raw.githubusercontent.com/bundestag/gesetze/master/${lawName[0]}/${lawName}/index.md`;
}

function extractParagraphTitleAndText (lawText, paragraphNumber, s="§") {
    const titleRegex = getTitleRegex(paragraphNumber, s);
    let matches = titleRegex.exec(lawText);
    if (matches) {
        var paragraphTitle = matches[2].trim();
    } else {
        if (lawText === "404: Not Found") {
            return {
                paragraphTitle: "",
                paragraphText: lawText
            };
        }
        return extractTitleAndTextIfParagraphIsNoLongerApplicable(lawText, paragraphNumber, s);
    }
    const headingLevel = matches[1].length;
    const paragraphText = matches[3].trim().split(new RegExp(`(^|[^#])#{1,${headingLevel}} .*`))[0];
    return {
        paragraphTitle,
        paragraphText
    };
}

function getTitleRegex (paragraphNumber, s="§") {
    return new RegExp(`\\n(#*) ${s} ${paragraphNumber}(| [^\\n]*)\\n([^]*)$`);
}

function extractTitleAndTextIfParagraphIsNoLongerApplicable (lawText, paragraphNumber, s="§", tryAllLetters=false) {
    /* ##### (XXXX) §§ 3 bis 6 (weggefallen)
     * ##### (XXXX) §§ 114, 115 (weggefallen)
     * ##### (XXXX) §§ 611a und 611b (weggefallen)
     * ###### (XXXX) §§ 1615b bis 1615k (weggefallen)
     * ### (XXXX) Art 74a und 75 (weggefallen)
     * 
     * single paragraphs that are no longer applicable are already caught by general function
     * e.g. §§ 10, 279, 361 BGB
     */
    if (s === "§") s = "§§";

    // count down until corresponding line has been found
    let r, matches;
    let tempParagraphNumber = paragraphNumber;
    let i = 0, maxIterations = 100;
    while (tempParagraphNumber !== "0" && tempParagraphNumber[0] !== "-") {
        const titleRegex = getTitleRegex(tempParagraphNumber, s);
        if (titleRegex.exec(lawText)) break;

        r = new RegExp(`# (\\(XXXX\\) ${s} ${tempParagraphNumber}[ ,][^#]*\\(weggefallen\\))`);
        matches = r.exec(lawText);
        if (matches) {
            if (!isParagraphInRangeOfNoLongerApplicableParagraphs(paragraphNumber, matches[1])) {
                return;
            } else {
                return {
                    paragraphTitle: "(weggefallen)",
                    paragraphText: matches[1]
                };
            }
        }
        tempParagraphNumber = getPreviousParagraphNumber(tempParagraphNumber, tryAllLetters);
        i++;
        if (i > maxIterations) break;
    }
    if (!tryAllLetters) {
        return extractTitleAndTextIfParagraphIsNoLongerApplicable(lawText, paragraphNumber, s, true);
    }
}

function isParagraphInRangeOfNoLongerApplicableParagraphs (paragraphNumber, range) {
    const r = new RegExp(`([1-9][0-9]*[a-z]?)[^0-9]*([1-9][0-9]*[a-z]?)`);
    const matches = r.exec(range);

    const paragraph = getParagraphNumberAndLetter(paragraphNumber);
    const rangeStart = getParagraphNumberAndLetter(matches[1]);
    const rangeEnd = getParagraphNumberAndLetter(matches[2]);

    if (!range.includes(" bis ")) {
        // no range but a list of all paragraphs
        if (paragraphNumber === matches[1] || paragraphNumber === matches[2]) {
            return true;
        } else {
            return false;
        }
    }

    if (paragraph.number > rangeEnd.number ||
        (paragraph.number === rangeEnd.number &&
            paragraph.letter > rangeEnd.letter) ||
        paragraph.number < rangeStart.number ||
        (paragraph.number === rangeStart.number &&
            paragraph.letter < rangeStart.letter)) {
        return false;
    } else {
        return true;
    }
}

// assumption: paragraph starts with some numbers and may end with one lower-case letter
function getPreviousParagraphNumber (paragraphNumber, z=false) {
    const { number, letter } = getParagraphNumberAndLetter(paragraphNumber);
    if (letter === "" || letter === "a") {
        return `${number - 1}${letter === "" && z ? "z" : ""}`;
    } else {
        return `${number}${String.fromCharCode(letter.charCodeAt(0) - 1)}`;
    }
}
function getParagraphNumberAndLetter (paragraphNumber) {
    const r = new RegExp(`^([1-9][0-9]*)([a-z]?)$`);
    const matches = r.exec(paragraphNumber);
    if (!matches) throw new Error(`Unexpected Paragraph Number: ${paragraphNumber}`);

    return {
        number: Number(matches[1]),
        letter: matches[2]
    };
}

function getCompleteParagraphTitle (lawShortName, paragraphNumber, paragraphTitle) {
    return `${getCorrectLawShortName(lawShortName)} ${getSymbolForParagraphs(lawShortName)}`
        + ` ${paragraphNumber}${paragraphTitle ? " " : ""}${paragraphTitle}`;
}

function getCorrectLawShortName (lawShortName) {
    try {
        return laws[lawShortName].split("\njurabk: ")[1].split("\n")[0];
    } catch {
        return lawShortName.toUpperCase();
    }
}

function getCompleteLawTitle (lawShortName) {
    try {
        return laws[lawShortName].split("\nTitle: ")[1].split("\n")[0];
    } catch {
        return getCorrectLawShortName(lawShortName);
    }
}

function insertMarkdownIntoDiv (element, markdown) {
    // currently supports only line breaks
    for (const line of markdown.split(/\n\n/)) {
        element.appendChild(document.createTextNode(line));
        element.appendChild(document.createElement("br"));
    }
}

function addUrlsToExternalLinks (clone, {
    lawShortName, paragraphNumber, paragraphTitle
}) {
    if (lawShortName === "dsgvo") {
        try {
            const a = clone.querySelector("a#dsgvo-gesetz");
            a.setAttribute("href",
                `https://dsgvo-gesetz.de/art-${paragraphNumber}-dsgvo/`
            );
            a.classList.remove("hidden");
        } catch {}
        return;
    }

    try {
        let anchor;
        const s = getSymbolForParagraphs(lawShortName);
        let title = paragraphTitle.replace(/ /g, "-");
        if (title !== "") title = "-" + title;
        if (!paragraphTitle || paragraphTitle === NOT_FOUND || paragraphTitle.includes("weggefallen")) {
            anchor = "";
        } else if (s === "§") {
            anchor = `#-${paragraphNumber}${title}`;
        } else {
            anchor = `#${s.toLowerCase()}-${paragraphNumber}${title}`;
        }
        const a = clone.querySelector("a#github-bundestag-gesetze");
        a.setAttribute("href",
            `https://github.com/bundestag/gesetze/blob/master/${lawShortName[0]}/${lawShortName}/index.md${anchor}`
        );
        a.classList.remove("hidden");
    } catch {}
    try {
        if (lawShortName === "bgbeg") throw new Error("not working");
        let s = getSymbolForParagraphs(lawShortName);
        if (s === "§") s = "_";
        const a = clone.querySelector("a#gesetze-im-internet");
        a.setAttribute("href",
            `https://www.gesetze-im-internet.de/${lawShortName}/${s.toLowerCase()}_${paragraphNumber}.html`
        );
        a.classList.remove("hidden");
    } catch {}
}

function isMobile () {
    return screen.width <= 760;
}

function copyTextToClipboard (text, confirmationElement) {
    const input = document.getElementById("input-copy");
    input.value = text;
    input.select();
    input.setSelectionRange(0, text.length);
    document.execCommand("copy");
    input.blur();
    showCopySuccessful(confirmationElement);
}

function showCopySuccessful (confirmationElement) {
    confirmationElement.classList.add("successful");
    setTimeout(function () {
        confirmationElement.classList.remove("successful");
    }, 1200);
}

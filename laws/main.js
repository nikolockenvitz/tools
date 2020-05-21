let laws = {};

const NOT_FOUND = "- ?";

window.onload = function () {
    document.getElementById("submit-search").addEventListener("click", function () {
        showParagraph();
        if (!isMobile()) focusSearchInput();
    });
    document.getElementById("search").addEventListener("keyup", function (event) {
        if (event.keyCode === 13) { // 13 = Enter Key
            event.preventDefault();
            showParagraph();
            if (isMobile()) document.getElementById("search").blur();
        }
    });
    focusSearchInput();
};

function focusSearchInput () {
    const searchInput = document.getElementById("search");
    searchInput.focus();
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
}

async function showParagraph () {
    const wrapper = document.getElementById("container-law-wrapper");
    const search = document.getElementById("search").value;
    const { lawShortName, paragraphNumber } = getLawAndParagraphFromSearch(search);

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
    clone.querySelector(".text").innerHTML = markdownToHtml(paragraphText);
    clone.querySelector(".close").addEventListener("click", function (event) {
        const container = event.target.parentElement;
        container.parentElement.removeChild(container);
    });
    addUrlsToExternalLinks(clone, {
        lawShortName,
        paragraphNumber,
        paragraphTitle
    });

    wrapper.prepend(clone);
}

function getLawAndParagraphFromSearch (search) {
    search = search.toLowerCase();

    // regex: some letters + optionally whitespace + paragraph (starting with number, but then also letters possible)
    let r = new RegExp("([a-zA-Z]+)\\s*([0-9]{1}[0-9a-zA-Z]*)");
    matches = r.exec(search);

    return {
        lawShortName: matches[1],
        paragraphNumber: matches[2]
    };
}

async function getParagraphTitleAndText (lawShortName, paragraphNumber) {
    if (["dsgvo", "gdpr"].includes(lawShortName)) {
        return { paragraphTitle: "", paragraphText: "" };
    }
    if (laws[lawShortName] === undefined) {
        await loadLaw(lawShortName);
    }
    return extractParagraphTitleAndText(laws[lawShortName], paragraphNumber, getSymbolForParagraphs(lawShortName));
}

function getSymbolForParagraphs (lawShortName) {
    if (["gg", "dsgvo", "gdpr"].includes(lawShortName.toLowerCase())) {
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

function markdownToHtml (text) {
    text = text
        .replace(/\n\n/g, "<br>");
    return text;
}

function addUrlsToExternalLinks (clone, {
    lawShortName, paragraphNumber, paragraphTitle
}) {
    if (["dsgvo", "gdpr"].includes(lawShortName.toLowerCase())) {
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

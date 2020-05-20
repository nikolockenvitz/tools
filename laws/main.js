let laws = {};

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

    let paragraph, paragraphTitle, paragraphText;
    try {
        paragraph = await getParagraph(lawShortName, paragraphNumber);
        paragraphTitle = getParagraphTitle(lawShortName, paragraphNumber, paragraph);
        paragraphText = getParagraphText(paragraph);
    } catch {
        paragraph = "";
        paragraphTitle = getParagraphTitle(lawShortName, paragraphNumber, "- ?");
        paragraphText = "---";
    }

    let templ = document.querySelector("template");
    let clone = templ.content.cloneNode(true);
    clone.querySelector(".title").textContent = paragraphTitle;
    clone.querySelector(".title").setAttribute("title", getLawTitle(lawShortName));
    clone.querySelector(".text").innerHTML = markdownToHtml(paragraphText);
    clone.querySelector(".close").addEventListener("click", function (event) {
        const container = event.target.parentElement;
        container.parentElement.removeChild(container);
    });
    addUrlsToExternalLinks(clone, {
        lawShortName,
        paragraphNumber,
        paragraph
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

async function getParagraph (lawShortName, paragraphNumber) {
    if (laws[lawShortName] === undefined) {
        await loadLaw(lawShortName);
    }
    return extractParagraph(laws[lawShortName], paragraphNumber, getSymbolForParagraphs(lawShortName));
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

function extractParagraph (lawText, paragraphNumber, s="§") {
    const splitted = lawText.split(`# ${s} ${paragraphNumber}`);
    const headingLevel = (new RegExp("\n#*$")).exec(splitted[0])[0].length; // the last '#' is not counted but the '\n' is (-> +1 -1 cancels out)
    return splitted[1].split(new RegExp(`\n#{1,${headingLevel}} .*`))[0];
}

function getParagraphTitle (lawShortName, paragraphNumber, paragraph) {
    return `${getCorrectLawShortName(lawShortName)} ${getSymbolForParagraphs(lawShortName)} ${paragraphNumber} ${getTitleFromParagraph(paragraph)}`;
}

function getCorrectLawShortName (lawShortName) {
    try {
        return laws[lawShortName].split("\njurabk: ")[1].split("\n")[0];
    } catch {
        return lawShortName.toUpperCase();
    }
}

function getLawTitle (lawShortName) {
    try {
        return laws[lawShortName].split("\nTitle: ")[1].split("\n")[0];
    } catch {
        return getCorrectLawShortName(lawShortName);
    }
}

function getTitleFromParagraph (paragraph) {
    return paragraph.split("\n\n")[0].trim();
}

function getParagraphText (paragraph) {
    let temp = paragraph.split("\n\n");
    temp.shift();
    return temp.join("\n\n");
}

function markdownToHtml (text) {
    text = text
        .replace(/\n\n/g, "<br>");
    return text;
}

function addUrlsToExternalLinks (clone, {
    lawShortName, paragraphNumber, paragraph
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
        let title = `${getTitleFromParagraph(paragraph).replace(/ /g, "-")}`;
        if (title !== "") title = "-" +  title;
        if (s === "§") {
            anchor = `-${paragraphNumber}${title}`;
        } else {
            anchor = `${s.toLowerCase()}-${paragraphNumber}${title}`;
        }
        const a = clone.querySelector("a#github-bundestag-gesetze");
        a.setAttribute("href",
            `https://github.com/bundestag/gesetze/blob/master/${lawShortName[0]}/${lawShortName}/index.md#${anchor}`
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

let laws = {};

window.onload = function () {
    document.getElementById("submit-search").addEventListener("click", function () {
        showParagraph();
    });
    document.getElementById("search").addEventListener("keyup", function (event) {
        if (event.keyCode === 13) { // 13 = Enter Key
            event.preventDefault();
            showParagraph();
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
        focusSearchInput();
    });
    addUrlsToExternalLinks(clone, {
        lawShortName,
        paragraphNumber,
        paragraph
    });

    wrapper.prepend(clone);
}

function getLawAndParagraphFromSearch (search) {
    const [lawShortName, paragraphNumber] = search.split(" ");
    return { lawShortName, paragraphNumber };
}

async function getParagraph (lawShortName, paragraphNumber) {
    if (laws[lawShortName] === undefined) {
        await loadLaw(lawShortName);
    }
    return extractParagraph(laws[lawShortName], paragraphNumber);
}

async function loadLaw (lawShortName) {
    const response = await fetch(getLawUrl(lawShortName));
    laws[lawShortName] = await response.text();
}

function getLawUrl (lawName) {
    return `https://raw.githubusercontent.com/bundestag/gesetze/master/${lawName[0]}/${lawName}/index.md`;
}

function extractParagraph (lawText, paragraphNumber) {
    return lawText.split(`# § ${paragraphNumber} `)[1].split("# §")[0].replace(/#*$/, "");
}

function getParagraphTitle (lawShortName, paragraphNumber, paragraph) {
    return `${getCorrectLawShortName(lawShortName)} § ${paragraphNumber} ${getTitleFromParagraph(paragraph)}`;
}

function getCorrectLawShortName (lawShortName) {
    try {
        return laws[lawShortName].split("\njurabk: ")[1].split("\n")[0];
    } catch {
        return lawShortName;
    }
}

function getLawTitle (lawShortName) {
    try {
        return laws[lawShortName].split("\nTitle: ")[1].split("\n")[0];
    } catch {
        return lawShortName;
    }
}

function getTitleFromParagraph (paragraph) {
    return paragraph.split("\n\n")[0]
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
    try {
        clone.querySelector("a#github-bundestag-gesetze").setAttribute("href",
            `https://github.com/bundestag/gesetze/blob/master/${lawShortName[0]}/${lawShortName}/index.md`
            +`#-${paragraphNumber}-${getTitleFromParagraph(paragraph).replace(/ /g, "-")}`
        );
    } catch {}
    try {
        clone.querySelector("a#gesetze-im-internet").setAttribute("href",
            `https://www.gesetze-im-internet.de/${lawShortName}/__${paragraphNumber}.html`
        );
    } catch {}
}
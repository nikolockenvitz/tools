const LS_DATA = "decisionmatrix-data";
let temporarilyDragDisabledCells = [];
let dataTransferDrag = "";

let showElement = function (el) { el.style.display = ""; };
let hideElement = function (el) { el.style.display = "none"; };

const defaultContent = [
    ["","Weight","Alternative 1","Alternative 2"],
    ["Criteria 1", "5", "1", "2"],
    ["Criteria 2", "6", "3", "4"],
    ["Score", "", "", ""]];

const cellTemplate = '<td><p contenteditable="true">{content}</p></td>';
const cellTemplateNotEditable = '<td>{content}</td>';

window.onload = function() {
    init();
};

let init = function () {
    let table = document.getElementById("table");
    let rows = table.rows;

    // create table
    let data = localStorage.getItem(LS_DATA);
    if (data === null || data === undefined || data === "[]") {
        data = defaultContent;
    } else {
        data = JSON.parse(data);
    }
    setTableContent(data);

    // make columns draggable (except first and second)
    for (let i=2; i<rows[0].cells.length; i++) {
        enableDragAndDropForCell(rows[0].cells[i]);
    }
    // make rows draggable (except first and last)
    for (let i=1; i<rows.length-1; i++) {
        enableDragAndDropForCell(rows[i].cells[0]);
    }

    // disable drop for all contenteditable-fields
    let elements = document.querySelectorAll('[contenteditable="true"]');
    disableDropForElements(elements);

    // delete widget
    let el = document.getElementById("btn-delete");
    enableDropForDeleteWidget(el);
    document.addEventListener("dragstart", function (e) {
        showElement(el);
    });
    document.addEventListener("dragend", function (e) {
        hideElement(el);
    });
    hideElement(el);

    window.addEventListener('mouseup', function(e) {
        // drag needs to be disabled when user clicks in childs of cell
        // -> enable drag again when mouse is released
        for (let el of temporarilyDragDisabledCells) {
            el.draggable = true;
        }
        temporarilyDragDisabledCells = [];

        // if user clicks next to "input" then get focus
        if (e.target.tagName === "TD") {
            for (let child of e.target.children) {
                if (child.tagName === "P" &&
                    child.getAttribute("contenteditable") === "true") {
                    child.focus();
                    break;
                }
            }
        }
    });

    // save changes to local storage and update score-row if values change
    document.addEventListener("input", function (e) {
        saveTableToLocalStorage();

        let cell = e.target.parentNode;
        let { rowIndex, cellIndex } = getRowAndCellIndexOfCell(cell);

        // split into grade and comment
        /*let pElement = document.getElementById("table").rows[rowIndex].cells[cellIndex].children[0];
        let text = pElement.innerText;
        //console.log(window.getSelection());
        let x = "<span class='number'>";
        let i = 0;
        while (true) {
            if (isNaN(text[i]) || i >= text.length) {
                break;
            }
            x += text[i++];
        }
        x += "</span>";
        x += "<span class='comment'>" + text.substring(i) + "</span>";
        pElement.innerHTML = x;*/

        // update last row of table (score)
        if (rowIndex >= 1 && cellIndex >= 1) {
            updateScores();
        }
    });

    updateScores();
};

let saveTableToLocalStorage = function () {
    localStorage.setItem(LS_DATA, JSON.stringify(getTableContent()));
};

let enableDragAndDropForCell = function (cell) {
    cell.draggable = true;
    for (let child of cell.children) {
        child.draggable = false;
        child.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            disableDragForCellTemporarily(child.parentNode);
        });
    }
    cell.ondragstart = drag;
    cell.ondragover = checkWhetherDropAllowed;
    cell.ondrop = drop;
    cell.classList.add("draggable");
};

let disableDropForElements = function (elements) {
    for (let element of elements) {
        element.addEventListener("drop", function (e) {
            e.preventDefault();
            return false;
        });
        element.parentNode.addEventListener("drop", function (e) {
            e.preventDefault();
            return false;
        });
    }
};

let enableDropForDeleteWidget = function (el) {
    el.ondragover = function (e) { e.preventDefault(); };
    el.ondrop = function (e) {
        e.preventDefault();
        let data = getDataForDrag(e);
        let { rowIndex, cellIndex } = getRowAndCellIndexOfCellId(data);
        if (rowIndex === 0) {
            deleteColumn(cellIndex);
        } else if (cellIndex === 0) {
            deleteRow(rowIndex);
            updateScores();
        }
        hideElement(el);
    }
};

let deleteColumn = function (columnIndex) {
    for (let row of document.getElementById("table").rows) {
        row.deleteCell(columnIndex);
    }
    saveTableToLocalStorage();
};

let deleteRow = function (rowIndex) {
    document.getElementById("table").deleteRow(rowIndex);
    saveTableToLocalStorage();
};

let updateScores = function () {
    let table = document.getElementById("table");
    let rows = table.rows;
    for (let c=2; c<rows[0].cells.length; c++) {
        let score = 0;
        for (let r=1; r<rows.length-1; r++) {
            let grade = +rows[r].cells[c].children[0].innerText.split(/\s/,1)[0]; // read number only until first whitespace
            let weight = +rows[r].cells[1].children[0].innerText.split(/\s/,1)[0];
            score += grade * weight;
        }
        rows[rows.length-1].cells[c].innerText = score;
    }
};

let disableDragForCellTemporarily = function (cell) {
    temporarilyDragDisabledCells.push(cell);
    cell.draggable = false;
};
let getDataForDrag = function (e) {
    let data = e.dataTransfer.getData("text");
    if (data === "") {
        if (dataTransferDrag === "") {
            // unknown error
        } else {
            // e.dataTransfer is not working in Chrome
            data = dataTransferDrag;
            //alert("Please use Firefox!");
        }
    }
    return data;
};

let drag = function (e) {
    let id = getCellId(e.srcElement);
    e.dataTransfer.setData("text", id);
    dataTransferDrag = id;
};

let checkWhetherDropAllowed = function (e) {
    let data = getDataForDrag(e);
    let from = getRowAndCellIndexOfCellId(data);
    let to = getRowAndCellIndexOfCell(e.srcElement);

    if (isDroppable(from, to)) {
        e.preventDefault();
    }
};

let isDroppable = function (from, to) {
    // mustn't be same cell but at least row- or cell-index have to be 0
    if ( !(from.rowIndex === to.rowIndex &&
            from.cellIndex === to.cellIndex) &&
        ( (from.rowIndex === 0 && to.rowIndex === 0) ||
        (from.cellIndex === 0 && to.cellIndex === 0) ) ) {
        
        return true;
    }
    return false;
}

let drop = function (e) {
    e.preventDefault();
    let data = getDataForDrag(e);
    let from = getRowAndCellIndexOfCellId(data);
    let to = getRowAndCellIndexOfCell(e.srcElement);

    if (!isDroppable(from, to)) {
        return false;
    }

    if (from.rowIndex === 0 && to.rowIndex === 0) {
        // move column
        let content = [];
        for (let row of document.getElementById("table").rows) {
            content.push(row.cells[from.cellIndex].innerText);
        }
        deleteColumn(from.cellIndex);
        addColumn(to.cellIndex, content);
    } else if (from.cellIndex === 0 && to.cellIndex === 0) {
        // move row
        let content = [];
        for (let cell of document.getElementById("table").rows[from.rowIndex].cells) {
            content.push(cell.innerText);
        }
        deleteRow(from.rowIndex);
        addRow(to.rowIndex, content);
    }
    dataTransferDrag = "";
    hideElement(document.getElementById("btn-delete"));
};

let getCellId = function (cell) {
    let { rowIndex, cellIndex } = getRowAndCellIndexOfCell(cell);
    return "cell-" + rowIndex + "-" + cellIndex;
}
let getRowAndCellIndexOfCell = function (cell) {
    while (cell.cellIndex === undefined) {
        // function was probably called with child of cell
        cell = cell.parentNode;
    }
    return { rowIndex: cell.parentNode.rowIndex,
                cellIndex: cell.cellIndex };
};
let getRowAndCellIndexOfCellId = function (cellId) {
    let temp = cellId.split("-");
    return { rowIndex: +temp[1],
                cellIndex: +temp[2] };
}

let addRow = function (rowIndex, content) {
    let table = document.getElementById("table");

    if (rowIndex === undefined) {
        rowIndex = table.rows.length-1;
    }
    if (content === undefined) {
        content = ["Criteria"];
    }

    let newRow = table.insertRow(rowIndex);

    for (let i=0; i<table.rows[0].cells.length; i++) {
        newRow.insertCell(-1).innerHTML = cellTemplate.replace("{content}", content.length > i ? content[i] : "0");
    }

    enableDragAndDropForCell(newRow.cells[0]);

    let elements = newRow.querySelectorAll('[contenteditable="true"]');
    disableDropForElements(elements);

    saveTableToLocalStorage();
};

let addColumn = function (columnIndex, content) {
    let rows = document.getElementById("table").rows;
    let addedCells = [];

    if (columnIndex === undefined) {
        columnIndex = rows[0].cells.length;
    }
    if (content === undefined) {
        content = ["Alternative"];
    }

    let cell;
    for (let i=0; i<rows.length; i++) {
        cell = rows[i].insertCell(columnIndex);
        cell.innerHTML = cellTemplate.replace("{content}", content.length > i ? content[i] : "0");
        addedCells.push(cell);
    }

    enableDragAndDropForCell(rows[0].cells[columnIndex]);

    for (let addedCell of addedCells) {
        disableDropForElements(addedCell.querySelectorAll('[contenteditable="true"]'));
    }

    saveTableToLocalStorage();
};

let setTableContent = function (content) {
    let table = document.getElementById("table");
    for (let i=table.rows.length-1; i>=0; i--) {
        deleteRow(i);
    }

    let templ;
    for (let i=0; i<content.length; i++) {
        let newRow = table.insertRow(-1);
        for (let j=0; j<content[i].length; j++) {
            if (i === content.length-1 || (i === 0 && (j === 0 || j === 1))) {
                templ = cellTemplateNotEditable;
            } else {
                templ = cellTemplate;
            }
            newRow.insertCell(-1).innerHTML = templ.replace("{content}", content[i][j]);
        }
    }

    saveTableToLocalStorage();
};

let getTableContent = function () {
    let table = document.getElementById("table");
    let content = [];
    for (let i=0; i<table.rows.length; i++) {
        content.push([]);
        for (let j=0; j<table.rows[i].cells.length; j++) {
            content[i].push(table.rows[i].cells[j].innerText);
        }
    }
    return content;
};

let downloadCSV = function () {
    let content = getTableContent();

    // create csv
    let csv = "";
    for (let row of content) {
        for (let i=0; i<row.length; i++) {
            csv += (i === 0 ? "" : ",") + "\"" + row[i].replace(/\"/g, "\"\"") + "\"";
        }
        csv += "\n";
    }

    // download csv
    let hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'decisionmatrix.csv';
    hiddenElement.click();
};

let resetTable = function () {
    localStorage.removeItem(LS_DATA);
    init();
};
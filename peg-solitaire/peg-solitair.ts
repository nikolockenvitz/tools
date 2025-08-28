type Board = string;

const VOID = " ";
const EMPTY = ".";
const PEG = "x";
const BASE_BOARD: Board = [
  "  xxx  ",
  "  xxx  ",
  "xxxxxxx",
  "xxx.xxx",
  "xxxxxxx",
  "  xxx  ",
  "  xxx  ",
].join("\n");
const TARGET_BOARD: Board = [
  "  ...  ",
  "  ...  ",
  ".......",
  "...x...",
  ".......",
  "  ...  ",
  "  ...  ",
].join("\n");

function getBoardId(board: Board): string {
  // one board has up to 7 analog boards (rotated/mirrored)
  // -> we generate all 8 permutations and use string-sorting for getting a constant one to identify all of them
  const permutations = [mirrorBoard(board)];
  let tempBoard = board;
  for (let i = 0; i < 3; i++) {
    tempBoard = rotateBoard(tempBoard);
    permutations.push(tempBoard, mirrorBoard(tempBoard));
  }
  let minBoard = board;
  for (const b of permutations) {
    if (b < minBoard) minBoard = b;
  }
  const numPegs = countPegs(board);
  return numPegs + minBoard;
}

function mirrorBoard(board: Board): Board {
  return board
    .split("\n")
    .map((row) => row.split("").reverse().join(""))
    .join("\n");
}

function rotateBoard(board: Board): Board {
  // read from last col, top to bottom, towards first col
  const rows = board.split("\n");
  const width = rows[0]!.length,
    height = rows.length;
  let newRows: string[] = [];
  for (let x = width - 1; x >= 0; x--) {
    let newRow = "";
    for (let y = 0; y < height; y++) {
      newRow += rows[y][x];
    }
    newRows.push(newRow);
  }
  return newRows.join("\n");
}

function countPegs(board: Board): number {
  return (board.match(/x/g) ?? []).length;
}

const TEST_BOARD_1: Board = [
  "  x..  ",
  "  ...  ",
  ".......",
  ".......",
  ".......",
  "  ...  ",
  "  ...  ",
].join("\n");

function solveBFS(startBoard: Board): void {
  const targetBoardId = getBoardId(TARGET_BOARD);
  let currentNumPegs = countPegs(startBoard);
  type BoardsWithHistory = { board: Board; history: Board[] }[];
  let currentBoards: BoardsWithHistory = [{ board: startBoard, history: [] }];
  const solutions: BoardsWithHistory = [];
  let i = 0;
  while (true) {
    const nextBoards: BoardsWithHistory = [];
    const seenBoardIds = new Set<string>();
    for (const { board, history } of currentBoards) {
      for (const nextBoard of getNextBoards(board)) {
        const boardId = getBoardId(nextBoard);
        if (seenBoardIds.has(boardId)) continue;
        seenBoardIds.add(boardId);
        nextBoards.push({ board: nextBoard, history: [...history, board] });
        if (boardId === targetBoardId)
          solutions.push({ board: nextBoard, history: [...history, board] });
      }
    }
    if (nextBoards.length === 0) {
      console.log(`Round ${++i}: Found no boards. Exiting.`);
      break;
    } else {
      console.log(
        `Round ${++i}: Found ${
          nextBoards.length
        } boards with ${--currentNumPegs} pegs`
      );
      currentBoards = nextBoards;
    }
  }
  console.log(`Found ${solutions.length} solutions`);
}

function solveDFS(startBoard: Board): Board[] | null {
  const targetBoardId = getBoardId(TARGET_BOARD);
  let currentNumPegs = countPegs(startBoard);
  const seenBoardIds = new Set<string>();
  let bestDepth = 0;
  function dfs(board: Board, history: Board[]): Board[] | null {
    // if (history.length > bestDepth) {
    //     console.log(`Current depth: ${history.length}:\n${board}`);
    // }
    bestDepth = Math.max(bestDepth, history.length);
    console.log(
      `Current depth: ${history.length}, best depth: ${bestDepth}/${
        currentNumPegs - 1
      }, total boards: ${seenBoardIds.size}`
    );
    for (const nextBoard of getNextBoards(board)) {
      const boardId = getBoardId(nextBoard);
      if (boardId === targetBoardId) return [...history, board, nextBoard];
      if (seenBoardIds.has(boardId)) continue;
      seenBoardIds.add(boardId);
      const solution = dfs(nextBoard, [...history, board]);
      if (solution) return solution;
    }
    return null;
  }
  return dfs(startBoard, []);
}

function getNextBoards(board: Board): Board[] {
  const nextBoards: Board[] = [];
  const rows = board.split("\n");
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] === PEG) {
        if (y - 2 > 0 && rows[y - 1][x] === PEG && rows[y - 2][x] === EMPTY) {
          // jump north
          nextBoards.push(
            [
              ...rows.slice(0, y - 2),
              rows[y - 2].slice(0, x) + PEG + rows[y - 2].slice(x + 1),
              rows[y - 1].slice(0, x) + EMPTY + rows[y - 1].slice(x + 1),
              rows[y].slice(0, x) + EMPTY + rows[y].slice(x + 1),
              ...rows.slice(y + 1),
            ].join("\n")
          );
        }
        if (
          y + 2 < rows.length &&
          rows[y + 1][x] === PEG &&
          rows[y + 2][x] === EMPTY
        ) {
          // jump south
          nextBoards.push(
            [
              ...rows.slice(0, y),
              rows[y].slice(0, x) + EMPTY + rows[y].slice(x + 1),
              rows[y + 1].slice(0, x) + EMPTY + rows[y + 1].slice(x + 1),
              rows[y + 2].slice(0, x) + PEG + rows[y + 2].slice(x + 1),
              ...rows.slice(y + 3),
            ].join("\n")
          );
        }
        if (x - 2 > 0 && rows[y][x - 1] === PEG && rows[y][x - 2] === EMPTY) {
          // jump west
          nextBoards.push(
            [
              ...rows.slice(0, y),
              rows[y].slice(0, x - 2) +
                PEG +
                EMPTY +
                EMPTY +
                rows[y].slice(x + 1),
              ...rows.slice(y + 1),
            ].join("\n")
          );
        }
        if (
          x + 2 < rows[y].length &&
          rows[y][x + 1] === PEG &&
          rows[y][x + 2] === EMPTY
        ) {
          // jump east
          nextBoards.push(
            [
              ...rows.slice(0, y),
              rows[y].slice(0, x) + EMPTY + EMPTY + PEG + rows[y].slice(x + 3),
              ...rows.slice(y + 1),
            ].join("\n")
          );
        }
      }
    }
  }
  return nextBoards;
}

const solutionDFS = solveDFS(BASE_BOARD);
for (const board of solutionDFS ?? []) {
    console.log(board + "\n\n");
}

// solveBFS(BASE_BOARD);


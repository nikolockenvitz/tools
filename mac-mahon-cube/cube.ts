class Cube {
  id: number;
  top = 0;
  front = 0;
  left = 0;
  right = 0;
  back = 0;
  bottom = 0;

  constructor(args: {
    id: number;
    top: number;
    front: number;
    left: number;
    right: number;
    back: number;
    bottom: number;
  }) {
    this.id = args.id;
    this.top = args.top;
    this.front = args.front;
    this.left = args.left;
    this.right = args.right;
    this.back = args.back;
    this.bottom = args.bottom;
  }

  // TODO: rotations are implemented rather inefficiently and might be improved

  clone(): Cube {
    return new Cube({
      id: this.id,
      top: this.top,
      front: this.front,
      left: this.left,
      right: this.right,
      back: this.back,
      bottom: this.bottom,
    });
  }

  isExactlyTheSame(otherCube: Cube): boolean {
    return (
      this.top === otherCube.top &&
      this.front === otherCube.front &&
      this.left === otherCube.left &&
      this.right === otherCube.right &&
      this.back === otherCube.back &&
      this.bottom === otherCube.bottom
    );
  }

  isCongruentlyTheSame(otherCube: Cube): boolean {
    for (let i = 0; i < 24; i++) {
      if (
        otherCube.clone().rotateToPermutation(i).isExactlyTheSame(this) === true
      ) {
        return true;
      }
    }
    return false;
  }

  rotateToPermutation(n: number): this {
    n = n % 24;
    for (let i = 0; i < n; i++) {
      this.rotateTopBottomAxisClockwiseOnce();
      const rotations = i + 1;
      if (
        rotations === 4 ||
        rotations === 8 ||
        rotations === 12 ||
        rotations === 16
      ) {
        // after 4 rotations, we are at the initial state and need to rotate once along the left/right axis
        this.rotateLeftRightAxisClockwiseOnce();
      }
      if (rotations === 16 || rotations === 20) {
        // eventually, we also need to rotate along front/back axis to get left/right to the top as well
        this.rotateFrontBackAxisClockwiseOnce();
        if (rotations === 20) this.rotateFrontBackAxisClockwiseOnce();
      }
    }
    return this;
  }

  rotateTopBottomAxisClockwiseOnce(): this {
    const oldFront = this.front;
    this.front = this.right;
    this.right = this.back;
    this.back = this.left;
    this.left = oldFront;
    return this;
  }

  rotateLeftRightAxisClockwiseOnce(): this {
    const oldFront = this.front;
    this.front = this.bottom;
    this.bottom = this.back;
    this.back = this.top;
    this.top = oldFront;
    return this;
  }

  rotateFrontBackAxisClockwiseOnce(): this {
    const oldTop = this.top;
    this.top = this.left;
    this.left = this.bottom;
    this.bottom = this.right;
    this.right = oldTop;
    return this;
  }

  rotateToMatchCondition(conditionFunction: (cube: Cube) => boolean): Cube[] {
    const matchingClones: Cube[] = [];
    for (let i = 0; i < 24; i++) {
      const clone = this.clone().rotateToPermutation(i);
      if (conditionFunction(clone) === true) {
        matchingClones.push(clone);
      }
    }
    return matchingClones;
  }

  toString(): string {
    return `   ${this.top}   
${this.left} ${this.front} ${this.right} ${this.back}
   ${this.bottom}   `;
  }

  static generateAllCubes(): Cube[] {
    const cubes: Cube[] = [];
    let id = 0;
    const top = 1;
    for (const bottom of [2, 3, 4, 5, 6]) {
      const front = bottom === 2 ? 3 : 2;
      for (const left of [2, 3, 4, 5, 6]) {
        if (left === bottom || left === front) continue;
        for (const right of [2, 3, 4, 5, 6]) {
          if (right === bottom || right === front || right === left) continue;
          for (const back of [2, 3, 4, 5, 6]) {
            if (
              back === bottom ||
              back === front ||
              back === left ||
              back === right
            )
              continue;

            const cube = new Cube({
              id: ++id,
              top,
              front,
              left,
              right,
              back,
              bottom,
            });
            cubes.push(cube);
          }
        }
      }
    }
    return cubes;
  }
}

/**
 * 3d array
 * - first layer is bottom to top
 * - second layer is left to right
 * - third layer is front to back
 */
type Solution = (Cube | null)[][][];

const SIZE_X: number = 2;
const SIZE_Y: number = 2;
const SIZE_Z: number = 2;

class MacMahonSolver {
  static options = {
    excludeReferenceCubeInSolution: true,
  };

  solve(args: { referenceCube: Cube; allCubes: Cube[] }): Solution[] {
    if (args.allCubes.length < SIZE_X * SIZE_Y * SIZE_Z) {
      throw new Error("Not enough cubes");
    }
    const referenceCube = args.referenceCube.clone();
    const allCubes = args.allCubes.map((cube) => cube.clone());

    const emptySolution: Solution = new Array<null[][]>(SIZE_X).fill(
      new Array<null[]>(SIZE_Y).fill(new Array<null>(SIZE_Z).fill(null))
    );
    const solutions: Solution[] = [emptySolution];

    function cloneMultiDimensionalArray<T extends unknown[]>(array: T): T {
      return array.map((element) =>
        Array.isArray(element) ? cloneMultiDimensionalArray(element) : element
      ) as T;
    }

    function isCubeUsedInSolution(args: {
      cube: Cube;
      solution: Solution;
    }): boolean {
      if (
        MacMahonSolver.options.excludeReferenceCubeInSolution === true &&
        args.cube.id === referenceCube.id
      ) {
        return true;
      }
      return args.solution.some((xLayer) =>
        xLayer.some((yLayer) => yLayer.some((z) => args.cube.id === z?.id))
      );
    }

    let iterationCount = 0;
    for (let x = 0; x < SIZE_X; x++) {
      for (let y = 0; y < SIZE_Y; y++) {
        for (let z = 0; z < SIZE_Z; z++) {
          iterationCount++;
          // for each position and each temporary solution, we find all possible next solutions to extend this temporary solution
          const nextSolutions: Solution[] = [];
          for (const solution of solutions) {
            for (const cube of allCubes) {
              // skip cube if it is used already somewhere in this solution
              if (isCubeUsedInSolution({ cube, solution }) === true) continue;

              // try to rotate cube so that it matches with neighbors for inner sides / referenceCube for ouside sides
              const rotatedCubeClones = cube.rotateToMatchCondition(
                (c) =>
                  // bottom: match with referenceCube's bottom if lowest layer; else empty cube below or match with below's top
                  (x === 0
                    ? c.bottom === referenceCube.bottom
                    : solution[x - 1][y][z] === null ||
                      c.bottom === solution[x - 1][y][z]!.top) &&
                  // top: match with referenceCube's top if uppermost layer; else empty cube above or match with above's bottom
                  (x === SIZE_X - 1
                    ? c.top === referenceCube.top
                    : solution[x + 1][y][z] === null ||
                      c.top === solution[x + 1][y][z]!.bottom) &&
                  // left: match with referenceCube's left if leftmost layer; else empty cube to left or match with left's right
                  (y === 0
                    ? c.left === referenceCube.left
                    : solution[x][y - 1][z] === null ||
                      c.left === solution[x][y - 1][z]!.right) &&
                  // right: match with referencCube's right if rightmost layer; else empty cube to right or match with right's left
                  (y === SIZE_Y - 1
                    ? c.right === referenceCube.right
                    : solution[x][y + 1][z] === null ||
                      c.right === solution[x][y + 1][z]!.left) &&
                  // front: match with referenceCube's front if frontmost layer; else empty cube to front or match with behind's front
                  (z === 0
                    ? c.front === referenceCube.front
                    : solution[x][y][z - 1] === null ||
                      c.front === solution[x][y][z - 1]!.back) &&
                  // back: match with referenceCube's back if backmost layer; else empty cube behind or match with front's back
                  (z === SIZE_Z - 1
                    ? c.back === referenceCube.back
                    : solution[x][y][z + 1] === null ||
                      c.back === solution[x][y][z + 1]!.front)
              );
              for (const rotatedCubeClone of rotatedCubeClones) {
                const copyOfSolution = cloneMultiDimensionalArray(solution);
                copyOfSolution[x][y][z] = rotatedCubeClone;
                nextSolutions.push(copyOfSolution);
              }
            }
          }

          // inserting in splice directly may cause exceeding maximum call stack size (too many args)
          // solutions.splice(0, solutions.length, ...nextSolutions);
          solutions.splice(0, solutions.length);
          for (const nextSolution of nextSolutions) {
            solutions.push(nextSolution);
          }
          console.log(
            solutions.length,
            "(temp) solutions after iteration",
            iterationCount,
            `x=${x}, y=${y}, z=${z}`
          );
        }
      }
    }

    return solutions;
  }
}

function main() {
  const allCubes = Cube.generateAllCubes();
  const randomCube = allCubes[Math.floor(Math.random() * allCubes.length)];
  console.log(allCubes.length);
  console.log(randomCube.toString());

  console.log("===");
  const solutions = new MacMahonSolver().solve({
    referenceCube: randomCube,
    allCubes,
  });
  console.log(solutions.length);
}

function testRotationsWorkWithoutExactDuplicates() {
  const cube = new Cube({
    id: 0,
    top: 1,
    front: 2,
    right: 3,
    bottom: 6,
    back: 5,
    left: 4,
  });
  const cubeRotations = [{ i: 0, cube }];
  for (let i = 1; i < 24; i++) {
    const rotatedCube = cube.clone().rotateToPermutation(i);
    for (const { i: j, cube: otherCube } of cubeRotations) {
      if (rotatedCube.isExactlyTheSame(otherCube)) {
        // console.log("!!!! duplicate i/j:", i, j);
        // console.log(rotatedCube.toString());
        return false;
      }
    }
    cubeRotations.push({ i, cube: rotatedCube });
  }
  return true;
}

function testGenerationAllCubesWorkWithoutCongruentalDuplicates() {
  const allCubes = Cube.generateAllCubes();
  for (let i = 0; i < allCubes.length; i++) {
    for (let j = i + 1; j < allCubes.length; j++) {
      if (allCubes[j].isCongruentlyTheSame(allCubes[i])) {
        // console.log("!!!! duplicate i/j:", i, j);
        // console.log(allCubes[j].toString());
        return false;
      }
    }
  }
  return true;
}

console.log(
  "Rotation exact duplicate check:",
  testRotationsWorkWithoutExactDuplicates() === true ? "passed" : "failed"
);
console.log(
  "All cubes congruental duplicate check:",
  testGenerationAllCubesWorkWithoutCongruentalDuplicates() === true
    ? "passed"
    : "failed"
);
main();

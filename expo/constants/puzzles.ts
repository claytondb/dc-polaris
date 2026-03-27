export interface Puzzle {
  id: number;
  grid: number[][];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  solutionPath: [number, number][];
  isPremium?: boolean;
}

export function uniformGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function createPuzzleGrid(
  solvedGrid: number[][],
  solutionPath: [number, number][]
): number[][] {
  const grid = solvedGrid.map(row => [...row]);
  for (const [r, c] of solutionPath) {
    if (grid[r][c] === 0) grid[r][c] = 1;
    else if (grid[r][c] === 1) grid[r][c] = 0;
  }
  return grid;
}

function snake(width: number, startCol: number, numRows: number): [number, number][] {
  const path: [number, number][] = [];
  for (let r = 0; r < numRows; r++) {
    if (r % 2 === 0) {
      for (let c = startCol; c < startCol + width; c++) path.push([r, c]);
    } else {
      for (let c = startCol + width - 1; c >= startCol; c--) path.push([r, c]);
    }
  }
  return path;
}

function spiralPath(rows: number, cols: number, startRow: number, startCol: number): [number, number][] {
  const path: [number, number][] = [];
  let top = startRow, bottom = startRow + rows - 1, left = startCol, right = startCol + cols - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) path.push([top, c]);
    top++;
    for (let r = top; r <= bottom; r++) path.push([r, right]);
    right--;
    if (top <= bottom) { for (let c = right; c >= left; c--) path.push([bottom, c]); bottom--; }
    if (left <= right) { for (let r = bottom; r >= top; r--) path.push([r, left]); left++; }
  }
  return path;
}

function lPath(startRow: number, startCol: number, down: number, right: number): [number, number][] {
  const path: [number, number][] = [];
  for (let r = startRow; r <= startRow + down; r++) path.push([r, startCol]);
  for (let c = startCol + 1; c <= startCol + right; c++) path.push([startRow + down, c]);
  return path;
}

function reversedLPath(startRow: number, startCol: number, right: number, down: number): [number, number][] {
  const path: [number, number][] = [];
  for (let c = startCol; c <= startCol + right; c++) path.push([startRow, c]);
  for (let r = startRow + 1; r <= startRow + down; r++) path.push([r, startCol + right]);
  return path;
}

function uPath(startRow: number, startCol: number, down: number, across: number): [number, number][] {
  const path: [number, number][] = [];
  for (let r = startRow; r <= startRow + down; r++) path.push([r, startCol]);
  for (let c = startCol + 1; c <= startCol + across; c++) path.push([startRow + down, c]);
  for (let r = startRow + down - 1; r >= startRow; r--) path.push([r, startCol + across]);
  return path;
}

function zigzag2(col: number, numRows: number): [number, number][] {
  const path: [number, number][] = [];
  for (let r = 0; r < numRows; r++) {
    if (r % 2 === 0) {
      path.push([r, col]);
      path.push([r, col + 1]);
    } else {
      path.push([r, col + 1]);
      path.push([r, col]);
    }
  }
  return path;
}

function cShape(startRow: number, startCol: number, down: number, right: number): [number, number][] {
  const path: [number, number][] = [];
  for (let c = startCol + right; c >= startCol; c--) path.push([startRow, c]);
  for (let r = startRow + 1; r <= startRow + down; r++) path.push([r, startCol]);
  for (let c = startCol + 1; c <= startCol + right; c++) path.push([startRow + down, c]);
  return path;
}


function borderPath(rows: number, cols: number, startRow: number, startCol: number): [number, number][] {
  const path: [number, number][] = [];
  for (let c = startCol; c < startCol + cols; c++) path.push([startRow, c]);
  for (let r = startRow + 1; r < startRow + rows; r++) path.push([r, startCol + cols - 1]);
  for (let c = startCol + cols - 2; c >= startCol; c--) path.push([startRow + rows - 1, c]);
  for (let r = startRow + rows - 2; r > startRow; r--) path.push([r, startCol]);
  return path;
}

const PUZZLES: Puzzle[] = [
  // === EASY (1-25) — uniform grids, 4x5 to 6x7, paths cover ~40-65% of cells ===
  { id: 1, difficulty: 'easy', solutionPath: snake(4,0,3), grid: createPuzzleGrid(uniformGrid(4,5), snake(4,0,3)) },
  { id: 2, difficulty: 'easy', solutionPath: uPath(0,0,3,3), grid: createPuzzleGrid(uniformGrid(4,5), uPath(0,0,3,3)) },
  { id: 3, difficulty: 'easy', solutionPath: lPath(0,0,3,4), grid: createPuzzleGrid(uniformGrid(4,5), lPath(0,0,3,4)) },
  { id: 4, difficulty: 'easy', solutionPath: cShape(0,0,3,4), grid: createPuzzleGrid(uniformGrid(4,5), cShape(0,0,3,4)) },
  { id: 5, difficulty: 'easy', solutionPath: spiralPath(3,4,0,0), grid: createPuzzleGrid(uniformGrid(4,5), spiralPath(3,4,0,0)) },
  { id: 6, difficulty: 'easy', solutionPath: snake(3,1,4), grid: createPuzzleGrid(uniformGrid(4,5), snake(3,1,4)) },
  { id: 7, difficulty: 'easy', solutionPath: reversedLPath(0,0,4,3), grid: createPuzzleGrid(uniformGrid(4,5), reversedLPath(0,0,4,3)) },
  { id: 8, difficulty: 'easy', solutionPath: zigzag2(1,4), grid: createPuzzleGrid(uniformGrid(4,5), zigzag2(1,4)) },
  { id: 9, difficulty: 'easy', solutionPath: snake(4,1,4), grid: createPuzzleGrid(uniformGrid(5,6), snake(4,1,4)) },
  { id: 10, difficulty: 'easy', solutionPath: spiralPath(4,5,0,0), grid: createPuzzleGrid(uniformGrid(5,6), spiralPath(4,5,0,0)) },
  { id: 11, difficulty: 'easy', solutionPath: uPath(0,0,4,4), grid: createPuzzleGrid(uniformGrid(5,6), uPath(0,0,4,4)) },
  { id: 12, difficulty: 'easy', solutionPath: cShape(0,0,4,5), grid: createPuzzleGrid(uniformGrid(5,6), cShape(0,0,4,5)) },
  { id: 13, difficulty: 'easy', solutionPath: snake(5,0,4), grid: createPuzzleGrid(uniformGrid(5,6), snake(5,0,4)) },
  { id: 14, difficulty: 'easy', solutionPath: lPath(0,0,4,5), grid: createPuzzleGrid(uniformGrid(5,6), lPath(0,0,4,5)) },
  { id: 15, difficulty: 'easy', solutionPath: zigzag2(2,5), grid: createPuzzleGrid(uniformGrid(5,6), zigzag2(2,5)) },
  { id: 16, difficulty: 'easy', solutionPath: spiralPath(4,6,0,0), grid: createPuzzleGrid(uniformGrid(5,7), spiralPath(4,6,0,0)) },
  { id: 17, difficulty: 'easy', solutionPath: snake(5,1,5), grid: createPuzzleGrid(uniformGrid(5,7), snake(5,1,5)) },
  { id: 18, difficulty: 'easy', solutionPath: uPath(0,1,4,4), grid: createPuzzleGrid(uniformGrid(5,7), uPath(0,1,4,4)) },
  { id: 19, difficulty: 'easy', solutionPath: cShape(0,1,4,5), grid: createPuzzleGrid(uniformGrid(5,7), cShape(0,1,4,5)) },
  { id: 20, difficulty: 'easy', solutionPath: snake(6,0,4), grid: createPuzzleGrid(uniformGrid(5,7), snake(6,0,4)) },
  { id: 21, difficulty: 'easy', solutionPath: uPath(1,1,3,4), grid: createPuzzleGrid(uniformGrid(5,7), uPath(1,1,3,4)) },
  { id: 22, difficulty: 'easy', solutionPath: snake(5,1,4), grid: createPuzzleGrid(uniformGrid(5,7), snake(5,1,4)) },
  { id: 23, difficulty: 'easy', solutionPath: reversedLPath(0,0,6,4), grid: createPuzzleGrid(uniformGrid(5,7), reversedLPath(0,0,6,4)) },
  { id: 24, difficulty: 'easy', solutionPath: snake(4,2,5), grid: createPuzzleGrid(uniformGrid(5,7), snake(4,2,5)) },
  { id: 25, difficulty: 'easy', solutionPath: borderPath(4,6,0,0), grid: createPuzzleGrid(uniformGrid(5,7), borderPath(4,6,0,0)) },

  // === MEDIUM (26-55) — uniform grids, 6x7 to 8x9, paths cover ~50-75% of cells ===
  { id: 26, difficulty: 'medium', solutionPath: snake(5,1,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(5,1,6)) },
  { id: 27, difficulty: 'medium', solutionPath: spiralPath(5,6,0,0), grid: createPuzzleGrid(uniformGrid(6,7), spiralPath(5,6,0,0)) },
  { id: 28, difficulty: 'medium', solutionPath: spiralPath(5,5,0,1), grid: createPuzzleGrid(uniformGrid(6,7), spiralPath(5,5,0,1)) },
  { id: 29, difficulty: 'medium', solutionPath: uPath(0,0,5,5), grid: createPuzzleGrid(uniformGrid(6,7), uPath(0,0,5,5)) },
  { id: 30, difficulty: 'medium', solutionPath: snake(6,0,5), grid: createPuzzleGrid(uniformGrid(6,7), snake(6,0,5)) },
  { id: 31, difficulty: 'medium', solutionPath: cShape(0,0,5,6), grid: createPuzzleGrid(uniformGrid(6,7), cShape(0,0,5,6)) },
  { id: 32, difficulty: 'medium', solutionPath: snake(6,1,6), grid: createPuzzleGrid(uniformGrid(6,8), snake(6,1,6)) },
  { id: 33, difficulty: 'medium', solutionPath: spiralPath(5,7,0,0), grid: createPuzzleGrid(uniformGrid(6,8), spiralPath(5,7,0,0)) },
  { id: 34, difficulty: 'medium', solutionPath: snake(7,0,5), grid: createPuzzleGrid(uniformGrid(6,8), snake(7,0,5)) },
  { id: 35, difficulty: 'medium', solutionPath: snake(5,2,6), grid: createPuzzleGrid(uniformGrid(6,8), snake(5,2,6)) },
  { id: 36, difficulty: 'medium', solutionPath: uPath(0,0,6,7), grid: createPuzzleGrid(uniformGrid(7,8), uPath(0,0,6,7)) },
  { id: 37, difficulty: 'medium', solutionPath: snake(6,1,7), grid: createPuzzleGrid(uniformGrid(7,8), snake(6,1,7)) },
  { id: 38, difficulty: 'medium', solutionPath: spiralPath(6,7,0,0), grid: createPuzzleGrid(uniformGrid(7,8), spiralPath(6,7,0,0)) },
  { id: 39, difficulty: 'medium', solutionPath: uPath(0,0,6,7), grid: createPuzzleGrid(uniformGrid(7,8), uPath(0,0,6,7)) },
  { id: 40, difficulty: 'medium', solutionPath: snake(7,0,6), grid: createPuzzleGrid(uniformGrid(7,8), snake(7,0,6)) },
  { id: 41, difficulty: 'medium', solutionPath: spiralPath(6,7,0,0), grid: createPuzzleGrid(uniformGrid(7,8), spiralPath(6,7,0,0)) },
  { id: 42, difficulty: 'medium', solutionPath: snake(7,1,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(7,1,7)) },
  { id: 43, difficulty: 'medium', solutionPath: spiralPath(6,8,0,0), grid: createPuzzleGrid(uniformGrid(7,9), spiralPath(6,8,0,0)) },
  { id: 44, difficulty: 'medium', solutionPath: cShape(0,1,6,6), grid: createPuzzleGrid(uniformGrid(7,9), cShape(0,1,6,6)) },
  { id: 45, difficulty: 'medium', solutionPath: snake(6,2,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(6,2,7)) },
  { id: 46, difficulty: 'medium', solutionPath: lPath(0,0,6,8), grid: createPuzzleGrid(uniformGrid(7,9), lPath(0,0,6,8)) },
  { id: 47, difficulty: 'medium', solutionPath: snake(7,1,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(7,1,8)) },
  { id: 48, difficulty: 'medium', solutionPath: spiralPath(7,8,0,0), grid: createPuzzleGrid(uniformGrid(8,9), spiralPath(7,8,0,0)) },
  { id: 49, difficulty: 'medium', solutionPath: snake(8,0,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(8,0,8)) },
  { id: 50, difficulty: 'medium', solutionPath: snake(8,0,7), grid: createPuzzleGrid(uniformGrid(8,9), snake(8,0,7)) },
  { id: 51, difficulty: 'medium', solutionPath: borderPath(7,8,0,0), grid: createPuzzleGrid(uniformGrid(8,9), borderPath(7,8,0,0)) },
  { id: 52, difficulty: 'medium', solutionPath: snake(6,2,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(6,2,8)) },
  { id: 53, difficulty: 'medium', solutionPath: uPath(0,0,7,8), grid: createPuzzleGrid(uniformGrid(8,9), uPath(0,0,7,8)) },
  { id: 54, difficulty: 'medium', solutionPath: snake(7,1,7), grid: createPuzzleGrid(uniformGrid(8,9), snake(7,1,7)) },
  { id: 55, difficulty: 'medium', solutionPath: cShape(0,0,7,8), grid: createPuzzleGrid(uniformGrid(8,9), cShape(0,0,7,8)) },

  // === HARD (56-80) — uniform grids, 8x9 to 10x10, paths cover ~60-85% ===
  { id: 56, difficulty: 'hard', solutionPath: snake(8,0,8), grid: createPuzzleGrid(uniformGrid(8,10), snake(8,0,8)) },
  { id: 57, difficulty: 'hard', solutionPath: spiralPath(7,9,0,0), grid: createPuzzleGrid(uniformGrid(8,10), spiralPath(7,9,0,0)) },
  { id: 58, difficulty: 'hard', solutionPath: spiralPath(7,8,0,1), grid: createPuzzleGrid(uniformGrid(8,10), spiralPath(7,8,0,1)) },
  { id: 59, difficulty: 'hard', solutionPath: snake(7,2,8), grid: createPuzzleGrid(uniformGrid(8,10), snake(7,2,8)) },
  { id: 60, difficulty: 'hard', solutionPath: uPath(0,0,7,9), grid: createPuzzleGrid(uniformGrid(8,10), uPath(0,0,7,9)) },
  { id: 61, difficulty: 'hard', solutionPath: snake(9,0,7), grid: createPuzzleGrid(uniformGrid(8,10), snake(9,0,7)) },
  { id: 62, difficulty: 'hard', solutionPath: snake(8,1,9), grid: createPuzzleGrid(uniformGrid(9,10), snake(8,1,9)) },
  { id: 63, difficulty: 'hard', solutionPath: spiralPath(8,9,0,0), grid: createPuzzleGrid(uniformGrid(9,10), spiralPath(8,9,0,0)) },
  { id: 64, difficulty: 'hard', solutionPath: snake(9,0,9), grid: createPuzzleGrid(uniformGrid(9,10), snake(9,0,9)) },
  { id: 65, difficulty: 'hard', solutionPath: snake(7,2,9), grid: createPuzzleGrid(uniformGrid(9,10), snake(7,2,9)) },
  { id: 66, difficulty: 'hard', solutionPath: snake(9,0,8), grid: createPuzzleGrid(uniformGrid(9,10), snake(9,0,8)) },
  { id: 67, difficulty: 'hard', solutionPath: borderPath(8,9,0,0), grid: createPuzzleGrid(uniformGrid(9,10), borderPath(8,9,0,0)) },
  { id: 68, difficulty: 'hard', solutionPath: cShape(0,0,8,9), grid: createPuzzleGrid(uniformGrid(9,10), cShape(0,0,8,9)) },
  { id: 69, difficulty: 'hard', solutionPath: snake(8,1,9), grid: createPuzzleGrid(uniformGrid(9,10), snake(8,1,9)) },
  { id: 70, difficulty: 'hard', solutionPath: uPath(0,0,8,9), grid: createPuzzleGrid(uniformGrid(9,10), uPath(0,0,8,9)) },
  { id: 71, difficulty: 'hard', solutionPath: snake(8,1,10), grid: createPuzzleGrid(uniformGrid(10,10), snake(8,1,10)) },
  { id: 72, difficulty: 'hard', solutionPath: spiralPath(9,9,0,0), grid: createPuzzleGrid(uniformGrid(10,10), spiralPath(9,9,0,0)) },
  { id: 73, difficulty: 'hard', solutionPath: lPath(0,0,9,9), grid: createPuzzleGrid(uniformGrid(10,10), lPath(0,0,9,9)) },
  { id: 74, difficulty: 'hard', solutionPath: snake(9,0,9), grid: createPuzzleGrid(uniformGrid(10,10), snake(9,0,9)) },
  { id: 75, difficulty: 'hard', solutionPath: snake(7,2,10), grid: createPuzzleGrid(uniformGrid(10,10), snake(7,2,10)) },
  { id: 76, difficulty: 'hard', solutionPath: cShape(0,0,9,9), grid: createPuzzleGrid(uniformGrid(10,10), cShape(0,0,9,9)) },
  { id: 77, difficulty: 'hard', solutionPath: snake(9,1,9), grid: createPuzzleGrid(uniformGrid(10,10), snake(9,1,9)) },
  { id: 78, difficulty: 'hard', solutionPath: borderPath(9,9,0,0), grid: createPuzzleGrid(uniformGrid(10,10), borderPath(9,9,0,0)) },
  { id: 79, difficulty: 'hard', solutionPath: uPath(0,0,9,9), grid: createPuzzleGrid(uniformGrid(10,10), uPath(0,0,9,9)) },
  { id: 80, difficulty: 'hard', solutionPath: snake(10,0,8), grid: createPuzzleGrid(uniformGrid(10,10), snake(10,0,8)) },

  // === EXPERT (81-100) — uniform grids + locked cells, 10x10 to 10x12 ===
  {
    id: 81, difficulty: 'expert',
    solutionPath: spiralPath(8,8,1,1),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,10), spiralPath(8,8,1,1));
      pg[0][0] = 2; pg[0][9] = 2; pg[9][0] = 2; pg[9][9] = 2;
      return pg;
    })(),
  },
  {
    id: 82, difficulty: 'expert',
    solutionPath: snake(8,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,10), snake(8,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; }
      return pg;
    })(),
  },
  {
    id: 83, difficulty: 'expert',
    solutionPath: spiralPath(9,9,0,0),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,10), spiralPath(9,9,0,0));
      for (let r = 0; r < 10; r++) { pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 84, difficulty: 'expert',
    solutionPath: snake(7,2,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,10), snake(7,2,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 85, difficulty: 'expert',
    solutionPath: snake(6,2,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,10), snake(6,2,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 86, difficulty: 'expert',
    solutionPath: snake(9,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,11), snake(9,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][10] = 2; }
      return pg;
    })(),
  },
  {
    id: 87, difficulty: 'expert',
    solutionPath: snake(8,2,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,11), snake(8,2,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][10] = 2; }
      return pg;
    })(),
  },
  {
    id: 88, difficulty: 'expert',
    solutionPath: spiralPath(9,10,0,0),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,11), spiralPath(9,10,0,0));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][10] = 2; }
      return pg;
    })(),
  },
  {
    id: 89, difficulty: 'expert',
    solutionPath: spiralPath(8,8,1,2),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), spiralPath(8,8,1,2));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 90, difficulty: 'expert',
    solutionPath: snake(10,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(10,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 91, difficulty: 'expert',
    solutionPath: snake(8,2,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(8,2,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 92, difficulty: 'expert',
    solutionPath: spiralPath(8,10,1,1),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), spiralPath(8,10,1,1));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 93, difficulty: 'expert',
    solutionPath: snake(9,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(9,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][10] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 94, difficulty: 'expert',
    solutionPath: cShape(1,1,8,9),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), cShape(1,1,8,9));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 95, difficulty: 'expert',
    solutionPath: snake(10,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(10,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 96, difficulty: 'expert',
    solutionPath: snake(9,2,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(9,2,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 97, difficulty: 'expert',
    solutionPath: snake(10,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(10,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 98, difficulty: 'expert',
    solutionPath: spiralPath(9,10,0,1),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), spiralPath(9,10,0,1));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 99, difficulty: 'expert',
    solutionPath: snake(10,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(10,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][10] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 100, difficulty: 'expert',
    solutionPath: spiralPath(8,6,1,3),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), spiralPath(8,6,1,3));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][10] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
];

const PREMIUM_PUZZLES: Puzzle[] = [
  // === BONUS EASY (101-125) ===
  { id: 101, isPremium: true, difficulty: 'easy', solutionPath: spiralPath(3,4,0,1), grid: createPuzzleGrid(uniformGrid(4,6), spiralPath(3,4,0,1)) },
  { id: 102, isPremium: true, difficulty: 'easy', solutionPath: cShape(1,0,2,5), grid: createPuzzleGrid(uniformGrid(4,6), cShape(1,0,2,5)) },
  { id: 103, isPremium: true, difficulty: 'easy', solutionPath: uPath(0,0,3,4), grid: createPuzzleGrid(uniformGrid(4,6), uPath(0,0,3,4)) },
  { id: 104, isPremium: true, difficulty: 'easy', solutionPath: lPath(0,0,3,5), grid: createPuzzleGrid(uniformGrid(4,6), lPath(0,0,3,5)) },
  { id: 105, isPremium: true, difficulty: 'easy', solutionPath: snake(4,1,4), grid: createPuzzleGrid(uniformGrid(4,6), snake(4,1,4)) },
  { id: 106, isPremium: true, difficulty: 'easy', solutionPath: spiralPath(4,4,0,1), grid: createPuzzleGrid(uniformGrid(5,6), spiralPath(4,4,0,1)) },
  { id: 107, isPremium: true, difficulty: 'easy', solutionPath: snake(4,1,5), grid: createPuzzleGrid(uniformGrid(5,6), snake(4,1,5)) },
  { id: 108, isPremium: true, difficulty: 'easy', solutionPath: uPath(0,1,4,3), grid: createPuzzleGrid(uniformGrid(5,6), uPath(0,1,4,3)) },
  { id: 109, isPremium: true, difficulty: 'easy', solutionPath: cShape(0,0,4,5), grid: createPuzzleGrid(uniformGrid(5,6), cShape(0,0,4,5)) },
  { id: 110, isPremium: true, difficulty: 'easy', solutionPath: reversedLPath(0,1,4,4), grid: createPuzzleGrid(uniformGrid(5,6), reversedLPath(0,1,4,4)) },
  { id: 111, isPremium: true, difficulty: 'easy', solutionPath: spiralPath(4,5,0,1), grid: createPuzzleGrid(uniformGrid(5,7), spiralPath(4,5,0,1)) },
  { id: 112, isPremium: true, difficulty: 'easy', solutionPath: snake(5,1,5), grid: createPuzzleGrid(uniformGrid(5,7), snake(5,1,5)) },
  { id: 113, isPremium: true, difficulty: 'easy', solutionPath: uPath(0,0,4,5), grid: createPuzzleGrid(uniformGrid(5,7), uPath(0,0,4,5)) },
  { id: 114, isPremium: true, difficulty: 'easy', solutionPath: zigzag2(3,5), grid: createPuzzleGrid(uniformGrid(5,7), zigzag2(3,5)) },
  { id: 115, isPremium: true, difficulty: 'easy', solutionPath: lPath(0,1,4,5), grid: createPuzzleGrid(uniformGrid(5,7), lPath(0,1,4,5)) },
  { id: 116, isPremium: true, difficulty: 'easy', solutionPath: cShape(0,1,4,5), grid: createPuzzleGrid(uniformGrid(5,7), cShape(0,1,4,5)) },
  { id: 117, isPremium: true, difficulty: 'easy', solutionPath: snake(6,0,4), grid: createPuzzleGrid(uniformGrid(5,7), snake(6,0,4)) },
  { id: 118, isPremium: true, difficulty: 'easy', solutionPath: uPath(1,0,3,5), grid: createPuzzleGrid(uniformGrid(5,7), uPath(1,0,3,5)) },
  { id: 119, isPremium: true, difficulty: 'easy', solutionPath: borderPath(4,5,0,1), grid: createPuzzleGrid(uniformGrid(5,7), borderPath(4,5,0,1)) },
  { id: 120, isPremium: true, difficulty: 'easy', solutionPath: snake(4,2,5), grid: createPuzzleGrid(uniformGrid(5,7), snake(4,2,5)) },
  { id: 121, isPremium: true, difficulty: 'easy', solutionPath: lPath(0,2,4,4), grid: createPuzzleGrid(uniformGrid(5,7), lPath(0,2,4,4)) },
  { id: 122, isPremium: true, difficulty: 'easy', solutionPath: reversedLPath(0,1,5,4), grid: createPuzzleGrid(uniformGrid(5,7), reversedLPath(0,1,5,4)) },
  { id: 123, isPremium: true, difficulty: 'easy', solutionPath: snake(5,2,4), grid: createPuzzleGrid(uniformGrid(5,7), snake(5,2,4)) },
  { id: 124, isPremium: true, difficulty: 'easy', solutionPath: uPath(0,2,4,4), grid: createPuzzleGrid(uniformGrid(5,7), uPath(0,2,4,4)) },
  { id: 125, isPremium: true, difficulty: 'easy', solutionPath: spiralPath(4,4,1,2), grid: createPuzzleGrid(uniformGrid(5,7), spiralPath(4,4,1,2)) },

  // === BONUS MEDIUM (126-155) ===
  { id: 126, isPremium: true, difficulty: 'medium', solutionPath: snake(5,1,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(5,1,6)) },
  { id: 127, isPremium: true, difficulty: 'medium', solutionPath: spiralPath(5,6,0,0), grid: createPuzzleGrid(uniformGrid(6,7), spiralPath(5,6,0,0)) },
  { id: 128, isPremium: true, difficulty: 'medium', solutionPath: uPath(0,0,5,6), grid: createPuzzleGrid(uniformGrid(6,7), uPath(0,0,5,6)) },
  { id: 129, isPremium: true, difficulty: 'medium', solutionPath: snake(6,1,5), grid: createPuzzleGrid(uniformGrid(6,8), snake(6,1,5)) },
  { id: 130, isPremium: true, difficulty: 'medium', solutionPath: snake(5,2,6), grid: createPuzzleGrid(uniformGrid(6,8), snake(5,2,6)) },
  { id: 131, isPremium: true, difficulty: 'medium', solutionPath: spiralPath(5,7,0,0), grid: createPuzzleGrid(uniformGrid(6,8), spiralPath(5,7,0,0)) },
  { id: 132, isPremium: true, difficulty: 'medium', solutionPath: uPath(0,1,5,5), grid: createPuzzleGrid(uniformGrid(6,8), uPath(0,1,5,5)) },
  { id: 133, isPremium: true, difficulty: 'medium', solutionPath: uPath(0,1,6,6), grid: createPuzzleGrid(uniformGrid(7,9), uPath(0,1,6,6)) },
  { id: 134, isPremium: true, difficulty: 'medium', solutionPath: snake(6,1,7), grid: createPuzzleGrid(uniformGrid(7,8), snake(6,1,7)) },
  { id: 135, isPremium: true, difficulty: 'medium', solutionPath: borderPath(6,7,0,0), grid: createPuzzleGrid(uniformGrid(7,8), borderPath(6,7,0,0)) },
  { id: 136, isPremium: true, difficulty: 'medium', solutionPath: snake(5,2,7), grid: createPuzzleGrid(uniformGrid(7,8), snake(5,2,7)) },
  { id: 137, isPremium: true, difficulty: 'medium', solutionPath: cShape(0,0,6,7), grid: createPuzzleGrid(uniformGrid(7,8), cShape(0,0,6,7)) },
  { id: 138, isPremium: true, difficulty: 'medium', solutionPath: snake(7,1,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(7,1,7)) },
  { id: 139, isPremium: true, difficulty: 'medium', solutionPath: spiralPath(6,8,0,0), grid: createPuzzleGrid(uniformGrid(7,9), spiralPath(6,8,0,0)) },
  { id: 140, isPremium: true, difficulty: 'medium', solutionPath: lPath(0,0,6,8), grid: createPuzzleGrid(uniformGrid(7,9), lPath(0,0,6,8)) },
  { id: 141, isPremium: true, difficulty: 'medium', solutionPath: snake(6,2,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(6,2,7)) },
  { id: 142, isPremium: true, difficulty: 'medium', solutionPath: cShape(0,1,6,6), grid: createPuzzleGrid(uniformGrid(7,9), cShape(0,1,6,6)) },
  { id: 143, isPremium: true, difficulty: 'medium', solutionPath: reversedLPath(0,0,8,6), grid: createPuzzleGrid(uniformGrid(7,9), reversedLPath(0,0,8,6)) },
  { id: 144, isPremium: true, difficulty: 'medium', solutionPath: snake(7,1,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(7,1,8)) },
  { id: 145, isPremium: true, difficulty: 'medium', solutionPath: spiralPath(7,8,0,0), grid: createPuzzleGrid(uniformGrid(8,9), spiralPath(7,8,0,0)) },
  { id: 146, isPremium: true, difficulty: 'medium', solutionPath: snake(6,2,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(6,2,8)) },
  { id: 147, isPremium: true, difficulty: 'medium', solutionPath: cShape(0,0,7,8), grid: createPuzzleGrid(uniformGrid(8,9), cShape(0,0,7,8)) },
  { id: 148, isPremium: true, difficulty: 'medium', solutionPath: uPath(0,0,7,7), grid: createPuzzleGrid(uniformGrid(8,9), uPath(0,0,7,7)) },
  { id: 149, isPremium: true, difficulty: 'medium', solutionPath: snake(8,0,7), grid: createPuzzleGrid(uniformGrid(8,9), snake(8,0,7)) },
  { id: 150, isPremium: true, difficulty: 'medium', solutionPath: borderPath(7,8,0,0), grid: createPuzzleGrid(uniformGrid(8,9), borderPath(7,8,0,0)) },
  { id: 151, isPremium: true, difficulty: 'medium', solutionPath: snake(7,2,8), grid: createPuzzleGrid(uniformGrid(8,10), snake(7,2,8)) },
  { id: 152, isPremium: true, difficulty: 'medium', solutionPath: uPath(0,1,7,7), grid: createPuzzleGrid(uniformGrid(8,10), uPath(0,1,7,7)) },
  { id: 153, isPremium: true, difficulty: 'medium', solutionPath: snake(8,1,7), grid: createPuzzleGrid(uniformGrid(8,10), snake(8,1,7)) },
  { id: 154, isPremium: true, difficulty: 'medium', solutionPath: cShape(0,1,7,8), grid: createPuzzleGrid(uniformGrid(8,10), cShape(0,1,7,8)) },
  { id: 155, isPremium: true, difficulty: 'medium', solutionPath: snake(6,2,8), grid: createPuzzleGrid(uniformGrid(8,10), snake(6,2,8)) },

  // === BONUS HARD (156-180) ===
  { id: 156, isPremium: true, difficulty: 'hard', solutionPath: snake(8,1,8), grid: createPuzzleGrid(uniformGrid(8,10), snake(8,1,8)) },
  { id: 157, isPremium: true, difficulty: 'hard', solutionPath: spiralPath(7,9,0,0), grid: createPuzzleGrid(uniformGrid(8,10), spiralPath(7,9,0,0)) },
  { id: 158, isPremium: true, difficulty: 'hard', solutionPath: uPath(0,0,7,9), grid: createPuzzleGrid(uniformGrid(8,10), uPath(0,0,7,9)) },
  { id: 159, isPremium: true, difficulty: 'hard', solutionPath: cShape(0,0,7,9), grid: createPuzzleGrid(uniformGrid(8,10), cShape(0,0,7,9)) },
  { id: 160, isPremium: true, difficulty: 'hard', solutionPath: snake(9,0,8), grid: createPuzzleGrid(uniformGrid(9,10), snake(9,0,8)) },
  { id: 161, isPremium: true, difficulty: 'hard', solutionPath: snake(7,2,9), grid: createPuzzleGrid(uniformGrid(9,10), snake(7,2,9)) },
  { id: 162, isPremium: true, difficulty: 'hard', solutionPath: spiralPath(8,9,0,0), grid: createPuzzleGrid(uniformGrid(9,10), spiralPath(8,9,0,0)) },
  { id: 163, isPremium: true, difficulty: 'hard', solutionPath: uPath(0,0,8,9), grid: createPuzzleGrid(uniformGrid(9,10), uPath(0,0,8,9)) },
  { id: 164, isPremium: true, difficulty: 'hard', solutionPath: snake(8,1,9), grid: createPuzzleGrid(uniformGrid(9,10), snake(8,1,9)) },
  { id: 165, isPremium: true, difficulty: 'hard', solutionPath: borderPath(8,9,0,0), grid: createPuzzleGrid(uniformGrid(9,10), borderPath(8,9,0,0)) },
  { id: 166, isPremium: true, difficulty: 'hard', solutionPath: snake(8,1,10), grid: createPuzzleGrid(uniformGrid(10,10), snake(8,1,10)) },
  { id: 167, isPremium: true, difficulty: 'hard', solutionPath: spiralPath(9,9,0,0), grid: createPuzzleGrid(uniformGrid(10,10), spiralPath(9,9,0,0)) },
  { id: 168, isPremium: true, difficulty: 'hard', solutionPath: cShape(0,0,9,9), grid: createPuzzleGrid(uniformGrid(10,10), cShape(0,0,9,9)) },
  { id: 169, isPremium: true, difficulty: 'hard', solutionPath: snake(9,0,9), grid: createPuzzleGrid(uniformGrid(10,10), snake(9,0,9)) },
  { id: 170, isPremium: true, difficulty: 'hard', solutionPath: uPath(0,0,9,9), grid: createPuzzleGrid(uniformGrid(10,10), uPath(0,0,9,9)) },
  { id: 171, isPremium: true, difficulty: 'hard', solutionPath: snake(7,2,10), grid: createPuzzleGrid(uniformGrid(10,10), snake(7,2,10)) },
  { id: 172, isPremium: true, difficulty: 'hard', solutionPath: lPath(0,0,9,9), grid: createPuzzleGrid(uniformGrid(10,10), lPath(0,0,9,9)) },
  { id: 173, isPremium: true, difficulty: 'hard', solutionPath: reversedLPath(0,0,9,9), grid: createPuzzleGrid(uniformGrid(10,10), reversedLPath(0,0,9,9)) },
  { id: 174, isPremium: true, difficulty: 'hard', solutionPath: snake(9,1,9), grid: createPuzzleGrid(uniformGrid(10,10), snake(9,1,9)) },
  { id: 175, isPremium: true, difficulty: 'hard', solutionPath: borderPath(9,9,0,0), grid: createPuzzleGrid(uniformGrid(10,10), borderPath(9,9,0,0)) },
  { id: 176, isPremium: true, difficulty: 'hard', solutionPath: snake(10,0,8), grid: createPuzzleGrid(uniformGrid(10,10), snake(10,0,8)) },
  { id: 177, isPremium: true, difficulty: 'hard', solutionPath: snake(8,2,9), grid: createPuzzleGrid(uniformGrid(10,10), snake(8,2,9)) },
  { id: 178, isPremium: true, difficulty: 'hard', solutionPath: spiralPath(10,8,0,1), grid: createPuzzleGrid(uniformGrid(10,10), spiralPath(10,8,0,1)) },
  { id: 179, isPremium: true, difficulty: 'hard', solutionPath: snake(9,1,10), grid: createPuzzleGrid(uniformGrid(10,10), snake(9,1,10)) },
  { id: 180, isPremium: true, difficulty: 'hard', solutionPath: snake(10,0,9), grid: createPuzzleGrid(uniformGrid(10,10), snake(10,0,9)) },

  // === BONUS EXPERT (181-200) — uniform grids + locked cells ===
  {
    id: 181, isPremium: true, difficulty: 'expert',
    solutionPath: spiralPath(8,8,1,1),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,10), spiralPath(8,8,1,1));
      pg[0][0] = 2; pg[0][9] = 2; pg[9][0] = 2; pg[9][9] = 2;
      return pg;
    })(),
  },
  {
    id: 182, isPremium: true, difficulty: 'expert',
    solutionPath: snake(8,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,10), snake(8,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 183, isPremium: true, difficulty: 'expert',
    solutionPath: snake(9,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,11), snake(9,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][10] = 2; }
      return pg;
    })(),
  },
  {
    id: 184, isPremium: true, difficulty: 'expert',
    solutionPath: spiralPath(9,10,0,0),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,11), spiralPath(9,10,0,0));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][10] = 2; }
      return pg;
    })(),
  },
  {
    id: 185, isPremium: true, difficulty: 'expert',
    solutionPath: snake(8,2,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,11), snake(8,2,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][10] = 2; }
      return pg;
    })(),
  },
  {
    id: 186, isPremium: true, difficulty: 'expert',
    solutionPath: spiralPath(8,8,1,2),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), spiralPath(8,8,1,2));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 187, isPremium: true, difficulty: 'expert',
    solutionPath: snake(10,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(10,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 188, isPremium: true, difficulty: 'expert',
    solutionPath: snake(8,2,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(8,2,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 189, isPremium: true, difficulty: 'expert',
    solutionPath: spiralPath(8,10,1,1),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), spiralPath(8,10,1,1));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 190, isPremium: true, difficulty: 'expert',
    solutionPath: snake(9,2,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(9,2,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 191, isPremium: true, difficulty: 'expert',
    solutionPath: snake(10,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(10,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 192, isPremium: true, difficulty: 'expert',
    solutionPath: uPath(1,2,7,7),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), uPath(1,2,7,7));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 193, isPremium: true, difficulty: 'expert',
    solutionPath: snake(10,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(10,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 194, isPremium: true, difficulty: 'expert',
    solutionPath: spiralPath(9,10,0,1),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), spiralPath(9,10,0,1));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 195, isPremium: true, difficulty: 'expert',
    solutionPath: snake(10,1,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(10,1,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][10] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 196, isPremium: true, difficulty: 'expert',
    solutionPath: snake(9,2,10),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(10,12), snake(9,2,10));
      for (let r = 0; r < 10; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 197, isPremium: true, difficulty: 'expert',
    solutionPath: snake(10,1,11),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(11,12), snake(10,1,11));
      for (let r = 0; r < 11; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 198, isPremium: true, difficulty: 'expert',
    solutionPath: spiralPath(10,10,0,1),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(11,12), spiralPath(10,10,0,1));
      for (let r = 0; r < 11; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 199, isPremium: true, difficulty: 'expert',
    solutionPath: cShape(1,1,9,9),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(11,12), cShape(1,1,9,9));
      for (let r = 0; r < 11; r++) { pg[r][0] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
  {
    id: 200, isPremium: true, difficulty: 'expert',
    solutionPath: snake(10,1,11),
    grid: (() => {
      const pg = createPuzzleGrid(uniformGrid(11,12), snake(10,1,11));
      for (let r = 0; r < 11; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][11] = 2; }
      return pg;
    })(),
  },
];

const ALL_PUZZLES = [...PUZZLES, ...PREMIUM_PUZZLES];

export const FREE_PUZZLE_COUNT = PUZZLES.length;
export const PREMIUM_PUZZLE_COUNT = PREMIUM_PUZZLES.length;

export default ALL_PUZZLES;

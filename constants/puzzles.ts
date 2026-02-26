export interface Puzzle {
  id: number;
  grid: number[][];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  solutionPath: [number, number][];
  isPremium?: boolean;
  source?: 'custom' | 'generated';
}

function uniformGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function altGrid(rows: number, cols: number, startVal: number = 0): number[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array(cols).fill((r + startVal) % 2)
  );
}

function createPuzzleGrid(
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

function vLine(col: number, numRows: number): [number, number][] {
  return Array.from({ length: numRows }, (_, r) => [r, col] as [number, number]);
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

const PUZZLES: Puzzle[] = [
  // === EASY (1-25) ===
  { id: 1, difficulty: 'easy', solutionPath: [[0,0],[0,1],[1,1],[2,1],[2,2]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,0],[0,1],[1,1],[2,1],[2,2]]) },
  { id: 2, difficulty: 'easy', solutionPath: [[0,2],[1,2],[1,1],[1,0],[2,0]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,2],[1,2],[1,1],[1,0],[2,0]]) },
  { id: 3, difficulty: 'easy', solutionPath: [[0,0],[0,1],[0,2],[1,2],[2,2]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,0],[0,1],[0,2],[1,2],[2,2]]) },
  { id: 4, difficulty: 'easy', solutionPath: [[2,3],[2,2],[1,2],[0,2],[0,1]], grid: createPuzzleGrid(uniformGrid(3,4), [[2,3],[2,2],[1,2],[0,2],[0,1]]) },
  { id: 5, difficulty: 'easy', solutionPath: [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3]]) },
  { id: 6, difficulty: 'easy', solutionPath: [[0,3],[0,4],[1,4],[1,3],[2,3],[2,2]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,3],[0,4],[1,4],[1,3],[2,3],[2,2]]) },
  { id: 7, difficulty: 'easy', solutionPath: [[0,0],[0,1],[0,2],[1,2],[2,2],[2,3]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,0],[0,1],[0,2],[1,2],[2,2],[2,3]]) },
  { id: 8, difficulty: 'easy', source: 'custom', solutionPath: [[0,1],[0,2],[1,2]], grid: createPuzzleGrid(uniformGrid(2,4), [[0,1],[0,2],[1,2]]) },
  { id: 9, difficulty: 'easy', solutionPath: [[0,1],[1,1],[1,2],[1,3],[2,3],[2,4]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,1],[1,1],[1,2],[1,3],[2,3],[2,4]]) },
  { id: 10, difficulty: 'easy', source: 'custom', solutionPath: [[0,0],[1,0],[1,1],[1,2],[0,2]], grid: createPuzzleGrid(uniformGrid(2,4), [[0,0],[1,0],[1,1],[1,2],[0,2]]) },
  { id: 11, difficulty: 'easy', solutionPath: [[0,0],[0,1],[0,2],[1,2],[2,2],[2,1],[2,0]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,0],[0,1],[0,2],[1,2],[2,2],[2,1],[2,0]]) },
  { id: 12, difficulty: 'easy', solutionPath: [[2,0],[2,1],[2,2],[1,2],[0,2],[0,3],[1,3]], grid: createPuzzleGrid(uniformGrid(3,5), [[2,0],[2,1],[2,2],[1,2],[0,2],[0,3],[1,3]]) },
  { id: 13, difficulty: 'easy', solutionPath: [[0,4],[1,4],[1,3],[1,2],[1,1],[2,1],[2,0]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,4],[1,4],[1,3],[1,2],[1,1],[2,1],[2,0]]) },
  { id: 14, difficulty: 'easy', solutionPath: [[0,0],[0,1],[1,1],[1,2],[1,3],[2,3],[2,4]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,0],[0,1],[1,1],[1,2],[1,3],[2,3],[2,4]]) },
  { id: 15, difficulty: 'easy', solutionPath: [[0,0],[1,0],[1,1],[0,1],[0,2],[0,3],[1,3],[2,3]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,0],[1,0],[1,1],[0,1],[0,2],[0,3],[1,3],[2,3]]) },
  { id: 16, difficulty: 'easy', source: 'custom', solutionPath: [[0,0],[0,1],[1,1],[2,1],[2,2]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,0],[0,1],[1,1],[2,1],[2,2]]) },
  { id: 17, difficulty: 'easy', solutionPath: [[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[2,2],[1,2]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[2,2],[1,2]]) },
  { id: 18, difficulty: 'easy', solutionPath: [[0,3],[0,4],[1,4],[2,4],[2,3],[2,2],[1,2],[0,2]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,3],[0,4],[1,4],[2,4],[2,3],[2,2],[1,2],[0,2]]) },
  { id: 19, difficulty: 'easy', solutionPath: [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3],[3,3],[3,4]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3],[3,3],[3,4]]) },
  { id: 20, difficulty: 'easy', source: 'custom', solutionPath: [[0,3],[1,3],[2,3],[2,2],[2,1],[1,1],[0,1]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,3],[1,3],[2,3],[2,2],[2,1],[1,1],[0,1]]) },
  { id: 21, difficulty: 'easy', solutionPath: [[3,0],[3,1],[2,1],[2,2],[1,2],[1,3],[0,3],[0,4]], grid: createPuzzleGrid(uniformGrid(4,5), [[3,0],[3,1],[2,1],[2,2],[1,2],[1,3],[0,3],[0,4]]) },
  { id: 22, difficulty: 'easy', solutionPath: [[0,0],[0,1],[0,2],[1,2],[1,1],[2,1],[2,2],[3,2],[3,3]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,0],[0,1],[0,2],[1,2],[1,1],[2,1],[2,2],[3,2],[3,3]]) },
  { id: 23, difficulty: 'easy', solutionPath: [[0,0],[0,1],[0,2],[0,3],[1,3],[2,3],[2,2],[3,2],[3,1]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,0],[0,1],[0,2],[0,3],[1,3],[2,3],[2,2],[3,2],[3,1]]) },
  { id: 24, difficulty: 'easy', solutionPath: [[0,1],[0,2],[0,3],[1,3],[1,2],[1,1],[2,1],[2,2],[2,3]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,1],[0,2],[0,3],[1,3],[1,2],[1,1],[2,1],[2,2],[2,3]]) },
  { id: 25, difficulty: 'easy', solutionPath: [[3,0],[3,1],[3,2],[2,2],[2,3],[2,4],[1,4],[0,4],[0,3]], grid: createPuzzleGrid(uniformGrid(4,5), [[3,0],[3,1],[3,2],[2,2],[2,3],[2,4],[1,4],[0,4],[0,3]]) },

  // === MEDIUM (26-55) ===
  { id: 26, difficulty: 'medium', source: 'custom', solutionPath: [[1,0],[1,1],[0,1],[0,3]], grid: createPuzzleGrid(uniformGrid(2,4), [[1,0],[1,1],[0,1],[0,3]]) },
  { id: 27, difficulty: 'medium', source: 'custom', solutionPath: [[0,0],[0,2],[1,2],[1,0]], grid: createPuzzleGrid(uniformGrid(2,4), [[0,0],[0,2],[1,2],[1,0]]) },
  { id: 28, difficulty: 'medium', source: 'custom', solutionPath: [[0,0],[0,2],[0,3],[1,0],[1,1]], grid: createPuzzleGrid(uniformGrid(2,4), [[0,0],[0,2],[0,3],[1,0],[1,1]]) },
  { id: 29, difficulty: 'medium', source: 'custom', solutionPath: [[0,0],[0,2],[1,1],[1,3]], grid: createPuzzleGrid(uniformGrid(2,4), [[0,0],[0,2],[1,1],[1,3]]) },
  { id: 30, difficulty: 'medium', source: 'custom', solutionPath: [[0,1],[1,2],[2,1]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,1],[1,2],[2,1]]) },
  { id: 31, difficulty: 'medium', source: 'custom', solutionPath: [[2,0],[2,1],[0,2],[0,3],[1,0],[1,3]], grid: createPuzzleGrid(uniformGrid(3,4), [[2,0],[2,1],[0,2],[0,3],[1,0],[1,3]]) },
  { id: 32, difficulty: 'medium', source: 'custom', solutionPath: [[0,0],[1,0],[2,0],[1,2],[2,2]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,0],[1,0],[2,0],[1,2],[2,2]]) },
  { id: 33, difficulty: 'medium', source: 'custom', solutionPath: [[0,2],[2,3],[2,1],[1,1]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,2],[2,3],[2,1],[1,1]]) },
  { id: 34, difficulty: 'medium', source: 'custom', solutionPath: [[0,0],[2,3],[0,3],[2,0]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,0],[2,3],[0,3],[2,0]]) },
  { id: 35, difficulty: 'medium', source: 'custom', solutionPath: [[0,1],[0,2],[2,1],[2,2],[1,1],[1,2]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,1],[0,2],[2,1],[2,2],[1,1],[1,2]]) },
  { id: 36, difficulty: 'medium', source: 'custom', solutionPath: [[0,0],[1,1],[2,2],[1,3],[0,4],[3,2]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,0],[1,1],[2,2],[1,3],[0,4],[3,2]]) },
  { id: 37, difficulty: 'medium', source: 'custom', solutionPath: [[1,0],[1,4],[3,0],[3,4],[0,2],[2,2]], grid: createPuzzleGrid(uniformGrid(4,5), [[1,0],[1,4],[3,0],[3,4],[0,2],[2,2]]) },
  { id: 38, difficulty: 'medium', source: 'custom', solutionPath: [[0,3],[0,2],[1,2],[1,1],[1,0],[2,0],[3,0]], grid: createPuzzleGrid(uniformGrid(4,4), [[0,3],[0,2],[1,2],[1,1],[1,0],[2,0],[3,0]]) },
  { id: 39, difficulty: 'medium', source: 'custom', solutionPath: [[0,2],[1,2],[2,2],[3,2],[3,1],[2,1],[1,1],[0,1]], grid: createPuzzleGrid(uniformGrid(4,4), [[0,2],[1,2],[2,2],[3,2],[3,1],[2,1],[1,1],[0,1]]) },
  { id: 40, difficulty: 'medium', source: 'custom', solutionPath: [[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[1,2],[2,2],[3,2]], grid: createPuzzleGrid(uniformGrid(4,4), [[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[1,2],[2,2],[3,2]]) },
  { id: 41, difficulty: 'medium', solutionPath: snake(3,1,5), grid: createPuzzleGrid(uniformGrid(5,6), snake(3,1,5)) },
  { id: 42, difficulty: 'medium', source: 'custom', solutionPath: [[0,3],[1,3],[2,3],[3,3],[3,2],[3,1],[2,1],[2,0],[1,0],[0,0]], grid: createPuzzleGrid(uniformGrid(4,4), [[0,3],[1,3],[2,3],[3,3],[3,2],[3,1],[2,1],[2,0],[1,0],[0,0]]) },
  { id: 43, difficulty: 'medium', source: 'custom', solutionPath: [[0,3],[1,3],[2,3],[3,3],[3,2],[3,1],[3,0],[2,0],[1,0],[0,0]], grid: createPuzzleGrid(uniformGrid(4,4), [[0,3],[1,3],[2,3],[3,3],[3,2],[3,1],[3,0],[2,0],[1,0],[0,0]]) },
  { id: 44, difficulty: 'medium', solutionPath: [[0,1],[1,1],[2,1],[3,1],[4,1],[4,2],[4,3],[4,4],[4,5],[3,5],[2,5],[1,5],[0,5]], grid: createPuzzleGrid(uniformGrid(5,7), [[0,1],[1,1],[2,1],[3,1],[4,1],[4,2],[4,3],[4,4],[4,5],[3,5],[2,5],[1,5],[0,5]]) },
  { id: 45, difficulty: 'medium', solutionPath: snake(3,2,5), grid: createPuzzleGrid(uniformGrid(5,7), snake(3,2,5)) },
  { id: 46, difficulty: 'medium', solutionPath: zigzag2(3,6), grid: createPuzzleGrid(uniformGrid(6,7), zigzag2(3,6)) },
  { id: 47, difficulty: 'medium', solutionPath: snake(4,1,5), grid: createPuzzleGrid(uniformGrid(5,7), snake(4,1,5)) },
  { id: 48, difficulty: 'medium', solutionPath: snake(3,2,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(3,2,6)) },
  { id: 49, difficulty: 'medium', solutionPath: snake(4,1,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(4,1,6)) },
  { id: 50, difficulty: 'medium', solutionPath: [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[5,1],[5,2],[5,3],[5,4],[4,4],[3,4],[2,4],[1,4],[0,4]], grid: createPuzzleGrid(uniformGrid(6,7), [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[5,1],[5,2],[5,3],[5,4],[4,4],[3,4],[2,4],[1,4],[0,4]]) },
  { id: 51, difficulty: 'medium', solutionPath: snake(4,2,4), grid: createPuzzleGrid(uniformGrid(5,7), snake(4,2,4)) },
  { id: 52, difficulty: 'medium', solutionPath: snake(3,2,5), grid: createPuzzleGrid(uniformGrid(6,7), snake(3,2,5)) },
  { id: 53, difficulty: 'medium', solutionPath: snake(4,1,4), grid: createPuzzleGrid(uniformGrid(5,7), snake(4,1,4)) },
  { id: 54, difficulty: 'medium', solutionPath: snake(3,2,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(3,2,6)) },
  { id: 55, difficulty: 'medium', solutionPath: snake(4,1,5), grid: createPuzzleGrid(uniformGrid(6,7), snake(4,1,5)) },

  // === HARD (56-80) ===
  { id: 56, difficulty: 'hard', source: 'custom', solutionPath: [[0,0],[1,1],[0,2],[1,3],[0,4],[3,0],[2,1],[3,2],[2,3],[3,4]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,0],[1,1],[0,2],[1,3],[0,4],[3,0],[2,1],[3,2],[2,3],[3,4]]) },
  { id: 57, difficulty: 'hard', source: 'custom', solutionPath: [[3,0],[3,1],[3,3],[3,4],[2,1],[2,2],[2,3],[1,2],[0,1],[0,3]], grid: createPuzzleGrid(uniformGrid(4,5), [[3,0],[3,1],[3,3],[3,4],[2,1],[2,2],[2,3],[1,2],[0,1],[0,3]]) },
  { id: 58, difficulty: 'hard', source: 'custom', solutionPath: [[0,1],[0,3],[1,2],[2,1],[2,3],[3,2],[3,0],[3,4],[2,2]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,1],[0,3],[1,2],[2,1],[2,3],[3,2],[3,0],[3,4],[2,2]]) },
  { id: 59, difficulty: 'hard', source: 'custom', solutionPath: [[0,0],[0,1],[1,1],[2,1],[2,2],[2,3],[1,3],[0,3],[0,4]], grid: createPuzzleGrid(uniformGrid(5,5), [[0,0],[0,1],[1,1],[2,1],[2,2],[2,3],[1,3],[0,3],[0,4]]) },
  { id: 60, difficulty: 'hard', source: 'custom', solutionPath: [[0,1],[1,1],[1,0],[2,0],[3,0],[3,1],[3,2],[2,2],[2,3]], grid: createPuzzleGrid(uniformGrid(4,4), [[0,1],[1,1],[1,0],[2,0],[3,0],[3,1],[3,2],[2,2],[2,3]]) },
  { id: 61, difficulty: 'hard', source: 'custom', solutionPath: [[1,2],[3,1],[3,0],[3,3],[3,4],[2,4],[2,3],[2,1],[2,0],[0,2]], grid: createPuzzleGrid(uniformGrid(4,5), [[1,2],[3,1],[3,0],[3,3],[3,4],[2,4],[2,3],[2,1],[2,0],[0,2]]) },
  { id: 62, difficulty: 'hard', source: 'custom', solutionPath: [[1,0],[2,0],[3,0],[3,1],[4,1],[4,2],[3,2],[3,3],[2,3],[1,3]], grid: createPuzzleGrid(uniformGrid(5,4), [[1,0],[2,0],[3,0],[3,1],[4,1],[4,2],[3,2],[3,3],[2,3],[1,3]]) },
  { id: 63, difficulty: 'hard', source: 'custom', solutionPath: [[0,4],[0,2],[0,0],[3,0],[3,1],[3,2],[3,3],[3,4],[2,3],[2,2],[2,1]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,4],[0,2],[0,0],[3,0],[3,1],[3,2],[3,3],[3,4],[2,3],[2,2],[2,1]]) },
  { id: 64, difficulty: 'hard', source: 'custom', solutionPath: [[0,0],[1,0],[1,1],[2,1],[3,1],[4,1],[4,2],[3,2],[2,2],[1,2],[1,3],[0,3]], grid: createPuzzleGrid(uniformGrid(5,4), [[0,0],[1,0],[1,1],[2,1],[3,1],[4,1],[4,2],[3,2],[2,2],[1,2],[1,3],[0,3]]) },
  { id: 65, difficulty: 'hard', source: 'custom', solutionPath: [[0,2],[1,2],[2,2],[3,2],[0,4],[1,4],[2,4],[3,4],[0,0],[1,0],[2,0],[3,0]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,2],[1,2],[2,2],[3,2],[0,4],[1,4],[2,4],[3,4],[0,0],[1,0],[2,0],[3,0]]) },
  { id: 66, difficulty: 'hard', source: 'custom', solutionPath: [[0,0],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[3,2],[2,2],[1,2],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4]], grid: createPuzzleGrid(uniformGrid(5,5), [[0,0],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[3,2],[2,2],[1,2],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4]]) },
  { id: 67, difficulty: 'hard', solutionPath: snake(4,2,6), grid: createPuzzleGrid(uniformGrid(6,8), snake(4,2,6)) },
  { id: 68, difficulty: 'hard', solutionPath: snake(5,2,6), grid: createPuzzleGrid(uniformGrid(6,9), snake(5,2,6)) },
  { id: 69, difficulty: 'hard', solutionPath: snake(4,2,7), grid: createPuzzleGrid(uniformGrid(7,8), snake(4,2,7)) },
  { id: 70, difficulty: 'hard', solutionPath: snake(5,2,6), grid: createPuzzleGrid(uniformGrid(7,9), snake(5,2,6)) },
  { id: 71, difficulty: 'hard', solutionPath: snake(5,2,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(5,2,7)) },
  { id: 72, difficulty: 'hard', solutionPath: snake(4,2,7), grid: createPuzzleGrid(uniformGrid(7,8), snake(4,2,7)) },
  { id: 73, difficulty: 'hard', solutionPath: snake(6,1,6), grid: createPuzzleGrid(uniformGrid(7,9), snake(6,1,6)) },
  { id: 74, difficulty: 'hard', solutionPath: snake(5,2,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(5,2,7)) },
  { id: 75, difficulty: 'hard', solutionPath: snake(4,3,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(4,3,7)) },
  { id: 76, difficulty: 'hard', solutionPath: snake(6,1,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(6,1,7)) },
  { id: 77, difficulty: 'hard', solutionPath: snake(5,2,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(5,2,7)) },
  { id: 78, difficulty: 'hard', solutionPath: snake(5,2,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(5,2,7)) },
  { id: 79, difficulty: 'hard', solutionPath: snake(5,2,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(5,2,8)) },
  { id: 80, difficulty: 'hard', solutionPath: snake(6,1,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(6,1,8)) },

  // === EXPERT (81-100) ===
  { id: 81, difficulty: 'expert', source: 'custom', solutionPath: [[0,0],[0,1],[1,2],[0,3],[0,4],[3,0],[3,1],[2,2],[3,3],[3,4],[2,0],[2,4]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,0],[0,1],[1,2],[0,3],[0,4],[3,0],[3,1],[2,2],[3,3],[3,4],[2,0],[2,4]]) },
  { id: 82, difficulty: 'expert', source: 'custom', solutionPath: [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[3,1],[3,0]], grid: createPuzzleGrid(uniformGrid(5,5), [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[3,1],[3,0]]) },
  { id: 83, difficulty: 'expert', source: 'custom', solutionPath: [[0,0],[1,0],[1,1],[0,1],[0,2],[1,2],[1,3],[2,3],[2,4],[3,4],[3,3],[3,2],[4,2],[4,1],[4,0]], grid: createPuzzleGrid(uniformGrid(5,5), [[0,0],[1,0],[1,1],[0,1],[0,2],[1,2],[1,3],[2,3],[2,4],[3,4],[3,3],[3,2],[4,2],[4,1],[4,0]]) },
  { id: 84, difficulty: 'expert', source: 'custom', solutionPath: [[0,1],[1,1],[1,0],[2,0],[3,0],[3,1],[4,1],[4,2],[4,3],[3,3],[3,4],[2,4],[1,4],[1,3],[0,3]], grid: createPuzzleGrid(uniformGrid(5,5), [[0,1],[1,1],[1,0],[2,0],[3,0],[3,1],[4,1],[4,2],[4,3],[3,3],[3,4],[2,4],[1,4],[1,3],[0,3]]) },
  { id: 85, difficulty: 'expert', source: 'custom', solutionPath: [[2,0],[3,0],[4,0],[4,1],[3,1],[2,1],[1,1],[0,1],[0,2],[0,3],[1,3],[2,3],[3,3],[4,3],[4,4],[3,4],[2,4]], grid: createPuzzleGrid(uniformGrid(5,5), [[2,0],[3,0],[4,0],[4,1],[3,1],[2,1],[1,1],[0,1],[0,2],[0,3],[1,3],[2,3],[3,3],[4,3],[4,4],[3,4],[2,4]]) },
  { id: 86, difficulty: 'expert', source: 'custom', solutionPath: [[0,1],[1,1],[2,1],[2,0],[3,0],[4,0],[4,1],[3,1],[3,2],[3,3],[4,3],[4,4],[3,4],[2,4],[2,3],[1,3],[0,3]], grid: createPuzzleGrid(uniformGrid(5,5), [[0,1],[1,1],[2,1],[2,0],[3,0],[4,0],[4,1],[3,1],[3,2],[3,3],[4,3],[4,4],[3,4],[2,4],[2,3],[1,3],[0,3]]) },
  { id: 87, difficulty: 'expert', solutionPath: snake(5,2,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(5,2,8)) },
  { id: 88, difficulty: 'expert', solutionPath: snake(6,2,8), grid: createPuzzleGrid(uniformGrid(8,10), snake(6,2,8)) },
  { id: 89, difficulty: 'expert', solutionPath: snake(7,1,8), grid: createPuzzleGrid(uniformGrid(8,10), snake(7,1,8)) },
  { id: 90, difficulty: 'expert', solutionPath: snake(7,1,8), grid: createPuzzleGrid(uniformGrid(8,10), snake(7,1,8)) },
  {
    id: 91, difficulty: 'expert',
    solutionPath: snake(4,2,7),
    grid: (() => {
      const g = uniformGrid(7,8); const pg = createPuzzleGrid(g, snake(4,2,7));
      for (let r = 0; r < 7; r++) { pg[r][0] = 2; pg[r][7] = 2; }
      return pg;
    })(),
  },
  {
    id: 92, difficulty: 'expert',
    solutionPath: snake(5,2,7),
    grid: (() => {
      const g = uniformGrid(7,9); const pg = createPuzzleGrid(g, snake(5,2,7));
      for (let r = 0; r < 7; r++) { pg[r][0] = 2; pg[r][8] = 2; }
      return pg;
    })(),
  },
  {
    id: 93, difficulty: 'expert',
    solutionPath: snake(5,2,7),
    grid: (() => {
      const g = uniformGrid(7,9); const pg = createPuzzleGrid(g, snake(5,2,7));
      for (let r = 0; r < 7; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][8] = 2; }
      return pg;
    })(),
  },
  {
    id: 94, difficulty: 'expert',
    solutionPath: snake(6,2,8),
    grid: (() => {
      const g = uniformGrid(8,10); const pg = createPuzzleGrid(g, snake(6,2,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 95, difficulty: 'expert',
    solutionPath: snake(5,2,8),
    grid: (() => {
      const g = uniformGrid(8,9); const pg = createPuzzleGrid(g, snake(5,2,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][8] = 2; }
      return pg;
    })(),
  },
  {
    id: 96, difficulty: 'expert',
    solutionPath: snake(6,2,8),
    grid: (() => {
      const g = uniformGrid(8,10); const pg = createPuzzleGrid(g, snake(6,2,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 97, difficulty: 'expert',
    solutionPath: snake(6,2,8),
    grid: (() => {
      const g = uniformGrid(8,10); const pg = createPuzzleGrid(g, snake(6,2,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][8] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 98, difficulty: 'expert',
    solutionPath: snake(7,1,8),
    grid: (() => {
      const g = uniformGrid(8,10); const pg = createPuzzleGrid(g, snake(7,1,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][8] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 99, difficulty: 'expert',
    solutionPath: snake(7,1,8),
    grid: (() => {
      const g = uniformGrid(8,10); const pg = createPuzzleGrid(g, snake(7,1,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][8] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 100, difficulty: 'expert',
    solutionPath: snake(6,2,9),
    grid: (() => {
      const g = uniformGrid(9,10); const pg = createPuzzleGrid(g, snake(6,2,9));
      for (let r = 0; r < 9; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
];

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

function diagonal(startRow: number, startCol: number, length: number, dirR: number, dirC: number): [number, number][] {
  const path: [number, number][] = [];
  for (let i = 0; i < length; i++) path.push([startRow + i * dirR, startCol + i * dirC]);
  return path;
}

function uPath(startRow: number, startCol: number, down: number, across: number): [number, number][] {
  const path: [number, number][] = [];
  for (let r = startRow; r <= startRow + down; r++) path.push([r, startCol]);
  for (let c = startCol + 1; c <= startCol + across; c++) path.push([startRow + down, c]);
  for (let r = startRow + down - 1; r >= startRow; r--) path.push([r, startCol + across]);
  return path;
}

const PREMIUM_PUZZLES: Puzzle[] = [
  // === BONUS EASY (101-125) ===
  { id: 101, isPremium: true, difficulty: 'easy', solutionPath: [[0,0],[0,1],[1,1],[1,2],[0,2]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,0],[0,1],[1,1],[1,2],[0,2]]) },
  { id: 102, isPremium: true, difficulty: 'easy', solutionPath: [[0,0],[1,0],[1,1],[2,1],[2,2]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,0],[1,0],[1,1],[2,1],[2,2]]) },
  { id: 103, isPremium: true, difficulty: 'easy', solutionPath: [[2,0],[2,1],[1,1],[0,1],[0,2]], grid: createPuzzleGrid(uniformGrid(3,4), [[2,0],[2,1],[1,1],[0,1],[0,2]]) },
  { id: 104, isPremium: true, difficulty: 'easy', solutionPath: [[0,2],[0,3],[1,3],[2,3],[2,2]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,2],[0,3],[1,3],[2,3],[2,2]]) },
  { id: 105, isPremium: true, difficulty: 'easy', solutionPath: [[0,0],[1,0],[2,0],[2,1],[1,1]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,0],[1,0],[2,0],[2,1],[1,1]]) },
  { id: 106, isPremium: true, difficulty: 'easy', solutionPath: [[0,1],[1,1],[1,2],[1,3],[2,3]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,1],[1,1],[1,2],[1,3],[2,3]]) },
  { id: 107, isPremium: true, difficulty: 'easy', solutionPath: [[0,3],[1,3],[1,2],[2,2],[2,1]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,3],[1,3],[1,2],[2,2],[2,1]]) },
  { id: 108, isPremium: true, difficulty: 'easy', solutionPath: [[0,0],[0,1],[0,2],[1,0],[2,0]], grid: createPuzzleGrid(uniformGrid(3,4), [[0,0],[0,1],[0,2],[1,0],[2,0]]) },
  { id: 109, isPremium: true, difficulty: 'easy', solutionPath: [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3]]) },
  { id: 110, isPremium: true, difficulty: 'easy', solutionPath: [[0,3],[0,4],[1,4],[1,3],[1,2],[2,2]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,3],[0,4],[1,4],[1,3],[1,2],[2,2]]) },
  { id: 111, isPremium: true, difficulty: 'easy', solutionPath: [[0,0],[1,0],[2,0],[2,1],[2,2],[1,2]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,0],[1,0],[2,0],[2,1],[2,2],[1,2]]) },
  { id: 112, isPremium: true, difficulty: 'easy', solutionPath: [[0,4],[1,4],[1,3],[2,3],[2,2],[2,1]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,4],[1,4],[1,3],[2,3],[2,2],[2,1]]) },
  { id: 113, isPremium: true, difficulty: 'easy', solutionPath: [[0,1],[0,2],[0,3],[1,3],[2,3],[2,2],[2,1]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,1],[0,2],[0,3],[1,3],[2,3],[2,2],[2,1]]) },
  { id: 114, isPremium: true, difficulty: 'easy', solutionPath: [[2,0],[2,1],[2,2],[1,2],[0,2],[0,3],[1,3]], grid: createPuzzleGrid(uniformGrid(3,5), [[2,0],[2,1],[2,2],[1,2],[0,2],[0,3],[1,3]]) },
  { id: 115, isPremium: true, difficulty: 'easy', solutionPath: [[0,4],[1,4],[1,3],[1,2],[1,1],[2,1],[2,0]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,4],[1,4],[1,3],[1,2],[1,1],[2,1],[2,0]]) },
  { id: 116, isPremium: true, difficulty: 'easy', solutionPath: [[0,0],[1,0],[1,1],[1,2],[0,2],[0,3],[0,4]], grid: createPuzzleGrid(uniformGrid(3,5), [[0,0],[1,0],[1,1],[1,2],[0,2],[0,3],[0,4]]) },
  { id: 117, isPremium: true, difficulty: 'easy', solutionPath: [[2,0],[2,1],[2,2],[2,3],[1,3],[0,3],[0,4]], grid: createPuzzleGrid(uniformGrid(3,5), [[2,0],[2,1],[2,2],[2,3],[1,3],[0,3],[0,4]]) },
  { id: 118, isPremium: true, difficulty: 'easy', solutionPath: [[0,4],[1,4],[1,3],[2,3],[2,2],[3,2],[3,1],[3,0]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,4],[1,4],[1,3],[2,3],[2,2],[3,2],[3,1],[3,0]]) },
  { id: 119, isPremium: true, difficulty: 'easy', solutionPath: [[0,0],[0,1],[0,2],[1,2],[1,3],[1,4],[2,4],[3,4]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,0],[0,1],[0,2],[1,2],[1,3],[1,4],[2,4],[3,4]]) },
  { id: 120, isPremium: true, difficulty: 'easy', solutionPath: [[3,4],[3,3],[3,2],[2,2],[2,1],[1,1],[1,0],[0,0]], grid: createPuzzleGrid(uniformGrid(4,5), [[3,4],[3,3],[3,2],[2,2],[2,1],[1,1],[1,0],[0,0]]) },
  { id: 121, isPremium: true, difficulty: 'easy', solutionPath: [[0,3],[0,4],[1,4],[1,3],[2,3],[2,2],[3,2],[3,1]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,3],[0,4],[1,4],[1,3],[2,3],[2,2],[3,2],[3,1]]) },
  { id: 122, isPremium: true, difficulty: 'easy', solutionPath: [[0,0],[0,1],[0,2],[1,2],[1,1],[2,1],[2,2],[2,3],[3,3]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,0],[0,1],[0,2],[1,2],[1,1],[2,1],[2,2],[2,3],[3,3]]) },
  { id: 123, isPremium: true, difficulty: 'easy', solutionPath: [[3,0],[3,1],[2,1],[2,2],[2,3],[1,3],[0,3],[0,2],[0,1]], grid: createPuzzleGrid(uniformGrid(4,5), [[3,0],[3,1],[2,1],[2,2],[2,3],[1,3],[0,3],[0,2],[0,1]]) },
  { id: 124, isPremium: true, difficulty: 'easy', solutionPath: [[3,4],[3,3],[3,2],[2,2],[2,1],[1,1],[1,0],[0,0],[0,1]], grid: createPuzzleGrid(uniformGrid(4,5), [[3,4],[3,3],[3,2],[2,2],[2,1],[1,1],[1,0],[0,0],[0,1]]) },
  { id: 125, isPremium: true, difficulty: 'easy', solutionPath: [[0,0],[0,1],[0,2],[1,2],[1,1],[2,1],[2,0],[3,0],[3,1]], grid: createPuzzleGrid(uniformGrid(4,5), [[0,0],[0,1],[0,2],[1,2],[1,1],[2,1],[2,0],[3,0],[3,1]]) },

  // === BONUS MEDIUM (126-155) ===
  { id: 126, isPremium: true, difficulty: 'medium', solutionPath: snake(3,1,4), grid: createPuzzleGrid(uniformGrid(5,5), snake(3,1,4)) },
  { id: 127, isPremium: true, difficulty: 'medium', solutionPath: snake(3,1,5), grid: createPuzzleGrid(uniformGrid(5,6), snake(3,1,5)) },
  { id: 128, isPremium: true, difficulty: 'medium', solutionPath: uPath(0,0,4,4), grid: createPuzzleGrid(uniformGrid(5,6), uPath(0,0,4,4)) },
  { id: 129, isPremium: true, difficulty: 'medium', solutionPath: snake(4,1,4), grid: createPuzzleGrid(uniformGrid(5,6), snake(4,1,4)) },
  { id: 130, isPremium: true, difficulty: 'medium', solutionPath: snake(3,2,5), grid: createPuzzleGrid(uniformGrid(5,7), snake(3,2,5)) },
  { id: 131, isPremium: true, difficulty: 'medium', solutionPath: snake(3,1,6), grid: createPuzzleGrid(uniformGrid(6,6), snake(3,1,6)) },
  { id: 132, isPremium: true, difficulty: 'medium', solutionPath: snake(3,0,5), grid: createPuzzleGrid(uniformGrid(5,6), snake(3,0,5)) },
  { id: 133, isPremium: true, difficulty: 'medium', solutionPath: snake(3,2,5), grid: createPuzzleGrid(uniformGrid(5,7), snake(3,2,5)) },
  { id: 134, isPremium: true, difficulty: 'medium', solutionPath: zigzag2(2,6), grid: createPuzzleGrid(uniformGrid(6,6), zigzag2(2,6)) },
  { id: 135, isPremium: true, difficulty: 'medium', solutionPath: uPath(0,1,5,4), grid: createPuzzleGrid(uniformGrid(6,7), uPath(0,1,5,4)) },
  { id: 136, isPremium: true, difficulty: 'medium', solutionPath: snake(4,1,5), grid: createPuzzleGrid(uniformGrid(5,7), snake(4,1,5)) },
  { id: 137, isPremium: true, difficulty: 'medium', solutionPath: snake(3,2,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(3,2,6)) },
  { id: 138, isPremium: true, difficulty: 'medium', solutionPath: snake(4,2,4), grid: createPuzzleGrid(uniformGrid(5,7), snake(4,2,4)) },
  { id: 139, isPremium: true, difficulty: 'medium', solutionPath: snake(4,1,5), grid: createPuzzleGrid(uniformGrid(6,7), snake(4,1,5)) },
  { id: 140, isPremium: true, difficulty: 'medium', solutionPath: snake(3,1,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(3,1,6)) },
  { id: 141, isPremium: true, difficulty: 'medium', solutionPath: snake(4,2,5), grid: createPuzzleGrid(uniformGrid(6,7), snake(4,2,5)) },
  { id: 142, isPremium: true, difficulty: 'medium', solutionPath: snake(5,1,4), grid: createPuzzleGrid(uniformGrid(5,7), snake(5,1,4)) },
  { id: 143, isPremium: true, difficulty: 'medium', solutionPath: snake(3,0,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(3,0,6)) },
  { id: 144, isPremium: true, difficulty: 'medium', solutionPath: snake(4,1,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(4,1,6)) },
  { id: 145, isPremium: true, difficulty: 'medium', solutionPath: uPath(0,0,5,5), grid: createPuzzleGrid(uniformGrid(6,7), uPath(0,0,5,5)) },
  { id: 146, isPremium: true, difficulty: 'medium', solutionPath: snake(5,1,5), grid: createPuzzleGrid(uniformGrid(6,7), snake(5,1,5)) },
  { id: 147, isPremium: true, difficulty: 'medium', solutionPath: snake(4,1,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(4,1,6)) },
  { id: 148, isPremium: true, difficulty: 'medium', solutionPath: snake(4,2,5), grid: createPuzzleGrid(uniformGrid(6,7), snake(4,2,5)) },
  { id: 149, isPremium: true, difficulty: 'medium', solutionPath: snake(3,3,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(3,3,6)) },
  { id: 150, isPremium: true, difficulty: 'medium', solutionPath: snake(4,2,6), grid: createPuzzleGrid(uniformGrid(6,7), snake(4,2,6)) },
  { id: 151, isPremium: true, difficulty: 'medium', solutionPath: snake(4,2,6), grid: createPuzzleGrid(uniformGrid(6,8), snake(4,2,6)) },
  { id: 152, isPremium: true, difficulty: 'medium', solutionPath: snake(5,1,5), grid: createPuzzleGrid(uniformGrid(5,7), snake(5,1,5)) },
  { id: 153, isPremium: true, difficulty: 'medium', solutionPath: snake(4,2,6), grid: createPuzzleGrid(uniformGrid(6,8), snake(4,2,6)) },
  { id: 154, isPremium: true, difficulty: 'medium', solutionPath: snake(4,2,6), grid: createPuzzleGrid(uniformGrid(6,8), snake(4,2,6)) },
  { id: 155, isPremium: true, difficulty: 'medium', solutionPath: snake(5,1,6), grid: createPuzzleGrid(uniformGrid(6,8), snake(5,1,6)) },

  // === BONUS HARD (156-180) ===
  { id: 156, isPremium: true, difficulty: 'hard', solutionPath: snake(4,2,6), grid: createPuzzleGrid(uniformGrid(6,8), snake(4,2,6)) },
  { id: 157, isPremium: true, difficulty: 'hard', solutionPath: snake(5,2,6), grid: createPuzzleGrid(uniformGrid(6,9), snake(5,2,6)) },
  { id: 158, isPremium: true, difficulty: 'hard', solutionPath: snake(4,2,7), grid: createPuzzleGrid(uniformGrid(7,8), snake(4,2,7)) },
  { id: 159, isPremium: true, difficulty: 'hard', solutionPath: snake(5,2,6), grid: createPuzzleGrid(uniformGrid(7,9), snake(5,2,6)) },
  { id: 160, isPremium: true, difficulty: 'hard', solutionPath: snake(5,1,6), grid: createPuzzleGrid(uniformGrid(7,8), snake(5,1,6)) },
  { id: 161, isPremium: true, difficulty: 'hard', solutionPath: snake(4,3,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(4,3,7)) },
  { id: 162, isPremium: true, difficulty: 'hard', solutionPath: snake(5,1,6), grid: createPuzzleGrid(uniformGrid(6,8), snake(5,1,6)) },
  { id: 163, isPremium: true, difficulty: 'hard', solutionPath: snake(5,2,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(5,2,7)) },
  { id: 164, isPremium: true, difficulty: 'hard', solutionPath: snake(5,1,7), grid: createPuzzleGrid(uniformGrid(7,8), snake(5,1,7)) },
  { id: 165, isPremium: true, difficulty: 'hard', solutionPath: snake(6,1,6), grid: createPuzzleGrid(uniformGrid(7,9), snake(6,1,6)) },
  { id: 166, isPremium: true, difficulty: 'hard', solutionPath: snake(6,1,6), grid: createPuzzleGrid(uniformGrid(7,8), snake(6,1,6)) },
  { id: 167, isPremium: true, difficulty: 'hard', solutionPath: snake(6,1,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(6,1,7)) },
  { id: 168, isPremium: true, difficulty: 'hard', solutionPath: snake(5,2,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(5,2,7)) },
  { id: 169, isPremium: true, difficulty: 'hard', solutionPath: snake(6,2,6), grid: createPuzzleGrid(uniformGrid(7,9), snake(6,2,6)) },
  { id: 170, isPremium: true, difficulty: 'hard', solutionPath: snake(6,1,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(6,1,7)) },
  { id: 171, isPremium: true, difficulty: 'hard', solutionPath: snake(7,1,6), grid: createPuzzleGrid(uniformGrid(7,9), snake(7,1,6)) },
  { id: 172, isPremium: true, difficulty: 'hard', solutionPath: snake(6,2,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(6,2,7)) },
  { id: 173, isPremium: true, difficulty: 'hard', solutionPath: snake(5,2,7), grid: createPuzzleGrid(uniformGrid(8,9), snake(5,2,7)) },
  { id: 174, isPremium: true, difficulty: 'hard', solutionPath: snake(5,2,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(5,2,8)) },
  { id: 175, isPremium: true, difficulty: 'hard', solutionPath: snake(6,2,7), grid: createPuzzleGrid(uniformGrid(7,9), snake(6,2,7)) },
  { id: 176, isPremium: true, difficulty: 'hard', solutionPath: snake(6,1,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(6,1,8)) },
  { id: 177, isPremium: true, difficulty: 'hard', solutionPath: snake(5,2,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(5,2,8)) },
  { id: 178, isPremium: true, difficulty: 'hard', solutionPath: snake(6,2,7), grid: createPuzzleGrid(uniformGrid(8,9), snake(6,2,7)) },
  { id: 179, isPremium: true, difficulty: 'hard', solutionPath: snake(6,1,8), grid: createPuzzleGrid(uniformGrid(8,9), snake(6,1,8)) },
  { id: 180, isPremium: true, difficulty: 'hard', solutionPath: snake(7,1,7), grid: createPuzzleGrid(uniformGrid(8,9), snake(7,1,7)) },

  // === BONUS EXPERT (181-200) ===
  {
    id: 181, isPremium: true, difficulty: 'expert',
    solutionPath: snake(5,2,7),
    grid: (() => {
      const g = uniformGrid(7,9); const pg = createPuzzleGrid(g, snake(5,2,7));
      for (let r = 0; r < 7; r++) { pg[r][0] = 2; pg[r][8] = 2; }
      return pg;
    })(),
  },
  {
    id: 182, isPremium: true, difficulty: 'expert',
    solutionPath: snake(5,2,7),
    grid: (() => {
      const g = uniformGrid(7,9); const pg = createPuzzleGrid(g, snake(5,2,7));
      for (let r = 0; r < 7; r++) { pg[r][0] = 2; pg[r][8] = 2; }
      return pg;
    })(),
  },
  {
    id: 183, isPremium: true, difficulty: 'expert',
    solutionPath: snake(5,2,7),
    grid: (() => {
      const g = uniformGrid(7,9); const pg = createPuzzleGrid(g, snake(5,2,7));
      for (let r = 0; r < 7; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][8] = 2; }
      return pg;
    })(),
  },
  {
    id: 184, isPremium: true, difficulty: 'expert',
    solutionPath: snake(5,2,8),
    grid: (() => {
      const g = uniformGrid(8,9); const pg = createPuzzleGrid(g, snake(5,2,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][8] = 2; }
      return pg;
    })(),
  },
  {
    id: 185, isPremium: true, difficulty: 'expert',
    solutionPath: snake(5,2,8),
    grid: (() => {
      const g = uniformGrid(8,9); const pg = createPuzzleGrid(g, snake(5,2,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][8] = 2; }
      return pg;
    })(),
  },
  {
    id: 186, isPremium: true, difficulty: 'expert',
    solutionPath: snake(6,1,8),
    grid: (() => {
      const g = uniformGrid(8,9); const pg = createPuzzleGrid(g, snake(6,1,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][8] = 2; }
      return pg;
    })(),
  },
  {
    id: 187, isPremium: true, difficulty: 'expert',
    solutionPath: snake(6,1,8),
    grid: (() => {
      const g = uniformGrid(8,9); const pg = createPuzzleGrid(g, snake(6,1,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][8] = 2; }
      return pg;
    })(),
  },
  {
    id: 188, isPremium: true, difficulty: 'expert',
    solutionPath: snake(6,2,8),
    grid: (() => {
      const g = uniformGrid(8,10); const pg = createPuzzleGrid(g, snake(6,2,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 189, isPremium: true, difficulty: 'expert',
    solutionPath: snake(6,2,8),
    grid: (() => {
      const g = uniformGrid(8,10); const pg = createPuzzleGrid(g, snake(6,2,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 190, isPremium: true, difficulty: 'expert',
    solutionPath: snake(6,2,8),
    grid: (() => {
      const g = uniformGrid(8,10); const pg = createPuzzleGrid(g, snake(6,2,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 191, isPremium: true, difficulty: 'expert',
    solutionPath: snake(7,1,8),
    grid: (() => {
      const g = uniformGrid(8,10); const pg = createPuzzleGrid(g, snake(7,1,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 192, isPremium: true, difficulty: 'expert',
    solutionPath: snake(7,1,8),
    grid: (() => {
      const g = uniformGrid(8,10); const pg = createPuzzleGrid(g, snake(7,1,8));
      for (let r = 0; r < 8; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 193, isPremium: true, difficulty: 'expert',
    solutionPath: snake(6,2,9),
    grid: (() => {
      const g = uniformGrid(9,10); const pg = createPuzzleGrid(g, snake(6,2,9));
      for (let r = 0; r < 9; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 194, isPremium: true, difficulty: 'expert',
    solutionPath: snake(6,2,9),
    grid: (() => {
      const g = uniformGrid(9,10); const pg = createPuzzleGrid(g, snake(6,2,9));
      for (let r = 0; r < 9; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 195, isPremium: true, difficulty: 'expert',
    solutionPath: snake(6,2,9),
    grid: (() => {
      const g = uniformGrid(9,10); const pg = createPuzzleGrid(g, snake(6,2,9));
      for (let r = 0; r < 9; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 196, isPremium: true, difficulty: 'expert',
    solutionPath: snake(7,1,9),
    grid: (() => {
      const g = uniformGrid(9,10); const pg = createPuzzleGrid(g, snake(7,1,9));
      for (let r = 0; r < 9; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 197, isPremium: true, difficulty: 'expert',
    solutionPath: snake(7,1,9),
    grid: (() => {
      const g = uniformGrid(9,10); const pg = createPuzzleGrid(g, snake(7,1,9));
      for (let r = 0; r < 9; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 198, isPremium: true, difficulty: 'expert',
    solutionPath: snake(7,2,9),
    grid: (() => {
      const g = uniformGrid(9,10); const pg = createPuzzleGrid(g, snake(7,2,9));
      for (let r = 0; r < 9; r++) { pg[r][0] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 199, isPremium: true, difficulty: 'expert',
    solutionPath: snake(7,2,9),
    grid: (() => {
      const g = uniformGrid(9,10); const pg = createPuzzleGrid(g, snake(7,2,9));
      for (let r = 0; r < 9; r++) { pg[r][0] = 2; pg[r][1] = 2; pg[r][9] = 2; }
      return pg;
    })(),
  },
  {
    id: 200, isPremium: true, difficulty: 'expert',
    solutionPath: snake(8,1,9),
    grid: (() => {
      const g = uniformGrid(9,10); const pg = createPuzzleGrid(g, snake(8,1,9));
      for (let r = 0; r < 9; r++) { pg[r][0] = 2; }
      return pg;
    })(),
  },
];

const ALL_PUZZLES = [...PUZZLES, ...PREMIUM_PUZZLES];
ALL_PUZZLES.forEach(p => { if (!p.source) p.source = 'generated'; });

export const FREE_PUZZLE_COUNT = PUZZLES.length;
export const PREMIUM_PUZZLE_COUNT = PREMIUM_PUZZLES.length;

export default ALL_PUZZLES;

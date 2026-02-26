export interface CellPosition {
  row: number;
  col: number;
}

export type CellType = 'white' | 'black' | 'gray' | 'lockedWhite' | 'lockedBlack';

export function getBaseValue(cell: number): number {
  if (cell === 0 || cell === 2) return 0;
  return 1;
}

export function isLocked(cell: number): boolean {
  return cell === 2 || cell === 3;
}

export function createFullGrid(innerGrid: number[][]): CellType[][] {
  const cols = (innerGrid[0]?.length ?? 0) + 2;
  const topRow: CellType[] = Array(cols).fill('gray' as CellType);
  const rows = innerGrid.map(row => {
    const fullRow: CellType[] = ['gray'];
    for (const cell of row) {
      if (cell === 2) fullRow.push('lockedWhite');
      else if (cell === 3) fullRow.push('lockedBlack');
      else fullRow.push(cell === 0 ? 'white' : 'black');
    }
    fullRow.push('gray');
    return fullRow;
  });
  const bottomRow: CellType[] = Array(cols).fill('gray' as CellType);
  return [topRow, ...rows, bottomRow];
}

export function applyFlip(
  innerGrid: number[][],
  path: CellPosition[],
  innerColOffset: number = 1,
  innerRowOffset: number = 1
): number[][] {
  const newGrid = innerGrid.map(row => [...row]);
  const innerCols = innerGrid[0]?.length ?? 0;

  for (const cell of path) {
    const innerCol = cell.col - innerColOffset;
    const innerRow = cell.row - innerRowOffset;
    if (innerCol >= 0 && innerCol < innerCols && innerRow >= 0 && innerRow < newGrid.length) {
      const val = newGrid[innerRow][innerCol];
      if (val === 0) newGrid[innerRow][innerCol] = 1;
      else if (val === 1) newGrid[innerRow][innerCol] = 0;
    }
  }

  return newGrid;
}

export function getUniformRows(innerGrid: number[][]): number[] {
  const uniform: number[] = [];
  for (let r = 0; r < innerGrid.length; r++) {
    const row = innerGrid[r];
    if (row.length === 0) continue;
    const firstBase = getBaseValue(row[0]);
    if (row.every(cell => getBaseValue(cell) === firstBase)) {
      uniform.push(r);
    }
  }
  return uniform;
}

export function isAllCleared(innerGrid: number[][]): boolean {
  if (innerGrid.length === 0) return true;
  let target: number | null = null;
  for (const row of innerGrid) {
    for (const cell of row) {
      const base = getBaseValue(cell);
      if (target === null) target = base;
      else if (base !== target) return false;
    }
  }
  return true;
}

export function removeRows(innerGrid: number[][], rowIndices: number[]): number[][] {
  return innerGrid.filter((_, i) => !rowIndices.includes(i));
}

export function generateRandomRow(cols: number): number[] {
  let row: number[];
  do {
    row = Array.from({ length: cols }, () => Math.random() > 0.5 ? 1 : 0);
  } while (row.every(c => c === row[0]));
  return row;
}

export function isAdjacent(a: CellPosition, b: CellPosition): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function isSameCell(a: CellPosition, b: CellPosition): boolean {
  return a.row === b.row && a.col === b.col;
}

export function solutionToFullGridPath(solutionPath: [number, number][]): CellPosition[] {
  return solutionPath.map(([row, col]) => ({ row: row + 1, col: col + 1 }));
}

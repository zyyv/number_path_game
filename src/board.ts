import { Cell } from "./cell";

/**
 * Manages the 8x8 game board grid.
 */
export class Board {
  public readonly size: number;
  public readonly grid: Cell[][];
  private numberMap: Map<number, Cell> = new Map();

  constructor(size: number = 8) {
    this.size = size;
    this.grid = [];
    for (let r = 0; r < size; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < size; c++) {
        row.push(new Cell(r, c));
      }
      this.grid.push(row);
    }
  }

  /** Build the number→cell lookup map. Must be called after all numbers are assigned. */
  buildLookup(): void {
    this.numberMap.clear();
    for (const row of this.grid) {
      for (const cell of row) {
        this.numberMap.set(cell.number, cell);
      }
    }
  }

  /** Get a cell at the given row and column. */
  getCell(row: number, col: number): Cell {
    return this.grid[row][col];
  }

  /** Set the number on a cell. */
  setNumber(row: number, col: number, num: number): void {
    this.grid[row][col].number = num;
  }

  /** Find the cell that contains the given number (O(1) via lookup map). */
  findCellByNumber(num: number): Cell | undefined {
    return this.numberMap.get(num);
  }

  /** Get all valid neighbor cells (8 directions) within bounds. */
  getNeighbors(row: number, col: number): Cell[] {
    const neighbors: Cell[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
          neighbors.push(this.grid[nr][nc]);
        }
      }
    }
    return neighbors;
  }

  /** Check if two cells are adjacent. */
  areAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
  }
}

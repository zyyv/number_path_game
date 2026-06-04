/**
 * Represents a single cell on the game board.
 */
export class Cell {
  readonly row: number;
  readonly col: number;
  number: number;

  constructor(row: number, col: number, number: number = 0) {
    this.row = row;
    this.col = col;
    this.number = number;
  }

  /** Check if this cell is adjacent (8 directions) to another cell. */
  isAdjacentTo(other: Cell): boolean {
    const dr = Math.abs(this.row - other.row);
    const dc = Math.abs(this.col - other.col);
    return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
  }

  /** Get the center position of this cell in pixel coordinates. */
  getCenter(cellSize: number, gap: number): { x: number; y: number } {
    return {
      x: this.col * (cellSize + gap) + cellSize / 2,
      y: this.row * (cellSize + gap) + cellSize / 2,
    };
  }

  toString(): string {
    return `Cell(${this.row},${this.col}#${this.number})`;
  }
}

import { Board } from "./board";

/**
 * Renders the game board to the DOM.
 */
export class Renderer {
  private board: Board;
  private cellSize: number;
  private gap: number;
  private container: HTMLElement;
  private svg: SVGSVGElement;
  private cellElements: HTMLElement[][] = [];

  constructor(board: Board, container: HTMLElement, cellSize: number = 60, gap: number = 4) {
    this.board = board;
    this.container = container;
    this.cellSize = cellSize;
    this.gap = gap;
    this.svg = Renderer.createSvg();
  }

  private static createSvg(): SVGSVGElement {
    return document.createElementNS("http://www.w3.org/2000/svg", "svg");
  }

  /** Build the full game board DOM. */
  render(): SVGSVGElement {
    const boardEl = document.createElement("div");
    boardEl.classList.add("game-board");
    boardEl.style.display = "grid";
    boardEl.style.gridTemplateColumns = `repeat(${this.board.size}, ${this.cellSize}px)`;
    boardEl.style.gap = `${this.gap}px`;
    boardEl.style.position = "relative";

    this.cellElements = [];

    for (let r = 0; r < this.board.size; r++) {
      const rowEls: HTMLElement[] = [];
      for (let c = 0; c < this.board.size; c++) {
        const cell = this.board.getCell(r, c);
        const cellEl = document.createElement("div");
        cellEl.classList.add("cell");
        cellEl.style.width = `${this.cellSize}px`;
        cellEl.style.height = `${this.cellSize}px`;
        cellEl.textContent = String(cell.number);
        cellEl.dataset.row = String(r);
        cellEl.dataset.col = String(c);
        boardEl.appendChild(cellEl);
        rowEls.push(cellEl);
      }
      this.cellElements.push(rowEls);
    }

    // Position SVG overlay to match the board.
    const totalSize = this.board.size * this.cellSize + (this.board.size - 1) * this.gap;
    this.svg.setAttribute("width", String(totalSize));
    this.svg.setAttribute("height", String(totalSize));
    this.svg.style.position = "absolute";
    this.svg.style.top = "0";
    this.svg.style.left = "0";
    this.svg.style.pointerEvents = "none";

    boardEl.appendChild(this.svg);
    this.container.appendChild(boardEl);

    return this.svg;
  }

  /** Mark a cell as part of the connected path. */
  markCellConnected(row: number, col: number): void {
    this.cellElements[row][col].classList.add("connected");
  }

  /** Highlight the current target cell. */
  highlightTarget(row: number, col: number): void {
    // Remove previous target highlight.
    const prev = this.container.querySelector(".cell.target");
    if (prev) prev.classList.remove("target");
    this.cellElements[row][col].classList.add("target");
  }

  /** Remove all highlights and connected states. */
  resetVisuals(): void {
    for (const row of this.cellElements) {
      for (const cellEl of row) {
        cellEl.classList.remove("connected", "target", "wrong");
      }
    }
  }

  /** Flash a cell to indicate a wrong click. */
  flashWrong(row: number, col: number): void {
    const el = this.cellElements[row][col];
    el.classList.add("wrong");
    setTimeout(() => el.classList.remove("wrong"), 400);
  }

  /** Update a cell's displayed number. */
  updateCellNumber(row: number, col: number, num: number): void {
    this.cellElements[row][col].textContent = String(num);
  }

  getCellSize(): number {
    return this.cellSize;
  }

  getGap(): number {
    return this.gap;
  }
}

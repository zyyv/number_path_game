import { Cell } from "./cell";

/**
 * Handles SVG line animations between connected cells.
 */
export class LineAnimator {
  private svg: SVGSVGElement;
  private cellSize: number;
  private gap: number;

  constructor(svg: SVGSVGElement, cellSize: number, gap: number) {
    this.svg = svg;
    this.cellSize = cellSize;
    this.gap = gap;
  }

  /**
   * Animate a line segment from one cell to another.
   * Returns a promise that resolves when the animation finishes.
   */
  animateLine(from: Cell, to: Cell): Promise<void> {
    return new Promise((resolve) => {
      const fromPos = from.getCenter(this.cellSize, this.gap);
      const toPos = to.getCenter(this.cellSize, this.gap);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(fromPos.x));
      line.setAttribute("y1", String(fromPos.y));
      line.setAttribute("x2", String(toPos.x));
      line.setAttribute("y2", String(toPos.y));
      line.classList.add("path-line");

      // Calculate line length for dash animation.
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      line.style.strokeDasharray = String(length);
      line.style.strokeDashoffset = String(length);

      this.svg.appendChild(line);

      // Double rAF: first frame commits the initial state, second starts the transition.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          line.style.transition = "stroke-dashoffset 0.3s ease-out";
          line.style.strokeDashoffset = "0";
        });
      });

      line.addEventListener("transitionend", () => resolve(), { once: true });
    });
  }

  /**
   * Remove all drawn lines from the SVG.
   */
  clear(): void {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
  }
}

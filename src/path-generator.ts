import { Board } from "./board";
import { Cell } from "./cell";

/**
 * Generates a solvable number path puzzle on the board.
 *
 * Uses Warnsdorff's heuristic with backtracking: prefer the unvisited neighbor
 * with the fewest onward moves, but on dead ends backtrack a few steps and retry
 * instead of restarting from scratch.
 */
export class PathGenerator {
  private readonly board: Board;
  private readonly size: number;

  constructor(board: Board) {
    this.board = board;
    this.size = board.size;
  }

  /**
   * Generate a solvable puzzle. Returns the ordered list of cells
   * forming the Hamiltonian path (the solution).
   */
  generate(): Cell[] {
    let path: Cell[] | null = null;
    let attempts = 0;
    const maxAttempts = 50;

    while (!path && attempts < maxAttempts) {
      path = this.tryGeneratePath();
      attempts++;
    }

    // Ultimate fallback: deterministic snake path.
    if (!path) {
      path = this.generateSnakePath();
    }

    // Assign numbers along the path.
    for (let i = 0; i < path.length; i++) {
      path[i].number = i + 1;
    }
    this.board.buildLookup();
    return path;
  }

  /**
   * Generate a Hamiltonian path using Warnsdorff's heuristic with proper DFS backtracking.
   * Each position on the stack keeps its own ranked candidate list, so backtracking
   * always tries the next untried option instead of repeating the same choice.
   */
  private tryGeneratePath(): Cell[] | null {
    const totalCells = this.size * this.size;
    const visited = this.createVisitedMatrix();
    const path: Cell[] = [];

    // Center-biased start: weight each cell by a Gaussian centered on the board.
    const { row: startRow, col: startCol } = this.weightedStartCell();
    const startCell = this.board.getCell(startRow, startCol);
    visited[startRow][startCol] = true;
    path.push(startCell);

    // choices[i] = remaining candidates to try from path[i], in Warnsdorff order.
    const choices: Cell[][] = [this.rankedNeighbors(startCell, visited)];

    // Hard step limit prevents any runaway in degenerate boards.
    const maxSteps = totalCells * totalCells * 4;
    let steps = 0;

    while (path.length < totalCells) {
      if (++steps > maxSteps) return null;

      const candidates = choices[choices.length - 1];

      if (candidates.length === 0) {
        // All candidates at this depth exhausted — backtrack one step.
        if (path.length === 1) return null;
        const removed = path.pop()!;
        visited[removed.row][removed.col] = false;
        choices.pop();
        continue;
      }

      // Advance: take the best remaining candidate (already ranked, ties shuffled).
      const next = candidates.shift()!;
      visited[next.row][next.col] = true;
      path.push(next);
      choices.push(this.rankedNeighbors(next, visited));
    }

    return path;
  }

  /** Unvisited neighbors sorted by Warnsdorff count; ties broken randomly. */
  private rankedNeighbors(cell: Cell, visited: boolean[][]): Cell[] {
    const neighbors = this.board.getNeighbors(cell.row, cell.col);
    const unvisited = neighbors.filter((n) => !visited[n.row][n.col]);
    this.shuffle(unvisited);
    unvisited.sort((a, b) => this.countUnvisited(a, visited) - this.countUnvisited(b, visited));
    return unvisited;
  }

  /** Count unvisited neighbors of a cell. */
  private countUnvisited(cell: Cell, visited: boolean[][]): number {
    const neighbors = this.board.getNeighbors(cell.row, cell.col);
    let count = 0;
    for (const n of neighbors) {
      if (!visited[n.row][n.col]) count++;
    }
    return count;
  }

  private createVisitedMatrix(): boolean[][] {
    const matrix: boolean[][] = [];
    for (let r = 0; r < this.size; r++) {
      matrix.push(Array.from({ length: this.size }, () => false));
    }
    return matrix;
  }

  /**
   * Deterministic snake-like Hamiltonian path as fallback.
   */
  private generateSnakePath(): Cell[] {
    const path: Cell[] = [];
    for (let r = 0; r < this.size; r++) {
      if (r % 2 === 0) {
        for (let c = 0; c < this.size; c++) {
          path.push(this.board.getCell(r, c));
        }
      } else {
        for (let c = this.size - 1; c >= 0; c--) {
          path.push(this.board.getCell(r, c));
        }
      }
    }
    return path;
  }

  /** Pick a start cell biased toward the board center via Gaussian weighting. */
  private weightedStartCell(): { row: number; col: number } {
    const center = (this.size - 1) / 2;
    const sigma = this.size / 4;
    const weights: number[] = [];
    let total = 0;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const d2 = (r - center) ** 2 + (c - center) ** 2;
        const w = Math.exp(-d2 / (2 * sigma * sigma));
        weights.push(w);
        total += w;
      }
    }

    let rand = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        return { row: Math.floor(i / this.size), col: i % this.size };
      }
    }
    return { row: Math.round(center), col: Math.round(center) };
  }

  /** Fisher-Yates shuffle. */
  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}

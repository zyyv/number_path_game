d# File Inventory - Number Path Game

## Source Files (src/)

### **Vue Components**

#### `src/App.vue` (35 lines)

Root application component that serves as the main entry point.

- **Imports**: GameBoard component from `./components/GameBoard.vue`
- **Template**: Renders title, subtitle, and GameBoard component
- **Styles**: Centered flex layout, title at 32px, subtitle at 16px
- **CSS Variables Used**: `--text-h`, `--text`

#### `src/components/GameBoard.vue` (418 lines) ⭐ **CORE**

Main game logic and UI orchestration component.

- **Imports**: Board, PathGenerator, LineAnimator, Cell.vue, StatusBar.vue
- **Reactive State** (11 refs + 4 computed):
  - `currentLevel`: Difficulty selector (0-4, maps to 4×4 to 8×8)
  - `gridSize`: Computed from currentLevel
  - `totalCells`: Computed size squared
  - `board`: Board instance
  - `currentStep`: Expected next number (1 to totalCells)
  - `moveCount`: Valid move counter
  - `hasWon`: Win state flag
  - `elapsed`: Time as string "X.X"
  - `isAnimating`: Animation in progress flag
  - `connectedCells`: Set<string> of solved path cells
  - `hiddenCells`: Set<string> of unrevealed cells
  - `targetCell`: { row, col } or null for hint
  - `wrongCell`: { row, col } or null for wrong click flash
  - `hintActive`: Hint display flag

- **Key Methods**:
  - `initGame()`: Reset and generate new puzzle
  - `handleCellClick(row, col)`: Validate and process cell clicks
  - `revealCell()`: Unhide a cell's number
  - `revealNeighbors()`: Random 1-2 adjacent cells revealed
  - `showHint()`: Highlight next target for 1.5s
  - `flashWrong()`: 400ms red flash on wrong click
  - `onWin()`: Record time and set win state
  - `nextLevel() / prevLevel()`: Difficulty navigation
  - `shuffleArray()`: Fisher-Yates shuffle utility

- **Lifecycle**: `onMounted()` calls `initGame()`
- **Template**: Level buttons → Grid → SVG overlay → StatusBar → Action buttons
- **Constants**:
  - `LEVELS`: [4×4, 5×5, 6×6, 7×7, 8×8]
  - `CELL_SIZE`: 60px
  - `GAP`: 4px

#### `src/components/Cell.vue` (106 lines)

Individual grid cell component with visual states.

- **Props**:
  - `number: number` - Cell content
  - `isConnected: boolean` - Part of solution
  - `isTarget: boolean` - Hint highlight
  - `isWrong: boolean` - Wrong click state
  - `isHidden: boolean` - Hidden number state

- **Events**: `click` emitted on user interaction
- **Template**: Single div displaying number or "?" (if hidden)
- **Classes**: `.cell`, `.connected`, `.target`, `.wrong`, `.hidden`
- **Animations**:
  - `pulse` (1.2s infinite): Target glow
  - `shake` (0.4s): Wrong click vibration
- **Hover Effects**: 1.08x scale + shadow

#### `src/components/StatusBar.vue` (43 lines)

Game status display component.

- **Props**:
  - `currentStep: number` - Next target
  - `moveCount: number` - Move counter
  - `hasWon: boolean` - Win state
  - `elapsed: string` - Time display

- **Template**: Conditional display of current progress or win message
- **Message Formats**:
  - Playing: "当前目标: X | 步数: Y"
  - Won: "🎉 恭喜通关！用了 X 步，耗时 Y 秒"
- **Styles**: Win state uses different color and 22px font

---

### **Game Logic Classes**

#### `src/board.ts` (63 lines)

Grid management class.

- **Properties**:
  - `size: number` - Grid dimensions (4-8)
  - `grid: Cell[][]` - 2D cell array

- **Constructor**: Initializes empty cells at each position
- **Methods**:
  - `getCell(row, col): Cell` - Access cell
  - `setNumber(row, col, num)` - Assign number
  - `findCellByNumber(num): Cell | undefined` - Search by value
  - `getNeighbors(row, col): Cell[]` - 8-directional neighbors
  - `areAdjacent(r1, c1, r2, c2): boolean` - Adjacency check

#### `src/cell.ts` (33 lines)

Data model for individual cells.

- **Properties**:
  - `row: number` - Row index
  - `col: number` - Column index
  - `number: number` - Cell value (0-N²)

- **Constructor**: Can initialize with optional number
- **Methods**:
  - `isAdjacentTo(other: Cell): boolean` - 8-directional check
  - `getCenter(cellSize, gap): {x, y}` - SVG line endpoint calculation
  - `toString()` - Debug string

#### `src/path-generator.ts` (141 lines) ⭐ **ALGORITHM**

Hamiltonian path generation using Warnsdorff's heuristic.

- **Algorithm**:
  1. Random start cell
  2. Iteratively visit unvisited neighbors
  3. Prefer neighbors with fewest onward moves (Warnsdorff's)
  4. On dead end: backtrack up to 10 steps and retry
  5. Max 50 attempts
  6. Fallback: Snake pattern (row by row, alternating direction)

- **Key Methods**:
  - `generate(): Cell[]` - Main entry point, returns path
  - `tryGeneratePath(): Cell[] | null` - Attempt one generation
  - `generateSnakePath(): Cell[]` - Deterministic fallback
  - `countUnvisited(cell, visited): number` - Helper for heuristic
  - `createVisitedMatrix(): boolean[][]` - Track visited cells
  - `shuffle<T>(arr)` - Fisher-Yates shuffle

- **Why it works**:
  - Warnsdorff's heuristic has ~99% success on 8×8 for first attempt
  - Backtracking handles edge cases without full restart
  - Snake pattern guarantees solvable puzzle exists

#### `src/line-animator.ts` (62 lines)

SVG line animation system.

- **Constructor**: Takes SVG element, cell size, gap
- **Methods**:
  - `animateLine(from: Cell, to: Cell): Promise<void>`
    - Creates `<line>` SVG element
    - Uses `stroke-dasharray` technique for "drawing" animation
    - 0.35s ease-out transition
    - Resolves when animation completes
  - `clear()` - Remove all lines from SVG

- **Animation Details**:
  - `stroke-dasharray`: Set to line length
  - `stroke-dashoffset`: Animated from length to 0
  - Creates visual effect of line being "drawn"

#### `src/renderer.ts` (111 lines)

Legacy DOM renderer (mostly superseded by Vue components).

- **Methods**:
  - `render(): SVGSVGElement` - Build DOM (unused in current app)
  - `markCellConnected()` - Add class
  - `highlightTarget()` - Target highlighting
  - `resetVisuals()` - Clear visual states
  - `flashWrong()` - Wrong cell animation
  - `updateCellNumber()` - Update displayed number

---

### **Configuration & Utilities**

#### `src/main.ts` (5 lines)

Vue app bootstrap.

- Creates Vue app from App.vue
- Mounts to `#app` div

#### `src/env.d.ts`

TypeScript environment declarations for Vue module resolution.

#### `src/style.css` (184 lines) 🎨 **STYLING**

Global styles and CSS variables.

**CSS Variables** (Light/Dark modes):

- Text colors: `--text`, `--text-h`
- Background: `--bg`
- Cell states: `--cell-bg`, `--cell-connected`, `--cell-target`, `--cell-wrong`, `--cell-hidden`
- Line color: `--line-color`
- Accent: `--accent`
- Font families: `--sans`, `--mono`

**Keyframe Animations**:

- `@keyframes pulse` - Yellow glow (1.2s loop)
- `@keyframes shake` - Vibration (0.4s)
- `@keyframes fadeIn` - Fade and slide (0.6s)

**Color Scheme**:

- Light: Soft purples and grays on light background
- Dark: Inverted via `prefers-color-scheme: dark` media query

---

### **Other Source Files**

#### `index.html` (14 lines)

HTML entry point.

- Declares `#app` mount point
- Imports `/src/main.ts` as module

#### `package.json` (22 lines)

Project metadata and dependencies.

- **Name**: number_path_game
- **Type**: module (ES6)
- **Scripts**:
  - `dev`: vp dev
  - `build`: tsc && vp build
  - `preview`: vp preview
  - `prepare`: vp config

- **Dependencies**: vue ^3.5.35, @vitejs/plugin-vue ^6.0.7
- **DevDependencies**: typescript, vite, vite-plus
- **Package Manager**: pnpm@11.5.1

#### `tsconfig.json` (24 lines)

TypeScript configuration.

- **Target**: es2023
- **Module**: esnext
- **Module Resolution**: bundler mode
- **Strict Mode**: noUnusedLocals, noUnusedParameters enabled

#### `vite.config.ts`

Vite build configuration (created by vite-plus).

---

## Summary Statistics

| Category               | Count  | Key Files                                              |
| ---------------------- | ------ | ------------------------------------------------------ |
| Vue Components         | 3      | App.vue, GameBoard.vue, Cell.vue, StatusBar.vue        |
| Game Logic Classes     | 4      | board.ts, cell.ts, path-generator.ts, line-animator.ts |
| Configuration Files    | 3      | tsconfig.json, vite.config.ts, package.json            |
| HTML/CSS               | 2      | index.html, style.css                                  |
| Utilities/Bootstrap    | 2      | main.ts, env.d.ts                                      |
| **Total Source Files** | **14** | -                                                      |

---

## Key File Dependencies

```
App.vue
└── GameBoard.vue
    ├── board.ts
    ├── path-generator.ts
    ├── line-animator.ts
    ├── Cell.vue
    └── StatusBar.vue

cell.ts (used by board.ts, path-generator.ts, line-animator.ts)
renderer.ts (legacy, not used in current Vue implementation)
```

---

## File Purposes at a Glance

| File              | Purpose                          | Lines | Type         |
| ----------------- | -------------------------------- | ----- | ------------ |
| GameBoard.vue     | Main game logic & UI             | 418   | 🎮 Core      |
| path-generator.ts | Puzzle generation (Warnsdorff's) | 141   | 🧠 Algorithm |
| Cell.vue          | Grid cell component              | 106   | 🎨 UI        |
| style.css         | Global styles & animations       | 184   | 🎨 Styling   |
| board.ts          | Grid management                  | 63    | 📦 Data      |
| line-animator.ts  | SVG animation system             | 62    | ✨ Animation |
| App.vue           | Root component wrapper           | 35    | 🎯 Entry     |
| package.json      | Project metadata                 | 22    | ⚙️ Config    |
| cell.ts           | Cell data model                  | 33    | 📦 Data      |
| index.html        | HTML mount point                 | 14    | 📄 HTML      |
| main.ts           | Vue bootstrap                    | 5     | 🚀 Boot      |
| StatusBar.vue     | Status display                   | 43    | 📊 UI        |
| tsconfig.json     | TypeScript config                | 24    | ⚙️ Config    |
| renderer.ts       | Legacy DOM renderer              | 111   | 📦 Legacy    |

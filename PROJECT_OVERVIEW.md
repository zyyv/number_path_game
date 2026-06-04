# Number Path Game - Project Overview

## 📋 Project Summary

**数字路径游戏** (Number Path Game) is a Vue 3 + TypeScript puzzle game where players connect numbered cells in sequential order (1→2→3→...→N) by clicking on them in the correct path. The game features:

- **Variable difficulty levels**: 4×4 to 8×8 grid sizes
- **Hidden numbers**: ~35% of cell numbers are hidden (shown as "?") until revealed
- **Animated connections**: SVG lines animate between connected cells
- **Progressive reveal**: Neighboring cells are revealed as you progress
- **Hint system**: Highlights the next target number for 1.5 seconds
- **Multi-language**: Chinese UI with emojis for visual clarity

---

## 🗂️ Project Structure

```
number_path_game/
├── index.html                 # Entry HTML file
├── package.json               # Project dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
├── src/
│   ├── main.ts                # Vue app bootstrap
│   ├── App.vue                # Root component (renders GameBoard)
│   ├── style.css              # Global styles & CSS variables
│   ├── env.d.ts               # TypeScript declarations
│   ├── components/
│   │   ├── GameBoard.vue      # Main game container & logic
│   │   ├── Cell.vue           # Individual cell component
│   │   └── StatusBar.vue      # Game status display
│   └── game-logic/
│       ├── board.ts           # Board grid management
│       ├── cell.ts            # Cell data model
│       ├── path-generator.ts  # Hamiltonian path generation (Warnsdorff's heuristic)
│       ├── line-animator.ts   # SVG line animation system
│       └── renderer.ts        # DOM rendering (legacy, mostly Vue now)
└── node_modules/              # Dependencies
```

---

## 🎮 Component Architecture

### **App.vue** (Root Component)

- **Purpose**: Main application wrapper
- **Content**: Title, subtitle, and GameBoard component
- **Styling**: Centered flex layout with header text

### **GameBoard.vue** (Main Game Logic)

The heart of the game—manages:

- **Game State**:
  - `currentLevel` (0-4): Selected difficulty level
  - `gridSize`: Computed 4×4 to 8×8
  - `board`: Current Board instance
  - `currentStep`: Next number to click (1 to totalCells)
  - `moveCount`: Number of valid clicks
  - `hasWon`: Game completion flag
  - `connectedCells`: Set of cell keys that are part of the solution path
  - `hiddenCells`: Set of cell keys with hidden numbers
  - `targetCell`: Cell highlighted by hint system
  - `wrongCell`: Cell flashing due to wrong click

- **Key Functions**:
  - `initGame()`: Initializes a new puzzle (generates board, resets state)
  - `handleCellClick(row, col)`: Validates clicked cell against expected next number
  - `revealCell()`: Unhides a specific cell's number
  - `revealNeighbors()`: Reveals 1-2 random neighboring hidden cells
  - `showHint()`: Highlights the next target cell for 1.5 seconds
  - `flashWrong()`: Brief flash animation for wrong clicks
  - `onWin()`: Records final time and sets win state
  - `nextLevel() / prevLevel()`: Navigates difficulty levels

- **Render**:
  - Level control buttons (prev/next)
  - Grid of Cell components (CSS Grid layout)
  - SVG overlay for animated lines
  - StatusBar component
  - Action buttons (Restart, Hint, Next Level)

### **Cell.vue** (Grid Cell Component)

- **Props**:
  - `number: number` - The cell's displayed number
  - `isConnected: boolean` - Part of solved path (green)
  - `isTarget: boolean` - Highlighted by hint (yellow with pulse)
  - `isWrong: boolean` - Wrong click flash (red with shake)
  - `isHidden: boolean` - Number not yet revealed (shows "?")

- **Events**: Emits 'click' event on user click
- **Styling**: 60×60px cells with transitions, hover scale effect

### **StatusBar.vue** (Game Status Display)

- **Props**: currentStep, moveCount, hasWon, elapsed
- **Content**:
  - **During game**: "当前目标: X | 步数: Y" (Current target / Move count)
  - **After win**: "🎉 恭喜通关！用了 X 步，耗时 Y 秒" (Congratulations! X moves, Y seconds)

---

## 🧠 Game Logic & Algorithms

### **board.ts** - Board Class

Manages the N×N grid of cells:

- **Constructor**: Initializes empty grid with Cell objects
- **getCell(row, col)**: Retrieve cell at position
- **setNumber(row, col, num)**: Assign number to cell
- **findCellByNumber(num)**: Find cell containing a number (used for hint/animation)
- **getNeighbors(row, col)**: Get all 8 adjacent cells (or fewer at edges)
- **areAdjacent(r1, c1, r2, c2)**: Check if two cells are adjacent

### **cell.ts** - Cell Class

Data model for a single board cell:

- **Properties**: `row`, `col`, `number`
- **isAdjacentTo(other)**: 8-directional adjacency check
- **getCenter(cellSize, gap)**: Calculate pixel center position for SVG lines

### **path-generator.ts** - PathGenerator Class

Generates solvable Hamiltonian paths (visiting every cell exactly once):

**Algorithm: Warnsdorff's Heuristic with Backtracking**

1. Start at a random cell
2. At each step, prefer moving to the unvisited neighbor with the **fewest onward moves** (reduces dead ends)
3. If dead end (no unvisited neighbors):
   - Backtrack up to 10 steps
   - Try different neighbor choices
   - If backtrack exhausted, return to start
4. Repeat up to 50 attempts
5. **Fallback**: Snake path (deterministic zigzag) if all attempts fail

**Why this works**:

- Warnsdorff's heuristic dramatically increases success rate vs random walk
- Backtracking escapes local dead ends without full restart
- Snake path guarantees a valid puzzle exists

### **line-animator.ts** - LineAnimator Class

Animates SVG lines between cells using CSS transitions:

- **animateLine(from, to)**:
  1. Creates SVG `<line>` element
  2. Sets `stroke-dasharray` and `stroke-dashoffset` to line length
  3. Animates offset to 0 over 0.35s with `ease-out`
  4. Returns Promise that resolves when animation completes
- **clear()**: Remove all lines from SVG (called on level reset)

---

## 🎨 Styling & Theming

### **CSS Variables** (`style.css`)

Light mode:

- `--text`: #6b6375 (soft gray)
- `--text-h`: #08060d (dark for headers)
- `--bg`: #f8f7fa (light background)
- `--cell-bg`: #e8e6ed (cell default)
- `--cell-connected`: #4ade80 (green)
- `--cell-target`: #fbbf24 (yellow)
- `--cell-wrong`: #ef4444 (red)
- `--cell-hidden`: #d4d0dc (muted for hidden)
- `--line-color`: #22c55e (bright green lines)
- `--accent`: #aa3bff (purple accent)

Dark mode: Automatically inverted via `prefers-color-scheme: dark` media query

### **Animations**

- **pulse**: Target cell glows (used for hint highlight)
- **shake**: Wrong cell vibrates (0.4s)
- **fadeIn**: Status bar animation on win (0.6s)

### **Layout**

- **Game board**: CSS Grid with configurable columns and gap
- **Cell size**: 60×60px with 4px gap
- **Board size**: (60 × gridSize) + (4 × (gridSize - 1)) pixels

---

## 📦 Dependencies

### Production

- **vue** ^3.5.35 - UI framework
- **@vitejs/plugin-vue** ^6.0.7 - Vite Vue support

### Development

- **typescript** ~6.0.2 - Type checking
- **vite** (catalog) - Build tool
- **vite-plus** (catalog) - Enhanced Vite configuration

### Package Manager

- **pnpm** ^11.5.1

---

## 🎯 Game Flow

1. **Game Initialization** (`onMounted`):
   - Generate random Hamiltonian path
   - Shuffle and hide ~35% of numbers
   - Initialize UI state (currentStep=1, moveCount=0)
   - Setup SVG animator

2. **Player Action** (Click Cell):
   - If number matches `currentStep`, move is valid:
     - Increment moveCount
     - Reveal clicked cell and 1-2 neighbors
     - If step 1→2, skip animation
     - For step 2+, animate line from previous cell
     - Add cell to connectedCells
     - Update targetCell hint
     - Check for win condition
   - If number ≠ currentStep, flash red and shake

3. **Win Condition**:
   - `currentStep > totalCells`
   - Record elapsed time
   - Display congratulations message
   - Show "Next Level" button

4. **Level Navigation**:
   - Previous/Next buttons change gridSize (4×4 to 8×8)
   - Next level button visible only after win
   - Reinitialize game on level change

---

## 🔧 Technical Details

### Game State Management

All state is in `GameBoard.vue` using Vue 3 Composition API with `ref()` and `computed()`:

- No external state library (Pinia/Vuex) needed
- Single component holds all logic
- Props drill down to Cell components
- Events bubble up from Cell for clicks

### SVG Rendering

- SVG overlay positioned absolutely on top of grid
- Lines drawn dynamically as cells are connected
- Dash animation creates "drawing" effect
- No canvas—pure DOM/SVG for simplicity

### Performance Considerations

- Grid layout is efficient for variable sizes
- Path generation (~50 attempts max) happens once per level
- Animations use CSS transitions (GPU accelerated)
- No heavy computations during gameplay

### Type Safety

- Full TypeScript support
- Props and emits properly typed with `defineProps`/`defineEmits`
- Board, Cell, PathGenerator fully typed
- No `any` types in codebase

---

## 🌐 Internationalization

The game uses Chinese (Simplified) throughout:

- Title: "数字路径游戏" (Number Path Game)
- Subtitle: "沿着路径从 1 开始依次连线" (Follow the path, connecting from 1 onwards)
- UI: "当前目标", "步数", "提示", "重新开始", "下一关", "恭喜通关"

Could be easily extracted to i18n system if needed.

---

## 🚀 Running the Project

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

---

## 📝 Notes & Future Improvements

**Current Strengths**:

- Clean, modular architecture
- Smooth animations and visual feedback
- Flexible difficulty system
- Elegant path generation algorithm

**Potential Enhancements**:

- Leaderboard/high score tracking
- Multiplayer mode
- Custom board sizes
- Difficulty presets (easy, medium, hard)
- Statistics dashboard
- Sound effects
- Mobile touch optimization
- Undo/pause features

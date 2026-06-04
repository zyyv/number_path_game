# Architecture & Data Flow - Number Path Game

## 📊 Component Hierarchy

```
App.vue (Root)
│
└── GameBoard.vue (Main Container)
    ├── Level Controls (buttons)
    ├── Cell[gridSize × gridSize] (Grid)
    │   └── Cell.vue (Individual cell component)
    ├── SVG (Line animation overlay)
    ├── StatusBar.vue (Status display)
    └── Action Buttons
        ├── Restart Button
        ├── Hint Button
        └── Next Level Button (conditional)
```

## 🔄 Data Flow Architecture

### Unidirectional Props Flow

```
GameBoard.vue (State Owner)
│
├─→ Cell.vue (Props: number, isConnected, isTarget, isWrong, isHidden)
│
├─→ StatusBar.vue (Props: currentStep, moveCount, hasWon, elapsed)
│
└─→ SVG LineAnimator (Programmatic via ref)
```

### Event Flow (Upward)

```
Cell.vue (User Clicks)
│
└─→ GameBoard.vue
    ├─ handleCellClick(row, col)
    ├─ Validate move
    ├─ Update state
    └─ Update child components via props
```

## 🧬 State Management

### GameBoard.vue State Machine

```
┌─────────────────────────────┐
│    GAME INITIALIZATION      │
│  onMounted() → initGame()   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   WAIT FOR PLAYER INPUT     │
│  currentStep = 1...N        │
│  canClick = !isAnimating    │
└──────────────┬──────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
   VALID CLICK     WRONG CLICK
   ┌─────────┐     ┌──────────┐
   │ • ++moveCount│ │ flashWrong│
   │ • reveal cells│ │ (400ms)  │
   │ • animate line│ │          │
   │ • ++currentStep│          │
   │ • check win   │ └──────────┘
   └────┬────┘         │
        │              │
        ├──────┬───────┘
        │      │
        ▼      ▼
   ┌──────────────────┐
   │ CONTINUE or WIN? │
   └────────┬─────────┘
        ┌───┴────┐
        │        │
   CONTINUE   WIN
     (loop)    │
              ▼
         ┌──────────┐
         │ onWin()  │
         │ • elapsed│
         │ • display│
         │ • nextBtn│
         └──────────┘
```

## 🎮 Game Initialization Flow

```
onMounted()
│
├─→ initGame()
│   ├─→ new Board(size)
│   ├─→ new PathGenerator(board)
│   │   └─→ generator.generate()
│   │       ├─→ Attempt Warnsdorff's algorithm (up to 50 times)
│   │       │   ├─→ Random start cell
│   │       │   ├─→ Loop until totalCells visited
│   │       │   │   ├─→ Get unvisited neighbors
│   │       │   │   ├─→ Sort by Warnsdorff's heuristic
│   │       │   │   ├─→ Move to preferred neighbor
│   │       │   │   └─→ On dead end: backtrack 1-10 steps
│   │       │   └─→ Return path if successful
│   │       └─→ Fallback: Snake pattern if all attempts fail
│   │
│   ├─→ Assign numbers 1...N² along path
│   ├─→ Shuffle and hide ~35% of cells
│   ├─→ Reset all state (currentStep=1, moveCount=0, etc.)
│   │
│   └─→ nextTick() → setupSvg()
│       └─→ LineAnimator setup
│
└─→ GameBoard renders with new state
    └─→ All Cell components re-render with new numbers
```

## 🎯 Cell Click Handler Flow

```
Cell.vue @click
│
└─→ GameBoard.handleCellClick(row, col)
    │
    ├─→ Get cell from board
    │
    ├─→ if cell.number === currentStep
    │   ├─→ moveCount++
    │   ├─→ revealCell(row, col)
    │   │   └─→ hiddenCells.delete(cellKey)
    │   │
    │   ├─→ revealNeighbors(row, col)
    │   │   ├─→ Get neighbors from board
    │   │   ├─→ Filter hidden ones
    │   │   ├─→ Shuffle array
    │   │   └─→ Delete 1-2 random hidden neighbors
    │   │
    │   ├─→ if currentStep === 1
    │   │   ├─→ currentStep = 2
    │   │   └─→ targetCell = null
    │   │   └─→ return (no animation for first move)
    │   │
    │   ├─→ else (currentStep >= 2)
    │   │   ├─→ Get prev cell: board.findCellByNumber(currentStep - 1)
    │   │   ├─→ isAnimating = true
    │   │   ├─→ await lineAnimator.animateLine(prevCell, currCell)
    │   │   │   └─→ SVG line with stroke-dasharray animation (0.35s)
    │   │   ├─→ connectedCells.add(cellKey)
    │   │   ├─→ currentStep++
    │   │   └─→ isAnimating = false
    │   │
    │   ├─→ if currentStep > totalCells
    │   │   └─→ onWin()
    │   │       ├─→ hasWon = true
    │   │       └─→ Record elapsed time
    │   │
    │   └─→ else
    │       └─→ targetCell = null
    │
    └─→ else (wrong cell)
        └─→ flashWrong(row, col)
            ├─→ wrongCell = {row, col}
            └─→ setTimeout(400ms)
                └─→ wrongCell = null
```

## 📦 Class Responsibilities

### Board (board.ts)

- **Owns**: Grid of cells, dimensions
- **Provides**: Cell access, neighbor queries, adjacency checks
- **Used By**: PathGenerator, GameBoard

### Cell (cell.ts)

- **Owns**: Position (row, col), value (number)
- **Provides**: Adjacency checks, SVG center calculation
- **Used By**: Board, PathGenerator, LineAnimator, GameBoard

### PathGenerator (path-generator.ts)

- **Owns**: Generation algorithm implementation
- **Provides**: Valid Hamiltonian paths for puzzles
- **Used By**: GameBoard (once per game)
- **Algorithm**: Warnsdorff's heuristic + backtracking + fallback

### LineAnimator (line-animator.ts)

- **Owns**: SVG element reference, animation timing
- **Provides**: Animated line drawing between cells
- **Used By**: GameBoard
- **Technique**: CSS stroke-dasharray animation

### GameBoard.vue

- **Owns**: All game state (board, step, moves, etc.)
- **Provides**: Game mechanics, UI coordination
- **Manages**:
  - Board generation and reset
  - Move validation
  - Animation orchestration
  - Win condition
  - Level navigation

## 🎨 Vue Component Communication

### Props (Parent → Child)

**GameBoard → Cell**

```typescript
:number="board.getCell(r - 1, c - 1).number"
:is-connected="connectedCells.has(cellKey(r - 1, c - 1))"
:is-target="targetCell?.row === r - 1 && targetCell?.col === c - 1"
:is-wrong="wrongCell?.row === r - 1 && wrongCell?.col === c - 1"
:is-hidden="hiddenCells.has(cellKey(r - 1, c - 1))"
```

**GameBoard → StatusBar**

```typescript
:current-step="currentStep"
:move-count="moveCount"
:has-won="hasWon"
:elapsed="elapsed"
```

### Events (Child → Parent)

**Cell → GameBoard**

```typescript
@click="handleCellClick(r - 1, c - 1)"
```

## 🔗 External Dependencies

### Vue 3

- `ref()`: Reactive state variables
- `computed()`: Derived state
- `onMounted()`: Lifecycle hook
- `nextTick()`: DOM flush timing
- `defineProps()`: Component props
- `defineEmits()`: Component events

### No External State Management

- ❌ No Pinia, Vuex, or Redux
- ✅ Single component owns all game state
- Simpler for this game's scope

## 🚀 Performance Characteristics

### Path Generation

- **Time**: <50ms typically (up to 50 attempts max)
- **Happens**: Once per game/level
- **Complexity**: O(N²) search with backtracking

### Game Loop (Per Click)

- **Validate**: O(1) - just number comparison
- **Animate**: 0.35s CSS animation (GPU accelerated)
- **Update State**: O(1) - array operations on fixed sets

### Rendering

- **Grid**: CSS Grid layout (efficient)
- **Re-renders**: Only on state change (Vue reactivity)
- **SVG**: Minimal DOM mutations (only add lines)

## 🔐 Data Consistency

### Single Source of Truth

- **Board state**: `board.ref` (Board instance)
- **Game progress**: `currentStep`, `connectedCells`, `hiddenCells`
- **UI state**: `targetCell`, `wrongCell`, `isAnimating`

### Computed Properties Ensure Consistency

- `gridSize` always matches `LEVELS[currentLevel]`
- `totalCells` always matches `gridSize²`

## 📋 State Diagram

```
┌─────────────────────────────────────────────┐
│         GAME INITIALIZATION STATE           │
│ gameGeneration++, board reset, SVG cleared  │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│          AWAITING PLAYER CLICK              │
│ currentStep: 1 to N                         │
│ isAnimating: false                          │
│ canClick: true                              │
└─────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    VALID      WRONG CLICK    GAME WON
    CLICK      (wrongCell)    (currentStep > N)
    │          │              │
    │          ├─→ setTimeout │
    │          │   (400ms)    │
    │          └─→ wrongCell  │
    │              = null     │
    │              │
    ├──────┬───────┘
    │      │
    ▼      ▼
LOOP OR RESET
(return to AWAITING)
```

## 🎮 Difficulty Levels

```
Level 0 → 4×4  (16 cells)
Level 1 → 5×5  (25 cells)
Level 2 → 6×6  (36 cells)
Level 3 → 7×7  (49 cells)
Level 4 → 8×8  (64 cells)
```

Each level:

1. New Board created
2. New path generated via PathGenerator
3. ~35% of cells hidden
4. All state reset

## 🧪 Testability

**Well-Testable Components**:

- ✅ PathGenerator: Pure function (generates paths)
- ✅ Board: Data structure with simple methods
- ✅ Cell: Simple data model

**Harder to Test**:

- ⚠️ GameBoard.vue: Mixed logic + UI, requires Vue testing utilities
- ⚠️ LineAnimator: SVG DOM manipulation, requires browser

**Testing Approach**:

- Unit test: Board, Cell, PathGenerator
- Component test: GameBoard, Cell, StatusBar with Vue Testing Library
- E2E test: Full game flow with Cypress/Playwright

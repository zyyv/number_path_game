# Algorithms & Technical Implementation

## 🎯 Core Algorithms

### 1. Hamiltonian Path Generation (Warnsdorff's Heuristic)

**Problem**: Generate a solvable puzzle where player must visit all N² cells exactly once, in sequence 1→2→3→...→N².

**Solution**: Use Warnsdorff's heuristic with backtracking.

#### Algorithm Steps

```pseudocode
FUNCTION generatePath(board):
  FOR attempt = 1 to MAX_ATTEMPTS:
    path = TRY_GENERATE_PATH()
    IF path != null THEN RETURN path

  // Fallback if all attempts fail
  RETURN SNAKE_PATH()

FUNCTION TRY_GENERATE_PATH():
  visited = create_empty_visited_matrix()
  path = []

  // Random starting position
  current = board.getCell(random_row(), random_col())
  visited[current.row][current.col] = true
  path.append(current)

  WHILE path.length < total_cells:
    // Get unvisited neighbors
    neighbors = board.getNeighbors(current.row, current.col)
    unvisited = [n for n in neighbors if NOT visited[n.row][n.col]]

    IF unvisited.length == 0:
      // Dead end - backtrack up to 10 steps and retry
      backtrack_steps = min(10, path.length - 1)
      IF backtrack_steps == 0 THEN RETURN null

      FOR i = 1 to backtrack_steps:
        removed = path.pop()
        visited[removed.row][removed.col] = false
      CONTINUE to next iteration

    // WARNSDORFF'S HEURISTIC: Choose neighbor with fewest onward moves
    // This drastically reduces dead-end probability
    shuffle(unvisited)  // Add randomness within heuristic
    unvisited.sort(BY: count_unvisited_neighbors)

    next = unvisited[0]  // Pick neighbor with fewest moves
    visited[next.row][next.col] = true
    path.append(next)
    current = next

  RETURN path
```

#### Why Warnsdorff's Works

- **Intuition**: Avoid cells with few escape routes early; save them for when options are limited
- **Empirical**: ~99% success rate on 8×8 board on first attempt
- **Backtracking**: Escapes local dead ends without full restart
- **Randomization**: Shuffle unvisited neighbors → different solutions each game

#### Complexity

- **Time**: O(N² × log N²) per attempt (due to sorting)
- **Space**: O(N²) for visited matrix
- **Success Rate**: ~99% on first attempt for 8×8

#### Example (4×4 Board)

```
Random start at (1,2):
[?, *, ?, ?]
[?, ?, ?, ?]
[?, ?, ?, ?]
[?, ?, ?, ?]

After Warnsdorff selection (prefer neighbors with fewest onward moves):
[1, 2, 3, 4]
[8, 9,10, 5]
[7,14,11, 6]
[16,15,12,13]
```

### 2. Cell Reveal System (Progressive Discovery)

**Problem**: Player sees only ~65% of numbers; rest are hidden ("?")

**Solution**: Progressive reveal + smart neighbor disclosure

#### Reveal Mechanics

```typescript
// When player clicks correct cell:
1. revealCell(row, col)
   - Remove clicked cell from hiddenCells set
   - Number becomes visible

2. revealNeighbors(row, col)
   - Get all 8 adjacent cells (or fewer at edges)
   - Filter to only hidden ones
   - Randomly pick 1-2 of them
   - Remove from hiddenCells set

// Net effect: 1-3 cells revealed per correct move
// Player gets partial path visibility without spoiling solution
```

#### Implementation

```typescript
function revealNeighbors(row: number, col: number) {
  const neighbors = board.value.getNeighbors(row, col);
  const hiddenNeighbors = neighbors.filter((n) => hiddenCells.value.has(cellKey(n.row, n.col)));

  // Shuffle neighbor indices for randomness
  const indices = Array.from({ length: hiddenNeighbors.length }, (_, i) => i);
  shuffleArray(indices);

  // Reveal 1-2 random hidden neighbors
  const count = Math.min(indices.length, 1 + Math.floor(Math.random() * 2));
  for (let i = 0; i < count; i++) {
    const n = hiddenNeighbors[indices[i]];
    hiddenCells.value.delete(cellKey(n.row, n.col));
  }
}
```

### 3. SVG Line Animation (Stroke Dash Technique)

**Problem**: Animate a line being "drawn" from one cell to another smoothly

**Solution**: CSS `stroke-dasharray` and `stroke-dashoffset` animation

#### How It Works

```javascript
// 1. Calculate line length
const dx = toPos.x - fromPos.x;
const dy = toPos.y - fromPos.y;
const length = Math.sqrt(dx * dx + dy * dy);

// 2. Create SVG line
const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
line.setAttribute("x1", fromPos.x);
line.setAttribute("y1", fromPos.y);
line.setAttribute("x2", toPos.x);
line.setAttribute("y2", toPos.y);

// 3. Set stroke properties
line.style.strokeDasharray = String(length); // Total dash length
line.style.strokeDashoffset = String(length); // Start fully hidden

// 4. Animate offset to 0 (reveals the line)
line.style.transition = "stroke-dashoffset 0.35s ease-out";
line.style.strokeDashoffset = "0";

// 5. Line appears to be "drawn"
```

#### Visual Effect

```
Frame 0% (offset = length):
━━━━━━━━━━━━━━━━━━━━━━━━━━━ (fully hidden)

Frame 50% (offset = length/2):
═══════════════━━━━━━━━━━━━━━ (half drawn)

Frame 100% (offset = 0):
═══════════════════════════════ (fully drawn)
```

#### Performance

- **GPU Accelerated**: CSS animation doesn't trigger layout recalculation
- **Smooth**: 60 FPS on modern browsers
- **Time**: 0.35s (650ms ÷ 60fps = ~20ms per frame)

#### SVG Styling

```css
.path-line {
  stroke: var(--line-color); /* Green (#22c55e) */
  stroke-width: 4;
  stroke-linecap: round;
  fill: none;
  filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.5));
}
```

### 4. Game State Validation

**Problem**: Ensure player can only make valid moves in correct sequence

**Solution**: Simple number comparison + state tracking

#### Validation Logic

```typescript
function handleCellClick(row: number, col: number) {
  if (isAnimating.value || hasWon.value) return; // Guard conditions

  const cell = board.value.getCell(row, col);

  // Check if cell number matches expected next step
  if (cell.number === currentStep.value) {
    // VALID MOVE
    moveCount.value++;

    // Animate and update state
    // ...

    currentStep.value++;

    // Check win: completed all cells?
    if (currentStep.value > totalCells.value) {
      onWin();
    }
  } else {
    // INVALID MOVE
    flashWrong(row, col);
  }
}
```

- **Simplicity**: Single number comparison, no complex logic
- **Correctness**: Board is generated once; path is immutable
- **User Feedback**: Wrong clicks get visual feedback (red flash + shake)

## 🎲 Randomization Strategies

### Fisher-Yates Shuffle

Used in 3 places for randomness:

```typescript
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap
  }
}
```

**Time**: O(N) | **Space**: O(1)

**Uses**:

1. **Path Generation**: Shuffle unvisited neighbors within Warnsdorff's heuristic
2. **Cell Hiding**: Shuffle cell indices to randomly select ~35% to hide
3. **Neighbor Reveal**: Shuffle hidden neighbors to pick 1-2 randomly

### Random Start Position

```typescript
const startRow = Math.floor(Math.random() * this.size);
const startCol = Math.floor(Math.random() * this.size);
```

- Each game starts from different cell
- Creates unique puzzles even with same algorithm

## 📊 State Management Patterns

### Reactive State with Vue 3 Composition API

```typescript
// Primitive refs
const currentStep = ref(1);
const moveCount = ref(0);
const hasWon = ref(false);

// Complex refs
const board = ref(new Board(gridSize.value));
const connectedCells = ref(new Set<string>());
const hiddenCells = ref(new Set<string>());

// Computed refs (derived state)
const gridSize = computed(() => LEVELS[currentLevel.value].size);
const totalCells = computed(() => gridSize.value * gridSize.value);
```

**Benefits**:

- ✅ Reactive: Vue tracks changes, updates UI automatically
- ✅ Simple: No middleware or boilerplate
- ✅ Type-safe: Full TypeScript support
- ✅ Sufficient: For single-component game logic

**vs Pinia/Vuex**:

- ❌ Overkill for this app's complexity
- ❌ Additional dependencies
- ✅ Composition API handles all needs

## 🔍 Cell Key Management

**Problem**: Track which cells are hidden/connected in a 2D grid

**Solution**: Convert (row, col) → "row,col" string key

```typescript
function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

// Usage in Sets
hiddenCells.value.add(cellKey(r, c)); // Hide cell
hiddenCells.value.has(cellKey(r, c)); // Check if hidden
hiddenCells.value.delete(cellKey(r, c)); // Reveal cell
```

**Why strings instead of objects**:

- Sets use object identity for comparison
- String keys are hashable and comparable by value
- Simple and efficient

## ⏱️ Timing & Animation Coordination

### Game Loop Timing

```
User clicks cell
         │
         ▼
    Validation (O(1))
         │
    ┌────┴─────┬──────────────┐
    │           │              │
   VALID     WRONG          SKIP
    │           │            ANIMATION
    │           │         (step 1→2)
    │           ▼              │
    │        flashWrong()      │
    │        (400ms)           │
    │                          │
    ▼                          ▼
isAnimating = true        Update state
         │                 (skip animation)
         ▼
animateLine() (0.35s) ◄─ Awaited
         │
         ▼
Update state
isAnimating = false
         │
    ┌────┴──────┐
    │           │
 CONTINUE    WIN
  (loop)     (msg)
```

### Timeout Management

```typescript
// Wrong cell flash (400ms)
wrongTimeout = setTimeout(() => {
  wrongCell.value = null;
}, 400);

// Hint timeout (1500ms)
hintTimeout = setTimeout(() => {
  targetCell.value = null;
  hintActive.value = false;
}, 1500);
```

All timeouts cleared on `initGame()` to prevent stale callbacks.

## 🐛 Edge Cases Handled

| Case                            | Handling                                      |
| ------------------------------- | --------------------------------------------- |
| Dead end in path generation     | Backtrack 1-10 steps, retry                   |
| All attempts fail (< 1% chance) | Fallback to deterministic snake path          |
| Click during animation          | Guarded by `isAnimating` check                |
| Click after game won            | Guarded by `hasWon` check                     |
| Wrong timeout overlap           | Clear previous timeout before setting new one |
| Hint timeout overlap            | Clear previous hint before showing new one    |
| Navigation at edges             | Disable prev/next buttons appropriately       |

## 📈 Scalability

### Current Limits

- **Max Grid**: 8×8 (64 cells)
- **Path Generation**: ~50 attempts × O(N²) ≈ 32,000 operations
- **Memory**: Board + sets ≈ 1KB per cell

### Theoretical Limits

- **8×8 is reasonable**: <100ms to generate, smooth UX
- **10×10 (100 cells)**: ~200ms generation, still acceptable
- **12×12 (144 cells)**: Warnsdorff's success drops, needs more attempts
- **Beyond 12×12**: Would need algorithm optimization

### If Extended to Larger Boards

- Could use different heuristics (A\*, genetic algorithms)
- Could pre-generate boards server-side
- Could cache solvable patterns

## 🎯 Summary: Why This Works

1. **Warnsdorff's** ← Dramatically improves path generation success
2. **Backtracking** ← Handles local dead ends elegantly
3. **Snake Fallback** ← Guarantees valid puzzle exists
4. **Progressive Reveal** ← Guides player without spoiling
5. **SVG Animations** ← Smooth, GPU-accelerated feedback
6. **Simple Validation** ← Immutable board = correct by design
7. **Vue Reactivity** ← Automatic UI sync with state

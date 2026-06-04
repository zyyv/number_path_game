<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Board } from "../board";
import { PathGenerator } from "../path-generator";
import { LineAnimator } from "../line-animator";
import CellComponent from "./Cell.vue";
import StatusBar from "./StatusBar.vue";

const LEVELS = [
  { size: 4, label: "4×4", hideRatio: 0.2, maxConsec: 2 },
  { size: 5, label: "5×5", hideRatio: 0.3, maxConsec: 2 },
  { size: 6, label: "6×6", hideRatio: 0.4, maxConsec: 3 },
  { size: 7, label: "7×7", hideRatio: 0.5, maxConsec: 4 },
  { size: 8, label: "8×8", hideRatio: 0.55, maxConsec: 5 },
  { size: 9, label: "9×9", hideRatio: 0.6, maxConsec: 6 },
  { size: 10, label: "10×10", hideRatio: 0.65, maxConsec: 7 },
];

const MAX_CELL_SIZE = 60;
const GAP = 4;

const viewportWidth = ref(typeof window !== "undefined" ? window.innerWidth : 400);

const cellSize = computed(() => {
  // Match the CSS media query breakpoint: ≤480px uses 8px side padding, else 16px
  const sidePadding = viewportWidth.value <= 480 ? 16 : 32;
  const available = viewportWidth.value - sidePadding;
  const max = Math.floor((available - (gridSize.value - 1) * GAP) / gridSize.value);
  return Math.min(MAX_CELL_SIZE, Math.max(28, max));
});

function readLevelFromUrl(): number {
  const params = new URLSearchParams(window.location.search);
  const n = parseInt(params.get("level") ?? "", 10);
  if (!isNaN(n) && n >= 1 && n <= LEVELS.length) return n - 1;
  return 0;
}

function syncLevelToUrl(level: number) {
  const params = new URLSearchParams(window.location.search);
  params.set("level", String(level + 1));
  history.pushState(null, "", `?${params.toString()}`);
}

const currentLevel = ref(readLevelFromUrl());
const gridSize = computed(() => LEVELS[currentLevel.value].size);
const totalCells = computed(() => gridSize.value * gridSize.value);
const board = ref(new Board(gridSize.value));
const currentStep = ref(1);
const moveCount = ref(0);
const hasWon = ref(false);
const gameStarted = ref(false);
const elapsed = ref("0.0");
const isAnimating = ref(false);
const connectedCells = ref(new Set<string>());
const hiddenCells = ref(new Set<string>());
const targetCell = ref<{ row: number; col: number } | null>(null);
const wrongCell = ref<{ row: number; col: number } | null>(null);
const hintActive = ref(false);

let lineAnimator: LineAnimator | null = null;
let startTime = 0;
let gameGeneration = 0;
let wrongTimeout: ReturnType<typeof setTimeout> | null = null;

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function shuffleArray(arr: number[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function initGame() {
  gameGeneration++;

  if (wrongTimeout !== null) {
    clearTimeout(wrongTimeout);
    wrongTimeout = null;
  }

  if (hintTimeout !== null) {
    clearTimeout(hintTimeout);
    hintTimeout = null;
  }

  if (lineAnimator) {
    lineAnimator.clear();
  }

  const size = gridSize.value;
  const newBoard = new Board(size);
  const generator = new PathGenerator(newBoard);
  generator.generate();

  board.value = newBoard;
  currentStep.value = 1;
  moveCount.value = 0;
  hasWon.value = false;
  gameStarted.value = false;
  elapsed.value = "0.0";
  isAnimating.value = false;
  connectedCells.value = new Set();
  wrongCell.value = null;
  targetCell.value = null;
  hintActive.value = false;
  startTime = 0;

  // 按路径顺序隐藏格子，限制连续隐藏数以避免死局
  const { hideRatio, maxConsec } = LEVELS[currentLevel.value];
  const total = size * size;

  // 构建路径顺序数组：path[i] 是第 i+1 个数字所在格子
  const path: { row: number; col: number }[] = [];
  for (let num = 1; num <= total; num++) {
    const c = newBoard.findCellByNumber(num)!;
    path.push({ row: c.row, col: c.col });
  }

  // 候选位置：排除首尾（格子 #1 和 #N 始终可见）
  const candidates = Array.from({ length: total - 2 }, (_, i) => i + 1);
  shuffleArray(candidates);

  const targetHide = Math.floor(total * hideRatio);
  const hidden = new Set<string>();

  for (const pos of candidates) {
    if (hidden.size >= targetHide) break;

    // 统计如果隐藏此位置，连续隐藏长度会是多少
    let before = 0;
    for (let p = pos - 1; p >= 0 && hidden.has(cellKey(path[p].row, path[p].col)); p--) before++;
    let after = 0;
    for (let p = pos + 1; p < total && hidden.has(cellKey(path[p].row, path[p].col)); p++) after++;

    if (before + 1 + after <= maxConsec) {
      hidden.add(cellKey(path[pos].row, path[pos].col));
    }
  }

  hiddenCells.value = hidden;

  nextTick(() => {
    setupSvg();
  });
}

function setupSvg() {
  const svg = document.querySelector(".board-svg") as SVGSVGElement;
  if (svg) {
    lineAnimator = new LineAnimator(svg, cellSize.value, GAP);
  }
}

function handleResize() {
  viewportWidth.value = window.innerWidth;
}

watch(cellSize, () => {
  if (lineAnimator) lineAnimator.clear();
  nextTick(() => setupSvg());
});

watch(currentLevel, (lvl) => syncLevelToUrl(lvl));

function handlePopState() {
  const lvl = readLevelFromUrl();
  if (lvl !== currentLevel.value) {
    currentLevel.value = lvl;
    initGame();
  }
}

function revealCell(row: number, col: number) {
  hiddenCells.value.delete(cellKey(row, col));
}

async function handleCellClick(row: number, col: number) {
  if (isAnimating.value || hasWon.value) return;
  if (connectedCells.value.has(cellKey(row, col))) return;

  const cell = board.value.getCell(row, col);

  if (!gameStarted.value && cell.number !== currentStep.value) return;

  if (cell.number === currentStep.value) {
    moveCount.value++;

    revealCell(row, col);

    if (currentStep.value === 1) {
      gameStarted.value = true;
      startTime = Date.now();
      connectedCells.value.add(cellKey(row, col));
      currentStep.value = 2;
      targetCell.value = null;
      return;
    }

    const prevCell = board.value.findCellByNumber(currentStep.value - 1);
    if (!prevCell || !lineAnimator) return;

    isAnimating.value = true;
    const gen = gameGeneration;

    await lineAnimator.animateLine(prevCell, cell);

    if (gen !== gameGeneration) return;

    connectedCells.value.add(cellKey(row, col));

    currentStep.value++;
    isAnimating.value = false;

    if (currentStep.value > totalCells.value) {
      onWin();
    } else {
      targetCell.value = null;
    }
  } else {
    moveCount.value++;
    flashWrong(row, col);
  }
}

function flashWrong(row: number, col: number) {
  if (wrongTimeout !== null) {
    clearTimeout(wrongTimeout);
  }
  wrongCell.value = { row, col };
  wrongTimeout = setTimeout(() => {
    wrongCell.value = null;
    wrongTimeout = null;
  }, 400);
}

function onWin() {
  hasWon.value = true;
  elapsed.value = ((Date.now() - startTime) / 1000).toFixed(1);
  targetCell.value = null;
}

let hintTimeout: ReturnType<typeof setTimeout> | null = null;

function showHint() {
  if (hasWon.value || isAnimating.value) return;

  // 清除之前的提示定时器
  if (hintTimeout !== null) {
    clearTimeout(hintTimeout);
    hintTimeout = null;
  }

  const next = board.value.findCellByNumber(currentStep.value);
  if (next) {
    targetCell.value = { row: next.row, col: next.col };
    hintActive.value = true;

    hintTimeout = setTimeout(() => {
      targetCell.value = null;
      hintActive.value = false;
      hintTimeout = null;
    }, 1500);
  }
}

function nextLevel() {
  if (currentLevel.value < LEVELS.length - 1) {
    currentLevel.value++;
    initGame();
  }
}

function prevLevel() {
  if (currentLevel.value > 0) {
    currentLevel.value--;
    initGame();
  }
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
  window.addEventListener("popstate", handlePopState);
  syncLevelToUrl(currentLevel.value);
  initGame();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("popstate", handlePopState);
});

const totalSize = computed(() => gridSize.value * cellSize.value + (gridSize.value - 1) * GAP);
</script>

<template>
  <div class="game-wrapper">
    <div class="level-controls">
      <button class="level-btn" :disabled="currentLevel === 0" @click="prevLevel">◀</button>
      <span class="level-label">
        关卡 {{ currentLevel + 1 }} / {{ LEVELS.length }} ({{ LEVELS[currentLevel].label }})
      </span>
      <button class="level-btn" :disabled="currentLevel === LEVELS.length - 1" @click="nextLevel">
        ▶
      </button>
    </div>

    <div
      class="board"
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
        gap: `${GAP}px`,
        position: 'relative',
        '--cell-size': `${cellSize}px`,
      }"
    >
      <template v-for="r in gridSize" :key="r">
        <CellComponent
          v-for="c in gridSize"
          :key="`${r - 1},${c - 1}`"
          v-memo="[
            connectedCells.has(cellKey(r - 1, c - 1)),
            targetCell?.row === r - 1 && targetCell?.col === c - 1,
            wrongCell?.row === r - 1 && wrongCell?.col === c - 1,
            hiddenCells.has(cellKey(r - 1, c - 1)),
            !gameStarted && board.getCell(r - 1, c - 1).number === 1,
          ]"
          :number="board.getCell(r - 1, c - 1).number"
          :is-connected="connectedCells.has(cellKey(r - 1, c - 1))"
          :is-target="targetCell?.row === r - 1 && targetCell?.col === c - 1"
          :is-wrong="wrongCell?.row === r - 1 && wrongCell?.col === c - 1"
          :is-hidden="hiddenCells.has(cellKey(r - 1, c - 1))"
          :is-start="!gameStarted && board.getCell(r - 1, c - 1).number === 1"
          @click="handleCellClick(r - 1, c - 1)"
        />
      </template>
      <svg
        class="board-svg"
        :width="totalSize"
        :height="totalSize"
        :style="{
          position: 'absolute',
          top: '0',
          left: '0',
          pointerEvents: 'none',
          zIndex: 2,
        }"
      />
    </div>

    <StatusBar
      :current-step="currentStep"
      :move-count="moveCount"
      :has-won="hasWon"
      :elapsed="elapsed"
    />

    <div class="button-row">
      <button class="restart-btn" @click="initGame">重新开始</button>
      <button class="hint-btn" :disabled="hasWon || hintActive" @click="showHint">💡 提示</button>
      <button v-if="hasWon && currentLevel < LEVELS.length - 1" class="next-btn" @click="nextLevel">
        下一关 ▶
      </button>
    </div>
  </div>
</template>

<style scoped>
.game-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.level-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.level-btn {
  padding: 6px 14px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.15s;
}

.level-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

@media (hover: hover) and (pointer: fine) {
  .level-btn:not(:disabled):hover {
    filter: brightness(1.1);
    transform: scale(1.08);
  }
}

.level-label {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h);
}

.board {
  user-select: none;
}

.button-row {
  display: flex;
  gap: 12px;
}

.restart-btn,
.hint-btn,
.next-btn {
  margin-top: 8px;
  padding: 10px 28px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.15s;
}

.restart-btn {
  background: var(--accent);
}

.hint-btn {
  background: #f59e0b;
}

.hint-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.next-btn {
  background: #10b981;
}

@media (hover: hover) and (pointer: fine) {
  .restart-btn:hover,
  .hint-btn:not(:disabled):hover,
  .next-btn:hover {
    filter: brightness(1.1);
    transform: scale(1.04);
  }
}

.restart-btn:active,
.hint-btn:not(:disabled):active,
.next-btn:active {
  transform: scale(0.97);
}
</style>

<script setup lang="ts">
defineProps<{
  number: number;
  isConnected: boolean;
  isTarget: boolean;
  isWrong: boolean;
  isHidden: boolean;
  isStart: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<template>
  <div
    class="cell"
    :class="{
      connected: isConnected,
      target: isTarget,
      wrong: isWrong,
      hidden: isHidden && !isConnected && !isWrong && !isTarget,
      start: isStart && !isConnected,
    }"
    @click="$emit('click')"
  >
    {{ isHidden && !isConnected ? "?" : number }}
  </div>
</template>

<style scoped>
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--cell-size, 60px);
  height: var(--cell-size, 60px);
  background: var(--cell-bg);
  border-radius: 8px;
  font-family: var(--mono);
  font-size: clamp(9px, calc(var(--cell-size, 60px) * 0.3), 20px);
  font-weight: 600;
  color: var(--text-h);
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  transition:
    background 0.25s,
    color 0.25s,
    transform 0.15s,
    box-shadow 0.25s;
}

@media (hover: hover) and (pointer: fine) {
  .cell:hover {
    transform: scale(1.08);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    z-index: 1;
  }
}

.cell.connected {
  background: var(--cell-connected);
  color: var(--cell-connected-text);
  cursor: default;
}

.cell.target {
  background: var(--cell-target);
  color: #000;
  animation: pulse 1.2s ease-in-out infinite;
}

.cell.wrong {
  animation: shake 0.4s ease;
  background: var(--cell-wrong);
  color: #fff;
}

.cell.hidden {
  background: var(--cell-hidden);
  color: var(--cell-hidden-text);
  font-style: italic;
}

.cell.start {
  background: #fbbf24;
  color: #000;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.5);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(251, 191, 36, 0);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-4px);
  }
  40% {
    transform: translateX(4px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
}
</style>

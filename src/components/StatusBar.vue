<script setup lang="ts">
defineProps<{
  currentStep: number;
  moveCount: number;
  hasWon: boolean;
  elapsed: string;
}>();
</script>

<template>
  <div class="status" :class="{ win: hasWon }">
    <template v-if="hasWon">
      🎉 恭喜通关！用了 <span class="num">{{ moveCount }}</span> 步，耗时
      <span class="num">{{ elapsed }}</span> 秒
    </template>
    <template v-else>
      <span
        ><span class="label">下一步</span> <span class="num">{{ currentStep }}</span></span
      >
      <span
        ><span class="label">步数</span> <span class="num">{{ moveCount }}</span></span
      >
    </template>
  </div>
</template>

<style scoped>
.status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  min-height: 22px;
}

.status.win {
  justify-content: center;
  color: var(--cell-connected);
  font-size: 16px;
  font-weight: 700;
  animation: fadeIn 0.6s ease;
}

.label {
  color: var(--text);
}

.num {
  color: var(--accent);
  font-weight: 700;
  font-family: var(--mono);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

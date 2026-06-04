<script setup lang="ts">
import GameBoard from "./components/GameBoard.vue";
</script>

<template>
  <div class="app">
    <h1 class="title">数字路径游戏</h1>
    <p class="subtitle">沿着路径从 1 开始依次连线</p>
    <GameBoard />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  /* padding: 32px 16px; */
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-h);
  margin: 0;
}

.subtitle {
  font-size: 16px;
  color: var(--text);
  margin: 0 0 16px;
}
</style>

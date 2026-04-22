<template>
  <router-view />
  <div v-if="uiStore.isLoading" class="global-loading-overlay">
    <a-spin size="large" tip="加载中..." />
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, watchEffect } from 'vue';
import { useBreakpoint } from './composables/useBreakpoint';
import { useUiStore } from './stores/uiStore';

const uiStore = useUiStore();
const { shouldUseMobileLayout } = useBreakpoint();

watchEffect(() => {
  if (typeof document === 'undefined') {
    return;
  }

  document.body.classList.toggle('is-mobile', shouldUseMobileLayout.value);
});

onUnmounted(() => {
  if (typeof document === 'undefined') {
    return;
  }

  document.body.classList.remove('is-mobile');
});
</script>

<style>
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

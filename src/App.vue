<template>
  <router-view />
  <div v-if="uiStore.isLoading" class="route-progress" role="progressbar" aria-label="页面加载中" />
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
.route-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, transparent, #1677ff, transparent);
  background-size: 50% 100%;
  background-repeat: no-repeat;
  animation: route-progress 1s ease-in-out infinite;
  pointer-events: none;
  z-index: 9999;
}

@keyframes route-progress {
  from { background-position: -100% 0; }
  to { background-position: 200% 0; }
}
</style>

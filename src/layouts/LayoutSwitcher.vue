<template>
  <MobileLayout v-if="isMobile" />
  <DefaultLayout v-else />
</template>

<script setup lang="ts">
import { useBreakpoint } from '../composables/useBreakpoint';
import DefaultLayout from './Default.vue';
import MobileLayout from './MobileLayout.vue';

const { isMobile } = useBreakpoint();
</script>

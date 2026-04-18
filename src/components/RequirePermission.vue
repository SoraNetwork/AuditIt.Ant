<template>
  <slot v-if="allowed" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../stores/authStore';

const props = withDefaults(defineProps<{
  anyOf?: string[];
  allOf?: string[];
}>(), {
  anyOf: () => [],
  allOf: () => [],
});

const authStore = useAuthStore();

const allowed = computed(() => {
  const anyOk = props.anyOf.length === 0 || authStore.hasAnyPermission(props.anyOf);
  const allOk = props.allOf.length === 0 || authStore.hasAllPermissions(props.allOf);
  return anyOk && allOk;
});
</script>

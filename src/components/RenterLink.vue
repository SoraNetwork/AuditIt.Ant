<template>
  <router-link
    v-if="renterId"
    class="renter-link"
    :to="{ name: 'renter-detail', params: { id: renterId } }"
    @click.stop
  >
    {{ label }}
  </router-link>
  <span v-else>{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  renterId?: string | null;
  name?: string | null;
  fallback?: string;
}>(), {
  fallback: '-',
});

const label = computed(() => props.name?.trim() || props.renterId || props.fallback);
</script>

<style scoped>
.renter-link {
  font-weight: 500;
}
</style>

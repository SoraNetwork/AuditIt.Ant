<template>
  <span>
    <template v-for="(part, index) in parts" :key="`${part.text}-${index}`">
      <a
        v-if="part.rentalNumber"
        class="rental-link"
        @click.stop.prevent="openRental(part.rentalNumber)"
      >
        {{ part.text }}
      </a>
      <span v-else>{{ part.text }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRentalStore } from '../stores/rentalStore';

const props = defineProps<{
  text?: string | null;
}>();

const router = useRouter();
const rentalStore = useRentalStore();
// Renewal rentals append a sequence, e.g. R20260601-0001-01.
// Keep the suffix in the link so it cannot resolve to the source rental.
const rentalNumberRegex = /R\d{8}-?\d{4}(?:-\d+)?/g;

const parts = computed(() => {
  const value = props.text || '-';
  const result: Array<{ text: string; rentalNumber?: string }> = [];
  let lastIndex = 0;

  for (const match of value.matchAll(rentalNumberRegex)) {
    const text = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      result.push({ text: value.slice(lastIndex, index) });
    }
    result.push({ text, rentalNumber: text });
    lastIndex = index + text.length;
  }

  if (lastIndex < value.length) {
    result.push({ text: value.slice(lastIndex) });
  }

  return result.length > 0 ? result : [{ text: value }];
});

const openRental = async (rentalNumber: string) => {
  await rentalStore.fetchRentals({ rentalNumber, page: 1, pageSize: 20 });
  const matched = rentalStore.rentals.find(rental => rental.rentalNumber === rentalNumber);
  if (matched) {
    await router.push(`/rentals/${matched.id}`);
    return;
  }

  await router.push({ path: '/rentals', query: { rentalNumber } });
};
</script>

<style scoped>
.rental-link {
  color: #1677ff;
  cursor: pointer;
}

.rental-link:hover {
  color: #4096ff;
  text-decoration: underline;
}
</style>

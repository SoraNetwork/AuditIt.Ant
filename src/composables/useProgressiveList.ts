import { computed, ref, watch, type Ref } from 'vue';

export function useProgressiveList<T>(source: Readonly<Ref<T[]>>, pageSize = 20) {
  const limit = ref(pageSize);
  const visibleItems = computed(() => source.value.slice(0, limit.value));
  const hasMore = computed(() => limit.value < source.value.length);
  const loadMore = () => { limit.value += pageSize; };
  watch(source, () => { limit.value = pageSize; });
  return { visibleItems, hasMore, loadMore };
}

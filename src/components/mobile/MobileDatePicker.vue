<template>
  <input
    v-if="isMobile"
    v-bind="$attrs"
    class="mobile-date-picker ant-input"
    type="date"
    :value="value?.format('YYYY-MM-DD') ?? ''"
    :disabled="disabled"
    :aria-label="placeholder"
    @change="onChange"
  />
  <a-date-picker
    v-else
    v-bind="$attrs"
    :value="value"
    :disabled="disabled"
    :placeholder="placeholder"
    :allow-clear="allowClear"
    @update:value="emit('update:value', $event)"
  />
</template>

<script setup lang="ts">
import dayjs, { type Dayjs } from 'dayjs';
import { useBreakpoint } from '../../composables/useBreakpoint';
defineOptions({ inheritAttrs: false });
defineProps<{ value?: Dayjs | null; disabled?: boolean; placeholder?: string; allowClear?: boolean }>();
const emit = defineEmits<{ 'update:value': [value: Dayjs | null] }>();
const { shouldUseMobileLayout: isMobile } = useBreakpoint();
function onChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit('update:value', value ? dayjs(value) : null);
}
</script>

<style scoped>
.mobile-date-picker {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 8px 12px;
  color: inherit;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font: inherit;
}
</style>

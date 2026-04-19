<template>
  <div
    class="mobile-list-card"
    :class="{ clickable, active }"
    @click="onClick"
  >
    <div v-if="$slots.title || $slots.tags" class="card-header">
      <div class="card-title"><slot name="title" /></div>
      <div v-if="$slots.tags" class="card-tags"><slot name="tags" /></div>
    </div>
    <div v-if="$slots.subtitle" class="card-subtitle"><slot name="subtitle" /></div>
    <div v-if="$slots.meta" class="card-meta"><slot name="meta" /></div>
    <div v-if="$slots.footer" class="card-footer"><slot name="footer" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  clickable?: boolean;
  active?: boolean;
}>();

const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>();

function onClick(ev: MouseEvent) {
  emit('click', ev);
}
</script>

<style scoped>
.mobile-list-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #f0f0f0;
  transition: background 0.15s;
}

.mobile-list-card.clickable {
  cursor: pointer;
}

.mobile-list-card.clickable:active {
  background: #fafafa;
}

.mobile-list-card.active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
  flex: 1;
  word-break: break-all;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-shrink: 0;
}

.card-subtitle {
  font-size: 13px;
  color: #595959;
  margin-bottom: 6px;
}

.card-meta {
  font-size: 12px;
  color: #8c8c8c;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-meta :deep(> div) {
  line-height: 1.6;
}

.card-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>

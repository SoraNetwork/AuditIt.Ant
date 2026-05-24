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
  padding: 13px 14px;
  margin-bottom: 0;
  border: 1px solid #e8edf3;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.mobile-list-card.clickable {
  cursor: pointer;
}

.mobile-list-card.clickable:active {
  transform: scale(0.995);
  background: #fafafa;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.mobile-list-card.active {
  border-color: #91caff;
  background: linear-gradient(180deg, #f0f8ff 0%, #ffffff 100%);
  box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.08), 0 8px 22px rgba(24, 144, 255, 0.1);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  flex: 1;
  line-height: 1.4;
  word-break: break-word;
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
  margin-bottom: 8px;
  line-height: 1.5;
}

.card-meta {
  font-size: 12px;
  color: #8c8c8c;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.card-meta :deep(> div) {
  line-height: 1.6;
  word-break: break-word;
}

.card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-footer :deep(.ant-btn) {
  flex: 1 1 120px;
  min-height: 34px;
  border-radius: 8px;
}
</style>

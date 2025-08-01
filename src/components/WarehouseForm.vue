<template>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="rules"
    layout="vertical"
    name="warehouse_form"
  >
    <a-form-item label="仓库名称" name="name">
      <a-input v-model:value="formState.name" />
    </a-form-item>
    <a-form-item label="位置" name="location">
      <a-input v-model:value="formState.location" />
    </a-form-item>
    <a-form-item label="容量" name="capacity">
      <a-input-number v-model:value="formState.capacity" style="width: 100%" />
    </a-form-item>
    <a-form-item label="描述" name="description">
      <a-textarea v-model:value="formState.description" />
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, toRaw } from 'vue';
import type { PropType } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import type { Warehouse } from '../stores/warehouseStore';

const props = defineProps({
  initialValues: {
    type: Object as PropType<Partial<Warehouse>>,
    default: () => ({}),
  },
});

const formRef = ref<FormInstance>();
const formState = reactive<Partial<Warehouse>>({
  name: '',
  location: '',
  capacity: 0,
  description: '',
});

const rules = {
  name: [{ required: true, message: '请输入仓库名称！' }],
  location: [{ required: true, message: '请输入仓库位置！' }],
};

watch(
  () => props.initialValues,
  (newVal) => {
    if (newVal) {
      Object.assign(formState, newVal);
    }
  },
  { immediate: true, deep: true }
);

const validate = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  return toRaw(formState);
};

defineExpose({
  validate,
});
</script>
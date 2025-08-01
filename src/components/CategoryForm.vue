<template>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="rules"
    layout="vertical"
    name="category_form"
  >
    <a-form-item label="分类名称" name="name">
      <a-input v-model:value="formState.name" />
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
import type { Category } from '../stores/categoryStore';

const props = defineProps({
  initialValues: {
    type: Object as PropType<Partial<Category>>,
    default: () => ({}),
  },
});

const formRef = ref<FormInstance>();
const formState = reactive<Partial<Category>>({
  name: '',
  description: '',
});

const rules = {
  name: [{ required: true, message: '请输入分类名称！' }],
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
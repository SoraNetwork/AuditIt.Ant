<template>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="rules"
    layout="vertical"
    name="item_definition_form"
  >
    <a-form-item label="物品名称" name="name">
      <a-input v-model:value="formState.name" />
    </a-form-item>
    <a-form-item label="分类" name="categoryId">
      <a-select
        v-model:value="formState.categoryId"
        placeholder="请选择一个分类"
        :loading="categoryStore.loading"
      >
        <a-select-option
          v-for="cat in categoryStore.categories"
          :key="cat.id"
          :value="cat.id"
        >
          {{ cat.name }}
        </a-select-option>
      </a-select>
    </a-form-item>
    <a-form-item label="单位" name="unit">
      <a-input v-model:value="formState.unit" />
    </a-form-item>
    <a-form-item label="描述" name="description">
      <a-textarea v-model:value="formState.description" />
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, toRaw } from 'vue';
import type { PropType } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { useCategoryStore } from '../stores/categoryStore';
import type { ItemDefinition } from '../stores/itemDefinitionStore';

const props = defineProps({
  initialValues: {
    type: Object as PropType<Partial<ItemDefinition>>,
    default: () => ({}),
  },
});

const formRef = ref<FormInstance>();
const formState = reactive<Partial<ItemDefinition>>({
  name: '',
  categoryId: undefined,
  unit: '',
  description: '',
});

const categoryStore = useCategoryStore();

const rules = {
  name: [{ required: true, message: '请输入物品名称！' }],
  categoryId: [{ required: true, message: '请选择一个分类！' }],
  unit: [{ required: true, message: '请输入单位！' }],
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

onMounted(() => {
  if (categoryStore.categories.length === 0) {
    categoryStore.fetchCategories();
  }
});

const validateFields = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  return toRaw(formState);
};

const resetFields = () => {
  formRef.value?.resetFields();
};

defineExpose({
  validateFields,
  resetFields,
});
</script>
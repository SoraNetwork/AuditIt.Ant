<template>
  <div>
    <a-table
      :columns="columns"
      :data-source="tableData"
      :loading="itemDefStore.loading || categoryStore.loading"
      row-key="id"
    >
      <template #title>
        <a-row justify="space-between">
          <a-col><h2>物品定义管理</h2></a-col>
          <a-col>
            <a-button type="primary" @click="showAddModal">添加物品定义</a-button>
          </a-col>
        </a-row>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showEditModal(record)">编辑</a>
            <a-popconfirm
              title="您确定要删除这个物品定义吗？"
              @confirm="handleDelete(record.id)"
              ok-text="确定"
              cancel-text="取消"
            >
              <a style="color: red">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="isModalVisible"
      :title="modalTitle"
      :confirm-loading="itemDefStore.loading"
      @ok="handleOk"
      @cancel="handleCancel"
      ok-text="保存"
      cancel-text="取消"
    >
      <ItemDefinitionForm ref="itemDefFormRef" :initial-values="currentItemDef" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useItemDefinitionStore, type ItemDefinition, type CreateItemDefinitionPayload } from '../stores/itemDefinitionStore';
import { useCategoryStore } from '../stores/categoryStore';
import ItemDefinitionForm from '../components/ItemDefinitionForm.vue';
import { message } from 'ant-design-vue';

const itemDefStore = useItemDefinitionStore();
const categoryStore = useCategoryStore();
const itemDefFormRef = ref<InstanceType<typeof ItemDefinitionForm> | null>(null);

const isModalVisible = ref(false);
const editingId = ref<number | null>(null);
const currentItemDef = ref<Partial<ItemDefinition>>({});

const modalTitle = computed(() => (editingId.value !== null ? '编辑物品定义' : '添加物品定义'));

const categoryMap = computed(() => {
  return categoryStore.categories.reduce((map, cat) => {
    map[cat.id] = cat.name;
    return map;
  }, {} as Record<number, string>);
});

const tableData = computed(() => {
  return itemDefStore.itemDefinitions.map(item => ({
    ...item,
    categoryName: categoryMap.value[item.categoryId] || 'N/A',
  }));
});

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '分类', dataIndex: 'categoryName', key: 'category' },
  { title: '单位', dataIndex: 'unit', key: 'unit' },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: '150px' },
];

const showAddModal = () => {
  editingId.value = null;
  currentItemDef.value = { name: '', categoryId: undefined, unit: '', description: '' };
  isModalVisible.value = true;
};

const showEditModal = (itemDef: ItemDefinition) => {
  editingId.value = itemDef.id;
  currentItemDef.value = { ...itemDef };
  isModalVisible.value = true;
};

const handleDelete = async (id: number) => {
  await itemDefStore.deleteItemDefinition(id);
  if (!itemDefStore.error) {
    message.success('物品定义删除成功');
  } else {
    message.error(itemDefStore.error);
  }
};

const handleOk = async () => {
  try {
    const values = await itemDefFormRef.value?.validateFields();
    if (!values) return;

    if (editingId.value !== null) {
      await itemDefStore.updateItemDefinition({ id: editingId.value, ...values });
    } else {
      await itemDefStore.addItemDefinition(values as CreateItemDefinitionPayload);
    }

    if (!itemDefStore.error) {
      message.success(`物品定义${editingId.value !== null ? '更新' : '添加'}成功`);
      isModalVisible.value = false;
    } else {
      message.error(itemDefStore.error);
    }
  } catch (info) {
    console.log('表单校验失败:', info);
    message.error('请检查表单填写是否正确');
  }
};

const handleCancel = () => {
  isModalVisible.value = false;
};

onMounted(() => {
  itemDefStore.fetchItemDefinitions();
  if (categoryStore.categories.length === 0) {
    categoryStore.fetchCategories();
  }
});
</script>
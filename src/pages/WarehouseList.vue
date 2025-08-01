<template>
  <div>
    <!-- Table -->
    <a-table
      :columns="columns"
      :data-source="warehouseStore.warehouses"
      :loading="warehouseStore.loading"
      row-key="id"
    >
      <template #title>
        <a-row justify="space-between">
          <a-col><h2>仓库管理</h2></a-col>
          <a-col>
            <a-button type="primary" @click="showAddModal">添加仓库</a-button>
          </a-col>
        </a-row>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showEditModal(record)">编辑</a>
            <a-popconfirm
              title="您确定要删除这个仓库吗？"
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

    <!-- Modal for Add/Edit -->
    <a-modal
      v-model:open="isModalVisible"
      :title="modalTitle"
      :confirm-loading="warehouseStore.loading"
      @ok="handleOk"
      @cancel="handleCancel"
      ok-text="保存"
      cancel-text="取消"
    >
      <WarehouseForm ref="warehouseFormRef" :initial-values="currentWarehouse" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useWarehouseStore, type Warehouse } from '../stores/warehouseStore';
import WarehouseForm from '../components/WarehouseForm.vue';
import { message } from 'ant-design-vue';

const warehouseStore = useWarehouseStore();
const warehouseFormRef = ref<InstanceType<typeof WarehouseForm> | null>(null);

const isModalVisible = ref(false);
const editingId = ref<string | null>(null);
const currentWarehouse = ref<Partial<Warehouse> | null>(null);

const modalTitle = computed(() => (editingId.value ? '编辑仓库' : '添加仓库'));

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '位置', dataIndex: 'location', key: 'location' },
  { title: '容量', dataIndex: 'capacity', key: 'capacity' },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: '150px' },
];

const showAddModal = () => {
  editingId.value = null;
  currentWarehouse.value = { name: '', location: '', capacity: 100, description: '' };
  isModalVisible.value = true;
};

const showEditModal = (warehouse: Warehouse) => {
  editingId.value = warehouse.id;
  currentWarehouse.value = { ...warehouse };
  isModalVisible.value = true;
};

const handleDelete = async (id: string) => {
  await warehouseStore.deleteWarehouse(id);
  if (!warehouseStore.error) {
    message.success('仓库删除成功');
  } else {
    message.error(warehouseStore.error);
  }
};

const handleOk = async () => {
  try {
    const values = await warehouseFormRef.value?.validate();
    if (!values) return;

    if (editingId.value) {
      await warehouseStore.updateWarehouse({ id: editingId.value, ...values });
    } else {
      await warehouseStore.addWarehouse(values);
    }

    if (!warehouseStore.error) {
      message.success(`仓库${editingId.value ? '更新' : '添加'}成功`);
      isModalVisible.value = false;
    } else {
      message.error(warehouseStore.error);
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
  warehouseStore.fetchWarehouses();
});
</script>
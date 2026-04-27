<template>
  <div>
    <a-table
      v-if="!isMobile"
      :columns="columns"
      :data-source="warehouseStore.warehouses"
      :loading="warehouseStore.loading"
      row-key="id"
    >
      <template #title>
        <a-row justify="space-between">
          <a-col><h2>库房管理</h2></a-col>
          <a-col>
            <a-button type="primary" @click="showAddModal">添加库房</a-button>
          </a-col>
        </a-row>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showEditModal(record)">编辑</a>
            <a-popconfirm
              title="您确定要删除这个库房吗？"
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

    <div v-else>
      <div class="mobile-toolbar admin-mobile-toolbar">
        <div>
          <h2>库房管理</h2>
        </div>
        <a-button type="primary" block @click="showAddModal">添加库房</a-button>
      </div>
      <a-skeleton :loading="warehouseStore.loading" active :paragraph="{ rows: 3 }">
        <div v-if="warehouseStore.warehouses.length > 0" class="mobile-card-list">
          <MobileListCard v-for="wh in warehouseStore.warehouses" :key="wh.id">
            <template #title>{{ wh.name }}</template>
            <template #meta>
              <div v-if="wh.location">位置：{{ wh.location }}</div>
              <div v-if="wh.capacity != null">容量：{{ wh.capacity }}</div>
              <div v-if="wh.description">{{ wh.description }}</div>
              <div v-else>暂无描述</div>
            </template>
            <template #footer>
              <a-button size="small" @click="showEditModal(wh)">编辑</a-button>
              <a-popconfirm
                title="您确定要删除这个库房吗？"
                @confirm="handleDelete(wh.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </template>
          </MobileListCard>
        </div>
        <a-empty v-else description="暂无库房" />
      </a-skeleton>
    </div>

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
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import WarehouseForm from '../components/WarehouseForm.vue';
import { useBreakpoint } from '../composables/useBreakpoint';
import {
  useWarehouseStore,
  type CreateWarehousePayload,
  type Warehouse,
} from '../stores/warehouseStore';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const warehouseStore = useWarehouseStore();
const warehouseFormRef = ref<InstanceType<typeof WarehouseForm> | null>(null);

const isModalVisible = ref(false);
const editingId = ref<number | null>(null);
const currentWarehouse = ref<Partial<Warehouse>>({});

const modalTitle = computed(() =>
  editingId.value !== null ? '编辑库房' : '添加库房'
);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '位置', dataIndex: 'location', key: 'location' },
  { title: '容量', dataIndex: 'capacity', key: 'capacity' },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: '150px' },
];

const showAddModal = () => {
  editingId.value = null;
  currentWarehouse.value = {
    name: '',
    location: '',
    capacity: 100,
    description: '',
  };
  isModalVisible.value = true;
};

const showEditModal = (warehouse: Warehouse) => {
  editingId.value = warehouse.id;
  currentWarehouse.value = { ...warehouse };
  isModalVisible.value = true;
};

const handleDelete = async (id: number) => {
  await warehouseStore.deleteWarehouse(id);
  if (!warehouseStore.error) {
    message.success('库房删除成功');
  } else {
    message.error(warehouseStore.error);
  }
};

const handleOk = async () => {
  try {
    const values = await warehouseFormRef.value?.validate();
    if (!values) return;

    if (editingId.value !== null) {
      await warehouseStore.updateWarehouse({ id: editingId.value, ...values });
    } else {
      await warehouseStore.addWarehouse(values as CreateWarehousePayload);
    }

    if (!warehouseStore.error) {
      message.success(`库房${editingId.value !== null ? '更新' : '添加'}成功`);
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

<style scoped>
.admin-mobile-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-mobile-toolbar h2 {
  margin: 0;
}

</style>

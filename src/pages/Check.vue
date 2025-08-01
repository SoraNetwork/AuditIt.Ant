<template>
  <div>
    <a-page-header title="库存盘点" sub-title="核对仓库实际库存与账面数量" />
    <div class="page-container">
      <a-card>
        <a-form layout="inline" :model="filterState" @finish="loadInventory">
          <a-form-item label="选择仓库">
            <a-select v-model:value="filterState.warehouseId" placeholder="请选择要盘点的仓库" style="width: 250px" @change="loadInventory" allow-clear>
              <a-select-option v-for="wh in warehouseStore.warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="itemStore.loading">开始盘点</a-button>
          </a-form-item>
        </a-form>

        <a-divider />

        <a-table
          :columns="columns"
          :data-source="inventoryData"
          :loading="itemStore.loading"
          row-key="itemDefinitionId"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'actualQuantity'">
              <a-input-number v-model:value="record.actualQuantity" :min="0" />
            </template>
            <template v-if="column.key === 'difference'">
              <a-tag :color="record.difference !== 0 ? 'red' : 'green'">
                {{ record.difference }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemStore } from '../stores/itemStore';
import { useItemDefinitionStore } from '../stores/itemDefinitionStore';

interface InventoryItem {
  itemDefinitionId: string;
  name: string;
  unit: string;
  bookedQuantity: number;
  actualQuantity: number;
  difference: number;
}

const warehouseStore = useWarehouseStore();
const itemStore = useItemStore();
const itemDefStore = useItemDefinitionStore();

const filterState = reactive<{ warehouseId: number | undefined }>({ warehouseId: undefined });
const inventoryData = ref<InventoryItem[]>([]);

const itemDefMap = computed(() => {
  return itemDefStore.itemDefinitions.reduce((map, def) => {
    map[def.id] = def;
    return map;
  }, {} as Record<string, { name: string; unit: string }>);
});

const columns = [
  { title: '物品名称', dataIndex: 'name', key: 'name' },
  { title: '单位', dataIndex: 'unit', key: 'unit' },
  { title: '账面数量', dataIndex: 'bookedQuantity', key: 'bookedQuantity' },
  { title: '实盘数量', dataIndex: 'actualQuantity', key: 'actualQuantity' },
  { title: '差异', dataIndex: 'difference', key: 'difference' },
];

onMounted(() => {
  warehouseStore.fetchWarehouses();
  itemDefStore.fetchItemDefinitions();
});

const loadInventory = async () => {
  if (!filterState.warehouseId) {
    inventoryData.value = [];
    return;
  }
  await itemStore.fetchItems({ warehouseId: filterState.warehouseId });
  
  // Aggregate items
  const aggregated = itemStore.items.reduce((acc, item) => {
    acc[item.itemDefinitionId] = (acc[item.itemDefinitionId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  inventoryData.value = Object.keys(aggregated).map(defId => {
    const bookedQuantity = aggregated[defId];
    
    return reactive({
      itemDefinitionId: defId,
      name: itemDefMap.value[defId]?.name || '未知物品',
      unit: itemDefMap.value[defId]?.unit || 'N/A',
      bookedQuantity: bookedQuantity,
      actualQuantity: bookedQuantity, // Initial value
      get difference() {
        return this.actualQuantity - this.bookedQuantity;
      }
    });
  });
};
</script>

<style scoped>
.page-container { padding: 24px; }
</style>

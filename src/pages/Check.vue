<template>
  <div>
    <a-page-header title="批量盘点" sub-title="通过短ID快速盘点物品" />
    <div class="page-container">
      <a-card>
        <a-row :gutter="16">
          <a-col :span="10">
            <a-form-item label="输入短ID (每行一个)">
              <a-textarea v-model:value="shortIdsInput" :rows="15" placeholder="在此处粘贴或输入物品的短ID" />
            </a-form-item>
            <a-button type="primary" @click="handleBulkCheck" :loading="isLoading" block>
              开始盘点 {{ uniqueIdCount }} 个ID
            </a-button>
          </a-col>
          <a-col :span="14">
            <a-tabs v-model:activeKey="activeTab">
              <a-tab-pane key="success" :tab="`成功 (${successItems.length})`">
                <a-list :data-source="successItems" size="small">
                  <template #renderItem="{ item }">
                    <a-list-item>
                      {{ item.itemDefinition?.name }} ({{ item.shortId }}) - <a-tag color="green">盘点成功</a-tag>
                    </a-list-item>
                  </template>
                </a-list>
              </a-tab-pane>
              <a-tab-pane key="failed" :tab="`失败 (${failedItems.length})`">
                 <a-list :data-source="failedItems" size="small">
                  <template #renderItem="{ item }">
                    <a-list-item>
                      {{ item.id }} - <a-tag color="red">{{ item.error }}</a-tag>
                    </a-list-item>
                  </template>
                </a-list>
              </a-tab-pane>
            </a-tabs>
          </a-col>
        </a-row>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useItemStore, type Item } from '../stores/itemStore';
import { message } from 'ant-design-vue';

interface FailedItem {
  id: string;
  error: string;
}

const itemStore = useItemStore();

const shortIdsInput = ref('');
const isLoading = ref(false);
const activeTab = ref('success');
const successItems = ref<Item[]>([]);
const failedItems = ref<FailedItem[]>([]);

const uniqueIdCount = computed(() => {
  const ids = shortIdsInput.value.split('\n').map(id => id.trim()).filter(id => id);
  return new Set(ids).size;
});

const handleBulkCheck = async () => {
  const ids = shortIdsInput.value.split('\n').map(id => id.trim()).filter(id => id);
  if (ids.length === 0) {
    message.warn('请输入至少一个短ID');
    return;
  }

  isLoading.value = true;
  successItems.value = [];
  failedItems.value = [];
  activeTab.value = 'success';

  const uniqueIds = [...new Set(ids)];

  for (const shortId of uniqueIds) {
    try {
      // 1. Find the item by shortId
      await itemStore.fetchItems({ shortId });
      const item = itemStore.items.find(i => i.shortId === shortId);

      if (!item) {
        throw new Error('物品未找到');
      }

      // 2. Perform the 'check' action
      await itemStore.updateItemStatus(item.id, 'check');
      successItems.value.push(item);

    } catch (error: any) {
      failedItems.value.push({ id: shortId, error: error.message || '未知错误' });
    }
  }

  if (failedItems.value.length > 0) {
    activeTab.value = 'failed';
  }
  
  isLoading.value = false;
  message.success(`盘点完成: 成功 ${successItems.value.length}, 失败 ${failedItems.value.length}`);
};
</script>

<style scoped>
.page-container { padding: 24px; }
</style>
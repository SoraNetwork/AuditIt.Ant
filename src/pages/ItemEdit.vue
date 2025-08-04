<template>
  <div>
    <a-page-header :title="`编辑物品: ${item?.shortId}`" @back="() => router.back()" />
    <div class="page-container">
      <a-card v-if="!itemStore.loading && item">
        <a-form :model="formState" @finish="handleSave" layout="vertical">
          <a-form-item label="备注">
            <a-textarea v-model:value="formState.remarks" :rows="4" />
          </a-form-item>
          <a-form-item label="更换照片">
            <a-upload
              v-model:file-list="fileList"
              :before-upload="() => false"
              @change="handleFileChange"
              list-type="picture-card"
              :max-count="1"
            >
              <div v-if="!fileList || fileList.length < 1">
                <plus-outlined />
                <div style="margin-top: 8px">上传</div>
              </div>
            </a-upload>
            <p>当前照片:</p>
            <a-image v-if="item.photoUrl" :width="100" :src="photoFullUrl" />
            <a-empty v-else description="暂无照片" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="itemStore.loading">
              保存更改
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>
      <a-skeleton v-else active />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useItemStore, type Item } from '../stores/itemStore';
import { message, type UploadProps } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import apiClient from '../services/api';

const route = useRoute();
const router = useRouter();
const itemStore = useItemStore();

const item = ref<Item | null>(null);
const formState = reactive<{ remarks: string; photo?: File }>({
  remarks: '',
});
const fileList = ref<UploadProps['fileList']>([]);

const photoFullUrl = computed(() => {
  if (!item.value?.photoUrl) return null;
  const baseUrl = (apiClient.defaults.baseURL || '').replace(/\/api$/, '');
  return `${baseUrl}${item.value.photoUrl}`;
});

onMounted(async () => {
  const itemId = route.params.id as string;
  await itemStore.fetchItems({ id: itemId });
  const foundItem = itemStore.items.find(i => i.id === itemId);
  if (foundItem) {
    item.value = foundItem;
    formState.remarks = foundItem.remarks || '';
  } else {
    message.error('未找到物品');
    router.back();
  }
});

const handleFileChange = (info: any) => {
  // 只保留最新上传的文件
  fileList.value = info.fileList.slice(-1);
  
  if (fileList.value && fileList.value.length > 0) {
    // 获取原生File对象
    formState.photo = fileList.value[0].originFileObj;
  } else {
    formState.photo = undefined;
  }
};

const handleSave = async () => {
  if (!item.value) return;
  
  try {
    
    await itemStore.updateItem(item.value.id, formState);
    message.success('物品信息已更新');
    router.back();
  } catch (error) {
    message.error('更新失败');
  }
};
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>
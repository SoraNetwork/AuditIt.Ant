<template>
  <div>
    <a-page-header :title="`编辑物品: ${item?.shortId}`" @back="() => router.back()" />
    <div class="page-container">
      <a-card v-if="!itemStore.loading && item" :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <a-form :model="formState" @finish="handleSave" layout="vertical">
          <a-form-item label="Short ID">
            <MobileScanInput v-model="formState.shortId" />
          </a-form-item>
          <a-form-item label="去向 (可选)">
            <a-input v-model:value="formState.currentDestination" />
          </a-form-item>
          <a-form-item v-if="canEditExpectedReturnDate" label="预计回库时间">
            <a-date-picker v-model:value="formState.expectedReturnDate" allow-clear style="width: 100%" />
          </a-form-item>
          <a-form-item label="物品所有者">
            <a-select
              v-model:value="formState.ownerUserNames"
              mode="multiple"
              show-search
              allow-clear
              option-filter-prop="label"
              placeholder="未设置"
              :options="userOptions"
              :loading="userStore.loading"
            />
          </a-form-item>
          <a-form-item label="物品价值" name="itemValue">
            <a-input-number v-model:value="formState.itemValue" :min="0" style="width: 100%" placeholder="请输入物品价值" />
          </a-form-item>
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
            <div v-if="currentPhotoUrl && !isPhotoDeleted">
              <p>当前照片:</p>
              <a-image :width="isMobile ? 140 : 100" :src="currentPhotoUrl" />
              <a-button type="link" danger @click="handleDeletePhoto">删除照片</a-button>
            </div>
             <a-empty v-if="!currentPhotoUrl && !fileList?.length" description="暂无照片" />
          </a-form-item>
          <a-form-item v-if="!isMobile">
            <a-button type="primary" html-type="submit" :loading="itemStore.loading || isCompressing">
              保存更改
            </a-button>
          </a-form-item>
        </a-form>

        <!-- Mobile sticky action bar -->
        <div v-if="isMobile" class="mobile-action-bar">
          <a-button block @click="router.back()">取消</a-button>
          <a-button type="primary" block :loading="itemStore.loading || isCompressing" @click="handleSave">保存更改</a-button>
        </div>
        <div v-if="isMobile" style="height: 80px;"></div>
      </a-card>
      <a-skeleton v-else active />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs, { type Dayjs } from 'dayjs';
import { useItemStore, type Item } from '../stores/itemStore';
import { useUserStore } from '../stores/userStore';
import { message, type UploadProps } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import apiClient from '../services/api';
import imageCompression from 'browser-image-compression';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileScanInput from '../components/mobile/MobileScanInput.vue';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const route = useRoute();
const router = useRouter();
const itemStore = useItemStore();
const userStore = useUserStore();

const item = ref<Item | null>(null);
const formState = reactive({
  shortId: '',
  remarks: '',
  currentDestination: '',
  expectedReturnDate: null as Dayjs | null,
  ownerUserNames: [] as string[],
  photo: undefined as File | undefined,
  itemValue: null as number | null,
});
const fileList = ref<UploadProps['fileList']>([]);
const isPhotoDeleted = ref(false);
const isCompressing = ref(false);
const userOptions = computed(() => userStore.users.map(user => ({ label: user.name, value: user.name })));
const canEditExpectedReturnDate = computed(() =>
  item.value?.status === 'LoanedOut'
  && !(item.value?.currentDestination || '').startsWith('租赁 ')
);

const currentPhotoUrl = computed(() => {
  if (!item.value?.photoUrl) return null;
  try {
    const apiUrl = new URL(apiClient.defaults.baseURL || window.location.origin);
    const rootUrl = new URL(apiUrl.origin);
    return new URL(item.value.photoUrl, rootUrl).href;
  } catch (e) {
    console.error("Invalid URL:", e);
    return item.value.photoUrl;
  }
});

onMounted(async () => {
  await userStore.fetchUsers({ status: 'Active', limit: 300 });
  const itemId = route.params.id as string;
  // Use find directly on the store if items are already there, otherwise fetch
  let foundItem = itemStore.items.find(i => i.id === itemId);
  if (!foundItem) {
      await itemStore.fetchItems({ id: itemId });
      foundItem = itemStore.items.find(i => i.id === itemId);
  }

  if (foundItem) {
    item.value = foundItem;
    formState.shortId = foundItem.shortId || '';
    formState.remarks = foundItem.remarks || '';
    formState.currentDestination = foundItem.currentDestination || '';
    formState.expectedReturnDate = foundItem.expectedReturnDate ? dayjs(foundItem.expectedReturnDate) : null;
    formState.ownerUserNames = [...(foundItem.ownerUserNames || [])];
    formState.itemValue = foundItem.itemValue !== undefined && foundItem.itemValue !== null ? foundItem.itemValue : null;
  } else {
    message.error('未找到物品');
    router.back();
  }
});

const handleFileChange = async (info: any) => {
  fileList.value = info.fileList.slice(-1);
  
  if (fileList.value && fileList.value.length > 0 && fileList.value[0].originFileObj) {
    isCompressing.value = true;
    message.loading({ content: '正在压缩图片...', key: 'compressing' });
    try {
      const file = fileList.value[0].originFileObj;
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      formState.photo = compressedFile;
      isPhotoDeleted.value = false; // A new file is selected, so we are not deleting.
      message.success({ content: '图片压缩成功!', key: 'compressing', duration: 2 });
    } catch (error) {
      message.error({ content: '图片压缩失败!', key: 'compressing', duration: 2 });
      console.error(error);
      formState.photo = undefined;
      fileList.value = [];
    } finally {
      isCompressing.value = false;
    }
  } else {
    formState.photo = undefined;
  }
};

const handleDeletePhoto = () => {
  isPhotoDeleted.value = true;
  fileList.value = []; // Clear the upload list
  formState.photo = undefined;
  message.info('照片已标记为删除。保存后生效。');
};

const handleSave = async () => {
  if (!item.value) return;
  
  try {
    await itemStore.updateItem(item.value.id, {
      shortId: formState.shortId,
      remarks: formState.remarks,
      currentDestination: formState.currentDestination,
      expectedReturnDate: canEditExpectedReturnDate.value && formState.expectedReturnDate
        ? formState.expectedReturnDate.startOf('day').toISOString()
        : null,
      clearExpectedReturnDate: canEditExpectedReturnDate.value && !formState.expectedReturnDate,
      ownerUserNames: formState.ownerUserNames,
      clearOwnerUser: formState.ownerUserNames.length === 0,
      photo: formState.photo,
      deletePhoto: isPhotoDeleted.value,
      itemValue: formState.itemValue,
    });
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

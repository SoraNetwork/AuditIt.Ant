<template>
  <div>
    <a-page-header title="租客管理" sub-title="维护租客档案" />
    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <a-space style="margin-bottom: 12px" :direction="isMobile ? 'vertical' : 'horizontal'" :style="isMobile ? { width: '100%', marginBottom: '12px' } : { marginBottom: '12px' }">
        <a-input-search v-model:value="keyword" placeholder="姓名/电话" :style="isMobile ? { width: '100%' } : { width: '240px' }" @search="search" />
        <a-button type="primary" :block="isMobile" @click="openCreate">新增租客</a-button>
      </a-space>

      <a-table v-if="!isMobile" :loading="renterStore.loading" row-key="id" :columns="columns" :data-source="renterStore.renters">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm title="确认删除？" @confirm="remove(record.id)">
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>

      <div v-else>
        <a-skeleton :loading="renterStore.loading" active :paragraph="{ rows: 4 }">
          <MobileListCard v-for="r in renterStore.renters" :key="r.id">
            <template #title>{{ r.name }}</template>
            <template #meta>
              <div v-if="r.phone">电话：{{ r.phone }}</div>
              <div v-if="r.xianyuId">闲鱼：{{ r.xianyuId }}</div>
              <div v-if="r.taobaoId">淘宝：{{ r.taobaoId }}</div>
              <div v-if="r.xiaohongshuId">小红书：{{ r.xiaohongshuId }}</div>
              <div v-if="r.defaultAddress">地址：{{ r.defaultAddress }}</div>
            </template>
            <template #footer>
              <a-button size="small" @click="openEdit(r)">编辑</a-button>
              <a-popconfirm title="确认删除？" @confirm="remove(r.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </template>
          </MobileListCard>
          <a-empty v-if="renterStore.renters.length === 0 && !renterStore.loading" description="暂无租客" />
        </a-skeleton>
      </div>
    </a-card>

    <a-modal v-model:open="visible" :title="editingId ? '编辑租客' : '新增租客'" ok-text="保存" cancel-text="取消" @ok="save">
      <a-form layout="vertical">
        <a-form-item label="姓名" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item label="电话">
          <a-input v-model:value="form.phone" />
        </a-form-item>
        <a-form-item label="闲鱼ID">
          <a-input v-model:value="form.xianyuId" />
        </a-form-item>
        <a-form-item label="淘宝ID">
          <a-input v-model:value="form.taobaoId" />
        </a-form-item>
        <a-form-item label="小红书ID">
          <a-input v-model:value="form.xiaohongshuId" />
        </a-form-item>
        <a-form-item label="默认地址">
          <a-textarea v-model:value="form.defaultAddress" :rows="2" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.notes" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRenterStore, type Renter } from '../stores/renterStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';

const { isMobile } = useBreakpoint();
const renterStore = useRenterStore();
const keyword = ref('');
const visible = ref(false);
const editingId = ref<string | null>(null);

const form = reactive({
  name: '',
  phone: '',
  idCardNo: '',
  xianyuId: '',
  taobaoId: '',
  xiaohongshuId: '',
  defaultAddress: '',
  notes: '',
});

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '电话', dataIndex: 'phone', key: 'phone' },
  { title: '闲鱼ID', dataIndex: 'xianyuId', key: 'xianyuId' },
  { title: '淘宝ID', dataIndex: 'taobaoId', key: 'taobaoId' },
  { title: '小红书ID', dataIndex: 'xiaohongshuId', key: 'xiaohongshuId' },
  { title: '操作', key: 'actions', width: 140 },
];

const resetForm = () => {
  form.name = '';
  form.phone = '';
  form.idCardNo = '';
  form.xianyuId = '';
  form.taobaoId = '';
  form.xiaohongshuId = '';
  form.defaultAddress = '';
  form.notes = '';
};

const search = async () => {
  await renterStore.fetchRenters(keyword.value, 200);
};

const openCreate = () => {
  editingId.value = null;
  resetForm();
  visible.value = true;
};

const openEdit = (record: Renter) => {
  editingId.value = record.id;
  form.name = record.name || '';
  form.phone = record.phone || '';
  form.idCardNo = record.idCardNo || '';
  form.xianyuId = record.xianyuId || '';
  form.taobaoId = record.taobaoId || '';
  form.xiaohongshuId = record.xiaohongshuId || '';
  form.defaultAddress = record.defaultAddress || '';
  form.notes = record.notes || '';
  visible.value = true;
};

const save = async () => {
  if (!form.name.trim()) {
    message.error('姓名不能为空');
    return;
  }

  const payload = {
    name: form.name,
    phone: form.phone || null,
    idCardNo: form.idCardNo || null,
    xianyuId: form.xianyuId || null,
    taobaoId: form.taobaoId || null,
    xiaohongshuId: form.xiaohongshuId || null,
    defaultAddress: form.defaultAddress || null,
    notes: form.notes || null,
  };

  if (editingId.value) {
    await renterStore.updateRenter(editingId.value, payload);
    message.success('更新成功');
  } else {
    await renterStore.createRenter(payload);
    message.success('创建成功');
  }

  visible.value = false;
  await search();
};

const remove = async (id: string) => {
  try {
    await renterStore.deleteRenter(id);
    message.success('删除成功');
  } catch {
    message.error('删除失败，可能存在关联租赁单');
  }
};

onMounted(search);
</script>

<template>
  <div>
    <a-page-header title="租客管理" sub-title="维护租客档案" />

    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <a-space
        :direction="isMobile ? 'vertical' : 'horizontal'"
        :style="isMobile ? { width: '100%', marginBottom: '12px' } : { marginBottom: '12px' }"
      >
        <a-input-search
          v-model:value="keyword"
          placeholder="姓名 / 电话 / 身份证号"
          :style="isMobile ? { width: '100%' } : { width: '280px' }"
          @search="search"
        />
        <a-button type="primary" :block="isMobile" @click="openCreate">新增租客</a-button>
      </a-space>

      <a-table
        v-if="!isMobile"
        row-key="id"
        :loading="renterStore.loading"
        :columns="columns"
        :data-source="renterStore.renters"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <RenterLink :renter-id="record.id" :name="record.name" />
          </template>
          <template v-else-if="column.key === 'platformRemark'">
            <div class="platform-remark">{{ getPlatformRemark(record) || '-' }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm title="确认删除？" @confirm="remove(record.id)">
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>

      <div v-else class="mobile-card-list">
        <a-skeleton :loading="renterStore.loading" active :paragraph="{ rows: 4 }">
          <MobileListCard v-for="renter in renterStore.renters" :key="renter.id">
            <template #title><RenterLink :renter-id="renter.id" :name="renter.name" /></template>
            <template #meta>
              <div v-if="renter.phone">电话：{{ renter.phone }}</div>
              <div v-if="renter.idCardNo">身份证号：{{ renter.idCardNo }}</div>
              <div v-if="getPlatformRemark(renter)" class="platform-remark">平台备注：{{ getPlatformRemark(renter) }}</div>
              <div v-if="renter.defaultAddress">默认地址：{{ renter.defaultAddress }}</div>
            </template>
            <template #footer>
              <a-button size="small" @click="openEdit(renter)">编辑</a-button>
              <a-popconfirm title="确认删除？" @confirm="remove(renter.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </template>
          </MobileListCard>
          <a-empty v-if="renterStore.renters.length === 0 && !renterStore.loading" description="暂无租客" />
        </a-skeleton>
      </div>
    </a-card>

    <a-modal
      v-model:open="visible"
      :title="editingId ? '编辑租客' : '新增租客'"
      ok-text="保存"
      cancel-text="取消"
      @ok="save"
    >
      <a-form layout="vertical">
        <a-form-item label="姓名" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item label="电话">
          <a-input v-model:value="form.phone" />
        </a-form-item>
        <a-form-item label="身份证号">
          <a-input v-model:value="form.idCardNo" />
        </a-form-item>
        <a-form-item label="平台备注">
          <a-space wrap style="margin-bottom: 8px">
            <a-button
              v-for="template in PLATFORM_TEMPLATES"
              :key="template.key"
              size="small"
              @click="appendPlatformTemplateToForm(template.key)"
            >
              {{ template.label }}
            </a-button>
          </a-space>
          <a-textarea
            v-model:value="form.platformRemark"
            :rows="4"
            placeholder="点击上方快捷填写插入平台ID模板，例如：闲鱼_ID: xxx"
          />
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
import RenterLink from '../components/RenterLink.vue';
import {
  PLATFORM_TEMPLATES,
  appendPlatformTemplate,
  buildPlatformRemark,
  parsePlatformRemark,
  type PlatformFieldKey,
} from '../utils/renterPlatformNotes';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const renterStore = useRenterStore();

const keyword = ref('');
const visible = ref(false);
const editingId = ref<string | null>(null);

const form = reactive({
  name: '',
  phone: '',
  idCardNo: '',
  platformRemark: '',
  defaultAddress: '',
  notes: '',
});

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '电话', dataIndex: 'phone', key: 'phone', width: 150 },
  { title: '身份证号', dataIndex: 'idCardNo', key: 'idCardNo', width: 220 },
  { title: '平台备注', key: 'platformRemark', width: 240 },
  { title: '操作', key: 'actions', width: 140 },
];

const getPlatformRemark = (record: Renter) => buildPlatformRemark(record);

const resetForm = () => {
  form.name = '';
  form.phone = '';
  form.idCardNo = '';
  form.platformRemark = '';
  form.defaultAddress = '';
  form.notes = '';
};

const appendPlatformTemplateToForm = (key: PlatformFieldKey) => {
  form.platformRemark = appendPlatformTemplate(form.platformRemark, key);
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
  form.platformRemark = buildPlatformRemark(record);
  form.defaultAddress = record.defaultAddress || '';
  form.notes = record.notes || '';
  visible.value = true;
};

const save = async () => {
  if (!form.name.trim()) {
    message.error('姓名不能为空');
    return;
  }

  const platformFields = parsePlatformRemark(form.platformRemark);
  const payload = {
    name: form.name.trim(),
    phone: form.phone.trim() || null,
    idCardNo: form.idCardNo.trim() || null,
    ...platformFields,
    defaultAddress: form.defaultAddress.trim() || null,
    notes: form.notes.trim() || null,
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

<style scoped>
.platform-remark {
  white-space: pre-line;
}
</style>

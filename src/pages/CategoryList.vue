<template>
  <div>
    <a-table
      v-if="!isMobile"
      :columns="columns"
      :data-source="categoryStore.categories"
      :loading="categoryStore.loading"
      row-key="id"
    >
      <template #title>
        <a-row justify="space-between">
          <a-col><h2>分类管理</h2></a-col>
          <a-col>
            <a-button type="primary" @click="showAddModal">添加分类</a-button>
          </a-col>
        </a-row>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showEditModal(record)">编辑</a>
            <a-popconfirm
              title="您确定要删除这个分类吗？"
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
          <h2>分类管理</h2>
          <p>维护物品分类，供物品定义和库存资料引用。</p>
        </div>
        <a-button type="primary" block @click="showAddModal">添加分类</a-button>
      </div>

      <div class="mobile-section-note">
        <strong>共 {{ categoryStore.categories.length }} 个分类</strong>
        <span>卡片中展示分类名称和描述，可直接执行编辑或删除。</span>
      </div>

      <a-skeleton :loading="categoryStore.loading" active :paragraph="{ rows: 3 }">
        <div v-if="categoryStore.categories.length > 0" class="mobile-card-list">
          <MobileListCard v-for="cat in categoryStore.categories" :key="cat.id">
            <template #title>{{ cat.name }}</template>
            <template #meta>
              <div v-if="cat.description">{{ cat.description }}</div>
              <div v-else>暂无描述</div>
            </template>
            <template #footer>
              <a-button size="small" @click="showEditModal(cat)">编辑</a-button>
              <a-popconfirm
                title="您确定要删除这个分类吗？"
                @confirm="handleDelete(cat.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </template>
          </MobileListCard>
        </div>
        <a-empty v-else description="暂无分类" />
      </a-skeleton>
    </div>

    <a-modal
      v-model:open="isModalVisible"
      :title="modalTitle"
      :confirm-loading="categoryStore.loading"
      @ok="handleOk"
      @cancel="handleCancel"
      ok-text="保存"
      cancel-text="取消"
    >
      <CategoryForm ref="categoryFormRef" :initial-values="currentCategory" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import CategoryForm from '../components/CategoryForm.vue';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import { useBreakpoint } from '../composables/useBreakpoint';
import {
  useCategoryStore,
  type Category,
  type CreateCategoryPayload,
} from '../stores/categoryStore';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const categoryStore = useCategoryStore();
const categoryFormRef = ref<InstanceType<typeof CategoryForm> | null>(null);

const isModalVisible = ref(false);
const editingId = ref<number | null>(null);
const currentCategory = ref<Partial<Category>>({});

const modalTitle = computed(() =>
  editingId.value !== null ? '编辑分类' : '添加分类'
);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: '150px' },
];

const showAddModal = () => {
  editingId.value = null;
  currentCategory.value = { name: '', description: '' };
  isModalVisible.value = true;
};

const showEditModal = (category: Category) => {
  editingId.value = category.id;
  currentCategory.value = { ...category };
  isModalVisible.value = true;
};

const handleDelete = async (id: number) => {
  await categoryStore.deleteCategory(id);
  if (!categoryStore.error) {
    message.success('分类删除成功');
  } else {
    message.error(categoryStore.error);
  }
};

const handleOk = async () => {
  try {
    const values = await categoryFormRef.value?.validate();
    if (!values) return;

    if (editingId.value !== null) {
      await categoryStore.updateCategory({ id: editingId.value, ...values });
    } else {
      await categoryStore.addCategory(values as CreateCategoryPayload);
    }

    if (!categoryStore.error) {
      message.success(`分类${editingId.value !== null ? '更新' : '添加'}成功`);
      isModalVisible.value = false;
    } else {
      message.error(categoryStore.error);
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
  categoryStore.fetchCategories();
});
</script>

<style scoped>
.admin-mobile-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.admin-mobile-toolbar h2 {
  margin: 0;
}

.admin-mobile-toolbar p {
  margin: 4px 0 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.5;
}
</style>

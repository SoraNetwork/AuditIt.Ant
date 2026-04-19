<template>
  <div>
    <a-page-header title="角色管理" sub-title="维护角色与权限" />
    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <a-space style="margin-bottom: 12px" :direction="isMobile ? 'vertical' : 'horizontal'" :style="isMobile ? { width: '100%', marginBottom: '12px' } : { marginBottom: '12px' }">
        <a-button type="primary" :block="isMobile" @click="openCreate">新增角色</a-button>
        <a-button :block="isMobile" @click="reload">刷新</a-button>
      </a-space>

      <a-table v-if="!isMobile" :loading="roleStore.loading" row-key="id" :columns="columns" :data-source="roleStore.roles">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'permissions'">
            <a-space wrap>
              <a-tag v-for="p in record.permissions" :key="p">{{ p }}</a-tag>
            </a-space>
          </template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm v-if="!record.isBuiltIn" title="确认删除？" @confirm="remove(record.id)">
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>

      <div v-else>
        <a-skeleton :loading="roleStore.loading" active :paragraph="{ rows: 4 }">
          <MobileListCard v-for="role in roleStore.roles" :key="role.id">
            <template #title>{{ role.name }}</template>
            <template #tags>
              <a-tag v-if="role.isBuiltIn" color="blue">内置</a-tag>
            </template>
            <template #meta>
              <div v-if="role.description">{{ role.description }}</div>
              <div>权限：{{ role.permissions.length }} 项</div>
            </template>
            <template #footer>
              <a-button size="small" @click="openEdit(role)">编辑</a-button>
              <a-popconfirm v-if="!role.isBuiltIn" title="确认删除？" @confirm="remove(role.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </template>
          </MobileListCard>
          <a-empty v-if="roleStore.roles.length === 0 && !roleStore.loading" description="暂无角色" />
        </a-skeleton>
      </div>
    </a-card>

    <a-modal v-model:open="visible" :title="editing ? '编辑角色' : '新增角色'" ok-text="保存" cancel-text="取消" @ok="save">
      <a-form layout="vertical">
        <a-form-item label="名称" required v-if="!editing">
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model:value="form.description" />
        </a-form-item>
        <a-form-item label="权限">
          <a-select v-model:value="form.permissions" mode="multiple" :options="permissionOptions" option-filter-prop="label" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRoleStore, type Role } from '../stores/roleStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';

const { isMobile } = useBreakpoint();
const roleStore = useRoleStore();
const visible = ref(false);
const editing = ref<Role | null>(null);

const form = reactive({
  name: '',
  description: '',
  permissions: [] as string[],
});

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '内置', dataIndex: 'isBuiltIn', key: 'isBuiltIn', width: 80 },
  { title: '权限', key: 'permissions' },
  { title: '操作', key: 'actions', width: 140 },
];

const permissionOptions = computed(() =>
  roleStore.permissions.map(p => ({
    value: p.code,
    label: `${p.category} / ${p.code}`,
  }))
);

const reload = async () => {
  await Promise.all([roleStore.fetchRoles(), roleStore.fetchPermissions()]);
};

const openCreate = () => {
  editing.value = null;
  form.name = '';
  form.description = '';
  form.permissions = [];
  visible.value = true;
};

const openEdit = (role: Role) => {
  editing.value = role;
  form.name = role.name;
  form.description = role.description || '';
  form.permissions = [...role.permissions];
  visible.value = true;
};

const save = async () => {
  if (!editing.value) {
    if (!form.name.trim()) {
      message.error('名称不能为空');
      return;
    }
    await roleStore.createRole({ name: form.name, description: form.description || undefined, permissions: form.permissions });
    message.success('创建成功');
  } else {
    await roleStore.updateRole(editing.value.id, { description: form.description || undefined, permissions: form.permissions });
    message.success('更新成功');
  }

  visible.value = false;
  await reload();
};

const remove = async (id: number) => {
  await roleStore.deleteRole(id);
  message.success('删除成功');
  await reload();
};

onMounted(reload);
</script>

<template>
  <a-auto-complete
    v-model:value="searchText"
    :options="options"
    style="width: 250px"
    placeholder="通过可视化ID或名称搜索物品..."
    @select="onSelect"
    @search="onSearch"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useItemStore } from '../stores/itemStore';
import { useItemDefinitionStore } from '../stores/itemDefinitionStore';

const searchText = ref('');
const router = useRouter();
const itemStore = useItemStore();
const itemDefStore = useItemDefinitionStore();

// 为了搜索，我们需要一个包含所有物品的列表
// 注意：这在大型应用中可能需要后端支持，但对于前端模拟是可行的
if (itemStore.items.length === 0) {
  itemStore.fetchItems();
}
if (itemDefStore.itemDefinitions.length === 0) {
  itemDefStore.fetchItemDefinitions();
}

const itemDefMap = computed(() => {
  return itemDefStore.itemDefinitions.reduce((map: Record<number, any>, def) => {
    map[def.id] = def;
    return map;
  }, {});
});

const options = ref<{ value: string; label: string; id: string }[]>([]);

const onSearch = (query: string) => {
  if (!query) {
    options.value = [];
    return;
  }
  const lowerCaseQuery = query.toLowerCase();
  const filteredItems = itemStore.items.filter(item => {
    const def = itemDefMap.value[item.itemDefinitionId];
    const nameMatch = def && def.name.toLowerCase().includes(lowerCaseQuery);
    const shortIdMatch = item.shortId.toLowerCase().includes(lowerCaseQuery);
    return nameMatch || shortIdMatch;
  });

  options.value = filteredItems.slice(0, 10).map(item => { // Limit to 10 results
    const def = itemDefMap.value[item.itemDefinitionId];
    return {
      id: item.id,
      value: item.shortId, // The value to be filled in the input
      label: `${def?.name || '未知'} - ${item.shortId}`, // The text to be displayed in the dropdown
    };
  });
};

const onSelect = (_value: string, option: any) => {
  router.push({ name: 'item-details', params: { id: option.id } });
  searchText.value = '';
  options.value = [];
};
</script>

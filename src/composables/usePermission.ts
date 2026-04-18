import { computed } from 'vue';
import { useAuthStore } from '../stores/authStore';

export function usePermission() {
  const authStore = useAuthStore();

  const permissions = computed(() => authStore.permissions);

  function hasPermission(code: string): boolean {
    return authStore.hasPermission(code);
  }

  function hasAnyPermission(codes: string[]): boolean {
    return authStore.hasAnyPermission(codes);
  }

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
  };
}

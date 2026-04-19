import { ref, computed, readonly } from 'vue';

const MOBILE_MAX = 767.98;
const TABLET_MAX = 1023.98;

const width = ref(typeof window === 'undefined' ? 1280 : window.innerWidth);

if (typeof window !== 'undefined') {
  const mobileMql = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
  const tabletMql = window.matchMedia(
    `(min-width: ${MOBILE_MAX + 0.02}px) and (max-width: ${TABLET_MAX}px)`
  );

  const sync = () => {
    width.value = window.innerWidth;
  };

  mobileMql.addEventListener('change', sync);
  tabletMql.addEventListener('change', sync);
  window.addEventListener('resize', sync, { passive: true });
  window.addEventListener('orientationchange', sync);
}

const isMobile = computed(() => width.value <= MOBILE_MAX);
const isTablet = computed(() => width.value > MOBILE_MAX && width.value <= TABLET_MAX);
const isDesktop = computed(() => width.value > TABLET_MAX);

export function useBreakpoint() {
  return {
    width: readonly(width),
    isMobile,
    isTablet,
    isDesktop,
  };
}

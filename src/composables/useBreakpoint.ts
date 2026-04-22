import { computed, readonly, ref } from 'vue';

export const MOBILE_MAX = 767.98;
export const TABLET_MAX = 1023.98;
const DEFAULT_VIEWPORT_WIDTH = 1280;

export type DeviceKind = 'mobile' | 'tablet' | 'desktop';

interface NavigatorWithUAData extends Navigator {
  userAgentData?: {
    mobile?: boolean;
    platform?: string;
  };
}

function getNavigatorValue<T>(getter: (nav: NavigatorWithUAData) => T, fallback: T): T {
  if (typeof navigator === 'undefined') {
    return fallback;
  }

  try {
    return getter(navigator as NavigatorWithUAData);
  } catch {
    return fallback;
  }
}

function isTabletUserAgent(userAgent: string, platform: string, maxTouchPoints: number) {
  const normalizedUa = userAgent.toLowerCase();
  const normalizedPlatform = platform.toLowerCase();
  const isIpadOsDesktopUa =
    normalizedUa.includes('macintosh') &&
    normalizedPlatform.includes('mac') &&
    maxTouchPoints > 1;

  return (
    isIpadOsDesktopUa ||
    /ipad|tablet|playbook|silk|kindle|xoom|nexus 7|nexus 9|nexus 10|sm-t|lenovo tab|mi pad/.test(
      normalizedUa
    ) ||
    /android(?!.*mobile)/.test(normalizedUa)
  );
}

function isMobileUserAgent(userAgent: string, prefersMobileUa: boolean) {
  if (prefersMobileUa) {
    return true;
  }

  const normalizedUa = userAgent.toLowerCase();
  return /iphone|ipod|android.*mobile|windows phone|blackberry|bb10|iemobile|opera mini|mobile|phone/.test(
    normalizedUa
  );
}

export function detectDeviceKind(
  userAgent: string,
  platform = '',
  maxTouchPoints = 0,
  prefersMobileUa = false
): DeviceKind {
  if (isTabletUserAgent(userAgent, platform, maxTouchPoints)) {
    return 'tablet';
  }

  if (isMobileUserAgent(userAgent, prefersMobileUa)) {
    return 'mobile';
  }

  return 'desktop';
}

const viewportWidth = ref(typeof window === 'undefined' ? DEFAULT_VIEWPORT_WIDTH : window.innerWidth);
const userAgent = ref(getNavigatorValue(nav => nav.userAgent, ''));
const platform = ref(getNavigatorValue(nav => nav.platform, ''));
const maxTouchPoints = ref(getNavigatorValue(nav => nav.maxTouchPoints ?? 0, 0));
const prefersMobileUa = ref(getNavigatorValue(nav => Boolean(nav.userAgentData?.mobile), false));
const coarsePointer = ref(
  typeof window === 'undefined' ? false : window.matchMedia('(pointer: coarse)').matches
);

if (typeof window !== 'undefined') {
  const mobileMql = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
  const tabletMql = window.matchMedia(
    `(min-width: ${MOBILE_MAX + 0.02}px) and (max-width: ${TABLET_MAX}px)`
  );
  const coarsePointerMql = window.matchMedia('(pointer: coarse)');

  const syncEnvironment = () => {
    viewportWidth.value = window.innerWidth;
    userAgent.value = navigator.userAgent;
    platform.value = navigator.platform;
    maxTouchPoints.value = navigator.maxTouchPoints ?? 0;
    prefersMobileUa.value = Boolean((navigator as NavigatorWithUAData).userAgentData?.mobile);
    coarsePointer.value = coarsePointerMql.matches;
  };

  const bindMediaListener = (mql: MediaQueryList, listener: () => void) => {
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', listener);
      return;
    }

    const legacyMql = mql as MediaQueryList & {
      addListener?: (callback: () => void) => void;
    };

    legacyMql.addListener?.(listener);
  };

  bindMediaListener(mobileMql, syncEnvironment);
  bindMediaListener(tabletMql, syncEnvironment);
  bindMediaListener(coarsePointerMql, syncEnvironment);
  window.addEventListener('resize', syncEnvironment, { passive: true });
  window.addEventListener('orientationchange', syncEnvironment);
  window.visualViewport?.addEventListener('resize', syncEnvironment, { passive: true });

  syncEnvironment();
}

const isMobileViewport = computed(() => viewportWidth.value <= MOBILE_MAX);
const isTabletViewport = computed(
  () => viewportWidth.value > MOBILE_MAX && viewportWidth.value <= TABLET_MAX
);
const isDesktopViewport = computed(() => viewportWidth.value > TABLET_MAX);

const deviceKind = computed(() =>
  detectDeviceKind(userAgent.value, platform.value, maxTouchPoints.value, prefersMobileUa.value)
);

const isMobileUa = computed(() => deviceKind.value === 'mobile');
const isTabletUa = computed(() => deviceKind.value === 'tablet');
const isTouchLikeDevice = computed(
  () => isMobileUa.value || isTabletUa.value || coarsePointer.value || maxTouchPoints.value > 0
);
const shouldUseMobileLayout = computed(
  () => isMobileUa.value || isTabletUa.value || isMobileViewport.value || isTabletViewport.value
);

// Transitional alias for existing callers. Prefer shouldUseMobileLayout in new code.
const isMobile = computed(() => shouldUseMobileLayout.value);
const isTablet = computed(() => isTabletViewport.value);
const isDesktop = computed(() => !shouldUseMobileLayout.value);

export function useBreakpoint() {
  return {
    width: readonly(viewportWidth),
    viewportWidth: readonly(viewportWidth),
    isMobile,
    isTablet,
    isDesktop,
    isMobileViewport,
    isTabletViewport,
    isDesktopViewport,
    isMobileUa,
    isTabletUa,
    isTouchLikeDevice,
    deviceKind,
    shouldUseMobileLayout,
  };
}

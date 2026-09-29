import { onMounted, onUnmounted } from 'vue';

export function useMobileViewport() {
  let frame = 0;
  let baseline = window.innerHeight;
  let lastWidth = window.innerWidth;
  const update = () => {
    frame = 0;
    const viewport = window.visualViewport;
    const height = viewport?.height ?? window.innerHeight;
    // Pinch zoom changes the visual viewport without opening a keyboard.
    if (viewport && viewport.scale !== 1) return;
    const editing = document.activeElement?.matches('input, textarea, [contenteditable="true"]') ?? false;
    if (!editing || lastWidth !== window.innerWidth) baseline = window.innerHeight;
    lastWidth = window.innerWidth;
    document.documentElement.style.setProperty('--mobile-viewport-height', `${height}px`);
    document.body.classList.toggle('keyboard-open', editing && baseline - height > 120);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  onMounted(() => {
    update();
    window.visualViewport?.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
  });
  onUnmounted(() => {
    cancelAnimationFrame(frame);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('focusin', schedule);
    document.removeEventListener('focusout', schedule);
    document.body.classList.remove('keyboard-open');
    document.documentElement.style.removeProperty('--mobile-viewport-height');
  });
}

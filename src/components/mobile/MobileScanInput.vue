<template>
  <div class="mobile-scan-input">
    <a-space-compact v-if="showScanButton" block class="mobile-scan-input__compact">
      <a-input
        ref="inputRef"
        :value="modelValue"
        v-bind="inputAttrs"
        @update:value="handleInput"
        @pressEnter="emit('pressEnter', $event)"
        @blur="emit('blur', $event)"
      />
      <a-tooltip title="扫码填入">
        <a-button class="mobile-scan-input__button" @click="openScanner">
          <template #icon><ScanOutlined /></template>
        </a-button>
      </a-tooltip>
    </a-space-compact>
    <a-input
      v-else
      ref="inputRef"
      :value="modelValue"
      v-bind="inputAttrs"
      @update:value="handleInput"
      @pressEnter="emit('pressEnter', $event)"
      @blur="emit('blur', $event)"
    />

    <a-modal
      v-model:open="scannerVisible"
      title="扫码输入"
      :footer="null"
      :width="isMobile ? '94vw' : 520"
      centered
      destroy-on-close
      @cancel="closeScanner"
    >
      <div class="mobile-scan-input__scanner">
        <video
          ref="videoRef"
          class="mobile-scan-input__video"
          autoplay
          muted
          playsinline
        />
        <div class="mobile-scan-input__hint">
          将条码或二维码置于画面中央，识别后会自动填入当前输入框。
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useAttrs } from 'vue';
import { message } from 'ant-design-vue';
import { ScanOutlined } from '@ant-design/icons-vue';
import * as dd from 'dingtalk-jsapi';
import { useBreakpoint } from '../../composables/useBreakpoint';

type ScanResultPayload = {
  value: string;
  source: 'dingtalk' | 'camera';
};

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    scanEnabled?: boolean;
  }>(),
  {
    modelValue: '',
    scanEnabled: true,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
  pressEnter: [event: KeyboardEvent];
  'scan-success': [payload: ScanResultPayload];
}>();

defineOptions({
  inheritAttrs: false,
});

interface BarcodeDetectorLike {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
}

interface BarcodeDetectorConstructorLike {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

const CAMERA_SCAN_FORMATS = [
  'qr_code',
  'code_128',
  'code_39',
  'code_93',
  'codabar',
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'itf',
  'data_matrix',
  'pdf417',
  'aztec',
];

const attrs = useAttrs();
const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const browserWindow = window as Window & { BarcodeDetector?: BarcodeDetectorConstructorLike };
const inputRef = ref();
const videoRef = ref<HTMLVideoElement | null>(null);
const scannerVisible = ref(false);
const streamRef = ref<MediaStream | null>(null);
const detectFrameId = ref<number | null>(null);
const detectorRef = ref<BarcodeDetectorLike | null>(null);

const inputAttrs = computed(() => attrs);
const showScanButton = computed(() => isMobile.value && props.scanEnabled);

const focusInput = async () => {
  await nextTick();
  inputRef.value?.focus?.();
};

const handleInput = (value: string) => {
  emit('update:modelValue', value);
};

const applyScannedValue = async (value: string, source: ScanResultPayload['source']) => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    message.warning('未识别到有效内容，请重试');
    return;
  }

  emit('update:modelValue', normalizedValue);
  emit('scan-success', { value: normalizedValue, source });
  closeScanner();
  await focusInput();
};

const stopDetectLoop = () => {
  if (detectFrameId.value !== null) {
    cancelAnimationFrame(detectFrameId.value);
    detectFrameId.value = null;
  }
};

const stopStream = () => {
  stopDetectLoop();
  streamRef.value?.getTracks().forEach(track => track.stop());
  streamRef.value = null;
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
};

const closeScanner = () => {
  scannerVisible.value = false;
  stopStream();
};

const getBarcodeDetector = async () => {
  if (detectorRef.value) return detectorRef.value;

  const BarcodeDetectorCtor = browserWindow.BarcodeDetector;
  if (!BarcodeDetectorCtor) return null;

  let formats = CAMERA_SCAN_FORMATS;
  try {
    const supportedFormats = await BarcodeDetectorCtor.getSupportedFormats?.();
    if (supportedFormats?.length) {
      formats = CAMERA_SCAN_FORMATS.filter(format => supportedFormats.includes(format));
    }
  } catch {
    // ignore and use the default list
  }

  detectorRef.value = new BarcodeDetectorCtor({ formats });
  return detectorRef.value;
};

const runDetectLoop = async () => {
  if (!scannerVisible.value || !videoRef.value || !detectorRef.value) return;

  try {
    const results = await detectorRef.value.detect(videoRef.value);
    const matchedValue = results.find(result => result.rawValue?.trim())?.rawValue;
    if (matchedValue) {
      await applyScannedValue(matchedValue, 'camera');
      return;
    }
  } catch {
    // keep looping while the video is warming up
  }

  detectFrameId.value = requestAnimationFrame(() => {
    void runDetectLoop();
  });
};

const startCameraScanner = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    message.warning('当前环境不支持摄像头扫码');
    return;
  }

  const detector = await getBarcodeDetector();
  if (!detector) {
    message.warning('当前浏览器不支持条码识别，请使用钉钉扫码或手动输入');
    return;
  }

  scannerVisible.value = true;
  await nextTick();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
      },
      audio: false,
    });

    streamRef.value = stream;

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
    }

    void runDetectLoop();
  } catch (error) {
    closeScanner();
    console.error('startCameraScanner', error);
    message.error('无法打开摄像头，请检查相机权限');
  }
};

const scanWithDingTalk = async () => {
  await new Promise<string>((resolve, reject) => {
    const scanApi = (dd as any)?.biz?.util?.scan;

    if (!scanApi) {
      reject(new Error('scan api unavailable'));
      return;
    }

    scanApi({
      type: 'all',
      onSuccess(data: any) {
        const value =
          data?.text ??
          data?.code ??
          data?.result ??
          data?.barcode ??
          data?.qrcode ??
          '';
        if (value) {
          resolve(String(value));
          return;
        }
        reject(new Error('empty scan result'));
      },
      onFail(err: unknown) {
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    });
  }).then(value => applyScannedValue(value, 'dingtalk'));
};

const openScanner = async () => {
  if (!showScanButton.value) return;

  const isDingTalkEnvironment = /DingTalk/i.test(navigator.userAgent);
  if (isDingTalkEnvironment && (dd as any)?.biz?.util?.scan) {
    try {
      await scanWithDingTalk();
      return;
    } catch (error) {
      console.error('scanWithDingTalk', error);
      message.warning('钉钉扫码未完成，已切换为摄像头扫码');
    }
  }

  await startCameraScanner();
};

onBeforeUnmount(() => {
  stopStream();
});

defineExpose({
  focus: focusInput,
});
</script>

<style scoped>
.mobile-scan-input {
  width: 100%;
}

.mobile-scan-input__compact {
  width: 100%;
}

.mobile-scan-input__button {
  flex: 0 0 auto;
}

.mobile-scan-input__scanner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-scan-input__video {
  width: 100%;
  min-height: 240px;
  max-height: 60vh;
  object-fit: cover;
  border-radius: 8px;
  background: #000;
}

.mobile-scan-input__hint {
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
  line-height: 1.5;
}
</style>

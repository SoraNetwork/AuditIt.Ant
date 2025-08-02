<template>
  <div class="print-container">
    <div v-for="item in items" :key="item.id" class="label">
      <div class="qr-code">
        <canvas :ref="el => setCanvasRef(el, item.id)"></canvas>
      </div>
      <div class="details">
        <p><strong>名称:</strong> {{ item.itemDefinition?.name }}</p>
        <p><strong>仓库:</strong> {{ item.warehouse?.name }}</p>
        <p><strong>外部ID:</strong> {{ item.shortId }}</p>
        <p><strong>内部ID:</strong> {{ item.id }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../services/api';
import QRCode from 'qrcode';

const route = useRoute();
const items = ref<any[]>([]);
const canvasRefs = new Map();

const setCanvasRef = (el: any, id: string) => {
  if (el) {
    canvasRefs.set(id, el);
  }
};

const generateQRCodes = () => {
  items.value.forEach(item => {
    const canvas = canvasRefs.get(item.id);
    if (canvas) {
      QRCode.toCanvas(canvas, item.id, { width: 100 }, (error) => {
        if (error) console.error(error);
      });
    }
  });
};

onMounted(async () => {
  const ids = (route.query.ids as string)?.split(',');
  if (ids && ids.length > 0) {
    try {
      const response = await apiClient.post('/items/batch', ids);
      items.value = response.data;
      // Use nextTick to ensure canvases are in the DOM before generating QR codes
      await new Promise(resolve => setTimeout(resolve, 0));
      generateQRCodes();
    } catch (error) {
      console.error("Failed to fetch items for printing:", error);
    }
  }
});
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  .print-container, .print-container * {
    visibility: visible;
  }
  .print-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .label {
    page-break-inside: avoid;
  }
}

.print-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.label {
  border: 1px solid #ccc;
  padding: 8px;
  width: 300px; /* Adjust as needed */
  display: flex;
  align-items: center;
  gap: 8px;
}
.qr-code {
  flex-shrink: 0;
}
.details p {
  margin: 0;
  font-size: 12px;
  word-break: break-all;
}
</style>

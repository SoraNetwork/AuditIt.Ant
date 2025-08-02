<template>
  <div class="print-container">
    <div v-for="item in items" :key="item.id" class="label-wrapper">
      <div class="label">
        <p class="item-name">{{ item.itemDefinition?.name }}</p>
        <div class="qr-code">
          <canvas :ref="el => setCanvasRef(el, item.id)"></canvas>
        </div>
        <div class="details">
          <p v-if="item.shortId">{{ item.shortId }}</p>
          <p v-if="item.remarks" class="remarks">{{ item.remarks }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
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
      // Use the internal GUID for the QR code content
      QRCode.toCanvas(canvas, item.id, { width: 85, margin: 0 }, (error) => {
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
      await nextTick(); // Ensure canvases are in the DOM
      generateQRCodes();
      
      // Automatically trigger print dialog
      window.onload = () => {
        window.print();
      };

    } catch (error) {
      console.error("Failed to fetch items for printing:", error);
    }
  }
});
</script>

<style scoped>
/* Default screen styles */
.print-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background-color: #f0f2f5;
}
.label-wrapper {
  border: 1px dashed #ccc;
  width: 300px; /* Preview width */
}
.label {
  padding: 8px;
  background-color: white;
  text-align: center;
}
.item-name {
  font-weight: bold;
}
.qr-code {
  margin: 8px 0;
}
.details p {
  margin: 2px 0;
  font-size: 12px;
  word-break: break-all;
}
.remarks {
  font-style: italic;
  color: #333;
}


/* Print-specific styles */
@media print {
  /* Hide everything else */
  body * {
    visibility: hidden;
  }
  .print-container, .print-container * {
    visibility: visible;
  }
  
  /* Remove screen-only styles */
  .print-container {
    padding: 0;
    background-color: transparent;
  }
  
  .label-wrapper {
    border: none;
    width: 40mm;
    height: 30mm;
    page-break-after: always; /* Ensure each label is on a new page */
    overflow: hidden;
  }

  .label {
    width: 100%;
    height: 100%;
    padding: 2mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: row; /* Changed to row for landscape */
    align-items: center;
    justify-content: flex-start;
    font-family: 'SimSun', 'Songti SC', serif;
  }

  .qr-code {
    width: 24mm; /* Fixed width for QR code */
    height: 24mm;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 2mm;
  }
  
  .qr-code canvas {
    max-width: 100%;
    max-height: 100%;
  }

  .details {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: left;
    height: 100%;
    overflow: hidden;
  }

  .item-name {
    font-size: 9pt;
    font-weight: bold;
    margin: 0;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .details p {
    font-size: 8pt;
    margin: auto 0;
    word-break: break-all;
    line-height: 1.2;
  }
  
  .remarks {
    font-size: 7pt;
    font-style: italic;
  }
}

@page {
  size: 40mm 30mm; /* Changed to landscape */
  margin: 0;
}
</style>
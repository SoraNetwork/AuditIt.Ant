import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'child_process';

const getGitSha = () => {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unknown';
  }
};

const gitSha = getGitSha();

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitSha),
  },
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('ant-design-vue') || id.includes('@ant-design')) {
            return 'vendor-antd';
          }

          if (id.includes('vue') || id.includes('pinia')) {
            return 'vendor-vue';
          }

          if (id.includes('chart.js') || id.includes('vue-chartjs')) {
            return 'vendor-charts';
          }

          if (id.includes('xlsx')) {
            return 'vendor-xlsx';
          }

          return 'vendor';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0'
  }
})

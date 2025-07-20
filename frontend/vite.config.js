import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      ws: true,
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq, req, res) => {
          proxyReq.setTimeout(60000); // 60 seconds
        });
      }
    }
  }
  },
})

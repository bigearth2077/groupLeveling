import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/ws': {
        target: 'wss://spark-api.xf-yun.com',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/ws/, '/v1.1/chat'),
      },
    },
  },
})
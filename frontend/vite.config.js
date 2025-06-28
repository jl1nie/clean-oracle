import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api': {
          // 開発モードではバックエンドサーバーに、それ以外（テストなど）ではモックサーバーに向ける
          target: mode === 'development' ? 'http://localhost:5000' : 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.js',
      include: ['src/**/*.test.jsx'],
      exclude: ['tests/**'],
    },
  };
});

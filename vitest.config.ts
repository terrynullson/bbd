import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// JSX собирает esbuild по `jsx: react-jsx` из tsconfig — плагин React тестам не нужен.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});

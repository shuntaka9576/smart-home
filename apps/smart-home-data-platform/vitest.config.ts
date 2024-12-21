import dotenv from '@dotenvx/dotenvx';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: dotenv.config({ path: '.env' }).parsed,
    name: 'unit',
    dir: 'src',
    globals: true,
    testTimeout: 100_000_000,
    coverage: {
      include: ['src/**/*.ts'],
      reporter: ['json'],
    },
    reporters: 'verbose',
  },
});

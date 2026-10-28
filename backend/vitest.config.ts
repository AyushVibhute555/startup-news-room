import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: false,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        pool: 'forks',
        poolOptions: { forks: { singleFork: true } },
        testTimeout: 30_000,
        hookTimeout: 60_000,
    },
});
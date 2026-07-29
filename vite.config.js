import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        react()
    ],
    assetsInclude: ['**/*.wasm'],
    server: {
        port: 5173,
        open: true,
    },
});

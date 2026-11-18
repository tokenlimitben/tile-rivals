import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client lives in /client. The Socket.IO server runs separately in dev,
// so /socket.io is proxied to it. In production the server serves dist/client.
export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    // Source maps can embed absolute local paths, so they stay off (see docs/plan.md, privacy).
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on 0.0.0.0 (required for Render/Docker)
    allowedHosts: [
      'staticforge-cms.onrender.com',
      '.onrender.com',
      'localhost'
    ]
  }
});
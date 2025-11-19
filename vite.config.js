import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on 0.0.0.0
    allowedHosts: [
      'staticforge-cms.onrender.com',
      '.onrender.com',
      'localhost',
      '127.0.0.1'
    ]
  },
  preview: {
    host: true, // Listen on 0.0.0.0 for production preview
    allowedHosts: [
      'staticforge-cms.onrender.com',
      '.onrender.com'
    ]
  }
});
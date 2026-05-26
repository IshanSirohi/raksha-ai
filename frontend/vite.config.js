import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const processEnv = {
    NODE_ENV: JSON.stringify(env.NODE_ENV || 'development'),
    REACT_APP_API_BASE_URL: JSON.stringify(env.VITE_APP_API_BASE_URL || env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5000'),
    REACT_APP_USE_MOCK: JSON.stringify(env.VITE_APP_USE_MOCK || env.REACT_APP_USE_MOCK || 'true'),
    REACT_APP_FIREBASE_API_KEY: JSON.stringify(env.VITE_FIREBASE_API_KEY || env.REACT_APP_FIREBASE_API_KEY || ''),
    REACT_APP_FIREBASE_AUTH_DOMAIN: JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || env.REACT_APP_FIREBASE_AUTH_DOMAIN || ''),
    REACT_APP_FIREBASE_PROJECT_ID: JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || env.REACT_APP_FIREBASE_PROJECT_ID || ''),
    REACT_APP_FIREBASE_STORAGE_BUCKET: JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || env.REACT_APP_FIREBASE_STORAGE_BUCKET || ''),
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID: JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || ''),
    REACT_APP_FIREBASE_APP_ID: JSON.stringify(env.VITE_FIREBASE_APP_ID || env.REACT_APP_FIREBASE_APP_ID || '')
  };

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true
    },
    define: {
      'process.env': processEnv
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});

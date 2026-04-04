import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectRegister: 'auto',
        manifest: {
          id: '/',
          name: 'خمن تخمينة',
          short_name:'خمن تخمينة',
          description: 'لعبة تخمين كلمات وصور ممتعة',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone', // خليها standalone أحسن للتوافق
          icons: [
            {
              src: 'icon-v2.svg',
              sizes: 'any', // الـ SVG يفضل يكون any
              type: 'image/svg+xml',
              purpose: 'any' 
            },
            {
              src: 'icon-192.png', // لازم تضيف نسخة PNG
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icon-512.png', // لازم تضيف نسخة PNG
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable' // عشان تملأ الأيقونة في أندرويد
            }
          ],
          screenshots: [
            {
              src: 'screenshot-mobile.png',
              sizes: '1080x1920', // اتأكد من مقاس الصورة اللي صورتها
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Game Play on Mobile'
            },
            {
              src: 'screenshot-desktop.png',
              sizes: '1920x1080', // اتأكد من مقاس الصورة اللي صورتها
              type: 'image/png',
              form_factor: 'wide',
              label: 'Game Play on Desktop'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

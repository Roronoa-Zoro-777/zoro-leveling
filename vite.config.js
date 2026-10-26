/**
 * vite.config.js — PWA + service worker via vite-plugin-pwa (Workbox)
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Pre-cache all app assets so it works offline after first load
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
        // Don't cache cross-origin requests (there are none — all local)
        navigateFallback: 'index.html',
        runtimeCaching: [], // no CDN to cache
      },
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'ZoroLevel — Productivity Tracker',
        short_name: 'ZoroLevel',
        description: 'Gamified offline-first To-Do app with XP, levels, and charts. Your data stays on this device.',
        theme_color: '#000005',
        background_color: '#000005',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
        categories: ['productivity', 'lifestyle'],
      },
      devOptions: {
        // Enable PWA in dev mode for testing
        enabled: false,
        type: 'module',
      },
    }),
  ],
});

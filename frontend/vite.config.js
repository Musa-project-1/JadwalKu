import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages project site: https://musa-project-1.github.io/JadwalKu/
  // Jika repo di-rename / pakai custom domain, ubah nilai base di sini.
  base: '/JadwalKu/',
  build: {
    // matikan <link rel=modulepreload> — Vite inject preload untuk semua manualChunks
    // tapi SW Workbox serve dari CacheStorage -> mismatch "preloaded but not used within a few seconds"
    // warning 20x numpuk. Import tetap load normal via <script type=module>.
    modulePreload: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const nid = id.replace(/\\/g, '/')
          if (!nid.includes('node_modules')) return undefined
          // Heavy, rarely-needed doc parsers → own lazy chunks (keep out of initial)
          if (nid.includes('xlsx') || nid.includes('cpexcel')) return 'xlsx'
          if (nid.includes('pdfjs-dist')) return 'pdf'
          if (nid.includes('mammoth')) return 'mammoth'
          if (nid.includes('tesseract')) return 'tesseract'
          // Firebase SDKs split so no single chunk exceeds the 500 kB budget
          if (nid.includes('/firebase/firestore') || nid.includes('@firebase/firestore')) return 'firebase-firestore'
          if (nid.includes('/firebase/auth') || nid.includes('@firebase/auth')) return 'firebase-auth'
          if (nid.includes('/firebase/app') || nid.includes('@firebase/app')) return 'firebase-app'
          if (nid.includes('/firebase/') || nid.includes('@firebase/')) return 'firebase-shared'
          // React + Router + scheduler vendor
          if (nid.includes('node_modules/react')) return 'react-vendor'
          return undefined
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'logo.svg',
        'logo-full.svg',
        'favicon.svg',
        'favicon-16.png',
        'favicon-32.png',
        'apple-touch-icon.png',
        'pwa-192.png',
        'pwa-512.png',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/JadwalKu/index.html',
        // Jangan intercept URL dengan query params selain hash router
        // agar Lighthouse audit (?audit=1) tidak kena redirect loop
        navigateFallbackDenylist: [/\?(?!$)/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Saat chunk JS/CSS di-fetch dan 404 (hash lama tidak ada di cache baru)
        // -> abaikan dari precache agar SW tidak blok request -> fallback ke network
        // -> controllerchange di main.jsx akan reload halaman
        navigationPreload: false,
      },
      manifest: {
        name: 'JadwalKu',
        short_name: 'JadwalKu',
        description: 'Jadwal kuliah, ujian, dan tugas dalam satu aplikasi',
        theme_color: '#00685F',
        background_color: '#F5FAF8',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/JadwalKu/',
        scope: '/JadwalKu/',
        lang: 'id',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})

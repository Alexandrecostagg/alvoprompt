import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: true,
  },
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'logo.svg', 'apple-touch-icon.png'],
    manifest: {
      name: 'AlvoPrompter — Teleprompter com IA',
      short_name: 'AlvoPrompter',
      description:
        'Seu roteiro no alvo. Seu olhar na câmera. Teleprompter com VoiceTrack, gravação, legendas e editor de vídeo.',
      lang: 'pt-BR',
      theme_color: '#f4f5fa',
      background_color: '#0b0d12',
      display: 'standalone',
      orientation: 'any',
      start_url: '/',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,ttf}'],
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/media\//],
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        },
      ],
    },
  })],
})

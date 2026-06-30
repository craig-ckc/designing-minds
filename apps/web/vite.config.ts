import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Workspace packages ship raw TypeScript via their "exports", so bundle (don't
  // externalize) them in the SSR build — otherwise Node would try to import .ts
  // at prerender time and fail.
  ssr: {
    noExternal: ['@designing-minds/cms', '@designing-minds/utils'],
  },
  server: {
    port: 5173,
    // Proxy /api/* to the local functions dev server. The functions app
    // registers routes without the /api prefix (Vercel adds it in prod), so we
    // strip it here. Keeps browser requests same-origin — no CORS in dev.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

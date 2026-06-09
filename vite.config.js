import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',          // ← rutas relativas para que funcione como archivo local
  server: {
    port: parseInt(process.env.PORT || '5173'),
  },
})

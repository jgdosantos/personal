import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// Duas entradas HTML: a home e a /daniela-morais, que precisa das próprias
// tags de título/og no HTML cru (prévia de link no WhatsApp). As duas carregam
// o mesmo src/main.jsx, que escolhe a página pelo pathname.
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        daniela: resolve(__dirname, 'daniela-morais.html'),
      },
    },
  },
})

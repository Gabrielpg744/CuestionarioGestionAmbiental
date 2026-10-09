import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Sin esto Vite solo escucha en localhost y nadie de la red puede entrar
    // en desarrollo. En producción la interfaz la sirve el server (:3040).
    host: true,
    port: 5177,
    proxy: {
      '/api': 'http://localhost:3040',
    },
  },
});

// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // Dominio de producción: necesario para las URLs absolutas de las etiquetas Open Graph
  site: 'https://alpharunningclubhn.coderhn.dev',

  // Rutas antiguas que devolvían 404 / 403
  redirects: {
    '/club': '/#club',
    '/eventos': '/#eventos',
    '/privacidad': '/',
    '/calculadoras': '/zonas-desempeno',
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});
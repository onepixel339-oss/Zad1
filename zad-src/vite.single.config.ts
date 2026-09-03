import { defineConfig, type Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * Everything-in-one build: JS, CSS, fonts and the favicon are inlined into
 * a single index.html (dist-single/index.html) that can be uploaded anywhere.
 *
 * Trade-off (by design): no service worker / manifest — a service worker
 * must be a separate same-origin file, so the offline shell only exists in
 * the regular multi-file build.
 */
function inlineFavicon(): Plugin {
  return {
    name: 'zad-inline-favicon',
    transformIndexHtml(html) {
      const svg = readFileSync(resolve(__dirname, 'public/icons/icon.svg'), 'utf8')
      const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
      return html
        .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${dataUri}" type="image/svg+xml" />`)
        .replace(/<link rel="apple-touch-icon"[^>]*>\s*/, '')
        .replace(/<link rel="manifest"[^>]*>\s*/, '')
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile(), inlineFavicon()],
  css: { postcss: {} },
  define: { __ZAD_SINGLE__: JSON.stringify(true) },
  build: {
    outDir: 'dist-single',
    assetsDir: 'assets',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
})

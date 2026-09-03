import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Generates a precache manifest consumed by the service worker so the
 * offline shell works from the very first visit.
 */
function precacheManifest(): Plugin {
  return {
    name: 'zad-precache-manifest',
    apply: 'build',
    writeBundle(_options, bundle) {
      const urls = Object.keys(bundle)
        .filter((name) => {
          const asset = bundle[name]
          if (!('fileName' in asset)) return false
          return /\.(js|css|woff2?|png|svg|webmanifest)$/.test(asset.fileName)
        })
        .map((name) => `./${(bundle[name] as { fileName: string }).fileName}`)
      const manifest = `self.__ZAD_PRECACHE = ${JSON.stringify(urls, null, 2)};\n`
      // write next to THIS build's real output (never a hardcoded dir —
      // a parallel outDir like dist-preview must not clobber dist's manifest)
      const outDir = resolve(__dirname, _options.dir || 'dist')
      mkdirSync(outDir, { recursive: true })
      writeFileSync(resolve(outDir, 'precache-manifest.js'), manifest)
    },
  }
}

/**
 * Injects a tiny classic script into <head> that registers the service
 * worker immediately — before the JS bundle even downloads. Auditors
 * that snapshot the page quickly (PWABuilder) see the registration
 * without needing to wait for module evaluation. Also logs a version
 * marker so a fresh deployment can be verified from the console.
 * NOT used in the single-file build (no sw.js exists there).
 */
function swRegisterInline(): Plugin {
  let swUrl = '/sw.js'
  return {
    name: 'zad-sw-register-inline',
    apply: 'build',
    configResolved(config) {
      swUrl = `${config.base}sw.js`
    },
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            children: `try{navigator.serviceWorker.register(${JSON.stringify(swUrl)}).catch(function(){})}catch(e){}try{console.info("[zad] v3")}catch(e){}`,
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}

export default defineConfig({
  // deploy-first default: the site lives at the root of its domain
  // (Vercel / Netlify / GitHub Pages user site / any static host).
  // The sandbox preview host — which serves the app under /app/ —
  // builds explicitly with:  vite build --base=/app/
  base: '/',
  plugins: [react(), precacheManifest(), swRegisterInline()],
  // the SW-registration guard flag MUST be inlined in every build —
  // left literal it throws ReferenceError at load and the service
  // worker never registers on deployed sites (PWABuilder: "no SW")
  define: { __ZAD_SINGLE__: JSON.stringify(false) },
  // pure vanilla CSS — no postcss pipeline (and never the parent Tailwind config)
  css: { postcss: {} },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
  },
})

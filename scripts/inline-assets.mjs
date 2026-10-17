// Build step: turn Vite's output into one self-contained index.html
// (Article V.2 and Article XVI.2).
//
//   - inlines the built CSS into a <style> in <head>
//   - inlines the built JS into a <script type="module">
//   - fills @@BYTES@@ on the "This site" tile with the real gzipped size
//   - deletes dist/assets, since nothing points at it any more

import { readFileSync, writeFileSync, rmSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'

const file = resolve('dist/index.html')
let html = readFileSync(file, 'utf8')

const PATTERNS = {
  css: /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/,
  js: /<script[^>]+src="([^"]+)"[^>]*><\/script>/,
}

for (const [kind, re] of Object.entries(PATTERNS)) {
  const match = html.match(re)
  if (!match) throw new Error(`inline-assets: could not find the built ${kind} in index.html`)

  const code = readFileSync(resolve('dist', match[1].replace(/^\//, '')), 'utf8')
  html = html.replace(
    re,
    kind === 'css' ? `<style>${code}</style>` : `<script type="module">${code}</script>`,
  )
}

// Fill in the real gzipped size on the "This site" tile, so the page reports the
// same number the size gate does. A few passes, because the number is part of
// the size it measures.
const size = (s) => gzipSync(Buffer.from(s), { level: 9 }).length
const withBytes = (n) => html.replaceAll('@@BYTES@@', String(n))

let bytes = size(withBytes('10000'))
for (let i = 0; i < 3; i++) {
  const next = size(withBytes(String(bytes)))
  if (next === bytes) break
  bytes = next
}

if (!/^\d+$/.test(String(bytes))) throw new Error('inline-assets: bad byte count')
writeFileSync(file, withBytes(String(bytes)))

// Nothing references dist/assets any more.
const assets = resolve('dist/assets')
if (exists(assets)) rmSync(assets, { recursive: true })

console.log(`inlined CSS and JS into dist/index.html (${bytes} bytes gzipped)`)

function exists(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

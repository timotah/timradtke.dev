// Build config. The plugin below is the whole build pipeline:
//  - reads src/content.json (Article IV: the single source of truth)
//  - renders the bento tiles and the navbar into static HTML (Article V.1)
//  - generates the JSON-LD Person block (Article XI.4)
//  - inlines the detail views and the resume as JSON, so nothing ships twice
//  - fills in the real byte count on the "This site" tile (Article VII.7)

import { readFileSync } from 'node:fs'

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )

function inlineContent() {
  const c = JSON.parse(readFileSync('src/content.json', 'utf8'))
  const p = c.person

  const nav = c.nav
    .map((n) => {
      const attrs = n.tile
        ? ` data-open="${esc(n.id)}"`
        : n.external
          ? ' rel="me noopener"'
          : ''
      return `<li><a href="${esc(n.href)}"${attrs}>${esc(n.label)}</a></li>`
    })
    .join('')

  const tiles = c.tiles
    .map((t) => {
      const open = !!t.dialog
      const title = t.href
        ? `<h2><a href="${esc(t.href)}"${t.external ? ' rel="noopener"' : ''}>${esc(t.title)}</a></h2>`
        : `<h2>${esc(t.title)}</h2>`
      const link = (x) =>
        `<a href="${esc(x.href)}"${x.external ? ' rel="me noopener"' : ''}>${esc(x.text)}</a>`

      const body = (t.lines ?? [])
        .map((l) => {
          if (typeof l === 'string') return `<p>${esc(l)}</p>`
          if (l.links) return `<p>${l.links.map(link).join(' · ')}</p>`
          if (l.href) return `<p>${link(l)}</p>`
          return (
            `<p>${esc(l.text)} <b class="mono bytes">@@BYTES@@</b>` +
            ` bytes and arrived in one round trip.</p>`
          )
        })
        .join('')
      const chips = (t.badges ?? []).map((b) => `<span class="chip">${esc(b)}</span>`).join('')
      const more = open
        ? `<a class="more" href="#${esc(t.id)}" data-open="${esc(t.dialog ?? t.id)}">` +
          `${esc(t.more ?? 'Open')} <span aria-hidden="true">+</span></a>`
        : ''
      return (
        `<article class="tile tile--${esc(t.id)}${open ? ' tile--open' : ''}" id="tile-${esc(t.id)}">` +
        title +
        body +
        (chips ? `<p class="chips">${chips}</p>` : '') +
        more +
        `</article>`
      )
    })
    .join('\n    ')

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${p.url}/#person`,
    name: p.name,
    jobTitle: p.jobTitle,
    url: `${p.url}/`,
    email: p.email,
    worksFor: { '@type': 'Organization', name: p.worksFor },
    address: { '@type': 'PostalAddress', addressLocality: p.location },
    knowsAbout: p.knowsAbout,
    sameAs: p.sameAs,
  })

  let isBuild = false

  return {
    name: 'inline-content',
    configResolved(config) {
      isBuild = config.command === 'build'
    },
    buildStart() {
      if (c.dialogs) {
        // Detail views are rendered by main.js from the inline JSON, so the build
        // only checks that every tile's dialog exists.
        for (const t of c.tiles) {
          if (t.dialog && !c.dialogs[t.dialog]) {
            this.error(`content.json: tile "${t.id}" has no dialog "${t.dialog}"`)
          }
        }
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html
          .replace('<!--nav-->', nav)
          .replace('<!--tiles-->', tiles)
          .replace('<!--jsonld-->', `<script type="application/ld+json">${jsonld}</script>`)
          .replace('<!--data-->', dataScript(c))
          // The real size is only known once the build has finished.
          .replaceAll('@@BYTES@@', isBuild ? '@@BYTES@@' : '—')
      },
    },
  }
}

// Inline the detail views and the resume. main.js renders from this, so nothing
// is shipped twice (Article II.3). The resume is only read when printing
// (Article X.2).
function dataScript(c) {
  const payload = JSON.stringify({
    dialogs: c.dialogs,
    resume: c.resume,
    email: c.person.email,
  })
  return `<script type="application/json" id="data">${payload.replace(/<\/script/gi, '<\\/script')}</script>`
}

export default {
  base: '/',
  plugins: [inlineContent()],
  build: {
    modulePreload: { polyfill: false },
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    minify: 'esbuild',
    cssMinify: true,
    target: 'es2022',
    reportCompressedSize: false,
  },
}

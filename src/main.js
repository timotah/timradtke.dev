/*
  The whole SPA. Everything here is an addition on top of the static bento
  (Article II.2): if this file never runs, the page still reads completely.
*/

const $ = (s, r = document) => r.querySelector(s)

const data = JSON.parse($('#data').textContent)
const dialog = $('#detail')
const dialogBody = $('#detail-body')

/* --- Light bulb: the mode switch (Article IX.2) --- */

const bulb = $('.bulb')
const mode = () => (document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light')

bulb.addEventListener('click', () => {
  const next = mode() === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.mode = next
  try {
    localStorage.setItem('mode', next)
  } catch {
    /* private mode; the choice just doesn't stick */
  }
})

/* --- Detail views (Article VIII.3 and VIII.4) --- */

function fill(name) {
  const d = data.dialogs?.[name]
  if (!d) return false
  const title = `<h2 id="dlg-title">${d.title}</h2>`
  const body = (d.body ?? [])
    .map((b) => (b.list ? `<ul>${b.list.map((i) => `<li>${i}</li>`).join('')}</ul>` : `<p>${b}</p>`))
    .join('')
  dialogBody.innerHTML = title + body
  dialog.setAttribute('aria-labelledby', 'dlg-title')
  return true
}

function open(name, push = true) {
  if (!fill(name)) return
  if (push && location.hash !== `#${name}`) history.pushState(null, '', `#${name}`)
  if (!dialog.open) dialog.showModal()
}

function close() {
  if (dialog.open) dialog.close()
  history.replaceState(null, '', location.pathname + location.search)
}

document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open]')
  if (opener) {
    e.preventDefault()
    open(opener.dataset.open)
  }
})

dialog.addEventListener('click', (e) => {
  // Backdrop click, or the close button.
  if (e.target === dialog || e.target.closest('[data-close]')) close()
})

dialog.addEventListener('close', () => {
  if (location.hash) history.replaceState(null, '', location.pathname + location.search)
})

addEventListener('popstate', () => {
  const name = location.hash.slice(1)
  if (name && data.dialogs?.[name]) open(name, false)
  else if (dialog.open) dialog.close()
})

/* --- Start --- */

const initial = location.hash.slice(1)
if (initial && data.dialogs?.[initial]) open(initial, false)

/* --- Resume, built only when printing (Article X.2) --- */

addEventListener('beforeprint', () => {
  if (data.resume) buildPrint()
})

let printed = false
function buildPrint() {
  if (printed) return
  printed = true
  const r = data.resume
  const el = document.createElement('div')
  el.className = 'print'
  el.innerHTML =
    `<h1>${r.name}</h1>` +
    `<p>${r.contact}</p>` +
    (r.summary ? `<p>${r.summary}</p>` : '') +
    r.sections
      .map((s) => {
        if (s.jobs) {
          return (
            `<h3>${s.heading}</h3>` +
            s.jobs
              .map(
                (j) =>
                  `<div class="job"><strong>${j.title} · ${j.company}</strong>` +
                  `<span>${j.dates}</span>` +
                  (j.points ? `<ul>${j.points.map((p) => `<li>${p}</li>`).join('')}</ul>` : '') +
                  `</div>`,
              )
              .join('')
          )
        }
        return (
          `<h3>${s.heading}</h3>` +
          `<p>${Array.isArray(s.text) ? s.text.join(' · ') : s.text}</p>`
        )
      })
      .join('')
  document.body.append(el)
}

/* --- Easter eggs (Article XIV). Small, and none of them are load-bearing. --- */

console.log(
  '%cTim Radtke%c\nHand-written. No framework. Under 14kb gzipped.\nIf you looked at the source, we should talk: ' +
    data.email,
  'font:600 14px system-ui',
  'font:12px ui-monospace',
)

const title = document.title
addEventListener('visibilitychange', () => {
  document.title = document.hidden ? '👀 come back' : title
})

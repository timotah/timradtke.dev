// Builds dist/404.html (Article III.5: the 404 page has the same budget, so it
// ships only the theme script and a few lines of CSS).

import { writeFileSync, mkdirSync } from 'node:fs'

const html = `<!doctype html>
<html lang="en" data-theme="gruvbox">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Not found — Tim Radtke</title>
<meta name="description" content="That page doesn't exist. Back to the portfolio.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext x='2' y='13' font-family='monospace' font-size='12' fill='%23af3a03'%3Etr%3C/text%3E%3C/svg%3E">
<script>try{var m=localStorage.getItem('mode');if(!m)m=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.dataset.mode=m}catch(e){}</script>
<style>
:root{--bg:#fbf1c7;--fg:#3c3836;--accent:#af3a03;--muted:#7c6f64}
:root[data-mode=dark]{--bg:#282828;--fg:#ebdbb2;--accent:#fe8019;--muted:#a89984}
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:grid;place-content:center;gap:1rem;
padding:1.5rem;background:var(--bg);color:var(--fg);
font:1rem/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center}
h1{margin:0;font-size:clamp(1.6rem,5vw,2.6rem)}
p{margin:0;color:var(--muted)}
a{color:var(--accent)}
</style>
</head>
<body>
<main>
<h1>This page doesn't exist</h1>
<p>The link may be old, or the address may have a typo in it.</p>
<p><a href="/">Back to the portfolio</a></p>
</main>
</body>
</html>
`

mkdirSync('dist', { recursive: true })
writeFileSync('dist/404.html', html)
console.log(`wrote dist/404.html (${html.length} raw)`)

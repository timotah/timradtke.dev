// Generates public/og.png (1200x630), using a hand-rolled PNG encoder so the
// repo needs no image libraries. Run once and commit the result:
//   node scripts/make-og.mjs
// Not part of `npm run build`.

import { deflateSync, crc32 } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const W = 1200
const H = 630

// Gruvbox dark, so link previews look like the site.
const BG = [40, 40, 40]
const FG = [235, 219, 178]
const ACCENT = [254, 128, 25]

const GLYPHS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001'],
  B: ['11110', '10001', '11110', '10001', '10001', '11110'],
  D: ['11110', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '01110'],
  I: ['11111', '00100', '00100', '00100', '00100', '11111'],
  K: ['10001', '10010', '11100', '10010', '10001', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10111', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '11011', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100'],
  '·': ['00000', '00000', '00100', '00000', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000'],
}

const pixels = Buffer.alloc(W * H * 3)
for (let i = 0; i < W * H; i++) {
  pixels[i * 3] = BG[0]
  pixels[i * 3 + 1] = BG[1]
  pixels[i * 3 + 2] = BG[2]
}

function set(x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return
  const i = (y * W + x) * 3
  pixels[i] = r
  pixels[i + 1] = g
  pixels[i + 2] = b
}

function text(str, x, y, scale, color) {
  let cursor = x
  for (const ch of str.toUpperCase()) {
    const glyph = GLYPHS[ch] ?? GLYPHS[' ']
    for (let ry = 0; ry < glyph.length; ry++) {
      for (let rx = 0; rx < glyph[ry].length; rx++) {
        if (glyph[ry][rx] !== '1') continue
        for (let py = 0; py < scale; py++) {
          for (let px = 0; px < scale; px++) {
            set(cursor + rx * scale + px, y + ry * scale + py, color)
          }
        }
      }
    }
    cursor += 6 * scale
  }
  return cursor
}

// Name, centered-ish, with a mono accent line under it.
text('TIM RADTKE', 96, 180, 12, FG)
set(96, 320, ACCENT)
for (let x = 96; x < 96 + 12 * 6 * 11; x++) set(x, 320, ACCENT)
text('FULL·STACK ENGINEER', 96, 380, 5, ACCENT)
text('DATA SYSTEMS', 96, 460, 5, [168, 153, 132])

// --- PNG encoding ---
const raw = Buffer.alloc(H * (W * 3 + 1))
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0 // filter: none
  pixels.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3)
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body) >>> 0)
  return Buffer.concat([len, body, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 2 // color type: truecolor
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

writeFileSync('public/og.png', png)
console.log(`wrote public/og.png (${png.length} bytes)`)

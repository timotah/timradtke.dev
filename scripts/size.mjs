// Size gate (Article III). Uses only Node's built-in zlib.
// Build over budget => exit 1 => Cloudflare never deploys it.

import { readFileSync } from 'node:fs'
import { gzipSync, brotliCompressSync, constants } from 'node:zlib'

const LIMIT = 14_000
const TARGET = 12_800
const gzip = (b) => gzipSync(b, { level: 9 }).length
const brotli = (b) =>
  brotliCompressSync(b, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length

const files = ['dist/index.html', 'dist/404.html']

export function report() {
  let failed = false
  for (const file of files) {
    let buf
    try {
      buf = readFileSync(file)
    } catch {
      console.error(`✗ missing ${file}`)
      failed = true
      continue
    }
    const gz = gzip(buf)
    console.log(
      `${file}  raw ${buf.length}  gzip ${gz}  brotli ${brotli(buf)}` +
        `  (target ${TARGET}, limit ${LIMIT})`,
    )
    if (gz > LIMIT) {
      console.error(`✗ ${file} over the 14kb budget`)
      failed = true
    } else if (gz > TARGET) {
      console.warn(`! ${file} over the working target`)
    }
  }
  return failed
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(report() ? 1 : 0)
}

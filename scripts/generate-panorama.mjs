/**
 * Генерирует синтетическую equirectangular-панораму 2048x1024
 * для локальной разработки 3D-тура (без внешних картинок и CORS).
 *
 * Запуск: node scripts/generate-panorama.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const W = 2048
const H = 1024
const HORIZON = H / 2
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/panoramas/workshop-placeholder.png')

const px = Buffer.alloc(W * H * 3)

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))
const lerp = (a, b, t) => a + (b - a) * t

function setPixel(x, y, r, g, b) {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  const i = (y * W + x) * 3
  px[i] = clamp(r)
  px[i + 1] = clamp(g)
  px[i + 2] = clamp(b)
}

function fillRect(x0, x1, y0, y1, r, g, b) {
  for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) {
    for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) {
      setPixel(x, y, r, g, b)
    }
  }
}

// Небо и пол с мягким свечением на линии горизонта
for (let y = 0; y < H; y++) {
  const dy = y - HORIZON
  for (let x = 0; x < W; x++) {
    let r, g, b
    if (dy < 0) {
      const t = -dy / HORIZON // 0 у горизонта → 1 в зените
      r = lerp(30, 5, t)
      g = lerp(50, 8, t)
      b = lerp(72, 18, t)
    } else {
      const t = dy / (H - HORIZON) // 0 у горизонта → 1 в надире
      r = lerp(32, 6, t)
      g = lerp(41, 9, t)
      b = lerp(52, 13, t)
    }

    const glow = Math.max(0, 1 - Math.abs(dy) / 110)
    if (glow > 0) {
      r += 20 * glow
      g += 52 * glow
      b += 64 * glow
    }

    // Сетка по долготе (каждые 22.5°) и широте
    if (x % 128 === 0) {
      r += 8
      g += 12
      b += 16
    }
    if (y % 128 === 0 && Math.abs(dy) > 4) {
      r += 6
      g += 9
      b += 12
    }

    setPixel(x, y, r, g, b)
  }
}

// Силуэты оборудования вдоль горизонта
const MACHINES = [
  { x: 120, w: 150, top: 452, accent: [56, 189, 248] },
  { x: 340, w: 95, top: 478, accent: [251, 191, 36] },
  { x: 520, w: 180, top: 430, accent: [56, 189, 248] },
  { x: 760, w: 110, top: 470, accent: [148, 163, 184] },
  { x: 930, w: 140, top: 445, accent: [251, 191, 36] },
  { x: 1180, w: 200, top: 460, accent: [56, 189, 248] },
  { x: 1460, w: 100, top: 485, accent: [148, 163, 184] },
  { x: 1640, w: 170, top: 440, accent: [251, 191, 36] },
  { x: 1880, w: 120, top: 472, accent: [56, 189, 248] },
]

const BASE = 566

for (const m of MACHINES) {
  // Корпус
  fillRect(m.x, m.x + m.w, m.top, BASE, 19, 27, 36)
  fillRect(m.x + 6, m.x + m.w - 6, m.top + 8, BASE - 8, 24, 34, 45)
  // Акцентная кромка
  fillRect(m.x, m.x + m.w, m.top, m.top + 4, ...m.accent)
  // «Окна» / индикаторы
  for (let i = 0; i < 3; i++) {
    const wx = m.x + 18 + i * 26
    if (wx + 10 < m.x + m.w - 12) {
      fillRect(wx, wx + 10, m.top + 34, m.top + 48, 250, 204, 21)
    }
  }
  // Опора / тень
  fillRect(m.x + m.w / 2 - 6, m.x + m.w / 2 + 6, BASE, BASE + 10, 12, 18, 24)
}

// Разметка на «полу» — пара тонких направляющих
fillRect(0, W, 690, 694, 45, 120, 145)
fillRect(0, W, 856, 858, 28, 70, 86)

// --- PNG-энкодер (RGB, без внешних зависимостей) ---
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([length, typeBuf, data, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 2 // color type: RGB
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const raw = Buffer.alloc(H * (1 + W * 3))
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0 // filter: none
  px.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3)
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, png)
console.log(`Панорама создана: ${OUT} (${(png.length / 1024).toFixed(0)} КБ)`)

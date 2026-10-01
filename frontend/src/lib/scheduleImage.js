/**
 * PNG jadwal mengikuti grid mingguan di web: kolom hari, baris sesi,
 * kartu berwarna sesuai tipe kelas. Tanpa toolbar.
 */

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const SESSIONS = [
  { id: 'pagi', label: 'Pagi', range: '07.00 – 11.55', before: 12 * 60 },
  { id: 'siang', label: 'Siang', range: '12.30 – 15.15', before: 15 * 60 + 15 },
  { id: 'sore', label: 'Sore', range: '15.30 – 18.00', before: 18 * 60 },
  { id: 'malam', label: 'Malam', range: '18.30 – 21.30+', before: 24 * 60 },
]

const TONE = {
  offline: { bg: '#E7F6EE', line: '#059669', ink: '#064E3B', sub: '#047857', pill: '#059669' },
  online: { bg: '#E7F0FE', line: '#2563EB', ink: '#1E3A8A', sub: '#1D4ED8', pill: '#2563EB' },
  hybrid: { bg: '#F3E8FF', line: '#7C3AED', ink: '#5B21B6', sub: '#6D28D9', pill: '#7C3AED' },
  combined: { bg: '#FEF3C7', line: '#D97706', ink: '#92400E', sub: '#B45309', pill: '#D97706' },
  neutral: { bg: '#F1F5F4', line: '#64748B', ink: '#1E293B', sub: '#475569', pill: '#64748B' },
}

const PAGE = '#F4FAF7'
const INK = '#14211F'
const MUTED = '#5C6B68'
const LINE = '#D5E4DE'
const FONT = '"Plus Jakarta Sans", "Noto Sans", system-ui, sans-serif'

const L = { width: 1400, pad: 28, header: 108, dayHead: 64, gutter: 132, cardH: 92, cardGap: 8 }

/**
 * @param {Array<{hari:string, jamMulai:string, jamSelesai:string, kodeMK:string, namaMK?:string, dosen?:string, ruang?:string, tipeKelas?:string}>} entries
 * @param {{prodi?: string|null, semester?: string|number|null, tahunAjaran?: string|null, courses?: Map|Record|null}} meta
 */
export async function renderScheduleImage(entries, meta = {}) {
  await ensureScheduleFont()
  const placed = placeEntries(entries, meta.courses)
  const rowHeights = SESSIONS.map((session) => {
    const counts = DAY_ORDER.map(
      (day) => placed.filter((c) => c.hari.toLowerCase() === day.toLowerCase() && c.session === session.id).length,
    )
    return 20 + Math.max(1, ...counts) * (L.cardH + L.cardGap)
  })
  const height = L.header + L.dayHead + rowHeights.reduce((a, b) => a + b, 0) + L.pad

  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = L.width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  ctx.fillStyle = PAGE
  ctx.fillRect(0, 0, L.width, height)
  drawHeader(ctx, meta)
  drawDayHeads(ctx)
  drawRows(ctx, placed, rowHeights)
  return canvas
}

let fontReady = null

function ensureScheduleFont() {
  if (typeof document === 'undefined' || !document.fonts || fontReady) return fontReady
  const face = new FontFace('Plus Jakarta Sans', 'url(/fonts/PlusJakartaSans.ttf)')
  fontReady = face.load().then((loaded) => {
    document.fonts.add(loaded)
  }).catch(() => {})
  return fontReady
}

function drawHeader(ctx, meta) {
  ctx.fillStyle = INK
  ctx.font = `700 32px ${FONT}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('Jadwal Kuliah', L.pad, 52)

  ctx.fillStyle = MUTED
  ctx.font = `500 16px ${FONT}`
  const ta = meta.tahunAjaran ? `  ·  TA ${meta.tahunAjaran}` : ''
  ctx.fillText(`${meta.prodi ?? 'Semua Prodi'}  ·  Semester ${meta.semester ?? '-'}${ta}`, L.pad, 80)

  const sem = `Semester ${meta.semester ?? '-'}`
  ctx.font = `700 14px ${FONT}`
  const pillW = ctx.measureText(sem).width + 28
  const pillX = L.width - L.pad - pillW
  ctx.fillStyle = '#0F6E64'
  roundRect(ctx, pillX, 32, pillW, 30, 15)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(sem, pillX + pillW / 2, 47)
}

function drawDayHeads(ctx) {
  const colW = (L.width - L.pad * 2 - L.gutter) / DAY_ORDER.length
  const y = L.header
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(L.pad, y, L.width - L.pad * 2, L.dayHead)
  ctx.strokeStyle = LINE
  ctx.lineWidth = 1
  ctx.strokeRect(L.pad, y, L.width - L.pad * 2, L.dayHead)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  DAY_ORDER.forEach((day, i) => {
    const x = L.pad + L.gutter + i * colW
    ctx.fillStyle = INK
    ctx.font = `700 16px ${FONT}`
    ctx.fillText(day, x + colW / 2, y + L.dayHead / 2)
  })
}

function drawRows(ctx, placed, rowHeights) {
  const colW = (L.width - L.pad * 2 - L.gutter) / DAY_ORDER.length
  let y = L.header + L.dayHead
  SESSIONS.forEach((session, index) => {
    const h = rowHeights[index]
    ctx.fillStyle = index % 2 === 0 ? '#FFFFFF' : '#F7FBFA'
    ctx.fillRect(L.pad, y, L.width - L.pad * 2, h)
    ctx.strokeStyle = LINE
    ctx.strokeRect(L.pad, y, L.width - L.pad * 2, h)

    ctx.fillStyle = INK
    ctx.font = `700 14px ${FONT}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(session.label, L.pad + 14, y + h / 2 - 6)
    ctx.fillStyle = MUTED
    ctx.font = `500 11px ${FONT}`
    ctx.fillText(session.range, L.pad + 14, y + h / 2 + 12)

    DAY_ORDER.forEach((day, i) => {
      const cards = placed.filter((c) => c.hari.toLowerCase() === day.toLowerCase() && c.session === session.id)
      cards.forEach((card, n) => {
        drawCard(ctx, card, L.pad + L.gutter + i * colW + 8, y + 12 + n * (L.cardH + L.cardGap), colW - 16)
      })
    })
    y += h
  })
}

function drawCard(ctx, card, x, y, w) {
  const tone = TONE[toneOf(card.tipeKelas)] ?? TONE.neutral
  ctx.fillStyle = tone.bg
  roundRect(ctx, x, y, w, L.cardH, 12)
  ctx.fill()
  ctx.fillStyle = tone.line
  ctx.fillRect(x, y + 10, 4, L.cardH - 20)

  ctx.fillStyle = tone.sub
  ctx.font = `700 11px ${FONT}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(card.tipeKelas || 'K1', x + 14, y + 18)

  const jam = `${card.jamMulai ?? ''}–${card.jamSelesai ?? ''}`
  ctx.font = `700 11px ${FONT}`
  const pillW = ctx.measureText(jam).width + 14
  ctx.fillStyle = tone.pill
  roundRect(ctx, x + w - pillW - 10, y + 8, pillW, 18, 9)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.fillText(jam, x + w - pillW / 2 - 10, y + 17)

  ctx.fillStyle = tone.ink
  ctx.font = `700 13px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const nameLines = wrapText(ctx, card.namaMK || card.kodeMK, w - 24, 2)
  nameLines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, y + 38 + i * 15)
  })

  ctx.fillStyle = tone.sub
  ctx.font = `500 11px ${FONT}`
  if (card.dosen) ctx.fillText(fitText(ctx, card.dosen, w - 24), x + w / 2, y + 38 + nameLines.length * 15)
}

function placeEntries(entries, courses) {
  return entries
    .map((entry) => {
      const course = lookupCourse(courses, entry.kodeMK)
      const session = SESSIONS.find((s) => toMinutes(entry.jamMulai) < s.before)?.id ?? 'malam'
      return {
        ...entry,
        namaMK: entry.namaMK || course?.namaMK || entry.kodeMK,
        dosen: entry.dosen || course?.dosen || '',
        session,
      }
    })
    .sort((a, b) => String(a.jamMulai).localeCompare(String(b.jamMulai)))
}

function toMinutes(value) {
  const match = String(value ?? '').match(/(\d{1,2})[:.](\d{2})/)
  if (!match) return 0
  return Number(match[1]) * 60 + Number(match[2])
}

function lookupCourse(courses, kode) {
  if (!courses || !kode) return null
  if (typeof courses.get === 'function') return courses.get(kode) ?? null
  return courses[kode] ?? null
}

function toneOf(code) {
  const map = { K1: 'offline', K2: 'online', HB: 'hybrid', HBH: 'hybrid', HBD: 'hybrid', GBK1: 'combined', GBK2: 'combined' }
  return map[code] ?? 'neutral'
}

function wrapText(ctx, text, maxW, maxLines) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width <= maxW) {
      current = next
      continue
    }
    if (current) lines.push(current)
    current = word
    if (lines.length === maxLines - 1) break
  }
  if (current && lines.length < maxLines) lines.push(fitText(ctx, current, maxW))
  else if (current && lines.length) lines[lines.length - 1] = fitText(ctx, `${lines.at(-1)} ${current}`, maxW)
  if (!lines.length) lines.push(fitText(ctx, String(text ?? ''), maxW))
  return lines.slice(0, maxLines)
}

function fitText(ctx, text, maxW) {
  const value = String(text ?? '')
  if (ctx.measureText(value).width <= maxW) return value
  let s = value
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1)
  return `${s}…`
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** @returns {Promise<'shared'|'downloaded'>} */
export async function shareOrDownloadScheduleImage(canvas, fileName) {
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal membuat gambar'))), 'image/png'),
  )
  const file = new File([blob], fileName, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Jadwal Kuliah', text: 'Jadwal kuliah saya' })
    return 'shared'
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}

/**
 * Render ringkasan jadwal ke <canvas> (PNG) — tanpa dependensi eksternal.
 * Gaya visual mengikuti design-system.md versi terang (Academic Precision).
 */

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

// Warna design-system (versi terang)
const C = {
  bg: '#F5FAF8',
  card: '#FFFFFF',
  primary: '#00685F',
  surface: '#F0F5F2',
  onSurface: '#171D1C',
  onSurfaceVariant: '#3D4947',
  outline: '#BCC9C6',
}

const TONE_COLORS = {
  offline: '#15803D',
  online: '#1D4ED8',
  hybrid: '#7C3AED',
  combined: '#B45309',
  neutral: '#6D7A77',
}

const LAYOUT = {
  width: 720,
  padding: 32,
  headerHeight: 96,
  rowHeight: 64,
  gap: 12,
}

/**
 * @param {Array<{hari:string, jamMulai:string, jamSelesai:string, kodeMK:string, ruang?:string, tipeKelas?:string}>} entries
 * @param {{prodi?: string|null, semester?: string|number|null, tahunAjaran?: string|null}} meta
 * @returns {HTMLCanvasElement}
 */
export function renderScheduleImage(entries, meta) {
  const { width, padding } = LAYOUT
  const groups = groupByDay(entries)

  let y
  const heights = groups.map((g) => groupHeight(g))
  const bodyHeight =
    heights.reduce((a, b) => a + b, 0) +
    Math.max(0, groups.length - 1) * LAYOUT.gap * 2
  const footerHeight = 48

  const height = LAYOUT.headerHeight + padding / 2 + bodyHeight + footerHeight

  const scale = 2 // render 2x agar tajam di layar retina
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  // Background
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, width, height)

  drawHeader(ctx, meta)
  y = LAYOUT.headerHeight + padding / 2

  for (const group of groups) {
    drawGroup(ctx, group, y)
    y += groupHeight(group) + LAYOUT.gap * 2
  }

  drawFooter(ctx, entries.length, y)
  return canvas
}

function groupByDay(entries) {
  return DAY_ORDER.map((day) => ({
    day,
    items: entries
      .filter((e) => String(e.hari ?? '').toLowerCase() === day.toLowerCase())
      .sort((a, b) => String(a.jamMulai).localeCompare(String(b.jamMulai))),
  })).filter((g) => g.items.length > 0)
}

function groupHeight(group) {
  return 36 + group.items.length * LAYOUT.rowHeight + 8
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawHeader(ctx, meta) {
  const { width, headerHeight } = LAYOUT
  ctx.fillStyle = C.primary
  ctx.fillRect(0, 0, width, headerHeight)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 26px Inter, system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText('Jadwal Kampus', LAYOUT.padding, 38)

  ctx.font = '400 14px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  const ta = meta.tahunAjaran ? ` · TA ${meta.tahunAjaran}` : ''
  const label = `${meta.prodi ?? 'Semua Prodi'} · Semester ${meta.semester ?? '-'}${ta}`
  ctx.fillText(label, LAYOUT.padding, 66)
}

function drawGroup(ctx, group, top) {
  const { width, padding, rowHeight } = LAYOUT
  const innerWidth = width - padding * 2

  // Label hari
  ctx.fillStyle = C.onSurfaceVariant
  ctx.font = "600 12px Inter, system-ui, sans-serif"
  ctx.textBaseline = 'alphabetic'
  ctx.save()
  ctx.translate(padding, top + 14)
  ctx.fillText(group.day.toUpperCase(), 0, 0)
  ctx.restore()

  let y = top + 24
  for (const item of group.items) {
    // Kartu putih
    ctx.fillStyle = C.card
    roundRect(ctx, padding, y, innerWidth, rowHeight - 8, 12)
    ctx.fill()

    // Bar warna tipe kelas di tepi kiri kartu
    const tone = toneOf(item.tipeKelas)
    ctx.fillStyle = TONE_COLORS[tone] ?? TONE_COLORS.neutral
    roundRect(ctx, padding, y, 4, rowHeight - 8, 2)
    ctx.fill()

    const textX = padding + 20
    // Baris atas: kode MK (+ ruang)
    ctx.fillStyle = C.onSurface
    ctx.font = '600 15px Inter, system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    const ruang = item.ruang ? `  ·  ${item.ruang}` : ''
    ctx.fillText(`${item.kodeMK}${ruang}`, textX, y + 22)

    // Baris bawah: jam + tipe kelas
    ctx.fillStyle = C.onSurfaceVariant
    ctx.font = '400 13px Inter, system-ui, sans-serif'
    ctx.fillText(
      `${item.jamMulai ?? '-'} - ${item.jamSelesai ?? '-'}`,
      textX,
      y + 42,
    )

    y += rowHeight
  }
}

function toneOf(code) {
  const map = {
    K1: 'offline',
    K2: 'online',
    HB: 'hybrid',
    HBH: 'hybrid',
    HBD: 'hybrid',
    GBK1: 'combined',
    GBK2: 'combined',
  }
  return map[code] ?? 'neutral'
}

function drawFooter(ctx, count, y) {
  const { padding } = LAYOUT
  ctx.fillStyle = C.onSurfaceVariant
  ctx.font = '400 12px Inter, system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  const date = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  ctx.fillText(
    `${count} kelas per minggu · diekspor ${date}`,
    padding,
    y + 12,
  )
}

/**
 * Bagikan kanvas sebagai gambar: pakai Web Share API kalau mendukung file,
 * kalau tidak → unduh sebagai PNG.
 * @returns {Promise<'shared'|'downloaded'>}
 */
export async function shareOrDownloadScheduleImage(canvas, fileName) {
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal membuat gambar'))), 'image/png'),
  )
  const file = new File([blob], fileName, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'Jadwal Kampus',
      text: 'Jadwal kuliah saya',
    })
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

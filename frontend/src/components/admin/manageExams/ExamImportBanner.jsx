import { Icon } from '../../Icon'
import { Button } from '../../Button'

export function ExamImportBanner({
  imported,
  confirmImport,
  busy,
  setImported,
}) {
  if (!imported) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-primary/30 bg-primary/10 p-5 dark:bg-primary/15 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary font-bold">
          <Icon name="upload_file" size={22} />
        </span>
        <div>
          <p className="text-title-sm font-bold text-on-surface">
            {imported.length} Baris Jadwal Ujian Terbaca
          </p>
          <p className="text-body-xs text-on-surface-variant">
            Simpan semua baris di atas sebagai draft untuk diperiksa sebelum dirilis.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={confirmImport}
          disabled={busy}
          className="rounded-xl px-4 py-2 font-bold text-body-xs"
        >
          <Icon name="save" size={16} className="mr-1" />
          Ya, Impor Sebagai Draft
        </Button>
        <Button
          variant="secondary"
          onClick={() => setImported(null)}
          className="rounded-xl px-4 py-2 text-body-xs"
        >
          Batal
        </Button>
      </div>
    </div>
  )
}

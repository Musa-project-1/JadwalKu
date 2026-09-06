import { Icon } from '../../Icon'
import { Button } from '../../Button'
import { Input } from '../../Input'
import { FormSelect } from '../../FormSelect'

export function AddProdiForm({
  isAddOpen,
  handleAdd,
  nama,
  setNama,
  fakultasId,
  setFakultasId,
  fakultasList,
  semesterMin,
  setSemesterMin,
  semesterMax,
  setSemesterMax,
  semesterOptions,
  saving,
  formError,
}) {
  if (!isAddOpen) return null

  return (
    <form
      onSubmit={handleAdd}
      className="p-3.5 tablet:p-4 bg-surface-container-low/40 dark:bg-surface-container-high/20 border-b border-outline-variant/15 animate-fade-in"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-body-sm font-bold text-on-surface flex items-center gap-2">
          <Icon name="add_circle" size={16} className="text-primary" />
          <span>Formulir Program Studi Baru</span>
        </h3>
      </div>
      <div className="grid gap-3 tablet:grid-cols-[1.5fr_1.2fr_auto_auto_auto] tablet:items-end">
        <Input
          label="Nama Program Studi"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="mis. Teknik Informatika"
          required
        />
        <div>
          <label className="mb-1 block text-body-sm font-semibold text-on-surface-variant">Fakultas</label>
          <FormSelect
            value={fakultasId}
            onChange={(val) => setFakultasId(String(val || ''))}
            options={[
              { value: '', label: 'Tanpa Fakultas' },
              ...(fakultasList || []).map((f) => ({
                value: String(f.id),
                label: String(f.nama || f.singkatan || f.id),
              })),
            ]}
            placeholder="Pilih fakultas"
          />
        </div>
        <div>
          <label className="mb-1 block text-body-sm font-semibold text-on-surface-variant">Sem. Awal</label>
          <FormSelect
            value={semesterMin}
            onChange={(val) => setSemesterMin(Number(val))}
            options={semesterOptions.map((n) => ({ value: n, label: String(n) }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-body-sm font-semibold text-on-surface-variant">Sem. Akhir</label>
          <FormSelect
            value={semesterMax}
            onChange={(val) => setSemesterMax(Number(val))}
            options={semesterOptions.map((n) => ({ value: n, label: String(n) }))}
          />
        </div>
        <Button type="submit" disabled={saving} className="rounded-xl h-[38px] justify-center px-4 font-bold shadow-xs">
          <Icon name="check" size={18} className="mr-1" />
          Simpan
        </Button>
      </div>
      {formError && <p className="mt-2 text-body-xs font-semibold text-error">{formError}</p>}
    </form>
  )
}

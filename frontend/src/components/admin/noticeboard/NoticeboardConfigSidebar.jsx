import { Icon } from "../../Icon"
import { FormSelect } from "../../FormSelect"
import { DAYS } from "../../../lib/uploadValidator"

export function NoticeboardConfigSidebar({
  prodiFilter,
  setProdiFilter,
  prodiOptions,
  semesterFilter,
  setSemesterFilter,
  hariFilter,
  setHariFilter,
  dosenFilter,
  setDosenFilter,
  lecturerOptions,
  univName,
  setUnivName,
  facultyName,
  setFacultyName,
  docTitle,
  setDocTitle,
  cityDate,
  setCityDate,
  officialRole,
  setOfficialRole,
  officialName,
  setOfficialName,
  officialNip,
  setOfficialNip,
}) {
  return (
    <div className="tablet:col-span-5 border-b tablet:border-b-0 tablet:border-r border-outline-variant/20 p-4 tablet:p-5 overflow-y-auto space-y-4 bg-surface-container-lowest/50 dark:bg-surface-container-low/30 custom-scrollbar">
      {/* Scope Filter */}
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 dark:bg-surface-container/30 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-400 border border-teal-500/25">
            <Icon name="tune" size={16} />
          </span>
          <p className="text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
            Lingkup Jadwal
          </p>
        </div>

        <div>
          <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
            Program Studi
          </label>
          <FormSelect
            value={prodiFilter}
            onChange={(val) => setProdiFilter(val)}
            placeholder="Semua Program Studi"
            options={prodiOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
              Semester
            </label>
            <FormSelect
              value={semesterFilter}
              onChange={(val) => setSemesterFilter(val)}
              placeholder="Semua Sem"
              options={[
                { value: "", label: "Semua Sem" },
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
                  value: s,
                  label: `Semester ${s}`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
              Hari
            </label>
            <FormSelect
              value={hariFilter}
              onChange={(val) => setHariFilter(val)}
              placeholder="Semua Hari"
              options={[
                { value: "", label: "Semua Hari" },
                ...DAYS.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>
        </div>

        <div>
          <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
            Dosen Pengampu
          </label>
          <FormSelect
            value={dosenFilter}
            onChange={(val) => setDosenFilter(val)}
            placeholder="Semua Dosen Pengampu"
            options={lecturerOptions}
          />
        </div>
      </div>

      {/* Kop Surat & Institusi */}
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 dark:bg-surface-container/30 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-400 border border-teal-500/25">
            <Icon name="corporate_fare" size={16} />
          </span>
          <p className="text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
            Kop Surat Institusi
          </p>
        </div>

        <div>
          <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
            Nama Universitas
          </label>
          <input
            type="text"
            value={univName}
            onChange={(e) => setUnivName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
          />
        </div>

        <div>
          <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
            Fakultas / Jurusan
          </label>
          <input
            type="text"
            value={facultyName}
            onChange={(e) => setFacultyName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
          />
        </div>

        <div>
          <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
            Judul Dokumen
          </label>
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
          />
        </div>
      </div>

      {/* Pengesahan Tanda Tangan */}
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 dark:bg-surface-container/30 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-400 border border-teal-500/25">
            <Icon name="verified_user" size={16} />
          </span>
          <p className="text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
            Pengesahan & Pejabat
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
              Tempat, Tanggal
            </label>
            <input
              type="text"
              value={cityDate}
              onChange={(e) => setCityDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
            />
          </div>
          <div>
            <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
              Jabatan Resmi
            </label>
            <input
              type="text"
              value={officialRole}
              onChange={(e) => setOfficialRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
            />
          </div>
        </div>

        <div>
          <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
            Nama Lengkap & Gelar
          </label>
          <input
            type="text"
            value={officialName}
            onChange={(e) => setOfficialName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
          />
        </div>

        <div>
          <label className="block text-label-caps font-bold text-on-surface-variant uppercase mb-1">
            Nomor Induk Pegawai (NIP)
          </label>
          <input
            type="text"
            value={officialNip}
            onChange={(e) => setOfficialNip(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-xs text-on-surface focus:outline-none focus:border-primary dark:bg-surface-container-high"
          />
        </div>
      </div>
    </div>
  )
}

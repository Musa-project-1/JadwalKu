export const PRESET_STORAGE_KEY = 'jadwalku_import_mapping_preset'

export const SYSTEM_FIELDS = [
  { key: 'hari', label: 'Hari', icon: 'calendar_today', aliases: ['hari', 'day', 'days'] },
  { key: 'jamRange', label: 'Rentang Jam (Mulai - Selesai)', icon: 'schedule', aliases: ['jam', 'waktu', 'time', 'sesi', 'jam kuliah', 'pukul'] },
  { key: 'jamMulai', label: 'Jam Mulai (opsional jika ada rentang)', icon: 'play_arrow', aliases: ['jam mulai', 'mulai', 'start', 'start time', 'waktu mulai'] },
  { key: 'jamSelesai', label: 'Jam Selesai', icon: 'stop', aliases: ['jam selesai', 'selesai', 'end', 'end time', 'waktu selesai'] },
  { key: 'namaMK', label: 'Mata Kuliah', icon: 'menu_book', aliases: ['nama mk', 'nama mata kuliah', 'mata kuliah', 'matkul', 'course', 'nama'] },
  { key: 'kodeMK', label: 'Kode MK', icon: 'tag', aliases: ['kode mk', 'kode', 'kode mata kuliah', 'kd mk', 'code'] },
  { key: 'dosen', label: 'Dosen Pengampu', icon: 'person', aliases: ['dosen', 'dosen pengampu', 'pengampu', 'lecturer', 'nama dosen'] },
  { key: 'ruang', label: 'Ruang Kuliah', icon: 'room', aliases: ['ruang', 'ruangan', 'room', 'lokasi', 'tempat'] },
  { key: 'tipeKelas', label: 'Tipe Kelas (K1/K2/Reguler/Online)', icon: 'label', aliases: ['tipe kelas', 'tipe', 'jenis kelas', 'mode', 'type', 'class type'] },
  { key: 'prodi', label: 'Program Studi', icon: 'school', aliases: ['prodi', 'program studi', 'jurusan', 'study program'] },
  { key: 'semester', label: 'Semester', icon: 'format_list_numbered', aliases: ['semester', 'sem', 'smt'] },
]

/**
 * translations.js — Kamus Terjemahan Bilingual (id & en) JadwalKu
 * 
 * Desain:
 * - Tanpa library berat pihak ketiga (0 dependency overhead, bundle-friendly).
 * - Fallback cerdas: jika key tidak ditemukan di 'en', otomatis fallback ke 'id', lalu ke raw key.
 * - Format parameter: t('countdown', { mins: 15 }) -> "15 menit lagi" / "15 mins left".
 */

export const TRANSLATIONS = {
  id: {
    // ── Navigation ──
    'nav.home': 'Home',
    'nav.schedule': 'Jadwal',
    'nav.tasks': 'Tugas',
    'nav.exams': 'Ujian',
    'nav.settings': 'Pengaturan',
    'nav.search': 'Pencarian',
    'nav.about': 'Tentang & FAQ',
    'nav.docs': 'Pusat Panduan',
    'nav.history': 'Riwayat',

    // ── Days of Week ──
    'day.all': 'Semua Hari',
    'day.monday': 'Senin',
    'day.tuesday': 'Selasa',
    'day.wednesday': 'Rabu',
    'day.thursday': 'Kamis',
    'day.friday': 'Jumat',
    'day.saturday': 'Sabtu',
    'day.sunday': 'Minggu',

    // ── Common Actions ──
    'action.save': 'Simpan',
    'action.cancel': 'Batal',
    'action.close': 'Tutup',
    'action.delete': 'Hapus',
    'action.edit': 'Edit',
    'action.add': 'Tambah',
    'action.sync': 'Sinkron',
    'action.refresh': 'Muat Ulang',
    'action.view_all': 'Lihat Semua',
    'action.back': 'Kembali',
    'action.copy': 'Salin',
    'action.download': 'Unduh',
    'action.search_placeholder': 'Cari...',

    // ── Greeting & Home Header ──
    'greeting.morning': 'Selamat Pagi',
    'greeting.afternoon': 'Selamat Siang',
    'greeting.evening': 'Selamat Sore',
    'greeting.night': 'Selamat Malam',
    'home.custom_schedule': 'Jadwal Kustom ({count} MK)',
    'home.sync_banner': 'Tahun ajaran berubah — jadwal semester {semester} sekarang TA {ta}. Tap untuk sinkron.',
    'home.metric_sks': 'SKS',
    'home.metric_classes': 'Kelas',
    'home.metric_tasks': 'Tugas',

    // ── Class Status & Cards ──
    'class.status_ongoing': 'Sedang Berlangsung',
    'class.status_next': 'Kelas Berikutnya',
    'class.status_finished_title': 'Kuliah Hari Ini Selesai',
    'class.status_finished_desc': 'Semua kelas hari ini telah selesai! 🎉',
    'class.status_finished_body': 'Kamu telah menyelesaikan {count} mata kuliah hari ini. Waktunya istirahat yang cukup atau mengecek daftar tugasmu.',
    'class.view_weekly_schedule': 'Lihat Jadwal Mingguan Lengkap',
    'class.view_weekly_fallback': 'Lihat jadwal mingguan',
    'class.view_all_today': 'Lihat semua jadwal hari ini',
    'class.no_classes_today': 'Tidak ada perkuliahan hari ini',
    'class.no_classes_today_sub': 'Nikmati harimu atau cek materi untuk perkuliahan besok.',
    'class.today_schedule_title': 'Jadwal Kuliah Hari Ini ({day})',
    'class.session_count': '{count} Sesi',
    'class.starts_in': 'Mulai Dalam',
    'class.remaining_time': 'Sisa Waktu',
    'class.remaining_mins': 'Sisa {mins} menit',
    'class.progress': 'Progress Kuliah',
    'class.room_tooltip': 'Lihat Panduan Lokasi Ruangan & Denah Lantai',
    'class.detail_tooltip': 'Buka detail mata kuliah di jadwal',
    'class.next_label_0': 'Selanjutnya',
    'class.next_label_1': 'Setelah itu',
    'class.next_label_2': 'Berikutnya',

    // ── Home Right Widgets ──
    'home.note_title': 'Catatan Hari Ini',
    'home.note_badge': 'Memo',
    'home.note_placeholder': 'Tulis catatan penting atau target belajar hari ini...',
    'home.tasks_title': 'Tugas Terdekat',
    'home.tasks_empty': 'Tidak ada tugas tertunda',
    'home.tasks_create': 'Buat Tugas',
    'home.tomorrow_title': 'Jadwal Besok ({day})',
    'home.tomorrow_empty': 'Tidak ada perkuliahan besok ({day})',
    'home.tomorrow_empty_sub': 'Waktu yang baik untuk istirahat & belajar mandiri.',
    'home.agenda_nearest': 'Agenda: {name} ({date})',

    // ── Class Types & Formats ──
    'type.offline': 'Kelas Offline (K1)',
    'type.online': 'Kelas Online (K2)',
    'type.hybrid': 'Hybrid (HB)',
    'type.combined': 'Kelas Gabungan (GBK)',
    'type.offline_short': 'Offline',
    'type.online_short': 'Online',
    'type.hybrid_short': 'Hybrid',
    'type.combined_short': 'Gabungan',

    // ── Settings Page ──
    'settings.title': 'Pengaturan',
    'settings.subtitle': 'Preferensi tampilan, sinkronisasi data & panduan',
    'settings.display_pref': 'Preferensi Tampilan',
    'settings.display_pref_sub': 'Sesuaikan tema, ukuran font, dan kontras',
    'settings.theme': 'Tema Tampilan',
    'settings.theme_system': 'Sistem',
    'settings.theme_light': 'Terang',
    'settings.theme_dark': 'Gelap',
    'settings.font_size': 'Ukuran Font',
    'settings.font_sm': 'Kecil',
    'settings.font_md': 'Sedang',
    'settings.font_lg': 'Besar',
    'settings.font_xl': 'Sangat Besar',
    'settings.high_contrast': 'Kontras Tinggi (WCAG AAA)',
    'settings.high_contrast_desc': 'Tingkatkan batas border dan ketajaman teks untuk keterbacaan maksimal',
    'settings.language': 'Bahasa / Language',
    'settings.language_desc': 'Pilih bahasa antarmuka aplikasi',
    'settings.lang_id': 'Bahasa Indonesia',
    'settings.lang_en': 'English',
    'settings.academic_info': 'Profil Akademik Saya',
    'settings.academic_info_sub': 'Program studi dan semester aktif',
    'settings.change_prodi': 'Ganti Prodi / Semester',
    'settings.sync_title': 'Sinkronisasi & Penyimpanan',
    'settings.sync_sub': 'Kelola pembaruan data dan cache lokal browser',
    'settings.sync_btn': 'Sinkronkan Data Sekarang',
    'settings.sync_success': 'Data berhasil disinkronkan!',
    'settings.clear_cache': 'Reset Cache Lokal',
    'settings.clear_cache_desc': 'Hapus data cache lokal jika jadwal tidak otomatis terbarui',

    // ── Tasks Page ──
    'tasks.title': 'Daftar Tugas',
    'tasks.subtitle': 'Kelola tugas kuliah, kuis, dan deadline proyek',
    'tasks.filter_all': 'Semua',
    'tasks.filter_pending': 'Belum Selesai',
    'tasks.filter_completed': 'Selesai',
    'tasks.add_task': '+ Tugas Baru',
    'tasks.empty_title': 'Belum ada tugas kuliah',
    'tasks.empty_desc': 'Catat tugas individu, PR mingguan, laporan praktikum, atau tugas kelompok bersama prodi agar tidak terlewat tenggat waktu.',
    'tasks.empty_filter_title': 'Tidak ada tugas yang sesuai filter',
    'tasks.empty_filter_desc': 'Coba ubah status atau kategori tugas di atas.',
    'tasks.priority_high': 'Tinggi',
    'tasks.priority_medium': 'Sedang',
    'tasks.priority_low': 'Rendah',
    'tasks.deadline': 'Deadline',
    'tasks.course': 'Mata Kuliah',
    'tasks.scope_all': 'Semua',
    'tasks.scope_personal': 'Pribadi',
    'tasks.scope_prodi': 'Prodi',
    'tasks.urgent_banner': 'Tugas Mendesak Mendekati Tenggat Waktu',
    'tasks.all_courses': 'Semua Mata Kuliah',
    'tasks.progress_label': 'Progres',
    'tasks.due_this_week': 'Tenggat Minggu Ini ({count})',
    'tasks.task_personal': 'Tugas Pribadi',
    'tasks.task_prodi': 'Tugas Prodi',
    'tasks.task_shared': 'Bersama Prodi',
    'tasks.add_modal_title': 'Tambah Tugas Baru',

    // ── Exams Page ──
    'exams.title': 'Jadwal Ujian',
    'exams.subtitle': 'Jadwal UTS & UAS semester aktif',
    'exams.tab_uts': 'UTS (Tengah Semester)',
    'exams.tab_uas': 'UAS (Akhir Semester)',
    'exams.empty_title': 'Belum ada data ujian {jenis}',
    'exams.empty_desc': 'Jadwal {jenisFull} untuk TA {ta} akan ditampilkan secara otomatis setelah dipublikasikan oleh Bagian Akademik.',
    'exams.sync_cal': 'Sinkron Kalender HP (.ics)',
    'exams.supervisor': 'Pengawas',
    'exams.room': 'Ruang Ujian',
    'exams.filtered_summary': '{jenisLabel} · {count} terfilter',
    'exams.upcoming': 'Terdekat: {course}',
    'exams.count_badge': '{count} Ujian',
    'exams.days_left': '{days} hari lagi',
    'exams.today': 'Hari ini',
    'exams.past': 'Sudah lewat',

    // ── Search Page ──
    'search.title': 'Pencarian Kampus',
    'search.subtitle': 'Cari dosen pengampu, kontak, mata kuliah, dan jadwal ruangan',
    'search.filter_all': 'Semua',
    'search.filter_lecturer': '👨‍🏫 Dosen & Jadwal',
    'search.filter_course': 'Mata Kuliah',
    'search.recent': 'Pencarian Terakhir',
    'search.lecturer_dir': 'Direktori Dosen Pengampu ({count})',
    'search.results_lecturer': 'Dosen & Jadwal Mengajar',
    'search.results_course': 'Mata Kuliah',
    'search.empty_query': 'Ketik nama dosen, mata kuliah, atau kode MK',

    // ── Print Modal ──
    'print.modal_title': 'Cetak Jadwal Kuliah',
    'print.layout_wall': 'Meja (Tabel A4)',
    'print.layout_wall_sub': 'Tabel Lengkap',
    'print.layout_matrix': 'Matriks Sesi',
    'print.layout_matrix_sub': 'Pagi – Malam',
    'print.layout_pocket': 'Kartu Saku Lipat',
    'print.layout_pocket_sub': 'Ukuran Saku Praktis',
    'print.preview_title': 'Pratinjau Lembar Cetak',
    'print.action_btn': 'Cetak / Simpan PDF',
    'print.print_date': 'Tanggal Cetak: {date}',

    // ── Notifications Page ──
    'notifications.title': 'Pengingat & Notifikasi',
    'notifications.empty_title': 'Tidak ada pengingat',
    'notifications.empty_desc': 'Pengingat kelas, deadline tugas, ujian, dan perubahan jadwal akan muncul di sini.',
    'notifications.unread_count': 'Anda memiliki {count} pengingat baru.',
    'notifications.mark_all_read': 'Tandai semua sudah dibaca',
    'notifications.clear_all': 'Hapus semua',
    'notifications.group_today': 'Hari ini',
    'notifications.group_yesterday': 'Kemarin',
    'notifications.group_earlier': 'Lebih awal',

    // ── Export & Share Page ──
    'share.title': 'Bagikan Jadwal',
    'share.subtitle': 'Ekspor jadwal kuliah ke kalender atau bagikan ke teman sekelas',
    'share.cal_title': 'Kalender Smartphone (.ics)',
    'share.cal_desc': 'Sinkronkan jadwal kelas ke Google Calendar, Apple Calendar, atau Outlook',
    'share.text_title': 'Bagikan Teks',
    'share.text_desc': 'Salin ringkasan ke clipboard untuk WhatsApp atau Telegram',
    'share.image_title': 'Bagikan Gambar',
    'share.image_desc': 'Simpan kartu visual jadwal beresolusi tinggi ke galeri',

    // ── Change History Page ──
    'history.title': 'Riwayat Perubahan',
    'history.subtitle': 'Perubahan jadwal oleh administrator kampus',
    'history.empty_title': 'Belum ada perubahan',
    'history.empty_desc': 'Riwayat perubahan jadwal akan tampil di sini setelah admin melakukan pembaruan.',

    // ── Shared Modals ──
    'modal.close': 'Tutup',
    'modal.cancel': 'Batal',
    'modal.save': 'Simpan',
    'modal.confirm': 'Konfirmasi',

    // ── Schedule Page ──
    'schedule.title': 'Jadwal Kuliah',
    'schedule.subtitle': 'Jadwal mingguan perkuliahan semester ini',
    'schedule.attendance_btn': 'Presensi',
    'schedule.krs_simulator': 'Simulator KRS',
    'schedule.export_share': 'Bagikan',
    'schedule.custom_mode_on': 'Mode Kustom Aktif',
    'schedule.no_classes_day': 'Tidak ada perkuliahan pada hari ini',

    // ── Feature Docs Modal ──
    'docs.modal_title': 'Pusat Panduan Fitur',
    'docs.tab_all': 'Semua Fitur',
    'docs.tab_student': 'Mahasiswa',
    'docs.tab_admin': 'Admin Kampus',
    'docs.search_placeholder': 'Cari panduan fitur...',
    'docs.how_to_title': 'Cara Menggunakan:',
    'docs.tips_title': 'Tips Pro:',
    'docs.empty_search': 'Tidak ada panduan yang cocok dengan pencarianmu.',
  },

  en: {
    // ── Navigation ──
    'nav.home': 'Home',
    'nav.schedule': 'Schedule',
    'nav.tasks': 'Tasks',
    'nav.exams': 'Exams',
    'nav.settings': 'Settings',
    'nav.search': 'Search',
    'nav.about': 'About & FAQ',
    'nav.docs': 'User Guides',
    'nav.history': 'History',

    // ── Days of Week ──
    'day.all': 'All Days',
    'day.monday': 'Monday',
    'day.tuesday': 'Tuesday',
    'day.wednesday': 'Wednesday',
    'day.thursday': 'Thursday',
    'day.friday': 'Friday',
    'day.saturday': 'Saturday',
    'day.sunday': 'Sunday',

    // ── Common Actions ──
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.close': 'Close',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.add': 'Add',
    'action.sync': 'Sync',
    'action.refresh': 'Reload',
    'action.view_all': 'View All',
    'action.back': 'Back',
    'action.copy': 'Copy',
    'action.download': 'Download',
    'action.search_placeholder': 'Search...',

    // ── Greeting & Home Header ──
    'greeting.morning': 'Good Morning',
    'greeting.afternoon': 'Good Afternoon',
    'greeting.evening': 'Good Evening',
    'greeting.night': 'Good Night',
    'home.custom_schedule': 'Custom Schedule ({count} Courses)',
    'home.sync_banner': 'Academic year changed — Semester {semester} is now AY {ta}. Tap to sync.',
    'home.metric_sks': 'Credits',
    'home.metric_classes': 'Classes',
    'home.metric_tasks': 'Tasks',

    // ── Class Status & Cards ──
    'class.status_ongoing': 'In Progress',
    'class.status_next': 'Next Class',
    'class.status_finished_title': 'Classes Finished for Today',
    'class.status_finished_desc': 'All classes for today are complete! 🎉',
    'class.status_finished_body': 'You have completed {count} courses today. Time for some rest or to review your pending tasks.',
    'class.view_weekly_schedule': 'View Complete Weekly Schedule',
    'class.view_weekly_fallback': 'View weekly schedule',
    'class.view_all_today': 'View all classes today',
    'class.no_classes_today': 'No classes scheduled today',
    'class.no_classes_today_sub': 'Enjoy your day off or prepare for tomorrow\'s lectures.',
    'class.today_schedule_title': 'Today\'s Classes ({day})',
    'class.session_count': '{count} Sessions',
    'class.starts_in': 'Starts In',
    'class.remaining_time': 'Time Remaining',
    'class.remaining_mins': '{mins} mins left',
    'class.progress': 'Class Progress',
    'class.room_tooltip': 'View Room Directions & Floor Map',
    'class.detail_tooltip': 'Open course details in schedule',
    'class.next_label_0': 'Up Next',
    'class.next_label_1': 'After That',
    'class.next_label_2': 'Following',

    // ── Home Right Widgets ──
    'home.note_title': 'Daily Memo',
    'home.note_badge': 'Memo',
    'home.note_placeholder': 'Write important notes or study goals for today...',
    'home.tasks_title': 'Upcoming Tasks',
    'home.tasks_empty': 'No pending tasks',
    'home.tasks_create': 'Create Task',
    'home.tomorrow_title': 'Tomorrow\'s Schedule ({day})',
    'home.tomorrow_empty': 'No classes tomorrow ({day})',
    'home.tomorrow_empty_sub': 'A good time to rest & study independently.',
    'home.agenda_nearest': 'Agenda: {name} ({date})',

    // ── Class Types & Formats ──
    'type.offline': 'Offline Class (K1)',
    'type.online': 'Online Class (K2)',
    'type.hybrid': 'Hybrid (HB)',
    'type.combined': 'Combined Class (GBK)',
    'type.offline_short': 'Offline',
    'type.online_short': 'Online',
    'type.hybrid_short': 'Hybrid',
    'type.combined_short': 'Combined',

    // ── Settings Page ──
    'settings.title': 'Settings',
    'settings.subtitle': 'Display preferences, data sync & user guides',
    'settings.display_pref': 'Display Preferences',
    'settings.display_pref_sub': 'Customize theme, font size, and contrast',
    'settings.theme': 'Appearance Theme',
    'settings.theme_system': 'System',
    'settings.theme_light': 'Light',
    'settings.theme_dark': 'Dark',
    'settings.font_size': 'Font Size',
    'settings.font_sm': 'Small',
    'settings.font_md': 'Medium',
    'settings.font_lg': 'Large',
    'settings.font_xl': 'Extra Large',
    'settings.high_contrast': 'High Contrast (WCAG AAA)',
    'settings.high_contrast_desc': 'Enhance borders and text clarity for maximum readability',
    'settings.language': 'Language / Bahasa',
    'settings.language_desc': 'Select application interface language',
    'settings.lang_id': 'Bahasa Indonesia',
    'settings.lang_en': 'English',
    'settings.academic_info': 'My Academic Profile',
    'settings.academic_info_sub': 'Active study program and semester',
    'settings.change_prodi': 'Change Program / Semester',
    'settings.sync_title': 'Data Synchronization & Storage',
    'settings.sync_sub': 'Manage data updates and local browser cache',
    'settings.sync_btn': 'Sync Data Now',
    'settings.sync_success': 'Data synchronized successfully!',
    'settings.clear_cache': 'Clear Local Cache',
    'settings.clear_cache_desc': 'Clear cached schedule if updates do not appear automatically',

    // ── Tasks Page ──
    'tasks.title': 'Task List',
    'tasks.subtitle': 'Manage assignments, quizzes, and project deadlines',
    'tasks.filter_all': 'All',
    'tasks.filter_pending': 'Pending',
    'tasks.filter_completed': 'Completed',
    'tasks.add_task': '+ New Task',
    'tasks.empty_title': 'No assignments yet',
    'tasks.empty_desc': 'Track individual assignments, weekly homework, lab reports, or group projects so you never miss a deadline.',
    'tasks.empty_filter_title': 'No tasks match the filter',
    'tasks.empty_filter_desc': 'Try changing the status or category filter above.',
    'tasks.priority_high': 'High',
    'tasks.priority_medium': 'Medium',
    'tasks.priority_low': 'Low',
    'tasks.deadline': 'Deadline',
    'tasks.course': 'Course',
    'tasks.scope_all': 'All',
    'tasks.scope_personal': 'Personal',
    'tasks.scope_prodi': 'Program',
    'tasks.urgent_banner': 'Urgent Tasks Nearing Deadline',
    'tasks.all_courses': 'All Courses',
    'tasks.progress_label': 'Progress',
    'tasks.due_this_week': 'Due This Week ({count})',
    'tasks.task_personal': 'Personal Task',
    'tasks.task_prodi': 'Program Task',
    'tasks.task_shared': 'Shared with Program',
    'tasks.add_modal_title': 'Add New Task',

    // ── Exams Page ──
    'exams.title': 'Exam Schedule',
    'exams.subtitle': 'Midterm & Final exam schedule for the active semester',
    'exams.tab_uts': 'Midterm (UTS)',
    'exams.tab_uas': 'Final Exam (UAS)',
    'exams.empty_title': 'No exam schedule found for {jenis}',
    'exams.empty_desc': 'Schedule for {jenisFull} in AY {ta} will appear automatically once published by Academic Staff.',
    'exams.sync_cal': 'Sync Phone Calendar (.ics)',
    'exams.supervisor': 'Supervisor',
    'exams.room': 'Exam Room',
    'exams.filtered_summary': '{jenisLabel} · {count} filtered',
    'exams.upcoming': 'Upcoming: {course}',
    'exams.count_badge': '{count} Exams',
    'exams.days_left': '{days} days left',
    'exams.today': 'Today',
    'exams.past': 'Past',

    // ── Search Page ──
    'search.title': 'Campus Search',
    'search.subtitle': 'Search lecturers, contacts, courses, and room schedules',
    'search.filter_all': 'All',
    'search.filter_lecturer': '👨‍🏫 Lecturers & Schedules',
    'search.filter_course': 'Courses',
    'search.recent': 'Recent Searches',
    'search.lecturer_dir': 'Lecturer Directory ({count})',
    'search.results_lecturer': 'Lecturers & Teaching Schedules',
    'search.results_course': 'Courses',
    'search.empty_query': 'Type lecturer name, course title, or course code',

    // ── Print Modal ──
    'print.modal_title': 'Print Class Schedule',
    'print.layout_wall': 'Desk (A4 Table)',
    'print.layout_wall_sub': 'Full Table',
    'print.layout_matrix': 'Session Matrix',
    'print.layout_matrix_sub': 'Morning – Evening',
    'print.layout_pocket': 'Folded Pocket Card',
    'print.layout_pocket_sub': 'Compact Pocket Size',
    'print.preview_title': 'Print Sheet Preview',
    'print.action_btn': 'Print / Save PDF',
    'print.print_date': 'Print Date: {date}',

    // ── Notifications Page ──
    'notifications.title': 'Reminders & Notifications',
    'notifications.empty_title': 'No reminders',
    'notifications.empty_desc': 'Class alerts, assignment deadlines, exams, and schedule updates will appear here.',
    'notifications.unread_count': 'You have {count} new reminders.',
    'notifications.mark_all_read': 'Mark all as read',
    'notifications.clear_all': 'Clear all',
    'notifications.group_today': 'Today',
    'notifications.group_yesterday': 'Yesterday',
    'notifications.group_earlier': 'Earlier',

    // ── Export & Share Page ──
    'share.title': 'Share Schedule',
    'share.subtitle': 'Export class schedule to calendar or share with classmates',
    'share.cal_title': 'Mobile Calendar (.ics)',
    'share.cal_desc': 'Sync class schedules directly to Google Calendar, Apple Calendar, or Outlook',
    'share.text_title': 'Share as Text',
    'share.text_desc': 'Copy clean timetable summary to clipboard for WhatsApp or Telegram',
    'share.image_title': 'Share as Image',
    'share.image_desc': 'Save high-resolution visual timetable card to device gallery',

    // ── Change History Page ──
    'history.title': 'Change History',
    'history.subtitle': 'Schedule updates published by campus administrator',
    'history.empty_title': 'No changes recorded',
    'history.empty_desc': 'Schedule change logs will appear here after updates are published.',

    // ── Shared Modals ──
    'modal.close': 'Close',
    'modal.cancel': 'Cancel',
    'modal.save': 'Save',
    'modal.confirm': 'Confirm',

    // ── Schedule Page ──
    'schedule.title': 'Class Schedule',
    'schedule.subtitle': 'Weekly lecture schedule for this semester',
    'schedule.attendance_btn': 'Attendance',
    'schedule.krs_simulator': 'Study Plan Simulator',
    'schedule.export_share': 'Share',
    'schedule.custom_mode_on': 'Custom Mode Active',
    'schedule.no_classes_day': 'No lectures scheduled for this day',

    // ── Feature Docs Modal ──
    'docs.modal_title': 'Feature Guides & Documentation',
    'docs.tab_all': 'All Features',
    'docs.tab_student': 'Students',
    'docs.tab_admin': 'Campus Admin',
    'docs.search_placeholder': 'Search feature guides...',
    'docs.how_to_title': 'How to Use:',
    'docs.tips_title': 'Pro Tips:',
    'docs.empty_search': 'No feature guides match your search.',
  },
}

/**
 * Terjemahkan teks dengan fallback cerdas.
 * @param {string} key Kunci terjemahan (e.g. 'nav.home')
 * @param {string} [lang='id'] Kode bahasa ('id' | 'en')
 * @param {Object} [params={}] Parameter substitusi dinamis (e.g. { count: 5 })
 * @returns {string}
 */
export function translate(key, lang = 'id', params = {}) {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.id
  let template = dictionary[key]

  // Fallback ke Bahasa Indonesia jika key di bahasa target tidak ada
  if (template == null && lang !== 'id') {
    template = TRANSLATIONS.id[key]
  }

  // Jika tetap tidak ada, kembalikan key itu sendiri
  if (template == null) return key

  // Substitusi parameter {name}
  if (params && typeof params === 'object') {
    return template.replace(/\{(\w+)\}/g, (_, placeholder) => {
      return params[placeholder] != null ? String(params[placeholder]) : `{${placeholder}}`
    })
  }

  return template
}

/**
 * Helper untuk pemetaan nama hari (ID ke EN atau sebaliknya)
 */
export const DAY_NAMES = {
  id: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}

export function formatDayName(dayIndo, lang = 'id') {
  if (!dayIndo || lang === 'id') return dayIndo
  const idx = DAY_NAMES.id.indexOf(dayIndo)
  return idx !== -1 ? DAY_NAMES.en[idx] : dayIndo
}

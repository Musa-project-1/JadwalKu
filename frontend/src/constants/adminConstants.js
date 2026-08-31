/**
 * Centralized Admin Constants for JadwalKu
 *
 * ADMIN_EMAIL harus sinkron dengan `isAdmin()` di firestore.rules dan
 * merupakan satu-satunya identitas yang dianggap administrator.
 * Jangan ubah di satu tempat tanpa mengubah di firestore.rules juga.
 */
export const ADMIN_EMAIL = 'admin@jadwalkampus.app'

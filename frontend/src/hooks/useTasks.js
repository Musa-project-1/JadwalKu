import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage'
import { useFirestore } from './useFirestore'
import { useApp } from './useApp'
import { addDocument, deleteDocument, updateDocument } from '../lib/adminData'
import { firebaseReady } from '../lib/firebaseClient'

// Kunci lokal disimpan lewat getItem/setItem yang sudah menambah prefiks
// 'jadwal-kampus:' — jangan ulangi prefiks di nilai kunci.
const SHARED_DONE_KEY = 'completedSharedTasks'

/**
 * Dual-Layer Task Manager:
 * 1. Tugas Pribadi: Tersimpan lokal di localStorage (pribadi per perangkat mahasiswa).
 * 2. Tugas Bersama Prodi: Tersinkronisasi cloud di Firestore collection 'tugasProdi',
 *    dengan status checklist selesai (done) disimpan independen per mahasiswa.
 */
export function useTasks() {
  const { program, semester } = useApp()
  const [localTasks, setLocalTasks] = useState(() => getItem(STORAGE_KEYS.tasks, []))
  const [completedSharedIds, setCompletedSharedIds] = useState(() => getItem(SHARED_DONE_KEY, []))

  // Langganan Cloud Tugas Bersama per Prodi & Semester
  const { data: cloudProdiTasks } = useFirestore('tugasProdi', [
    ['prodi', '==', program ?? ''],
    ['semester', '==', Number(semester) || 0],
  ])

  const localTasksRef = useRef(localTasks)
  useEffect(() => {
    localTasksRef.current = localTasks
  }, [localTasks])

  const completedSharedIdsRef = useRef(completedSharedIds)
  useEffect(() => {
    completedSharedIdsRef.current = completedSharedIds
  }, [completedSharedIds])

  const persistLocal = useCallback((next) => {
    setLocalTasks(next)
    setItem(STORAGE_KEYS.tasks, next)
  }, [])

  const persistCompletedShared = useCallback((next) => {
    setCompletedSharedIds(next)
    setItem(SHARED_DONE_KEY, next)
  }, [])

  // Gabungkan tugas bersama prodi & tugas pribadi
  const tasks = useMemo(() => {
    const sharedMapped = (cloudProdiTasks || []).map((t) => ({
      id: t.id,
      kodeMK: t.kodeMK ?? '',
      judul: t.judul ?? '',
      deadline: t.deadline ?? '',
      catatan: t.catatan ?? t.deskripsi ?? '',
      prioritas: t.prioritas ?? 'sedang',
      selesai: completedSharedIds.includes(t.id),
      isProdi: true,
      dibuatOleh: t.dibuatOleh ?? 'Komti Kelas',
    }))

    const personalMapped = (localTasks || []).map((t) => ({
      ...t,
      isProdi: Boolean(t.isProdi),
      dibuatOleh: t.isProdi ? (t.dibuatOleh ?? 'Komti') : 'Pribadi',
    }))

    return [...sharedMapped, ...personalMapped]
  }, [cloudProdiTasks, localTasks, completedSharedIds])

  const addTask = useCallback(
    async (taskData, isProdi = false) => {
      if (isProdi && firebaseReady) {
        try {
          const res = await addDocument('tugasProdi', {
            ...taskData,
            prodi: program,
            semester: Number(semester) || 0,
            dibuatOleh: taskData.dibuatOleh || 'Komti / Mahasiswa',
            createdAt: new Date(),
          })
          // Fallback ke local jika Firestore gagal (rules/offline) agar data tidak hilang
          if (res?.ok) return res
          // fallback to local storage when cloud write fails
          const fallbackTask = {
            id: crypto.randomUUID(),
            selesai: false,
            prioritas: taskData.prioritas ?? 'sedang',
            isProdi: false,
            dibuatOleh: 'Pribadi (gagal sync Prodi)',
            ...taskData,
          }
          persistLocal([...localTasksRef.current, fallbackTask])
          return { ok: false, error: res?.error || 'Gagal menyimpan ke cloud, disimpan lokal', id: fallbackTask.id, fallback: true }
        } catch (err) {
          const fallbackTask = {
            id: crypto.randomUUID(),
            selesai: false,
            prioritas: taskData.prioritas ?? 'sedang',
            isProdi: false,
            dibuatOleh: 'Pribadi (gagal sync Prodi)',
            ...taskData,
          }
          persistLocal([...localTasksRef.current, fallbackTask])
          return { ok: false, error: err?.message ?? String(err), id: fallbackTask.id, fallback: true }
        }
      }

      // Default / fallback: simpan ke LocalStorage
      const newTask = {
        id: crypto.randomUUID(),
        selesai: false,
        prioritas: 'sedang',
        isProdi: Boolean(isProdi),
        dibuatOleh: isProdi ? 'Tugas Bersama' : 'Pribadi',
        ...taskData,
      }
      persistLocal([...localTasksRef.current, newTask])
      return { ok: true, id: newTask.id }
    },
    [persistLocal, program, semester],
  )

  const updateTask = useCallback(
    async (id, changes) => {
      const isCloudShared = (cloudProdiTasks || []).some((t) => t.id === id)
      if (isCloudShared && firebaseReady) {
        try {
          const res = await updateDocument('tugasProdi', id, changes)
          return res
        } catch (err) {
          return { ok: false, error: err?.message ?? String(err) }
        }
      }
      persistLocal(localTasksRef.current.map((t) => (t.id === id ? { ...t, ...changes } : t)))
      return { ok: true, id }
    },
    [cloudProdiTasks, persistLocal],
  )

  const toggleDone = useCallback(
    (id) => {
      const isCloudShared = (cloudProdiTasks || []).some((t) => t.id === id)
      if (isCloudShared) {
        const currentSet = new Set(completedSharedIdsRef.current)
        if (currentSet.has(id)) {
          currentSet.delete(id)
        } else {
          currentSet.add(id)
        }
        persistCompletedShared(Array.from(currentSet))
        return
      }

      persistLocal(
        localTasksRef.current.map((t) => (t.id === id ? { ...t, selesai: !t.selesai } : t)),
      )
    },
    [cloudProdiTasks, persistCompletedShared, persistLocal],
  )

  const removeTask = useCallback(
    async (id) => {
      const isCloudShared = (cloudProdiTasks || []).some((t) => t.id === id)
      if (isCloudShared && firebaseReady) {
        const res = await deleteDocument('tugasProdi', id)
        if (res?.ok === false) return res
        return { ok: true, id }
      }
      persistLocal(localTasksRef.current.filter((t) => t.id !== id))
      return { ok: true, id }
    },
    [cloudProdiTasks, persistLocal],
  )

  return { tasks, addTask, updateTask, toggleDone, removeTask }
}

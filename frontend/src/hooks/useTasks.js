import { useCallback, useEffect, useRef, useState } from 'react'
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage'

/**
 * Tugas tersimpan device-local di localStorage (sesuai PLAN.md — data mahasiswa
 * tidak berbasis akun). Struktur tugas:
 * { id, kodeMK, judul, deadline (ISO date), catatan, prioritas ('tinggi'|'sedang'|'rendah'), selesai }
 */
export function useTasks() {
  const [tasks, setTasks] = useState(() => getItem(STORAGE_KEYS.tasks, []))

  // Ref agar mutator bisa membaca daftar terbaru tanpa menjadikan `tasks`
  // dependensi callback (yang akan membentuk ulang callback tiap render).
  // Menghindari stale-closure: dua mutasi beruntun (mis. double-click)
  // tidak lagi kehilangan update karena keduanya membaca value terbaru.
  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  const persist = useCallback((next) => {
    setTasks(next)
    setItem(STORAGE_KEYS.tasks, next)
  }, [])

  const addTask = useCallback(
    (task) => {
      const newTask = {
        id: crypto.randomUUID(),
        selesai: false,
        prioritas: 'sedang',
        ...task,
      }
      persist([...tasksRef.current, newTask])
      return newTask
    },
    [persist],
  )

  const updateTask = useCallback(
    (id, changes) => {
      persist(tasksRef.current.map((t) => (t.id === id ? { ...t, ...changes } : t)))
    },
    [persist],
  )

  const toggleDone = useCallback(
    (id) => {
      persist(tasksRef.current.map((t) => (t.id === id ? { ...t, selesai: !t.selesai } : t)))
    },
    [persist],
  )

  const removeTask = useCallback(
    (id) => {
      persist(tasksRef.current.filter((t) => t.id !== id))
    },
    [persist],
  )

  return { tasks, addTask, updateTask, toggleDone, removeTask }
}

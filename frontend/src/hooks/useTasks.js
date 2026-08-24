import { useCallback, useState } from 'react'
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage'

/**
 * Tugas tersimpan device-local di localStorage (sesuai PLAN.md — data mahasiswa
 * tidak berbasis akun). Struktur tugas:
 * { id, kodeMK, judul, deadline (ISO date), catatan, prioritas ('tinggi'|'sedang'|'rendah'), selesai }
 */
export function useTasks() {
  const [tasks, setTasks] = useState(() => getItem(STORAGE_KEYS.tasks, []))

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
      persist([...tasks, newTask])
      return newTask
    },
    [tasks, persist],
  )

  const updateTask = useCallback(
    (id, changes) => {
      persist(tasks.map((t) => (t.id === id ? { ...t, ...changes } : t)))
    },
    [tasks, persist],
  )

  const toggleDone = useCallback(
    (id) => {
      persist(tasks.map((t) => (t.id === id ? { ...t, selesai: !t.selesai } : t)))
    },
    [tasks, persist],
  )

  const removeTask = useCallback(
    (id) => {
      persist(tasks.filter((t) => t.id !== id))
    },
    [tasks, persist],
  )

  return { tasks, addTask, updateTask, toggleDone, removeTask }
}

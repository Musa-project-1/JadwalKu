import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { db, firebaseReady } from '../lib/firebaseClient'

/**
 * @param {string} collectionName
 * @param {Array<[string, string, unknown]>} constraints Firestore where tuples
 */
export function useFirestore(collectionName, constraints = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(firebaseReady)
  const [error, setError] = useState(null)
  const constraintKey = constraints
    .map(([field, op, value]) => `${field}:${op}:${String(value)}`)
    .join('|')

  // Track previous constraintKey so we can reset data when query changes
  const prevKeyRef = useRef(constraintKey)

  useEffect(() => {
    // Reset data when the query changes so stale results don't persist
    if (prevKeyRef.current !== constraintKey) {
      prevKeyRef.current = constraintKey
      setData([])
    }

    if (!firebaseReady || !db) {
      setLoading(false)
      return undefined
    }

    // Jangan query jika ada filter bernilai kosong/undefined/0
    const validConstraints = constraints.filter(
      ([field, , value]) => field && value !== '' && value !== undefined && value !== null && value !== 0,
    )
    if (constraints.length > 0 && validConstraints.length !== constraints.length) {
      setLoading(false)
      return undefined
    }

    setLoading(true)
    let unsub = null
    try {
      const clauses = validConstraints.map(([field, op, value]) => where(field, op, value))
      const q = clauses.length > 0 ? query(collection(db, collectionName), ...clauses) : collection(db, collectionName)

      unsub = onSnapshot(
        q,
        (snap) => {
          setData(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
          setError(null)
          setLoading(false)
        },
        (err) => {
          console.warn(`[useFirestore] ${collectionName}:`, err?.message || err)
          setError(err)
          setLoading(false)
        },
      )
    } catch (err) {
      console.warn(`[useFirestore] ${collectionName} init:`, err?.message || err)
      setLoading(false)
    }

    return () => {
      if (typeof unsub === 'function') {
        try {
          unsub()
        } catch {
          // ignore unmount error on abrupt watch stream teardown
        }
      }
    }
    // constraintKey is the stable serialization of `constraints`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintKey])

  return { data, loading, error, ready: firebaseReady }
}


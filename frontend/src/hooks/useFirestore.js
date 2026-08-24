import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!firebaseReady || !db) {
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const clauses = constraints.map(([field, op, value]) => where(field, op, value))
    const q = query(collection(db, collectionName), ...clauses)

    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )

    return unsub
    // constraintKey is the stable serialization of `constraints`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintKey])

  return { data, loading, error, ready: firebaseReady }
}

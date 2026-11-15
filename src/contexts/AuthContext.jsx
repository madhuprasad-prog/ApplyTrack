import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config.js'
import { AuthContext } from './authContext.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => onAuthStateChanged(
    auth,
    (nextUser) => {
      setUser(nextUser)
      setError(null)
      setLoading(false)
    },
    (authError) => {
      setUser(null)
      setError(authError)
      setLoading(false)
    },
  ), [])

  const value = useMemo(() => ({ user, loading, error }), [user, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

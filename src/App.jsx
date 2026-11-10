
import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import Login from './components/Login'

import ExecutiveDashboard from './pages/ExecutiveDashboard'

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true)
      setError('')
      setProfile(null)
      setUser(currentUser)

      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        const profileRef = doc(db, 'users', currentUser.uid)
        const snapshot = await getDoc(profileRef)

        if (!snapshot.exists()) {
          setError('No Land Stewardz profile was found for this account.')
        } else {
          const data = snapshot.data()

          if (data.active !== true) {
            setError('This account is not active.')
          } else if (!['executive', 'board', 'volunteer'].includes(data.role)) {
            setError('This account has an unrecognized role.')
          } else {
            setProfile(data)
          }
        }
      } catch (err) {
        console.error('Profile lookup failed:', err.code)
        setError('Unable to load your profile. Check Firestore permissions.')
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <main><p>Checking crew credentials...</p></main>
  }

  if (!user) {
    return <Login />
  }

  if (!profile) {
    return (
      <main>
        <h1>Access unavailable</h1>
        <p role="alert">{error}</p>
        <button onClick={() => signOut(auth)}>Sign out</button>
      </main>
    )
  }


  if (profile.role === 'executive') {
    return <ExecutiveDashboard profile={profile} />
  }

  return (
    <main style={{ padding: '24px' }}>
      <h1>LAND STEWARDZ!</h1>
      <p>Welcome, {profile.displayName || 'Steward'}!</p>
      <p>Your role: {profile.role}</p>
      <p>Your dashboard is coming soon.</p>
      <button onClick={() => signOut(auth)}>Sign out</button>
    </main>
  )

}

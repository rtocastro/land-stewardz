
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      console.error('Login failed:', err.code)
      setError('Unable to sign in. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-header">
          <span className="eyebrow">SUNBREWED HOMESTEAD PRESENTS</span>
          <h1>LAND STEWARDZ!</h1>
          <p>GROW FOOD. BUILD COMMUNITY. GET DIRTY.</p>
        </div>

        <form className="login-card" onSubmit={handleLogin}>
          <h2>CREW CHECK-IN</h2>
          <p>Sign in to your homestead account.</p>

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'CHECKING IN...' : "LET'S GET TO WORK →"}
          </button>
        </form>
      </section>
    </main>
  )
}

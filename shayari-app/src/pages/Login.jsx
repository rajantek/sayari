import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth()
  if (!loading && user) return <Navigate to="/" replace />

  return (
    <div className="card center">
      <h1>Welcome</h1>
      <p className="muted">Log in to write shayari and like others.</p>
      <button className="btn" onClick={signInWithGoogle}>Continue with Google</button>
    </div>
  )
}

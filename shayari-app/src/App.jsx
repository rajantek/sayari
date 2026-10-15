import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Feed from './pages/Feed.jsx'
import Login from './pages/Login.jsx'
import Compose from './pages/Compose.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Single from './pages/Single.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="muted">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Header() {
  const { user, profile, signOut } = useAuth()
  return (
    <header className="header">
      <Link to="/" className="logo">शायरी · Shayari</Link>
      <nav>
        {user ? (
          <>
            <Link to="/write" className="btn">Write</Link>
            {profile?.username && <Link to={`/u/${profile.username}`}>Profile</Link>}
            <Link to="/settings">Settings</Link>
            <button className="link" onClick={signOut}>Log out</button>
          </>
        ) : (
          <Link to="/login" className="btn">Log in</Link>
        )}
      </nav>
    </header>
  )
}

export default function App() {
  const { user, profile } = useAuth()
  const { pathname } = useLocation()

  // New users must pick a username first
  const needsUsername = user && profile && !profile.username && pathname !== '/settings'

  return (
    <>
      <Header />
      <main className="container">
        {needsUsername && <Navigate to="/settings" replace />}
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/write" element={<Protected><Compose /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/s/:id" element={<Single />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}

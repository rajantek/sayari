import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth.jsx'

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '')
      setDisplayName(profile.display_name ?? '')
      setBio(profile.bio ?? '')
    }
  }, [profile])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('profiles')
      .update({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      })
      .eq('id', user.id)
    setSaving(false)

    if (error) {
      if (error.code === '23505') setError('That username is taken.')
      else if (error.code === '23514') setError('Username: 3–20 characters, lowercase letters, numbers, underscore.')
      else setError(error.message)
      return
    }
    await refreshProfile()
    navigate(`/u/${username.trim().toLowerCase()}`)
  }

  return (
    <form className="card form" onSubmit={save}>
      <h1>{profile?.username ? 'Edit profile' : 'Choose your username'}</h1>

      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. dil_ki_baat" />
      </label>
      <label>
        Display name
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </label>
      <label>
        Bio
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} dir="auto" rows={3} maxLength={300} />
      </label>

      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
    </form>
  )
}

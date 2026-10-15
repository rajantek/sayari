import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth.jsx'
import FeedList from '../components/FeedList.jsx'

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(undefined) // undefined = loading, null = not found
  const [totalLikes, setTotalLikes] = useState(0)

  useEffect(() => {
    setProfile(undefined)
    supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()
      .then(({ data }) => setProfile(data ?? null))
  }, [username])

  if (profile === undefined) return <p className="muted">Loading…</p>
  if (profile === null) return <p>No such user.</p>

  return (
    <>
      <section className="card profile-head">
        {profile.avatar_url && <img className="avatar" src={profile.avatar_url} alt="" referrerPolicy="no-referrer" />}
        <div>
          <h1>{profile.display_name || profile.username}</h1>
          <p className="muted">@{profile.username}</p>
          {profile.bio && <p dir="auto">{profile.bio}</p>}
          <p className="muted">♥ {totalLikes} likes on loaded posts</p>
          {user?.id === profile.id && <Link to="/settings">Edit profile</Link>}
        </div>
      </section>

      <FeedList
        key={`${profile.id}-${user?.id ?? 'anon'}`}
        filter={(q) => q.eq('author_id', profile.id)}
        onLoaded={(items) => setTotalLikes(items.reduce((s, i) => s + i.like_count, 0))}
      />
    </>
  )
}

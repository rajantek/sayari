import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth.jsx'

export default function ShayariCard({ item, onDeleted }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(item.liked_by_me)
  const [count, setCount] = useState(item.like_count)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function toggleLike() {
    if (!user) return navigate('/login')
    if (busy) return
    setBusy(true)
    const next = !liked
    // optimistic update
    setLiked(next)
    setCount((c) => c + (next ? 1 : -1))
    const { error } = next
      ? await supabase.from('likes').insert({ user_id: user.id, shayari_id: item.id })
      : await supabase.from('likes').delete().match({ user_id: user.id, shayari_id: item.id })
    if (error) {
      setLiked(!next)
      setCount((c) => c + (next ? -1 : 1))
    }
    setBusy(false)
  }

  async function share() {
    const url = `${window.location.origin}/s/${item.id}`
    if (navigator.share) {
      try { await navigator.share({ text: item.body, url }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this shayari?')) return
    const { error } = await supabase.from('shayari').delete().eq('id', item.id)
    if (!error) onDeleted?.(item.id)
  }

  return (
    <article className="card">
      <p className={`shayari lang-${item.language}`} dir="auto">{item.body}</p>

      {item.poet_credit && <p className="credit">— {item.poet_credit}</p>}

      {item.tags?.length > 0 && (
        <div className="tags">
          {item.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
        </div>
      )}

      <footer className="card-footer">
        <Link to={`/u/${item.username}`} className="author">
          {item.avatar_url && <img src={item.avatar_url} alt="" referrerPolicy="no-referrer" />}
          <span>{item.display_name || item.username}</span>
        </Link>
        <div className="actions">
          <button className={`like ${liked ? 'on' : ''}`} onClick={toggleLike} aria-pressed={liked}>
            {liked ? '♥' : '♡'} {count}
          </button>
          <button className="link" onClick={share}>{copied ? 'Link copied' : 'Share'}</button>
          {user?.id === item.author_id && <button className="link danger" onClick={remove}>Delete</button>}
        </div>
      </footer>
    </article>
  )
}

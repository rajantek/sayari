import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth.jsx'
import ShayariCard from '../components/ShayariCard.jsx'

export default function Single() {
  const { id } = useParams()
  const { user } = useAuth()
  const [item, setItem] = useState(undefined)

  useEffect(() => {
    supabase
      .from('feed')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setItem(data ?? null))
  }, [id, user?.id])

  if (item === undefined) return <p className="muted">Loading…</p>
  if (item === null) return <p>This shayari doesn't exist (or was deleted).</p>
  return <ShayariCard key={item.id + (user?.id ?? '')} item={item} onDeleted={() => setItem(null)} />
}

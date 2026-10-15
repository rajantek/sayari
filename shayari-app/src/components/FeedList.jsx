import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ShayariCard from './ShayariCard.jsx'

const PAGE = 20

// `filter` is an optional function that adds .eq()/etc. to the query.
// Give this component a `key` that changes when sort/filter/user changes.
export default function FeedList({ filter, sort = 'latest', onLoaded }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function loadMore(from) {
    setLoading(true)
    let q = supabase.from('feed').select('*')
    if (filter) q = filter(q)
    q =
      sort === 'top'
        ? q.order('like_count', { ascending: false }).order('created_at', { ascending: false })
        : q.order('created_at', { ascending: false })
    const { data, error } = await q.range(from, from + PAGE - 1)
    if (error) setError(error.message)
    else {
      const next = from === 0 ? data : [...items, ...data]
      setItems(next)
      onLoaded?.(next) // outside setItems: calling a side effect inside the
                       // updater runs twice under StrictMode and triggers
                       // "Cannot update a component while rendering…" warnings
      if (data.length < PAGE) setDone(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMore(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) return <p className="error">{error}</p>

  return (
    <>
      {items.map((it) => (
        <ShayariCard
          key={it.id}
          item={it}
          onDeleted={(id) => setItems((p) => p.filter((x) => x.id !== id))}
        />
      ))}
      {!loading && items.length === 0 && <p className="muted">Nothing here yet.</p>}
      {loading && <p className="muted">Loading…</p>}
      {!loading && !done && (
        <button className="btn secondary" onClick={() => loadMore(items.length)}>Load more</button>
      )}
    </>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth.jsx'

export default function Compose() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [body, setBody] = useState('')
  const [language, setLanguage] = useState('hi')
  const [tags, setTags] = useState('')
  const [credit, setCredit] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const tagList = tags
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean)
      .slice(0, 5)

    const { data, error } = await supabase
      .from('shayari')
      .insert({
        author_id: user.id,
        body: body.trim(),
        language,
        tags: tagList,
        poet_credit: credit.trim() || null,
      })
      .select('id')
      .single()

    setSaving(false)
    if (error) setError(error.message)
    else navigate(`/s/${data.id}`)
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h1>Write a shayari</h1>

      <label>
        Your shayari
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          dir="auto"
          rows={7}
          maxLength={1000}
          required
          className={`shayari lang-${language}`}
          placeholder={'Line breaks are kept as you type them…'}
        />
      </label>

      <label>
        Script
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="hi">Hindi (देवनागरी)</option>
          <option value="ur">Urdu (اردو)</option>
          <option value="en">Roman / English</option>
        </select>
      </label>

      <label>
        Tags (comma separated, max 5)
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ishq, dard, zindagi" />
      </label>

      <label>
        Written by another poet? Credit them (leave blank if it's yours)
        <input value={credit} onChange={(e) => setCredit(e.target.value)} maxLength={100} placeholder="e.g. Mirza Ghalib" />
      </label>

      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={saving || !body.trim()}>{saving ? 'Posting…' : 'Post'}</button>
    </form>
  )
}

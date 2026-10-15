import { useState } from 'react'
import FeedList from '../components/FeedList.jsx'
import { useAuth } from '../auth.jsx'

export default function Feed() {
  const [sort, setSort] = useState('latest')
  const { user } = useAuth()

  return (
    <>
      <div className="tabs">
        <button className={sort === 'latest' ? 'active' : ''} onClick={() => setSort('latest')}>Latest</button>
        <button className={sort === 'top' ? 'active' : ''} onClick={() => setSort('top')}>Top</button>
      </div>
      <FeedList key={`${sort}-${user?.id ?? 'anon'}`} sort={sort} />
    </>
  )
}

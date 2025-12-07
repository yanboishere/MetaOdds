import { useEffect, useMemo, useState } from "react"

type Item = {
  id: string
  platform: string
  title: string
  category: string
  status: string
  resolve_time?: string
  metrics: { volume_24h?: number }
  primary_contract?: { name: string; implied_prob?: number } | null
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [q, setQ] = useState("")
  const [platforms, setPlatforms] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [minVol, setMinVol] = useState<string>("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const query = useMemo(() => ({ q, platforms, categories, minVol }), [q, platforms, categories, minVol])
  useEffect(() => {
    setItems([])
    setPage(1)
    const u = new URL(`${process.env.API_BASE}/markets`)
    if (query.q) u.searchParams.set("q", query.q)
    for (const p of query.platforms) u.searchParams.append("platform", p)
    for (const c of query.categories) u.searchParams.append("category", c)
    if (query.minVol) u.searchParams.set("min_volume_24h", query.minVol)
    u.searchParams.set("page", "1")
    u.searchParams.set("page_size", "20")
    setLoading(true)
    fetch(u.toString()).then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false) })
  }, [query])

  function loadMore() {
    const next = page + 1
    const u = new URL(`${process.env.API_BASE}/markets`)
    if (query.q) u.searchParams.set("q", query.q)
    for (const p of query.platforms) u.searchParams.append("platform", p)
    for (const c of query.categories) u.searchParams.append("category", c)
    if (query.minVol) u.searchParams.set("min_volume_24h", query.minVol)
    u.searchParams.set("page", String(next))
    u.searchParams.set("page_size", "20")
    setLoading(true)
    fetch(u.toString()).then(r => r.json()).then(d => { setItems(prev => [...prev, ...(d.items || [])]); setPage(next); setLoading(false) })
  }
  return (
    <div className="layout">
      <div className="topbar">
        <input className="search" value={q} onChange={e => setQ(e.target.value)} placeholder="搜索事件标题、描述、标签" />
      </div>
      <div className="sidebar">
        <h3>平台</h3>
        {[
          { v: "polymarket", label: "Polymarket" },
          { v: "kalshi", label: "Kalshi" }
        ].map(o => (
          <label key={o.v} style={{ display: "block", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={platforms.includes(o.v)}
              onChange={e => {
                const checked = e.target.checked
                setPlatforms(prev => checked ? [...prev, o.v] : prev.filter(x => x !== o.v))
              }}
            /> {o.label}
          </label>
        ))}
        <h3>类型</h3>
        {[
          "politics","macro","sports","crypto","tech","other"
        ].map(c => (
          <label key={c} style={{ display: "block", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={categories.includes(c)}
              onChange={e => {
                const checked = e.target.checked
                setCategories(prev => checked ? [...prev, c] : prev.filter(x => x !== c))
              }}
            /> {c}
          </label>
        ))}
        <h3>24h 成交量下限</h3>
        <input value={minVol} onChange={e => setMinVol(e.target.value)} placeholder="例如 1000" style={{ width: "100%", padding: 10, border: "1px solid #d0d7de", borderRadius: 10, background: "#fff" }} />
      </div>
      <div className="content">
        <div className="grid">
          {items.map(it => (
            <a key={it.id} href={`/markets/${encodeURIComponent(it.id)}`} className="card">
              <div className="title">{it.title}</div>
              <div className="meta">{it.platform} · {it.category} · {it.status}</div>
              <div style={{ marginTop: 8 }}>隐含概率：{it.primary_contract?.implied_prob ?? "-"}</div>
              <div>24h 成交量：{it.metrics.volume_24h ?? 0}</div>
              <div className="muted">结算时间：{it.resolve_time ? new Date(it.resolve_time).toLocaleString() : "-"}</div>
            </a>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
          <button onClick={loadMore} disabled={loading} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #d0d7de", background: "#fff" }}>{loading ? "加载中..." : "加载更多"}</button>
        </div>
      </div>
    </div>
  )
}

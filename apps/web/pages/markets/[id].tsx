import { useEffect, useState } from "react"
import { useRouter } from "next/router"

export default function MarketDetail() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    if (!id) return
    fetch(`${process.env.API_BASE}/markets/${id}`).then(r => r.json()).then(setData)
  }, [id])
  if (!data) return <div className="content" style={{ paddingTop: 96 }}>加载中...</div>
  const m = data.market
  const ticker = (m.id as string).split(":")[1]
  const link = m.platform === "polymarket" ? `https://polymarket.com/market/${encodeURIComponent(ticker)}` : `https://kalshi.com/markets/${encodeURIComponent(ticker)}`
  return (
    <div>
      <div className="topbar">
        <div style={{ fontWeight: 700 }}>市场详情</div>
      </div>
      <div className="content">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="title" style={{ fontSize: 20 }}>{m.title}</div>
          <div className="meta">{m.platform} · {m.category} · {m.status}</div>
          <div className="muted">结算时间：{m.resolve_time ? new Date(m.resolve_time).toLocaleString() : "-"}</div>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="title">合约</div>
          <ul>
            {data.contracts.map((c: any) => (
              <li key={c.id}>{c.name} · 价格 {c.last_price ?? "-"} · 概率 {c.implied_prob ?? "-"}</li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="title">价格趋势（小时）</div>
          <ul>
            {data.price_history.map((p: any) => (
              <li key={p.id}>{new Date(p.ts).toLocaleString()} · 价格 {p.price ?? "-"} · 成交量 {p.volume ?? "-"}</li>
            ))}
          </ul>
        </div>
        <a className="card" href={link} target="_blank" rel="noreferrer" style={{ display: "inline-block" }}>在 {m.platform} 打开</a>
      </div>
    </div>
  )
}

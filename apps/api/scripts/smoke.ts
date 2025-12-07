import assert from "assert"

async function get(url: string) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

async function main() {
  const base = process.env.API_BASE || "http://localhost:4000"
  const list = await get(`${base}/markets`)
  assert(Array.isArray(list.items))
  assert(list.items.length >= 1)
  const id = list.items[0].id
  const detail = await get(`${base}/markets/${encodeURIComponent(id)}`)
  assert(detail.market.id === id)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


const cache = new Map()
const pending = new Map()
const ttl = 60 * 60 * 1000

async function getQuote(symbol, key) {
  const url = new URL('https://www.alphavantage.co/query')
  url.search = new URLSearchParams({ function: 'GLOBAL_QUOTE', symbol, apikey: key })
  let response
  try { response = await fetch(url, { signal: AbortSignal.timeout(15000) }) }
  catch { throw { status: 502, message: '데이터 제공 서버에 연결하지 못했습니다. 잠시 후 다시 시도하세요.' } }
  if (!response.ok) throw { status: 502, message: '데이터 제공 서버가 요청을 처리하지 못했습니다.' }
  let data
  try { data = await response.json() } catch { throw { status: 502, message: '데이터 제공 서버의 응답 형식이 올바르지 않습니다.' } }
  if (data.Note || data.Information) throw { status: 429, message: 'Alpha Vantage 사용량 제한 또는 API 이용 조건으로 조회할 수 없습니다. 잠시 후 다시 시도하거나 API 계정 상태를 확인하세요.' }
  const quote = data['Global Quote']
  if (data['Error Message'] || !quote || !Object.keys(quote).length) throw { status: 404, message: '해당 종목의 데이터를 찾을 수 없습니다. 티커를 확인하세요.' }
  const fields = { symbol: '01. symbol', open: '02. open', high: '03. high', low: '04. low', price: '05. price', volume: '06. volume', tradingDay: '07. latest trading day', previousClose: '08. previous close', change: '09. change', changePercent: '10. change percent' }
  const result = Object.fromEntries(Object.entries(fields).map(([name, field]) => [name, quote[field] ?? null]))
  if (!result.symbol || !result.tradingDay || !result.price || !Number.isFinite(Number(result.price))) throw { status: 502, message: '필수 시세 정보가 누락되었습니다.' }
  return { ...result, source: 'Alpha Vantage', fetchedAt: new Date().toISOString() }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'GET 요청만 지원합니다.' }) }
  const symbol = typeof req.query?.symbol === 'string' ? req.query.symbol.trim().toUpperCase() : ''
  if (!/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(symbol)) return res.status(400).json({ error: '올바른 종목 티커를 입력하세요.' })
  const key = process.env.ALPHA_VANTAGE_API_KEY
  if (!key) return res.status(503).json({ error: '서버의 Alpha Vantage API 키가 아직 설정되지 않았습니다.' })
  try {
    let entry = cache.get(symbol)
    if (!entry || Date.now() - entry.savedAt >= ttl) {
      if (!pending.has(symbol)) pending.set(symbol, getQuote(symbol, key).then(data => {
        if (cache.size >= 100) cache.delete(cache.keys().next().value)
        const next = { data, savedAt: Date.now() }; cache.set(symbol, next); return next
      }).finally(() => pending.delete(symbol)))
      entry = await pending.get(symbol)
    }
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600')
    return res.status(200).json(entry.data)
  } catch (error) { return res.status(error.status || 502).json({ error: error.message || '데이터를 불러오지 못했습니다.' }) }
}

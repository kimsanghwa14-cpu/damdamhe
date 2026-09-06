import { useRef, useState } from 'react'
import { formatTime } from '../data/formatTime'

export default function DataPage() {
  const [symbol, setSymbol] = useState('')
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const busy = useRef(false)
  async function search(event) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    setLoading(true); setError(''); setQuote(null)
    try {
      const response = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '조회에 실패했습니다.')
      setQuote(data)
    } catch (error) { setError(error instanceof SyntaxError ? 'API 서버에 연결할 수 없습니다.' : error.message) }
    finally { busy.current = false; setLoading(false) }
  }
  const fields = quote ? [['시가', quote.open], ['고가', quote.high], ['저가', quote.low], ['이전 종가', quote.previousClose], ['거래량', quote.volume], ['전일 대비', quote.change], ['등락률', quote.changePercent]] : []
  return <div className="app data-page">
    <header><p className="eyebrow">ALPHA VANTAGE · 실제 API 데이터</p><h1>담담히 <span>MARKET DATA</span></h1><a href="/">← 캡처 대시보드</a></header>
    <main>
      <section className="data-intro"><h2>종목 시세 조회</h2><p className="muted">종목 티커를 입력하면 Alpha Vantage가 제공한 시세를 조회합니다. 자동 조회는 하지 않습니다.</p>
        <form onSubmit={search}><label htmlFor="symbol">종목 티커</label><div className="search-row"><input id="symbol" value={symbol} onChange={event => setSymbol(event.target.value)} placeholder="예: AAPL, MSFT, IBM" maxLength={20} pattern="[A-Za-z0-9][A-Za-z0-9.\-]{0,19}" required autoComplete="off" spellCheck="false" /><button disabled={loading || !symbol.trim()}>{loading ? '조회 중…' : '시세 조회'}</button></div></form>
        <p className="muted">기본 시세는 거래일 종료 후 갱신되며 실시간 시세가 아닙니다. 무료 API는 하루 25회 요청 제한이 있습니다. 저장된 응답은 최대 1시간 재사용할 수 있습니다. <a href="https://www.alphavantage.co/documentation/#latestprice" target="_blank" rel="noreferrer">제공 기준 ↗</a></p>
      </section>
      <div aria-live="polite" aria-busy={loading}>
        {error && <p role="alert" className="failure data-error">{error}</p>}
        {!quote && !error && <p className="data-empty">{loading ? '실제 데이터를 불러오고 있습니다.' : '티커를 입력하고 시세 조회를 눌러주세요.'}</p>}
        {quote && <section className="quote-panel"><div className="quote-heading"><h2>{quote.symbol}</h2><span className="status">최근 거래일 {quote.tradingDay}</span></div><p className="quote-price">{quote.price}</p><p className="muted">제공된 가격 · 해당 종목의 거래 통화 기준</p><dl className="quote-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '정보 없음'}</dd></div>)}</dl><p className="muted">출처: {quote.source} · API 조회 시간: {formatTime(quote.fetchedAt)}</p></section>}
      </div>
    </main>
  </div>
}

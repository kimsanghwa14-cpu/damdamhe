import { useEffect, useState } from 'react'
import { WATCHLIST, sections, selectWatchlist } from '../data/watchlist'
import { formatTime } from '../data/formatTime'
import CaptureMode from '../components/CaptureMode'

export default function ScannerPage() {
  const [mode, setMode] = useState('core')
  const [manifest, setManifest] = useState({})
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [broken, setBroken] = useState({})
  useEffect(() => {
    const controller = new AbortController()
    fetch('/finviz/manifest.json', { cache: 'no-store', signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('아직 스캐너 캡처 기록이 없습니다.'); return response.json() })
      .then(setManifest)
      .catch(error => { if (error.name !== 'AbortError') setError('스캐너 캡처 기록을 불러오지 못했습니다.') })
    return () => controller.abort()
  }, [])
  const items = selectWatchlist(mode)
  const available = items.filter(item => manifest.tickers?.[item.ticker]?.capturedAt && !broken[item.ticker])
  const sheet = manifest.sheets?.[mode]
  const siteFor = item => ({ id: `finviz:${item.ticker}`, title: item.ticker, screenshot: `/finviz/${item.ticker}.png` })
  function navigate(direction) {
    if (selected.sheet) {
      const nextMode = mode === 'core' ? 'full' : 'core'
      const next = manifest.sheets?.[nextMode]
      if (next?.capturedAt) { setMode(nextMode); setSelected({ sheet: true, site: { id: `finviz:sheet:${nextMode}`, title: `${nextMode.toUpperCase()} 한 장 이미지`, screenshot: next.screenshot }, capture: next }) }
      return
    }
    if (!available.length) return
    const index = available.findIndex(item => siteFor(item).id === selected.site.id)
    const item = available[(index + direction + available.length) % available.length]
    setSelected({ site: siteFor(item), capture: manifest.tickers[item.ticker] })
  }
  return <div className="app scanner-page">
    <header><p className="eyebrow">FINVIZ · 저장된 실제 차트</p><h1>미국시장 스캐너</h1><a href="/">← 시장 캡처</a>
      <p className="muted">마지막 차트 업데이트: {formatTime(manifest.lastUpdatedAt)}</p>
      <div className="scanner-toolbar"><div role="group" aria-label="스캐너 범위"><button aria-pressed={mode === 'core'} onClick={() => setMode('core')}>CORE</button><button aria-pressed={mode === 'full'} onClick={() => setMode('full')}>FULL</button></div>
        <button disabled={!sheet?.capturedAt} onClick={() => setSelected({ sheet: true, site: { id: `finviz:sheet:${mode}`, title: `${mode.toUpperCase()} 한 장 이미지`, screenshot: sheet.screenshot }, capture: sheet })}>한 장 이미지</button>
      </div>
      <p className="muted">{mode === 'core' ? '우선순위 1 종목' : '전체 WATCHLIST'} · 차트를 탭하면 캡처 모드로 열립니다.</p>
      {sheet?.capturedAt && <p className="muted">한 장 이미지: {formatTime(sheet.capturedAt)}{sheet.status === 'failed' && ' · 최근 생성 실패, 이전 정상 이미지 유지'}</p>}
    </header>
    {!WATCHLIST.length && <p role="status" className="scanner-empty">원본 WATCHLIST 등록 대기 중입니다. 종목과 priority는 원본 Python 코드 확인 후 반영합니다.</p>}
    {error && WATCHLIST.length > 0 && <p role="alert">{error}</p>}
    <main>{sections.map(section => <section key={section} className="scanner-section"><h2>{section}</h2><div className="scanner-grid">{items.filter(item => item.section === section).map(item => {
      const capture = manifest.tickers?.[item.ticker]
      return <article key={item.ticker} className="scanner-chart"><div className="card-heading"><div><h3>{item.ticker}</h3><p className="muted">{item.title}</p></div><span className="timestamp">{formatTime(capture?.capturedAt)}</span></div>
        {capture?.capturedAt && !broken[item.ticker] ? <button className="scanner-image" aria-label={`${item.ticker} 캡처 모드`} onClick={() => setSelected({ site: siteFor(item), capture })}><img loading="lazy" src={`/finviz/${item.ticker}.png?v=${encodeURIComponent(capture.capturedAt)}`} alt={`${item.ticker} Finviz 차트`} onError={() => setBroken(previous => ({ ...previous, [item.ticker]: true }))} /></button> : <p className="scanner-empty">저장된 차트가 없습니다.</p>}
        {capture?.status === 'failed' && <p className="failure">최근 다운로드 실패{capture.capturedAt ? ' · 이전 정상 이미지 표시' : ''}</p>}
      </article>
    })}</div>{!items.some(item => item.section === section) && <p className="muted">등록된 종목 없음</p>}</section>)}</main>
    {selected && <CaptureMode key={selected.site.id} site={selected.site} capture={selected.capture} onPrevious={() => navigate(-1)} onNext={() => navigate(1)} onClose={() => setSelected(null)} />}
  </div>
}

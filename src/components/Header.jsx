import { formatTime } from '../data/formatTime'
import { sites } from '../data/sites'

export default function Header({ manifest, category, onCategoryChange, categories, onReload }) {
  const saved = sites.filter(site => manifest.sites?.[site.id]?.capturedAt).length
  const failed = sites.filter(site => manifest.sites?.[site.id]?.status === 'failed').length
  return <header className="dashboard-header">
    <div className="heading"><a className="brand" href="/">MARKET DASHBOARD</a><div className="desktop-links"><a href="/scanner">미국시장 스캐너 ↗</a><a href="/data">종목 시세 조회 ↗</a></div></div>
    <div className="dashboard-intro"><div><p className="eyebrow">DAILY MARKET OVERVIEW</p><h1>오늘의 시장을 한눈에</h1><p className="intro-copy">국내외 증시부터 시장 심리까지,<br className="mobile-break" /> 주요 지표를 한곳에서 확인하세요.</p></div><button onClick={onReload}>최신 저장 화면 불러오기 ↻</button></div>
    <div className="dashboard-summary" aria-label="지표 업데이트 상태"><div><span>업데이트</span><strong>{formatTime(manifest.completedAt)}</strong></div><div><span>저장된 지표</span><strong>{saved} / {sites.length}</strong></div><div><span>갱신 상태</span><strong>{!manifest.completedAt ? '확인 중' : failed ? `${failed}개 갱신 지연` : '전체 정상'}</strong></div><div><span>자동 업데이트</span><strong>매일 오전 7시 · 한국시간</strong></div></div>
    <nav className="category-tabs" aria-label="카테고리 필터">{categories.map(item => <button key={item} aria-pressed={category === item} onClick={() => onCategoryChange(item)}>{item}<span>{sites.filter(site => item === '전체' || site.category === item).length}</span></button>)}</nav>
  </header>
}

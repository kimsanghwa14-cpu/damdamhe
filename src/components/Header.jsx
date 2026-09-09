import { sites } from '../data/sites'

export default function Header({ manifest, category, onCategoryChange, categories, onReload }) {
  const failed = sites.filter(site => manifest.sites?.[site.id]?.status === 'failed').length
  const updated = manifest.completedAt ? new Date(manifest.completedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '불러오는 중'
  return <header className="dashboard-header">
    <div className="dashboard-topbar"><a className="brand" href="/"><span className="brand-mark" aria-hidden="true">M</span> MARKET DASHBOARD</a><div className="desktop-links"><a href="/scanner">미국시장 스캐너 ↗</a><a href="/data">종목 조회 ↗</a></div></div>
    <div className="dashboard-intro"><div><h1>시장 대시보드</h1><p>주요 시장 지표를 모아, 더 간편하게.</p></div><button className="refresh-button" onClick={onReload} aria-label="최신 저장 화면 불러오기">↻ <span>새로고침</span></button></div>
    <div className="update-line"><span className={`update-dot ${failed ? 'update-delayed' : ''}`} aria-hidden="true" /><span>{updated}{manifest.completedAt && ' 업데이트 · 한국시간'}</span>{failed > 0 && <span className="update-warning">{failed}개 갱신 지연</span>}<span className="update-schedule">매일 오전 7시 자동 갱신</span></div>
    <nav className="category-tabs" aria-label="카테고리 필터">{categories.map(item => <button key={item} aria-pressed={category === item} onClick={() => onCategoryChange(item)}>{item}{item === '전체' && <span>{sites.length}</span>}</button>)}</nav>
  </header>
}

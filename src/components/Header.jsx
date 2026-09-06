import { formatTime } from '../data/formatTime'

export default function Header({ manifest, category, onCategoryChange, categories, onReload }) {
  return <header>
    <div className="heading"><div><p className="eyebrow">실제 웹페이지 캡처 모음</p><h1>담담히 <span>MARKET DASHBOARD</span></h1></div><button onClick={onReload}>저장된 캡처 다시 불러오기</button></div>
    <p className="muted">마지막 전체 캡처 실행: {formatTime(manifest.completedAt)} · 전체 성공: {formatTime(manifest.lastSuccessfulRunAt)}</p>
    <p className="muted">전체 새로고침: GitHub Actions에서 Capture websites → Run workflow를 실행하세요. 캡처 반영 및 배포 완료 후 다시 불러오세요.</p>
    <nav aria-label="카테고리 필터">{categories.map(item => <button key={item} aria-pressed={category === item} onClick={() => onCategoryChange(item)}>{item}</button>)}</nav>
  </header>
}

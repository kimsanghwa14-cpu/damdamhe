import { useState } from 'react'
import { formatTime } from '../data/formatTime'

export default function CaptureCard({ site, capture, onOpen }) {
  const [broken, setBroken] = useState(false)
  const available = capture?.capturedAt && !broken
  const source = site.sourceLabel || (site.url.includes('naver.com') ? 'Npay 증권' : 'StockCharts')
  const time = capture?.capturedAt ? new Date(capture.capturedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '저장 대기'
  return <article className="card">
    <button className="card-open" disabled={!available} onClick={() => onOpen(site)} aria-label={`${site.title} 이미지 크게 보기`}>
      <div className="image-button" aria-hidden="true">{available ? <img loading="lazy" src={`${site.screenshot}?v=${encodeURIComponent(capture.capturedAt)}`} alt="" onError={() => setBroken(true)} /> : <span className="preview-empty">{broken ? '이미지 로드 실패' : '준비 중'}</span>}<span className="preview-open">크게 보기 ↗</span></div>
      <div className="card-copy"><h2>{site.title}<span className="card-arrow" aria-hidden="true">↗</span></h2><p className="source-label">{source}</p>{capture?.status === 'failed' && <span className="card-delay">갱신 지연{available && ' · 이전 화면'}</span>}</div>
    </button>
    <div className="card-meta"><time dateTime={capture?.capturedAt} title={formatTime(capture?.capturedAt)}>{time}</time><a href={site.url} target="_blank" rel="noreferrer" aria-label={`${site.title} 원본 사이트 열기`}>원본 ↗</a></div>
  </article>
}

import { useState } from 'react'
import { formatTime } from '../data/formatTime'
export default function CaptureCard({ site, capture, onOpen }) {
  const [broken, setBroken] = useState(false)
  const available = capture?.capturedAt && !broken
  return <article className="card" onClick={event => {
    if (available && window.matchMedia('(max-width: 768px)').matches && !event.target.closest('a, button')) onOpen(site)
  }}>
    <div className="card-heading"><div><p className="eyebrow">{site.category}</p><h2>{site.title}</h2></div><span className={`status ${capture?.status === 'failed' || !available ? 'status-delayed' : 'status-ok'}`}>{capture?.status === 'failed' ? '갱신 지연' : available ? '저장 완료' : '준비 중'}</span></div>
    <p className="timestamp">저장 시각: {formatTime(capture?.capturedAt)}</p>
    {available ? <button className="image-button" onClick={() => onOpen(site)} aria-label={`${site.title} 이미지 크게 보기`}><img loading="lazy" src={`${site.screenshot}?v=${encodeURIComponent(capture.capturedAt)}`} alt={`${site.title} 실제 웹페이지 캡처`} onError={() => setBroken(true)} /></button> : <div className="empty"><strong>{broken ? '이미지를 불러올 수 없습니다' : '지표 화면을 준비하고 있습니다'}</strong><p>원본 사이트에서 지표를 확인할 수 있습니다.</p><a href={site.url} target="_blank" rel="noreferrer">{site.title} 확인하기 ↗</a></div>}
    {capture?.status === 'failed' && <p className="failure">원본 사이트의 응답 문제로 갱신이 지연되고 있습니다.{available && ' 이전 정상 캡처를 표시합니다.'}</p>}
    {site.sourceLabel && <p className="source-label">출처: {site.sourceLabel}</p>}
    <div className="card-actions"><a href={site.url} target="_blank" rel="noreferrer">원본 사이트 열기 ↗</a><button disabled={!available} onClick={() => onOpen(site)}>이미지 크게 보기</button></div>
  </article>
}

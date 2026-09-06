import { useState } from 'react'
import { formatTime } from '../data/formatTime'
export default function CaptureCard({ site, capture, onOpen }) {
  const [broken, setBroken] = useState(false)
  const available = capture?.capturedAt && !broken
  return <article className="card">
    <div className="card-heading"><div><p className="eyebrow">{site.category}</p><h2>{site.title}</h2></div><span className="status">{capture?.status === 'failed' ? '최근 캡처 실패' : available ? '캡처 저장됨' : '미확인'}</span></div>
    <p className="timestamp">마지막 캡처: {formatTime(capture?.capturedAt)}</p>
    {available ? <button className="image-button" onClick={() => onOpen(site)} aria-label={`${site.title} 이미지 크게 보기`}><img loading="lazy" src={`${site.screenshot}?v=${encodeURIComponent(capture.capturedAt)}`} alt={`${site.title} 실제 웹페이지 캡처`} onError={() => setBroken(true)} /></button> : <div className="empty">{broken ? '캡처 이미지를 불러오지 못했습니다.' : '저장된 캡처가 없습니다.'}</div>}
    {capture?.status === 'failed' && <p className="failure">최근 실행에 실패했습니다.{available && ' 이전 정상 캡처를 표시합니다.'}</p>}
    <div className="card-actions"><a href={site.url} target="_blank" rel="noreferrer">원본 사이트 열기 ↗</a><button disabled={!available} onClick={() => onOpen(site)}>이미지 크게 보기</button></div>
  </article>
}

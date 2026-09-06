import { useEffect, useRef, useState } from 'react'
export default function ImageModal({ site, capture, onClose }) {
  const dialog = useRef(null)
  const [actualSize, setActualSize] = useState(true)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { element.close(); document.body.style.overflow = overflow; previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="modal" aria-labelledby="modal-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal-panel"><div className="modal-toolbar"><h2 id="modal-title">{site.title}</h2><button onClick={() => setActualSize(!actualSize)}>{actualSize ? '화면 너비에 맞추기' : '원본 크기'}</button><a href={site.url} target="_blank" rel="noreferrer">원본 사이트 열기 ↗</a><button onClick={onClose} aria-label="이미지 닫기">닫기 ×</button></div>
    <div className={`modal-scroll ${actualSize ? 'actual-size' : ''}`}><img src={`${site.screenshot}?v=${encodeURIComponent(capture.capturedAt)}`} alt={`${site.title} 실제 웹페이지 캡처`} /></div></section>
  </dialog>
}

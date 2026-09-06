import { useEffect, useRef, useState } from 'react'

const keyFor = id => `damdamhi:capture-position:v1:${id}`
const initialView = { scale: 1, translateX: 0, translateY: 0 }
function restore(id) {
  try {
    const value = JSON.parse(localStorage.getItem(keyFor(id)))
    if (value && ['scale', 'translateX', 'translateY'].every(key => Number.isFinite(value[key])) && value.scale > 0 && value.scale <= 20) return value
  } catch { /* Storage may be unavailable. Gestures still work. */ }
  return null
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

export default function CaptureMode({ site, capture, onPrevious, onNext, onClose }) {
  const dialog = useRef(null)
  const img = useRef(null)
  const [restored] = useState(() => restore(site.id))
  const [view, setView] = useState(() => restored || initialView)
  const current = useRef(view)
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const timer = useRef(null)
  const [ready, setReady] = useState(false)
  const [controls, setControls] = useState(false)
  const [notice, setNotice] = useState('')

  function update(value) { current.current = value; setView(value) }
  function save(value = current.current) {
    try { localStorage.setItem(keyFor(site.id), JSON.stringify(value)); return true }
    catch { return false }
  }
  function reveal(message = '') {
    setNotice(message); setControls(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { setControls(false); setNotice('') }, 2000)
  }
  function fit() {
    if (!img.current?.naturalWidth) return
    const next = { scale: dialog.current.clientWidth / img.current.naturalWidth, translateX: 0, translateY: 0 }
    update(next); save(next)
  }
  useEffect(() => {
    const element = dialog.current
    const focus = document.activeElement
    const y = window.scrollY
    const body = document.body
    const previous = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow }
    body.style.position = 'fixed'; body.style.top = `-${y}px`; body.style.width = '100%'; body.style.overflow = 'hidden'
    element.showModal()
    return () => {
      clearTimeout(timer.current)
      element.close()
      Object.assign(body.style, previous)
      window.scrollTo(0, y)
      focus?.focus({ preventScroll: true })
    }
  }, [])
  function begin(event) {
    if (!ready) { reveal('이미지를 준비 중입니다.'); return }
    if ((event.pointerType === 'mouse' && event.button !== 0)) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointers.current.values()]
    if (points.length === 1) {
      gesture.current = { start: points[0], base: { ...current.current }, time: performance.now(), moved: 0, multi: false }
    } else if (points.length === 2) {
      gesture.current = { base: { ...current.current }, midpoint: midpoint(...points), distance: distance(...points), multi: true, moved: 0 }
    }
  }
  function move(event) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return
    event.preventDefault()
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointers.current.values()]
    const g = gesture.current
    if (points.length >= 2 && g.midpoint) {
      const middle = midpoint(points[0], points[1])
      const min = dialog.current.clientWidth / img.current.naturalWidth
      const scale = Math.max(min, Math.min(20, g.base.scale * distance(points[0], points[1]) / Math.max(1, g.distance)))
      const ratio = scale / g.base.scale
      update({ scale, translateX: middle.x - (g.midpoint.x - g.base.translateX) * ratio, translateY: middle.y - (g.midpoint.y - g.base.translateY) * ratio })
    } else if (points.length === 1 && g.start) {
      const dx = points[0].x - g.start.x, dy = points[0].y - g.start.y
      g.moved = Math.max(g.moved, Math.hypot(dx, dy))
      update({ ...g.base, translateX: g.base.translateX + dx, translateY: g.base.translateY + dy })
    }
  }
  function end(event, cancelled = false) {
    if (!pointers.current.has(event.pointerId)) return
    const g = gesture.current
    pointers.current.delete(event.pointerId)
    if (pointers.current.size) {
      const point = [...pointers.current.values()][0]
      gesture.current = { start: point, base: { ...current.current }, multi: true, moved: 0 }
      return
    }
    gesture.current = null
    if (!g) return
    if (!cancelled && !g.multi) {
      const dx = event.clientX - g.start.x, dy = event.clientY - g.start.y
      const duration = performance.now() - g.time
      // A quick, predominantly horizontal flick changes sites. A slower drag pans.
      if (Math.abs(dx) >= 90 && Math.abs(dx) > Math.abs(dy) * 2 && duration < 350 && Math.abs(dx) / Math.max(duration, 1) > 0.65) {
        update(g.base); save(g.base)
        if (dx < 0) onNext(); else onPrevious()
        return
      }
      if (g.moved < 8 && Math.hypot(dx, dy) < 8) { update(g.base); reveal(); return }
    }
    if (!save()) reveal('이 브라우저에서 위치를 저장할 수 없습니다.')
  }
  return <dialog ref={dialog} className="capture-mode" aria-label={`${site.title} 캡처 모드`} onCancel={onClose}>
    <div className="capture-surface" onPointerDown={begin} onPointerMove={move} onPointerUp={event => end(event)} onPointerCancel={event => end(event, true)} onContextMenu={event => event.preventDefault()}>
      <img ref={img} className="capture-original" draggable="false" src={`${site.screenshot}?v=${encodeURIComponent(capture.capturedAt)}`} alt={`${site.title} 실제 캡처`} style={{ visibility: ready ? 'visible' : 'hidden', transform: `translate3d(${view.translateX}px, ${view.translateY}px, 0) scale(${view.scale})` }} onLoad={() => { if (!restored) fit(); setReady(true) }} onError={() => reveal('이미지를 불러오지 못했습니다. 닫거나 다음 화면으로 이동하세요.')} />
    </div>
    {controls && <div className="capture-controls" onPointerDown={event => event.stopPropagation()}>
      {notice && <p role="status">{notice}</p>}
      <div><button onClick={onPrevious}>이전</button><button onClick={() => { fit(); reveal('초기 위치로 저장했습니다.') }}>초기화</button><button onClick={() => reveal(save() ? '이 위치를 저장했습니다.' : '위치를 저장할 수 없습니다.')}>위치 저장</button><button onClick={onNext}>다음</button><button onClick={onClose}>닫기</button></div>
    </div>}
  </dialog>
}

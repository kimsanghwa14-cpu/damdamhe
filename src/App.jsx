import { useCallback, useEffect, useState } from 'react'
import Header from './components/Header'
import CaptureGrid from './components/CaptureGrid'
import ImageModal from './components/ImageModal'
import CaptureMode from './components/CaptureMode'
import { sites } from './data/sites'
import './App.css'
import DataPage from './pages/DataPage'
import ScannerPage from './pages/ScannerPage'
import MobileNavigation from './components/MobileNavigation'

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '')
  return <>{path === '/data' ? <DataPage /> : path === '/scanner' ? <ScannerPage /> : <Dashboard />}<MobileNavigation scanner={path === '/scanner'} /></>
}

function Dashboard() {
  const [manifest, setManifest] = useState({})
  const [error, setError] = useState('')
  const [category, setCategory] = useState('전체')
  const [selected, setSelected] = useState(null)
  const [captureMode, setCaptureMode] = useState(false)
  function open(site) { setCaptureMode(window.matchMedia('(max-width: 768px)').matches); setSelected(site) }
  function navigate(direction) {
    const available = sites.filter(site => manifest.sites?.[site.id]?.capturedAt)
    const index = available.findIndex(site => site.id === selected.id)
    setSelected(available[(index + direction + available.length) % available.length])
  }
  const reload = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}captures/manifest.json`, { cache: 'no-store' })
      if (!response.ok) throw new Error('캡처 기록을 불러올 수 없습니다. 캡처 실행 및 배포 상태를 확인하세요.')
      const data = await response.json()
      setManifest(data)
      setError('')
    } catch { setError('캡처 기록을 불러올 수 없습니다. 캡처 실행 및 배포 상태를 확인하세요.') }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}captures/manifest.json`, { cache: 'no-store', signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Missing manifest'); return response.json() })
      .then(setManifest)
      .catch(error => { if (error.name !== 'AbortError') setError('캡처 기록을 불러올 수 없습니다. 캡처 실행 및 배포 상태를 확인하세요.') })
    return () => controller.abort()
  }, [])
  return <div className="app"><Header manifest={manifest} category={category} onCategoryChange={setCategory} categories={['전체', ...new Set(sites.map(site => site.category))]} onReload={reload} />
    {error && <p role="alert" className="failure">{error}</p>}
    <CaptureGrid sites={sites.filter(site => category === '전체' || site.category === category)} manifest={manifest} onOpen={open} />
    <footer>실제 웹페이지의 저장된 화면입니다. 실시간 정보는 원본 사이트에서 확인하세요.</footer>
    {selected && captureMode && <CaptureMode key={selected.id} site={selected} capture={manifest.sites[selected.id]} onPrevious={() => navigate(-1)} onNext={() => navigate(1)} onClose={() => setSelected(null)} />}
    {selected && !captureMode && <ImageModal site={selected} capture={manifest.sites[selected.id]} onClose={() => setSelected(null)} />}
  </div>
}

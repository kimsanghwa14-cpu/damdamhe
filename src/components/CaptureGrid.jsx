import CaptureCard from './CaptureCard'
export default function CaptureGrid({ sites, manifest, onOpen }) {
  return <main className="capture-grid">{sites.map(site => <CaptureCard key={`${site.id}-${manifest.sites?.[site.id]?.capturedAt}`} site={site} capture={manifest.sites?.[site.id]} onOpen={onOpen} />)}</main>
}

import CaptureCard from './CaptureCard'
export default function CaptureGrid({ sites, manifest, onOpen }) {
  return <main id="market-indicators">{[...new Set(sites.map(site => site.category))].map(category => <section className="market-section" key={category} aria-label={category}>
    <div className="section-heading"><h2>{category}</h2><span>{sites.filter(site => site.category === category).length}개 지표</span></div>
    <div className="capture-grid">{sites.filter(site => site.category === category).map(site => <CaptureCard key={`${site.id}-${manifest.sites?.[site.id]?.capturedAt}`} site={site} capture={manifest.sites?.[site.id]} onOpen={onOpen} />)}</div>
  </section>)}</main>
}

import CaptureCard from './CaptureCard'
const descriptions = {
  '국내증시': '주요 지수와 시가총액으로 살펴보는 국내 시장',
  '미국증시': '미국 증시의 흐름과 섹터별 움직임',
  '시장 폭·심리': '상승·하락 종목의 흐름과 투자 심리',
}
export default function CaptureGrid({ sites, manifest, onOpen }) {
  return <main>{[...new Set(sites.map(site => site.category))].map(category => <section className="market-section" key={category} aria-label={category}>
    <div className="section-heading"><h2>{category}</h2><p>{descriptions[category]}</p></div>
    <div className="capture-grid">{sites.filter(site => site.category === category).map(site => <CaptureCard key={`${site.id}-${manifest.sites?.[site.id]?.capturedAt}`} site={site} capture={manifest.sites?.[site.id]} onOpen={onOpen} />)}</div>
  </section>)}</main>
}

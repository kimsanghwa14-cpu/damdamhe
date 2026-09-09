const mobile = { width: 480, height: 1000 }
const desktop = { width: 1440, height: 1080 }

// selector는 실제 페이지에서 안정성을 확인한 경우에만 설정합니다.
export const sites = [
  { id: 'naver-market-cap', title: '국내증시 시가총액', category: '국내증시', url: 'https://m.stock.naver.com/domestic/home/capitalization/total', viewport: mobile },
  { id: 'kospi', title: '코스피', category: '국내증시', url: 'https://m.stock.naver.com/domestic/index/KOSPI/total', viewport: mobile },
  { id: 'kosdaq', title: '코스닥', category: '국내증시', url: 'https://m.stock.naver.com/domestic/index/KOSDAQ/total', viewport: mobile },
  { id: 'us-market', title: '미국증시', category: '미국증시', url: 'https://m.stock.naver.com/worldstock/home/USA/marketValue/total', viewport: mobile },
  { id: 'finviz-groups', title: '미국 섹터 현황', category: '미국증시', url: 'https://www.tradingview.com/markets/stocks-usa/sectorandindustry-sector/', viewport: desktop, sourceLabel: 'TradingView · 제공사 섹터 분류 기준', readySelector: 'table tbody tr', captureType: 'element', selector: 'main' },
  { id: 'finviz-map', title: 'S&P 500 히트맵', category: '미국증시', url: 'https://www.tradingview.com/heatmap/stock/#%7B%22dataSource%22%3A%22SPX500%22%7D', viewport: desktop, sourceLabel: 'TradingView · S&P 500', readySelector: 'canvas', captureType: 'viewport' },
  { id: 'adr', title: 'ADR', category: '시장 폭·심리', url: 'https://jusikbot.com/adr', viewport: { width: 900, height: 1080 }, sourceLabel: '주식봇 · 코스피·코스닥 20거래일 ADR', readySelector: 'main canvas', dismissDialogName: '새 기능이 추가됐어요', dismissButtonName: '닫기', captureType: 'element', selector: 'main' },
  { id: 'cnn-fear-greed', title: '미국 공포·탐욕 지수', category: '시장 폭·심리', url: 'https://feargreedmeter.com/fear-and-greed-index', viewport: desktop, sourceLabel: 'Fear & Greed Meter', readySelector: '#gauge-chart1 svg', captureType: 'viewport' },
  { id: 'nya200r', title: '미국 마켓브레스 NYA200R', category: '시장 폭·심리', url: 'https://stockcharts.com/freecharts/symbolsummary.html?sym=%24NYA200R', viewport: desktop },
].map(site => ({ screenshot: `/captures/${site.id}.png`, captureType: 'fullPage', selector: null, ...site }))

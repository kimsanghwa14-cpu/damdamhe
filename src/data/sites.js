const mobile = { width: 480, height: 1000 }
const desktop = { width: 1440, height: 1080 }

// selector는 실제 페이지에서 안정성을 확인한 경우에만 설정합니다.
export const sites = [
  { id: 'naver-market-cap', title: '국내증시 시가총액', category: '국내증시', url: 'https://m.stock.naver.com/domestic/home/capitalization/total', viewport: mobile },
  { id: 'kospi', title: '코스피', category: '국내증시', url: 'https://m.stock.naver.com/domestic/index/KOSPI/total', viewport: mobile },
  { id: 'kosdaq', title: '코스닥', category: '국내증시', url: 'https://m.stock.naver.com/domestic/index/KOSDAQ/total', viewport: mobile },
  { id: 'us-market', title: '미국증시', category: '미국증시', url: 'https://m.stock.naver.com/worldstock/home/USA/marketValue/total', viewport: mobile },
  { id: 'adr', title: 'ADR', category: '시장 폭·심리', url: 'http://adrinfo.kr/', viewport: desktop },
  { id: 'finviz-groups', title: '미국 섹터 현황', category: '미국증시', url: 'https://finviz.com/groups', viewport: desktop },
  { id: 'finviz-map', title: 'S&P 500 히트맵', category: '미국증시', url: 'https://finviz.com/map.ashx', viewport: desktop },
  { id: 'cnn-fear-greed', title: 'CNN Fear & Greed Index', category: '시장 폭·심리', url: 'https://edition.cnn.com/markets/fear-and-greed', viewport: desktop },
  { id: 'nya200r', title: '미국 마켓브레스 NYA200R', category: '시장 폭·심리', url: 'https://stockcharts.com/freecharts/symbolsummary.html?sym=%24NYA200R', viewport: desktop },
].map(site => ({ screenshot: `/captures/${site.id}.png`, captureType: 'fullPage', selector: null, ...site }))

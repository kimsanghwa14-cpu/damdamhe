// Python OrderedDict 원본의 순서, 설명, priority를 그대로 유지합니다.
// 웹페이지와 Actions에서 이 파일만 읽습니다. 1 = CORE, 2 = FULL 추가.
export const DOMAINS = ['charts2.finviz.com', 'finviz.com']
export function chartUrl(ticker, domain = DOMAINS[0]) {
  return `https://${domain}/chart.ashx?t=${encodeURIComponent(ticker)}&ty=c&ta=1&p=d&s=l`
}
export const groups = [
  ['MARKET', [
    ['SPY', 'S&P 500', 1], ['QQQ', 'Nasdaq 100', 1], ['IWM', 'US Small Caps', 1], ['EWY', 'Korea', 1], ['FXI', 'China Large Cap', 2],
  ]],
  ['STYLE / MACRO', [
    ['SPMO', 'US Momentum', 1], ['VUG', 'US Large Growth', 2], ['VTV', 'US Large Value', 2], ['USDU', 'US Dollar', 1], ['XLE', 'Energy', 2], ['GDX', 'Gold Miners', 2],
  ]],
  ['KEY SECTORS', [
    ['SOXX', 'Semiconductors', 1], ['XLK', 'Technology', 1], ['XLI', 'Industrials', 2], ['ITA', 'Aerospace & Defense', 1], ['XBI', 'Biotech', 1], ['LIT', 'Lithium & Battery', 2], ['URA', 'Uranium', 1],
  ]],
  ['SEMICONDUCTOR / AI HW', [
    ['NVDA', 'GPU / AI', 1], ['AVGO', 'AI ASIC / Networking', 1], ['AMD', 'Semiconductor', 2], ['TSM', 'Foundry', 1], ['MU', 'Memory / HBM', 1], ['ASML', 'EUV Equipment', 1], ['AMAT', 'Semiconductor Equipment', 2], ['LRCX', 'Etch Equipment', 2], ['KLAC', 'Inspection Equipment', 2],
  ]],
  ['AI INFRA / POWER', [
    ['VRT', 'Data Center Cooling', 1], ['ANET', 'Data Center Networking', 1], ['ETN', 'Power Management', 1], ['GEV', 'Power Equipment', 2], ['PWR', 'Power Infrastructure', 2],
  ]],
  ['NUCLEAR / ENERGY', [
    ['CEG', 'Nuclear Power', 1], ['CCJ', 'Uranium', 2], ['OKLO', 'Small Nuclear Reactor', 2],
  ]],
  ['BIO PHARMA PEERS', [
    ['LLY', 'Obesity / Pharma', 1], ['NVO', 'Obesity / Pharma', 2],
  ]],
]
export const sections = groups.map(([section]) => section)
export const WATCHLIST = groups.flatMap(([section, items]) => items.map(([ticker, title, priority]) => ({ ticker, title, priority, section })))
export function selectWatchlist(mode) {
  return WATCHLIST.filter(item => mode === 'full' || item.priority === 1)
}

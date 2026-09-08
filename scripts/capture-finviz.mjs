import { mkdir, readFile, writeFile, rename, unlink, appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { DOMAINS, WATCHLIST, selectWatchlist, chartUrl } from '../src/data/watchlist.js'

const directory = resolve('public/finviz')
await mkdir(directory, { recursive: true })
const manifestPath = resolve(directory, 'manifest.json')
let previous = {}
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')) }
catch (error) { if (error.code !== 'ENOENT') throw error }
const startedAt = new Date().toISOString()
const manifest = { ...previous, startedAt, tickers: {}, sheets: { ...previous.sheets } }
const results = []
for (const item of WATCHLIST) {
  const { ticker } = item
  if (!/^[A-Z0-9.-]+$/.test(ticker)) throw new Error(`Invalid ticker: ${ticker}`)
  const temporary = resolve(directory, `${ticker}.tmp.png`)
  const attempts = []
  let success = false
  for (const domain of DOMAINS) {
    const result = { ticker, url: chartUrl(ticker, domain), httpStatus: null, finalUrl: null, status: 'failed', reason: null }
    try {
      const response = await fetch(result.url, { signal: AbortSignal.timeout(20000) })
      result.httpStatus = response.status
      result.finalUrl = response.url
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('Response is not an image')
      const bytes = Buffer.from(await response.arrayBuffer())
      const metadata = await sharp(bytes).metadata()
      if (!metadata.width || !metadata.height || metadata.width < 200 || metadata.height < 100) throw new Error('Invalid or incomplete chart image')
      // Lossless PNG encoding only: no chart drawing, resizing, or data reconstruction.
      await sharp(bytes).png().toFile(temporary)
      await rename(temporary, resolve(directory, `${ticker}.png`))
      const capturedAt = new Date().toISOString()
      manifest.tickers[ticker] = { status: 'ok', capturedAt, error: null, width: metadata.width, height: metadata.height }
      manifest.lastUpdatedAt = capturedAt
      result.status = 'ok'; success = true
    } catch (error) {
      result.reason = error.message.split('\n')[0]
    } finally {
      attempts.push(result)
      console.log(JSON.stringify(result))
      await unlink(temporary).catch(() => {})
    }
    // Do not try another host to get around an explicit access denial.
    if (success || result.httpStatus === 403 || result.httpStatus === 429) break
  }
  if (!success) manifest.tickers[ticker] = { ...previous.tickers?.[ticker], status: 'failed', error: attempts.at(-1)?.reason || 'No download attempted' }
  results.push({ ticker, ...manifest.tickers[ticker], attempts })
  console.log(`[${success ? 'OK' : 'FAIL'}] FINVIZ ${ticker}${success ? ' saved' : ` - ${manifest.tickers[ticker].error}`}`)
  await new Promise(resolve => setTimeout(resolve, 500))
}

const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(startedAt))
for (const mode of ['core', 'full']) {
  const temporary = resolve(directory, `market_scan_${date}_${mode}.tmp.png`)
  try {
    const items = selectWatchlist(mode)
    // Never label old or partially missing charts as today's complete scan.
    if (!items.length || items.some(item => manifest.tickers[item.ticker]?.status !== 'ok')) throw new Error('Some charts failed; previous complete scan retained')
    let top = 0
    let width = 0
    const layers = []
    for (const item of items) {
      const input = await readFile(resolve(directory, `${item.ticker}.png`))
      const metadata = await sharp(input).metadata()
      layers.push({ input, left: 0, top })
      top += metadata.height
      width = Math.max(width, metadata.width)
    }
    await sharp({ create: { width, height: top, channels: 3, background: '#ffffff' } }).composite(layers).png().toFile(temporary)
    const filename = `market_scan_${date}_${mode}.png`
    await rename(temporary, resolve(directory, filename))
    manifest.sheets[mode] = { status: 'ok', capturedAt: new Date().toISOString(), screenshot: `/finviz/${filename}`, date, tickers: items.map(item => item.ticker), error: null }
    console.log(`[OK] ${filename} saved`)
  } catch (error) {
    manifest.sheets[mode] = { ...previous.sheets?.[mode], status: 'failed', error: error.message.split('\n')[0] }
    console.error(`[FAIL] ${mode} sheet - ${manifest.sheets[mode].error}`)
  } finally { await unlink(temporary).catch(() => {}) }
}
manifest.completedAt = new Date().toISOString()
await writeFile(manifestPath + '.tmp', JSON.stringify(manifest, null, 2) + '\n')
await rename(manifestPath + '.tmp', manifestPath)
await mkdir('finviz-results', { recursive: true })
await writeFile('finviz-results/results.json', JSON.stringify({ startedAt, completedAt: manifest.completedAt, results, sheets: manifest.sheets }, null, 2) + '\n')
const escape = text => String(text ?? 'unobserved').replaceAll('|', '&#124;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', ' ')
const summary = ['# Finviz scanner', '', '| Ticker | Result | HTTP | Reason |', '|---|---|---|---|', ...results.map(result => `| ${escape(result.ticker)} | ${result.status} | ${escape(result.attempts.at(-1)?.httpStatus)} | ${escape(result.error || '—')} |`), '', `CORE sheet: ${manifest.sheets.core.status}; FULL sheet: ${manifest.sheets.full.status}`, ''].join('\n')
await writeFile('finviz-results/summary.md', summary)
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary)
console.log(`FINVIZ complete: ${results.filter(item => item.status === 'ok').length}/${WATCHLIST.length} charts saved`)

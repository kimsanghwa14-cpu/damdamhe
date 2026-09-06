import { chromium } from 'playwright'
import { mkdir, readFile, writeFile, rename, unlink, appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { sites } from '../src/data/sites.js'

const directory = resolve('public/captures')
await mkdir(directory, { recursive: true })
const manifestPath = resolve(directory, 'manifest.json')
let previous = {}
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')) }
catch (error) { if (error.code !== 'ENOENT') throw error }
const manifest = { ...previous, lastRunAt: new Date().toISOString(), sites: {} }
const results = []
let browser
let launchError
try { browser = await chromium.launch() } catch (error) { launchError = error }
for (const site of sites) {
  const prior = previous.sites?.[site.id] || {}
  const diagnostic = { id: site.id, title: site.title, requestedUrl: site.url, httpStatus: null, finalUrl: null, pageTitle: null, bodyTextLength: null, bodyHtmlLength: null, status: 'failed', failureReason: null, diagnosticError: null }
  let page
  let context
  let temporary
  try {
    if (launchError) throw launchError
    const destination = resolve('public', site.screenshot.replace(/^\//, ''))
    if (!destination.startsWith(directory + '/')) throw new Error('Screenshot path must be inside public/captures')
    temporary = destination + '.tmp.png'
    context = await browser.newContext({ viewport: site.viewport, deviceScaleFactor: 1 })
    page = await context.newPage()
    // Preserve main-document HTTP status even if navigation later times out.
    page.on('response', response => {
      if (response.request().isNavigationRequest() && response.frame() === page.mainFrame()) {
        diagnostic.httpStatus = response.status()
      }
    })
    page.setDefaultTimeout(20000)
    const response = await page.goto(site.url, { waitUntil: 'load', timeout: 60000 })
    diagnostic.httpStatus = response?.status() ?? diagnostic.httpStatus
    if (!response || !response.ok()) throw new Error(`HTTP ${response?.status() ?? 'no response'}`)
    await page.waitForTimeout(6000)
    const body = await page.locator('body').innerText()
    if (body.trim().length < 80) throw new Error('Empty or incomplete page')
    if (/verify you are human|checking your browser|access denied|just a moment|unusual traffic|enable javascript and cookies|robot check|captcha/i.test((await page.title()) + '\n' + body.slice(0, 5000))) {
      throw new Error('Access challenge or bot protection detected; no bypass attempted')
    }
    if (site.captureType === 'element') {
      if (!site.selector) throw new Error('Verified selector required for element capture')
      await page.locator(site.selector).screenshot({ path: temporary, timeout: 30000 })
    } else if (['fullPage', 'viewport'].includes(site.captureType)) {
      await page.screenshot({ path: temporary, fullPage: site.captureType === 'fullPage', timeout: 30000 })
    } else throw new Error(`Unknown captureType: ${site.captureType}`)
    await rename(temporary, destination)
    manifest.sites[site.id] = { capturedAt: new Date().toISOString(), status: 'ok', error: null }
    diagnostic.status = 'ok'
  } catch (error) {
    const reason = error.message.match(/error while loading shared libraries:[^\n]+/)?.[0] || error.message.split('\n')[0]
    manifest.sites[site.id] = { ...prior, status: 'failed', error: reason }
    diagnostic.failureReason = reason
  } finally {
    // Collect diagnostics on both success and failure, before closing the page.
    if (page) {
      diagnostic.finalUrl = page.url()
      try {
        const details = await page.locator('html').evaluate(element => ({
          pageTitle: element.ownerDocument.title,
          bodyTextLength: element.ownerDocument.body?.innerText.length ?? null,
          bodyHtmlLength: element.ownerDocument.body?.innerHTML.length ?? null,
        }), undefined, { timeout: 5000 })
        Object.assign(diagnostic, details)
      } catch (error) {
        diagnostic.diagnosticError = error.message.split('\n')[0]
      }
    } else diagnostic.diagnosticError = 'Browser/page unavailable; HTTP and DOM not observed'
    results.push(diagnostic)
    if (process.env.GITHUB_ACTIONS) console.log(`::group::${site.title}`)
    console.log(JSON.stringify(diagnostic, null, 2))
    console.log(diagnostic.status === 'ok' ? `[OK] ${site.title} screenshot saved` : `[FAIL] ${site.title} - ${diagnostic.failureReason}`)
    if (process.env.GITHUB_ACTIONS) console.log('::endgroup::')
    if (temporary) await unlink(temporary).catch(() => {})
    if (context) await context.close().catch(() => {})
  }
}
if (browser) await browser.close().catch(error => console.error(`Browser cleanup: ${error.message.split('\n')[0]}`))
manifest.completedAt = new Date().toISOString()
if (sites.every(site => manifest.sites[site.id].status === 'ok')) manifest.lastSuccessfulRunAt = manifest.completedAt
await writeFile(manifestPath + '.tmp', JSON.stringify(manifest, null, 2) + '\n')
await rename(manifestPath + '.tmp', manifestPath)
const success = Object.values(manifest.sites).filter(site => site.status === 'ok').length
console.log(`Capture complete: ${success}/${sites.length} succeeded, ${sites.length - success} failed`)

// Separate run diagnostics from the dashboard's last-good-image manifest.
const reportDirectory = resolve('capture-results')
await mkdir(reportDirectory, { recursive: true })
await writeFile(resolve(reportDirectory, 'results.json'), JSON.stringify({ startedAt: manifest.lastRunAt, completedAt: manifest.completedAt, success, total: sites.length, results }, null, 2) + '\n')
const cell = value => String(value ?? '미확인').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('|', '&#124;').replaceAll('\n', ' ')
const summary = [
  '# Website capture results',
  '',
  `${success}/${sites.length} succeeded. HTTP/DOM values marked 미확인 were not observed.`,
  'Body length: document.body.innerText / innerHTML character counts.',
  '',
  '| Site | HTTP | Final URL | Page title | Body text / HTML length | Result | Failure reason | Diagnostic error |',
  '|---|---|---|---|---|---|---|---|',
  ...results.map(result => `| ${[result.title, result.httpStatus, result.finalUrl, result.pageTitle, `${result.bodyTextLength ?? '미확인'} / ${result.bodyHtmlLength ?? '미확인'}`, result.status, result.failureReason ?? '—', result.diagnosticError ?? '—'].map(cell).join(' | ')} |`),
  '',
].join('\n')
await writeFile(resolve(reportDirectory, 'summary.md'), summary)
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary)

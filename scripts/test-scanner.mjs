/* global document, getComputedStyle, innerWidth */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { sections, WATCHLIST, selectWatchlist } from '../src/data/watchlist.js'
assert.equal(WATCHLIST.length,37)
assert.equal(selectWatchlist('core').length,21)
assert.equal(new Set(WATCHLIST.map(item=>item.ticker)).size,37)
const browser=await chromium.launch()
try {
 for(const [name,width,height] of [['iPhone',390,844],['Android',412,915]]) {
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true})
  const page=await context.newPage()
  const requests=[],errors=[]
  page.on('request',r=>{if(new URL(r.url()).hostname.endsWith('finviz.com'))requests.push(r.url())})
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${process.env.TEST_BASE_URL || 'http://127.0.0.1:5174'}/scanner`)
  await page.locator('.scanner-chart').first().waitFor()
  assert.equal(await page.locator('.scanner-chart').count(),21)
  assert.deepEqual(await page.locator('.scanner-section>h2').allTextContents(),sections)
  assert.equal(await page.locator('.scanner-grid').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1)
  await page.getByRole('button',{name:'FULL',exact:true}).tap()
  assert.equal(await page.locator('.scanner-chart').count(),37)
  await page.getByRole('button',{name:'CORE',exact:true}).tap()
  await page.waitForTimeout(500)
  const charts=page.locator('.scanner-image')
  if(await charts.count()) {
   await charts.first().tap()
   await page.locator('.capture-original').waitFor({state:'visible'})
   assert.equal(await page.locator('.mobile-navigation').isVisible(),false)
   assert.equal(await page.locator('.capture-controls').count(),0)
   await page.touchscreen.tap(width/2,150)
   await page.getByRole('button',{name:'위치 저장',exact:true}).tap()
   assert.ok(await page.evaluate(()=>localStorage.getItem('damdamhi:capture-position:v1:finviz:SPY')))
   await page.getByRole('button',{name:'다음',exact:true}).tap()
   await page.locator('.capture-original[src*="QQQ.png"]').waitFor({state:'visible'})
   assert.ok(await page.evaluate(()=>localStorage.getItem('damdamhi:capture-position:v1:finviz:QQQ')))
   await page.keyboard.press('Escape')
   const sheet=page.getByRole('button',{name:'한 장 이미지',exact:true})
   if(await sheet.isEnabled()) { await sheet.tap();await page.locator('.capture-original[src*="market_scan_"]').waitFor({state:'visible'});await page.keyboard.press('Escape');console.log(`PASS ${name}: real daily sheet opens`) }
   console.log(`PASS ${name}: real ticker charts, fullscreen, hidden nav, per-ticker storage, next ticker`)
  } else console.log(`UNVERIFIED ${name}: Finviz images not available yet; no chart fixtures substituted`)
  await page.reload();await page.locator('.scanner-chart').first().waitFor()
  await page.locator('.mobile-navigation').getByRole('link',{name:'시장 캡처',exact:true}).tap()
  await page.locator('.capture-grid').first().waitFor()
  await page.locator('.mobile-navigation').getByRole('link',{name:'미국시장 스캐너',exact:true}).tap()
  await page.locator('.scanner-chart').first().waitFor()
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  assert.deepEqual(requests,[]);assert.deepEqual(errors,[])
  console.log(`PASS ${name}: 21/37 CORE/FULL, section order, bottom navigation, reload, no Finviz browser requests or JS errors`)
  await context.close()
 }
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 await page.goto(`${process.env.TEST_BASE_URL || 'http://127.0.0.1:5174'}/scanner`)
 assert.equal(await page.locator('.scanner-grid').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2)
 console.log('PASS desktop two-column scanner')
} finally {await browser.close()}

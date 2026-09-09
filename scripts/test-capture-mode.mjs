/* global document, getComputedStyle */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5174'
const browser = await chromium.launch()
try {
  for (const [name, width, height] of [['iPhone', 390, 844], ['Android', 412, 915]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const cdp = await context.newCDPSession(page)
    const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([id,x,y]) => ({id,x,y})) })
    const stored = id => page.evaluate(id => JSON.parse(localStorage.getItem(`damdamhi:capture-position:v1:${id}`)), id)
    const open = async id => {
      await page.locator(`.image-button:has(img[src*="/${id}.png"])`).tap()
      await page.locator('.capture-original').waitFor({ state: 'visible' })
      await page.waitForFunction(() => document.querySelector('.capture-original')?.naturalWidth > 0)
    }
    const tap = async () => { await page.touchscreen.tap(width / 2, 150); await page.locator('.capture-controls').waitFor() }
    const swipe = async direction => {
      const x = direction < 0 ? width - 45 : 45
      await touch('touchStart', [[1,x,300]])
      await touch('touchMove', [[1,x + direction * 120,302]])
      await touch('touchEnd', [])
    }
    await page.goto(base)
    await page.locator('.image-button').first().waitFor()
    assert.equal(await page.locator('.capture-grid').evaluateAll(elements => elements.every(el => getComputedStyle(el).gridTemplateColumns.split(' ').length === 1)),true)
    assert.ok(await page.locator('.image-button').first().evaluate(el => el.clientHeight >= 560))
    await open('kospi')
    const rect = await page.locator('.capture-mode').boundingBox()
    assert.equal(Math.round(rect.width),width); assert.equal(Math.round(rect.height),height)
    assert.equal(await page.locator('.capture-controls').count(),0)
    assert.equal(await page.evaluate(() => document.body.style.position),'fixed')
    const first = await stored('kospi')
    // Real browser touch input: two-finger pinch about the midpoint.
    await touch('touchStart', [[1,100,250],[2,200,350]])
    await touch('touchMove', [[1,65,215],[2,235,385]])
    await touch('touchEnd', [])
    const zoomed = await stored('kospi')
    assert.ok(zoomed.scale > first.scale * 1.4)
    await touch('touchStart', [[1,160,420]])
    await page.waitForTimeout(400)
    await touch('touchMove', [[1,195,320]])
    await touch('touchEnd', [])
    const moved = await stored('kospi')
    assert.ok(moved.translateY < zoomed.translateY - 70)
    await tap()
    await page.getByRole('button',{name:'위치 저장',exact:true}).tap()
    assert.deepEqual(await stored('kospi'),moved)
    await page.waitForTimeout(2200)
    assert.equal(await page.locator('.capture-controls').count(),0)
    await page.screenshot({ path: `/tmp/capture-mode-${name}.png` })
    await swipe(-1)
    await page.locator('.capture-original[src*="/kosdaq.png"]').waitFor({state:'visible'})
    const kosdaq = await stored('kosdaq')
    assert.ok(kosdaq.scale > 0)
    assert.equal(kosdaq.translateY,0)
    await swipe(1)
    await page.locator('.capture-original[src*="/kospi.png"]').waitFor({state:'visible'})
    assert.deepEqual(await stored('kospi'),moved)
    const restoredTransform = await page.locator('.capture-original').evaluate(el => getComputedStyle(el).transform)
    assert.notEqual(restoredTransform,'none')
    await tap(); await page.getByRole('button',{name:'닫기',exact:true}).tap()
    assert.equal(await page.locator('.capture-mode').count(),0)
    assert.notEqual(await page.evaluate(() => document.body.style.position),'fixed')
    await page.reload(); await page.locator('.image-button').first().waitFor(); await open('kospi')
    assert.deepEqual(await stored('kospi'),moved)
    assert.equal(await page.locator('.capture-original').evaluate(el => getComputedStyle(el).transform),restoredTransform)
    assert.deepEqual(await stored('kosdaq'),kosdaq)
    await tap(); await page.getByRole('button',{name:'초기화',exact:true}).tap()
    assert.deepEqual(await stored('kospi'),first)
    await page.getByRole('button',{name:'다음',exact:true}).tap()
    await page.locator('.capture-original[src*="/kosdaq.png"]').waitFor({state:'visible'})
    assert.equal(await page.locator('.capture-controls').count(),0)
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('.capture-mode').count(),0)
    assert.deepEqual(errors,[])
    console.log(`PASS ${name} ${width}x${height}: portrait, native touch pinch/drag, save/restore, both swipes, controls timeout, reload persistence, independent sites, reset, body lock, close`)
    await context.close()
  }
  const page = await browser.newPage()
  await page.goto(base)
  await page.locator('.image-button').first().waitFor()
  for (const [width,columns] of [[768,1],[769,2],[1440,3]]) {
    await page.setViewportSize({width,height:1000})
    assert.equal(await page.locator('.capture-grid').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),columns)
  }
  await page.locator('.image-button').first().click()
  await page.locator('.modal-toolbar').waitFor()
  assert.equal(await page.locator('.capture-mode').count(),0)
  console.log('PASS 768px breakpoint and unchanged desktop modal')
} finally { await browser.close() }

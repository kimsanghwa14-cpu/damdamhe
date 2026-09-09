/* global document, innerWidth, scrollTo */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser = await chromium.launch()
try {
 for (const width of [1440, 390]) {
 const page = await browser.newPage({viewport:{width,height:1000}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5174')
 await page.locator('.image-button img').first().waitFor()
 assert.equal(await page.locator('h1').innerText(),'오늘의 시장을 한눈에')
 assert.equal(await page.locator('.card').count(),9)
 assert.equal(await page.locator('.market-section').count(),3)
 assert.ok(!await page.locator('header').innerText().then(t=>t.includes('담담히')))
 for (const category of ['국내증시','미국증시','시장 폭·심리']) {
 await page.getByRole('navigation',{name:'카테고리 필터'}).getByRole('button',{name:new RegExp(`^${category}`)}).click()
 assert.equal(await page.locator('.card').count(),3)
 }
 await page.getByRole('navigation',{name:'카테고리 필터'}).getByRole('button',{name:/^전체/}).click()
 for (const preview of await page.locator('.image-button img').all()) {
   await preview.scrollIntoViewIfNeeded()
   await preview.evaluate(img => img.decode())
 }
 if (process.env.EXPECT_ALL_CAPTURES === '1') assert.equal(await page.locator('.image-button img').count(),9)
 await page.locator('.card').last().scrollIntoViewIfNeeded()
 await page.waitForTimeout(1000)
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 await page.evaluate(()=>scrollTo(0,0))
 await page.screenshot({path:`/tmp/dashboard-${width}.png`,fullPage:true})
 assert.deepEqual(errors,[])
 console.log(`PASS dashboard ${width}px: categories, navigation, no overflow or runtime errors`)
 await page.close()
 }
} finally {await browser.close()}

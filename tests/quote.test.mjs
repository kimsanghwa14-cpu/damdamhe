import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/quote.js'
function response() { return { code: null, headers: {}, setHeader(k,v) { this.headers[k]=v }, status(code) { this.code=code; return this }, json(data) { this.data=data; return this } } }
test('invalid requests do not call the provider', async () => {
 const original = globalThis.fetch
 globalThis.fetch = () => { throw new Error('Unexpected provider call') }
 try {
  for (const [method,symbol,expected] of [['POST','IBM',405],['GET','',400],['GET','../secrets',400],['GET',['IBM'],400]]) {
   const res=response(); await handler({ method,query:{symbol} },res); assert.equal(res.code,expected)
  }
 } finally { globalThis.fetch=original }
})
test('missing configuration and provider failures never return invented quotes', async () => {
 const key=process.env.ALPHA_VANTAGE_API_KEY; const original=globalThis.fetch
 try {
  delete process.env.ALPHA_VANTAGE_API_KEY
  let res=response(); await handler({method:'GET',query:{symbol:'IBM'}},res);assert.equal(res.code,503)
  process.env.ALPHA_VANTAGE_API_KEY='test-secret-not-a-real-key'
  for (const [data,expected] of [[{Note:'limit'},429],[{Information:'plan'},429],[{'Global Quote':{}},404],[{'Error Message':'invalid'},404]]) {
   globalThis.fetch=async () => ({ok:true,json:async () => data})
   res=response();await handler({method:'GET',query:{symbol:'IBM'}},res);assert.equal(res.code,expected);assert.ok(res.data.error);assert.ok(!JSON.stringify(res.data).includes('test-secret'))
  }
  globalThis.fetch=async () => {throw new Error('secret URL')}
  res=response();await handler({method:'GET',query:{symbol:'IBM'}},res);assert.equal(res.code,502);assert.ok(!JSON.stringify(res.data).includes('secret URL'))
 } finally { globalThis.fetch=original;if(key === undefined) delete process.env.ALPHA_VANTAGE_API_KEY;else process.env.ALPHA_VANTAGE_API_KEY=key }
})

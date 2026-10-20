import type { CheckResult } from '@/lib/api/lessons'

/**
 * Browser lessons. The learner's page runs for real, in a sandboxed iframe (scripts allowed, no same-origin access,
 * no cookies, no top navigation), against the real Storefront API. The lesson's tests run inside that same page and
 * report back with postMessage. Only the learner's browser can load their page, so the verdict is the browser's;
 * the server still awards XP only through the normal complete endpoint.
 */

export interface RunnerConfig { apiBase: string; apiKey: string }

const safeJson = (v: unknown): string => JSON.stringify(v).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '')

/** Defines API_BASE / API_KEY for the learner's code and records every fetch so tests can inspect requests. */
export function preludeScript(cfg: RunnerConfig): string {
  return `<script>
window.API_BASE=${safeJson(cfg.apiBase)};window.API_KEY=${safeJson(cfg.apiKey)};
window.__calls=[];window.__errors=[];window.__nativeFetch=window.fetch.bind(window);
(function(){var f=window.fetch;window.fetch=function(input,init){
  var url=String(input&&input.url?input.url:input);var method=String((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
  var h={};try{new Headers((init&&init.headers)||(input&&input.headers)||{}).forEach(function(v,k){h[k]=v})}catch(e){}
  var body=init&&typeof init.body==='string'?init.body:null;
  var entry={url:url,method:method,headers:h,body:body,status:null,error:null,at:Date.now()};window.__calls.push(entry);
  return f.apply(this,arguments).then(function(r){
    entry.status=r.status;
    if(url.indexOf(window.API_BASE)===0){
      r.clone().text().then(function(text){
        var payload=text;
        try{payload=JSON.parse(text)}catch(e){}
        function redact(value){
          if(Array.isArray(value))return value.map(redact);
          if(value&&typeof value==='object'){
            var out={};Object.keys(value).forEach(function(k){out[k]=/token|secret|password|authorization|api.?key/i.test(k)?'[REDACTED]':redact(value[k])});return out
          }
          return value
        }
        var label='[API '+r.status+'] '+method+' '+url;
        if(r.ok)console.info(label,redact(payload));else console.error(label,redact(payload));
      }).catch(function(e){console.warn('[API '+r.status+'] '+method+' '+url+' response body could not be read',e)});
    }
    return r
  },function(e){entry.error=String(e);if(url.indexOf(window.API_BASE)===0)console.error('[API] '+method+' '+url+' request failed',e);throw e})}})();
window.addEventListener('error',function(e){window.__errors.push(String(e.message))});
window.addEventListener('unhandledrejection',function(e){window.__errors.push(String(e.reason&&e.reason.message||e.reason))});
</script>`
}

/** The in-page test framework. `test(name, fn)` registers; the tests run once the page has settled. */
function harnessScript(testCode: string): string {
  return `<script>
(function(){
var tests=[];
window.test=function(name,fn,ms){tests.push({name:name,fn:fn,ms:ms||10000})};
window.resetCalls=function(){window.__calls.length=0};
window.sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
window.$=function(s){return document.querySelector(s)};
window.$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
window.text=function(el){return ((el&&el.textContent)||'').replace(/\\s+/g,' ').trim()};
window.expect=function(c,m){if(!c)throw new Error(m||'Expectation failed')};
window.waitFor=function(fn,msg,timeout){return new Promise(function(res,rej){var t=Date.now(),last=null;(function tick(){
  Promise.resolve().then(fn).then(function(v){if(v)return res(v);next()},function(e){last=e;next()});
  function next(){if(Date.now()-t>(timeout||4000))rej(new Error((msg||'Timed out waiting for the page to update')+(last?' ('+last.message+')':'')));else setTimeout(tick,50)}})()})};
window.type=function(el,v){if(!el)throw new Error('Could not find the input to type into');el.focus();el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
window.click=function(el){if(!el)throw new Error('Could not find the element to click');el.click()};
window.submit=function(form){if(!form)throw new Error('Could not find the form');var ev=new Event('submit',{cancelable:true,bubbles:true});form.dispatchEvent(ev);if(!ev.defaultPrevented)throw new Error('The form was submitted the old-fashioned way, which reloads the page. Call event.preventDefault() in your submit handler.')};
window.calls=function(frag){return window.__calls.filter(function(c){return !frag||c.url.indexOf(frag)>=0})};
window.apiCall=function(path,opts){opts=opts||{};var h=Object.assign({'X-Storefront-Key':window.API_KEY},opts.headers||{});
  if(opts.token)h.Authorization='Bearer '+opts.token;
  if(opts.body!==undefined&&!h['Content-Type'])h['Content-Type']='application/json';
  return window.__nativeFetch(window.API_BASE+path,{method:opts.method||'GET',headers:h,body:opts.body!==undefined?JSON.stringify(opts.body):undefined}).then(function(r){return r.text().then(function(t){var j=null;try{j=JSON.parse(t)}catch(e){}return{status:r.status,json:j,headers:r.headers}})})};
${testCode.replace(/<\/script/gi, '<\\/script')}
function done(results){parent.postMessage({source:'dc-runner',results:results,errors:window.__errors.slice(0,5)},'*')}
function run(){var out=[];var chain=Promise.resolve();
  tests.forEach(function(t){chain=chain.then(function(){return Promise.race([Promise.resolve().then(t.fn),new Promise(function(_,rej){setTimeout(function(){rej(new Error('Test timed out after '+Math.round(t.ms/1000)+' seconds'))},t.ms)})]).then(function(){out.push({name:t.name,passed:true})},function(e){out.push({name:t.name,passed:false,reason:String(e&&e.message||e)})})})});
  chain.then(function(){done(out)})}
function settle(){var t0=Date.now(),quietSince=Date.now();return new Promise(function(res){(function poll(){
  var pending=window.__calls.filter(function(c){return c.status===null&&!c.error}).length;
  if(pending>0)quietSince=Date.now();
  if((Date.now()-quietSince>=300)||Date.now()-t0>8000)res();else setTimeout(poll,50)})()})}
function start(){setTimeout(function(){settle().then(run)},100)}
if(document.readyState==='complete')start();else window.addEventListener('load',start);
})();
</script>`
}

/** The page as the learner wrote it, with the prelude first and (optionally) the tests last. */
export function buildAppDocument(html: string, cfg: RunnerConfig, testCode?: string): string {
  const prelude = preludeScript(cfg)
  let doc = html
  if (/<head[^>]*>/i.test(doc)) doc = doc.replace(/<head[^>]*>/i, (m) => `${m}${prelude}`)
  else if (/<html[^>]*>/i.test(doc)) doc = doc.replace(/<html[^>]*>/i, (m) => `${m}<head>${prelude}</head>`)
  else doc = `<!DOCTYPE html><html><head><meta charset="utf-8">${prelude}</head><body>${doc}</body></html>`
  return testCode ? `${doc}${harnessScript(testCode)}` : doc
}

/** The visible preview: scripts and forms work, but the page has an opaque origin (no cookies, storage or DevCraft access) and cannot navigate the window. */
export const APP_SANDBOX = 'allow-scripts allow-forms'
/** The hidden test frame: the tests submit forms by dispatching events, so native form submission stays blocked. */
export const TEST_SANDBOX = 'allow-scripts'

/** Loads the page in a hidden iframe, runs the tests in it and resolves with the verdict. */
export function runBrowserTests(html: string, testCode: string, cfg: RunnerConfig, timeoutMs = 60_000): Promise<CheckResult> {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe')
    frame.setAttribute('sandbox', TEST_SANDBOX)
    frame.setAttribute('aria-hidden', 'true')
    frame.setAttribute('data-testid', 'browser-test-frame')
    frame.style.cssText = 'position:fixed;left:-9999px;top:0;width:1024px;height:768px;border:0;visibility:hidden'
    let finished = false
    const finish = (result: CheckResult): void => {
      if (finished) return
      finished = true
      window.removeEventListener('message', onMessage)
      clearTimeout(timer)
      frame.remove()
      resolve(result)
    }
    const onMessage = (e: MessageEvent): void => {
      if (e.source !== frame.contentWindow || !e.data || e.data.source !== 'dc-runner') return
      const results = (e.data.results as Array<{ name: string; passed: boolean; reason?: string }>) ?? []
      const errors = (e.data.errors as string[]) ?? []
      const passed = results.filter((r) => r.passed).length
      if (errors.length && results.length) results[0] = { ...results[0]!, reason: results[0]!.reason ?? undefined }
      finish({ passed, failed: results.length - passed, total: results.length, allPassed: results.length > 0 && passed === results.length, results })
    }
    const timer = setTimeout(() => finish({
      passed: 0, failed: 1, total: 1, allPassed: false,
      results: [{ name: 'The page responds', passed: false, reason: 'The page did not finish loading in time. Check for an infinite loop or a script error.' }],
    }), timeoutMs)
    window.addEventListener('message', onMessage)
    frame.srcdoc = buildAppDocument(html, cfg, testCode)
    document.body.appendChild(frame)
  })
}

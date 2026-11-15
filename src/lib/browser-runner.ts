import type { CheckResult } from './api/lessons'
import { parseBundle, type LabFile } from './lab-files'
import { bundleFilesMap, compileLessonFiles, recordLessonMetric, type CompileOutput } from './lesson-compiler'

/**
 * Browser lessons. The learner's page runs for real, in a sandboxed iframe (scripts allowed, no same-origin access,
 * no cookies, no top navigation), against the real Storefront API. The lesson's tests run inside that same page and
 * report back with postMessage. Only the learner's browser can load their page, so the verdict is the browser's;
 * the server still awards XP only through the normal complete endpoint.
 */

export interface RunnerConfig { apiBase: string; apiKey?: string; fixtureToken?: string }

const safeJson = (v: unknown): string => JSON.stringify(v).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '')

/** Defines API_BASE / API_KEY for the learner's code and records every fetch so tests can inspect requests. */
export function preludeScript(cfg: RunnerConfig): string {
  return `<script>
window.API_BASE=${safeJson(cfg.apiBase)};window.API_ORIGIN=${safeJson(cfg.apiBase.replace(/\/api\/v1.*$/,""))};window.API_KEY=${safeJson(cfg.apiKey ?? '')};window.LESSON_FIXTURE_TOKEN=${safeJson(cfg.fixtureToken ?? '')};
window.__calls=[];window.__errors=[];window.__nativeFetch=window.fetch.bind(window);
(function(){var f=window.fetch;window.fetch=function(input,init){
  var url=String(input&&input.url?input.url:input);var method=String((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
  var next=init?Object.assign({},init):{};var headers=new Headers((init&&init.headers)||(input&&input.headers)||{});if(window.LESSON_FIXTURE_TOKEN&&url.indexOf(window.API_BASE)===0)headers.set('X-Lesson-Fixture',window.LESSON_FIXTURE_TOKEN);next.headers=headers;
  var h={};try{headers.forEach(function(v,k){h[k]=v})}catch(e){}
  var body=init&&typeof init.body==='string'?init.body:null;
  var entry={url:url,method:method,headers:h,body:body,status:null,error:null,at:Date.now()};window.__calls.push(entry);
  return f.call(this,input,next).then(function(r){entry.status=r.status;return r},function(e){entry.error=String(e);throw e})}})();
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
window.$=function(s,r){return (r||document).querySelector(s)};
window.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
window.text=function(el){return ((el&&el.textContent)||'').replace(/\\s+/g,' ').trim()};
window.expect=function(c,m){if(!c)throw new Error(m||'Expectation failed')};
window.waitFor=function(fn,msg,timeout){return new Promise(function(res,rej){var t=Date.now(),last=null;(function tick(){
  Promise.resolve().then(fn).then(function(v){if(v)return res(v);next()},function(e){last=e;next()});
  function next(){if(Date.now()-t>(timeout||4000))rej(new Error((msg||'Timed out waiting for the page to update')+(last?' ('+last.message+')':'')));else setTimeout(tick,50)}})()})};
window.type=function(el,v){if(!el)throw new Error('Could not find the input to type into');el.focus();var d=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value');if(d&&d.set)d.set.call(el,v);else el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
window.blurEl=function(el){if(!el)throw new Error('Could not find the element to blur');el.dispatchEvent(new FocusEvent('focusout',{bubbles:true}));el.dispatchEvent(new FocusEvent('blur'))};
window.press=function(el,key){(el||document).dispatchEvent(new KeyboardEvent('keydown',{key:key,bubbles:true,cancelable:true}))};
window.focusLog=function(){var log=[];var orig=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(){log.push(this);return orig.apply(this,arguments)};log.restore=function(){HTMLElement.prototype.focus=orig};return log};
window.click=function(el){if(!el)throw new Error('Could not find the element to click');el.click()};
window.submit=function(form){if(!form)throw new Error('Could not find the form');var ev=new Event('submit',{cancelable:true,bubbles:true});form.dispatchEvent(ev);if(!ev.defaultPrevented)throw new Error('The form was submitted the old-fashioned way, which reloads the page. Call event.preventDefault() in your submit handler.')};
window.css=function(s,prop,pseudo){var el=typeof s==='string'?document.querySelector(s):s;if(!el)throw new Error('Could not find '+s);return getComputedStyle(el,pseudo||null).getPropertyValue(prop).trim()};
window.rect=function(s){var el=typeof s==='string'?document.querySelector(s):s;if(!el)throw new Error('Could not find '+s);var r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
window.setViewport=function(w){return new Promise(function(res){var id=Math.random().toString(36).slice(2);function on(e){if(e.data&&e.data.source==='dc-resized'&&e.data.id===id){removeEventListener('message',on);setTimeout(res,150)}}addEventListener('message',on);parent.postMessage({source:'dc-resize',width:w,id:id},'*');setTimeout(function(){removeEventListener('message',on);res()},1500)})};
window.inFrame=function(width,fn){var root=document.documentElement,attrs={};Array.prototype.forEach.call(root.attributes,function(a){attrs[a.name]=a.value});
  function restore(){Array.prototype.slice.call(root.attributes).forEach(function(a){if(!(a.name in attrs))root.removeAttribute(a.name)});Object.keys(attrs).forEach(function(k){root.setAttribute(k,attrs[k])});return window.setViewport(1024)}
  return window.setViewport(width).then(function(){return Promise.resolve().then(function(){return fn(document,window)})}).then(function(v){return restore().then(function(){return v})},function(e){return restore().then(function(){throw e})})};
window.consoleErrors=function(re){return (window.__console||[]).filter(function(c){return c.level==='error'&&(!re||re.test(c.text))}).map(function(c){return c.text})};
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
function start(){setTimeout(function(){Promise.resolve(window.__labReady).then(function(){return settle()}).then(run)},100)}
if(document.readyState==='complete')start();else window.addEventListener('load',start);
})();
</script>`
}

const esc = {
  style: (c: string): string => c.replace(/<\/style/gi, '<\\/style'),
  script: (c: string): string => c.replace(/<\/script/gi, '<\\/script'),
}

export const LAB_LANGUAGES = ['webapp', 'web-lab', 'css-lab', 'react-lab', 'next-lab'] as const
export type LabLanguage = (typeof LAB_LANGUAGES)[number]
export const isLabLanguage = (l: string | undefined): l is LabLanguage => !!l && (LAB_LANGUAGES as readonly string[]).includes(l)

function inject(doc: string, prelude: string): string {
  if (/<head[^>]*>/i.test(doc)) return doc.replace(/<head[^>]*>/i, (m) => `${m}${prelude}`)
  if (/<html[^>]*>/i.test(doc)) return doc.replace(/<html[^>]*>/i, (m) => `${m}<head>${prelude}</head>`)
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${prelude}</head><body>${doc}</body></html>`
}

/** HTML + CSS + JS tabs assembled into one page, the way the playground does it. */
function webDocument(files: LabFile[]): string {
  const html = files.find((f) => f.name.endsWith('.html'))?.content ?? ''
  const css = files.filter((f) => f.name.endsWith('.css')).map((f) => f.content).join('\n')
  const js = files.filter((f) => /\.js$/.test(f.name)).map((f) => f.content).join('\n')
  const style = css ? `<style data-lesson-css>${esc.style(css)}</style>` : ''
  const script = js ? `<script>${esc.script(js)}</script>` : ''
  if (/<html[\s>]|<!doctype/i.test(html)) {
    let doc = html
    if (style) doc = /<\/head>/i.test(doc) ? doc.replace(/<\/head>/i, () => `${style}</head>`) : inject(doc, style)
    if (script) doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, () => `${script}</body>`) : `${doc}${script}`
    return doc
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${style}</head><body>${html}${script}</body></html>`
}

/** The learner's HTML, CSS and JS as one standalone page (no prelude): what Publish preview uploads. */
export function assembleWebPage(code: string): string { return webDocument(parseBundle(code)) }

/** React and Next labs use the isolated DevCraft lesson runtime. The runtime is rebuilt from
 * local project dependencies and compiles learner TSX in a dedicated worker. */
function frameworkDocument(mode: 'react' | 'next', compiled: CompileOutput, start?: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank">
<style>html{font-family:system-ui,sans-serif}body{margin:0}#root{min-height:100vh}</style></head><body><div id="root"></div>
<script>window.__DEVCRAFT_LESSON=${safeJson({ mode, modules: compiled.modules, diagnostics: compiled.diagnostics, start })}</script>
<script src="${origin}/lesson-runtime/react.js"></script><script src="${origin}/lesson-runtime/runner.js"></script>
</body></html>`
}

const isFrameworkLanguage = (language: string): language is 'react-lab' | 'next-lab' => language === 'react-lab' || language === 'next-lab'

/** Compiles in the host page's persistent worker, then builds the sandboxed document. Use this for react-lab and next-lab. */
export async function compileLabDocument(language: string, code: string, cfg: RunnerConfig, testCode?: string): Promise<{ doc: string; compile: CompileOutput | null }> {
  if (!isFrameworkLanguage(language)) return { doc: buildLabDocument(language, code, cfg, testCode), compile: null }
  const compile = await compileLessonFiles(bundleFilesMap(code))
  return { doc: buildLabDocument(language, code, cfg, testCode, compile), compile }
}

/** The page as the learner wrote it, with the prelude first and (optionally) the tests last. */
export function buildLabDocument(language: string, code: string, cfg: RunnerConfig, testCode?: string, compiled?: CompileOutput): string {
  const files = parseBundle(code)
  // React and Next documents need compiled modules; without them the frame explains it is still compiling.
  const pendingCompile: CompileOutput = { modules: {}, diagnostics: [{ file: 'lesson', line: null, column: null, message: 'Compiling your files…' }], ms: 0, cached: false }
  const base = language === 'react-lab' ? frameworkDocument('react', compiled ?? pendingCompile)
    : language === 'next-lab' ? frameworkDocument('next', compiled ?? pendingCompile)
    : webDocument(files)
  const doc = inject(base, preludeScript(cfg))
  if (!testCode) return doc
  const setup = `<script>window.files=${safeJson(Object.fromEntries(files.map((f) => [f.name, f.content])))}</script>`
  return `${doc}${setup}${harnessScript(testCode)}`
}

/** Kept for older callers: a single HTML document. */
export function buildAppDocument(html: string, cfg: RunnerConfig, testCode?: string): string {
  return buildLabDocument('webapp', html, cfg, testCode)
}

/** The visible preview: scripts and forms work, but the page has an opaque origin (no cookies, storage or DevCraft access) and cannot navigate the window. */
export const APP_SANDBOX = 'allow-scripts allow-forms'
/** The hidden test frame: the tests submit forms by dispatching events, so native form submission stays blocked. */
export const TEST_SANDBOX = 'allow-scripts allow-forms'
/**
 * Where the hidden test frame sits. It must overlap the browser window and be painted: a cross-origin frame (this one
 * has an opaque origin) parked off-screen (left: -9999px) or visibility: hidden is not rendered by the browser, so
 * IntersectionObserver never reports anything inside it and lazy-loading or infinite-scroll lessons could not pass.
 * opacity: 0 is not enough either (Chrome throttles such a frame to about 20 fps and scroll steps get missed), but
 * opacity: 0.01 keeps it rendering at full speed. Click-through and behind the page, it is invisible to the learner.
 */
export const TEST_FRAME_STYLE = 'position:fixed;left:0;top:0;width:1024px;height:768px;border:0;opacity:0.01;pointer-events:none;z-index:-1'

/** Loads the page in a hidden iframe, runs the tests in it and resolves with the verdict. */
export async function runBrowserTests(language: string, code: string, testCode: string, cfg: RunnerConfig, timeoutMs = 60_000): Promise<CheckResult> {
  let compiled: CompileOutput | undefined
  if (isFrameworkLanguage(language)) {
    try { compiled = await compileLessonFiles(bundleFilesMap(code)) } catch (error) {
      const reason = error instanceof Error ? error.message : 'Your files could not be compiled.'
      return { passed: 0, failed: 1, total: 1, allPassed: false, results: [{ name: 'Your files compile', passed: false, reason }] }
    }
    if (compiled.diagnostics.length) {
      const first = compiled.diagnostics[0]!
      const where = first.line ? ` (line ${first.line})` : ''
      return { passed: 0, failed: 1, total: 1, allPassed: false, results: [{ name: 'Your files compile', passed: false, reason: `${first.file}${where}: ${first.message}` }] }
    }
  }
  const started = performance.now()
  return new Promise((resolve) => {
    const frame = document.createElement('iframe')
    frame.setAttribute('sandbox', TEST_SANDBOX)
    frame.setAttribute('aria-hidden', 'true')
    frame.setAttribute('data-testid', 'browser-test-frame')
    frame.style.cssText = TEST_FRAME_STYLE
    let finished = false
    const finish = (result: CheckResult): void => {
      if (finished) return
      finished = true
      window.removeEventListener('message', onMessage)
      clearTimeout(timer)
      recordLessonMetric('check', Math.round(performance.now() - started), result.allPassed ? 'passed' : 'failed')
      frame.remove()
      resolve(result)
    }
    const onMessage = (e: MessageEvent): void => {
      if (e.source === frame.contentWindow && e.data && e.data.source === 'dc-resize') {
        frame.style.width = `${Math.max(240, Math.min(2000, Number(e.data.width) || 1024))}px`
        frame.contentWindow?.postMessage({ source: 'dc-resized', id: e.data.id }, '*')
        return
      }
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
    frame.srcdoc = buildLabDocument(language, code, cfg, testCode, compiled)
    document.body.appendChild(frame)
  })
}

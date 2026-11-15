"""
Renders the real CurriculumTree in Chromium against real API output and checks the "coming soon" behaviour.

Usage (from the web app root, after `npm ci` and `npx next build` so the stylesheet exists):
  FIXTURES=/path/to/fixtures OUT=/path/to/screenshots python3 verification/coming-soon/verify_coming_soon.py
FIXTURES holds track-path.json, status-path.json, track-nopath.json, status-nopath.json, produced by running the real
getTrack / getBulkLessonStatus services against a database (see tests/integration/curriculum-v2.int.test.ts for the setup).
"""
import copy, glob, http.server, json, os, shutil, subprocess, sys, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
FIX = Path(os.environ.get('FIXTURES', '/tmp/fixtures'))
OUT = Path(os.environ.get('OUT', '/tmp/shots')); OUT.mkdir(parents=True, exist_ok=True)
SITE = Path(os.environ.get('SITE', '/tmp/coming-soon-site')); shutil.rmtree(SITE, ignore_errors=True); SITE.mkdir(parents=True)
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')

css = sorted(glob.glob(str(ROOT / '.next/static/css/*.css')))
assert css, 'run `npx next build` first so there is a stylesheet'
shutil.copy(css[-1], SITE / 'app.css')
subprocess.run(['npx', 'esbuild', str(HERE / 'entry.tsx'), '--bundle', '--format=iife', '--jsx=automatic',
                f'--alias:@={ROOT}/src', f'--alias:next/link={HERE}/next-link-stub.tsx',
                f'--alias:react={ROOT}/node_modules/react', f'--alias:react-dom={ROOT}/node_modules/react-dom',
                '--define:process.env.NODE_ENV="production"', '--define:process.env.NEXT_PUBLIC_API_URL="http://api.test/api/v1"',
                '--loader:.css=empty', f'--outfile={SITE}/app.js', '--log-level=warning'], cwd=ROOT, check=True)
(SITE / 'index.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script>window.process = { env: {} }</script><script src="/app.js"></script></body></html>')

class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(SITE), **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 4488), Quiet); threading.Thread(target=srv.serve_forever, daemon=True).start()

results = []
def check(name, ok, detail=''):
    results.append(ok); print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else f'  -> {detail}'))

def load(name): return json.loads((FIX / name).read_text())
def expected_titles(track):
    """Independent re-implementation of the placement rule, from the raw API data."""
    soon = track.get('comingSoon') or []
    out = [c['title'] for c in soon if c['afterModuleSlug'] is None]
    for m in track['modules']:
        out.append(m['title']); out += [c['title'] for c in soon if c['afterModuleSlug'] == m['slug']]
    return out

def open_tree(pw, track, status, shot=None, width=900, wait='h3'):
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': width, 'height': 1400}); errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.route('**/curriculum/tracks/BE', lambda r: r.fulfill(json={'success': True, 'data': track}))
    pg.route('**/progress/tracks/BE/lessons', lambda r: r.fulfill(json={'success': True, 'data': status}))
    pg.goto('http://127.0.0.1:4488/index.html'); pg.wait_for_selector(wait, timeout=10000); pg.wait_for_timeout(900)
    if shot: pg.screenshot(path=str(OUT / shot), full_page=True)
    return b, pg, errors

with sync_playwright() as pw:
    # ── A: a partially published path ─────────────────────────────────────────────
    track, status = load('track-path.json'), load('status-path.json')
    b, pg, errors = open_tree(pw, track, status, 'path-partial.png')
    titles = pg.locator('h3').all_inner_texts()
    check('cards appear in journey order with coming-soon modules placed after the module they follow', titles == expected_titles(track), f'{titles[:6]} != {expected_titles(track)[:6]}')
    soon = pg.locator('[data-testid=coming-soon-module]')
    check('every coming-soon module is shown', soon.count() == len(track['comingSoon']), f'{soon.count()} vs {len(track["comingSoon"])}')
    check('coming-soon modules are not buttons or links and cannot take focus', all(soon.nth(i).evaluate('el => el.tagName === "DIV" && !el.matches("button,a,[tabindex]") && !el.querySelector("button,a,[tabindex]")') for i in range(soon.count())))
    check('each is a labelled group announced as coming soon', all((soon.nth(i).get_attribute('aria-label') or '').endswith(', coming soon') and soon.nth(i).get_attribute('role') == 'group' for i in range(soon.count())))
    summary = pg.locator('[data-testid=path-summary]').inner_text()
    n_path = len(track['modules'])
    check('the header says how many modules are available and how many are coming', f'{n_path} modules are available now' in summary and f'{len(track["comingSoon"])} more are coming soon' in summary, summary)
    # lock chain: finished module 1, the module after it must be open even though a coming-soon module sits between them
    btn = lambda title: pg.get_by_role('button', name=title).first
    check('the module after a coming-soon module opens once the previous available module is finished', btn(track['modules'][1]['title']).is_enabled())
    check('a later module stays locked until the one before it is finished', btn(track['modules'][2]['title']).is_disabled())
    # clicking a coming-soon module does nothing
    before = pg.locator('h3').count(); soon.first.click(); pg.wait_for_timeout(300)
    check('clicking a coming-soon module changes nothing', pg.locator('h3').count() == before)
    # keyboard: tabbing never lands inside a coming-soon module
    landed = []
    for _ in range(14):
        pg.keyboard.press('Tab'); landed.append(pg.evaluate('document.activeElement && document.activeElement.closest("[data-testid=coming-soon-module]") ? "SOON" : (document.activeElement ? document.activeElement.tagName : "")'))
    check('keyboard focus never enters a coming-soon module', 'SOON' not in landed, landed)
    # expanding an available module still lists its lessons
    btn(track['modules'][0]['title']).click(); pg.wait_for_timeout(500)
    links = pg.locator('a[href^="/learn/be/"]'); check('an available module still expands to its lessons, in order', links.evaluate_all('els => els.map(e => e.getAttribute("href").split("/").pop())') == [l['slug'] for l in sorted(track['modules'][0]['lessons'], key=lambda l: l['order'])], links.count())
    check('no page errors', not errors, errors)
    pg.screenshot(path=str(OUT / 'path-partial-expanded.png'), full_page=True); b.close()

    # ── A2: a narrow phone width ──────────────────────────────────────────────────
    b, pg, errors = open_tree(pw, track, status, 'path-partial-mobile.png', width=380)
    overflow = pg.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth')
    check('no horizontal scrolling at phone width', not overflow); b.close()

    # ── B: path rolled back: nothing to show, and no coming-soon modules without a published path ─────────────
    track0, status0 = load('track-nopath.json'), load('status-nopath.json')
    b, pg, errors = open_tree(pw, track0, status0, 'rolled-back.png', wait='text=Curriculum coming soon')
    check('a rolled-back path shows the empty state, with no coming-soon modules and no summary', pg.locator('[data-testid=coming-soon-module]').count() == 0 and pg.locator('[data-testid=path-summary]').count() == 0)
    check('no page errors (rolled back)', not errors, errors); b.close()

    # ── C: an older server that knows nothing about paths ────────────────────────
    legacy = copy.deepcopy(track)
    for k in ('comingSoon', 'path'): legacy.pop(k, None)
    b, pg, errors = open_tree(pw, legacy, status)
    check('an older API response still renders its modules, with no coming-soon section', pg.locator('[data-testid=coming-soon-module]').count() == 0 and pg.locator('h3').count() == len(legacy['modules']))
    check('no page errors (older server)', not errors, errors); b.close()

srv.shutdown()
failed = results.count(False); print(f'\n{len(results) - failed} of {len(results)} checks passed'); sys.exit(1 if failed else 0)

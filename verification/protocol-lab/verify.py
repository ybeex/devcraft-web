"""Renders the real ProtocolLabPane and every diagram type in Chromium and checks they behave.
Usage (web app root, after npm ci):  LESSONS=/tmp/lessons.json python3 verification/protocol-lab/verify.py"""
import http.server, json, os, shutil, subprocess, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[2]; HERE = Path(__file__).resolve().parent
SITE = Path('/tmp/pl-site'); shutil.rmtree(SITE, ignore_errors=True); SITE.mkdir(parents=True)
OUT = Path(os.environ.get('OUT', '/tmp/pl-shots')); OUT.mkdir(parents=True, exist_ok=True)
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
data = json.loads(Path(os.environ.get('LESSONS', '/tmp/lessons.json')).read_text())
subprocess.run(['npx', 'esbuild', str(HERE / 'entry.tsx'), '--bundle', '--format=iife', '--jsx=automatic', f'--alias:@={ROOT}/src',
  '--define:process.env.NODE_ENV="production"', '--define:process.env.NEXT_PUBLIC_API_URL="http://api.test/api/v1"', '--banner:js=var process={env:{NODE_ENV:"production"}};', '--loader:.css=empty', f'--outfile={SITE}/app.js', '--log-level=warning'], cwd=ROOT, check=True)
subprocess.run(['node', str(HERE / 'build-css.mjs'), str(SITE / 'app.css')], cwd=ROOT, check=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(SITE), **k)
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 4491), Q); threading.Thread(target=srv.serve_forever, daemon=True).start()
fails = []
def check(name, ok, detail=''):
    print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else f'  -> {detail}'));
    if not ok: fails.append(name)
with sync_playwright() as p:
    b = p.chromium.launch()
    for lesson in data['lessons']:
        for scheme in ('light', 'dark'):
            pg = b.new_page(viewport={'width': 1400, 'height': 900}, color_scheme=scheme)
            errors = []; pg.on('pageerror', lambda e: errors.append(str(e)))
            (SITE / 'index.html').write_text('<!doctype html><html class="%s"><head><meta charset="utf-8"><link rel="stylesheet" href="app.css"></head><body class="bg-canvas text-ink"><div id="root"></div><script>window.LESSON=%s;window.VISUALS=%s</script><script src="app.js"></script></body></html>' % ('dark' if scheme == 'dark' else '', json.dumps(lesson), json.dumps(data['visuals'])))
            pg.goto('http://127.0.0.1:4491/index.html'); pg.wait_for_selector('[data-testid=protocol-lab-pane]')
            tag = lesson['slug'] + '/' + scheme
            check(tag + ' renders without script errors', not errors, errors)
            check(tag + ' starter shows diagnostics or no-problem note', pg.locator('[data-testid=protocol-diagnostics]').count() == 1)
            pg.click('[data-testid=protocol-send]'); pg.wait_for_selector('[data-testid=sequence-diagram]')
            pg.wait_for_timeout(4200)
            check(tag + ' diagram has arrows after sending', pg.locator('[data-testid=sequence-diagram] svg line[marker-end], [data-testid=sequence-diagram] svg rect').count() > 2)
            pg.fill('[data-testid=protocol-editor]', lesson['solutionCode']); pg.wait_for_timeout(400)
            errs = pg.locator('[data-testid=protocol-diagnostics] li.text-error').count()
            check(tag + ' solution shows no format errors', errs == 0, errs)
            pg.click('[data-testid=protocol-check]'); pg.wait_for_timeout(200)
            if scheme == 'light': pg.screenshot(path=str(OUT / (lesson['slug'] + '-' + scheme + '.png')), full_page=True)
            pg.close()
    # narrow screen
    pg = b.new_page(viewport={'width': 390, 'height': 800}); (SITE / 'index.html').write_text((SITE / 'index.html').read_text())
    pg.goto('http://127.0.0.1:4491/index.html'); pg.wait_for_selector('[data-testid=protocol-lab-pane]')
    check('mobile: no horizontal page scroll', pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), pg.evaluate('document.documentElement.scrollWidth'))
    pg.screenshot(path=str(OUT / 'mobile.png'), full_page=True)
    vis = pg.locator('[data-testid=lesson-visual], [data-testid=sequence-diagram]'); check('all %d visual types rendered' % len(data['visuals']), vis.count() >= len(data['visuals']), vis.count())
    b.close()
raise SystemExit(1 if fails else 0)

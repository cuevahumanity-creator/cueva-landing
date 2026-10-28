"""Recorre la página entera con scroll continuo y mide los tiempos de fotograma por tramos.
Uso: python rendimiento.py [ancho alto]"""
import sys, pathlib, json
from playwright.sync_api import sync_playwright
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1440, 900)
url = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': W, 'height': H}); err = []; pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(9000)   # la apertura y la precarga
    r = pg.evaluate("""() => new Promise(res => {
      const total = document.documentElement.scrollHeight - innerHeight, paso = innerHeight * 0.018, t = []; let a = performance.now();
      const zona = () => { const y = innerHeight / 2; for (const el of document.querySelectorAll('main > section')) { const q = el.getBoundingClientRect(); if (q.top <= y && q.bottom > y) return el.id || el.className; } return '?'; };
      (function f() { const n = performance.now(); t.push([n - a, zona(), CUEVA.tiempos.at(-1) || 0]); a = n; if (scrollY < total) { scrollBy(0, paso); requestAnimationFrame(f); } else res(t.slice(1)); })();
    })""")
    por = {}
    cpu = {}
    for dt, z, c in r: por.setdefault(z, []).append(dt); cpu.setdefault(z, []).append(c)
    for z, v in por.items():
        s = sorted(v); print(f'{z:12s} n={len(v):4d} mediana={s[len(s)//2]:.1f} p95={s[int(len(s)*0.95)]:.1f} max={s[-1]:.1f} lentos={sum(x > 20 for x in v)} cpu_mediana={sorted(cpu[z])[len(v)//2]:.1f} cpu_max={max(cpu[z]):.1f}')
    print('errores:', err or 'ninguno')
    b.close()

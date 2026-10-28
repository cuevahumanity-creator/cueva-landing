"""Como capturar.py, pero espera más tras cada salto (para animaciones de entrada). Uso igual que capturar.py."""
import sys, os, pathlib
from playwright.sync_api import sync_playwright
sal, pref, lista = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
W, H = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (1440, 900)
os.makedirs(sal, exist_ok=True)
url = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': W, 'height': H}, is_mobile=W < 700, has_touch=W < 700)
    err = []; pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(2500)
    for i, e in enumerate(lista):
        cap, v = e.split(':'); pg.evaluate(f"window.APERTURA && APERTURA.ir(99); CUEVA.ir('{cap}', {v})"); pg.wait_for_timeout(3500)
        pg.screenshot(path=os.path.join(sal, f'{pref}_{i:02d}_{cap}_{float(v):05.2f}_{W}.png'))
    print('errores:', err or 'ninguno'); b.close()

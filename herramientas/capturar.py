"""Capturas de la página CUEVA.
Uso: python capturar.py <carpeta_salida> <prefijo> <lista> [ancho alto]
  lista: entradas separadas por comas, cada una «capitulo:u» (u de 0 a 1 dentro del capítulo),
         «apertura:t» (segundos de la apertura) o «#id:u» para secciones sin 3D (por ejemplo «obras:0.5»).
Imprime los errores de la consola al final. Abre la página por file:// (como un doble clic)."""
import sys, os, pathlib
from playwright.sync_api import sync_playwright
sal, pref, lista = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
W, H = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (1440, 900)
os.makedirs(sal, exist_ok=True)
url = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1, is_mobile=W < 700, has_touch=W < 700)
    err = []; pg.on('pageerror', lambda e: err.append(str(e))); pg.on('console', lambda m: err.append(m.text) if m.type in ('error', 'warning') else None)
    pg.goto(url); pg.wait_for_timeout(2500)
    for i, e in enumerate(lista):
        cap, v = e.split(':'); v = float(v)
        if cap == 'apertura':
            pg.evaluate(f"scrollTo(0, 0); APERTURA.ir({v})")
        else:
            pg.evaluate(f"window.APERTURA && APERTURA.ir(99); CUEVA.ir('{cap}', {v})")
        pg.wait_for_timeout(700)
        pg.screenshot(path=os.path.join(sal, f'{pref}_{i:02d}_{cap}_{v:05.2f}_{W}.png'))
    print('errores:', err or 'ninguno')
    b.close()

// ─────────────────────────────────────────────────────────────────────
//  Motor de propuestas CUEVA · ver cómo se lee un plano, y dibujar un croquis
//  1. El visor enseña la traducción mientras ocurre, en cinco tiempos sobre tu imagen:
//     grises; la tinta del umbral adaptativo; los muros detectados, que se trazan uno a uno
//     (y sus huecos); las estancias, que se inundan desde su centro; y la trama de 0,75 m,
//     a la que cada muro se desliza hasta su eje ajustado. Al final queda el plano limpio.
//  2. El croquis: un lienzo con papel de trama para dibujar con el dedo o el ratón. En modo
//     «recto» cada trazo es una línea horizontal o vertical (lo normal en una planta).
//  Clásico: window.CUEVA_LECTOR.
// ─────────────────────────────────────────────────────────────────────
(() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), eo = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3), eio = (u) => { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const TINTES = ['#CFE9FA', '#D6F2F4', '#E3E8F3', '#DCEBF8', '#E5F4EE', '#E9E4F5', '#F1EADF', '#DDEFF3', '#E8EEF6', '#F0F3F8'];
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  // ── el visor animado ──
  function visor(caja, L, T, escala, opciones = {}) {
    const c = document.createElement('canvas'); c.className = 'cf-visor'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Tu plano, leído y traducido a la trama de 0,75 m');
    caja.appendChild(c);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = L.w, h = L.h;
    // capas precalculadas (a la resolución de la lectura)
    const capa = (fn) => { const k = document.createElement('canvas'); k.width = w; k.height = h; const x = k.getContext('2d'); const im = x.createImageData(w, h); fn(im.data); x.putImageData(im, 0, 0); return k; };
    const gris = (() => { const k = document.createElement('canvas'); k.width = w; k.height = h; const x = k.getContext('2d'); x.filter = 'grayscale(1) contrast(1.1)'; x.drawImage(L.lienzo, 0, 0); return k; })();
    const tinta = capa((d) => { for (let i = 0; i < w * h; i++) if (L.tinta[i]) { d[i * 4] = 27; d[i * 4 + 1] = 41; d[i * 4 + 2] = 81; d[i * 4 + 3] = 210; } });
    const salas = capa((d) => { for (let i = 0; i < w * h; i++) { const e = L.etiqueta[i]; if (e < 0) continue; const [r, g, b] = hex(TINTES[e % TINTES.length]); d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 235; } });
    // la trama en píxeles: módulo = 0,75 m / (m por píxel)
    const [ex0, ey0] = L.envolvente, s = 0.75 / escala.mpp;
    const xA = (px) => ex0 + T.xDir(px) * s, yA = (py) => ey0 + T.yDir(py) * s;     // dónde acaba cada coordenada
    const xQ = (px) => ex0 + Math.round(T.xDir(px)) * s, yQ = (py) => ey0 + Math.round(T.yDir(py)) * s;
    let raf = 0, t0 = 0, W = 0, H = 0, k = 1, ox = 0, oy = 0;
    const etapas = opciones.etapas || (() => {});
    function medir() {
      const r = caja.getBoundingClientRect(); W = Math.max(10, r.width); H = Math.max(10, Math.min(r.width * h / w, opciones.altoMax || 520));
      c.style.height = H + 'px'; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      k = Math.min(W / w, H / h) * 0.96; ox = (W - w * k) / 2; oy = (H - h * k) / 2;
    }
    function pintar(t) {
      const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
      x.save(); x.translate(ox, oy); x.scale(k, k);
      const u1 = eo((t - 0.0) / 0.6), u2 = eo((t - 0.6) / 0.6), u3 = clamp((t - 1.2) / 1.1, 0, 1), u4 = eo((t - 2.3) / 0.9), u5 = eio((t - 3.2) / 1.3), u6 = eo((t - 4.4) / 0.6);
      // 1 · la imagen, a grises
      x.globalAlpha = Math.max(0.1, 1 - u1 * 0.15 - u5 * 0.55 - u6 * 0.2); x.drawImage(L.lienzo, 0, 0); x.globalAlpha = (u1 * (1 - u5 * 0.6)) * 0.9; x.drawImage(gris, 0, 0);
      // 2 · la tinta del umbral
      x.globalAlpha = u2 * (1 - u3 * 0.75) * 0.8; x.drawImage(tinta, 0, 0);
      // 4 · las estancias, que se inundan desde su centro
      if (u4 > 0) {
        x.save(); x.globalAlpha = 0.9 * (1 - u5 * 0.4);
        x.beginPath();
        for (const e of L.estancias) { const r = Math.hypot(e.x1 - e.x0, e.y1 - e.y0) * u4; x.moveTo(e.cx + r, e.cy); x.arc(e.cx, e.cy, r, 0, Math.PI * 2); }
        x.clip(); x.drawImage(salas, 0, 0); x.restore();
      }
      // 3 · los muros: se trazan uno a uno y luego se deslizan a la trama
      x.globalAlpha = 1;
      const n = L.muros.length;
      L.muros.forEach((m, i) => {
        const ui = clamp(u3 * (n + 3) - i, 0, 1); if (ui <= 0) return;
        let c0 = m.c, s0 = m.s, e0 = m.e;
        if (u5 > 0) {
          if (m.eje === 'h') { c0 += (yQ(m.c) - m.c) * u5; s0 += (xQ(m.s) - m.s) * u5; e0 += (xQ(m.e) - m.e) * u5; }
          else { c0 += (xQ(m.c) - m.c) * u5; s0 += (yQ(m.s) - m.s) * u5; e0 += (yQ(m.e) - m.e) * u5; }
        }
        const fin = s0 + (e0 - s0) * eo(ui);
        x.strokeStyle = u5 > 0.98 ? '#1B2951' : '#0EA5E9'; x.lineWidth = Math.max(2.2 / k, Math.min(m.t, 8) * (1 - u5 * 0.4)); x.lineCap = 'square';
        x.beginPath(); if (m.eje === 'h') { x.moveTo(s0, c0); x.lineTo(fin, c0); } else { x.moveTo(c0, s0); x.lineTo(c0, fin); } x.stroke();
      });
      // los huecos: puertas y ventanas encontradas
      if (u3 > 0.6) { x.globalAlpha = clamp((u3 - 0.6) / 0.4, 0, 1) * (1 - u5); x.strokeStyle = '#56DCE6'; x.lineWidth = 3 / k; x.setLineDash([5 / k, 4 / k]);
        for (const q of L.huecos) { x.beginPath(); if (q.eje === 'h') { x.moveTo(q.s, q.c); x.lineTo(q.e, q.c); } else { x.moveTo(q.c, q.s); x.lineTo(q.c, q.e); } x.stroke(); }
        x.setLineDash([]); }
      // 5 · la trama de 0,75 m
      if (u5 > 0) {
        x.globalAlpha = u5 * 0.55; x.strokeStyle = '#1B2951'; x.lineWidth = 0.6 / k; x.beginPath();
        for (let i = 0; i <= T.W; i++) { const px = ex0 + i * s; x.moveTo(px, ey0 - s); x.lineTo(px, ey0 + (T.H + 1) * s); }
        for (let j = 0; j <= T.H; j++) { const py = ey0 + j * s; x.moveTo(ex0 - s, py); x.lineTo(ex0 + (T.W + 1) * s, py); }
        x.stroke();
      }
      // 6 · el plano traducido: celdas de cada estancia, limpias
      if (u6 > 0) {
        x.globalAlpha = u6;
        for (let j = 0; j < T.H; j++) for (let i = 0; i < T.W; i++) { const e = T.etiquetas[j * T.W + i]; if (e < 0) continue; x.fillStyle = TINTES[(T.estancias[e]?.origen ?? e) % TINTES.length]; x.fillRect(ex0 + i * s, ey0 + j * s, s + 0.5, s + 0.5); }
        x.strokeStyle = '#1B2951'; x.lineWidth = Math.max(2 / k, s * 0.16); x.lineCap = 'square'; x.beginPath();
        for (let j = 0; j < T.H; j++) for (let i = 0; i < T.W; i++) {
          const a = T.etiquetas[j * T.W + i]; if (a < 0) continue;
          const d = i + 1 < T.W ? T.etiquetas[j * T.W + i + 1] : -1, b = j + 1 < T.H ? T.etiquetas[(j + 1) * T.W + i] : -1, l = i > 0 ? T.etiquetas[j * T.W + i - 1] : -1, u = j > 0 ? T.etiquetas[(j - 1) * T.W + i] : -1;
          if (d !== a) { x.moveTo(ex0 + (i + 1) * s, ey0 + j * s); x.lineTo(ex0 + (i + 1) * s, ey0 + (j + 1) * s); }
          if (b !== a) { x.moveTo(ex0 + i * s, ey0 + (j + 1) * s); x.lineTo(ex0 + (i + 1) * s, ey0 + (j + 1) * s); }
          if (l < 0) { x.moveTo(ex0 + i * s, ey0 + j * s); x.lineTo(ex0 + i * s, ey0 + (j + 1) * s); }
          if (u < 0) { x.moveTo(ex0 + i * s, ey0 + j * s); x.lineTo(ex0 + (i + 1) * s, ey0 + j * s); }
        }
        x.stroke();
      }
      x.restore();
      etapas(t < 0.6 ? 0 : t < 1.2 ? 1 : t < 2.3 ? 2 : t < 3.2 ? 3 : t < 4.4 ? 4 : 5);
    }
    function cuadro(ahora) { const t = (ahora - t0) / 1000; pintar(t); if (t < 5.1) raf = requestAnimationFrame(cuadro); else { raf = 0; opciones.fin?.(); } }
    medir();
    const ro = new ResizeObserver(() => { medir(); if (!raf) pintar(9); }); ro.observe(caja);
    return {
      reproducir(desde = 0) { cancelAnimationFrame(raf); t0 = performance.now() - desde * 1000; raf = requestAnimationFrame(cuadro); },
      final() { cancelAnimationFrame(raf); raf = 0; pintar(9); },
      destruir() { cancelAnimationFrame(raf); ro.disconnect(); c.remove(); },
    };
  }

  // ── el croquis ──
  function croquis(caja, opciones = {}) {
    const fondo = document.createElement('canvas'), trazo = document.createElement('canvas');
    fondo.className = 'cf-croquis-fondo'; trazo.className = 'cf-croquis-trazo';
    trazo.setAttribute('aria-label', 'Lienzo para dibujar el croquis de la planta'); trazo.tabIndex = 0;
    const marco = document.createElement('div'); marco.className = 'cf-croquis'; marco.append(fondo, trazo); caja.appendChild(marco);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, recto = opciones.recto ?? true, lineas = [], actual = null;
    function medir() {
      const r = marco.getBoundingClientRect(); W = Math.max(50, r.width); H = Math.max(50, r.height);
      for (const k of [fondo, trazo]) { k.width = Math.round(W * dpr); k.height = Math.round(H * dpr); }
      const x = fondo.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = '#FBFCFD'; x.fillRect(0, 0, W, H);
      const p = Math.max(14, Math.round(W / 26)); x.strokeStyle = 'rgba(27,41,81,.08)'; x.lineWidth = 1; x.beginPath();
      for (let i = p; i < W; i += p) { x.moveTo(i + 0.5, 0); x.lineTo(i + 0.5, H); } for (let j = p; j < H; j += p) { x.moveTo(0, j + 0.5); x.lineTo(W, j + 0.5); } x.stroke();
      pintar();
    }
    function pintar() {
      const x = trazo.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
      x.strokeStyle = '#1B2951'; x.lineWidth = 6; x.lineCap = 'round'; x.lineJoin = 'round';
      for (const l of [...lineas, actual].filter(Boolean)) { x.beginPath(); l.forEach(([a, b], i) => (i ? x.lineTo(a * W, b * H) : x.moveTo(a * W, b * H))); x.stroke(); }
      opciones.cambio?.(lineas.length);
    }
    const pos = (e) => { const r = trazo.getBoundingClientRect(); return [clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1)]; };
    // en modo recto, los extremos se imantan a los de las líneas ya dibujadas
    const imantar = (p) => { const tol = 14 / W; for (const l of lineas) for (const q of [l[0], l[l.length - 1]]) if (Math.abs(q[0] - p[0]) < tol && Math.abs(q[1] - p[1]) < tol * W / H) return [q[0], q[1]]; return p; };
    trazo.addEventListener('pointerdown', (e) => { e.preventDefault(); trazo.setPointerCapture(e.pointerId); const p = recto ? imantar(pos(e)) : pos(e); actual = [p]; pintar(); });
    trazo.addEventListener('pointermove', (e) => {
      if (!actual) return; const p = pos(e);
      if (recto) { const a = actual[0], dx = Math.abs(p[0] - a[0]) * W, dy = Math.abs(p[1] - a[1]) * H; let q = dx >= dy ? [p[0], a[1]] : [a[0], p[1]]; const m = imantar(q); if (dx >= dy ? Math.abs(m[1] - a[1]) < 1e-6 : Math.abs(m[0] - a[0]) < 1e-6) q = m; actual = [a, q]; }
      else actual.push(p);
      pintar();
    });
    const fin = () => { if (actual && actual.length > 1) lineas.push(actual); actual = null; pintar(); };
    trazo.addEventListener('pointerup', fin); trazo.addEventListener('pointercancel', fin);
    const ro = new ResizeObserver(medir); ro.observe(marco);
    medir();
    return {
      fijarRecto(v) { recto = v; }, deshacer() { lineas.pop(); pintar(); }, borrar() { lineas = []; pintar(); },
      vacio: () => !lineas.length,
      // la imagen que se lee: solo los trazos, sobre blanco, con un margen
      imagen() { const k = document.createElement('canvas'); k.width = Math.round(W * 1.5); k.height = Math.round(H * 1.5); const x = k.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, k.width, k.height); x.drawImage(trazo, 0, 0, k.width, k.height); return k; },
      ejemplo(L) { lineas = L.map((l) => l.map((p) => p.slice())); pintar(); },
      destruir() { ro.disconnect(); marco.remove(); },
    };
  }

  // ── un plano de ejemplo, dibujado aquí mismo (para probar sin archivo) ──
  function planoEjemplo() {
    const S = 48, M = 50, Wm = 12, Hm = 7.5, c = document.createElement('canvas');
    c.width = Wm * S + 2 * M; c.height = Hm * S + 2 * M + 30;
    const x = c.getContext('2d'); x.fillStyle = '#FAF9F5'; x.fillRect(0, 0, c.width, c.height);
    const P = (a, b) => [M + a * S, M + b * S];
    const muro = (x0, y0, x1, y1, t) => { x.fillStyle = '#1E1E22'; if (y0 === y1) { const [a, b] = P(x0, y0 - t / 2), [cc, d] = P(x1, y0 + t / 2); x.fillRect(a, b, cc - a, d - b); } else { const [a, b] = P(x0 - t / 2, y0), [cc, d] = P(x0 + t / 2, y1); x.fillRect(a, b, cc - a, d - b); } };
    const E = 0.3, I = 0.12;
    muro(0, 0, 2.2, 0, E); muro(3.6, 0, 6.6, 0, E); muro(8.0, 0, 12, 0, E); muro(0, 7.5, 1.0, 7.5, E); muro(4.4, 7.5, 7.2, 7.5, E); muro(8.6, 7.5, 12, 7.5, E);
    muro(0, 0, 0, 7.5, E); muro(12, 0, 12, 3.0, E); muro(12, 4.2, 12, 7.5, E);
    muro(0, 3.0, 1.2, 3.0, I); muro(2.1, 3.0, 4.6, 3.0, I); muro(5.5, 3.0, 8.0, 3.0, I); muro(8.9, 3.0, 10.4, 3.0, I); muro(11.2, 3.0, 12, 3.0, I);
    muro(4.2, 0, 4.2, 3.0, I); muro(8.0, 0, 8.0, 3.0, I); muro(10.2, 0, 10.2, 3.0, I);
    muro(0, 4.2, 6.0, 4.2, I); muro(7.0, 4.2, 7.0, 7.5, I); muro(7.9, 4.2, 12, 4.2, I);
    x.fillStyle = '#2A2F3E'; x.font = '15px Inter, Arial, sans-serif';
    for (const [t, a, b] of [['Dormitorio', 0.6, 1.4], ['Dormitorio', 5.0, 1.4], ['Estudio', 8.4, 1.4], ['Baño', 10.6, 1.4], ['Salón comedor', 1.6, 5.8], ['Cocina', 8.9, 5.8]]) { const [p, q] = P(a, b); x.fillText(t, p, q); }
    x.strokeStyle = '#6B7183'; x.lineWidth = 1; x.beginPath(); const [a0, b0] = P(0, 8.2), [a1] = P(12, 8.2); x.moveTo(a0, b0); x.lineTo(a1, b0); x.stroke(); x.fillText('12,00', (a0 + a1) / 2 - 18, b0 + 18);
    return c;
  }

  window.CUEVA_LECTOR = { visor, croquis, planoEjemplo, TINTES };
})();

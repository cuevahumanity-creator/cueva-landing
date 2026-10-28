CUEVA.capitulo('apertura', (ctx) => {
  // ─────────────────────────────────────────────────────────────────────
  //  Apertura de CUEVA en 3D.
  //  1. El punto ámbar (una esfera que da luz) aparece, respira y bota: donde cae, nace una letra.
  //  2. La A lo lanza a la C, que gira como una rueda hasta ser el anillo. Baja un cable de grúa,
  //     lo engancha y lo iza; colgado, el anillo da una vuelta sobre sí mismo mientras crece.
  //  3. El anillo es un móvil: de él bajan cables que enganchan las letras y las suben. La A y la E
  //     cuelgan del anillo; la U cuelga de la A y la V de la E. Se mecen y giran, de verdad.
  //  4. Cada letra, colgada, se despieza en sus trazos (tantos como lados tiene su pieza), que dan
  //     volteretas y se montan en la pieza del logo. Los cables se recogen y todo encaja.
  //  5. El punto lee cada pieza, aparece el punto menta y el logo gira entero como una moneda.
  //  6. La marca vuelve a nacer en el suelo y aparece su lema.
  //  ?fondo=negro: la versión de noche.
  // ─────────────────────────────────────────────────────────────────────
  const T3 = window.THREE;
  const NOCHE = true;
  const mezcla = (a, b, u) => a + (b - a) * u, tramo = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const muelle = (z, w) => (u) => { if (u <= 0) return 0; if (u >= 1) return 1; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * u) * (Math.cos(wd * u) + (z * w / wd) * Math.sin(wd * u)); };
  const E = { eo: (u) => 1 - Math.pow(1 - u, 3), eo5: (u) => 1 - Math.pow(1 - u, 5), ei: (u) => u * u * u, eio: (u) => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
    seno: (u) => -(Math.cos(Math.PI * u) - 1) / 2, rebote: muelle(0.32, 15), vivo: muelle(0.45, 14), suave: muelle(0.72, 11), firme: muelle(0.6, 16) };
  const rotv = (x, y, r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];   // giro en el plano (y hacia abajo)
  const COL = { tinta: NOCHE ? 0xF4F6FA : 0x1B2951, cian: 0x56DCE6, menta: 0x00D4AA, ion: 0x0EA5E9, coral: 0xFF6B4A, ambar: 0xF59E0B, fondo: NOCHE ? 0x05070A : 0xFFFFFF, cuerda: NOCHE ? 0xC9D2E3 : 0x1B2951 };

  // ── la palabra, medida con la tipografía real (Inter 760, interletraje del wordmark) ──
  const F = 160, ESP = -7.2 / 94 * F, PALABRA = 'CUEVA';
  const mc = document.createElement('canvas').getContext('2d');
  let L = [], ancho = 0;
  function medirPalabra() {
    const esp = (v) => { if ('letterSpacing' in mc) mc.letterSpacing = `${v}px`; };
    mc.font = `760 ${F}px Inter`; esp(ESP);
    const total = mc.measureText(PALABRA).width - ESP;
    L = [...PALABRA].map((ch, i) => {
      const x = mc.measureText(PALABRA.slice(0, i)).width; esp(0);
      const m = mc.measureText(ch); esp(ESP);
      return { ch, i, x: x - total / 2, izq: m.actualBoundingBoxLeft, der: m.actualBoundingBoxRight, alto: m.actualBoundingBoxAscent, bajo: m.actualBoundingBoxDescent };
    });
    esp(0);
    for (const l of L) { l.cx = l.x + (l.der - l.izq) / 2; l.cy = -(l.alto - l.bajo) / 2; l.w = l.der + l.izq; l.hl = (l.alto + l.bajo) / 2; }
    ancho = total;
  }

  // ── el contorno de una letra (o de un trozo de ella), trazado del texto que pinta el navegador ──
  //  cuadrados en marcha con interpolación, lazos cerrados, simplificación y huecos.
  //  reg: [u0, v0, u1, v1] dentro de la caja de la letra; entre trozos queda una junta de SEAM.
  const P_RAS = 420, SEAM = 1.3;
  function lienzoLetra(l, reg) {
    const s = P_RAS / F, pad = 6, w = Math.ceil(l.w * s + pad * 2), h = Math.ceil((l.alto + l.bajo) * s + pad * 2);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true });
    const ox = pad + l.izq * s, oy = pad + l.alto * s;
    if (reg) {
      const bw = l.w * s, bh = (l.alto + l.bajo) * s, sm = SEAM / 2 * s;
      const x0 = reg[0] <= 0 ? 0 : pad + reg[0] * bw + sm, x1 = reg[2] >= 1 ? w : pad + reg[2] * bw - sm, y0 = reg[1] <= 0 ? 0 : pad + reg[1] * bh + sm, y1 = reg[3] >= 1 ? h : pad + reg[3] * bh - sm;
      x.beginPath(); x.rect(x0, y0, x1 - x0, y1 - y0); x.clip();
    }
    x.font = `760 ${P_RAS}px Inter`; x.fillStyle = '#000'; x.fillText(l.ch, ox, oy);
    return { d: x.getImageData(0, 0, w, h).data, w, h, s, ox, oy, pad };
  }
  function trazar(l, reg = null) {
    const { d, w, h, s, ox, oy } = lienzoLetra(l, reg), v = (i, j) => (i < 0 || j < 0 || i >= w || j >= h) ? 0 : d[(j * w + i) * 4 + 3] / 255;
    const pts = new Map(), ady = new Map();
    const pe = (k, px, py) => { if (!pts.has(k)) pts.set(k, [px, py]); return k; };
    const top = (i, j) => { const a = v(i, j), b = v(i + 1, j); return pe('h' + i + ',' + j, i + (0.5 - a) / (b - a), j); };
    const bot = (i, j) => { const a = v(i, j + 1), b = v(i + 1, j + 1); return pe('h' + i + ',' + (j + 1), i + (0.5 - a) / (b - a), j + 1); };
    const izq = (i, j) => { const a = v(i, j), b = v(i, j + 1); return pe('v' + i + ',' + j, i, j + (0.5 - a) / (b - a)); };
    const der = (i, j) => { const a = v(i + 1, j), b = v(i + 1, j + 1); return pe('v' + (i + 1) + ',' + j, i + 1, j + (0.5 - a) / (b - a)); };
    const une = (a, b) => { (ady.get(a) || ady.set(a, []).get(a)).push(b); (ady.get(b) || ady.set(b, []).get(b)).push(a); };
    for (let j = -1; j < h; j++) for (let i = -1; i < w; i++) {
      const tl = v(i, j) >= 0.5, tr = v(i + 1, j) >= 0.5, br = v(i + 1, j + 1) >= 0.5, bl = v(i, j + 1) >= 0.5;
      const k = (tl << 3) | (tr << 2) | (br << 1) | bl; if (k === 0 || k === 15) continue;
      const centro = (v(i, j) + v(i + 1, j) + v(i + 1, j + 1) + v(i, j + 1)) / 4 >= 0.5;
      switch (k) {
        case 1: case 14: une(izq(i, j), bot(i, j)); break;
        case 2: case 13: une(bot(i, j), der(i, j)); break;
        case 3: case 12: une(izq(i, j), der(i, j)); break;
        case 4: case 11: une(top(i, j), der(i, j)); break;
        case 6: case 9: une(top(i, j), bot(i, j)); break;
        case 7: case 8: une(izq(i, j), top(i, j)); break;
        case 5: if (centro) { une(top(i, j), izq(i, j)); une(bot(i, j), der(i, j)); } else { une(top(i, j), der(i, j)); une(izq(i, j), bot(i, j)); } break;
        case 10: if (centro) { une(top(i, j), der(i, j)); une(izq(i, j), bot(i, j)); } else { une(top(i, j), izq(i, j)); une(bot(i, j), der(i, j)); } break;
      }
    }
    const vistos = new Set(), lazos = [];
    for (const k0 of ady.keys()) {
      if (vistos.has(k0)) continue;
      const lazo = []; let prev = null, k = k0;
      while (k && !vistos.has(k)) { vistos.add(k); lazo.push(pts.get(k)); const sig = ady.get(k).find((q) => q !== prev && !vistos.has(q)); prev = k; k = sig; }
      if (lazo.length > 8) lazos.push(lazo);
    }
    const rdp = (p, eps) => { if (p.length < 3) return p; let dm = 0, im = 0; const a = p[0], b = p.at(-1), dx = b[0] - a[0], dy = b[1] - a[1], L2 = Math.hypot(dx, dy) || 1;
      for (let i = 1; i < p.length - 1; i++) { const dd = Math.abs(dy * p[i][0] - dx * p[i][1] + b[0] * a[1] - b[1] * a[0]) / L2; if (dd > dm) { dm = dd; im = i; } }
      return dm > eps ? [...rdp(p.slice(0, im + 1), eps).slice(0, -1), ...rdp(p.slice(im), eps)] : [a, b]; };
    const aMundo = ([px, py]) => new T3.Vector2((px - ox) / s + l.x - l.cx, -((py - oy) / s - l.cy));   // y hacia arriba, centro de la letra en el origen
    const area = (p) => p.reduce((acc, q, i) => acc + q.x * p[(i + 1) % p.length].y - p[(i + 1) % p.length].x * q.y, 0) / 2;
    // un lazo cerrado se parte por su punto más lejano al inicio y se simplifica cada mitad
    const cerrado = (lz) => { let im = 0, dm = 0; lz.forEach((q, i) => { const dd = Math.hypot(q[0] - lz[0][0], q[1] - lz[0][1]); if (dd > dm) { dm = dd; im = i; } });
      return [...rdp(lz.slice(0, im + 1), 0.3).slice(0, -1), ...rdp([...lz.slice(im), lz[0]], 0.3).slice(0, -1)]; };
    const limpio = (p) => p.filter((q, i) => q.distanceTo(p[(i + 1) % p.length]) > 0.6);     // sin puntos casi repetidos
    const polis = lazos.map((lz) => limpio(cerrado(lz).map(aMundo))).filter((p) => p.length > 3);
    polis.sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)));
    const dentro = (pt, p) => { let r = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { if ((p[i].y > pt.y) !== (p[j].y > pt.y) && pt.x < (p[j].x - p[i].x) * (pt.y - p[i].y) / (p[j].y - p[i].y) + p[i].x) r = !r; } return r; };
    const formas = [];
    for (const p of polis) { const madre = formas.find((f) => dentro(p[0], f.ext)); if (madre) madre.huecos.push(p); else formas.push({ ext: p, huecos: [] }); }
    const shapes = formas.map((f) => { const sh = new T3.Shape(f.ext); for (const hh of f.huecos) sh.holes.push(new T3.Path(hh)); return sh; });
    if (!reg) return { shapes };
    // la forma del trozo: centro, eje principal, largo y ancho (de los momentos de sus píxeles)
    let m = 0, mx = 0, my = 0, xx = 0, yy = 0, xy = 0; const ps = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const a = v(i, j); if (a < 0.5) continue; const q = aMundo([i, j]); ps.push(q); m++; mx += q.x; my += q.y; }
    mx /= m; my /= m; for (const q of ps) { xx += (q.x - mx) ** 2; yy += (q.y - my) ** 2; xy += (q.x - mx) * (q.y - my); }
    const ang = 0.5 * Math.atan2(2 * xy, xx - yy), ex = Math.cos(ang), ey = Math.sin(ang);
    let e0 = Infinity, e1 = -Infinity, n0 = Infinity, n1 = -Infinity;
    for (const q of ps) { const e = (q.x - mx) * ex + (q.y - my) * ey, n = -(q.x - mx) * ey + (q.y - my) * ex; e0 = Math.min(e0, e); e1 = Math.max(e1, e); n0 = Math.min(n0, n); n1 = Math.max(n1, n); }
    const ce = (e0 + e1) / 2, cn = (n0 + n1) / 2;
    return { shapes, c: new T3.Vector2(mx + ex * ce - ey * cn, my + ey * ce + ex * cn), a: ang, largo: e1 - e0, ancho: n1 - n0 };
  }
  // dónde cortar cada letra: tantos trozos como lados tiene su pieza (U, E y V cuatro; la A seis)
  function cortes(l) {
    if (l.ch === 'U') return [[0, 0, .5, .56], [.5, 0, 1, .56], [0, .56, .5, 1], [.5, .56, 1, 1]];
    if (l.ch === 'E') return [[0, 0, .325, 1], [.325, 0, 1, .34], [.325, .34, 1, .66], [.325, .66, 1, 1]];
    if (l.ch === 'V') return [[0, 0, .5, .6], [.5, 0, 1, .6], [0, .6, .5, 1], [.5, .6, 1, 1]];
    // la A: se mide su columna central para cortar justo por encima y por debajo del travesaño
    const { d, w, h, pad } = lienzoLetra(l), i = Math.round(w / 2), bh = h - pad * 2, tr = [];
    let dentro = false, ini = 0;
    for (let j = 0; j < h; j++) { const tinta = d[(j * w + i) * 4 + 3] > 127; if (tinta && !dentro) { dentro = true; ini = j; } if (!tinta && dentro) { dentro = false; tr.push([(ini - pad) / bh, (j - pad) / bh]); } }
    const ap = tr[0] ? tr[0][1] + 0.07 : 0.3, r1 = tr[1] ? tr[1][0] - 0.035 : 0.6, r2 = tr[1] ? tr[1][1] + 0.035 : 0.78;
    return [[0, 0, 1, ap], [0, ap, .5, r1], [.5, ap, 1, r1], [0, r1, 1, r2], [0, r2, .5, 1], [.5, r2, 1, 1]];
  }
  // normales suaves en los cantos redondeados y vivas en las esquinas
  function normalesSuaves(g, grados = 40) {
    const p = g.attributes.position, n = p.count / 3, fn = new Float32Array(n * 3), cl = Math.cos(grados * Math.PI / 180), mapa = new Map();
    const a = new T3.Vector3(), b = new T3.Vector3(), c = new T3.Vector3(), clave = (q) => `${Math.round(p.getX(q) * 200)},${Math.round(p.getY(q) * 200)},${Math.round(p.getZ(q) * 200)}`;
    for (let f = 0; f < n; f++) {
      a.fromBufferAttribute(p, f * 3); b.fromBufferAttribute(p, f * 3 + 1); c.fromBufferAttribute(p, f * 3 + 2);
      c.sub(b); a.sub(b); c.cross(a); fn.set([c.x, c.y, c.z], f * 3);
      for (let k = 0; k < 3; k++) { const ck = clave(f * 3 + k); (mapa.get(ck) || mapa.set(ck, []).get(ck)).push(f); }
    }
    const out = new Float32Array(p.count * 3), nf = new T3.Vector3(), ng = new T3.Vector3(), suma = new T3.Vector3();
    for (let f = 0; f < n; f++) {
      nf.fromArray(fn, f * 3).normalize();
      for (let k = 0; k < 3; k++) {
        const q = f * 3 + k; suma.set(0, 0, 0);
        for (const g2 of mapa.get(clave(q))) { ng.fromArray(fn, g2 * 3); const lg = ng.length(); if (lg > 0 && nf.dot(ng) / lg > cl) suma.add(ng); }
        if (suma.lengthSq() === 0) suma.copy(nf); suma.normalize(); out.set([suma.x, suma.y, suma.z], q * 3);
      }
    }
    g.setAttribute('normal', new T3.BufferAttribute(out, 3)); return g;
  }

  // ── el logo (CUEVA Brandbook v2): anillo r = 92 en una caja de 240 ──
  const RL = 150, K = RL / 92, RIN = RL - 1.7;
  let LC = [0, -330];
  const lp = (x, y) => [(x - 120) * K, (y - 120) * K];
  const HEX = [[91.56, 74.75], [91.56, 89.25], [79, 96.5], [66.44, 89.25], [66.44, 74.75], [79, 67.5]].map(([x, y]) => lp(x, y));
  const rectL = (x, y, w, h) => [lp(x, y), lp(x + w, y), lp(x + w, y + h), lp(x, y + h)];
  const PIEZAS = {
    U: { forma: rectL(70, 139, 27, 27), col: 'tinta', con: [lp(97, 152.5), lp(102.3, 152.5)], cuad: lp(104.1, 152.5), ccol: 'coral', nota: 0 },
    E: { forma: rectL(130, 72, 37, 18), col: 'tinta', con: [lp(148.5, 90), lp(148.5, 95)], cuad: lp(148.5, 96.8), ccol: 'ion', nota: 2 },
    V: { forma: rectL(116, 168, 45, 18), col: 'ion', con: [lp(161, 177), lp(166.2, 177)], cuad: lp(168, 177), ccol: 'menta', nota: 3 },
    A: { forma: HEX, col: 'cian', con: [lp(91.8, 82), lp(97.2, 82)], cuad: lp(99.1, 82), ccol: 'menta', nota: 4 },
  };
  const MENTA = lp(176, 177);
  for (const p of Object.values(PIEZAS)) {
    p.centro = p.forma.reduce((s, q) => [s[0] + q[0] / p.forma.length, s[1] + q[1] / p.forma.length], [0, 0]);
    p.local = p.forma.map(([x, y]) => [x - p.centro[0], y - p.centro[1]]);
    p.arriba = -Math.min(...p.local.map((q) => q[1]));                 // del centro al borde de arriba (y hacia abajo)
  }
  const bordeAbajo = (loc, x) => { let y = -Infinity; for (let i = 0; i < loc.length; i++) { const a = loc[i], b = loc[(i + 1) % loc.length]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) y = Math.max(y, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])); } return y; };

  // ── el móvil: quién cuelga de quién y cuándo ──
  const ESC_IN = 0.5, TH = 3.2, PROF = 6, G = 2400, DT = 1 / 240;
  const SALTO_X = 1.6, AMORT = 0.9945, IZADO = 2.0;
  const ORDEN = ['A', 'E', 'U', 'V'], PADRE = { U: 'A', V: 'E' }, BAJA = { A: 0.05, E: 0.35, U: 1.35, V: 1.15 }, DESPIECE = { A: 3.0, E: 3.4, U: 4.05, V: 4.45 };
  const CU = {};
  const ESLINGA = { U: [0.42, 0.37], V: [0.38, 0.41] };              // alto del gancho y separación de los ramales, por ancho de letra

  // ── el guion ────────────────────────────────────────────────────
  const T = {}; let BOTES = [], VUELO = null, SIM = null;
  function guion() {
    const x0 = L[0].cx - 190, dur = [0.5, 0.38, 0.35, 0.33, 0.32], alt = [120, 92, 84, 78, 74];
    T.aparece = 0.25; T.cae = 1.05; T.salta = 1.32;
    let t = T.salta, x = x0; BOTES = [];
    L.forEach((l, i) => { BOTES.push({ t0: t, t1: t + dur[i], x0: x, x1: l.cx, h: alt[i] }); t += dur[i]; x = l.cx; l.nace = t; });
    VUELO = { t0: t + 0.06, t1: t + 0.98, x0: x, y0: -7, x1: L[0].cx, y1: L[0].cy, h: 330 };
    T.enC = VUELO.t1; T.gira = T.enC + 0.38; T.anillo = T.gira + 0.62;
    T.baja = T.anillo + 0.04; T.engancha = T.baja + 0.42; T.sube = T.engancha + 0.16; T.subeFin = T.sube + 1.3;
    for (const ch of ORDEN) {
      const c = CU[ch]; c.tBaja = T.subeFin + BAJA[ch]; c.clic = c.tBaja + 0.42; c.tS = c.clic + 0.12; c.tD = T.subeFin + DESPIECE[ch];        // se despiezan cuando todas cuelgan ya, una tras otra
      c.trozos.forEach((q, k) => { q.t0 = c.tD + 0.42 + k * 0.05; }); c.tP = c.tD + 0.42 + 0.75 + (c.trozos.length - 1) * 0.05;
    }
    T.cierre = Math.max(...ORDEN.map((ch) => CU[ch].tP)) + 0.3;
    ['U', 'E', 'V', 'A'].forEach((ch, k) => { CU[ch].llega = T.cierre + 0.55 + k * 0.22; });
    T.menta = CU.A.llega + 0.4; T.brillo = T.menta + 0.05; T.giro = T.menta + 0.45; T.marca = T.giro + 1.25; T.fin = T.marca + 1.8;
    simularMovil();
  }
  // el punto: dónde está y cómo se deforma (estira en el aire, se aplasta al botar)
  function punto(t) {
    let x = BOTES[0].x0, y = -110, sx = 1, sy = 1, rot = 0, a = E.eo(tramo(t, T.aparece, T.aparece + 0.6));
    if (t < T.cae) { y = -110 + Math.sin(t * 3.1) * 3; }
    else if (t < T.salta) { const u = tramo(t, T.cae, T.cae + 0.22); y = mezcla(-110, -7, E.ei(u)); if (u >= 1) { const c = tramo(t, T.cae + 0.22, T.salta); sx = mezcla(1.55, 1, E.eo(c)); sy = mezcla(0.62, 1, E.eo(c)); y = -7 * sy; } else { sx = 0.82; sy = 1.28; } }
    else if (t < VUELO.t0) {
      const b = BOTES.find((q) => t < q.t1) || BOTES.at(-1), u = tramo(t, b.t0, b.t1);
      x = mezcla(b.x0, b.x1, u); y = -7 - b.h * 4 * u * (1 - u);
      const vy = b.h * 4 * (1 - 2 * u) / (b.t1 - b.t0), vx = (b.x1 - b.x0) / (b.t1 - b.t0), v = Math.hypot(vx, vy);
      const st = 1 + Math.min(0.42, v / 2600); sx = 1 / st; sy = st; rot = Math.atan2(vy, vx) + Math.PI / 2;
      const c = Math.min(u, 1 - u) * (b.t1 - b.t0); if (c < 0.035) { const q = 1 - c / 0.035; sx = 1 + 0.55 * q; sy = 1 - 0.38 * q; rot = 0; y = -7 * sy; }
    } else if (t < VUELO.t1) {
      const u = tramo(t, VUELO.t0, VUELO.t1), ue = E.seno(u) * 0.35 + u * 0.65;
      x = mezcla(VUELO.x0, VUELO.x1, ue); y = mezcla(VUELO.y0, VUELO.y1, ue) - VUELO.h * 4 * ue * (1 - ue);
      const st = 1 + 0.35 * Math.sin(Math.PI * u); sx = 1 / st; sy = st;
    } else {
      const q = E.rebote(tramo(t, T.enC, T.enC + 0.4));
      x = VUELO.x1; y = VUELO.y1; sx = mezcla(1.5, 1, q); sy = mezcla(0.65, 1, q);
      if (t > T.gira) { const an = anillo(t); x = an.x; y = an.y; }
    }
    return { x, y, sx, sy, rot, a };
  }
  // el anillo: nace de la C, lo iza la grúa y crece mientras sube
  function anillo(t) {
    const c = L[0], rC = c.alto / 2 - F * 0.085;
    const ur = E.suave(tramo(t, T.sube + 0.3, T.subeFin)), uy = E.eio(tramo(t, T.sube, T.sube + 0.8)), ux = E.eio(tramo(t, T.sube + 0.25, T.subeFin));
    const tiron = Math.sin(Math.PI * tramo(t, T.engancha, T.engancha + 0.16)) * 5;          // el tirón del gancho antes de izar
    const r = mezcla(rC, RL, ur), w = mezcla(F * 0.17, 3.4, E.eio(tramo(t, T.sube, T.subeFin + 0.15)));
    const y = Math.min(mezcla(c.cy, LC[1], uy) - tiron, -(r + w / 2) - 1.5) + peso(t);      // nunca se mete en el suelo
    return { x: mezcla(c.cx, LC[0], ux), y, r, w };
  }
  // el peso: cada cuerda que se tensa tira del anillo hacia abajo, que cede y rebota en su cable
  const rebote = (u) => u > 0 ? Math.exp(-u / 0.45) * Math.sin(u * 10) : 0;
  function peso(t) { let y = 0; for (const ch of ORDEN) { const c = CU[ch]; if (c.tTenso) y += 7 * rebote(t - c.tTenso); } return y; }
  // la vibración de una cuerda al tensarse de golpe
  const vibra = (c, t) => c.tTenso && t > c.tTenso ? 6 * Math.exp(-(t - c.tTenso) / 0.2) * Math.sin((t - c.tTenso) * 55) : 0;
  // giro del móvil sobre su cable (eje vertical): una vuelta al subir, un vaivén colgado y, al final, el giro de moneda
  function psi(t) {
    let p = Math.PI * 2 * (1 - E.suave(tramo(t, T.sube, T.subeFin + 0.45)));
    const env = E.seno(tramo(t, T.subeFin, T.subeFin + 1.4)) * (1 - E.seno(tramo(t, T.cierre - 1.1, T.cierre + 0.35)));
    p += env * (0.5 * Math.sin((t - T.subeFin) * 1.15) + 0.12 * Math.sin((t - T.subeFin) * 2.9));
    p += Math.PI * 2 * E.firme(tramo(t, T.giro, T.giro + 1.6));
    return p;
  }

  // ── la física del móvil: cuerdas que solo tiran (Verlet), con largo que la grúa va recogiendo ──
  function pivote(c, t, pa, pr) {
    if (!c.padre) return c.piv;
    const P = c.padre, o = rotv(0, P.ofs(t), pr), b = rotv(c.dx, P.hb(t), pr);
    return [pa[0] + o[0] + b[0], pa[1] + o[1] + b[1]];
  }
  function simularMovil() {
    const t0 = Math.min(...ORDEN.map((ch) => CU[ch].tS)), t1 = T.cierre + 1.5, n = Math.ceil((t1 - t0) / DT) + 2, AM = AMORT;
    SIM = { t0, n };
    for (const ch of ORDEN) { const c = CU[ch]; c.X = new Float32Array(n); c.Y = new Float32Array(n); c.R = new Float32Array(n); c.ini = false; c.tTenso = 0; }
    for (let i = 0; i < n; i++) {
      const t = t0 + i * DT;
      for (const ch of ORDEN) {
        const c = CU[ch];
        if (t < c.tS) { c.X[i] = c.p0[0]; c.Y[i] = c.p0[1]; c.R[i] = 0; continue; }
        if (!c.ini) {                                                    // salta hacia el gancho con la cuerda floja
          const P = c.padre ? pivote(c, t, c.padre.q, c.padre.rot) : c.piv, vx0 = (P[0] - c.p0[0]) * SALTO_X;   // salta hacia debajo de su gancho
          c.ini = true; c.q = [...c.p0]; c.qq = [c.p0[0] - vx0 * DT, c.p0[1] + 640 * DT]; c.rot = 0; c.wr = 0; c.l0 = Math.hypot(c.p0[0] - P[0], c.p0[1] - P[1]) + 6;
        }
        const am = c.padre ? AM - 0.0035 : AM, vx = (c.q[0] - c.qq[0]) * am, vy = (c.q[1] - c.qq[1]) * am;       // las de abajo, más frenadas c.qq = c.q; c.q = [c.q[0] + vx, c.q[1] + vy + G * DT * DT];
        const P = c.padre ? pivote(c, t, c.padre.q, c.padre.rot) : c.piv, ell = c.largo(t);
        let dx = c.q[0] - P[0], dy = c.q[1] - P[1], d = Math.hypot(dx, dy);
        if (d > ell) { c.q = [P[0] + dx * ell / d, P[1] + dy * ell / d]; dx *= ell / d; dy *= ell / d; d = ell; if (!c.tTenso && t > c.tS + 0.05) c.tTenso = t; }
        // el cuerpo se alinea con su cuerda con algo de retraso (y se pasa un poco: inercia)
        let da = Math.atan2(-dx, dy) - c.rot; da = Math.atan2(Math.sin(da), Math.cos(da));
        c.wr += (320 * Math.min(1, (d / ell) ** 6) * da - 17 * c.wr) * DT; c.rot += c.wr * DT;
        c.X[i] = c.q[0]; c.Y[i] = c.q[1]; c.R[i] = c.rot;
      }
    }
  }
  // dónde está cada cuerpo colgado: punto de la cuerda, giro y centro; al cerrar, encaja en su sitio
  function estado(c, t) {
    const f = Math.max(0, Math.min(SIM.n - 1.001, (t - SIM.t0) / DT)), i = Math.floor(f), u = f - i;
    let ax = mezcla(c.X[i], c.X[i + 1], u), ay = mezcla(c.Y[i], c.Y[i + 1], u), rot = mezcla(c.R[i], c.R[i + 1], u);
    const o = rotv(0, c.ofs(t), rot); let x = ax + o[0], y = ay + o[1];
    const um = E.firme(tramo(t, T.cierre, T.cierre + 0.8));
    if (um > 0) { x = mezcla(x, c.slot[0], um); y = mezcla(y, c.slot[1], um); rot = mezcla(rot, 0, um); const o2 = rotv(0, c.ofs(t), rot); ax = x - o2[0]; ay = y - o2[1]; }
    return { ax, ay, x, y, rot, um };
  }

  // ── la cámara: la de la versión 2D, con perspectiva ──
  let CAM = [], W = 0, H = 0, base = 1;
  function camara2d(t) {
    let i = 0; while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
    const a = CAM[i], b = CAM[i + 1], u = E.seno(tramo(t, a[0], b[0]));
    const c = { x: mezcla(a[1], b[1], u), y: mezcla(a[2], b[2], u), z: mezcla(a[3], b[3], u) };
    if (W < H) { const q = E.seno(tramo(t, T.sube, T.subeFin)); c.z *= mezcla(0.8, 1, q); c.x = mezcla(c.x * 0.4, c.x, q); }
    return c;
  }

  // ── el plató ─────────────────────────────────────────────────────
  const renderer = ctx.renderer;
  const escena = new T3.Scene();
  const camara = new T3.PerspectiveCamera(24, 1, 10, 20000);
  escena.environment = ctx.entorno;                                  // el plató compartido de la página
  escena.add(new T3.HemisphereLight(0xffffff, NOCHE ? 0x202634 : 0xd8dee9, NOCHE ? 0.35 : 0.25));
  const clave = NOCHE ? new T3.SpotLight(0xfff4e8, 3.4, 0, 0.36, 0.85, 0) : new T3.DirectionalLight(0xffffff, 2.0);
  clave.castShadow = true; clave.shadow.mapSize.set(2048, 2048); clave.shadow.bias = -0.0003; clave.shadow.normalBias = 0.8; clave.shadow.radius = 5;
  if (NOCHE) Object.assign(clave.shadow.camera, { near: 300, far: 5000 });
  else Object.assign(clave.shadow.camera, { left: -620, right: 620, top: 620, bottom: -620, near: 10, far: 4000 });
  escena.add(clave, clave.target);
  const contra = new T3.DirectionalLight(NOCHE ? 0x8fc3ff : 0xffffff, NOCHE ? 0.9 : 0.35); escena.add(contra, contra.target);   // luz de recorte, por detrás
  const suelo = new T3.Mesh(new T3.PlaneGeometry(14000, 14000), NOCHE ? new T3.MeshStandardMaterial({ color: 0x080a0f, roughness: 0.82, metalness: 0, envMapIntensity: 0.12 }) : new T3.ShadowMaterial({ color: 0x1B2951, opacity: 0.13 }));
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; escena.add(suelo);
  if (NOCHE) escena.fog = new T3.Fog(COL.fondo, 1000, 4000);

  const esmalte = (hex, o = {}) => new T3.MeshPhysicalMaterial({ color: hex, roughness: NOCHE && hex === COL.tinta ? 0.26 : 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.0, ...o });
  const brillo = (hex) => NOCHE ? { emissive: hex, emissiveIntensity: 0.22 } : {};
  const MAT = { tinta: esmalte(COL.tinta), ion: esmalte(COL.ion, brillo(COL.ion)), cian: esmalte(COL.cian, brillo(COL.cian)), menta: esmalte(COL.menta, brillo(COL.menta)), coral: esmalte(COL.coral, brillo(COL.coral)) };
  const D = F * 0.2, BISEL = { bevelEnabled: true, bevelThickness: 3.5, bevelSize: 2.4, bevelOffset: -2.4, bevelSegments: 5, curveSegments: 1 };
  const extruir = (shapes) => { const g = new T3.ExtrudeGeometry(shapes, { depth: D - 7, ...BISEL }); g.translate(0, 0, -(D - 7) / 2); return g; };

  // polígono desplazado hacia fuera (k > 0) o hacia dentro, con ingletes (entra con y hacia abajo, sale con y hacia arriba)
  function desplazar(pts, k) {
    const n = pts.length, c = pts.reduce((s, q) => [s[0] + q[0] / n, s[1] + q[1] / n], [0, 0]);
    const nor = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy); let nx = dy / m, ny = -dx / m; const mx = (a[0] + b[0]) / 2 - c[0], my = (a[1] + b[1]) / 2 - c[1]; if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; } return [nx, ny]; };
    return pts.map((p, i) => { const n1 = nor(pts[(i - 1 + n) % n], p), n2 = nor(p, pts[(i + 1) % n]); let mx = n1[0] + n2[0], my = n1[1] + n2[1]; const m = Math.hypot(mx, my); mx /= m; my /= m; const cs = mx * n1[0] + my * n1[1]; return new T3.Vector2(p[0] + mx * k / cs, -(p[1] + my * k / cs)); });
  }
  function marco(pts, grueso, prof) {
    const sh = new T3.Shape(desplazar(pts, grueso / 2)); sh.holes.push(new T3.Path(desplazar(pts, -grueso / 2)));
    const g = new T3.ExtrudeGeometry(sh, { depth: prof, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.5, bevelOffset: -0.5, bevelSegments: 2 });
    g.translate(0, 0, -prof / 2); return normalesSuaves(g);
  }
  const cuadrado = (lado) => [[-lado / 2, -lado / 2], [lado / 2, -lado / 2], [lado / 2, lado / 2], [-lado / 2, lado / 2]];

  // el anillo: un toro cuyo radio y grueso cambian en el sombreador
  const toroGeo = (() => { const seg = 240, tub = 24, pos = [], idx = []; for (let i = 0; i <= seg; i++) for (let j = 0; j <= tub; j++) pos.push(i / seg * Math.PI * 2, j / tub * Math.PI * 2, 0);
    for (let i = 0; i < seg; i++) for (let j = 0; j < tub; j++) { const a = i * (tub + 1) + j, b = a + tub + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.boundingSphere = new T3.Sphere(new T3.Vector3(), 1e5); return g; })();
  const toroU = { uR: { value: 50 }, uTubo: { value: 10 } }, sombraU = { uR: toroU.uR, uTubo: { value: 10 } };
  const TORO = 'vec3 transformed = vec3((uR + uTubo * cos(position.y)) * cos(position.x), (uR + uTubo * cos(position.y)) * sin(position.x), uTubo * sin(position.y));';
  const matToro = esmalte(COL.tinta);
  matToro.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, toroU);
    sh.vertexShader = 'uniform float uR, uTubo;\n' + sh.vertexShader
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(cos(position.x) * cos(position.y), sin(position.x) * cos(position.y), sin(position.y));')
      .replace('#include <begin_vertex>', TORO);
  };
  const toro = new T3.Mesh(toroGeo, matToro); toro.castShadow = true; toro.receiveShadow = true; escena.add(toro);
  toro.customDepthMaterial = new T3.MeshDepthMaterial({ depthPacking: T3.RGBADepthPacking });
  toro.customDepthMaterial.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, sombraU); sh.vertexShader = 'uniform float uR, uTubo;\n' + sh.vertexShader.replace('#include <begin_vertex>', TORO); };

  // el punto: una esfera ámbar que da luz cálida a lo que tiene cerca
  const matPunto = new T3.MeshPhysicalMaterial({ color: COL.ambar, emissive: COL.ambar, emissiveIntensity: 0.9, roughness: 0.22, clearcoat: 1, transparent: true });
  const esfera = new T3.Mesh(new T3.SphereGeometry(1, 48, 32), matPunto); esfera.castShadow = true; escena.add(esfera);
  const luzPunto = new T3.PointLight(0xffa726, 2.4, NOCHE ? 330 : 240, 0); escena.add(luzPunto);
  const brilloLuz = new T3.PointLight(0x9fe6ff, 0, 160, 0); escena.add(brilloLuz);
  let halo = null;
  if (NOCHE) {                                                          // de noche, el punto tiene halo
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,200,110,.9)'); g.addColorStop(0.22, 'rgba(245,158,11,.32)'); g.addColorStop(1, 'rgba(245,158,11,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace;
    halo = new T3.Sprite(new T3.SpriteMaterial({ map: tx, blending: T3.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); escena.add(halo);
  }

  // cuerdas: líneas finas que se comban cuando van flojas
  const NC = 18;
  const cuerda = (op = 0.8) => { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(new Float32Array(NC * 3), 3)); const m = new T3.Line(g, new T3.LineBasicMaterial({ color: COL.cuerda, transparent: true, opacity: op })); m.frustumCulled = false; m.visible = false; escena.add(m); return m; };
  function tender(ln, a, b, comba = 0, vib = 0) {
    const p = ln.geometry.attributes.position, dx = b.x - a.x, dy = b.y - a.y, m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m;
    for (let i = 0; i < NC; i++) { const s = i / (NC - 1), o = vib * Math.sin(Math.PI * s); p.setXYZ(i, mezcla(a.x, b.x, s) + nx * o, mezcla(a.y, b.y, s) - comba * 4 * s * (1 - s) + ny * o, mezcla(a.z, b.z, s)); }
    p.needsUpdate = true; ln.visible = true;
  }
  const linea = (hex, padre) => { const g = new T3.BufferGeometry().setFromPoints([new T3.Vector3(), new T3.Vector3()]); const m = new T3.Line(g, new T3.LineBasicMaterial({ color: hex, transparent: true })); m.frustumCulled = false; m.visible = false; padre.add(m); return m; };
  const ponerLinea = (ln, a, b, op = 1) => { const p = ln.geometry.attributes.position; p.setXYZ(0, a[0], -a[1], a[2] || 0); p.setXYZ(1, b[0], -b[1], b[2] || 0); p.needsUpdate = true; ln.material.opacity = op; ln.visible = op > 0.01; };

  // el logo como grupo: conectores, lecturas y punto menta, todo gira con el móvil
  const logo = new T3.Group(); escena.add(logo);
  let letraC, marca = [], hiloGrua, ganchoGrua, mentaM;
  function montar() {
    const malla = (geo, mat, sombra = true) => { const m = new T3.Mesh(geo, mat); m.castShadow = sombra; m.receiveShadow = true; return m; };
    const geoC = normalesSuaves(extruir(trazar(L[0]).shapes));
    letraC = malla(geoC, MAT.tinta.clone()); letraC.material.transparent = true; escena.add(letraC);
    const GEO = { C: geoC };
    for (const l of L.slice(1)) GEO[l.ch] = normalesSuaves(extruir(trazar(l).shapes));
    marca = L.map((l) => { const m = malla(GEO[l.ch], MAT.tinta); escena.add(m); return m; });
    for (const l of L.slice(1)) {
      const p = PIEZAS[l.ch], c = { l, p, ch: l.ch, cuerpo: new T3.Group() };
      c.entera = malla(GEO[l.ch], MAT.tinta); c.cuerpo.add(c.entera);
      // los trozos: la letra cortada por sus trazos, cada uno con su eje principal a lo largo de x
      c.trozos = cortes(l).map((reg, k) => {
        const tz = trazar(l, reg), g = extruir(tz.shapes); g.translate(-tz.c.x, -tz.c.y, 0); g.rotateZ(-tz.a); normalesSuaves(g);
        const nodo = new T3.Group(), m = malla(g, MAT.tinta); nodo.add(m); c.cuerpo.add(nodo);
        return { ...tz, nodo, k, sg: k % 2 ? 1 : -1, zx: (k % 3 - 1) * 30 + 14, gira: k % 2 ? 'y' : 'x' };
      });
      // a qué lado de la pieza va cada trozo: se ordenan por ángulo alrededor del centro y se elige el giro que menos los mueve
      const v = p.local.map(([x, y]) => [x, -y]), lados = v.map((a, i) => { const b = v[(i + 1) % v.length]; return { m: new T3.Vector2((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), b: Math.atan2(b[1] - a[1], b[0] - a[0]), L: Math.hypot(b[0] - a[0], b[1] - a[1]) }; });
      const n = c.trozos.length, angT = c.trozos.map((q, i) => [i, Math.atan2(q.c.y, q.c.x)]).sort((a, b) => a[1] - b[1]), angL = lados.map((q, i) => [i, Math.atan2(q.m.y, q.m.x)]).sort((a, b) => a[1] - b[1]);
      let mejor = 0, coste = Infinity;
      for (let s = 0; s < n; s++) { let cs = 0; for (let k = 0; k < n; k++) { const q = c.trozos[angT[k][0]], ld = lados[angL[(k + s) % n][0]]; cs += (q.c.x * ESC_IN - ld.m.x) ** 2 + (q.c.y * ESC_IN - ld.m.y) ** 2; } if (cs < coste) { coste = cs; mejor = s; } }
      for (let k = 0; k < n; k++) {
        const q = c.trozos[angT[k][0]], ld = lados[angL[(k + mejor) % n][0]];
        q.lado = ld; q.delta = ((ld.b - q.a) % Math.PI + Math.PI * 1.5) % Math.PI - Math.PI / 2;
        q.sx = (ld.L + TH) / q.largo; q.sy = TH / q.ancho; q.sz = PROF / D;
      }
      // la pieza ya montada: el marco limpio y una placa translúcida
      c.pieza = new T3.Group(); c.pieza.add(malla(marco(p.local, TH, PROF), MAT[p.col], false));
      c.placa = new T3.Mesh(new T3.ShapeGeometry(new T3.Shape(desplazar(p.local, 0))), new T3.MeshBasicMaterial({ color: COL[p.col], transparent: true, opacity: 0, depthWrite: false, side: T3.DoubleSide }));
      c.pieza.add(c.placa); c.cuerpo.add(c.pieza); escena.add(c.cuerpo);
      // su conector y su cuadradito, su lectura
      c.conG = new T3.Group(); c.con = malla(new T3.BoxGeometry(1, 2.2, 3), MAT[p.ccol], false); c.cuad = malla(marco(cuadrado(3.7 * K), 1.6, 3), MAT[p.ccol], false);
      c.conG.add(c.con, c.cuad); logo.add(c.conG);
      c.lec = linea(COL[p.ccol], logo); c.aro = new T3.Mesh(new T3.TorusGeometry(1, 0.03, 8, 72), new T3.MeshBasicMaterial({ color: COL[p.ccol], transparent: true, depthWrite: false })); logo.add(c.aro);
      c.cuerda = cuerda(); if (ESLINGA[l.ch]) c.patas = [cuerda(0.75), cuerda(0.75)]; c.gancho = malla(new T3.SphereGeometry(2.1, 16, 12), new T3.MeshBasicMaterial({ color: COL.cuerda }), false); escena.add(c.gancho);
      c.slot = [LC[0] + p.centro[0], LC[1] + p.centro[1]];
      CU[l.ch] = c;
    }
    // quién cuelga de dónde, y el largo final de cada cuerda para que la pieza quede en su sitio
    for (const ch of ORDEN) {
      const c = CU[ch], l = c.l;
      // la U y la V tienen la parte de arriba hueca: se cogen con una eslinga de dos ramales, uno a cada brazo
      c.HS = ESLINGA[ch] ? ESLINGA[ch][0] * l.w : 0; c.XS = ESLINGA[ch] ? ESLINGA[ch][1] * l.w : 0;
      c.p0 = [l.cx, l.cy - l.hl - c.HS];
      c.esc = (t) => mezcla(1, ESC_IN, E.eio(tramo(t, c.tS, c.tS + 1.1)));
      c.f = (t) => E.eio(tramo(t, c.tD + 0.3, c.tP));
      c.hs = (t) => c.HS * c.esc(t) * (1 - c.f(t)); c.xs = (t) => c.XS * c.esc(t) * (1 - c.f(t));
      c.ofs = (t) => mezcla(l.hl * c.esc(t), c.p.arriba, c.f(t)) + c.hs(t);
      if (PADRE[ch]) {
        const P = CU[PADRE[ch]]; c.padre = P; c.dx = c.slot[0] - P.slot[0];
        const abajo = bordeAbajo(P.p.local, c.dx); P.hb = (t) => mezcla(P.l.hl * P.esc(t), abajo, P.f(t));
        c.pivF = [P.slot[0] + c.dx, P.slot[1] + abajo];
      } else { const x = c.p.centro[0]; c.piv = [LC[0] + x, LC[1] - Math.sqrt(RIN * RIN - x * x)]; c.pivF = c.piv; }
      c.lf = (c.slot[1] - c.p.arriba) - c.pivF[1];
      c.lfL = c.lf + c.p.arriba - (l.hl + c.HS) * ESC_IN;
      c.largo = (t) => mezcla(c.l0, c.lfL, E.eio(tramo(t, c.tS + 0.1, c.tS + IZADO))) + (c.lf - c.lfL) * c.f(t);
    }
    hiloGrua = cuerda(0.9);
    ganchoGrua = malla(new T3.TorusGeometry(4.2, 1.1, 10, 24, Math.PI * 1.5), new T3.MeshStandardMaterial({ color: COL.cuerda, roughness: 0.4, metalness: 0.6 }), false); escena.add(ganchoGrua);
    mentaM = malla(new T3.SphereGeometry(1, 32, 24), esmalte(COL.menta, { emissive: COL.menta, emissiveIntensity: NOCHE ? 0.5 : 0.2 }), false); logo.add(mentaM);
  }

  // orientar y colocar: giro del móvil (vertical) · giro en el plano · giro sobre su cuerda
  const EJE_Y = new T3.Vector3(0, 1, 0), EJE_Z = new T3.Vector3(0, 0, 1), qa = new T3.Quaternion(), v3 = new T3.Vector3(), v3b = new T3.Vector3(), v3c = new T3.Vector3(), v3d = new T3.Vector3();
  function orientar(m, ps, rot, phi) { m.quaternion.setFromAxisAngle(EJE_Y, ps); qa.setFromAxisAngle(EJE_Z, -rot); m.quaternion.multiply(qa); qa.setFromAxisAngle(EJE_Y, phi); m.quaternion.multiply(qa); }
  function enMovil(v, x, y, z, ps) { const dx = x - LC[0]; return v.set(LC[0] + dx * Math.cos(ps) + z * Math.sin(ps), -y, -dx * Math.sin(ps) + z * Math.cos(ps)); }
  function colocar(m, c, { px = c[0], py = c[1], sx = 1, sy = 1, sz = 1, rot = 0 } = {}) {
    const ox = c[0] - px, oy = c[1] - py, cs = Math.cos(rot), sn = Math.sin(rot);
    m.position.set(px + cs * ox * sx - sn * oy * sy, -(py + sn * ox * sx + cs * oy * sy), 0); m.rotation.set(0, 0, -rot); m.scale.set(sx, sy, sz);
  }
  // una letra que nace en el suelo (rebote y bamboleo); devuelve escala y giro
  function nacer(l, t) {
    const u = tramo(t, l.nace - 0.02, l.nace + 0.85), s = E.rebote(u), sy = Math.max(0.001, s), sx = 1 + (1 - Math.min(1.15, sy)) * 0.55 * (u < 0.5 ? 1 : 0.6);
    return { u, sx, sy, rot: Math.sin(u * 9) * Math.exp(-u * 5) * 0.06 * (l.i % 2 ? 1 : -1) };
  }

  // ── cada fotograma ────────────────────────────────────────────────
  function fotograma(t) {
    const ps = psi(t);
    logo.position.set(LC[0], -LC[1], 0); logo.rotation.set(0, ps, 0);
    // la C: nace, recibe el punto y gira hasta ser el anillo
    {
      const l = L[0], n = nacer(l, t); let { sx, sy, rot } = n, px = l.cx, py = 0, a = 1;
      if (t > T.enC) { const w = tramo(t, T.enC, T.enC + 0.7); rot += Math.sin(w * 14) * Math.exp(-w * 5) * 0.09; const q = 1 - E.rebote(tramo(t, T.enC, T.enC + 0.5)); sx *= 1 + q * 0.05; sy *= 1 - q * 0.07; }
      if (t > T.gira) { const w = tramo(t, T.gira, T.anillo + 0.2); rot += E.ei(w) * Math.PI * 2 * 2.6; py = l.cy; a = 1 - E.eo(tramo(t, T.anillo - 0.12, T.anillo + 0.12)); }
      letraC.visible = n.u > 0 && a > 0.01; letraC.material.opacity = a; letraC.material.depthWrite = a > 0.99; letraC.castShadow = a > 0.4;
      colocar(letraC, [l.cx, l.cy], { px, py, sx, sy, sz: Math.min(1, 0.4 + sy * 0.6), rot });
    }
    // el anillo y la grúa que lo iza
    const an = anillo(t), ap = E.eo(tramo(t, T.anillo - 0.12, T.anillo + 0.1));
    toro.visible = t > T.anillo - 0.12; toroU.uR.value = an.r; toroU.uTubo.value = (an.w / 2) * Math.max(0.05, ap);
    sombraU.uTubo.value = toroU.uTubo.value * (1 - E.seno(tramo(t, T.sube + 0.2, T.subeFin + 0.4)));     // en el aire su sombra se desvanece
    toro.position.set(an.x, -an.y, 0); toro.rotation.set(0, ps, 0);
    const arriba = v3.set(an.x, -an.y + an.r + an.w / 2, 0), cielo = 3200;
    const ub = E.eo(tramo(t, T.baja, T.engancha)), ur = E.eio(tramo(t, T.cierre + 0.5, T.cierre + 1.3));
    hiloGrua.visible = ganchoGrua.visible = t > T.baja && ur < 1;
    if (hiloGrua.visible) {
      const yG = mezcla(cielo, arriba.y, ub) + mezcla(0, cielo, ur) + (t < T.engancha ? Math.sin(Math.PI * tramo(t, T.engancha - 0.12, T.engancha)) * -4 : 0);
      tender(hiloGrua, v3b.set(arriba.x, yG + 4, 0), v3c.set(arriba.x, cielo + 400, 0));
      ganchoGrua.position.set(arriba.x, yG + 1, 0); ganchoGrua.rotation.set(0, ps, Math.PI * 0.75);
    }
    // el destello final: una luz fría que da la vuelta al anillo
    const ubr = tramo(t, T.brillo, T.brillo + 1.1);
    brilloLuz.intensity = ubr > 0 && ubr < 1 ? 4 * Math.sin(Math.PI * ubr) : 0;
    if (brilloLuz.intensity > 0) { const a0 = Math.PI / 2 - E.eio(ubr) * Math.PI * 2; brilloLuz.position.set(an.x + Math.cos(a0) * an.r * 1.08, -an.y + Math.sin(a0) * an.r * 1.08, 34); }

    // las letras colgadas
    for (const ch of ORDEN) {
      const c = CU[ch], l = c.l, cu = c.cuerpo;
      c.conG.visible = false; c.lec.visible = false; c.aro.visible = false; c.cuerda.visible = false; c.gancho.visible = false; if (c.patas) { c.patas[0].visible = c.patas[1].visible = false; }
      const n = nacer(l, t);
      if (n.u <= 0) { cu.visible = false; continue; }
      cu.visible = true;
      if (t < c.tS) {                                                   // en el suelo: nace y, cuando llega el gancho, se agacha para saltar
        const q = Math.sin(Math.PI * tramo(t, c.clic - 0.05, c.tS));
        colocar(cu, [l.cx, l.cy], { px: l.cx, py: 0, sx: n.sx * (1 + 0.1 * q), sy: n.sy * (1 - 0.14 * q), sz: Math.min(1, 0.4 + n.sy * 0.6), rot: n.rot });
        c.entera.visible = true; c.entera.scale.setScalar(1); c.entera.position.set(0, 0, 0); c.entera.rotation.set(0, 0, 0);
        c.trozos.forEach((q2) => { q2.nodo.visible = false; }); c.pieza.visible = false;
      } else {
        const s = estado(c, t), w = E.seno(tramo(t, c.tS, c.tS + 1.2)), dt = t - c.tS;
        let z = 64 * E.eo(tramo(t, c.tS, c.tS + 0.45)) * (1 - E.seno(tramo(t, c.tS + 1.1, c.tS + 2.0)));
        z += 12 * Math.sin(Math.PI * tramo(t, c.llega, c.llega + 0.4));                 // al leerla, la pieza se asoma
        const phi = (1.35 * Math.exp(-dt / 1.0) * Math.sin(5.2 * dt) * E.eo(tramo(dt, 0, 0.2)) + 0.16 * Math.sin(1.7 * t + l.i) * E.seno(tramo(dt, 0.4, 1.6))) * (1 - s.um);
        enMovil(cu.position, s.x, s.y, z, ps * w); orientar(cu, ps * w, s.rot, phi); cu.scale.setScalar(1);
        const esc = c.esc(t);
        c.entera.visible = t < c.tD; c.entera.scale.setScalar(esc); c.entera.rotation.z = 0.05 * Math.sin(t * 90) * Math.sin(Math.PI * tramo(t, c.tD - 0.16, c.tD));   // tiembla antes de despiezarse
        // el despiece: los trozos se separan, dan volteretas y se montan en la pieza
        const montando = t >= c.tD && t < c.tP; c.pieza.visible = t >= c.tP;
        const ue = E.eo(tramo(t, c.tD, c.tD + 0.32));
        for (const q of c.trozos) {
          q.nodo.visible = montando; if (!montando) continue;
          const ua = E.firme(tramo(t, q.t0, q.t0 + 0.7)), ul = E.eio(tramo(t, q.t0, q.t0 + 0.7)), uv = E.eio(tramo(t, q.t0, q.t0 + 0.6));
          const out = q.c.clone().normalize().multiplyScalar(30 * ue);
          q.nodo.position.set(mezcla(q.c.x * esc + out.x, q.lado.m.x, ua), mezcla(q.c.y * esc + out.y, q.lado.m.y, ua), q.zx * ue * (1 - ul) + 16 * q.sg * Math.sin(Math.PI * ul));
          const vuelta = Math.PI * 2 * uv * q.sg, temblor = 0.25 * q.sg * ue * (1 - ul);
          q.nodo.rotation.set(q.gira === 'x' ? vuelta : temblor, q.gira === 'y' ? vuelta : 0, mezcla(q.a, q.a + q.delta, ua), 'ZYX');
          q.nodo.scale.set(mezcla(esc, q.sx, ul), mezcla(esc, q.sy, ul), mezcla(esc, q.sz, ul));
        }
        if (c.pieza.visible) { const pu = 1 + 0.1 * Math.sin(Math.PI * tramo(t, c.tP, c.tP + 0.3)); c.pieza.scale.setScalar(pu); c.placa.material.opacity = 0.09 * E.eo(tramo(t, c.tP, c.tP + 0.5)); }
      }
    }
    // las cuerdas (después de colocar a todos: la U cuelga de la A y la V de la E)
    escena.updateMatrixWorld();
    for (const ch of ORDEN) {
      const c = CU[ch], l = c.l;
      if (t < c.tBaja) continue;
      const desde = c.padre ? c.padre.cuerpo.localToWorld(v3b.set(c.dx, -c.padre.hb(t), 0)) : enMovil(v3b, c.piv[0], c.piv[1] + peso(t), 0, ps);
      let hasta, comba = 0;
      if (t < c.clic) { const u = E.eo(tramo(t, c.tBaja, c.clic)); hasta = v3c.set(l.cx, -(l.cy - l.hl) + c.HS, 0); hasta.lerpVectors(desde, hasta, u); }
      else {
        hasta = t < c.tS ? v3c.set(l.cx, -(l.cy - l.hl) + c.HS + 2, 0) : c.cuerpo.localToWorld(v3c.set(0, c.ofs(t), 0));
        if (t >= c.tS) { const d = desde.distanceTo(hasta), ell = c.largo(t); comba = Math.sqrt(Math.max(0, ell * ell - d * d)) * 0.45 * (1 - tramo(t, T.cierre, T.cierre + 0.3)); }
        const ur = E.eio(tramo(t, T.cierre + 0.15, T.cierre + 0.6)); if (ur >= 1) continue;
        hasta.lerp(desde, ur);
      }
      tender(c.cuerda, desde, hasta, comba, vibra(c, t)); c.gancho.visible = true; c.gancho.position.copy(hasta);
      // los dos ramales de la eslinga, del gancho a lo alto de cada brazo (se recogen al montarse la pieza)
      if (c.patas && t >= c.clic && c.f(t) < 0.97) for (let k = 0; k < 2; k++) {
        const sx = k ? 1 : -1, pie = t < c.tS ? v3d.set(l.cx + sx * c.XS, -(l.cy - l.hl), 0) : c.cuerpo.localToWorld(v3d.set(sx * c.xs(t), c.ofs(t) - c.hs(t), 0));
        tender(c.patas[k], hasta, pie, 0, 0);
      }
    }
    // posadas: conector, cuadradito y lectura del punto
    for (const ch of ORDEN) {
      const c = CU[ch], p = c.p, cen = p.centro;
      const uc = E.eo(tramo(t, c.llega + 0.1, c.llega + 0.32));
      if (uc > 0) {
        c.conG.visible = true;
        const c0 = p.con[0], c1 = p.con[1], dx = c1[0] - c0[0], dy = c1[1] - c0[1], Lc = Math.hypot(dx, dy) * uc + 1.2;
        c.con.scale.set(Lc, 1, 1); c.con.rotation.z = -Math.atan2(dy, dx); c.con.position.set(c0[0] + dx * uc / 2, -(c0[1] + dy * uc / 2), 0);
        const uq = E.vivo(tramo(t, c.llega + 0.26, c.llega + 0.66)); c.cuad.visible = uq > 0.01; c.cuad.scale.setScalar(Math.max(0.01, uq)); c.cuad.rotation.z = (1 - uq) * 1.2; c.cuad.position.set(p.cuad[0], -p.cuad[1], 0);
      }
      const ul = tramo(t, c.llega + 0.05, c.llega + 0.6);
      if (ul > 0 && ul < 1) {
        const av = E.eo(Math.min(1, ul * 2.2)); ponerLinea(c.lec, [0, 0, 4], [cen[0] * av, cen[1] * av, 4], 0.9 * (1 - ul));
        c.aro.visible = true; c.aro.position.set(cen[0], -cen[1], 4); c.aro.scale.setScalar(26 + ul * 30); c.aro.material.opacity = 0.55 * (1 - ul);
      }
    }
    // el punto menta
    const um = E.vivo(tramo(t, T.menta, T.menta + 0.5)); mentaM.visible = um > 0.01; mentaM.scale.setScalar(Math.max(0.01, 3.7 * K * um)); mentaM.position.set(MENTA[0], -MENTA[1], 0);
    // el punto ámbar
    const pt = punto(t), enLogo = E.suave(tramo(t, T.sube, T.subeFin)), r = mezcla(7.5, 1.8 * K * 1.3, enLogo);
    let late = 1; for (const ch of ORDEN) { late += 0.6 * Math.sin(Math.PI * tramo(t, CU[ch].llega, CU[ch].llega + 0.3)) + 0.3 * Math.sin(Math.PI * tramo(t, CU[ch].tP, CU[ch].tP + 0.3)); }
    late += 0.8 * Math.sin(Math.PI * tramo(t, T.menta, T.menta + 0.35));
    esfera.visible = pt.a > 0.01; esfera.castShadow = t < T.gira; esfera.position.set(pt.x, -pt.y, 0); esfera.rotation.set(0, 0, -pt.rot); esfera.scale.set(r * pt.sx * late, r * pt.sy * late, r * Math.min(pt.sx, pt.sy) * late);
    matPunto.emissiveIntensity = (NOCHE ? 1.2 : 0.7) + 0.5 * (late - 1); matPunto.opacity = pt.a;
    luzPunto.position.set(pt.x, -pt.y, 22); luzPunto.intensity = (NOCHE ? 3.4 : 2.6) * pt.a * mezcla(1, 0.6, enLogo) * late;
    if (halo) { halo.visible = esfera.visible; halo.position.copy(esfera.position); halo.position.z += 2; halo.scale.setScalar(r * 9 * late); halo.material.opacity = pt.a * 0.85; }
    // la marca, que vuelve a nacer en el suelo, letra a letra
    const sc = 0.62;
    L.forEach((l, i) => {
      const m = marca[i], u = tramo(t, T.marca + i * 0.08, T.marca + 0.8 + i * 0.08);
      m.visible = u > 0; if (!m.visible) return;
      const s = Math.max(0.001, E.rebote(u)), sx = 1 + (1 - Math.min(1.15, s)) * 0.45;
      colocar(m, [l.cx * sc, l.cy], { px: l.cx * sc, py: 0, sx: sc * sx, sy: sc * s, sz: sc * Math.min(1, 0.4 + s * 0.6) });
    });
  }

  // ── cámara, luces y lema ──
  const lema = ctx.raiz.querySelector('.lema'), mira = new T3.Vector3();
  function encuadrar(t) {
    const c = camara2d(t), z = base * c.z, alto = H / z, fov = camara.fov * Math.PI / 180, dist = (alto / 2) / Math.tan(fov / 2);
    // de lado al principio, para leer el volumen; luego la cámara rodea despacio el móvil y se pone de frente para el cierre
    let lado = mezcla(-0.42, -0.1, E.seno(tramo(t, 0.4, T.anillo)));
    lado = mezcla(lado, 0.2, E.seno(tramo(t, T.subeFin - 0.6, T.subeFin + 3.2)));
    lado = mezcla(lado, 0, E.seno(tramo(t, T.cierre - 0.8, T.cierre + 0.6))) + 0.05 * E.seno(tramo(t, T.marca, T.fin + 1));
    const deriva = lado + Math.sin(t * 0.23) * 0.02 + Math.sin(t * 0.11) * 0.012;
    const el = mezcla(0.2, 0.08, E.seno(tramo(t, 0.4, T.subeFin))) + 0.04 * E.seno(tramo(t, T.marca, T.fin + 1));
    mira.set(c.x, -c.y, 0);
    camara.position.set(c.x + Math.sin(deriva) * dist, -c.y + dist * Math.sin(el), dist * Math.cos(el) * Math.cos(deriva)); camara.lookAt(mira);
    camara.near = dist * 0.1; camara.far = dist * 8; camara.updateProjectionMatrix();
    if (escena.fog) { escena.fog.near = dist * 1.1; escena.fog.far = dist * 2.6; }
    if (NOCHE) { clave.position.set(c.x - 460, 1800, 640); clave.target.position.set(c.x, Math.max(0, -c.y) * 0.45, 0); }
    else { clave.position.set(c.x - 520, 1400, 1000); clave.target.position.set(c.x, Math.max(0, -c.y) * 0.5, 0); }
    contra.position.set(c.x + 400, 900, -1400); contra.target.position.set(c.x, -c.y, 0);
    const ul = E.eo5(tramo(t, T.marca + 0.6, T.marca + 1.5));
    if (ul > 0) {
      v3.set(0, 0, D * 0.62 * 0.62).project(camara);
      const x = (v3.x * 0.5 + 0.5) * W, y = (-v3.y * 0.5 + 0.5) * H + 30 + (1 - ul) * 8;
      lema.style.opacity = ul; lema.style.letterSpacing = `${mezcla(0.06, 0.24, ul)}em`; lema.style.transform = `translate(${x}px, ${y}px) translateX(-50%)`;
    } else lema.style.opacity = 0;
  }
  function medir(w, h) {
    W = w; H = h; camara.aspect = W / H; camara.updateProjectionMatrix();
    base = Math.min(W * (W < H ? 0.84 : 0.5) / ancho, H * 0.74 / (RL * 2 + 300));
    lema.style.fontSize = `${Math.max(10, Math.min(15, W / 42))}px`;
  }

  // ── sonido: todo sintetizado, al compás del guion ──
  let audio = null, sonido = false, eventos = [];
  const NOTAS = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];       // pentatónica de do
  function voz(tipo, o = {}) {
    if (!audio) return; const a = audio, t0 = a.currentTime + 0.005, out = a.destino;
    const env = (g, at, dec, pico) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(pico, t0 + at); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dec); };
    const osc = (tp, f) => { const q = a.createOscillator(); q.type = tp; q.frequency.value = f; return q; };
    const ruido = () => { const n = a.createBufferSource(); n.buffer = a.ruido; return n; };
    if (tipo === 'bote') { const q = osc('sine', o.f || 520), g = a.createGain(); q.frequency.exponentialRampToValueAtTime((o.f || 520) * 0.42, t0 + 0.11); env(g, 0.003, 0.15, o.v || 0.3); q.connect(g).connect(out); q.start(t0); q.stop(t0 + 0.2); }
    if (tipo === 'nace') { const q1 = osc('triangle', o.f), q2 = osc('sine', o.f * 2.005), g = a.createGain(); env(g, 0.005, 0.5, o.v || 0.2); q1.connect(g); q2.connect(g); g.connect(out); q1.start(t0); q2.start(t0); q1.stop(t0 + 0.6); q2.stop(t0 + 0.6); }
    if (tipo === 'soplo') { const n = ruido(), f = a.createBiquadFilter(), g = a.createGain(), d = o.d || 0.6; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(o.f0 || 300, t0); f.frequency.exponentialRampToValueAtTime(o.f1 || 2400, t0 + d); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.v || 0.18, t0 + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); n.connect(f).connect(g).connect(out); n.start(t0); n.stop(t0 + d + 0.05); }
    if (tipo === 'cuerda') { const q = osc('triangle', o.f || 196), q2 = osc('sine', (o.f || 196) * 3.01), g = a.createGain(); q.frequency.exponentialRampToValueAtTime((o.f || 196) * 0.985, t0 + 0.5); env(g, 0.002, 0.55, o.v || 0.14); q.connect(g); q2.connect(g); g.connect(out); q.start(t0); q2.start(t0); q.stop(t0 + 0.6); q2.stop(t0 + 0.6); }
    if (tipo === 'campana') { [1, 2.76, 5.4, 8.93].forEach((k, i) => { const q = osc('sine', (o.f || 880) * k), g = a.createGain(), d = (o.d || 1.6) / (1 + i * 0.8); env(g, 0.002, d, (o.v || 0.16) / (1 + i * 1.6)); q.connect(g).connect(out); q.start(t0); q.stop(t0 + d + 0.1); }); }
    if (tipo === 'clic') { const n = ruido(), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = o.f || 3000; env(g, 0.001, 0.035, o.v || 0.22); n.connect(f).connect(g).connect(out); n.start(t0); n.stop(t0 + 0.05); }
    if (tipo === 'madera') { const q = osc('sine', o.f || 900), g = a.createGain(); q.frequency.exponentialRampToValueAtTime((o.f || 900) * 0.8, t0 + 0.06); env(g, 0.001, 0.09, o.v || 0.16); q.connect(g).connect(out); q.start(t0); q.stop(t0 + 0.12); }
    if (tipo === 'acorde') { [261.63, 392, 493.88, 587.33, 783.99].forEach((fq, i) => { const q = osc('sawtooth', fq), g = a.createGain(), f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(500, t0); f.frequency.exponentialRampToValueAtTime(1800, t0 + 1.2); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.03, t0 + 0.35 + i * 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4); q.connect(f).connect(g).connect(out); q.start(t0); q.stop(t0 + 3.5); }); }
  }
  function prepararEventos() {
    eventos = [[T.aparece, 'nace', { f: 1046.5, v: 0.08 }], [T.cae + 0.22, 'bote', { f: 420 }]];
    L.forEach((l, i) => eventos.push([l.nace, 'bote', { f: 560 + i * 40 }], [l.nace + 0.01, 'nace', { f: NOTAS[i] / 2 }]));
    eventos.push([VUELO.t0, 'soplo', { f0: 250, f1: 1800, d: 0.9, v: 0.1 }], [T.enC, 'bote', { f: 300, v: 0.35 }], [T.gira, 'soplo', { f0: 180, f1: 3400, d: 0.75, v: 0.14 }], [T.anillo, 'campana', { f: 523.25, d: 2.4, v: 0.16 }]);
    eventos.push([T.baja, 'soplo', { f0: 2600, f1: 500, d: 0.42, v: 0.07 }], [T.engancha, 'clic', { f: 1800, v: 0.3 }], [T.engancha + 0.02, 'cuerda', { f: 130.8, v: 0.16 }], [T.sube, 'soplo', { f0: 220, f1: 1400, d: 1.3, v: 0.09 }]);
    for (const ch of ORDEN) {
      const c = CU[ch];
      eventos.push([c.tBaja, 'soplo', { f0: 2800, f1: 700, d: 0.42, v: 0.05 }], [c.clic, 'clic', { f: 2200, v: 0.2 }], [c.tS, 'bote', { f: 640, v: 0.2 }], [c.tS + 0.4, 'cuerda', { f: { A: 196, E: 220, U: 246.9, V: 261.6 }[ch], v: 0.13 }]);
      c.trozos.forEach((q, k) => eventos.push([c.tD + k * 0.03, 'clic', { f: 4200, v: 0.1 }], [q.t0 + 0.55, 'madera', { f: 700 + k * 90, v: 0.12 }]));
      eventos.push([c.tP, 'campana', { f: NOTAS[PIEZAS[ch].nota] / 2, d: 0.9, v: 0.07 }]);
    }
    eventos.push([T.cierre + 0.2, 'clic', { f: 2600, v: 0.18 }], [T.cierre + 0.55, 'soplo', { f0: 900, f1: 3000, d: 0.5, v: 0.05 }]);
    for (const ch of ORDEN) eventos.push([CU[ch].llega, 'campana', { f: NOTAS[PIEZAS[ch].nota], d: 1.2, v: 0.1 }]);
    eventos.push([T.menta, 'campana', { f: 1318.5, d: 1.8, v: 0.09 }], [T.giro, 'soplo', { f0: 300, f1: 2600, d: 1.2, v: 0.1 }], [T.giro + 1.1, 'campana', { f: 1046.5, d: 1.6, v: 0.08 }], [T.marca, 'acorde', {}]);
    L.forEach((l, i) => eventos.push([T.marca + i * 0.08, 'nace', { f: NOTAS[i], v: 0.1 }]));
    eventos.sort((a, b) => a[0] - b[0]);
  }
  function activarAudio() {
    if (audio) return;
    const a = new (window.AudioContext || window.webkitAudioContext)(), comp = a.createDynamicsCompressor(), g = a.createGain();
    g.gain.value = 0.9; comp.connect(g).connect(a.destination); a.destino = comp;
    const b = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), dd = b.getChannelData(0); let s = 12345; for (let i = 0; i < dd.length; i++) { s = (s * 16807) % 2147483647; dd[i] = s / 1073741823.5 - 1; } a.ruido = b;
    audio = a;
  }

  // ── reproducción: la apertura va con su propio reloj, no con el scroll ──
  medirPalabra(); LC = [0, -L[2].alto - 44 - RL]; montar(); guion(); prepararEventos();
    const yC = L[0].cy, yM = (LC[1] - RL + 40) / 2, yL = LC[1] + 10;
    CAM = [[0, L[0].cx - 120, -60, 1.1], [T.salta, L[0].cx - 60, -60, 1.06], [L[4].nace, 0, yC, 1.0], [T.enC, L[0].cx * 0.55, yC, 1.06], [T.anillo, L[0].cx * 0.45, yC - 30, 1.0],
      [T.subeFin, 0, yM, 0.9], [T.subeFin + 2.4, 0, yM, 0.9], [CU.A.tD - 0.1, 0, yL, 1.32], [T.cierre + 0.3, 0, yL, 1.38], [T.giro + 1.2, 0, yL, 1.24],
      [T.marca + 0.35, 0, yM, 0.9], [T.fin, 0, yM + 10, 0.92], [T.fin + 10, 0, yM + 10, 0.92]];
  let inicio = null, tPrev = 0, fijo = null;
  // el tiempo de la historia: el punto y el nacimiento de las letras van algo más lentos (×0,92);
  // desde que el punto cae en la C, todo va un poco más ágil (×1,12)
  const LENTO = 0.92, AGIL = 1.12, reloj2t = (r) => { const r1 = T.enC / LENTO; return r < r1 ? r * LENTO : T.enC + (r - r1) * AGIL; };
  medir(ctx.W, ctx.H); fotograma(0); encuadrar(0);
  window.APERTURA = { ir(t) { fijo = t; }, seguir() { fijo = null; inicio = null; }, T: () => T,
    // sonido: se activa con un gesto (el botón de la barra) y reinicia la apertura si aún se ve
    sonido(on) { activarAudio(); audio.resume(); sonido = on; if (on && scrollY < innerHeight * 0.5) { inicio = null; tPrev = 0; } } };
  const html = document.documentElement;
  return { escena, camara, medir,
    actualizar(u, reloj) {
      if (inicio === null) inicio = reloj;
      const t = Math.min(fijo ?? reloj2t(reloj - inicio), T.fin + 0.2);
      if (sonido && fijo == null) for (const [te, tipo, o] of eventos) if (te > tPrev && te <= t) voz(tipo, o);
      tPrev = t;
      fotograma(t); encuadrar(t);
      html.classList.toggle('abierta', t > T.marca + 0.8);
    } };
});

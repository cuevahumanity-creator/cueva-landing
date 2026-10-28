// ─────────────────────────────────────────────────────────────────────
//  Motor de propuestas CUEVA · los dibujos
//  Todo en SVG, en metros, con Inter:
//  · la planta de la propuesta sobre la trama de 0,75 m: estancias, muros con sus huecos,
//    tabiques, nombres y superficies, cotas generales, norte y escala; y, si se pide,
//    las piezas J del forjado encima;
//  · la miniatura de cada alternativa y la vista en vivo de la búsqueda;
//  · el mapa de España (del contorno de CUEVA ORIGEN, con Canarias en recuadro), la
//    parcela con sus retranqueos y el recorrido del sol;
//  · la tabla del despiece y el resumen descargable.
//  Clásico: window.CUEVA_PLANO.
// ─────────────────────────────────────────────────────────────────────
(() => {
  const PASO = 0.75;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (v, d = 0) => { try { return new Intl.NumberFormat('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }).format(v); } catch (e) { return v.toFixed(d).replace('.', ','); } };
  const m2 = (v) => `${num(v, v < 10 ? 1 : 0)} m²`;
  const m = (v) => `${num(v, 2)} m`;
  // color de cada uso: tintas de la marca, sin ámbar (el ámbar es del punto)
  const TINTE = { salon: '#DCEFFB', cocina: '#E3F6F8', principal: '#EEF1F6', dormitorio: '#EEF1F6', estudio: '#EAF0FA', bano: '#DDF3F5', aseo: '#DDF3F5', lavadero: '#E6F2F3', vestidor: '#EEF1F6', vestibulo: '#F3F5F8', paso: '#F6F7F9', escalera: '#E9ECF2', garaje: '#ECEEF2', porche: '#FFFFFF' };

  // nombres cortos para las estancias estrechas
  const CORTO = { principal: () => 'Principal', dormitorio: (n) => n.replace('Dormitorio', 'Dorm.'), bano: () => 'Baño', vestibulo: () => 'Entrada', paso: () => 'Paso', cocina: () => 'Cocina', salon: () => 'Salón', lavadero: () => 'Lavad.', escalera: () => 'Escalera', estudio: () => 'Estudio' };
  // ── la planta ──
  function planta(P, f, op = {}) {
    const W = P.W, H = P.H, g = P.grids[f], mg = op.margen ?? 1.6, Wm = W * PASO, Hm = H * PASO;
    const vb = `${-mg} ${-mg} ${Wm + mg * 2} ${Hm + mg * 2}`;
    const s = [];
    s.push(`<svg class="cf-planta" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(op.titulo || 'Planta')}" font-family="Inter, system-ui, sans-serif">`);
    s.push(`<defs><pattern id="cf-rayado-${f}" width="0.3" height="0.3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="0.3" stroke="#1B2951" stroke-opacity=".18" stroke-width=".03"/></pattern></defs>`);
    // la trama, por toda la lámina
    const tr = [];
    for (let x = 0; x <= W; x++) tr.push(`M${x * PASO} ${-mg * 0.6}V${Hm + mg * 0.6}`);
    for (let y = 0; y <= H; y++) tr.push(`M${-mg * 0.6} ${y * PASO}H${Wm + mg * 0.6}`);
    s.push(`<path class="cf-trama" d="${tr.join('')}" stroke="#1B2951" stroke-opacity=".09" stroke-width=".012" fill="none"/>`);
    // terraza y patio
    const vacios = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = g[y * W + x]; if (v === -2 || v === -3 || v === -4) vacios.push(`M${x * PASO} ${y * PASO}h${PASO}v${PASO}h${-PASO}z`); }
    if (vacios.length) s.push(`<path d="${vacios.join('')}" fill="url(#cf-rayado-${f})" stroke="none"/>`);
    // nombre de cada vacío: patio, terraza o doble altura
    for (const [v, t] of [[-2, 'Patio'], [-3, 'Terraza'], [-4, 'Doble altura']]) {
      let n = 0, sx = 0, sy = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y * W + x] === v) { n++; sx += x + 0.5; sy += y + 0.5; }
      if (n < 4) continue;
      let bx = sx / n, by = sy / n; if (g[Math.floor(by) * W + Math.floor(bx)] !== v) { const c = centroCelda(g, W, H, v); bx = c[0]; by = c[1]; }
      s.push(`<text x="${bx * PASO}" y="${by * PASO}" font-size=".28" font-weight="600" fill="#5B6478" text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-width=".06">${t}</text>`);
    }
    // estancias: sus celdas, unidas
    const porRoom = new Map();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = g[y * W + x]; if (v < 0) continue; if (!porRoom.has(v)) porRoom.set(v, []); porRoom.get(v).push(`M${x * PASO} ${y * PASO}h${PASO + 0.004}v${PASO + 0.004}h${-PASO - 0.004}z`); }
    for (const [i, d] of porRoom) { const r = P.rooms[i]; s.push(`<path class="cf-estancia" data-i="${i}" d="${d.join('')}" fill="${r.t === 'porche' ? `url(#cf-rayado-${f})` : (TINTE[r.t] || '#F1F3F7')}"/>`); }
    // tabiques: aristas entre estancias distintas (la cocina abierta al salón, en discontinua)
    const tab = [], abierto = [];
    const abiertas = (a, b) => { const A = P.rooms[a], B = P.rooms[b]; return (A.t === 'cocina' && A.abierta && B.t === 'salon') || (B.t === 'cocina' && B.abierta && A.t === 'salon') || (A.t === 'paso' && B.t === 'paso'); };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const a = g[y * W + x]; if (a < 0) continue;
      if (x + 1 < W) { const b = g[y * W + x + 1]; if (b >= 0 && b !== a) (abiertas(a, b) ? abierto : tab).push(`M${(x + 1) * PASO} ${y * PASO}v${PASO}`); }
      if (y + 1 < H) { const b = g[(y + 1) * W + x]; if (b >= 0 && b !== a) (abiertas(a, b) ? abierto : tab).push(`M${x * PASO} ${(y + 1) * PASO}h${PASO}`); }
    }
    s.push(`<path d="${tab.join('')}" stroke="#1B2951" stroke-width=".09" stroke-linecap="square" fill="none"/>`);
    if (abierto.length) s.push(`<path d="${abierto.join('')}" stroke="#1B2951" stroke-opacity=".45" stroke-width=".035" stroke-dasharray=".18 .14" fill="none"/>`);
    // muros exteriores con sus huecos
    const muros = P.muros.filter((q) => q.f === f);
    const trazo = [], vent = [], puertas = [];
    for (const q of muros) {
      const L = (q.b - q.a) * PASO, cortes = q.huecos.map((h) => [Math.max(0, h.a), Math.min(L, h.b), h.tipo]).sort((a, b) => a[0] - b[0]);
      const off = q.lado === 'ym' || q.lado === 'xm' ? 0.1 : -0.1;     // el muro va hacia dentro de la línea
      const p = (u) => (q.eje === 'x' ? [q.a * PASO + u, q.c * PASO + off] : [q.c * PASO + off, q.a * PASO + u]);
      let u = 0;
      for (const [a, b, tipo] of cortes) {
        if (a > u) { const [x0, y0] = p(u), [x1, y1] = p(a); trazo.push(`M${x0} ${y0}L${x1} ${y1}`); }
        const [x0, y0] = p(a), [x1, y1] = p(b);
        if (tipo === 'puerta' || tipo === 'portón') puertas.push(`M${x0} ${y0}L${x1} ${y1}`);
        else vent.push(`M${x0} ${y0}L${x1} ${y1}`);
        u = b;
      }
      if (u < L) { const [x0, y0] = p(u), [x1, y1] = p(L); trazo.push(`M${x0} ${y0}L${x1} ${y1}`); }
    }
    s.push(`<path class="cf-muro" d="${trazo.join('')}" stroke="#1B2951" stroke-width=".2" stroke-linecap="square" fill="none"/>`);
    s.push(`<path d="${vent.join('')}" stroke="#0EA5E9" stroke-width=".07" fill="none"/><path d="${vent.join('')}" stroke="#FFFFFF" stroke-width=".022" fill="none"/>`);
    if (puertas.length) s.push(`<path d="${puertas.join('')}" stroke="#1B2951" stroke-opacity=".35" stroke-width=".05" stroke-dasharray=".1 .08" fill="none"/>`);
    // puertas interiores: hueco en el tabique, hoja y barrido hacia la estancia
    if (!op.piezas && P.puertas) {
      const hoja = [], arco = [], gap = [];
      for (const d of P.puertas.filter((q) => q.f === f)) {
        const c = d.c * PASO, w = d.b - d.a, h = d.hacia;
        if (d.eje === 'x') {
          gap.push(`M${d.a} ${c}H${d.b}`);
          if (!d.libre) { hoja.push(`M${d.a} ${c}V${c + h * w}`); arco.push(`M${d.b} ${c}A${w} ${w} 0 0 ${h > 0 ? 1 : 0} ${d.a} ${c + h * w}`); }
        } else {
          gap.push(`M${c} ${d.a}V${d.b}`);
          if (!d.libre) { hoja.push(`M${c} ${d.a}H${c + h * w}`); arco.push(`M${c} ${d.b}A${w} ${w} 0 0 ${h > 0 ? 0 : 1} ${c + h * w} ${d.a}`); }
        }
      }
      s.push(`<path d="${gap.join('')}" stroke="#fff" stroke-width=".12" fill="none"/>`);
      s.push(`<path d="${hoja.join('')}" stroke="#1B2951" stroke-width=".035" fill="none"/><path d="${arco.join('')}" stroke="#1B2951" stroke-opacity=".4" stroke-width=".015" stroke-dasharray=".06 .05" fill="none"/>`);
    }
    // mobiliario esquemático
    if (!op.piezas && op.muebles !== false) s.push(muebles(P, f));
    // piezas J encima (si se piden)
    if (op.piezas) {
      const L = P.losas.find((l) => l.k === op.piezas) || P.losas[0];
      if (L) for (const p of L.piezas) {
        s.push(`<rect x="${p.x * PASO + 0.05}" y="${p.y * PASO + 0.05}" width="${p.w * PASO - 0.1}" height="${p.h * PASO - 0.1}" rx=".08" fill="rgba(14,165,233,.07)" stroke="#0EA5E9" stroke-width=".045"/>`);
        const fs = Math.min(0.34, p.w * PASO / 5, p.h * PASO / 2.4);
        s.push(`<text x="${(p.x + p.w / 2) * PASO}" y="${(p.y + p.h / 2) * PASO + fs * 0.35}" font-size="${fs}" font-weight="600" fill="#0369A1" text-anchor="middle">${esc(p.nombre)}</text>`);
      }
    }
    // nombres y superficies
    if (!op.sinTextos) for (const [i] of porRoom) {
      const r = P.rooms[i];
      let cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
      if (g[Math.floor(cy) * W + Math.floor(cx)] !== i) { const c = centroCelda(g, W, H, i); cx = c[0]; cy = c[1]; }
      if (op.piezas) continue;
      // el nombre que cabe: entero o corto
      const anch = (r.x1 - r.x0) * PASO - 0.3;
      let nom = r.n, fs = Math.min(0.36, anch / (nom.length * 0.56));
      if (fs < 0.24) { nom = CORTO[r.t] ? CORTO[r.t](r.n) : nom; fs = Math.max(0.18, Math.min(0.32, anch / (nom.length * 0.56))); }
      s.push(`<text x="${cx * PASO}" y="${cy * PASO - 0.04}" font-size="${fs}" font-weight="600" fill="#1B2951" text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-opacity=".85" stroke-width=".07" stroke-linejoin="round">${esc(nom)}</text>`);
      const rect = r.x1 > r.x0 && (r.x1 - r.x0) * (r.y1 - r.y0) * PASO * PASO <= r.area * 1.02 + 0.01;
      const dims = rect && r.t !== 'paso' && r.t !== 'porche' ? `, ${num((r.x1 - r.x0) * PASO, 2)} × ${num((r.y1 - r.y0) * PASO, 2)}` : '';
      const linea2 = m2(r.area) + dims, cabe = linea2.length * fs * 0.8 * 0.52 <= anch;
      s.push(`<text x="${cx * PASO}" y="${cy * PASO + fs * 1.15}" font-size="${fs * 0.8}" fill="#5B6478" text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-opacity=".85" stroke-width=".06" stroke-linejoin="round">${esc(cabe ? linea2 : m2(r.area))}</text>`);
    }
    // cotas generales
    if (!op.sinCotas) {
      const yC = -mg * 0.55, xC = -mg * 0.55;
      s.push(`<g stroke="#5B6478" stroke-width=".02" fill="none"><path d="M0 ${yC}H${Wm}M0 ${yC - 0.12}v.24M${Wm} ${yC - 0.12}v.24M${xC} 0V${Hm}M${xC - 0.12} 0h.24M${xC - 0.12} ${Hm}h.24"/></g>`);
      s.push(`<text x="${Wm / 2}" y="${yC - 0.14}" font-size=".3" fill="#5B6478" text-anchor="middle">${esc(m(Wm))}</text>`);
      {
        const rs = P.rooms.filter((r) => r.f === f && r.x1 > r.x0), xs = [...new Set(rs.flatMap((r) => [r.x0, r.x1]))].sort((a, b) => a - b), ys = [...new Set(rs.flatMap((r) => [r.y0, r.y1]))].sort((a, b) => a - b);
        const yc = -mg * 0.22, xc = -mg * 0.22, cad = [], txt = [];
        xs.forEach((x, i) => { cad.push(`M${x * PASO} ${yc - 0.08}v.16`); if (i) { const L = (x - xs[i - 1]) * PASO; if (L >= 1.4) txt.push(`<text x="${(x + xs[i - 1]) / 2 * PASO}" y="${yc - 0.07}" font-size=".19" fill="#8A93A6" text-anchor="middle">${esc(num(L, 2))}</text>`); } });
        ys.forEach((y, i) => { cad.push(`M${xc - 0.08} ${y * PASO}h.16`); if (i) { const L = (y - ys[i - 1]) * PASO; if (L >= 1.4) txt.push(`<text x="${xc - 0.07}" y="${(y + ys[i - 1]) / 2 * PASO}" font-size=".19" fill="#8A93A6" text-anchor="middle" transform="rotate(-90 ${xc - 0.07} ${(y + ys[i - 1]) / 2 * PASO})">${esc(num(L, 2))}</text>`); } });
        if (xs.length) cad.push(`M${xs[0] * PASO} ${yc}H${xs[xs.length - 1] * PASO}`); if (ys.length) cad.push(`M${xc} ${ys[0] * PASO}V${ys[ys.length - 1] * PASO}`);
        s.push(`<path d="${cad.join('')}" stroke="#8A93A6" stroke-width=".015" fill="none"/>${txt.join('')}`);
      }
      s.push(`<text x="${xC - 0.14}" y="${Hm / 2}" font-size=".3" fill="#5B6478" text-anchor="middle" transform="rotate(-90 ${xC - 0.14} ${Hm / 2})">${esc(m(Hm))}</text>`);
      // norte: el de verdad, girado con la casa
      const nx = Wm + mg * 0.5, ny = -mg * 0.5, ang = -(P.rot || 0) * 90;
      s.push(`<g transform="translate(${nx} ${ny}) rotate(${ang})"><circle r=".42" fill="#fff" stroke="#1B2951" stroke-opacity=".25" stroke-width=".02"/><path d="M0 -.32L.13 .12L0 .04L-.13 .12Z" fill="#1B2951"/><text y=".34" font-size=".2" font-weight="600" fill="#1B2951" text-anchor="middle" transform="rotate(${-ang} 0 .27)">N</text></g>`);
      // escala gráfica
      const ex = 0, ey = Hm + mg * 0.55;
      s.push(`<g><rect x="${ex}" y="${ey}" width="1.5" height=".08" fill="#1B2951"/><rect x="${ex + 1.5}" y="${ey}" width="1.5" height=".08" fill="#1B2951" fill-opacity=".3"/><text x="${ex}" y="${ey + 0.38}" font-size=".22" fill="#5B6478">0</text><text x="${ex + 3}" y="${ey + 0.38}" font-size=".22" fill="#5B6478" text-anchor="middle">3 m</text><text x="${ex + 3.4}" y="${ey + 0.1}" font-size=".22" fill="#5B6478">trama de 0,75 m</text></g>`);
    }
    s.push('</svg>');
    return s.join('');
  }
  // ── mobiliario esquemático: contra la pared que no tiene puerta (y, para la cama, mejor sin ventana) ──
  function muebles(P, f) {
    const out = [], g = P.grids[f], W = P.W;
    const st = 'fill="#fff" stroke="#1B2951" stroke-opacity=".55" stroke-width=".022"';
    const R = (x, y, w, h, rx = 0.05) => `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${Math.max(0.01, w).toFixed(3)}" height="${Math.max(0.01, h).toFixed(3)}" rx="${rx}" ${st}/>`;
    const C = (x, y, r) => `<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${r}" ${st}/>`;
    P.rooms.forEach((r, i) => {
      if (r.f !== f || !(r.x1 > r.x0)) return;
      const x0 = r.x0 * PASO + 0.14, y0 = r.y0 * PASO + 0.14, x1 = r.x1 * PASO - 0.14, y1 = r.y1 * PASO - 0.14, w = x1 - x0, h = y1 - y0;
      if (w < 0.8 || h < 0.8) return;
      // solo en estancias rectangulares
      let c = 0; for (let y = r.y0; y < r.y1; y++) for (let x = r.x0; x < r.x1; x++) if (g[y * W + x] === i) c++;
      if (c < (r.x1 - r.x0) * (r.y1 - r.y0) * 0.9) return;
      // lados con puerta o con ventana
      const puerta = { N: 0, S: 0, O: 0, E: 0 }, ventana = { N: 0, S: 0, O: 0, E: 0 };
      for (const d of P.puertas || []) if (d.f === f && (d.de === i || d.a_ === i)) { if (d.eje === 'x') puerta[d.c === r.y0 ? 'N' : 'S']++; else puerta[d.c === r.x0 ? 'O' : 'E']++; }
      for (const m of P.muros) if (m.f === f) for (const hq of m.huecos) if (hq.r === i) ventana[m.lado === 'ym' ? 'N' : m.lado === 'yp' ? 'S' : m.lado === 'xm' ? 'O' : 'E']++;
      const lados = ['N', 'S', 'O', 'E'].sort((a, b) => (puerta[a] * 3 + ventana[a]) - (puerta[b] * 3 + ventana[b]) || ((b === 'N' || b === 'S' ? w : h) - (a === 'N' || a === 'S' ? w : h)));
      // coloca un rectángulo de ancho a (a lo largo de la pared) y fondo b contra el lado l, centrado o desplazado
      const contra = (l, a, b, t = 0.5) => {
        if (l === 'N') return [x0 + (w - a) * t, y0, a, b]; if (l === 'S') return [x0 + (w - a) * t, y1 - b, a, b];
        if (l === 'O') return [x0, y0 + (h - a) * t, b, a]; return [x1 - b, y0 + (h - a) * t, b, a];
      };
      const largo = (l) => (l === 'N' || l === 'S' ? w : h), fondo = (l) => (l === 'N' || l === 'S' ? h : w);
      const l0 = lados[0];
      if (r.t === 'principal' || r.t === 'dormitorio') {
        const doble = r.t === 'principal' || Math.min(w, h) >= 2.7, bw = doble ? 1.5 : 0.9;
        if (largo(l0) < bw + 0.2 || fondo(l0) < 2.4) return;
        const [bx, by, bW, bH] = contra(l0, bw, 2.0);
        out.push(R(bx, by, bW, bH, 0.08));
        const [px, py, pW, pH] = contra(l0, bw - 0.2, 0.45); out.push(R(px, py, pW, pH, 0.1));   // almohadas
        if (largo(l0) >= bw + 1.1) { for (const t of [0, 1]) { const [nx, ny, nW, nH] = contra(l0, 0.42, 0.4, t); out.push(R(nx, ny, nW, nH)); } }
        const l1 = lados.find((l) => l !== l0 && l !== { N: 'S', S: 'N', O: 'E', E: 'O' }[l0] && !puerta[l]) || null;
        if (l1 && largo(l1) >= 1.6 && fondo(l1) >= 2.6) { const [ax, ay, aW, aH] = contra(l1, Math.min(2.0, largo(l1) - 0.6), 0.6, 0.15); out.push(R(ax, ay, aW, aH, 0.02)); }
      } else if (r.t === 'salon') {
        if (largo(l0) < 2.6 || fondo(l0) < 2.4) return;
        const [sx, sy, sW, sH] = contra(l0, Math.min(2.4, largo(l0) - 0.8), 0.9, 0.3); out.push(R(sx, sy, sW, sH, 0.15));
        const cxs = sx + sW / 2, cys = sy + sH / 2, dir = { N: [0, 1], S: [0, -1], O: [1, 0], E: [-1, 0] }[l0];
        out.push(R(cxs + dir[0] * 1.3 - (dir[0] ? 0.3 : 0.55), cys + dir[1] * 1.3 - (dir[1] ? 0.3 : 0.55), dir[0] ? 0.6 : 1.1, dir[1] ? 0.6 : 1.1, 0.08));
        // la mesa del comedor, al otro lado de la estancia
        if (largo(l0) >= 4.2) {
          const t = 0.85, [mx, my, mW, mH] = contra(l0, 1.6, 0.9, t), off = Math.min(fondo(l0) / 2 - 0.45, 1.6);
          const X = mx + dir[0] * off, Y = my + dir[1] * off; out.push(R(X, Y, mW, mH, 0.06));
          const nn = 3; for (let k = 0; k < nn; k++) { const u = (k + 0.5) / nn; if (mW > mH) { out.push(C(X + mW * u, Y - 0.22, 0.17), C(X + mW * u, Y + mH + 0.22, 0.17)); } else { out.push(C(X - 0.22, Y + mH * u, 0.17), C(X + mW + 0.22, Y + mH * u, 0.17)); } }
        }
      } else if (r.t === 'cocina') {
        const L = Math.min(largo(l0), 3.6); if (L < 1.8) return;
        const [kx, ky, kW, kH] = contra(l0, L, 0.6, 0.5); out.push(R(kx, ky, kW, kH, 0.02));
        const cxk = kx + kW / 2, cyk = ky + kH / 2, horiz = kW > kH;
        out.push(R(horiz ? cxk - 0.9 : kx + 0.1, horiz ? ky + 0.1 : cyk - 0.9, horiz ? 0.5 : 0.4, horiz ? 0.4 : 0.5, 0.06));
        for (const [a, b] of [[0.45, 0.15], [0.75, 0.15], [0.45, 0.45], [0.75, 0.45]]) out.push(C(horiz ? cxk + a : kx + b + 0.05, horiz ? ky + b + 0.05 : cyk + a, 0.08));
      } else if (r.t === 'bano' || r.t === 'aseo') {
        const [wx, wy] = contra(l0, 0.4, 0.65, 0.2); out.push(`<ellipse cx="${(wx + 0.2).toFixed(3)}" cy="${(wy + 0.33).toFixed(3)}" rx="${l0 === 'N' || l0 === 'S' ? 0.19 : 0.3}" ry="${l0 === 'N' || l0 === 'S' ? 0.3 : 0.19}" ${st}/>`);
        const [lx, ly, lW, lH] = contra(l0, 0.55, 0.42, 0.75); out.push(R(lx, ly, lW, lH, 0.12));
        if (r.t === 'bano' && largo(lados[1]) >= 1.2) { const [dx, dy, dW, dH] = contra(lados[1], Math.min(1.6, largo(lados[1]) - 0.2), 0.8, 0.5); out.push(R(dx, dy, dW, dH, 0.04)); }
      } else if (r.t === 'estudio') {
        if (largo(l0) < 1.5) return; const [dx, dy, dW, dH] = contra(l0, 1.4, 0.6, 0.5); out.push(R(dx, dy, dW, dH, 0.03));
        const dir = { N: [0, 1], S: [0, -1], O: [1, 0], E: [-1, 0] }[l0]; out.push(C(dx + dW / 2 + dir[0] * 0.6, dy + dH / 2 + dir[1] * 0.6, 0.22));
      } else if (r.t === 'escalera') {
        const n = 12, hor = w >= h, lineas = []; for (let k = 1; k < n; k++) { const u = k / n; lineas.push(hor ? `M${x0 + w * u} ${y0}V${y1}` : `M${x0} ${y0 + h * u}H${x1}`); }
        out.push(`<path d="${lineas.join('')}" stroke="#1B2951" stroke-opacity=".35" stroke-width=".02" fill="none"/>`);
      } else if (r.t === 'garaje') {
        const hor = w >= h; out.push(R(x0 + (w - (hor ? 4.3 : 1.8)) / 2, y0 + (h - (hor ? 1.8 : 4.3)) / 2, hor ? 4.3 : 1.8, hor ? 1.8 : 4.3, 0.5));
      } else if (r.t === 'lavadero') {
        for (const t of [0.2, 0.8]) { const [ax, ay, aW, aH] = contra(l0, 0.6, 0.6, t); out.push(R(ax, ay, aW, aH, 0.04)); }
      }
    });
    return `<g class="cf-muebles">${out.join('')}</g>`;
  }
  function centroCelda(g, W, H, i) {
    let sx = 0, sy = 0, n = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y * W + x] === i) { sx += x + 0.5; sy += y + 0.5; n++; }
    const cx = sx / n, cy = sy / n; let best = null, bd = 1e9;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y * W + x] === i) { const d = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2; if (d < bd) { bd = d; best = [x + 0.5, y + 0.5]; } }
    return best || [cx, cy];
  }
  // ── miniatura: solo las manchas de las estancias y la huella ──
  function mini(P, op = {}) {
    const W = P.W, H = P.H, pl = P.plantas, gap = 1.2, Wm = W * PASO, Hm = H * PASO;
    const ancho = pl > 1 ? Wm * 2 + gap : Wm, s = [`<svg class="cf-mini" viewBox="-0.4 -0.4 ${ancho + 0.8} ${Hm + 0.8}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`];
    for (let f = 0; f < pl; f++) {
      const ox = f * (Wm + gap), g = P.grids[f];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = g[y * W + x]; if (v < 0 && v > -2) continue; const t = v >= 0 ? P.rooms[v].t : 'vacio'; s.push(`<rect x="${ox + x * PASO}" y="${y * PASO}" width="${PASO + 0.01}" height="${PASO + 0.01}" fill="${v >= 0 ? (t === 'porche' ? '#F3F5F8' : TINTE[t] || '#EEF1F6') : '#F7F8FA'}"/>`); }
      const tb = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = g[y * W + x]; if (a < 0) continue;
        const b1 = x + 1 < W ? g[y * W + x + 1] : -1, b2 = y + 1 < H ? g[(y + 1) * W + x] : -1, b3 = x > 0 ? g[y * W + x - 1] : -1, b4 = y > 0 ? g[(y - 1) * W + x] : -1;
        if (b1 !== a) tb.push(`M${ox + (x + 1) * PASO} ${y * PASO}v${PASO}`); if (b2 !== a) tb.push(`M${ox + x * PASO} ${(y + 1) * PASO}h${PASO}`);
        if (b3 < 0) tb.push(`M${ox + x * PASO} ${y * PASO}v${PASO}`); if (b4 < 0) tb.push(`M${ox + x * PASO} ${y * PASO}h${PASO}`); }
      s.push(`<path d="${tb.join('')}" stroke="#1B2951" stroke-width=".1" fill="none" stroke-linecap="square"/>`);
    }
    s.push('</svg>'); return s.join('');
  }
  // ── la búsqueda en vivo: rectángulos de estancias del mejor estado ──
  function vivo(V) {
    const W = V.W, H = V.H, Wm = W * PASO, Hm = H * PASO, pl = Math.max(1, ...V.piezas.map((p) => p[1] + 1)), gap = 1.2;
    const s = [`<svg class="cf-vivo" viewBox="-0.3 -0.3 ${(pl > 1 ? Wm * 2 + gap : Wm) + 0.6} ${Hm + 0.6}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`];
    for (const [t, f, a, b, y0, y1] of [...V.piezas, ...V.autos]) { if (b <= a) continue; const ox = f * (Wm + gap); s.push(`<rect x="${ox + a * PASO}" y="${y0 * PASO}" width="${(b - a) * PASO}" height="${(y1 - y0) * PASO}" fill="${TINTE[t] || '#EEF1F6'}" stroke="#1B2951" stroke-width=".07"/>`); }
    s.push('</svg>'); return s.join('');
  }

  // ── mapa de España (lon/lat → plano; Canarias en recuadro) ──
  function proyector(ancho = 360) {
    const lat0 = 40 * Math.PI / 180, kx = Math.cos(lat0);
    const box = { lon0: -9.9, lon1: 4.6, lat0: 35.6, lat1: 44.0 };
    const k = ancho / ((box.lon1 - box.lon0) * kx), alto = (box.lat1 - box.lat0) * k;
    const can = (lon, lat) => lat < 30 && lon < -12;
    // Canarias: a media escala, en el Atlántico al suroeste del cabo de San Vicente
    const CX = -18.3, CY = 27.55, KC = 0.5, DX = -9.65, DY = 35.85;
    const tx = (lon, lat) => (can(lon, lat) ? [DX + (lon - CX) * KC, DY + (lat - CY) * KC] : [lon, lat]);
    const a = (lon, lat) => { const [lo, la] = tx(lon, lat); return [(lo - box.lon0) * kx * k, (box.lat1 - la) * k]; };
    const enRecuadro = (lo, la) => lo >= DX - 0.1 && lo <= DX + 5.4 * KC + 0.1 && la >= DY - 0.1 && la <= DY + 2.0 * KC + 0.1;
    const inv = (x, y) => {
      let lon = x / (kx * k) + box.lon0, lat = box.lat1 - y / k;
      if (enRecuadro(lon, lat)) { lon = CX + (lon - DX) / KC; lat = CY + (lat - DY) / KC; }
      return [lon, lat];
    };
    return { a, inv, ancho, alto, recuadro: (() => { const [x0, y0] = a(-18.3, 29.5), [x1, y1] = a(-13.0, 27.55); return [x0 - 4, y0 - 4, x1 + 4, y1 + 4]; })() };
  }
  function mapa(op = {}) {
    const C = window.CONTORNO || [], pr = proyector(op.ancho || 360), s = [];
    s.push(`<svg class="cf-mapa" viewBox="0 0 ${pr.ancho} ${pr.alto}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa de España">`);
    const [rx0, ry0, rx1, ry1] = pr.recuadro;
    s.push(`<rect x="${rx0}" y="${ry0}" width="${rx1 - rx0}" height="${ry1 - ry0}" rx="6" fill="none" stroke="#1B2951" stroke-opacity=".18" stroke-dasharray="3 3"/>`);
    const d = C.map((poly) => 'M' + poly.map(([lo, la]) => pr.a(lo, la).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z').join('');
    s.push(`<path d="${d}" fill="#EEF2F7" stroke="#1B2951" stroke-opacity=".38" stroke-width=".8" stroke-linejoin="round"/>`);
    for (const p of op.red || []) {
      const [x, y] = pr.a(p.lon, p.lat), activo = p.est === 'activo';
      s.push(`<circle cx="${x}" cy="${y}" r="${activo ? 4.2 : 2.4}" fill="${activo ? '#0EA5E9' : '#fff'}" stroke="${activo ? '#fff' : '#1B2951'}" stroke-opacity="${activo ? 1 : 0.35}" stroke-width="1.2"><title>${esc(p.n)}, ${esc(p.t.toLowerCase())}</title></circle>`);
    }
    if (op.lugar) {
      const [x, y] = pr.a(op.lugar.lon, op.lugar.lat);
      if (op.destino) { const [x2, y2] = pr.a(op.destino.lon, op.destino.lat); s.push(`<path d="M${x} ${y}L${x2} ${y2}" stroke="#0EA5E9" stroke-width="1.4" stroke-dasharray="3 3" fill="none"/>`); }
      s.push(`<g class="cf-pin" transform="translate(${x} ${y})"><circle r="9" fill="#1B2951" fill-opacity=".12"/><circle r="4.6" fill="#1B2951" stroke="#fff" stroke-width="1.6"/></g>`);
    }
    s.push('</svg>');
    return { svg: s.join(''), pr };
  }
  // ── la parcela, con sus retranqueos supuestos y la huella ──
  function parcela(par, op = {}) {
    const { an, fo } = par, ret = op.retranqueo ?? 3, mg = Math.max(an, fo) * 0.12;
    const calle = op.calle || 'N';
    // la calle arriba si es norte; se dibuja en orientación real (norte arriba)
    const ancho = calle === 'N' || calle === 'S' ? an : fo, alto = calle === 'N' || calle === 'S' ? fo : an;
    const s = [`<svg class="cf-parcela" viewBox="${-mg} ${-mg} ${ancho + mg * 2} ${alto + mg * 2}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Parcela de ${num(an)} por ${num(fo)} metros" font-family="Inter, system-ui, sans-serif">`];
    const fs = Math.max(ancho, alto) * 0.045;
    s.push(`<rect x="0" y="0" width="${ancho}" height="${alto}" fill="#F3F6FA" stroke="#1B2951" stroke-width="${fs * 0.08}"/>`);
    s.push(`<rect x="${ret}" y="${ret}" width="${Math.max(0, ancho - 2 * ret)}" height="${Math.max(0, alto - 2 * ret)}" fill="none" stroke="#0EA5E9" stroke-width="${fs * 0.06}" stroke-dasharray="${fs * 0.3} ${fs * 0.22}"/>`);
    const lado = { N: [ancho / 2, -mg * 0.35], S: [ancho / 2, alto + mg * 0.6], E: [ancho + mg * 0.5, alto / 2], O: [-mg * 0.5, alto / 2] }[calle];
    s.push(`<text x="${lado[0]}" y="${lado[1]}" font-size="${fs}" fill="#5B6478" text-anchor="middle">calle</text>`);
    if (op.huella) { const [hx, hy, hw, hh] = op.huella; s.push(`<rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" fill="#1B2951" fill-opacity=".85" rx="${fs * 0.08}"/>`); }
    s.push(`<text x="${ancho / 2}" y="${alto / 2 + fs * 0.35}" font-size="${fs * 1.05}" font-weight="600" fill="#1B2951" fill-opacity="${op.huella ? 0 : 1}" text-anchor="middle">${num(an)} × ${num(fo)} m</text>`);
    s.push('</svg>'); return s.join('');
  }
  // ── el recorrido del sol: diagrama polar (el centro es el cenit) ──
  function solar(rec, op = {}) {
    const R = 88, cx = 100, cy = 100, s = [`<svg class="cf-solar" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Recorrido del sol" font-family="Inter, system-ui, sans-serif">`];
    const pt = (az, el) => { const r = R * (1 - Math.max(0, el) / 90), a = az * Math.PI / 180; return [cx + Math.sin(a) * r, cy - Math.cos(a) * r]; };
    for (const e of [0, 30, 60]) s.push(`<circle cx="${cx}" cy="${cy}" r="${R * (1 - e / 90)}" fill="none" stroke="#1B2951" stroke-opacity="${e ? 0.1 : 0.22}"/>`);
    s.push(`<path d="M${cx} ${cy - R}V${cy + R}M${cx - R} ${cy}H${cx + R}" stroke="#1B2951" stroke-opacity=".08"/>`);
    for (const [t, az] of [['N', 0], ['E', 90], ['S', 180], ['O', 270]]) { const [x, y] = pt(az, -8); s.push(`<text x="${x}" y="${y + 3.5}" font-size="10" font-weight="600" fill="#5B6478" text-anchor="middle">${t}</text>`); }
    const traza = (pts, cls) => { const v = pts.filter((p) => p.elev > 0).map((p) => pt(p.az, p.elev)); if (v.length > 1) s.push(`<path d="M${v.map((q) => q.map((n) => n.toFixed(1)).join(' ')).join('L')}" fill="none" class="${cls}"/>`); };
    if (op.verano) traza(op.verano.pts, 'cf-sol-extremo');
    if (op.invierno) traza(op.invierno.pts, 'cf-sol-extremo');
    traza(rec.pts, 'cf-sol-hoy');
    if (op.ahora && op.ahora.elev > -2) { const [x, y] = pt(op.ahora.az, op.ahora.elev); s.push(`<circle cx="${x}" cy="${y}" r="9" fill="#F59E0B" fill-opacity=".18"/><circle cx="${x}" cy="${y}" r="4.6" fill="#F59E0B"/>`); }
    s.push('</svg>'); return s.join('');
  }

  // ── la tabla del despiece ──
  function tablaDespiece(P) {
    const filas = P.despiece.map((d) => {
      const usos = Object.entries(d.usos).map(([k, v]) => `${v} ${k === 'muro' ? (v > 1 ? 'muros' : 'muro') : k === 'forjado' ? (v > 1 ? 'en forjado' : 'en forjado') : 'en cubierta'}`).join(', ');
      return `<tr><th scope="row"><span class="cf-j${d.corte != null ? ' corte' : ''}">${esc(d.nombre)}</span></th><td>${num(d.n)}</td><td>${num(d.m2, 1)}</td><td class="cf-usos">${esc(usos)}</td></tr>`;
    }).join('');
    const T = P.totales;
    return `<table class="cf-tabla"><thead><tr><th scope="col">Pieza</th><th scope="col">Uds.</th><th scope="col">m²</th><th scope="col">Dónde</th></tr></thead><tbody>${filas}</tbody><tfoot><tr><th scope="row">Total</th><td>${num(T.piezas)}</td><td>${num(T.m2, 1)}</td><td class="cf-usos">${num(T.losas)} en losas, ${num(T.paneles)} en muros, ${num(T.cortes)} con corte de ancho</td></tr></tfoot></table>`;
  }

  // ── el resumen descargable: una página HTML que se sostiene sola ──
  function resumenHTML(D) {
    const { P, entendido, foto, lugar, red, fuentes, fecha } = D;
    const plantas = Array.from({ length: P.plantas }, (_, f) => `<figure><figcaption>${f ? 'Planta primera' : 'Planta baja'}</figcaption>${planta(P, f, { titulo: f ? 'Planta primera' : 'Planta baja' })}</figure>`).join('');
    const est = P.rooms.filter((r) => r.area > 0.1).map((r) => `<li><span>${esc(r.n)}</span><b>${esc(m2(r.area))}</b></li>`).join('');
    const ent = entendido.map((e) => `<li>${esc(e)}</li>`).join('');
    const losas = P.losas.map((l) => `<li>${esc(l.n)}: ${num(l.piezas.length)} piezas, ${l.demostrado ? 'mínimo demostrado' : 'la mejor encontrada'}</li>`).join('');
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Propuesta CUEVA: ${esc(P.nombre)}</title>
<style>body{margin:0;font:400 15px/1.5 Inter,system-ui,sans-serif;color:#1B2951;background:#fff}main{max-width:980px;margin:0 auto;padding:48px 28px 80px}h1{font-size:40px;letter-spacing:-.04em;line-height:1;margin:0 0 8px}h2{font-size:22px;letter-spacing:-.02em;margin:40px 0 12px}p,li{color:#3b4868}.aviso{background:#F4F6F9;border-radius:14px;padding:14px 18px;margin:22px 0;color:#1B2951}.foto{width:100%;border-radius:18px;display:block;background:#F2F4F8}figure{margin:18px 0}figcaption{font-weight:600;margin-bottom:6px}.cf-planta{width:100%;height:auto;background:#fff}ul.est{columns:2;padding:0;list-style:none}.mejor{font-weight:700;color:#0369A1}.sel{background:#F4F6F9}ol.cf-montaje{padding-left:0;list-style:none}ol.cf-montaje li{padding:6px 0;border-bottom:1px solid #E5E8EF}ol.cf-montaje span{color:#5B6478}.cf-tenue{color:#5B6478;font-size:13px}.cf-notas li{margin:4px 0}ul.est li{display:flex;justify-content:space-between;border-bottom:1px solid #E5E8EF;padding:6px 0;break-inside:avoid;margin-right:18px}table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}th,td{text-align:left;padding:8px 10px 8px 0;border-bottom:1px solid #E5E8EF}tfoot th,tfoot td{font-weight:700}.cf-j{font-weight:600}.cf-usos{color:#5B6478}.fuentes{font-size:12px;color:#8A93A6}</style></head><body><main>
<p style="color:#B45309;font-weight:600;margin:0 0 10px">Motor de propuestas CUEVA</p><h1>${esc(P.nombre)}</h1><p>${esc(fecha)}${lugar ? `, ${esc(lugar)}` : ''}</p>
<p class="aviso">Propuesta orientativa generada en tu navegador. No sustituye a un proyecto técnico.</p>
${foto ? `<img class="foto" src="${foto}" alt="Maqueta de la propuesta en piezas de la serie J">` : ''}
<h2>Esto es lo que he entendido</h2><ul>${ent}</ul>
<h2>Plantas</h2>${plantas}
<h2>Estancias (superficies orientativas)</h2><ul class="est">${est}</ul>
<h2>Despiece en la serie J</h2>${tablaDespiece(P)}<ul>${losas}</ul><p>Muros de fachada con piezas de pie de 3,00 m de alto. Tabiquería interior, fuera de la serie J: unos ${num(P.totales.tabique, 0)} m lineales.</p>
${red ? `<h2>Red de producción</h2><p>${esc(red)}</p>` : ''}
${(D.secciones || []).map((q) => `<h2>${esc(q.t)}</h2>${String(q.html).replace(/<sup class="f"[^>]*>.*?<\/sup>/g, '')}`).join('')}
<h2>Fuentes</h2><ul class="fuentes">${fuentes.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
<script type="application/json" id="propuesta">${JSON.stringify({ nombre: P.nombre, plantas: P.plantas, trama: PASO, estancias: P.rooms.map((r) => ({ uso: r.t, nombre: r.n, planta: r.f, m2: +r.area.toFixed(2), x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 })), despiece: P.despiece.map((d) => ({ pieza: d.nombre, uds: d.n, m2: +d.m2.toFixed(2) })) }).replace(/</g, '\\u003c')}</script>
</main></body></html>`;
  }

  window.CUEVA_PLANO = { planta, mini, vivo, mapa, proyector, parcela, solar, tablaDespiece, resumenHTML, num, m2, m, esc, TINTE };
})();

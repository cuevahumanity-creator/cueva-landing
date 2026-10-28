// ─────────────────────────────────────────────────────────────────────
//  Motor de propuestas CUEVA · leer un plano
//  Una foto, un escaneo o un croquis dibujado en el chat, traducidos a la trama de 0,75 m.
//  Todo en el lienzo del navegador, sin bibliotecas:
//  1. Grises y contraste automático (percentiles 1 y 99).
//  2. Umbral adaptativo de Bradley con imagen integral, más un umbral global de Otsu
//     para los trazos muy oscuros.
//  3. Morfología: el grosor de trazo sale de las rachas horizontales y verticales; una
//     apertura quita letras, cotas y arcos de puerta sin comerse los tabiques.
//  4. Muros: rachas largas casi horizontales y casi verticales, agrupadas fila a fila en
//     segmentos con grosor; los colineales se funden y sus huecos son puertas o ventanas.
//  5. Envolvente y estancias: muros limpios, con los huecos cerrados, inundación desde el
//     borde (lo de fuera) y componentes conexas de lo de dentro (cada estancia).
//  6. Escala: la que digas («el lado largo mide 12 m», «son 90 m²»); si no, una supuesta
//     que se dice como supuesta.
//  7. A la trama: los ejes de los muros, en metros, se agrupan y se llevan al múltiplo de
//     0,75 m más cercano; una transformación lineal a trozos entre ejes originales y ejes
//     ajustados lleva cada celda de la trama a su estancia. El resultado es un plano limpio.
//  Clásico: window.CUEVA_VISION. Usa canvas solo para leer la imagen.
// ─────────────────────────────────────────────────────────────────────
(() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mediana = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

  // ── 1 · grises y contraste ──
  function grises(img, maxLado = 820) {
    const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height, k = Math.min(1, maxLado / Math.max(w0, h0));
    const w = Math.max(8, Math.round(w0 * k)), h = Math.max(8, Math.round(h0 * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < w * h; i++, j += 4) g[i] = d[j + 3] < 128 ? 255 : (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8;
    const H = new Uint32Array(256); for (let i = 0; i < g.length; i++) H[g[i]]++;
    let lo = 0, hi = 255, acc = 0; for (let v = 0; v < 256; v++) { acc += H[v]; if (acc > g.length * 0.01) { lo = v; break; } }
    acc = 0; for (let v = 255; v >= 0; v--) { acc += H[v]; if (acc > g.length * 0.01) { hi = v; break; } }
    if (hi - lo >= 16) { const kk = 255 / (hi - lo); for (let i = 0; i < g.length; i++) g[i] = clamp(Math.round((g[i] - lo) * kk), 0, 255); }
    return { g, w, h, lienzo: c, k };
  }
  function otsu(g) {
    const H = new Float64Array(256); for (let i = 0; i < g.length; i++) H[g[i]]++; const tot = g.length; let sum = 0; for (let v = 0; v < 256; v++) sum += v * H[v];
    let sB = 0, wB = 0, max = -1, t = 128;
    for (let v = 0; v < 256; v++) { wB += H[v]; if (!wB) continue; const wF = tot - wB; if (!wF) break; sB += v * H[v]; const d = sB / wB - (sum - sB) / wF, b = wB * wF * d * d; if (b > max) { max = b; t = v; } }
    return t;
  }
  // ── 2 · umbral adaptativo de Bradley ──
  function umbral(g, w, h) {
    const W = w + 1, I = new Float64Array(W * (h + 1));
    for (let y = 0; y < h; y++) { let fila = 0; for (let x = 0; x < w; x++) { fila += g[y * w + x]; I[(y + 1) * W + x + 1] = I[y * W + x + 1] + fila; } }
    const r = Math.max(7, Math.round(Math.max(w, h) / 24)), o = otsu(g), duro = clamp(o * 0.6, 40, 110), tope = Math.min(o + 25, 225), tinta = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) { const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1); for (let x = 0; x < w; x++) { const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
      const media = (I[y1 * W + x1] - I[y0 * W + x1] - I[y1 * W + x0] + I[y0 * W + x0]) / ((x1 - x0) * (y1 - y0)), v = g[y * w + x];
      tinta[y * w + x] = v < duro || (v < media * 0.82 && v < tope) ? 1 : 0; } }
    return tinta;
  }
  // ── 3 · morfología (dilatación separable por distancia) ──
  function dilatar(src, w, h, r) {
    if (r <= 0) return src.slice(); const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) { const o = y * w; let u = -1e9; for (let x = 0; x < w; x++) { if (src[o + x]) u = x; if (x - u <= r) tmp[o + x] = 1; } u = 1e9; for (let x = w - 1; x >= 0; x--) { if (src[o + x]) u = x; if (u - x <= r) tmp[o + x] = 1; } }
    for (let x = 0; x < w; x++) { let u = -1e9; for (let y = 0; y < h; y++) { if (tmp[y * w + x]) u = y; if (y - u <= r) out[y * w + x] = 1; } u = 1e9; for (let y = h - 1; y >= 0; y--) { if (tmp[y * w + x]) u = y; if (u - y <= r) out[y * w + x] = 1; } }
    return out;
  }
  const negar = (a) => { const o = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] ? 0 : 1; return o; };
  const erosionar = (s, w, h, r) => (r <= 0 ? s.slice() : negar(dilatar(negar(s), w, h, r)));
  function grosor(tinta, w, h) {
    const hr = new Uint16Array(w * h), vr = new Uint16Array(w * h);
    for (let y = 0; y < h; y++) { let x = 0; while (x < w) { if (!tinta[y * w + x]) { x++; continue; } const s = x; while (x < w && tinta[y * w + x]) x++; for (let i = s; i < x; i++) hr[y * w + i] = x - s; } }
    for (let x = 0; x < w; x++) { let y = 0; while (y < h) { if (!tinta[y * w + x]) { y++; continue; } const s = y; while (y < h && tinta[y * w + x]) y++; for (let i = s; i < y; i++) vr[i * w + x] = y - s; } }
    const H = new Uint32Array(64); let n = 0; for (let i = 0; i < w * h; i++) if (tinta[i]) { H[Math.min(63, Math.min(hr[i], vr[i]))]++; n++; }
    const pct = (p) => { let a = 0; for (let v = 0; v < 64; v++) { a += H[v]; if (a >= n * p) return v; } return 63; };
    return { p50: pct(0.5), p75: pct(0.75), p90: pct(0.9), n };
  }

  // ── 4 · segmentos de muro por rachas (casi horizontales y casi verticales) ──
  function segmentos(m, w, h, largoMin, grosorMax) {
    const out = [];
    for (const eje of ['h', 'v']) {
      const A = eje === 'h' ? h : w, B = eje === 'h' ? w : h, at = (a, b) => (eje === 'h' ? m[a * w + b] : m[b * w + a]);
      let abiertos = [];
      for (let a = 0; a <= A; a++) {
        const rachas = [];
        if (a < A) { let b = 0; while (b < B) { if (!at(a, b)) { b++; continue; } const s = b; while (b < B && at(a, b)) b++; if (b - s >= largoMin) rachas.push([s, b]); } }
        const siguen = [];
        for (const g of abiertos) {
          const k = rachas.findIndex(([s, e]) => Math.min(e, g.e) - Math.max(s, g.s) >= 0.6 * Math.min(e - s, g.e - g.s));
          if (k >= 0) { const [s, e] = rachas.splice(k, 1)[0]; g.a1 = a + 1; g.ss.push(s); g.es.push(e); g.s = s; g.e = e; siguen.push(g); }
          else { if (g.a1 - g.a0 <= grosorMax) out.push(cerrar(g, eje)); }
        }
        for (const [s, e] of rachas) siguen.push({ a0: a, a1: a + 1, s, e, ss: [s], es: [e] });
        abiertos = siguen;
      }
    }
    return out;
    function cerrar(g, eje) {
      const t = g.a1 - g.a0, c = (g.a0 + g.a1) / 2, s = mediana(g.ss), e = mediana(g.es);
      return { eje, c, t, s, e };
    }
  }
  // fundir colineales: mismo eje, centros a menos de medio grosor, separados menos de un hueco
  function fundir(segs, hueco) {
    const res = [], huecos = [];
    for (const eje of ['h', 'v']) {
      const L = segs.filter((s) => s.eje === eje).sort((a, b) => a.c - b.c || a.s - b.s);
      const usados = new Uint8Array(L.length);
      for (let i = 0; i < L.length; i++) {
        if (usados[i]) continue;
        const grupo = [L[i]]; usados[i] = 1;
        for (let j = i + 1; j < L.length; j++) { if (usados[j]) continue; if (Math.abs(L[j].c - L[i].c) <= Math.max(L[i].t, L[j].t) * 0.75 + 2) { grupo.push(L[j]); usados[j] = 1; } else if (L[j].c - L[i].c > Math.max(L[i].t, L[j].t) * 2) break; }
        grupo.sort((a, b) => a.s - b.s);
        let act = { ...grupo[0] }, pesoC = act.c * (act.e - act.s), largo = act.e - act.s;
        for (let k = 1; k < grupo.length; k++) {
          const g = grupo[k];
          if (g.s - act.e <= hueco) {
            if (g.s - act.e > act.t * 1.2) huecos.push({ eje, c: act.c, s: act.e, e: g.s, t: act.t });
            act.e = Math.max(act.e, g.e); act.t = Math.max(act.t, g.t); pesoC += g.c * (g.e - g.s); largo += g.e - g.s;
          } else { act.c = pesoC / largo; res.push(act); act = { ...g }; pesoC = g.c * (g.e - g.s); largo = g.e - g.s; }
        }
        act.c = pesoC / largo; res.push(act);
      }
    }
    return { muros: res, huecos };
  }
  // cerrar esquinas: un extremo que se queda corto de un muro perpendicular se alarga hasta él
  function esquinas(muros, tol) {
    for (const a of muros) for (const b of muros) {
      if (a.eje === b.eje) continue;
      // b perpendicular: su coordenada c corre en la dirección de a
      if (b.s - tol <= a.c && a.c <= b.e + tol) {
        if (Math.abs(a.s - b.c) <= tol) a.s = Math.min(a.s, b.c - b.t / 2);
        if (Math.abs(a.e - b.c) <= tol) a.e = Math.max(a.e, b.c + b.t / 2);
      }
    }
    return muros;
  }
  function puertas(muros, huecos, tol) {
    for (const a of muros) for (const fin of ['s', 'e']) {
      const x = a[fin]; let mejor = null, d0 = tol;
      for (const b of muros) {
        if (b === a || b.eje === a.eje) continue;
        if (a.c < b.s - b.t || a.c > b.e + b.t) continue;            // b tiene que cruzar la línea de a
        const d = fin === 'e' ? b.c - x : x - b.c;
        if (d > a.t * 0.6 && d <= d0) { d0 = d; mejor = b; }
      }
      // si ya hay un muro colineal que sigue, no hace falta
      if (mejor) huecos.push({ eje: a.eje, c: a.c, s: fin === 'e' ? x : mejor.c, e: fin === 'e' ? mejor.c : x, t: a.t, puerta: true });
    }
  }
  function rasterizar(muros, huecos, w, h, cerrarHuecos) {
    const m = new Uint8Array(w * h);
    const caja = (x0, y0, x1, y1) => { x0 = clamp(Math.floor(x0), 0, w); x1 = clamp(Math.ceil(x1), 0, w); y0 = clamp(Math.floor(y0), 0, h); y1 = clamp(Math.ceil(y1), 0, h); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) m[y * w + x] = 1; };
    for (const s of muros) { const t = Math.max(2, s.t); if (s.eje === 'h') caja(s.s, s.c - t / 2, s.e, s.c + t / 2); else caja(s.c - t / 2, s.s, s.c + t / 2, s.e); }
    if (cerrarHuecos) for (const s of huecos) { const t = Math.max(2, s.t); if (s.eje === 'h') caja(s.s, s.c - t / 2, s.e, s.c + t / 2); else caja(s.c - t / 2, s.s, s.c + t / 2, s.e); }
    return m;
  }
  // ── 5 · fuera, dentro y estancias ──
  function inundarFuera(bar, w, h) {
    const out = new Uint8Array(w * h), pila = [];
    const meter = (i) => { if (!out[i] && !bar[i]) { out[i] = 1; pila.push(i); } };
    for (let x = 0; x < w; x++) { meter(x); meter((h - 1) * w + x); } for (let y = 0; y < h; y++) { meter(y * w); meter(y * w + w - 1); }
    while (pila.length) { const i = pila.pop(), x = i % w; if (x > 0) meter(i - 1); if (x < w - 1) meter(i + 1); if (i >= w) meter(i - w); if (i < w * (h - 1)) meter(i + w); }
    return out;
  }
  function componentes(bin, w, h) {
    const lab = new Int32Array(w * h), cola = new Int32Array(w * h), comps = [];
    for (let s = 0; s < w * h; s++) {
      if (!bin[s] || lab[s]) continue; const id = comps.length + 1; let qh = 0, qt = 0; cola[qt++] = s; lab[s] = id;
      let area = 0, x0 = w, y0 = h, x1 = 0, y1 = 0, sx = 0, sy = 0;
      while (qh < qt) { const i = cola[qh++], x = i % w, y = (i - x) / w; area++; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (x > 0 && bin[i - 1] && !lab[i - 1]) { lab[i - 1] = id; cola[qt++] = i - 1; } if (x < w - 1 && bin[i + 1] && !lab[i + 1]) { lab[i + 1] = id; cola[qt++] = i + 1; }
        if (y > 0 && bin[i - w] && !lab[i - w]) { lab[i - w] = id; cola[qt++] = i - w; } if (y < h - 1 && bin[i + w] && !lab[i + w]) { lab[i + w] = id; cola[qt++] = i + w; } }
      comps.push({ id, area, x0, y0, x1, y1, cx: sx / area, cy: sy / area });
    }
    return { lab, comps };
  }

  // ── la lectura completa: de la imagen a muros, envolvente y estancias (en píxeles) ──
  // inclinación dominante de los trazos: el ángulo que hace más «picudos» los perfiles de proyección
  function inclinacion(g, w, h) {
    const k = Math.max(1, Math.ceil(Math.max(w, h) / 360)), sw = Math.floor(w / k), sh = Math.floor(h / k), px = [], py = [];
    const thr = Math.min(otsu(g), 160);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { let a = 0; for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) a += g[(y * k + j) * w + x * k + i]; if (a / (k * k) < thr) { px.push(x - sw / 2); py.push(y - sh / 2); } }
    if (px.length < 60) return 0;
    const paso = Math.max(1, Math.floor(px.length / 40000)), D = Math.ceil(Math.hypot(sw, sh)) + 2, bins = new Float64Array(2 * D);
    const nota = (deg) => { const t = deg * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t); let sc = 0; for (const vert of [0, 1]) { bins.fill(0); for (let i = 0; i < px.length; i += paso) { const v = vert ? c * px[i] + sn * py[i] : -sn * px[i] + c * py[i]; bins[Math.round(v) + D]++; } for (let i = 0; i < bins.length; i++) sc += bins[i] * bins[i]; } return sc; };
    let mejor = 0, bs = -1; for (let a = -12; a <= 12; a += 0.5) { const v = nota(a); if (v > bs) { bs = v; mejor = a; } }
    let fino = mejor; for (let a = mejor - 0.5; a <= mejor + 0.5; a += 0.1) { const v = nota(a); if (v > bs) { bs = v; fino = a; } }
    return Math.round(fino * 10) / 10;
  }
  function leer(img, opciones = {}) {
    const t0 = performance.now();
    let { g, w, h, lienzo, k } = grises(img, opciones.maxLado || 820);
    // enderezar una foto torcida
    const giro = opciones.croquis ? 0 : inclinacion(g, w, h);
    if (Math.abs(giro) >= 0.4) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.translate(w / 2, h / 2); x.rotate(-giro * Math.PI / 180); x.drawImage(lienzo, -w / 2, -h / 2);
      ({ g, w, h, lienzo } = grises(c, w + 1));
    }
    const tinta = umbral(g, w, h);
    const st = grosor(tinta, w, h);
    // los croquis a mano tienen un solo grosor: todo es muro; en un plano, la apertura quita lo fino
    const r = opciones.croquis ? 0 : st.p50 >= 8 ? 2 : st.p50 >= 3 ? 1 : 0;
    let muroBin = r ? dilatar(erosionar(tinta, w, h, r), w, h, r) : tinta;
    let nM = 0, nT = 0; for (let i = 0; i < w * h; i++) { nM += muroBin[i]; nT += tinta[i]; }
    if (nM < nT * 0.25) muroBin = tinta;
    const lado = Math.max(w, h), largoMin = Math.max(10, Math.round(lado * 0.04)), grosorMax = Math.max(6, Math.round(lado * 0.055));
    const crudos = segmentos(muroBin, w, h, largoMin, grosorMax);
    const { muros, huecos } = fundir(crudos, Math.round(lado * 0.2));
    // los muros cortos sueltos (texto, mobiliario) se descartan
    const largos = muros.filter((s) => s.e - s.s >= lado * 0.06);
    esquinas(largos, Math.max(6, lado * 0.025));
    // en un croquis, puertas junto a un muro perpendicular: el extremo de un muro que se queda a menos de un hueco de otro
    // que lo cruza se une a él (el tramo cuenta como hueco, para cerrar la estancia sin perder la puerta)
    if (opciones.croquis) puertas(largos, huecos, lado * 0.16);
    const limpio = rasterizar(largos, huecos, w, h, true);
    // lo de fuera: los muros limpios y, además, toda la tinta (las ventanas dibujadas con dos líneas finas cierran su hueco)
    const barrera = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) barrera[i] = limpio[i] | tinta[i];
    const fuera = inundarFuera(dilatar(barrera, w, h, 1), w, h);
    const dentro = new Uint8Array(w * h); let areaDentro = 0;
    for (let i = 0; i < w * h; i++) if (!fuera[i] && !limpio[i]) { dentro[i] = 1; areaDentro++; }
    const { lab, comps } = componentes(dentro, w, h);
    // las estancias: componentes de lo de dentro con un tamaño mínimo
    let areaTot = 0; for (const c of comps) areaTot += c.area;
    const minA = Math.max(40, areaTot * 0.012);
    const estancias = comps.filter((c) => c.area >= minA).map((c, i) => ({ ...c, n: i }));
    // envolvente: la caja de las estancias, más el grueso de los muros que las cierran
    let ex0 = w, ey0 = h, ex1 = -1, ey1 = -1;
    for (const e of estancias) { ex0 = Math.min(ex0, e.x0); ey0 = Math.min(ey0, e.y0); ex1 = Math.max(ex1, e.x1); ey1 = Math.max(ey1, e.y1); }
    const gm = Math.max(2, Math.min(14, mediana(largos.map((m) => m.t)) || st.p75));
    ex0 = Math.max(0, Math.round(ex0 - gm)); ey0 = Math.max(0, Math.round(ey0 - gm)); ex1 = Math.min(w - 1, Math.round(ex1 + gm)); ey1 = Math.min(h - 1, Math.round(ey1 + gm));
    let areaEnv = 0; for (let y = ey0; y <= ey1; y++) for (let x = ex0; x <= ex1; x++) if (!fuera[y * w + x]) areaEnv++;
    // las migas (rincones, restos) se reparten a la estancia vecina
    const mapa = new Int32Array(comps.length + 2).fill(-1); estancias.forEach((e, i) => { mapa[e.id] = i; });
    const etiqueta = new Int16Array(w * h).fill(-1);
    for (let i = 0; i < w * h; i++) if (lab[i] && mapa[lab[i]] >= 0) etiqueta[i] = mapa[lab[i]];
    return { giro, w, h, k, lienzo, tinta, muroBin, crudos, muros: largos, huecos, limpio, fuera, etiqueta, estancias, envolvente: estancias.length ? [ex0, ey0, ex1 + 1, ey1 + 1] : null, areaEnv, areaDentro, grosor: st, ms: performance.now() - t0 };
  }

  // ── 6 · escala: metros por píxel ──
  function escala(L, pista = {}) {
    if (!L.envolvente) return { mpp: 0.02, modo: 'supuesta', txt: 'Escala supuesta' };
    const [x0, y0, x1, y1] = L.envolvente, lado = Math.max(x1 - x0, y1 - y0);
    if (pista.ladoLargo) return { mpp: pista.ladoLargo / lado, modo: 'usuario', txt: `El lado largo mide ${fmt(pista.ladoLargo)} m, como has dicho` };
    if (pista.area) return { mpp: Math.sqrt(pista.area / L.areaEnv), modo: 'usuario', txt: `La envolvente mide ${fmt(pista.area)} m², como has dicho` };
    if (pista.areaPrograma) return { mpp: Math.sqrt(pista.areaPrograma / L.areaEnv), modo: 'supuesta', txt: `Escala supuesta: la envolvente, con los ${fmt(pista.areaPrograma)} m² de tu programa` };
    const A = 110; return { mpp: Math.sqrt(A / L.areaEnv), modo: 'supuesta', txt: `Escala supuesta: unos ${A} m² de planta. Dime cuánto mide un lado y la ajusto` };
  }
  const fmt = (v) => String(Math.round(v * 100) / 100).replace('.', ',');

  // ── 7 · a la trama de 0,75 m ──
  //  Ejes: centros de los muros más los bordes de la envolvente. Se agrupan (a menos de 0,35 m) y cada grupo
  //  va al múltiplo de 0,75 m más cercano, sin que dos ejes distintos caigan en el mismo.
  function ajustarEjes(cs, mpp, paso) {
    const m = cs.map((c) => c * mpp).sort((a, b) => a - b), grupos = [];
    for (const v of m) { const g = grupos[grupos.length - 1]; if (g && v - g[g.length - 1] < 0.35) g.push(v); else grupos.push([v]); }
    const orig = grupos.map((g) => g.reduce((a, b) => a + b, 0) / g.length), base = orig[0];
    const mods = []; let prev = -1;
    for (const o of orig) { let q = Math.round((o - base) / paso); if (q <= prev) q = prev + 1; mods.push(q); prev = q; }
    return { orig: orig.map((o) => o / mpp), mods };            // píxeles originales → módulos
  }
  // interpolación lineal a trozos (con extrapolación en los extremos)
  function trozos(xs, ys) {
    return (v) => {
      if (xs.length === 1) return ys[0];
      let i = 0; while (i < xs.length - 2 && v > xs[i + 1]) i++;
      const t = (v - xs[i]) / (xs[i + 1] - xs[i] || 1); return ys[i] + t * (ys[i + 1] - ys[i]);
    };
  }
  function aTrama(L, esc, paso = 0.75) {
    const [ex0, ey0, ex1, ey1] = L.envolvente;
    const cx = [ex0, ex1, ...L.muros.filter((s) => s.eje === 'v').map((s) => s.c)], cy = [ey0, ey1, ...L.muros.filter((s) => s.eje === 'h').map((s) => s.c)];
    const ax = ajustarEjes(cx.filter((c) => c >= ex0 - 2 && c <= ex1 + 2), esc.mpp, paso), ay = ajustarEjes(cy.filter((c) => c >= ey0 - 2 && c <= ey1 + 2), esc.mpp, paso);
    const W = Math.max(1, ax.mods[ax.mods.length - 1]), H = Math.max(1, ay.mods[ay.mods.length - 1]);
    const xInv = trozos(ax.mods, ax.orig), yInv = trozos(ay.mods, ay.orig);        // módulo → píxel
    const xDir = trozos(ax.orig, ax.mods), yDir = trozos(ay.orig, ay.mods);        // píxel → módulo
    // cada celda: la estancia que más se ve en una muestra de 5 × 5 puntos
    const et = new Int16Array(W * H).fill(-1), n = L.estancias.length;
    const voto = new Int16Array(n + 1);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      voto.fill(0); let fueraV = 0;
      for (let b = 0; b < 5; b++) for (let a = 0; a < 5; a++) {
        const px = Math.round(xInv(i + (a + 0.5) / 5)), py = Math.round(yInv(j + (b + 0.5) / 5));
        if (px < 0 || py < 0 || px >= L.w || py >= L.h) { fueraV++; continue; }
        const q = py * L.w + px, e = L.etiqueta[q];
        if (e >= 0) voto[e]++; else if (L.fuera[q]) fueraV++;
      }
      let best = -1, bv = 0; for (let e = 0; e < n; e++) if (voto[e] > bv) { bv = voto[e]; best = e; }
      et[j * W + i] = best >= 0 && bv >= fueraV ? best : -1;
    }
    // celdas sueltas sin estancia dentro de la envolvente: a su vecina
    for (let pasada = 0; pasada < 2; pasada++) for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (et[j * W + i] >= 0) continue;
      const v = [i > 0 ? et[j * W + i - 1] : -1, i < W - 1 ? et[j * W + i + 1] : -1, j > 0 ? et[(j - 1) * W + i] : -1, j < H - 1 ? et[(j + 1) * W + i] : -1].filter((q) => q >= 0);
      if (v.length >= 3) et[j * W + i] = v[0];
    }
    // estancias resultantes
    const est = [];
    for (let e = 0; e < n; e++) {
      let c = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (et[j * W + i] === e) { c++; x0 = Math.min(x0, i); y0 = Math.min(y0, j); x1 = Math.max(x1, i + 1); y1 = Math.max(y1, j + 1); }
      if (c) est.push({ id: e, origen: e, celdas: c, x0, y0, x1, y1, pxArea: L.estancias[e].area });
    }
    // reindexado compacto
    const ren = new Int16Array(n).fill(-1); est.forEach((e, k) => { ren[e.id] = k; e.id = k; });
    for (let q = 0; q < W * H; q++) if (et[q] >= 0) et[q] = ren[et[q]];
    return { W, H, etiquetas: et, estancias: est, ejes: { x: ax, y: ay }, xDir, yDir, xInv, yInv };
  }

  // ── usos supuestos: por superficie, proporción y vecindad (y el programa, si lo hay) ──
  function usos(T, prog = {}, paso = 0.75) {
    const A1 = paso * paso, E = T.estancias.map((e) => ({ ...e, area: e.celdas * A1, w: e.x1 - e.x0, h: e.y1 - e.y0 }));
    E.forEach((e) => { e.corto = Math.min(e.w, e.h) * paso; e.largo = Math.max(e.w, e.h) * paso; e.lleno = e.celdas / Math.max(1, e.w * e.h); });
    const orden = E.slice().sort((a, b) => b.area - a.area);
    const libre = new Set(E.map((e) => e.id));
    const pon = (e, t, n) => { e.t = t; e.n = n; libre.delete(e.id); };
    // pasillos: largos y estrechos
    for (const e of E) if (libre.has(e.id) && e.corto <= 1.6 && e.largo / Math.max(0.75, e.corto) >= 2.6) pon(e, 'paso', 'Distribuidor');
    // el salón: la mayor de las que quedan
    const salon = orden.find((e) => libre.has(e.id)); if (salon) pon(salon, 'salon', 'Salón comedor');
    const resto = orden.filter((e) => libre.has(e.id));
    let dorm = prog.dormitorios ?? null, banos = prog.banos ?? null, nd = 0, nb = 0;
    // baños y aseos: las pequeñas
    for (const e of resto.slice().reverse()) {
      if (!libre.has(e.id)) continue;
      if (e.area < 3.4) { pon(e, 'aseo', 'Aseo'); nb++; continue; }
      if (e.area < 6.8 && (banos == null || nb < banos)) { pon(e, 'bano', nb ? `Baño ${nb + 1}` : 'Baño'); nb++; }
    }
    // la cocina: la vecina del salón de tamaño medio
    const vecinas = (a, b) => { const g = T.etiquetas, W = T.W, H = T.H; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const q = g[j * W + i]; if (q !== a) continue; if ((i + 1 < W && g[j * W + i + 1] === b) || (j + 1 < H && g[(j + 1) * W + i] === b) || (i > 0 && g[j * W + i - 1] === b) || (j > 0 && g[(j - 1) * W + i] === b)) return true; } return false; };
    const sal = E.find((e) => e.t === 'salon');
    const cand = resto.filter((e) => libre.has(e.id) && e.area >= 5.5 && e.area <= 16).sort((a, b) => (sal && vecinas(b.id, sal.id) ? 1 : 0) - (sal && vecinas(a.id, sal.id) ? 1 : 0) || a.area - b.area);
    if (cand[0]) pon(cand[0], 'cocina', 'Cocina');
    // dormitorios: el resto, el mayor es el principal
    const dorms = resto.filter((e) => libre.has(e.id)).sort((a, b) => b.area - a.area);
    for (const e of dorms) {
      if (e.area >= 6.5 && (dorm == null || nd < dorm)) { pon(e, nd ? 'dormitorio' : 'principal', nd ? `Dormitorio ${nd + 1}` : 'Dormitorio principal'); nd++; }
      else if (e.area < 6.5) pon(e, e.area < 4.5 ? 'lavadero' : 'estudio', e.area < 4.5 ? 'Lavadero' : 'Estudio');
      else pon(e, 'estudio', 'Estudio');
    }
    // el vestíbulo: si el salón es enorme y hay una pieza pequeña junto a él sin uso, ya está repartida; se nombra la entrada en la propuesta
    for (const e of E) if (!e.t) { e.t = 'paso'; e.n = 'Distribuidor'; }
    return E;
  }

  window.CUEVA_VISION = { leer, escala, aTrama, usos, grises, umbral, grosor, segmentos, fundir };
})();

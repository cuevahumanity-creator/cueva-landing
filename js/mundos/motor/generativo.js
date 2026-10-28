// ─────────────────────────────────────────────────────────────────────
//  Motor de propuestas CUEVA · el motor generativo
//  Todo es una función pura (CUEVA_MOTOR_DEF): su texto se copia a un Web Worker hecho
//  con un Blob, y si el navegador no deja, corre en el hilo principal a trozos.
//
//  1. La gramática (ClaudeGenerativa v7): 18 posiciones, 2 plantas × 3 cuerpos (I, P, D)
//     × 3 bandas (norte, servicios, sur). Reglas: 0P1 siempre; la planta baja es continua;
//     la alta apoya sobre la baja, es continua y desembarca en 1P1. Se enumeran todas las
//     envolventes válidas (3.355) y sus aristas de crecimiento, aquí y ahora.
//  2. Del programa a estancias: superficies de diseño orientativas por tipo de estancia.
//  3. La distribución: cada banda de cada planta es una tira; las estancias son tramos
//     sobre la trama de 0,75 m (una planta en rebanadas, slicing floorplan). Se buscan las
//     envolventes que mejor encajan con el programa y la parcela, y en cada una un recocido
//     simulado mueve, intercambia y redimensiona estancias, cambia anchos de cuerpo, fondos
//     de banda y orientación. Objetivos: superficies, adyacencias (cocina y salón,
//     dormitorios y baños), circulación desde la entrada, luz y sol según la latitud,
//     compacidad, encaje en la parcela y los gustos (patio, porche, terraza, garaje…).
//  4. El despiece en la serie J:
//     · forjados y cubiertas: cobertura exacta del poliominó con piezas J y cortes de ancho
//       (ramificación y poda de CUEVA ORIGEN: esquina superior izquierda, cota de damero y
//       de área, tabla de transposición con Zobrist); devuelve si el óptimo está demostrado;
//     · fachadas: programación dinámica exacta por tramos de muro con piezas de pie de
//       3,00 m de alto, con sus huecos.
// ─────────────────────────────────────────────────────────────────────
function CUEVA_MOTOR_DEF() {
  'use strict';
  const ahora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let PASO = 0.75, A1 = PASO * PASO;            // la trama y el área de una celda
  let SERIE = [], CORTES = [0.75, 1.5, 2.25];
  function configurar(d) {
    if (!d) return;
    if (d.paso) { PASO = d.paso; A1 = PASO * PASO; }
    if (d.serie) SERIE = d.serie;
    if (d.cortes) CORTES = d.cortes;
  }

  // ═══ 1 · la gramática ═══════════════════════════════════════════════
  const CUERPOS = ['I', 'P', 'D'], BANDAS = [2, 1, 3];        // bandas de norte a sur: 2 (norte), 1 (servicios), 3 (sur)
  const POS = []; for (const f of [0, 1]) for (const n of BANDAS) for (const b of CUERPOS) POS.push(`${f}${b}${n}`);
  const BIT = Object.fromEntries(POS.map((k, i) => [k, i]));
  const NB = { N: { 2: null, 1: 2, 3: 1 }, S: { 2: 1, 1: 3, 3: null }, O: { I: null, P: 'I', D: 'P' }, E: { I: 'P', P: 'D', D: null } };
  function vecino(k, lado) { const f = k[0], b = k[1], n = +k[2]; if (lado === 'N' || lado === 'S') { const nn = NB[lado][n]; return nn ? `${f}${b}${nn}` : null; } const bb = NB[lado][b]; return bb ? `${f}${bb}${n}` : null; }
  const NBMASK = POS.map((k) => ['N', 'S', 'E', 'O'].map((s) => vecino(k, s)).filter(Boolean).map((x) => BIT[x]));
  function conexa(mask, ini) { if (!(mask & (1 << ini))) return false; let visto = 1 << ini; const pila = [ini]; while (pila.length) { const i = pila.pop(); for (const j of NBMASK[i]) if ((mask & (1 << j)) && !(visto & (1 << j))) { visto |= 1 << j; pila.push(j); } } return visto === mask; }
  function valida(m) {
    const f0 = m & 0x1FF, f1 = (m >> 9) & 0x1FF;
    if (!(f0 & (1 << BIT['0P1']))) return false;
    if (!conexa(f0, BIT['0P1'])) return false;
    if (f1) { if ((f1 & f0) !== f1) return false; if (!(f1 & (1 << (BIT['1P1'] - 9)))) return false; if (!conexa(m & ~0x1FF, BIT['1P1'])) return false; }
    return true;
  }
  let ESPACIO = null;
  function enumerar() {
    if (ESPACIO) return ESPACIO;
    const t0 = ahora(), lista = [], indice = new Map();
    for (let m = 0; m < 1 << 18; m++) { if (!(m & 1 << BIT['0P1'])) continue; if (valida(m)) { indice.set(m, lista.length); lista.push(m); } }
    let aristas = 0;
    for (const m of lista) for (let b = 0; b < 18; b++) if (!(m & (1 << b)) && indice.has(m | (1 << b))) aristas++;
    ESPACIO = { lista, indice, aristas, ms: ahora() - t0 };
    return ESPACIO;
  }
  const tiene = (m, f, b, n) => !!(m & (1 << BIT[`${f}${b}${n}`]));

  // ═══ 2 · el programa ═══════════════════════════════════════════════
  //  Superficies de diseño orientativas (m²), anchos mínimos en módulos de 0,75 m y necesidades.
  //  luz: 2 necesita fachada, 1 la agradece; pasa: es circulación; hum: zona húmeda.
  const TIPO = {
    vestibulo: { n: 'Vestíbulo', min: 3.4, obj: 4.5, max: 7.5, minW: 2, luz: 0, pasa: 1 },
    salon: { n: 'Salón comedor', min: 18, obj: 26, max: 42, minW: 4, luz: 2, pasa: 1 },
    cocina: { n: 'Cocina', min: 7, obj: 9.5, max: 15, minW: 3, luz: 1, hum: 1 },
    principal: { n: 'Dormitorio principal', min: 11, obj: 13.5, max: 18, minW: 4, luz: 2 },
    dormitorio: { n: 'Dormitorio', min: 8, obj: 9.5, max: 13.5, minW: 3, luz: 2 },
    bano: { n: 'Baño', min: 4, obj: 5.2, max: 7.5, minW: 2, luz: 0, hum: 1 },
    aseo: { n: 'Aseo', min: 2.2, obj: 3, max: 4.5, minW: 2, luz: 0, hum: 1 },
    estudio: { n: 'Estudio', min: 6.5, obj: 8.5, max: 12, minW: 3, luz: 2 },
    lavadero: { n: 'Lavadero', min: 3, obj: 4, max: 6.5, minW: 2, luz: 0, hum: 1 },
    vestidor: { n: 'Vestidor', min: 3, obj: 4.5, max: 6.5, minW: 2, luz: 0 },
    garaje: { n: 'Garaje', min: 15, obj: 17, max: 22, minW: 7, luz: 0 },
    porche: { n: 'Porche', min: 8, obj: 12, max: 20, minW: 4, luz: 0, ext: 1 },
    escalera: { n: 'Escalera', min: 6, obj: 9, max: 14, minW: 4, luz: 0, pasa: 1 },
    paso: { n: 'Distribuidor', min: 0, obj: 3.5, max: 14, minW: 1, luz: 0, pasa: 1 },
  };
  const ELAST = { salon: 1, paso: 0.7, dormitorio: 0.55, principal: 0.6, estudio: 0.5, cocina: 0.4, porche: 0.5, garaje: 0.15, bano: 0.15, aseo: 0.06, vestibulo: 0.12, lavadero: 0.1, vestidor: 0.12, escalera: 0 };
  // qué puede abrir a qué (puertas): la llave es el tipo, el valor, los tipos de paso que le sirven
  const PUERTA = {
    salon: ['vestibulo', 'paso', 'escalera', 'porche'], cocina: ['salon', 'paso', 'vestibulo'], principal: ['paso', 'vestibulo', 'salon'], dormitorio: ['paso', 'vestibulo', 'salon'],
    bano: ['paso', 'vestibulo', 'salon'], aseo: ['paso', 'vestibulo', 'salon'], estudio: ['paso', 'vestibulo', 'salon'], lavadero: ['cocina', 'paso', 'garaje', 'vestibulo'],
    vestidor: ['principal', 'paso'], garaje: ['vestibulo', 'paso', 'cocina', 'lavadero'], porche: ['salon', 'cocina'], escalera: ['paso', 'vestibulo', 'salon'], paso: ['paso', 'vestibulo', 'salon', 'escalera'], vestibulo: ['paso', 'salon'],
  };

  const TIPO_PASO = TIPO.paso;
  function programa(P) {
    const g = P.gustos || {}, dorm = clamp(Math.round(P.dormitorios ?? 3), 0, 6);
    let banos = P.banos != null ? clamp(Math.round(P.banos), 1, 4) : dorm >= 3 ? 2 : 1;
    let aseos = P.aseos != null ? clamp(Math.round(P.aseos), 0, 2) : 0;
    const plantas = P.plantas === 1 || g.accesible ? 1 : P.plantas === 2 ? 2 : null;
    const notas = [];
    const R = [];
    const add = (t, o = {}) => { const T = TIPO[t]; R.push({ t, n: o.n || T.n, min: T.min, obj: T.obj, max: T.max, minW: T.minW, luz: T.luz, pasa: !!T.pasa, hum: !!T.hum, ext: !!T.ext, piso: o.piso ?? null, ...o }); };
    add('vestibulo', { piso: 0 });
    const salonObj = clamp(20 + dorm * 2.6 + (g.salonGrande ? 6 : 0), 20, 38);
    add('salon', { obj: salonObj, min: Math.max(16, salonObj - 7), max: salonObj + 10, piso: 0 });
    add('cocina', { piso: 0, abierta: P.cocina !== 'cerrada', obj: g.isla ? 12 : 9.5, n: P.cocina === 'cerrada' ? 'Cocina' : 'Cocina abierta' });
    for (let i = 0; i < dorm; i++) {
      if (i === 0) add('principal', { piso: null, suite: banos >= 2 || !!g.suite });
      else add('dormitorio', { n: `Dormitorio ${i + 1}`, piso: null });
    }
    for (let i = 0; i < banos; i++) add('bano', { n: banos > 1 ? (i === 0 && (banos >= 2 || g.suite) ? 'Baño del principal' : `Baño ${i + 1}`) : 'Baño', piso: null, suiteDe: i === 0 && (banos >= 2 || g.suite) ? 'principal' : null });
    for (let i = 0; i < aseos; i++) add('aseo', { piso: 0 });
    if (g.estudio) add('estudio', { piso: null });
    if (g.lavadero || dorm >= 3) add('lavadero', { piso: 0 });
    if (g.vestidor) add('vestidor', { piso: null });
    if (g.garaje) add('garaje', { piso: 0 });
    if (g.porche) add('porche', { piso: 0 });
    // superficie pedida: se escalan las estancias (sin tocar los mínimos)
    { const base = R.reduce((a, r) => a + r.obj, 0); TIPO_PASO.max = Math.max(10, base * 0.16); }
    let total = R.reduce((a, r) => a + r.obj, 0) * 1.1;
    if (P.superficie && P.superficie > 30) {
      const k = clamp(P.superficie / total, 0.75, 1.5);
      for (const r of R) if (!['vestibulo', 'escalera', 'porche', 'garaje'].includes(r.t)) { r.obj = clamp(r.obj * k, r.min, r.max * 1.2); r.max = Math.max(r.max, r.obj * 1.15); }
      total = R.reduce((a, r) => a + r.obj, 0) * 1.1;
    }
    return { R, plantas, total, notas, dorm, banos, aseos };
  }
  // reparte las estancias por plantas cuando la casa tiene dos
  function repartirPlantas(R, plantas) {
    const out = R.map((r) => ({ ...r }));
    if (plantas === 1) { for (const r of out) r.piso = 0; out.push({ ...TIPO.paso, t: 'paso', n: 'Distribuidor', piso: 0, pasa: true, luz: 0 }); return out; }
    for (const r of out) {
      if (r.piso != null) continue;
      if (['principal', 'dormitorio', 'vestidor', 'bano'].includes(r.t)) r.piso = 1;
      else if (r.t === 'estudio') r.piso = 1;
      else r.piso = 0;
    }
    // planta baja con al menos un aseo; con cuatro dormitorios o más, uno abajo (y con baño si hay de sobra)
    if (!out.some((r) => r.piso === 0 && (r.t === 'aseo' || r.t === 'bano'))) {
      const b = out.filter((r) => r.t === 'bano'); if (b.length >= 3) b[b.length - 1].piso = 0; else out.push({ ...out[0], ...TIPO.aseo, t: 'aseo', n: 'Aseo', piso: 0, pasa: false, hum: true, ext: false, auto: true });
    }
    const dUp = out.filter((r) => r.piso === 1 && (r.t === 'dormitorio'));
    if (dUp.length >= 3) dUp[dUp.length - 1].piso = 0;
    out.push({ ...TIPO.escalera, t: 'escalera', n: 'Escalera', piso: 0, pasa: true, hum: false, ext: false, luz: 0 });
    out.push({ ...TIPO.escalera, t: 'escalera', n: 'Escalera', piso: 1, pasa: true, hum: false, ext: false, luz: 0 });
    out.push({ ...TIPO.paso, t: 'paso', n: 'Distribuidor', piso: 1, pasa: true, luz: 0 });
    return out;
  }

  // ═══ 3 · la distribución ═══════════════════════════════════════════
  const DIRS = ['N', 'E', 'S', 'O'];
  // orientación: qué dirección del mundo mira cada lado de la casa (x+, x−, y−, y+) en cada giro
  function rumbos(rot) { const g = (d) => DIRS[(DIRS.indexOf(d) + rot) % 4]; return { xp: g('E'), xm: g('O'), ym: g('N'), yp: g('S') }; }
  const OPUESTA = { N: 'S', S: 'N', E: 'O', O: 'E' };
  const NOMBRE_RUMBO = { N: 'norte', S: 'sur', E: 'este', O: 'oeste' };

  // geometría: anchos de cuerpo y fondos de banda en módulos; la máscara dice qué celdas hay
  function geometria(G) {
    const usaB = { I: false, P: true, D: false };
    for (const b of CUERPOS) for (const f of [0, 1]) for (const n of BANDAS) if (tiene(G.mask, f, b, n)) usaB[b] = true;
    const bx = {}; let x = 0;
    for (const b of CUERPOS) { if (!usaB[b]) continue; bx[b] = [x, x + G.w[b]]; x += G.w[b]; }
    const by = {}; let y = 0;
    for (const n of BANDAS) { by[n] = [y, y + G.d[n]]; y += G.d[n]; }
    return { W: x, H: y, bx, by, usaB };
  }
  // tiras: tramos continuos de cuerpos ocupados en cada banda de cada planta
  function tiras(mask, plantas) {
    const T = [];
    for (let f = 0; f < plantas; f++) for (const n of BANDAS) {
      let run = null;
      for (const b of CUERPOS) {
        if (tiene(mask, f, b, n)) { if (!run) { run = { f, n, cuerpos: [] }; T.push(run); } run.cuerpos.push(b); }
        else run = null;
      }
    }
    return T;
  }

  // ── el evaluador: rasteriza la distribución en la trama y la puntúa ──
  //  Estado: G (geometría), asig (por tira, la lista ordenada de estancias), dW (ajuste de ancho por estancia),
  //  sx (posición de la escalera dentro del cuerpo P), rot (giro sobre la parcela).
  function crearEvaluador(prog, ctx) {
    const R = prog.R, NR = R.length, calle = ctx.calle || 'N', jardin = OPUESTA[calle];
    const GAN = ctx.fachadas || { invierno: { N: 0, E: 0.3, S: 1, O: 0.3 }, verano: { N: 0.2, E: 1, S: 0.5, O: 1 } };
    const gust = ctx.gustos || {};
    const adj = new Int16Array(NR * NR), ext = new Int16Array(NR * 4), area = new Float64Array(NR), cel = new Int32Array(NR);
    const x0s = new Int16Array(NR), x1s = new Int16Array(NR), y0s = new Int16Array(NR), y1s = new Int16Array(NR), vis = new Uint8Array(NR);
    const patioAdj = new Int16Array(NR), terrAdj = new Int16Array(NR);
    let rejillas = [null, null];
    const idx = (t) => R.findIndex((r) => r.t === t);
    const iVest = idx('vestibulo');

    // reparte un tramo [a, b) entre una lista de estancias, en módulos enteros
    function anchos(lista, a, b, prof, dW, out) {
      const L = b - a; if (!lista.length) return;
      let suma = 0, se = 0; const t = [], el = [];
      for (const i of lista) { const r = R[i]; let w = r.t === 'escalera' ? r.fijo : Math.max(r.minW, r.obj / (prof * A1)) + dW[i]; w = Math.max(r.t === 'escalera' ? r.fijo : 1, w); t.push(w); suma += w; const e = ELAST[r.t] ?? 0.5; el.push(e); se += e; }
      // lo que sobra (o falta) se reparte según la elasticidad de cada estancia: crece el salón, no el aseo
      const dif = L - suma; if (se <= 0) se = 1;
      const f = t.map((w, j) => Math.max(dif < 0 ? Math.min(w, 1) : 0, w + dif * el[j] / se));
      let sf = f.reduce((a, b) => a + b, 0); const k = L / (sf || 1);
      let usado = 0; const ent = f.map((w) => { const v = Math.floor(w * k); usado += v; return v; });
      const resto = f.map((w, j) => [w * k - ent[j], j]).sort((p, q) => q[0] - p[0]);
      for (let j = 0; usado < L; j = (j + 1) % resto.length) { ent[resto[j][1]]++; usado++; }
      let x = a; lista.forEach((i, j) => { out.push([i, x, x + ent[j]]); x += ent[j]; });
    }

    function construir(S) {
      const { G } = S, geo = geometria(G), W = geo.W, H = geo.H;
      const piezas = [];               // [estancia, f, x0, x1, y0, y1]
      const autos = [];                // distribuidores que nacen solos en tramos vacíos
      for (let ti = 0; ti < S.T.length; ti++) {
        const tr = S.T[ti], a = geo.bx[tr.cuerpos[0]][0], b = geo.bx[tr.cuerpos[tr.cuerpos.length - 1]][1], [y0, y1] = geo.by[tr.n], prof = y1 - y0;
        const lista = S.asig[ti];
        const esc = lista.findIndex((i) => R[i].t === 'escalera');
        const tramos = [];
        if (esc >= 0) {
          const pX = geo.bx.P[0], ew = R[lista[esc]].fijo, ex = clamp(pX + S.sx, a, b - ew);
          tramos.push([lista.slice(0, esc), a, ex]); tramos.push([[lista[esc]], ex, ex + ew]); tramos.push([lista.slice(esc + 1), ex + ew, b]);
        } else tramos.push([lista, a, b]);
        for (const [ls, ta, tb] of tramos) {
          if (tb <= ta) { for (const i of ls) piezas.push([i, tr.f, ta, ta, y0, y1]); continue; }
          if (!ls.length) { autos.push([tr.f, ta, tb, y0, y1, tr.n]); continue; }
          const out = []; anchos(ls, ta, tb, prof, S.dW, out);
          for (const [i, xa, xb] of out) piezas.push([i, tr.f, xa, xb, y0, y1]);
        }
      }
      return { geo, W, H, piezas, autos };
    }

    function evaluar(S, detalle) {
      const C = construir(S), { geo, W, H, piezas, autos } = C, G = S.G, ru = rumbos(G.rot);
      const plantas = S.plantas;
      adj.fill(0); ext.fill(0); area.fill(0); cel.fill(0); vis.fill(0); patioAdj.fill(0); terrAdj.fill(0);
      const NA = autos.length, NT = NR + NA;
      // rejilla por planta: −1 vacío, −2 patio, −3 terraza; ≥ 0 estancia (las automáticas van detrás de NR)
      const grids = [];
      for (let f = 0; f < plantas; f++) { const g = new Int16Array(W * H).fill(-1); grids.push(g); }
      for (const [i, f, xa, xb, ya, yb] of piezas) { x0s[i] = xa; x1s[i] = xb; y0s[i] = ya; y1s[i] = yb; const g = grids[f]; for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) g[y * W + x] = i; cel[i] = (xb - xa) * (yb - ya); }
      autos.forEach(([f, xa, xb, ya, yb], k) => { const g = grids[f]; for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) g[y * W + x] = NR + k; });
      // patio: celda vacía de la planta baja con tres vecinas ocupadas; terraza: vacío de la alta sobre la baja
      const patio = [], terr = [];
      for (const b of CUERPOS) for (const n of BANDAS) {
        if (!geo.usaB[b]) continue;
        if (!tiene(G.mask, 0, b, n)) {
          if (esPatio(G.mask, b, n)) { patio.push([b, n]); const [xa, xb] = geo.bx[b], [ya, yb] = geo.by[n]; for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) grids[0][y * W + x] = -2; }
        } else if (plantas > 1 && !tiene(G.mask, 1, b, n)) {
          terr.push([b, n]); const [xa, xb] = geo.bx[b], [ya, yb] = geo.by[n]; for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) grids[1][y * W + x] = -3;
        }
      }
      // aristas: adyacencias entre estancias y fachada por rumbo
      const adjA = NA ? new Int16Array(NT * NT) : null, extA = NA ? new Int16Array(NA * 4) : null;
      const DI = { N: 0, E: 1, S: 2, O: 3 };
      const dXP = DI[ru.xp], dXM = DI[ru.xm], dYM = DI[ru.ym], dYP = DI[ru.yp];
      const regAdj = (a, b) => { if (a < NR && b < NR) { adj[a * NR + b]++; adj[b * NR + a]++; } if (adjA) { adjA[a * NT + b]++; adjA[b * NT + a]++; } };
      const regExt = (a, d, v) => { if (a < NR) { ext[a * 4 + d]++; if (v === -2) patioAdj[a]++; else if (v === -3) terrAdj[a]++; } else if (extA) extA[(a - NR) * 4 + d]++; };
      for (let f = 0; f < plantas; f++) {
        const g = grids[f];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const a = g[y * W + x]; if (a < 0) continue;
          const r = x + 1 < W ? g[y * W + x + 1] : -1, l = x > 0 ? g[y * W + x - 1] : -1, u = y > 0 ? g[(y - 1) * W + x] : -1, d = y + 1 < H ? g[(y + 1) * W + x] : -1;
          if (r >= 0) { if (r !== a) regAdj(a, r); } else regExt(a, dXP, r);
          if (l < 0) regExt(a, dXM, l);
          if (u < 0) regExt(a, dYM, u);
          if (d >= 0) { if (d !== a) regAdj(a, d); } else regExt(a, dYP, d);
        }
      }
      for (let i = 0; i < NR; i++) area[i] = cel[i] * A1;
      const AD = (i, j) => adj[i * NR + j];
      const extTot = (i) => ext[i * 4] + ext[i * 4 + 1] + ext[i * 4 + 2] + ext[i * 4 + 3];
      const extDir = (i, d) => ext[i * 4 + DI[d]];

      let coste = 0; const det = detalle ? [] : null; const pen = (v, txt) => { coste += v; if (det && v > 0.5) det.push([txt, v]); };
      let areaTot = 0;
      // superficies y proporciones
      for (let i = 0; i < NR; i++) {
        const r = R[i], a = area[i]; areaTot += a;
        if (cel[i] === 0) { pen(140, `${r.n}: no cabe`); continue; }
        const lo = r.min, hi = r.max, fuera = a < lo ? (lo - a) / lo : a > hi ? (a - hi) / hi : 0;
        if (r.t === 'paso') { if (a > hi) pen(((a - hi) / hi) ** 2 * 60, `${r.n}: superficie`); }
        else pen(fuera * fuera * 160 + ((a - r.obj) / r.obj) ** 2 * 6, `${r.n}: superficie`);
        const w = x1s[i] - x0s[i], d = y1s[i] - y0s[i], corto = Math.min(w, d), largo = Math.max(w, d);
        if (w < r.minW) pen((r.minW - w) * 22, `${r.n}: estrecha`);
        if (r.t !== 'paso' && r.t !== 'porche' && r.t !== 'garaje' && largo / Math.max(1, corto) > 2.4) pen((largo / corto - 2.4) * 9, `${r.n}: alargada`);
        // luz: fachada mínima de 1,50 m (dos módulos) para las piezas vivideras
        const e = extTot(i);
        if (r.luz === 2 && e < 2) pen(55, `${r.n}: sin fachada`);
        if (r.luz === 1 && e < 2) pen(10, `${r.n}: sin fachada`);
        if (r.t === 'bano' && e >= 1) coste -= 1.5;               // un baño con ventana, mejor
        // sol: el salón al sur (ganancia de invierno), sin sobrecalentarse a poniente; los dormitorios a levante o al sur
        if (r.t === 'salon' && orient.salon && extDir(i, orient.salon) < 3) pen(34, `Salón sin fachada al ${NOMBRE_RUMBO[orient.salon]}`);
        if (r.t === 'salon' && luzSalon) coste -= e * 1.4;
        if (r.t === 'salon') { let s = 0; for (const dd of DIRS) s += extDir(i, dd) * (GAN.invierno[dd] - 0.35 * GAN.verano[dd] * (dd === 'O' ? 1 : 0.3)); coste -= s * 2.2; if (extDir(i, 'S') + extDir(i, jardin) < 2) pen(30, 'Salón sin jardín ni sol'); }
        if (r.t === 'principal' || r.t === 'dormitorio') { coste -= (extDir(i, 'E') * 0.5 + extDir(i, 'S') * 0.6 - extDir(i, 'O') * 0.25); }
        if (r.t === 'estudio') coste -= (extDir(i, 'N') * 0.4 + extDir(i, 'E') * 0.4);
        if (r.t === 'cocina') coste -= (extDir(i, 'E') * 0.3 + extDir(i, 'N') * 0.2);
        // las húmedas, en la banda de servicios
        if (r.hum && S.bandaDe[i] === 1 && S.G.d[1] >= 3) coste -= 2.5;
        if (r.t === 'garaje' && extDir(i, calle) < 4) pen(40, 'Garaje sin salida a la calle');
        if (r.t === 'vestibulo' && extDir(i, calle) < 1) pen(60, 'Entrada sin fachada a la calle');
        if (r.t === 'porche') { if (extDir(i, jardin) + extDir(i, 'S') < 4) pen(16, 'Porche sin jardín'); }
        if (luzGusto && r.luz) coste -= e * 0.35;
      }
      // cocina y salón, juntos (y abiertos si se pidió); el porche, junto al salón
      const iS = idx('salon'), iC = idx('cocina');
      if (iS >= 0 && iC >= 0 && AD(iS, iC) < 2) pen(45, 'Cocina lejos del salón');
      const iPo = idx('porche'); if (iPo >= 0 && iS >= 0 && AD(iPo, iS) < 2) pen(18, 'Porche lejos del salón');
      // suite: el baño del principal, pegado a él
      for (let i = 0; i < NR; i++) if (R[i].suiteDe) { const p = idx(R[i].suiteDe); if (p >= 0 && AD(i, p) < 2) pen(12, 'Baño del principal lejos'); }
      // húmedas apiladas: los baños de arriba sobre algo húmedo de abajo (bajantes cortas)
      if (plantas > 1) for (let i = 0; i < NR; i++) if (R[i].hum && R[i].piso === 1) {
        let enc = 0; const g0 = grids[0]; for (let y = y0s[i]; y < y1s[i]; y++) for (let x = x0s[i]; x < x1s[i]; x++) { const q = g0[y * W + x]; if (q >= 0 && q < NR && R[q].hum) enc++; }
        coste -= Math.min(1, enc / Math.max(1, cel[i])) * 4;
      }
      // circulación: desde la entrada, por los pasos, cada estancia con su puerta (contacto de 1,50 m o más)
      const pasa = (i) => (i < NR ? R[i].pasa : true), tipoDe = (i) => (i < NR ? R[i].t : 'paso');
      const ADT = (i, j) => (adjA ? adjA[i * NT + j] : adj[i * NR + j]);
      const llega = new Uint8Array(NT), comp = new Int16Array(NT).fill(-1), tam = [];
      // componentes de la red de circulación (vestíbulo, pasos, salón, escalera): puertas de 1,50 m o más
      let nc = 0;
      for (let s0 = 0; s0 < NT; s0++) {
        if (comp[s0] >= 0 || !pasa(s0) || (s0 < NR && !cel[s0])) continue;
        const cola = [s0]; comp[s0] = nc; let n = 0;
        while (cola.length) {
          const i = cola.pop(); n++;
          for (let j = 0; j < NT; j++) {
            if (comp[j] >= 0 || !pasa(j) || (j < NR && !cel[j]) || ADT(i, j) < 2) continue;
            if (!(PUERTA[tipoDe(j)] || []).includes(tipoDe(i)) && !(PUERTA[tipoDe(i)] || []).includes(tipoDe(j))) continue;
            comp[j] = nc; cola.push(j);
          }
          if (tipoDe(i) === 'escalera') for (let j = 0; j < NR; j++) if (comp[j] < 0 && R[j].t === 'escalera' && cel[j]) { comp[j] = nc; cola.push(j); }
        }
        tam.push(n); nc++;
      }
      // la red principal es la de la entrada (o la mayor si la entrada no comunica)
      let principal = iVest >= 0 && cel[iVest] ? comp[iVest] : -1, mayor = 0;
      for (let k = 0; k < nc; k++) if (tam[k] > mayor) mayor = tam[k];
      if (principal < 0) principal = tam.indexOf(mayor);
      for (let j = 0; j < NT; j++) if (comp[j] === principal) llega[j] = 1;
      for (let k = 0; k < nc; k++) if (k !== principal) pen(40 + tam[k] * 6, 'Circulación partida');
      let sinAcceso = 0;
      for (let i = 0; i < NR; i++) {
        if (llega[i] || !cel[i]) continue;
        const ok = (PUERTA[R[i].t] || []);
        let si = false;
        for (let j = 0; j < NT && !si; j++) if (llega[j] && ADT(i, j) >= 2 && ok.includes(tipoDe(j))) si = true;
        // la suite: el baño del principal abre al dormitorio
        if (!si && R[i].suiteDe) { const p = idx(R[i].suiteDe); if (p >= 0 && AD(i, p) >= 2) si = true; }
        if (!si) {
          // una pendiente hacia la solución: cuanto más lejos del paso más cercano, peor
          let dm = 99; for (let j = 0; j < NT; j++) if (llega[j] && pasa(j) && j < NR && cel[j]) { const dx = Math.max(0, x0s[j] - x1s[i], x0s[i] - x1s[j]), dy = Math.max(0, y0s[j] - y1s[i], y0s[i] - y1s[j]); dm = Math.min(dm, dx + dy); }
          sinAcceso++; pen(70 + Math.min(dm, 20) * 3, `${R[i].n}: sin acceso`);
        }
        else vis[i] = 1;
      }
      // dormitorios: un baño a mano (misma planta)
      for (let i = 0; i < NR; i++) if ((R[i].t === 'dormitorio' || R[i].t === 'principal') && cel[i]) {
        let ok = false; for (let j = 0; j < NR && !ok; j++) if ((R[j].t === 'bano' || R[j].t === 'aseo') && R[j].piso === R[i].piso && cel[j]) { const dx = (x0s[i] + x1s[i] - x0s[j] - x1s[j]) / 2, dy = (y0s[i] + y1s[i] - y0s[j] - y1s[j]) / 2; if (Math.abs(dx) + Math.abs(dy) < 16) ok = true; }
        if (!ok) pen(9, `${R[i].n}: baño lejos`);
      }
      // distribuidores automáticos: sirven si comunican; en una banda exterior, con fachada, se desaprovechan
      let pasoA = 0;
      for (let k = 0; k < NA; k++) { const [f, xa, xb, ya, yb, n] = autos[k]; const a = (xb - xa) * (yb - ya) * A1; pasoA += a; areaTot += a; if (n !== 1) pen(a * 1.6, 'Espacio sin uso en fachada'); }
      for (let i = 0; i < NR; i++) if (R[i].t === 'paso') pasoA += area[i];
      if (pasoA > areaTot * 0.15) pen((pasoA - areaTot * 0.15) * 2.2, 'Demasiado pasillo');
      // superficie total frente a la pedida, y equilibrio entre plantas
      const obj = ctx.objetivo || prog.total;
      pen(((areaTot - obj) / obj) ** 2 * 60, 'Superficie total');
      // compacidad: perímetro de la huella frente a su área
      const pg = perimetro(grids[0], W, H), ag = celdas(grids[0], W, H);
      coste += (pg / Math.sqrt(Math.max(1, ag)) - 4) * (gust.minimalista ? 3.2 : 1.6);
      // parcela: la huella girada tiene que caber en lo edificable (retranqueos supuestos)
      if (ctx.edificable) {
        const [ew, eh] = ctx.edificable, wm = W * PASO, hm = H * PASO, par = G.rot % 2 === 0;
        const sx = (par ? wm : hm) - ew, sy = (par ? hm : wm) - eh;
        if (sx > 0) pen(sx * 70, 'No cabe en la parcela'); if (sy > 0) pen(sy * 70, 'No cabe en la parcela');
        if (gust.piscina) { const libre = eh - (par ? hm : wm); if (libre < 6) pen((6 - libre) * 5, 'Poco jardín para la piscina'); }
      }
      // gustos que son forma
      if (gust.patio) { if (!patio.length) pen(24, 'Sin patio'); else if (iS >= 0 && !patioAdj[iS]) pen(10, 'Patio lejos del salón'); else coste -= 6; }
      else if (patio.length) coste += 3;
      if (gust.terraza && plantas > 1) { let t = 0; for (let i = 0; i < NR; i++) if (R[i].piso === 1 && terrAdj[i] >= 2 && R[i].t !== 'bano') t++; if (!terr.length || !t) pen(20, 'Sin terraza'); else coste -= 5; }
      if (gust.minimalista && (patio.length || terr.length > 2)) coste += 4;
      // terraza hacia un rumbo: alguna celda de terraza en ese lado de la casa
      if (orient.terraza && terr.length) {
        const lado = Object.keys(ru).find((k) => ru[k] === orient.terraza);
        const cx = W / 2, cy = H / 2;
        const bien = terr.some(([b, n]) => { const [xa, xb] = geo.bx[b], [ya, yb] = geo.by[n], mx = (xa + xb) / 2, my = (ya + yb) / 2; return lado === 'xp' ? mx > cx : lado === 'xm' ? mx < cx : lado === 'yp' ? my > cy : my < cy; });
        if (!bien) pen(22, `Terraza sin vistas al ${NOMBRE_RUMBO[orient.terraza]}`); else coste -= 4;
      }
      if (plantas > 1) { let a0 = 0, a1 = 0; for (const g of [0, 1]) { const c = celdas(grids[g], W, H) * A1; if (g) a1 = c; else a0 = c; } if (a1 < a0 * 0.35) pen((a0 * 0.35 - a1) * 0.8, 'Planta alta pequeña'); }
      if (!detalle) return coste;
      return { coste, det, grids, W, H, geo, piezas, autos, patio, terr, area: Array.from(area), areaTot, sinAcceso, llega: Array.from(vis), ext: Array.from(ext), adj: Array.from(adj), adjA: adjA ? Array.from(adjA) : null, NA };
    }
    const luzGusto = !!(ctx.gustos && ctx.gustos.luz);
    const orient = ctx.orient || {}, luzSalon = !!ctx.luzSalon;
    return { evaluar, construir };
  }
  // patio: el cuerpo P de una banda de fachada, vacío, con los dos cuerpos laterales y el núcleo ocupados (casa en U)
  function esPatio(mask, b, n) { return b === 'P' && n !== 1 && !tiene(mask, 0, 'P', n) && tiene(mask, 0, 'I', n) && tiene(mask, 0, 'D', n) && tiene(mask, 0, 'P', 1); }
  function perimetro(g, W, H) { let p = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = g[y * W + x] >= 0 || g[y * W + x] === -2; if (!v) continue; const o = (xx, yy) => xx < 0 || yy < 0 || xx >= W || yy >= H || !(g[yy * W + xx] >= 0 || g[yy * W + xx] === -2); if (o(x + 1, y)) p++; if (o(x - 1, y)) p++; if (o(x, y + 1)) p++; if (o(x, y - 1)) p++; } return p; }
  function celdas(g, W, H) { let c = 0; for (let i = 0; i < W * H; i++) if (g[i] >= 0) c++; return c; }

  // ── candidatas: las envolventes que mejor encajan, con sus medidas ──
  const OPC_W = { I: [4, 6, 8], P: [6, 8, 10, 12], D: [4, 6, 8] }, OPC_D = { 2: [4, 5], 1: [2, 3, 4], 3: [4, 5, 6] };
  function firma(mask, plantas) {
    // forma de la planta baja (y de la alta), igual por simetría este-oeste y norte-sur
    const f = (m, sx, sy) => { let s = ''; for (let fl = 0; fl < plantas; fl++) for (const n of (sy ? [3, 1, 2] : BANDAS)) for (const b of (sx ? ['D', 'P', 'I'] : CUERPOS)) s += tiene(m, fl, b, n) ? '1' : '0'; return s; };
    return [f(mask, 0, 0), f(mask, 1, 0), f(mask, 0, 1), f(mask, 1, 1)].sort()[0];
  }
  function candidatas(prog, ctx, cuantas, excluir) {
    const E = enumerar();
    const plantasOK = (m) => { const dos = (m >> 9) !== 0; return ctx.plantas === 1 ? !dos : ctx.plantas === 2 ? dos : true; };
    const out = [], vistas = new Map();
    const T0 = prog.R.reduce((a, r) => a + (r.piso !== 1 ? r.obj : 0), 0), T1dos = prog.R.reduce((a, r) => a + (['principal', 'dormitorio', 'bano', 'estudio', 'vestidor'].includes(r.t) ? r.obj : 0), 0);
    const nLuz = prog.R.filter((r) => r.luz === 2).length;
    for (const m of E.lista) {
      if (!plantasOK(m)) continue;
      const dos = (m >> 9) !== 0;
      const sig = firma(m, dos ? 2 : 1);
      if (excluir && excluir.includes(sig)) continue;
      const baseObj = dos ? (T0 - T1dos) * 1.1 + 9 : prog.total, altoObj = dos ? T1dos * 1.12 + 9 : 0;
      let mejor = null;
      for (const wI of OPC_W.I) for (const wP of OPC_W.P) for (const wD of OPC_W.D) for (const dN of OPC_D[2]) for (const dS of OPC_D[3]) for (const dC of OPC_D[1]) {
        const w = { I: wI, P: wP, D: wD }, d = { 2: dN, 1: dC, 3: dS };
        let a0 = 0, a1 = 0, xs = 0, ys = 0, cells = 0;
        const usa = { I: 0, P: 1, D: 0 };
        for (const b of CUERPOS) for (const n of BANDAS) { if (tiene(m, 0, b, n)) { a0 += w[b] * d[n]; usa[b] = 1; cells++; } if (tiene(m, 1, b, n)) a1 += w[b] * d[n]; }
        for (const b of CUERPOS) if (usa[b]) xs += w[b];
        ys = dN + dC + dS;
        a0 *= A1; a1 *= A1;
        let c = ((a0 - baseObj) / baseObj) ** 2 * 50 + (dos ? ((a1 - altoObj) / altoObj) ** 2 * 50 : 0);
        if (ctx.edificable) { const [ew, eh] = ctx.edificable; const fit = (p, q) => Math.max(0, p - ew) + Math.max(0, q - eh); c += Math.min(fit(xs * PASO, ys * PASO), fit(ys * PASO, xs * PASO)) * 60; }
        if (!mejor || c < mejor.c) mejor = { c, w, d };
      }
      // rasgos de forma
      let perim = 0, cells = 0, huecos = 0;
      for (const b of CUERPOS) for (const n of BANDAS) if (tiene(m, 0, b, n)) { cells++; for (const l of ['N', 'S', 'E', 'O']) { const k = vecino(`0${b}${n}`, l); if (!k || !tiene(m, 0, k[1], +k[2])) perim++; } }
      let patio = 0;
      for (const b of CUERPOS) for (const n of BANDAS) if (!tiene(m, 0, b, n)) { if (esPatio(m, b, n)) patio++; else huecos++; }
      // compacidad con las medidas reales: perímetro / raíz del área (un cuadrado da 4)
      let pm = 0, am = 0;
      for (const b of CUERPOS) for (const n of BANDAS) if (tiene(m, 0, b, n)) { const wb = mejor.w[b] * PASO, dn = mejor.d[n] * PASO; am += wb * dn; for (const l of ['N', 'S', 'E', 'O']) { const k = vecino(`0${b}${n}`, l); if (!k || !tiene(m, 0, k[1], +k[2])) pm += l === 'N' || l === 'S' ? wb : dn; } }
      const forma = pm / Math.sqrt(am);
      let c = mejor.c + Math.max(0, forma - 4) * (ctx.gustos?.minimalista ? 14 : 7);
      // un cuerpo colgado de una sola celda, en peine, se castiga
      for (const b of ['I', 'D']) { let k2 = 0; for (const n of BANDAS) if (tiene(m, 0, b, n)) k2++; if (k2 === 1) c += 3; }
      if (perim < nLuz + 2) c += (nLuz + 2 - perim) * 2;
      if (ctx.gustos?.patio) c += patio ? -6 : 10; else c += patio * 3;
      if (ctx.gustos?.terraza && dos) { const t = (m & 0x1FF) & ~((m >> 9) & 0x1FF); c += t ? -4 : 8; }
      if (cells < Math.ceil(prog.R.length / 3.2)) c += 12;
      if (ctx.preferir && ctx.preferir.sig === firma(m, dos ? 2 : 1)) c -= 30;
      const usaB = CUERPOS.filter((b) => BANDAS.some((n) => tiene(m, 0, b, n))).length;
      const clase = (dos ? '2' : '1') + (patio ? 'U' : cells === usaB * 3 ? 'R' : cells >= usaB * 3 - 1 ? 'L' : 'P');
      const prev = vistas.get(sig);
      if (!prev || c < prev.c) vistas.set(sig, { mask: m, c, ...mejor, sig, dos, clase });
    }
    const orden = [...vistas.values()].sort((a, b) => a.c - b.c);
    // diversidad: alternamos una y dos plantas si da igual
    // diversidad: como mucho tres por clase de forma (rectangular, en L, en U con patio, en peine; una o dos plantas)
    const sel = [], porClase = {};
    for (const v of orden) { if (sel.length >= cuantas) break; if ((porClase[v.clase] || 0) >= 3) continue; porClase[v.clase] = (porClase[v.clase] || 0) + 1; sel.push(v); }
    return { sel, total: E.lista.length, aristas: E.aristas, formas: vistas.size };
  }

  // ── recocido simulado sobre una envolvente ──
  function* recocer(prog0, cand, ctx, semilla, iteraciones, previo, T0 = 26) {
    const plantas = cand.dos ? 2 : 1;
    const R = repartirPlantas(prog0.R, plantas);
    const prog = { ...prog0, R };
    const NR = R.length, rand = rng(semilla);
    const T = tiras(cand.mask, plantas);
    const G = { mask: cand.mask, w: { ...cand.w }, d: { ...cand.d }, rot: ctx.rotIni ?? 0 };
    for (const r of R) if (r.t === 'escalera') r.fijo = G.d[1] >= 4 ? 4 : 7;
    const S = previo ? clonar(previo) : { G, T, asig: T.map(() => []), dW: new Float64Array(NR), sx: 2, plantas, bandaDe: new Int8Array(NR) };
    if (previo) for (const r of R) if (r.t === 'escalera') r.fijo = S.G.d[1] >= 4 ? 4 : 7;
    const ev = crearEvaluador(prog, ctx);
    // tiras donde puede ir cada estancia (su planta; la escalera, en la banda de servicios del cuerpo P)
    const puede = R.map((r) => T.map((t, ti) => {
      if (t.f !== r.piso) return false;
      if (r.t === 'escalera') return t.n === 1 && t.cuerpos.includes('P');
      if (r.t === 'garaje') return t.n !== 1;
      if (r.t === 'porche') return t.n !== 1;
      return true;
    }).map((v, ti) => (v ? ti : -1)).filter((v) => v >= 0));
    // reparto inicial, como lo haría un arquitecto: a la calle la entrada, el garaje y los dormitorios secundarios;
    // en la banda de servicios, los pasos, los baños y la escalera; al jardín, el salón, la cocina, el porche y el principal
    const ru0 = rumbos(G.rot), calle0 = ctx.calle || 'N';
    const bandaCalle = ru0.ym === calle0 ? 2 : ru0.yp === calle0 ? 3 : 2, bandaJardin = bandaCalle === 2 ? 3 : 2;
    const PAPEL = { vestibulo: 'calle', garaje: 'calle', dormitorio: 'calle', estudio: 'calle', paso: 'serv', bano: 'serv', aseo: 'serv', lavadero: 'serv', escalera: 'serv', vestidor: 'serv', salon: 'jardin', cocina: 'jardin', porche: 'jardin', principal: 'jardin' };
    const carga = T.map(() => 0);
    const orden = R.map((r, i) => i).sort((a, b) => R[b].obj - R[a].obj);
    // orden por papel: el vestíbulo y el salón se colocan primero, cerca del centro
    const prioridad = { vestibulo: 0, escalera: 0, salon: 1, cocina: 2, paso: 3 };
    orden.sort((a, b) => (prioridad[R[a].t] ?? 5) - (prioridad[R[b].t] ?? 5));
    if (!previo) for (const i of orden) {
      const r = R[i], ops = puede[i]; if (!ops.length) continue;
      const papel = PAPEL[r.t] || 'calle', nB = papel === 'serv' ? 1 : papel === 'calle' ? bandaCalle : bandaJardin;
      let pref = ops.filter((ti) => T[ti].n === nB);
      // si la planta alta no tiene esa banda, cualquiera de fachada
      if (!pref.length) pref = ops.filter((ti) => (papel === 'serv') === (T[ti].n === 1));
      const lista = pref.length ? pref : ops;
      let best = lista[0], bv = Infinity;
      for (const ti of lista) { const cap = T[ti].cuerpos.reduce((a, b) => a + G.w[b], 0) * G.d[T[ti].n] * A1; const v = (carga[ti] + r.obj) / cap + rand() * 0.1; if (v < bv) { bv = v; best = ti; } }
      // el vestíbulo y el salón, en medio de su tira; lo demás, alrededor
      const L = S.asig[best];
      if (r.t === 'vestibulo' || r.t === 'salon') L.splice(Math.floor(L.length / 2), 0, i); else if (r.t === 'cocina') { const s2 = L.findIndex((q) => R[q].t === 'salon'); L.splice(s2 >= 0 ? s2 + 1 : L.length, 0, i); } else if (rand() < 0.5) L.push(i); else L.unshift(i);
      carga[best] += r.obj;
    }
    const banda = () => { for (let ti = 0; ti < T.length; ti++) for (const i of S.asig[ti]) S.bandaDe[i] = T[ti].n; };
    banda();
    // la escalera, siempre en su tira (y en el mismo sitio en las dos plantas)
    let c = ev.evaluar(S, false), mejor = c, mejorS = clonar(S);
    const hist = [c];
    const T1 = 0.2;
    const tiempo0 = ahora();
    for (let it = 0; it < iteraciones; it++) {
      const temp = T0 * Math.pow(T1 / T0, it / iteraciones);
      const deshacer = mover(S, R, puede, rand, ctx, plantas);
      if (!deshacer) continue;
      banda();
      const c2 = ev.evaluar(S, false);
      if (c2 <= c || rand() < Math.exp((c - c2) / temp)) { c = c2; if (c < mejor - 1e-9) { mejor = c; mejorS = clonar(S); } }
      else { deshacer(); banda(); }
      if ((it & 255) === 255) { hist.push(mejor); yield { it, mejor, hist, S: mejorS, ms: ahora() - tiempo0 }; }
    }
    const fin = ev.evaluar(mejorS, true);
    return { S: mejorS, R, prog, fin, hist, cand, ctx };
  }
  function clonar(S) { return { G: { mask: S.G.mask, w: { ...S.G.w }, d: { ...S.G.d }, rot: S.G.rot }, T: S.T, asig: S.asig.map((l) => l.slice()), dW: S.dW.slice(), sx: S.sx, plantas: S.plantas, bandaDe: S.bandaDe.slice() }; }
  // un movimiento al azar; devuelve cómo deshacerlo
  function mover(S, R, puede, rand, ctx, plantas) {
    const NR = R.length, u = rand();
    const dondeEsta = (i) => { for (let ti = 0; ti < S.asig.length; ti++) { const k = S.asig[ti].indexOf(i); if (k >= 0) return [ti, k]; } return null; };
    if (u < 0.3) {                                                    // llevar una estancia a otra tira
      const i = (rand() * NR) | 0; if (R[i].t === 'escalera') return null;
      const ops = puede[i]; if (ops.length < 1) return null;
      const p = dondeEsta(i); if (!p) return null;
      const dest = ops[(rand() * ops.length) | 0]; const pos = (rand() * (S.asig[dest].length + 1)) | 0;
      const [ti, k] = p; S.asig[ti].splice(k, 1); S.asig[dest].splice(Math.min(pos, S.asig[dest].length), 0, i);
      return () => { const q = S.asig[dest].indexOf(i); S.asig[dest].splice(q, 1); S.asig[ti].splice(k, 0, i); };
    }
    if (u < 0.55) {                                                   // intercambiar dos estancias de la misma planta
      const i = (rand() * NR) | 0, j = (rand() * NR) | 0; if (i === j || R[i].piso !== R[j].piso || R[i].t === 'escalera' || R[j].t === 'escalera') return null;
      const p = dondeEsta(i), q = dondeEsta(j); if (!p || !q) return null;
      if (!puede[i].includes(q[0]) || !puede[j].includes(p[0])) return null;
      S.asig[p[0]][p[1]] = j; S.asig[q[0]][q[1]] = i;
      return () => { S.asig[p[0]][p[1]] = i; S.asig[q[0]][q[1]] = j; };
    }
    if (u < 0.62) {                                                   // intercambiar el contenido de dos tiras de la misma planta
      const a = (rand() * S.asig.length) | 0, b = (rand() * S.asig.length) | 0; if (a === b || S.T[a].f !== S.T[b].f) return null;
      if (S.asig[a].some((i) => !puede[i].includes(b)) || S.asig[b].some((i) => !puede[i].includes(a))) return null;
      [S.asig[a], S.asig[b]] = [S.asig[b], S.asig[a]];
      return () => { [S.asig[a], S.asig[b]] = [S.asig[b], S.asig[a]]; };
    }
    if (u < 0.74) {                                                   // cambiar el orden dentro de una tira
      const ti = (rand() * S.asig.length) | 0, L = S.asig[ti]; if (L.length < 2) return null;
      const a = (rand() * L.length) | 0, b = (rand() * L.length) | 0; if (a === b) return null;
      [L[a], L[b]] = [L[b], L[a]];
      return () => { [L[a], L[b]] = [L[b], L[a]]; };
    }
    if (u < 0.88) {                                                   // ajustar un ancho (un módulo arriba o abajo)
      const i = (rand() * NR) | 0, d = rand() < 0.5 ? -1 : 1, v = S.dW[i];
      S.dW[i] = clamp(v + d, -6, 8);
      return () => { S.dW[i] = v; };
    }
    if (u < 0.92 && plantas > 1) {                                    // mover la escalera dentro del cuerpo P
      const v = S.sx, w = S.G.w.P; S.sx = clamp(v + (rand() < 0.5 ? -1 : 1), 0, Math.max(0, w - 4));
      return () => { S.sx = v; };
    }
    if (u < 0.985) {                                                  // geometría: ancho de un cuerpo o fondo de una banda
      if (rand() < 0.55) {
        const b = CUERPOS[(rand() * 3) | 0], v = S.G.w[b], lim = b === 'P' ? [6, 14] : [4, 8];
        S.G.w[b] = clamp(v + (rand() < 0.5 ? -2 : 2), lim[0], lim[1]);
        return () => { S.G.w[b] = v; };
      }
      const n = [2, 3, 1][(rand() * 3) | 0], v = S.G.d[n];
      S.G.d[n] = clamp(v + (rand() < 0.5 ? -1 : 1), n === 1 ? 2 : 3, n === 1 ? 4 : 6);
      if (plantas > 1) for (const r of R) if (r.t === 'escalera') r.fijo = S.G.d[1] >= 4 ? 4 : 7;
      return () => { S.G.d[n] = v; if (plantas > 1) for (const r of R) if (r.t === 'escalera') r.fijo = S.G.d[1] >= 4 ? 4 : 7; };
    }
    const v = S.G.rot; S.G.rot = (v + 1 + ((rand() * 3) | 0)) % 4;   // girar la casa sobre la parcela
    return () => { S.G.rot = v; };
  }

  // ═══ 4 · el despiece ════════════════════════════════════════════════
  //  Formas a partir de la serie J y de los cortes de ancho (CUEVA ORIGEN, solver.js).
  const COSTE = { pieza: 1000, corte: 40, grande: 10, hueco: 200000 };
  function formasDeSerie(serie, cortes) {
    const cel = (m) => Math.round(m / PASO), porForma = new Map();
    const pref = (f, g) => ((f.corte == null) !== (g.corte == null) ? f.corte == null : f.aPadre < g.aPadre);
    const anadir = (f) => { const k = f.L + 'x' + f.W, p = porForma.get(k); if (!p || pref(f, p)) porForma.set(k, f); };
    for (const j of serie) {
      const L = cel(j.l), W = cel(j.a);
      anadir({ tipo: j.id, corte: null, l: j.l, a: j.a, aPadre: j.a, L, W, area: L * W });
      for (const c of cortes) { if (c >= j.a - 1e-6) continue; anadir({ tipo: j.id, corte: c, l: j.l, a: c, aPadre: j.a, L, W: cel(c), area: L * cel(c) }); }
    }
    return [...porForma.values()].sort((a, b) => b.area - a.area || (a.corte == null ? -1 : 1));
  }
  function opcionesDe(formas) {
    const amax = Math.max(...formas.map((f) => f.area)), ops = [];
    formas.forEach((f, fi) => { const coste = COSTE.pieza + (f.corte != null ? COSTE.corte : 0) + COSTE.grande * (1 - (f.area / amax) ** 2); ops.push({ fi, w: f.L, h: f.W, area: f.area, coste }); if (f.L !== f.W) ops.push({ fi, w: f.W, h: f.L, area: f.area, coste }); });
    ops.sort((a, b) => a.coste / a.area - b.coste / b.area || b.area - a.area || b.w - a.w);
    return ops;
  }
  function zobrist(n, semilla) { const r = rng(semilla), z1 = new Uint32Array(n), z2 = new Uint32Array(n); for (let i = 0; i < n; i++) { z1[i] = (r() * 4294967296) >>> 0; z2[i] = (r() * 4294967296) >>> 0; } return [z1, z2]; }
  // cobertura exacta por ramificación y poda (de CUEVA ORIGEN, gramática/solver.js)
  function crearSolver(cols, filas, region, formas) {
    const N = cols * filas, ops = opcionesDe(formas), NO = ops.length;
    const OW = new Int16Array(NO + 1), OH = new Int16Array(NO + 1), OC = new Float64Array(NO + 1);
    ops.forEach((o, i) => { OW[i] = o.w; OH[i] = o.h; OC[i] = o.coste; }); OW[NO] = 1; OH[NO] = 1; OC[NO] = COSTE.hueco;
    const libre = new Uint8Array(N); let rem = 0, remB = 0, remN = 0;
    for (let i = 0; i < N; i++) if (region[i]) { libre[i] = 1; rem++; if (((i % cols) + ((i / cols) | 0)) & 1) remN++; else remB++; }
    function encaja(p, o) { const w = OW[o], h = OH[o], x = p % cols, y = (p / cols) | 0; if (x + w > cols || y + h > filas) return false; for (let dy = 0; dy < h; dy++) { const b = p + dy * cols; for (let dx = 0; dx < w; dx++) if (!libre[b + dx]) return false; } return true; }
    let amax = 1;
    for (let o = 0; o < NO; o++) { if (ops[o].area <= amax) continue; let cabe = false; for (let p = 0; p < N && !cabe; p++) if (libre[p] && encaja(p, o)) cabe = true; if (cabe) amax = ops[o].area; }
    const [Z1, Z2] = zobrist(N, 0x9E3779B9); let h1 = 0, h2 = 0, g = 0; const memo = new Map();
    const P = new Int16Array(N + 1), K = new Int16Array(N + 1), AP = new Int16Array(N + 1), RUN = new Int16Array(N + 1);
    let top = -1, nodos = 0, mejorCoste = Infinity, mejor = null, terminado = false;
    function marcar(p, o, v) { const w = OW[o], h = OH[o], x0 = p % cols, y0 = (p / cols) | 0; for (let dy = 0; dy < h; dy++) { const b = p + dy * cols; for (let dx = 0; dx < w; dx++) { const i = b + dx; libre[i] = v; h1 ^= Z1[i]; h2 ^= Z2[i]; const negra = ((x0 + dx) + (y0 + dy)) & 1, d = v ? 1 : -1; rem += d; if (negra) remN += d; else remB += d; } } g += v ? -OC[o] : OC[o]; }
    function racha(p) { let r = 0; const x = p % cols; while (x + r < cols && libre[p + r] && r < 64) r++; return r; }
    function siguiente(p) { let i = p + 1; while (i < N && !libre[i]) i++; return i < N ? i : -1; }
    function cota() { const d = remB > remN ? remB - remN : remN - remB; return d * COSTE.hueco + Math.ceil((rem - d) / amax) * COSTE.pieza; }
    function volcar(hasta) { if (hasta >= 0 && AP[hasta] < 0) hasta--; const out = []; for (let i = 0; i <= hasta; i++) { const p = P[i], o = AP[i]; out.push([p % cols, (p / cols) | 0, OW[o], OH[o], o === NO ? -1 : ops[o].fi]); } return out; }
    function empujar(p) { top++; P[top] = p; K[top] = 0; AP[top] = -1; RUN[top] = racha(p); }
    const inicio = siguiente(-1); if (inicio < 0) { terminado = true; mejorCoste = 0; mejor = []; } else empujar(inicio);
    function paso(ms) {
      if (terminado) return true; const fin = ahora() + ms; let vuelta = 0;
      while (top >= 0) {
        if ((++vuelta & 1023) === 0 && ahora() > fin) return false;
        const p = P[top];
        if (AP[top] >= 0) { marcar(p, AP[top], 1); AP[top] = -1; }
        if (K[top] > NO) { top--; continue; }
        const o = K[top]++;
        if (o < NO && (OW[o] > RUN[top] || !encaja(p, o))) continue;
        marcar(p, o, 0); AP[top] = o; nodos++;
        const np = siguiente(p);
        if (np < 0) { if (g < mejorCoste - 1e-9) { mejorCoste = g; mejor = volcar(top); } continue; }
        if (g + cota() >= mejorCoste - 1e-9) continue;
        const clave = h1 * 2097152 + (h2 >>> 11), visto = memo.get(clave);
        if (visto !== undefined && visto <= g + 1e-9) continue;
        if (memo.size > 600000) memo.clear(); memo.set(clave, g);
        empujar(np);
      }
      terminado = true; return true;
    }
    return { paso, terminado: () => terminado, nodos: () => nodos, mejor: () => mejor, coste: () => mejorCoste, cota: () => Math.ceil(N / amax) };
  }

  // fachadas: programación dinámica exacta sobre el largo de un muro con piezas de pie de 3,00 m
  function formatosMuro() {
    // una pieza puesta de pie: uno de sus lados es la altura de planta (3,00 m); el otro, el largo de muro que cubre
    const alto = Math.round(3 / PASO), out = [];
    const vistos = new Set();
    for (const j of SERIE) {
      const L = Math.round(j.l / PASO), W = Math.round(j.a / PASO);
      if (W === alto && !vistos.has(L)) { vistos.add(L); out.push({ w: L, tipo: j.id, corte: null }); }
      if (L === alto && !vistos.has(W)) { vistos.add(W); out.push({ w: W, tipo: j.id, corte: null }); }
    }
    for (const j of SERIE) {
      const L = Math.round(j.l / PASO);
      if (L !== alto) continue;
      for (const c of CORTES) { const Wc = Math.round(c / PASO); if (c < j.a - 1e-6 && !vistos.has(Wc)) { vistos.add(Wc); out.push({ w: Wc, tipo: j.id, corte: c }); } }
    }
    return out.sort((a, b) => b.w - a.w);
  }
  function muroDP(n, fm) {
    const best = new Float64Array(n + 1).fill(Infinity), de = new Int16Array(n + 1).fill(-1); best[0] = 0;
    for (let i = 1; i <= n; i++) for (let k = 0; k < fm.length; k++) { const w = fm[k].w; if (w > i) continue; const c = best[i - w] + 1000 + (fm[k].corte != null ? 40 : 0) - w * 0.1; if (c < best[i]) { best[i] = c; de[i] = k; } }
    if (!isFinite(best[n])) return null;
    const out = []; let i = n; while (i > 0) { const k = de[i]; out.push(fm[k]); i -= fm[k].w; }
    // las piezas grandes, en los extremos; las de ajuste, hacia el centro
    out.sort((a, b) => b.w - a.w);
    const ord = []; out.forEach((p, j) => (j % 2 ? ord.push(p) : ord.unshift(p)));
    return ord;
  }
  const nombreJ = (f) => (f.corte == null ? f.tipo : `${f.tipo} (${String(f.corte.toFixed(2)).replace('.', ',')})`);

  // ═══ de una planta en la trama (rejillas de estancias) a la casa: muros, huecos, losas y despiece ═══
  //  rooms: [{t, n, f}], grids: [Int16Array] con el índice de estancia (≥ 0), −1 fuera, −2 patio, −3 terraza
  function materializar(base, presupuesto = 160) {
    const { W, H, grids, rooms, rot } = base, plantas = grids.length, ru = rumbos(rot || 0);
    const exterior = (g, x, y) => x < 0 || y < 0 || x >= W || y >= H || g[y * W + x] < 0;
    const esPorche = (i) => i >= 0 && rooms[i] && rooms[i].t === 'porche';
    // ── muros exteriores: aristas entre interior y exterior, unidas en tramos rectos ──
    const muros = [];
    for (let f = 0; f < plantas; f++) {
      const g = grids[f];
      const interior = (x, y) => (!exterior(g, x, y) && !esPorche(g[y * W + x])) || (x >= 0 && y >= 0 && x < W && y < H && g[y * W + x] === -4);
      // horizontales (frente norte y sur de las celdas)
      for (const lado of ['ym', 'yp']) for (let y = 0; y < H; y++) {
        let ini = -1;
        for (let x = 0; x <= W; x++) {
          const ok = x < W && interior(x, y) && !interior(x, lado === 'ym' ? y - 1 : y + 1);
          if (ok && ini < 0) ini = x;
          if (!ok && ini >= 0) { muros.push({ f, lado, eje: 'x', a: ini, b: x, c: lado === 'ym' ? y : y + 1, dentro: lado === 'ym' ? y : y, rumbo: ru[lado] }); ini = -1; }
        }
      }
      for (const lado of ['xm', 'xp']) for (let x = 0; x < W; x++) {
        let ini = -1;
        for (let y = 0; y <= H; y++) {
          const ok = y < H && interior(x, y) && !interior(lado === 'xm' ? x - 1 : x + 1, y);
          if (ok && ini < 0) ini = y;
          if (!ok && ini >= 0) { muros.push({ f, lado, eje: 'y', a: ini, b: y, c: lado === 'xm' ? x : x + 1, dentro: x, rumbo: ru[lado] }); ini = -1; }
        }
      }
    }
    // ── huecos: una ventana por estancia y fachada, a la medida de su uso; la puerta de entrada y la del garaje ──
    const calle = base.calle || 'N', jardin = OPUESTA[calle];
    const ventanas = new Set(), segEntrada = {};
    for (const m of muros) {
      const g = grids[m.f]; m.huecos = [];
      // tramos de estancia a lo largo del muro
      let i = m.a;
      while (i < m.b) {
        const cel = (k) => (m.eje === 'x' ? g[m.dentro * W + k] : g[k * W + m.dentro]);
        const r = cel(i); let j = i; while (j < m.b && cel(j) === r) j++;
        const R = rooms[r], L = (j - i) * PASO, a0 = (i - m.a) * PASO, cx = a0 + L / 2;
        if (R && R.entrada) (segEntrada[r] = segEntrada[r] || []).push({ m, a0, L, cx });
        // la doble altura: un ventanal alto hacia el jardín
        if (r === -4 && (m.rumbo === 'S' || m.rumbo === jardin) && L >= 1.4) m.huecos.push({ tipo: 'ventanal', a: a0 + 0.3, b: a0 + L - 0.3, z0: 0.2, z1: 2.4, r: -4 });
        const otroLado = m.eje === 'x' ? (m.lado === 'ym' ? m.dentro - 1 : m.dentro + 1) : (m.lado === 'xm' ? m.dentro - 1 : m.dentro + 1);
        const daPorche = m.eje === 'x' ? esPorche(otroLado >= 0 && otroLado < H ? g[otroLado * W + i] : -1) : esPorche(otroLado >= 0 && otroLado < W ? g[i * W + otroLado] : -1);
        const clave = `${r}:${m.rumbo}`;
        if (R && L >= 1.4 && !ventanas.has(clave)) {
          let h = null;
          if (R.t === 'salon' && (m.rumbo === 'S' || m.rumbo === jardin || daPorche)) h = { tipo: 'ventanal', a: a0 + 0.4, b: a0 + L - 0.4, z0: 0, z1: 2.4 };
          else if (R.t === 'salon' || R.t === 'principal' || R.t === 'dormitorio' || R.t === 'estudio') { const w = Math.min(L - 0.5, R.t === 'salon' ? 2.4 : 1.5); h = { tipo: 'ventana', a: cx - w / 2, b: cx + w / 2, z0: 0.9, z1: 2.3 }; }
          else if (R.t === 'cocina') { const w = Math.min(L - 0.5, 1.8); h = { tipo: 'ventana', a: cx - w / 2, b: cx + w / 2, z0: 1.05, z1: 2.25 }; }
          else if (R.t === 'bano' || R.t === 'aseo' || R.t === 'lavadero') { const w = Math.min(L - 0.4, 0.75); h = { tipo: 'ventana', a: cx - w / 2, b: cx + w / 2, z0: 1.6, z1: 2.25 }; }
          else if (R.t === 'vestibulo' && m.rumbo === calle) { h = { tipo: 'puerta', a: cx - 0.5, b: cx + 0.5, z0: 0, z1: 2.3 }; }
          else if (R.t === 'garaje' && m.rumbo === calle && L >= 3) { h = { tipo: 'portón', a: cx - 1.35, b: cx + 1.35, z0: 0, z1: 2.4 }; }
          else if (R.t === 'escalera' && L >= 1.4) { h = { tipo: 'ventana', a: cx - 0.4, b: cx + 0.4, z0: 0.6, z1: 2.6 }; }
          if (h && h.b - h.a >= 0.5) { h.r = r; m.huecos.push(h); ventanas.add(clave); }
        }
        i = j;
      }
    }
    // la entrada, si aún no tiene puerta (y no es el salón con su corredera): en su fachada más larga, mejor a la calle
    rooms.forEach((R, r) => {
      if (!R || !R.entrada || !segEntrada[r]) return;
      const tiene = muros.some((m) => m.huecos.some((h) => h.r === r && (h.tipo === 'puerta' || (R.t === 'salon' && h.tipo === 'ventanal'))));
      if (tiene) return;
      const s0 = segEntrada[r].sort((p, q) => (q.m.rumbo === calle) - (p.m.rumbo === calle) || q.L - p.L)[0];
      s0.m.huecos = s0.m.huecos.filter((h) => !(h.r === r));
      s0.m.huecos.push({ tipo: 'puerta', a: s0.cx - 0.5, b: s0.cx + 0.5, z0: 0, z1: 2.3, r });
    });
    // ── piezas de muro ──
    const fm = formatosMuro();
    for (const m of muros) {
      const n = m.b - m.a, ps = muroDP(n, fm) || [];
      let x = 0; m.paneles = ps.map((p) => { const o = { x, w: p.w, tipo: p.tipo, corte: p.corte, nombre: nombreJ(p) }; x += p.w; return o; });
    }
    // ── losas: forjado sanitario, forjado de planta, cubiertas ──
    const formas = formasDeSerie(SERIE, CORTES);
    const regiones = [];
    const regionDe = (pred) => { const r = new Uint8Array(W * H); let n = 0; for (let i = 0; i < W * H; i++) if (pred(i)) { r[i] = 1; n++; } return n ? r : null; };
    const ocupada = (f, i) => grids[f] && grids[f][i] >= 0;
    const alto = (i) => plantas > 1 && (grids[1][i] >= 0 || grids[1][i] === -4);
    regiones.push({ k: 'sanitario', n: 'Forjado sanitario', uso: 'forjado', z: 0, reg: regionDe((i) => ocupada(0, i)) });
    if (plantas > 1) regiones.push({ k: 'planta1', n: 'Forjado de planta primera', uso: 'forjado', z: 1, reg: regionDe((i) => ocupada(1, i)) });
    regiones.push({ k: 'cubierta0', n: plantas > 1 ? 'Cubierta y terraza de planta baja' : 'Cubierta', uso: 'cubierta', z: 1, reg: regionDe((i) => ocupada(0, i) && !alto(i)) });
    if (plantas > 1 && base.cubierta === 'dosAguas') {
      // a dos aguas: dos faldones, cada uno de su alero a la cumbrera (ninguna placa la cruza)
      const yc = (base.norte || 0) + (base.D || H) / 2, ys = [];
      for (let i = 0; i < W * H; i++) if (alto(i)) ys.push(Math.floor(i / W));
      const y0 = Math.min(...ys), y1 = Math.max(...ys) + 1;
      regiones.push({ k: 'faldon0', n: 'Faldón de la cubierta a dos aguas', uso: 'cubierta', z: 2, inclinado: { lado: 0, alero: y0, cumbrera: yc, pendiente: 40 }, reg: regionDe((i) => alto(i) && Math.floor(i / W) < yc) });
      regiones.push({ k: 'faldon1', n: 'Faldón de la cubierta a dos aguas', uso: 'cubierta', z: 2, inclinado: { lado: 1, alero: y1, cumbrera: yc, pendiente: 40 }, reg: regionDe((i) => alto(i) && Math.floor(i / W) >= yc) });
    } else if (plantas > 1) regiones.push({ k: 'cubierta1', n: 'Cubierta', uso: 'cubierta', z: 2, reg: regionDe((i) => alto(i)) });
    const losas = [];
    for (const R of regiones) {
      if (!R.reg) continue;
      const s = crearSolver(W, H, R.reg, formas);
      s.paso(presupuesto);
      const piezas = (s.mejor() || []).map(([x, y, w, h, fi]) => ({ x, y, w, h, fi, nombre: fi >= 0 ? nombreJ(formas[fi]) : 'ajuste', tipo: fi >= 0 ? formas[fi].tipo : null, corte: fi >= 0 ? formas[fi].corte : null }));
      let celdasR = 0; for (let i = 0; i < W * H; i++) celdasR += R.reg[i];
      losas.push({ ...R, reg: Array.from(R.reg), piezas, demostrado: s.terminado(), nodos: s.nodos(), celdas: celdasR });
    }
    // ── despiece: por formato, número y m² ──
    const tabla = new Map();
    const sumar = (nombre, tipo, corte, m2, uso) => { const k = nombre; const v = tabla.get(k) || { nombre, tipo, corte, n: 0, m2: 0, usos: {} }; v.n++; v.m2 += m2; v.usos[uso] = (v.usos[uso] || 0) + 1; tabla.set(k, v); };
    for (const L of losas) for (const p of L.piezas) sumar(p.nombre, p.tipo, p.corte, p.w * p.h * A1, L.uso);
    for (const m of muros) for (const p of m.paneles) sumar(p.nombre, p.tipo, p.corte, p.w * PASO * 3, 'muro');
    const despiece = [...tabla.values()].sort((a, b) => (a.tipo || '').localeCompare(b.tipo || '', 'es', { numeric: true }) || (a.corte ?? 9) - (b.corte ?? 9));
    // tabiquería interior: aristas entre estancias distintas (salvo la cocina abierta al salón), en metros
    let tabique = 0;
    for (let f = 0; f < plantas; f++) { const g = grids[f]; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = g[y * W + x]; if (a < 0) continue; for (const [dx, dy] of [[1, 0], [0, 1]]) { const xx = x + dx, yy = y + dy; if (xx >= W || yy >= H) continue; const b = g[yy * W + xx]; if (b < 0 || b === a) continue; if (abiertas(rooms[a], rooms[b])) continue; if (esPorche(a) || esPorche(b)) continue; tabique += PASO; } } }
    const totales = { piezas: despiece.reduce((a, d) => a + d.n, 0), m2: despiece.reduce((a, d) => a + d.m2, 0), cortes: despiece.filter((d) => d.corte != null).reduce((a, d) => a + d.n, 0), losas: losas.reduce((a, l) => a + l.piezas.length, 0), paneles: muros.reduce((a, m) => a + m.paneles.length, 0), huecos: muros.reduce((a, m) => a + m.huecos.length, 0), tabique };
    const puertas = puertasDe(W, H, grids, rooms);
    const uniones = unionesDe(losas, muros, W, H);
    const montaje = [];
    const fase = (n, k, piezas, detalle) => { if (piezas) montaje.push({ n, k, piezas, detalle }); };
    const losa = (k) => losas.find((l) => l.k === k);
    fase('Forjado sanitario', 'sanitario', losa('sanitario')?.piezas.length || 0, 'Sobre los dados de cimentación, desde la escuadra de arranque');
    fase('Muros de la planta baja', 'muros0', muros.filter((m) => m.f === 0).reduce((a, m) => a + m.paneles.length, 0), 'Paneles de fachada de pie, aplomados y apuntalados');
    if (plantas > 1) fase('Forjado de planta primera', 'planta1', losa('planta1')?.piezas.length || 0, 'Placas sobre los muros de abajo');
    if (plantas > 1) fase('Muros de la planta primera', 'muros1', muros.filter((m) => m.f === 1).reduce((a, m) => a + m.paneles.length, 0), 'Paneles de fachada de la planta alta');
    fase(plantas > 1 ? 'Cubierta y terraza de planta baja' : 'Cubierta', 'cubierta0', losa('cubierta0')?.piezas.length || 0, 'Placas de cubierta; se retiran los puntales al terminar');
    if (plantas > 1) fase('Cubierta', 'cubierta1', losa('cubierta1')?.piezas.length || 0, 'Placas de la cubierta alta');
    if (losa('faldon0')) fase('Cubierta a dos aguas', 'faldones', losas.filter((l) => l.inclinado).reduce((a, l) => a + l.piezas.length, 0), 'Los dos faldones, de los aleros a la cumbrera; los hastiales se cierran a medida');
    // métricas (estimaciones del motor): compacidad de la huella y placa más larga
    let a0 = 0, per = 0; const g0 = grids[0];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (g0[y * W + x] < 0) continue; a0++; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H || g0[yy * W + xx] < 0) per++; } }
    const compacidad = a0 ? (4 * Math.sqrt(a0)) / per : 0;
    let luzMax = 0; for (const L of losas) for (const p of L.piezas) luzMax = Math.max(luzMax, Math.max(p.w, p.h) * PASO);
    const metricas = { compacidad, luzMax, huella: a0 * A1, fachada: muros.reduce((a, m) => a + (m.b - m.a) * PASO, 0) };
    return { muros, losas, despiece, totales, puertas, uniones, montaje, metricas };
  }
  // puertas interiores: cada estancia, una puerta hacia la pieza de paso que mejor le sirve
  function puertasDe(W, H, grids, rooms) {
    const out = [];
    grids.forEach((g, f) => {
      // tramos de arista compartida, por par de estancias y línea
      const tramos = new Map();
      const meter = (a, b, eje, c, u) => { const k = a < b ? `${a}|${b}|${eje}|${c}` : `${b}|${a}|${eje}|${c}`; if (!tramos.has(k)) tramos.set(k, []); tramos.get(k).push(u); };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const a = g[y * W + x]; if (a < 0) continue;
        if (x + 1 < W) { const b = g[y * W + x + 1]; if (b >= 0 && b !== a) meter(a, b, 'y', x + 1, y); }
        if (y + 1 < H) { const b = g[(y + 1) * W + x]; if (b >= 0 && b !== a) meter(a, b, 'x', y + 1, x); }
      }
      const runs = [];
      for (const [k, us] of tramos) {
        const [a, b, eje, c] = k.split('|'); us.sort((p, q) => p - q);
        let ini = us[0], prev = us[0];
        for (let i = 1; i <= us.length; i++) { if (i < us.length && us[i] === prev + 1) { prev = us[i]; continue; } runs.push({ a: +a, b: +b, eje, c: +c, s: ini, e: prev + 1 }); if (i < us.length) { ini = prev = us[i]; } }
      }
      const hecho = new Set();
      rooms.forEach((r, i) => {
        if (!r || r.f !== f || r.t === 'porche') return;
        const pref = r.suiteDe ? [r.suiteDe, ...(PUERTA[r.t] || [])] : PUERTA[r.t] || ['paso'];
        let mejor = null, mv = -1;
        for (const q of runs) {
          if (q.a !== i && q.b !== i) continue;
          const j = q.a === i ? q.b : q.a, R2 = rooms[j]; if (!R2) continue;
          if (abiertas(r, R2)) { mejor = null; mv = 99; break; }
          const pr = pref.indexOf(R2.t); if (pr < 0) continue;
          const largo = q.e - q.s; if (largo < 2 && !(largo >= 1 && (r.t === 'aseo' || r.t === 'bano'))) continue;
          const v = (pref.length - pr) * 10 + largo;
          if (v > mv) { mv = v; mejor = { q, j }; }
        }
        if (!mejor) return;
        const { q, j } = mejor, k = i < j ? `${i}|${j}` : `${j}|${i}`; if (hecho.has(k)) return; hecho.add(k);
        const L = (q.e - q.s) * PASO, ancho = Math.min(0.82, L - 0.3), a0 = q.s * PASO + Math.min(0.2, (L - ancho) / 2);
        // la hoja abre hacia la estancia (no hacia el paso)
        const lado = q.eje === 'y' ? (g[q.s * W + q.c] === i ? 1 : -1) : (g[q.c * W + q.s] === i ? 1 : -1);
        const libre = r.t === 'escalera' || rooms[j].t === 'escalera' || (r.t === 'paso' && rooms[j].t === 'vestibulo');
        out.push({ f, eje: q.eje, c: q.c, a: a0, b: a0 + ancho, hacia: lado, de: i, a_: j, libre });
      });
    });
    return out;
  }
  // uniones (reparto ilustrativo): forjado con forjado atornillado en los nudos; panel con panel de fachada,
  // soldado sobre chapas embebidas; las placas de cubierta, apoyadas en los muros
  function unionesDe(losas, muros, W, H) {
    const pts = [], n = { atornillada: 0, soldada: 0, apoyada: 0 };
    for (const L of losas) {
      const cuenta = new Map();
      for (const p of L.piezas) for (const [x, y] of [[p.x, p.y], [p.x + p.w, p.y], [p.x, p.y + p.h], [p.x + p.w, p.y + p.h]]) { const k = x + ',' + y; cuenta.set(k, (cuenta.get(k) || 0) + 1); }
      if (L.uso === 'forjado') { for (const [k, v] of cuenta) if (v >= 2) { const [x, y] = k.split(',').map(Number); pts.push({ t: 'atornillada', x: x * PASO, y: y * PASO, z: L.z, losa: L.k }); n.atornillada++; } }
      else for (const p of L.piezas) { const largoX = p.w >= p.h; for (const s of [0, 1]) { const x = largoX ? (p.x + p.w * s) * PASO : (p.x + p.w / 2) * PASO, y = largoX ? (p.y + p.h / 2) * PASO : (p.y + p.h * s) * PASO; pts.push({ t: 'apoyada', x, y, z: L.z, losa: L.k }); n.apoyada++; } }
    }
    for (const m of muros) for (let i = 1; i < m.paneles.length; i++) { const u = (m.a + m.paneles[i].x) * PASO; pts.push({ t: 'soldada', x: m.eje === 'x' ? u : m.c * PASO, y: m.eje === 'x' ? m.c * PASO : u, z: m.f, muro: true }); n.soldada++; }
    return { n, pts };
  }
  const abiertas = (a, b) => a && b && ((a.t === 'cocina' && a.abierta && b.t === 'salon') || (b.t === 'cocina' && b.abierta && a.t === 'salon') || (a.t === 'paso' && b.t === 'paso') || (a.t === 'porche' && b.t === 'porche') || (a.t === 'escalera' && b.t === 'paso') || (a.t === 'paso' && b.t === 'escalera'));

  // ── de un resultado del recocido a la propuesta completa ──
  function nombrar(cand, fin) {
    const dos = cand.dos, n = fin.patio.length, t = fin.terr.length;
    const m = cand.mask; let celdasB = 0; for (const b of CUERPOS) for (const k of BANDAS) if (tiene(m, 0, b, k)) celdasB++;
    const usa = CUERPOS.filter((b) => BANDAS.some((k) => tiene(m, 0, b, k))).length;
    const llena = celdasB === usa * 3;
    let forma = llena ? (usa === 1 ? 'En una crujía' : 'Compacta') : n ? 'En U, alrededor de un patio' : celdasB >= usa * 3 - 1 ? 'En L' : 'Abierta en peine';
    if (!llena && !n && celdasB <= usa * 2) forma = 'En peine, con fachadas largas';
    const extra = dos ? (t ? 'dos plantas con terraza' : 'dos plantas') : 'una planta';
    return `${forma}, en ${extra}`;
  }
  function propuesta(res, i) {
    const { S, R, fin, cand, ctx } = res;
    const W = fin.W, H = fin.H;
    const rooms = R.map((r, k) => ({ t: r.t, n: r.n, f: r.piso, abierta: !!r.abierta, area: fin.area[k], x0: 0, x1: 0, y0: 0, y1: 0 }));
    for (const [k, f, xa, xb, ya, yb] of fin.piezas) Object.assign(rooms[k], { x0: xa, x1: xb, y0: ya, y1: yb });
    // los distribuidores automáticos pasan a ser estancias de verdad
    const grids = fin.grids.map((g) => Int16Array.from(g));
    fin.autos.forEach(([f, xa, xb, ya, yb], k) => { const id = rooms.length; rooms.push({ t: 'paso', n: 'Distribuidor', f, x0: xa, x1: xb, y0: ya, y1: yb, area: (xb - xa) * (yb - ya) * A1, auto: true }); for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) if (grids[f][y * W + x] === R.length + k) grids[f][y * W + x] = id; });
    // recorte: fuera las filas y columnas que no usa ninguna planta (una banda vacía en todos los cuerpos)
    let mx = W, my = H, Mx = -1, My = -1;
    for (const g of grids) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = g[y * W + x]; if (v >= 0 || v === -2) { mx = Math.min(mx, x); my = Math.min(my, y); Mx = Math.max(Mx, x); My = Math.max(My, y); } }
    const W2 = Mx - mx + 1, H2 = My - my + 1;
    const grids2 = grids.map((g) => { const o = new Int16Array(W2 * H2); for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) o[y * W2 + x] = g[(y + my) * W + x + mx]; return o; });
    for (const r of rooms) { r.x0 -= mx; r.x1 -= mx; r.y0 -= my; r.y1 -= my; }
    const bx = {}, by = {}; for (const k in fin.geo.bx) bx[k] = [fin.geo.bx[k][0] - mx, fin.geo.bx[k][1] - mx]; for (const k in fin.geo.by) by[k] = [fin.geo.by[k][0] - my, fin.geo.by[k][1] - my];
    const mat = materializar({ W: W2, H: H2, grids: grids2, rooms, rot: S.G.rot, calle: ctx.calle }, ctx.presupuesto || 160);
    return {
      id: `${cand.sig}-${S.G.rot}`, sig: cand.sig, nombre: nombrar(cand, fin), plantas: S.plantas, W: W2, H: H2, rot: S.G.rot, grids: grids2.map((g) => Array.from(g)), rooms,
      geo: { w: S.G.w, d: S.G.d, mask: S.G.mask, bx, by }, patio: fin.patio, terr: fin.terr, areaTot: fin.areaTot,
      coste: fin.coste, motivos: (fin.det || []).sort((a, b) => b[1] - a[1]).slice(0, 6), sinAcceso: fin.sinAcceso, hist: res.hist, ...mat,
    };
  }

  // ── la búsqueda completa: candidatas, recocido en cada una, y las tres mejores distintas ──
  function* proponer(P, ctx) {
    if (!ctx.gramatica) return yield* proponerModelos(P, ctx);
    configurar(ctx.datos);
    const t0 = ahora();
    const E = enumerar();
    yield { etapa: 'gramatica', envolventes: E.lista.length, aristas: E.aristas, ms: E.ms };
    const prog = programa(P);
    const plantas = prog.plantas;
    const C = { ...ctx, plantas, gustos: P.gustos || {}, objetivo: prog.total };
    const cuantas = ctx.cuantas || 9;
    const cands = candidatas(prog, C, cuantas, ctx.excluir || []);
    yield { etapa: 'candidatas', formas: cands.formas, elegidas: cands.sel.length, total: cands.total };
    const resultados = [];
    const it = ctx.iteraciones || 3200, it2 = ctx.iteraciones2 || 9000, fondo = ctx.fondo || 4;
    const correr = function* (k, cand, its, previo, T0, ronda) {
      const semilla = hash(`${ctx.semilla || 1}:${cand.sig}:${ronda}`);
      const gen = recocer(prog, cand, { ...C, rotIni: C.calle === 'E' || C.calle === 'O' ? 1 : 0 }, semilla, its, previo, T0);
      let r = gen.next();
      while (!r.done) { yield { etapa: 'recocido', ronda, k, de: ronda ? fondo : cands.sel.length, mejor: r.value.mejor, hist: r.value.hist, it: r.value.it, total: its, vista: ((S) => () => vistaLigera(S, prog, C))(r.value.S), forma: cand.clase }; r = gen.next(); }
      return r.value;
    };
    for (let k = 0; k < cands.sel.length; k++) resultados.push(yield* correr(k, cands.sel[k], it, null, 26, 0));
    resultados.sort((a, b) => a.fin.coste - b.fin.coste);
    // las mejores de cada clase pasan a la segunda ronda
    const pasan = [], clasesV = new Set();
    for (const r of resultados) if (pasan.length < fondo && !clasesV.has(r.cand.clase)) { pasan.push(r); clasesV.add(r.cand.clase); }
    for (const r of resultados) if (pasan.length < fondo && !pasan.includes(r)) pasan.push(r);
    for (let k = 0; k < pasan.length; k++) { const r2 = yield* correr(k, pasan[k].cand, it2, pasan[k].S, 9, 1); if (r2.fin.coste < pasan[k].fin.coste) resultados[resultados.indexOf(pasan[k])] = r2; }
    resultados.sort((a, b) => a.fin.coste - b.fin.coste);
    // tres distintas: formas distintas y, si da igual el número de plantas, que haya de las dos
    const elegidas = [];
    for (const r of resultados) { if (elegidas.length >= (ctx.alternativas || 3)) break; if (elegidas.some((e) => e.cand.clase === r.cand.clase)) continue; elegidas.push(r); }
    for (const r of resultados) { if (elegidas.length >= (ctx.alternativas || 3)) break; if (elegidas.includes(r)) continue; elegidas.push(r); }
    if (plantas == null && elegidas.length >= 2 && elegidas.every((e) => e.cand.dos === elegidas[0].cand.dos)) {
      const otra = resultados.find((r) => r.cand.dos !== elegidas[0].cand.dos); if (otra) elegidas[elegidas.length - 1] = otra;
    }
    // al afinar, la forma elegida va primero si sigue siendo de las buenas
    if (ctx.preferir) { const k = elegidas.findIndex((e) => e.cand.sig === ctx.preferir.sig); if (k > 0) elegidas.unshift(elegidas.splice(k, 1)[0]); else if (k < 0) { const r = resultados.find((x) => x.cand.sig === ctx.preferir.sig); if (r) { elegidas.unshift(r); elegidas.length = Math.min(elegidas.length, ctx.alternativas || 3); } } }
    yield { etapa: 'despiece', n: elegidas.length };
    const props = elegidas.map((r, i) => propuesta(r, i));
    return { alternativas: props, programa: prog, stats: { envolventes: E.lista.length, aristas: E.aristas, formas: cands.formas, candidatas: cands.sel.length, iteraciones: it * cands.sel.length + it2 * Math.min(fondo, cands.sel.length), ms: ahora() - t0 } };
  }
  // una vista mínima del mejor estado (para pintarla mientras busca)
  function vistaLigera(S, prog, C) {
    const plantas = S.plantas, R = repartirPlantas(prog.R, plantas);
    for (const r of R) if (r.t === 'escalera') r.fijo = S.G.d[1] >= 4 ? 4 : 7;
    const ev = crearEvaluador({ ...prog, R }, C); const c = ev.construir(S);
    return { W: c.W, H: c.H, piezas: c.piezas.map(([i, f, a, b, y0, y1]) => [R[i].t, f, a, b, y0, y1]), autos: c.autos.map(([f, a, b, y0, y1]) => ['paso', f, a, b, y0, y1]) };
  }

  // ── traducir un plano detectado: sus estancias se quedan como están, y se despieza ──
  function traducir(plano, ctx) {
    configurar(ctx.datos);
    const { W, H, etiquetas, estancias } = plano;
    const g = Int16Array.from(etiquetas);
    const rooms = estancias.map((e) => ({ t: e.t, n: e.n, f: 0, area: e.celdas * A1, abierta: e.t === 'cocina', x0: e.x0, x1: e.x1, y0: e.y0, y1: e.y1 }));
    const mat = materializar({ W, H, grids: [g], rooms, rot: 0, calle: ctx.calle || 'N' }, ctx.presupuesto || 200);
    let areaTot = 0; for (const r of rooms) areaTot += r.area;
    return { id: 'plano', sig: 'plano', nombre: 'Tu plano, en la trama de 0,75 m', plantas: 1, W, H, rot: 0, grids: [Array.from(g)], rooms, geo: null, patio: [], terr: [], areaTot, coste: 0, motivos: [], fiel: true, ...mat };
  }


  // ═══ 5 · los modelos de vivienda CUEVA y sus variantes ═══════════════
  //  Plantas tipo sacadas de los cuatro modelos (ROOMS de OADAC_NEW_ERA/mundos/<modelo>/index.html, con sus rectángulos
  //  en metros, y planos de NANCA_WEB_v20/assets/v20/plan-<modelo>.webp), llevadas a la trama de 0,75 m como bahías a lo
  //  largo de la casa. Cada bahía cruza la crujía de norte (acceso) a sur (jardín):
  //   · Basic (basic/index.html): caja de 12,0 × 6,3 m, una planta. En un extremo despacho y baño; en el centro salón y
  //     cocina en un frente; en el otro, dos dormitorios que abren al salón. Se entra por la corredera del salón.
  //   · Line (line/index.html): barra de 21,1 × 6,9 m, una planta. Dos alas de noche, cada una con dos dormitorios y un
  //     distribuidor entre dos baños (3,30 y 4,30 m²), a los lados del salón comedor (33,65 m²), la cocina (7,60 m²) y
  //     un salón exterior cubierto (32,40 m²).
  //   · Natura (natura/index.html, modelo de dos plantas): 16,2 × 6,7 m. Abajo, salón y cocina en una pieza abierta al
  //     jardín, dos dormitorios atrás, lavandería y baño, y un patio de lamas lateral; arriba, suite con baño y vestidor,
  //     despacho y terrazas.
  //   · My Way (myway/index.html): 7,5 × 9 m sobre retícula de 3 m, cubierta a dos aguas; salón y cocina a doble altura,
  //     baño y aseo en el núcleo, altillo con dormitorio (18 m²) y baño.
  const MODELOS = {
    basic: { k: 'basic', n: 'Basic', plantas: 1, dorm: 2, banos: 1, m2: 75, D: 9, afines: ['minimalista', 'estudio', 'accesible', 'compacta', 'jardin'], idea: 'caja limpia de una planta' },
    line: { k: 'line', n: 'Line', plantas: 1, dorm: 4, banos: 4, m2: 150, D: 9, afines: ['porche', 'piscina', 'larga', 'accesible', 'jardin'], idea: 'planta larga con alas de noche y salón exterior cubierto' },
    natura: { k: 'natura', n: 'Natura', plantas: 2, dorm: 3, banos: 2, m2: 176, D: 9, afines: ['patio', 'celosia', 'terraza', 'luz', 'madera', 'piscina'], idea: 'dos plantas con patio de lamas' },
    myway: { k: 'myway', n: 'My Way', plantas: 2, dorm: 1, banos: 2, m2: 81, D: 10, afines: ['dosAguas', 'dobleAltura', 'altillo', 'madera', 'chimenea'], idea: 'cubierta a dos aguas y salón a doble altura' },
  };
  const NOM = { principal: 'Dormitorio principal', dormitorio: 'Dormitorio', estudio: 'Estudio', bano: 'Baño', aseo: 'Aseo', lavadero: 'Lavadero', vestidor: 'Vestidor', paso: 'Distribuidor', escalera: 'Escalera', cocina: 'Cocina', salon: 'Salón comedor', vestibulo: 'Vestíbulo', porche: 'Porche', garaje: 'Garaje' };
  const Rm = (t, x0, x1, y0, y1, o = {}) => ({ t, n: o.n || NOM[t] || t, x0, x1, y0, y1, ...o });

  // ── bahías de planta baja ──
  function bahiaBaja(b, x, D) {
    const X = x + b.w, o = [];
    const cos = D >= 10 ? 4 : 3;
    switch (b.t) {
      case 'dia': o.push(Rm('cocina', x, X, 0, cos, { abierta: true }), Rm('salon', x, X, cos, D, { entrada: !!b.entrada, dobleAltura: !!b.dobleAltura })); break;
      case 'noche2': { const s = b.s ?? 4; o.push(Rm(b.t1 || 'dormitorio', x, X, 0, s), Rm(b.t2 || 'dormitorio', x, X, s, D)); break; }
      case 'noche1': { const s = b.s ?? 4; o.push(Rm(b.extra || 'estudio', x, X, 0, s), Rm(b.t2 || 'dormitorio', x, X, s, D, b.n2 ? { n: b.n2 } : {})); break; }
      case 'noche2c': o.push(Rm(b.t1 || 'dormitorio', x, X, 0, 4), Rm('paso', x, X, 4, 6, { n: 'Pasillo' }), Rm(b.t2 || 'dormitorio', x, X, 6, D)); break;
      case 'noche1c': o.push(Rm(b.extra || 'estudio', x, X, 0, 4), Rm('paso', x, X, 4, 6, { n: 'Pasillo' }), Rm(b.t2 || 'dormitorio', x, X, 6, D)); break;
      case 'nucleo': if (D >= 10) o.push(Rm('bano', x, X, 0, 4), Rm('paso', x, X, 4, 6), Rm(b.sur || 'bano', x, X, 6, D)); else o.push(Rm(b.norte || 'bano', x, X, 0, 2), Rm('paso', x, X, 2, 6), Rm(b.sur || 'bano', x, X, 6, D)); break;
      case 'nucleoE': o.push(Rm('escalera', x, X, 0, 2), Rm('paso', x, X, 2, 6), Rm(b.sur || 'bano', x, x + 3, 6, D), Rm(b.sur2 || 'lavadero', x + 3, X, 6, D)); break;
      case 'nucleoM': o.push(Rm('escalera', x, X, 0, 4), Rm('paso', x, X, 4, 6), Rm('bano', x, x + 2, 6, D), Rm(b.sur2 || 'aseo', x + 2, X, 6, D, { n: b.sur2 === 'lavadero' ? 'Lavadero' : 'Aseo y lavadero' })); break;
      case 'humedo': o.push(Rm(b.norte || 'estudio', x, X, 0, 6), Rm('bano', x, X, 6, D)); break;
      case 'entrada': o.push(Rm('vestibulo', x, X, 0, cos + 2, { entrada: true }), Rm('porche', x, X, cos + 2, D, { n: 'Salón exterior' })); break;
    }
    return o;
  }
  // ── bahías de planta alta (alineadas con las de abajo); devuelven estancias y vacíos (-3 terraza, -4 doble altura) ──
  function bahiaAlta(b, x, D) {
    const X = x + b.w, o = [], v = [];
    switch (b.t) {
      case 'suite': o.push(Rm('principal', x, X, 0, 5), Rm('bano', x, X, 5, D, { n: 'Baño de la suite', suiteDe: 'principal' })); break;
      case 'nucleoE1': o.push(Rm('escalera', x, X, 0, 2), Rm('paso', x, X, 2, 6), Rm('bano', x, x + 3, 6, D), Rm(b.sur2 || 'vestidor', x + 3, X, 6, D)); break;
      case 'noche2up':
        if (b.w >= 8) { const m = x + Math.floor(b.w / 2); o.push(Rm(b.t1 || 'dormitorio', x, m, 0, 4), Rm(b.t2 || 'dormitorio', m, X, 0, 4), Rm('paso', x, X, 4, 6, { n: 'Pasillo' })); v.push([-3, x, X, 6, D]); }
        else if (b.w === 7) { o.push(Rm(b.t1 || 'dormitorio', x, x + 4, 0, 4), Rm('vestidor', x + 4, X, 0, 4), Rm(b.t2 || 'dormitorio', x, X, 4, D)); }
        else o.push(Rm(b.t1 || 'dormitorio', x, X, 0, 4), Rm(b.t2 || 'dormitorio', x, X, 4, D));
        break;
      case 'despacho': { const a = Math.min(b.w, 5); o.push(Rm(b.t1 || 'estudio', x, x + a, 0, 4)); if (b.w > a) v.push([-3, x + a, X, 0, 4]); v.push([-3, x, X, 4, D]); break; }
      case 'terraza': v.push([-3, x, X, 0, D]); break;
      case 'nucleoM1': o.push(Rm('escalera', x, X, 0, 4), Rm('paso', x, X, 4, 6, { n: 'Rellano' }), Rm('bano', x, X, 6, D, { n: 'Baño del altillo' })); break;
      case 'altillo': { const a = Math.min(b.w, b.anchoDorm || 5); o.push(Rm(b.t1 || 'principal', X - a, X, 0, 6, { n: b.n1 || 'Dormitorio del altillo' })); if (b.w > a) v.push([-4, x, X - a, 0, D]); v.push([-4, X - a, X, 6, D]); break; }
      case 'altillo2': o.push(Rm('principal', x, X, 0, 4, { n: 'Dormitorio del altillo' }), Rm('dormitorio', x, X, 6, D)); o.push(Rm('paso', x, X, 4, 6, { n: 'Pasarela' })); break;
      case 'vacio': v.push([-4, x, X, 0, D]); break;
    }
    return { o, v };
  }

  // ── la variante: de un modelo y una estrategia, al programa pedido ──
  function variante(mk, estrategia, prog, P, ctx) {
    const M = MODELOS[mk], g = P.gustos || {};
    let d = clamp(prog.dorm, 1, 6), nb = Math.max(1, prog.banos);
    const bah = [], alta = [];
    let D = M.D, nombreExtra = '', cubierta = 'plana';
    // ancho del salón: la superficie pedida, con proporción de 1:1 a 1:1,8 y al menos 3,75 m (5 módulos)
    const anchoDia = (prof) => { const objetivo = clamp(20 + d * 2.6 + (g.salonGrande ? 6 : 0), 20, 40) * (P.superficie ? clamp(P.superficie / (M.m2 * 0.9), 0.8, 1.3) : 1); let w = Math.round(objetivo / (prof * A1)); w = clamp(w, Math.max(5, Math.ceil(prof / 1.8)), Math.floor(prof * 1.8)); return w; };
    const dormT = (i) => (i === 0 ? 'principal' : 'dormitorio');
    let k = 0; const sigDorm = () => dormT(k++);
    if (mk === 'basic') {
      if (estrategia === 'base' && (d <= 2 || (d === 3 && !g.estudio))) {
        // caja limpia: [despacho o dormitorio | baño] [salón y cocina] [dos dormitorios que abren al salón]
        const t2 = d === 1 ? null : 'noche2';
        bah.push({ t: 'humedo', w: 4, norte: d >= 3 && !g.estudio ? 'dormitorio' : 'estudio' });
        bah.push({ t: 'dia', w: anchoDia(D - 3), entrada: true });
        if (t2) bah.push({ t: 'noche2', w: 5, s: 5, t1: 'principal', t2: 'dormitorio' }); else bah.push({ t: 'noche1', w: 5, s: 5, extra: 'vestidor', t2: 'principal' });
      } else {
        // Basic con ala de noche: un pasillo de 1,50 m entre ejes recoge los dormitorios
        D = 10; nombreExtra = 'con ala de noche';
        bah.push({ t: 'dia', w: anchoDia(D - 4), entrada: true }, { t: 'nucleo', w: 3, sur: 'bano' }, ...alaNoche(d, nb, g, true));
        ajustarBanos(bah, nb);
      }
    } else if (mk === 'line') {
      // dos alas de noche (dormitorios con su núcleo de baños) a los lados de salón, cocina y salón exterior
      if (estrategia === 'base' && d <= 4) {
        const izq = Math.min(2, d), der = d - izq;
        bah.push({ t: izq === 2 ? 'noche2' : 'noche1', w: 5, s: 4, t1: 'principal', t2: 'dormitorio', extra: 'estudio' }, { t: 'nucleo', w: 3, sur: 'bano' });
        bah.push({ t: 'dia', w: anchoDia(D - 3) }, { t: 'entrada', w: 5 });
        if (der > 0) bah.push({ t: 'nucleo', w: 3, sur: nb >= 4 ? 'bano' : nb >= 3 ? 'bano' : 'lavadero', norte: nb >= 4 ? 'bano' : 'bano' }, { t: der === 2 ? 'noche2' : 'noche1', w: 5, s: 4, t1: 'dormitorio', t2: 'dormitorio', extra: 'estudio' });
      } else {
        // Line de un ala: un pasillo lleva a todos los dormitorios; salón y salón exterior en la otra punta
        D = 10; nombreExtra = 'de un ala';
        const ala = alaNoche(d, nb, g, true).reverse();
        bah.push(...ala, { t: 'nucleo', w: 3, sur: 'bano' }, { t: 'dia', w: anchoDia(D - 4) }, { t: 'entrada', w: 5 });
        ajustarBanos(bah, nb);
      }
    } else if (mk === 'natura') {
      // abajo [dormitorios][núcleo con escalera][salón y cocina]; arriba [suite][núcleo][despacho o dormitorios] y terraza
      const abajo = estrategia === 'base' ? Math.max(0, Math.min(2, d - 1)) : Math.min(1, Math.max(0, d - 1));
      const arriba = d - abajo; // suite + lo que quede sobre el salón
      if (estrategia !== 'base') nombreExtra = 'con la noche arriba';
      if (abajo === 2) bah.push({ t: 'noche2', w: 5, s: 4, t1: 'dormitorio', t2: 'dormitorio' });
      else if (abajo === 1) bah.push({ t: 'noche1', w: 5, s: 4, extra: 'estudio', t2: 'dormitorio', n2: estrategia === 'base' ? undefined : 'Dormitorio de invitados' });
      else bah.push({ t: 'noche1', w: 5, s: 4, extra: g.estudio ? 'estudio' : 'lavadero', t2: 'estudio' });
      bah.push({ t: 'nucleoE', w: 6, sur: 'bano', sur2: nb >= 3 ? 'bano' : 'lavadero' });
      bah.push({ t: 'dia', w: anchoDia(D - 3), entrada: true });
      alta.push({ t: 'suite', w: 5 }, { t: 'nucleoE1', w: 6, sur2: nb >= 2 ? 'vestidor' : 'vestidor' });
      const resto = arriba - 1;
      if (resto >= 2) alta.push({ t: 'noche2up', w: bah[2].w, t1: 'dormitorio', t2: 'dormitorio' });
      else if (resto === 1) alta.push({ t: 'despacho', w: bah[2].w, t1: 'dormitorio' });
      else alta.push({ t: 'despacho', w: bah[2].w });
      if (resto > 2) { bah.push({ t: 'nucleo', w: 3, sur: 'bano' }, { t: resto - 2 >= 2 ? 'noche2' : 'noche1', w: 5, s: 4, extra: 'estudio' }); alta.push({ t: 'terraza', w: 3 }, { t: 'terraza', w: 5 }); }
    } else if (mk === 'myway') {
      // salón y cocina a doble altura bajo dos aguas; núcleo con escalera, baño y aseo; altillo con dormitorio
      D = 10; cubierta = 'dosAguas';
      const wDia = clamp(anchoDia(D - 4), 6, 10);
      bah.push({ t: 'dia', w: wDia, entrada: true, dobleAltura: true }, { t: 'nucleoM', w: 4, sur2: nb >= 3 ? 'bano' : 'aseo' });
      alta.push({ t: 'altillo', w: wDia, anchoDorm: 5, t1: 'principal' }, { t: 'nucleoM1', w: 4 });
      let r = d - 1;
      if (estrategia !== 'base' && r <= 0) { r = 0; }
      if (r > 0) { nombreExtra = 'con ala de noche'; bah.push(...alaNoche(r, nb, g, false)); }
      if (estrategia !== 'base' && d <= 2 && d > 1) nombreExtra = 'con ala de noche';
    }
    return { mk, estrategia, D, bah, alta, cubierta, nombreExtra };
  }
  // ala de noche con pasillo: dos dormitorios por bahía y un núcleo de baños cada dos bahías
  function alaNoche(d, nb, g, principalCerca) {
    const ala = []; let r = d, k2 = 0;
    while (r > 0) { if (r >= 2) { ala.push({ t: 'noche2c', w: 5, t1: 'dormitorio', t2: 'dormitorio' }); r -= 2; } else { ala.push({ t: 'noche1c', w: 5, extra: g.estudio ? 'estudio' : 'vestidor', t2: 'dormitorio' }); r -= 1; } if (++k2 % 2 === 0 && r > 0) ala.push({ t: 'nucleo', w: 3, sur: 'bano' }); }
    if (principalCerca && ala.length) ala[0].t1 = 'principal';
    return ala;
  }
  // los baños, al número pedido: los sobrantes del sur de los núcleos pasan a lavadero (siempre queda uno por núcleo)
  function ajustarBanos(bah, nb) {
    const cuenta = () => bah.reduce((a, b) => a + (b.t === 'nucleo' ? (b.norte === 'bano' || !b.norte ? 1 : 0) + (b.sur === 'bano' || !b.sur ? 1 : 0) : b.t === 'humedo' || b.t === 'nucleoE' || b.t === 'nucleoM' ? 1 : 0), 0);
    for (let i = bah.length - 1; i >= 0 && cuenta() > nb; i--) if (bah[i].t === 'nucleo' && (bah[i].sur === 'bano' || !bah[i].sur)) bah[i].sur = 'lavadero';
  }
  // ── de las bahías a las estancias y a la rejilla ──
  function plantaDeVariante(V, P, ctx) {
    const g = P.gustos || {}, D = V.D, rooms = [], vac = [];
    let x = 0; const xs = [];
    for (const b of V.bah) { xs.push(x); for (const r of bahiaBaja(b, x, D)) rooms.push({ ...r, f: 0 }); x += b.w; }
    const W0 = x;
    if (V.alta.length) { let xa = 0; V.alta.forEach((b) => { const { o, v } = bahiaAlta(b, xa, D); for (const r of o) rooms.push({ ...r, f: 1 }); vac.push(...v.map((q) => [1, ...q])); xa += b.w; }); if (xa < W0 && V.mk === 'natura') vac.push([1, -3, xa, W0, 0, D]); }
    // anexos: porche al sur del salón (si no lo trae el modelo), patio al sur del resto, garaje a la calle
    const iDia = V.bah.findIndex((b) => b.t === 'dia'), xDia = xs[iDia], wDia = V.bah[iDia].w;
    const tienePorche = V.bah.some((b) => b.t === 'entrada');
    let sur = 0, norte = 0;
    if ((g.porche || g.piscina || V.mk === 'line') && (!tienePorche || V.mk === 'line')) { rooms.push(Rm('porche', xDia, xDia + wDia, D, D + 5, { f: 0 })); sur = 5; }
    if (g.patio || V.mk === 'natura') { sur = 5; vac.push([0, -2, 0, W0, D, D + 5]); }
    if (g.garaje) { const wg = Math.max(7, Math.min(wDia, 8)); rooms.push(Rm('garaje', xDia, xDia + wg, -6, 0, { f: 0 })); norte = 6; }
    const W = Math.max(W0, ...rooms.map((r) => r.x1)), H = D + sur + norte, plantas = V.alta.length ? 2 : 1;
    for (const r of rooms) { r.y0 += norte; r.y1 += norte; }
    const grids = []; for (let f = 0; f < plantas; f++) grids.push(new Int16Array(W * H).fill(-1));
    // patio primero (el porche lo pisa si coincide)
    for (const [f, v, x0, x1, y0, y1] of vac) { if (f >= plantas) continue; for (let y = y0 + norte; y < y1 + norte; y++) for (let xx = x0; xx < x1; xx++) if (grids[f][y * W + xx] === -1) grids[f][y * W + xx] = v; }
    rooms.forEach((r, i) => { const gr = grids[r.f]; for (let y = r.y0; y < r.y1; y++) for (let xx = r.x0; xx < r.x1; xx++) gr[y * W + xx] = i; r.area = (r.x1 - r.x0) * (r.y1 - r.y0) * A1; });
    // la terraza solo sobre lo construido abajo
    if (plantas > 1) for (let i = 0; i < W * H; i++) if (grids[1][i] === -3 && grids[0][i] < 0) grids[1][i] = -1;
    // nombres: «Dormitorio 2», «Baño 2»…
    let nd = 1, nbn = 1;
    for (const r of rooms) { if (r.t === 'dormitorio') r.n = `Dormitorio ${++nd}`; if (r.t === 'bano' && !r.suiteDe && r.n === 'Baño') { r.n = nbn === 1 ? 'Baño' : `Baño ${nbn}`; nbn++; } }
    return { W, H, grids, rooms, plantas, norte };
  }

  // ── reglas espaciales duras y autoevaluación ──
  const MIN = { salon: { w: 5, rmax: 1.8, a: 16 }, principal: { w: 4, rmax: 1.5, a: 10 }, dormitorio: { w: 4, rmax: 1.5, a: 8 }, bano: { w: 2, a: 3.3 }, aseo: { w: 2, a: 1.8 }, estudio: { w: 3, rmax: 2, a: 6 }, cocina: { w: 3, a: 6 } };
  function comprobar(B, mat, ctx) {
    const { rooms, W, H, grids } = B, reglas = [], R2 = (v) => num2(v);
    const add = (t, ok, detalle) => reglas.push({ t, ok, detalle });
    let malos = 0;
    // proporción y anchos
    for (const r of rooms) {
      const m = MIN[r.t]; if (!m) continue;
      const a = (r.x1 - r.x0), b = (r.y1 - r.y0), corto = Math.min(a, b), largo = Math.max(a, b), ratio = largo / corto;
      if (corto < m.w || (m.rmax && ratio > m.rmax + 1e-6) || r.area < m.a - 1e-6) { malos++; add(`${r.n}: ${R2(a * PASO)} × ${R2(b * PASO)} m`, false, `fuera de regla (ancho mínimo ${R2(m.w * PASO)} m${m.rmax ? `, proporción hasta 1:${R2(m.rmax)}` : ''})`); }
    }
    if (!malos) add('Proporciones y anchos', true, 'salón entre 1:1 y 1:1,8 y al menos 3,75 m; dormitorios hasta 1:1,5 y 3,00 m; baños de 1,50 m o más');
    // accesos: desde la entrada, por puertas y aberturas, sin cruzar dormitorios
    const pasan = new Set(['vestibulo', 'paso', 'salon', 'escalera', 'cocina', 'porche']);
    const vecinos = rooms.map(() => new Set());
    for (const d of mat.puertas) { vecinos[d.de].add(d.a_); vecinos[d.a_].add(d.de); }
    // aberturas sin puerta: cocina con salón, pasos entre sí, escalera con su paso
    for (let f = 0; f < grids.length; f++) { const g = grids[f]; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = g[y * W + x]; if (a < 0) continue; for (const [dx, dy] of [[1, 0], [0, 1]]) { const xx = x + dx, yy = y + dy; if (xx >= W || yy >= H) continue; const b = g[yy * W + xx]; if (b < 0 || b === a) continue; const A = rooms[a], Bq = rooms[b]; if (abiertas(A, Bq) || (A.t === 'escalera' && Bq.t === 'paso') || (Bq.t === 'escalera' && A.t === 'paso') || (A.t === 'paso' && Bq.t === 'salon') || (A.t === 'salon' && Bq.t === 'paso') || (A.t === 'porche' && Bq.t === 'salon') || (A.t === 'salon' && Bq.t === 'porche') || (A.t === 'porche' && Bq.t === 'vestibulo') || (A.t === 'vestibulo' && Bq.t === 'porche')) { vecinos[a].add(b); vecinos[b].add(a); } } } }
    // las escaleras unen plantas
    const esc = rooms.map((r, i) => (r.t === 'escalera' ? i : -1)).filter((i) => i >= 0); for (const i of esc) for (const j of esc) if (i !== j) vecinos[i].add(j);
    const ent = rooms.findIndex((r) => r.entrada); const llega = new Set(); const dist = new Map();
    if (ent >= 0) { const cola = [ent]; llega.add(ent); dist.set(ent, 0); while (cola.length) { const i = cola.shift(); if (!pasan.has(rooms[i].t) && i !== ent) continue; for (const j of vecinos[i]) if (!llega.has(j)) { llega.add(j); dist.set(j, dist.get(i) + 1); cola.push(j); } } }
    for (let vuelta = 0; vuelta < 2; vuelta++) rooms.forEach((r, i) => { if (llega.has(i) || !(r.suiteDe || r.t === 'vestidor')) return; for (const j of vecinos[i]) if (llega.has(j) && (rooms[j].t === 'principal' || rooms[j].t === 'dormitorio' || pasan.has(rooms[j].t))) { llega.add(i); break; } });
    const sin = rooms.filter((r, i) => !llega.has(i));
    add('Accesos', !sin.length, sin.length ? `sin acceso: ${sin.map((r) => r.n.toLowerCase()).join(', ')}` : `se entra por ${ent >= 0 && rooms[ent].t === 'vestibulo' ? 'el vestíbulo' : 'la corredera del salón'} y se llega a cada estancia sin cruzar dormitorios`);
    // zonificación: ningún dormitorio abre a la cocina; baño a un paso de cada dormitorio
    let lejos = 0;
    for (let i = 0; i < rooms.length; i++) { const r = rooms[i]; if (r.t !== 'dormitorio' && r.t !== 'principal') continue; let ok = false; const vis = new Set([i]), cola = [[i, 0]]; while (cola.length && !ok) { const [q, dd] = cola.shift(); if (dd > 3) break; for (const j of vecinos[q]) { if (vis.has(j)) continue; vis.add(j); if ((rooms[j].t === 'bano' || rooms[j].t === 'aseo') && rooms[j].f === r.f) { ok = true; break; } if (pasan.has(rooms[j].t) && rooms[j].t !== 'cocina') cola.push([j, rooms[q].t === 'paso' && rooms[j].t === 'paso' ? dd : dd + 1]); } } if (!ok) lejos++; }
    add('Zona de noche', !lejos, lejos ? `${lejos} dormitorio${lejos > 1 ? 's' : ''} con el baño lejos` : 'los dormitorios se agrupan y cada uno tiene un baño a pocos pasos');
    const iS = rooms.findIndex((r) => r.t === 'salon'), iC = rooms.findIndex((r) => r.t === 'cocina');
    const cocinaOk = iS < 0 || iC < 0 || vecinos[iS].has(iC);
    add('Cocina y salón', cocinaOk, cocinaOk ? 'la cocina abre al salón comedor' : 'la cocina no toca el salón');
    // el salón, abierto al exterior y a la mejor orientación
    let ventanal = null; for (const m of mat.muros) for (const h of m.huecos) if (h.r === iS && h.tipo === 'ventanal') { const v = { rumbo: m.rumbo, ancho: h.b - h.a }; if (!ventanal || (v.rumbo === 'S') > (ventanal.rumbo === 'S') || ((v.rumbo === 'S') === (ventanal.rumbo === 'S') && v.ancho > ventanal.ancho)) ventanal = v; }
    add('Salón al sol', !!ventanal, ventanal ? `abre al ${NOMBRE_RUMBO[ventanal.rumbo]} con un ventanal de ${R2(ventanal.ancho)} m${ventanal.rumbo !== 'S' ? ', la mejor orientación que deja la parcela' : ''}` : 'el salón no tiene ventanal al exterior');
    // luces de placa
    const lm = mat.metricas.luzMax, crujia = B.D * PASO;
    add('Luces de placa', lm <= 7.5 + 1e-6 && crujia <= 7.5 + 1e-6, `crujía de ${R2(crujia)} m y placa más larga de ${R2(lm)} m: dentro de 7,50 m`);
    const pasillos = rooms.filter((r) => r.t === 'paso' && Math.min(r.x1 - r.x0, r.y1 - r.y0) === 2 && Math.max(r.x1 - r.x0, r.y1 - r.y0) >= 4);
    if (pasillos.length) add('Pasillos', true, 'de 1,50 m entre ejes de la trama: con tabiques y un frente de armarios de 0,30 m quedan unos 1,10 m libres');
    return reglas;
  }
  const num2 = (v) => String((Math.round(v * 100) / 100).toFixed(2)).replace('.', ',');
  function porQue(B, mat, reglas, M) {
    const out = [], rooms = B.rooms, s = rooms.find((r) => r.t === 'salon');
    if (s) { const a = (s.x1 - s.x0) * PASO, b = (s.y1 - s.y0) * PASO; const r = reglas.find((q) => q.t === 'Salón al sol'); out.push(`El salón mide ${num2(Math.max(a, b))} × ${num2(Math.min(a, b))} m, proporción 1:${num2(Math.max(a, b) / Math.min(a, b))}${r && r.ok ? `, y ${r.detalle}` : ''}${s.dobleAltura ? ', a doble altura bajo la cubierta' : ''}.`); }
    const dorms = rooms.filter((r) => r.t === 'dormitorio' || r.t === 'principal');
    if (dorms.length) { const m = Math.min(...dorms.map((r) => Math.min(r.x1 - r.x0, r.y1 - r.y0))) * PASO; out.push(`Día y noche separados: ${dorms.length} dormitorio${dorms.length > 1 ? 's' : ''} de ${num2(m)} m de ancho como mínimo, agrupados con su núcleo de baños${B.plantas > 1 && dorms.some((r) => r.f === 1) ? (rooms.some((r) => r.suiteDe) ? ', y la suite arriba' : ', y el dormitorio principal en el altillo') : ''}.`); }
    for (const r of reglas) if (r.ok && (r.t === 'Accesos' || r.t === 'Cocina y salón' || r.t === 'Luces de placa' || r.t === 'Pasillos')) out.push(r.detalle.replace(/^./, (c) => c.toUpperCase()) + '.');
    out.push(`Sigue la lógica del modelo ${M.n}: ${M.idea}.`);
    return out;
  }

  // ── asociar la petición a los modelos ──
  function afinidad(mk, prog, P) {
    const M = MODELOS[mk], g = P.gustos || {}; let s = 0;
    if (P.modelo === mk) s += 12;
    const plantasP = P.plantas ?? null;
    if (plantasP === 1 && M.plantas === 2) s -= mk === 'myway' && (g.dosAguas || g.dobleAltura) ? 1 : 7;
    if (plantasP === 2 && M.plantas === 1) s -= 7;
    if (g.accesible && M.plantas === 2) s -= 8;
    if (P.dormitorios != null) s -= Math.abs(prog.dorm - M.dorm) * 0.7;
    for (const a of M.afines) if (g[a]) s += a === 'dosAguas' || a === 'dobleAltura' || a === 'celosia' || a === 'larga' ? 4 : 1.6;
    if (P.superficie) s -= Math.abs(P.superficie - M.m2) / 45;
    return s;
  }
  function* proponerModelos(P, ctx) {
    configurar(ctx.datos);
    const t0 = ahora(), E = enumerar();
    yield { etapa: 'gramatica', envolventes: E.lista.length, aristas: E.aristas, ms: E.ms };
    const prog = programa(P);
    const orden = Object.keys(MODELOS).map((k) => ({ k, s: afinidad(k, prog, P) })).sort((a, b) => b.s - a.s);
    yield { etapa: 'modelos', orden: orden.map((o) => ({ k: o.k, n: MODELOS[o.k].n, s: o.s })) };
    // candidatas: cada modelo con su estrategia base y su alternativa, por afinidad
    const cands = [];
    for (const o of orden) for (const e of ['base', 'alt']) cands.push({ mk: o.k, e, s: o.s - (e === 'alt' ? 0.8 : 0) });
    cands.sort((a, b) => b.s - a.s);
    // la más afín primero; luego su variante alternativa y el segundo modelo
    const elegidas = [], excl = new Set(ctx.excluir || []);
    const quiere = ctx.preferir && ctx.preferir.sig ? ctx.preferir.sig : null;
    const pila = [];
    if (quiere) { const [m, e] = quiere.split(':'); pila.push({ mk: m, e }); }
    const top = orden[0].k, seg = orden[1].k;
    pila.push({ mk: top, e: 'base' }, { mk: top, e: 'alt' }, { mk: seg, e: 'base' }, ...cands);
    const resultados = [];
    let k = 0;
    for (const c of pila) {
      if (resultados.length >= (ctx.alternativas || 3)) break;
      const sig = `${c.mk}:${c.e}`;
      if (excl.has(sig) && sig !== quiere) continue;
      if (resultados.some((r) => r.sig === sig)) continue;
      const Mc = MODELOS[c.mk], progM = P.dormitorios == null ? { ...prog, dorm: Mc.dorm, banos: P.banos ?? Mc.banos } : P.banos == null && prog.dorm === Mc.dorm ? { ...prog, banos: Math.max(prog.banos, Math.min(Mc.banos, 2)) } : prog;
      const V = variante(c.mk, c.e, progM, P, ctx);
      // dos variantes iguales (la alternativa coincide con la base): fuera
      const huella = JSON.stringify(V.bah.map((b) => [b.t, b.w])) + JSON.stringify(V.alta.map((b) => [b.t, b.w]));
      if (resultados.some((r) => r.huella === huella)) continue;
      const B = { ...plantaDeVariante(V, P, ctx), D: V.D };
      yield { etapa: 'variantes', k: k++, n: MODELOS[c.mk].n, vista: () => ({ W: B.W, H: B.H, piezas: B.rooms.map((r) => [r.t, r.f, r.x0, r.x1, r.y0, r.y1]), autos: [] }) };
      // orientación: el salón (al sur de la planta tipo) a la mejor fachada que quepa en la parcela
      const rots = [0, 2, 1, 3].filter((rot) => { if (!ctx.edificable) return true; const [ew, eh] = ctx.edificable, wm = B.W * PASO, hm = B.H * PASO, par = rot % 2 === 0; return (par ? wm : hm) <= ew + 0.01 && (par ? hm : wm) <= eh + 0.01; });
      const GAN = ctx.fachadas || { invierno: { N: 0, E: 0.3, S: 1, O: 0.3 } };
      const rot = (rots.length ? rots : [0]).map((r) => ({ r, v: GAN.invierno[rumbos(r).yp] })).sort((a, b) => b.v - a.v)[0].r;
      const mat = materializar({ W: B.W, H: B.H, grids: B.grids, rooms: B.rooms, rot, calle: ctx.calle, cubierta: V.cubierta, D: V.D, norte: B.norte }, ctx.presupuesto || 160);
      const reglas = comprobar(B, mat, ctx);
      if (!rots.length && ctx.edificable) reglas.push({ t: 'Parcela', ok: false, detalle: 'no cabe con los retranqueos supuestos' });
      const M = MODELOS[c.mk], d = B.rooms.filter((r) => r.t === 'dormitorio' || r.t === 'principal').length;
      const exacto = c.e === 'base' && d === M.dorm && B.plantas === M.plantas && !V.nombreExtra;
      const dd = `${d} dormitorio${d === 1 ? '' : 's'}`;
      const nombre = exacto ? `Modelo ${M.n}, en la trama` : !V.nombreExtra ? `Variante de ${M.n} con ${dd}` : V.nombreExtra.startsWith('con ') ? `Variante de ${M.n} ${V.nombreExtra} y ${dd}` : `Variante de ${M.n} ${V.nombreExtra} con ${dd}`;
      let areaTot = 0; for (const r of B.rooms) if (r.t !== 'porche' && r.t !== 'garaje') areaTot += r.area;
      resultados.push({ id: sig, sig, huella, modelo: { k: M.k, n: M.n }, basada: `Basada en el modelo ${M.n}`, nombre, plantas: B.plantas, W: B.W, H: B.H, rot, grids: B.grids.map((gq) => Array.from(gq)), rooms: B.rooms, bahias: V.bah.map((b) => ({ t: b.t, w: b.w })), alta: V.alta.map((b) => ({ t: b.t, w: b.w })), D: V.D, cubierta: V.cubierta, geo: null, patio: [], terr: [], areaTot, coste: 0, motivos: reglas.filter((r) => !r.ok).map((r) => [r.t + ': ' + r.detalle, 20]), reglas, porque: porQue(B, mat, reglas, M), hist: [], ...mat });
    }
    yield { etapa: 'reglas', n: resultados.length, ok: resultados.map((r) => r.reglas.every((q) => q.ok)) };
    yield { etapa: 'despiece', n: resultados.length };
    return { alternativas: resultados, programa: prog, stats: { envolventes: E.lista.length, aristas: E.aristas, candidatas: resultados.length, variantes: k, modelos: orden.map((o) => MODELOS[o.k].n), iteraciones: 0, ms: ahora() - t0 } };
  }

  return { enumerar, programa, proponer, proponerModelos, MODELOS, traducir, materializar, configurar, TIPO, formasDeSerie, crearSolver, muroDP, formatosMuro, valida, firma };
}
if (typeof window !== 'undefined') window.CUEVA_MOTOR_DEF = CUEVA_MOTOR_DEF;

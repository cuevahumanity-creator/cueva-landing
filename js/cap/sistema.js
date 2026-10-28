// ─────────────────────────────────────────────────────────────────────
//  Capítulo «sistema»: Diseñado como software. En el plató blanco.
//  1. La cámara, pegada al suelo, ve caer el punto ámbar. Bota, y del golpe nace la trama de
//     75 cm: una onda de líneas finas que corre por el suelo blanco. La cámara sube y la descubre.
//  2. La serie J, como un muestrario de tipos: el punto salta de huella en huella y, en cada una,
//     la grúa baja una pieza (J1, J2, J4, J6, J8 y J10), a escala real, que se queda colgada y se
//     mece. De atrás hacia delante crecen como los cuerpos de una tipografía; la cámara las recorre.
//  3. Pieza a pieza: las grúas se llevan el muestrario y levantan una casa de dos plantas con
//     treinta y dos piezas sobre muretes: losas, muros con puerta y grandes huecos, el forjado con su terraza en
//     voladizo de 1,50 m, los muros de arriba y la cubierta. Las piezas llegan en sucesión, se
//     posan con su peso y el punto salta a cada una y la lee.
//  4. Las uniones, en macro: un enlace atornillado (chapa y cuatro tornillos que entran girando)
//     en la cubierta, uno soldado sobre chapas embebidas en su testa y, abajo, la losa de suelo
//     que simplemente se apoya en su murete: el canto apoyado y el asiento a la vista.
//  5. Las mismas piezas, casas distintas: la cámara sube; el punto flota como un motor y la casa
//     se transforma sin parar (una o dos plantas, de uno a tres cuerpos, tres bandas sobre la
//     malla de 16,5 × 9 m) mientras a su alrededor cientos de variantes cambian en olas. Este
//     latido va con el reloj: la escena respira aunque no se mueva el scroll.
//  6. Todo vuelve a la casa. El punto baja, entra por el gran hueco y la enciende por dentro.
//  Escala: 1 m = 40 unidades, en todo el capítulo. Las medidas salen de DATOS.
// ─────────────────────────────────────────────────────────────────────
CUEVA.capitulo('sistema', (ctx) => {
  const { T3, E, mezcla, tramo, COL, esmalte, estudio, punto, cuerda, mirar, distancia, DATOS } = ctx;
  const escena = new T3.Scene(), camara = new T3.PerspectiveCamera(30, 1, 1, 10000);
  const plato = estudio(escena, { tema: ctx.tema ?? 'claro' });
  const CLARO = (plato.tema ?? ctx.tema) !== 'oscuro';
  const BASE = { foco: plato.clave.intensity, ang: plato.clave.angle, contra: plato.contra.intensity };
  const cielo = escena.children.find((o) => o.isHemisphereLight), BASE_CIELO = (cielo ? cielo.intensity : 0.5) * (CLARO ? 0.55 : 1);   // menos relleno: el blanco se modela
  if (plato.suelo?.material.isShadowMaterial) plato.suelo.material.opacity = 0.2;   // sombras de contacto algo más firmes
  const M = 40, PASO = (DATOS.TRAMA?.paso ?? 0.75) * M, GR = 0.2 * M;       // la trama (30) y el canto de las piezas (8)
  const V = (x = 0, y = 0, z = 0) => new T3.Vector3(x, y, z);
  const amort = (t, f, k) => (t > 0 ? Math.sin(t * f) * Math.exp(-t * k) : 0);   // una oscilación que se apaga
  const modp = (a, n) => ((a % n) + n) % n;
  const J = Object.fromEntries(DATOS.SERIE_J.map((j) => [j.id, j]));
  const SERIE = DATOS.SERIE_J.filter((j) => j.f === 'plano');               // J1 a J10; la J12 aún está por validar
  const FONDO = new T3.Color(CLARO ? 0xE9EDF2 : COL.noche), FONDO_MACRO = new T3.Color(CLARO ? 0xE1E6EC : COL.noche), fondoC = new T3.Color();
  let fondo = FONDO.getHex();

  // ── geometría: piezas de esmalte con los cantos redondeados (y sus huecos, cortados en la pieza) ──
  function normalesSuaves(g, grados = 40) {
    const p = g.attributes.position, n = p.count / 3, fn = new Float32Array(n * 3), cl = Math.cos(grados * Math.PI / 180), mapa = new Map();
    const a = V(), b = V(), c = V(), clave = (q) => `${Math.round(p.getX(q) * 1000)},${Math.round(p.getY(q) * 1000)},${Math.round(p.getZ(q) * 1000)}`;
    for (let f = 0; f < n; f++) {
      a.fromBufferAttribute(p, f * 3); b.fromBufferAttribute(p, f * 3 + 1); c.fromBufferAttribute(p, f * 3 + 2);
      c.sub(b); a.sub(b); c.cross(a); fn.set([c.x, c.y, c.z], f * 3);
      for (let k = 0; k < 3; k++) { const ck = clave(f * 3 + k); (mapa.get(ck) || mapa.set(ck, []).get(ck)).push(f); }
    }
    const out = new Float32Array(p.count * 3), nf = V(), ng = V(), suma = V();
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
  function trazoR(s, x0, y0, x1, y1, r) {
    s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x1, y1 - r); s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
    s.lineTo(x0 + r, y1); s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }
  const rectR = (w, h, r) => trazoR(new T3.Shape(), -w / 2, -h / 2, w / 2, h / 2, r);
  const BIS = 1.3;
  // una pieza de l × a: tumbada (losa, el canto en y, la base en y = 0) o de pie (muro, el canto en z);
  // huecos: [x0, y0, x1, y1] en la pieza (x desde su centro, y desde su base)
  function placa(l, a, dePie, grueso = GR, bis = BIS, radio = 2.4, huecos = null) {
    const sh = rectR(l, a, radio);
    if (huecos) for (const [x0, y0, x1, y1] of huecos) sh.holes.push(trazoR(new T3.Path(), x0, y0 - a / 2, x1, y1 - a / 2, 1.2));
    const g = new T3.ExtrudeGeometry(sh, { depth: grueso - 2 * bis, bevelEnabled: true, bevelThickness: bis, bevelSize: bis, bevelOffset: -bis, bevelSegments: 3, curveSegments: 3 });
    if (dePie) g.translate(0, a / 2, -(grueso - 2 * bis) / 2);
    else { g.rotateX(-Math.PI / 2); g.translate(0, bis, 0); }
    return normalesSuaves(g);
  }
  const GEO = {};
  const geoDe = (id, dePie) => GEO[id + dePie] || (GEO[id + dePie] = placa(J[id].l * M, J[id].a * M, dePie));

  // ── la marca de cada pieza: su nombre y su cuadradito de lectura, pintados con Inter ──
  const TEX = {}, anis = ctx.renderer.capabilities.getMaxAnisotropy();
  function pintar(c, id) {
    const x = c.getContext('2d'); x.clearRect(0, 0, 256, 128); x.fillStyle = x.strokeStyle = '#fff';
    x.lineWidth = 7; x.beginPath(); if (x.roundRect) x.roundRect(16, 46, 38, 38, 7); else x.rect(16, 46, 38, 38); x.stroke();
    x.font = '600 76px Inter, system-ui, sans-serif'; x.textBaseline = 'middle'; x.fillText(id, 72, 68);
  }
  function texDe(id) {
    if (TEX[id]) return TEX[id];
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; pintar(c, id);
    const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = anis; return (TEX[id] = t);
  }
  document.fonts?.load('600 76px Inter').then(() => { for (const id in TEX) { pintar(TEX[id].image, id); TEX[id].needsUpdate = true; } }).catch(() => {});
  const geoEt = new T3.PlaneGeometry(1, 1);
  const cTinta = new T3.Color(COL.tinta), cMenta = new T3.Color(COL.menta);
  // el vidrio de la casa: azul noche, translúcido (se ve la luz de dentro); la puerta, de esmalte tinta
  const matVidrio = new T3.MeshPhysicalMaterial({ color: 0x1f2f55, roughness: 0.04, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4, transparent: true, opacity: 0.78, depthWrite: false });
  const matPuerta = esmalte(COL.tinta, { roughness: 0.35 });
  const geoCaja = new T3.BoxGeometry(1, 1, 1);

  // ── las piezas del muestrario: cada una su malla, su marca y su aparejo ──
  const COL_CABLE = CLARO ? 0x5b6680 : COL.cuerda;
  const PIEZAS = [];                                                           // todo lo que cuelga de una grúa
  const tA = V(), tB = V(), tM = V(), tG = V(), tC = V(), tH = V();
  // puntos de izado: cuatro eslingas en las losas, dos en los muros
  function izado(l, a, dePie) {
    const ag = []; let gancho;
    if (dePie) { const s = l * 0.3; ag.push(V(-s, a, 0), V(s, a, 0)); gancho = a + s * 0.9; }
    else { const hx = l / 2, hz = a / 2, i = Math.min(hx, hz) * 0.3; ag.push(V(-(hx - i), GR, -(hz - i)), V(hx - i, GR, -(hz - i)), V(hx - i, GR, hz - i), V(-(hx - i), GR, hz - i)); gancho = GR + Math.hypot(hx - i, hz - i) * 0.8; }
    return { ag, gancho, esl: ag[0].distanceTo(V(0, gancho, 0)) };
  }
  // el cable de la grúa: claro y fino, y se desvanece hacia arriba (en el plató blanco no debe leerse como una raya negra)
  const fundeCable = (() => { const c0 = new T3.Color(COL_CABLE), c1 = new T3.Color(CLARO ? 0xE9EDF2 : COL.noche), c = new T3.Color(); return (ln) => {
    const n = ln.geometry.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { c.lerpColors(c0, c1, Math.pow(i / (n - 1), 0.6)); col.set([c.r, c.g, c.b], i * 3); }
    ln.geometry.setAttribute('color', new T3.BufferAttribute(col, 3)); ln.material.vertexColors = true; ln.material.color.set(0xffffff); ln.material.opacity = CLARO ? 0.42 : 0.7; ln.material.needsUpdate = true; return ln; }; })();
  const colgar = (p) => { p.n = PIEZAS.length; p.cuerda = fundeCable(cuerda(escena, { color: COL_CABLE, opacidad: CLARO ? 0.42 : 0.8 })); PIEZAS.push(p); return p; };
  function pieza(id, dePie) {
    const j = J[id], l = j.l * M, a = j.a * M, grupo = new T3.Group();
    const malla = new T3.Mesh(geoDe(id, dePie), esmalte(COL.blanco)); malla.castShadow = true; malla.receiveShadow = true; grupo.add(malla);
    const et = new T3.Mesh(geoEt, new T3.MeshBasicMaterial({ map: texDe(id), color: COL.tinta, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    et.scale.set(36, 18, 1); et.rotation.x = -Math.PI / 2; et.position.set(-l / 2 + 27, GR + 0.06, a / 2 - 15); grupo.add(et);
    grupo.visible = false; escena.add(grupo);
    return colgar({ id, l, a, dePie, grupo, et, ...izado(l, a, dePie) });
  }

  // ── el guion: cuándo pasa cada cosa (u de 0 a 1) ──
  const T = {
    cae: [0.008, 0.026], onda: [0.026, 0.15],
    huella: (k) => 0.172 + k * 0.02, vaSe: (k) => 0.328 + k * 0.004,
    posa: (i) => 0.366 + i * 0.00425,                                          // treinta y dos piezas, con tres grúas a la vez
    macro: [0.503, 0.527, 0.662, 0.682],
    chapa: 0.521, perno: (k) => 0.534 + k * 0.0065, leeA: 0.574,
    pletina: 0.586, cordon: (j) => 0.595 + j * 0.0105, leeB: 0.619,
    alza: [0.637, 0.644, 0.657], leeC: 0.659,
    gen: [0.662, 0.69, 0.836, 0.858], cambio: [0.700, 0.716, 0.822, 0.842], lote: [0.700, 0.818],
  };

  // el muestrario: alineado a la izquierda como un texto, de la J1 (al fondo) a la J10 (delante)
  const Y_COL = 112;
  const MUESTRA = [];
  { let z = -13 * PASO; SERIE.slice(0, 6).forEach((j, k) => { const p = pieza(j.id, false); p.k = k; p.cx = -5 * PASO + p.l / 2; p.cz = z + p.a / 2; z += p.a + PASO; p.h = T.huella(k); MUESTRA.push(p); }); }

  // ── la casa: un cuerpo de dos plantas (6 × 6 m, con su terraza en voladizo de 1,50 m sobre la entrada), un ala de estudio
  //  de una planta cuya cubierta es terraza con petos, la escalera dentro y el muro del jardín: treinta y dos piezas J
  //  La casa no va en el suelo: su forjado sanitario apoya en muretes (Z0 es su alto; ilustrativo), como en las obras.
  const Z0 = 18, P1 = Z0 + 129, P2 = Z0 + 258, Y_CUB = P2 + GR, R2 = Math.PI / 2;   // muretes, forjado, cubierta y su cara de arriba
  //  [id, de pie, x, y, z, giro, inclinación, dónde la lee el punto, huecos [x0, y0, x1, y1, v vidrio | p puerta | '' paso],
  //   b: lleva banda de apoyo; las del jardín (jardin) van al suelo y no se alzan con la casa]
  const PLAN = [
    ['J8', 0, 0, Z0, -60, 0, 0, [60, Z0 + GR, -60]], ['J8', 0, 0, Z0, 60, 0, 0, [60, Z0 + GR, 60]],                                 // losas de planta baja
    ['J6', 0, 210, Z0, -60, 0, 0, [210, Z0 + GR, -60]], ['J6', 0, 210, Z0, 60, 0, 0, [210, Z0 + GR, 60]],                           // y las del estudio
    ['J8', 1, 0, Z0 + GR, -116, Math.PI, 0, [0, Z0 + 128, -116], [[-80, 40, -20, 88, 'v'], [20, 40, 80, 88, 'v']], 'b'],
    ['J8', 1, -116, Z0 + GR, 4, -R2, 0, [-116, Z0 + 128, 0], [[-30, 40, 30, 88, 'v']], 'b'],
    ['J8', 1, 116, Z0 + GR, 4, R2, 0, [116, Z0 + 128, 10], [[-90, 6, -40, 92, '']], 'b'],                                          // el paso al estudio
    ['J8', 1, 0, Z0 + GR, 116, 0, 0, [70, Z0 + 128, 116], [[-104, 6, -64, 88, 'p'], [-40, 10, 108, 106, 'v']], 'b'],              // la puerta y el gran hueco del salón
    ['J6', 1, 210, Z0 + GR, -116, Math.PI, 0, [210, Z0 + 128, -116], [[-40, 40, 40, 88, 'v']], 'b'],
    ['J8', 1, 296, Z0 + GR, 4, R2, 0, [296, Z0 + 128, 0], [[-60, 40, 0, 88, 'v']], 'b'],
    ['J6', 1, 210, Z0 + GR, 116, 0, 0, [210, Z0 + 128, 116], [[-80, 10, 80, 106, 'v']], 'b'],                                      // el ventanal del estudio
    ['J4', 1, 58, Z0 + GR, -56, R2, 0, [58, Z0 + 128, -56]],                                                                       // el muro de la escalera
    ['J2', 0, -58, Z0 + 34, -86, 0, 0.524, [-58, Z0 + 48, -86]], ['J2', 0, 24, Z0 + 60, -56, R2, 0, [24, Z0 + 68, -56]], ['J2', 0, -58, Z0 + 94, -26, 0, -0.524, [-58, Z0 + 108, -26]],   // la escalera: tramo, meseta, tramo
    ['J10', 0, -60, P1, 30, R2, 0, [-60, P1 + GR, 150], null, 'a'], ['J10', 0, 60, P1, 30, R2, 0, [60, P1 + GR, 150], null, 'a'],   // el forjado con la terraza en voladizo
    ['J6', 0, 210, P1, -60, 0, 0, [210, P1 + GR, -60]], ['J6', 0, 210, P1, 60, 0, 0, [210, P1 + GR, 60]],                // la cubierta del estudio, que es terraza
    ['J8', 1, 0, P1 + GR, -116, Math.PI, 0, [0, P2 - 1, -116], [[-60, 36, 60, 92, 'v']], 'ab'],
    ['J8', 1, -116, P1 + GR, 4, -R2, 0, [-116, P2 - 1, 0], [[-24, 26, 24, 100, 'v']], 'ab'],
    ['J8', 1, 116, P1 + GR, 4, R2, 0, [116, P2 - 1, 10], [[-40, 6, 0, 94, 'v'], [30, 30, 80, 94, 'v']], 'ab'],          // la puerta a la terraza del estudio
    ['J8', 1, 0, P1 + GR, 116, 0, 0, [0, P2 - 1, 116], [[-100, 6, 100, 94, 'v']], 'ab'],                                  // el ventanal a la terraza
    ['J10', 0, 0, P2, -60, 0, 0, [-40, Y_CUB, -60], null, 'a'], ['J10', 0, 0, P2, 60, 0, 0, [40, Y_CUB, 60], null, 'a'],   // la cubierta, que vuela 0,75 m a los lados
    ['J2', 1, 180, P1 + GR, 116, 0, 0, [180, P1 + GR + 60, 116]], ['J1', 1, 270, P1 + GR, 116, 0, 0, [270, P1 + GR + 60, 116]],   // los petos de la terraza
    ['J2', 1, 296, P1 + GR, -60, R2, 0, [296, P1 + GR + 60, -60]], ['J2', 1, 296, P1 + GR, 60, R2, 0, [296, P1 + GR + 60, 60]],
    ['J2', 1, 360, 0, 236, 0, 0, [360, 60, 236]], ['J2', 1, 480, 0, 236, 0, 0, [480, 60, 236]], ['J1', 1, 536, 0, 206, R2, 0, [536, 60, 206]],   // el muro del jardín, en el suelo
  ];
  const I_VENTANAL = 22, I_CUB = [23, 24], I_JARDIN = 29;                     // desde la 29, el muro del jardín (en el suelo)
  // tres grúas, cada una llega desde su lado con su propio vaivén
  const GRUAS = [{ ang: -0.95, vai: 7, fr: 2.6 }, { ang: 0.35, vai: 9, fr: 2.2 }, { ang: 1.3, vai: 6, fr: 3.0 }];
  // las marcas, en un atlas (una celda por tipo de pieza)
  const IDS = SERIE.slice(0, 6).map((j) => j.id), atlas = document.createElement('canvas'); atlas.width = 512; atlas.height = 384;
  const pintarAtlas = () => { const x = atlas.getContext('2d'); x.clearRect(0, 0, 512, 384); IDS.forEach((id, k) => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; pintar(c, id); x.drawImage(c, (k % 2) * 256, Math.floor(k / 2) * 128); }); };
  pintarAtlas();
  const atlasTx = new T3.CanvasTexture(atlas); atlasTx.colorSpace = T3.SRGBColorSpace; atlasTx.anisotropy = anis;
  document.fonts?.load('600 76px Inter').then(() => { pintarAtlas(); atlasTx.needsUpdate = true; }).catch(() => {});
  // cada pieza es un hueso: las tres mallas de la casa (esmalte, vidrio, marcas) se dibujan de una vez
  const raiz = new T3.Object3D(); escena.add(raiz);
  const PARTES = { malla: [], vidrio: [], marca: [] }, mtx = new T3.Matrix4(), qq = new T3.Quaternion(), ee = new T3.Euler();
  const CASA = PLAN.map(([id, dp, x, y, z, giro, incl, lee, huecos, op = ''], i) => {
    const j = J[id], l = j.l * M, a = j.a * M, dePie = !!dp, hueso = new T3.Bone(); hueso.rotation.order = 'YXZ'; raiz.add(hueso);
    PARTES.malla.push([huecos ? placa(l, a, dePie, GR, BIS, 2.4, huecos) : geoDe(id, dePie), null, i, 0xffffff]);
    if (huecos) for (const [x0, y0, x1, y1, t] of huecos) { if (!t) continue; const pu = t === 'p'; mtx.compose(tA.set((x0 + x1) / 2, (y0 + y1) / 2, pu ? -1.5 : 0), qq.identity(), tB.set(x1 - x0, y1 - y0, pu ? 3 : 1.2)); PARTES[pu ? 'malla' : 'vidrio'].push([geoCaja, mtx.clone(), i, pu ? COL.tinta : 0xffffff]); }
    if (dePie) mtx.compose(tA.set(-l / 2 + 27, a - 15, GR / 2 + 0.06), qq.identity(), tB.set(36, 18, 1));
    else mtx.compose(tA.set(I_CUB.includes(i) ? l / 2 - 27 : -l / 2 + 27, GR + 0.06, a / 2 - 15), qq.setFromEuler(ee.set(-Math.PI / 2, 0, 0)), tB.set(36, 18, 1));
    PARTES.marca.push([geoEt, mtx.clone(), i, IDS.indexOf(id)]);
    // la losa de suelo de la esquina lleva también su marca en el canto: es la que se ve apoyada en el murete
    if (i === 1) { mtx.compose(tA.set(-l / 2 + 26, GR / 2, a / 2 + 0.06), qq.identity(), tB.set(14, 7, 1)); PARTES.marca.push([geoEt, mtx.clone(), i, IDS.indexOf(id)]); }
    const gr = GRUAS[i % 3], p = colgar({ id, l, a, dePie, grupo: hueso, hueso, i, f: V(x, y, z), giro, incl, lee: V(...lee), arriba: i < I_JARDIN, apoyo: op.includes('b'), gr, ...izado(l, a, dePie) });
    p.land = T.posa(i); p.leer = p.land + 0.0018;
    p.sl = V(Math.sin(gr.ang) * 180, 0, -Math.cos(gr.ang) * 180); p.pe = V(Math.cos(gr.ang), 0, Math.sin(gr.ang));
    p.y0 = (i % 2 ? 0.42 : -0.36); p.gF = V(x, y + p.gancho, z);
    return p;
  });
  // funde las partes en una geometría con su hueso (skinIndex) y su número de pieza (para el destello de la lectura)
  const cLin = new T3.Color();
  function fundir(lista, enAtlas) {
    let n = 0; const tr = lista.map(([g, m, i, c]) => { const q = g.index ? g.toNonIndexed() : g.clone(); if (m) q.applyMatrix4(m); n += q.attributes.position.count; return [q, i, c]; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), ap = new Float32Array(n);
    let o = 0;
    for (const [q, i, c] of tr) {
      const k = q.attributes.position.count, quv = q.attributes.uv?.array;
      pos.set(q.attributes.position.array, o * 3); nor.set(q.attributes.normal.array, o * 3);
      if (!enAtlas) cLin.set(c);
      for (let t = 0; t < k; t++) {
        const w = o + t;
        if (quv) { if (enAtlas) { uv[w * 2] = ((c % 2) + quv[t * 2]) / 2; uv[w * 2 + 1] = 1 - (Math.floor(c / 2) + 1 - quv[t * 2 + 1]) / 3; } else { uv[w * 2] = quv[t * 2]; uv[w * 2 + 1] = quv[t * 2 + 1]; } }
        col[w * 3] = enAtlas ? 1 : cLin.r; col[w * 3 + 1] = enAtlas ? 1 : cLin.g; col[w * 3 + 2] = enAtlas ? 1 : cLin.b;
        si[w * 4] = i; sw[w * 4] = 1; ap[w] = i;
      }
      o += k; q.dispose();
    }
    const g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('normal', new T3.BufferAttribute(nor, 3)); g.setAttribute('uv', new T3.BufferAttribute(uv, 2)); g.setAttribute('color', new T3.BufferAttribute(col, 3));
    g.setAttribute('skinIndex', new T3.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new T3.BufferAttribute(sw, 4)); g.setAttribute('aPieza', new T3.BufferAttribute(ap, 1));
    return g;
  }
  // la lectura de cada pieza (un destello menta), con un uniforme por pieza
  const uLee = { value: new Float32Array(PLAN.length) }, mentaL = new T3.Color(COL.menta);
  const conLectura = (mat, enMarca) => {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uLee = uLee; sh.uniforms.uMentaL = { value: V(mentaL.r, mentaL.g, mentaL.b) };
      sh.vertexShader = `attribute float aPieza;\nuniform float uLee[${PLAN.length}];\nvarying float vLee;\n` + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLee = uLee[int(aPieza + 0.5)];');
      sh.fragmentShader = 'uniform vec3 uMentaL;\nvarying float vLee;\n' + (enMarca
        ? sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, uMentaL, vLee);')
        : sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uMentaL * 0.12 * vLee;'));
    };
    return mat;
  };
  raiz.updateMatrixWorld(true);
  const esqueleto = new T3.Skeleton(CASA.map((p) => p.hueso));
  const piel = (geo, mat, sombra) => { const m = new T3.SkinnedMesh(geo, mat); m.bind(esqueleto, new T3.Matrix4()); m.frustumCulled = false; m.castShadow = sombra; m.receiveShadow = sombra; escena.add(m); return m; };
  const casaMalla = piel(fundir(PARTES.malla, false), conLectura(esmalte(COL.blanco, { vertexColors: true }), false), true);
  const casaVidrio = piel(fundir(PARTES.vidrio, false), matVidrio, false);
  const casaMarcas = piel(fundir(PARTES.marca, true), conLectura(new T3.MeshBasicMaterial({ map: atlasTx, color: COL.tinta, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), true), false);
  casaVidrio.renderOrder = 2; casaMarcas.renderOrder = 3;
  // la barandilla de vidrio de la terraza (llega con el ventanal de arriba)
  const baranda = new T3.Group(); escena.add(baranda);
  for (const [sx, sy, sz, x, z] of [[236, 40, 1.2, 0, 178], [1.2, 40, 56, -118, 150], [1.2, 40, 56, 118, 150]]) { const m = new T3.Mesh(geoCaja, matVidrio); m.scale.set(sx, sy, sz); m.position.set(x, 20, z); baranda.add(m); }
  { const m = new T3.Mesh(geoCaja, matPuerta); m.scale.set(238, 1.4, 1.8); m.position.set(0, 40.5, 178); baranda.add(m); }

  // los apoyos: bandas de neopreno sobre los muros que reciben un forjado (una junta oscura que marca el contacto)
  const matBanda = new T3.MeshStandardMaterial({ color: 0x1a1f28, roughness: 0.7 });
  // los muretes: las losas de suelo apoyan por sus testas (el canto vuela un poco y el asiento, con su banda, queda a la vista)
  //  [x, ancho]: el de la izquierda, el compartido entre la casa y el estudio y el del fondo del estudio
  const MURETES = [[-110, 10], [120, 16], [290, 10]], Z_MUR = 116;
  const matMurete = esmalte(0xd6dbe2, { roughness: 0.55, clearcoat: 0.2 });
  const muretes = new T3.InstancedMesh(geoCaja, matMurete, MURETES.length * 2); muretes.castShadow = true; muretes.receiveShadow = true; muretes.instanceMatrix.setUsage(T3.DynamicDrawUsage); escena.add(muretes);
  { const cB = new T3.Color(0xffffff), cN = new T3.Color(0x6a7384); for (let k = 0; k < MURETES.length; k++) { muretes.setColorAt(k, cB); muretes.setColorAt(MURETES.length + k, cN); } }   // y su banda de apoyo, oscura
  const BANDAS = [];
  for (const p of CASA) if (p.apoyo) { const az = Math.abs(Math.sin(p.giro)) > 0.5; BANDAS.push([p.i, p.f.x, p.f.y + p.a + 0.5, p.f.z, az ? 5 : p.l - 8, az ? p.l - 8 : 5]); }
  const bandas = new T3.InstancedMesh(geoCaja, matBanda, BANDAS.length); bandas.receiveShadow = true; escena.add(bandas);

  // ── la trama: un plano con líneas finas que enciende una onda; también pinta huellas y parcelas ──
  const hex3 = (h) => new T3.Vector3(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255);
  // la malla del motor generativo: parcelas de 16,5 × 9 m en tres bandas, separadas por calles
  const GEN = DATOS.GENERATIVA || { plantas: 2, cuerpos: 3, bandas: 3, malla: [16.5, 9] };
  const LX = GEN.malla[0] * M, LZ = GEN.malla[1] * M, MOD = 1.5 * M, COLS = Math.round(LX / MOD), BANDA = LZ / GEN.bandas, PLANTA = 135;
  const LOTE0 = V(-120, 0, -120), PITCH = V(LX + 120, 0, LZ + 120), NL = 4, LOTE_C = V(LOTE0.x + LX / 2, 0, LOTE0.z + LZ / 2);
  const tramaU = {
    uRev: { value: V(0, 0, 0) }, uOnda: { value: [0, 1, 2, 3].map(() => new T3.Vector4()) },
    uRect: { value: Array.from({ length: 8 }, () => new T3.Vector4()) }, uRectC: { value: Array.from({ length: 8 }, () => new T3.Vector4()) },
    uLejos: { value: 1500 }, uPaso: { value: PASO }, uK: { value: 1 },
    uLote: { value: new T3.Vector4(LOTE0.x, LOTE0.z, PITCH.x, PITCH.z) }, uLoteT: { value: new T3.Vector4(LX, LZ, NL, 0) }, uLoteR: { value: V(LOTE_C.x, LOTE_C.z, 0) }, uBanda: { value: BANDA },
    uTinta: { value: hex3(CLARO ? COL.tinta : COL.cian) }, uIon: { value: hex3(COL.ion) },
  };
  const trama = new T3.Mesh((() => { const g = new T3.PlaneGeometry(9000, 9000); g.rotateX(-Math.PI / 2); g.translate(LOTE_C.x, 0.25, LOTE_C.z); return g; })(), new T3.ShaderMaterial({
    uniforms: tramaU, transparent: true, depthWrite: false, blending: CLARO ? T3.NormalBlending : T3.AdditiveBlending,
    defines: CLARO ? { CLARO: 1 } : {},
    vertexShader: 'varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      varying vec3 vP;
      uniform vec3 uRev, uTinta, uIon, uLoteR; uniform vec4 uOnda[4]; uniform vec4 uRect[8]; uniform vec4 uRectC[8];
      uniform vec4 uLote, uLoteT; uniform float uLejos, uPaso, uK, uBanda;
      void main() {
        vec2 p = vP.xz, w = fwidth(p); float wm = max(w.x, w.y);
        vec2 g = abs(fract(p / uPaso + 0.5) - 0.5) * uPaso;
        vec2 l2 = 1.0 - smoothstep(w * 0.45, w * 1.45, g);
        float dens = 1.0 - smoothstep(uPaso / 22.0, uPaso / 7.0, wm);         // de lejos, las líneas se funden antes que hacer muaré
        float L = max(l2.x, l2.y) * dens, nodo = (1.0 - smoothstep(wm * 1.3, wm * 3.2, length(g))) * dens;
        float r = length(p - uRev.xy);
        float dentro = 1.0 - smoothstep(uRev.z - 120.0, uRev.z, r), lejos = 1.0 - smoothstep(uLejos * 0.3, uLejos, r);
        float k = (L * 0.1 + nodo * 0.17) * dentro * lejos;
        vec3 acc = uTinta * k; float a = k;
        float fr = 0.0;
        for (int i = 0; i < 4; i++) { float an = max(30.0, uOnda[i].z * 0.035); float ri = (length(p - uOnda[i].xy) - uOnda[i].z) / an; fr += exp(-ri * ri) * uOnda[i].w; }
        float kf = (L * 0.8 + nodo * 0.9 + 0.05) * fr; acc += uIon * kf; a += kf;
        for (int i = 0; i < 8; i++) {
          vec4 R = uRect[i], C = uRectC[i]; if (C.w <= 0.001) continue;
          vec2 q = max(R.xy - p, p - R.zw); float fuera = max(q.x, q.y);
          float den = 1.0 - smoothstep(-wm, wm, fuera), borde = 1.0 - smoothstep(wm * 0.7, wm * 2.2, abs(fuera));
          float kr = C.w * (den * (0.07 + L * 0.5 + nodo * 0.5) + borde * 0.85); acc += C.rgb * kr; a += kr;
        }
        // las parcelas del motor generativo (16,5 × 9 m, tres bandas), que aparecen en ola desde la casa
        if (uLoteT.w > 0.001) {
          vec2 q = p - uLote.xy, c = floor(q / uLote.zw), l = q - c * uLote.zw;
          if (abs(c.x) <= uLoteT.z && abs(c.y) <= uLoteT.z) {
            vec2 cc = uLote.xy + c * uLote.zw + uLoteT.xy * 0.5;
            float ola = 1.0 - smoothstep(uLoteR.z - 500.0, uLoteR.z, length(cc - uLoteR.xy));
            float e = min(min(l.x, uLoteT.x - l.x), min(l.y, uLoteT.y - l.y));
            float borde = 1.0 - smoothstep(wm * 0.6, wm * 1.9, abs(e)), den = step(0.0, e);
            float bnd = (1.0 - smoothstep(wm * 0.5, wm * 1.5, abs(l.y - uBanda))) + (1.0 - smoothstep(wm * 0.5, wm * 1.5, abs(l.y - 2.0 * uBanda)));
            float kl = uLoteT.w * ola * (borde * (0.55 + fr * 0.4) + den * (0.045 + bnd * 0.22));
            acc += uIon * kl; a += kl;
          }
        }
        #ifdef CLARO
          gl_FragColor = vec4(acc / max(a, 1e-4), min(a * uK, 0.95));
        #else
          gl_FragColor = vec4(acc * uK, 1.0);
        #endif
      }`,
  }));
  trama.frustumCulled = false; trama.renderOrder = 1; escena.add(trama);
  const ION = hex3(COL.ion), MEN = hex3(COL.menta);
  const onda = (i, x, z, r, k) => tramaU.uOnda.value[i].set(x, z, r, k);
  const huella = (i, x0, z0, x1, z1, c, k) => { tramaU.uRect.value[i].set(x0, z0, x1, z1); tramaU.uRectC.value[i].set(c.x, c.y, c.z, k); };

  // ── grúa: ganchos (gancho y bola), eslingas y cables ──
  const matMetal = new T3.MeshStandardMaterial({ color: CLARO ? 0x4a556b : COL.cuerda, roughness: 0.36, metalness: 0.7 });
  const ganchos = new T3.InstancedMesh(new T3.TorusGeometry(2.6, 0.75, 8, 18, Math.PI * 1.5), matMetal, PIEZAS.length);
  const bolas = new T3.InstancedMesh(new T3.SphereGeometry(3.6, 18, 12), matMetal, PIEZAS.length);
  for (const im of [ganchos, bolas]) { im.instanceMatrix.setUsage(T3.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = true; escena.add(im); }
  const jarcia = new T3.LineSegments(new T3.BufferGeometry(), new T3.LineBasicMaterial({ color: COL_CABLE, transparent: true, opacity: CLARO ? 0.45 : 0.7 }));
  jarcia.geometry.setAttribute('position', new T3.BufferAttribute(new Float32Array(PIEZAS.length * 16 * 3), 3)); jarcia.frustumCulled = false; escena.add(jarcia);
  const jp = jarcia.geometry.attributes.position, mano = new T3.Object3D();
  function ocultar(p) {
    for (let i = 0; i < 16; i++) jp.setXYZ(p.n * 16 + i, 0, 0, 0);
    mano.scale.setScalar(0); mano.updateMatrix(); ganchos.setMatrixAt(p.n, mano.matrix); bolas.setMatrixAt(p.n, mano.matrix); p.cuerda.visible = false;
  }
  // g: el gancho en el mundo; suelta (0..1): las eslingas sueltas acaban colgando del gancho; comba: lo flojas que van
  function aparejo(p, g, suelta, comba, vib, balanceo = 0) {
    for (let i = 0; i < 4; i++) {
      const o = p.n * 16 + i * 4;
      if (i >= p.ag.length) { for (let j = 0; j < 4; j++) jp.setXYZ(o + j, g.x, g.y, g.z); continue; }
      p.grupo.localToWorld(tA.copy(p.ag[i]));
      tB.set(g.x + Math.sign(p.ag[i].x) * 1.4 + balanceo, g.y - p.esl * 0.92, g.z + Math.sign(p.ag[i].z || 1) * 1.4); tA.lerp(tB, suelta);
      tM.lerpVectors(tA, g, 0.5); tM.y -= comba;
      jp.setXYZ(o, tA.x, tA.y, tA.z); jp.setXYZ(o + 1, tM.x, tM.y, tM.z); jp.setXYZ(o + 2, tM.x, tM.y, tM.z); jp.setXYZ(o + 3, g.x, g.y, g.z);
    }
    mano.position.copy(g); mano.rotation.set(0, p.grupo.rotation.y, Math.PI * 0.75 + balanceo * 0.04); mano.scale.setScalar(1); mano.updateMatrix(); ganchos.setMatrixAt(p.n, mano.matrix);
    mano.position.y += 6.5; mano.rotation.set(0, 0, 0); mano.updateMatrix(); bolas.setMatrixAt(p.n, mano.matrix);
    p.cuerda.tender(tC.set(g.x, g.y + 9.5, g.z), tG.set(g.x, g.y + 1700, g.z), 0, vib);
  }

  // ── las uniones ──
  const matAcero = new T3.MeshPhysicalMaterial({ color: 0x3a4049, metalness: 0.9, roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.3, envMapIntensity: 0.7 });
  const matZinc = new T3.MeshPhysicalMaterial({ color: 0x8d96a5, metalness: 1, roughness: 0.28 });
  const sombra = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  //  A: en la junta de la cubierta; B: en su testa; C: el forjado de la terraza sobre el muro de abajo
  const NUDO_A = V(-134, Y_CUB, 0), NUDO_B = V(-150, P2 + GR / 2, 0), NUDO_C = V(-110, Z0, Z_MUR);   // C: la testa de la losa de suelo sobre su murete
  // 1. atornillada: chapa (enlace de acero) con cuatro taladros y cuatro tornillos M24
  const TAL = [[-2.4, -3.8], [2.4, -3.8], [-2.4, 3.8], [2.4, 3.8]], NT = Math.min(4, DATOS.UNION?.porNudo ?? 4);
  const chapa = sombra(new T3.Mesh((() => {
    const s = rectR(8, 12, 0.7); for (const [x, y] of TAL) { const h = new T3.Path(); h.absarc(x, y, 0.56, 0, Math.PI * 2, true); s.holes.push(h); }
    const g = new T3.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelOffset: -0.1, bevelSegments: 2, curveSegments: 10 });
    g.rotateX(-Math.PI / 2); g.translate(0, 0.1, 0); return normalesSuaves(g, 50);
  })(), matAcero)); escena.add(chapa);
  const cabezas = sombra(new T3.InstancedMesh((() => { const g = new T3.CylinderGeometry(0.78, 0.83, 0.6, 6); g.translate(0, 0.46, 0); return g; })(), matZinc, 4));
  const vastagos = sombra(new T3.InstancedMesh(new T3.LatheGeometry([new T3.Vector2(0, -2.5), new T3.Vector2(0.46, -2.5), new T3.Vector2(0.48, -2.35), new T3.Vector2(0.48, 0), new T3.Vector2(0.9, 0), new T3.Vector2(0.9, 0.16), new T3.Vector2(0, 0.16)], 20), matZinc, 4));
  for (const im of [cabezas, vastagos]) { im.instanceMatrix.setUsage(T3.DynamicDrawUsage); im.frustumCulled = false; escena.add(im); }
  // 2. soldada, en la testa de la cubierta: dos chapas embebidas (van en su losa desde el vertido), una pletina y dos cordones
  const geoEmb = new T3.BoxGeometry(0.12, 4.6, 3.2);
  for (const [p, sg] of [[CASA[I_CUB[0]], -1], [CASA[I_CUB[1]], 1]]) { const m = new T3.Mesh(geoEmb, matAcero); m.receiveShadow = true; m.position.set(NUDO_B.x - p.f.x + 0.02, GR / 2, sg * 2.9 - p.f.z); p.grupo.add(m); }
  const pletina = sombra(new T3.Mesh((() => { const g = new T3.ExtrudeGeometry(rectR(4.2, 6.4, 0.25), { depth: 0.36, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelOffset: -0.07, bevelSegments: 1, curveSegments: 4 }); g.rotateX(-Math.PI / 2); g.translate(0, 0.07, 0); g.rotateZ(Math.PI / 2); return g; })(), matAcero)); escena.add(pletina);
  const geoCordon = (() => { const g = new T3.CylinderGeometry(0.26, 0.26, 1, 10, 1); g.translate(0, 0.5, 0); return g; })();
  const cordones = [0, 1].map(() => { const m = sombra(new T3.Mesh(geoCordon, new T3.MeshStandardMaterial({ color: 0x4a515b, metalness: 0.85, roughness: 0.5, emissive: 0xfff3e6, emissiveIntensity: 0 }))); escena.add(m); return m; });
  // el arco y las chispas: núcleo blanco con un halo ion, que se leen también sobre blanco
  const brilloTx = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(230,248,255,.95)'); g.addColorStop(0.42, 'rgba(14,165,233,.45)'); g.addColorStop(1, 'rgba(14,165,233,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t;
  })();
  const arco = new T3.Sprite(new T3.SpriteMaterial({ map: brilloTx, blending: CLARO ? T3.NormalBlending : T3.AdditiveBlending, depthWrite: false, transparent: true })); escena.add(arco);
  const luzArco = new T3.PointLight(0xbfe9ff, 0, 60, 0); escena.add(luzArco);
  const NCH = 56, chispas = new T3.Points(new T3.BufferGeometry(), new T3.PointsMaterial({ map: brilloTx, size: 0.55, transparent: true, depthWrite: false, blending: CLARO ? T3.NormalBlending : T3.AdditiveBlending }));
  chispas.geometry.setAttribute('position', new T3.BufferAttribute(new Float32Array(NCH * 3), 3)); chispas.frustumCulled = false; escena.add(chispas);
  const CH = Array.from({ length: NCH }, (_, i) => { const a = i * 2.39996, s = 3 + ((i * 7919) % 9); return [-(3 + ((i * 6007) % 7)), 1 + ((i * 104729) % 7), Math.sin(a) * s, (i * 0.618034) % 1]; });   // salen hacia fuera y caen

  // ── el motor generativo: cuerpos de esmalte (con sus juntas de 1,50 m y de planta) y huecos de vidrio ──
  const matCuerpo = esmalte(COL.blanco);
  matCuerpo.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 wq = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        wq = instanceMatrix * wq;
      #endif
      vWp = (modelMatrix * wq).xyz;`);
    sh.fragmentShader = 'varying vec3 vWp;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec3 n3 = abs(normalize(cross(dFdx(vWp), dFdy(vWp)))), w3 = fwidth(vWp), per = vec3(${MOD.toFixed(1)}, ${PLANTA.toFixed(1)}, ${MOD.toFixed(1)});
        vec3 g3 = abs(fract((vWp - vec3(${LOTE0.x.toFixed(1)}, 0.0, ${LOTE0.z.toFixed(1)})) / per + 0.5) - 0.5) * per;
        vec3 l3 = (1.0 - smoothstep(w3 * 0.5, w3 * 1.5, g3)) * step(n3, vec3(0.5));
        diffuseColor.rgb *= 1.0 - 0.13 * max(max(l3.x, l3.y), l3.z);      // las juntas entre piezas
      }`);
  };
  const geoCuerpo = placa(1, 1, false, 1, 0.012, 0.02);
  const NLOTES = (2 * NL + 1) ** 2 - 1, NCU = NLOTES * 3 + 3, NVE = NLOTES * 6 + 6;
  const cuerpos = new T3.InstancedMesh(geoCuerpo, matCuerpo, NCU); cuerpos.castShadow = true; cuerpos.receiveShadow = true;
  const matHueco = new T3.MeshPhysicalMaterial({ color: CLARO ? 0x2a3b62 : 0x0b1530, roughness: 0.08, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04 });
  const ventanas = new T3.InstancedMesh(geoCaja, matHueco, NVE);
  for (const im of [cuerpos, ventanas]) { im.instanceMatrix.setUsage(T3.DynamicDrawUsage); im.frustumCulled = false; im.visible = false; escena.add(im); }
  // una variante: las once columnas de 1,50 m se reparten en hasta tres cuerpos, cada uno en una o varias bandas, de una o dos plantas
  const azar = (s) => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  function variante(semilla) {
    const r = azar(semilla), n = 1 + Math.floor(r() * GEN.cuerpos), lista = [null, null, null];
    let c = Math.floor(r() * 2);
    for (let k = 0; k < n && c <= COLS - 3; k++) {
      const queda = COLS - c - 3 * (n - 1 - k), L = Math.max(3, Math.min(queda, 3 + Math.floor(r() * 5)));
      const d = 1 + Math.floor(r() * GEN.bandas), o = Math.floor(r() * (GEN.bandas - d + 1)), pl = r() < 0.5 ? GEN.plantas : 1;
      lista[k] = { x0: c * MOD, z0: o * BANDA, L: L * MOD, D: d * BANDA, H: pl * PLANTA, y0: 0, pl, v: Math.floor(r() * 3) };
      c += L + (r() < 0.45 ? 1 : 0);
    }
    return lista;
  }
  // cada lote tiene su rueda de variantes (calculadas una vez); el reloj las va pasando
  const RUEDA = 8, PER_C = 1.9, PER_L = 2.1;
  const LOTES = [];
  for (let i = -NL; i <= NL; i++) for (let j = -NL; j <= NL; j++) {
    if ((!i && !j) || j < -2 || Math.hypot(i / NL, j / NL) > 1.05) continue;              // un disco de parcelas, más hacia la cámara
    const ox = LOTE0.x + i * PITCH.x, oz = LOTE0.z + j * PITCH.z, s0 = (i + 17) * 131 + (j + 23) * 977;
    LOTES.push({ ox, oz, dn: Math.hypot(i * PITCH.x, j * PITCH.z) / Math.hypot(NL * PITCH.x, NL * PITCH.z), fase: ((s0 * 0.6180339) % 1) * 0.35, R: Array.from({ length: RUEDA }, (_, k) => variante(s0 + 7 * k)) });
  }
  // la parcela de la casa: la casa entera como envolvente (dos plantas, cuatro módulos por dos bandas) y su rueda de doce variantes
  const ENVOLVENTE = [{ x0: 0, z0: 0, L: 4 * MOD, D: 2 * BANDA, H: 2 * PLANTA, y0: 0, pl: 2, v: 1 }, { x0: 4 * MOD, z0: 0, L: 3 * MOD, D: 2 * BANDA, H: PLANTA, y0: 0, pl: 1, v: 2 }, null];
  const RUEDA_C = Array.from({ length: 12 }, (_, k) => variante(5003 + 11 * k));

  // ── el punto ámbar y su lectura (un aro menta que se abre) ──
  const P = punto(escena);
  if (P.esfera) P.esfera.castShadow = true;                                    // sobre blanco, su sombra lo posa en el suelo
  const aro = new T3.Mesh(new T3.TorusGeometry(1, 0.04, 6, 72), new T3.MeshBasicMaterial({ color: COL.menta, transparent: true, depthWrite: false, blending: CLARO ? T3.NormalBlending : T3.AdditiveBlending }));
  escena.add(aro);
  // la ruta del punto: tramos de vuelo (u0 → u1) entre puntos de apoyo
  const RUTA = []; let ultimo = V(0, 150, 0);
  const salto = (u0, u1, x, y, z, h, o = {}) => { const s = { u0, u1, de: ultimo, a: V(x, y, z), h, ...o }; RUTA.push(s); ultimo = s.a; return s; };
  salto(T.cae[0], T.cae[1], 0, 0, 0, 0, { caida: true });                     // cae
  salto(0.026, 0.037, 0, 0, 0, 30); salto(0.037, 0.043, 0, 0, 0, 9);          // dos botes
  for (const p of MUESTRA) salto(p.h - 0.012, p.h, p.cx, 0, p.cz, 44);         // de huella en huella
  for (const p of CASA) salto(p.land - 0.0018, p.leer, p.lee.x, p.lee.y, p.lee.z, 16 + Math.abs(p.lee.y - ultimo.y) * 0.1);
  salto(0.507, 0.521, NUDO_A.x + 8, Y_CUB, 6, 18);                            // al macro: de nudo en nudo
  salto(0.577, 0.587, NUDO_B.x + 6, Y_CUB, 5, 6);                              // se asoma al borde
  salto(0.62, 0.634, NUDO_C.x - 4, 0, NUDO_C.z + 16, 40);                     // baja al suelo, junto al murete
  salto(0.664, 0.694, LOTE_C.x - 60, 330, LOTE_C.z + 260, 110, { flota: true });   // sube y flota delante de la parcela: el motor
  salto(0.838, 0.856, 70, 0, 250, 30);                                        // baja
  salto(0.862, 0.878, 40, Z0 + GR, 30, 30);                                        // y entra en la casa por el gran hueco
  const LECTURAS = [
    ...CASA.map((p) => [p.leer, p.lee.x, p.lee.y, p.lee.z, p.dePie ? Math.min(26, p.l * 0.3) : Math.min(46, p.l * 0.3)]),
    [T.leeA, NUDO_A.x, Y_CUB + 0.7, 0, 9], [T.leeB, NUDO_B.x - 0.6, NUDO_B.y, 0, 6, 1], [T.leeC, NUDO_C.x, Z0 - 0.4, NUDO_C.z + 4.4, 9, 2],
  ];
  const macro = (u) => E.seno(tramo(u, T.macro[0], T.macro[1])) * (1 - E.seno(tramo(u, T.macro[2], T.macro[3])));
  const fGen = (u) => E.seno(tramo(u, T.gen[0], T.gen[1])) * (1 - E.seno(tramo(u, T.gen[2], T.gen[3])));
  // cuánto manda el motor sobre la casa: entra con el scroll y, mientras dura, el reloj va cambiando las variantes
  const fCiclo = (u) => E.seno(tramo(u, T.cambio[0], T.cambio[1])) * (1 - E.seno(tramo(u, T.cambio[2], T.cambio[3])));
  const casaOculta = (u) => u > T.cambio[0] && u < T.cambio[3];
  let dCam = 1000;
  const radio = (u) => Math.min(mezcla(mezcla(7, 5.5, tramo(u, 0.15, 0.19)), 40, fGen(u)), Math.max(0.95, dCam * 0.0072));   // con la cámara: pequeño en macro, grande sobre la ciudad
  const EJE_Y = V(0, 1, 0), tP = V(), tDir = V();
  // la losa de suelo, cuando se ve que solo apoya: se alza un poco de su murete (con toda la casa encima) y se vuelve a posar
  const alza = (u) => 3.2 * E.eio(tramo(u, T.alza[0], T.alza[1])) * (1 - E.rebote(tramo(u, T.alza[1], T.alza[2])));
  // el latido del motor, con el reloj: cada PER_C segundos, una casa nueva
  const latido = (reloj) => { const ph = modp(reloj, PER_C); return ph < 0.5 ? 0.45 * amort(ph / 0.5 * 2, 7, 2.2) : -0.22 * E.eo(tramo(ph, PER_C - 0.18, PER_C)); };
  function colocarPunto(u, reloj) {
    const r = radio(u); let sx = 1, sy = 1, st = 0;
    let i = RUTA.length - 1; while (i > 0 && u < RUTA[i].u0) i--;
    const s = RUTA[i];
    if (u < s.u0) { tP.set(s.de.x, s.de.y + 2.5 * Math.sin(reloj * 2.4), s.de.z); }        // antes de caer: flota y respira
    else if (u < s.u1) {
      const c = tramo(u, s.u0, s.u1);
      if (s.caida) { tP.set(s.a.x, mezcla(s.de.y, s.a.y + r, E.ei(c)), s.a.z); st = 0.4 * c; tDir.set(0, -1, 0); }
      else {
        const K = s.h + Math.abs(s.a.y - s.de.y) * 0.5, cy = s.flota ? E.eio(c) : c;
        tP.set(mezcla(s.de.x, s.a.x, c), mezcla(s.de.y, s.a.y, cy) + K * 4 * c * (1 - c) * (s.flota ? 0.4 : 1) + (s.flota ? 0 : r), mezcla(s.de.z, s.a.z, c));
        tDir.set(s.a.x - s.de.x, s.a.y - s.de.y + K * 4 * (1 - 2 * c), s.a.z - s.de.z); st = 0.32 * Math.sin(Math.PI * c);
      }
    } else if (s.flota) {
      // flotando: respira, y a cada latido se encoge, se estira y suelta la onda
      tP.set(s.a.x + 6 * Math.sin(reloj * 0.7), s.a.y + 9 * Math.sin(reloj * 1.3), s.a.z + 5 * Math.cos(reloj * 0.6));
      const k = latido(reloj) * fCiclo(u); sx = 1 - k * 0.6; sy = 1 + k; tP.y += 30 * k;
    } else {
      // apoyado: se aplasta al llegar y se agacha antes del siguiente salto
      const c = tramo(u, s.u1, s.u1 + 0.008), n = RUTA[i + 1];
      let k = u - s.u1 < 0.008 ? Math.exp(-c * 3.5) * Math.cos(c * 9) * (1 - c) : 0;
      if (n) k += 0.42 * E.eo(tramo(u, n.u0 - 0.004, n.u0));
      sx = 1 + 0.42 * k; sy = 1 - 0.34 * k;
      tP.set(s.a.x, s.a.y + r * sy, s.a.z);
    }
    let brillo = 1 + 0.06 * Math.sin(reloj * 2.1);
    for (const l of LECTURAS) brillo += 0.7 * Math.sin(Math.PI * tramo(u, l[0], l[0] + 0.01));
    brillo += 0.7 * Math.max(0, latido(reloj)) * fCiclo(u);
    brillo *= mezcla(1, 0.42, macro(u)) * mezcla(1, 0.6, fGen(u));
    P.poner(tP.x, tP.y, tP.z, r, brillo);
    const esf = P.esfera;
    if (esf) {
      if (st > 0.001) { esf.quaternion.setFromUnitVectors(EJE_Y, tDir.normalize()); const k = 1 + st; esf.scale.set(r / Math.sqrt(k), r * k, r / Math.sqrt(k)); }
      else { esf.quaternion.identity(); esf.scale.set(r * sx, r * sy, r * sx); }
    }
    // su luz llega lejos según lo grande que es; sobre blanco, algo más suave
    if (P.luz) { P.luz.distance = mezcla(330, 460, tramo(u, 0.87, 0.9)) * mezcla(1, 0.08, macro(u)) * mezcla(1, 3.2, fGen(u)); if (CLARO) P.luz.intensity *= 0.7; }
  }

  // ── la cámara: llaves con su encuadre; el protagonista se desplaza con un descentrable (como un objetivo de arquitectura) ──
  //  [u, x, y, z, alto, ancho, lado, elevación, dónde está el texto]
  const LLAVES = [
    [0.000, 0, 90, 0, 200, 260, 0.46, 0.06, 'arriba'],                        // a ras de suelo: el punto cae
    [0.026, 0, 12, 0, 160, 260, 0.38, 0.14, 'arriba'],
    [0.075, 0, 0, 0, 470, 900, 0.22, 0.42, 'arriba'],                          // la cámara sube y descubre la trama
    [0.150, 0, 0, 0, 760, 1500, 0.1, 0.64, 'arriba'],
    [0.186, -90, 105, -300, 250, 200, -0.5, 0.4, 'izq'],                        // el muestrario, empezando por la J1
    [0.290, -30, 100, -10, 600, 320, -0.16, 0.56, 'izq'],                       // y recorriéndolo hasta la J10
    [0.335, -30, 100, -10, 580, 310, -0.06, 0.52, 'izq'],
    [0.372, 100, 110, 40, 430, 560, 0.24, 0.3, 'der'],
    [0.505, 100, 130, 40, 440, 600, 0.72, 0.36, 'der'],                           // la casa sube mientras la cámara la rodea
    [0.530, NUDO_A.x, Y_CUB + 0.5, 0, 15, 22, -0.3, 0.74, 'izq'],
    [0.575, NUDO_A.x, Y_CUB + 0.5, 0, 14, 20, -0.2, 0.64, 'izq'],
    [0.592, NUDO_B.x, NUDO_B.y, 0, 14, 20, -1.36, 0.22, 'izq'],
    [0.616, NUDO_B.x, NUDO_B.y, 0, 13, 18, -1.44, 0.18, 'izq'],
    [0.638, NUDO_C.x + 9, Z0 * 0.62, NUDO_C.z, 30, 50, -0.42, 0.06, 'izq'],     // la losa de suelo sobre su murete: el canto y el asiento
    [0.660, NUDO_C.x + 9, Z0 * 0.62, NUDO_C.z, 28, 47, -0.32, 0.05, 'izq'],
    [0.698, LOTE_C.x - 60, 150, LOTE_C.z + 20, 560, 1050, -0.32, 0.36, 'gen'],       // sube: la casa en su parcela, que se transforma
    [0.745, LOTE_C.x, 40, LOTE_C.z + 40, 1500, 2500, 0.0, 0.56, 'gen'],       // y se abre a las variantes, que llenan la pantalla
    [0.830, LOTE_C.x, 40, LOTE_C.z + 40, 1650, 2750, 0.36, 0.6, 'gen'],
    [0.872, 110, 115, 60, 380, 720, 0.44, 0.24, 'abajo'],
    [1.000, 110, 115, 60, 360, 690, 0.1, 0.2, 'abajo'],
  ];
  //  descentrado (x, y) y cuánto ocupa el protagonista (alto, ancho), en horizontal y en vertical
  const MODOS = {
    arriba: [[0, -0.13, 0.6, 0.85], [0, -0.1, 0.5, 1.7]],
    gen: [[0, -0.11, 0.76, 1.0], [0, -0.12, 0.62, 1.5]],
    izq: [[0.22, 0, 0.78, 0.44], [0, 0.17, 0.46, 0.9]],
    der: [[-0.22, 0, 0.78, 0.44], [0, 0.17, 0.46, 0.9]],
    abajo: [[0, 0.14, 0.58, 0.8], [0, 0.14, 0.48, 0.9]],
  };
  let W = 1, H = 1;
  const modo = (k) => MODOS[k[8]][W < H ? 1 : 0];
  const dLlave = (k) => { const m = modo(k); return distancia(camara, k[4] / m[2], k[5] / m[3]); };
  const mira = V();
  function encuadrar(u, reloj) {
    let i = 0; while (i < LLAVES.length - 2 && u > LLAVES[i + 1][0]) i++;
    const a = LLAVES[i], b = LLAVES[i + 1], s = E.seno(tramo(u, a[0], b[0]));
    const da = dLlave(a), db = dLlave(b), d = Math.exp(mezcla(Math.log(da), Math.log(db), s));
    // al acercarse, la mirada llega antes al nudo; al alejarse, se queda en él un poco más
    const f = Math.abs(db - da) > 0.3 * Math.min(da, db) ? (d - da) / (db - da) : s;
    mira.set(mezcla(a[1], b[1], f), mezcla(a[2], b[2], f), mezcla(a[3], b[3], f));
    const ma = modo(a), mb = modo(b);
    // en el motor, la cámara deriva despacio también con el reloj: la ciudad está viva
    const fg = fGen(u);
    const lado = mezcla(a[6], b[6], s) + 0.014 * Math.sin(reloj * 0.21) + 0.007 * Math.sin(reloj * 0.13) + 0.05 * fg * Math.sin(reloj * 0.11);
    const el = mezcla(a[7], b[7], s) + 0.006 * Math.sin(reloj * 0.17);
    camara.setViewOffset(W, H, -mezcla(ma[0], mb[0], s) * W, mezcla(ma[1], mb[1], s) * H, W, H);
    mirar(camara, mira.x, mira.y, mira.z, d, lado, el);
    const mc = macro(u);
    plato.enfocar(mira.x, mira.y + 0.3 * d * mc, mira.z, d);                 // en macro, el charco de luz sube al nudo
    // en la testa (soldada) y en el murete (apoyada) el foco se pone de lado: un charco redondo en el nudo; en la apoyada, casi a ras
    const lat = E.seno(tramo(u, 0.577, 0.592)) * (1 - E.seno(tramo(u, 0.66, 0.676))), ras = E.seno(tramo(u, 0.62, 0.636));
    if (lat > 0) { plato.clave.position.lerp(tA.set(mira.x - 0.95 * d, mira.y + mezcla(0.45, 0.1, ras) * d, mira.z + 0.35 * d), lat); plato.clave.target.position.lerp(tB.set(mira.x, mira.y + mezcla(0.12, -0.03, ras) * d, mira.z), lat); }
    // las sombras a la escala del plano: del macro de un tornillo a la ciudad entera
    const sc = plato.clave.shadow; sc.camera.near = Math.max(0.5, d * 0.4); sc.camera.far = d * 6; sc.camera.updateProjectionMatrix();
    sc.normalBias = Math.min(0.8, Math.max(0.01, d * 0.0006));
    // en macro, el foco se cierra y la sala baja: cada nudo en su charco de luz; en la ciudad, el foco se abre
    plato.clave.angle = mezcla(mezcla(mezcla(BASE.ang, 0.24, mc), 0.16, lat), 0.62, fg);
    plato.clave.intensity = BASE.foco * mezcla(1, CLARO ? 1.25 : 1, mc) * mezcla(1, mezcla(0.8, 0.6, ras), lat);
    plato.contra.intensity = BASE.contra * (1 - mc * (CLARO ? 0.6 : 1));
    if (cielo) cielo.intensity = BASE_CIELO * mezcla(1, CLARO ? 0.4 : 0.12, mc) * mezcla(1, 0.55, fg);
    escena.environmentIntensity = mezcla(mezcla(CLARO ? 0.82 : 1, CLARO ? mezcla(0.42, 0.62, lat) : 0.06, mc), 0.55, fg);
    fondoC.lerpColors(FONDO, FONDO_MACRO, mc); fondo = fondoC.getHex();
    return d;
  }

  // las bandas de apoyo, con su muro (dy: lo que se alza lo de arriba en la apoyada)
  function bandaVisible(p, v, dy) {
    for (let i = 0; i < BANDAS.length; i++) {
      const B = BANDAS[i]; if (B[0] !== p.i) continue;
      mano.position.set(B[1], B[2] + dy, B[3]); mano.rotation.set(0, 0, 0); mano.scale.set(v ? B[4] : 0, v ? 1 : 0, v ? B[5] : 0); mano.updateMatrix(); bandas.setMatrixAt(i, mano.matrix);
    }
  }
  // ── el motor: el estado de un cuerpo, de la forma a a la b con un muelle (si uno falta, crece o se recoge) ──
  const nuevoEstado = () => ({ x0: 0, z0: 0, L: 0, D: 0, H: 0, y0: 0, s: 0, pl: 1, v: 1 });
  const eA = nuevoEstado(), eB = nuevoEstado();
  function interpola(out, a, b, q) {
    if (!a && !b) { out.s = 0; return out; }
    const A = a || b, B = b || a, m = a && b ? E.vivo(q) : 1;
    out.x0 = mezcla(A.x0, B.x0, m); out.z0 = mezcla(A.z0, B.z0, m); out.L = mezcla(A.L, B.L, m); out.D = mezcla(A.D, B.D, m); out.H = mezcla(A.H, B.H, m); out.y0 = mezcla(A.y0, B.y0, m);
    out.s = !a ? E.vivo(q) : !b ? 1 - E.eio(q) : 1; out.pl = (q < 0.5 ? A : B).pl; out.v = (q < 0.5 ? A : B).v;
    return out;
  }
  // mezcla (por el scroll) entre la envolvente de la casa y el ciclo del motor
  function mezclaEstado(out, e, c, w) {
    if (!e) { out.x0 = c.x0; out.z0 = c.z0; out.L = c.L; out.D = c.D; out.H = c.H; out.y0 = c.y0; out.s = c.s * w; out.pl = c.pl; out.v = c.v; return out; }
    out.x0 = mezcla(e.x0, c.x0, w); out.z0 = mezcla(e.z0, c.z0, w); out.L = mezcla(e.L, c.L, w); out.D = mezcla(e.D, c.D, w); out.H = mezcla(e.H, c.H, w); out.y0 = mezcla(e.y0, c.y0, w);
    out.s = mezcla(1, c.s, w); out.pl = w < 0.5 ? e.pl : c.pl; out.v = w < 0.5 ? e.v : c.v; return out;
  }
  let nCu = 0, nVe = 0;
  function dibujarCuerpo(e, ox, oz, k) {
    const sy = e.s * k; if (sy <= 0.002 || e.L <= 0) return;
    const ex = 1 / Math.sqrt(Math.max(0.6, Math.min(1.3, sy))), kp = mezcla(0.55, 1, Math.min(1, k * 1.6));   // al estirarse adelgaza; al recogerse, encoge en planta
    const x0 = ox + e.x0, z0 = oz + e.z0, L = e.L * mezcla(1, ex, 0.5) * kp, D = e.D * mezcla(1, ex, 0.5) * kp, Hh = e.H * sy;
    mano.position.set(x0 + e.L / 2, e.y0, z0 + e.D / 2); mano.rotation.set(0, 0, 0); mano.scale.set(L, Hh, D); mano.updateMatrix(); cuerpos.setMatrixAt(nCu++, mano.matrix);
    // los huecos de la fachada, uno por planta, que asoman cuando el cuerpo ya ha crecido
    const kv = E.vivo(tramo(sy, 0.55, 1.0));
    if (kv <= 0.01) return;
    for (let pl = 0; pl < e.pl && nVe < NVE; pl++) {
      const ww = Math.min(e.L - 36, MOD * (1 + 0.5 * e.v)), hh = 80 * kv;
      mano.position.set(x0 + e.L / 2 + (e.v - 1) * 18, e.y0 + (pl * PLANTA + 26 + 40) * Hh / (e.pl * PLANTA), z0 + e.D / 2 + D / 2 + 0.6); mano.scale.set(Math.max(1, ww * kv * kp), hh * kp, 2); mano.updateMatrix(); ventanas.setMatrixAt(nVe++, mano.matrix);
    }
  }
  const eC = [nuevoEstado(), nuevoEstado(), nuevoEstado()], eF = nuevoEstado();

  // ── cada fotograma ──────────────────────────────────────────────────
  function actualizar(u, reloj) {
    dCam = encuadrar(u, reloj);
    const fg = fGen(u), fc = fCiclo(u), oculta = casaOculta(u), dyArr = alza(u);

    // 1. la trama: la onda del golpe la enciende; después, ondas pequeñas en cada huella y al cerrar la casa
    const ub = tramo(u, T.onda[0], T.onda[1]), R = 1600 * E.eo(ub);
    tramaU.uRev.value.set(0, 0, u < T.onda[0] ? 0 : R + 120);
    onda(0, 0, 0, R, u < T.onda[0] ? 0 : (1 - 0.55 * ub) * (1 - tramo(u, 0.13, 0.17)));
    const uf = tramo(u, 0.872, 0.96);
    if (uf > 0) onda(0, 0, 0, 170 + 1300 * E.eo(uf), 0.55 * (1 - uf));
    for (let i = 1; i < 4; i++) onda(i, 0, 0, 0, 0);
    for (const p of MUESTRA) { const q = tramo(u, p.h, p.h + 0.024); if (q > 0 && q < 1) onda(1 + (p.k % 3), p.cx, p.cz, 25 + 220 * E.eo(q), 0.7 * (1 - q)); }
    for (let n = 0; n < 2; n++) { const p = CASA[n], q = tramo(u, p.land, p.land + 0.026); if (q > 0 && q < 1) onda(1 + n, p.f.x, p.f.z, 120 + 380 * E.eo(q), 0.6 * (1 - q)); }
    // los latidos del motor lanzan ondas grandes que recorren las parcelas, con el reloj
    if (fc > 0.01) {
      const ph = modp(reloj, PER_C), ph2 = modp(reloj - 0.9, PER_L);
      onda(1, LOTE_C.x, LOTE_C.z, 150 + 3200 * E.eo(ph / PER_C), 0.75 * (1 - ph / PER_C) * fc);
      onda(2, LOTE_C.x, LOTE_C.z, 150 + 3600 * E.eo(ph2 / PER_L), 0.4 * (1 - ph2 / PER_L) * fc);
    }
    // huellas: la del muestrario se enciende cuando el punto cae en ella; las de las losas, al bajar y al leerlas
    for (const p of MUESTRA) {
      const a = tramo(u, p.h, p.h + 0.012), fl = u >= p.h ? 1 - tramo(u, p.h, p.h + 0.024) : 0, k = (0.55 * E.eo(a) + 0.9 * fl) * (1 - tramo(u, 0.33, 0.36));
      huella(p.k, p.cx - p.l / 2, p.cz - p.a / 2, p.cx + p.l / 2, p.cz + p.a / 2, fl > 0.5 ? MEN : ION, k);
    }
    if (u > 0.36) {
      huella(0, -120, -120, 300, 120, MEN, 0.7 * E.eo(tramo(u, 0.86, 0.9)));
      for (let i = 1; i < 6; i++) huella(i, 0, 0, 0, 0, ION, 0);
    }
    for (let n = 0; n < 2; n++) {
      const p = CASA[n], pre = tramo(u, p.land - 0.022, p.land - 0.006) * (u < p.leer ? 1 : 0), fl = u >= p.leer ? 1 - tramo(u, p.leer, p.leer + 0.024) : 0;
      huella(6 + n, -120, p.f.z - 60, 120, p.f.z + 60, u < p.leer ? ION : MEN, 0.6 * pre + fl * 0.9 + (u >= p.leer ? 0.16 * (1 - tramo(u, 0.66, 0.7)) : 0));
    }
    tramaU.uLoteT.value.w = fg; tramaU.uLoteR.value.z = 200 + 5200 * E.eo(tramo(u, T.lote[0] - 0.01, T.lote[0] + 0.05));
    tramaU.uLejos.value = mezcla(1500, 2600, fg);

    // 2. el muestrario: baja, se mece colgado y se va hacia arriba (con un amago antes)
    for (const p of MUESTRA) {
      const g = p.grupo, d0 = p.h - 0.004, d1 = p.h + 0.032, s0 = T.vaSe(p.k);
      if (u < d0 || u > s0 + 0.026) { g.visible = false; ocultar(p); continue; }
      const q = tramo(u, d0, d1), mece = E.seno(q);
      let y = Y_COL + 900 * (1 - E.eo5(tramo(q, 0, 0.72))) - 7 * Math.max(0, amort(tramo(q, 0.62, 1) * 3, 3.2, 1.6));
      y += -5 * Math.sin(Math.PI * tramo(u, s0, s0 + 0.005)) + 1150 * E.ei(tramo(u, s0 + 0.004, s0 + 0.026));
      // cuando llega la siguiente, las de atrás aún se balancean un poco (el viento de la grúa)
      let empuje = 0; for (const o of MUESTRA) if (o.k > p.k) empuje += 3 * amort(tramo(u, o.h + 0.01, o.h + 0.05) * 3, 5, 1.4) / (o.k - p.k);
      const bx = 2.2 * Math.sin(reloj * 0.55 + p.k * 1.7) * mece + empuje;
      g.position.set(p.cx + bx, y, p.cz + 1.4 * Math.sin(reloj * 0.43 + p.k * 2.3) * mece);
      g.rotation.set(0.006 * Math.sin(reloj * 0.7 + p.k) * mece, (p.k % 2 ? 0.55 : -0.5) * (1 - E.suave(q)) + 0.028 * Math.sin(reloj * 0.37 + p.k) * mece, 0.008 * Math.sin(reloj * 0.6 + p.k * 0.7) * mece - empuje * 0.004);
      g.scale.setScalar(1); g.visible = true; g.updateMatrixWorld(true);
      const vib = 2.6 * amort(tramo(u, p.h + 0.01, p.h + 0.04) * 4, 9, 2.2) + 2 * amort(tramo(u, s0 + 0.004, s0 + 0.02) * 3, 10, 2);
      aparejo(p, g.localToWorld(tH.set(0, p.gancho, 0)), 0, 0, vib);
      p.et.material.color.copy(cTinta);
    }

    // 3. la casa, pieza a pieza (en el motor se esconde: la sustituye su envolvente, que es la misma)
    casaMalla.visible = casaVidrio.visible = casaMarcas.visible = !oculta && u > CASA[0].land - 0.024;
    for (const p of CASA) {
      const g = p.hueso, L = p.land, d0 = L - 0.022, fin = L + 0.026;
      uLee.value[p.i] = 0;
      if (u < d0 || oculta) { g.position.set(0, -500, 0); g.scale.setScalar(1e-5); g.updateMatrixWorld(true); ocultar(p); bandaVisible(p, false, 0); continue; }
      // cada grúa trae su pieza desde su lado, con su vaivén
      const q = tramo(u, d0, L), ph = E.eio(tramo(q, 0, 0.85)), pv = E.eo(q), vaiven = p.gr.vai * Math.sin(q * Math.PI * p.gr.fr) * (1 - q) * (1 - q);
      g.position.set(p.f.x + p.sl.x * (1 - ph) + p.pe.x * vaiven, p.f.y + 700 * (1 - pv), p.f.z + p.sl.z * (1 - ph) + p.pe.z * vaiven);
      if (p.arriba) g.position.y += dyArr;
      g.rotation.set(0, p.giro + p.y0 * (1 - E.suave(q)), p.incl);
      // al posarse, un aplastamiento mínimo: el peso
      const c = tramo(u, L, L + 0.008), k = u >= L ? Math.sin(c * Math.PI * 2.4) * Math.exp(-c * 3.2) * (1 - c) : 0;
      g.scale.set(1 + 0.02 * k, 1 - 0.045 * k, 1 + 0.02 * k); g.updateMatrixWorld(true);
      bandaVisible(p, u >= L, p.arriba ? dyArr : 0);
      // la lectura: un destello menta en la pieza y en su marca
      uLee.value[p.i] = Math.sin(Math.PI * tramo(u, p.leer, p.leer + 0.012));
      if (u > fin) { ocultar(p); continue; }
      if (u < L) aparejo(p, g.localToWorld(tH.set(0, p.gancho, 0)), 0, 0, 0, -vaiven * 0.5);
      else {
        // la eslinga se afloja, se suelta y el gancho sube balanceándose
        const a = tramo(u, L, L + 0.003), b = tramo(u, L + 0.003, L + 0.009), sube = tramo(u, L + 0.006, fin);
        tH.copy(p.gF); if (p.arriba) tH.y += dyArr; tH.y += -7 * E.eo(a) + 900 * E.ei(sube); tH.x += 4 * amort(b * 2, 6, 1.5);
        aparejo(p, tH, E.eio(b), 6 * E.eo(a) * (1 - b), 1.5 * amort(sube * 3, 12, 2), 3 * amort(b * 2, 6, 1.5));
      }
    }
    // la barandilla de la terraza: llega con el ventanal de arriba
    const qb = tramo(u, CASA[I_VENTANAL].land, CASA[I_VENTANAL].land + 0.012);
    baranda.visible = qb > 0 && !oculta; baranda.position.set(0, P1 + GR + dyArr, 0); baranda.scale.set(1, Math.max(0.001, E.vivo(qb)), 1);
    // los muretes: se hacen antes de la primera losa (son de obra) y se van con la casa al motor
    const km = E.eo(tramo(u, 0.35, 0.364)) * (oculta ? 0 : 1), kb = u >= CASA[0].land && !oculta;   // la banda, solo cuando ya hay una losa encima
    for (let k = 0; k < MURETES.length; k++) {
      const [mx, mw] = MURETES[k], h = Math.max(0.001, (Z0 - 0.9) * km);
      // sin murete, nada: una caja aplastada en un solo eje se ve de canto como una raya negra
      if (km > 0.001) mano.scale.set(mw, h, 2 * Z_MUR); else mano.scale.setScalar(0);
      mano.position.set(mx, h / 2, 0); mano.rotation.set(0, 0, 0); mano.updateMatrix(); muretes.setMatrixAt(k, mano.matrix);
      if (km > 0.99 && kb) mano.scale.set(mw - 2, 0.9, 2 * Z_MUR - 2); else mano.scale.setScalar(0);
      mano.position.set(mx, h + 0.45, 0); mano.updateMatrix(); muretes.setMatrixAt(MURETES.length + k, mano.matrix);
    }
    muretes.instanceMatrix.needsUpdate = true;
    bandas.instanceMatrix.needsUpdate = true;
    jp.needsUpdate = true; ganchos.instanceMatrix.needsUpdate = true; bolas.instanceMatrix.needsUpdate = true;

    // 4. las uniones
    //  atornillada: la chapa se posa y los tornillos bajan, entran girando y asientan
    const qc = tramo(u, T.chapa, T.chapa + 0.012);
    chapa.visible = u >= T.chapa && !oculta;
    chapa.position.set(NUDO_A.x, NUDO_A.y + dyArr + 10 * (1 - E.eo(qc)) - 0.08 * amort(tramo(u, T.chapa + 0.012, T.chapa + 0.018) * 3, 6, 2), NUDO_A.z); chapa.rotation.set(0, 0.5 * (1 - E.suave(qc)), 0);
    const yA = NUDO_A.y + 0.6 + dyArr;
    for (let k = 0; k < 4; k++) {
      const b0 = k < NT ? T.perno(k) : 2, b1 = b0 + 0.018, q = tramo(u, b0, b1), cae = tramo(q, 0, 0.3), rosca = tramo(q, 0.3, 1), asienta = tramo(u, b1, b1 + 0.006);
      const y = u < b0 ? -1e4 : yA + 2.5 * (1 - E.eio(rosca)) + 9 * (1 - E.eo(cae)) - 0.05 * Math.sin(Math.PI * asienta);
      mano.position.set(NUDO_A.x + TAL[k][0], y, NUDO_A.z + TAL[k][1]);
      mano.rotation.set(0, k * 0.7 - Math.PI * 2 * 4 * E.eio(rosca) - 0.06 * Math.sin(Math.PI * asienta), 0);
      mano.scale.setScalar(u < b0 || oculta ? 0 : 1); mano.updateMatrix(); cabezas.setMatrixAt(k, mano.matrix); vastagos.setMatrixAt(k, mano.matrix);
    }
    cabezas.instanceMatrix.needsUpdate = vastagos.instanceMatrix.needsUpdate = true;
    //  soldada: la pletina se arrima y el arco sube por sus dos bordes, cada uno sobre su chapa embebida
    const qp = tramo(u, T.pletina, T.pletina + 0.007);
    pletina.visible = u >= T.pletina && !oculta; pletina.position.set(NUDO_B.x - 0.02 - 7 * (1 - E.eo(qp)), NUDO_B.y + dyArr, 0); pletina.rotation.set(0.35 * (1 - E.suave(qp)), 0, 0);
    let enArco = false;
    for (let j = 0; j < 2; j++) {
      const w0 = T.cordon(j), w1 = w0 + 0.009, pr = tramo(u, w0, w1), m = cordones[j], y0 = NUDO_B.y - 2.1 + dyArr;
      m.visible = u >= w0 && !oculta; m.position.set(NUDO_B.x - 0.3, y0, (j ? 1 : -1) * 3.3); m.scale.set(1, 4.2 * Math.max(0.002, pr), 1);
      m.material.emissiveIntensity = 2.4 * (pr < 1 ? 1 : 1 - E.eo(tramo(u, w1, w1 + 0.025)));
      if (u > w0 && u < w1) { enArco = true; arco.position.set(NUDO_B.x - 0.7, y0 + 4.2 * pr, (j ? 1 : -1) * 3.3); }
    }
    const parpa = 0.65 + 0.35 * Math.sin(reloj * 93) * Math.sin(reloj * 57 + 1);
    arco.visible = chispas.visible = enArco; arco.scale.setScalar(2.4 + 1.4 * parpa); arco.material.opacity = 0.95;
    luzArco.intensity = enArco ? 4 * parpa : 0; luzArco.position.copy(arco.position); luzArco.position.x -= 1.5;
    if (enArco) {
      const cp = chispas.geometry.attributes.position;
      for (let i = 0; i < NCH; i++) {
        const ch = CH[i], vx = ch[0], vy = ch[1], vz = ch[2], t = ((reloj * 1.7 + ch[3]) % 1) * 0.5;
        cp.setXYZ(i, arco.position.x + vx * t, arco.position.y + vy * t - 40 * t * t, arco.position.z + vz * t);
      }
      cp.needsUpdate = true;
    }

    // 5. el motor generativo: la casa se transforma sin parar (con el reloj) y alrededor cambian las variantes en olas
    nCu = 0; nVe = 0;
    const vis = u > T.gen[0] && u < T.gen[3] + 0.01;
    cuerpos.visible = ventanas.visible = vis;
    if (vis) {
      // la casa: en su envolvente al entrar y al salir; en medio, una configuración nueva cada PER_C segundos,
      // cada cuerpo con su retraso (como un organismo, no como un interruptor)
      const kc = Math.floor(reloj / PER_C);
      if (oculta) for (let s = 0; s < 3; s++) {
        const t = reloj - kc * PER_C - s * 0.17, kk = t < 0 ? kc - 1 : kc, q = tramo(t < 0 ? t + PER_C : t, 0, 0.95);
        interpola(eA, RUEDA_C[modp(kk - 1, 12)][s], RUEDA_C[modp(kk, 12)][s], q);
        dibujarCuerpo(mezclaEstado(eB, ENVOLVENTE[s], eA, fc), LOTE0.x, LOTE0.z, 1);
      }
      // la ciudad: cada lote nace en ola con el scroll, cambia de variante con el reloj (en olas desde la casa) y se recoge
      for (const lo of LOTES) {
        const t0 = T.lote[0] + 0.03 * lo.dn, tr = T.lote[1] + 0.02 * (1 - lo.dn);
        const k = E.vivo(tramo(u, t0, t0 + 0.028)) * (1 - E.eio(tramo(u, tr, tr + 0.016)));
        if (k <= 0.002) continue;
        const tl = reloj - lo.dn * 1.3 - lo.fase, kl = Math.floor(tl / PER_L), ql = tl - kl * PER_L;
        for (let s = 0; s < 3; s++) {
          const qs = tramo(ql - s * 0.14, 0, 0.9);
          interpola(eF, lo.R[modp(kl - 1, RUEDA)][s], lo.R[modp(kl, RUEDA)][s], qs);
          dibujarCuerpo(eF, lo.ox, lo.oz, k);
        }
      }
    }
    cuerpos.count = nCu; ventanas.count = nVe;
    cuerpos.instanceMatrix.needsUpdate = ventanas.instanceMatrix.needsUpdate = true;

    // 6. el punto, y su lectura
    colocarPunto(u, reloj);
    aro.visible = false;
    for (const l of LECTURAS) {
      const q = tramo(u, l[0], l[0] + 0.018);
      if (q > 0 && q < 1) { aro.visible = true; aro.position.set(l[1], l[2] + (l[5] ? 0 : 0.3) + (l[0] > 0.6 && l[0] < 0.66 ? dyArr : 0), l[3]); aro.rotation.set(l[5] ? 0 : Math.PI / 2, l[5] === 1 ? Math.PI / 2 : 0, 0); aro.scale.setScalar(l[4] * (0.15 + 0.85 * E.eo(q))); aro.material.opacity = 0.9 * (1 - q); }
    }
  }

  return {
    escena, camara,
    get fondo() { return fondo; },
    medir(w, h) { W = w; H = h; },
    actualizar,
  };
});

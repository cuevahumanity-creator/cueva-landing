// Capítulo «os»: CUEVA OS, cuatro interfaces sobre una sola verdad. Plató blanco, como una foto de producto.
// ─────────────────────────────────────────────────────────────────────
//  1. La verdad. Sobre un plato giratorio, en una sala blanca sin horizonte, una casa de maqueta se monta
//     pieza a pieza: la losa, los muros, los hastiales y los dos faldones caen, tocan y asientan. Se lee por
//     sus sombras. El punto ámbar baja, bota en el aire y se queda flotando sobre la cumbrera: es el dato.
//  2. Las cuatro interfaces. Del punto salen cuatro hilos de datos, uno tras otro; al llegar cada uno se
//     despliega un aparato (trasera de aluminio, canto pulido, pantalla de vidrio negro) y se enciende.
//  3. Una interfaz cada vez. Las pantallas corren por el anillo como cuentas en un carril, con muelle:
//     la de turno sale al frente, del lado que deja sitio al texto (en vertical, por encima de la casa),
//     y las otras tres esperan detrás. Entre una y otra la cámara sube y se abre, y baja en curva sobre la
//     siguiente; dentro de cada una, sigue empujando hacia la pantalla. La pantalla despierta con un barrido
//     de luz, su interfaz entra por partes y su hilo lleva pulsos. Dashboard (los siete estados de la pieza),
//     Auditor (hitos verificados y anotaciones selladas), Marketplace (solo definida: una lámina esmerilada
//     con la interfaz en plano, a trazos, sin sombra y sin pulsos) y Comunidad (los seis roles en la Plaza).
//  4. Debajo de todo. Las interfaces suben y salen de plano: en el suelo, alrededor de la casa, aparecen más
//     neuronas. Se buscan con balizas (aros que se abren por el suelo), se unen con hilos en un hexágono,
//     eligen principal (baja una corona sobre ella) y reparten la memoria: cada trozo cifrado, un cubito,
//     baja del punto a dos neuronas. La principal se apaga: sus hilos caen, sus trozos se pierden y la
//     corona vuela a otra; los trozos perdidos se copian desde su otra copia. Al volver, recupera la corona.
//  5. Sin red. Se va internet: el plató se apaga a gris, las pantallas parpadean y se apagan de una en una,
//     se vencen, y los hilos se sueltan y caen al suelo. La neurona sigue latiendo y anotando: encima se le
//     apilan las lecturas pendientes. Vuelve la red: las lecturas suben al punto como estelas, sale de la casa
//     una onda por el suelo y, al pasar, los hilos saltan a su sitio, las pantallas se encienden y vuelve el blanco.
//     La red local sigue viva: los hilos del enjambre no caen. Es un escenario de ejemplo: ni horas ni cifras. Todo es función de u; el reloj solo hace respirar
//  (los pulsos, el latido, el vaivén de las pantallas y el plato, que gira despacio).
// ─────────────────────────────────────────────────────────────────────
CUEVA.capitulo('os', (ctx) => {
  const { T3, E, mezcla, tramo, COL, esmalte, estudio, punto, cuerda, mirar, distancia, DATOS } = ctx;
  const escena = new T3.Scene(), camara = new T3.PerspectiveCamera(30, 1, 1, 10000);
  const plato = estudio(escena, { tema: ctx.tema });                  // el plató blanco: sala clara, suelo que solo recibe sombras
  const cielo = escena.children.find((o) => o.isHemisphereLight), CLAVE0 = plato.clave.intensity, CIELO0 = cielo ? cielo.intensity * 0.75 : 0;
  const ENV0 = 0.33;                                                   // la sala blanca, a media voz: modela el foco y la casa se lee
  if (plato.suelo) plato.suelo.material.opacity = 0.24;                 // sombras nítidas: el blanco sobre blanco se lee por ellas
  const TAU = Math.PI * 2;
  let W = 1, H = 1;

  // ── utilidades de forma ──
  // normales suaves en los cantos redondeados y vivas en las esquinas (como en la apertura)
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
  // rectángulo de esquinas redondas, centrado en (cx, cy)
  function redondo(p, w, h, r, cx = 0, cy = 0) {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0); p.lineTo(x1, y1 - r); p.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2);
    p.lineTo(x0 + r, y1); p.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI); p.lineTo(x0, y0 + r); p.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5);
    return p;
  }
  const forma = (w, h, r, cx, cy) => redondo(new T3.Shape(), w, h, r, cx, cy);
  const hueco = (w, h, r, cx, cy) => redondo(new T3.Path(), w, h, r, cx, cy);
  const oculo = (cx, cy, r) => new T3.Path().absarc(cx, cy, r, 0, TAU, true);
  // una pieza de esmalte: la forma extruida con canto redondo, centrada en su grueso
  function pieza(sh, fondo, b = 1.5) {
    const g = new T3.ExtrudeGeometry(sh, { depth: fondo - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 4, curveSegments: 8 });
    g.translate(0, 0, -(fondo - 2 * b) / 2); return normalesSuaves(g);
  }
  function perfil(R, h, r) {                                            // disco de canto redondo, para el torno
    const p = [new T3.Vector2(0, 0)];
    for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI / 2; p.push(new T3.Vector2(R - r + Math.cos(a) * r, r + Math.sin(a) * r)); }
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; p.push(new T3.Vector2(R - r + Math.cos(a) * r, h - r + Math.sin(a) * r)); }
    p.push(new T3.Vector2(0, h)); return new T3.LatheGeometry(p, 128);
  }
  const lienzo = (w, h, pinta) => { const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; };
  const radial = (stops) => lienzo(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); for (const [o, c] of stops) g.addColorStop(o, c); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const motaTx = radial([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
  const sombraTx = radial([[0, 'rgba(27,41,81,.55)'], [0.55, 'rgba(27,41,81,.22)'], [1, 'rgba(27,41,81,0)']]);
  const ledTx = radial([[0, 'rgba(160,255,230,.95)'], [0.2, 'rgba(0,212,170,.4)'], [1, 'rgba(0,212,170,0)']]);

  // ── el plato giratorio ──
  const BLANCO = esmalte(0xeef0f4, { envMapIntensity: 0.42, roughness: 0.34, clearcoat: 0.7 });            // blanco de maqueta, un pelo por debajo del fondo para que se lea
  const base = new T3.Mesh(perfil(156, 6, 2.5), esmalte(0xaeb6c2, { roughness: 0.4, envMapIntensity: 0.5 })); base.receiveShadow = true; escena.add(base);
  const casa = new T3.Group(); escena.add(casa);                       // gira con el plato
  const giro = new T3.Mesh(perfil(142, 9, 3), esmalte(0xd6dbe3, { roughness: 0.32, envMapIntensity: 0.45 })); giro.position.y = 6; giro.receiveShadow = true; casa.add(giro);
  const marcas = new T3.InstancedMesh(new T3.BoxGeometry(1.3, 0.5, 6), new T3.MeshBasicMaterial({ color: COL.ion, transparent: true, opacity: 0.5 }), 36);
  { const m = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(), s = new T3.Vector3(1, 1, 1), p = new T3.Vector3();
    for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, l = i % 9 === 0 ? 1.8 : 1; e.set(0, a, 0); q.setFromEuler(e); p.set(Math.sin(a) * (134 - 3 * l), 15.2, Math.cos(a) * (134 - 3 * l)); s.set(1, 1, l); marcas.setMatrixAt(i, m.compose(p, q, s)); } }
  casa.add(marcas);
  // la sombra de contacto: lo que asienta el plato en el blanco
  const contacto = new T3.Mesh(new T3.PlaneGeometry(440, 440), new T3.MeshBasicMaterial({ map: sombraTx, transparent: true, depthWrite: false, opacity: 0.5 }));
  contacto.rotation.x = -Math.PI / 2; contacto.position.y = 0.3; contacto.renderOrder = -1; escena.add(contacto);

  // ── la casa: losa, cuatro muros y dos faldones, con juntas entre piezas ──
  const Y0 = 15, YM = Y0 + 8, ALTO = 64, CUMBRE = 38, AL = Math.atan2(CUMBRE, 75), YC = YM + ALTO + CUMBRE;
  const hastial = (huecos) => { const s = new T3.Shape(); s.moveTo(-75, 0); s.lineTo(75, 0); s.lineTo(75, ALTO); s.lineTo(0, ALTO + CUMBRE); s.lineTo(-75, ALTO); s.holes.push(...huecos); return pieza(s, 7); };
  const geoLosa = pieza(forma(158, 118, 7), 8); geoLosa.rotateX(-Math.PI / 2);
  const geoDelante = hastial([hueco(22, 40, 3, -42, 23), hueco(42, 24, 3, 26, 36), oculo(0, 80, 8)]);
  const geoDetras = hastial([hueco(56, 24, 3, 0, 36), oculo(0, 80, 8)]);
  const geoLado = (() => { const s = forma(98, ALTO, 2, 0, ALTO / 2); s.holes.push(hueco(24, 26, 3, -25, 36), hueco(24, 26, 3, 25, 36)); const g = pieza(s, 7); g.rotateY(Math.PI / 2); return g; })();
  const geoFaldon = pieza(forma(96, 7, 2.5), 134);
  const PIEZAS = [];
  const montar = (geo, p, r, t0, tilt) => { const m = new T3.Mesh(geo, BLANCO); m.castShadow = m.receiveShadow = true; m.visible = false; casa.add(m); PIEZAS.push({ m, p, r, t0, tilt }); };
  montar(geoLosa, [0, Y0 + 4, 0], [0, 0, 0], 0.003, [0.05, 0.3, -0.04]);
  montar(geoDetras, [0, YM, -52.5], [0, 0, 0], 0.012, [-0.22, 0.1, 0.06]);
  montar(geoLado, [-71.5, YM, 0], [0, 0, 0], 0.02, [0.08, -0.2, 0.2]);
  montar(geoLado, [71.5, YM, 0], [0, 0, 0], 0.027, [-0.06, 0.18, -0.2]);
  montar(geoDelante, [0, YM, 52.5], [0, 0, 0], 0.035, [0.2, -0.12, -0.05]);
  for (const sg of [-1, 1]) { const s = 1.2 + 48; montar(geoFaldon, [sg * (Math.cos(AL) * s + Math.sin(AL) * 3.5), YC - Math.sin(AL) * s + Math.cos(AL) * 3.5, 0], [0, 0, -sg * AL], sg < 0 ? 0.044 : 0.051, [0.1 * sg, 0.25, -0.3 * sg]); }
  // cada pieza cae (aceleración de verdad), toca, da un saltito y su giro asienta con muelle
  function asentar(P, u) {
    const k = tramo(u, P.t0, P.t0 + 0.026), c = tramo(k, 0, 0.6), s = tramo(k, 0.6, 1), g = 1 - E.vivo(k);
    P.m.visible = k > 0; if (!P.m.visible) return;
    P.m.position.set(P.p[0], P.p[1] + 140 * (1 - c * c) + 5 * Math.sin(Math.PI * s) * (1 - s), P.p[2]);
    P.m.rotation.set(P.r[0] + P.tilt[0] * g, P.r[1] + P.tilt[1] * g, P.r[2] + P.tilt[2] * g);
  }

  // ── el punto ámbar: la verdad, sobre la cumbrera ──
  const pa = punto(escena, { alcance: 290 }); pa.halo.renderOrder = 60;
  const YPUNTO = YC + 37;

  // ── la neurona: una cajita junto a la casa, con su luz ──
  const AZN = 0.56, RN = 228;
  const neurona = new T3.Group(); neurona.position.set(Math.sin(AZN) * RN, 0, Math.cos(AZN) * RN); neurona.rotation.y = AZN; neurona.scale.setScalar(1.3); escena.add(neurona);
  const cuerpoN = new T3.Mesh(pieza(forma(46, 26, 8), 30, 2.2), BLANCO); cuerpoN.position.y = 13; cuerpoN.castShadow = cuerpoN.receiveShadow = true; neurona.add(cuerpoN);
  const caraN = new T3.Mesh(new T3.PlaneGeometry(30, 11), new T3.MeshPhysicalMaterial({ color: 0x0a0e15, roughness: 0.18, clearcoat: 1, envMapIntensity: 0.8 })); caraN.position.set(-3, 13, 15.05); neurona.add(caraN);
  const ledMat = new T3.MeshBasicMaterial({ color: COL.menta, toneMapped: false });
  const led = new T3.Mesh(new T3.SphereGeometry(2.1, 16, 12), ledMat); led.position.set(16, 13, 15.4); neurona.add(led);
  const ledHalo = new T3.Sprite(new T3.SpriteMaterial({ map: ledTx, depthWrite: false, depthTest: false, transparent: true })); ledHalo.position.copy(led.position); ledHalo.position.z += 1; ledHalo.renderOrder = 61; neurona.add(ledHalo);
  const luzN = new T3.PointLight(COL.menta, 0, 160, 0); luzN.position.set(16, 30, 30); neurona.add(luzN);   // su latido alumbra el suelo cuando todo se apaga
  neurona.updateMatrixWorld(true);
  const LED = led.getWorldPosition(new T3.Vector3());
  const NPEND = 12, HUECOS = [];                                       // dónde se apilan las lecturas pendientes
  for (let k = 0; k < NPEND; k++) HUECOS.push(neurona.localToWorld(new T3.Vector3(-15 + (k % 4) * 10, 36 + Math.floor(k / 4) * 10, 0)));

  // ── las pantallas: aparatos de verdad en el plató blanco ──
  //  trasera de aluminio cepillado, canto pulido muy fino y una pantalla de vidrio negro con la interfaz encendida
  //  (el reflejo del plató cae encima de la imagen, como en una foto de producto). La que solo está definida
  //  es una lámina esmerilada con su interfaz en plano, a trazos: un «todavía no».
  const IF = DATOS.INTERFACES, CW = 1024, CH = 656, PW = 196, PH = 128, SW = 188, SH = SW * CH / CW, R = 300, YP = 152;
  const ACENTO = [COL.ion, COL.menta, COL.cian, COL.ion];
  const css = (h) => '#' + h.toString(16).padStart(6, '0');
  const CSS = { blanco: '#F4F6FA', gris: '#8A93A6', gris2: '#5B6478', suave: '#C9D2E3', tinta: css(COL.tinta), ion: css(COL.ion), cian: css(COL.cian), menta: css(COL.menta) };
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const geoTrasera = pieza(forma(PW, PH, 12), 5, 1.6);
  const geoMarco = (() => { const s = forma(PW + 2.4, PH + 2.4, 13.2); s.holes.push(hueco(PW - 1.6, PH - 1.6, 11.2, 0, 0)); return pieza(s, 5.8, 0.7); })();
  const geoPantalla = (() => { const g = new T3.ShapeGeometry(forma(SW, SH, 9.5), 10), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / SW + 0.5, p.getY(i) / SH + 0.5); return g; })();
  const matTrasera = new T3.MeshPhysicalMaterial({ color: 0xc3cad4, metalness: 1, roughness: 0.36, envMapIntensity: 1.1 });
  const matMarco = new T3.MeshPhysicalMaterial({ color: 0xeef1f5, metalness: 1, roughness: 0.12, envMapIntensity: 1.4 });
  const matLamina = new T3.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.32, transparent: true, opacity: 0.38, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.4 });
  const anis = Math.min(8, ctx.renderer.capabilities.getMaxAnisotropy());
  const PAN = IF.map((it, i) => {
    const fantasma = it.k === 'marketplace';
    const g = new T3.Group(); g.rotation.order = 'YXZ'; escena.add(g);
    const c = document.createElement('canvas'); c.width = CW; c.height = CH;
    const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = anis;
    let pantalla, tr = null;
    if (fantasma) {
      const lam = new T3.Mesh(geoTrasera, matLamina); lam.renderOrder = 20; g.add(lam);
      const ln = new T3.LineLoop(new T3.BufferGeometry().setFromPoints(forma(PW + 3, PH + 3, 13.5).getPoints(10)), new T3.LineDashedMaterial({ color: COL.ion, dashSize: 4, gapSize: 3.4, transparent: true, opacity: 0.85 }));
      ln.computeLineDistances(); ln.position.z = 2.8; g.add(ln);
      pantalla = new T3.Mesh(geoPantalla, new T3.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, toneMapped: false })); pantalla.renderOrder = 21;
    } else {
      tr = new T3.Mesh(geoTrasera, matTrasera); tr.castShadow = true; g.add(tr);
      g.add(new T3.Mesh(geoMarco, matMarco));
      pantalla = new T3.Mesh(geoPantalla, new T3.MeshPhysicalMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 1, roughness: 0.08, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.03, envMapIntensity: 0.3 }));
    }
    pantalla.position.z = 2.62; g.add(pantalla);
    const hilo = cuerda(escena, { color: COL.ion, opacidad: 0.6 });
    return { i, it, k: it.k, fantasma, g, pantalla, hilo, tr, x: c.getContext('2d'), tx, css: css(ACENTO[i]), col: new T3.Color(ACENTO[i]),
      q: -1, a: new T3.Vector3(), b: new T3.Vector3(), suelo: new T3.Vector3(), comba: 0, vida: 0 };
  });
  const luzPantalla = new T3.PointLight(COL.ion, 0, 460, 0); escena.add(luzPantalla);     // la pantalla de turno alumbra la casa y el suelo
  const red = new T3.Mesh(new T3.TorusGeometry(R, 0.55, 6, 200), new T3.MeshBasicMaterial({ color: COL.ion, transparent: true, opacity: 0.2, depthWrite: false }));
  red.rotation.x = Math.PI / 2; red.position.y = YP - PH / 2 - 14; escena.add(red);          // el anillo: la red sobre la que van las pantallas
  // la onda de la reconexión: un aro que sale de la casa por el suelo y enciende lo que toca
  const onda = new T3.Mesh(new T3.RingGeometry(0.985, 1, 160), new T3.MeshBasicMaterial({ color: COL.ion, transparent: true, opacity: 0, depthWrite: false, side: T3.DoubleSide }));
  onda.rotation.x = -Math.PI / 2; onda.position.y = 0.8; onda.visible = false; escena.add(onda);
  const GRIS = new T3.Color(0x5b6478), ION = new T3.Color(COL.ion);

  // ── lo que dibuja cada pantalla (Inter; nada de cifras inventadas) ──
  const PIE = { dashboard: 'Vista ilustrativa', auditor: 'Cada anotación lleva el sello de la anterior', marketplace: 'Solo definida: todavía no opera', comunidad: 'Seis roles sobre la misma gramática' };
  let sem = 406; const azar = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
  const hex = (n) => { let s = ''; for (let i = 0; i < n; i++) s += '0123456789abcdef'[Math.floor(azar() * 16)]; return s; };
  const HEX = [0, 1, 2, 3].map(() => `${hex(8)}…${hex(6)}`);            // sellos abstractos, no son datos
  const HITOS = ['Fabricación', 'Transporte', 'Montaje', 'Certificación'];
  const FORMA = [1, 0.9, 0.8, 0.69, 0.57, 0.45, 0.33];                    // ilustrativa: cuántas piezas han pasado por cada estado
  const dec = (v) => v.toFixed(2).replace('.', ',');
  function circulo(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); }
  // el fondo y la cabecera de cada pantalla. Las de verdad, de noche y opacas; la definida, en plano sobre la lámina
  function marcoPantalla(P, p) {
    const x = P.x, f = P.fantasma, T = f ? CSS.tinta : CSS.blanco;
    x.clearRect(0, 0, CW, CH); x.textBaseline = 'middle'; x.textAlign = 'left'; x.lineCap = 'round'; x.lineJoin = 'round';
    if (f) { x.fillStyle = 'rgba(14,165,233,.06)'; x.fillRect(0, 0, CW, CH);
      x.strokeStyle = 'rgba(14,165,233,.12)'; x.lineWidth = 1.5; x.beginPath(); for (let gx = 32; gx < CW; gx += 48) { x.moveTo(gx, 0); x.lineTo(gx, CH); } for (let gy = 32; gy < CH; gy += 48) { x.moveTo(0, gy); x.lineTo(CW, gy); } x.stroke(); }
    else {
      const g = x.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, '#111a2c'); g.addColorStop(1, '#060a12'); x.fillStyle = g; x.fillRect(0, 0, CW, CH);
      const r = x.createRadialGradient(140, -60, 0, 140, -60, 760); r.addColorStop(0, rgba(P.css, 0.24)); r.addColorStop(1, rgba(P.css, 0)); x.fillStyle = r; x.fillRect(0, 0, CW, CH);
    }
    const ent = E.eo(tramo(p, 0, 0.12));                                 // la cabecera entra la primera
    x.globalAlpha = 0.55 + 0.45 * ent;
    x.fillStyle = P.css; circulo(x, 64, 74, 8); x.fill();
    x.font = '600 40px Inter'; x.fillStyle = T; x.fillText(P.it.n, 88 + (1 - ent) * 18, 75);
    const uso = P.it.estado === 'En uso';
    x.font = '600 23px Inter'; const pw = x.measureText(P.it.estado).width + 40;
    x.fillStyle = uso ? 'rgba(0,212,170,.14)' : f ? 'rgba(27,41,81,.07)' : 'rgba(244,246,250,.08)'; x.beginPath(); x.roundRect(CW - 60 - pw, 53, pw, 44, 22); x.fill();
    if (f) { x.strokeStyle = rgba(CSS.ion, 0.6); x.lineWidth = 2; x.setLineDash([6, 6]); x.stroke(); x.setLineDash([]); }
    x.fillStyle = uso ? CSS.menta : f ? CSS.tinta : CSS.gris; x.fillText(P.it.estado, CW - 60 - pw + 20, 76);
    x.fillStyle = f ? 'rgba(27,41,81,.12)' : 'rgba(244,246,250,.08)'; x.fillRect(60, 124, (CW - 120) * (0.3 + 0.7 * ent), 2);
    x.font = '400 21px Inter'; x.fillStyle = f ? CSS.gris : CSS.gris2; x.fillText(PIE[P.k], 64, 612);
    x.globalAlpha = 1;
  }
  // al despertar, un barrido de luz cruza la pantalla
  function barrido(P, p) {
    const k = tramo(p, 0.0, 0.22); if (k <= 0 || k >= 1 || P.fantasma) return;
    const x = P.x, cx = mezcla(-300, CW + 300, E.eio(k)), g = x.createLinearGradient(cx - 220, 0, cx + 220, CH * 0.4);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(190,230,255,.16)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, CW, CH);
  }
  const DIBUJO = {
    // los siete estados de la pieza, en orden, como una vía con su barra
    dashboard(P, p) {
      const x = P.x, n = DATOS.ESTADOS.length, y0 = 170, dy = 63, x0 = 404, x1 = 962;
      x.fillStyle = 'rgba(244,246,250,.1)'; x.fillRect(63, y0, 2, dy * (n - 1));
      x.fillStyle = CSS.ion; x.fillRect(63, y0, 2, dy * (n - 1) * E.eo(tramo(p, 0, 0.85)));
      DATOS.ESTADOS.forEach((st, k) => {
        const y = y0 + k * dy, q = E.eo(tramo(p, k * 0.075, k * 0.075 + 0.42)), ult = k === n - 1, c = ult ? CSS.menta : CSS.ion, ent = E.eo(tramo(p, 0.02 + k * 0.035, 0.16 + k * 0.035));
        x.save(); x.globalAlpha = 0.3 + 0.7 * ent; x.translate((1 - ent) * 34, 0);
        x.fillStyle = q > 0.02 ? c : '#2A3242'; circulo(x, 64, y, 7); x.fill();
        x.font = '500 24px Inter'; x.fillStyle = ult ? CSS.menta : CSS.suave; x.fillText(st, 92, y + 1);
        x.fillStyle = 'rgba(244,246,250,.06)'; x.beginPath(); x.roundRect(x0, y - 7, x1 - x0, 14, 7); x.fill();
        const w = (x1 - x0) * FORMA[k] * q;
        if (w > 1) {
          const g = x.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, rgba(c, 0.3)); g.addColorStop(1, c);
          x.fillStyle = g; x.beginPath(); x.roundRect(x0, y - 7, Math.max(14, w), 14, 7); x.fill();
          x.save(); x.shadowColor = c; x.shadowBlur = 18; x.fillStyle = '#fff'; circulo(x, x0 + Math.max(7, w - 7), y, 4.5); x.fill(); x.restore();
        }
        x.restore();
      });
    },
    // hitos que se verifican uno a uno y anotaciones encadenadas: cada una lleva el sello de la anterior
    auditor(P, p) {
      const x = P.x;
      HITOS.forEach((h, k) => {
        const y = 190 + k * 104, q = tramo(p, 0.06 + k * 0.2, 0.2 + k * 0.2), qs = E.eo(q);
        if (k < 3) { x.fillStyle = 'rgba(244,246,250,.1)'; x.fillRect(77, y + 26, 3, 52); x.fillStyle = CSS.menta; x.fillRect(77, y + 26, 3, 52 * tramo(p, 0.2 + k * 0.2, 0.26 + k * 0.2)); }
        x.lineWidth = 3; x.strokeStyle = q > 0 ? rgba(CSS.menta, 0.45 + 0.55 * qs) : '#323B4C'; circulo(x, 78, y, 22); x.stroke();
        if (q > 0) {
          x.fillStyle = rgba(CSS.menta, 0.16 * qs); x.fill();
          const t = Math.min(1, q * 1.5), ax = 67, ay = y + 1, bx = 75, by = y + 9, cx = 90, cy = y - 8;      // la marca, de un trazo
          x.strokeStyle = CSS.menta; x.lineWidth = 4.5; x.beginPath(); x.moveTo(ax, ay);
          if (t < 0.4) x.lineTo(mezcla(ax, bx, t / 0.4), mezcla(ay, by, t / 0.4)); else { x.lineTo(bx, by); x.lineTo(mezcla(bx, cx, (t - 0.4) / 0.6), mezcla(by, cy, (t - 0.4) / 0.6)); }
          x.stroke();
        }
        x.font = '600 26px Inter'; x.fillStyle = CSS.blanco; x.fillText(h, 122, y - 11);
        x.font = '400 20px Inter'; x.fillStyle = q > 0.6 ? CSS.menta : CSS.gris2; x.fillText(q > 0.6 ? 'Verificado' : 'Pendiente', 122, y + 18);
        const bx0 = 470, bw = 492, by0 = 146 + k * 112, bh = 80, qb = E.eo(tramo(p, 0.1 + k * 0.2, 0.24 + k * 0.2));
        x.save(); x.globalAlpha = 0.3 + 0.7 * qb; x.translate((1 - qb) * 60, 0);
        x.fillStyle = 'rgba(244,246,250,.035)'; x.beginPath(); x.roundRect(bx0, by0, bw, bh, 16); x.fill();
        x.lineWidth = 2; x.strokeStyle = qb > 0.5 ? rgba(CSS.menta, 0.55) : 'rgba(244,246,250,.1)'; x.stroke();
        x.font = '400 25px "JetBrains Mono", monospace'; x.fillStyle = CSS.suave; x.fillText(HEX[k], bx0 + 28, by0 + 29);
        x.font = '400 19px Inter'; x.fillStyle = CSS.gris; x.fillText(k ? 'Lleva el sello de la anterior' : 'Primera anotación', bx0 + 28, by0 + 58);
        x.restore();
        if (k < 3) {                                                     // el eslabón hasta la siguiente
          const ql = tramo(p, 0.24 + k * 0.2, 0.3 + k * 0.2), lx = bx0 + 52, ly = by0 + bh;
          x.fillStyle = ql > 0 ? CSS.menta : 'rgba(244,246,250,.14)'; x.fillRect(lx - 1.5, ly, 3, 32 * Math.max(ql, ql > 0 ? 0 : 1));
          x.lineWidth = 2.5; x.strokeStyle = ql >= 1 ? CSS.menta : 'rgba(244,246,250,.18)'; circulo(x, lx, ly + 16, 6); x.stroke();
        }
      });
    },
    // la serie J a escala, como catálogo; todo a trazos porque solo está definido
    marketplace(P, p) {
      const x = P.x, C = CSS.ion, T = CSS.tinta, J = DATOS.SERIE_J, cw = 205, ch = 196, gx = 28, gy = 22, X0 = 60, Y0 = 146, esc = 17;
      for (let k = 0; k < 8; k++) {
        const cx = X0 + (k % 4) * (cw + gx), cy = Y0 + Math.floor(k / 4) * (ch + gy), mx = cx + cw / 2, my = cy + 76, q = E.eo(tramo(p, k * 0.07, k * 0.07 + 0.35));
        x.save(); x.globalAlpha = 0.4 + 0.6 * q; x.translate(0, (1 - q) * 26);
        x.setLineDash([8, 7]); x.lineDashOffset = -p * 40; x.lineWidth = 2; x.strokeStyle = rgba(C, 0.3); x.fillStyle = rgba(C, 0.025);
        x.beginPath(); x.roundRect(cx, cy, cw, ch, 18); x.fill(); x.stroke();
        x.textAlign = 'center';
        if (k < J.length) {
          const j = J[k], w = j.l * esc, h = j.a * esc;
          x.setLineDash([6, 5]); x.fillStyle = rgba(C, 0.07); x.strokeStyle = rgba(C, 0.85); x.beginPath(); x.rect(mx - w / 2, my - h / 2, w, h); x.fill(); x.stroke();
          x.setLineDash([]); x.font = '600 24px Inter'; x.fillStyle = T; x.fillText(j.id, mx, cy + 146);
          x.font = '400 18px Inter'; x.fillStyle = CSS.gris; x.fillText(`${dec(j.l)} × ${dec(j.a)} m`, mx, cy + 172);
        } else {                                                         // el segundo ciclo: material que vuelve
          x.setLineDash([6, 6]); x.strokeStyle = rgba(C, 0.85); x.lineWidth = 3;
          for (const a0 of [0.35, Math.PI + 0.35]) {
            x.beginPath(); x.arc(mx, my, 30, a0, a0 + Math.PI - 0.7); x.stroke();
            const ae = a0 + Math.PI - 0.7, ex = mx + Math.cos(ae) * 30, ey = my + Math.sin(ae) * 30, tx = -Math.sin(ae), ty = Math.cos(ae);
            x.setLineDash([]); x.beginPath(); x.moveTo(ex + tx * 9, ey + ty * 9); x.lineTo(ex + Math.cos(ae) * 7, ey + Math.sin(ae) * 7); x.lineTo(ex - Math.cos(ae) * 7, ey - Math.sin(ae) * 7); x.closePath(); x.fillStyle = rgba(C, 0.85); x.fill(); x.setLineDash([6, 6]);
          }
          x.setLineDash([]); x.font = '600 22px Inter'; x.fillStyle = T; x.fillText('Segundo ciclo', mx, cy + 146);
          x.font = '400 18px Inter'; x.fillStyle = CSS.gris; x.fillText('Material recuperado', mx, cy + 172);
        }
        x.textAlign = 'left'; x.setLineDash([]); x.lineDashOffset = 0; x.restore();
      }
    },
    // la Plaza en el centro y los seis roles alrededor, que se van uniendo
    comunidad(P, p) {
      const x = P.x, cx = 512, cy = 378, rx = 320, ry = 112, RO = DATOS.ROLES;
      const nx = (k) => cx + Math.cos(Math.PI - k * Math.PI / 3) * rx, ny = (k) => cy - Math.sin(Math.PI - k * Math.PI / 3) * ry;
      x.lineWidth = 2; x.strokeStyle = 'rgba(86,220,230,.13)'; x.beginPath(); for (let k = 0; k <= 6; k++) x.lineTo(nx(k % 6), ny(k % 6)); x.stroke();
      RO.forEach((r, k) => {
        const q = E.eo(tramo(p, 0.04 + k * 0.1, 0.24 + k * 0.1));
        x.lineWidth = 2; x.strokeStyle = 'rgba(86,220,230,.2)'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(nx(k), ny(k)); x.stroke();
        if (q > 0) { x.lineWidth = 3.5; x.strokeStyle = rgba(CSS.menta, 0.9); x.beginPath(); x.moveTo(cx, cy); x.lineTo(mezcla(cx, nx(k), q), mezcla(cy, ny(k), q)); x.stroke(); }
        const v = q >= 1 ? 1 : 0, up = ny(k) < cy - 10;
        x.fillStyle = rgba(v ? CSS.menta : CSS.cian, 0.14 + 0.12 * v); circulo(x, nx(k), ny(k), 22); x.fill();
        const pop = 1 + 0.5 * Math.sin(Math.PI * tramo(p, 0.24 + k * 0.1, 0.32 + k * 0.1));
        x.save(); x.shadowColor = v ? CSS.menta : CSS.cian; x.shadowBlur = 16; x.fillStyle = v ? CSS.menta : CSS.cian; circulo(x, nx(k), ny(k), 9.5 * pop); x.fill(); x.restore();
        x.font = '500 22px Inter'; x.textAlign = 'center'; x.fillStyle = v ? CSS.blanco : CSS.suave; x.fillText(r, nx(k), up ? ny(k) - 42 : ny(k) + 44);
      });
      for (let o = 0; o < 2; o++) { const w = (p * 3 + o * 0.5) % 1; if (p > 0) { x.lineWidth = 2; x.strokeStyle = rgba(CSS.ion, 0.5 * (1 - w)); circulo(x, cx, cy, 50 + w * 90); x.stroke(); } }
      x.fillStyle = 'rgba(14,165,233,.16)'; circulo(x, cx, cy, 50); x.fill(); x.lineWidth = 3; x.strokeStyle = CSS.ion; x.stroke();
      x.font = '600 26px Inter'; x.fillStyle = CSS.blanco; x.textAlign = 'center'; x.fillText('Plaza', cx, cy + 1); x.textAlign = 'left';
    },
  };
  function pintar(P, p) {                                               // solo se repinta cuando su avance cambia de verdad
    const q = Math.round(p * 72); if (q === P.q) return;
    P.q = q; marcoPantalla(P, q / 72); DIBUJO[P.k](P, q / 72); barrido(P, q / 72); P.tx.needsUpdate = true;
  }
  if (document.fonts) Promise.all(['400 24px Inter', '500 24px Inter', '600 24px Inter', '400 24px "JetBrains Mono"'].map((f) => document.fonts.load(f))).then(() => { for (const P of PAN) P.q = -1; }).catch(() => {});

  // ── pulsos, lecturas pendientes y estelas ──
  const NPUL = 4, NM = PAN.length * NPUL + NPEND;
  // sobre el blanco la luz no se suma: cada mota lleva su color y su alfa
  const gm = new T3.BufferGeometry(), posM = new Float32Array(NM * 3), colM = new Float32Array(NM * 4);
  gm.setAttribute('position', new T3.BufferAttribute(posM, 3)); gm.setAttribute('color', new T3.BufferAttribute(colM, 4));
  const motas = new T3.Points(gm, new T3.PointsMaterial({ size: 21, map: motaTx, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false }));
  motas.frustumCulled = false; motas.renderOrder = 50; escena.add(motas);
  const ge = new T3.BufferGeometry(), posE = new Float32Array(NPEND * 6), colE = new Float32Array(NPEND * 8);
  ge.setAttribute('position', new T3.BufferAttribute(posE, 3)); ge.setAttribute('color', new T3.BufferAttribute(colE, 4));
  const estelas = new T3.LineSegments(ge, new T3.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, toneMapped: false }));
  estelas.frustumCulled = false; estelas.renderOrder = 51; escena.add(estelas);
  const MENTA = new T3.Color(COL.menta), FONDO = new T3.Color(), BLANCA = new T3.Color(0xffffff), GRIS_SALA = new T3.Color(0x98a1b0);

  // ── el enjambre: cada lector es una neurona ──
  //  la de antes (0) y cinco más alrededor de la casa, en el suelo. Se encuentran con balizas, se unen con
  //  hilos, eligen principal (la corona), reparten la memoria en trozos con dos copias cada uno, y cuando
  //  la principal se apaga otra toma el relevo y los trozos perdidos se copian desde su otra copia.
  const ND = 6, SN = 1, DEV = [];
  for (let i = 0; i < ND; i++) {
    const az = AZN + i * TAU / ND, r = i ? RN + [0, 10, -14, 18, -6, 8][i] : RN, s = i ? SN : 1.3;
    DEV.push({ az, x: Math.sin(az) * r, z: Math.cos(az) * r, s, top: 26 * s });
  }
  const NX = ND - 1;                                                    // las nuevas, en instancias: cuerpo, cara y luz
  const geoCuerpoN = cuerpoN.geometry.clone().translate(0, 13, 0), geoCaraN = caraN.geometry.clone().translate(-3, 13, 15.05), geoLedN = led.geometry.clone().translate(16, 13, 15.4);
  const cuerposX = new T3.InstancedMesh(geoCuerpoN, BLANCO, NX), carasX = new T3.InstancedMesh(geoCaraN, caraN.material, NX), ledsX = new T3.InstancedMesh(geoLedN, new T3.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), NX);
  cuerposX.castShadow = cuerposX.receiveShadow = true;
  for (const m of [cuerposX, carasX, ledsX]) { m.frustumCulled = false; escena.add(m); }
  for (let k = 0; k < NX; k++) ledsX.setColorAt(k, MENTA);
  // las balizas: un aro por neurona que se abre por el suelo
  const balizas = new T3.InstancedMesh(new T3.RingGeometry(0.93, 1, 72).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }), ND);
  balizas.frustumCulled = false; escena.add(balizas);
  for (let k = 0; k < ND; k++) balizas.setColorAt(k, BLANCA);
  // los hilos de la red local: un hexágono alrededor de la casa, cada uno con su comba
  const ARISTAS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]], NSEG = 10;
  const gl = new T3.BufferGeometry(), posL = new Float32Array(ARISTAS.length * NSEG * 6), colL = new Float32Array(ARISTAS.length * NSEG * 8);
  gl.setAttribute('position', new T3.BufferAttribute(posL, 3)); gl.setAttribute('color', new T3.BufferAttribute(colL, 4));
  const malla = new T3.LineSegments(gl, new T3.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, toneMapped: false }));
  malla.frustumCulled = false; escena.add(malla);
  // la corona de la principal
  const corona = new T3.Mesh(new T3.TorusGeometry(21, 1.7, 12, 64), new T3.MeshPhysicalMaterial({ color: COL.ion, emissive: COL.ion, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.25, clearcoat: 1 }));
  corona.visible = false; escena.add(corona);
  // la memoria: trozos cifrados, cada uno en dos neuronas; la 0 lleva dos que se pierden y se recopian
  const PARES = [[0, 2], [0, 4], [1, 3], [2, 5], [4, 1], [5, 3]], REP = [[0, 2, 3], [1, 4, 5]];   // REP: trozo, de dónde, a dónde
  const HUECO4 = [[-6, -6], [6, -6], [-6, 6], [6, 6]], ocupado = new Array(ND).fill(0);
  const TROZOS = [];
  const sitio = (d) => { const D = DEV[d], k = ocupado[d]++, [lx, lz] = HUECO4[k % 4], c = Math.cos(D.az), s = Math.sin(D.az), e = D.s / 1.3;
    return new T3.Vector3(D.x + (lx * c + lz * s) * e, D.top + 3, D.z + (-lx * s + lz * c) * e); };
  PARES.forEach(([a, b], c) => [a, b].forEach((d, n) => TROZOS.push({ d, de: null, a: sitio(d), t0: 0.789 + c * 0.0034 + n * 0.0014 })));
  REP.forEach(([c, de, a], n) => TROZOS.push({ d: a, de: TROZOS[c * 2 + (PARES[c][0] === de ? 0 : 1)].a, a: sitio(a), t0: 0.83 + n * 0.005 }));
  const cubos = new T3.InstancedMesh(new T3.BoxGeometry(6.4, 6.4, 6.4), new T3.MeshPhysicalMaterial({ color: COL.tinta, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }), TROZOS.length);
  cubos.frustumCulled = false; cubos.castShadow = true; escena.add(cubos);
  const NEU = { aparece: 0.742, baliza: [0.748, 0.79], une: 0.762, elige: 0.785, cae: 0.812, relevo: 0.823, vuelve: 0.847, devuelve: 0.852 };   // todo mientras se lee el texto
  const mI = new T3.Matrix4(), qI = new T3.Quaternion(), sI = new T3.Vector3(), pI = new T3.Vector3(), eY = new T3.Vector3(0, 1, 0), cI = new T3.Color();

  // ── el guion, en u ──
  const B = [[0.18, 0.31], [0.33, 0.46], [0.48, 0.60], [0.62, 0.74]];
  const AZ = [0.3, -0.3, 0.3, -0.3];                                    // dónde queda la pantalla de turno: a la derecha del texto izquierdo, y al revés
  const CB = AZ.map((a) => -a), CI = 0.05, CF = 0.1;                     // el lado de la cámara en cada interfaz, en la entrada y al final
  const LANZA = PAN.map((P, i) => 0.08 + i * 0.013);                    // cuándo sale cada hilo
  const RED = { cae: 0.902, anota: 0.928, sube: 0.963, vuelve: 0.976 };
  const ENC = RED.vuelve + 0.0022;                                       // cuando la onda llega al anillo
  // el anillo es un carril: las pantallas van en él como cuentas, siempre en el mismo orden y siempre
  // girando hacia el mismo lado. La de turno sale al frente; las otras tres esperan detrás de la casa.
  // En vertical la de turno sale menos de lado y sube por encima de la casa: el plano es una diagonal.
  const DETRAS = [Math.PI - 0.58, Math.PI, Math.PI + 0.58];
  let FRENTE = 0.78, ALZA = 0, ESTADOS = [], ARRANQUE = [];
  function trazarCarril() {
    const relativo = (k) => { const r = []; r[k] = AZ[k] > 0 ? FRENTE : -FRENTE; for (let n = 1; n < 4; n++) r[(k + n) % 4] = DETRAS[n - 1]; return r; };
    ESTADOS = [
      { c: CI, rel: [0, 1, 2, 3].map((i) => Math.PI / 4 + i * Math.PI / 2) },                                          // entrada: repartidas
      ...B.map(([a], k) => ({ c: CB[k], rel: relativo(k), w: [a - 0.03, a + 0.055], f: E.muelle(0.62, 13), activa: k })),
      { c: CF, rel: [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, -Math.PI / 4], w: [0.735, 0.795], f: E.suave },     // final: ninguna de frente
    ];
    ARRANQUE = ESTADOS[0].rel.map((r) => CI + r + 0.7);                  // en la entrada derivan despacio hasta su sitio
    let prev = ARRANQUE.map((a) => a - 0.7);
    // siempre hacia el mismo lado; si el sitio nuevo queda un pelo atrás, un paso corto atrás, nunca una vuelta entera
    ESTADOS.forEach((s, j) => {
      s.mundo = s.rel.map((r, i) => { if (j === 0) return prev[i]; let d = (prev[i] - (s.c + r)) % TAU; if (d < 0) d += TAU; if (d > TAU - 0.6) d -= TAU; return prev[i] - d; });
      const antes = j > 0 ? ESTADOS[j - 1].activa : undefined;
      s.retraso = s.rel.map((r, i) => i === antes ? 0 : i === s.activa ? 0.006 : 0.012);   // la que se va arranca antes: abre paso
      prev = s.mundo;
    });
  }
  function carril(i, u) {
    let a = ARRANQUE[i] - 0.7 * E.seno(tramo(u, 0, 0.13));
    for (let j = 1; j < ESTADOS.length; j++) { const s = ESTADOS[j], d = s.retraso[i]; a += (s.mundo[i] - ESTADOS[j - 1].mundo[i]) * s.f(tramo(u, s.w[0] + d, s.w[1] + d)); }
    return a;
  }
  const turno = (k, u) => E.firme(tramo(u, B[k][0] - 0.005, B[k][0] + 0.045)) * (1 - E.seno(tramo(u, B[k][1] - 0.025, B[k][1] + 0.012)));
  // parpadeo de tubo al encenderse, y de apagón al irse
  const enciende = (k) => k <= 0 ? 0 : k >= 1 ? 1 : k < 0.45 ? (Math.sin(k * 95) > -0.2 ? 0.75 : 0.12) * (k / 0.45) : mezcla(0.75, 1, E.eo((k - 0.45) / 0.55));
  const apaga = (k) => k <= 0 ? 1 : k >= 1 ? 0 : (1 - k) * (1 - k) * (0.6 + 0.4 * Math.cos(k * 85));
  // la corriente de cada pantalla: 0 sin red, 1 con ella
  function corriente(i, u) {
    const kOn = tramo(u, ENC + i * 0.0012, ENC + 0.011 + i * 0.0012);
    return kOn > 0 ? enciende(kOn) : apaga(tramo(u, RED.cae + i * 0.0055, RED.cae + 0.01 + i * 0.0055));
  }

  // ── la cámara: planos clave en u; en vertical, otro encuadre ──
  // la de turno y la casa, a medias: el centro del plano de cada interfaz
  const objetivo = (k, f = 0.56) => { const a = CB[k] + Math.sign(AZ[k]) * FRENTE, r = R + 38; return [mezcla(0, Math.sin(a) * r, f), mezcla(88, YP + ALZA, f * 0.9), mezcla(0, Math.cos(a) * r, f)]; };
  let CLAVES = [];
  // la coreografía: en cada interfaz la cámara entra cerca y sigue empujando hacia la pantalla; entre una y otra
  // sube y se abre (se ve el carril entero girando) y vuelve a bajar en curva sobre la siguiente
  function planos(v) {
    CLAVES = [
      { u: 0.0, c: -0.38, el: 0.34, t: [0, 50, 0], sw: 380, sh: 250, lay: 'arriba' },
      { u: 0.065, c: -0.2, el: 0.28, t: [0, 84, 0], sw: 420, sh: 290, lay: 'arriba' },
      { u: 0.135, c: 0.02, el: 0.3, t: [0, 120, 0], sw: 780, sh: 400, lay: 'arriba' },
      { u: 0.155, c: 0.05, el: 0.32, t: [0, 120, 0], sw: 820, sh: 400, lay: 'arriba' },
    ];
    const sw = v ? 370 : 440, sh = v ? 340 : 280;
    B.forEach(([a, b], k) => { const c = -AZ[k], sg = Math.sign(AZ[k]), lay = k % 2 ? 'der' : 'izq';
      CLAVES.push({ u: a + 0.045, c, el: 0.15, t: objetivo(k), sw, sh, lay }, { u: b - 0.015, c: c - 0.05 * sg, el: 0.09, t: objetivo(k, 0.6), sw: sw * 0.88, sh: sh * 0.88, lay });
      if (k < 3) CLAVES.push({ u: (b + B[k + 1][0]) / 2 + 0.006, c: 0.42 * sg, el: 0.42, t: [0, 100, 0], sw: v ? 600 : 900, sh: 430, lay: 'centro' }); });
    const N = [Math.sin(AZN) * RN, 22, Math.cos(AZN) * RN];
    CLAVES.push(
      { u: 0.778, c: 0.5, el: 0.6, t: [20, 22, 30], sw: v ? 500 : 580, sh: v ? 500 : 380, lay: 'izq' },                                  // el enjambre, desde arriba
      { u: 0.872, c: 0.82, el: 0.48, t: [40, 24, 50], sw: v ? 460 : 520, sh: v ? 460 : 340, lay: 'izq' });
    CLAVES.push(
      { u: 0.932, c: CF, el: 0.14, t: [50, 94, 85], sw: v ? 520 : 640, sh: 320, lay: 'abajo' },                                   // se va la red
      { u: 0.962, c: CF + 0.16, el: 0.1, t: [mezcla(50, N[0], 0.6), mezcla(94, 40, 0.6), mezcla(85, N[2], 0.6)], sw: v ? 360 : 430, sh: 230, lay: 'abajo' },   // se acerca a la neurona, que sigue anotando
      { u: 0.986, c: CF + 0.04, el: 0.2, t: [40, 100, 70], sw: v ? 560 : 700, sh: 340, lay: 'abajo' },                            // vuelve: se abre para ver la onda
      { u: 1.0, c: CF + 0.08, el: 0.18, t: [40, 100, 70], sw: v ? 540 : 680, sh: 330, lay: 'abajo' });
  }
  // [fracción de ancho, fracción de alto, desplazamiento x, desplazamiento y] del protagonista en pantalla
  const LAY = { h: { izq: [0.5, 0.66, 0.19, 0], der: [0.5, 0.66, -0.19, 0], arriba: [0.86, 0.58, 0, -0.14], abajo: [0.86, 0.58, 0, 0.16], centro: [0.9, 0.72, 0, -0.02] },
    v: { izq: [0.94, 0.5, 0, 0.13], der: [0.94, 0.5, 0, 0.13], arriba: [0.98, 0.5, 0, -0.06], abajo: [0.98, 0.42, 0, 0.2], centro: [0.98, 0.5, 0, 0.12] } };
  const CAM = { c: 0, el: 0, d: 0, ox: 0, oy: 0, t: new T3.Vector3() };
  function encuadrar(u, reloj) {
    let j = 0; while (j < CLAVES.length - 2 && u > CLAVES[j + 1].u) j++;
    const a = CLAVES[j], b = CLAVES[j + 1], s = E.seno(tramo(u, a.u, b.u));
    CAM.c = mezcla(a.c, b.c, s) + Math.sin(reloj * 0.21) * 0.012 + Math.sin(reloj * 0.13) * 0.008;
    CAM.el = mezcla(a.el, b.el, s) + Math.sin(reloj * 0.17) * 0.006;
    CAM.d = mezcla(a.d, b.d, s); CAM.ox = mezcla(a.ox, b.ox, s); CAM.oy = mezcla(a.oy, b.oy, s);
    CAM.t.set(mezcla(a.t[0], b.t[0], s), mezcla(a.t[1], b.t[1], s), mezcla(a.t[2], b.t[2], s));
    camara.setViewOffset(W, H, -CAM.ox * W, CAM.oy * H, W, H);
    mirar(camara, CAM.t.x, CAM.t.y, CAM.t.z, CAM.d, CAM.c, CAM.el);
    plato.enfocar(CAM.t.x, CAM.t.y * 0.5, CAM.t.z, CAM.d);
  }

  const v1 = new T3.Vector3(), v2 = new T3.Vector3(), vP = new T3.Vector3();
  // un punto del hilo: recto entre a y b, con su comba hacia abajo (la misma cuenta que tender)
  const enHilo = (P, s, out) => out.set(mezcla(P.a.x, P.b.x, s), mezcla(P.a.y, P.b.y, s) - P.comba * 4 * s * (1 - s), mezcla(P.a.z, P.b.z, s));
  // el camino de una lectura pendiente cuando vuelve la red: sube en arco hasta el punto
  const subida = (k, s, out) => { const e = E.eio(s), h = HUECOS[k]; return out.set(mezcla(h.x, 0, e), mezcla(h.y, YPUNTO, e) + 90 * Math.sin(Math.PI * s), mezcla(h.z, 0, e)); };

  // la caída de un hilo cuando se va la red: cae con aceleración, toca el suelo y rebota un poco
  const caida = (k) => k <= 0 ? 0 : k < 0.55 ? (k / 0.55) ** 2 : k < 0.85 ? 1 - 0.1 * Math.sin(Math.PI * (k - 0.55) / 0.3) : 1;
  // el latido de la neurona: dos golpes, como un corazón
  const latido = (t) => { const f = t % 1.15; return Math.exp(-((f / 0.055) ** 2)) + 0.6 * Math.exp(-(((f - 0.2) / 0.055) ** 2)); };
  const ponCol = (arr, o, c, a) => { arr[o] = c.r; arr[o + 1] = c.g; arr[o + 2] = c.b; arr[o + 3] = a; };

  const cap = {
    escena, camara, fondo: 0xffffff,
    medir(w, h) {
      W = w; H = h; const v = w < h, L = LAY[v ? 'v' : 'h'];
      FRENTE = v ? 0.3 : 0.78; ALZA = v ? 100 : 0; trazarCarril(); planos(v);
      for (const k of CLAVES) { const [fw, fh, ox, oy] = L[k.lay]; k.d = distancia(camara, k.sh / fh, k.sw / fw); k.ox = ox; k.oy = oy; }
    },
    actualizar(u, reloj) {
      // el sonido del apagón cuando se va la red, y el del regreso (solo si el visitante activó el sonido)
      window.SONIDO?.cruce('os-cae', u, RED.cae, 'apagon'); window.SONIDO?.cruce('os-vuelve', u, ENC, 'encendido');
      encuadrar(u, reloj);
      // el apagón del plató: cuando se va la red baja la luz y el blanco se vuelve gris; la onda lo devuelve
      const apagon = E.seno(tramo(u, RED.cae - 0.002, RED.cae + 0.022)) * (1 - E.seno(tramo(u, ENC - 0.002, ENC + 0.012)));
      plato.clave.intensity = CLAVE0 * (1 - 0.62 * apagon); if (cielo) cielo.intensity = CIELO0 * (1 - 0.55 * apagon);
      escena.environmentIntensity = ENV0 * (1 - 0.55 * apagon);
      cap.fondo = FONDO.copy(BLANCA).lerp(GRIS_SALA, apagon).getHex();
      contacto.material.opacity = 0.5 - 0.2 * apagon;

      // la casa se monta y el plato gira despacio
      casa.rotation.y = 0.55 + u * 1.3 + reloj * 0.03;
      for (const P of PIEZAS) asentar(P, u);

      // el punto: baja, bota en el aire y late con cada cosa que pasa
      const up = tramo(u, 0.058, 0.08), yP = mezcla(YPUNTO + 300, YPUNTO, E.rebote(up));
      let late = 1 + 0.05 * Math.sin(reloj * 2.3);
      for (const t of LANZA) late += 0.45 * Math.sin(Math.PI * tramo(u, t, t + 0.012));
      late += 0.6 * Math.sin(Math.PI * tramo(u, RED.sube + 0.006, ENC));
      pa.poner(0, yP, 0, 6.8 * late, up > 0 ? Math.min(1, up * 4) * mezcla(1, late, 0.6) : 0);
      if (up < 0.3 && up > 0) pa.esfera.scale.set(6.8 * 0.85, 6.8 * 1.25, 6.8 * 0.85);   // estirado mientras cae
      pa.luz.intensity *= 0.3; pa.halo.material.opacity *= 0.3;       // el tejado se entibia sin quemarse; sobre blanco, el halo apenas
      vP.set(0, yP, 0);

      // la onda de la reconexión
      const ko = tramo(u, RED.vuelve - 0.002, RED.vuelve + 0.016), ro = mezcla(30, 560, E.eo(ko));
      onda.visible = ko > 0 && ko < 1; onda.scale.setScalar(ro); onda.material.opacity = 0.9 * Math.pow(1 - ko, 1.4);
      const toca = onda.visible ? Math.exp(-(((ro - R) / 40) ** 2)) : 0;    // el anillo se ilumina cuando la onda pasa
      const sinRed = 1 - tramo(u, RED.cae - 0.004, RED.cae + 0.01) * (1 - tramo(u, ENC, ENC + 0.01));
      red.material.opacity = (0.06 + 0.26 * E.eo(tramo(u, 0.08, 0.14))) * mezcla(0.15, 1, sinRed) + 0.7 * toca;

      // las pantallas y sus hilos
      let mejor = 0, quien = null, foco = 0;
      for (let k = 0; k < 4; k++) foco += turno(k, u);
      const enjambre = E.seno(tramo(u, 0.742, 0.775)) * (1 - E.seno(tramo(u, 0.885, 0.91)));                   // cuánto manda la de turno: las demás se apartan y se apagan un poco
      for (const P of PAN) {
        const i = P.i, act = turno(i, u), pw = corriente(i, u), atras = foco * (1 - act);
        const lan = tramo(u, LANZA[i], LANZA[i] + 0.02), ext = E.eo(lan), luce = enciende(tramo(u, LANZA[i] + 0.018, LANZA[i] + 0.042));
        const kOff = tramo(u, RED.cae + i * 0.0055 + 0.002, RED.cae + 0.03 + i * 0.0055), kOn = tramo(u, ENC + i * 0.0012, ENC + 0.018 + i * 0.0012);
        const vence = E.rebote(kOff) * (1 - E.vivo(kOn));
        // se despliega cuando le llega su hilo
        const ab = tramo(u, LANZA[i] + 0.012, LANZA[i] + 0.042), esc = 1 - 0.14 * atras;
        P.g.visible = ab > 0; P.g.scale.set(mezcla(0.35, 1, E.eo(ab)) * esc, Math.max(0.001, E.vivo(ab)) * esc, esc);
        // su sitio en el carril; la de turno da un paso adelante y se vuelve hacia la cámara
        const az = carril(i, u), r = R + 38 * act - 26 * atras, yaw = mezcla(az, CAM.c, 0.5 * act);
        P.g.position.set(Math.sin(az) * r, YP + 2.4 * Math.sin(reloj * 0.9 + i * 1.7) + (5 + ALZA) * act - 10 * atras - 14 * vence + 560 * E.eio(enjambre), Math.cos(az) * r);   // «debajo de todo»: las interfaces suben y dejan ver el enjambre
        P.g.rotation.set(-0.07 - 0.05 * act + 0.24 * vence, yaw, 0.012 * Math.sin(reloj * 0.7 + i));
        const vida = luce * pw; P.vida = vida; if (P.tr) P.tr.castShadow = enjambre < 0.3;
        const brillo = 0.03 + 0.97 * vida * (0.8 + 0.2 * act) * (1 - 0.4 * atras) * (1 - 0.45 * enjambre);
        if (P.fantasma) { P.pantalla.material.opacity = 0.25 + 0.75 * vida; matLamina.opacity = 0.2 + 0.2 * vida; }
        else P.pantalla.material.emissiveIntensity = brillo;
        pintar(P, tramo(u, B[i][0] + 0.01, B[i][1] - 0.05));
        if (act * pw > mejor) { mejor = act * pw; quien = P; }
        // su hilo: sale del punto y se tensa al llegar; sin red se suelta, cae al suelo y, al volver, salta a su sitio
        const enganche = v2.set(P.g.position.x - Math.sin(yaw) * 3, P.g.position.y, P.g.position.z - Math.cos(yaw) * 3);
        P.a.copy(vP);
        if (ext <= 0 || up < 1) { P.hilo.visible = false; P.comba = 0; for (let k = 0; k < NPUL; k++) colM[(i * NPUL + k) * 4 + 3] = 0; continue; }
        P.suelo.set(enganche.x * 0.62, 1, enganche.z * 0.62);
        const cae = kOn > 0 ? 1 - E.vivo(kOn) : caida(kOff);
        P.b.lerpVectors(P.a, enganche, ext).lerp(P.suelo, cae);
        const llega = tramo(u, LANZA[i] + 0.02, LANZA[i] + 0.05), vib = 4 * Math.exp(-llega * 5) * Math.sin(llega * 48) * (llega > 0 && llega < 1) + (kOn > 0 && kOn < 1 ? 7 * Math.exp(-kOn * 5) * Math.sin(kOn * 52) : 0);
        P.comba = (5 + 7 * (1 - act)) * (1 - Math.min(1, cae)) + 18 * Math.max(0, cae);
        P.hilo.tender(P.a, P.b, P.comba, vib);
        P.hilo.material.color.copy(GRIS).lerp(ION, pw);                  // sin red, un cable gris
        P.hilo.material.opacity = ((0.3 + 0.6 * act) * (P.fantasma ? 0.5 : 1) * pw + 0.75 * (1 - pw)) * Math.min(1, lan * 3);
        // los pulsos: el mismo dato viajando a cada interfaz (a la que solo está definida no le llega)
        for (let k = 0; k < NPUL; k++) {
          const s = ((reloj * 0.42 + k / NPUL + i * 0.21) % 1), o = i * NPUL + k;
          enHilo(P, s, v1); posM[o * 3] = v1.x; posM[o * 3 + 1] = v1.y; posM[o * 3 + 2] = v1.z;
          ponCol(colM, o * 4, P.col, P.fantasma ? 0 : (ext >= 1 ? 1 : 0) * pw * Math.max(0, 1 - cae) * (0.3 + 0.7 * act) * Math.sin(Math.PI * s));
        }
      }
      // la pantalla de turno da luz de su color
      if (quien) { luzPantalla.color.copy(quien.col); luzPantalla.position.set(quien.g.position.x * 0.8, quien.g.position.y - 30, quien.g.position.z * 0.8); }
      luzPantalla.intensity = 1.2 * mejor;

      // la neurona: sigue anotando sin red. Cada lectura, un destello y una mota más en la pila
      let destello = 0;
      for (let k = 0; k < NPEND; k++) {
        const ta = RED.anota + k * 0.0028, ap = tramo(u, ta, ta + 0.007), s = tramo(u, RED.sube + k * 0.0011, RED.sube + 0.011 + k * 0.0011), o = PAN.length * NPUL + k, oe = k * 8;
        const dd = u - ta; if (dd > 0 && dd < 0.004) destello = Math.max(destello, 1 - dd / 0.004);
        let v = 0;
        if (s > 0 && s < 1) {                                              // sube como una estela
          subida(k, s, v1); subida(k, Math.max(0, s - 0.16), v2); v = 1;
          posE[k * 6] = v1.x; posE[k * 6 + 1] = v1.y; posE[k * 6 + 2] = v1.z; posE[k * 6 + 3] = v2.x; posE[k * 6 + 4] = v2.y; posE[k * 6 + 5] = v2.z;
          ponCol(colE, oe, ION, 1); ponCol(colE, oe + 4, ION, 0);
        } else {
          colE[oe + 3] = colE[oe + 7] = 0;
          if (ap > 0 && s <= 0) { const h = HUECOS[k], e = E.eo(ap); v1.set(mezcla(LED.x, h.x, e), mezcla(LED.y + 4, h.y, e) + 0.8 * Math.sin(reloj * 3 + k), mezcla(LED.z, h.z, e)); v = Math.min(1, E.vivo(ap)); }
        }
        posM[o * 3] = v1.x; posM[o * 3 + 1] = v1.y; posM[o * 3 + 2] = v1.z; ponCol(colM, o * 4, ION, v);
      }
      gm.attributes.position.needsUpdate = gm.attributes.color.needsUpdate = true;
      ge.attributes.position.needsUpdate = ge.attributes.color.needsUpdate = true;

      // ── el enjambre ──
      // la 0 (la principal) se apaga y vuelve; mientras, la 1 lleva la corona
      const kMuere = tramo(u, NEU.cae, NEU.cae + 0.008), kVive = tramo(u, NEU.vuelve, NEU.vuelve + 0.008);
      const viva0 = kVive > 0 ? enciende(kVive) : apaga(kMuere);
      const enRed = tramo(u, NEU.aparece - 0.01, NEU.aparece + 0.01);   // desde aquí el enjambre está en escena
      for (let i = 1; i < ND; i++) {
        const D = DEV[i], k = i - 1, ap = tramo(u, NEU.aparece + i * 0.004, NEU.aparece + 0.02 + i * 0.004), s = Math.max(0.001, E.vivo(ap)) * D.s;
        qI.setFromAxisAngle(eY, D.az); pI.set(D.x, 0, D.z); sI.set(s, s * (ap < 1 ? mezcla(1.25, 1, E.eo(ap)) : 1), s);
        mI.compose(pI, qI, sI); cuerposX.setMatrixAt(k, mI); carasX.setMatrixAt(k, mI); ledsX.setMatrixAt(k, mI);
        const lider = i === 1 ? E.eo(tramo(u, NEU.relevo + 0.006, NEU.relevo + 0.014)) * (1 - E.eo(tramo(u, NEU.devuelve + 0.006, NEU.devuelve + 0.014))) : 0;
        const b = 0.45 + 0.35 * latido(reloj + i * 0.37) + 0.9 * lider;
        ledsX.setColorAt(k, cI.copy(MENTA).multiplyScalar(Math.min(1.6, b)));
      }
      cuerposX.visible = carasX.visible = ledsX.visible = u > NEU.aparece;
      cuerposX.instanceMatrix.needsUpdate = carasX.instanceMatrix.needsUpdate = ledsX.instanceMatrix.needsUpdate = true; ledsX.instanceColor.needsUpdate = true;
      // las balizas: aros que se abren desde cada neurona, más vivos mientras se buscan
      const fuerza = E.seno(tramo(u, NEU.baliza[0], NEU.baliza[0] + 0.01)) * mezcla(1, 0.35, E.seno(tramo(u, NEU.baliza[1], NEU.baliza[1] + 0.02)));
      for (let i = 0; i < ND; i++) {
        const D = DEV[i], f = (reloj * 0.5 + i * 0.29) % 1, vivo = i ? tramo(u, NEU.aparece + i * 0.004 + 0.01, NEU.aparece + i * 0.004 + 0.02) : viva0;
        const a = fuerza * vivo * Math.pow(1 - f, 1.5), r = 10 + 85 * E.eo(f);
        qI.identity(); pI.set(D.x, 0.7 + i * 0.01, D.z); sI.set(r, 1, r); mI.compose(pI, qI, sI); balizas.setMatrixAt(i, mI);
        balizas.setColorAt(i, cI.copy(FONDO).lerp(ION, a));             // sobre el blanco (o el gris) se funde en el fondo
      }
      balizas.instanceMatrix.needsUpdate = true; balizas.instanceColor.needsUpdate = true; balizas.visible = fuerza > 0.001;
      // los hilos de la red local: crecen de una a otra; los de la 0 caen al suelo cuando se apaga y saltan al volver
      const caeL = kVive > 0 ? 1 - E.vivo(tramo(u, NEU.vuelve + 0.002, NEU.vuelve + 0.016)) : caida(tramo(u, NEU.cae + 0.002, NEU.cae + 0.016));
      ARISTAS.forEach(([a, b], j) => {
        const A = DEV[a], Bd = DEV[b], g = E.eo(tramo(u, NEU.une + j * 0.004, NEU.une + 0.014 + j * 0.004)), toca0 = a === 0 || b === 0, c0 = toca0 ? caeL : 0;
        const ya = a === 0 ? mezcla(A.top + 2, 1, c0) : A.top + 2, yb = b === 0 ? mezcla(Bd.top + 2, 1, c0) : Bd.top + 2, comba = 5 + 14 * Math.max(0, c0);
        const vib = toca0 && kVive > 0 ? 6 * Math.exp(-tramo(u, NEU.vuelve, NEU.vuelve + 0.02) * 5) * Math.sin(tramo(u, NEU.vuelve, NEU.vuelve + 0.02) * 50) : 0;
        cI.copy(ION).lerp(GRIS, Math.min(1, Math.max(0, c0)));
        for (let q = 0; q < NSEG; q++) {
          for (let e = 0; e < 2; e++) {
            const s = Math.min(g, (q + e) / NSEG), o = (j * NSEG + q) * 2 + e;
            posL[o * 3] = mezcla(A.x, Bd.x, s); posL[o * 3 + 1] = mezcla(ya, yb, s) - comba * 4 * s * (1 - s) + vib * Math.sin(Math.PI * s); posL[o * 3 + 2] = mezcla(A.z, Bd.z, s);
            ponCol(colL, o * 4, cI, (q / NSEG < g ? 0.85 : 0) * enRed);
          }
        }
      });
      gl.attributes.position.needsUpdate = gl.attributes.color.needsUpdate = true;
      // la corona: baja sobre la 0, cae con ella, vuela a la 1 y, cuando la 0 vuelve, regresa
      const D0 = DEV[0], D1 = DEV[1], kc = tramo(u, NEU.elige, NEU.elige + 0.012), kf = tramo(u, NEU.cae + 0.001, NEU.cae + 0.01);
      const kh = tramo(u, NEU.relevo, NEU.relevo + 0.014), kb = tramo(u, NEU.devuelve, NEU.devuelve + 0.014);
      corona.visible = kc > 0;
      if (corona.visible) {
        const giro = reloj * 0.8;
        if (kb > 0) { const e = E.vivo(kb); pI.set(mezcla(D1.x, D0.x, e), mezcla(D1.top + 7, D0.top + 7, e) + 45 * Math.sin(Math.PI * Math.min(1, kb)), mezcla(D1.z, D0.z, e)); corona.rotation.set(Math.PI / 2, 0, giro); corona.scale.setScalar(mezcla(SN / 1.3, 1, e)); }
        else if (kh > 0) { const e = E.vivo(kh); pI.set(mezcla(D0.x, D1.x, e), mezcla(D0.top - 1, D1.top + 7, e) + 45 * Math.sin(Math.PI * Math.min(1, kh)), mezcla(D0.z, D1.z, e)); corona.rotation.set(Math.PI / 2 + 0.5 * (1 - e), 0, giro); corona.scale.setScalar(mezcla(1, SN / 1.3, e)); }
        else { const e = E.rebote(kc), c = caida(kf); pI.set(D0.x, mezcla(D0.top + 7 + 70 * (1 - e), D0.top - 1, c), D0.z); corona.rotation.set(Math.PI / 2 + 0.5 * c, 0, giro * (1 - c)); corona.scale.setScalar(Math.max(0.001, Math.min(1.2, e))); }
        corona.position.copy(pI); corona.position.y += 1.2 * Math.sin(reloj * 2);
      }
      // la memoria: cada trozo baja del punto a su neurona (o, en el relevo, salta desde su otra copia)
      TROZOS.forEach((T, n) => {
        const k = tramo(u, T.t0, T.t0 + 0.012); let s = 0;
        if (k > 0) {
          const e = E.eio(k), de = T.de || vP, h = T.de ? 40 : 30;
          pI.set(mezcla(de.x, T.a.x, e), mezcla(de.y, T.a.y, e) + h * Math.sin(Math.PI * k), mezcla(de.z, T.a.z, e)); s = Math.min(1, E.vivo(k) * 1.1);
          if (T.d === 0) s *= 1 - E.eo(tramo(u, NEU.cae + 0.002, NEU.cae + 0.01));   // los de la 0 se pierden con ella
        }
        qI.setFromAxisAngle(eY, reloj * 0.4 + n); sI.setScalar(Math.max(0.001, s)); mI.compose(pI, qI, sI); cubos.setMatrixAt(n, mI);
      });
      cubos.instanceMatrix.needsUpdate = true; cubos.visible = u > TROZOS[0].t0;
      // la 0: más viva cuando es la principal, apagada mientras está caída
      const lider0 = E.eo(tramo(u, NEU.elige, NEU.elige + 0.012)) * (1 - E.eo(tramo(u, NEU.cae, NEU.cae + 0.006))) + E.eo(tramo(u, NEU.devuelve + 0.006, NEU.devuelve + 0.014));
      const lat = latido(reloj), l = viva0 * Math.min(1.6, 0.45 + (0.25 + 0.75 * (1 - sinRed)) * lat + destello + 0.6 * Math.min(1, lider0));
      ledMat.color.copy(MENTA).multiplyScalar(0.06 + 0.94 * Math.min(1, l));
      ledHalo.scale.setScalar(14 + 26 * l); ledHalo.material.opacity = Math.min(1, 0.6 * l);
      luzN.intensity = apagon * (0.5 + 1.6 * lat + destello);
    },
  };
  return cap;
});

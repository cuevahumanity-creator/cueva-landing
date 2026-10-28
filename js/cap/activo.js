// ─────────────────────────────────────────────────────────────────────
//  Capítulo «activo»: la biografía verdadera de la pieza #406 (losa J8 de Piedrahita).
//  1. La losa baja colgada de la grúa de la fábrica hasta el foco y gira despacio para
//     dejarse ver. En una esquina, bajo el hormigón, brilla su etiqueta (cian): va dentro
//     desde el vertido. Llega el punto ámbar, la toca y la lee.
//  2. Entra el camión, la grúa la posa en la caja y el punto deja la lectura 1 en la cinta del
//     tiempo, en el suelo. Luego salta de lectura en lectura: las 15 de la fábrica (ion),
//     espaciadas como pasaron de verdad (parejas al segundo, media hora sin nada, el arco final).
//  3. La carretera: el camión se agacha, arranca y la cámara lo sigue por una cinta discontinua
//     y vacía. Ahí no hubo lecturas y no se pinta ninguna; el punto viaja apagado sobre la losa.
//  4. La obra, al compás de las 18 lecturas (menta): el camión cabecea al frenar, la grúa
//     descarga la losa, el camión se va (lectura 20), pasa la noche en acopio; el 18 la iza, se
//     mece, gira un poco en su cable y se posa en sus apoyos; el 19, el aro de certificación.
//  5. Plano general de la cinta entera; las 33 lecturas suben y se enlazan, una tras otra, en
//     una cadena de 33 eslabones sobre la losa. Reacciona al sello (window.SELLO): la comprobación
//     recorre la cadena y, desde la lectura rota, los eslabones se sueltan, caen con muelle y se
//     vuelven coral; el enlace roto se cae y la alterada parpadea. Al restaurar, vuelven a menta.
//  Todo es función de u (y del reloj para lo que respira), salvo los muelles del sello, que
//  siempre acaban en el estado que dice SELLO. Las cifras salen de PIEZA406.
// ─────────────────────────────────────────────────────────────────────
CUEVA.capitulo('activo', (ctx) => {
  const { T3, E, mezcla, tramo, COL, esmalte, estudio, punto, cuerda, mirar } = ctx;
  const P = window.PIEZA406, LEC = P.lecturasLista, N = LEC.length;
  const escena = new T3.Scene(), camara = new T3.PerspectiveCamera(30, 1, 1, 10000);
  const plato = estudio(escena), FOCO = plato.clave.intensity, pt = punto(escena);
  const sen = Math.sin, cos = Math.cos, PI = Math.PI;
  const azar = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const pico = (u, a, b) => Math.sin(PI * tramo(u, a, b));             // sube y baja entre a y b
  const V = (x = 0, y = 0, z = 0) => new T3.Vector3(x, y, z);

  // ── medidas reales: 1 m son 50 unidades ──
  const M = 50, LL = P.dimensiones[0] * M, AN = P.dimensiones[1] * M, GR = P.dimensiones[2] * M;   // 314 × 112,5 × 13
  const BED = 70, TACO = 8, YCAMION = BED + TACO + GR / 2;              // centro de la losa sobre la caja del camión
  const ESL = 150, HANG = ESL + GR / 2;                                // del gancho a la cara de arriba, y al centro
  const SUP = 75, ZR = 190, RB = 6.4;                                  // alto de los apoyos; la cinta del tiempo; radio de una lectura

  // ── el tiempo de verdad: minutos desde la primera lectura ──
  const seg = (h) => { const [f, r] = h.split(' '), [a, m, d] = f.split('-').map(Number), [hh, mm, ss = 0] = r.split(':').map(Number); return Date.UTC(a, m - 1, d, hh, mm, ss) / 1000; };
  const T0 = seg(LEC[0].hora), minuto = (h) => (seg(h) - T0) / 60, MIN = LEC.map((l) => minuto(l.hora));
  const NF = LEC.filter((l) => l.lugar === 'fabrica').length;

  // ── la cinta: dónde cae cada lectura (BX) y en qué u se lee (UL) ──
  //  fábrica: 7 unidades por minuto; carretera: un tramo largo y vacío; obra: un tramo por día.
  const BX = new Float32Array(N), UL = new Float32Array(N), HUECO = 13;
  for (let i = 0; i < NF; i++) BX[i] = i ? Math.max(-215 + MIN[i] * 7, BX[i - 1] + HUECO) : -215;
  const XR0 = BX[NF - 1] + 34, CARRETERA = 2100, XR1 = XR0 + CARRETERA, XS = XR1 + 220;
  const DIAS = [];
  for (let i = NF; i < N; i++) { const d = LEC[i].hora.slice(0, 10), D = DIAS.at(-1); if (!D || D.d !== d) DIAS.push({ d, i0: i, i1: i }); else D.i1 = i; }
  DIAS.forEach((D, k) => { const x0 = k ? BX[D.i0 - 1] + 56 : XR1 + 20; for (let i = D.i0; i <= D.i1; i++) BX[i] = i > D.i0 ? Math.max(x0 + (MIN[i] - MIN[D.i0]) * 1.25, BX[i - 1] + HUECO) : x0; });
  UL[0] = 0.176;                                                       // la lectura 1 llega a la cinta con el punto
  for (let i = 1; i < NF; i++) UL[i] = Math.max(0.19 + 0.13 * (MIN[i] - MIN[0]) / (MIN[NF - 1] - MIN[0]), UL[i - 1] + 0.0025);
  const VENT = [[0.522, 0.572], [0.602, 0.638], [0.646, 0.664]];        // cada día de obra, su tramo de u, al minuto
  const uObra = (h) => { const k = DIAS.findIndex((D) => D.d === h.slice(0, 10)); if (k < 0) return 1; const D = DIAS[k], Vn = VENT[Math.min(k, VENT.length - 1)], a = MIN[D.i0], b = MIN[D.i1]; return mezcla(Vn[0], Vn[1], b > a ? (minuto(h) - a) / (b - a) : 0); };
  for (let i = NF; i < N; i++) UL[i] = Math.max(uObra(LEC[i].hora), UL[i - 1] + 0.0018);
  // los momentos que cuentan los datos: el camión se va de la obra, la ventana de instalación y la certificación
  const vaSe = LEC.find((l) => l.lugar === 'obra' && /SALIDA DEL CAMI/i.test(l.nota));
  const U_VA = vaSe ? uObra(vaSe.hora) : 0.56, U_IZA = uObra(P.instalacion.inicio), U_POSA = uObra(P.instalacion.fin), U_CERT = uObra(P.instalacion.certificacion);
  const U_SAL = UL[NF - 1] + 0.01, U_LLE = 0.515;                      // salida de la nave y llegada a la obra
  const UA = new Float32Array(N); for (let i = 0; i < N; i++) UA[i] = 0.725 + 0.075 * i / (N - 1);   // cuándo se engancha cada eslabón

  // la grúa de la obra, paso a paso
  const S = { baja: 0.527, llega: 0.546, engancha: 0.551, tensa: 0.5545, sube: 0.5625 };
  S.aco0 = U_VA + 0.021; S.aco1 = S.aco0 + 0.0105;                     // baja al acopio cuando el camión ya no está debajo
  S.tensa2 = Math.max(S.aco1 + 0.006, U_IZA - 0.0035); S.alto = U_IZA + 0.009;
  S.tr0 = U_IZA + 0.006; S.tr1 = U_POSA - 0.009; S.baja2 = U_POSA - 0.012; S.suelta = U_POSA + 0.003;
  const X_INST = XS + 130, Z_INST = -250, XACO = XS + 12;

  // ── utilidades de forma ──
  function normalesSuaves(g, grados = 40) {                              // normales suaves en los cantos, vivas en las caras
    const p = g.attributes.position, n = p.count / 3, fn = new Float32Array(n * 3), cl = Math.cos(grados * PI / 180), mapa = new Map();
    const a = V(), b = V(), c = V(), clave = (q) => `${Math.round(p.getX(q) * 100)},${Math.round(p.getY(q) * 100)},${Math.round(p.getZ(q) * 100)}`;
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
  // caja de cantos redondeados: w × h en el plano, d de fondo (z); b el radio del canto
  function redonda(w, h, d, b = 2, rc = 1) {
    const sw = w / 2 - b, sh = h / 2 - b, r = Math.max(0.01, Math.min(rc, sw * 0.9, sh * 0.9)), s = new T3.Shape();
    s.moveTo(-sw + r, -sh); s.lineTo(sw - r, -sh); s.quadraticCurveTo(sw, -sh, sw, -sh + r); s.lineTo(sw, sh - r); s.quadraticCurveTo(sw, sh, sw - r, sh);
    s.lineTo(-sw + r, sh); s.quadraticCurveTo(-sw, sh, -sw, sh - r); s.lineTo(-sw, -sh + r); s.quadraticCurveTo(-sw, -sh, -sw + r, -sh);
    const g = new T3.ExtrudeGeometry(s, { depth: Math.max(0.1, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 3 });
    g.translate(0, 0, -(d - 2 * b) / 2); return normalesSuaves(g);
  }
  function lienzo(w, h, pinta) { const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; }
  const halo = (r, g, b) => lienzo(128, 128, (x) => { const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(0.18, `rgba(${r},${g},${b},.38)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); });
  const malla = (g, m, padre = escena, sombra = true) => { const o = new T3.Mesh(g, m); o.castShadow = sombra; o.receiveShadow = true; padre.add(o); return o; };

  // ── materiales ──
  //  el hormigón: esmalte claro, algo más áspero que las letras, con nubes y poros muy suaves
  const txHormigon = lienzo(256, 256, (x, w, h) => {
    x.fillStyle = '#e8eaee'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) {
      const cx = azar(i) * w, cy = azar(i + 99) * h, r = 10 + azar(i + 7) * 46, os = azar(i + 3) < 0.55;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r);
        g.addColorStop(0, os ? 'rgba(140,146,160,.11)' : 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(140,146,160,0)'); x.fillStyle = g; x.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2);
      }
    }
    for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(70,76,90,${0.1 + azar(i + 500) * 0.25})`; const s = azar(i + 900) < 0.85 ? 1 : 2; x.fillRect(azar(i + 200) * w, azar(i + 300) * h, s, s); }
  });
  txHormigon.wrapS = txHormigon.wrapT = T3.RepeatWrapping; txHormigon.repeat.set(1 / 150, 1 / 150); txHormigon.anisotropy = 4;
  const matHormigon = esmalte(0xffffff, { map: txHormigon, bumpMap: txHormigon, bumpScale: 0.6, roughness: 0.56, clearcoat: 0.28, clearcoatRoughness: 0.42 });
  const matBlanco = esmalte(COL.blanco);
  const matChasis = new T3.MeshStandardMaterial({ color: 0x171b24, roughness: 0.5, metalness: 0.3 }), matCaja = esmalte(0x2a303c, { roughness: 0.42, clearcoat: 0.6 });
  const matCristal = new T3.MeshPhysicalMaterial({ color: 0x070b12, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 });
  const matGoma = new T3.MeshStandardMaterial({ color: 0x0d1014, roughness: 0.85 }), matLlanta = new T3.MeshStandardMaterial({ color: 0xa3abb9, roughness: 0.3, metalness: 0.75 });
  const matMadera = new T3.MeshStandardMaterial({ color: 0x2e2925, roughness: 0.9 }), matAcero = new T3.MeshStandardMaterial({ color: COL.cuerda, roughness: 0.32, metalness: 0.75 });
  // las lecturas y los eslabones: esmalte que se ilumina con el color de cada instancia
  const luce = (k) => { const m = esmalte(0xffffff, { emissive: 0xffffff, emissiveIntensity: k, roughness: 0.3 }); m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n\ttotalEmissiveRadiance *= vColor.rgb;\n#endif'); }; return m; };
  const matCuenta = luce(0.75), matEslabon = luce(0.32);

  // ── la losa #406, su etiqueta embebida, sus argollas y su marca ──
  const losa = new T3.Group(); escena.add(losa);
  const gLosa = redonda(LL, AN, GR, 1.3, 2); gLosa.rotateX(-PI / 2);
  malla(gLosa, matHormigon, losa);
  const CHIP = V(LL / 2 - 26, GR / 2, AN / 2 - 22);                     // la etiqueta, en una esquina, desde el vertido
  const ventana = malla(new T3.CircleGeometry(7.5, 40), new T3.MeshPhysicalMaterial({ color: 0x08141c, roughness: 0.12, clearcoat: 1, envMapIntensity: 1.2 }), losa, false);
  ventana.rotation.x = -PI / 2; ventana.position.copy(CHIP).y += 0.12;
  const matChip = new T3.MeshStandardMaterial({ color: COL.cian, emissive: COL.cian, emissiveIntensity: 1, roughness: 0.4 });
  const chip = malla(new T3.BoxGeometry(6.4, 0.5, 4), matChip, losa, false); chip.position.copy(CHIP).y += 0.2;
  const brilloChip = new T3.Sprite(new T3.SpriteMaterial({ map: halo(86, 220, 230), blending: T3.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); brilloChip.position.copy(CHIP).y += 2.5; losa.add(brilloChip);
  const luzChip = new T3.PointLight(COL.cian, 0, 150, 0); luzChip.position.copy(CHIP).y += 10; losa.add(luzChip);
  const aroChip = new T3.Mesh(new T3.TorusGeometry(1, 0.03, 6, 72), new T3.MeshBasicMaterial({ color: COL.cian, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: 0 }));
  aroChip.rotation.x = PI / 2; aroChip.position.copy(CHIP).y += 0.6; losa.add(aroChip);
  const LP = [V(94, GR / 2, 34), V(94, GR / 2, -34), V(-94, GR / 2, 34), V(-94, GR / 2, -34)];   // argollas de izado, a un quinto de cada extremo
  const argollas = new T3.InstancedMesh(new T3.TorusGeometry(3.4, 0.75, 6, 14, PI), matAcero, 4); losa.add(argollas);
  { const m = new T3.Matrix4(); LP.forEach((p, k) => argollas.setMatrixAt(k, m.makeTranslation(p.x, p.y, p.z))); }
  for (const p of LP) p.y += 3.4;
  const txMarca = lienzo(512, 128, (x) => { x.textBaseline = 'middle'; x.font = '700 78px Inter'; x.fillStyle = 'rgba(27,41,81,.8)'; x.fillText(P.id, 8, 66); const w = x.measureText(P.id).width; x.font = '500 46px Inter'; x.fillStyle = 'rgba(27,41,81,.55)'; x.fillText(P.elemento.replace('.', ','), 30 + w, 70); });
  const marca = new T3.Mesh(new T3.PlaneGeometry(84, 21), new T3.MeshStandardMaterial({ map: txMarca, transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  marca.rotation.x = -PI / 2; marca.position.set(-LL / 2 + 62, GR / 2 + 0.15, AN / 2 - 20); losa.add(marca);

  // ── el camión: caja y cabina de esmalte, chasis oscuro; la carrocería cabecea, las ruedas no ──
  const camion = new T3.Group(), caja = new T3.Group(); camion.add(caja); escena.add(camion);
  // la caja, oscura, para que la losa blanca destaque; la cabina, de esmalte y redonda como un juguete
  malla(redonda(390, 9, 126, 2, 1), matCaja, caja).position.set(0, BED - 4.5, 0);
  malla(redonda(116, 128, 126, 15, 12), matBlanco, caja).position.set(259, 113, 0);
  malla(redonda(54, 38, 127, 3, 3), matCristal, caja, false).position.set(291, 146, 0);
  malla(redonda(10, 64, 120, 3, 2), matCaja, caja).position.set(190, BED + 32, 0);           // el cabecero que protege la cabina
  malla(redonda(532, 16, 90, 2, 1), matChasis, caja).position.set(60, 40, 0);
  malla(redonda(12, 22, 124, 4, 3), matCaja, caja).position.set(326, 44, 0);
  const guardabarros = new T3.InstancedMesh(redonda(120, 5, 26, 2, 1), matCaja, 2); guardabarros.castShadow = true; caja.add(guardabarros);
  { const m = new T3.Matrix4(); guardabarros.setMatrixAt(0, m.makeTranslation(-144, 54, 52)); guardabarros.setMatrixAt(1, m.makeTranslation(-144, 54, -52)); }
  const faros = new T3.InstancedMesh(new T3.BoxGeometry(2, 8, 18), new T3.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2dc, emissiveIntensity: 1.4 }), 2); caja.add(faros);
  { const m = new T3.Matrix4(); faros.setMatrixAt(0, m.makeTranslation(324.5, 74, 44)); faros.setMatrixAt(1, m.makeTranslation(324.5, 74, -44)); }
  const gTaco = redonda(10, TACO, 120, 1, 0.5);
  const tacosCamion = new T3.InstancedMesh(gTaco, matMadera, 2); tacosCamion.castShadow = tacosCamion.receiveShadow = true; caja.add(tacosCamion);
  { const m = new T3.Matrix4(); tacosCamion.setMatrixAt(0, m.makeTranslation(-100, BED + TACO / 2, 0)); tacosCamion.setMatrixAt(1, m.makeTranslation(100, BED + TACO / 2, 0)); }
  const RR = 24, EJES = [-118, -170, 262];
  const ruedas = new T3.InstancedMesh(new T3.CylinderGeometry(RR, RR, 20, 28).rotateX(PI / 2), matGoma, 6), bujes = new T3.InstancedMesh(new T3.CylinderGeometry(11, 11, 21, 6).rotateX(PI / 2), matLlanta, 6);
  ruedas.castShadow = true; camion.add(ruedas, bujes);

  // ── la obra: los apoyos de su sitio y los tacos del acopio ──
  const apoyos = new T3.InstancedMesh(redonda(24, SUP, 150, 1.5, 1), matHormigon, 2); apoyos.castShadow = apoyos.receiveShadow = true; escena.add(apoyos);
  { const m = new T3.Matrix4(); apoyos.setMatrixAt(0, m.makeTranslation(X_INST - LL / 2 + 16, SUP / 2, Z_INST)); apoyos.setMatrixAt(1, m.makeTranslation(X_INST + LL / 2 - 16, SUP / 2, Z_INST)); }
  const tacosAcopio = new T3.InstancedMesh(gTaco, matMadera, 2); tacosAcopio.castShadow = tacosAcopio.receiveShadow = true; escena.add(tacosAcopio);
  { const m = new T3.Matrix4(); tacosAcopio.setMatrixAt(0, m.makeTranslation(XACO - 100, TACO / 2, 0)); tacosAcopio.setMatrixAt(1, m.makeTranslation(XACO + 100, TACO / 2, 0)); }

  // ── la grúa: cable, pasteca con gancho y cuatro eslingas ──
  const gancho = new T3.Group(); escena.add(gancho);
  malla(redonda(22, 30, 16, 3, 2), matAcero, gancho).position.set(0, 24, 0);
  const una = malla(new T3.TorusGeometry(6, 1.7, 10, 24, PI * 1.5), matAcero, gancho); una.position.set(0, 3, 0); una.rotation.z = PI * 0.75;
  const cable = cuerda(escena, { opacidad: 0.85 }), eslingas = [0, 1, 2, 3].map(() => cuerda(escena, { opacidad: 0.8 }));
  const SLING = Math.hypot(ESL - 3.4, 94, 34);
  const CUELGA = [V(9, -64, 7), V(8, -66, -8), V(-7, -62, 8), V(-9, -65, -6)];   // eslingas sueltas, colgando del gancho

  // ── la cinta del tiempo: fábrica (ion), carretera discontinua y vacía, obra (menta) ──
  const gTira = new T3.BoxGeometry(1, 0.5, 2.4).translate(0.5, 0.25, 0);
  const matTiraF = new T3.MeshBasicMaterial({ color: COL.ion, transparent: true, opacity: 0.8 }), matTiraO = new T3.MeshBasicMaterial({ color: COL.menta, transparent: true, opacity: 0.8 });
  const tiraF = new T3.Mesh(gTira, matTiraF), tiraO = new T3.Mesh(gTira, matTiraO); tiraF.position.set(BX[0], 0, ZR); tiraO.position.set(BX[NF], 0, ZR); escena.add(tiraF, tiraO);
  const ND = Math.floor(CARRETERA / 36), matRaya = new T3.MeshBasicMaterial({ color: COL.niebla, transparent: true, opacity: 0.55 });
  const rayas = new T3.InstancedMesh(new T3.BoxGeometry(16, 0.5, 2.4).translate(0, 0.25, 0), matRaya, ND); rayas.frustumCulled = false; escena.add(rayas);
  // la ruta de la carretera (PIEZA406.ruta): una S dibujada en el suelo; la cinta del tiempo va a su lado, vacía
  const XA = XR0 - 60, XB = XR1 - 260, ZAMP = 430;
  function rutaZ(x) { const s = tramo(x, XA, XB); return ZAMP * sen(2 * PI * s) * sen(PI * s) * sen(PI * s); }
  const rutaD = (x) => (rutaZ(x + 1) - rutaZ(x - 1)) / 2, rumbo = (x) => -Math.atan(rutaD(x));
  const RAYA = []; for (let j = 0; j < ND; j++) { const x = XR0 + 18 + j * 36, dz = rutaD(x), l = Math.hypot(1, dz); RAYA.push([x - dz / l * ZR, rutaZ(x) + ZR / l, rumbo(x)]); }
  const NR = 160, gRuta = new T3.BufferGeometry(), pr = new Float32Array(NR * 18);
  for (let j = 0; j < NR; j++) {                                        // una tira fina de quads a lo largo de la ruta
    const xa = mezcla(XR0 - 160, XR1 - 120, j / NR), xb = mezcla(XR0 - 160, XR1 - 120, (j + 1) / NR), q = [];
    for (const x of [xa, xb]) { const dz = rutaD(x), l = Math.hypot(1, dz), nx = -dz / l * 3, nz = 1 / l * 3, z = rutaZ(x); q.push([x + nx, z + nz], [x - nx, z - nz]); }
    const t = [q[0], q[1], q[2], q[1], q[3], q[2]]; t.forEach((v, k) => pr.set([v[0], 0.4, v[1]], j * 18 + k * 3));
  }
  gRuta.setAttribute('position', new T3.BufferAttribute(pr, 3));
  const matRuta = new T3.MeshBasicMaterial({ color: COL.cuerda, transparent: true, opacity: 0, depthWrite: false, side: T3.DoubleSide });
  const ruta = new T3.Mesh(gRuta, matRuta); ruta.frustumCulled = false; escena.add(ruta);
  // rótulos pequeños en el suelo, con Inter: el día y la hora de la primera, los km sin lecturas y los días de obra
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], dia = (h) => `${+h.slice(8, 10)} ${MESES[+h.slice(5, 7) - 1]}`;
  function rotulo(texto, x, alto = 21) {
    const tx = lienzo(512, 96, (c, w, h) => { c.font = '500 60px Inter'; c.fillStyle = '#8A93A6'; c.textBaseline = 'middle'; c.fillText(texto, 4, h / 2 + 3); });
    const ancho = alto * 512 / 96, g = new T3.PlaneGeometry(ancho, alto).translate(ancho / 2, alto / 2, 0);   // empieza en x, delante de la cinta
    const m = new T3.Mesh(g, new T3.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 0 })); m.rotation.x = -PI / 2 + 0.55; m.position.set(x, 0.3, ZR + 30); escena.add(m); return m;
  }
  const rotulos = [{ m: rotulo(`${dia(LEC[0].hora)} ${LEC[0].hora.slice(11, 16)}`, BX[0] - 6), u: UL[0] }, ...DIAS.map((D) => ({ m: rotulo(dia(D.d), BX[D.i0] - 6), u: UL[D.i0] }))];
  // en la carretera: los km junto a la cinta vacía y el nombre de cada vía junto a la ruta, girados con ella
  const enRuta = (m, x, lado) => { const dz = rutaD(x), l = Math.hypot(1, dz); m.position.set(x - dz / l * lado, 0.3, rutaZ(x) + lado / l); m.rotation.set(-PI / 2 + 0.55, rumbo(x), 0, 'YXZ'); };
  const XKM = (XR0 + XR1) / 2 - 40; { const m = rotulo(`${P.ruta.km} km`, 0, 30); enRuta(m, XKM, ZR + 30); rotulos.push({ m, x: XKM }); }
  P.ruta.carreteras.split('+').map((c) => c.trim()).forEach((c, k, a) => { const x = mezcla(XA, XB, (k + 0.6) / (a.length + 0.2)), m = rotulo(c, 0, 30); enRuta(m, x, 95); rotulos.push({ m, x }); });

  // ── las 33 lecturas: cuentas que brillan, y luego eslabones de la cadena ──
  const cuentas = new T3.InstancedMesh(new T3.SphereGeometry(RB, 20, 14), matCuenta, N), bloques = new T3.InstancedMesh(redonda(13, 13, 13, 2.6, 1), matEslabon, N);
  const enlaces = new T3.InstancedMesh(new T3.TorusGeometry(6.2, 1.45, 8, 24), matEslabon, N - 1);
  for (const im of [cuentas, bloques, enlaces]) { im.instanceMatrix.setUsage(T3.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = im !== cuentas; escena.add(im); for (let i = 0; i < im.count; i++) im.setColorAt(i, new T3.Color(COL.menta)); }
  const gBrillo = new T3.BufferGeometry(); gBrillo.setAttribute('position', new T3.BufferAttribute(new Float32Array(N * 3), 3)); gBrillo.setAttribute('color', new T3.BufferAttribute(new Float32Array(N * 3), 3));
  const matBrillo = new T3.PointsMaterial({ size: 48, map: halo(255, 255, 255), vertexColors: true, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, sizeAttenuation: true });
  const brillos = new T3.Points(gBrillo, matBrillo); brillos.frustumCulled = false; escena.add(brillos);
  const BASE = LEC.map((l) => new T3.Color(l.lugar === 'fabrica' ? COL.ion : COL.menta)), C_MENTA = new T3.Color(COL.menta), C_CORAL = new T3.Color(COL.coral), C_BLANCO = new T3.Color(0xffffff);
  // qué pieza, quién la lee, dónde y cuándo: un hilo de luz de la etiqueta a la lectura
  const gLinea = new T3.BufferGeometry(); gLinea.setAttribute('position', new T3.BufferAttribute(new Float32Array(6), 3));
  const linea = new T3.Line(gLinea, new T3.LineBasicMaterial({ color: COL.ion, transparent: true, opacity: 0, depthWrite: false })); linea.frustumCulled = false; escena.add(linea);
  // el aro de certificación (19 de junio) y su luz
  const aroCert = new T3.Mesh(new T3.TorusGeometry(1, 0.012, 6, 120), new T3.MeshBasicMaterial({ color: COL.menta, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, opacity: 0 }));
  aroCert.rotation.x = PI / 2; aroCert.position.set(X_INST, 1.5, Z_INST); escena.add(aroCert);
  const luzCert = new T3.PointLight(COL.menta, 0, 520, 0); luzCert.position.set(X_INST, 260, Z_INST + 80); escena.add(luzCert);

  const luzOla = new T3.PointLight(COL.menta, 0, 240, 0); escena.add(luzOla);   // la luz que recorre la cadena al comprobarla

  // ── el pasaporte: una tarjeta de esmalte que sale de la etiqueta al quedar instalada; solo campos de PIEZA406 ──
  const coma = (v) => String(v).replace('.', ',');
  const FILAS = [['Elemento', `${P.elemento.replace('.', ',')}, ${P.descripcion.toLowerCase()}`], ['Medidas', `${P.dimensiones.map(coma).join(' × ')} m`], ['Volumen', `${coma(P.volumen)} m³`],
    ['Etiqueta RFID', P.rfid], ['Obra', P.obra], ['Lecturas', `${P.resumen.lecturas}: ${P.resumen.fabrica} en fábrica y ${P.resumen.obra} en obra`],
    ['Instalada', `${dia(P.instalacion.inicio)}, de ${P.instalacion.inicio.slice(11, 16)} a ${P.instalacion.fin.slice(11, 16)}`]];
  const TW = 240, TH = 168, TCX = 1024, TCY = Math.round(1024 * TH / TW);
  const fila = (x, k, y, a, b, cb = '#1B2951') => { x.font = '500 30px Inter'; x.fillStyle = '#7a8397'; x.fillText(a, 60, y); x.font = `${k ? 600 : 600} 32px Inter`; x.fillStyle = cb; x.fillText(b, 330, y); };
  const txPas = lienzo(TCX, TCY, (x, w, h) => {
    x.textBaseline = 'alphabetic';
    x.fillStyle = '#00D4AA'; x.beginPath(); x.arc(70, 72, 9, 0, PI * 2); x.fill();
    x.font = '500 30px Inter'; x.fillStyle = '#7a8397'; x.fillText('Pasaporte digital', 92, 82);
    x.font = '760 124px Inter'; x.fillStyle = '#1B2951'; x.fillText(P.id, 54, 214);
    x.fillStyle = 'rgba(27,41,81,.12)'; x.fillRect(60, 252, w - 120, 2);
    FILAS.forEach(([a, b], k) => fila(x, k, 310 + k * 54, a, b));
  });
  const txCert = lienzo(TCX, 80, (x) => { x.textBaseline = 'alphabetic'; fila(x, 1, 52, 'Certificada', dia(P.instalacion.certificacion), '#00A887'); });   // sin hora: las fuentes no coinciden en ella
  const tarjeta = new T3.Group(); escena.add(tarjeta);
  malla(redonda(TW, TH, 4, 1.8, 9), esmalte(COL.blanco, { emissive: 0xffffff, emissiveIntensity: 0.32 }), tarjeta, true);
  const caraPas = new T3.Mesh(new T3.PlaneGeometry(TW, TH), new T3.MeshBasicMaterial({ map: txPas, transparent: true, depthWrite: false })); caraPas.position.z = 2.15; tarjeta.add(caraPas);
  const filaCert = new T3.Mesh(new T3.PlaneGeometry(TW, TW * 80 / TCX), new T3.MeshBasicMaterial({ map: txCert, transparent: true, depthWrite: false, opacity: 0 }));
  filaCert.position.set(0, TH / 2 - (310 + 7 * 54 - 12) * TH / TCY, 2.25); tarjeta.add(filaCert);
  const gHilo = new T3.BufferGeometry(); gHilo.setAttribute('position', new T3.BufferAttribute(new Float32Array(6), 3));
  const hilo = new T3.Line(gHilo, new T3.LineBasicMaterial({ color: COL.cian, transparent: true, opacity: 0, depthWrite: false })); hilo.frustumCulled = false; escena.add(hilo);
  const U_PAS = U_POSA + 0.005;                                         // sale cuando la losa ya está en su sitio

  // ── la casa, una huella ──
  //  Las 29 piezas de Piedrahita (DATOS.PIEDRAHITA) sueltan su huella sobre la cubierta real de la casa (DATOS.ATLAS:
  //  10,50 × 6,00 m en cuatro J8 de 2,25 y una de 1,5). Las huellas se unen de dos en dos, nivel a nivel, en pocos
  //  latidos grandes, hasta quedar una sola: la de la casa, que el punto sella en ámbar. La #406 llega de su cadena,
  //  en menta. Dónde nace cada huella sobre la cubierta es ilustrativo: el despiece completo no está publicado.
  const D = ctx.DATOS || {}, NP = +(((D.PIEDRAHITA && D.PIEDRAHITA.cifras) || []).find((c) => c[1] === 'piezas') || [0, 29])[0] || 29;
  const PLANTA = ((D.ATLAS && D.ATLAS.plantas) || []).find((q) => q.k === 'piedrahita') || { w: 10.5, h: 6, bandas: [2.25, 2.25, 2.25, 2.25, 1.5] };
  const I406 = (NP - 1) >> 1;
  const NIV = [NP]; while (NIV.at(-1) > 1) NIV.push(Math.ceil(NIV.at(-1) / 2));
  const NL = NIV.length, BASEN = []; { let a = 0; for (const n of NIV) { BASEN.push(a); a += n; } }
  const NN = BASEN[NL - 1] + 1, NX = new Float32Array(NN), NY = new Float32Array(NN), NZ = new Float32Array(NN), NV = new Uint8Array(NN);
  const PADRE = new Int16Array(NN).fill(-1); for (let L = 0; L < NL - 1; L++) for (let i = 0; i < NIV[L]; i++) PADRE[BASEN[L] + i] = BASEN[L + 1] + (i >> 1);
  const CAMINO = new Uint8Array(NN); { let n = I406; CAMINO[n] = 1; while (PADRE[n] >= 0) { n = PADRE[n]; CAMINO[n] = 1; } }
  const XM = X_INST + 1300, ZM = Z_INST, YF = 40, TAPA = YF + GR + 1, R0 = NN - 1;
  const ARBOL = { x: XM, z: ZM, dy: 70, hs: 1 };
  const SX = new Float32Array(NP * 3);                                  // de dónde sale cada huella, en la cubierta
  function colocarArbol() {
    for (let i = 0; i < NP; i++) {
      const q = (i + 0.5) / NP - 0.5, es = i === I406;
      NX[i] = XM + q * PLANTA.w * M * 0.9; NZ[i] = es ? ZM + 90 : ZM + (azar(i + 40) - 0.5) * PLANTA.h * M * 0.72; NY[i] = TAPA + 64 + (es ? 26 : 22 * azar(i + 80)); NV[i] = 0;
      SX[i * 3] = NX[i]; SX[i * 3 + 1] = TAPA + 1; SX[i * 3 + 2] = NZ[i];
    }
    for (let L = 1; L < NL; L++) for (let i = 0; i < NIV[L]; i++) {
      const n = BASEN[L] + i, a = BASEN[L - 1] + 2 * i, b = Math.min(a + 1, BASEN[L - 1] + NIV[L - 1] - 1);
      NV[n] = L; NX[n] = (NX[a] + NX[b]) / 2; NZ[n] = mezcla((NZ[a] + NZ[b]) / 2, ZM + 30, 0.4); NY[n] = TAPA + 64 + L * ARBOL.dy + (n === R0 ? 34 : 0);
    }
  }
  colocarArbol();
  // la cubierta, en sus bandas reales y algo separadas; brilla entera cuando se sella la huella
  const matForjado = esmalte(0xffffff, { map: txHormigon, bumpMap: txHormigon, bumpScale: 0.6, roughness: 0.56, clearcoat: 0.28, clearcoatRoughness: 0.42, emissive: COL.menta, emissiveIntensity: 0 });
  const BANDAS = PLANTA.bandas || [PLANTA.w], forjado = new T3.InstancedMesh(redonda(1, 1, 1, 0.02, 0.02), matForjado, BANDAS.length);
  forjado.castShadow = forjado.receiveShadow = true; forjado.instanceMatrix.setUsage(T3.DynamicDrawUsage); escena.add(forjado);
  const BX0 = new Float32Array(BANDAS.length); { let x = XM - PLANTA.w * M / 2 - (BANDAS.length - 1) * 3; BANDAS.forEach((b, k) => { BX0[k] = x + b * M / 2; x += b * M + 6; }); }
  // las huellas: esferas que brillan con su halo; las estelas, el camino que dejan al juntarse
  const motas = new T3.InstancedMesh(new T3.SphereGeometry(1, 22, 16), matCuenta, NN);
  const estelas = new T3.InstancedMesh(new T3.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, blending: T3.AdditiveBlending }), NN - 1);
  for (const im of [motas, estelas]) { im.instanceMatrix.setUsage(T3.DynamicDrawUsage); im.frustumCulled = false; for (let i = 0; i < im.count; i++) im.setColorAt(i, new T3.Color(COL.menta)); escena.add(im); }
  const gHalo = new T3.BufferGeometry(); gHalo.setAttribute('position', new T3.BufferAttribute(new Float32Array(NN * 3), 3)); gHalo.setAttribute('color', new T3.BufferAttribute(new Float32Array(NN * 3), 3));
  const halos = new T3.Points(gHalo, new T3.PointsMaterial({ size: 60, map: halo(255, 255, 255), vertexColors: true, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, sizeAttenuation: true }));
  halos.frustumCulled = false; escena.add(halos);
  // la huella de la casa: un anillo de esmalte grande, y dentro el sello ámbar
  const raiz = new T3.Group(); escena.add(raiz);
  const matRaiz = esmalte(COL.blanco, { emissive: COL.menta, emissiveIntensity: 0.2 });
  malla(new T3.TorusGeometry(36, 4.2, 20, 96), matRaiz, raiz, false);
  const matSello = new T3.MeshBasicMaterial({ color: COL.ambar, transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending });
  const sello = new T3.Mesh(new T3.TorusGeometry(25, 1.6, 12, 96), matSello); raiz.add(sello);
  const matOnda = new T3.MeshBasicMaterial({ color: COL.ambar, transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending });
  const onda = new T3.Mesh(new T3.TorusGeometry(36, 0.9, 8, 120), matOnda); raiz.add(onda);
  const haloRaiz = new T3.Sprite(new T3.SpriteMaterial({ map: halo(0, 212, 170), color: 0xffffff, blending: T3.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); raiz.add(haloRaiz);
  // una sola etiqueta: la #406, grande y respirando junto a su huella
  const txEt = lienzo(256, 96, (x) => { x.textBaseline = 'middle'; x.font = '700 66px Inter'; x.fillStyle = '#00D4AA'; x.fillText(P.id, 14, 52); });
  const etiqueta = new T3.Sprite(new T3.SpriteMaterial({ map: txEt, transparent: true, depthWrite: false, opacity: 0, fog: false })); escena.add(etiqueta);
  const C_HUELLA = new T3.Color(0xa9dff0), C_HILO = new T3.Color(0x9fe9f0), C_ESTELA = new T3.Color(0x7fa6c4), C_AMBAR = new T3.Color(COL.ambar);
  // los tiempos de la casa (u de la sección): la cadena se condensa, nacen las huellas, se unen nivel a nivel y se sella
  const UNIV = [0, 0.785, 0.815, 0.845, 0.855, 0.865], U_CASA = 0.64, U_NACE406 = 0.672, U_NACE = 0.69;
  const U_NIV = (L) => L < UNIV.length ? UNIV[L] : UNIV.at(-1) + 0.01 * (L - UNIV.length + 1), U_ANILLO = U_NIV(NL - 1), U_SELLA = U_ANILLO + 0.028, VUELO = 0.0085;
  const vH = V(), vN = V(), vA2 = V(), vB2 = V(), vC2 = V(), vAnc = V();

  // ── las tarjetas de vidrio oscuro: pocas, grandes, ancladas a la luz que cuentan ──
  //  la #406; la pareja que se une con ella (#405, del mismo camión); el camión 2 de 5; y, al final, la casa.
  //  Solo datos de PIEZA406 y DATOS.PIEDRAHITA; la huella de la #406 es la del sello, calculada en el navegador.
  const PIE = D.PIEDRAHITA || {}, cifra = (k) => ((PIE.cifras || []).find((c) => c[1] === k) || [])[0];
  const PIEZAS_C = (P.camion && P.camion.piezas) || [], HERMANA = PIEZAS_C[PIEZAS_C.indexOf(P.id) - 1] || null;
  const gVidrio = redonda(160, 100, 3, 1.4, 12), gBorde = redonda(163.5, 103.5, 1.2, 0.5, 13.5), gCara = new T3.PlaneGeometry(160, 100);
  function vidrio(pinta) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 640; const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 4;
    const g = new T3.Group();
    const cuerpo = new T3.Mesh(gVidrio, new T3.MeshPhysicalMaterial({ color: 0x0b1320, roughness: 0.16, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.95, envMapIntensity: 1.4, emissive: 0x08141e, emissiveIntensity: 1 }));
    const borde = new T3.Mesh(gBorde, new T3.MeshBasicMaterial({ color: COL.menta, transparent: true, opacity: 0.35, depthWrite: false, blending: T3.AdditiveBlending }));
    const cara = new T3.Mesh(gCara, new T3.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
    borde.position.z = -1; cara.position.z = 1.7; borde.renderOrder = 10; cuerpo.renderOrder = 11; cara.renderOrder = 12;   // por encima de los halos: la tarjeta tapa lo que tiene detrás
    g.add(borde, cuerpo, cara); g.visible = false; escena.add(g);
    const gl = new T3.BufferGeometry(); gl.setAttribute('position', new T3.BufferAttribute(new Float32Array(6), 3));
    const linea = new T3.Line(gl, new T3.LineBasicMaterial({ color: COL.menta, transparent: true, opacity: 0, depthWrite: false })); linea.frustumCulled = false; linea.visible = false; escena.add(linea);
    const t = { g, cuerpo, borde, cara, linea };
    t.pintar = (...a) => { const x = c.getContext('2d'); x.clearRect(0, 0, 1024, 640); x.textBaseline = 'alphabetic'; pinta(x, ...a); tx.needsUpdate = true; };
    return t;
  }
  // la cabecera y las filas de una tarjeta
  function cabecera(x, punto, pequeno, grande, sub) {
    x.fillStyle = punto; x.beginPath(); x.arc(66, 70, 10, 0, PI * 2); x.fill();
    x.font = '500 30px Inter'; x.fillStyle = '#8A93A6'; x.fillText(pequeno, 90, 81);
    x.font = '760 96px Inter'; x.fillStyle = '#F4F6FA'; x.fillText(grande, 52, 182);
    if (sub) { x.font = '500 34px Inter'; x.fillStyle = '#C9D2E3'; x.fillText(sub, 56, 238); }
    x.fillStyle = 'rgba(201,210,227,.16)'; x.fillRect(56, 270, 912, 2);
  }
  function filas(x, rs) { rs.forEach(([a, b, cb, mono], k) => { const y = 330 + k * 56; x.font = '500 30px Inter'; x.fillStyle = '#8A93A6'; x.fillText(a, 56, y); x.font = mono ? '500 33px "JetBrains Mono"' : '600 34px Inter'; x.fillStyle = cb || '#F4F6FA'; x.fillText(b, 300, y); }); }
  function parrafo(x, lineas) { x.font = '500 36px Inter'; x.fillStyle = '#C9D2E3'; lineas.forEach((l, k) => x.fillText(l, 56, 336 + k * 54)); }
  const MENTA_T = '#00D4AA', CORAL_T = '#FF6B4A', CIAN_T = '#56DCE6';
  const T406 = vidrio((x, huellaTxt, roto) => {
    cabecera(x, CIAN_T, 'Pieza', P.id, `${P.elemento.replace('.', ',')}, ${P.descripcion.toLowerCase()}`);
    filas(x, [['Lecturas', `${P.resumen.lecturas}: ${P.resumen.fabrica} en fábrica y ${P.resumen.obra} en obra`], ['Viaje', `camión ${P.camion.viaje} de ${P.camion.de}`],
      ['Instalada', dia(P.instalacion.inicio)], ['Certificada', dia(P.instalacion.certificacion)],
      ['Huella', huellaTxt ? `${huellaTxt}…${roto ? '  no coincide' : ''}` : 'calculándose', roto ? CORAL_T : MENTA_T, true]]);
  });
  const TPAR = HERMANA ? vidrio((x) => {
    cabecera(x, MENTA_T, 'Se unen dos huellas', `${HERMANA} + ${P.id}`, `Viajaron juntas en el camión ${P.camion.viaje} de ${P.camion.de}`);
    parrafo(x, ['Dos huellas dan una sola.', 'Si cambia cualquiera de las dos, cambia.']);
  }) : null;
  const TCAM = PIEZAS_C.length > 2 ? vidrio((x) => {
    cabecera(x, MENTA_T, 'Se unen otra vez', `Camión ${P.camion.viaje} de ${P.camion.de}`, `${PIEZAS_C.slice(0, -1).join(', ')} y ${PIEZAS_C.at(-1)}`);
    parrafo(x, ['Las piezas del mismo viaje,', 'en una sola huella.']);
  }) : null;
  const TCASA = vidrio((x, roto, lec) => {
    const lugar = (PIE.lugar || 'Piedrahita').split(',').map((q) => q.trim());
    cabecera(x, roto ? CORAL_T : '#F59E0B', 'La casa', lugar[0], lugar[1] || '');
    const rs = [['Piezas', cifra('piezas') || String(NP)], ['Lecturas', cifra('lecturas') || '']];
    if (PIE.fechas) rs.push(['Campaña', PIE.fechas]);
    if (roto && lec) rs.push(['Huella', 'no coincide', CORAL_T], ['Cambió', `la lectura ${lec.n} de la ${P.id}`, CORAL_T], ['Dónde', `${lec.lugar === 'obra' ? 'en obra' : 'en fábrica'}, ${dia(lec.hora)}, ${lec.hora.slice(11, 16)}`, CORAL_T]);
    else rs.push(['Huella', 'una sola, sellada', '#F5B544']);
    filas(x, rs.filter((r) => r[1]));
  });
  const TARJETAS = [T406, TPAR, TCAM, TCASA].filter(Boolean);
  // repinta lo que depende del sello: la huella de la #406 (la del último eslabón del sello) y el estado de la casa
  let pintado = -2;
  function repintar() {
    const es = document.querySelectorAll('[data-cadena] .eslabon'), ult = es.length ? (es[es.length - 1].lastChild.textContent || '').trim() : '';
    const roto = SE.k < N, lec = roto ? LEC[SE.alt >= 0 ? SE.alt : SE.k] : null;
    T406.pintar(ult, roto); if (TPAR) TPAR.pintar(); if (TCAM) TCAM.pintar(); TCASA.pintar(roto, lec);
    const b = document.querySelector('[data-huella-prueba]'); if (b) b.textContent = roto ? 'Restaurar' : 'Alterar la lectura 21';
    pintado = SE.k * 100 + SE.alt + (ult ? 0 : 50);
  }
  // el botón del último compás prueba el sello desde aquí: altera o restaura la lectura 21 del bloque anterior
  { const b = document.querySelector('[data-huella-prueba]'); if (b) b.addEventListener('click', () => { const r = window.SELLO && Number.isInteger(window.SELLO.roto); const d = document.querySelector(`[data-accion="${r ? 'restaurar' : 'alterar'}"]`); if (d) d.click(); }); }
  // coloca una tarjeta junto a su luz: sale de ella con un giro y vuelve a ella al recogerse
  function ponerTarjeta(t, a, ancla, reloj, fijo = null, k = 0.0013) {
    const on = a > 0.002; t.g.visible = t.linea.visible = on; if (!on) return;
    vA2.copy(ancla).project(camara);
    let tx = vert ? 0 : Math.max(-0.5, Math.min(0.6, vA2.x + 0.5)), ty = vert ? -0.62 : Math.max(-0.55, Math.min(-0.12, vA2.y + 0.04)); const e = E.eo(Math.min(1, a));
    if (fijo && !vert) { vC2.copy(fijo).project(camara); tx = vC2.x; ty = vC2.y; vA2.z = vC2.z; }
    vB2.set(mezcla(vA2.x, tx, e), mezcla(vA2.y, ty, e), vA2.z).unproject(camara);
    vB2.lerp(camara.position, 0.42 * e);                                // más cerca de la cámara que su luz: nada la atraviesa
    const s = k * camara.position.distanceTo(vB2) * Math.max(0.01, E.vivo(Math.min(1, a)));
    t.g.position.copy(vB2); t.g.quaternion.copy(camara.quaternion); qB.setFromAxisAngle(EJE_Y, (1 - e) * 0.9 + 0.025 * sen(reloj * 0.6)); t.g.quaternion.multiply(qB); t.g.scale.setScalar(s);
    t.g.updateMatrixWorld(true); t.g.localToWorld(vC2.set(vert || fijo ? 0 : -80, vert ? 50 : fijo ? -50 : 0, 0));
    const p = t.linea.geometry.attributes.position; p.setXYZ(0, ancla.x, ancla.y, ancla.z); p.setXYZ(1, vC2.x, vC2.y, vC2.z); p.needsUpdate = true;
    const o = Math.min(1, a * 1.6); t.linea.material.opacity = 0.55 * e; t.cuerpo.material.opacity = 0.95 * o; t.cara.material.opacity = o; t.borde.material.opacity = 0.35 * o;
  }


  // ── «Cada pieza, su huella»: las 28 hermanas de la #406 en tarjetas pequeñas de vidrio ──
  //  Brotan de su luz en ola desde la #406 y se ordenan en una retícula limpia a los dos lados de su tarjeta grande;
  //  una línea va de su sitio en la cubierta a su luz y otra de su luz a su tarjeta. Al unirse las huellas, cada tarjeta
  //  vuelve por su línea a su luz y se pliega. Solo llevan número las piezas con número conocido (las del camión 2);
  //  las demás dicen «pieza», y ninguna enseña un valor de huella: la única huella real es la de la #406, la del sello.
  const NC = NP - 1, HOJA_DE = new Int16Array(NC), CELDA = new Float32Array(NC), SLOT = new Float32Array(NC * 3), VISTA = new Uint8Array(NC);
  { let k = 0; for (let i = 0; i < NP; i++) if (i !== I406) HOJA_DE[k++] = i; }
  const IDS_C = PIEZAS_C.filter((id) => id !== P.id && id !== HERMANA);  // las otras dos del camión 2
  const CON_ID = new Map(); if (HERMANA) CON_ID.set(I406 + 1, HERMANA); IDS_C.forEach((id, k) => CON_ID.set(I406 - IDS_C.length + k, id));
  const ID_CELDA = [null, ...new Set(CON_ID.values())];               // celda 0: «pieza»; las siguientes, una por número conocido
  for (let k = 0; k < NC; k++) { const id = CON_ID.get(HOJA_DE[k]); CELDA[k] = id ? ID_CELDA.indexOf(id) : 0; }
  const NCEL = ID_CELDA.length, CWW = 46, CHH = 30;
  const txAtlas = lienzo(512, 336 * NCEL, (x) => {
    ID_CELDA.forEach((id, c) => {
      const y0 = c * 336;
      x.fillStyle = '#56DCE6'; x.beginPath(); x.arc(46, y0 + 50, 12, 0, PI * 2); x.fill();
      x.font = '500 34px Inter'; x.fillStyle = '#8A93A6'; x.textBaseline = 'middle'; x.fillText(id ? `camión ${P.camion.viaje}` : 'Piedrahita', 72, y0 + 52);
      x.font = '760 92px Inter'; x.fillStyle = id ? '#F4F6FA' : '#DCE3EE'; x.fillText(id || 'pieza', 36, y0 + 150);
      x.font = '500 30px Inter'; x.fillStyle = '#8A93A6'; x.fillText('huella', 38, y0 + 252);
      x.fillStyle = 'rgba(0,212,170,.28)'; x.beginPath(); x.roundRect(150, y0 + 236, 300, 32, 16); x.fill();   // la huella, sin valor
    });
  });
  const cuerposC = new T3.InstancedMesh(redonda(CWW, CHH, 1.6, 0.8, 4.5), new T3.MeshPhysicalMaterial({ color: 0x0b1320, roughness: 0.16, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.94, envMapIntensity: 1.4, emissive: 0x0a1822, emissiveIntensity: 1 }), NC);
  const matCaraC = new T3.MeshBasicMaterial({ map: txAtlas, transparent: true, depthWrite: false });
  matCaraC.onBeforeCompile = (sh) => { sh.vertexShader = 'attribute float celda;\n' + sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>\n\tvMapUv.y = (vMapUv.y + ${(NCEL - 1).toFixed(1)} - celda) / ${NCEL.toFixed(1)};`); };
  const gCaraC = new T3.PlaneGeometry(CWW - 1.5, CHH - 1.5).translate(0, 0, 1.0); gCaraC.setAttribute('celda', new T3.InstancedBufferAttribute(CELDA, 1));
  const carasC = new T3.InstancedMesh(gCaraC, matCaraC, NC);
  const bordesC = new T3.InstancedMesh(redonda(CWW + 2, CHH + 2, 0.6, 0.3, 5.5), new T3.MeshBasicMaterial({ color: COL.menta, transparent: true, opacity: 0.3, depthWrite: false, blending: T3.AdditiveBlending }), NC);
  for (const [im, o] of [[bordesC, 8], [cuerposC, 9], [carasC, 10]]) { im.instanceMatrix.setUsage(T3.DynamicDrawUsage); im.frustumCulled = false; im.renderOrder = o; escena.add(im); }
  // las líneas: de la cubierta a la luz y de la luz a la tarjeta (dos tramos por pieza), con un leve brillo
  const gHilos = new T3.BufferGeometry(); gHilos.setAttribute('position', new T3.BufferAttribute(new Float32Array(NP * 12), 3)); gHilos.setAttribute('color', new T3.BufferAttribute(new Float32Array(NP * 12), 3));
  const hilos = new T3.LineSegments(gHilos, new T3.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: T3.AdditiveBlending })); hilos.frustumCulled = false; escena.add(hilos);
  const qC = new T3.Quaternion(), GRID = V();                           // el centro de la retícula: ahí va la tarjeta grande de la #406
  function colocarCompactas() {
    // a cada lado de la #406, columnas de tres; en vertical, solo las doce más cercanas en dos columnas por lado
    const filas = 3, cols = vert ? 2 : 5, paso = CWW + 8, alto = CHH + 9, y0 = TAPA + 150, hueco = vert ? 6 : 104;
    GRID.set(XM, y0 + alto, ZM - 20);
    for (let k = 0; k < NC; k++) {
      const i = HOJA_DE[k], izq = i < I406, d = izq ? I406 - 1 - i : i - I406 - 1;   // d: 0 la más cercana a la #406
      const col = Math.floor(d / filas), fila = d % filas; VISTA[k] = col < cols ? 1 : 0;
      const x = XM + (izq ? -1 : 1) * (hueco + CWW / 2 + col * paso);
      SLOT[k * 3] = x; SLOT[k * 3 + 1] = y0 + fila * alto; SLOT[k * 3 + 2] = ZM - 20 - 0.00035 * (x - XM) ** 2;
    }
  }

  // ── la cadena: un arco sobre la losa ya puesta ──
  const ARCO = { x: X_INST, y: SUP + GR + 34, z: Z_INST, rx: 290, ry: 170, bs: 1 };
  function arco(f, out) { const th = PI * (1 - f / (N - 1)); return out.set(ARCO.x + ARCO.rx * cos(th), ARCO.y + ARCO.ry * sen(th), ARCO.z + 34 * sen(th)); }
  const tangente = (f) => { const th = PI * (1 - f / (N - 1)); return Math.atan2(-ARCO.ry * cos(th), ARCO.rx * sen(th)); };

  // ── el camión en el tiempo ──
  function viaje(t, a, b, fa = 0.22, fd = 0.26) {                       // arranca, va y frena (velocidad en trapecio)
    const vp = 1 / (1 - fa / 2 - fd / 2);
    const s = t < fa ? vp * t * t / (2 * fa) : t < 1 - fd ? vp * (fa / 2 + t - fa) : 1 - vp * (1 - t) * (1 - t) / (2 * fd);
    return mezcla(a, b, s);
  }
  function camionX(u) {
    if (u < 0.21) { const t = tramo(u, 0.13, 0.205); return -1500 * (1 - t) * (1 - t); }
    if (u < U_VA) return viaje(tramo(u, U_SAL, U_LLE), 0, XS);
    const t = tramo(u, U_VA, U_VA + 0.045); return XS + 1800 * t * t;
  }
  const rebota = (u, a, d = 0.03) => { const q = (u - a) / d; return q < 0 ? 0 : Math.exp(-q * 4.2) * cos(q * 13); };   // el muelle de la suspensión tras un golpe
  const asienta = (u, a, d = 0.02) => { const q = (u - a) / d; return q < 0 ? 0 : 1 - Math.exp(-q * 4) * cos(q * 11); };   // pasa a otra altura con rebote
  function carroceria(u) {
    // cabeceo: morro arriba al arrancar, morro abajo al frenar y rebote al parar
    let r = 0;
    r += 0.02 * pico(u, U_SAL, U_SAL + 0.03) + 0.02 * pico(u, U_VA, U_VA + 0.03);
    r -= u < 0.205 ? 0.022 * E.seno(tramo(u, 0.17, 0.205)) : 0.022 * rebota(u, 0.205);
    r -= u < U_LLE ? 0.026 * E.seno(tramo(u, U_LLE - 0.035, U_LLE)) : 0.026 * rebota(u, U_LLE);
    caja.rotation.z = r;
    // el peso de la losa la hunde al posarla y la suelta al descargarla; en marcha, el temblor del asfalto
    const vel = Math.abs(camionX(u + 0.001) - camionX(u - 0.001)) / 0.002;
    caja.position.y = -1.8 * asienta(u, 0.245) + 1.8 * asienta(u, S.tensa) + Math.min(1, vel / 9000) * 0.5 * sen(u * 4100) * sen(u * 1500 + 1);
  }

  // ── la losa: colgada del gancho H, apoyada en el camión, en el acopio o en su sitio ──
  const H = V(), vA = V(), vB = V(), vC = V(), chipW = V(), LPW = LP.map(() => V()), EJE_Y = V(0, 1, 0), qS = new T3.Quaternion(), qY = new T3.Quaternion(), eS = new T3.Euler();
  function colgar(ax, az, psi) { eS.set(ax, 0, az); qS.setFromEuler(eS); qY.setFromAxisAngle(EJE_Y, psi); losa.quaternion.copy(qS).multiply(qY); vA.set(0, -HANG, 0).applyQuaternion(qS); losa.position.copy(H).add(vA); }
  function enCamion() { caja.localToWorld(losa.position.set(0, YCAMION, 0)); caja.getWorldQuaternion(losa.quaternion); }
  // el gancho de la obra (x, y, z) en cada u
  function ganchoObra(u, out) {
    const tr = E.eio(tramo(u, S.tr0, S.tr1)), yC = YCAMION, yA = TACO + GR / 2, yS = SUP + GR / 2;
    let y;
    if (u < S.llega) y = mezcla(3000, yC + HANG + 9, E.suave(tramo(u, S.baja, S.llega)));
    else if (u < S.tensa) y = yC + HANG + 9 - 9 * E.eio(tramo(u, S.engancha, S.tensa));
    else if (u < S.aco1) y = yC + HANG + 70 * E.eio(tramo(u, S.tensa, S.sube)) + (yA - yC - 70) * E.eio(tramo(u, S.aco0, S.aco1));
    else if (u < U_IZA) y = yA + HANG - 9 * E.eo(tramo(u, S.aco1, S.aco1 + 0.004)) + 9 * E.eio(tramo(u, S.tensa2, U_IZA));
    else if (u < U_POSA) y = yA + HANG + (210 - yA) * E.eio(tramo(u, U_IZA, S.alto)) + (yS - 210) * E.eio(tramo(u, S.baja2, U_POSA));
    else y = yS + HANG - 9 * E.eo(tramo(u, U_POSA, U_POSA + 0.003)) + 3000 * E.ei(tramo(u, S.suelta + 0.002, S.suelta + 0.022));
    return out.set(mezcla(XACO, X_INST, tr), y, mezcla(0, Z_INST, tr));
  }
  // el péndulo de la obra, calculado una vez: la losa sigue al gancho con retraso y se mece (u → segundos ×120)
  const SIM = { u0: S.tensa, du: 2e-5 }; SIM.n = Math.ceil((U_POSA - SIM.u0) / SIM.du) + 2; SIM.dx = new Float32Array(SIM.n); SIM.dz = new Float32Array(SIM.n);
  {
    let x = XS, z = 0, vx = 0, vz = 0; const w = 2.6, h = SIM.du * 120, g = V();
    for (let i = 0; i < SIM.n; i++) {
      const u = SIM.u0 + i * SIM.du; ganchoObra(u, g);
      if (u >= S.aco1 && u < U_IZA) { x = g.x; z = g.z; vx = vz = 0; }
      else {
        const cerca = Math.max(tramo(u, S.aco1 - 0.006, S.aco1), tramo(u, U_POSA - 0.007, U_POSA)), ze = 0.13 + 3 * cerca;   // al posarla, los operarios la frenan
        vx += (w * w * (g.x - x) - 2 * ze * w * vx) * h; vz += (w * w * (g.z - z) - 2 * ze * w * vz) * h; x += vx * h; z += vz * h;
      }
      SIM.dx[i] = x - g.x; SIM.dz[i] = z - g.z;
    }
  }
  function pendulo(u) { const f = Math.max(0, Math.min(SIM.n - 1.001, (u - SIM.u0) / SIM.du)), i = Math.floor(f), t = f - i; vB.x = mezcla(SIM.dx[i], SIM.dx[i + 1], t); vB.z = mezcla(SIM.dz[i], SIM.dz[i + 1], t); }
  // la vibración de las eslingas al tensarse de golpe
  const vibra = (u, a) => { const q = (u - a) / 0.006; return q < 0 || q > 2 ? 0 : 2.6 * Math.exp(-q * 2.5) * sen(q * 24); };

  // pone la losa, el gancho y las eslingas; devuelve si la grúa se ve
  let suelta = 0, vib = 0;
  function ponerLosa(u, reloj) {
    let grua = false; suelta = 1; vib = 0;
    if (u < 0.245) {                                                    // fábrica: colgada, baja al foco, gira y se posa en el camión
      const ent = E.suave(tramo(u, 0, 0.07)), baja = E.eio(tramo(u, 0.212, 0.245)), calma = 1 - baja;
      caja.localToWorld(vA.set(0, YCAMION, 0));
      H.set(mezcla(0, vA.x, baja), mezcla(mezcla(620, 300, ent) + sen(reloj * 0.9) * 3 * calma, vA.y, baja) + HANG, mezcla(0, vA.z, baja));
      const psi = -2.1 * (1 - E.seno(tramo(u, 0, 0.235))) + 0.03 * sen(reloj * 0.4) * calma;
      colgar(0.012 * sen(reloj * 1.3) * calma, 0.01 * sen(reloj * 1.05 + 1) * calma + 0.04 * (1 - ent) * sen(u * 160), psi);
      grua = true; suelta = 0;
    } else if (u < S.tensa) {
      enCamion();
      if (u < 0.33) {                                                   // la eslinga se afloja, se suelta y el gancho sube
        caja.localToWorld(H.set(0, YCAMION + HANG, 0)); H.y += -9 * E.eo(tramo(u, 0.245, 0.252)) + 2900 * E.ei(tramo(u, 0.258, 0.31));
        suelta = E.eo(tramo(u, 0.251, 0.258)); grua = true;
      } else if (u >= S.baja) {                                         // obra: baja el gancho y se engancha
        ganchoObra(u, H); suelta = u < S.llega ? 1 : 1 - E.eio(tramo(u, S.llega, S.engancha)); grua = true;
      }
    } else {
      ganchoObra(u, H); grua = u < S.suelta + 0.024; suelta = E.eo(tramo(u, S.suelta, S.suelta + 0.003));
      vib = vibra(u, S.tensa) + vibra(u, U_IZA);
      if (u < S.aco1 || (u >= U_IZA && u < U_POSA)) {                 // colgada: el péndulo y un giro suave en su cable
        pendulo(u);
        const psi = 0.11 * sen((u - U_IZA) * 150) * E.seno(tramo(u, U_IZA, U_IZA + 0.01)) * (1 - E.seno(tramo(u, U_POSA - 0.013, U_POSA - 0.002)));
        colgar(-Math.asin(Math.max(-0.14, Math.min(0.14, 0.5 * vB.z / HANG))), Math.asin(Math.max(-0.14, Math.min(0.14, 0.5 * vB.x / HANG))), psi);   // la eslinga de cuatro ramales frena el vaivén
      } else if (u < U_IZA) { losa.position.set(XACO, TACO + GR / 2, 0); losa.quaternion.identity(); }
      else { losa.position.set(X_INST, SUP + GR / 2, Z_INST); losa.quaternion.identity(); }
    }
    losa.updateMatrixWorld(true);
    losa.localToWorld(chipW.copy(CHIP));
    gancho.visible = grua && H.y < 2900;
    if (!gancho.visible) { cable.visible = false; for (const e of eslingas) e.visible = false; return; }
    gancho.position.copy(H); gancho.rotation.y = 0.3;
    cable.tender(vA.copy(H).add(vC.set(0, 38, 0)), vB.set(H.x, H.y + 3400, H.z), 0, vib * 0.4);
    for (let k = 0; k < 4; k++) {
      losa.localToWorld(LPW[k].copy(LP[k]));
      vC.copy(H).add(CUELGA[k]); vA.copy(LPW[k]).lerp(vC, suelta);
      const d = H.distanceTo(vA), comba = mezcla(Math.sqrt(Math.max(0, SLING * SLING - d * d)) * 0.45, 3, suelta);
      eslingas[k].tender(H, vA, comba, vib * (k % 2 ? 1 : -1));
    }
  }

  // ── el sello: muelles que siempre acaban donde dice SELLO ──
  const SE = { k: N, t0: -99, ml: new Uint8Array(12), mc: new Float32Array(12), vm: new Float32Array(12), kk: new Int16Array(N).fill(N), pop: new Float32Array(N).fill(-99), by: new Float32Array(N), vy: new Float32Array(N), bz: new Float32Array(N), vz: new Float32Array(N), bc: new Float32Array(N), vc: new Float32Array(N), lb: new Float32Array(N), vl: new Float32Array(N), alt: -1 };
  const VEL = 46;                                                       // eslabones por segundo que recorre la comprobación
  function sellar(reloj, dt) {
    const s = window.SELLO, k = s && Number.isInteger(s.roto) ? s.roto : N;
    SE.alt = s && Number.isInteger(s.alterada) ? s.alterada : -1;
    if (k !== SE.k) { SE.k = k; SE.t0 = reloj; }
    const frente = (reloj - SE.t0) * VEL;
    // la comprobación pasa por cada eslabón y le cambia el estado: al romperse, un tirón hacia abajo; al restaurarse, un salto y un pulso
    for (let i = 0; i < N; i++) if (frente >= i && SE.kk[i] !== k) {
      const antes = i >= SE.kk[i], ahora = i >= k; SE.kk[i] = k;
      if (ahora && !antes) { SE.vy[i] -= 90; SE.vz[i] += (azar(i + 9) - 0.5) * 6; }
      if (antes && !ahora) { SE.vy[i] += 170; SE.pop[i] = reloj; }
    }
    const pasos = Math.min(10, Math.ceil(dt * 120)), h = pasos ? dt / pasos : 0, CAE = 78 * ARCO.bs;
    for (let p = 0; p < pasos; p++) for (let i = 0; i < N; i++) {
      // roto en kk: el tramo de kk en adelante queda colgado solo del apoyo derecho y se descuelga como una guirnalda;
      // el tramo bueno, suelto por su punta, cede un poco
      const kk = SE.kk[i], r = i >= kk ? 1 : 0, rel = r ? (N - 1 - i) / Math.max(1, N - 1 - kk) : kk < N ? i / Math.max(1, kk - 1) : 0;
      const ty = r ? -(CAE * Math.pow(rel, 1.15) + 7 + 7 * azar(i + 17)) : -14 * ARCO.bs * rel * rel * rel;
      const tz = r ? 0.75 * rel + (azar(i + 51) - 0.5) * 0.5 : -0.3 * rel * rel * rel, tl = r && i === kk ? 1 : 0;
      SE.vy[i] += (170 * (ty - SE.by[i]) - 7.5 * SE.vy[i]) * h; SE.by[i] += SE.vy[i] * h;
      SE.vz[i] += (150 * (tz - SE.bz[i]) - 7 * SE.vz[i]) * h; SE.bz[i] += SE.vz[i] * h;
      SE.vc[i] += (110 * (r - SE.bc[i]) - 21 * SE.vc[i]) * h; SE.bc[i] += SE.vc[i] * h;
      SE.vl[i] += (120 * (tl - SE.lb[i]) - 9 * SE.vl[i]) * h; SE.lb[i] += SE.vl[i] * h;   // el enlace que entra en la rota se cae
    }
    // el árbol: desde la hoja de la #406, nivel a nivel hasta la raíz (coral si está roto; menta al restaurar)
    const fm = (reloj - SE.t0) * 7;
    for (let L = 0; L < NL; L++) {
      if (fm >= L) SE.ml[L] = k < N ? 1 : 0;
      for (let p = 0; p < pasos; p++) { SE.vm[L] += (110 * (SE.ml[L] - SE.mc[L]) - 16 * SE.vm[L]) * h; SE.mc[L] += SE.vm[L] * h; }
    }
    return frente;
  }

  // ── el punto ámbar: lee la etiqueta, salta de lectura en lectura, viaja apagado y lidera la cadena ──
  const salto = { x: 0, y: 0, sx: 1, sy: 1 };
  function aterriza(u, ul) { const q = tramo(u, ul, ul + 0.006); if (q <= 0 || q >= 1) { salto.sx = salto.sy = 1; return; } const e = E.rebote(q); salto.sy = mezcla(0.6, 1, e); salto.sx = mezcla(1.32, 1, e); }
  function enCinta(u, i0, i1) {                                         // espera en cada lectura y salta para llegar justo cuando se lee la siguiente
    let i = i0; while (i < i1 && u >= UL[i + 1]) i++;
    salto.y = 0;
    if (i >= i1) { salto.x = BX[i1]; aterriza(u, UL[i1]); return salto; }
    const a = BX[i], b = BX[i + 1], dd = b - a, dur = Math.min(UL[i + 1] - UL[i], 0.0022 + dd * 0.00003), s = tramo(u, UL[i + 1] - dur, UL[i + 1]);
    salto.x = mezcla(a, b, s); salto.y = Math.min(150, 7 + dd * 0.4) * 4 * s * (1 - s);
    if (s > 0 && s < 1) { const st = 1 + 0.26 * sen(PI * s); salto.sx = 1 / Math.sqrt(st); salto.sy = st; } else aterriza(u, UL[i]);
    return salto;
  }
  const vP = V(), vQ = V(), vR = V();
  function parabola(a, b, s, alto, out) { out.lerpVectors(a, b, s); out.y += alto * 4 * s * (1 - s); return out; }
  function ponerPunto(u, reloj, frente, kd) {
    const r = 8, bob = sen(reloj * 2.2) * 1.5, arriba = 2 * RB * kd;
    let br = 1, sx = 1, sy = 1;
    if (u < 0.045) { pt.poner(0, -400, 0, r, 0.002); return; }   // bajo el suelo y casi apagado, pero nunca oculto: no cambia el número de luces
    if (u < 0.112) {                                                    // llega volando, como una luciérnaga
      const t = E.seno(tramo(u, 0.045, 0.112));
      vQ.set(chipW.x - 700, chipW.y + 260, chipW.z + 380); vR.set(chipW.x - 150, chipW.y + 230, chipW.z + 240); vC.copy(chipW).y += 46;
      vP.copy(vQ).multiplyScalar((1 - t) * (1 - t)).addScaledVector(vR, 2 * t * (1 - t)).addScaledVector(vC, t * t); vP.y += sen(u * 300) * 4 * (1 - t);
      br = tramo(u, 0.045, 0.07);
    } else if (u < 0.125) {                                             // se recoge un poco y baja a tocarla
      const q = tramo(u, 0.112, 0.125); vP.copy(chipW); vP.y += 46 + 10 * sen(PI * tramo(q, 0, 0.45)) - 39 * E.ei(tramo(q, 0.4, 1));
      if (q > 0.85) { sy = 1.2; sx = 0.9; }
    } else if (u < 0.152) {                                             // la lectura: se aplasta, rebota y queda flotando
      vP.copy(chipW); vP.y += 7 + 40 * E.vivo(tramo(u, 0.125, 0.15)) + bob * tramo(u, 0.14, 0.152); aterriza(u, 0.125); sx = salto.sx; sy = salto.sy;
      br = 1 + 0.9 * pico(u, 0.123, 0.14);
    } else if (u < UL[0]) {                                             // baja de un salto a dejar la lectura 1 en la cinta
      vQ.copy(chipW); vQ.y += 47; vR.set(BX[0], arriba + r, ZR); parabola(vQ, vR, E.seno(tramo(u, 0.152, UL[0])), 70, vP);
    } else if (u < UL[NF - 1] + 0.002) { const s = enCinta(u, 0, NF - 1); vP.set(s.x, arriba + r * s.sy + s.y, ZR); sx = s.sx; sy = s.sy; }
    else if (u < 0.505) {                                               // se sube a la losa y viaja apagado: en la carretera nadie lee
      vQ.set(BX[NF - 1], arriba + r, ZR); vR.copy(chipW); vR.y += 20 + bob;
      const s = E.seno(tramo(u, UL[NF - 1] + 0.002, U_SAL)); parabola(vQ, vR, s, 80, vP);
      br = mezcla(1, 0.32, tramo(u, U_SAL, U_SAL + 0.02));
    } else if (u < UL[NF]) {                                            // se despierta y baja a la cinta de la obra
      vQ.copy(chipW); vQ.y += 20 + bob; vR.set(BX[NF], arriba + r, ZR);
      parabola(vQ, vR, E.seno(tramo(u, UL[NF] - 0.009, UL[NF])), 90, vP); br = mezcla(0.32, 1, tramo(u, 0.505, 0.515));
    } else if (u < 0.695) { const s = enCinta(u, NF, N - 1); vP.set(s.x, arriba + r * s.sy + s.y + (u > UL[N - 1] + 0.006 ? bob : 0), ZR); sx = s.sx; sy = s.sy; br = 1 + 0.8 * pico(u, U_CERT, U_CERT + 0.012); }
    else if (u < UA[0]) { vQ.set(BX[N - 1], arriba + r, ZR); arco(0, vR); vR.y += 16; parabola(vQ, vR, E.seno(tramo(u, 0.695, UA[0])), 160, vP); }
    else if (u < UA[N - 1]) { const f = tramo(u, UA[0], UA[N - 1]) * (N - 1); arco(f, vP); vP.y += 16 + 7 * Math.abs(sen(PI * f)); }
    else {                                                              // descansa al final de la cadena, donde irá la próxima
      arco(N - 1 + 1.3 * E.eo(tramo(u, UA[N - 1], UA[N - 1] + 0.015)), vP); vP.y += 16 + bob;
      const w = SE.t0 > -50 && u > 0.81 ? 1 - tramo(reloj - SE.t0, (N - 1) / VEL, (N - 1) / VEL + 0.45) : 0;
      if (w > 0 && frente >= 0) { arco(Math.min(N - 1, frente), vQ); vQ.y += 18 + 5 * Math.abs(sen(PI * frente)); vP.lerp(vQ, E.seno(Math.min(1, w * 3)) ); br = 1.25; }
    }
    pt.poner(vP.x, vP.y, vP.z, r, br);
    pt.esfera.scale.set(r * sx, r * sy, r * sx);
  }

  // ── la cámara: planos con algo de lado y de altura, encadenados por u ──
  //  [cx, cy, cz, alto, ancho, fx, fy, fy en vertical, lado, el]: el sujeto queda en (fx, fy) de la pantalla
  const PL = [
    [0, 300, 0, 620, 470, 0.38, 0.0, 0.3, -0.62, 0.30],                 // 0 la losa sola bajo el foco
    [70, 295, 30, 470, 380, 0.32, 0.0, 0.3, -0.34, 0.44],               // 1 el punto la lee
    [60, 120, 110, 680, 600, -0.32, -0.04, 0.3, -0.3, 0.26],             // 2 la fábrica y sus 15 lecturas
    [0, 110, 60, 620, 660, 0.3, -0.02, 0.3, 0.3, 0.2],                 // 3 el camión arranca
    [0, 105, 60, 660, 700, 0.27, -0.02, 0.3, 0.55, 0.13],                // 4 la carretera, sin lecturas
    [XS, 130, 20, 740, 720, -0.28, -0.02, 0.3, 0.1, 0.3],           // 5 llega a la obra
    [XS + 90, 120, -60, 800, 760, -0.3, -0.02, 0.3, 0.16, 0.33],        // 6 se instala y se certifica
    [(BX[0] + BX[N - 1]) / 2, 0, ZR, 500, BX[N - 1] - BX[0] + 380, 0, 0.42, 0.45, 0.1, 0.5],   // 7 la cinta entera
    [X_INST, 151, Z_INST, 900, 640, 0, 0.48, 0.63, 0.26, 0.14],         // 8 la cadena
    [(XR0 + XR1) / 2 + 330, 0, 0, 700, CARRETERA + 700, 0.2, -0.06, 0.32, 0.16, 0.74],   // 9 la grúa de cámara sube: la ruta entera, y el camión, pequeño, en ella
    [0, 0, 0, 190, 190, 0.3, 0.02, 0.25, -1.08, 0.1],                   // 10 a ras del canto: 26 cm de hormigón que bajan a la luz
    [0, 0, 0, 880, 1100, 0, -0.4, -0.34, 0.1, 0.16],                     // 11 el árbol de la casa, en los dos tercios de abajo
  ];
  const CLAVES = [[0, 10], [0.075, 0], [0.1, 1], [0.15, 1], [0.205, 2], [0.335, 2], [0.36, 3], [0.385, 4], [0.405, 4], [0.437, 9], [0.462, 9], [0.497, 4], [0.53, 5], [0.57, 6], [0.665, 6], [0.7, 7], [0.715, 7], [0.82, 8], [1, 8]];
  const OA = new Float32Array(10), OB = new Float32Array(10), OC = new Float32Array(10);
  let asp = 1, vert = false;
  function plano(k, u, tx, o) {
    for (let i = 0; i < 10; i++) o[i] = PL[k][i];
    if (k === 2) o[8] += 0.22 * tramo(u, 0.19, 0.335);
    if (k === 3 || k === 4) { o[0] = tx + (k === 4 ? 65 : 40); o[2] += rutaZ(tx); o[8] += 0.6 * rumbo(tx); }
    if (k === 9 && vert) { o[0] = camionX(u) + 500; o[2] = rutaZ(o[0]); o[4] = 1500; o[8] = 1.2; o[9] = 0.6; }
    if (k === 11) {                                                     // la grúa de cámara: de la casa a la raíz, sin tocar la franja del texto
      const c1 = E.seno(tramo(u, 0.65, 0.705)), c2 = E.seno(tramo(u, 0.755, 0.87)), top = NY[NN - 1] + 30;
      // de la cubierta, de cerca, a la retícula de tarjetas («Cada pieza, su huella») y de ahí al árbol entero
      o[0] = ARBOL.x; o[1] = mezcla(TAPA + 70, GRID.y - 40, c1); o[2] = mezcla(ZM + 40, ZM - 10, c1); o[3] = mezcla(420, 560, c1); o[4] = mezcla(520, vert ? 270 : 820, c1);
      o[6] = mezcla(o[6], -0.26, c1); o[7] = mezcla(o[7], 0.04, c1); o[8] = mezcla(0.34, 0.12, c1); o[9] = mezcla(0.05, 0.14, c1);
      o[1] = mezcla(o[1], (TAPA + top) / 2 - 40, c2); o[2] = mezcla(o[2], ZM, c2); o[3] = mezcla(o[3], (top - TAPA) * 2.35, c2); o[4] = mezcla(o[4], PLANTA.w * M + 160, c2);
      o[6] = mezcla(o[6], -0.4, c2); o[7] = mezcla(o[7], -0.34, c2); o[8] = mezcla(o[8], 0.1, c2) + 0.04 * sen(u * 9); o[9] = mezcla(o[9], 0.2, c2);
      const baja = E.seno(tramo(u, 0.87, 0.92)); o[6] -= 0.16 * baja; o[7] -= 0.1 * baja; o[3] += 60 * baja;   // en el último compás el texto es más largo: el árbol baja un poco
    }
    if (k === 10) { o[0] = losa.position.x + 110; o[1] = losa.position.y - 4; o[2] = losa.position.z + 30; o[3] += 30 * sen(u * 40); if (vert) { o[0] = losa.position.x - 20; o[2] = losa.position.z; o[3] = 300; o[4] = 300; o[8] = -0.5; o[9] = 0.42; } }
    if (k === 6) o[8] += 0.1 * tramo(u, 0.57, 0.665);
    if (k === 7 && vert) { o[4] = 1700; o[8] = 0.95; o[9] = 0.42; o[0] = BX[N - 1] - 900; o[2] = ZR - 300; }   // en vertical, la cinta en diagonal
    if (k === 8) { const q = E.seno(tramo(u, 0.82, 1)); o[0] = ARCO.x; o[3] -= 70 * q; o[4] = ARCO.rx * 2 + 70 - 50 * q; o[8] -= 0.16 * q; o[9] += 0.05 * q; }   // un acercamiento lento, de anuncio
  }
  function encuadre(o, reloj) {
    let fx = o[5], fy = o[6], lado = o[8], el = o[9];
    if (vert) { fx = 0; fy = o[7]; }
    const alto = Math.max(o[3], o[4] / (asp * 0.94));
    lado += 0.014 * sen(reloj * 0.21); el += 0.007 * sen(reloj * 0.17 + 1);   // la cámara respira
    const d = alto / 2 / Math.tan(camara.fov * PI / 360), hw = alto / 2 * asp, hh = alto / 2;
    const tx = o[0] - cos(lado) * fx * hw + sen(el) * sen(lado) * fy * hh, ty = o[1] - cos(el) * fy * hh, tz = o[2] + sen(lado) * fx * hw + sen(el) * cos(lado) * fy * hh;
    mirar(camara, tx, ty, tz, d, lado, el); plato.enfocar(o[0], o[1] * 0.35, o[2], d);
    return d;
  }

  // ── cada fotograma ──
  const m4 = new T3.Matrix4(), q4 = new T3.Quaternion(), qB = new T3.Quaternion(), s4 = V(), p4 = V(), dir = V(), EJE_X = V(1, 0, 0), EJE_Z = V(0, 0, 1), col = new T3.Color(), colB = new T3.Color();
  const BPX = new Float32Array(N), BPY = new Float32Array(N), BPZ = new Float32Array(N), BSC = new Float32Array(N), CERO = new T3.Matrix4().makeScale(0, 0, 0);
  // los compases: la historia (de la losa a la cadena) ocupa u 0–0,64 y se remapea a su guion; la casa va de 0,64 a 1
  const NUDOS = [[0, 0], [0.12, 0.18], [0.24, 0.36], [0.344, 0.52], [0.432, 0.66], [0.64, 1]];   // la historia ocupa u 0–0,64; la casa, el resto
  function guion(u) { let i = 0; while (i < NUDOS.length - 2 && u > NUDOS[i + 1][0]) i++; const a = NUDOS[i], b = NUDOS[i + 1]; return mezcla(a[1], b[1], tramo(u, a[0], b[0])); }
  let UM = 0;
  function actualizar(um, reloj, dt) {
    UM = um < U_CASA ? 0 : mezcla(0.8, 0.86, tramo(um, U_CASA, U_CASA + 0.035)); const u = guion(um);   // UM: el reloj de la condensación de la cadena
    // el camión
    const tx = camionX(u), tz = rutaZ(tx); camion.position.set(tx, 0, tz); camion.rotation.y = rumbo(tx); carroceria(u);
    for (let k = 0; k < 6; k++) {
      const x = EJES[k >> 1], z = k & 1 ? -52 : 52; q4.setFromAxisAngle(EJE_Z, -tx / RR);
      m4.compose(p4.set(x, RR, z), q4, s4.set(1, 1, 1)); ruedas.setMatrixAt(k, m4); bujes.setMatrixAt(k, m4);
    }
    ruedas.instanceMatrix.needsUpdate = bujes.instanceMatrix.needsUpdate = true;
    camion.visible = u > 0.13 && camionX(u) < XS + 1700; camion.updateMatrixWorld(true);
    // la losa y la grúa
    ponerLosa(u, reloj);
    tacosAcopio.visible = u > 0.45 && u < 0.69;
    const enObra = u > 0.45;
    // la etiqueta: respira y contesta a cada lectura
    let ultima = -1; for (let i = 0; i < N; i++) if (UL[i] <= u) ultima = i;
    const contesta = ultima >= 0 ? 1 - tramo(u, UL[ultima], UL[ultima] + 0.01) : 0, lee = pico(u, 0.122, 0.16);
    const fl = 0.55 + 0.12 * sen(reloj * 2.4) + 1.6 * lee + 0.7 * contesta;
    matChip.emissiveIntensity = fl; brilloChip.scale.setScalar(26 * (0.7 + 0.5 * fl)); brilloChip.material.opacity = Math.min(1, 0.5 + 0.3 * fl);
    luzChip.intensity = 0.4 + 2.4 * lee + 1.2 * contesta;
    const ua = tramo(u, 0.124, 0.165); aroChip.visible = ua > 0 && ua < 1; aroChip.scale.setScalar(8 + E.eo(ua) * 80); aroChip.material.opacity = 0.9 * (1 - ua);
    // el sello y la distancia de cámara (para que la cinta se lea también de lejos)
    const frente = sellar(reloj, dt);
    let i = 0; while (i < CLAVES.length - 2 && u > CLAVES[i + 1][0]) i++;
    const ka = CLAVES[i], kb = CLAVES[i + 1], w = E.seno(tramo(u, ka[0], kb[0]));
    plano(ka[1], u, tx, OA); plano(kb[1], u, tx, OB); for (let j = 0; j < 10; j++) OC[j] = mezcla(OA[j], OB[j], w);
    const wa = E.seno(tramo(um, U_CASA, U_CASA + 0.06));
    if (wa > 0) { plano(11, um, tx, OA); for (let j = 0; j < 10; j++) OC[j] = mezcla(OC[j], OA[j], wa); }
    const d = encuadre(OC, reloj), kd = Math.max(1, d / 1500), kc = Math.min(2.6, Math.pow(kd, 0.75));
    // la cinta: crece con el punto; la carretera, discontinua, se descubre con el camión
    const cad = E.seno(tramo(u, 0.7, 0.8)), tenue = 1 - 0.65 * cad;
    const cabezaF = u < UL[0] ? 0 : u > UL[NF - 1] ? BX[NF - 1] : enCinta(u, 0, NF - 1).x, cabezaO = u < UL[NF] ? 0 : u > UL[N - 1] ? BX[N - 1] : enCinta(u, NF, N - 1).x;
    tiraF.visible = u >= UL[0]; tiraF.scale.set(Math.max(0.01, cabezaF - BX[0]), 1, kc); matTiraF.opacity = 0.75 * tenue;
    tiraO.visible = u >= UL[NF]; tiraO.scale.set(Math.max(0.01, cabezaO - BX[NF]), 1, kc); matTiraO.opacity = 0.75 * tenue;
    const frenteR = u < U_SAL ? -1e9 : u > U_LLE ? 1e9 : tx + 160;
    for (let j = 0; j < ND; j++) { const x = XR0 + 18 + j * 36, s = E.eo(tramo(frenteR - x, 0, 80)), R = RAYA[j]; if (s <= 0) rayas.setMatrixAt(j, CERO); else { q4.setFromAxisAngle(EJE_Y, R[2]); rayas.setMatrixAt(j, m4.compose(p4.set(R[0], 0, R[1]), q4, s4.set(s, 1, kc))); } }
    rayas.instanceMatrix.needsUpdate = true; matRaya.opacity = 0.5 * tenue;
    // la ruta se dibuja entera al salir de la nave, como un trazado que ya se conoce
    const dib = E.eio(tramo(u, U_SAL - 0.004, U_SAL + 0.03)); ruta.visible = dib > 0; ruta.geometry.setDrawRange(0, Math.floor(dib * NR) * 6); matRuta.opacity = 0.32 * tenue * (1 - 0.5 * tramo(u, 0.53, 0.6));
    for (const ro of rotulos) { const a = ro.x !== undefined ? tramo(u, U_SAL + 0.01, U_SAL + 0.035) : tramo(u, ro.u, ro.u + 0.01); ro.m.material.opacity = 0.9 * a * tenue; ro.m.visible = a > 0.001; ro.m.scale.setScalar(Math.min(2.2, kd)); }
    // las lecturas, su vuelo y la cadena
    const pos = gBrillo.attributes.position, cb = gBrillo.attributes.color;
    const ola = reloj - SE.t0 < (N - 1) / VEL + 0.6, paseo = (reloj * 5) % 70 - 15;
    // el barrido: al cerrarse la cadena (en u) y cada vez que cambia el sello (en el reloj), una luz la recorre entera
    const fr = ola && u > 0.81 && UM < 0.8 ? frente : u > 0.81 && u < 0.85 ? tramo(u, 0.812, 0.846) * (N + 6) - 3 : -99;
    if (fr > -5 && fr < N + 3) {
      arco(Math.max(0, Math.min(N - 1, fr)), vQ); luzOla.position.set(vQ.x, vQ.y + 10, vQ.z + 46);
      const rota = ola && SE.k < N && fr >= SE.k; luzOla.color.set(rota ? COL.coral : COL.menta);
      luzOla.intensity = 2.4 * tramo(fr, -5, -1) * (1 - tramo(fr, N, N + 3)) + (ola && SE.k < N ? 7 * Math.exp(-((frente - SE.k) ** 2) / 1.5) : 0);
    } else luzOla.intensity = 0;
    for (let j = 0; j < N; j++) {
      const vuelo = tramo(u, UA[j] - 0.03, UA[j]), llega = tramo(u, UA[j], UA[j] + 0.02), lit = E.rebote(tramo(u, UL[j], UL[j] + 0.012));
      const parpadeo = j === SE.alt ? 0.45 + 0.55 * Math.abs(sen(reloj * 19) * sen(reloj * 7.3 + 1)) : 1;
      // la cuenta en la cinta, o volando hacia su sitio en la cadena
      vQ.set(BX[j], RB * kc, ZR);
      if (vuelo > 0) { arco(j, vR); vR.y += SE.by[j] * E.seno(llega); const t = E.eio(vuelo); vC.set((vQ.x + vR.x) / 2, Math.max(vQ.y, vR.y) + 240 + 0.16 * Math.abs(vR.x - vQ.x), (vQ.z + vR.z) / 2); vP.copy(vQ).multiplyScalar((1 - t) * (1 - t)).addScaledVector(vC, 2 * t * (1 - t)).addScaledVector(vR, t * t); }
      else vP.copy(vQ);
      const sc = lit * kc * (1 - tramo(u, UA[j], UA[j] + 0.004)) * (vuelo > 0 ? 1.2 : 1);
      cuentas.setMatrixAt(j, sc > 1e-4 ? m4.compose(vP, q4.identity(), s4.setScalar(sc)) : CERO);
      col.copy(BASE[j]).lerp(C_MENTA, E.eio(vuelo)).lerp(C_CORAL, Math.max(0, Math.min(1, SE.bc[j]))).multiplyScalar(parpadeo);
      cuentas.setColorAt(j, col); colB.copy(col);
      // el eslabón: aparece con un muelle donde llega su cuenta; si está roto, se suelta y cae
      const tp = reloj - SE.pop[j], pop = tp >= 0 && tp < 1.2 ? 1 + 0.5 * Math.exp(-tp * 5) * sen(tp * 17) : 1;   // el resorte al volver a su sitio
      const sb = E.rebote(llega) * ARCO.bs * pop; BSC[j] = sb;
      arco(j, p4); p4.y += (SE.by[j] + 0.8 * sen(reloj * 1.4 + j * 0.45)) * E.seno(llega);
      if (j === SE.alt) { p4.x += 0.7 * sen(reloj * 41); p4.y += 0.5 * sen(reloj * 37); }
      const cond = E.ei(tramo(UM, 0.8 + j * 0.0007, 0.83 + j * 0.0007));   // la cadena se condensa en una hoja: la #406
      if (cond > 0) { vH.set(NX[I406], NY[I406], NZ[I406]); p4.lerp(vH, cond); }
      BPX[j] = p4.x; BPY[j] = p4.y; BPZ[j] = p4.z;
      if (sb * (1 - cond) <= 1e-4) bloques.setMatrixAt(j, CERO);
      else { q4.setFromAxisAngle(EJE_Z, tangente(j) + SE.bz[j] * E.seno(llega)); bloques.setMatrixAt(j, m4.compose(p4, q4, s4.setScalar(Math.max(1e-4, sb * (1 - 0.7 * cond))))); }
      const barre = fr > -5 ? Math.exp(-((j - fr) ** 2) / 2.5) : 0, brilla = 1 + 0.35 * Math.exp(-((j - paseo) ** 2) / 6) + 1.4 * barre + (fr > -5 && j < fr ? 0.35 * Math.exp(-(fr - j) / 4) : 0);
      col.copy(C_MENTA).lerp(C_CORAL, Math.max(0, Math.min(1, SE.bc[j]))).lerp(C_BLANCO, 0.6 * barre).multiplyScalar(parpadeo * 0.72 * brilla);   // donde pasa la comprobación, el eslabón se enciende casi blanco
      bloques.setColorAt(j, col);
      // su brillo: el de la cuenta mientras es cuenta, uno más suave cuando ya es eslabón
      const enCadena = llega > 0.2;
      pos.setXYZ(j, enCadena ? p4.x : vP.x, enCadena ? p4.y : vP.y, enCadena ? p4.z : vP.z);
      if (enCadena) col.multiplyScalar(0.28 * sb * brilla);
      else col.copy(colB).multiplyScalar(sc > 1e-4 ? 0.55 * Math.min(1, lit) * (vuelo > 0 ? 1.4 : 1) + (j >= NF ? 0.5 * pico(u, U_CERT, U_CERT + 0.014) : 0) : 0);
      cb.setXYZ(j, col.r, col.g, col.b);
    }
    for (let j = 0; j < N - 1; j++) {                                   // los enlaces: cada eslabón cogido del anterior
      const s = E.vivo(tramo(u, UA[j + 1], UA[j + 1] + 0.02)) * ARCO.bs * (1 - tramo(UM, 0.8, 0.815));
      if (s <= 1e-4) { enlaces.setMatrixAt(j, CERO); continue; }
      const lb = Math.max(0, SE.lb[j + 1]);
      p4.set((BPX[j] + BPX[j + 1]) / 2, (BPY[j] + BPY[j + 1]) / 2 - 46 * lb, (BPZ[j] + BPZ[j + 1]) / 2);
      dir.set(BPX[j + 1] - BPX[j], BPY[j + 1] - BPY[j], BPZ[j + 1] - BPZ[j]).normalize();
      q4.setFromUnitVectors(EJE_X, dir); qB.setFromAxisAngle(EJE_X, (j % 2 ? PI / 2 : 0) + lb * 2.2); q4.multiply(qB);
      enlaces.setMatrixAt(j, m4.compose(p4, q4, s4.setScalar(s * (1 - 0.6 * Math.min(1, lb)))));
      col.copy(C_MENTA).lerp(C_CORAL, Math.max(0, Math.min(1, SE.bc[j + 1]))); enlaces.setColorAt(j, col);
    }
    for (const im of [cuentas, bloques, enlaces]) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }
    pos.needsUpdate = cb.needsUpdate = true; matBrillo.size = 48 * kc;
    // el hilo de la lectura: de la etiqueta a la cuenta que se acaba de leer
    const ul = ultima >= 0 ? tramo(u, UL[ultima], UL[ultima] + 0.008) : 1;
    linea.visible = ul < 1 && u < 0.69;
    if (linea.visible) {
      const p = gLinea.attributes.position; p.setXYZ(0, chipW.x, chipW.y + 1, chipW.z); p.setXYZ(1, BX[ultima], RB * kc, ZR); p.needsUpdate = true;
      linea.material.color.set(LEC[ultima].lugar === 'fabrica' ? COL.ion : COL.menta); linea.material.opacity = 0.85 * (1 - ul);
    }
    // el punto
    ponerPunto(u, reloj, frente, kc);
    // el pasaporte: sale de la etiqueta, se pone de cara, anota la certificación y vuelve a la losa cuando sube la cadena
    const pa = tramo(u, U_PAS, U_PAS + 0.016), pf = tramo(u, 0.684, 0.698);
    tarjeta.visible = pa > 0 && pf < 1; hilo.visible = tarjeta.visible;
    if (tarjeta.visible) {
      const sale = E.eo(pa), vuelve = E.ei(pf), esc = Math.max(0.01, E.vivo(pa) * (1 - vuelve)) * (vert ? 1.3 : 1.3);
      vR.set(vert ? X_INST - 10 : X_INST - 285, vert ? 360 : 268, Z_INST + (vert ? 90 : 150));
      vP.copy(chipW).lerp(vR, sale * (1 - vuelve)); vP.y += 4 * sen(reloj * 1.3) * sale;
      tarjeta.position.copy(vP); tarjeta.quaternion.copy(camara.quaternion);
      qB.setFromAxisAngle(EJE_X, -PI / 2 * (1 - sale) + 0.05 * sen(reloj * 0.7)); tarjeta.quaternion.multiply(qB);
      qB.setFromAxisAngle(EJE_Y, 0.16 * (1 - sale) + 0.06 * sen(reloj * 0.5)); tarjeta.quaternion.multiply(qB);
      tarjeta.scale.setScalar(esc); tarjeta.updateMatrixWorld(true);
      filaCert.material.opacity = E.eo(tramo(u, U_CERT, U_CERT + 0.006));
      tarjeta.localToWorld(vQ.set(0, -TH / 2, 0)); const ph = gHilo.attributes.position; ph.setXYZ(0, chipW.x, chipW.y + 1, chipW.z); ph.setXYZ(1, vQ.x, vQ.y, vQ.z); ph.needsUpdate = true;
      hilo.material.opacity = 0.6 * sale * (1 - vuelve);
    }
    // la certificación: un aro menta que se abre en el suelo y una luz que baña la losa ya puesta
    const uc = tramo(u, U_CERT - 0.001, U_CERT + 0.02); aroCert.visible = uc > 0 && uc < 1; aroCert.scale.set(90 + E.eo(uc) * 420, 90 + E.eo(uc) * 420, 1); aroCert.material.opacity = 0.9 * (1 - uc);
    luzCert.intensity = 2.2 * pico(u, U_CERT - 0.002, U_CERT + 0.03) + (enObra ? 0.35 * cad : 0);
    arbol(um, reloj);
    // las noches de la obra: el foco baja un poco entre un día y otro
    plato.clave.intensity = FOCO * (1 - 0.42 * pico(u, S.aco1 + 0.004, VENT[1][0]) - 0.42 * pico(u, S.suelta + 0.004, VENT[2][0]));
  }

  // ── la casa, cada fotograma ──
  // dónde está la huella n en u (out) y de qué tamaño; 0 si aún no ha nacido o ya se ha unido a su pareja
  function huella(n, um, reloj, out) {
    const L = NV[n], es = n === I406;
    let s;
    out.set(NX[n], NY[n], NZ[n]);
    if (!L && !es) {                                                    // sube desde su sitio en la cubierta
      const t0 = t0h(n), t = tramo(um, t0, t0 + 0.018);
      out.set(mezcla(SX[n * 3], NX[n], E.eo(t)), mezcla(SX[n * 3 + 1], NY[n], E.eo(t)), mezcla(SX[n * 3 + 2], NZ[n], E.eo(t)));
      s = E.vivo(tramo(um, t0, t0 + 0.008));
    } else s = E.rebote(tramo(um, es ? U_NACE406 : U_NIV(L), (es ? U_NACE406 : U_NIV(L)) + 0.013));   // la #406 nace de su cadena; las demás, de su pareja
    out.y += 2 * sen(reloj * 1.3 + n) * Math.min(1, s);
    if (PADRE[n] >= 0) {                                                // vuela hacia su pareja y se funde con ella
      const tm = U_NIV(L + 1), f = E.ei(tramo(um, tm - VUELO, tm)), m = PADRE[n];
      if (um >= tm) return 0;
      out.x = mezcla(out.x, NX[m], f); out.y = mezcla(out.y, NY[m], f); out.z = mezcla(out.z, NZ[m], f); s *= 1 - 0.3 * f;
    } else s *= 1 - tramo(um, U_ANILLO + 0.004, U_ANILLO + 0.016);    // la última se abre en el anillo
    return s * (4.2 + 1.7 * L) * (es ? 1.5 : 1) * ARBOL.hs;
  }
  const t0h = (i) => U_NACE + 0.022 * Math.abs(i - I406) / Math.max(I406, NP - 1 - I406);   // la ola sale de la #406
  function arbol(um, reloj) {
    const on = um > U_CASA; motas.visible = estelas.visible = halos.visible = raiz.visible = forjado.visible = etiqueta.visible = on;
    cuerposC.visible = carasC.visible = bordesC.visible = hilos.visible = on;
    if (!on) { for (const t of TARJETAS) { t.g.visible = t.linea.visible = false; } matForjado.emissiveIntensity = 0; luzCert.position.set(X_INST, 260, Z_INST + 80); luzCert.color.set(COL.menta); return; }
    const roto = (L) => Math.max(0, Math.min(1, SE.mc[L])), ola = (reloj - SE.t0) * 7, hs = ARBOL.hs;
    const rr = roto(NL - 1), parpadeo = rr > 0.5 ? 0.55 + 0.45 * Math.abs(sen(reloj * 17) * sen(reloj * 6.1 + 1)) : 1;
    const sellado = tramo(um, U_SELLA, U_SELLA + 0.006), flash = pico(um, U_SELLA, U_SELLA + 0.04);
    // la cubierta: sus bandas suben una a una; cuando se sella la huella, brilla entera
    for (let k = 0; k < BANDAS.length; k++) {
      const t = tramo(um, 0.645 + k * 0.007, 0.672 + k * 0.007), s = E.vivo(t);
      forjado.setMatrixAt(k, s > 1e-3 ? m4.compose(p4.set(BX0[k], YF + GR / 2 - 40 * (1 - E.eo(t)), ZM), q4.identity(), s4.set(BANDAS[k] * M, GR * Math.max(0.05, s), PLANTA.h * M)) : CERO);
    }
    forjado.instanceMatrix.needsUpdate = true;
    matForjado.emissive.copy(C_MENTA).lerp(C_CORAL, rr); matForjado.emissiveIntensity = (0.35 * flash + 0.07 * sellado) * parpadeo;
    // las huellas y sus estelas
    const ph = gHalo.attributes.position, chh = gHalo.attributes.color;
    for (let n = 0; n < NN; n++) {
      const r = huella(n, um, reloj, vP), L = NV[n], camino = CAMINO[n];
      motas.setMatrixAt(n, r > 1e-3 ? m4.compose(vP, q4.identity(), s4.setScalar(r)) : CERO);
      const nace = pico(um, L ? U_NIV(L) : U_NACE, (L ? U_NIV(L) : U_NACE + 0.03) + 0.016), late = camino ? 1.2 * Math.exp(-((L - ola) ** 2) / 0.8) : 0;
      col.copy(camino ? C_MENTA : C_HUELLA).lerp(C_CORAL, camino ? roto(L) : 0);
      motas.setColorAt(n, colB.copy(col).multiplyScalar(0.85 * (1 + nace + late)));
      ph.setXYZ(n, vP.x, vP.y, vP.z + 2);
      const k = r > 1e-3 ? (camino ? 0.75 : 0.42) * (1 + 1.5 * nace + late) * Math.min(1, r / 4) : 0;
      chh.setXYZ(n, col.r * k, col.g * k, col.b * k);
      if (n === R0) continue;
      // la estela: crece mientras vuela hacia su pareja y queda como un trazo fino
      const m = PADRE[n], tm = U_NIV(L + 1), g = E.ei(tramo(um, tm - VUELO, tm));
      if (g <= 1e-3) { estelas.setMatrixAt(n, CERO); continue; }
      dir.set(NX[m] - NX[n], NY[m] - NY[n], NZ[m] - NZ[n]); const lg = dir.length(); dir.multiplyScalar(1 / lg); q4.setFromUnitVectors(EJE_Y, dir);
      const an = (camino ? 1.3 : 0.6) * (1 + 0.25 * L) * hs;
      estelas.setMatrixAt(n, m4.compose(p4.set(NX[n], NY[n], NZ[n]), q4, s4.set(an, lg * g, an)));
      estelas.setColorAt(n, colB.copy(camino ? C_MENTA : C_ESTELA).lerp(C_CORAL, camino ? roto(L + 1) : 0).multiplyScalar((camino ? 0.8 : 0.2) * (1 + 2.2 * pico(um, tm - VUELO, tm + 0.01) + (camino ? late : 0))));
    }
    for (const im of [motas, estelas]) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }
    ph.needsUpdate = chh.needsUpdate = true; halos.material.size = 60 * hs;
    // la huella de la casa: el anillo se cierra, el punto baja a su centro y lo sella en ámbar
    const sr = E.rebote(tramo(um, U_ANILLO + 0.002, U_ANILLO + 0.022));
    raiz.position.set(NX[R0], NY[R0], NZ[R0]); raiz.scale.setScalar(Math.max(0.001, sr) * hs);
    raiz.rotation.set(0, 0.22 * sen(reloj * 0.4), PI * 1.5 * (1 - E.suave(tramo(um, U_ANILLO + 0.002, U_ANILLO + 0.03))));
    matRaiz.emissive.copy(C_MENTA).lerp(C_CORAL, rr); matRaiz.emissiveIntensity = (0.22 + 0.5 * pico(um, U_ANILLO, U_ANILLO + 0.03) + 0.6 * flash) * parpadeo;
    matSello.color.copy(C_AMBAR).lerp(C_CORAL, rr); matSello.opacity = 0.9 * sellado * (rr > 0.5 ? parpadeo * 0.7 : 1 + 0.08 * sen(reloj * 2));
    const ow = tramo(um, U_SELLA, U_SELLA + 0.03); onda.scale.setScalar(1 + 1.8 * E.eo(ow)); matOnda.opacity = 0.9 * (1 - ow) * (ow > 0 ? 1 : 0);
    haloRaiz.material.color.copy(C_MENTA).lerp(C_AMBAR, 0.7 * flash).lerp(C_CORAL, rr); haloRaiz.scale.setScalar(150 * (0.75 + 1.1 * flash + 0.06 * sen(reloj * 1.2)) * parpadeo); haloRaiz.material.opacity = 0.7 * Math.min(1, sr);
    luzOla.position.set(NX[R0], NY[R0] - 30, NZ[R0] + 70); luzOla.color.copy(C_AMBAR).lerp(C_CORAL, rr); luzOla.intensity = (6 * flash + 0.5 * sellado) * parpadeo;
    luzCert.position.set(XM, YF + 160, ZM + 90); luzCert.color.copy(C_MENTA).lerp(C_CORAL, rr); luzCert.intensity = 2.4 * flash * parpadeo;
    // el punto: acompaña a la huella de la #406 en su subida y, al final, sella la de la casa
    if (pintado !== SE.k * 100 + SE.alt) repintar();
    const a406 = tramo(um, 0.69, 0.712) * (1 - tramo(um, U_NIV(1) - VUELO - 0.008, U_NIV(1) - VUELO));
    const aPar = tramo(um, U_NIV(1) + 0.003, U_NIV(1) + 0.016) * (1 - tramo(um, U_NIV(2) - VUELO - 0.008, U_NIV(2) - VUELO));
    const aCam = tramo(um, U_NIV(2) + 0.003, U_NIV(2) + 0.014) * (1 - tramo(um, U_NIV(3) - VUELO - 0.007, U_NIV(3) - VUELO));
    if (um > U_NACE406) {
      let n = I406; while (PADRE[n] >= 0 && um >= U_NIV(NV[n] + 1)) n = PADRE[n];
      const r = huella(n, um, reloj, vQ); vAnc.copy(vQ);
      // la etiqueta de la #406 sube con su huella cuando no hay tarjeta que lo diga
      etiqueta.position.set(vQ.x + (34 + r) * hs, vQ.y + 14 * hs, vQ.z); etiqueta.scale.set(48 * hs * (1 + 0.04 * sen(reloj * 1.6)), 18 * hs, 1);
      etiqueta.material.opacity = 0.95 * tramo(um, U_NACE406, U_NACE406 + 0.008) * (1 - Math.min(1, 2 * Math.max(a406, aPar, aCam))) * (1 - tramo(um, U_ANILLO - 0.006, U_ANILLO + 0.004));
      vQ.y += Math.max(r, 4) + 10;
      vR.set(NX[R0], NY[R0], NZ[R0] + 3);
      const sube = E.eo(tramo(um, U_ANILLO, U_SELLA - 0.01)), baja = E.ei(tramo(um, U_SELLA - 0.01, U_SELLA));
      vP.copy(vQ).lerp(vC.copy(vR).setY(vR.y + 64), sube).lerp(vR, baja);
      if (sellado > 0) vP.y += 1.5 * sen(reloj * 2);
      pt.poner(vP.x, vP.y, vP.z, 6.5 * hs * (1 - 0.15 * sellado), 1 + 1.2 * flash);
    } else vAnc.set(NX[I406], NY[I406], NZ[I406]);
    // las tarjetas: como mucho dos a la vista; salen de su luz y vuelven a ella al unirse
    ponerTarjeta(T406, a406, vAnc, reloj, um < U_NIV(1) ? GRID : null, um < U_NIV(1) ? 0.00098 : 0.0013);
    // las 28 hermanas: brotan de su luz, se ordenan en la retícula y, antes de unirse, vuelven por su línea y se pliegan
    const pliega = E.ei(tramo(um, U_NIV(1) - VUELO - 0.02, U_NIV(1) - VUELO - 0.003)), hp = gHilos.attributes.position, hcol = gHilos.attributes.color;
    for (let i = 0, k = 0; i < NP; i++) {
      const t0 = t0h(i), sube = tramo(um, t0, t0 + 0.018), apaga = 1 - tramo(um, U_NIV(1) - VUELO, U_NIV(1) + 0.004);
      huella(i, um, reloj, vP);
      hp.setXYZ(i * 4, SX[i * 3], SX[i * 3 + 1], SX[i * 3 + 2]); hp.setXYZ(i * 4 + 1, vP.x, vP.y, vP.z);
      const kl = (i === I406 ? 0.75 : 0.32) * Math.min(1, sube * 2) * apaga; col.copy(i === I406 ? C_MENTA : C_HILO);
      hcol.setXYZ(i * 4, col.r * kl * 0.3, col.g * kl * 0.3, col.b * kl * 0.3); hcol.setXYZ(i * 4 + 1, col.r * kl, col.g * kl, col.b * kl);
      if (i === I406) { hp.setXYZ(i * 4 + 2, vP.x, vP.y, vP.z); hp.setXYZ(i * 4 + 3, vP.x, vP.y, vP.z); continue; }
      const a = tramo(um, t0 + 0.005, t0 + 0.021), e = E.eo(a), on = VISTA[k] && a > 0 && pliega < 1;
      vQ.set(mezcla(vP.x, SLOT[k * 3], e), mezcla(vP.y, SLOT[k * 3 + 1], e), mezcla(vP.z, SLOT[k * 3 + 2], e)).lerp(vP, pliega);
      vQ.y += 1.2 * sen(reloj * 1.1 + i * 0.9) * e;
      if (on) {
        qC.copy(camara.quaternion); qB.setFromAxisAngle(EJE_Y, (1 - e) * 1.1 + pliega * 1.3); qC.multiply(qB);
        const sc = Math.max(0.01, E.vivo(a)); m4.compose(vQ, qC, s4.set(sc * (1 - pliega), sc * (1 - 0.35 * pliega), sc));
        cuerposC.setMatrixAt(k, m4); carasC.setMatrixAt(k, m4); bordesC.setMatrixAt(k, m4);
      } else { cuerposC.setMatrixAt(k, CERO); carasC.setMatrixAt(k, CERO); bordesC.setMatrixAt(k, CERO); }
      // la línea de la luz a su tarjeta se traza mientras la tarjeta sale
      vR.copy(vP).lerp(vQ, Math.min(1, a * 1.25)); vR.y -= CHH / 2 * Math.min(1, a * 1.25) * (1 - pliega);
      hp.setXYZ(i * 4 + 2, vP.x, vP.y, vP.z); hp.setXYZ(i * 4 + 3, vR.x, vR.y, vR.z);
      const kc2 = on ? 0.42 * (1 + 1.4 * pico(a, 0.2, 1)) : 0; col.copy(C_HILO);
      hcol.setXYZ(i * 4 + 2, col.r * kc2, col.g * kc2, col.b * kc2); hcol.setXYZ(i * 4 + 3, col.r * kc2 * 0.6, col.g * kc2 * 0.6, col.b * kc2 * 0.6);
      k++;
    }
    hp.needsUpdate = hcol.needsUpdate = true;
    for (const im of [cuerposC, carasC, bordesC]) im.instanceMatrix.needsUpdate = true;
    if (TPAR) ponerTarjeta(TPAR, aPar, vAnc, reloj);
    if (TCAM) ponerTarjeta(TCAM, aCam, vAnc, reloj);
    ponerTarjeta(TCASA, tramo(um, U_SELLA + 0.004, U_SELLA + 0.02), vN.set(NX[R0], NY[R0], NZ[R0]), reloj);
  }

  return {
    escena, camara,
    medir(W, H2) {
      asp = W / H2; vert = W < H2;
      // en vertical la franja libre de arriba es baja y ancha: arco más estrecho y eslabones algo menores
      Object.assign(ARCO, vert ? { rx: 225, ry: 128, bs: 0.82 } : { rx: 290, ry: 170, bs: 1 });
      Object.assign(ARBOL, vert ? { dy: 92, hs: 1.15 } : { dy: 70, hs: 1 }); colocarArbol(); colocarCompactas();
    },
    actualizar,
  };
});

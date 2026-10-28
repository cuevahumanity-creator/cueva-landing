// ─────────────────────────────────────────────────────────────────────
//  Capítulo «ciclo»: una pieza que puede volver. En el plató de noche.
//  1. En el punto de producción (un pilar blanco con su banda menta, como en la red) cuelga una
//     losa J4 de la ventosa de una grúa: esmalte blanco, su junta de identidad cian encendida y el
//     punto ámbar a su lado. Respira en su cable.
//  2. Recorre menos. Entra el camión por debajo y la losa baja a su caja: toca, el cable se
//     afloja y se recoge. La cámara sube y lo enseña todo: una ruta larga y fantasma, que da la
//     vuelta a medio mundo, se dibuja y se apaga (eso no); el punto enciende la corta, de la red
//     a la obra, y el camión la sigue. En la obra no hay encofrado ni hormigón: la grúa coge la
//     losa del camión, la pasa por encima de la acera meciéndose y la posa en la esquina de la
//     casa. El cable se afloja, el punto salta a la losa y la lee.
//  3. Dura más, y se sabe. Se abre su pasaporte, una tarjeta que flota junto a la casa. Pasan
//     diez vueltas de sol y noche (un año cada una) mientras un aro con diez marcas se cierra
//     sobre la losa: al cerrarse, la garantía acaba y el aro se apaga; el pasaporte sigue
//     encendido: la memoria, no.
//  4. Se desmonta y vuelve (escenario ilustrativo). Delante de la casa, una acera iPath de nueve
//     losas (cinco J4, dos J2 y dos J1) apoyadas en sus bandejas, con dos alcorques de 1,50 m y su
//     bordillo. Las juntas se abren: no hay nada que soltar. La ventosa levanta losa a losa, cada
//     una se mece en el cable y se apila con su identidad; el punto lee las pilas. Luego vuelven,
//     en otro orden, como carril bici en el tramo siguiente: juntas, pintura, separadores y dos
//     bicis pintadas. El punto lo recorre como quien lo estrena.
//  5. El carbono, con método. Un libro de cuentas abstracto: los módulos del ciclo de vida caen y
//     se apilan en una columna (A1–A3, A4, A5, B y C), todos iguales, sin valores. B no tiene dato
//     y se queda como un hueco a trazos: la columna no se encoge, porque lo que falta no es cero.
//     D baja como si fuera a sumarse y se aparta: se queda fuera, al otro lado de una raya.
//  6. Ninguna cifra de escaparate. El carril bici bajo la noche, con las identidades latiendo.
//  v6, dos tramos nuevos (el resto del guion se congela mientras duran; ver «Los tramos nuevos»):
//  A. Tras el pasaporte, en una parcela: la trama de 75 cm se enciende y seis piezas encajan a la primera (la huella
//     se cierra sin holgura, los nudos se atornillan con sus cuatro tornillos). Luego la casa cambia: el nudo se
//     suelta, el muro viaja colgado con su identidad, llegan una losa y un muro nuevos y la estancia crece.
//  B. Tras el carril: una losa falla (coral) y se abre la orden de trabajo. Llega el camión con otra del mismo
//     formato, la cuadrilla lee sus EPIs (cada uno, un vínculo), se levanta solo esa losa y se repone. Cuando un
//     operario entra bajo la carga suspendida, la zona salta en aviso y la grúa espera (simulación).
//  Escala: 1 m = 40 unidades. Todo es función de u (y del reloj para lo que respira): la grúa se
//  precalcula entera, como un péndulo con amortiguación. La cámara encaja cada plano en el hueco
//  que dejan los textos del HTML, medidos en la página.
// ─────────────────────────────────────────────────────────────────────
CUEVA.capitulo('ciclo', (ctx) => {
  const { T3, E, mezcla, tramo, COL, esmalte, estudio, punto, mirar, distancia, DATOS } = ctx;
  const escena = new T3.Scene(), camara = new T3.PerspectiveCamera(30, 1, 1, 10000);
  const plato = estudio(escena, { tema: ctx.tema });
  const cielo = escena.children.find((o) => o.isHemisphereLight);
  const BASE = { foco: plato.clave.intensity, contra: plato.contra.intensity, cielo: cielo ? cielo.intensity : 0.35 };
  const TAU = Math.PI * 2, M = 40;
  const cap = { escena, camara, fondo: COL.noche };
  const ESTADOS = DATOS?.ESTADOS || ['Instalada'];

  // ── geometría: piezas con cantos redondeados (las de la red) y mallas fundidas en una ──
  const redondo = (w, d, r) => { const s = new T3.Shape(), x = w / 2, y = d / 2; s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r); s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y); s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y); return s; };
  function normalesSuaves(g, grados = 40) {
    const p = g.attributes.position, n = p.count / 3, fn = new Float32Array(n * 3), cl = Math.cos(grados * Math.PI / 180), mapa = new Map();
    const a = new T3.Vector3(), bb = new T3.Vector3(), c = new T3.Vector3(), clave = (q) => `${Math.round(p.getX(q) * 50)},${Math.round(p.getY(q) * 50)},${Math.round(p.getZ(q) * 50)}`;
    for (let f = 0; f < n; f++) {
      a.fromBufferAttribute(p, f * 3); bb.fromBufferAttribute(p, f * 3 + 1); c.fromBufferAttribute(p, f * 3 + 2);
      c.sub(bb); a.sub(bb); c.cross(a); fn[f * 3] = c.x; fn[f * 3 + 1] = c.y; fn[f * 3 + 2] = c.z;
      for (let k = 0; k < 3; k++) { const ck = clave(f * 3 + k); let l = mapa.get(ck); if (!l) mapa.set(ck, l = []); l.push(f); }
    }
    const out = new Float32Array(p.count * 3), nf = new T3.Vector3(), ng = new T3.Vector3(), suma = new T3.Vector3();
    for (let f = 0; f < n; f++) {
      nf.fromArray(fn, f * 3).normalize();
      for (let k = 0; k < 3; k++) {
        const q = f * 3 + k; suma.set(0, 0, 0);
        for (const g2 of mapa.get(clave(q))) { ng.fromArray(fn, g2 * 3); const lg = ng.length(); if (lg > 0 && nf.dot(ng) / lg > cl) suma.add(ng); }
        if (suma.lengthSq() === 0) suma.copy(nf); suma.normalize(); out[q * 3] = suma.x; out[q * 3 + 1] = suma.y; out[q * 3 + 2] = suma.z;
      }
    }
    g.setAttribute('normal', new T3.BufferAttribute(out, 3)); return g;
  }
  // una pieza apoyada: su base en y = 0, cantos redondeados en planta y bisel arriba y abajo
  const pieza = (w, d, h, r, b) => { const g = new T3.ExtrudeGeometry(redondo(w, d, r), { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.8, bevelOffset: -b * 0.8, bevelSegments: 3, curveSegments: 4 }); g.rotateX(-Math.PI / 2); g.translate(0, b, 0); return normalesSuaves(g, 50); };
  const caja = (w, h, d, x, y, z) => new T3.BoxGeometry(w, h, d).translate(x, y + h / 2, z);   // y es la base
  function palo(ax, ay, az, bx, by, bz, r) {
    const d = new T3.Vector3(bx - ax, by - ay, bz - az), L = d.length(), g = new T3.CylinderGeometry(r, r, L, 6, 1, true);
    g.applyQuaternion(new T3.Quaternion().setFromUnitVectors(new T3.Vector3(0, 1, 0), d.normalize())); g.translate((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); return g;
  }
  // une geometrías, cada una con su color, en una sola malla: una llamada de dibujo
  function fundir(partes) {
    const pos = [], nor = [], col = [], c = new T3.Color();
    for (const [g0, hex] of partes) {
      const g = g0.index ? g0.toNonIndexed() : g0; if (!g.attributes.normal) g.computeVertexNormals();
      c.setHex(hex); const p = g.attributes.position, n = g.attributes.normal;
      for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(c.r, c.g, c.b); }
    }
    const g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(col, 3));
    g.computeBoundingSphere(); return g;
  }
  // un aro plano de radio 1: n tramos, cada uno lleno en la fracción «lleno» (el de la red)
  function aroGeo(r0, n, lleno, seg) {
    const pos = [], idx = [];
    for (let k = 0; k < n; k++) {
      const a0 = k / n * TAU, a1 = a0 + lleno / n * TAU, b = pos.length / 3;
      for (let s = 0; s <= seg; s++) { const a = mezcla(a0, a1, s / seg); pos.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a), 0, Math.sin(a)); }
      for (let s = 0; s < seg; s++) { const i = b + s * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
    }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }

  // ── texturas ──
  const anis = Math.min(8, ctx.renderer.capabilities.getMaxAnisotropy?.() || 1);
  const lienzoTx = (w, h, pinta) => { const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; };
  const radial = lienzoTx(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.45)'); g.addColorStop(0.6, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const vertical = lienzoTx(4, 128, (x) => { const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,.18)'); g.addColorStop(0.9, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = g; x.fillRect(0, 0, 4, 128); });
  // la marca de identidad de cada losa: un cuadradito con su halo (se tiñe de cian por instancia)
  const txMarca = lienzoTx(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.4, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#fff'; x.beginPath(); if (x.roundRect) x.roundRect(47, 47, 34, 34, 7); else x.rect(47, 47, 34, 34); x.fill(); });
  const aditivo = (o = {}) => new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, ...o });
  const OCULTO = new T3.Matrix4().makeScale(0, 0, 0);
  const instancias = (geo, mat, n, sombra = false) => { const m = new T3.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.castShadow = sombra; m.receiveShadow = true; const c = new T3.Color(0xffffff); for (let i = 0; i < n; i++) { m.setColorAt(i, c); m.setMatrixAt(i, OCULTO); } escena.add(m); return m; };

  // ── el mundo, a escala ─────────────────────────────────────────────
  const CANTO = 5.6, BAND = 2, ALTO_A = CANTO + BAND;                       // losa de 14 cm sobre su bandeja de 5 cm
  const ACERA = { x0: -1000, x1: -160, z0: 0, z1: 120 }, BOR = { z0: 120, z1: 126, h: 9 };
  const CARRIL = { x0: 160, z0: 134 };                                       // el tramo siguiente, ya en la calzada
  const ALA = { x0: -560, x1: -440, z0: -160, z1: -40, h: 112 }; ALA.cx = (ALA.x0 + ALA.x1) / 2; ALA.cz = (ALA.z0 + ALA.z1) / 2;   // la esquina de la casa
  const Y_ALA = ALA.h + 8, Y_CAM = 48 + 8, Y_COLG = 172;                     // la cara de arriba de la losa: posada, en el camión y colgada
  const LIBRO = new T3.Vector3(430, 0, -700);

  // la ruta del camión: del punto de producción de la red a la obra, y de vuelta a la carretera
  const RUTA = new T3.CatmullRomCurve3([[-5200, 430], [-3700, 430], [-3400, 430], [-3100, 430], [-2600, 540], [-2000, 610], [-1400, 450], [-950, 250], [-800, 230], [-500, 230], [-200, 230], [400, 230], [2400, 230], [4400, 230]]
    .map(([x, z]) => new T3.Vector3(x, 0, z)), false, 'centripetal');
  const NR = 2000, RP = RUTA.getSpacedPoints(NR), PASO_R = RUTA.getLength() / NR;
  const cercano = (x, z) => { let m = 0, dm = Infinity; RP.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < dm) { dm = d; m = i; } }); return m; };
  const iNodo = cercano(-3400, 430), iObra = cercano(-500, 230), L_NODO = iNodo * PASO_R, L_OBRA = iObra * PASO_R;
  const NS = RP[iNodo].clone(), OS = RP[iObra].clone();                       // donde para el camión: en el punto de producción y en la obra
  const sigR = new T3.Vector3();
  function enRuta(L, out, dir) { const f = Math.max(0, Math.min(NR - 1e-3, L / PASO_R)), i = Math.floor(f), w = f - i; out.lerpVectors(RP[i], RP[i + 1], w); if (dir) dir.subVectors(RP[i + 1], RP[i]).normalize(); return out; }

  // ── la calle: calzada, bordillo, aceras, alcorques y las medianeras de fondo, en una malla ──
  const ARBOLES = [[-730, 90], [-370, 90]];                               // los de los alcorques del tramo iPath
  const ALCORQUES = [[6, 1.5], [15, 1.5]];
  {
    const partes = [
      [caja(14000, 0.4, 1200, 0, 0, 126 + 600), 0x0a0d13],                                  // la calzada
      [caja(14000, BOR.h, BOR.z1 - BOR.z0, 0, 0, (BOR.z0 + BOR.z1) / 2), 0x606978],           // el bordillo
      [caja(6000, ALTO_A, 120, -1000 - 3000, 0, 60), 0x151a23], [caja(7000, ALTO_A, 120, -160 + 3500, 0, 60), 0x151a23],   // las aceras de siempre
      [caja(840, 0.8, 120, (ACERA.x0 + ACERA.x1) / 2, 0, 60), 0x10141c],                    // la base del tramo iPath: queda a la vista al levantarlo
    ];
    for (const [ax, az] of ALCORQUES) partes.push([caja(58, 7.1, 58, ACERA.x0 + (ax + 0.75) * M, 0, (az + 0.75) * M), 0x0b0e14]);
    // medianeras: volúmenes oscuros que hacen manzana, lejos del foco
    for (const [x, z, w, h, d] of [[-1380, -600, 220, 200, 260], [-1040, -560, 260, 190, 300], [-150, -680, 380, 300, 300], [1060, -560, 440, 220, 340], [1640, -470, 320, 330, 300], [-2560, -520, 380, 210, 320]])
      partes.push([caja(w, h, d, x, 0, z), 0x12161e]);
    for (let x = -6000; x < 6000; x += 240) partes.push([caja(110, 0.25, 4, x, 0.4, 500), 0x2a303a]);   // el eje de la calzada
    const ciudad = new T3.Mesh(fundir(partes), new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0, envMapIntensity: 0.25 }));
    ciudad.receiveShadow = true; escena.add(ciudad);
  }
  // la casa: un volumen blanco y, a su lado, la esquina que espera la losa (dos muros)
  {
    const BL = 0xF4F6FA, VID = 0x0b1018;
    const g = fundir([
      [pieza(200, 240, 230, 6, 3).translate(-660, 0, -160), BL],
      [pieza(8, 120, ALA.h, 1.5, 1).translate(ALA.x1 - 4, 0, ALA.cz), BL], [pieza(112, 8, ALA.h, 1.5, 1).translate(ALA.x0 + 56, 0, ALA.z0 + 4), BL],
      [caja(56, 84, 1.2, -712, 120, -39.6), VID], [caja(44, 104, 1.2, -606, 0.5, -39.6), VID], [caja(70, 56, 1.2, -650, 168, -39.6), VID],
      [caja(1.2, 70, 60, -760.6, 120, -170), VID],
    ]);
    const casa = new T3.Mesh(g, esmalte(0xffffff, { vertexColors: true, roughness: 0.34 })); casa.castShadow = true; casa.receiveShadow = true; escena.add(casa);
  }
  // los árboles de los alcorques: jóvenes, tronco fino y una copa de tres bultos, mate
  const COPA = 0x33404a;
  const arboles = instancias(fundir([[new T3.CylinderGeometry(1.8, 2.8, 92, 8).translate(0, 46, 0), 0x2b313b],
    [new T3.IcosahedronGeometry(25, 1).translate(0, 112, 0), COPA], [new T3.IcosahedronGeometry(19, 1).translate(14, 98, 7), COPA], [new T3.IcosahedronGeometry(17, 1).translate(-12, 101, -9), COPA], [new T3.IcosahedronGeometry(14, 1).translate(3, 132, -4), COPA]]),
    new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, flatShading: true }), ARBOLES.length, true);
  { const mm = new T3.Matrix4(); ARBOLES.forEach(([x, z], i) => arboles.setMatrixAt(i, mm.makeRotationY(i * 1.7).setPosition(x, 0, z))); }

  // ── el punto de producción: su pilar con la banda menta, su charco y su haz ──
  const PILAR = new T3.Vector3(NS.x - 210, 0, NS.z - 330), ALTO_PILAR = 175;
  const pilar = new T3.Mesh(pieza(64, 64, ALTO_PILAR, 11, 4), esmalte(COL.blanco)); pilar.position.copy(PILAR); pilar.castShadow = true; pilar.receiveShadow = true; escena.add(pilar);
  const banda = new T3.Mesh(pieza(71, 71, 14, 13, 2), new T3.MeshBasicMaterial({ color: COL.menta })); banda.position.set(PILAR.x, ALTO_PILAR * 0.72, PILAR.z); escena.add(banda);
  const haz = new T3.Mesh(new T3.CylinderGeometry(1, 0.32, 1, 32, 1, true).translate(0, 0.5, 0), aditivo({ map: vertical, color: COL.menta })); haz.position.set(PILAR.x, ALTO_PILAR, PILAR.z); haz.scale.set(34, 900, 34); escena.add(haz);

  // ── las dos rutas, como cintas de luz en el suelo ──
  function cinta(pts, ancho) {
    const n = pts.length, pos = new Float32Array(n * 6), s = new Float32Array(n * 2), v = new Float32Array(n * 2), idx = [];
    const acum = [0]; for (let i = 1; i < n; i++) acum.push(acum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const L = acum[n - 1];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], tx = b.x - a.x, tz = b.z - a.z, k = Math.hypot(tx, tz) || 1, nx = -tz / k * ancho / 2, nz = tx / k * ancho / 2;
      pos.set([pts[i].x + nx, 0.9, pts[i].z + nz, pts[i].x - nx, 0.9, pts[i].z - nz], i * 6);
      s[i * 2] = s[i * 2 + 1] = acum[i] / L; v[i * 2] = 1; v[i * 2 + 1] = -1;
      if (i < n - 1) { const q = i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('aS', new T3.BufferAttribute(s, 1)); g.setAttribute('aV', new T3.BufferAttribute(v, 1)); g.setIndex(idx);
    g.computeBoundingSphere(); g.userData.largo = L; return g;
  }
  // se dibuja hasta uA (con la punta más viva) y brilla uB; la fantasma va a trazos y se apaga hacia lejos
  function matCinta(hex, U, rayas) {
    const m = aditivo({ color: hex });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'attribute float aS, aV;\nvarying float vS, vV;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvS = aS; vV = aV;');
      sh.fragmentShader = 'uniform float uA, uB, uL;\nvarying float vS, vV;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        if (vS > uA) discard;
        float borde = 1.0 - vV * vV;
        float a = borde * uB;
        ${rayas ? 'a *= step(0.42, fract(vS * uL)) * (1.0 - 0.8 * vS);' : 'a *= 0.75 + 0.25 * borde;'}
        float punta = smoothstep(0.025, 0.0, uA - vS) * step(uA, 0.999);
        diffuseColor.rgb = diffuseColor.rgb * a + vec3(1.0, 0.92, 0.8) * punta * borde * 1.4 * uB;`);
    };
    return m;
  }
  const UC = { uA: { value: 0 }, uB: { value: 0 }, uL: { value: 1 } }, UF = { uA: { value: 0 }, uB: { value: 0 }, uL: { value: 1 } };
  const geoCorta = cinta(RP.slice(iNodo, iObra + 1), 15);
  const corta = new T3.Mesh(geoCorta, matCinta(COL.cian, UC, false)); corta.renderOrder = 2; escena.add(corta);
  const FANTASMA = new T3.CatmullRomCurve3([[-500, 230], [100, 560], [800, 420], [1300, -500], [1000, -2000], [-400, -3200], [-2600, -3700], [-4700, -2900], [-5900, -1300], [-6300, 700], [-5300, 2300], [-3200, 2700], [-1200, 2300], [700, 2900], [2700, 3900], [5200, 4200]]
    .map(([x, z]) => new T3.Vector3(x, 0, z)), false, 'centripetal');
  const geoFant = cinta(FANTASMA.getSpacedPoints(2400), 22); UF.uL.value = geoFant.userData.largo / 70;
  const fantasma = new T3.Mesh(geoFant, matCinta(COL.cuerda, UF, true)); fantasma.renderOrder = 1; escena.add(fantasma);

  // ── el camión: cabina blanca, caja oscura y seis ruedas (mira hacia +x; su origen, el centro de la caja) ──
  const camion = new T3.Mesh(fundir([
    [caja(400, 14, 78, 22, 19, 0), 0x1a1f28], [caja(272, 8, 104, 0, 40, 0), 0x2b313c], [caja(272, 10, 3, 0, 48, 51), 0x2b313c], [caja(272, 10, 3, 0, 48, -51), 0x2b313c],
    [pieza(92, 102, 102, 12, 3).translate(186, 20, 0), 0xEEF1F6], [caja(2, 36, 86, 232, 76, 0), 0x0a0e14], [caja(44, 30, 103, 196, 80, 0), 0x0a0e14], [caja(8, 70, 104, 137, 30, 0), 0x2b313c],
  ]), esmalte(0xffffff, { vertexColors: true, roughness: 0.32 }));
  camion.castShadow = true; camion.receiveShadow = true; camion.rotation.order = 'YZX'; escena.add(camion);
  const RUEDAS = [[-96, 50], [-96, -50], [-48, 50], [-48, -50], [186, 50], [186, -50]], R_RUEDA = 19;
  const ruedas = instancias(new T3.CylinderGeometry(R_RUEDA, R_RUEDA, 14, 20).rotateX(Math.PI / 2), new T3.MeshStandardMaterial({ color: 0x0d1016, roughness: 0.7 }), RUEDAS.length, true);

  // ── la grúa: no se ve (está arriba, en la noche); solo su cable, el gancho y la ventosa ──
  //  la ventosa: cuatro platos sobre la losa, un bastidor en cruz, la bomba, las eslingas y el gancho
  const RIG = 62, LCAB = 760;
  const ventosa = new T3.Mesh(fundir([
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].flatMap(([a, b]) => [[new T3.CylinderGeometry(8.5, 9, 3, 16).translate(a * 21, 1.5, b * 21), 0x161a22], [palo(a * 21, 3, b * 21, a * 21, 12, b * 21, 1.4), 0x8a93a6], [palo(a * 30, 15, b * 30, 0, 52, 0, 0.55), 0xC9D2E3]]),
    [caja(68, 4, 6, 0, 11, 0), 0x8a93a6], [caja(6, 4, 68, 0, 11, 0), 0x8a93a6], [pieza(24, 18, 13, 3, 1.2).translate(0, 15, 0), 0xEEF1F6], [caja(16, 1.2, 0.8, 0, 22, 9.2), 0x56DCE6],
    [new T3.TorusGeometry(5, 1.4, 8, 18).translate(0, 57, 0), 0x9aa3b4],
  ]), new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.45 }));
  ventosa.castShadow = true; escena.add(ventosa);
  // el cable: brilla abajo, junto al gancho, y se pierde hacia arriba en la noche
  const NCB = 26, cCab = new T3.Color(COL.cuerda);
  const cable = (() => {
    const g = new T3.BufferGeometry(), pos = new Float32Array(NCB * 3), col = new Float32Array(NCB * 3);
    for (let i = 0; i < NCB; i++) { const k = 0.95 * Math.pow(1 - i / (NCB - 1), 3.2); col[i * 3] = cCab.r * k; col[i * 3 + 1] = cCab.g * k; col[i * 3 + 2] = cCab.b * k; }
    g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('color', new T3.BufferAttribute(col, 3));
    const l = new T3.Line(g, new T3.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false })); l.frustumCulled = false; l.visible = false; escena.add(l); return l;
  })();

  // ── la losa de la casa: J4 de esmalte con su junta de identidad cian ──
  const LJ4 = 118, CANTO_J4 = 8;
  const losa = new T3.Mesh(pieza(LJ4, LJ4, CANTO_J4, 3, 1.5), esmalte(COL.blanco)); losa.castShadow = true; losa.receiveShadow = true; escena.add(losa);
  const junta = new T3.Mesh(pieza(LJ4 + 1.4, LJ4 + 1.4, 1.3, 3.6, 0.3), new T3.MeshBasicMaterial({ color: COL.cian })); junta.position.y = 3.4; losa.add(junta);

  // ── la acera iPath (catálogo municipal iPath, escenario de CUEVA ORIGEN): [tipo, x, z, largo, ancho] en metros ──
  const PIEZAS = [['J4', 0, 0, 3, 3], ['J4', 3, 0, 3, 3], ['J1', 6, 0, 1.5, 1.5], ['J2', 7.5, 0, 1.5, 3], ['J4', 9, 0, 3, 3], ['J4', 12, 0, 3, 3], ['J1', 15, 0, 1.5, 1.5], ['J2', 16.5, 0, 1.5, 3], ['J4', 18, 0, 3, 3]];
  // el carril bici: los mismos 3 m de ancho, otro orden; las pilas se vacían por arriba y el carril se llena de un extremo a otro
  const CARRIL_POS = [[0, 0], [3, 0], [4.5, 0], [7.5, 0], [7.5, 1.5], [9, 0], [12, 0], [13.5, 0], [16.5, 0]];
  const EN_CARRIL = [0, 3, 1, 2, 6, 4, 7, 5, 8], ORDEN = [8, 7, 6, 5, 4, 3, 2, 1, 0];
  const PILA = { J4: -70, J2: 30, J1: 100 }, PASO_PILA = ALTO_A + 0.5;
  const nivel = { J4: 0, J2: 0, J1: 0 };
  const LS = PIEZAS.map(([tipo, x, z, l, a], j) => ({ j, tipo, l: l * M, a: a * M,
    acera: new T3.Vector3(ACERA.x0 + (x + l / 2) * M, ALTO_A, (z + a / 2) * M), pila: null, carril: null,
    esc: [(l * M - 1.2) / 58.8, (a * M - 1.2) / 58.8], escB: [(l * M - 4) / 56, (a * M - 4) / 56], fase: j * 0.71 }));
  for (const j of ORDEN) { const L = LS[j], n = nivel[L.tipo]++; L.pila = new T3.Vector3(PILA[L.tipo], ALTO_A + n * PASO_PILA + ALTO_A, 60); }
  EN_CARRIL.forEach((j, k) => { const L = LS[j], [x, z] = CARRIL_POS[k]; L.carril = new T3.Vector3(CARRIL.x0 + x * M + L.l / 2, ALTO_A, CARRIL.z0 + z * M + L.a / 2); });
  const losas = instancias(pieza(58.8, 58.8, CANTO, 1.8, 0.9), esmalte(0xEDF0F5, { roughness: 0.4, clearcoat: 0.6 }), 10, true);   // 9: la de reposición
  const bandejas = instancias(new T3.BoxGeometry(56, BAND, 56).translate(0, BAND / 2, 0), new T3.MeshStandardMaterial({ color: 0x2a303b, roughness: 0.66 }), 10, false);
  const marcas = instancias(new T3.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ map: txMarca, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }), 19);   // 0-8 la acera, 9 la losa de la casa, 10 la de reposición, 11-18 las de la parcela
  // las juntas: entre losas, un cordón de relleno; no hay conector que soltar
  function juntasDe(rs) {
    const out = [];
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j];
      for (const [xa, xb] of [[a.x + a.l, b.x], [b.x + b.l, a.x]]) if (Math.abs(xa - xb) < 1e-6) { const z0 = Math.max(a.z, b.z), z1 = Math.min(a.z + a.a, b.z + b.a); if (z1 - z0 > 0.1) out.push({ x: xa, z: (z0 + z1) / 2, largo: z1 - z0, enX: false }); }
      for (const [za, zb] of [[a.z + a.a, b.z], [b.z + b.a, a.z]]) if (Math.abs(za - zb) < 1e-6) { const x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.l, b.x + b.l); if (x1 - x0 > 0.1) out.push({ x: (x0 + x1) / 2, z: za, largo: x1 - x0, enX: true }); }
    }
    return out;
  }
  const JA = juntasDe(PIEZAS.map(([, x, z, l, a]) => ({ x, z, l, a }))).map((q) => ({ ...q, wx: ACERA.x0 + q.x * M, wz: q.z * M }));
  const JB = juntasDe(EN_CARRIL.map((j, k) => ({ x: CARRIL_POS[k][0], z: CARRIL_POS[k][1], l: PIEZAS[j][3], a: PIEZAS[j][4] }))).map((q) => ({ ...q, wx: CARRIL.x0 + q.x * M, wz: CARRIL.z0 + q.z * M }));
  const juntas = instancias(new T3.BoxGeometry(1, 1, 1), new T3.MeshBasicMaterial({ color: 0xffffff }), JA.length + JB.length);
  const XJA = [Math.min(...JA.map((q) => q.wx)), Math.max(...JA.map((q) => q.wx))], XJB = [Math.min(...JB.map((q) => q.wx)), Math.max(...JB.map((q) => q.wx))];

  // la pintura del carril: dos bordes, el eje a trazos y el eje de la calzada que ya estaba
  const NE = 10, pintura = instancias(new T3.BoxGeometry(1, 0.3, 1), new T3.MeshStandardMaterial({ color: COL.tinta, roughness: 0.7 }), 2 + NE);   // pintura en tinta sobre el esmalte
  const separadores = instancias(pieza(100, 6, 7, 2, 1), esmalte(0xd9dee6, { roughness: 0.4 }), 6, true);

  // ── los rótulos: un atlas con Inter (módulos del ciclo de vida, avisos, la bici pintada, la llave y el pin de la fuente) ──
  const CELDAS = ['A1–A3', 'A4', 'A5', 'B', 'C', 'D', 'Sin dato', 'Se informa aparte', 'bici', 'llave', 'cantidad × factor', 'fuente', 'nunca se resta'];
  const cvAtlas = document.createElement('canvas'); cvAtlas.width = 1024; cvAtlas.height = 1024;
  const txAtlas = new T3.CanvasTexture(cvAtlas); txAtlas.colorSpace = T3.SRGBColorSpace; txAtlas.anisotropy = anis;
  function pintarAtlas() {
    const x = cvAtlas.getContext('2d'); x.clearRect(0, 0, 1024, 1024); x.textAlign = 'center'; x.textBaseline = 'middle';
    CELDAS.forEach((t, i) => {
      const cx = (i % 2) * 512 + 256, cy = Math.floor(i / 2) * 128 + 64;
      x.save(); x.beginPath(); x.rect(cx - 254, cy - 62, 508, 124); x.clip();
      if (t === 'bici') {
        // la bici del carril, como se pinta en la calle: dos ruedas y el cuadro
        x.strokeStyle = '#fff'; x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round';
        const r = 34, ax = cx - 62, bx = cx + 62, y = cy + 14;
        x.beginPath(); x.arc(ax, y, r, 0, TAU); x.stroke(); x.beginPath(); x.arc(bx, y, r, 0, TAU); x.stroke();
        x.beginPath(); x.moveTo(ax, y); x.lineTo(cx - 8, y); x.lineTo(cx + 30, cy - 26); x.lineTo(cx - 22, cy - 26); x.lineTo(ax, y); x.moveTo(cx - 8, y); x.lineTo(cx - 30, cy - 40); x.moveTo(cx - 44, cy - 40); x.lineTo(cx - 18, cy - 40);
        x.moveTo(bx, y); x.lineTo(cx + 36, cy - 38); x.lineTo(cx + 56, cy - 40); x.stroke();
      } else if (t === 'llave') {
        // una llave fija: mango y boca abierta
        x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineWidth = 20; x.lineCap = 'round';
        x.beginPath(); x.moveTo(cx - 70, cy + 34); x.lineTo(cx + 22, cy - 14); x.stroke();
        x.beginPath(); x.arc(cx + 42, cy - 26, 30, 0, TAU); x.fill();
        x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(cx + 44, cy - 28); x.lineTo(cx + 84, cy - 66); x.lineTo(cx + 92, cy - 30); x.closePath(); x.fill();
        x.beginPath(); x.arc(cx + 46, cy - 30, 11, 0, TAU); x.fill();
      } else if (t === 'fuente') {
        // el pin de la fuente: cada factor, citado
        x.fillStyle = '#56DCE6'; x.beginPath(); x.arc(cx - 86, cy - 12, 24, Math.PI * 0.85, Math.PI * 2.15); x.lineTo(cx - 86, cy + 38); x.closePath(); x.fill();
        x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(cx - 86, cy - 12, 9, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over';
        x.font = '500 58px Inter, system-ui, sans-serif'; x.fillStyle = '#C9D2E3'; x.textAlign = 'left'; x.fillText('fuente', cx - 46, cy + 4);
      } else {
        const mod = i < 6; x.font = mod ? '640 88px Inter, system-ui, sans-serif' : '500 56px Inter, system-ui, sans-serif'; x.fillStyle = mod ? '#F4F6FA' : i >= 10 ? '#C9D2E3' : '#9AA3B4';
        x.fillText(t, cx, cy + 4, 480);
      }
      x.restore();
    });
    txAtlas.needsUpdate = true;
  }
  pintarAtlas();
  // cada instancia lee su celda del atlas; los impresos van en tinta (sobre el esmalte), los avisos, en luz
  function rotulosDe(celdas, mat) {
    const g = new T3.PlaneGeometry(1, 1), cel = new Float32Array(celdas.length * 2);
    celdas.forEach((c, i) => { cel[i * 2] = c % 2; cel[i * 2 + 1] = Math.floor(c / 2); });
    g.setAttribute('aCelda', new T3.InstancedBufferAttribute(cel, 2));
    mat.onBeforeCompile = (sh) => { sh.vertexShader = 'attribute vec2 aCelda;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vMapUv = vec2((aCelda.x + uv.x) * 0.5, 1.0 - (aCelda.y + 1.0 - uv.y) * 0.125);'); };
    return instancias(g, mat, celdas.length);
  }
  const impresos = rotulosDe([0, 1, 2, 4, 5, 8, 8], new T3.MeshBasicMaterial({ map: txAtlas, transparent: true, depthWrite: false, toneMapped: false, side: T3.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));   // A1–A3, A4, A5, C, D y las dos bicis
  // 0 B, 1 sin dato, 2 aparte, 3 la llave, 4 nunca se resta y, por bloque, «cantidad × factor» y su «fuente» (5 + 2k, 6 + 2k)
  const avisos = rotulosDe([3, 6, 7, 9, 12, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11], aditivo({ map: txAtlas, toneMapped: false }));

  // ── el libro del carbono: módulos iguales, sin valores ──
  const BLQ = { w: 120, h: 22, paso: 25 }, D_POS = new T3.Vector3(LIBRO.x + 205, 0, LIBRO.z);
  const bloques = instancias(pieza(BLQ.w, BLQ.w, BLQ.h, 4, 2), esmalte(0xffffff, { roughness: 0.3 }), 5, true);   // A1–A3, A4, A5, C y D
  bloques.setColorAt(4, new T3.Color(0x7cc8ee));                            // D, aparte: en ion
  // el guion del libro: introducción, seis etapas (una por módulo) y tres reglas
  const PASO_E = 0.1 / 6, ETAPA = (k) => 0.79 + k * PASO_E, REGLA = [0.905, 0.922, 0.939, 0.956];
  const NIVEL_BLQ = [0, 1, 2, 4, -1], ATERRIZA = [ETAPA(0) + 0.012, ETAPA(1) + 0.012, ETAPA(2) + 0.012, ETAPA(4) + 0.012, ETAPA(5) + 0.0125];
  // los huecos de la cuenta: seis contornos a trazos (cinco en la columna y D aparte); cada módulo que llega tapa el suyo, B no
  const SLOTS = [[LIBRO.x, 0], [LIBRO.x, 1], [LIBRO.x, 2], [LIBRO.x, 3], [LIBRO.x, 4], [D_POS.x, 0]];
  const UVIS = { uVis: { value: [0, 0, 0, 0, 0, 0] } };
  const marcosLibro = (() => {
    const pos = [], sl = [], e = new T3.EdgesGeometry(new T3.BoxGeometry(BLQ.w, BLQ.h, BLQ.w)), p = e.attributes.position;
    SLOTS.forEach(([x, k], i) => { for (let j = 0; j < p.count; j++) { pos.push(p.getX(j) + x, p.getY(j) + k * BLQ.paso + BLQ.h / 2, p.getZ(j) + LIBRO.z); sl.push(i); } });
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('aSlot', new T3.Float32BufferAttribute(sl, 1));
    const m = new T3.LineSegments(g, new T3.LineDashedMaterial({ color: COL.cuerda, dashSize: 5, gapSize: 4, transparent: true, depthWrite: false }));
    m.material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, UVIS);
      sh.vertexShader = 'attribute float aSlot;\nuniform float uVis[6];\nvarying float vVis;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvVis = uVis[int(aSlot + 0.5)];');
      sh.fragmentShader = 'varying float vVis;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nif (vVis < 0.01) discard;\ndiffuseColor.a *= min(1.0, vVis);\ndiffuseColor.rgb *= 1.0 + 0.6 * max(0.0, vVis - 1.0);');
    };
    m.computeLineDistances(); m.frustumCulled = false; escena.add(m); return m;
  })();
  // B, sin dato: un resplandor suave donde debería estar el valor
  const brilloB = new T3.Mesh(new T3.BoxGeometry(BLQ.w - 4, BLQ.h - 3, BLQ.w - 4), aditivo({ color: 0x9fc6e8, side: T3.FrontSide }));
  brilloB.position.set(LIBRO.x, 3 * BLQ.paso + BLQ.h / 2, LIBRO.z); escena.add(brilloB);
  const XR = LIBRO.x + 128;
  const raya = new T3.LineSegments(new T3.BufferGeometry().setFromPoints([new T3.Vector3(XR, 0.6, LIBRO.z + 90), new T3.Vector3(XR, 0.6, LIBRO.z - 90), new T3.Vector3(XR, 0.6, LIBRO.z + 70), new T3.Vector3(XR, 150, LIBRO.z + 70)]),
    new T3.LineDashedMaterial({ color: COL.cuerda, dashSize: 6, gapSize: 5, transparent: true, opacity: 0 }));
  raya.computeLineDistances(); escena.add(raya);
  // la raya, cuando D intenta restar: un muro de luz que no le deja pasar
  const muro = new T3.Mesh(new T3.PlaneGeometry(1, 1).rotateY(Math.PI / 2).translate(0, 0.5, 0), aditivo({ map: vertical, color: COL.cuerda }));
  muro.position.set(XR, 0, LIBRO.z); muro.scale.set(1, 160, 180); escena.add(muro);

  // ── las viñetas: lo que quiere decir cada módulo en la vida de la losa, en un plató pequeño junto al libro ──
  const VIG = new T3.Vector3(LIBRO.x - 228, 0, LIBRO.z + 70), PT = 4, ESC_CAM = 0.16, VS = 1.35;   // VS: la viñeta entera, a escala alrededor de su centro
  const platillo = new T3.Mesh(new T3.CylinderGeometry(96, 99, PT, 56).translate(0, PT / 2, 0), esmalte(0x141a24, { roughness: 0.5, clearcoat: 0.5 }));
  platillo.receiveShadow = true; platillo.position.copy(VIG); escena.add(platillo);
  // 0 la pieza; 1-3 la cantera; 4 el silo; 5-8 el molde; 9-10 el pilar y su banda; 11 la casa; 12-13 los muros; 14 el parche; 15-16 los contenedores; 17-18 el carril y su raya
  const mini = instancias(pieza(1, 1, 1, 0.14, 0.08), esmalte(0xffffff, { roughness: 0.34 }), 19, true);
  [0xF4F6FA, 0x6d7788, 0x6d7788, 0x6d7788, 0xC9D2E3, 0x2b313c, 0x2b313c, 0x2b313c, 0x2b313c, 0xF4F6FA, COL.menta, 0xF4F6FA, 0xF4F6FA, 0xF4F6FA, COL.cian, 0x2b313c, 0x2b313c, 0xEDF0F5, COL.tinta]
    .forEach((h, i) => mini.setColorAt(i, new T3.Color(h)));
  const NP = 12, piedras = instancias(new T3.IcosahedronGeometry(1, 0), new T3.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true }), NP);
  for (let i = 0; i < NP; i++) piedras.setColorAt(i, new T3.Color(i < 8 ? 0x8a93a6 : 0xd9dee6));   // áridos de la cantera y cemento del silo
  for (const m of [mini, piedras]) { m.scale.setScalar(VS); m.position.copy(VIG).multiplyScalar(1 - VS); }
  const camionMini = new T3.Mesh(camion.geometry, camion.material); camionMini.castShadow = true; escena.add(camionMini);
  const cableMini = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(new Float32Array(6), 3)), new T3.LineBasicMaterial({ color: COL.cuerda, transparent: true, opacity: 0.85 }));
  cableMini.frustumCulled = false; escena.add(cableMini);
  const LI_MOD = [...ctx.raiz.querySelectorAll('[data-modulos] li')];
  let modActivo = -2;

  // ── el pasaporte: una tarjeta que flota junto a la casa, pintada con Inter ──
  const cvCarta = document.createElement('canvas'); cvCarta.width = 640; cvCarta.height = 800;
  const txCarta = new T3.CanvasTexture(cvCarta); txCarta.colorSpace = T3.SRGBColorSpace; txCarta.anisotropy = anis;
  let estadoCarta = -1;
  const rr = (x, a, b, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, r); else x.rect(a, b, w, h); };
  function pintarCarta(cumplida) {
    const x = cvCarta.getContext('2d'); x.clearRect(0, 0, 640, 800); x.textBaseline = 'alphabetic'; x.textAlign = 'left';
    x.save(); x.shadowColor = 'rgba(86,220,230,.5)'; x.shadowBlur = 34; x.fillStyle = 'rgba(9,13,20,.92)'; rr(x, 28, 28, 584, 744, 34); x.fill(); x.restore();
    x.strokeStyle = 'rgba(86,220,230,.6)'; x.lineWidth = 2.5; rr(x, 28, 28, 584, 744, 34); x.stroke();
    x.save(); x.shadowColor = '#56DCE6'; x.shadowBlur = 14; x.fillStyle = '#56DCE6'; x.beginPath(); x.arc(84, 96, 9, 0, TAU); x.fill(); x.restore();
    x.font = '500 30px Inter, system-ui, sans-serif'; x.fillStyle = '#8A93A6'; x.fillText('Pasaporte de pieza', 110, 107);
    x.font = '700 92px Inter, system-ui, sans-serif'; x.fillStyle = '#F4F6FA'; x.fillText('J4', 66, 214);
    const fila = (y, et, val, cv = '#F4F6FA', peso = 600) => {
      x.fillStyle = 'rgba(244,246,250,.09)'; x.fillRect(66, y - 58, 508, 2);
      x.font = '500 26px Inter, system-ui, sans-serif'; x.fillStyle = '#7d8699'; x.fillText(et, 66, y - 18);
      x.font = `${peso} 34px Inter, system-ui, sans-serif`; x.fillStyle = cv; x.fillText(val, 66, y + 24);
    };
    fila(318, 'Qué es', 'Una losa de la serie J');
    fila(424, 'De dónde viene', 'Punto de producción de la red');
    // qué le ha pasado: su vida en CUEVA Manager, estado a estado, hasta instalada
    fila(530, 'Qué le ha pasado', '');
    const n = ESTADOS.length; x.strokeStyle = 'rgba(86,220,230,.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(78, 542); x.lineTo(78 + (n - 1) * 30, 542); x.stroke();
    for (let i = 0; i < n; i++) { x.fillStyle = i === n - 1 ? '#56DCE6' : 'rgba(86,220,230,.6)'; x.beginPath(); x.arc(78 + i * 30, 542, i === n - 1 ? 8 : 5.5, 0, TAU); x.fill(); }
    x.font = '600 34px Inter, system-ui, sans-serif'; x.fillStyle = '#F4F6FA'; x.fillText(ESTADOS[n - 1], 78 + (n - 1) * 30 + 26, 554);
    fila(636, 'Garantía', cumplida ? 'Cumplida' : 'Diez años', cumplida ? '#8A93A6' : '#F4F6FA');
    fila(742 - 6, 'Memoria', 'Siempre', '#56DCE6', 700);
    txCarta.needsUpdate = true;
  }
  const carta = new T3.Mesh(new T3.PlaneGeometry(196, 245), new T3.MeshBasicMaterial({ map: txCarta, transparent: true, depthWrite: false, toneMapped: false, side: T3.DoubleSide }));
  carta.renderOrder = 5; escena.add(carta);
  const CARTA_P = new T3.Vector3(ALA.x0 - 290, 300, ALA.z1 + 40);
  const hilo = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(new Float32Array(6), 3)), new T3.LineBasicMaterial({ color: COL.cian, transparent: true, opacity: 0 }));
  hilo.frustumCulled = false; escena.add(hilo);
  // el aro de la garantía, sobre la losa: diez marcas, se cierra marca a marca y, cerrado, se apaga
  const UA = { uAng: { value: 0 }, uK: { value: 0 } };
  const aro = new T3.Mesh(new T3.RingGeometry(37, 42, 160, 1).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ color: COL.ion, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  aro.material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, UA);
    sh.vertexShader = 'varying vec2 vP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvP = position.xz;');
    sh.fragmentShader = 'uniform float uAng, uK;\nvarying vec2 vP;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float f = fract(atan(vP.x, -vP.y) / 6.2831853 + 1.0);
      float marca = 1.0 - smoothstep(0.0, 0.0035, abs(fract(f * 10.0 + 0.5) - 0.5) / 10.0);
      float lleno = step(f, uAng);
      diffuseColor.a *= clamp(uK * (0.16 + 0.84 * lleno + 0.7 * marca), 0.0, 1.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.75, 0.93, 1.0), marca * lleno * 0.6);`);
  };
  aro.position.set(ALA.cx, Y_ALA + 0.4, ALA.cz); aro.renderOrder = 3; escena.add(aro);

  // ── charcos, ondas y el punto ──
  const charcos = instancias(new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), aditivo({ map: radial }), 10);   // 8 la parcela, 9 la reparación; 0 pilar, 1 su núcleo, 2 bajo la losa colgada, 3 el punto, 4 pilas, 5 libro, 6 carril, 7 la obra
  const ondas = instancias(aroGeo(0.965, 1, 1, 72), aditivo(), 12);   // 8-11: los tramos nuevos;          // 0-1 la ventosa, 2 el punto, 3 el libro, 4 el aro del pilar, 5 la losa en la casa, 6-7 carril
  const pt = punto(escena, { alcance: 240 });

  // ── la grúa, precalculada: el carro sigue sus claves; la carga cuelga como un péndulo amortiguado ──
  //  se queda atrás al arrancar, se pasa al frenar y se asienta; si se posa, el cable se afloja
  const TS = 60, DT = 1 / 1200;
  const nuevaGrua = (u0, u1) => ({ t0: u0 * TS, t1: u1 * TS, xz: [], y: [], sup: [], om: [], movs: [] });
  const kf = (K, u, ...v) => K.push([u * TS, ...v]);
  function evalua(K, t, j) {
    if (t <= K[0][0]) return K[0][j];
    for (let i = 0; i < K.length - 1; i++) { const a = K[i], b = K[i + 1]; if (t < b[0]) return mezcla(a[j], b[j], b[0] > a[0] ? E.eio((t - a[0]) / (b[0] - a[0])) : 1); }
    return K[K.length - 1][j];
  }
  function simular(G) {
    const n = Math.ceil((G.t1 - G.t0) / DT) + 2, A = new Float32Array(n * 8); G.n = n; G.A = A;
    let lx = evalua(G.xz, G.t0, 1), lz = evalua(G.xz, G.t0, 2), vx = 0, vz = 0, px = lx, pz = lz;
    for (let i = 0; i < n; i++) {
      const t = G.t0 + i * DT, hx = evalua(G.xz, t, 1), hz = evalua(G.xz, t, 2), hy = evalua(G.y, t, 1);
      let sup = -1e9; for (const s of G.sup) if (t >= s[0] && t < s[1]) sup = s[2];
      let om = 10; for (const o of G.om) if (t >= o[0] && t < o[1]) om = o[2];
      if (Math.abs(hx - px) + Math.abs(hz - pz) > 40) { lx = hx; lz = hz; vx = vz = 0; }   // el carro cambia de obra, allá arriba: la carga va con él
      px = hx; pz = hz;
      const ap = sup > hy + 0.05, ly = Math.max(hy, sup);
      if (ap) { const f = Math.exp(-40 * DT); vx *= f; vz *= f; }              // posada: el roce la para
      else { vx += (om * om * (hx - lx) - 0.44 * om * vx) * DT; vz += (om * om * (hz - lz) - 0.44 * om * vz) * DT; }
      lx += vx * DT; lz += vz * DT;
      const o = i * 8; A[o] = hx; A[o + 1] = hy; A[o + 2] = hz; A[o + 3] = lx; A[o + 4] = ly; A[o + 5] = lz; A[o + 6] = ap ? Math.min(1, (sup - hy) / 6) : 0;
    }
  }
  const gH = new T3.Vector3(), gL = new T3.Vector3(); let gAp = 0;
  function leerGrua(G, u) {
    const f = Math.max(0, Math.min(G.n - 1.001, (u * TS - G.t0) / DT)), i = Math.floor(f), w = f - i, A = G.A, a = i * 8, b = a + 8;
    gH.set(mezcla(A[a], A[b], w), mezcla(A[a + 1], A[b + 1], w), mezcla(A[a + 2], A[b + 2], w));
    gL.set(mezcla(A[a + 3], A[b + 3], w), mezcla(A[a + 4], A[b + 4], w), mezcla(A[a + 5], A[b + 5], w)); gAp = mezcla(A[a + 6], A[b + 6], w);
  }
  // acto 2: baja la losa al camión en el punto de producción; en la obra, del camión a la casa
  const ALTO_CIELO = 2600, G2 = nuevaGrua(0.1, 0.345);
  kf(G2.xz, 0.1, NS.x, NS.z); kf(G2.xz, 0.24, NS.x, NS.z); kf(G2.xz, 0.2402, OS.x, OS.z); kf(G2.xz, 0.287, OS.x, OS.z); kf(G2.xz, 0.3035, ALA.cx, ALA.cz);
  [[0.1, Y_COLG], [0.194, Y_COLG], [0.206, Y_CAM - 6], [0.2085, Y_CAM - 6], [0.222, Y_COLG + 260], [0.236, ALTO_CIELO], [0.252, ALTO_CIELO], [0.27, Y_CAM + 90], [0.2765, Y_CAM], [0.2805, Y_CAM],
    [0.291, Y_ALA + 110], [0.3, Y_ALA + 110], [0.3095, Y_ALA - 6], [0.3125, Y_ALA - 6], [0.333, ALTO_CIELO]].forEach(([u, y]) => kf(G2.y, u, y));
  G2.sup.push([0.196 * TS, 0.214 * TS, Y_CAM], [0.264 * TS, 0.284 * TS, Y_CAM], [0.296 * TS, 0.32 * TS, Y_ALA]); G2.om.push([0, 1e9, 10.5]);
  simular(G2);
  // acto 4: dieciocho viajes, cada vez más ágiles (primero se mira, luego se entiende)
  const DUR_L = [0.018, 0.014, 0.011, 0.0095, 0.0082, 0.0074, 0.0068, 0.0065, 0.0065], DUR_C = [0.0115, 0.0088, 0.0076, 0.0068, 0.0064, 0.0064, 0.0064, 0.0064, 0.0078];
  const T4 = { ini: 0.515, juntas: 0.503 }, G4 = nuevaGrua(0.486, 0.71);
  {
    let t = T4.ini, prev = LS[ORDEN[0]].acera, yc0 = Math.max(LS[ORDEN[0]].acera.y, LS[ORDEN[0]].pila.y, 60) + 64;
    kf(G4.xz, 0.486, prev.x, prev.z); kf(G4.y, 0.486, ALTO_CIELO); kf(G4.y, 0.495, ALTO_CIELO); kf(G4.y, 0.513, yc0);
    const mov = (j, A, B, D) => {
      const yC = Math.max(A.y, B.y, 60) + 64, om = Math.min(95, TAU / (0.6 * 0.3 * D * TS));
      kf(G4.xz, t, prev.x, prev.z); kf(G4.xz, t + 0.2 * D, A.x, A.z); kf(G4.xz, t + 0.44 * D, A.x, A.z); kf(G4.xz, t + 0.74 * D, B.x, B.z);
      kf(G4.y, t + 0.16 * D, yC); kf(G4.y, t + 0.3 * D, A.y); kf(G4.y, t + 0.36 * D, A.y); kf(G4.y, t + 0.5 * D, yC); kf(G4.y, t + 0.7 * D, yC); kf(G4.y, t + 0.86 * D, B.y - 6); kf(G4.y, t + 0.92 * D, B.y - 6); kf(G4.y, t + D, yC);
      G4.sup.push([t * TS, (t + 0.6 * D) * TS, A.y], [(t + 0.6 * D) * TS, (t + D) * TS, B.y]); G4.om.push([t * TS, (t + D) * TS, om]);
      const m = { j, t, D, A, B }; G4.movs.push(m); prev = B; t += D; return m;
    };
    ORDEN.forEach((j, k) => { LS[j].m1 = mov(j, LS[j].acera, LS[j].pila, DUR_L[k]); });
    T4.apilado = t; t += 0.012; T4.recoge = t;
    EN_CARRIL.forEach((j, k) => { LS[j].m2 = mov(j, LS[j].pila, LS[j].carril, DUR_C[k]); });
    T4.fin = t; kf(G4.y, t + 0.012, ALTO_CIELO);
  }
  simular(G4);
  T4.pinta = T4.fin + 0.001;                                                  // ≈ 0.69: pintura y separadores
  T4.paseo = [T4.pinta + 0.01, T4.pinta + 0.03];                            // el punto recorre el carril

  // ── la cámara: cada plano encaja su caja en el hueco que dejan los textos ──
  // los tramos nuevos: la parcela del montaje, la losa del carril que se repara y los dos estados de cámara que empalman
  const PO = new T3.Vector3(-2000, 0, -560), LR = LS[4], C0 = {}, C1 = {};
  const plano = (cx, cy, cz, mx, mz, y0, y1, lado, el) => ({ c: new T3.Vector3(cx, cy, cz), mx, mz, y0, y1, lado, el, x: cx, y: cy, z: cz, d: 1000, ox: 0, oy: 0 });
  const PL = {
    tit: plano(NS.x + 30, 110, NS.z, 112, 105, 0, 200, -0.42, 0.2),
    ruta: plano((NS.x - 120 + ALA.x1) / 2, 0, 150, (ALA.x1 - NS.x + 120) / 2, 370, 0, 200, 0.16, 0.66),
    obra: plano(OS.x + 10, 70, 40, 300, 260, 0, 250, -0.42, 0.46),
    pas: plano(ALA.x0 - 110, 170, ALA.cz + 20, 330, 150, 0, 420, 0.3, 0.32),
    leva: plano(-440, 0, 60, 470, 110, 0, 120, 0.13, 0.46),
    pila: plano(20, 20, 60, 175, 100, 0, 80, 0.3, 0.66),
    pone: plano(400, 0, 150, 470, 150, 0, 100, 0.12, 0.46),
    libro: plano(LIBRO.x + 95, 80, LIBRO.z, 235, 110, 0, 200, 0.3, 0.22),
    monta: plano(PO.x + 190, 50, PO.z + 60, 250, 150, 0, 140, 0.28, 0.52),
    cambia: plano(PO.x + 215, 50, PO.z + 60, 270, 150, 0, 140, -0.34, 0.56),
    repara: plano(670, 30, 240, 250, 175, 0, 170, 0.3, 0.6),
    segura: plano(690, 30, 250, 200, 170, 0, 160, -Math.PI / 2 - 0.42, 0.5),   // a lo largo del carril, desde su arranque: detrás del texto queda la calzada oscura
    mod: plano(LIBRO.x - 112, 55, LIBRO.z + 50, 258, 140, 0, 160, 0.16, 0.38),
    reg: plano(LIBRO.x + 20, 80, LIBRO.z + 10, 260, 110, 0, 200, -0.12, 0.26),
    fin: plano(560, 0, 194, 440, 140, 0, 40, -0.18, 0.32),
  };
  const GUION_A = [[0, 0.12, C0, PL.monta, 0.22], [0.12, 0.5, PL.monta, PL.monta], [0.5, 0.57, PL.monta, PL.cambia, 0.05], [0.57, 0.86, PL.cambia, PL.cambia], [0.86, 1.01, PL.cambia, C1, 0.24]];
  const GUION_B = [[0, 0.08, C0, PL.repara, 0.12], [0.08, 0.52, PL.repara, PL.repara], [0.52, 0.58, PL.repara, PL.segura, 0.04], [0.58, 0.9, PL.segura, PL.segura], [0.9, 1.01, PL.segura, C0, 0.12]];
  const BT = [...ctx.raiz.querySelectorAll('.beat')];
  let W = 1, H = 1, medido = -9;
  const camAux = new T3.PerspectiveCamera(30, 1, 1, 10000), esq = new T3.Vector3();
  function encajar(P, r) {
    const { c, mx, mz, y0, y1 } = P; camAux.fov = camara.fov; camAux.aspect = W / H; camAux.updateProjectionMatrix();
    const rw = Math.max(40, r[2] - r[0]) / W * 2, rh = Math.max(40, r[3] - r[1]) / H * 2;
    let d = distancia(camAux, Math.max(mz, y1 - y0) * 2, mx * 2), x0 = 0, x1 = 0, ya = 0, yb = 0;
    for (let it = 0; it < 5; it++) {
      mirar(camAux, c.x, c.y, c.z, d, P.lado, P.el); camAux.updateMatrixWorld();
      x0 = ya = Infinity; x1 = yb = -Infinity;
      for (let k = 0; k < 8; k++) {
        esq.set(c.x + (k & 1 ? mx : -mx), k & 2 ? y1 : y0, c.z + (k & 4 ? mz : -mz)).project(camAux);
        x0 = Math.min(x0, esq.x); x1 = Math.max(x1, esq.x); ya = Math.min(ya, esq.y); yb = Math.max(yb, esq.y);
      }
      if (it < 4) d *= Math.max((x1 - x0) / rw, (yb - ya) / rh);
    }
    const rcx = (r[0] + r[2]) / W - 1, rcy = 1 - (r[1] + r[3]) / H;
    P.x = c.x; P.y = c.y; P.z = c.z; P.d = d; P.lado0 = P.lado; P.el0 = P.el;
    P.ox = -(rcx - (x0 + x1) / 2) * W / 2; P.oy = (rcy - (ya + yb) / 2) * H / 2;
  }
  function huecos() {
    const m = Math.max(16, Math.min(88, W * 0.05)), vertical = W <= 760, nav = 64;
    const tope = (el, def) => (el && el.offsetHeight ? el.offsetTop : def), bajo = (el, def) => (el && el.offsetHeight ? el.offsetTop + el.offsetHeight : def);
    const lado = (el, izq) => vertical ? [m * 0.5, nav, W - m * 0.5, tope(el, H * 0.6) - 18]
      : izq ? [el.offsetLeft + el.offsetWidth + W * 0.03, nav + 20, W - m * 0.6, H - 50] : [m * 0.6, nav + 20, el.offsetLeft - W * 0.03, H - 50];
    const r0 = [m, bajo(BT[0], H * 0.35) + H * 0.02, W - m, H - H * 0.05], r4 = [m, bajo(BT[8], H * 0.35) + H * 0.02, W - m, H - H * 0.05];
    const r5 = [m, nav, W - m, tope(BT[11], H * 0.7) - H * 0.03];
    const r1 = lado(BT[1], true), r2 = lado(BT[2], false), r3 = lado(BT[5], true), r3b = lado(BT[9], true), r2b = lado(BT[10], false);
    encajar(PL.monta, lado(BT[3], true)); encajar(PL.cambia, lado(BT[4], false)); encajar(PL.repara, lado(BT[6], true)); encajar(PL.segura, lado(BT[7], false));
    encajar(PL.tit, r0); encajar(PL.ruta, r1); encajar(PL.obra, r1); encajar(PL.pas, r2); encajar(PL.leva, r3); encajar(PL.pila, r3); encajar(PL.pone, r3); encajar(PL.libro, r4); encajar(PL.mod, r3b); encajar(PL.reg, r2b); encajar(PL.fin, r5);
  }
  const cam = { x: 0, y: 0, z: 0, d: 1, lado: 0, el: 0, ox: 0, oy: 0 };
  function mezclaPlanos(a, b, w, alza) {
    cam.x = mezcla(a.x, b.x, w); cam.y = mezcla(a.y, b.y, w); cam.z = mezcla(a.z, b.z, w); cam.lado = mezcla(a.lado, b.lado, w); cam.el = mezcla(a.el, b.el, w); cam.ox = mezcla(a.ox, b.ox, w); cam.oy = mezcla(a.oy, b.oy, w);
    cam.d = Math.exp(mezcla(Math.log(a.d), Math.log(b.d), w)) * (1 + alza);
  }
  // el guion de planos: [desde, hasta, plano A, plano B, alza] (si A = B, el plano se sostiene)
  const GUION = [
    [0, 0.165, PL.tit, PL.tit], [0.165, 0.215, PL.tit, PL.ruta, 0.22], [0.215, 0.252, PL.ruta, PL.ruta], [0.252, 0.282, PL.ruta, PL.obra, 0.08], [0.282, 0.322, PL.obra, PL.obra],
    [0.322, 0.356, PL.obra, PL.pas, 0.06], [0.356, 0.478, PL.pas, PL.pas], [0.478, 0.5, PL.pas, PL.leva, 0.18], [0.5, T4.apilado - 0.004, PL.leva, PL.leva], [T4.apilado - 0.004, T4.apilado + 0.003, PL.leva, PL.pila, 0.04],
    [T4.apilado + 0.003, T4.recoge, PL.pila, PL.pila], [T4.recoge, T4.recoge + 0.012, PL.pila, PL.pone, 0.05], [T4.recoge + 0.012, 0.722, PL.pone, PL.pone], [0.722, 0.748, PL.pone, PL.libro, 0.2], [0.748, 0.782, PL.libro, PL.libro],
    [0.782, 0.795, PL.libro, PL.mod, 0.06], [0.795, 0.892, PL.mod, PL.mod], [0.892, 0.905, PL.mod, PL.reg, 0.05], [0.905, 0.958, PL.reg, PL.reg],
    [0.958, 0.975, PL.reg, PL.fin, 0.2], [0.975, 1.01, PL.fin, PL.fin],
  ];
  // mientras se sostiene un plano, la cámara deriva: [Δlado al empezar, al acabar, factor de distancia al empezar, al acabar]
  const DERIVA = new Map([[PL.tit, [-0.1, 0.06, 1.12, 0.97]], [PL.ruta, [0, 0.05, 1, 0.98]], [PL.obra, [0.05, -0.02, 1, 0.97]], [PL.pas, [-0.05, 0.12, 1.02, 0.95]], [PL.leva, [-0.02, 0.07, 1, 0.98]],
    [PL.pila, [0.05, -0.02, 1, 0.97]], [PL.pone, [0.05, -0.07, 1, 0.97]], [PL.libro, [-0.04, 0.04, 1.04, 0.97]], [PL.mod, [0.04, -0.05, 1, 0.96]], [PL.monta, [-0.04, 0.05, 1.02, 0.95]], [PL.cambia, [0.04, -0.05, 1, 0.96]], [PL.repara, [-0.04, 0.05, 1.02, 0.96]], [PL.segura, [0.04, -0.04, 1, 0.95]], [PL.reg, [0.04, -0.05, 1, 0.95]], [PL.fin, [-0.04, 0.06, 1.02, 0.96]]]);
  const derivaEn = (P, s) => { const k = DERIVA.get(P); return k ? [mezcla(k[0], k[1], s), mezcla(k[2], k[3], s)] : [0, 1]; };
  const MUESTRA = [0, 0];
  // en el desmontaje y en el carril la cámara acompaña a la grúa: mira entre donde coge y donde deja;
  // al final, acompaña al punto por el carril
  const centroMov = (m) => (m.A.x + m.B.x) / 2;
  function focoGrua(u) {
    const ms = G4.movs; if (u <= ms[0].t) return centroMov(ms[0]);
    for (let i = 0; i < ms.length; i++) { const m = ms[i]; if (u < m.t + m.D) return mezcla(centroMov(m), centroMov(ms[Math.min(ms.length - 1, i + 1)]), E.seno(tramo(u, m.t + 0.55 * m.D, m.t + m.D))); }
    const xp = CARRIL.x0 + 20 + 740 * E.eio(tramo(u, T4.paseo[0], T4.paseo[1]));
    return mezcla(centroMov(ms[ms.length - 1]), mezcla(PL.pone.c.x, xp, 0.85), E.seno(tramo(u, T4.fin, T4.paseo[0] + 0.012)));
  }
  const sigue = (P, u) => (P === PL.leva || P === PL.pone ? focoGrua(u) - P.c.x : P === PL.mod ? 70 * E.eio(tramo(u, ETAPA(5), ETAPA(5) + 0.008)) : 0);
  // y se acerca: el primer viaje se mira de cerca; luego, al coger ritmo, se abre el plano; en el paseo, otra vez cerca
  const acerca = (P, u) => P === PL.leva ? mezcla(0.56, 1, E.seno(tramo(u, T4.ini + 0.012, T4.ini + 0.05)))
    : P === PL.mod ? 1 + 0.12 * E.eio(tramo(u, ETAPA(5), ETAPA(5) + 0.008)) : P === PL.pone ? mezcla(0.62, 1, E.seno(tramo(u, T4.recoge + 0.01, T4.recoge + 0.034))) * mezcla(1, 0.68, E.seno(tramo(u, T4.fin, T4.paseo[0] + 0.006))) : 1;
  function calcCam(u) {
    let tr = GUION[GUION.length - 1]; for (const g of GUION) if (u < g[1]) { tr = g; break; }
    const [u0, u1, A, B, alza = 0] = tr, w = E.eio(tramo(u, u0, u1));
    if (A === B) {
      mezclaPlanos(A, A, 0, 0); const [dl, dd] = derivaEn(A, E.seno(tramo(u, u0, u1))); cam.lado += dl; cam.d *= dd;
      cam.x += sigue(A, u); cam.d *= acerca(A, u);
    } else {
      // de un plano a otro: suavizado, con un poco de vuelo (la cámara sube a mitad del viaje); la deriva empalma
      mezclaPlanos(A, B, w, alza * Math.sin(Math.PI * w));
      const a = DERIVA.get(A), b = DERIVA.get(B); MUESTRA[0] = mezcla(a ? a[1] : 0, b ? b[0] : 0, w); MUESTRA[1] = mezcla(a ? a[3] : 1, b ? b[2] : 1, w);
      cam.lado += MUESTRA[0]; cam.d *= MUESTRA[1];
      cam.x += mezcla(sigue(A, u), sigue(B, u), w); cam.d *= mezcla(acerca(A, u), acerca(B, u), w);
    }
  }
  const copiaCam = (o) => { o.x = cam.x; o.y = cam.y; o.z = cam.z; o.d = cam.d; o.lado = cam.lado; o.el = cam.el; o.ox = cam.ox; o.oy = cam.oy; return o; };
  function encuadrar(u, reloj) { calcCam(u); return aplicarCam(reloj); }
  function aplicarCam(reloj) {
    // la cámara respira
    const lado = cam.lado + 0.012 * Math.sin(reloj * 0.21) + 0.007 * Math.sin(reloj * 0.13), el = cam.el + 0.007 * Math.sin(reloj * 0.17), d = cam.d * (1 + 0.006 * Math.sin(reloj * 0.11));
    mirar(camara, cam.x, cam.y, cam.z, d, lado, el);
    camara.setViewOffset(W, H, cam.ox, cam.oy, W, H);
    plato.enfocar(cam.x, cam.y, cam.z, d);
    camara.updateMatrixWorld();
    return d;
  }

  // ── el tiempo pasa: diez vueltas de sol (un año cada una) sobre la casa ──
  const cNoche = new T3.Color(COL.noche), cDia = new T3.Color(0x0f1a2b), cFondo = new T3.Color(), cFrio = new T3.Color(0xc4d8ff), cCalido = new T3.Color(0xfff1de), cBlanco = new T3.Color(0xffffff), sol = new T3.Vector3();
  const TL = [0.372, 0.452];
  function luzTiempo(u, d) {
    const amp = E.seno(tramo(u, TL[0] - 0.008, TL[0] + 0.008)) * (1 - E.seno(tramo(u, TL[1] - 0.006, TL[1] + 0.01)));
    plato.contra.intensity = BASE.contra;
    if (amp <= 0) { if (cielo) { cielo.intensity = BASE.cielo; cielo.color.copy(cBlanco); } plato.clave.intensity = BASE.foco; cap.fondo = COL.noche; if (escena.fog) escena.fog.color.copy(cNoche); return; }
    const fi = 10 * tramo(u, TL[0], TL[1]), dia = amp * Math.pow(Math.sin(Math.PI * fi), 2), az = TAU * fi + 0.4;
    sol.set(ALA.cx + Math.cos(az) * d * 0.95, d * (0.55 + 0.75 * Math.sin(Math.PI * fract(fi))), ALA.cz + Math.sin(az) * d * 0.95);
    plato.clave.position.lerp(sol, amp);
    plato.clave.intensity = BASE.foco * (0.55 + 0.75 * dia);
    if (cielo) { cielo.intensity = BASE.cielo * (1 + 2.6 * dia); cielo.color.lerpColors(cFrio, cCalido, dia); }
    cFondo.lerpColors(cNoche, cDia, dia); cap.fondo = cFondo.getHex(); if (escena.fog) escena.fog.color.copy(cFondo);
  }
  const fract = (x) => x - Math.floor(x);

  // ── cada fotograma ────────────────────────────────────────────────
  const m4 = new T3.Matrix4(), m4b = new T3.Matrix4(), q4 = new T3.Quaternion(), qT = new T3.Quaternion(), qY = new T3.Quaternion(), qI = new T3.Quaternion(), v1 = new T3.Vector3(), v2 = new T3.Vector3(), v3 = new T3.Vector3(), e3 = new T3.Vector3(), eu = new T3.Euler(), c3 = new T3.Color();
  const EJEY = new T3.Vector3(0, 1, 0), dirC = new T3.Vector3(), tope = new T3.Vector3(), enganche = new T3.Vector3(), lateral = new T3.Vector3(0.83, 0, 0.56);
  const poner = (m, i, x, y, z, sx, sy, sz, ry = 0, rx = 0) => { q4.setFromEuler(eu.set(rx, ry, 0, 'YXZ')); m.setMatrixAt(i, m4.compose(v1.set(x, y, z), q4, e3.set(sx, sy, sz))); };
  const nada = (m, i) => m.setMatrixAt(i, OCULTO);
  // la marca de identidad, de dormida (cian hondo) a leída (cian casi blanco): se ve también sobre el esmalte
  const cMarcaA = new T3.Color(0x1f7d88), cMarcaB = new T3.Color(0xb8f6ff);
  const colorMarca = (i, k) => marcas.setColorAt(i, c3.lerpColors(cMarcaA, cMarcaB, Math.max(0, Math.min(1, k / 1.6))));
  const color = (m, i, hex, a) => m.setColorAt(i, c3.setHex(hex).multiplyScalar(Math.max(0, a)));
  const onda = (i, x, y, z, r0, r1, w, hex, a) => { const on = w > 0 && w < 1, r = on ? mezcla(r0, r1, E.eo(w)) : 0; if (on) poner(ondas, i, x, y, z, r, 1, r); else nada(ondas, i); color(ondas, i, hex, on ? a * (1 - w) * (1 - w) : 0); };
  const charco = (i, x, y, z, r, hex, a) => { if (a > 0.002) { poner(charcos, i, x, y, z, r, 1, r); color(charcos, i, hex, a); } else nada(charcos, i); };

  // la grúa de este fotograma: qué acto, dónde el gancho, la carga, la inclinación del cable
  const grua = { activa: false, ap: 0, mov: null };
  function moverGrua(u, reloj) {
    const G = u < 0.4 ? G2 : (u > 0.48 && u < 0.72 ? G4 : null);
    grua.activa = !!G; grua.mov = null;
    if (!G) { cable.visible = false; ventosa.visible = false; return; }
    dibujarGrua(G, u, reloj);
  }
  function dibujarGrua(G, u, reloj) {
    grua.activa = true; grua.mov = null;
    leerGrua(G, u); grua.ap = gAp;
    // en el título la losa respira en su cable
    const k = u < 0.2 ? 1 - E.seno(tramo(u, 0.182, 0.196)) : 0;
    if (k > 0) { gL.x += 6 * Math.sin(reloj * 0.83) * k; gL.z += 4 * Math.sin(reloj * 0.61 + 1.3) * k; }
    if (G === G4) for (const m of G4.movs) if (u >= m.t && u < m.t + m.D) { grua.mov = m; break; }
    // el carro está arriba, a plomo del gancho; la carga se queda atrás o se pasa: el cable se inclina
    tope.set(gH.x, gH.y + RIG + LCAB, gH.z);
    dirC.set(tope.x - gL.x, LCAB, tope.z - gL.z).normalize();
    qT.setFromUnitVectors(EJEY, dirC);
    enganche.copy(gL).addScaledVector(dirC, RIG);
    const visible = gH.y < 2200;
    ventosa.visible = visible; cable.visible = visible;
    if (!visible) return;
    ventosa.position.copy(gL); ventosa.quaternion.copy(qT);
    // si la carga se ha posado, el cable va flojo y se comba; al tensarse, vibra
    const flojo = Math.max(0, gL.y - gH.y), comba = Math.sqrt(Math.max(0, 2 * LCAB * flojo)) * 0.42;
    let vib = 0; const mv = grua.mov; if (mv) { const s = (u - (mv.t + 0.36 * mv.D)) * TS; if (s > 0) vib = 3.2 * Math.exp(-s * 7) * Math.sin(s * 70); }
    if (G === G2) { const s = (u - 0.2805) * TS; if (s > 0) vib = 3.2 * Math.exp(-s * 5) * Math.sin(s * 50); }
    const p = cable.geometry.attributes.position;
    for (let i = 0; i < NCB; i++) {
      const s = i / (NCB - 1), b = comba * 4 * s * (1 - s) + vib * Math.sin(Math.PI * s);
      p.setXYZ(i, mezcla(enganche.x, tope.x, s) + lateral.x * b, mezcla(enganche.y, tope.y, s) - comba * 0.5 * Math.sin(Math.PI * s), mezcla(enganche.z, tope.z, s) + lateral.z * b);
    }
    p.needsUpdate = true;
  }
  // la pose de una carga colgada: posición (la cara de arriba) y giro, con inclinación parcial y guiño
  const cargaP = new T3.Vector3(), cargaQ = new T3.Quaternion();
  function enCarga(inc) {
    cargaP.copy(gL);
    const ox = gL.x - gH.x, oz = gL.z - gH.z, guino = Math.max(-0.22, Math.min(0.22, 0.004 * (ox - oz)));
    qY.setFromAxisAngle(EJEY, guino); cargaQ.slerpQuaternions(qI, qT, inc * (1 - grua.ap)).multiply(qY);
  }
  // la losa de la casa: colgada, en el camión, de nuevo en el cable y, al fin, en la esquina
  const camP = new T3.Vector3(), camD = new T3.Vector3(), lCama = new T3.Vector3(), restoAla = new T3.Vector3(ALA.cx, Y_ALA, ALA.cz);
  function recorrido(u) {
    if (u < 0.192) return mezcla(L_NODO - 1500, L_NODO, E.eo(tramo(u, 0.16, 0.192)));
    if (u < 0.214) return L_NODO;
    if (u < 0.262) return mezcla(L_NODO, L_OBRA, E.eio(tramo(u, 0.214, 0.262)));
    if (u < 0.33) return L_OBRA;
    return L_OBRA + 2600 * E.ei(tramo(u, 0.33, 0.372));
  }
  function moverCamion(u) {
    camion.visible = u > 0.155 && u < 0.375;
    if (!camion.visible) { for (let i = 0; i < RUEDAS.length; i++) nada(ruedas, i); return; }
    const L = recorrido(u), h = 0.0015, ac = (recorrido(u + h) - 2 * L + recorrido(u - h)) / (h * h);
    enRuta(L, camP, camD);
    // frena y cabecea: el morro baja al frenar y la caja se recompone con un muelle
    let pitch = Math.max(-0.05, Math.min(0.05, ac * 2.4e-9));
    for (const c of [0.192, 0.262]) { const w = tramo(u, c, c + 0.016); if (w > 0 && w < 1) pitch -= 0.03 * Math.exp(-w * 5) * Math.sin(w * 15); }
    camion.position.copy(camP); camion.rotation.set(0, -Math.atan2(camD.z, camD.x), pitch, 'YZX'); camion.updateMatrixWorld();
    const giro = -L / R_RUEDA;
    RUEDAS.forEach(([x, z], i) => { q4.setFromAxisAngle(sigR.set(0, 0, 1), giro); m4b.compose(v1.set(x, R_RUEDA, z), q4, e3.set(1, 1, 1)); ruedas.setMatrixAt(i, m4.multiplyMatrices(camion.matrixWorld, m4b)); });
    lCama.set(0, 48, 0).applyMatrix4(camion.matrixWorld);
  }
  function moverLosa(u) {
    // dónde está la cara de arriba (cargaP) y cómo gira (cargaQ)
    if (u < 0.2085 || (u >= 0.278 && u < 0.3125)) {
      enCarga(0.7);
      if (u < 0.2085) { const w = E.eio(tramo(u, 0.204, 0.2085)); if (w > 0) { v2.copy(lCama).setY(lCama.y + CANTO_J4); cargaP.lerp(v2, w); cargaQ.slerp(camion.quaternion, w); } }
      else {
        const wi = E.eio(tramo(u, 0.278, 0.283)), wo = E.eio(tramo(u, 0.307, 0.3125));
        if (wi < 1) { v2.set(OS.x, Y_CAM, OS.z); cargaP.lerpVectors(v2, cargaP, wi); cargaQ.slerpQuaternions(camion.quaternion, cargaQ, wi); }
        if (wo > 0) { cargaP.lerp(restoAla, wo); cargaQ.slerp(qI, wo); }
      }
    } else if (u < 0.278) { cargaP.copy(lCama).setY(lCama.y + CANTO_J4); cargaQ.copy(camion.quaternion); }
    else { cargaP.copy(restoAla); cargaQ.identity(); }
    losa.quaternion.copy(cargaQ); v1.set(0, -CANTO_J4, 0).applyQuaternion(cargaQ); losa.position.copy(cargaP).add(v1);
    // la marca de identidad, en el centro de su cara de arriba
    v1.set(0, 0.3, 0).applyQuaternion(cargaQ).add(cargaP); poner(marcas, 9, v1.x, v1.y, v1.z, 30, 1, 30);
    colorMarca(9, 0.9 + 0.5 * Math.sin(Math.PI * tramo(u, 0.322, 0.34)) + 0.4 * tramo(u, TL[1], TL[1] + 0.01));
  }

  // las losas de la acera: en la acera, en el cable, en su pila, otra vez en el cable y en el carril
  const pL = new T3.Vector3(), qL = new T3.Quaternion();
  function poseAcera(L, u) {
    const a = L.m1, b = L.m2;
    if (u < a.t + 0.33 * a.D) { pL.copy(L.acera); qL.identity(); return 0; }
    if (u < a.t + 0.9 * a.D) return colgada(L, a, L.acera, L.pila, u);
    if (u < b.t + 0.33 * b.D) { pL.copy(L.pila); qL.identity(); return 1; }
    if (u < b.t + 0.9 * b.D) return colgada(L, b, L.pila, L.carril, u);
    pL.copy(L.carril); qL.identity(); return 2;
  }
  function colgada(L, m, A, B, u) {
    enCarga(0.55);
    const wi = E.eio(tramo(u, m.t + 0.33 * m.D, m.t + 0.4 * m.D)), wo = E.eio(tramo(u, m.t + 0.8 * m.D, m.t + 0.9 * m.D));
    pL.lerpVectors(A, cargaP, wi); qL.slerpQuaternions(qI, cargaQ, wi);
    if (wo > 0) { pL.lerp(B, wo); qL.slerp(qI, wo); }
    return 3;
  }
  // el ritmo de la apertura de juntas: una onda que recorre la acera de punta a punta
  //  sale de donde está el punto (la última losa, junto a las pilas) y corre hacia el otro extremo
  const ondaJ = (x, u0) => { const a = u0 + 0.01 * (ACERA.x1 - x) / (ACERA.x1 - ACERA.x0); return tramo(u, a, a + 0.006); };
  let u = 0;
  function moverAcera(reloj) {
    const pulsoComun = 0.75 + 0.25 * Math.sin(reloj * 1.6);
    for (const L of LS) {
      const est = poseAcera(L, u);
      // al abrirse las juntas, cada losa da un respingo: libre, nada la sujeta
      if (est === 0) { const w = ondaJ(L.acera.x, T4.juntas); pL.y += 1.6 * Math.sin(Math.PI * w); }
      if (est === 1) { const w = tramo(u, L.m1.t + 0.86 * L.m1.D, L.m1.t + 0.86 * L.m1.D + 0.008); if (w > 0 && w < 1) pL.y -= 1.2 * Math.sin(Math.PI * w) * (1 - w); }
      v1.set(0, -CANTO, 0).applyQuaternion(qL).add(pL);
      losas.setMatrixAt(L.j, m4.compose(v1, qL, e3.set(L.esc[0], 1, L.esc[1])));
      v2.set(0, -ALTO_A, 0).applyQuaternion(qL).add(pL);
      bandejas.setMatrixAt(L.j, m4.compose(v2, qL, e3.set(L.escB[0], 1, L.escB[1])));
      // su marca: en una esquina, siempre con ella
      v3.set(L.l / 2 - 13, 0.3, -L.a / 2 + 13).applyQuaternion(qL).add(pL); q4.copy(qL);
      marcas.setMatrixAt(L.j, m4.compose(v3, q4, e3.set(17, 1, 17)));
      let k = 0.55;
      if (est === 0) k = 0.5 + 1.2 * Math.sin(Math.PI * ondaJ(L.acera.x, T4.juntas + 0.002));
      else if (est === 3) k = 1.5;
      else if (est === 1) k = mezcla(0.9, 1.4, tramo(u, T4.apilado, T4.apilado + 0.004) * (1 - tramo(u, T4.recoge - 0.002, T4.recoge))) * pulsoComun;
      else if (est === 2) { const w = tramo(u, L.m2.t + 0.86 * L.m2.D, L.m2.t + 0.86 * L.m2.D + 0.01); k = 0.7 + 1.0 * Math.sin(Math.PI * w) + mezcla(0, 0.35 + 0.3 * Math.sin(reloj * 1.3 + L.fase), tramo(u, 0.96, 0.99)); }
      colorMarca(L.j, k);
    }
    // las juntas: el cordón gris de la acera se va con la onda; el del carril llega cuando la última losa se posa
    JA.forEach((q, i) => {
      const w = ondaJ(q.wx, T4.juntas + 0.001), s = 1 - E.ei(w);
      if (s <= 0.001) { nada(juntas, i); return; }
      const y = ALTO_A - 0.5 + 3.5 * E.eo(w), lg = q.largo * M - 3;
      poner(juntas, i, q.wx, y, q.wz, q.enX ? lg * s : 1.3 * s, 0.9, q.enX ? 1.3 * s : lg * s);
      c3.setHex(0x4b5363).lerp(sigC.setHex(COL.cian), Math.sin(Math.PI * Math.min(1, w * 1.6))); juntas.setColorAt(i, c3);
    });
    JB.forEach((q, n) => {
      const i = JA.length + n, w = tramo(u, T4.pinta - 0.002 + 0.008 * (q.wx - XJB[0]) / Math.max(1, XJB[1] - XJB[0]), T4.pinta + 0.004 + 0.008 * (q.wx - XJB[0]) / Math.max(1, XJB[1] - XJB[0]));
      if (w <= 0) { nada(juntas, i); return; }
      const lg = q.largo * M - 3, s = E.eo(w);
      poner(juntas, i, q.wx, ALTO_A - 0.5, q.wz, q.enX ? lg * s : 1.3, 0.9, q.enX ? 1.3 : lg * s);
      c3.setHex(COL.cian).lerp(sigC.setHex(0x4b5363), w); juntas.setColorAt(i, c3);
    });
  }
  const sigC = new T3.Color();
  // el carril: dos bordes, el eje a trazos, los separadores y las bicis
  function moverCarril() {
    const t0 = T4.pinta, x0 = CARRIL.x0 + 10, largo = 760;
    for (let k = 0; k < 2; k++) {
      const w = E.eio(tramo(u, t0 + 0.002, t0 + 0.012)), z = CARRIL.z0 + (k ? 114 : 6);
      if (w <= 0) nada(pintura, k); else poner(pintura, k, x0 + largo * w / 2, ALTO_A, z, largo * w, 1, 4);
    }
    for (let k = 0; k < NE; k++) {
      const w = E.vivo(tramo(u, t0 + 0.004 + k * 0.0009, t0 + 0.009 + k * 0.0009)), x = CARRIL.x0 + 40 + k * 78;
      if (w <= 0.001) nada(pintura, 2 + k); else poner(pintura, 2 + k, x, ALTO_A, CARRIL.z0 + 60, 40 * w, 1, 3.5);
    }
    for (let k = 0; k < 6; k++) {
      const w = E.rebote(tramo(u, t0 + 0.003 + k * 0.0012, t0 + 0.012 + k * 0.0012));
      if (w <= 0.001) nada(separadores, k); else poner(separadores, k, CARRIL.x0 + 66 + k * 130, 0, CARRIL.z0 + 127, 1, Math.max(0.01, w), 1);
    }
    // las bicis pintadas: una por sentido
    for (let k = 0; k < 2; k++) {
      const w = E.vivo(tramo(u, t0 + 0.007 + k * 0.003, t0 + 0.016 + k * 0.003)), i = 5 + k;
      if (w <= 0.001) { nada(impresos, i); continue; }
      poner(impresos, i, CARRIL.x0 + (k ? 630 : 150), ALTO_A + 0.25, CARRIL.z0 + (k ? 90 : 30), 110 * w, 27.5 * w, 1, k ? Math.PI : 0, -Math.PI / 2);
      color(impresos, i, COL.tinta, 1);
    }
  }

  // ── el libro: los huecos de la cuenta, los módulos que caen etapa a etapa, B que se queda en hueco, D aparte y las tres reglas ──
  const SLOT_BLQ = [0, 1, 2, -1, 3, 4];                                     // qué bloque tapa cada hueco (B, ninguno)
  const pulso = (a, b) => Math.sin(Math.PI * tramo(u, a, b));
  function moverLibro(reloj) {
    const enLibro = u > 0.725 && u < 0.97;
    marcosLibro.visible = enLibro;
    const focoB = Math.max(pulso(ETAPA(3), ETAPA(4)), pulso(REGLA[0], REGLA[1]));
    for (let i = 0; i < 6; i++) {
      let v = enLibro ? E.eo(tramo(u, 0.75 + i * 0.0042, 0.756 + i * 0.0042)) : 0;
      const kb = SLOT_BLQ[i];
      if (kb >= 0) v *= 1 - tramo(u, ATERRIZA[kb] - 0.001, ATERRIZA[kb] + 0.002);
      else v *= (0.72 + 0.22 * Math.sin(reloj * 2.2)) * (1 + 0.75 * focoB);
      UVIS.uVis.value[i] = v * (1 - tramo(u, 0.958, 0.968));
    }
    // D: baja como si fuera a sumarse, se para, se lo piensa y se aparta; en la segunda regla intenta restar y la raya no le deja
    const s5 = ETAPA(5), tImp = REGLA[1] + 0.0015 + 0.45 * (REGLA[2] - REGLA[1] - 0.0035);
    for (let k = 0; k < 5; k++) {
      const tk = ATERRIZA[k];
      if (!enLibro || u < (k < 4 ? tk - 0.008 : s5)) { nada(bloques, k); nada(impresos, k); continue; }
      let x = LIBRO.x, y, z = LIBRO.z, sy = 1, sxz = 1, sx = 1;
      if (k < 4) {
        const yR = NIVEL_BLQ[k] * BLQ.paso, f = tramo(u, tk - 0.008, tk);
        y = yR + 300 * (1 - E.ei(f));
        // cada módulo que cae, los de abajo lo acusan
        for (let j = k + 1; j < 4; j++) { const wj = tramo(u, ATERRIZA[j], ATERRIZA[j] + 0.008); if (wj > 0 && wj < 1) y -= 1.6 * Math.sin(Math.PI * wj) * (1 - wj) * (4 - k) / 4; }
      } else {
        const yA = 5 * BLQ.paso + 46, f = E.suave(tramo(u, s5, s5 + 0.005)), lado = tramo(u, s5 + 0.0065, s5 + 0.0115), cae = tramo(u, s5 + 0.008, s5 + 0.0125);
        y = mezcla(yA + 320, yA, f);
        x = LIBRO.x - 10 * pulso(s5 + 0.0052, s5 + 0.0072) + (D_POS.x - LIBRO.x) * E.eio(lado);
        y = mezcla(y, 0, E.ei(cae)) + 24 * Math.sin(Math.PI * lado) * (1 - cae);
        const w = tramo(u, REGLA[1] + 0.0015, REGLA[2] - 0.002);
        if (w > 0 && w < 1) {
          if (w < 0.45) { const p = E.ei(w / 0.45); x -= 25 * p; y += 9 * Math.sin(Math.PI * p); }
          else { const q = tramo(w, 0.45, 1); x -= 25 * (1 - E.rebote(q)); sx = 1 - 0.14 * Math.exp(-q * 7) * Math.cos(q * 18); }
        }
      }
      const wq = tramo(u, tk, tk + 0.008); if (wq > 0 && wq < 1) { const q = E.rebote(wq); sy = mezcla(0.78, 1, q); sxz = 1 + (1 - sy) * 0.35; }
      poner(bloques, k, x, y, z, sxz * sx, sy, sxz);
      const wr = E.vivo(tramo(u, tk, tk + 0.008));
      if (wr <= 0.001) nada(impresos, k); else { poner(impresos, k, x, y + BLQ.h * sy / 2, z + BLQ.w / 2 * sxz + 0.3, 70 * wr, 17.5 * wr, 1); color(impresos, k, k === 4 ? 0x0b2a44 : COL.tinta, 1); }
    }
    // B: su rótulo en el hueco, su aviso y el resplandor donde debería estar el valor
    const yB = 3 * BLQ.paso + BLQ.h / 2, ub = enLibro ? E.vivo(tramo(u, ETAPA(3) + 0.001, ETAPA(3) + 0.008)) : 0;
    if (ub > 0.001) { poner(avisos, 0, LIBRO.x, yB, LIBRO.z + BLQ.w / 2 + 0.6, 62 * ub, 15.5 * ub, 1); color(avisos, 0, 0xffffff, 0.55 + 0.4 * focoB); } else nada(avisos, 0);
    const us = enLibro ? E.vivo(tramo(u, ETAPA(3) + 0.005, ETAPA(3) + 0.013)) : 0;
    if (us > 0.001) { poner(avisos, 1, LIBRO.x - 112, yB, LIBRO.z + BLQ.w / 2 + 2, 84 * us, 21 * us, 1); color(avisos, 1, 0xffffff, 0.8 + 0.6 * focoB); } else nada(avisos, 1);
    const kB = enLibro && u > ETAPA(3) ? (0.07 + 0.04 * Math.sin(reloj * 2.2)) * E.eo(tramo(u, ETAPA(3), ETAPA(3) + 0.008)) + 0.3 * pulso(REGLA[0], REGLA[1]) * (0.75 + 0.25 * Math.sin(reloj * 6)) : 0;
    brilloB.visible = kB > 0.003; brilloB.material.color.setHex(0x9fc6e8).multiplyScalar(kB * (1 - tramo(u, 0.958, 0.968)));
    const ua = enLibro ? E.vivo(tramo(u, ATERRIZA[4], ATERRIZA[4] + 0.01)) : 0;
    if (ua > 0.001) { poner(avisos, 2, D_POS.x, BLQ.h + 88, D_POS.z + BLQ.w / 2 + 10, 104 * ua, 26 * ua, 1); color(avisos, 2, 0xffffff, 0.85); } else nada(avisos, 2);
    raya.material.opacity = enLibro ? 0.8 * E.eo(tramo(u, 0.772, 0.78)) * (1 - tramo(u, 0.958, 0.968)) : 0; raya.visible = raya.material.opacity > 0.01;
    // la segunda regla: el golpe contra la raya enciende un muro de luz, y aparece «nunca se resta»
    const im = tramo(u, tImp, tImp + 0.007);
    muro.visible = im > 0 && im < 1; muro.material.color.setHex(COL.cuerda).multiplyScalar(0.9 * (1 - im) * (1 - im));
    const un = enLibro ? E.vivo(tramo(u, tImp, tImp + 0.006)) * (1 - E.ei(tramo(u, 0.958, 0.966))) : 0;
    if (un > 0.001) { poner(avisos, 4, XR, 172, LIBRO.z + 72, 100 * un, 25 * un, 1); color(avisos, 4, 0xffffff, 0.95); } else nada(avisos, 4);
    // la tercera regla: cada módulo con dato enseña su «cantidad × factor» y la fuente del factor
    for (let k = 0; k < 5; k++) {
      const t = REGLA[2] + 0.002 + k * 0.0024, s = enLibro ? E.vivo(tramo(u, t, t + 0.006)) * (1 - E.ei(tramo(u, 0.958, 0.966))) : 0;
      if (s <= 0.001) { nada(avisos, 5 + 2 * k); nada(avisos, 6 + 2 * k); continue; }
      if (k < 4) { const y = NIVEL_BLQ[k] * BLQ.paso + BLQ.h / 2; poner(avisos, 5 + 2 * k, LIBRO.x - 112, y, LIBRO.z + BLQ.w / 2 + 2, 90 * s, 22.5 * s, 1); poner(avisos, 6 + 2 * k, LIBRO.x - 198, y, LIBRO.z + BLQ.w / 2 + 2, 70 * s, 17.5 * s, 1); }
      else { poner(avisos, 5 + 2 * k, D_POS.x, BLQ.h + 36, D_POS.z + BLQ.w / 2 + 14, 76 * s, 19 * s, 1); poner(avisos, 6 + 2 * k, D_POS.x, BLQ.h + 57, D_POS.z + BLQ.w / 2 + 14, 60 * s, 15 * s, 1); }
      color(avisos, 5 + 2 * k, 0xffffff, 0.85); color(avisos, 6 + 2 * k, 0xffffff, 0.9);
    }
    charco(5, LIBRO.x - 20, 0.5, LIBRO.z, 420, 0x9fb4d8, enLibro ? 0.2 * E.eo(tramo(u, 0.74, 0.76)) * (1 - tramo(u, 0.958, 0.968)) : 0);
    for (let k = 0; k < 5; k++) { const w = tramo(u, ATERRIZA[k], ATERRIZA[k] + 0.014); if (w > 0 && w < 1 && enLibro) { onda(3, k === 4 ? D_POS.x : LIBRO.x, (k === 4 ? 0 : NIVEL_BLQ[k] * BLQ.paso) + 0.6, LIBRO.z, 70, 120, w, COL.cuerda, 0.45); break; } if (k === 4) nada(ondas, 3); }
    // la lista del HTML: se enciende el módulo de la etapa en curso
    const ka = u >= 0.79 && u < 0.89 ? Math.min(5, Math.floor((u - 0.79) / PASO_E)) : -1;
    if (ka !== modActivo) { modActivo = ka; LI_MOD.forEach((li, i) => li.classList.toggle('activo', i === ka)); }
  }

  // ── las viñetas, etapa a etapa: la vida de la losa en pequeño, al lado de su cuenta ──
  const pzP = new T3.Vector3(), pzTop = new T3.Vector3(), pzW = new T3.Vector3(), vA = new T3.Vector3(), vB = new T3.Vector3(), vC = new T3.Vector3();
  let pzS = 0;
  const vl = (x, y, z, out) => out.set(VIG.x + x, y, VIG.z + z);
  const sale = (t0, t1, f0, f1) => E.vivo(tramo(u, t0, t1)) * (1 - E.ei(tramo(u, f0, f1)));
  const ponerMini = (i, x, y, z, sx, sy, sz, s, ry = 0) => { if (s <= 0.002) nada(mini, i); else poner(mini, i, VIG.x + x, y, VIG.z + z, sx * s, sy * s, sz * s, ry); };
  const PIEDRA = Array.from({ length: NP }, (_, i) => [Math.sin(i * 2.3) * 9, Math.cos(i * 1.7) * 9, 1.6 + 0.8 * ((i * 7) % 3) / 2]);
  const ESQ = { x: 68, z: -26 }, CAM0 = [-48, 14], CAM1 = [34, 30], K_C = [-30, 36], CARRIL_V = [10, -8];
  function camionEn(w, out) { return vl(mezcla(CAM0[0], CAM1[0], w), PT, mezcla(CAM0[1], CAM1[1], w), out); }
  function moverVinieta(reloj) {
    const S = ETAPA, fin = [0.892, 0.9], vis = u > 0.78 && u < 0.9;
    const pl = vis ? E.vivo(tramo(u, 0.782, 0.792)) * (1 - E.ei(tramo(u, fin[0], fin[1]))) : 0;
    platillo.visible = pl > 0.002; platillo.scale.setScalar(Math.max(0.001, pl) * VS);
    if (!vis) { for (let i = 0; i < 19; i++) nada(mini, i); for (let i = 0; i < NP; i++) nada(piedras, i); camionMini.visible = false; cableMini.visible = false; nada(avisos, 3); pzS = 0; if (u > 0.7) aro.visible = false; return; }
    const out = 1 - E.ei(tramo(u, fin[0], fin[1]));
    // A1–A3: la cantera y el silo echan áridos y cemento al molde; del molde sale la pieza
    const sq = sale(S(0), S(0) + 0.003, S(1) + 0.002, S(1) + 0.005);
    ponerMini(1, -72, PT, -24, 22, 18, 26, sq); ponerMini(2, -54, PT, -24, 16, 12, 26, sq); ponerMini(3, -41, PT, -24, 12, 6, 26, sq); ponerMini(4, -48, PT, 30, 12, 30, 12, sq);
    const sm = sale(S(0) + 0.001, S(0) + 0.004, S(0) + 0.0105, S(0) + 0.013);
    ponerMini(5, 0, PT, 19.5, 40, 9, 3, sm); ponerMini(6, 0, PT, -19.5, 40, 9, 3, sm); ponerMini(7, 19.5, PT, 0, 3, 9, 40, sm); ponerMini(8, -19.5, PT, 0, 3, 9, 40, sm);
    for (let i = 0; i < NP; i++) {
      const cem = i >= 8, t0 = S(0) + 0.0022 + (i % 8) * 0.0008 + (cem ? 0.0004 : 0), w = tramo(u, t0, t0 + 0.0035);
      if (w <= 0 || w >= 1) { nada(piedras, i); continue; }
      vl(cem ? -48 : -66, cem ? 36 : 24, cem ? 30 : -24, vA); vl(PIEDRA[i][0], PT + 5, PIEDRA[i][1], vB); arco(vA, vB, 26, E.eio(w), vC);
      poner(piedras, i, vC.x, vC.y, vC.z, PIEDRA[i][2], PIEDRA[i][2], PIEDRA[i][2], w * 6);
    }
    // A4: el camión sale del punto de producción (su pilar y su banda menta) hacia la casa
    const sp = sale(S(1), S(1) + 0.003, S(2) + 0.012, S(2) + 0.015);
    ponerMini(9, -66, PT, -46, 10, 34, 10, sp); ponerMini(10, -66, PT + 24, -46, 11.5, 3, 11.5, sp);
    const wc = E.eio(tramo(u, S(1) + 0.005, S(1) + 0.013)), sc = sale(S(1) + 0.001, S(1) + 0.004, S(2) + 0.012, S(2) + 0.016);
    camionMini.visible = sc > 0.002;
    if (camionMini.visible) {
      camionEn(wc, camionMini.position); const va = tramo(u, S(2) + 0.012, S(2) + 0.016); camionMini.position.x += 40 * E.ei(va);
      camionMini.position.sub(VIG).multiplyScalar(VS).add(VIG);
      camionMini.rotation.set(0, -Math.atan2(CAM1[1] - CAM0[1], CAM1[0] - CAM0[0]), 0); camionMini.scale.setScalar(ESC_CAM * sc * VS);
    }
    // la casa y su esquina: llegan con el camión; en C se desmontan y van a sus contenedores
    const sh = sale(S(1) + 0.006, S(1) + 0.009, S(5) + 0.004, S(5) + 0.007), cl = E.eio(tramo(u, S(4) + 0.007, S(4) + 0.012)), k35 = mezcla(1, 0.36, cl);
    const ch = E.eio(tramo(u, S(4) + 0.008, S(4) + 0.013));
    vl(40, PT, -26, vA); vl(62, PT + 4, 46, vB); arco(vA, vB, 30, ch, vC); ponerMini(11, vC.x - VIG.x, vC.y, vC.z - VIG.z, 26, 24, 26, sh * mezcla(1, 0.38, ch));
    vl(ESQ.x, PT, ESQ.z - 11.5, vA); vl(22, PT + 4, 56, vB); arco(vA, vB, 26, cl, vC); ponerMini(12, vC.x - VIG.x, vC.y, vC.z - VIG.z, 26, 14, 3, sh * k35, 0.4 * cl);
    vl(ESQ.x + 11.5, PT, ESQ.z, vA); vl(30, PT + 4, 60, vB); arco(vA, vB, 26, cl, vC); ponerMini(13, vC.x - VIG.x, vC.y, vC.z - VIG.z, 3, 14, 26, sh * k35, 0.9 * cl);
    const sb = sale(S(4), S(4) + 0.003, S(5) + 0.004, S(5) + 0.007);
    ponerMini(15, 26, PT, 58, 32, 7, 22, sb); ponerMini(16, 62, PT, 46, 30, 7, 24, sb);
    // D: el carril bici, en pequeño
    const sl = sale(S(5), S(5) + 0.003, fin[0], fin[1]);
    ponerMini(17, CARRIL_V[0], PT, CARRIL_V[1], 96, 2, 24, sl); ponerMini(18, CARRIL_V[0], PT + 2, CARRIL_V[1], 64, 0.5, 2, sl);
    // la pieza: del molde al camión, de la grúa a la esquina, otra vez a la grúa, a un lado, y al carril
    let cab = -1;
    if (u < S(0) + 0.009) pzS = 0;
    else {
      pzS = E.vivo(tramo(u, S(0) + 0.009, S(0) + 0.0125)) * out;
      const cama = PT + 48 * ESC_CAM;
      if (u < S(1) + 0.002) vl(0, PT, 0, pzP);
      else if (u < S(1) + 0.005) { camionEn(0, vB).y = cama; arco(vl(0, PT, 0, vA), vB, 18, E.seno(tramo(u, S(1) + 0.002, S(1) + 0.005)), pzP); }
      else if (u < S(2) + 0.002) { camionEn(wc, pzP).y = cama; }
      else if (u < S(2) + 0.012) { camionEn(1, vA).y = cama; vl(ESQ.x, PT + 14, ESQ.z, vB); const w = E.eio(tramo(u, S(2) + 0.002, S(2) + 0.012)); arco(vA, vB, 34, w, pzP); pzP.x += 3 * Math.sin(w * 9) * (1 - w); cab = 1; }
      else if (u < S(4) + 0.001) vl(ESQ.x, PT + 14, ESQ.z, pzP);
      else if (u < S(4) + 0.008) { vl(ESQ.x, PT + 14, ESQ.z, vA); vl(K_C[0], PT, K_C[1], vB); const w = E.eio(tramo(u, S(4) + 0.001, S(4) + 0.008)); arco(vA, vB, 40, w, pzP); pzP.z += 3 * Math.sin(w * 9) * (1 - w); cab = 1; }
      else if (u < S(5) + 0.003) vl(K_C[0], PT, K_C[1], pzP);
      else { vl(K_C[0], PT, K_C[1], vA); vl(CARRIL_V[0], PT + 2, CARRIL_V[1], vB); arco(vA, vB, 22, E.seno(tramo(u, S(5) + 0.003, S(5) + 0.009)), pzP); }
    }
    ponerMini(0, pzP.x - VIG.x, pzP.y, pzP.z - VIG.z, 34, 3, 34, pzS);
    pzTop.copy(pzP); pzTop.y += 3; pzW.copy(pzTop).sub(VIG).multiplyScalar(VS).add(VIG);   // la cara de arriba, en el mundo
    // la grúa de la viñeta: un cable fino que baja del cielo
    cableMini.visible = cab > 0;
    if (cab > 0) { const p = cableMini.geometry.attributes.position; p.setXYZ(0, pzW.x, pzW.y, pzW.z); p.setXYZ(1, pzW.x, pzW.y + 300, pzW.z); p.needsUpdate = true; }
    // B: el uso; un aro que da la vuelta (el tiempo) y una llave que repara: el parche se queda en la pieza
    const sB = sale(S(3), S(3) + 0.002, S(4), S(4) + 0.002);
    const TOQ = [S(3) + 0.004, S(3) + 0.007, S(3) + 0.010];
    let toque = 0, flash = 0; for (const t of TOQ) { toque = Math.max(toque, pulso(t - 0.0016, t + 0.0004)); const w = tramo(u, t, t + 0.003); if (w > 0 && w < 1) flash = Math.max(flash, 1 - w); }
    if (sB > 0.002) { poner(avisos, 3, pzW.x + 5, pzW.y + (22 - 9 * toque) * VS, pzW.z + 8, 52 * sB * VS, 13 * sB * VS, 1, 0, -0.25 * toque); color(avisos, 3, 0xffffff, 0.9); } else nada(avisos, 3);
    const sPa = sale(TOQ[0], TOQ[0] + 0.001, fin[0], fin[1]) * pzS;
    ponerMini(14, pzTop.x - VIG.x + 7, pzTop.y - 0.2, pzTop.z - VIG.z + 6, 9, 0.8, 9, sPa);
    mini.setColorAt(14, c3.setHex(COL.cian).multiplyScalar(1 + 1.5 * flash));
    if (u > 0.7) {
      aro.position.set(pzW.x, pzW.y + 0.4, pzW.z); aro.scale.setScalar(0.56 * VS);
      UA.uAng.value = E.eio(tramo(u, S(3) + 0.001, S(3) + 0.014)); UA.uK.value = sB; aro.visible = sB > 0.002;
    }
  }

  // ── el punto: el que acompaña a la pieza ─────────────────────────────
  const P_TIT = new T3.Vector3(NS.x + 96, 150, NS.z + 52), P_ESPERA = new T3.Vector3(ALA.x1 + 50, 200, ALA.z1 + 40), P_LOSA = new T3.Vector3(ALA.cx + 22, Y_ALA, ALA.cz + 24);
  const pa = new T3.Vector3(), pb = new T3.Vector3(), pc = new T3.Vector3(), pq = new T3.Vector3();
  const arco = (a, b, h, s, out) => { out.lerpVectors(a, b, s); out.y += 4 * h * s * (1 - s); return out; };
  const encimaVentosa = (out, r) => out.copy(gL).setY(gL.y + 26 + r);
  // para saltar hacia la ventosa hay que saber dónde estará: se lee la grúa en ese u y se deja como estaba
  const gHg = new T3.Vector3(), gLg = new T3.Vector3();
  function ventosaEn(uu, r, out) { gHg.copy(gH); gLg.copy(gL); const ap = gAp; leerGrua(G4, uu); encimaVentosa(out, r); gH.copy(gHg); gL.copy(gLg); gAp = ap; return out; }
  let sentado = false;
  const pilaTop = (tipo, out, r) => { let y = ALTO_A; for (const L of LS) if (L.tipo === tipo) y = Math.max(y, L.pila.y); return out.set(PILA[tipo], y + r, 60); };
  const nivelLibro = (k) => k * BLQ.paso + BLQ.h / 2;
  const LIBRO_LEE = (k, r, out) => out.set(LIBRO.x + 88, nivelLibro(k) + r * 0.2, LIBRO.z + 96);
  // la pausa de las pilas: del gancho a la J4, a la J2, a la J1 y de vuelta al gancho
  const HOP = [T4.apilado, T4.apilado + 0.0026, T4.apilado + 0.0052, T4.apilado + 0.0078, T4.recoge + 0.001];
  const L8 = LS[ORDEN[0]], M8 = L8.m1, P_L8 = new T3.Vector3(L8.acera.x + L8.l / 2 - 26, ALTO_A, L8.acera.z + 22);
  const POSA = [0.322, 0.5, HOP[1], HOP[2], HOP[3], T4.paseo[0], ETAPA(0) + 0.015, 0.975];
  let brillo = 1;
  function caminoPunto(u, r, reloj, out) {
    brillo = 1; sentado = (u >= 0.322 && u < 0.48) || (u >= T4.paseo[0] && u < 0.722) || u >= 0.975;
    const bob = 5 * Math.sin(reloj * 1.3);
    if (u < 0.19) return out.copy(P_TIT).setY(P_TIT.y + bob);
    if (u < 0.204) { enRuta(L_NODO + 290, pb); pb.y = r + 2; return arco(pa.copy(P_TIT).setY(P_TIT.y + bob), pb, 50, E.seno(tramo(u, 0.19, 0.204)), out); }
    if (u < 0.242) { enRuta(mezcla(L_NODO + 290, L_OBRA, E.eio(tramo(u, 0.204, 0.242))), out); out.y = r + 2 + 3 * Math.sin(reloj * 2.4); return out; }
    if (u < 0.258) { pa.copy(OS).setY(r + 2); return arco(pa, pb.copy(P_ESPERA), 90, E.seno(tramo(u, 0.242, 0.258)), out); }
    if (u < 0.312) return out.copy(P_ESPERA).setY(P_ESPERA.y + bob);
    if (u < 0.322) { pb.copy(P_LOSA).setY(Y_ALA + r); return arco(pa.copy(P_ESPERA).setY(P_ESPERA.y + bob), pb, 40, E.seno(tramo(u, 0.312, 0.322)), out); }
    if (u < 0.48) return out.copy(P_LOSA).setY(Y_ALA + r);
    // a la acera: se posa en la última losa y de ahí sale la onda que abre las juntas; sube a la ventosa cuando la agarra
    if (u < 0.5) return arco(pa.copy(P_LOSA).setY(Y_ALA + r), pb.copy(P_L8).setY(ALTO_A + r), 170, E.seno(tramo(u, 0.48, 0.5)), out);
    const tg = M8.t + 0.3 * M8.D, ts = M8.t + 0.42 * M8.D;
    if (u < tg) { sentado = true; return out.copy(P_L8).setY(ALTO_A + r); }
    if (u < ts) { ventosaEn(ts, r, pb); return arco(pa.copy(P_L8).setY(ALTO_A + r), pb, 40, E.seno(tramo(u, tg, ts)), out); }
    if (u < HOP[0] || (u >= HOP[4] && u < T4.pinta)) return encimaVentosa(out, r);
    if (u < HOP[4]) {
      // en la pausa, el punto baja a leer las pilas: J4, J2 y J1, y vuelve a la ventosa
      const H_ = HOP, s = [0, 1, 2, 3].find((i) => u < H_[i + 1]), w = E.seno(tramo(u, H_[s], H_[s + 1]));
      const desde = s === 0 ? encimaVentosa(pa, r) : pilaTop(['J4', 'J2', 'J1'][s - 1], pa, r), hacia = s === 3 ? encimaVentosa(pb, r) : pilaTop(['J4', 'J2', 'J1'][s], pb, r);
      return arco(desde, hacia, 34, w, out);
    }
    if (u < T4.paseo[0]) { ventosaEn(T4.pinta, r, pa); return arco(pa, pb.set(CARRIL.x0 + 20, ALTO_A + r, CARRIL.z0 + 30), 70, E.seno(tramo(u, T4.pinta, T4.paseo[0])), out); }
    if (u < 0.722) { const w = E.eio(tramo(u, T4.paseo[0], T4.paseo[1])); return out.set(CARRIL.x0 + 20 + 740 * w, ALTO_A + r + 1.5 * Math.abs(Math.sin(w * 40)), CARRIL.z0 + 30); }
    // al libro: delante de la columna, sube mientras se dibujan los huecos de la cuenta
    const lee = (y, o) => o.set(LIBRO.x + 92, y, LIBRO.z + 96);
    if (u < 0.75) return arco(pa.set(CARRIL.x0 + 760, ALTO_A + r, CARRIL.z0 + 30), lee(nivelLibro(0), pb), 220, E.seno(tramo(u, 0.722, 0.75)), out);
    if (u < 0.779) return lee(mezcla(nivelLibro(0), nivelLibro(4), E.eio(tramo(u, 0.75, 0.776))) + bob * 0.5, out);
    // las viñetas: mira el molde desde arriba y, cuando sale la pieza, se sube a ella y ya no la deja
    const S0 = ETAPA(0), alto = pc.set(VIG.x, (PT + 36) * VS + bob * 0.5, VIG.z);
    if (u < 0.79) return arco(lee(nivelLibro(4), pa), alto, 40, E.seno(tramo(u, 0.779, 0.79)), out);
    if (u < S0 + 0.012) return out.copy(alto);
    if (u < S0 + 0.015) return arco(alto, pb.copy(pzW).setY(pzW.y + r), 14, E.seno(tramo(u, S0 + 0.012, S0 + 0.015)), out);
    if (u < 0.892) { sentado = true; return out.copy(pzW).setY(pzW.y + r); }
    // las tres reglas: en el hueco de B (a media luz), en lo alto de la raya y, luego, junto a cada factor que aparece
    const hB = pc.set(LIBRO.x, 3 * BLQ.paso + BLQ.h / 2, LIBRO.z + 78);
    if (u < 0.905) return arco(pa.set(VIG.x + CARRIL_V[0] * VS, (PT + 5) * VS + r, VIG.z + CARRIL_V[1] * VS), hB, 60, E.seno(tramo(u, 0.892, 0.905)), out);
    if (u < REGLA[1]) { brillo = 0.55 + 0.15 * Math.sin(reloj * 5); return out.copy(hB).setY(hB.y + bob * 0.3); }
    const hR = pb.set(XR - 4, 132 + r, LIBRO.z + 72);
    if (u < REGLA[1] + 0.005) return arco(pa.copy(hB), hR, 50, E.seno(tramo(u, REGLA[1], REGLA[1] + 0.005)), out);
    if (u < REGLA[2]) return out.copy(hR).setY(hR.y + bob * 0.5);
    const tag = (k, o) => (k < 4 ? o.set(LIBRO.x - 146, NIVEL_BLQ[k] * BLQ.paso + BLQ.h / 2 + 14, LIBRO.z + 80) : o.set(D_POS.x + 52, BLQ.h + 30, D_POS.z + 80));
    if (u < REGLA[3]) {
      const f = (u - REGLA[2] - 0.002) / 0.0024, k = Math.max(-1, Math.min(4, Math.floor(f)));
      if (k < 0) return arco(pa.copy(hR), tag(0, pb), 30, E.seno(tramo(u, REGLA[2], REGLA[2] + 0.002)), out);
      if (k >= 4) return tag(4, out);
      return arco(tag(k, pa), tag(k + 1, pb), 16, E.seno(fract(f)), out);
    }
    pc.set(560, ALTO_A + r, CARRIL.z0 + 60);
    if (u < 0.975) return arco(tag(4, pa), pc, 160, E.seno(tramo(u, REGLA[3], 0.975)), out);
    return out.copy(pc).setY(pc.y + 2.5 * Math.sin(reloj * 1.1));
  }
  function moverPunto(u, reloj, d) {
    const r = 6 * Math.max(1, Math.min(4.6, d / 820));
    const nace = E.vivo(tramo(u, 0.0, 0.035));
    caminoPunto(u, r, reloj, pa);
    // en los tramos nuevos, el punto va por su cuenta: sale de donde estaba y vuelve a donde estará
    if (fa >= 0) { P_A0.copy(pa); caminoPunto(0.5, r, reloj, P_A1); brillo = 1; sentado = false; puntoParcela(r, reloj, pq); pa.copy(pq); }
    else if (fb >= 0) { P_B0.copy(pa); brillo = 1; sentado = false; puntoReparacion(r, reloj, pq); pa.copy(pq); }
    let sx = 1, sy = 1, extra = 0;
    for (const c of POSA) { const w = tramo(u, c, c + 0.009); if (w > 0 && w < 1) { const q = E.rebote(w); sx = mezcla(1.55, 1, q); sy = mezcla(0.6, 1, q); extra += 0.9 * (1 - w); } }
    if (sy < 1) pa.y -= r * (1 - sy);
    pt.poner(pa.x, pa.y, pa.z, r, Math.max(0.001, nace * (brillo + extra)));
    pt.luz.intensity *= 0.62 * mezcla(1, 0.4, tramo(d, 900, 2600));
    pt.esfera.scale.set(r * sx * nace, r * sy * nace, r * sx * nace);
    pt.halo.scale.setScalar(r * 9 * Math.max(0.01, nace) * (0.8 + 0.2 * brillo));
    // lo que lee: una onda ámbar al posarse
    let on = false; for (const c of POSA) { const w = tramo(u, c, c + 0.02); if (w > 0 && w < 1) { onda(2, pa.x, pa.y - r * sy + 0.6, pa.z, r * 1.5, r * 9, w, COL.ambar, 0.55); on = true; break; } }
    if (!on) nada(ondas, 2);
    charco(3, pa.x, pa.y - r * sy + 0.5, pa.z, r * 9, COL.ambar, sentado ? 0.08 * nace * brillo : 0);
    return r;
  }

  // ═════════════════════════════════════════════════════════════════════
  //  Los tramos nuevos (v6). Se insertan en el guion sin tocar lo que había: mientras duran, el resto del capítulo
  //  se queda quieto (su u se congela) y cada tramo lleva su avance propio (fa, fb), su cámara y su punto.
  //  A. Se monta rápido y en su sitio; la casa puede cambiar. En una parcela al oeste de la calle, sobre la trama.
  //  B. Se repara una pieza, no la calle; y la seguridad activa de la cuadrilla. En el carril bici recién hecho.
  // ═════════════════════════════════════════════════════════════════════
  const TRAMOS = { a: [0.25, 0.418], s2: [0.418, 0.53], b: [0.53, 0.676] };
  let fa = -1, fb = -1;
  function mapa(un) {
    fa = -1; fb = -1;
    if (un < TRAMOS.a[0]) return 0.49 * un / TRAMOS.a[0];
    if (un < TRAMOS.a[1]) { fa = tramo(un, TRAMOS.a[0], TRAMOS.a[1]); return 0.49; }
    if (un < TRAMOS.s2[1]) return mezcla(0.5, 0.72, tramo(un, TRAMOS.s2[0], TRAMOS.s2[1]));
    if (un < TRAMOS.b[1]) { fb = tramo(un, TRAMOS.b[0], TRAMOS.b[1]); return 0.72; }
    return mezcla(0.72, 1, tramo(un, TRAMOS.b[1], 1));
  }
  // un guion de cámara local: [desde, hasta, plano A, plano B, alza]
  function camTramo(g, f) {
    let tr = g[g.length - 1]; for (const x of g) if (f < x[1]) { tr = x; break; }
    const [f0, f1, A, B, alza = 0] = tr, w = E.eio(tramo(f, f0, f1));
    if (A === B) { mezclaPlanos(A, A, 0, 0); const [dl, dd] = derivaEn(A, E.seno(tramo(f, f0, f1))); cam.lado += dl; cam.d *= dd; }
    else { mezclaPlanos(A, B, w, alza * Math.sin(Math.PI * w)); const a = DERIVA.get(A), b = DERIVA.get(B); cam.lado += mezcla(a ? a[1] : 0, b ? b[0] : 0, w); cam.d *= mezcla(a ? a[3] : 1, b ? b[2] : 1, w); }
  }

  // ── A: la parcela, la trama de 75 cm y un pequeño kit de piezas ──
  const CEL = (DATOS.TRAMA?.paso ?? 0.75) * M;
  // [x, base, z, ancho, alto, fondo] en local: dos losas, dos muros de fondo, dos laterales; y la ampliación (losa y muro)
  const KIT = [[60, 0, 60, 118, 8, 118], [180, 0, 60, 118, 8, 118], [60, 8, 4, 118, 112, 8], [180, 8, 4, 118, 112, 8], [4, 8, 64, 8, 112, 112], [236, 8, 64, 8, 112, 112], [300, 0, 60, 118, 8, 118], [300, 8, 4, 118, 112, 8]];
  const LLEGA_K = [0.17, 0.212, 0.25, 0.283, 0.312, 0.338, 0.645, 0.705], X_MURO = 356;
  const kit = instancias(pieza(1, 1, 1, 0.05, 0.03), esmalte(COL.blanco, { roughness: 0.3 }), 8, true);
  // los nudos atornillados: una chapa y sus cuatro tornillos (UNION del catálogo)
  const NUDOS = [[6, 6, 0.322, 9], [236, 6, 0.348, 0.53], [X_MURO, 6, 0.77, 9]], POR_NUDO = DATOS?.UNION?.porNudo ?? 4;
  const tornillos = instancias(new T3.CylinderGeometry(1, 1, 1, 8), new T3.MeshStandardMaterial({ color: 0xaab3c2, roughness: 0.32, metalness: 0.75 }), NUDOS.length * (1 + POR_NUDO), true);
  const marcoGeo = (() => { const s = new T3.Shape(), q = 0.5, h = 0.465; s.moveTo(-q, -q); s.lineTo(q, -q); s.lineTo(q, q); s.lineTo(-q, q); s.lineTo(-q, -q); const p = new T3.Path(); p.moveTo(-h, -h); p.lineTo(-h, h); p.lineTo(h, h); p.lineTo(h, -h); p.lineTo(-h, -h); s.holes.push(p); return new T3.ShapeGeometry(s).rotateX(-Math.PI / 2); })();
  const marcos = instancias(marcoGeo, aditivo(), 8);                       // la huella exacta de cada pieza, al encajar
  const UT = { uR: { value: 0 }, uB: { value: 0 }, uO: { value: new T3.Vector2(PO.x, PO.z) } };
  const trama = (() => {
    const p = [], x0 = -60, x1 = 420, z0 = -60, z1 = 180;
    for (let x = x0; x <= x1 + 0.1; x += CEL) p.push(PO.x + x, 0.7, PO.z + z0, PO.x + x, 0.7, PO.z + z1);
    for (let z = z0; z <= z1 + 0.1; z += CEL) p.push(PO.x + x0, 0.7, PO.z + z, PO.x + x1, 0.7, PO.z + z);
    const m = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.Float32BufferAttribute(p, 3)), new T3.LineBasicMaterial({ color: COL.cian, transparent: true, blending: T3.AdditiveBlending, depthWrite: false }));
    m.material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, UT);
      sh.vertexShader = 'uniform vec2 uO;\nvarying float vD;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvD = distance(position.xz, uO);');
      sh.fragmentShader = 'uniform float uR, uB;\nvarying float vD;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat dentro = smoothstep(uR, uR - 50.0, vD), frente = smoothstep(40.0, 0.0, abs(vD - uR));\ndiffuseColor.rgb *= uB * (0.32 * dentro + 1.6 * frente);');
    };
    m.frustumCulled = false; escena.add(m); return m;
  })();
  const kP = new T3.Vector3(), kTop = new T3.Vector3();
  const kS = [1, 1, 1];
  // dónde está cada pieza del kit (base, en el mundo) y cómo se aplasta al encajar
  function poseKit(k, f, out) {
    const [x, y, z] = KIT[k], t = LLEGA_K[k];
    kS[0] = kS[2] = 1; kS[1] = 1;
    if (f < t - 0.03) return 0;
    let px = x, py = y;
    const cae = tramo(f, t - 0.03, t);
    py = y + 220 * (1 - E.ei(cae)); px += 5 * Math.sin(Math.PI * cae) * (1 - cae);
    if (k === 5 && f > 0.575) {
      // el muro que se suelta: sube, viaja colgado y se posa en el borde nuevo
      const sube = E.eio(tramo(f, 0.575, 0.615)), va = E.eio(tramo(f, 0.615, 0.715)), baja = E.ei(tramo(f, 0.715, 0.76));
      px = mezcla(x, X_MURO, va) + 6 * Math.sin(Math.PI * va) * (1 - va); py = y + 150 * sube * (1 - baja);
      const w = tramo(f, 0.76, 0.78); if (w > 0 && w < 1) { const q = E.rebote(w); kS[1] = mezcla(0.88, 1, q); kS[0] = kS[2] = 1 + (1 - kS[1]) * 0.3; }
    } else { const w = tramo(f, t, t + 0.02); if (w > 0 && w < 1) { const q = E.rebote(w); kS[1] = mezcla(0.85, 1, q); kS[0] = kS[2] = 1 + (1 - kS[1]) * 0.3; } }
    out.set(PO.x + px, py, PO.z + z);
    return 1;
  }
  const P_A0 = new T3.Vector3(), P_A1 = new T3.Vector3();
  function moverParcela(reloj) {
    const on = fa >= 0;
    for (const m of [kit, tornillos, marcos, trama]) m.visible = on;
    if (!on) { charco(8, 0, -99, 0, 1, 0, 0); nada(ondas, 8); for (let i = 11; i < 19; i++) nada(marcas, i); return; }
    UT.uR.value = mezcla(0, 560, E.eio(tramo(fa, 0.05, 0.2))); UT.uB.value = E.eo(tramo(fa, 0.04, 0.08)) * (1 - 0.35 * tramo(fa, 0.4, 0.5)) * (1 - E.ei(tramo(fa, 0.9, 1)));
    charco(8, PO.x + 180, 0.5, PO.z + 60, 460, 0x9fb4d8, 0.12 * E.eo(tramo(fa, 0.04, 0.12)) * (1 - tramo(fa, 0.92, 1)));
    let cuelga = -1;
    for (let k = 0; k < 8; k++) {
      if (!poseKit(k, fa, kP)) { nada(kit, k); nada(marcos, k); nada(marcas, 11 + k); continue; }
      const [, , , w, h, d] = KIT[k];
      poner(kit, k, kP.x, kP.y, kP.z, w * kS[0], h * kS[1], d * kS[2]);
      const t = LLEGA_K[k], cae = fa > t - 0.03 && fa < t;
      if (cae || (k === 5 && fa > 0.575 && fa < 0.76)) cuelga = k;
      // la huella: un marco que se cierra sobre la trama cuando la pieza encaja, sin holgura
      const tf = k === 5 && fa > 0.7 ? 0.76 : t, wf = tramo(fa, tf, tf + 0.05);
      if (wf > 0 && wf < 1) { const s = mezcla(1.3, 1, E.eo(Math.min(1, wf * 2.5))); poner(marcos, k, kP.x, KIT[k][1] + 0.9, kP.z, w * s, 1, d * s); color(marcos, k, COL.cian, 1.6 * (1 - wf)); } else nada(marcos, k);
      // su marca de identidad, arriba; la del muro que se mueve, más viva: es la misma pieza
      poner(marcas, 11 + k, kP.x, kP.y + h * kS[1] + 0.3, kP.z, 14, 1, 14);
      colorMarca(11 + k, k === 5 && fa > 0.55 && fa < 0.8 ? 1.5 + 0.2 * Math.sin(reloj * 6) : 0.75);
    }
    // el cable de la grúa, sobre la pieza que baja
    cableMini.visible = cuelga >= 0;
    if (cuelga >= 0) { poseKit(cuelga, fa, kP); const p = cableMini.geometry.attributes.position, yT = kP.y + KIT[cuelga][4]; p.setXYZ(0, kP.x, yT, kP.z); p.setXYZ(1, kP.x, yT + 400, kP.z); p.needsUpdate = true; }
    // los nudos: la chapa llega y los tornillos entran girando; el del muro que se mueve sale girando
    NUDOS.forEach(([x, z, t0, t1], n) => {
      const ent = E.eo(tramo(fa, t0, t0 + 0.03)), sal = E.ei(tramo(fa, t1, t1 + 0.045)), b = n * (1 + POR_NUDO);
      const vis = fa > t0 && sal < 1, y = 8 + 112;
      if (!vis) { for (let i = 0; i <= POR_NUDO; i++) nada(tornillos, b + i); return; }
      poner(tornillos, b, PO.x + x, y + 0.8 + 6 * (1 - ent) + 12 * sal, PO.z + z, 15 * (1 - 0.6 * sal), 1.8, 15 * (1 - 0.6 * sal), Math.PI / 8);
      for (let i = 0; i < POR_NUDO; i++) {
        const ox = i & 1 ? 6 : -6, oz = i & 2 ? 6 : -6, ti = tramo(fa, t0 + 0.006 + i * 0.004, t0 + 0.02 + i * 0.004), to = tramo(fa, t1 + i * 0.004, t1 + 0.03 + i * 0.004);
        const s = E.vivo(ti) * (1 - E.ei(to));
        if (s <= 0.001) { nada(tornillos, b + 1 + i); continue; }
        poner(tornillos, b + 1 + i, PO.x + x + ox, y + 4.2 + 8 * (1 - E.eo(ti)) + 14 * E.eo(to), PO.z + z + oz, 2.4 * s, 5, 2.4 * s, (E.eo(ti) - E.eo(to)) * TAU * 3);
      }
    });
    // cada encaje, un aro en la trama
    let k0 = -1; for (let k = 0; k < 8; k++) { const t = k === 5 && fa > 0.7 ? 0.76 : LLEGA_K[k]; const w = tramo(fa, t, t + 0.03); if (w > 0 && w < 1) { k0 = k; poseKit(k, fa, kP); onda(8, kP.x, 1, kP.z, 50, 140, w, COL.cian, 0.6); } }
    if (k0 < 0) nada(ondas, 8);
  }
  // el punto en la parcela: lee cada pieza al encajar, vigila el nudo, viaja en el muro que se mueve y lee la ampliación
  function puntoParcela(r, reloj, out) {
    const bob = 4 * Math.sin(reloj * 1.3), f = fa;
    const sobre = (k, o) => { poseKit(k, Math.max(f, LLEGA_K[k] + 0.001), kP); return o.set(kP.x, kP.y + KIT[k][4] * kS[1] + r, kP.z); };
    if (f < 0.12) return arco(P_A0, pb.set(PO.x + 180, 170, PO.z + 60), 120, E.seno(tramo(f, 0, 0.12)), out);
    if (f < LLEGA_K[0]) return out.set(PO.x + 180, 170 + bob, PO.z + 60);
    for (let k = 0; k < 6; k++) {
      const t = LLEGA_K[k], tn = k < 5 ? LLEGA_K[k + 1] : 0.37;
      if (f < tn) { sobre(k, pa); const w = tramo(f, t, t + 0.012); if (w < 1) return arco(k ? sobre(k - 1, pb) : pb.set(PO.x + 180, 170 + bob, PO.z + 60), pa, 26, E.seno(w), out); return out.copy(pa); }
    }
    const nudo = pb.set(PO.x + 236, 124 + r, PO.z + 6);
    if (f < 0.4) return arco(sobre(5, pa), nudo, 20, E.seno(tramo(f, 0.37, 0.4)), out);
    if (f < 0.58) { brillo = 1 + 0.4 * Math.sin(Math.PI * tramo(f, 0.53, 0.58)); return out.copy(nudo).setY(nudo.y + bob * 0.4); }
    if (f < 0.6) { poseKit(5, f, kP); pa.set(kP.x, kP.y + 112 + r, kP.z); return arco(nudo, pa, 16, E.seno(tramo(f, 0.58, 0.6)), out); }
    if (f < 0.78) { poseKit(5, f, kP); sentado = true; return out.set(kP.x, kP.y + 112 * kS[1] + r, kP.z); }
    if (f < 0.81) { poseKit(5, f, kP); pa.set(kP.x, kP.y + 112 + r, kP.z); return arco(pa, pb.set(PO.x + 300, 8 + r, PO.z + 60), 30, E.seno(tramo(f, 0.78, 0.81)), out); }
    if (f < 0.86) { sentado = true; return out.set(PO.x + 300, 8 + r, PO.z + 60); }
    return arco(pa.set(PO.x + 300, 8 + r, PO.z + 60), P_A1, 200, E.seno(tramo(f, 0.86, 1)), out);
  }

  // ── B: la reparación de la red bajo el carril, con las mismas losas como acera auxiliar (el modelo del Puerto) ──
  //  Avisa la red de debajo; la cuadrilla llega, lee sus EPIs y señaliza; la grúa levanta tres losas y las deja al
  //  lado como acera auxiliar (la gente sigue pasando); en la zanja se ve la tubería, se repara y se reconecta; las
  //  mismas losas vuelven a su sitio, se leen en posición y se cierra la orden con evidencia. Sin escombros ni obra
  //  húmeda; nada va a planta. La seguridad activa va en la vuelta: la carga suspendida es la losa que se levanta.
  const ABRE = [5, 6, 7].map((k) => LS[EN_CARRIL[k]]);                     // las tres losas que se levantan (J4, J2, J4)
  const AUX_Z = CARRIL.z0 + 236;                                           // la acera auxiliar, junto a la zanja, en la calzada
  for (const L of ABRE) L.aux = new T3.Vector3(L.carril.x, ALTO_A, AUX_Z);
  const X0Z = Math.min(...ABRE.map((L) => L.carril.x - L.l / 2)), X1Z = Math.max(...ABRE.map((L) => L.carril.x + L.l / 2));
  const G5 = nuevaGrua(0, 1), MOV5 = [];
  {
    let prev = ABRE[0].carril;
    kf(G5.xz, 0, prev.x, prev.z); kf(G5.y, 0, ALTO_CIELO); kf(G5.y, 0.16, ALTO_CIELO);
    // un viaje de la grúa: coger en A, dejar en B; «pausa» la para a medio camino (el aviso de la seguridad activa)
    const mov5 = (L, A, B, t, D, pausa = 0) => {
      const yC = Math.max(A.y, B.y, 60) + 74, P = pausa, mid = new T3.Vector3((A.x + B.x) / 2, 0, (A.z + B.z) / 2);
      kf(G5.xz, t, prev.x, prev.z); kf(G5.xz, t + 0.2 * D, A.x, A.z); kf(G5.xz, t + 0.44 * D, A.x, A.z);
      if (P) { kf(G5.xz, t + 0.59 * D, mid.x, mid.z); kf(G5.xz, t + 0.59 * D + P, mid.x, mid.z); }
      kf(G5.xz, t + 0.74 * D + P, B.x, B.z);
      [[0.16, yC], [0.3, A.y], [0.36, A.y], [0.5, yC]].forEach(([k, y]) => kf(G5.y, t + k * D, y));
      [[0.7, yC], [0.86, B.y - 6], [0.92, B.y - 6], [1, yC]].forEach(([k, y]) => kf(G5.y, t + k * D + P, y));
      G5.sup.push([t * TS, (t + 0.6 * D) * TS, A.y], [(t + 0.6 * D) * TS, (t + D + P) * TS, B.y]);
      const m = { L, A, B, t, D, P, mid, coge: t + 0.33 * D, deja: t + 0.9 * D + P, fin: t + D + P }; MOV5.push(m); prev = B; return m;
    };
    let t = 0.2; for (const L of ABRE) { L.sale = mov5(L, L.carril, L.aux, t, 0.064); t += 0.064; }
    t = 0.585; for (const L of [...ABRE].reverse()) { const P = L === ABRE[1] ? 0.06 : 0; L.vuelve = mov5(L, L.aux, L.carril, t, 0.07, P); t += 0.07 + P; }
    kf(G5.y, t + 0.03, ALTO_CIELO); G5.om.push([0, 1e9, 5]);
  }
  simular(G5);
  const AVISO = [ABRE[1].vuelve.t + 0.59 * ABRE[1].vuelve.D, ABRE[1].vuelve.t + 0.59 * ABRE[1].vuelve.D + 0.06];   // la grúa espera
  const VUELTA_FIN = ABRE[0].vuelve.fin;                                    // ≈ 0.85: todas en su sitio
  // la zanja y la red: un hueco oscuro con su tubería; la avería, un anillo coral en una junta; la reparación, un manguito cian
  const zanja = new T3.Mesh(fundir([[caja(X1Z - X0Z - 6, 0.4, 66, (X0Z + X1Z) / 2, 0.1, CARRIL.z0 + 60), 0x030405], [caja(X1Z - X0Z - 6, 1.4, 3, (X0Z + X1Z) / 2, 0, CARRIL.z0 + 27), 0x2b313c], [caja(X1Z - X0Z - 6, 1.4, 3, (X0Z + X1Z) / 2, 0, CARRIL.z0 + 93), 0x2b313c]]),
    new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }));
  zanja.receiveShadow = true; escena.add(zanja);
  const XJ = (ABRE[0].carril.x + ABRE[1].carril.x) / 2, P_TUBO = new T3.Vector3(XJ, 3.6, CARRIL.z0 + 60);
  const tubo = new T3.Mesh(new T3.CylinderGeometry(3.4, 3.4, X1Z - X0Z - 8, 20).rotateZ(Math.PI / 2), new T3.MeshStandardMaterial({ color: 0x55606f, roughness: 0.4, metalness: 0.55 }));
  tubo.position.set((X0Z + X1Z) / 2, 3.6, CARRIL.z0 + 60); tubo.castShadow = true; escena.add(tubo);
  const manguito = new T3.Mesh(new T3.CylinderGeometry(4.6, 4.6, 14, 20).rotateZ(Math.PI / 2), new T3.MeshBasicMaterial({ color: COL.coral }));
  manguito.position.copy(P_TUBO); escena.add(manguito);
  // la cuadrilla (dos operarios con casco, chaleco y botas; cada EPI lleva su etiqueta) y un peatón por la acera auxiliar
  const personas = instancias(fundir([[caja(11, 33, 8, 0, 0, 0), 0x2b313c], [caja(17, 25, 11, 0, 33, 0), 0xdfe5ee], [caja(17.5, 3, 11.5, 0, 46, 0), COL.cian], [new T3.SphereGeometry(6.2, 14, 10).translate(0, 64, 0), 0xc9b9a8],
    [new T3.SphereGeometry(7.2, 14, 8, 0, TAU, 0, Math.PI / 2).translate(0, 66, 0), COL.blanco], [caja(4, 22, 5, -10.5, 37, 0), 0xdfe5ee], [caja(4, 22, 5, 10.5, 37, 0), 0xdfe5ee]]),
    esmalte(0xffffff, { vertexColors: true, roughness: 0.55, clearcoat: 0.3 }), 3, true);
  personas.setColorAt(2, new T3.Color(0x7d89a3));                         // el peatón: sin chaleco ni casco a la vista, en otro tono
  const tagsEPI = instancias(new T3.IcosahedronGeometry(1, 1), aditivo(), 6);
  const EPI_Y = [[0, 74, 0], [0, 47, 6.5], [3, 2, 5]];                     // casco, chaleco y botas
  const conos = instancias(fundir([[new T3.ConeGeometry(5.5, 17, 14).translate(0, 8.5, 0), COL.blanco], [new T3.CylinderGeometry(3.4, 4.1, 2.4, 14).translate(0, 8.5, 0), COL.cian], [caja(13, 1.2, 13, 0, 0, 0), 0x2b313c]]),
    esmalte(0xffffff, { vertexColors: true, roughness: 0.4 }), 4, true);
  const zona = new T3.Mesh(aroGeo(0.965, 22, 0.58, 3), aditivo()); zona.renderOrder = 2; escena.add(zona);
  const CONOS = [[X0Z - 26, CARRIL.z0 + 4], [X1Z + 26, CARRIL.z0 + 4], [X0Z - 26, AUX_Z + 70], [X1Z + 26, AUX_Z + 70]];
  // la orden de trabajo, en una tarjeta como la del pasaporte (misma malla, otra textura)
  const cvOrden = document.createElement('canvas'); cvOrden.width = 640; cvOrden.height = 800;
  const txOrden = new T3.CanvasTexture(cvOrden); txOrden.colorSpace = T3.SRGBColorSpace; txOrden.anisotropy = anis;
  const PASOS_OT = [['Avería localizada, bajo el carril', 0.07, '#56DCE6'], ['EPIs de la cuadrilla, leídos', 0.19, '#56DCE6'], ['Piezas levantadas', ABRE[2].sale.deja, '#56DCE6'], ['Acera auxiliar en servicio', ABRE[2].sale.fin, '#56DCE6'],
    ['Red reparada y conectada', 0.52, '#56DCE6'], ['Aviso: carga suspendida', AVISO[0] + 0.012, '#FF6B4A'], ['Acera recolocada', VUELTA_FIN, '#56DCE6'], ['Cierre con evidencia', VUELTA_FIN + 0.025, '#56DCE6']];
  let estadoOrden = -1;
  function pintarOrden(n) {
    const x = cvOrden.getContext('2d'); x.clearRect(0, 0, 640, 800); x.textBaseline = 'alphabetic'; x.textAlign = 'left';
    x.save(); x.shadowColor = 'rgba(86,220,230,.45)'; x.shadowBlur = 34; x.fillStyle = 'rgba(9,13,20,.92)'; rr(x, 28, 28, 584, 744, 34); x.fill(); x.restore();
    x.strokeStyle = 'rgba(86,220,230,.55)'; x.lineWidth = 2.5; rr(x, 28, 28, 584, 744, 34); x.stroke();
    x.font = '500 30px Inter, system-ui, sans-serif'; x.fillStyle = '#8A93A6'; x.fillText('Orden de trabajo', 70, 104);
    x.font = '700 58px Inter, system-ui, sans-serif'; x.fillStyle = '#F4F6FA'; x.fillText('Red bajo el carril', 66, 178);
    x.font = '500 27px Inter, system-ui, sans-serif'; x.fillStyle = '#7d8699'; x.fillText('sin demoler: se levantan y se reponen', 68, 222); x.fillText('las mismas piezas', 68, 254);
    PASOS_OT.forEach(([t, , c], i) => {
      const y = 330 + i * 57, hecho = i < n;
      x.fillStyle = 'rgba(244,246,250,.08)'; x.fillRect(66, y - 37, 508, 2);
      x.save(); if (hecho) { x.shadowColor = c; x.shadowBlur = 14; } x.fillStyle = hecho ? c : 'rgba(244,246,250,.18)'; x.beginPath(); x.arc(84, y - 9, 9, 0, TAU); x.fill(); x.restore();
      x.font = `${hecho ? 600 : 500} 29px Inter, system-ui, sans-serif`; x.fillStyle = hecho ? (c === '#FF6B4A' ? '#FF8D72' : '#F4F6FA') : 'rgba(244,246,250,.32)'; x.fillText(t, 110, y);
    });
    txOrden.needsUpdate = true;
  }
  pintarOrden(0); estadoOrden = 0;
  const P_B0 = new T3.Vector3(), opP = [new T3.Vector3(), new T3.Vector3(), new T3.Vector3()], cA = new T3.Color();
  // los operarios llegan por la acera de enfrente y se quedan fuera de la zona; el primero baja a la zanja a reparar;
  // el segundo, durante la vuelta de la losa del medio, entra bajo la carga
  const OP_PUESTO = [[XJ - 30, 106], [ABRE[1].carril.x + 74, 106]], Y_ACERA = ALTO_A;
  function operario(i, f, out) {
    const p = OP_PUESTO[i], w = E.eio(tramo(f, 0.1 + i * 0.012, 0.17 + i * 0.012)), entra = [X1Z + 360, 70];
    out.set(mezcla(entra[0], p[0], w), Y_ACERA, mezcla(entra[1], p[1], w));
    if (i === 0) { const z = E.eio(tramo(f, ABRE[2].sale.fin, ABRE[2].sale.fin + 0.02)) * (1 - E.eio(tramo(f, 0.53, 0.55))); out.x = mezcla(out.x, XJ - 18, z); out.z = mezcla(out.z, CARRIL.z0 + 34, z); out.y -= 7.6 * z; }
    if (i === 1) { const m = ABRE[1].vuelve, e = E.eio(tramo(f, AVISO[0] - 0.02, AVISO[0] + 0.004)) * (1 - E.eio(tramo(f, AVISO[1] - 0.022, AVISO[1] - 0.002))); out.x = mezcla(out.x, m.mid.x + 16, e); out.z = mezcla(out.z, m.mid.z - 30, e); }
    const vuelve = E.eio(tramo(f, 0.9 + i * 0.01, 0.96 + i * 0.01)); out.x = mezcla(out.x, entra[0], vuelve); out.z = mezcla(out.z, entra[1], vuelve);
    return (w > 0 && w < 1) || (vuelve > 0 && vuelve < 1) || (i === 1 && f > AVISO[0] - 0.02 && f < AVISO[1]);
  }
  const losaB = new T3.Vector3(), losaQ = new T3.Quaternion(), losaA = new T3.Vector3();
  // dónde está cada losa levantada: en el carril, en el cable, en la acera auxiliar, en el cable y otra vez en su sitio
  function poseAbierta(L, f) {
    const viaje = (m, A, B) => { enCarga(0.55); const wi = E.eio(tramo(f, m.coge, m.coge + 0.012)), wo = E.eio(tramo(f, m.deja - 0.012, m.deja)); losaA.copy(A); losaB.lerpVectors(losaA, cargaP, wi); losaQ.slerpQuaternions(qI, cargaQ, wi); if (wo > 0) { losaB.lerp(B, wo); losaQ.slerp(qI, wo); } };
    const s = L.sale, v = L.vuelve;
    if (f < s.coge) { losaB.copy(L.carril); losaQ.identity(); return 0; }
    if (f < s.deja) { viaje(s, L.carril, L.aux); return 1; }
    if (f < v.coge) { losaB.copy(L.aux); losaQ.identity(); return 2; }
    if (f < v.deja) { viaje(v, L.aux, L.carril); return 1; }
    losaB.copy(L.carril); losaQ.identity(); return 3;
  }
  function moverReparacion(reloj) {
    const on = fb >= 0;
    for (const m of [personas, tagsEPI, conos, zona, zanja, tubo, manguito]) m.visible = on;
    if (!on) { charco(9, 0, -99, 0, 1, 0, 0); for (let i = 9; i < 12; i++) nada(ondas, i); return; }
    const f = fb;
    dibujarGrua(G5, f, reloj);
    const abierta = f > 0.19 && f < VUELTA_FIN + 0.01; zanja.visible = tubo.visible = manguito.visible = abierta;   // la zanja, solo mientras está destapada
    // las losas que se levantan: con su marca de identidad, siempre la misma; al volver, se leen en posición
    let colgando = null;
    for (const L of ABRE) {
      const est = poseAbierta(L, f); if (est === 1) colgando = L;
      ponerLosa(L.j, losaB, losaQ, 1);
      v3.set(L.l / 2 - 13, 0.3, -L.a / 2 + 13).applyQuaternion(losaQ).add(losaB); marcas.setMatrixAt(L.j, m4.compose(v3, losaQ, e3.set(17, 1, 17)));
      const lee = Math.sin(Math.PI * tramo(f, L.vuelve.deja, L.vuelve.deja + 0.025)), sale = Math.sin(Math.PI * tramo(f, L.sale.coge - 0.01, L.sale.coge + 0.012));
      colorMarca(L.j, est === 1 ? 1.5 : 0.65 + 1.2 * Math.max(lee, sale));
    }
    // al volver, cada una se lee en su sitio: una onda cian (dos huecos de onda, alternos)
    nada(ondas, 10); nada(ondas, 11);
    ABRE.forEach((L, k) => { const w = tramo(f, L.vuelve.deja, L.vuelve.deja + 0.025); if (w > 0 && w < 1) onda(10 + (k % 2), L.carril.x, ALTO_A + 0.6, L.carril.z, 20, 90, w, COL.cian, 0.7); });
    // sin las losas, sus juntas no están: vuelven cuando vuelven ellas
    JB.forEach((q, n) => { if (q.wx >= X0Z - 5 && q.wx <= X1Z + 5 && f > 0.2 && f < VUELTA_FIN) nada(juntas, JA.length + n); });
    // la red: avisa (coral), se repara (destello y manguito nuevo) y se reconecta (un pulso recorre la tubería)
    const avisa = E.eo(tramo(f, 0.04, 0.08)) * (1 - tramo(f, 0.47, 0.5)), repara = tramo(f, 0.45, 0.5), conecta = tramo(f, 0.5, 0.56);
    manguito.material.color.setHex(repara > 0.5 ? COL.cian : COL.coral).multiplyScalar(repara > 0.5 ? 0.8 + 1.2 * Math.sin(Math.PI * conecta) : 0.6 + 0.6 * Math.abs(Math.sin(reloj * 5)));
    manguito.scale.setScalar(1 + 0.25 * Math.sin(Math.PI * tramo(f, 0.47, 0.51)));
    if (f < 0.2) charco(9, P_TUBO.x, ALTO_A + 0.5, P_TUBO.z, 170, COL.coral, 0.24 * avisa * (0.7 + 0.3 * Math.sin(reloj * 4)));
    else if (f < 0.5) charco(9, P_TUBO.x, 0.6, P_TUBO.z, 110, COL.coral, 0.2 * avisa + 0.5 * Math.sin(Math.PI * tramo(f, 0.46, 0.5)));
    else if (f < 0.6) charco(9, (X0Z + X1Z) / 2, ALTO_A + 0.6, AUX_Z, 260, COL.cian, 0.07);   // la acera auxiliar, en servicio
    else charco(9, 0, -99, 0, 1, 0, 0);
    onda(9, P_TUBO.x, ALTO_A + 0.6, P_TUBO.z, 30, 140, tramo(f, 0.05, 0.1), COL.coral, 0.8);
    if (conecta > 0 && conecta < 1) poner(ondas, 8, mezcla(X0Z + 10, X1Z - 10, E.eio(conecta)), P_TUBO.y, P_TUBO.z, 9, 1, 9, Math.PI / 2, Math.PI / 2), color(ondas, 8, COL.cian, 1.4 * Math.sin(Math.PI * conecta)); else nada(ondas, 8);
    // la cuadrilla y sus EPIs (leídos al llegar; el vínculo queda encendido); y el peatón que usa la acera auxiliar
    const alerta = Math.sin(Math.PI * tramo(f, AVISO[0], AVISO[1]));
    for (let i = 0; i < 2; i++) {
      const anda = operario(i, f, opP[i]), bob = anda ? 1.6 * Math.abs(Math.sin(reloj * 9 + i)) : 0, gira = i === 1 && alerta > 0.01 ? 0.5 : i ? -0.5 : 0.4;
      if (f < 0.1) nada(personas, i); else poner(personas, i, opP[i].x, opP[i].y + bob, opP[i].z, 1, 1, 1, gira);
      for (let e = 0; e < 3; e++) {
        const j = i * 3 + e, t = 0.17 + i * 0.012 + e * 0.006, lee = Math.sin(Math.PI * tramo(f, t, t + 0.012));
        if (f < t) { nada(tagsEPI, j); continue; }
        const [ex, ey, ez] = EPI_Y[e], cs = Math.cos(gira), sn = Math.sin(gira);
        poner(tagsEPI, j, opP[i].x + ex * cs + ez * sn, opP[i].y + ey + bob, opP[i].z - ex * sn + ez * cs, 2.2 + 2 * lee, 2.2 + 2 * lee, 2.2 + 2 * lee);
        if (i === 1 && alerta > 0.01) tagsEPI.setColorAt(j, c3.setHex(COL.coral).multiplyScalar(0.8 + 1.4 * alerta)); else tagsEPI.setColorAt(j, c3.setHex(COL.cian).multiplyScalar(0.65 + 1.3 * lee));
      }
    }
    const pe = tramo(f, ABRE[2].sale.fin + 0.005, 0.585), peS = pe > 0 && pe < 1;
    if (peS) { poner(personas, 2, mezcla(X1Z + 40, X0Z - 40, pe), ALTO_A + 1.4 * Math.abs(Math.sin(reloj * 8)), AUX_Z + 6, 0.92, 0.92, 0.92, -Math.PI / 2); } else nada(personas, 2);
    // la señalización
    CONOS.forEach(([x, z], i) => { const s = E.vivo(tramo(f, 0.17 + i * 0.006, 0.19 + i * 0.006)) * (1 - E.ei(tramo(f, VUELTA_FIN + 0.03, VUELTA_FIN + 0.05))); if (s <= 0.001) nada(conos, i); else poner(conos, i, x, i < 2 ? ALTO_A : 0, z, s, s, s); });
    // la zona de la carga suspendida: bajo la losa mientras cuelga; si alguien entra, aviso (y queda registrado)
    zona.visible = !!colgando;
    if (colgando) {
      zona.position.set(gL.x, ALTO_A + 1.2, gL.z); zona.scale.setScalar(78 + 6 * alerta); zona.rotation.y = reloj * 0.4;
      if (alerta > 0.01) cA.setHex(COL.coral).multiplyScalar(0.6 + 0.6 * alerta * (0.6 + 0.4 * Math.sin(reloj * 14))); else cA.setHex(COL.cuerda).multiplyScalar(0.55);
      zona.material.color.copy(cA);
    }
    if (alerta > 0.01) { operario(1, f, v3); charco(9, v3.x, ALTO_A + 1, v3.z, 120, COL.coral, 0.3 * alerta * (0.7 + 0.3 * Math.sin(reloj * 14))); }
    // la orden de trabajo: se va completando
    let n = 0; for (const [, t] of PASOS_OT) if (f >= t) n++;
    if (n !== estadoOrden) { estadoOrden = n; pintarOrden(n); }
    const uc = E.vivo(tramo(f, 0.07, 0.11)) * (1 - E.ei(tramo(f, 0.895, 0.915)));
    carta.visible = uc > 0.002;
    if (carta.visible) {
      carta.material.map = txOrden;
      const wS = E.eio(tramo(f, 0.53, 0.59)); carta.position.set(P_TUBO.x + mezcla(-60, -60, wS), mezcla(205, 190, wS) + 4 * Math.sin(reloj * 0.9), P_TUBO.z + mezcla(-80, 250, wS)); carta.quaternion.copy(camara.quaternion); carta.scale.setScalar(Math.max(0.001, uc) * mezcla(0.82, 0.7, wS)); carta.updateMatrixWorld();
      // nunca por encima de la barra: su canto de arriba se queda al menos a 96 px del borde de la pantalla
      v2.set(0, 245 / 2, 0).applyMatrix4(carta.matrixWorld).project(camara);
      const yArriba = (-v2.y * 0.5 + 0.5) * H, falta = 96 - yArriba;
      if (falta > 0) { const dist = camara.position.distanceTo(carta.position), alto = 2 * dist * Math.tan(camara.fov * Math.PI / 360); v3.set(0, 1, 0).applyQuaternion(camara.quaternion); carta.position.addScaledVector(v3, -falta / H * alto); carta.updateMatrixWorld(); }
      // y tampoco se sale por los lados (en vertical, sobre todo)
      v2.set(196 / 2, 0, 0).applyMatrix4(carta.matrixWorld).project(camara); const xDer = (v2.x * 0.5 + 0.5) * W;
      v2.set(-196 / 2, 0, 0).applyMatrix4(carta.matrixWorld).project(camara); const xIzq = (v2.x * 0.5 + 0.5) * W;
      const limD = W > 760 && wS > 0.5 && BT[7] ? Math.min(W - 14, BT[7].offsetLeft - 28) : W - 14;   // en escritorio, nunca sobre la columna del texto
      const dx = xDer > limD ? limD - xDer : xIzq < 14 ? 14 - xIzq : 0;
      if (dx) { const dist = camara.position.distanceTo(carta.position), ancho = 2 * dist * Math.tan(camara.fov * Math.PI / 360) * camara.aspect; v3.set(1, 0, 0).applyQuaternion(camara.quaternion); carta.position.addScaledVector(v3, dx / W * ancho); carta.updateMatrixWorld(); }
      const hp = hilo.geometry.attributes.position; v2.set(196 * 0.36, -245 / 2, 0).applyMatrix4(carta.matrixWorld);
      hp.setXYZ(0, P_TUBO.x, P_TUBO.y, P_TUBO.z); hp.setXYZ(1, v2.x, v2.y, v2.z); hp.needsUpdate = true;
      hilo.material.opacity = 0.5 * uc; hilo.visible = true;
    } else hilo.visible = false;
    for (const m of [personas, tagsEPI, conos, juntas]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }
  function ponerLosa(i, P, Q, vis, L = LS[i]) {
    if (!vis) { nada(losas, i); nada(bandejas, i); return; }
    v1.set(0, -CANTO, 0).applyQuaternion(Q).add(P); losas.setMatrixAt(i, m4.compose(v1, Q, e3.set(L.esc[0], 1, L.esc[1])));
    v2.set(0, -ALTO_A, 0).applyQuaternion(Q).add(P); bandejas.setMatrixAt(i, m4.compose(v2, Q, e3.set(L.escB[0], 1, L.escB[1])));
  }
  // el punto en la reparación: lee la avería, va en la ventosa, vigila la reparación desde el borde de la zanja y lee
  // cada losa cuando vuelve a su sitio
  function puntoReparacion(r, reloj, out) {
    const f = fb, bob = 4 * Math.sin(reloj * 1.3), m0 = ABRE[0].sale, mV = ABRE[2].sale, n0 = ABRE[2].vuelve, nF = ABRE[0].vuelve;
    const sobreAveria = (o) => o.set(P_TUBO.x, ALTO_A + r + 14 + bob * 0.4, P_TUBO.z);
    const enVentosa = (t, o) => { leerGrua(G5, t); o.copy(gL).setY(gL.y + 26 + r); leerGrua(G5, f); return o; };
    if (f < 0.08) return arco(P_B0, sobreAveria(pb), 90, E.seno(tramo(f, 0, 0.08)), out);
    if (f < m0.coge - 0.02) { brillo = 1 + 0.3 * Math.sin(reloj * 5); return sobreAveria(out); }
    if (f < m0.coge) return arco(sobreAveria(pa), enVentosa(m0.coge, pb), 30, E.seno(tramo(f, m0.coge - 0.02, m0.coge)), out);
    if (f < mV.fin) return encimaVentosa(out, r);
    const junto = (o) => o.set(P_TUBO.x + 14, 18 + r + bob * 0.3, P_TUBO.z - 22);
    if (f < mV.fin + 0.02) return arco(enVentosa(mV.fin, pa), junto(pb), 30, E.seno(tramo(f, mV.fin, mV.fin + 0.02)), out);
    if (f < n0.coge - 0.02) { if (f > 0.45 && f < 0.52) brillo = 1.4; return junto(out); }
    if (f < n0.coge) return arco(junto(pa), enVentosa(n0.coge, pb), 30, E.seno(tramo(f, n0.coge - 0.02, n0.coge)), out);
    if (f < nF.deja) { if (f > AVISO[0] && f < AVISO[1]) brillo = 0.6; return encimaVentosa(out, r); }
    const sobreLosa = (o) => o.set(ABRE[0].carril.x + 24, ALTO_A + r, ABRE[0].carril.z + 26);
    if (f < nF.deja + 0.02) return arco(enVentosa(nF.deja, pa), sobreLosa(pb), 24, E.seno(tramo(f, nF.deja, nF.deja + 0.02)), out);
    if (f < 0.9) { sentado = true; return sobreLosa(out); }
    return arco(sobreLosa(pa), P_B0, 120, E.seno(tramo(f, 0.9, 1)), out);
  }

  // ── lo que pasa en cada beat ──
  function fotograma(u, reloj, d) {
    moverGrua(u, reloj);
    moverCamion(u);
    moverLosa(u);
    moverAcera(reloj);
    moverCarril();
    // mientras el libro ocupa la pantalla, el carril (que queda delante, de camino a la cámara) descansa: en vertical cruzaría el plano
    const sinCarril = u > 0.75 && u < 0.957;
    for (const m of [losas, bandejas, marcas, juntas, pintura, separadores]) m.visible = !sinCarril;
    if (sinCarril) { nada(impresos, 5); nada(impresos, 6); }
    moverLibro(reloj);
    moverVinieta(reloj);
    // el punto de producción: su pilar, su charco, su haz y un aro que respira
    const nodo = u < 0.3, lat = 0.9 + 0.1 * Math.sin(reloj * 1.7);
    pilar.visible = banda.visible = haz.visible = nodo;
    haz.material.color.setHex(COL.menta).multiplyScalar(0.3 * lat * tramo(d, 1400, 3200));   // de cerca no: no debe tapar el título
    charco(0, PILAR.x, 0.5, PILAR.z, 170, COL.menta, nodo ? 0.4 * lat : 0); charco(1, PILAR.x, 0.6, PILAR.z, 62, COL.menta, nodo ? 0.35 * lat : 0);
    const ra = 122 + 5 * Math.sin(reloj * 0.9);
    if (nodo) { poner(ondas, 4, NS.x, 0.7, NS.z, ra, 1, ra); color(ondas, 4, COL.menta, 0.32 * lat); } else nada(ondas, 4);
    // bajo la losa colgada, un charco cian: su identidad, antes de salir
    charco(2, NS.x, 0.6, NS.z, 150, COL.cian, 0.12 * (1 - tramo(u, 0.19, 0.205)) * (u < 0.21 ? 1 : 0));
    // las rutas: la fantasma se dibuja hacia lejos y se apaga; la corta la enciende el punto
    UF.uA.value = E.eio(tramo(u, 0.178, 0.212)); UF.uB.value = 0.9 * E.eo(tramo(u, 0.178, 0.19)) * (1 - E.seno(tramo(u, 0.214, 0.238)));
    fantasma.visible = UF.uB.value > 0.002;
    const Lp = mezcla(L_NODO + 290, L_OBRA, E.eio(tramo(u, 0.204, 0.242)));
    UC.uA.value = u < 0.204 ? 0 : (u < 0.242 ? (Lp - L_NODO) / (L_OBRA - L_NODO) : 1);
    UC.uB.value = mezcla(1, 0.1, E.seno(tramo(u, 0.252, 0.276))) * (1 - E.seno(tramo(u, 0.33, 0.36)));
    corta.visible = UC.uA.value > 0 && UC.uB.value > 0.002;
    // la obra: al posar la losa, una onda cian; el aro de la garantía; el pasaporte y su hilo
    onda(5, ALA.cx, Y_ALA + 0.6, ALA.cz, 60, 200, tramo(u, 0.3095, 0.33), COL.cian, 0.7);
    charco(7, ALA.cx, 0.5, ALA.cz + 40, 260, COL.cian, 0.08 * E.eo(tramo(u, 0.31, 0.33)) * (1 - tramo(u, 0.47, 0.5)));
    const ua = tramo(u, TL[0], TL[1]), anios = Math.floor(ua * 10), ang = ua >= 1 ? 1 : (anios + E.eio(Math.min(1, fract(ua * 10) * 1.6))) / 10;
    if (u < 0.7) {                                                        // (después, el aro es el del tiempo de la viñeta B)
      aro.position.set(ALA.cx, Y_ALA + 0.4, ALA.cz); aro.scale.setScalar(1); UA.uAng.value = ang;
      UA.uK.value = E.eo(tramo(u, 0.355, 0.372)) * (1 + 1.4 * Math.sin(Math.PI * tramo(u, TL[1], TL[1] + 0.008))) * (1 - E.seno(tramo(u, TL[1] + 0.004, TL[1] + 0.02)));
      aro.visible = UA.uK.value > 0.002;
    }
    const uc = E.vivo(tramo(u, 0.338, 0.362)) * (1 - E.ei(tramo(u, 0.474, 0.49)));
    carta.visible = uc > 0.002;
    if (carta.visible) {
      const est = u > TL[1] + 0.003 ? 1 : 0; if (est !== estadoCarta) { estadoCarta = est; pintarCarta(est === 1); }
      carta.material.map = txCarta; carta.position.copy(CARTA_P).setY(CARTA_P.y + 4 * Math.sin(reloj * 0.9)); carta.quaternion.copy(camara.quaternion); carta.scale.setScalar(Math.max(0.001, uc));
      carta.updateMatrixWorld();
      const hp = hilo.geometry.attributes.position; v1.set(ALA.cx, Y_ALA + 0.5, ALA.cz); v2.set(196 * 0.36, -245 / 2, 0).applyMatrix4(carta.matrixWorld);
      hp.setXYZ(0, v1.x, v1.y, v1.z); hp.setXYZ(1, v2.x, v2.y, v2.z); hp.needsUpdate = true;
      hilo.material.opacity = 0.55 * E.eo(tramo(u, 0.35, 0.37)) * (1 - tramo(u, 0.47, 0.485)); hilo.visible = hilo.material.opacity > 0.01;
    } else hilo.visible = false;
    // las pilas, mientras esperan: un charco cian que las une
    charco(4, 15, ALTO_A + 0.4, 60, 230, COL.cian, 0.1 * E.eo(tramo(u, T4.apilado - 0.01, T4.apilado + 0.004)) * (1 - E.eo(tramo(u, T4.recoge + 0.02, T4.recoge + 0.05))));
    // la ventosa: al agarrar, un pulso cian; al posar, una onda
    const mv = grua.mov;
    if (mv) {
      const k = G4.movs.indexOf(mv) % 2;
      onda(k, mv.A.x, mv.A.y + 0.6, mv.A.z, 14, 70, tramo(u, mv.t + 0.3 * mv.D, mv.t + 0.3 * mv.D + 0.01), COL.cian, 0.9);
      onda(1 - k, mv.B.x, mv.B.y + 0.6, mv.B.z, 20, 90, tramo(u, mv.t + 0.86 * mv.D, mv.t + 0.86 * mv.D + 0.012), COL.cian, 0.6);
    } else { nada(ondas, 0); nada(ondas, 1); }
    // el carril, de cierre: un charco frío que lo envuelve
    charco(6, 550, 0.6, CARRIL.z0 + 60, 620, 0x9fd4ff, 0.05 * E.eo(tramo(u, 0.965, 0.99)));
    onda(6, CARRIL.x0 + 20, ALTO_A + 0.6, CARRIL.z0 + 30, 10, 90, tramo(u, T4.paseo[0], T4.paseo[0] + 0.015), COL.ambar, 0.4);
    onda(7, 560, ALTO_A + 0.6, CARRIL.z0 + 60, 20, 200, tramo(u, 0.975, 1.0), COL.cian, 0.4);
    for (const m of [losas, bandejas, marcas, juntas, pintura, separadores, impresos, avisos, bloques, charcos, ondas, ruedas, mini, piedras]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }

  document.fonts?.load('600 34px Inter').then(() => { pintarAtlas(); if (estadoCarta >= 0) pintarCarta(estadoCarta === 1); }).catch(() => {});
  pintarCarta(false); estadoCarta = 0;

  cap.medir = (w, h) => { W = w; H = h; huecos(); medido = -9; };
  cap.actualizar = (uu, reloj) => {
    u = mapa(uu);                                                         // el avance del guion de siempre; fa y fb, el de los tramos nuevos
    if (reloj - medido > 1) { medido = reloj; huecos(); }                 // los textos pueden cambiar de alto (fuentes, ancho): se vuelven a medir
    let d;
    if (fa >= 0) { calcCam(0.49); copiaCam(C0); calcCam(0.5); copiaCam(C1); camTramo(GUION_A, fa); d = aplicarCam(reloj); }
    else if (fb >= 0) { calcCam(0.72); copiaCam(C0); camTramo(GUION_B, fb); d = aplicarCam(reloj); }
    else d = encuadrar(u, reloj);
    luzTiempo(u, d);
    fotograma(u, reloj, d);
    moverParcela(reloj);
    moverReparacion(reloj);
    moverPunto(u, reloj, d);
    for (const m of [losas, bandejas, marcas, ruedas, kit, tornillos, marcos, charcos, ondas]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  };
  return cap;
});

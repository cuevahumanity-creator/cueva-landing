// ─────────────────────────────────────────────────────────────────────
//  Capítulo «obras»: las portadas animadas de las tres obras, cada una en el hueco de su tarjeta.
//  Tres escenas pequeñas en el plató blanco, cada una un bucle de reloj (no de scroll), con su
//  plano de situación al empezar y un final que enlaza con el principio (la cámara sube al cielo).
//  · Piedrahita: la vida de la #406, una J8 (2,25) de 6,28 × 2,25 × 0,26 m. El punto ámbar deja su
//    etiqueta en el canto del molde (ilustrativo), se hormigona, se carga en el camión 2 de 5 con la
//    #405, la #407 y la #408, viaja por carretera sin lecturas (un tramo vacío, honesto), llega a la obra
//    y la grúa la deja en la cubierta de 10,50 × 6,00 m (cuatro J8 de 2,25 y una de 1,5). Se certifica.
//  · Llar de Mar: las góndolas traen las placas J10 apiladas; la autogrúa iza cada una con su útil de
//    6 m y seis puntos, y las deja en orden sobre los muretes (23,27 × 7,48 m). La unión, en el centro
//    del forjado entre dos placas interiores: placa de 400 × 400 mm con cuatro pernos M24, atornillada,
//    con los pernos soldados debajo; las placas, apoyadas en los muretes. Después sube la casa de madera,
//    entre pinos.
//  · Madrid: una casa profunda entre medianeras. Las piezas blancas suben planta a planta en el
//    solar estrecho, el patio abre la luz hacia abajo y un barrido de sol enseña cómo llega al fondo.
//  Escala: 1 m = 10 unidades en las tres. Las cifras salen de DATOS y de PIEZA406.
// ─────────────────────────────────────────────────────────────────────
CUEVA.capitulo('obras', (ctx) => {
  const { T3, E, mezcla, tramo, COL, esmalte, estudio, cuerda, mirar, DATOS } = ctx;
  const V = (x = 0, y = 0, z = 0) => new T3.Vector3(x, y, z);
  const amort = (t, f, k) => (t > 0 ? Math.sin(t * f) * Math.exp(-t * k) : 0);
  const modp = (a, n) => ((a % n) + n) % n;
  const P406 = window.PIEZA406 || { id: '#406', dimensiones: [6.28, 2.25, 0.26], camion: { viaje: 2, de: 5, piezas: ['#405', '#406', '#407', '#408'] } };
  const PLANTAS = Object.fromEntries((DATOS.ATLAS?.plantas || []).map((p) => [p.k, p]));
  const FONDO_PORTADA = 0xF2F4F8;

  // ── geometría: un bloque de esmalte con los cantos redondeados (base en y = 0), que se escala a cada pieza ──
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
  const geoBloque = (() => {
    const s = new T3.Shape(), w = 0.5, r = 0.06;
    s.moveTo(-w + r, -w); s.lineTo(w - r, -w); s.absarc(w - r, -w + r, r, -Math.PI / 2, 0); s.lineTo(w, w - r); s.absarc(w - r, w - r, r, 0, Math.PI / 2);
    s.lineTo(-w + r, w); s.absarc(-w + r, w - r, r, Math.PI / 2, Math.PI); s.lineTo(-w, -w + r); s.absarc(-w + r, -w + r, r, Math.PI, Math.PI * 1.5);
    const b = 0.04, g = new T3.ExtrudeGeometry(s, { depth: 1 - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 2, curveSegments: 2 });
    g.rotateX(-Math.PI / 2); g.translate(0, b, 0); return normalesSuaves(g);
  })();
  const geoBola = new T3.IcosahedronGeometry(1, 2);
  const geoRueda = (() => { const g = new T3.CylinderGeometry(0.5, 0.5, 1, 18); g.rotateX(Math.PI / 2); return g; })();

  // ── una maqueta: todas las piezas de una escena en una sola malla instanciada (un color por pieza) ──
  const mano = new T3.Object3D(); mano.rotation.order = 'YXZ';
  const cTmp = new T3.Color();
  function maqueta(escena, n, geo = geoBloque, mat = esmalte(0xffffff, { roughness: 0.32 })) {
    const m = new T3.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(T3.DynamicDrawUsage); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    for (let k = 0; k < n; k++) { m.setColorAt(k, cTmp.set(0xffffff)); mano.scale.setScalar(0); mano.updateMatrix(); m.setMatrixAt(k, mano.matrix); }
    escena.add(m);
    return {
      m, n,
      // la pieza k: su base en (x, y, z), su tamaño, y sus giros (y, luego x, luego z)
      pon(k, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) { mano.position.set(x, y, z); mano.rotation.set(rx, ry, rz); mano.scale.set(sx, sy, sz); mano.updateMatrix(); m.setMatrixAt(k, mano.matrix); },
      nada(k) { mano.scale.setScalar(0); mano.updateMatrix(); m.setMatrixAt(k, mano.matrix); },
      color(k, hex) { m.setColorAt(k, cTmp.set(hex)); },
      colorLin(k, c) { m.setColorAt(k, c); },
      fin() { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; },
    };
  }
  // ── marcas: un atlas con los textos (Inter) y planos instanciados que eligen su celda ──
  function marcas(escena, textos, n) {
    const C = 4, F = Math.ceil(textos.length / C), cw = 256, ch = 160, cv = document.createElement('canvas'); cv.width = C * cw; cv.height = F * ch;
    const pintar = () => { const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.fillStyle = '#fff'; x.font = '600 64px Inter, system-ui, sans-serif'; x.textBaseline = 'middle'; x.textAlign = 'center';
      textos.forEach((t, k) => x.fillText(t, (k % C) * cw + cw / 2, Math.floor(k / C) * ch + ch / 2 + 2)); };
    pintar();
    const tx = new T3.CanvasTexture(cv); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 8;
    document.fonts?.load('600 64px Inter').then(() => { pintar(); tx.needsUpdate = true; }).catch(() => {});
    const mat = new T3.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = 'attribute float aCelda;\n' + sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
        vMapUv = (vec2(mod(aCelda, ${C}.0), ${F - 1}.0 - floor(aCelda / ${C}.0)) + vec2(vMapUv.x, 0.2 + vMapUv.y * 0.6)) / vec2(${C}.0, ${F}.0);`);   // un margen en la celda: de lejos no asoma la fila de al lado
    };
    const m = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1), mat, n), celda = new Float32Array(n);   // el plano cubre los 96 px centrales de su celda de 160: queda aire arriba y abajo
    m.geometry.setAttribute('aCelda', new T3.InstancedBufferAttribute(celda, 1)); m.frustumCulled = false; m.renderOrder = 3;
    for (let k = 0; k < n; k++) { m.setColorAt(k, cTmp.set(COL.tinta)); mano.scale.setScalar(0); mano.updateMatrix(); m.setMatrixAt(k, mano.matrix); }
    escena.add(m);
    const asp = cw / 96;                                                       // la banda visible mide 96 px: la letra, del tamaño de siempre
    return {
      m,
      // la marca k con el texto c, centrada en (x, y, z), de alto h, girada (y, x)
      pon(k, c, x, y, z, h, ry = 0, rx = 0) { celda[k] = c; mano.position.set(x, y, z); mano.rotation.set(rx, ry, 0); mano.scale.set(h * asp, h, 1); mano.updateMatrix(); m.setMatrixAt(k, mano.matrix); },
      nada(k) { mano.scale.setScalar(0); mano.updateMatrix(); m.setMatrixAt(k, mano.matrix); },
      color(k, c) { m.setColorAt(k, c); },
      fin() { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.geometry.attributes.aCelda.needsUpdate = true; },
    };
  }
  // ── jarcia: todas las cuerdas de una escena en un solo trazo ──
  function jarcia(escena, n, color = 0x3c475e, op = 0.6) {
    const pos = new Float32Array(n * 6), g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3));
    const l = new T3.LineSegments(g, new T3.LineBasicMaterial({ color, transparent: true, opacity: op })); l.frustumCulled = false; escena.add(l);
    let k = 0;
    return { empezar() { k = 0; }, linea(a, b) { if (k >= n) return; const o = k * 6; pos[o] = a.x; pos[o + 1] = a.y; pos[o + 2] = a.z; pos[o + 3] = b.x; pos[o + 4] = b.y; pos[o + 5] = b.z; k++; }, fin() { pos.fill(0, k * 6); g.attributes.position.needsUpdate = true; } };
  }
  // ── el plató de cada portada: el estudio blanco y su cámara, con llaves en el tiempo del bucle ──
  const cTinta = new T3.Color(COL.tinta), cMenta = new T3.Color(COL.menta), cMix = new T3.Color();
  function plato(escena) {
    const p = estudio(escena, { tema: 'claro' });
    if (p.suelo?.material.isShadowMaterial) p.suelo.material.opacity = 0.2;
    p.clave.shadow.mapSize.set(1024, 1024);
    return p;
  }
  //  [t, x, y, z, distancia, lado, elevación]; la distancia crece si el hueco es más estrecho que el de referencia
  const mira = V();
  function encuadre(c, llaves, t, k) {
    let i = 0; while (i < llaves.length - 2 && t > llaves[i + 1][0]) i++;
    const a = llaves[i], b = llaves[i + 1], s = E.seno(tramo(t, a[0], b[0]));
    const d = Math.exp(mezcla(Math.log(a[4]), Math.log(b[4]), s)) * k;
    mira.set(mezcla(a[1], b[1], s), mezcla(a[2], b[2], s), mezcla(a[3], b[3], s));
    mirar(c.camara, mira.x, mira.y, mira.z, d, mezcla(a[5], b[5], s) + 0.02 * Math.sin(t * 0.4), mezcla(a[6], b[6], s));
    c.plato.enfocar(mira.x, mira.y, mira.z, Math.max(d, 60));
    const sc = c.plato.clave.shadow; sc.camera.near = Math.max(1, d * 0.3); sc.camera.far = d * 8; sc.camera.updateProjectionMatrix(); sc.normalBias = Math.min(0.6, Math.max(0.02, d * 0.002));
    return d;
  }
  // el velo: un fundido corto al color de la tarjeta que cose el final de cada bucle con su principio
  function veloDe(escena, camara) {
    const v = new T3.Mesh(new T3.PlaneGeometry(1, 1), new T3.MeshBasicMaterial({ color: FONDO_PORTADA, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
    v.position.set(0, 0, -2); v.scale.set(8, 8, 1); v.renderOrder = 999; v.frustumCulled = false; camara.add(v); escena.add(camara);
    return (t, D) => { v.material.opacity = Math.max(E.eio(tramo(t, D - 0.55, D - 0.05)), 1 - E.eio(tramo(t, 0.02, 0.5))); };
  }
  // el aro de lectura (menta) y el punto ámbar, en cada escena
  function aroDe(escena) { const m = new T3.Mesh(new T3.TorusGeometry(1, 0.05, 6, 64), new T3.MeshBasicMaterial({ color: COL.menta, transparent: true, depthWrite: false })); m.rotation.x = Math.PI / 2; m.visible = false; escena.add(m); return m; }
  function puntoDe(escena) { const p = ctx.punto(escena, { alcance: 120 }); if (p.esfera) p.esfera.castShadow = true; return p; }
  const lerpV = (o, a, b, s) => o.set(mezcla(a.x, b.x, s), mezcla(a.y, b.y, s), mezcla(a.z, b.z, s));
  // un salto parabólico de a a b (s de 0 a 1), con altura h
  const salto = (o, a, b, s, h) => { lerpV(o, a, b, s); o.y += h * 4 * s * (1 - s); return o; };
  const tA = V(), tB = V(), tC = V(), tD = V(), tE = V();

  // ═════════════════════════════════════════════════════════════════════
  //  1. Piedrahita: la vida de la #406 (22 s)
  // ═════════════════════════════════════════════════════════════════════
  function portadaPiedrahita() {
    const D = 22, escena = new T3.Scene(), camara = new T3.PerspectiveCamera(32, 1.45, 1, 8000), pl = plato(escena);
    const [L6, A6, E6] = (P406.dimensiones || [6.28, 2.25, 0.26]).map((v) => v * 10);       // 62,8 × 22,5 × 2,6
    const PL = PLANTAS.piedrahita || { w: 10.5, h: 6.0, bandas: [2.25, 2.25, 2.25, 2.25, 1.5] };
    const CAM = P406.camion || { viaje: 2, de: 5, piezas: ['#405', '#406', '#407', '#408'] };
    const ACERO = 0x3a4049, GRIS = 0xc4cad3, OSCURO = 0x2a2f38, TINTA = COL.tinta;
    const mq = maqueta(escena, 90), ruedas = maqueta(escena, 14, geoRueda, new T3.MeshStandardMaterial({ color: 0x23272e, roughness: 0.6 }));
    const etq = marcas(escena, [...CAM.piezas, `${CAM.viaje} de ${CAM.de}`], 6), cuerdas = jarcia(escena, 10), velo = veloDe(escena, camara);
    const hilo = cuerda(escena, { color: 0x3c475e, opacidad: 0.55 }), aro = aroDe(escena), P = puntoDe(escena);
    mq.color(0, 0xb9c0ca); for (const k of [1, 2, 3, 4]) mq.color(k, ACERO);                                      // la mesa y el molde
    // la carretera: el camión se queda en el encuadre y es el mundo el que corre (fábrica → 136 km → obra)
    const S = 2400, X_CAMION = 40, Z_CASA = -78, BED = 12;
    const IDX = { mesa: 0, molde: 1, losa: 10, chip: 9, pila: 11, cab: 20, caja: 21, chasis: 22, cristal: 23, road: 24, rayas: 26, postes: 66, muros: 72, bandas: 80, grua: 86 };
    mq.color(IDX.chip, COL.ion); mq.color(IDX.cab, 0xffffff); mq.color(IDX.chasis, OSCURO); mq.color(IDX.cristal, TINTA); mq.color(IDX.road, 0xd7dce3);
    for (let k = 0; k < 40; k++) mq.color(IDX.rayas + k, 0xffffff);
    for (let k = 0; k < 6; k++) mq.color(IDX.postes + k, GRIS);
    mq.color(IDX.grua, 0xffffff); mq.color(IDX.grua + 1, OSCURO); mq.color(IDX.grua + 2, 0xffffff); mq.color(IDX.grua + 3, OSCURO);
    // la cubierta: cuatro J8 (2,25) y una J8 (1,5); la #406 es la segunda (ilustrativo)
    const bandas = []; { let x = -PL.w * 5; for (const b of PL.bandas) { bandas.push({ x: x + b * 5, a: b * 10 }); x += b * 10; } }
    const ORDEN = [['#408', 3], ['#407', 2], ['#406', 1], ['#405', 0]];                           // se descarga de arriba abajo
    const IZA = [[12.9, 14.1], [14.1, 15.3], [15.3, 17.7], [17.7, 18.8]];
    // tablas fijas (fuera del fotograma: nada se crea al dibujar)
    const MOLDE = [[0, 11.75, L6 + 2, 1], [0, -11.75, L6 + 2, 1], [31.9, 0, 1, A6], [-31.9, 0, 1, A6]];
    const OTRAS = [[0, 0, null], [2, 2, [6.0, 6.6]], [3, 3, [6.6, 7.2]]], CAE = [0, 0, 6.6, 7.2];
    const ESL_F = [[-20, -8], [20, -8], [20, 8], [-20, 8]], ESL_O = [[-18, -7], [18, -7], [18, 7], [-18, 7]];
    const pilaY = (j) => BED + j * (E6 + 0.8);                                                   // #405 abajo, #408 arriba
    const LLAVES = [
      [0, -45, 10, 6, 120, 0.5, 0.56],                                                     // el molde; se entra con un fundido
      [0.7, -45, 10, 6, 115, 0.55, 0.55], [3.5, -40, 8, 0, 135, 0.4, 0.62],
      [4.4, -5, 14, 0, 230, 0.32, 0.45], [7.2, 20, 16, 0, 230, 0.6, 0.34],
      [8.4, 40, 14, 0, 200, 0.1, 0.14], [11.6, 40, 14, 0, 210, 0.3, 0.12],                                 // la carretera, de perfil: sin lecturas
      [13.0, 40, 22, -40, 270, 0.75, 0.42], [15.3, 30, 26, -60, 215, 0.55, 0.5],
      [17.7, 20, 30, -75, 160, 0.42, 0.62], [19.7, 40, 22, -60, 250, 0.34, 0.55],
      [22, 40, 24, -60, 270, 0.26, 0.56],                                                  // la casa certificada; se sale con un fundido
    ];
    const posLosa = V(), gancho = V();
    function actualizar(t, aspecto) {
      const k = Math.pow(Math.max(1, 1.45 / aspecto), 0.85), d = encuadre(c, LLAVES, t, k);
      const dist = S * E.eio(tramo(t, 7.4, 12.6)), fx = -dist, sx = S - dist;                 // fábrica y obra, en coordenadas del encuadre
      // la fábrica: mesa, molde (que se abre), la etiqueta y el vertido
      mq.pon(IDX.mesa, -40 + fx, 0, 0, 80, 8, 34);
      const abre = E.eio(tramo(t, 3.5, 4.1));
      for (let q = 0; q < 4; q++) { const m = MOLDE[q]; mq.pon(IDX.molde + q, -40 + fx + m[0] * (1 + abre * 0.08), 8 - 3 * abre, m[1] * (1 + abre * 0.1), m[2], Math.max(0.01, 4 * (1 - abre)), m[3]); }
      // la etiqueta: el punto la deja en el canto del molde antes del vertido (ilustrativo); viaja dentro del canto
      const sale = tramo(t, 0.9, 1.7);
      // la #406: se hormigona (crece en el molde), se iza al camión, viaja y la grúa de obra la deja en la cubierta
      const vertido = E.eo(tramo(t, 1.9, 3.4)), sobreCamion = t >= 6.0 && t < IZA[2][0];
      let losaVis = t >= 1.9, ry = 0;
      if (t < 4.3) posLosa.set(-40 + fx, 8, 0);
      else if (t < 6.0) { const q = tramo(t, 4.3, 6.0), sube = E.eio(tramo(q, 0, 0.3)), lleva = E.eio(tramo(q, 0.2, 0.8)), baja = E.eo(tramo(q, 0.7, 1)); posLosa.set(mezcla(-40, X_CAMION, lleva) + fx, mezcla(8, 40, sube) - mezcla(0, 40 - pilaY(1), baja), 0); posLosa.x += 3 * Math.sin(q * 9) * (1 - q); }
      else if (sobreCamion) posLosa.set(X_CAMION, pilaY(1), 0);
      else izarDe(1, t, posLosa);
      if (!(t >= 6.0 && t < IZA[2][0]) && t >= IZA[2][0]) ry = rumboIzado(t, IZA[2]);
      if (losaVis) mq.pon(IDX.losa, posLosa.x, posLosa.y, posLosa.z, L6, Math.max(0.05, E6 * vertido), A6, ry); else mq.nada(IDX.losa);
      // el chip: antes del vertido, en el canto del molde; después, en el canto de la losa
      if (t < 0.9) mq.nada(IDX.chip);
      else if (t < 1.7) { salto(tA, tB.set(-67 + fx, 60, 30), tC.set(-40 - 27.5 + fx, 9.3, 11.0), E.eio(sale), 20); mq.pon(IDX.chip, tA.x, tA.y, tA.z, 3, 1, 3); }
      else { const ca = Math.cos(ry), sa = Math.sin(ry); mq.pon(IDX.chip, posLosa.x - 27.5 * ca + 10.6 * sa, posLosa.y + 1.0 * Math.max(0.3, vertido), posLosa.z + 27.5 * sa + 10.6 * ca, 3, 1, 1.4, ry); }
      // las otras tres del viaje: #405 ya cargada; #407 y #408 caen encima después de la #406
      for (let o = 0; o < 3; o++) {
        const j = OTRAS[o][0], nivel = OTRAS[o][1], cae = OTRAS[o][2];
        const id = CAM.piezas[j], ord = ORDEN.find((o) => o[0] === id), iza = IZA[ORDEN.indexOf(ord)];
        const slot = IDX.pila + j;
        if (cae && t < cae[0]) { mq.nada(slot); continue; }
        if (t < iza[0]) {
          const y = cae ? mezcla(pilaY(nivel) + 60, pilaY(nivel), E.eo(tramo(t, cae[0], cae[1]))) : pilaY(nivel);
          mq.pon(slot, X_CAMION + (t < 7.4 ? 0 : 0), y, 0, L6, E6, A6);
        } else { izarDe(ord[1], t, tA, iza); mq.pon(slot, tA.x, tA.y, tA.z, L6, E6, A6, rumboIzado(t, iza)); }
      }
      // el camión (2 de 5): cabina, caja, chasis y ruedas; durante el viaje, un traqueteo mínimo
      const traq = (t > 7.4 && t < 12.6 ? 0.25 * Math.sin(t * 31) : 0) + (t > 12.4 && t < 12.9 ? -0.6 * amort((t - 12.4) * 4, 9, 2) : 0);
      mq.pon(IDX.chasis, X_CAMION + 6, 3, 0, 98, 4, 22);
      mq.pon(IDX.caja, X_CAMION, 7 + traq, 0, 74, BED - 7, 26);
      mq.pon(IDX.cab, X_CAMION + 47, 5 + traq, 0, 20, 24, 25);
      mq.pon(IDX.cristal, X_CAMION + 57.2, 17 + traq, 0, 0.8, 8, 22);
      for (let q = 0; q < 6; q++) ruedas.pon(q, X_CAMION - 26 + (q % 3) * 14 + (q % 3 === 2 ? 30 : 0), 3, q < 3 ? 11.5 : -11.5, 7, 7, 4, 0, 0, -dist * 0.15);
      // la carretera, sus rayas y sus postes: pasan mientras el camión rueda
      mq.pon(IDX.road, X_CAMION, -0.6, 0, 1400, 0.7, 46);
      for (let q = 0; q < 40; q++) mq.pon(IDX.rayas + q, X_CAMION - 700 + modp(q * 36 - dist, 1440), 0.15, 0, 16, 0.3, 1.2);
      for (let q = 0; q < 6; q++) mq.pon(IDX.postes + q, X_CAMION - 700 + modp(q * 240 + 120 - dist, 1440), 0, -30, 1.6, 9, 1.6);
      // la obra: la casa de 10,50 × 6,00 m (muros con huecos, como la de la foto) y su cubierta
      const cx = X_CAMION + sx;
      mq.pon(IDX.muros, cx, 0, Z_CASA - 28.8, 105, 27, 2.4);                                    // trasero
      mq.pon(IDX.muros + 1, cx - 51.3, 0, Z_CASA, 2.4, 27, 57.6); mq.pon(IDX.muros + 2, cx + 51.3, 0, Z_CASA, 2.4, 27, 57.6);
      for (let q = 0; q < 4; q++) mq.pon(IDX.muros + 3 + q, cx - 45 + q * 30, 0, Z_CASA + 28.8, 10, 27, 2.4);   // la fachada: machones
      mq.pon(IDX.muros + 7, cx, 20, Z_CASA + 28.8, 105, 7, 2.4);                                // y su dintel
      for (let q = 0; q < 5; q++) {
        const b = bandas[q], id = q === 4 ? null : ORDEN.find((o) => o[1] === q)[0];
        if (id) { mq.nada(IDX.bandas + q); continue; }                                           // las de la #405–#408 llegan en el camión
        mq.pon(IDX.bandas + q, cx + b.x, 27, Z_CASA, b.a - 0.6, E6, L6);
      }
      // la autogrúa de la obra: chasis, cabina y pluma, que apunta al gancho
      const gx = cx - 70, gz = -175;                                                             // detrás de la casa: la pluma pasa por encima
      const enObra = t > 12.0;
      mq.pon(IDX.grua, gx, 2, gz, 60, 10, 24); mq.pon(IDX.grua + 1, gx + 20, 12, gz + 8, 14, 10, 8);
      ganchoEn(t, gancho); if (!enObra) gancho.set(gx, 60, gz);
      tA.set(gx - 8, 18, gz); tB.copy(gancho).sub(tA); tB.y += 34; const lb = tB.length();
      mq.pon(IDX.grua + 2, tA.x, tA.y, tA.z, 4.4, lb, 4.4, Math.atan2(tB.x, tB.z), Math.acos(Math.min(1, tB.y / lb)));
      if (enObra) mq.pon(IDX.grua + 3, gancho.x, gancho.y, gancho.z, 3, 3, 3); else mq.nada(IDX.grua + 3);
      // cuerdas: el puente grúa de la fábrica (de lo alto) y la de la autogrúa (desde la punta de la pluma)
      cuerdas.empezar();
      if (t > 4.0 && t < 6.4) { tC.set(posLosa.x, posLosa.y + 20, 0); for (let q = 0; q < 4; q++) cuerdas.linea(tC, tD.set(posLosa.x + ESL_F[q][0], posLosa.y + E6, ESL_F[q][1])); cuerdas.linea(tC, tE.set(posLosa.x, 900, 0)); }
      const tip = tE.copy(tA).addScaledVector(tB, 1);
      if (t > 12.6 && t < 19.4) { hilo.tender(tip, tD.copy(gancho).setY(gancho.y + 1.5), 0, 0); const pz = colgada(t); if (pz) for (let q = 0; q < 4; q++) { const x = ESL_O[q][0], z = ESL_O[q][1]; cuerdas.linea(gancho, tC.set(pz.x + x * Math.cos(pz.r) + z * Math.sin(pz.r), pz.y + E6, pz.z - x * Math.sin(pz.r) + z * Math.cos(pz.r))); } }
      else hilo.visible = false;
      cuerdas.fin();
      // las marcas: #405…#408 en la cara de arriba; «2 de 5» en el costado de la caja
      for (let j = 0; j < 4; j++) {
        const id = CAM.piezas[j], ord = ORDEN.find((o) => o[0] === id), iza = IZA[ORDEN.indexOf(ord)];
        let x, y, z, r = 0, vis = true;
        if (j === 1) { if (t < 3.4) vis = false; x = posLosa.x; y = posLosa.y; z = posLosa.z; r = ry; }
        else { if (t < CAE[j]) vis = false; if (t < iza[0]) { x = X_CAMION; y = pilaY(j); z = 0; } else { izarDe(ord[1], t, tA, iza); x = tA.x; y = tA.y; z = tA.z; r = rumboIzado(t, iza); } }
        if (!vis) { etq.nada(j); continue; }
        etq.pon(j, j, x - 18 * Math.cos(r), y + E6 + 0.15, z + 18 * Math.sin(r), 5, r, -Math.PI / 2);
        const lee = j === 1 ? Math.sin(Math.PI * tramo(t, 17.7, 18.6)) + Math.sin(Math.PI * tramo(t, 18.9, 20.2)) * 0.8 : 0;
        etq.color(j, cMix.lerpColors(cTinta, cMenta, Math.min(1, lee)));
      }
      etq.pon(4, 4, X_CAMION, 7.6, 13.05, 4.2); etq.color(4, cTinta);
      // el punto: trae la etiqueta, mira el vertido, viaja junto a la #406 sin leer nada y la lee al posarse
      let br = 1, px, py, pz;
      if (t < 0.8) { br = 0; px = -67 + fx; py = 120; pz = 30; }
      else if (t < 1.7) { salto(tA, tB.set(-67 + fx, 70, 30), tC.set(-40 - 27.5 + fx, 13, 13), E.eio(tramo(t, 0.8, 1.7)), 18); px = tA.x; py = tA.y; pz = tA.z; br = E.eo(tramo(t, 0.8, 1.1)); }
      else { tA.set(posLosa.x - 27.5 * Math.cos(ry) + 13 * Math.sin(ry), posLosa.y + 4 + 1.2 * Math.sin(t * 2.2), posLosa.z + 27.5 * Math.sin(ry) + 13 * Math.cos(ry)); px = tA.x; py = tA.y; pz = tA.z; }
      if (t > 7.6 && t < 12.6) br *= mezcla(1, 0.28, E.seno(tramo(t, 7.6, 8.4)) * (1 - E.seno(tramo(t, 12.0, 12.6))));   // sin lecturas: el punto se apaga
      br += 0.7 * Math.sin(Math.PI * tramo(t, 17.7, 18.4)) + 0.5 * Math.sin(Math.PI * tramo(t, 18.9, 19.8));
      P.poner(px, py, pz, 2.2, br * (t > 21 ? 1 - tramo(t, 21, 21.6) : 1)); if (P.luz) { P.luz.intensity *= 0.4; P.luz.distance = 70; }
      // la certificación: un aro que sale de la #406 y abarca la cubierta
      const qa = tramo(t, 17.7, 18.6), qc = tramo(t, 18.9, 20.4);
      aro.visible = (qa > 0 && qa < 1) || (qc > 0 && qc < 1);
      if (qc > 0 && qc < 1) { aro.position.set(cx, 27 + E6 + 0.3, Z_CASA); aro.scale.setScalar(10 + 70 * E.eo(qc)); aro.material.opacity = 0.9 * (1 - qc); }
      else if (aro.visible) { aro.position.set(posLosa.x, posLosa.y + E6 + 0.3, posLosa.z); aro.scale.setScalar(4 + 26 * E.eo(qa)); aro.material.opacity = 0.9 * (1 - qa); }
      velo(t, D);
      mq.fin(); ruedas.fin(); etq.fin();
      return d;
    }
    // una losa en el izado de la obra: del camión (pila) a su banda; i = banda; iz = [t0, t1]
    const IZA_PILA = { 3: 3, 2: 2, 1: 1, 0: 0 };
    function izarDe(banda, t, out, iz = IZA[ORDEN.findIndex((o) => o[1] === banda)]) {
      const q = tramo(t, iz[0], iz[1]), cx = X_CAMION, b = bandas[banda];
      const sube = E.eio(tramo(q, 0.05, 0.3)), lleva = E.eio(tramo(q, 0.2, 0.8)), baja = E.eo(tramo(q, 0.75, 0.97));
      const y0 = pilaY(IZA_PILA[banda]), yA = 70;
      out.set(mezcla(cx, cx + b.x, lleva), mezcla(y0, yA, sube) - mezcla(0, yA - 27, baja), mezcla(0, Z_CASA, lleva));
      out.x += 2.5 * Math.sin(q * 11) * (1 - q) * (q > 0.2 ? 1 : 0);
      return out;
    }
    const rumboIzado = (t, iz) => { const q = tramo(t, iz[0], iz[1]); return mezcla(0, Math.PI / 2, E.eio(tramo(q, 0.25, 0.85))) + 0.06 * Math.sin(q * 8) * (1 - q); };
    const colg = { x: 0, y: 0, z: 0, r: 0 };
    function colgada(t) { for (let n = 0; n < 4; n++) { const iz = IZA[n]; if (t >= iz[0] && t < iz[1] - 0.04) { izarDe(ORDEN[n][1], t, tA, iz); colg.x = tA.x; colg.y = tA.y; colg.z = tA.z; colg.r = rumboIzado(t, iz); return colg; } } return null; }
    // el gancho de la autogrúa: sobre la losa colgada; entre izados, vuelve a la pila
    function ganchoEn(t, out) {
      const c = colgada(t);
      if (c) return out.set(c.x, c.y + 22, c.z);
      let prev = null, next = IZA[0]; for (let n = 0; n < 4; n++) { if (t >= IZA[n][1]) prev = n; if (t < IZA[n][0]) { next = IZA[n]; break; } }
      const reposo = tC.set(X_CAMION - 20, 60, -40);
      if (prev === null) return out.copy(reposo);
      izarDe(ORDEN[prev][1], IZA[prev][1] - 0.04, tD, IZA[prev]); tD.y += 22;
      const q = prev < 3 ? tramo(t, IZA[prev][1] - 0.04, IZA[prev + 1][0]) : tramo(t, IZA[prev][1], IZA[prev][1] + 0.8);
      const fin = prev < 3 ? tE.set(X_CAMION, pilaY(IZA_PILA[ORDEN[prev + 1][1]]) + E6 + 22, 0) : reposo;
      return salto(out, tD, fin, E.eio(q), 12);
    }
    const c = { escena, camara, plato: pl, D, aRef: 1.45, actualizar };
    return c;
  }

  // ═════════════════════════════════════════════════════════════════════
  //  2. Llar de Mar: el forjado tipo A y la casa de madera (24 s)
  // ═════════════════════════════════════════════════════════════════════
  function portadaLlar() {
    const D = 24, escena = new T3.Scene(), camara = new T3.PerspectiveCamera(32, 1.45, 1, 9000), pl = plato(escena);
    const L = 232.68, A = 74.82, X0 = -L / 2, Z0 = -A / 2, CANTO = 3, Y0 = 4;
    // las placas J10 del forjado tipo A, con su despiece de los planos de fabricación (geometría): x0, z0, lx, lz en m
    const PLACAS = [...Array.from({ length: 7 }, (_, i) => [i * 2.25, 0, 2.25, 7.482]), [15.75, 0, 2.324, 7.482], [18.074, 0, 5.195, 2.25], [18.074, 2.25, 5.195, 2.982], [18.074, 5.232, 5.195, 2.25]]
      .map(([x0, z0, lx, lz], i) => ({ n: i + 1, x: X0 + (x0 + lx / 2) * 10, z: Z0 + (z0 + lz / 2) * 10, lx: lx * 10, lz: lz * 10, rot: lx < lz ? Math.PI / 2 : 0 }));
    const MURETES = [[0.52, 21.72, 0.565, 0.815], [0.52, 21.72, 6.665, 6.915], [0.495, 0.745, 0.815, 6.665], [17.945, 18.195, 0.815, 6.665], [21.495, 21.745, 0.815, 6.665]];
    // la unión que se ve de cerca: en el centro del forjado, entre dos placas interiores (la J10A4 y la J10A5, en su línea
    //  de 2,97 m); lejos del borde, donde la losa vuela sobre el murete y no se vería bien
    const UN = V(X0 + 90, Y0 + CANTO, Z0 + 29.7);
    const MADERA = 0xd8bf9a, PINO = 0xa9bba4, TRONCO = 0x8f7f6d, OSCURO = 0x2a2f38, ARENA = 0xe9e3d6;
    const mq = maqueta(escena, 120), copas = maqueta(escena, 18, geoBola, esmalte(0xffffff, { roughness: 0.6, clearcoat: 0.2 }));
    const ruedas = maqueta(escena, 12, geoRueda, new T3.MeshStandardMaterial({ color: 0x23272e, roughness: 0.6 }));
    const etq = marcas(escena, PLACAS.map((p) => `J10A${p.n}`), 11), cuerdas = jarcia(escena, 12), hilo = cuerda(escena, { color: 0x3c475e, opacidad: 0.55 });
    const aro = aroDe(escena), P = puntoDe(escena);
    // el velo: un fundido corto al color de la tarjeta que cose el final con el principio del bucle
    const velo = veloDe(escena, camara);
    const I = { placa: 0, murete: 11, gondola: 16, grua: 22, util: 26, union: 27, perno: 28, casa: 32, ventana: 42, pino: 48, suelo: 66 };
    for (let k = 0; k < 5; k++) mq.color(I.murete + k, 0xc9ced6);
    for (let k = 0; k < 6; k++) mq.color(I.gondola + k, k % 3 === 0 ? 0xffffff : OSCURO);
    mq.color(I.grua, 0xffffff); mq.color(I.grua + 1, OSCURO); mq.color(I.grua + 2, 0xffffff); mq.color(I.grua + 3, OSCURO); mq.color(I.util, OSCURO);
    mq.color(I.union, 0x3a4049); for (let k = 0; k < 4; k++) mq.color(I.perno + k, 0x8d96a5);
    for (let k = 0; k < 10; k++) mq.color(I.casa + k, MADERA);
    for (let k = 0; k < 6; k++) mq.color(I.ventana + k, COL.tinta);
    for (let k = 0; k < 18; k++) { mq.color(I.pino + k, TRONCO); copas.color(k, PINO); }
    mq.color(I.suelo, ARENA);
    // los pinos, alrededor (fijos)
    const PINOS = Array.from({ length: 18 }, (_, k) => { const a = k * 2.399 + 0.3, r = 190 + ((k * 7919) % 120); return [Math.cos(a) * r * 1.4, Math.sin(a) * r * 0.9, 46 + ((k * 104729) % 30), 26 + ((k * 31) % 14)]; });
    // las góndolas: dos camiones con las placas apiladas en plano (1–6 y 7–11), aparcados junto a la parcela
    const GZ = 95, GX = [-70, 60], BED = 9, ALT = CANTO + 0.6;
    const enGondola = (n) => { const g = n <= 6 ? 0 : 1, pila = g ? 11 - n : 6 - n; return [GX[g], BED + pila * ALT, GZ]; };
    // cada placa: el útil baja, la placa sube en vertical, viaja por encima de todo, baja a su sitio y el útil se suelta
    const T_I = 1.8, CICLO = 1.27, fase = (n) => [T_I + (n - 1) * CICLO, T_I + n * CICLO];
    const GRUA = V(-30, 0, -125), Y_VIAJE = 60;                                                  // la autogrúa, detrás del forjado
    function placaEn(n, t, out) {
      const p = PLACAS[n - 1], [t0, t1] = fase(n), q = tramo(t, t0, t1), [gx, gy, gz] = enGondola(n);
      out.q = q;
      if (t < t0 + 0.18 * CICLO) { out.set(gx, gy, gz); out.r = p.rot; out.donde = 'camion'; return out; }      // en el camión, a lo largo de la caja
      if (q >= 0.9) { out.set(p.x, Y0, p.z); out.r = 0; out.donde = 'puesta'; return out; }
      const sube = E.eio(tramo(q, 0.15, 0.32)), lleva = E.eio(tramo(q, 0.28, 0.72)), baja = E.eo(tramo(q, 0.68, 0.9));
      out.set(mezcla(gx, p.x, lleva), mezcla(gy, Y_VIAJE, sube) - (Y_VIAJE - Y0) * baja, mezcla(gz, p.z, lleva)); out.r = mezcla(p.rot, 0, lleva) + 0.05 * Math.sin(q * 9) * (1 - q); out.donde = 'aire';
      return out;
    }
    const pA = V(), pB = V(), gch = V();
    // la casa de madera: muros [x, z, largo, ancho, retraso] y cubiertas [.., alto]
    const CASA = [[-60, -20, 140, 3, 0.0], [-60, 22, 140, 3, 0.15], [-128, 1, 3, 42, 0.3], [8, 1, 3, 42, 0.45], [-60, 1, 140, 0.8, 0.9, 32], [64, -10, 44, 3, 0.55], [64, 22, 44, 3, 0.65], [85, 6, 3, 32, 0.75], [64, 6, 46, 0.8, 1.0, 30], [40, 6, 3, 32, 0.7]];

    const LLAVES = [
      [0, 0, 10, 20, 540, 0.46, 0.64],                                                     // el plano de situación, el mismo del final
      [0.7, 0, 10, 20, 520, 0.5, 0.62], [4.5, 0, 10, 20, 470, 0.42, 0.56], [9.5, -10, 10, 10, 430, 0.22, 0.5], [15.4, 10, 10, 0, 420, -0.1, 0.48],
      [16.6, UN.x, UN.y, UN.z, 20, 0.35, 0.66], [18.6, UN.x, UN.y, UN.z, 17, 0.6, 0.46],                     // la unión, desde arriba: placa y cuatro pernos
      [20.0, 0, 30, 0, 420, 0.6, 0.42], [22.4, 0, 30, 0, 400, 0.85, 0.4],
      [24, 0, 10, 20, 540, 0.46, 0.64],
    ];
    function actualizar(t, aspecto) {
      const k = Math.pow(Math.max(1, 1.45 / aspecto), 0.85), d = encuadre(c, LLAVES, t, k);
      // la explanada y los pinos
      mq.pon(I.suelo, 0, -0.5, 30, 340, 0.4, 170);
      for (let q = 0; q < PINOS.length; q++) { const [x, z, h, r] = PINOS[q], sw = 0.03 * Math.sin(t * 0.8 + q); mq.pon(I.pino + q, x, 0, z, 2.6, h, 2.6, 0, 0, sw); copas.pon(q, x + h * Math.sin(sw) * -1, h, z, r, r * 0.38, r); }
      // los muretes sobre riostra (trazado ilustrativo)
      for (let q = 0; q < MURETES.length; q++) { const [x0, x1, z0, z1] = MURETES[q]; mq.pon(I.murete + q, X0 + (x0 + x1) * 5, 0, Z0 + (z0 + z1) * 5, (x1 - x0) * 10, Y0, (z1 - z0) * 10); }
      // las góndolas (llegan al principio)
      const llega = E.eo(tramo(t, 0.2, 1.6)), dx = -260 * (1 - llega);
      for (let g = 0; g < 2; g++) { const x = GX[g]; mq.pon(I.gondola + g * 3, x + 50 + dx, 0, GZ, 18, 22, 24); mq.pon(I.gondola + g * 3 + 1, x + dx, 3, GZ, 90, BED - 3, 24); mq.pon(I.gondola + g * 3 + 2, x + 50 + dx + 9.3, 12, GZ, 0.6, 7, 20); for (let q = 0; q < 6; q++) ruedas.pon(g * 6 + q, x + dx - 30 + (q % 3) * 22 + (q % 3 === 2 ? 30 : 0), 3, GZ + (q < 3 ? 11 : -11), 6, 6, 3, 0, 0, -dx * 0.2); }
      // las placas: en la góndola, en el aire o en su sitio (con su marca encima)
      let enAire = 0, ult = 0;
      for (const p of PLACAS) {
        placaEn(p.n, t, pA); if (pA.donde === 'camion') pA.x += dx;
        mq.pon(I.placa + p.n - 1, pA.x, pA.y, pA.z, p.lx, CANTO, p.lz, pA.r);
        if (pA.donde === 'aire') enAire = p.n; if (pA.donde === 'puesta') ult = p.n;
        // la marca, siempre derecha para la cámara (todos los planos miran desde delante)
        etq.pon(p.n - 1, p.n - 1, pA.x, pA.y + CANTO + 0.15, pA.z, 4.2, 0, -Math.PI / 2);
        const tl = fase(p.n)[0] + 0.9 * CICLO, lee = Math.sin(Math.PI * tramo(t, tl, tl + 0.6));
        etq.color(p.n - 1, cMix.lerpColors(cTinta, cMenta, lee));
      }
      // el gancho: sobre la placa que vuela; si no, baja a la pila de la siguiente o vuelve de la última
      const n = enAire;
      if (n) { placaEn(n, t, pB); gch.set(pB.x, pB.y + CANTO + 18, pB.z); }
      else {
        let cur = 0; for (const p of PLACAS) if (t >= fase(p.n)[0]) cur = p.n;
        if (!cur || t >= fase(11)[1]) gch.set(GRUA.x - 40, 70, GRUA.z - 40);
        else {
          placaEn(cur, t, pB); const [gx, gy, gz] = enGondola(cur);
          if (pB.q < 0.5) { const prev = cur > 1 ? PLACAS[cur - 2] : null; salto(gch, tA.set(prev ? prev.x : GRUA.x - 40, prev ? Y0 + CANTO + 18 : 70, prev ? prev.z : GRUA.z - 40), tB.set(gx + dx, gy + CANTO + 18, gz), E.eio(tramo(pB.q, 0, 0.18)), 22); }
          else { const p = PLACAS[cur - 1]; gch.set(p.x, Y0 + CANTO + 18 + 30 * E.ei(tramo(pB.q, 0.9, 1)), p.z); }
        }
      }
      // la autogrúa: chasis, cabina, pluma hacia el gancho; el útil de 6 m a lo largo de la placa y sus seis puntos
      mq.pon(I.grua, GRUA.x, 2, GRUA.z, 70, 12, 26); mq.pon(I.grua + 1, GRUA.x + 26, 14, GRUA.z + 8, 14, 10, 8);
      tA.set(GRUA.x - 10, 22, GRUA.z); tB.copy(gch).sub(tA); tB.y += 40; const lb = tB.length();
      mq.pon(I.grua + 2, tA.x, tA.y, tA.z, 5, lb, 5, Math.atan2(tB.x, tB.z), Math.acos(Math.min(1, tB.y / lb)));
      mq.pon(I.grua + 3, gch.x, gch.y, gch.z, 3, 3, 3);
      const pv = n ? PLACAS[n - 1] : null, rU = n ? pB.r + (pv.lx < pv.lz ? Math.PI / 2 : 0) : 0, ux = Math.cos(rU), uz = -Math.sin(rU);
      mq.pon(I.util, gch.x, gch.y - 7.8, gch.z, 60, 1.6, 1.6, rU);
      cuerdas.empezar();
      tip.copy(tA).add(tB); hilo.tender(tip, tC.copy(gch).setY(gch.y + 1.5), 0, 0);
      cuerdas.linea(gch, tC.set(gch.x + ux * 28, gch.y - 6.4, gch.z + uz * 28)); cuerdas.linea(gch, tC.set(gch.x - ux * 28, gch.y - 6.4, gch.z - uz * 28));
      if (n) {                                                                                    // seis puntos: cuartos del largo y tercios del ancho
        const la = Math.max(pv.lx, pv.lz), an = Math.min(pv.lx, pv.lz), vx = -uz, vz = ux;
        for (let i = 1; i <= 3; i++) for (let j = 1; j <= 2; j++) {
          const a = (i / 4 - 0.5) * la, b = (j / 3 - 0.5) * an;
          cuerdas.linea(tC.set(gch.x + ux * (i / 4 - 0.5) * 56, gch.y - 7.8, gch.z + uz * (i / 4 - 0.5) * 56), tD.set(pB.x + ux * a + vx * b, pB.y + CANTO, pB.z + uz * a + vz * b));
        }
      }
      cuerdas.fin();
      // la unión: placa de 400 × 400 mm y cuatro pernos M24 que aprietan (atornillada, con los pernos soldados debajo, sobre el murete)
      const qu = tramo(t, 16.4, 17.0), vu = t > 16.2 && t < 23;
      if (vu) { mq.pon(I.union, UN.x, UN.y + 4 * (1 - E.eo(qu)), UN.z, 4, 0.12, 4); for (let q = 0; q < 4; q++) { const b0 = 17.0 + q * 0.28, r = tramo(t, b0, b0 + 0.5); mq.pon(I.perno + q, UN.x + (q % 2 ? 1 : -1), UN.y + 0.12 + 1.6 * (1 - E.eio(r)), UN.z + (q < 2 ? -1 : 1), 0.42, 0.3, 0.42, -Math.PI * 6 * E.eio(r)); } }
      else { mq.nada(I.union); for (let q = 0; q < 4; q++) mq.nada(I.perno + q); }
      // la casa de madera sobre su forjado: muros que suben uno tras otro, la cubierta y los huecos
      for (let q = 0; q < CASA.length; q++) {
        const [x, z, sx, sz, dl, yTecho] = CASA[q];
        const qq = E.vivo(tramo(t, 19.2 + dl * 2, 19.9 + dl * 2)) * (1 - tramo(t, 23.4, 23.9)) * (t < 19.2 ? 0 : 1);
        if (qq <= 0.001) { mq.nada(I.casa + q); continue; }
        if (yTecho) mq.pon(I.casa + q, x, Y0 + CANTO + yTecho + 8 * (1 - Math.min(1, qq)), z, sx + 6, 2, sz * 52 + 8, 0); else mq.pon(I.casa + q, x, Y0 + CANTO, z, sx, 30 * qq, sz);
      }
      for (let q = 0; q < 6; q++) { const qq = E.vivo(tramo(t, 21.0 + q * 0.1, 21.6 + q * 0.1)) * (1 - tramo(t, 23.4, 23.9)); if (qq <= 0.01) { mq.nada(I.ventana + q); continue; } mq.pon(I.ventana + q, -110 + q * 26 + (q > 4 ? 60 : 0), Y0 + CANTO + 6, 23.6, 14 * qq, 18 * qq, 0.8); }
      // el punto: lee cada placa al posarse (salta de una a otra) y, al final, entra en la casa
      let px, py, pz, br = 1;
      const nl = Math.max(0, Math.min(11, Math.floor((t - T_I - 0.9 * CICLO) / CICLO) + 1)); void ult;
      if (t < 1.4) { br = E.eo(tramo(t, 0.6, 1.4)); px = 0; py = 30; pz = 50; }
      else if (nl === 0) { px = 0; py = 30 + 2 * Math.sin(t * 2); pz = 50; }
      else {
        const p = PLACAS[nl - 1], t0 = fase(nl)[0] + 0.9 * CICLO, q = tramo(t, t0, t0 + 0.35), prev = nl > 1 ? PLACAS[nl - 2] : null;
        salto(tA, tB.set(prev ? prev.x : 0, prev ? Y0 + CANTO + 2 : 30, prev ? prev.z : 50), tC.set(p.x, Y0 + CANTO + 2, p.z), E.eio(q), 12);
        px = tA.x; py = tA.y; pz = tA.z;
        if (t > 15.6 && t < 19.2) { salto(tA, tC.set(PLACAS[10].x, Y0 + CANTO + 2, PLACAS[10].z), tD.set(UN.x + 2.4, UN.y + 1.2, UN.z + 1.6), E.eio(tramo(t, 15.6, 16.4)), 22); px = tA.x; py = tA.y; pz = tA.z; }
        if (t >= 19.2) { salto(tA, tD.set(UN.x + 2.4, UN.y + 1.2, UN.z + 1.6), tE.set(-40, Y0 + CANTO + 2, 0), E.eio(tramo(t, 19.2, 20.4)), 30); px = tA.x; py = tA.y; pz = tA.z; }
      }
      const enMacro = E.seno(tramo(t, 15.8, 16.6)) * (1 - E.seno(tramo(t, 18.8, 19.6)));
      br += 0.6 * Math.sin(Math.PI * tramo(t, 18.2, 18.9));
      P.poner(px, py, pz, mezcla(2.6, 0.5, enMacro), br * (t > 23 ? 1 - tramo(t, 23, 23.5) : 1)); if (P.luz) { P.luz.intensity *= 0.4; P.luz.distance = mezcla(70, 12, enMacro); }
      // la lectura de cada placa y la de la unión
      const tl = nl ? fase(nl)[0] + 0.9 * CICLO + 0.3 : -1, qa = tramo(t, tl, tl + 0.6), qb = tramo(t, 18.2, 18.9);
      aro.visible = (qa > 0 && qa < 1 && t < 15.8) || (qb > 0 && qb < 1);
      if (qb > 0 && qb < 1) { aro.position.set(UN.x, UN.y + 0.3, UN.z); aro.scale.setScalar(1 + 5 * E.eo(qb)); aro.material.opacity = 0.9 * (1 - qb); }
      else if (aro.visible) { const p = PLACAS[nl - 1]; aro.position.set(p.x, Y0 + CANTO + 0.3, p.z); aro.scale.setScalar(4 + 22 * E.eo(qa)); aro.material.opacity = 0.9 * (1 - qa); }
      velo(t, D);
      mq.fin(); copas.fin(); ruedas.fin(); etq.fin();
      return d;
    }
    const tip = V();
    const c = { escena, camara, plato: pl, D, aRef: 1.45, actualizar };
    return c;
  }

  // ═════════════════════════════════════════════════════════════════════
  //  3. Madrid: entre medianeras, la luz del patio (20 s); su clave interna sigue siendo «navalcarnero»
  // ═════════════════════════════════════════════════════════════════════
  function portadaNavalcarnero() {
    const D = 20, escena = new T3.Scene(), camara = new T3.PerspectiveCamera(32, 0.82, 1, 8000), pl = plato(escena);
    const PN = PLANTAS.navalcarnero || { w: 12.16, h: 7.29 };
    const ANCHO = PN.h * 10, FONDO = PN.w * 10, X = ANCHO / 2, Z = FONDO / 2;               // el solar: estrecho y profundo
    const NIV = (DATOS.OBRAS?.find((o) => o.k === 'navalcarnero')?.cifras?.find((c) => c[1] === 'niveles')?.[0] | 0) || 4;
    const HP = 31, GR = 2.6;                                                                     // planta y canto (ilustrativos)
    const PZ0 = -18, PZ1 = 18, GX = -X + 14;                                                     // el patio, de medianera a galería: corta la casa en dos
    const mq = maqueta(escena, 90), vid = maqueta(escena, 40, geoBloque, new T3.MeshPhysicalMaterial({ color: 0x2a3b62, roughness: 0.05, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.5, depthWrite: false }));
    const copas = maqueta(escena, 2, geoBola, esmalte(0xffffff, { roughness: 0.6, clearcoat: 0.2 }));
    const haz = new T3.Mesh(geoBloque, new T3.MeshBasicMaterial({ color: 0xfff3dc, transparent: true, opacity: 0, depthWrite: false })); haz.renderOrder = 4; escena.add(haz);
    const cuerdas = jarcia(escena, 16), aro = aroDe(escena), P = puntoDe(escena), velo = veloDe(escena, camara);
    vid.m.castShadow = false; vid.m.renderOrder = 2;
    const I = { medL: 0, medR: 1, vecL: 2, vecR: 3, calle: 4, acera: 5, tronco: 6, pieza: 8 };
    [I.medL, I.medR].forEach((k) => mq.color(k, 0xcdd3db)); [I.vecL, I.vecR].forEach((k) => mq.color(k, 0xdde2e8));
    mq.color(I.calle, 0xd9dee5); mq.color(I.acera, 0xe8ebf0); mq.color(I.tronco, 0x8f7f6d);
    // las piezas de cada planta: dos losas (delante y detrás del patio), la galería que las une y las fachadas;
    // el vidrio (fachadas y caras del patio) va aparte, translúcido
    const PZ = [], PV = [];
    for (let n = 0; n < NIV; n++) {
      const y = n * HP, t0 = 1.2 + n * 2.2, alto = HP - GR;
      PZ.push({ t: t0, x: 0, y, z: (PZ1 + Z) / 2, sx: ANCHO, sy: GR, sz: Z - PZ1 });
      PZ.push({ t: t0 + 0.22, x: 0, y, z: (-Z + PZ0) / 2, sx: ANCHO, sy: GR, sz: PZ0 + Z });
      PZ.push({ t: t0 + 0.44, x: (-X + GX) / 2, y, z: 0, sx: GX + X, sy: GR, sz: PZ1 - PZ0 });
      for (const [zf, s] of [[Z - 1.2, 1], [-Z + 1.2, -1]]) {
        const t1 = t0 + (s > 0 ? 0.7 : 0.95), hueco = n === 0 ? 0.82 : n === NIV - 1 ? 0.5 : 0.66, ma = n % 2 ? 10 : 16;
        PZ.push({ t: t1, x: -X + ma / 2, y: y + GR, z: zf, sx: ma, sy: alto, sz: 2.4 });
        PZ.push({ t: t1 + 0.05, x: X - 4, y: y + GR, z: zf, sx: 8, sy: alto, sz: 2.4 });
        PZ.push({ t: t1 + 0.1, x: (ma - 8) / 2, y: y + GR + alto * hueco, z: zf, sx: ANCHO - ma - 8, sy: alto * (1 - hueco), sz: 2.4 });
        PV.push({ t: t1 + 0.15, x: (ma - 8) / 2, y: y + GR, z: zf - s * 0.4, sx: ANCHO - ma - 8, sy: alto * hueco, sz: 0.8 });
      }
      // las caras del patio, de vidrio: la de la losa delantera, la de la trasera y la de la galería
      PV.push({ t: t0 + 1.3, x: (GX + X) / 2, y: y + GR, z: PZ1 - 0.6, sx: X - GX, sy: alto, sz: 0.8 });
      PV.push({ t: t0 + 1.4, x: (GX + X) / 2, y: y + GR, z: PZ0 + 0.6, sx: X - GX, sy: alto, sz: 0.8 });
      PV.push({ t: t0 + 1.5, x: GX - 0.6, y: y + GR, z: 0, sx: 0.8, sy: alto, sz: PZ1 - PZ0 });
    }
    const YC = NIV * HP, TC = 1.2 + NIV * 2.2;
    PZ.push({ t: TC, x: 0, y: YC, z: (PZ1 + Z) / 2, sx: ANCHO, sy: GR, sz: Z - PZ1 });
    PZ.push({ t: TC + 0.22, x: 0, y: YC, z: (-Z + PZ0) / 2, sx: ANCHO, sy: GR, sz: PZ0 + Z });
    PZ.push({ t: TC + 0.44, x: (-X + GX) / 2, y: YC, z: 0, sx: GX + X, sy: GR, sz: PZ1 - PZ0 });
    for (const [zf] of [[Z - 1.2], [-Z + 1.2]]) PZ.push({ t: TC + 0.6, x: 0, y: YC + GR, z: zf, sx: ANCHO, sy: 9, sz: 2.4 });   // los petos de la cubierta
    PZ.forEach((p, k) => mq.color(I.pieza + k, 0xffffff));
    const T_FIN = TC + 0.9;
    //  [t, x, y, z, distancia, lado, elevación]
    const LLAVES = [
      [0, 0, 40, 0, 390, 0.04, 0.86],                                                      // el solar entre medianeras; se entra con un fundido
      [0.7, 0, 40, 0, 380, 0.06, 0.86], [6, 0, 55, 0, 380, 0.16, 0.74], [11.6, 0, 65, 0, 380, -0.2, 0.66],
      [12.6, 0, 50, -4, 400, 0.24, 1.12], [15.0, 0, 50, -4, 380, -0.12, 1.16],                                             // desde arriba: el patio, al sol
      [16.0, -X, 60, 0, 230, -1.5, 0.12], [18.2, -X, 60, 0, 220, -1.42, 0.16],                                         // en sección: la luz llega al fondo
      [20, 0, 60, 0, 380, -0.4, 0.66],                                                     // la casa terminada; se sale con un fundido
    ];
    // cada pieza baja de su cuerda, se posa con su peso y la cuerda sube
    function colocar(lista, maq, base, t, fuera) {
      for (let q = 0; q < lista.length; q++) {
        const p = lista[q];
        if (t < p.t - 0.7 || fuera) { maq.nada(base + q); continue; }
        const qq = tramo(t, p.t - 0.7, p.t), baja = E.eo(qq), y = p.y + 170 * (1 - baja), sw = 2 * Math.sin(qq * 9) * (1 - qq);
        const sq = t >= p.t ? 1 - 0.05 * amort((t - p.t) * 3, 9, 2.4) : 1;
        maq.pon(base + q, p.x + sw, y, p.z, p.sx, p.sy * sq, p.sz);
        if (maq === mq && t < p.t + 0.3) { const sube = E.ei(tramo(t, p.t, p.t + 0.3)); tA.set(p.x + sw, y + p.sy + 12 + 200 * sube, p.z); cuerdas.linea(tA, tB.set(p.x + sw, 900, p.z)); if (sube < 0.05) { cuerdas.linea(tA, tC.set(p.x + sw - p.sx * 0.3, y + p.sy, p.z)); cuerdas.linea(tA, tC.set(p.x + sw + p.sx * 0.3, y + p.sy, p.z)); } }
      }
    }
    const cerca = V(), dirSol = V();
    function actualizar(t, aspecto) {
      const k = Math.pow(Math.max(1, 0.82 / aspecto), 0.85), d = encuadre(c, LLAVES, t, k);
      const fuera = t > D - 0.06;                                                      // todo se recoge ya tapado por el fundido
      // las medianeras, de vecinos más altos y más bajos; la de la galería se corta para la sección
      const corte = E.seno(tramo(t, 15.0, 16.0)) * (1 - E.seno(tramo(t, 18.4, 19.2)));
      // los vecinos, más bajos que la casa: sus medianeras quedan a la vista, ciegas
      mq.pon(I.medR, X + 1.5, 0, -6, 3, 96, FONDO + 40); mq.pon(I.vecR, X + 60, 0, -6, 114, 92, FONDO + 40);
      mq.pon(I.medL, -X - 1.5, 0, -6, 3, mezcla(66, 4, corte), FONDO + 40); mq.pon(I.vecL, -X - 60, 0, -6, 114, mezcla(62, 3, corte), FONDO + 40);
      mq.pon(I.calle, 0, -0.5, Z + 46, ANCHO + 300, 0.4, 60); mq.pon(I.acera, 0, 0, Z + 9, ANCHO + 300, 0.9, 18);
      // planta a planta: cada pieza baja de su cuerda, se posa con su peso y la cuerda sube
      cuerdas.empezar();
      colocar(PZ, mq, I.pieza, t, fuera); colocar(PV, vid, 0, t, fuera);
      cuerdas.fin();
      // el árbol del patio
      const qa = E.vivo(tramo(t, 2.6, 3.4)) * (fuera ? 0 : 1), ax = (GX + X) / 2;
      if (qa > 0.01) { mq.pon(I.tronco, ax, GR, 0, 1.4, 40 * qa, 1.4); copas.color(0, 0xb3c3ad); copas.pon(0, ax, GR + 40 * qa, 0, 12 * qa, 10 * qa, 12 * qa); }
      else { mq.nada(I.tronco); copas.nada(0); }
      // el sol: barre sobre el patio; su luz baja por el hueco hasta la planta baja (un haz cálido, apenas visible)
      const sol = tramo(t, 11.8, 18.6), az = mezcla(-0.75, 0.75, E.eio(sol)), elv = mezcla(1.15, 1.42, Math.sin(Math.PI * sol));
      dirSol.set(Math.sin(az) * Math.cos(elv), Math.sin(elv), 0.3 * Math.cos(elv)).normalize();
      if (sol > 0 && sol < 1) { cerca.set(ax, 0, 0); c.plato.clave.position.copy(cerca).addScaledVector(dirSol, 700); c.plato.clave.target.position.copy(cerca); c.plato.clave.angle = 0.3; c.plato.clave.intensity = 3.4; }
      else { c.plato.clave.angle = 0.5; c.plato.clave.intensity = 2.6; }
      const kh = Math.sin(Math.PI * sol) * (fuera ? 0 : 1);
      haz.material.opacity = 0.32 * kh;
      haz.position.set(ax + dirSol.x / dirSol.y * YC * 0.5, GR, dirSol.z / dirSol.y * YC * 0.5); haz.scale.set(X - GX - 2, YC, PZ1 - PZ0 - 2); haz.rotation.set(-Math.atan(dirSol.z / dirSol.y) * 0.5, 0, Math.atan(dirSol.x / dirSol.y) * 0.5);
      haz.visible = kh > 0.01;
      // el punto: lee cada planta al completarse; con el sol, baja por el patio hasta la planta baja
      let px = 0, pz = Z - 14, py, br = 1;
      const nivel = Math.max(0, Math.min(NIV, Math.floor((t - 2.5) / 2.2) + 1));
      if (t < 1.0) { br = E.eo(tramo(t, 0.2, 1.0)); py = mezcla(260, 60, E.eio(tramo(t, 0, 1.0))); }
      else if (t < 11.8) py = (nivel ? nivel * HP : 0) + GR + 3 + 1.5 * Math.sin(t * 2);
      else { const qb = E.eio(tramo(t, 12.2, 17.6)), qx = E.eio(tramo(t, 11.8, 12.6)); px = mezcla(0, ax, qx); pz = mezcla(Z - 14, 0, qx); py = mezcla(YC + 26, GR + 3, qb); br = 1 + 0.4 * Math.sin(t * 3); }
      br += 0.5 * Math.sin(Math.PI * tramo(modp(t - 2.5, 2.2), 0, 0.5)) * (t > 2.5 && t < 11.8 ? 1 : 0);
      P.poner(px, py, pz, 2.2, br * (t > 19 ? 1 - tramo(t, 19, 19.5) : 1)); if (P.luz) { P.luz.intensity *= 0.4; P.luz.distance = 70; }
      // la lectura de cada planta
      const ql = tramo(modp(t - 2.5, 2.2), 0, 0.7);
      aro.visible = t > 2.5 && t < 11.8 && ql < 1;
      if (aro.visible) { aro.position.set(0, nivel * HP + GR + 0.3, Z - 14); aro.scale.setScalar(4 + 18 * E.eo(ql)); aro.material.opacity = 0.85 * (1 - ql); }
      void T_FIN;
      velo(t, D);
      mq.fin(); vid.fin(); copas.fin();
      return d;
    }
    const c = { escena, camara, plato: pl, D, aRef: 0.82, actualizar };
    return c;
  }

  // ── las portadas, cada una en el hueco de su tarjeta ──
  const FAB = { piedrahita: portadaPiedrahita, llar: portadaLlar, navalcarnero: portadaNavalcarnero };
  const PORTADAS = [];
  for (const k of Object.keys(FAB)) {
    try { const c = FAB[k](); c.k = k; c.rect = { left: 0, top: 0, width: 0, height: 0, bottom: 0 }; c.vis = false; PORTADAS.push(c); }
    catch (e) { console.error('portada', k, e); }
  }
  let W = 1, H = 1;
  const desfase = { piedrahita: 0, llar: 5.3, navalcarnero: 11.1 };
  function actualizar(u, reloj, dt, calentando) {
    for (const c of PORTADAS) {
      const panel = ctx.raiz.querySelector(`[data-obra="${c.k}"]`), medio = panel?.querySelector('[data-medio]');
      if (!medio) { c.vis = false; continue; }
      const r = medio.getBoundingClientRect();
      c.vis = calentando || (medio.dataset.modo === 'anim' && r.width > 8 && r.height > 8 && r.right > 0 && r.left < W && r.bottom > 0 && r.top < H);
      if (!c.vis) continue;
      c.rect.left = r.left; c.rect.top = r.top; c.rect.width = r.width || 400; c.rect.height = r.height || 300; c.rect.bottom = r.bottom || 300;
      const asp = c.rect.width / c.rect.height;
      c.camara.aspect = asp; c.camara.updateProjectionMatrix();
      c.actualizar(modp(reloj + desfase[c.k], c.D), asp);
    }
  }
  function dibujar(renderer) {
    renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H); renderer.setClearColor(0xffffff, 1); renderer.clear();
    renderer.autoClear = false; renderer.setScissorTest(true);
    for (const c of PORTADAS) {
      if (!c.vis) continue;
      const r = c.rect, x = r.left, y = H - r.bottom, w = r.width, h = r.height;
      renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h);
      renderer.setClearColor(FONDO_PORTADA, 1); renderer.clear();
      renderer.render(c.escena, c.camara);
    }
  }
  return {
    escenas: PORTADAS.map((c) => [c.escena, c.camara]),
    fondo: 0xffffff,
    medir(w, h) { W = w; H = h; },
    actualizar, dibujar,
  };
});

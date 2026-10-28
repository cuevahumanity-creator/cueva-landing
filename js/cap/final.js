// ─────────────────────────────────────────────────────────────────────
//  Capítulo «final»: un punto, todo lo demás. Toda la página en un solo aliento, como el último plano.
//  1. Oscuridad y mucho espacio negro, en lo alto. El punto ámbar se forma despacio, sereno, con su luz
//     real, su reflejo en el suelo y una respiración lenta. Al final de la frase cae sobre la malla.
//  2. Y la rompe: desde el punto de impacto corren grietas que brillan en ámbar y cian, los paneles del
//     suelo se parten (más pequeños cerca del golpe) y caen al vacío girando, con un poco de polvo.
//     El punto atraviesa el hueco y cae; la cámara cae con él, entre una lluvia de piezas J con sus
//     estelas cian, cerca y lejos, hasta aterrizar en la plaza del barrio que se está formando abajo.
//  3. Llueven piezas. Las grúas bajan las piezas J, que
//     encajan y levantan casas, un barrio entero que crece desde el punto. Alrededor, más lejos, la lluvia:
//     cientos de piezas caen del cielo con su estela cian y se apilan en manzanas, la ciudad. La cámara sube
//     por encima de la lluvia y baja a través de ella. Las calles se pavimentan
//     con losetas iPath y, en cada casa, un lector parpadea y se enlaza con sus vecinos (neuronas).
//  3. La cámara sube y sube (potencias de diez) hasta que el barrio es un punto de luz en Madrid y el
//     suelo es la losa de España: Madrid y Menorca activas, Barcelona en implantación, el resto aros
//     libres, y los hilos que los unen. Ahí aterriza «Todo lo demás».
//  4. Todo se inhala: el mapa se encoge en espiral hacia el punto, que destella. De él nace el logo:
//     el anillo blanco se abre girando y las cuatro piezas (hexágono cian, rectángulo y cuadrado
//     blancos, rectángulo ion) vuelan a su sitio, con conectores, lecturas y el punto menta.
//  5. El logo flota, da una vuelta de moneda y se asienta, con su reflejo en el suelo y un charco
//     de luz. Abajo queda sitio para los botones.
//  Todo es función de u (y del reloj para lo que respira). Escala real: 1 unidad, 1 metro.
// ─────────────────────────────────────────────────────────────────────
CUEVA.capitulo('final', (ctx) => {
  const { T3, E, mezcla, tramo, COL, esmalte, brilloPropio, estudio, punto, mirar, distancia, DATOS } = ctx;
  const escena = new T3.Scene(), camara = new T3.PerspectiveCamera(28, 1, 1, 1e7);
  const plato = estudio(escena, { tema: ctx.tema, suelo: false });
  let hemi = null; escena.traverse((o) => { if (o.isHemisphereLight) hemi = o; });
  const TAU = Math.PI * 2, EJEY = new T3.Vector3(0, 1, 0);
  const aleatorio = (() => { let a = 20261027; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

  // ── utilidades ──
  const lienzoTx = (w, h, pinta) => { const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; };
  const radial = lienzoTx(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.45)'); g.addColorStop(0.6, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const vertical = lienzoTx(4, 128, (x) => { const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,.18)'); g.addColorStop(0.9, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = g; x.fillRect(0, 0, 4, 128); });
  // lo que suma luz no lleva niebla: la niebla lo pintaría de su color y, sumado, se vería como un fantasma gris
  const aditivo = (o = {}) => new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false, ...o });
  function aroGeo(r0, n, lleno, seg) {
    const pos = [], idx = [];
    for (let k = 0; k < n; k++) {
      const a0 = k / n * TAU, a1 = a0 + lleno / n * TAU, b = pos.length / 3;
      for (let s = 0; s <= seg; s++) { const a = mezcla(a0, a1, s / seg); pos.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a), 0, Math.sin(a)); }
      for (let s = 0; s < seg; s++) { const i = b + s * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
    }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }
  const instancias = (padre, geo, mat, n, hex = 0) => { const m = new T3.InstancedMesh(geo, mat, n); m.frustumCulled = false; for (let i = 0; i < n; i++) m.setColorAt(i, new T3.Color(hex)); padre.add(m); return m; };
  const m4 = new T3.Matrix4(), q4 = new T3.Quaternion(), v1 = new T3.Vector3(), v2 = new T3.Vector3(), v3 = new T3.Vector3(), e3 = new T3.Vector3(), c3 = new T3.Color();
  const poner = (m, i, x, y, z, sx, sy, sz, ry = 0) => { q4.setFromAxisAngle(EJEY, ry); m.setMatrixAt(i, m4.compose(v1.set(x, y, z), q4, e3.set(sx, sy, sz))); };
  const color = (m, i, hex, a) => m.setColorAt(i, c3.setHex(hex).multiplyScalar(Math.max(0, a)));
  const listo = (...ms) => { for (const m of ms) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } };
  // una caja de 1 × 1 × 1 con los cantos achaflanados, apoyada en y = 0: la pieza J de todas las casas
  const cajaJ = (() => { const s = new T3.Shape([new T3.Vector2(-0.5, -0.5), new T3.Vector2(0.5, -0.5), new T3.Vector2(0.5, 0.5), new T3.Vector2(-0.5, 0.5)]);
    const g = new T3.ExtrudeGeometry(s, { depth: 0.84, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelOffset: -0.06, bevelSegments: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, 0.08, 0); return g; })();

  // ── el mundo: lo que se inhala al final (la losa de España a escala real, y el barrio en Madrid) ──
  const mundo = new T3.Group(); escena.add(mundo);
  // la proyección de la red (la de red.js), con Madrid en el origen; se construye en las unidades de red.js y se escala
  const S = 100, LAT0 = 40.42, LON0 = -3.70, KX = Math.cos(40 * Math.PI / 180), F = 1110;     // F: metros por unidad del mapa
  const CAN = { lon: -15.79, lat: 28.465, alon: -8.45, alat: 34.75 }; CAN.kx = Math.cos(CAN.lat * Math.PI / 180);
  function proy(lon, lat, v = new T3.Vector3()) {
    if (lat < 31) return v.set(((lon - CAN.lon) * CAN.kx + (CAN.alon - LON0) * KX) * S, 0, -((lat - CAN.lat) + CAN.alat - LAT0) * S);
    return v.set((lon - LON0) * KX * S, 0, -(lat - LAT0) * S);
  }
  const BT = 1.3, DL = 15, ALTO = DL + 2 * BT;
  const formas = [], costa = [], cajaMapa = new T3.Box3(), cajaCan = new T3.Box2();
  for (const pol of window.CONTORNO || []) {
    const pts = [];
    for (const [lon, lat] of pol) { const v = proy(lon, lat), q = new T3.Vector2(v.x, -v.z); if (!pts.length || q.distanceTo(pts[pts.length - 1]) > 0.05) pts.push(q); }
    if (pts.length > 2 && pts[0].distanceTo(pts[pts.length - 1]) < 0.05) pts.pop();
    if (pts.length < 3) continue;
    formas.push(new T3.Shape(pts));
    if (pol[0][1] < 31) cajaCan.union(new T3.Box2().setFromPoints(pts));
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; costa.push(a.x, -BT + 0.3, -a.y, b.x, -BT + 0.3, -b.y); }
    for (const q of pts) cajaMapa.expandByPoint(new T3.Vector3(q.x, 0, -q.y));
  }
  if (!cajaCan.isEmpty()) { const m = 26, x0 = cajaCan.min.x - m, x1 = cajaCan.max.x + m, n0 = cajaCan.min.y - m, n1 = cajaCan.max.y + m; costa.push(x0, -ALTO, -n1, x1, -ALTO, -n1, x1, -ALTO, -n1, x1, -ALTO, -n0); }
  const mapa = new T3.Group(); mapa.scale.setScalar(F); mundo.add(mapa);
  const geoLosa = new T3.ExtrudeGeometry(formas, { depth: DL, bevelEnabled: true, bevelThickness: BT, bevelSize: 1.2, bevelOffset: -1.2, bevelSegments: 2, curveSegments: 1 });
  geoLosa.rotateX(-Math.PI / 2); geoLosa.translate(0, BT - ALTO, 0); normalesSuaves(geoLosa, 50);   // la cara de arriba, en y = 0: el suelo del barrio
  // con su propio envMap: si lo toma de la escena, three ignora su envMapIntensity y la losa negra refleja el plató entero
  const matLosa = esmalte(0x070a10, { roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.3, envMap: ctx.entorno, envMapIntensity: 0.002 });
  // la trama a todas las escalas (75 m, 750 m, 7,5 km, 75 km): al subir la cámara, cada potencia de diez se enciende a su paso
  const UG = { uTramaG: { value: 0 } };
  matLosa.onBeforeCompile = (sh) => {
    sh.uniforms.uTramaG = UG.uTramaG;
    sh.vertexShader = 'varying vec3 vObj;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    sh.fragmentShader = `varying vec3 vObj; uniform float uTramaG;
      float trama(vec2 p, float paso) { vec2 q = p / paso, fw = max(fwidth(q), vec2(1e-6)); vec2 g = abs(fract(q - 0.5) - 0.5) / fw; return (1.0 - min(min(g.x, g.y), 1.0)) * clamp(1.5 - max(fw.x, fw.y) * 6.0, 0.0, 1.0); }
      ` + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        float cara = smoothstep(-0.7, -0.05, vObj.y);
        vec2 p = vObj.xz * ${F.toFixed(1)};
        float l = trama(p, 75.0) * 0.7 + trama(p, 750.0) * 0.85 + trama(p, 7500.0) + trama(p, 75000.0);
        totalEmissiveRadiance += vec3(0.20, 0.31, 0.46) * l * uTramaG * cara;
      }`);
  };
  const losa = new T3.Mesh(geoLosa, matLosa); losa.receiveShadow = true; mapa.add(losa);
  const canto = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.Float32BufferAttribute(costa, 3)), new T3.LineBasicMaterial({ color: COL.cuerda, transparent: true, opacity: 0 }));
  mapa.add(canto);
  const cMapa = cajaMapa.getCenter(new T3.Vector3()).multiplyScalar(F).setY(0), tMapa = cajaMapa.getSize(new T3.Vector3()).multiplyScalar(F);

  // los nodos de la red (DATOS.RED), en unidades del mapa: aparecen cuando la cámara ya ve España entera
  const N = DATOS.RED.map((n) => ({ ...n, p: proy(n.lon, n.lat) }));
  const MAD = N.find((n) => n.k === 'madrid'), MEN = N.find((n) => n.k === 'menorca'), BCN = N.find((n) => n.k === 'barcelona');
  const LIBRES = N.filter((n) => n.est !== 'activo'), ACTIVOS = [MAD, MEN];
  LIBRES.forEach((n, j) => { n.j = j; n.nace = 0.468 + 0.03 * n.p.length() / 700; });
  const anillos = instancias(mapa, aroGeo(0.84, 14, 0.56, 3), aditivo(), LIBRES.length);
  const ondasM = instancias(mapa, aroGeo(0.965, 1, 1, 72), aditivo(), LIBRES.length + 2);
  const charcos = instancias(mapa, new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), aditivo({ map: radial }), 3);
  const PIL = { w: 6.5, h: 20 };
  const pilares = instancias(mapa, cajaJ, esmalte(COL.blanco), 2, 0xffffff);
  const bandas = instancias(mapa, cajaJ, new T3.MeshBasicMaterial({ color: 0xffffff }), 2, COL.menta);
  const haces = instancias(mapa, new T3.CylinderGeometry(1, 0.32, 1, 32, 1, true).translate(0, 0.5, 0), aditivo({ map: vertical }), 2);
  const geoArco = new T3.RingGeometry(0.86, 1, 96, 1).rotateX(-Math.PI / 2);
  const arcoBcn = new T3.Mesh(geoArco, aditivo({ color: COL.ion })); arcoBcn.position.copy(BCN.p).setY(0.7); arcoBcn.scale.setScalar(14); mapa.add(arcoBcn);
  const NH = 72, TOPE_M = new T3.Vector3(MAD.p.x, PIL.h, MAD.p.z), TOPE_N = new T3.Vector3(MEN.p.x, PIL.h, MEN.p.z);
  const enArco = (a, b, h, s, v) => v.lerpVectors(a, b, s).setY(mezcla(a.y, b.y, s) + 4 * h * s * (1 - s));
  const hilo = (a, b, h, mat) => { const pts = []; for (let i = 0; i < NH; i++) pts.push(enArco(a, b, h, i / (NH - 1), new T3.Vector3())); const l = new T3.Line(new T3.BufferGeometry().setFromPoints(pts), mat); l.computeLineDistances(); l.frustumCulled = false; mapa.add(l); return l; };
  const hiloMen = hilo(TOPE_M, TOPE_N, 170, new T3.LineBasicMaterial({ color: COL.cuerda, transparent: true, opacity: 0.65 }));
  const hiloBcn = hilo(TOPE_M, new T3.Vector3(BCN.p.x, 0.6, BCN.p.z), 45, new T3.LineDashedMaterial({ color: COL.ion, transparent: true, opacity: 0.85, dashSize: 7, gapSize: 6 }));

  // ── el barrio: manzanas de 33 m (44 tramas de 0,75 m), calles de 7,5 m, casas de 9 × 6 m ──
  const PASO = 33, RB = 122, casas = [], piezasDef = [], losetasDef = [];
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const cx = i * PASO, cz = j * PASO, dc = Math.hypot(cx, cz);
    if (dc > RB) continue;
    if (i === 0 && j === 0) {                                               // la plaza, donde está el punto: se pavimenta la primera
      for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { const x = a * 3.6, z = b * 3.6; losetasDef.push({ x, z, sx: 3.5, sz: 3.5, t: 0.215 + 0.012 * Math.hypot(x, z) / 15 }); }
      continue;
    }
    if (aleatorio() < 0.12) continue;                                        // algún solar vacío
    const sitios = [[-5.25, -4.5], [5.25, -4.5], [-5.25, 4.5], [5.25, 4.5]].filter(() => aleatorio() < 0.8);
    for (const [hx, hz] of sitios) casas.push({ x: cx + hx, z: cz + hz, plantas: aleatorio() < 0.3 ? 2 : 1, ry: aleatorio() < 0.5 ? 0 : Math.PI, d: Math.hypot(cx + hx, cz + hz) });
  }
  casas.sort((a, b) => a.d - b.d);
  const dMax = casas.length ? casas[casas.length - 1].d : 1;
  // las piezas de cada casa, en orden de montaje: losa, muros (atrás, lados, delante) y cubierta; si tiene dos plantas, otra vez
  casas.forEach((c, h) => {
    c.t = 0.228 + 0.12 * c.d / dMax + aleatorio() * 0.006;
    const def = [];
    for (let p = 0; p < c.plantas; p++) {
      const y0 = p * 3.3;
      if (p === 0) def.push([0, 0, 0, 9.4, 0.3, 6.4, 0]);
      def.push([0, y0 + 0.3, -2.9, 9, 3, 0.22, 1], [-4.39, y0 + 0.3, 0, 0.22, 3, 5.6, 1], [4.39, y0 + 0.3, 0, 0.22, 3, 5.6, 1], [0, y0 + 0.3, 2.9, 9, 3, 0.22, 1]);
      def.push([0, y0 + 3.3, 0, 9.6, 0.3, 6.6, 0]);
    }
    c.alto = c.plantas * 3.3 + 0.3;
    def.forEach(([x, y, z, sx, sy, sz, muro], k) => {
      const cs = Math.cos(c.ry), sn = Math.sin(c.ry);
      piezasDef.push({ x: c.x + x * cs + z * sn, y, z: c.z - x * sn + z * cs, sx, sy, sz, ry: c.ry, t: c.t + k * 0.003, muro, h });
    });
  });
  // las calles: losetas iPath de 3,6 m, dos por ancho de calle, que caen en ola desde la plaza
  for (let i = -4; i < 4; i++) {
    const s = (i + 0.5) * PASO;
    for (let a = -RB; a <= RB; a += 3.75) for (const lado of [-1.875, 1.875]) {
      for (const [x, z] of [[s + lado, a], [a, s + lado]]) {
        const dd = Math.hypot(x, z); if (dd > RB + 6) continue;
        const enCruce = Math.abs(((x / PASO) % 1 + 1) % 1 - 0.5) < 0.12 && Math.abs(((z / PASO) % 1 + 1) % 1 - 0.5) < 0.12;
        if (enCruce && x === a) continue;                                    // en los cruces, una sola loseta
        losetasDef.push({ x, z, sx: 3.5, sz: 3.5, t: 0.262 + 0.085 * dd / RB + aleatorio() * 0.004 });
      }
    }
  }
  // la lluvia: más allá del barrio, manzanas de pisos que se forman con piezas J que caen del cielo (dos por planta)
  const lluviaDef = [];
  for (let i = -13; i <= 13; i++) for (let j = -13; j <= 13; j++) {
    const cx = i * PASO, cz = j * PASO, dc = Math.hypot(cx, cz);
    if (dc <= RB + 8 || dc > 400 || aleatorio() < 0.3) continue;                       // plazas y solares: huecos en la trama
    // tres tipos de manzana: torre estrecha y alta, bloque medio y casas bajas; las torres se agrupan en racimos
    const racimo = 0.5 + 0.5 * Math.sin(cx * 0.013 + 1.3) * Math.cos(cz * 0.011 - 0.4), r0 = aleatorio();
    const tipo = r0 < 0.18 + 0.3 * racimo ? 0 : r0 < 0.7 ? 1 : 2;
    const plantas = tipo === 0 ? 7 + Math.floor(aleatorio() * 9 * (0.5 + racimo)) : tipo === 1 ? 3 + Math.floor(aleatorio() * 4) : 1 + Math.floor(aleatorio() * 2);
    const ancho = tipo === 0 ? 12 + aleatorio() * 4 : tipo === 1 ? 17 + aleatorio() * 5 : 9 + aleatorio() * 6, fondo = tipo === 0 ? 6.4 : tipo === 1 ? 9.6 : 5;
    const ry = aleatorio() < 0.5 ? 0 : Math.PI / 2, ox = (aleatorio() - 0.5) * 6, oz = (aleatorio() - 0.5) * 6;
    for (let pl = 0; pl < plantas; pl++) for (let k = 0; k < 2; k++) {
      const off = (k - 0.5) * (fondo + 0.6), cs = Math.cos(ry), sn = Math.sin(ry);
      lluviaDef.push({ x: cx + ox + off * cs, z: cz + oz - off * sn, y: pl * 3.2, ry, sx: ancho, sz: fondo, t: 0.245 + 0.15 * (dc - RB) / (400 - RB) + pl * 0.003 + k * 0.0016 + aleatorio() * 0.012, alto: 80 + aleatorio() * 110 });
    }
  }
  const NLL = lluviaDef.length;
  const lluvia = instancias(mundo, new T3.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), esmalte(0x8d97aa, { roughness: 0.55, clearcoat: 0.3, envMapIntensity: 0.4 }), NLL, 0xffffff);
  lluviaDef.forEach((l, i) => { const k = 0.5 + aleatorio() * 0.16; lluvia.setColorAt(i, new T3.Color(k, k * 1.02, k * 1.08)); });   // la ciudad, más apagada que el barrio: el protagonista sigue en el centro
  // sus estelas: una línea fina por pieza, cian junto a la pieza y apagada arriba; la niebla da la profundidad
  const estPos = new Float32Array(NLL * 6), estCol = new Float32Array(NLL * 6);
  const estelas = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(estPos, 3)).setAttribute('color', new T3.BufferAttribute(estCol, 3)),
    new T3.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false }));
  estelas.frustumCulled = false; mundo.add(estelas);
  const cCian = new T3.Color(COL.cian);
  let uLluvia = -1;
  const NP_ = piezasDef.length, NL = losetasDef.length;
  const piezas = instancias(mundo, cajaJ, esmalte(COL.blanco, { roughness: 0.32 }), NP_, 0xffffff); piezas.castShadow = true; piezas.receiveShadow = true;
  piezasDef.forEach((p, i) => piezas.setColorAt(i, new T3.Color(p.muro ? 0xffffff : 0xcfd5df)));
  const losetas = instancias(mundo, new T3.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), esmalte(0x1a202a, { roughness: 0.88, clearcoat: 0, envMap: ctx.entorno, envMapIntensity: 0.1 }), NL, 0xffffff); losetas.receiveShadow = true;
  losetasDef.forEach((l, i) => { const k = 0.85 + aleatorio() * 0.3; losetas.setColorAt(i, aleatorio() < 0.06 ? new T3.Color(1.3, 2.0, 2.9) : new T3.Color(k, k, k)); });   // alguna loseta con sensor, en ion
  // los cables de grúa de cada pieza: brillan junto a la pieza y se pierden hacia arriba
  const cabPos = new Float32Array(NP_ * 6), cabCol = new Float32Array(NP_ * 6);
  const cablesB = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(cabPos, 3)).setAttribute('color', new T3.BufferAttribute(cabCol, 3)),
    new T3.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false }));
  cablesB.frustumCulled = false; mundo.add(cablesB);
  // los lectores (uno por casa) y sus enlaces con las dos casas más cercanas
  const NC = casas.length, lecPos = new Float32Array(NC * 3), lecCol = new Float32Array(NC * 3), enlaces = [];
  casas.forEach((c, h) => { lecPos.set([c.x + 3.6 * Math.cos(c.ry), c.alto + 0.7, c.z - 2.2], h * 3);
    const cerca = casas.map((o, k) => [k, Math.hypot(o.x - c.x, o.z - c.z)]).filter(([k]) => k !== h).sort((a, b) => a[1] - b[1]).slice(0, 2);
    for (const [k] of cerca) if (!enlaces.some(([a, b2]) => (a === k && b2 === h))) enlaces.push([h, k]); });
  const lectores = new T3.Points(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(lecPos, 3)).setAttribute('color', new T3.BufferAttribute(lecCol, 3)),
    new T3.PointsMaterial({ map: radial, vertexColors: true, size: 9, sizeAttenuation: false, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false }));
  lectores.frustumCulled = false; mundo.add(lectores);
  const neuPos = new Float32Array(enlaces.length * 6), neuCol = new Float32Array(enlaces.length * 6);
  enlaces.forEach(([a, b2], i) => { neuPos.set(lecPos.subarray(a * 3, a * 3 + 3), i * 6); neuPos.set(lecPos.subarray(b2 * 3, b2 * 3 + 3), i * 6 + 3); });
  const neuronas = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(neuPos, 3)).setAttribute('color', new T3.BufferAttribute(neuCol, 3)),
    new T3.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false }));
  neuronas.frustumCulled = false; mundo.add(neuronas);
  // la trama de 0,75 m (y la de 7,5 m), que el latido enciende hacia fuera
  const UR = { uR: { value: 0 }, uK: { value: 0 }, uOp: { value: 0 } };
  const rejilla = new T3.Mesh(new T3.PlaneGeometry(1400, 1400).rotateX(-Math.PI / 2), new T3.ShaderMaterial({
    uniforms: UR, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'varying vec2 vP; void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uR, uK, uOp; varying vec2 vP;
      float trama(vec2 p, float paso) { vec2 q = p / paso, fw = max(fwidth(q), vec2(1e-5)); vec2 g = abs(fract(q - 0.5) - 0.5) / fw; return (1.0 - min(min(g.x, g.y), 1.0)) * clamp(1.4 - max(fw.x, fw.y) * 5.0, 0.0, 1.0); }
      void main() {
        float d = length(vP), dentro = smoothstep(uR, uR - 25.0, d) * smoothstep(640.0, 240.0, d);
        float l = trama(vP, 0.75) * 0.5 + trama(vP, 7.5) * 0.8;
        float frente = exp(-abs(d - uR) / 2.5) * uK;
        gl_FragColor = vec4(vec3(0.30, 0.40, 0.54) * l * dentro * uOp + vec3(0.40, 0.78, 0.98) * frente * (0.25 + 1.8 * l), 1.0);
      }`,
  }));
  rejilla.position.y = 0.03; rejilla.frustumCulled = false; mundo.add(rejilla);
  // las ondas del latido, en el suelo
  const ondasL = instancias(mundo, aroGeo(0.94, 1, 1, 72), aditivo(), 5);

  // ── el logo (CUEVA Brandbook v2, el de la apertura): anillo r = 92 en una caja de 240 ──
  const RL = 150, K = RL / 92, TH = 3.2, PROF = 6, Y_L = 230;
  const lp = (x, y) => [(x - 120) * K, (y - 120) * K];
  const HEX = [[91.56, 74.75], [91.56, 89.25], [79, 96.5], [66.44, 89.25], [66.44, 74.75], [79, 67.5]].map(([x, y]) => lp(x, y));
  const rectL = (x, y, w, h) => [lp(x, y), lp(x + w, y), lp(x + w, y + h), lp(x, y + h)];
  const PIEZAS = {
    U: { forma: rectL(70, 139, 27, 27), col: 'tinta', con: [lp(97, 152.5), lp(102.3, 152.5)], cuad: lp(104.1, 152.5), ccol: 'coral' },
    E: { forma: rectL(130, 72, 37, 18), col: 'tinta', con: [lp(148.5, 90), lp(148.5, 95)], cuad: lp(148.5, 96.8), ccol: 'ion' },
    V: { forma: rectL(116, 168, 45, 18), col: 'ion', con: [lp(161, 177), lp(166.2, 177)], cuad: lp(168, 177), ccol: 'menta' },
    A: { forma: HEX, col: 'cian', con: [lp(91.8, 82), lp(97.2, 82)], cuad: lp(99.1, 82), ccol: 'menta' },
  };
  const MENTA = lp(176, 177);
  for (const p of Object.values(PIEZAS)) {
    p.centro = p.forma.reduce((s, q) => [s[0] + q[0] / p.forma.length, s[1] + q[1] / p.forma.length], [0, 0]);
    p.local = p.forma.map(([x, y]) => [x - p.centro[0], y - p.centro[1]]);
  }
  const MAT = { tinta: esmalte(COL.blanco), ion: esmalte(COL.ion, brilloPropio(COL.ion)), cian: esmalte(COL.cian, brilloPropio(COL.cian)), menta: esmalte(COL.menta, brilloPropio(COL.menta)), coral: esmalte(COL.coral, brilloPropio(COL.coral)) };
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
  const logo = new T3.Group(); logo.position.set(0, Y_L, 0); escena.add(logo);
  // el anillo: un toro cuyo radio y grueso cambian en el sombreador (el de la apertura)
  const toroGeo = (() => { const seg = 240, tub = 24, pos = [], idx = []; for (let i = 0; i <= seg; i++) for (let j = 0; j <= tub; j++) pos.push(i / seg * TAU, j / tub * TAU, 0);
    for (let i = 0; i < seg; i++) for (let j = 0; j < tub; j++) { const a = i * (tub + 1) + j, b = a + tub + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.boundingSphere = new T3.Sphere(new T3.Vector3(), 1e5); return g; })();
  const toroU = { uR: { value: 0.01 }, uTubo: { value: 0.01 } };
  const TORO = 'vec3 transformed = vec3((uR + uTubo * cos(position.y)) * cos(position.x), (uR + uTubo * cos(position.y)) * sin(position.x), uTubo * sin(position.y));';
  const matToro = esmalte(COL.blanco);
  matToro.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, toroU); sh.vertexShader = 'uniform float uR, uTubo;\n' + sh.vertexShader
    .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(cos(position.x) * cos(position.y), sin(position.x) * cos(position.y), sin(position.y));').replace('#include <begin_vertex>', TORO); };
  const toro = new T3.Mesh(toroGeo, matToro); toro.castShadow = true; toro.receiveShadow = true; logo.add(toro);
  toro.customDepthMaterial = new T3.MeshDepthMaterial({ depthPacking: T3.RGBADepthPacking });
  toro.customDepthMaterial.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, toroU); sh.vertexShader = 'uniform float uR, uTubo;\n' + sh.vertexShader.replace('#include <begin_vertex>', TORO); };
  // las cuatro piezas: marco limpio y placa translúcida; su conector, su cuadradito y su lectura
  const ORDEN = ['U', 'E', 'V', 'A'], LG = {};
  ORDEN.forEach((ch, k) => {
    const p = PIEZAS[ch], c = { p, k };
    c.pieza = new T3.Group(); const mm = new T3.Mesh(marco(p.local, TH, PROF), MAT[p.col]); mm.castShadow = true; c.pieza.add(mm);
    c.placa = new T3.Mesh(new T3.ShapeGeometry(new T3.Shape(desplazar(p.local, 0))), new T3.MeshBasicMaterial({ color: COL[p.col === 'tinta' ? 'blanco' : p.col], transparent: true, opacity: 0, depthWrite: false, side: T3.DoubleSide }));
    c.pieza.add(c.placa); logo.add(c.pieza);
    c.conG = new T3.Group(); c.con = new T3.Mesh(new T3.BoxGeometry(1, 2.2, 3), MAT[p.ccol]); c.cuad = new T3.Mesh(marco(cuadrado(3.7 * K), 1.6, 3), MAT[p.ccol]);
    c.conG.add(c.con, c.cuad); logo.add(c.conG);
    c.sg = k % 2 ? 1 : -1; c.t0 = 0.712 + k * 0.011; c.tc = 0.762 + k * 0.006;
    LG[ch] = c;
  });
  const mentaM = new T3.Mesh(new T3.SphereGeometry(1, 32, 24), esmalte(COL.menta, { emissive: COL.menta, emissiveIntensity: 0.5 })); logo.add(mentaM);
  // el reflejo en el suelo: una copia del logo, volteada, que se ve a través del suelo translúcido
  const espejo = logo.clone(true); espejo.matrixAutoUpdate = false; escena.add(espejo);
  const orig = [], copia = []; logo.traverse((o) => orig.push(o)); espejo.traverse((o) => { copia.push(o); o.castShadow = false; });
  const REFLEJO = new T3.Matrix4().makeScale(1, -1, 1);
  const suelo = new T3.Mesh(new T3.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T3.MeshStandardMaterial({ color: 0x080a0f, roughness: 0.6, metalness: 0, envMap: ctx.entorno, envMapIntensity: 0.08, transparent: true, opacity: 0 }));
  suelo.receiveShadow = true; suelo.scale.setScalar(60000); escena.add(suelo);
  const charcoL = new T3.Mesh(new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), aditivo({ map: radial })); charcoL.position.y = 0.6; charcoL.scale.setScalar(330); escena.add(charcoL);

  // ── el punto, el destello y las motas que se inhalan ──
  const pt = punto(escena, { alcance: 40 });
  // el polvo del plató: motas que solo se ven donde las toca la luz del punto; las cercanas, grandes y blandas (profundidad)
  const NPV = 260, pvBase = new Float32Array(NPV * 4), pvPos = new Float32Array(NPV * 3), pvCol = new Float32Array(NPV * 3);
  for (let i = 0; i < NPV; i++) { pvBase[i * 4] = (aleatorio() - 0.5) * 22; pvBase[i * 4 + 1] = 0.15 + aleatorio() * 6.5; pvBase[i * 4 + 2] = (aleatorio() - 0.5) * 22; pvBase[i * 4 + 3] = aleatorio(); }
  const polvo = new T3.Points(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(pvPos, 3)).setAttribute('color', new T3.BufferAttribute(pvCol, 3)),
    new T3.PointsMaterial({ map: radial, vertexColors: true, size: 0.17, sizeAttenuation: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false }));
  polvo.frustumCulled = false; escena.add(polvo);
  // su reflejo en el esmalte negro del suelo y el charco de luz que deja debajo
  const reflejoP = new T3.Sprite(new T3.SpriteMaterial({ map: radial, color: COL.ambar, blending: T3.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, fog: false })); escena.add(reflejoP);
  const charcoP = new T3.Mesh(new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), aditivo({ map: radial, color: COL.ambar })); charcoP.position.y = 0.04; escena.add(charcoP);
  const destello = new T3.Sprite(new T3.SpriteMaterial({ map: radial, color: 0xffe2b0, blending: T3.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); escena.add(destello);
  const NM = 520, motaLocal = new Float32Array(NM * 4), motaPos = new Float32Array(NM * 3), motaCol = new Float32Array(NM * 3);
  for (let i = 0; i < NM; i++) { motaLocal[i * 4] = cMapa.x + (aleatorio() - 0.5) * tMapa.x * 1.1; motaLocal[i * 4 + 1] = aleatorio() * 60000; motaLocal[i * 4 + 2] = cMapa.z + (aleatorio() - 0.5) * tMapa.z * 1.1; motaLocal[i * 4 + 3] = aleatorio(); }
  const motas = new T3.Points(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(motaPos, 3)).setAttribute('color', new T3.BufferAttribute(motaCol, 3)),
    new T3.PointsMaterial({ map: radial, vertexColors: true, size: 6, sizeAttenuation: false, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, fog: false }));
  motas.frustumCulled = false; escena.add(motas);

  // ── la cámara: los planos generales encajan en el hueco que dejan los textos ──
  const beats = ctx.raiz.querySelectorAll('.beat');
  // un velo oscuro y radial detrás de «Todo lo demás»: el título se lee sobre la ciudad y sobre la red
  const velo = document.createElement('div'); velo.setAttribute('aria-hidden', 'true');
  velo.style.cssText = 'position:absolute;left:0;right:0;top:0;height:58%;z-index:1;pointer-events:none;opacity:0;background:radial-gradient(70% 80% at 50% 24%, rgba(5,7,10,.96), rgba(5,7,10,.8) 50%, rgba(5,7,10,0) 100%);';
  ctx.fijo.appendChild(velo);
  let veloV = -1;
  let W = 1, H = 1, medido = -9;
  const camAux = new T3.PerspectiveCamera(28, 1, 1, 1e7), esq = new T3.Vector3();
  const PL = {
    punto: { oy: 0 },
    mapa: { c: cMapa, mx: tMapa.x / 2, mz: tMapa.z / 2, y0: -ALTO * F, y1: 0, lado: 0.1, el: 0.82 },
    logo: { c: new T3.Vector3(0, Y_L, 0), mx: 178, mz: 12, y0: Y_L - 178, y1: Y_L + 178, lado: 0.12, el: 0.1 },
    heroe: { c: new T3.Vector3(0, Y_L, 0), mx: 178, mz: 12, y0: Y_L - 178, y1: Y_L + 178, lado: 0.05, el: 0.13 },
  };
  function encajar(P, r) {
    const { c, mx, mz, y0: yb, y1: yt } = P; camAux.aspect = W / H; camAux.updateProjectionMatrix();
    const rw = Math.max(40, r[2] - r[0]) / W * 2, rh = Math.max(40, r[3] - r[1]) / H * 2;
    let d = distancia(camAux, Math.max(mz * 2, yt - yb), mx * 2), x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    for (let it = 0; it < 4; it++) {
      mirar(camAux, c.x, c.y, c.z, d, P.lado, P.el); camAux.updateMatrixWorld();
      x0 = y0 = Infinity; x1 = y1 = -Infinity;
      for (let k = 0; k < 8; k++) { esq.set(c.x + (k & 1 ? mx : -mx), k & 2 ? yt : yb, c.z + (k & 4 ? mz : -mz)).project(camAux); x0 = Math.min(x0, esq.x); x1 = Math.max(x1, esq.x); y0 = Math.min(y0, esq.y); y1 = Math.max(y1, esq.y); }
      if (it < 3) d *= Math.max((x1 - x0) / rw, (y1 - y0) / rh);
    }
    const rcx = (r[0] + r[2]) / W - 1, rcy = 1 - (r[1] + r[3]) / H;
    P.d = d; P.ox = -(rcx - (x0 + x1) / 2) * W / 2; P.oy = (rcy - (y0 + y1) / 2) * H / 2;
  }
  function huecos() {
    const m = Math.max(16, Math.min(88, W * 0.05)), nav = 64, bajo = (el, def) => (el && el.offsetHeight ? el.offsetTop + el.offsetHeight : def);
    const r0 = [m, bajo(beats[0], H * 0.3) + H * 0.03, W - m, H - H * 0.06];
    const yPunto = mezcla(r0[1], r0[3], W < H ? 0.36 : 0.44);           // el punto, en el tercio alto del hueco bajo el título: compuesto con él
    PL.punto.oy = (1 - 2 * yPunto / H) * H / 2;
    encajar(PL.mapa, [m, bajo(beats[1], H * 0.3) + H * 0.03, W - m, H - H * 0.05]);
    encajar(PL.logo, [m, bajo(beats[2], H * 0.4) + H * 0.035, W - m, H - H * 0.05]);
    const cta = beats[3] && beats[3].offsetHeight ? beats[3].offsetTop : H * 0.65;
    encajar(PL.heroe, [m, nav + H * 0.02, W - m, Math.min(H * 0.64, cta - 12)]);
  }
  const cam = { x: 0, y: 0, z: 0, d: 1, lado: 0, el: 0, ox: 0, oy: 0 };
  const lmez = (a, b, w) => Math.exp(mezcla(Math.log(a), Math.log(b), w));
  const golpe = (u, a, dur, k) => { const w = tramo(u, a, a + dur); return w > 0 && w < 1 ? k * Math.exp(-w * 5) * Math.sin(w * 34) : 0; };
  // el aspecto manda en los primeros planos: en vertical hay que alejarse para que quepa el barrio
  const aspecto = () => Math.max(1, 1.25 / Math.min(1.25, W / H));
  // el inhalado: la escala del mundo (1 hasta 0.62; respira un poco y se va a casi nada en 0.695)
  const LOG_MIN = Math.log(1e-6);
  function inhalado(u) { const a = tramo(u, 0.62, 0.637), w = tramo(u, 0.637, 0.695); return w > 0 ? Math.exp(LOG_MIN * E.ei(w)) : 1 + 0.035 * Math.sin(Math.PI * a); }
  function plano(u, reloj) {
    const ak = aspecto(), akL = Math.min(ak, 1.35), dS = 250 * ak,   // en la lluvia, la cámara no se aleja tanto en vertical: quedaría dentro de la ciudad
      dP = 15 * ak, Pm = PL.mapa, Pl = PL.logo, Ph = PL.heroe;
    if (u < 0.205) {                                                        // 1. el punto, solo: la cámara llega de lejos y de lado mientras nace
      const a = E.seno(tramo(u, 0, 0.205)), c = E.seno(tramo(u, 0.17, 0.205));
      cam.x = 0; cam.y = mezcla(2.2, 1.0, c); cam.z = 0; cam.d = dP * mezcla(1.45, 0.92, a);
      cam.lado = mezcla(-0.5, -0.22, a); cam.el = mezcla(0.08, 0.16, a); cam.ox = 0; cam.oy = PL.punto.oy;
    } else if (u < 0.36) {                                                  // 2. la grúa de cámara: sube por encima de la lluvia y baja a través de ella
      const h = 0.2 * Math.sin(Math.PI * tramo(u, 0.205, 0.23));          // un respiro tras el toque, antes de subir
      const w1 = E.eio(tramo(u, 0.212, 0.282)), w2 = E.eio(tramo(u, 0.282, 0.36));
      cam.x = 0; cam.z = 0; cam.y = mezcla(mezcla(1.0, 0, w1), 18, w2);
      cam.d = lmez(lmez(dP * 0.92 * (1 + h * 0.1), 215 * akL, w1), 170 * akL, w2);
      cam.lado = mezcla(mezcla(-0.22, 0.3, w1), 0.62, w2); cam.el = mezcla(mezcla(0.16, 1.18, w1), 0.33, w2);
      cam.ox = 0; cam.oy = PL.punto.oy * (1 - w1);
    } else if (u < 0.62) {                                                  // 3. potencias de diez: del barrio a España
      const w = E.eio(tramo(u, 0.36, 0.53)), k = tramo(u, 0.53, 0.62);
      cam.x = mezcla(0, cMapa.x, E.eio(tramo(u, 0.42, 0.53))); cam.y = mezcla(18, 0, w); cam.z = mezcla(0, cMapa.z, E.eio(tramo(u, 0.42, 0.53)));
      cam.d = lmez(170 * akL, Pm.d, w) * mezcla(1, 0.96, k); cam.lado = mezcla(0.62, Pm.lado, w) + 0.05 * k; cam.el = mezcla(0.33, Pm.el, w) + 0.3 * Math.sin(Math.PI * w);
      cam.ox = Pm.ox * E.eio(tramo(u, 0.45, 0.53)); cam.oy = Pm.oy * E.eio(tramo(u, 0.45, 0.53));
    } else if (u < 0.7) {                                                   // 4. el inhalado: la cámara baja con el mapa hasta el punto
      const s = inhalado(u), w = E.ei(tramo(u, 0.637, 0.695)), g = E.eio(tramo(u, 0.64, 0.7));
      cam.x = cMapa.x * s; cam.y = Y_L * (1 - s); cam.z = cMapa.z * s;
      cam.d = lmez(Pm.d * 0.96, Pl.d * 1.1, w) * (1 + 0.02 * Math.sin(Math.PI * tramo(u, 0.62, 0.637)));
      cam.lado = mezcla(Pm.lado + 0.05, 0.34, g); cam.el = mezcla(Pm.el, Pl.el, g); cam.ox = mezcla(Pm.ox, Pl.ox, g); cam.oy = mezcla(Pm.oy, Pl.oy, g);
    } else {                                                                // 5. el logo nace, y luego el héroe
      const w = E.seno(tramo(u, 0.7, 0.84)), h = E.eio(tramo(u, 0.84, 0.9));
      cam.x = 0; cam.y = Y_L; cam.z = 0;
      cam.d = mezcla(Pl.d * mezcla(1.1, 1, w), Ph.d, h); cam.lado = mezcla(mezcla(0.34, Pl.lado, w), Ph.lado + 0.03 * Math.sin(reloj * 0.17), h);
      cam.el = mezcla(Pl.el, Ph.el, h); cam.ox = mezcla(Pl.ox, Ph.ox, h); cam.oy = mezcla(Pl.oy, Ph.oy, h);
    }
  }
  function aplicar(u, reloj, niebla = 0) {
    const lado = cam.lado + 0.012 * Math.sin(reloj * 0.21) + 0.007 * Math.sin(reloj * 0.13), el = cam.el + 0.006 * Math.sin(reloj * 0.17), d = cam.d * (1 + 0.006 * Math.sin(reloj * 0.11));
    mirar(camara, cam.x, cam.y, cam.z, d, lado, el);
    camara.setViewOffset(W, H, cam.ox, cam.oy, W, H);
    plato.enfocar(cam.x, cam.y, cam.z, d);
    // al subir, la niebla se aparta: si no, España entera se perdería en negro hasta el último momento
    const zf = Math.sin(Math.PI * tramo(u, 0.36, 0.56)) + (u > 0.53 && u < 0.66 ? 0.6 * (1 - tramo(u, 0.62, 0.66)) : 0);
    if (escena.fog) { escena.fog.near = d * mezcla(mezcla(1.1, 2.5, zf), 1.4, niebla); escena.fog.far = d * mezcla(mezcla(2.6, 9, zf), 5, niebla); }   // en la caída, la niebla se abre: la lluvia tiene fondo
    // las luces: oscuridad al principio; se encienden con el latido; se apagan al inhalar y vuelven con el logo
    const enc = E.seno(tramo(u, 0.2, 0.26)) * (1 - 0.85 * E.eo(tramo(u, 0.64, 0.69))) + 0.85 * E.eo(tramo(u, 0.7, 0.78));
    plato.clave.intensity = 3.3 * enc; plato.contra.intensity = 0.55 * enc; if (hemi) hemi.intensity = mezcla(0.04, 0.35, enc);
    matLosa.envMapIntensity = mezcla(0.002, 0.12, E.eo(tramo(u, 0.205, 0.3)));
    camara.updateMatrixWorld();
    return d;
  }

  // ── la respiración: antes de caer, el punto toma aire (una sola vez, lenta) ──
  const latido = (u) => 0.22 * Math.exp(-(((u - 0.168) / 0.011) ** 2));
  // la caída a la malla: cae con gravedad al final de la frase y toca en 0.205
  const caida = (u) => E.ei(tramo(u, 0.183, 0.205));

  // ── cada fotograma ────────────────────────────────────────────────
  function fotograma(u, reloj, d) {
    const s = inhalado(u);
    mundo.visible = s > 2e-5;
    mundo.scale.setScalar(s); mundo.position.set(0, Y_L * (1 - s), 0);
    // la trama y su frente
    UR.uR.value = mezcla(0, 470, E.eo(tramo(u, 0.205, 0.33))); UR.uK.value = 1.1 * (1 - tramo(u, 0.25, 0.34)) * (u > 0.204 ? 1 : 0); UR.uOp.value = 0.6 * E.eo(tramo(u, 0.205, 0.23)) * (1 - tramo(u, 0.42, 0.5));
    for (let i = 0; i < 5; i++) poner(ondasL, i, 0, -99, 0, 0, 0, 0);     // sin anillos: la trama es la onda
    // las casas: cada pieza baja colgada, encaja con un rebote y su cable sube
    for (let i = 0; i < NP_; i++) {
      const p = piezasDef[i], w = tramo(u, p.t, p.t + 0.012), vis = u > p.t;
      const caida = 1 - E.eo5(w), y = p.y + 46 * caida, ry = p.ry + 0.7 * caida * (i % 2 ? 1 : -1);
      const ap = tramo(u, p.t + 0.012, p.t + 0.02), aplasta = ap > 0 && ap < 1 ? mezcla(0.86, 1, E.rebote(ap)) : 1;
      poner(piezas, i, p.x, y, p.z, vis ? p.sx : 0, vis ? p.sy * aplasta : 0, vis ? p.sz : 0, ry);
      const suelta = E.ei(tramo(u, p.t + 0.013, p.t + 0.022)), cab = vis && suelta < 1;
      const yt = y + p.sy + 0.05 + 120 * suelta, k = i * 6;
      if (cab) {
        cabPos[k] = p.x; cabPos[k + 1] = yt; cabPos[k + 2] = p.z; cabPos[k + 3] = p.x; cabPos[k + 4] = yt + 80; cabPos[k + 5] = p.z;
        const b2 = 0.55 * (1 - suelta); cabCol[k] = cCian.r * b2; cabCol[k + 1] = cCian.g * b2; cabCol[k + 2] = cCian.b * b2;   // cuerdas de luz cian, como la lluvia cabCol[k + 3] = cabCol[k + 4] = cabCol[k + 5] = 0;
      } else { cabPos[k + 1] = cabPos[k + 4] = -1e5; cabCol[k] = cabCol[k + 1] = cabCol[k + 2] = 0; }
    }
    cablesB.geometry.attributes.position.needsUpdate = true; cablesB.geometry.attributes.color.needsUpdate = true;
    // la lluvia: cada pieza cae con gravedad desde muy alto, deja su estela cian y encaja en su planta
    lluvia.material.color.setHex(0x8d97aa).multiplyScalar(mezcla(1, 0.22, tramo(u, 0.37, 0.43)));   // al subir, la ciudad se apaga: deja hablar al título y a la red
    if (u !== uLluvia) {
      uLluvia = u;
      for (let i = 0; i < NLL; i++) {
        const l = lluviaDef[i], w = tramo(u, l.t - 0.03, l.t), vis = u > l.t - 0.03, k = i * 6;
        const cae = 1 - E.ei(w), y = l.y + l.alto * cae, ap = tramo(u, l.t, l.t + 0.008), aplasta = ap > 0 && ap < 1 ? mezcla(0.8, 1, E.rebote(ap)) : 1;
        poner(lluvia, i, l.x, y, l.z, vis ? l.sx : 0, vis ? 0.55 * aplasta : 0, vis ? l.sz : 0, l.ry + 0.4 * cae * (i % 2 ? 1 : -1));
        if (vis && w < 1) {
          const v = 3 * w * w, largo = 10 + 70 * v;                    // la estela crece con la velocidad
          estPos[k] = l.x; estPos[k + 1] = y + 0.6; estPos[k + 2] = l.z; estPos[k + 3] = l.x; estPos[k + 4] = y + 0.6 + largo; estPos[k + 5] = l.z;
          const b2 = 0.4 + 0.6 * Math.min(1, v); estCol[k] = cCian.r * b2; estCol[k + 1] = cCian.g * b2; estCol[k + 2] = cCian.b * b2; estCol[k + 3] = estCol[k + 4] = estCol[k + 5] = 0;
        } else { estPos[k + 1] = estPos[k + 4] = -1e5; estCol[k] = estCol[k + 1] = estCol[k + 2] = 0; }
      }
      estelas.geometry.attributes.position.needsUpdate = true; estelas.geometry.attributes.color.needsUpdate = true; listo(lluvia);
    }
    // las calles: las losetas caen en ola y se asientan
    for (let i = 0; i < NL; i++) {
      const l = losetasDef[i], w = tramo(u, l.t, l.t + 0.01), on = u > l.t;
      poner(losetas, i, l.x, 0.9 * (1 - E.eo(w)), l.z, on ? l.sx * mezcla(0.4, 1, E.firme(w)) : 0, on ? 0.14 : 0, on ? l.sz * mezcla(0.4, 1, E.firme(w)) : 0);
    }
    // los lectores parpadean cuando su casa está montada, y las neuronas se encienden entre vecinos
    const lu = 1 - tramo(u, 0.47, 0.53);
    for (let h = 0; h < NC; h++) {
      const c = casas[h], on = tramo(u, c.t + 0.04, c.t + 0.05) * lu, f = (reloj * 0.7 + h * 0.618) % 1, b2 = on * (0.25 + 0.95 * Math.exp(-f * 9));
      lecCol[h * 3] = 0.06 * b2; lecCol[h * 3 + 1] = 0.65 * b2; lecCol[h * 3 + 2] = 0.92 * b2;
    }
    lectores.geometry.attributes.color.needsUpdate = true;
    enlaces.forEach(([a, b2], i) => {
      const on = Math.min(tramo(u, casas[a].t + 0.05, casas[a].t + 0.07), tramo(u, casas[b2].t + 0.05, casas[b2].t + 0.07)) * lu * (u > 0.31 ? 1 : 0);
      const f = (reloj * 0.45 + i * 0.37) % 1, k = on * (0.12 + 0.9 * Math.exp(-f * 7));
      neuCol.set([0, 0.83 * k, 0.67 * k, 0, 0.83 * k, 0.67 * k], i * 6);
    });
    neuronas.geometry.attributes.color.needsUpdate = true;

    // la red: el canto de la costa y los nodos aparecen al ver España entera
    canto.material.opacity = 0.8 * E.eo(tramo(u, 0.39, 0.47));
    UG.uTramaG.value = 0.26 * E.eo(tramo(u, 0.3, 0.4)) * mezcla(1, 0.35, tramo(u, 0.5, 0.56)) * (1 - tramo(u, 0.62, 0.66));
    const vis = E.eo(tramo(u, 0.47, 0.51));
    LIBRES.forEach((n) => {
      const sc = E.vivo(tramo(u, n.nace, n.nace + 0.03)), esB = n === BCN, R = esB ? 10.5 : 9.5;
      poner(anillos, n.j, n.p.x, 0.6, n.p.z, R * sc, 1, R * sc, reloj * (esB ? 0.3 : 0.08) + n.j);
      color(anillos, n.j, esB ? COL.ion : COL.cuerda, sc * (esB ? 0.9 : 0.55 + 0.2 * Math.sin(reloj * 1.5 + n.j * 1.7)));
      const f = (reloj / 3.2 + n.j * 0.137) % 1; poner(ondasM, n.j, n.p.x, 0.5, n.p.z, sc >= 1 ? R * mezcla(1, 2.8, E.eo(f)) : 0, 1, sc >= 1 ? R * mezcla(1, 2.8, E.eo(f)) : 0); color(ondasM, n.j, esB ? COL.ion : COL.cuerda, 0.45 * (1 - f) * (1 - f));
    });
    ACTIVOS.forEach((n, i) => {
      const a = E.vivo(tramo(u, 0.472 + i * 0.012, 0.5 + i * 0.012)), ae = a > 0 ? a : 0;
      poner(pilares, i, n.p.x, 0, n.p.z, PIL.w * ae, PIL.h * ae, PIL.w * ae);
      poner(bandas, i, n.p.x, PIL.h * 0.7 * ae, n.p.z, (PIL.w + 0.7) * ae, 1.5 * ae, (PIL.w + 0.7) * ae); color(bandas, i, COL.menta, 1.25 * Math.min(1, a));
      poner(charcos, i, n.p.x, 0.4, n.p.z, 40, 1, 40); color(charcos, i, COL.menta, 0.6 * Math.min(1, a) * (0.9 + 0.1 * Math.sin(reloj * 1.1 + i)));
      poner(haces, i, n.p.x, 0, n.p.z, 12, 170 * Math.min(1, a), 12); color(haces, i, COL.menta, 0.3 * Math.min(1, a));
      const wc = tramo(u, 0.49 + i * 0.012, 0.53 + i * 0.012), on = wc > 0 && wc < 1;
      poner(ondasM, LIBRES.length + i, n.p.x, 0.5, n.p.z, on ? mezcla(6, 70, E.eo(wc)) : 0, 1, on ? mezcla(6, 70, E.eo(wc)) : 0); color(ondasM, LIBRES.length + i, COL.menta, on ? 0.9 * (1 - wc) * (1 - wc) : 0);
    });
    const ub = E.eo(tramo(u, 0.49, 0.53)), lat = 0.75 + 0.25 * Math.sin(reloj * 2.2);
    poner(charcos, 2, BCN.p.x, 0.4, BCN.p.z, 22, 1, 22); color(charcos, 2, COL.ion, 0.35 * ub * lat);
    arcoBcn.visible = ub > 0.01; arcoBcn.rotation.y = -reloj * 0.35; geoArco.setDrawRange(0, 6 * Math.max(1, Math.round(96 * 0.55 * ub))); arcoBcn.material.color.setHex(COL.ion).multiplyScalar(lat * ub);
    const sh = E.eio(tramo(u, 0.52, 0.565)), sb = E.eio(tramo(u, 0.55, 0.6));
    hiloMen.visible = sh > 0; hiloMen.geometry.setDrawRange(0, Math.max(2, Math.round(NH * sh)));
    hiloBcn.visible = sb > 0; hiloBcn.geometry.setDrawRange(0, Math.max(2, Math.round(NH * sb)));
    listo(piezas, losetas, ondasL, anillos, ondasM, charcos, pilares, bandas, haces);

    // las motas: todo lo que hay, inhalado en espiral hacia el punto
    const mv = tramo(u, 0.615, 0.635) * (1 - tramo(u, 0.69, 0.7)), wI = tramo(u, 0.637, 0.695);
    motas.visible = mv > 0;
    if (motas.visible) {
      for (let i = 0; i < NM; i++) {
        const r = motaLocal[i * 4 + 3], si = Math.exp(LOG_MIN * E.ei(Math.min(1, wI * (0.8 + 0.5 * r)))), a = (1 - si) * (2.4 + 2 * r);
        const lx = motaLocal[i * 4] * si, lz = motaLocal[i * 4 + 2] * si, ca = Math.cos(a), sa = Math.sin(a);
        motaPos[i * 3] = lx * ca - lz * sa; motaPos[i * 3 + 1] = Y_L * (1 - si) + motaLocal[i * 4 + 1] * si; motaPos[i * 3 + 2] = lx * sa + lz * ca;
        const b2 = mv * (0.35 + 0.65 * (1 - si)) * (0.5 + 0.5 * r); motaCol[i * 3] = b2; motaCol[i * 3 + 1] = b2 * (0.7 + 0.25 * r); motaCol[i * 3 + 2] = b2 * (0.45 + 0.5 * (1 - r));
      }
      motas.geometry.attributes.position.needsUpdate = true; motas.geometry.attributes.color.needsUpdate = true;
    }
    // el destello: cuando todo cabe en el punto
    const wd = tramo(u, 0.688, 0.72), w3 = tramo(u, 0.205, 0.232); destello.visible = (wd > 0 && wd < 1) || (w3 > 0 && w3 < 1);
    if (wd > 0 && wd < 1) { destello.position.set(0, Y_L, 0); destello.scale.setScalar(mezcla(60, 900, E.eo(wd))); destello.material.opacity = Math.sin(Math.PI * Math.min(1, wd * 2.2)) * (1 - wd); }
    else if (destello.visible) destello.visible = false;                    // en el arranque, sin destello: la marca no grita

    // el logo: el anillo se abre girando y las piezas vuelan desde el punto a su sitio
    const vl = u > 0.69; logo.visible = vl;
    if (vl) {
      const wa = tramo(u, 0.698, 0.765);
      toroU.uR.value = Math.max(0.01, RL * E.suave(wa)); toroU.uTubo.value = mezcla(7, 1.7, E.eo(tramo(u, 0.7, 0.78))) * Math.min(1, wa * 6);
      toro.rotation.set(0, TAU * (1 - E.suave(wa)), 0);
      for (const ch of ORDEN) {
        const c = LG[ch], p = c.p, w = tramo(u, c.t0, c.t0 + 0.034), on = u > c.t0, f = E.firme(w);
        c.pieza.visible = on;
        c.pieza.position.set(p.centro[0] * f, -p.centro[1] * f, 26 * Math.sin(Math.PI * Math.min(1, w)) * c.sg);
        c.pieza.rotation.set(TAU * (1 - f) * (c.k % 2 ? 1 : 0), TAU * (1 - f) * (c.k % 2 ? 0 : 1) * c.sg, 0);
        c.pieza.scale.setScalar(Math.max(0.01, mezcla(0.12, 1, E.eo(w))) * (1 + 0.1 * Math.sin(Math.PI * tramo(u, c.t0 + 0.03, c.t0 + 0.042))));
        c.placa.material.opacity = 0.09 * E.eo(tramo(u, c.t0 + 0.03, c.t0 + 0.05));
        const uc = E.eo(tramo(u, c.tc, c.tc + 0.014));
        c.conG.visible = uc > 0;
        if (uc > 0) {
          const c0 = p.con[0], c1 = p.con[1], dx = c1[0] - c0[0], dy = c1[1] - c0[1], Lc = Math.hypot(dx, dy) * uc + 1.2;
          c.con.scale.set(Lc, 1, 1); c.con.rotation.z = -Math.atan2(dy, dx); c.con.position.set(c0[0] + dx * uc / 2, -(c0[1] + dy * uc / 2), 0);
          const uq = E.vivo(tramo(u, c.tc + 0.008, c.tc + 0.024)); c.cuad.visible = uq > 0.01; c.cuad.scale.setScalar(Math.max(0.01, uq)); c.cuad.rotation.z = (1 - uq) * 1.2; c.cuad.position.set(p.cuad[0], -p.cuad[1], 0);
        }
      }
      const um = E.vivo(tramo(u, 0.79, 0.81)); mentaM.visible = um > 0.01; mentaM.scale.setScalar(Math.max(0.01, 3.7 * K * um)); mentaM.position.set(MENTA[0], -MENTA[1], 0);
      // de canto al nacer, se pone de frente; luego, la vuelta de moneda y el reposo, flotando
      const moneda = TAU * E.firme(tramo(u, 0.845, 0.93)), flota = tramo(u, 0.86, 0.9);
      logo.rotation.set(0, mezcla(-0.55, 0, E.seno(tramo(u, 0.7, 0.84))) + moneda + 0.07 * Math.sin(reloj * 0.35) * flota, 0);
      logo.position.y = Y_L + 3 * Math.sin(reloj * 0.7) * flota;
    }
    // el suelo y su reflejo aparecen bajo el logo
    const vs = E.eo(tramo(u, 0.78, 0.88));
    suelo.visible = charcoL.visible = espejo.visible = vs > 0.001;
    suelo.material.opacity = 0.965 * vs; charcoL.material.color.setHex(COL.cuerda).multiplyScalar(0.1 * vs);
    if (espejo.visible) {
      logo.updateMatrix();
      for (let i = 1; i < orig.length; i++) { const o = orig[i], c = copia[i]; c.position.copy(o.position); c.quaternion.copy(o.quaternion); c.scale.copy(o.scale); c.visible = o.visible; }
      espejo.matrix.multiplyMatrices(REFLEJO, logo.matrix); espejo.matrixWorldNeedsUpdate = true;
    }
  }

  // el punto en el u de la página: la apertura en lo alto, la caída por el hueco y, después, el guion de antes
  function moverPuntoN(u, reloj, d) {
    const uo = Q(u);
    moverPunto(uo, reloj, d);
    if (u < S0) {
      pt.grupo.position.y += HS; reflejoP.position.y += HS; charcoP.position.y = HS + 0.04;
      if (polvo.visible) { for (let i = 0; i < NPV; i++) pvPos[i * 3 + 1] += HS; polvo.geometry.attributes.position.needsUpdate = true; }
      return;
    }
    charcoP.position.y = 0.04;
    if (u >= 0.36) return;
    // cae: se estira en la dirección de la caída; al llegar a la plaza se aplasta y vuelve con un muelle
    const r = pt.esfera.scale.y > 0 ? Math.max(0.5, d * 0.006) : 0.5, s2 = tramo(u, S0, S1);
    pt.grupo.position.y = yCaida(u, r);
    const vel2 = s2 > 0 && s2 < 1 ? Math.min(1, 1.6 * Math.pow(s2, 0.6)) : 0, tq = tramo(u, S1, S1 + 0.016), ap = tq > 0 && tq < 1 ? 1 - E.rebote(tq) : 0;
    const k = r / Math.max(1e-4, pt.esfera.scale.x);
    pt.esfera.scale.set(r * (1 - 0.18 * vel2 + 0.35 * ap), r * (1 + 0.4 * vel2 - 0.4 * ap), r * (1 - 0.18 * vel2 + 0.35 * ap));
    pt.halo.scale.multiplyScalar(k);
    if (ap > 0) pt.grupo.position.y -= r * ap * 0.4;
    reflejoP.visible = charcoP.visible = false;
    // el polvo de la rotura: cae del borde del hueco con los paneles y se apaga
    const vp = (1 - tramo(u, 0.2, 0.26)) * tramo(u, 0.176, 0.18);
    polvo.visible = vp > 0.001;
    if (polvo.visible) {
      for (let i = 0; i < NPV; i++) {
        const f = pvBase[i * 4 + 3], tt = Math.max(0, (u - 0.1765 - f * 0.004) / (S1 - S0));
        const ang = (pvBase[i * 4] + 11) / 22 * TAU, rad = 1 + Math.abs(pvBase[i * 4 + 2]) * 0.6;
        pvPos[i * 3] = Math.cos(ang) * rad * (1 + tt * 3); pvPos[i * 3 + 1] = HS - HS * (0.55 + 0.4 * f) * Math.pow(tt, 1.6) + 0.3; pvPos[i * 3 + 2] = Math.sin(ang) * rad * (1 + tt * 3);
        const b2 = vp * 0.5 * (0.4 + 0.6 * f); pvCol[i * 3] = b2; pvCol[i * 3 + 1] = b2 * 0.85; pvCol[i * 3 + 2] = b2 * 0.7;
      }
      polvo.geometry.attributes.position.needsUpdate = true; polvo.geometry.attributes.color.needsUpdate = true;
    }
  }

  // ── el sonido: el montaje mecánico del logo, encaje a encaje, con el scroll (solo si el visitante lo activó) ──
  const TONO = { U: 0.85, E: 1.05, V: 0.95, A: 1.2 };
  function sonidoRotura(u) {
    const S2 = window.SONIDO; if (!S2) return;
    S2.cruce('fin-impacto', u, 0.17, 'impacto', { v: 0.32 });
    S2.cruce('fin-impacto-chapa', u, 0.1702, 'clank', { tono: 0.45, v: 0.18 });
    S2.cruce('fin-rotura', u, 0.1755, 'rotura', { v: 0.5 });
    S2.cruce('fin-aterriza', u, S1, 'clank', { tono: 0.62, v: 0.12 });
  }
  function sonido(u) {
    const S2 = window.SONIDO; if (!S2) return;
    S2.cruce('fin-lluvia', u, 0.24, 'subida', { dur: 2.4, v: 0.045 });
    S2.cruce('fin-anillo', u, 0.7, 'servo', { dur: 0.7, de: 90, a: 260, v: 0.07 });
    for (const ch of ORDEN) {
      const c = LG[ch];
      S2.cruce('fin-va-' + ch, u, c.t0 + 0.004, c.k % 2 ? 'trinquete' : 'servo', { dur: 0.32, de: 130 + c.k * 40, a: 380 + c.k * 70, v: 0.06 });
      S2.cruce('fin-encaja-' + ch, u, c.t0 + 0.03, 'clank', { tono: TONO[ch], v: 0.26 });
      S2.cruce('fin-conector-' + ch, u, c.tc + 0.012, 'clank', { tono: 1.7 + c.k * 0.1, v: 0.1 });
    }
    S2.cruce('fin-menta', u, 0.795, 'clank', { tono: 2.1, v: 0.14 });
    S2.cruce('fin-cierra', u, 0.81, 'impacto', { v: 0.42 });
  }

  // ── el punto: solo, en la plaza, sobre la red y, al final, en el centro del logo ──
  function moverPunto(u, reloj, d) {
    const s = inhalado(u), lat = latido(u), nace = E.suave(tramo(u, 0.01, 0.075)), chispa = 0, cd = caida(u);
    const vis = E.eo(tramo(u, 0.47, 0.51));
    // nace un poco más alto y se asienta, como una gota que encuentra su sitio
    let r = Math.max(0.5, d * 0.0036);
    // flota con una respiración lenta; al final de la frase cae con gravedad y se posa sobre la malla
    const flota = 2.2 + 0.08 * Math.sin(reloj * 0.9) * (1 - cd);
    let y = mezcla(flota, r, cd) + vis * (PIL.h * F + r * 1.4);
    if (u > 0.62) y = Y_L * (1 - s) + s * y;
    if (u > 0.69) r = mezcla(r, 1.8 * K * 1.3, E.eo(tramo(u, 0.69, 0.72)));
    // en el logo, el punto late cada vez que una pieza llega a su sitio
    let lee = 0; for (const ch of ORDEN) lee += 0.7 * Math.sin(Math.PI * tramo(u, LG[ch].t0 + 0.03, LG[ch].t0 + 0.045));
    lee += 0.9 * Math.sin(Math.PI * tramo(u, 0.79, 0.81)) + 2.5 * Math.sin(Math.PI * tramo(u, 0.686, 0.705));
    const respira = 1 + 0.035 * Math.sin(reloj * 0.9), esc = respira * (1 + 0.3 * lat + 0.25 * lee);
    const brilla = Math.max(0.001, nace) * (1 + 0.6 * lat + 0.5 * lee + 0.35 * Math.sin(Math.PI * tramo(u, 0.205, 0.24)));
    pt.poner(0, u > 0.69 ? logo.position.y : y, 0, r * esc * Math.max(0.001, nace), brilla);
    // en el aire, la caída lo estira un poco; al tocar, se aplasta y vuelve con un muelle
    const tq = tramo(u, 0.205, 0.226), st = cd > 0 && cd < 1 ? 0.18 * cd : 0, ap = tq > 0 && tq < 1 ? 1 - E.rebote(tq) : 0;
    pt.esfera.scale.set(pt.esfera.scale.x * (1 - st * 0.4 + ap * 0.35), pt.esfera.scale.y * (1 + st - ap * 0.4), pt.esfera.scale.z * (1 - st * 0.4 + ap * 0.35));
    if (u < 0.3) pt.grupo.position.y -= r * ap * 0.4;
    pt.luz.intensity *= mezcla(0.0, 1, tramo(u, 0.2, 0.26));               // a oscuras, la luz del punto en el suelo la pone el charco: la luz real dejaba un brillo estirado en el esmalte
    pt.luz.distance = r * mezcla(46, 2.5, tramo(u, 0.37, 0.45) * (1 - tramo(u, 0.69, 0.72)));   // a escala de mapa, su luz no debe barrer media España
    // reflejo y charco: solo en el arranque, mientras la cámara está a ras del suelo
    const apa = 1 - tramo(u, 0.21, 0.28), yp = pt.grupo.position.y;
    reflejoP.visible = charcoP.visible = apa > 0.001;
    reflejoP.position.set(0, -yp, 0); reflejoP.scale.setScalar(r * 6 * esc); reflejoP.material.opacity = 0.22 * brilla * apa * nace;
    // el charco de luz se estrecha y se aviva a medida que el punto baja: la luz se acerca al suelo
    charcoP.scale.setScalar(mezcla(3.2, 1.6, cd)); charcoP.material.color.setHex(COL.ambar).multiplyScalar(mezcla(0.12, 0.3, cd) * Math.min(2, brilla) * apa);
    // el polvo: apenas unas motas que flotan despacio en su luz (sin soplar: la marca no grita)
    polvo.visible = apa > 0.001;
    if (polvo.visible) {
      const sopla = 0, vpv = 0.45 * E.eo(tramo(u, 0.02, 0.1)) * apa;
      for (let i = 0; i < NPV; i++) {
        const f = pvBase[i * 4 + 3], t = reloj * (0.05 + 0.08 * f) + f * 40;
        let x = pvBase[i * 4] + 0.6 * Math.sin(t), py = pvBase[i * 4 + 1] + 0.35 * Math.sin(t * 0.7 + 2), z = pvBase[i * 4 + 2] + 0.6 * Math.cos(t * 0.8);
        const dx = x, dy = py - yp, dz = z, dd = Math.hypot(dx, dy, dz) || 1;
        const em = 1 + sopla * 9 / (0.6 + dd * 0.25); x = dx * em; py = yp + dy * em; z = dz * em;
        pvPos[i * 3] = x; pvPos[i * 3 + 1] = Math.max(0.05, py); pvPos[i * 3 + 2] = z;
        const luz = vpv * Math.min(1.4, brilla) * (0.12 + 2.4 / (1 + dd * dd * 0.08)) * (0.4 + 0.6 * f) * (1 - 0.6 * sopla);
        pvCol[i * 3] = luz; pvCol[i * 3 + 1] = luz * 0.72; pvCol[i * 3 + 2] = luz * 0.42;
      }
      polvo.geometry.attributes.position.needsUpdate = true; polvo.geometry.attributes.color.needsUpdate = true;
    }
  }

  // ════════════════════════════════════════════════════════════════════
  //  La rotura: el arranque ocurre en lo alto (HS metros sobre la ciudad). El suelo es un disco de paneles
  //  que encajan sin juntas (anillos y sectores con las esquinas desplazadas y compartidas), un borde que
  //  aguanta y un anillo que sigue hasta el horizonte. Las grietas son las juntas de esos paneles.
  // ════════════════════════════════════════════════════════════════════
  const HS = 320, RA = [0, 1.1, 2.4, 4.0, 6.0, 8.6, 12.0, 16.0], NS = 14, HUECO = 6, GROSOR = 0.4;
  const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  const esquina = (ib, js) => { if (ib === 0) return [0, 0]; const j = ((js % NS) + NS) % NS, borde = ib === RA.length - 1;
    const r = RA[ib] * (borde ? 1 : 1 + (hash(ib, j) - 0.5) * 0.22), a = (j + (borde ? 0 : (hash(j, ib) - 0.5) * 0.5)) / NS * TAU; return [Math.cos(a) * r, Math.sin(a) * r]; };
  const medioArco = (ib, js) => { if (ib === 0) return [0, 0]; const j = ((js % NS) + NS) % NS, borde = ib === RA.length - 1;
    const r = RA[ib] * (borde ? 1 : 1 + (hash(ib + 9, j) - 0.5) * 0.18), a = (j + 0.5 + (borde ? 0 : (hash(j + 5, ib) - 0.5) * 0.3)) / NS * TAU; return [Math.cos(a) * r, Math.sin(a) * r]; };
  const medioRadio = (ib, js) => { const a = esquina(ib, js), b = esquina(ib + 1, js), dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, k = (hash(ib + 3, js + 7) - 0.5) * 0.35 * L;
    return [(a[0] + b[0]) / 2 - dz / L * k, (a[1] + b[1]) / 2 + dx / L * k]; };
  const celdas = [], rp = [], rn = [], rr = [];
  for (let ib = 0; ib < RA.length - 1; ib++) for (let js = 0; js < NS; js++) {
    const pts = [esquina(ib, js), medioArco(ib, js), esquina(ib, js + 1), medioRadio(ib, js + 1), esquina(ib + 1, js + 1), medioArco(ib + 1, js), esquina(ib + 1, js), medioRadio(ib, js)];
    const lim = []; for (const q of pts) if (!lim.length || Math.hypot(q[0] - lim[lim.length - 1][0], q[1] - lim[lim.length - 1][1]) > 1e-4) lim.push(q);
    const g = new T3.ExtrudeGeometry(new T3.Shape(lim.map(([x, z]) => new T3.Vector2(x, -z))), { depth: GROSOR, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); g.translate(0, HS - GROSOR, 0);
    const P = g.attributes.position, Nn = g.attributes.normal, c = lim.reduce((a2, q) => [a2[0] + q[0] / lim.length, a2[1] + q[1] / lim.length], [0, 0]);
    const ini = rp.length / 3;
    for (let i = 0; i < P.count; i++) { rp.push(P.getX(i), P.getY(i), P.getZ(i)); rn.push(Nn.getX(i), Nn.getY(i), Nn.getZ(i)); rr.push(P.getX(i), P.getZ(i)); }
    const dist = Math.hypot(c[0], c[1]), cae = ib < HUECO, eje = new T3.Vector3(hash(ib, js + 1) - 0.5, (hash(js, ib + 2) - 0.5) * 0.6, hash(ib + 4, js) - 0.5).normalize();
    celdas.push({ ini, n: P.count, c: new T3.Vector3(c[0], HS - GROSOR / 2, c[1]), dir: new T3.Vector3(c[0], 0, c[1]).normalize(), cae,
      tb: 0.1762 + 0.0075 * dist / RA[HUECO] + hash(ib + 11, js) * 0.0018, k: 0.88 + hash(ib, js + 13) * 0.24, vr: 0.25 + hash(js + 17, ib) * 0.75, w: (4 + hash(ib + 19, js) * 7) * (hash(js, ib + 23) < 0.5 ? -1 : 1), eje });
    g.dispose();
  }
  const geoSuelo = new T3.BufferGeometry();
  geoSuelo.setAttribute('position', new T3.BufferAttribute(new Float32Array(rp), 3)); geoSuelo.setAttribute('normal', new T3.BufferAttribute(new Float32Array(rn), 3)); geoSuelo.setAttribute('aRest', new T3.BufferAttribute(new Float32Array(rr), 2));
  geoSuelo.boundingSphere = new T3.Sphere(new T3.Vector3(0, HS, 0), 1e5);
  const restP = new Float32Array(rp), restN = new Float32Array(rn);
  // el anillo de suelo que sigue hasta el horizonte (encaja con el borde: 28 lados, radio 16)
  const geoAnillo = new T3.RingGeometry(RA[RA.length - 1], 3000, NS * 2, 1).rotateX(-Math.PI / 2).translate(0, HS, 0);
  { const P = geoAnillo.attributes.position, a = new Float32Array(P.count * 2); for (let i = 0; i < P.count; i++) { a[i * 2] = P.getX(i); a[i * 2 + 1] = P.getZ(i); } geoAnillo.setAttribute('aRest', new T3.BufferAttribute(a, 2)); }
  // el material del suelo alto: el esmalte negro de la losa, con la trama de 0,75 m que se enciende desde el golpe
  const US = { uFr: { value: 0 }, uOpS: { value: 0 } };
  const matSuelo = esmalte(0x070a10, { roughness: 0.85, clearcoat: 0, envMap: ctx.entorno, envMapIntensity: 0.002 });
  matSuelo.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, US);
    sh.vertexShader = 'attribute vec2 aRest;\nvarying vec2 vRest;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = aRest;');
    sh.fragmentShader = `varying vec2 vRest; uniform float uFr, uOpS;
      float tramaS(vec2 p, float paso) { vec2 q = p / paso, fw = max(fwidth(q), vec2(1e-5)); vec2 g = abs(fract(q - 0.5) - 0.5) / fw; return (1.0 - min(min(g.x, g.y), 1.0)) * clamp(1.4 - max(fw.x, fw.y) * 5.0, 0.0, 1.0); }
      ` + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        float d = length(vRest), dentro = smoothstep(uFr, uFr - 6.0, d) * smoothstep(90.0, 30.0, d);
        float l = tramaS(vRest, 0.75) * 0.45 + tramaS(vRest, 7.5) * 0.8;
        totalEmissiveRadiance += vec3(0.30, 0.42, 0.58) * l * dentro * uOpS + vec3(0.4, 0.78, 0.98) * exp(-abs(d - uFr) / 1.6) * uOpS * 0.8 * (0.3 + l);
      }`);
  };
  const suelo2 = new T3.Mesh(geoSuelo, matSuelo); suelo2.receiveShadow = true; suelo2.frustumCulled = false; escena.add(suelo2);
  const anilloS = new T3.Mesh(geoAnillo, matSuelo); anilloS.receiveShadow = true; escena.add(anilloS);
  // las grietas: las juntas de los paneles; corren desde el golpe, ámbar cerca y cian en la punta
  const gp = [], gt = [], gr = [];
  const tramoG = (a, b, t0) => { gp.push(a[0], HS + 0.03, a[1], b[0], HS + 0.03, b[1]); const ra = Math.hypot(a[0], a[1]) / 16, rb = Math.hypot(b[0], b[1]) / 16; gt.push(ra + t0, rb + t0); gr.push(ra, rb); };
  for (let js = 0; js < NS; js++) {
    const t0 = hash(js, 99) * 0.08;
    for (let ib = 0; ib < RA.length - 1; ib++) { tramoG(esquina(ib, js), medioRadio(ib, js), t0); tramoG(medioRadio(ib, js), esquina(ib + 1, js), t0); }
    for (let ib = 1; ib < RA.length - 1; ib++) { const t1 = 0.1 + hash(ib, js) * 0.06; tramoG(esquina(ib, js), medioArco(ib, js), t1); tramoG(medioArco(ib, js), esquina(ib, js + 1), t1); }
  }
  const UG2 = { uFront: { value: 0 }, uHueco: { value: 0 }, uOpG: { value: 0 } };
  const geoG = new T3.BufferGeometry(); geoG.setAttribute('position', new T3.Float32BufferAttribute(gp, 3)); geoG.setAttribute('aT', new T3.Float32BufferAttribute(gt, 1)); geoG.setAttribute('aR', new T3.Float32BufferAttribute(gr, 1));
  const grietas = new T3.LineSegments(geoG, new T3.ShaderMaterial({ uniforms: UG2, transparent: true, depthWrite: false, blending: T3.AdditiveBlending,
    vertexShader: 'attribute float aT, aR; varying float vT, vR; void main() { vT = aT; vR = aR; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uFront, uHueco, uOpG; varying float vT, vR;
      void main() {
        if (vT > uFront || vR < uHueco) discard;
        vec3 c = mix(vec3(1.0, 0.62, 0.12), vec3(0.34, 0.86, 0.9), smoothstep(0.08, 0.7, vR));
        float punta = exp(-(uFront - vT) * 10.0);
        gl_FragColor = vec4(c * (0.55 + 2.2 * punta) * uOpG, 1.0);
      }` }));
  grietas.frustumCulled = false; escena.add(grietas);

  // la escolta: piezas J que caen junto al punto, en capas cerca y lejos, con su estela cian
  const NEs = 320, escDef = [];
  for (let i = 0; i < NEs; i++) {
    const cerca2 = aleatorio() < 0.25, r = cerca2 ? 16 + aleatorio() * 26 : 42 + aleatorio() * 220, a = aleatorio() * TAU;   // capa cerca y capa lejos; ninguna tapa el punto
    escDef.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, o: -150 + aleatorio() * 190, v: 0.72 + aleatorio() * 0.6, ry: aleatorio() * TAU, gira: (aleatorio() - 0.5) * 3, sx: aleatorio() < 0.5 ? 6 : 4.5, sz: 2.4, est: 22 + aleatorio() * 40 });
  }
  const escolta = instancias(escena, new T3.BoxGeometry(1, 1, 1), esmalte(COL.blanco, { roughness: 0.4, clearcoat: 0.5 }), NEs, 0xffffff);
  escDef.forEach((e, i) => { const k = 0.42 + aleatorio() * 0.25; escolta.setColorAt(i, new T3.Color(k, k * 1.03, k * 1.1)); });   // grises: la luz la ponen las estelas
  const escPos = new Float32Array(NEs * 6), escCol = new Float32Array(NEs * 6);
  const estelasE = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(escPos, 3)).setAttribute('color', new T3.BufferAttribute(escCol, 3)),
    new T3.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false }));
  estelasE.frustumCulled = false; escena.add(estelasE);

  // la caída del punto: del suelo roto (0.178) a la plaza (0.33), acelerando
  const S0 = 0.178, S1 = 0.33, fCaida = (u) => Math.pow(tramo(u, S0, S1), 1.6);
  const yCaida = (u, r) => mezcla(HS + r, r, fCaida(u));
  // el guion de antes, en el u de la página: la apertura dura lo mismo; la obra sigue durante la caída
  const QM = [[0, 0], [0.17, 0.205], [0.36, 0.355], [0.4, 0.362], [1, 1]];
  function Q(u) { let i = 0; while (i < QM.length - 2 && u > QM[i + 1][0]) i++; const a = QM[i], b2 = QM[i + 1]; return mezcla(a[1], b2[1], tramo(u, a[0], b2[0])); }
  const qa = new T3.Quaternion(), va = new T3.Vector3(), vb = new T3.Vector3();
  let uRot = -1;
  function rotura(u, reloj) {
    const enAlto = u < 0.27;
    suelo2.visible = u < 0.36; anilloS.visible = enAlto; grietas.visible = u > 0.169 && u < 0.26;
    // la trama del suelo alto se enciende desde el golpe; las grietas corren y se apagan donde el suelo ya cayó
    US.uFr.value = mezcla(0, 70, E.eo(tramo(u, 0.17, 0.2))); US.uOpS.value = E.eo(tramo(u, 0.17, 0.174)) * (1 - tramo(u, 0.2, 0.23));
    UG2.uFront.value = mezcla(0, 1.25, E.eo(tramo(u, 0.1695, 0.1765))); UG2.uOpG.value = E.eo(tramo(u, 0.1695, 0.171)) * (1 - tramo(u, 0.19, 0.215));
    UG2.uHueco.value = mezcla(0, 0.76, tramo(u, 0.1765, 0.186));
    // los paneles: en reposo antes del golpe; luego cada uno cae con su giro, su deriva y su gravedad
    if (u !== uRot && u < 0.37) {
      uRot = u;
      const P = geoSuelo.attributes.position.array, Nn = geoSuelo.attributes.normal.array;
      for (const c of celdas) {
        let tt = c.cae && u > c.tb ? (u - c.tb) / (S1 - S0) : 0;
        const caida = HS * c.k * Math.pow(tt, 1.6) + 0.35 * Math.sin(Math.PI * Math.min(1, tt * 40)) * -1, sale = c.vr * tt * 26;
        const lejos = caida > HS - 4;
        qa.setFromAxisAngle(c.eje, c.w * tt * (1 - 0.5 * tt));
        for (let i = c.ini, f = c.ini + c.n; i < f; i++) {
          if (lejos) { P[i * 3 + 1] = -1e4; continue; }
          va.set(restP[i * 3] - c.c.x, restP[i * 3 + 1] - c.c.y, restP[i * 3 + 2] - c.c.z).applyQuaternion(qa);
          P[i * 3] = va.x + c.c.x + c.dir.x * sale; P[i * 3 + 1] = va.y + c.c.y - caida; P[i * 3 + 2] = va.z + c.c.z + c.dir.z * sale;
          vb.set(restN[i * 3], restN[i * 3 + 1], restN[i * 3 + 2]).applyQuaternion(qa); Nn[i * 3] = vb.x; Nn[i * 3 + 1] = vb.y; Nn[i * 3 + 2] = vb.z;
        }
      }
      geoSuelo.attributes.position.needsUpdate = true; geoSuelo.attributes.normal.needsUpdate = true;
    }
    // la escolta: aparece al romperse el suelo y cae con el punto, unas piezas más rápido y otras más despacio
    const ve = u > 0.177 && u < 0.36;
    estelasE.visible = escolta.visible = ve;
    if (ve) {
      const f = fCaida(u), yp = yCaida(u, 0.5);
      for (let i = 0; i < NEs; i++) {
        const e = escDef[i], y = yp + e.o - HS * f * (e.v - 1), k = i * 6, oculta = y < 1 || (y > HS - 1 && u < 0.27);
        poner(escolta, i, e.x, y, e.z, oculta ? 0 : e.sx, oculta ? 0 : 0.3, oculta ? 0 : e.sz, e.ry + e.gira * f);
        if (!oculta) {
          const b2 = 0.45 + 0.7 * Math.min(1, e.v * 1.6 * Math.pow(Math.max(f, 1e-3), 0.375));
          escPos[k] = e.x; escPos[k + 1] = y + 0.3; escPos[k + 2] = e.z; escPos[k + 3] = e.x; escPos[k + 4] = y + 0.3 + e.est; escPos[k + 5] = e.z;
          escCol[k] = 0.34 * b2; escCol[k + 1] = 0.86 * b2; escCol[k + 2] = 0.9 * b2; escCol[k + 3] = escCol[k + 4] = escCol[k + 5] = 0;
        } else { escPos[k + 1] = escPos[k + 4] = -1e5; escCol[k] = escCol[k + 1] = escCol[k + 2] = 0; }
      }
      estelasE.geometry.attributes.position.needsUpdate = true; estelasE.geometry.attributes.color.needsUpdate = true; listo(escolta);
    }
  }
  const CLAVES = ['x', 'y', 'z', 'lado', 'el', 'ox', 'oy', 'd'], c0 = { x: 0, y: 0, z: 0, lado: 0, el: 0, ox: 0, oy: 0, d: 1 };
  // la cámara de la caída: mira el golpe, se asoma al hueco, lo cruza y cae con el punto, girando despacio
  function encuadrarN(u, reloj) {
    const ak = aspecto(), akL = Math.min(ak, 1.35), dP = 15 * ak;
    if (u < 0.178) { plano(Q(Math.min(u, 0.17)), reloj); cam.y += HS; cam.y -= 0.25 * Math.sin(Math.PI * tramo(u, 0.17, 0.178)); return aplicar(Q(u), reloj); }
    if (u >= 0.36) { plano(Q(u), reloj); return aplicar(Q(u), reloj); }
    const r = 0.5, yp = yCaida(u, r), w0 = E.eio(tramo(u, 0.176, 0.2)), w1 = E.eio(tramo(u, 0.2, 0.26)), w2 = E.eio(tramo(u, 0.222, 0.27));
    const sig = mezcla(HS + 1.0, yp, E.eio(tramo(u, 0.178, 0.205)));
    cam.x = 0; cam.z = 0; cam.y = sig; cam.ox = 0; cam.oy = PL.punto.oy * (1 - w0);
    cam.d = lmez(lmez(dP * 0.92, 32 * akL, w0), 78 * akL, w1);
    cam.el = mezcla(mezcla(0.16, 1.47, w0), 0.96, w2); cam.lado = -0.22 + 1.25 * E.seno(tramo(u, 0.18, 0.36));
    // al final de la caída, la cámara se funde con el plano de antes: baja y mira la ciudad de lado
    const wb = E.eio(tramo(u, 0.312, 0.36));
    if (wb > 0) {
      for (const k of CLAVES) c0[k] = cam[k]; plano(Q(u), reloj);
      for (const k of CLAVES) if (k !== 'd') cam[k] = mezcla(c0[k], cam[k], wb);
      cam.d = lmez(c0.d, cam.d, wb);
    }
    return aplicar(Q(u), reloj, 1 - wb);
  }

  // normales suaves en los cantos redondeados y vivas en las esquinas (la de la apertura)
  function normalesSuaves(g, grados = 40) {
    const p = g.attributes.position, n = p.count / 3, fn = new Float32Array(n * 3), cl = Math.cos(grados * Math.PI / 180), mapa2 = new Map();
    const a = new T3.Vector3(), bb = new T3.Vector3(), c = new T3.Vector3(), clave = (q) => `${Math.round(p.getX(q) * 50)},${Math.round(p.getY(q) * 50)},${Math.round(p.getZ(q) * 50)}`;
    for (let f = 0; f < n; f++) {
      a.fromBufferAttribute(p, f * 3); bb.fromBufferAttribute(p, f * 3 + 1); c.fromBufferAttribute(p, f * 3 + 2);
      c.sub(bb); a.sub(bb); c.cross(a); fn[f * 3] = c.x; fn[f * 3 + 1] = c.y; fn[f * 3 + 2] = c.z;
      for (let k = 0; k < 3; k++) { const ck = clave(f * 3 + k); let l = mapa2.get(ck); if (!l) mapa2.set(ck, l = []); l.push(f); }
    }
    const out = new Float32Array(p.count * 3), nf = new T3.Vector3(), ng = new T3.Vector3(), suma = new T3.Vector3();
    for (let f = 0; f < n; f++) {
      nf.fromArray(fn, f * 3).normalize();
      for (let k = 0; k < 3; k++) {
        const q = f * 3 + k; suma.set(0, 0, 0);
        for (const g2 of mapa2.get(clave(q))) { ng.fromArray(fn, g2 * 3); const lg = ng.length(); if (lg > 0 && nf.dot(ng) / lg > cl) suma.add(ng); }
        if (suma.lengthSq() === 0) suma.copy(nf); suma.normalize(); out[q * 3] = suma.x; out[q * 3 + 1] = suma.y; out[q * 3 + 2] = suma.z;
      }
    }
    g.setAttribute('normal', new T3.BufferAttribute(out, 3)); return g;
  }

  return {
    escena, camara, fondo: plato.fondo,
    medir(w, h) { W = w; H = h; camAux.fov = camara.fov; huecos(); medido = -9; },
    actualizar(u, reloj) {
      if (reloj - medido > 1) { medido = reloj; huecos(); }
      const uo = Q(u), d = encuadrarN(u, reloj);
      fotograma(uo, reloj, d);
      rotura(u, reloj);
      moverPuntoN(u, reloj, d);
      sonido(uo); sonidoRotura(u);
      const vv = Math.round(100 * tramo(uo, 0.375, 0.41) * (1 - tramo(uo, 0.6, 0.63))) / 100;
      if (vv !== veloV) { veloV = vv; velo.style.opacity = vv; }
    },
  };
});

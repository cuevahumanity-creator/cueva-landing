// ─────────────────────────────────────────────────────────────────────
//  Capítulo «red»: la red no se mira, se ocupa.
//  1. El mapa es una losa prefabricada: el contorno de España (península, Baleares y Canarias en su
//     recuadro), extruido en esmalte de noche. Baja colgada de una grúa, con su eslinga de cuatro
//     ramales, mientras una pluma de luz dibuja la costa. Toca el suelo con peso, la eslinga se
//     recoge y la trama se extiende desde Madrid por todo el territorio. Portugal no está en los
//     datos, así que no se dibuja: Lisboa espera en el suelo, fuera de la losa.
//  2. Los libres nacen como aros discontinuos, en una onda que sale de Madrid. Las grúas bajan los
//     pilares de Madrid y Menorca, que encajan con un clic, encienden su charco y su haz menta.
//     El de Barcelona baja y se queda colgado sobre su aro a medio hacer: está en implantación.
//  3. El punto ámbar cae sobre Madrid. Junto al pilar, el molde da tres piezas: cada una sale con su
//     lectura (identidad desde la fábrica), se apila (acopio) y la de arriba se va (expedición).
//  4. El punto se agacha, el pilar se comprime y lo lanza: vuela en parábola a Menorca (rápido al
//     salir, suspendido arriba), con su estela y su hilo. Al caer, la isla entera acusa el golpe y se
//     tiñe de menta: es una licencia territorial. Brotan su cantera y su planta de hormigón.
//  5. Cómo se abre un punto: en un trozo de territorio vacío, sin nombre (es ilustrativo, no un anuncio),
//     el punto ámbar acompaña los seis pasos de DATOS.PASOS. Primero lee la nave que ya existe: qué
//     componente fabrica (una pieza tipo), en qué material (hormigón, madera o acero, ilustrativo) y su
//     nivel de digitalización y automatización (una escala que sube, sin cifras). Luego, el diagnóstico (huella y barrido),
//     la comarca trazada con luz, los moldes que baja la grúa y la serie cero leída y verificada, el
//     equipo certificado con sus aros menta y la primera pieza que sale hacia su obra. El nodo queda
//     «en marcha», a media luz; después todo se recoge.
//  6. El punto vuelve a velar Madrid; un hilo discontinuo ion va a Barcelona. Debajo, los tramos;
//     arriba, el mapa en calma. Ahí los nodos se pueden señalar: se elevan y dicen qué son, y sobre
//     un territorio libre empieza a bajar un pilar: está por ocupar.
//  Todo es función de u (y del reloj para lo que respira); el puntero solo añade. La cámara encaja
//  cada plano en el hueco que dejan los textos del HTML, medidos en la página.
// ─────────────────────────────────────────────────────────────────────
CUEVA.capitulo('red', (ctx) => {
  const { T3, E, mezcla, tramo, COL, esmalte, estudio, punto, mirar, distancia, DATOS } = ctx;
  const escena = new T3.Scene(), camara = new T3.PerspectiveCamera(28, 1, 1, 10000);
  const plato = estudio(escena, { foco: 3.2 });
  const TAU = Math.PI * 2;

  // ── la proyección: equirectangular con la corrección de cos(40°); Canarias, en su recuadro al suroeste ──
  const S = 100, LAT0 = 40, LON0 = -3.4, KX = Math.cos(LAT0 * Math.PI / 180);
  const CAN = { lon: -15.79, lat: 28.465, alon: -8.45, alat: 34.75 }; CAN.kx = Math.cos(CAN.lat * Math.PI / 180);   // cada recuadro, con su propia corrección
  function proy(lon, lat, v = new T3.Vector3()) {
    if (lat < 31) return v.set(((lon - CAN.lon) * CAN.kx + (CAN.alon - LON0) * KX) * S, 0, -((lat - CAN.lat) + CAN.alat - LAT0) * S);
    return v.set((lon - LON0) * KX * S, 0, -(lat - LAT0) * S);
  }

  // ── la losa: el contorno extruido, con bisel; arriba, a la altura ALTO ──
  const BT = 1.3, DL = 15, ALTO = DL + 2 * BT;
  const NODO = Object.fromEntries(DATOS.RED.map((n) => [n.k, n]));
  const pMen = proy(NODO.menorca.lon, NODO.menorca.lat);
  const formas = [], polis = [], costa = [], costaT = [], costaMen = [], costaMenT = [], marcoCan = [], cajaMapa = new T3.Box3(), cajaMen = new T3.Box2(), cajaCan = new T3.Box2();
  let pluma = null;                                                         // la costa de la península, para que la pluma de luz la recorra
  for (const pol of window.CONTORNO || []) {
    const pts = [];
    for (const [lon, lat] of pol) { const v = proy(lon, lat), q = new T3.Vector2(v.x, -v.z); if (!pts.length || q.distanceTo(pts[pts.length - 1]) > 0.05) pts.push(q); }
    if (pts.length > 2 && pts[0].distanceTo(pts[pts.length - 1]) < 0.05) pts.pop();
    if (pts.length < 3) continue;
    formas.push(new T3.Shape(pts)); polis.push(pts);
    const bb = new T3.Box2().setFromPoints(pts), esMen = bb.containsPoint(new T3.Vector2(pMen.x, -pMen.z));
    if (esMen) cajaMen.copy(bb);
    if (pol[0][1] < 31) cajaCan.union(bb);
    // cada tramo de costa lleva su avance (0 a 1) a lo largo de su isla: así la pluma las dibuja todas a la vez
    const L = [0]; for (let i = 0; i < pts.length; i++) L.push(L[i] + pts[i].distanceTo(pts[(i + 1) % pts.length]));
    const tot = L[pts.length], dest = esMen ? costaMen : costa, destT = esMen ? costaMenT : costaT, y = ALTO - BT + 0.3;   // el canto: donde el bisel empieza a doblar
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; dest.push(a.x, y, -a.y, b.x, y, -b.y); destT.push(L[i] / tot, L[i + 1] / tot); }
    if (!pluma || pts.length > pluma.pts.length) pluma = { pts, t: L.map((l) => l / tot) };
    for (const q of pts) cajaMapa.expandByPoint(new T3.Vector3(q.x, 0, -q.y));
  }
  // el recuadro de Canarias: una escuadra fina en el suelo, como en los mapas de siempre
  if (!cajaCan.isEmpty()) {
    const m = 26, x0 = cajaCan.min.x - m, x1 = cajaCan.max.x + m, n0 = cajaCan.min.y - m, n1 = cajaCan.max.y + m;
    marcoCan.push(x0, 0.4, -n1, x1, 0.4, -n1, x1, 0.4, -n1, x1, 0.4, -n0);
  }
  const geoLosa = new T3.ExtrudeGeometry(formas, { depth: DL, bevelEnabled: true, bevelThickness: BT, bevelSize: 1.2, bevelOffset: -1.2, bevelSegments: 2, curveSegments: 1 });
  geoLosa.rotateX(-Math.PI / 2); geoLosa.translate(0, BT, 0); normalesSuaves(geoLosa, 50);

  const NODOS = DATOS.RED, MADp = proy(NODO.madrid.lon, NODO.madrid.lat);
  // esmalte de noche: la trama se extiende desde Madrid con un frente de luz; Menorca se tiñe y acusa el golpe
  const UL = { uLuzPunto: { value: 0 }, uTrama: { value: 0.1 }, uMen: { value: 0 }, uMenY: { value: 0 }, uAlto: { value: ALTO },
    uCajaMen: { value: new T3.Vector4(cajaMen.min.x, -cajaMen.max.y, cajaMen.max.x, -cajaMen.min.y) }, uFrente: { value: new T3.Vector4(MADp.x, MADp.z, 0, 0) } };
  const matLosa = esmalte(0x070a10, { roughness: 0.42, clearcoatRoughness: 0.2, envMapIntensity: 0.17 });
  const LUCES = (cuanto) => T3.ShaderChunk.lights_fragment_begin
    .replace('getPointLightInfo( pointLight, geometryPosition, directLight );', 'getPointLightInfo( pointLight, geometryPosition, directLight ); directLight.color *= uLuzPunto;')
    .replace('getDirectionalLightInfo( directionalLight, directLight );', `getDirectionalLightInfo( directionalLight, directLight ); directLight.color *= ${cuanto};`);
  matLosa.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, UL);
    sh.vertexShader = 'varying vec3 vObj;\nuniform float uMenY;\nuniform vec4 uCajaMen;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vObj = position;
      transformed.y += uMenY * step(uCajaMen.x, position.x) * step(position.x, uCajaMen.z) * step(uCajaMen.y, position.z) * step(position.z, uCajaMen.w);`);
    sh.fragmentShader = 'varying vec3 vObj;\nuniform float uTrama, uMen, uAlto, uLuzPunto;\nuniform vec4 uCajaMen, uFrente;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        float cara = smoothstep(uAlto - 0.7, uAlto - 0.05, vObj.y);
        float men = step(uCajaMen.x, vObj.x) * step(vObj.x, uCajaMen.z) * step(uCajaMen.y, vObj.z) * step(vObj.z, uCajaMen.w);
        totalEmissiveRadiance += vec3(0.0, 0.83, 0.67) * men * uMen * mix(0.03, 1.0, cara);
        float dist = length(vObj.xz - uFrente.xy);
        totalEmissiveRadiance += vec3(0.18, 0.62, 0.78) * exp(-abs(dist - uFrente.z) / 9.0) * uFrente.w * cara;   // el frente de la trama
      }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      {
        float cara = smoothstep(uAlto - 0.7, uAlto - 0.05, vObj.y);
        vec2 q = vObj.xz / 37.5, fw = max(fwidth(q), vec2(1e-4));
        vec2 g = abs(fract(q - 0.5) - 0.5) / fw;
        float ln = (1.0 - min(min(g.x, g.y), 1.0)) * clamp(1.6 - max(fw.x, fw.y) * 7.0, 0.0, 1.0);
        ln *= smoothstep(uFrente.z, uFrente.z - 60.0, length(vObj.xz - uFrente.xy));
        diffuseColor.rgb += vec3(0.30, 0.36, 0.46) * ln * uTrama * cara;
      }`)
      // la luz del punto (y la de los nodos) no toca la losa: el esmalte la devolvería como un segundo punto;
      // y el recorte frío, en la losa, apenas: si no, vela de azul media península
      .replace('#include <lights_fragment_begin>', LUCES('0.25'));
  };
  // el suelo del plató tampoco recibe la luz del punto: sin manchas ámbar fuera de la losa
  if (plato.suelo) plato.suelo.material.onBeforeCompile = (sh) => { sh.uniforms.uLuzPunto = UL.uLuzPunto; sh.fragmentShader = 'uniform float uLuzPunto;\n' + sh.fragmentShader.replace('#include <lights_fragment_begin>', LUCES('1.0')); };
  const losa = new T3.Mesh(geoLosa, matLosa); losa.castShadow = true; losa.receiveShadow = true;
  // el canto de luz: cada tramo se enciende cuando la pluma pasa por él, con la punta más brillante
  const UP = { uPluma: { value: 0 } };
  function linea(arr, ts, hex, op, U = UP) {
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(arr, 3));
    const m = new T3.LineSegments(g, new T3.LineBasicMaterial({ color: hex, transparent: true, opacity: op }));
    if (ts) {
      g.setAttribute('aT', new T3.Float32BufferAttribute(ts, 1));
      m.material.onBeforeCompile = (sh) => {
        sh.uniforms.uPluma = U.uPluma;
        sh.vertexShader = 'attribute float aT;\nvarying float vT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvT = aT;');
        sh.fragmentShader = 'uniform float uPluma;\nvarying float vT;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
          if (vT > uPluma) discard;
          float punta = smoothstep(0.06, 0.0, uPluma - vT);
          diffuseColor.rgb += vec3(1.0, 0.95, 0.86) * 2.6 * punta; diffuseColor.a = min(1.0, diffuseColor.a + punta);`);
      };
    }
    return m;
  }
  const canto = linea(costa, costaT, COL.cuerda, 0.78), cantoMen = linea(costaMen, costaMenT, COL.cuerda, 0.78), marco = linea(marcoCan, null, COL.cuerda, 0.7);
  const placa = new T3.Group(); placa.add(losa, canto, cantoMen); escena.add(placa, marco);

  // ── los nodos: dónde caen (sobre la losa o, si no hay losa, en el suelo) ──
  const dentro = (x, y, p) => { let r = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i].y > y) !== (p[j].y > y) && x < (p[j].x - p[i].x) * (y - p[i].y) / (p[j].y - p[i].y) + p[i].x) r = !r; return r; };
  const cerca = (x, y, p, d) => { for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1))); if (Math.hypot(a.x + dx * t - x, a.y + dy * t - y) < d) return true; } return false; };
  const N = NODOS.map((n, i) => {
    const p = proy(n.lon, n.lat), sobre = polis.some((q) => dentro(p.x, -p.z, q) || cerca(p.x, -p.z, q, 9));
    p.y = sobre ? ALTO : 0; cajaMapa.expandByPoint(p);
    return { ...n, i, p };
  });
  const MAD = N.find((n) => n.k === 'madrid'), MEN = N.find((n) => n.k === 'menorca'), BCN = N.find((n) => n.k === 'barcelona');
  const LIBRES = N.filter((n) => n.est !== 'activo');                         // los aros discontinuos: los libres y Barcelona
  const lejos = Math.max(...LIBRES.map((n) => n.p.distanceTo(MAD.p)));
  LIBRES.forEach((n, j) => { n.j = j; n.nace = 0.075 + 0.07 * n.p.distanceTo(MAD.p) / lejos; n.fase = j * 0.137; });

  // texturas: un degradado redondo para charcos y destellos, y uno vertical para los haces de luz
  const lienzoTx = (w, h, pinta) => { const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; };
  const radial = lienzoTx(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.45)'); g.addColorStop(0.6, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const vertical = lienzoTx(4, 128, (x) => { const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,.18)'); g.addColorStop(0.9, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = g; x.fillRect(0, 0, 4, 128); });
  const aditivo = (o = {}) => new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, ...o });
  // un aro plano de radio 1: n tramos, cada uno lleno en la fracción «lleno»
  function aroGeo(r0, n, lleno, seg) {
    const pos = [], idx = [];
    for (let k = 0; k < n; k++) {
      const a0 = k / n * TAU, a1 = a0 + lleno / n * TAU, b = pos.length / 3;
      for (let s = 0; s <= seg; s++) { const a = mezcla(a0, a1, s / seg); pos.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a), 0, Math.sin(a)); }
      for (let s = 0; s < seg; s++) { const i = b + s * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
    }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }
  const instancias = (geo, mat, n, hex = 0) => { const m = new T3.InstancedMesh(geo, mat, n); m.frustumCulled = false; for (let i = 0; i < n; i++) m.setColorAt(i, new T3.Color(hex)); escena.add(m); return m; };
  const anillos = instancias(aroGeo(0.84, 14, 0.56, 3), aditivo(), LIBRES.length);   // libres: aros discontinuos que esperan
  const ONDA_LIB = 0, ONDA_CLIC = LIBRES.length, ONDA_LEC = ONDA_CLIC + 2, ONDA_PUNTO = ONDA_LEC + 1, ONDA_SALTO = ONDA_PUNTO + 2, ONDA_P = ONDA_SALTO + 1, N_ONDAS = ONDA_P + 14;
  const ondas = instancias(aroGeo(0.965, 1, 1, 72), aditivo(), N_ONDAS);              // ondas: lo que se expande y se apaga
  const charcos = instancias(new T3.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), aditivo({ map: radial }), 8);   // 0-2 nodos, 3 libre señalado, 4-5 núcleo de los activos, 6 el soplo de la losa, 7 el punto que se abre
  // haces de luz que suben de los nodos activos (y, más tenue, de Barcelona)
  const haces = instancias(new T3.CylinderGeometry(1, 0.32, 1, 32, 1, true).translate(0, 0.5, 0), aditivo({ map: vertical }), 3);
  // Barcelona: medio aro ion que se va construyendo
  const geoArco = new T3.RingGeometry(0.86, 1, 96, 1).rotateX(-Math.PI / 2);
  const arcoBcn = new T3.Mesh(geoArco, aditivo({ color: COL.ion })); escena.add(arcoBcn);

  // ── los pilares que bajan las grúas: Madrid, Menorca, Barcelona y, al señalar un libre, el que lo ofrece ──
  const redondo = (w, d, r) => { const s = new T3.Shape(), x = w / 2, y = d / 2; s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r); s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y); s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y); return s; };
  const pieza = (w, d, h, r, b) => { const g = new T3.ExtrudeGeometry(redondo(w, d, r), { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.8, bevelOffset: -b * 0.8, bevelSegments: 3, curveSegments: 4 }); g.rotateX(-Math.PI / 2); g.translate(0, b, 0); return g; };
  const PIL = { w: 6.5, h: 20 };
  const pilares = instancias(pieza(PIL.w, PIL.w, PIL.h, 1.6, 0.9), esmalte(COL.blanco), 4, 0xffffff); pilares.castShadow = true; pilares.receiveShadow = true;
  const bandas = instancias(pieza(PIL.w + 0.7, PIL.w + 0.7, 1.5, 1.9, 0.3), new T3.MeshBasicMaterial({ color: 0xffffff }), 4);   // la banda de luz: menta si está activo, ion si se implanta
  const G_LOSA = 4, ganchos = instancias(new T3.SphereGeometry(1.15, 14, 10), new T3.MeshStandardMaterial({ color: COL.cuerda, roughness: 0.35, metalness: 0.7 }), 5, 0xffffff);
  // los cables de grúa: brillan abajo, junto al gancho, y se pierden hacia arriba en la noche
  const NCB = 16, cCab = new T3.Color(COL.cuerda);
  function cable() {
    const g = new T3.BufferGeometry(), pos = new Float32Array(NCB * 3), col = new Float32Array(NCB * 3);
    for (let i = 0; i < NCB; i++) { const k = 0.9 * Math.pow(1 - i / (NCB - 1), 2.4); col[i * 3] = cCab.r * k; col[i * 3 + 1] = cCab.g * k; col[i * 3 + 2] = cCab.b * k; }
    g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('color', new T3.BufferAttribute(col, 3));
    const l = new T3.Line(g, new T3.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false })); l.frustumCulled = false; l.visible = false; escena.add(l);
    l.tender = (a, alto, dx, vib) => { const p = g.attributes.position; for (let i = 0; i < NCB; i++) { const s = i / (NCB - 1); p.setXYZ(i, a.x + dx * s + vib * Math.sin(Math.PI * s), a.y + alto * s, a.z); } p.needsUpdate = true; l.visible = true; };
    return l;
  }
  const cables = [cable(), cable(), cable(), cable(), cable(), cable()];    // 0-2 pilares, 3 el del libre señalado, 4 el de la losa, 5 el de los moldes
  const COLUMNAS = [
    { n: MAD, baja: 0.065, clic: 0.12, banda: COL.menta },
    { n: MEN, baja: 0.09, clic: 0.15, banda: COL.menta },
    { n: BCN, baja: 0.115, clic: 0.18, banda: COL.ion, cuelga: 58 },          // se queda colgado: aún no ha encajado
  ];
  // la luz menta de los activos, que baña sus pilares y sus piezas (no la losa: ahí está el charco)
  const luces = [MAD, MEN].map(() => { const l = new T3.PointLight(COL.menta, 0, 70, 0); escena.add(l); return l; });

  // la eslinga de la losa: cuatro ramales a un gancho, y de ahí un cable a la grúa
  const ANCLAS = [[-7.6, 42.6], [1.2, 41.9], [-5.6, 37.4], [-1.2, 38.3]].map(([lo, la]) => proy(lo, la));
  const ramales = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(new Float32Array(24), 3)), new T3.LineBasicMaterial({ color: COL.cuerda, transparent: true, opacity: 0.7 }));
  ramales.frustumCulled = false; escena.add(ramales);
  const cMapa = cajaMapa.getCenter(new T3.Vector3()).setY(0), tMapa = cajaMapa.getSize(new T3.Vector3());
  const GANCHO_LOSA = new T3.Vector3(ANCLAS.reduce((s, a) => s + a.x, 0) / 4, 0, ANCLAS.reduce((s, a) => s + a.z, 0) / 4);

  // ── Madrid: molde, piezas con identidad, acopio y expedición; Menorca: cantera y planta ──
  const PZ = { w: 13, d: 8, h: 2 };
  const piezas = instancias(pieza(1, 1, 1, 0.16, 0.12), esmalte(COL.blanco), 13, 0xffffff);   // 0-2 piezas, 3 molde, 4-6 bancos de la cantera, 7 molde nuevo, 8 serie cero, 9 pieza tipo, 10-12 materiales
  piezas.castShadow = true; piezas.receiveShadow = true;
  for (let i = 0; i < 13; i++) piezas.setColorAt(i, new T3.Color(i === 3 || i === 7 ? 0x1c2330 : i === 10 ? 0x9ba1aa : i === 11 ? 0xc08a52 : i === 12 ? 0x6f8196 : 0xffffff));   // hormigón, madera y acero
  const MOLDE = new T3.Vector3(MAD.p.x + 17, ALTO, MAD.p.z + 11), ACOPIO = new T3.Vector3(MAD.p.x + 17, ALTO, MAD.p.z - 11);
  const silo = new T3.Mesh(new T3.LatheGeometry([[0, 0], [2.3, 0], [2.3, 7.2], [2.05, 8.3], [1.1, 9.2], [0.4, 9.5], [0, 9.55]].map(([x, y]) => new T3.Vector2(x, y)), 28), esmalte(COL.blanco));
  silo.castShadow = true; escena.add(silo);
  const CANTERA = new T3.Vector3(MEN.p.x - 11, ALTO, MEN.p.z + 1.5), PLANTA = new T3.Vector3(MEN.p.x + 10.5, ALTO, MEN.p.z - 1);

  // ── el salto: de Madrid a Menorca, rápido al salir y suspendido arriba ──
  const NH = 72, TOPE_M = new T3.Vector3(MAD.p.x, ALTO + PIL.h, MAD.p.z), TOPE_N = new T3.Vector3(MEN.p.x, ALTO + PIL.h, MEN.p.z), H_SALTO = 205;
  const SALTO = [0.425, 0.468];
  const vuela = (s) => s + 0.32 * Math.sin(TAU * s) / TAU;                    // el tiempo del salto: sale con fuerza y se queda un instante arriba
  const enArco = (a, b, h, s, v) => v.lerpVectors(a, b, s).setY(mezcla(a.y, b.y, s) + 4 * h * s * (1 - s));
  const hilo = (a, b, h, mat) => { const pts = []; for (let i = 0; i < NH; i++) pts.push(enArco(a, b, h, i / (NH - 1), new T3.Vector3())); const l = new T3.Line(new T3.BufferGeometry().setFromPoints(pts), mat); l.computeLineDistances(); l.frustumCulled = false; escena.add(l); return l; };
  const hiloMen = hilo(TOPE_M, TOPE_N, H_SALTO, new T3.LineBasicMaterial({ color: COL.cuerda, transparent: true, opacity: 0.6 }));
  const PIE_B = new T3.Vector3(BCN.p.x, ALTO + 0.6, BCN.p.z);
  const hiloBcn = hilo(TOPE_M, PIE_B, 45, new T3.LineDashedMaterial({ color: COL.ion, transparent: true, opacity: 0.85, dashSize: 7, gapSize: 6 }));
  const destello = new T3.Sprite(new T3.SpriteMaterial({ map: radial, color: COL.cian, blending: T3.AdditiveBlending, depthWrite: false, transparent: true })); escena.add(destello);
  // la estela del punto: unos cuantos reflejos de dónde estuvo, que se apagan
  const NE = 64, estela = new T3.Points(new T3.BufferGeometry().setAttribute('position', new T3.BufferAttribute(new Float32Array(NE * 3), 3)).setAttribute('color', new T3.BufferAttribute(new Float32Array(NE * 3), 3)),
    new T3.PointsMaterial({ map: radial, vertexColors: true, size: 10, sizeAttenuation: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false }));
  estela.frustumCulled = false; escena.add(estela);
  const pt = punto(escena, { alcance: 120 });
  plato.contra.intensity = 0.4;                                            // el recorte frío, suave: en el esmalte de la losa haría un velo azul

  // ── cómo se abre un punto: un nodo sin nombre en territorio vacío (ilustrativo: no es ninguna ciudad de DATOS) ──
  const NP = proy(-5.5, 39.55).setY(ALTO), GIRO = 0.3, cg = Math.cos(GIRO), sg = Math.sin(GIRO);
  const enNave = (x, z, v) => v.set(NP.x + x * cg - z * sg, ALTO, NP.z + x * sg + z * cg);      // en los ejes de la nave
  const tmp = new T3.Vector3();
  const lineas = (pts, mat, y) => { const a = []; for (const [x0, z0, x1, z1] of pts) { enNave(x0, z0, tmp); a.push(tmp.x, y, tmp.z); enNave(x1, z1, tmp); a.push(tmp.x, y, tmp.z); }
    const l = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.Float32BufferAttribute(a, 3)), mat); l.computeLineDistances(); l.visible = false; escena.add(l); return l; };
  // 1. la huella de la nave: tres crujías, en discontinuo, y la barra que la barre
  const huella = lineas([[-17, -10, 17, -10], [17, -10, 17, 10], [17, 10, -17, 10], [-17, 10, -17, -10], [-5.7, -10, -5.7, 10], [5.7, -10, 5.7, 10]],
    new T3.LineDashedMaterial({ color: COL.cuerda, transparent: true, opacity: 0, dashSize: 2.2, gapSize: 1.6 }), ALTO + 0.35);
  const barrido = new T3.Mesh(new T3.PlaneGeometry(5, 24).rotateX(-Math.PI / 2), aditivo({ map: radial, color: COL.ion })); barrido.rotation.y = -GIRO; barrido.visible = false; escena.add(barrido);
  // 2. la comarca: un contorno orgánico (no es una comarca real) que la pluma de luz dibuja, con un velo
  const UP2 = { uPluma: { value: 0 } }, CC = new T3.Vector3(NP.x + 10, ALTO, NP.z + 8), comarca = [], comT = [], forma = new T3.Shape();
  const radioC = (a) => 58 + 9 * Math.sin(3 * a + 0.7) + 6 * Math.sin(5 * a + 2.1) + 4 * Math.sin(7 * a + 0.3);
  for (let i = 0; i < 96; i++) {
    const a0 = i / 96 * TAU, a1 = (i + 1) / 96 * TAU, r0 = radioC(a0), r1 = radioC(a1);
    comarca.push(CC.x + Math.cos(a0) * r0, ALTO + 0.45, CC.z + Math.sin(a0) * r0, CC.x + Math.cos(a1) * r1, ALTO + 0.45, CC.z + Math.sin(a1) * r1); comT.push(i / 96, (i + 1) / 96);
    if (i === 0) forma.moveTo(Math.cos(a0) * r0, -Math.sin(a0) * r0); else forma.lineTo(Math.cos(a0) * r0, -Math.sin(a0) * r0);
  }
  const lineaCom = linea(comarca, comT, COL.ion, 0.9, UP2); lineaCom.visible = false; escena.add(lineaCom);
  const veloCom = new T3.Mesh(new T3.ShapeGeometry(forma, 1).rotateX(-Math.PI / 2), aditivo({ color: COL.ion })); veloCom.position.set(CC.x, ALTO + 0.3, CC.z); veloCom.visible = false; escena.add(veloCom);
  // 3. los moldes (bajan con la grúa) y la serie cero: instancias 7 y 8 de las piezas
  const MOLDE2 = enNave(-6, -2, new T3.Vector3()), BANCO = enNave(8, -2, new T3.Vector3());
  // 4. el equipo: cuatro figuras, cada una con su aro menta al certificarse
  const figuras = instancias(new T3.LatheGeometry([[0, 0], [1.7, 0], [1.7, 0.4], [1.15, 4.2], [0.6, 4.8], [1.25, 5.4], [1.35, 6.2], [0.95, 7.0], [0, 7.25]].map(([x, y]) => new T3.Vector2(x, y)), 20), esmalte(COL.blanco), 4, 0xffffff);
  figuras.castShadow = true;
  const sellos = instancias(aroGeo(0.82, 1, 1, 40), aditivo(), 4);
  const EQUIPO = [0, 1, 2, 3].map((k) => enNave(-10 + 6.6 * k, 17, new T3.Vector3()));
  // 5. la primera obra: un solar dentro de la comarca y el camino hasta él
  const SALIDA = enNave(17, -2, new T3.Vector3()), SITIO = new T3.Vector3(NP.x + 46, ALTO, NP.z + 30), CTRL = new T3.Vector3(NP.x + 44, ALTO, NP.z - 4);
  const rutaEn = (s, v) => v.set((1 - s) ** 2 * SALIDA.x + 2 * s * (1 - s) * CTRL.x + s * s * SITIO.x, ALTO, (1 - s) ** 2 * SALIDA.z + 2 * s * (1 - s) * CTRL.z + s * s * SITIO.z);
  const NR = 40, ruta = new T3.Line(new T3.BufferGeometry().setFromPoints(Array.from({ length: NR }, (_, i) => rutaEn(i / (NR - 1), new T3.Vector3()).setY(ALTO + 0.4))),
    new T3.LineDashedMaterial({ color: COL.cuerda, transparent: true, opacity: 0, dashSize: 2.4, gapSize: 1.8 })); ruta.computeLineDistances(); ruta.frustumCulled = false; ruta.visible = false; escena.add(ruta);
  const solar = (() => { const a = [], q = (h) => [[-h, -h, h, -h], [h, -h, h, h], [h, h, -h, h], [-h, h, -h, -h]]; for (const [x0, z0, x1, z1] of [...q(7), ...q(4.2)]) a.push(SITIO.x + x0, ALTO + 0.4, SITIO.z + z0, SITIO.x + x1, ALTO + 0.4, SITIO.z + z1);
    const l = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.Float32BufferAttribute(a, 3)), new T3.LineBasicMaterial({ color: COL.cuerda, transparent: true, opacity: 0 })); l.visible = false; escena.add(l); return l; })();
  const FIN_PASOS = new T3.Vector3(SITIO.x, ALTO + 16, SITIO.z);
  // 0. qué fabricas hoy: la nave que ya existe (sus aristas), la pieza tipo, los tres materiales y la escala de digitalización
  const nave = (() => { const a = [], c = [[-17, -10], [17, -10], [17, 10], [-17, 10]], hN = 7;
    for (let i = 0; i < 4; i++) { const [x0, z0] = c[i], [x1, z1] = c[(i + 1) % 4];
      for (const y of [0.4, hN]) { enNave(x0, z0, tmp); a.push(tmp.x, ALTO + y, tmp.z); enNave(x1, z1, tmp); a.push(tmp.x, ALTO + y, tmp.z); }
      enNave(x0, z0, tmp); a.push(tmp.x, ALTO + 0.4, tmp.z, tmp.x, ALTO + hN, tmp.z); }
    for (const x of [-5.7, 5.7]) { enNave(x, -10, tmp); a.push(tmp.x, ALTO + hN, tmp.z); enNave(x, 10, tmp); a.push(tmp.x, ALTO + hN, tmp.z); }
    const l = new T3.LineSegments(new T3.BufferGeometry().setAttribute('position', new T3.Float32BufferAttribute(a, 3)), new T3.LineBasicMaterial({ color: COL.cuerda, transparent: true, opacity: 0 })); l.visible = false; escena.add(l); return l; })();
  const COMPONENTE = enNave(-11, 16, new T3.Vector3()), MATERIALES = [-1.5, 3.2, 7.9].map((x) => enNave(x, 16, new T3.Vector3())), ESCALA = [0, 1, 2, 3, 4].map((k) => enNave(13 + k * 2.3, 16, new T3.Vector3()));
  const LECT_C = enNave(3.5, 13, new T3.Vector3());
  const escala = instancias(new T3.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new T3.MeshBasicMaterial({ color: 0xffffff }), 5);
  const LEE = [enNave(-11, 11, new T3.Vector3()).setY(ALTO + 19), enNave(3.2, 11, new T3.Vector3()).setY(ALTO + 16), enNave(17.6, 11, new T3.Vector3()).setY(ALTO + 20)];   // el punto lee desde arriba y algo detrás: no tapa lo que lee

  // ── la cámara: cada plano encaja su caja en el hueco que dejan los textos ──
  const b = (c) => ctx.raiz.querySelector('.beat.' + c), bA = b('arriba'), bI = b('izq'), bD = b('der'), bB = b('abajo'), bP = b('pasos');
  let W = 1, H = 1, medido = -9;
  const caja = (c, mx, mz, alto) => ({ c, mx, mz, alto });
  const PLANOS = [
    { caja: caja(cMapa, tMapa.x / 2, tMapa.z / 2, ALTO), lado: -0.14, el: 0.62 },            // el título: el mapa entero
    { caja: caja(new T3.Vector3(MAD.p.x + 8, ALTO, MAD.p.z), 92, 70, 34), lado: 0.34, el: 0.56 },  // Madrid, a la derecha
    { caja: caja(new T3.Vector3(MEN.p.x - 4, ALTO, MEN.p.z), 60, 46, 30), lado: -0.36, el: 0.6 },      // Menorca, a la izquierda
    { caja: caja(cMapa, tMapa.x / 2, tMapa.z / 2, ALTO), lado: 0.07, el: 0.74 },              // los tramos: el mapa arriba
    { caja: caja(new T3.Vector3(NP.x + 14, ALTO, NP.z + 10), 74, 62, 30), lado: 0.3, el: 0.62 },   // los pasos: el punto que se abre, a la derecha
  ];
  const camAux = new T3.PerspectiveCamera(28, 1, 1, 10000), esq = new T3.Vector3();
  function encajar(P, r) {
    const { c, mx, mz, alto } = P.caja; camAux.aspect = W / H; camAux.updateProjectionMatrix();
    const rw = Math.max(40, r[2] - r[0]) / W * 2, rh = Math.max(40, r[3] - r[1]) / H * 2;
    let d = distancia(camAux, mz * 2, mx * 2), x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    for (let it = 0; it < 4; it++) {
      mirar(camAux, c.x, c.y, c.z, d, P.lado, P.el); camAux.updateMatrixWorld();
      x0 = y0 = Infinity; x1 = y1 = -Infinity;
      for (let k = 0; k < 8; k++) {
        esq.set(c.x + (k & 1 ? mx : -mx), (k & 2 ? alto : 0), c.z + (k & 4 ? mz : -mz)).project(camAux);
        x0 = Math.min(x0, esq.x); x1 = Math.max(x1, esq.x); y0 = Math.min(y0, esq.y); y1 = Math.max(y1, esq.y);
      }
      if (it < 3) d *= Math.max((x1 - x0) / rw, (y1 - y0) / rh);
    }
    const rcx = (r[0] + r[2]) / W - 1, rcy = 1 - (r[1] + r[3]) / H;          // centro del hueco, en coordenadas de pantalla
    P.x = c.x; P.y = c.y; P.z = c.z; P.d = d;
    P.ox = -(rcx - (x0 + x1) / 2) * W / 2; P.oy = (rcy - (y0 + y1) / 2) * H / 2;
  }
  function huecos() {
    const m = Math.max(16, Math.min(88, W * 0.05)), vertical = W <= 760, nav = 64;
    const tope = (el, def) => (el && el.offsetHeight ? el.offsetTop : def);
    const r0 = [m, (bA ? bA.offsetTop + bA.offsetHeight : H * 0.35) + H * 0.04, W - m, H - H * 0.05];
    const r1 = vertical ? [m * 0.5, nav, W - m * 0.5, tope(bI, H * 0.6) - 18] : [bI.offsetLeft + bI.offsetWidth + W * 0.05, nav + 30, W - m * 0.7, H - 60];
    const r2 = vertical ? [m * 0.5, nav, W - m * 0.5, tope(bD, H * 0.6) - 18] : [m * 0.7, nav + 30, bD.offsetLeft - W * 0.05, H - 60];
    // si los tramos no dejan sitio, el mapa se va hacia arriba, fuera del plano: el texto queda sobre la noche
    const yB = tope(bB, H * 0.5) - 18, r3 = yB - nav > 150 ? [m, nav, W - m, yB] : [m, -H * 0.62, W - m, -H * 0.12];
    const r4 = vertical ? [m * 0.5, nav, W - m * 0.5, tope(bP, H * 0.55) - 18] : [(bP ? bP.offsetLeft + bP.offsetWidth : W * 0.45) + W * 0.04, nav + 30, W - m * 0.7, H - 60];
    [r0, r1, r2, r3, r4].forEach((r, i) => encajar(PLANOS[i], r));
  }
  // de un plano a otro: suavizado, con un poco de vuelo (la cámara sube a mitad del viaje)
  const cam = { x: 0, y: 0, z: 0, d: 1, lado: 0, el: 0, ox: 0, oy: 0 };
  function mezclaPlanos(a, b2, w, alza) {
    for (const k of ['x', 'y', 'z', 'lado', 'el', 'ox', 'oy']) cam[k] = mezcla(a[k], b2[k], w);
    cam.d = Math.exp(mezcla(Math.log(a.d), Math.log(b2.d), w)) * (1 + alza);
  }
  // un golpe seco: la cámara acusa el peso y se recompone
  const golpe = (u, a, dur, k) => { const w = tramo(u, a, a + dur); return w > 0 && w < 1 ? k * Math.exp(-w * 5) * Math.sin(w * 34) : 0; };
  const sigue = new T3.Vector3();
  function encuadrar(u, uN, reloj) {
    const P = PLANOS;
    if (u < 0.2) {
      // la apertura: baja con la losa, rodeándola, y se asienta en el plano general cuando la losa toca el suelo
      mezclaPlanos(P[0], P[0], 0, 0);
      const a = E.eio(tramo(u, 0, 0.085)), q = E.seno(tramo(u, 0.06, 0.2));
      cam.el = mezcla(0.4, P[0].el, a); cam.lado = mezcla(-0.62, P[0].lado - 0.07, a) + 0.1 * q; cam.d *= mezcla(1.18, 1.05, a) * mezcla(1, 0.94, q);
      cam.oy -= (1 - a) * H * 0.12;
      cam.y += golpe(u, T_LOSA, 0.03, 9);
    }
    else if (u < 0.29) { const w = E.eio(tramo(u, 0.2, 0.29)); mezclaPlanos(P[0], P[1], w, 0.16 * Math.sin(Math.PI * w)); cam.lado += mezcla(0.03, -0.05, w) - 0.22 * Math.sin(Math.PI * w); cam.d *= mezcla(0.987, 1, w); }
    else if (u < 0.405) { mezclaPlanos(P[1], P[1], 0, 0); const q = E.seno(tramo(u, 0.29, 0.405)); cam.lado += mezcla(-0.05, 0.07, q); cam.d *= mezcla(1, 0.9, q); }
    else if (u < 0.485) {
      const w = E.eio(tramo(u, 0.405, 0.485)); mezclaPlanos(P[1], P[2], w, 0.5 * Math.sin(Math.PI * w)); cam.lado += mezcla(0.07, -0.05, w); cam.d *= mezcla(0.9, 1, w);
      // en el salto, la cámara sigue al punto
      const s = tramo(u, SALTO[0], SALTO[1]), k = 0.55 * Math.sin(Math.PI * s);
      enArco(TOPE_M, TOPE_N, H_SALTO, vuela(s), sigue); cam.x = mezcla(cam.x, sigue.x, k); cam.y = mezcla(cam.y, sigue.y, k); cam.z = mezcla(cam.z, sigue.z, k);
      cam.el -= 0.08 * Math.sin(Math.PI * s);
    }
    else if (u < 0.585) { mezclaPlanos(P[2], P[2], 0, 0); const q = E.seno(tramo(u, 0.485, 0.585)); cam.lado += mezcla(-0.05, 0.06, q); cam.d *= mezcla(1, 0.92, q); }
    else if (u < 0.665) { const w = E.eio(tramo(u, 0.585, 0.665)); mezclaPlanos(P[2], P[3], w, 0.14 * Math.sin(Math.PI * w)); cam.lado += mezcla(0.06, -0.03, w); cam.d *= mezcla(0.92, 1, w); }
    else { mezclaPlanos(P[3], P[3], 0, 0); cam.lado += mezcla(-0.03, 0.03, E.seno(tramo(u, 0.665, 1))); }
    cam.y += golpe(u, SALTO[1], 0.025, 2.5);
    // los pasos: la cámara se va al punto que se abre, lo rodea despacio y se abre un poco para ver la comarca
    const wp = E.eio(tramo(uN, 0.485, 0.512)) * (1 - E.eio(tramo(uN, 0.655, 0.695))), uo = R(uN);
    if (wp > 0) {
      const P4 = PLANOS[4], k = E.seno(tramo(uN, 0.51, 0.66)), d4 = P4.d * mezcla(1.05, 0.93, k) * (1 + 0.16 * Math.sin(Math.PI * tramo(uo, 0.535, 0.6)));
      const al = 0.3 * Math.sin(Math.PI * tramo(uN, 0.485, 0.512)) + 0.12 * Math.sin(Math.PI * tramo(uN, 0.655, 0.695));
      for (const q of ['x', 'y', 'z', 'ox', 'oy']) cam[q] = mezcla(cam[q], P4[q], wp);
      cam.lado = mezcla(cam.lado, P4.lado + mezcla(-0.08, 0.1, k), wp); cam.el = mezcla(cam.el, P4.el + 0.05 * Math.sin(Math.PI * tramo(uo, 0.535, 0.6)), wp);
      cam.d = Math.exp(mezcla(Math.log(cam.d), Math.log(d4), wp)) * (1 + al);
      // en el primer paso la cámara se acerca a las tres lecturas, delante de la nave; luego se abre para el diagnóstico
      const cerca = 1 - E.eio(tramo(uN, 0.533, 0.55)), ce = cerca * wp;
      cam.d *= mezcla(1, 0.5, ce); cam.x = mezcla(cam.x, LECT_C.x, ce); cam.z = mezcla(cam.z, LECT_C.z, ce); cam.y = mezcla(cam.y, ALTO + 3, ce); cam.el -= 0.08 * ce;
      cam.y += golpe(uo, 0.582, 0.02, 1.6);
    }
    // la cámara respira
    const lado = cam.lado + 0.014 * Math.sin(reloj * 0.21) + 0.008 * Math.sin(reloj * 0.13), el = cam.el + 0.008 * Math.sin(reloj * 0.17), d = cam.d * (1 + 0.006 * Math.sin(reloj * 0.11));
    mirar(camara, cam.x, cam.y, cam.z, d, lado, el);
    camara.setViewOffset(W, H, cam.ox, cam.oy, W, H);
    plato.enfocar(cam.x, cam.y, cam.z, d);
    plato.clave.intensity = 3.2 * mezcla(0.55, 1, E.eo(tramo(u, 0, 0.05))) * mezcla(1, 0.74, E.seno(tramo(u, 0.6, 0.72)));   // se enciende con la losa; en los tramos, calma
    camara.updateMatrixWorld();
    return d;
  }

  // ── la losa baja colgada y toca el suelo ──
  const T_LOSA = 0.055;
  const alturaLosa = (u) => 300 * (1 - E.eo(tramo(u, 0, T_LOSA)));
  // el pilar de Madrid se comprime para lanzar el punto y rebota al soltarlo
  const apretonMadrid = (u) => { const a = E.eo(tramo(u, 0.405, SALTO[0])); return u < SALTO[0] ? 1 - 0.1 * a : mezcla(0.9, 1, E.rebote(tramo(u, SALTO[0], SALTO[0] + 0.03))); };
  const golpeMen = (u) => { const w = tramo(u, SALTO[1], SALTO[1] + 0.04); return w > 0 && w < 1 ? -2.6 * Math.exp(-w * 4) * Math.sin(w * Math.PI * 3) : 0; };

  // ── el punto: aparece, cae en Madrid, salta a Menorca y vuelve a velar Madrid ──
  const H0 = new T3.Vector3(MAD.p.x + 150, 240, MAD.p.z - 70), H1 = new T3.Vector3(MAD.p.x, ALTO + PIL.h + 34, MAD.p.z);
  const enVuelo = (u) => (u > 0.215 && u < 0.27) || (u > SALTO[0] && u < SALTO[1]) || (u > 0.6 && u < 0.66);
  function camino(u, r, v) {
    if (u < 0.215) return v.copy(H0).setY(H0.y + 16 * Math.sin(Math.PI * tramo(u, 0.2, 0.215)));
    if (u < 0.27) { const s = tramo(u, 0.215, 0.27), h = E.seno(s); return v.set(mezcla(H0.x, TOPE_M.x, h), mezcla(H0.y + 16 * (1 - s), TOPE_M.y + r, E.ei(s)), mezcla(H0.z, TOPE_M.z, h)); }
    if (u < SALTO[0]) return v.copy(TOPE_M).setY(TOPE_M.y - PIL.h * (1 - apretonMadrid(u)) + r);
    if (u < SALTO[1]) { enArco(TOPE_M, TOPE_N, H_SALTO, vuela(tramo(u, SALTO[0], SALTO[1])), v); v.y += r; return v; }
    if (u < 0.6) return v.copy(TOPE_N).setY(TOPE_N.y + golpeMen(u) + r);
    const s = E.suave(tramo(u, 0.6, 0.67)); v.lerpVectors(FIN_PASOS, H1, s); v.y += r + 90 * Math.sin(Math.PI * Math.min(1, s)); return v;
  }
  const pa = new T3.Vector3(), pb = new T3.Vector3(), vel = new T3.Vector3(), EJEY = new T3.Vector3(0, 1, 0);
  // el camino del punto en los pasos: salta de Menorca al punto que se abre, mira cada paso y acompaña a la pieza
  const MIRA = [[0.535, 0, 34, 0], [0.545, 0, 34, 0], [0.556, 10, 64, 8], [0.574, 12, 62, 10], [0.585, -6, 22, -2], [0.603, -6, 22, -2], [0.611, -1, 20, 20], [0.631, -1, 20, 20]];
  const pq = new T3.Vector3(), PA0 = new T3.Vector3(NP.x, ALTO + 34, NP.z);
  // los cinco pasos de antes van en 0.535-0.66 de la página; R lleva la página a su guion (que iba de 0.51 a 0.66)
  const R = (u) => (u < 0.5 ? u : u < 0.535 ? mezcla(0.5, 0.51, tramo(u, 0.5, 0.535)) : u < 0.66 ? 0.51 + (u - 0.535) * 1.2 : u);
  const LEER = [[0.512, 0], [0.516, 0], [0.519, 0], [0.522, 1], [0.526, 1], [0.529, 2], [0.535, 2]];
  const pr = new T3.Vector3();
  function caminoPasos(uN, r, v) {
    if (uN < 0.493) return v.copy(TOPE_N).setY(TOPE_N.y + r);
    if (uN < 0.512) { enArco(TOPE_N, LEE[0], 150, vuela(tramo(uN, 0.493, 0.512)), v); v.y += r; return v; }
    if (uN < 0.535) { let i = 0; while (i < LEER.length - 2 && uN > LEER[i + 1][0]) i++; const a = LEER[i], b2 = LEER[i + 1], w = E.seno(tramo(uN, a[0], b2[0])); return v.lerpVectors(LEE[a[1]], LEE[b2[1]], w); }
    caminoViejo(R(uN), r, v);
    if (uN < 0.547) v.lerpVectors(LEE[2], pr.copy(v), E.seno(tramo(uN, 0.535, 0.547)));
    return v;
  }
  function caminoViejo(u, r, v) {
    if (u < 0.633) { let i = 0; while (i < MIRA.length - 2 && u > MIRA[i + 1][0]) i++; const a = MIRA[i], b2 = MIRA[i + 1], w = E.seno(tramo(u, a[0], b2[0]));
      return v.set(NP.x + mezcla(a[1], b2[1], w), ALTO + mezcla(a[2], b2[2], w), NP.z + mezcla(a[3], b2[3], w)); }
    if (u < 0.665) { rutaEn(E.eio(tramo(u, 0.636, 0.655)), pq); v.set(pq.x, ALTO + 14 + 6 * Math.sin(Math.PI * tramo(u, 0.636, 0.655)), pq.z);
      const e = 1 - tramo(u, 0.633, 0.64); return v.set(mezcla(v.x, NP.x - 1, e * e), mezcla(v.y, ALTO + 20, e * e), mezcla(v.z, NP.z + 20, e * e)); }
    return v.copy(FIN_PASOS);
  }
  const enPasos = (u) => u >= 0.49 && u < 0.665;
  const caminoN = (u, r, v) => (enPasos(u) ? caminoPasos(u, r, v) : camino(Q(u), r, v));
  const enVueloN = (u) => (enPasos(u) ? u > 0.493 && u < 0.512 : enVuelo(Q(u)));
  function moverPunto(uN, reloj, d) {
    const u = Q(uN), r = 3.6 * Math.max(1, Math.min(3.4, d / 650));
    const nace = E.vivo(tramo(u, 0.07, 0.11));
    caminoN(uN, r, pa);
    // aire: se estira en la dirección en que va; contacto: se aplasta y rebota
    let sx = 1, sy = 1, brillo = nace;
    pt.esfera.quaternion.identity();
    if (enVueloN(uN)) {
      caminoN(uN + 0.0015, r, pb); vel.subVectors(pb, caminoN(uN - 0.0015, r, vel));
      const st = 1 + Math.min(0.5, vel.length() / 80);
      if (vel.lengthSq() > 1e-6) pt.esfera.quaternion.setFromUnitVectors(EJEY, vel.normalize());
      sx = 1 / Math.sqrt(st); sy = st;
    }
    for (const c of [0.27, SALTO[1]]) { const w = tramo(u, c, c + 0.026); if (w > 0 && w < 1) { const q = E.rebote(w); sx = mezcla(1.65, 1, q); sy = mezcla(0.55, 1, q); brillo += 1.1 * (1 - w); } }
    { const w = enPasos(uN) ? tramo(uN, 0.487, 0.493) : tramo(u, 0.405, SALTO[0]); if (w > 0 && w < 1) { const q = E.eo(w); sx = 1 + 0.38 * q; sy = 1 - 0.46 * q; } }
    const sentado = enPasos(uN) ? uN < 0.493 : (u >= 0.27 && u < SALTO[0]) || (u >= SALTO[1] && u < 0.6);
    if (sentado) pa.y -= r * (1 - sy);                                       // aplastado, sin despegarse del pilar
    else pa.y += 6 * Math.sin(reloj * 1.3) * (enPasos(uN) ? 0.5 * tramo(uN, 0.512, 0.52) * (1 - tramo(R(uN), 0.633, 0.64)) : (1 - tramo(u, 0.2, 0.215)) * (u < 0.27 ? 1 : tramo(u, 0.66, 0.72)));
    pt.poner(pa.x, pa.y, pa.z, r, brillo);
    pt.luz.intensity *= mezcla(1, 0.35, tramo(d, 900, 2200));
    pt.esfera.scale.set(r * sx * nace, r * sy * nace, r * sx * nace);
    pt.halo.scale.setScalar(r * 9 * Math.max(0.01, nace) * (0.85 + 0.15 * brillo));
    // la estela: dónde estuvo hace un momento, si iba volando
    const ep = estela.geometry.attributes.position, ec = estela.geometry.attributes.color;
    for (let k = 0; k < NE; k++) {
      const uk = uN - (k + 1) * 0.00013, on = enVueloN(uk) && enVueloN(uN) ? Math.pow(1 - k / NE, 1.6) : 0;
      caminoN(uk, r, pb); ep.setXYZ(k, pb.x, pb.y, pb.z);
      ec.setXYZ(k, 1.0 * on * 0.8, 0.62 * on * 0.8, 0.12 * on * 0.8);
    }
    ep.needsUpdate = true; ec.needsUpdate = true; estela.material.size = r * 4.6;
    return r;
  }

  // ── el puntero: en los tramos, los nodos se pueden señalar (con el ratón o con el dedo) ──
  const ESTADO = { activo: ['Activo', '#00D4AA'], implantacion: ['En implantación', '#0EA5E9'], libre: ['Territorio libre', '#C9D2E3'] };
  const tip = document.createElement('div');
  tip.setAttribute('aria-hidden', 'true');
  tip.style.cssText = 'position:absolute;left:0;top:0;z-index:4;pointer-events:none;opacity:0;transition:opacity .22s ease;padding:11px 15px 12px;border-radius:14px;'
    + 'background:rgba(9,12,18,.84);border:1px solid rgba(244,246,250,.12);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 14px 40px rgba(0,0,0,.5);'
    + "font:400 13px/1.35 Inter,system-ui,sans-serif;color:#F4F6FA;white-space:nowrap;display:flex;flex-direction:column;gap:3px;will-change:transform,opacity;";
  tip.innerHTML = '<b style="font-weight:650;font-size:15px;letter-spacing:-.01em"></b><span style="color:#8A93A6"></span><i style="font-style:normal;font-weight:600;font-size:12px;display:flex;align-items:center;gap:7px;margin-top:3px"><em style="width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor"></em><span></span></i>';
  ctx.fijo.appendChild(tip);
  const [tNom, tTipo, tEst] = [tip.querySelector('b'), tip.querySelector(':scope > span'), tip.querySelector('i')], tEstTx = tEst.querySelector('span');
  const puntero = { x: 0, y: 0, dentro: false, toque: false }, hv = new Float32Array(N.length);
  let fijado = -1, señalado = -1, mostrado = -1, interactivo = false, cursor = '', anchoTip = 160, altoTip = 70;
  const sobreLienzo = (e) => !(e.target.closest && e.target.closest('.beat'));
  const leer = (e) => { const r = ctx.fijo.getBoundingClientRect(); puntero.x = e.clientX - r.left; puntero.y = e.clientY - r.top; puntero.toque = e.pointerType !== 'mouse'; };
  // todos pasivos y sin preventDefault: el scroll de la página no se toca
  ctx.fijo.addEventListener('pointermove', (e) => { leer(e); puntero.dentro = sobreLienzo(e) && e.pointerType === 'mouse'; }, { passive: true });
  ctx.fijo.addEventListener('pointerleave', () => { puntero.dentro = false; }, { passive: true });
  ctx.fijo.addEventListener('click', (e) => {
    if (!interactivo || !sobreLienzo(e)) return;
    leer(e); const i = cercano(puntero.x, puntero.y, puntero.toque ? 34 : 26);
    fijado = i >= 0 && i !== fijado ? i : -1;
  }, { passive: true });
  const pantalla = new Float32Array(N.length * 2), base = new Float32Array(N.length * 2), vp = new T3.Vector3();
  function proyectar(cimas) {                                            // dos marcas por nodo: su sitio en el mapa y su cima (donde va el rótulo)
    for (const n of N) {
      vp.copy(n.p); vp.y += cimas[n.i]; vp.project(camara); pantalla[n.i * 2] = (vp.x * 0.5 + 0.5) * W; pantalla[n.i * 2 + 1] = (-vp.y * 0.5 + 0.5) * H;
      vp.copy(n.p); vp.project(camara); base[n.i * 2] = (vp.x * 0.5 + 0.5) * W; base[n.i * 2 + 1] = (-vp.y * 0.5 + 0.5) * H;
    }
  }
  function cercano(x, y, radio) { let m = -1, dm = radio; for (const n of N) { const d = Math.min(Math.hypot(pantalla[n.i * 2] - x, pantalla[n.i * 2 + 1] - y), Math.hypot(base[n.i * 2] - x, base[n.i * 2 + 1] - y)); if (d < dm) { dm = d; m = n.i; } } return m; }
  const cimas = new Float32Array(N.length);
  N.forEach((n) => { cimas[n.i] = n.est === 'activo' ? PIL.h * 0.6 : n === BCN ? 58 + PIL.h * 0.5 : 2; });
  function señalar(u, dt) {
    interactivo = u > 0.69 && u < 0.995;
    proyectar(cimas);
    señalado = interactivo && puntero.dentro ? cercano(puntero.x, puntero.y, 26) : -1;
    if (!interactivo) fijado = -1;
    const sel = señalado >= 0 ? señalado : fijado;
    for (let i = 0; i < N.length; i++) hv[i] += ((i === sel ? 1 : 0) - hv[i]) * (1 - Math.exp(-dt * 7));
    const c = señalado >= 0 ? 'pointer' : ''; if (c !== cursor) { cursor = c; ctx.fijo.style.cursor = c; }
    // el rótulo: nombre, tipo y estado, sobre el nodo
    if (sel >= 0 && sel !== mostrado) { const n = N[sel]; tNom.textContent = n.n; tTipo.textContent = n.t; tEstTx.textContent = ESTADO[n.est][0]; tEst.style.color = ESTADO[n.est][1]; mostrado = sel; anchoTip = tip.offsetWidth; altoTip = tip.offsetHeight; }
    tip.style.opacity = sel >= 0 ? '1' : '0';
    if (mostrado >= 0) {
      // encima del nodo; sin salirse por los lados y, si no cabe arriba (bajo la barra), debajo
      const x = Math.round(Math.max(anchoTip / 2 + 10, Math.min(W - anchoTip / 2 - 10, pantalla[mostrado * 2])));
      let y = pantalla[mostrado * 2 + 1] - 18 - 6 * hv[mostrado] - altoTip; if (y < 64) y = base[mostrado * 2 + 1] + 22;
      tip.style.transform = `translate3d(${x}px, ${Math.round(y)}px, 0) translateX(-50%)`;
    }
    if (sel < 0) { let quieto = true; for (let i = 0; i < hv.length; i++) if (hv[i] > 0.01) quieto = false; if (quieto) mostrado = -1; }
  }

  // ── cada fotograma ────────────────────────────────────────────────
  const m4 = new T3.Matrix4(), q4 = new T3.Quaternion(), v1 = new T3.Vector3(), v2 = new T3.Vector3(), e3 = new T3.Vector3(), c3 = new T3.Color(), cA = new T3.Color(COL.cuerda), cB = new T3.Color(COL.menta);
  const poner = (m, i, x, y, z, sx, sy, sz, ry = 0) => { q4.setFromAxisAngle(EJEY, ry); m.setMatrixAt(i, m4.compose(v1.set(x, y, z), q4, e3.set(sx, sy, sz))); };
  const color = (m, i, hex, a) => m.setColorAt(i, c3.setHex(hex).multiplyScalar(Math.max(0, a)));
  const onda = (i, p, y, r0, r1, w, hex, a) => { const on = w > 0 && w < 1; poner(ondas, i, p.x, y, p.z, on ? mezcla(r0, r1, E.eo(w)) : 0, 1, on ? mezcla(r0, r1, E.eo(w)) : 0); color(ondas, i, hex, on ? a * (1 - w) * (1 - w) : 0); };

  function fotograma(u, reloj, d) {
    // la losa baja, toca el suelo con un leve aplastamiento, y la eslinga se recoge
    const yl = alturaLosa(u), al = tramo(u, T_LOSA, T_LOSA + 0.03), aplasta = al > 0 && al < 1 ? mezcla(0.88, 1, E.rebote(al)) : 1;
    placa.position.y = yl + 0.9 * Math.sin(reloj * 0.9) * (1 - E.eo(tramo(u, 0, T_LOSA)));
    placa.scale.set(1 + (1 - aplasta) * 0.02, aplasta, 1 + (1 - aplasta) * 0.02);
    const recoge = E.eo(tramo(u, T_LOSA + 0.003, T_LOSA + 0.028)), sube = E.ei(tramo(u, T_LOSA + 0.02, T_LOSA + 0.06));
    const yG = placa.position.y + ALTO + 430 - 18 * E.eo(al) * (1 - recoge) + 1600 * sube;
    const gp = v2.set(GANCHO_LOSA.x, yG, GANCHO_LOSA.z), rp = ramales.geometry.attributes.position;
    ramales.visible = sube < 1;
    if (ramales.visible) {
      ANCLAS.forEach((a, k) => { rp.setXYZ(k * 2, gp.x, gp.y, gp.z); rp.setXYZ(k * 2 + 1, mezcla(a.x, gp.x, recoge), mezcla(placa.position.y + ALTO, gp.y, recoge), mezcla(a.z, gp.z, recoge)); });
      rp.needsUpdate = true; cables[4].tender(gp, 900, 0, 0); poner(ganchos, G_LOSA, gp.x, gp.y, gp.z, 4, 4, 4);
    } else { cables[4].visible = false; poner(ganchos, G_LOSA, 0, -99, 0, 0, 0, 0); }
    // al tocar el suelo, la losa levanta un soplo de luz que se abre y se apaga
    const so = tramo(u, T_LOSA, T_LOSA + 0.06), rs = mezcla(420, 980, E.eo(so));
    poner(charcos, 6, cMapa.x, 0.3, cMapa.z, so > 0 && so < 1 ? rs : 0, 1, so > 0 && so < 1 ? rs : 0); color(charcos, 6, COL.cuerda, 0.22 * Math.sin(Math.PI * so) * (1 - so));
    // la pluma de luz dibuja la costa mientras baja; luego la trama se extiende desde Madrid
    UP.uPluma.value = mezcla(0, 1.08, E.eio(tramo(u, 0, 0.068)));
    marco.material.opacity = 0.7 * E.eo(tramo(u, 0.05, 0.08));
    const fr = tramo(u, 0.05, 0.19);
    UL.uFrente.value.z = mezcla(0, 1300, E.eio(fr)); UL.uFrente.value.w = 0.5 * Math.sin(Math.PI * Math.min(1, fr * 1.15));
    UL.uTrama.value = mezcla(0.07, 0.05, tramo(u, 0.6, 0.7));
    const lic = E.eo(tramo(u, SALTO[1], SALTO[1] + 0.055)), dipM = golpeMen(u);
    UL.uMen.value = 0.16 * lic + 0.16 * Math.sin(Math.PI * tramo(u, SALTO[1], SALTO[1] + 0.045)); UL.uMenY.value = dipM;
    cantoMen.position.y = dipM;
    cantoMen.material.color.lerpColors(cA, cB, lic); cantoMen.material.opacity = mezcla(0.78, 1, lic);
    canto.material.opacity = mezcla(0.78, 0.6, tramo(u, 0.62, 0.72));

    // los libres: nacen en onda desde Madrid, respiran y, al final, invitan; señalados, se ofrecen
    const invita = mezcla(0.55, 1, tramo(u, 0.62, 0.72));
    let libreSen = -1, hl = 0;
    for (const n of LIBRES) {
      const sc = E.vivo(tramo(u, n.nace, n.nace + 0.035)), esB = n === BCN, h = hv[n.i], R = (esB ? 10.5 : 9.5) * (1 + 0.28 * E.eo(h));
      if (!esB && h > hl) { hl = h; libreSen = n.i; }
      poner(anillos, n.j, n.p.x, n.p.y + 0.6 + 2 * h, n.p.z, R * sc, 1, R * sc, reloj * (esB ? 0.3 : 0.08 + 0.5 * h) + n.j);
      color(anillos, n.j, esB ? COL.ion : COL.cuerda, sc * ((esB ? 0.85 : (0.5 + 0.18 * Math.sin(reloj * 1.5 + n.j * 1.7)) * mezcla(1, 1.35, tramo(u, 0.62, 0.72))) + 0.7 * h));
      const s = (reloj / (3.6 - 1.8 * h) + n.fase) % 1;
      onda(ONDA_LIB + n.j, n.p, n.p.y + 0.5, R, R * 2.8, sc >= 1 ? s : 0, esB ? COL.ion : COL.cuerda, (0.42 + 0.5 * h) * invita);
    }
    // ocupable: sobre el libre señalado baja un pilar colgado de su cable, y su hueco se enciende
    if (libreSen >= 0 && hl > 0.01) {
      const n = N[libreSen], e = E.eo(hl), x = n.p.x + 1.6 * Math.sin(reloj * 1.1), z = n.p.z, y = n.p.y + mezcla(360, 26, e) + 2 * Math.sin(reloj * 0.9);
      poner(pilares, 3, x, y, z, 1, 1, 1, 0.2 * Math.sin(reloj * 0.5)); poner(bandas, 3, x, y + PIL.h * 0.7, z, 1, 1, 1, 0.2 * Math.sin(reloj * 0.5)); color(bandas, 3, COL.cuerda, 0.5 + 0.3 * Math.sin(reloj * 3));
      cables[3].tender(v1.set(x, y + PIL.h + 1.1, z), 420, 0, 0); poner(ganchos, 3, x, y + PIL.h + 1.1, z, 1, 1, 1);
      poner(charcos, 3, n.p.x, n.p.y + 0.4, n.p.z, 26, 1, 26); color(charcos, 3, COL.cuerda, 0.35 * e);
    } else { poner(pilares, 3, 0, -99, 0, 0, 0, 0); poner(bandas, 3, 0, -99, 0, 0, 0, 0); cables[3].visible = false; poner(ganchos, 3, 0, -99, 0, 0, 0, 0); poner(charcos, 3, 0, -99, 0, 0, 0, 0); }
    // Barcelona: medio aro que se construye, gira despacio y late
    const ub = E.eo(tramo(u, 0.135, 0.21)), lat = 0.75 + 0.25 * Math.sin(reloj * 2.2) + 0.5 * hv[BCN.i];
    arcoBcn.visible = ub > 0.01; arcoBcn.position.set(BCN.p.x, BCN.p.y + 0.7, BCN.p.z); arcoBcn.scale.setScalar(14 * (1 + 0.15 * hv[BCN.i]));
    arcoBcn.rotation.y = -reloj * 0.35; geoArco.setDrawRange(0, 6 * Math.max(1, Math.round(96 * (0.55 * ub + 0.03 * Math.sin(reloj * 0.9) * ub))));
    arcoBcn.material.color.setHex(COL.ion).multiplyScalar(lat * ub);

    // los pilares: la grúa los baja, encajan con un clic y la grúa recoge el cable
    COLUMNAS.forEach((c, i) => {
      const p = c.n.p, ub2 = tramo(u, c.baja, c.clic), cuelga = c.cuelga || 0, h = hv[c.n.i], dip = c.n === MEN ? dipM : 0;
      let y = p.y + cuelga + 1300 * (1 - E.eo5(ub2)) + dip + 5 * E.eo(h), x = p.x, z = p.z, sy = 1, sxz = 1, ry = 0.3 * (1 - E.eo(ub2));
      if (cuelga) { const w = E.seno(tramo(u, c.clic - 0.02, c.clic + 0.04)); x += 2.4 * Math.sin(reloj * 0.8) * w; z += 1.6 * Math.sin(reloj * 0.63 + 1) * w; y += 2 * Math.sin(reloj * 0.55) * w; ry += 0.12 * Math.sin(reloj * 0.4) * w; }
      else { const w = tramo(u, c.clic, c.clic + 0.03); if (w > 0 && w < 1) { const q = E.rebote(w); sy = mezcla(0.82, 1, q); sxz = mezcla(1.12, 1, q); } }
      if (c.n === MAD) { const a = apretonMadrid(u); sy *= a; sxz *= 1 + (1 - a) * 0.5; }
      const vis = u > c.baja - 0.002;
      poner(pilares, i, x, y, z, vis ? sxz : 0, vis ? sy : 0, vis ? sxz : 0, ry);
      poner(bandas, i, x, y + PIL.h * 0.7 * sy, z, vis ? sxz : 0, vis ? 1 : 0, vis ? sxz : 0, ry);
      const enc = cuelga ? 1 : E.eo(tramo(u, c.clic, c.clic + 0.02)), latido = 0.9 + 0.1 * Math.sin(reloj * 1.7 + i * 2);
      color(bandas, i, c.banda, (mezcla(0.35, 1.25, enc) * (cuelga ? lat : latido)) + 0.6 * h);
      // el charco de luz (ancho y suave, con un núcleo más vivo), el haz que sube y la onda del clic
      const sobre = (c.n === MAD && u > 0.27 && u < SALTO[0]) || (c.n === MEN && u > SALTO[1] && u < 0.6);
      const ch = cuelga ? 0.5 * ub : E.eo(tramo(u, c.clic, c.clic + 0.03)) * (1 + 0.6 * Math.max(0, 1 - tramo(u, c.clic, c.clic + 0.05)) + (sobre ? 0.25 : 0) + 0.5 * h);
      poner(charcos, i, p.x, p.y + 0.4 + dip, p.z, cuelga ? 22 : 40, 1, cuelga ? 22 : 40);
      color(charcos, i, c.banda, ch * (cuelga ? 0.4 * lat : 0.45 + 0.05 * Math.sin(reloj * 1.1 + i)));
      if (!cuelga) {
        poner(charcos, 4 + i, p.x, p.y + 0.5 + dip, p.z, 13, 1, 13); color(charcos, 4 + i, c.banda, ch * 0.45 * latido);
        onda(ONDA_CLIC + i, p, p.y + 0.5, 6, 60, tramo(u, c.clic, c.clic + 0.06), COL.menta, 0.9);
        const lz = luces[i]; lz.position.set(p.x + 7, p.y + 6 + dip, p.z + 9); lz.intensity = 0.5 * enc * latido * (1 + 1.2 * h);
      }
      const hz = (cuelga ? 0.35 * ub * lat : enc * (0.55 + 0.1 * Math.sin(reloj * 0.7 + i))) * (1 + 0.8 * h) * mezcla(1, 0.85, tramo(u, 0.62, 0.72));
      poner(haces, i, p.x, p.y + dip, p.z, (cuelga ? 9 : 12) * (0.6 + 0.4 * E.eo(enc)), 170 * (cuelga ? 0.6 : E.eo(enc)), (cuelga ? 9 : 12) * (0.6 + 0.4 * E.eo(enc)));
      color(haces, i, c.banda, 0.32 * hz * mezcla(0.07, 1, tramo(d, 900, 2200)));   // de cerca, el haz casi no se ve: no debe tapar el pilar ni el punto
      // el cable: de la grúa (arriba, fuera del plano) al gancho; al soltar, sube vibrando
      const suelta = cuelga ? 0 : E.ei(tramo(u, c.clic + 0.01, c.clic + 0.07)), cab = cables[i];
      const yg = y + PIL.h * sy + 1.1 + 1500 * suelta;
      if (vis && suelta < 1) {
        const vib = cuelga ? 0 : 2.2 * Math.exp(-tramo(u, c.clic, c.clic + 0.04) * 4) * Math.sin(u * 900) * (u > c.clic ? 1 : 0);
        cab.tender(v1.set(x, yg, z), 420, (p.x - x) * 0.4, vib);
        poner(ganchos, i, x, yg, z, 1, 1, 1);
      } else { cab.visible = false; poner(ganchos, i, 0, -99, 0, 0, 0, 0); }
    });

    // Madrid: el molde da tres piezas; cada una se lee al salir, se apila y la última se expide
    const um = E.vivo(tramo(u, 0.285, 0.305));
    poner(piezas, 3, MOLDE.x, ALTO, MOLDE.z, 16 * Math.max(0.001, um), 3 * Math.max(0.001, um), 11 * Math.max(0.001, um));
    let lec = -1;
    for (let k = 0; k < 3; k++) {
      const t0 = 0.3 + k * 0.024, sale = tramo(u, t0, t0 + 0.009), va = tramo(u, t0 + 0.011, t0 + 0.024);
      if (u < t0) { poner(piezas, k, MOLDE.x, ALTO, MOLDE.z, 0, 0, 0); continue; }
      if (u < t0 + 0.03) lec = k;
      const fv = E.firme(va), yAp = ALTO + k * (PZ.h + 0.15);
      let x = mezcla(MOLDE.x, ACOPIO.x, E.eio(va)), z = mezcla(MOLDE.z, ACOPIO.z, E.eio(va));
      let y = mezcla(ALTO + 3 + 8 * E.eo(sale), yAp, fv) + 7 * Math.sin(Math.PI * va) * (1 - va * 0.4), s = 1, ry = 0.5 * Math.sin(Math.PI * va);
      if (k === 2) { const ex = E.eio(tramo(u, 0.375, 0.4)); x += 60 * ex; y += 9 * Math.sin(Math.PI * ex); s = 1 - E.ei(tramo(u, 0.38, 0.4)); ry += 0.4 * ex; }
      poner(piezas, k, x, y, z, PZ.w * s, PZ.h * Math.max(0.05, E.eo(sale)) * s, PZ.d * s, ry);
    }
    const tl = lec >= 0 ? 0.3 + lec * 0.024 + 0.004 : 0;
    onda(ONDA_LEC, MOLDE, ALTO + 3.2, 7, 30, lec >= 0 ? tramo(u, tl, tl + 0.022) : 0, COL.ion, 1.1);
    // Menorca: los bancos de la cantera, escalonados, y el silo de la planta
    [5, 3.6, 2.2].forEach((h, k) => {
      const s = E.vivo(tramo(u, 0.485 + k * 0.008, 0.515 + k * 0.008));
      poner(piezas, 4 + k, CANTERA.x + (k - 1) * 3.2, ALTO + dipM, CANTERA.z, 3.1 * Math.max(0.001, s), h * Math.max(0.001, s), 6.2 * Math.max(0.001, s), 0.25);
    });
    const sp = E.vivo(tramo(u, 0.505, 0.54)); silo.visible = sp > 0.001; silo.position.set(PLANTA.x, ALTO + dipM, PLANTA.z); silo.scale.set(Math.max(0.001, sp), Math.max(0.001, sp), Math.max(0.001, sp));

    // los hilos: el salto deja el suyo (al ritmo del punto); luego se tiende el de Barcelona
    const sh = vuela(tramo(u, SALTO[0], SALTO[1]));
    hiloMen.visible = u > SALTO[0]; hiloMen.geometry.setDrawRange(0, Math.max(2, Math.round(NH * sh)));
    hiloMen.material.opacity = 0.62 * (0.6 + 0.4 * tramo(u, 0.6, 0.7));
    const sb = E.eio(tramo(u, 0.625, 0.7));
    hiloBcn.visible = sb > 0; hiloBcn.geometry.setDrawRange(0, Math.max(2, Math.round(NH * sb)));
    // el destello: primero es la punta de la pluma que dibuja la costa; luego recorre el hilo de Menorca
    const up = UP.uPluma.value, vd = tramo(u, 0.5, 0.56);
    if (up > 0.002 && up < 1) {
      const P = pluma.pts, T = pluma.t; let i = 0; while (i < P.length - 1 && T[i + 1] < up) i++;
      const a = P[i], b2 = P[(i + 1) % P.length], f = (up - T[i]) / Math.max(1e-6, T[i + 1] - T[i]);
      destello.visible = true; destello.position.set(mezcla(a.x, b2.x, f), placa.position.y + (ALTO - BT) * placa.scale.y + 1, -mezcla(a.y, b2.y, f));
      destello.material.color.setHex(0xffffff); destello.scale.setScalar(Math.max(10, d * 0.03)); destello.material.opacity = 0.95;
    } else if (vd > 0) {
      const sd = (reloj * 0.14) % 1; destello.visible = true; enArco(TOPE_M, TOPE_N, H_SALTO, sd, destello.position);
      destello.material.color.setHex(COL.cian); destello.scale.setScalar(Math.max(8, d * 0.016)); destello.material.opacity = 0.75 * vd * Math.sin(Math.PI * sd);
    } else destello.visible = false;

    // las ondas del punto: al posarse en Madrid, al salir disparado y al caer en Menorca
    onda(ONDA_PUNTO, MAD.p, ALTO + 0.6, 10, 55, tramo(u, 0.27, 0.31), COL.ambar, 0.35);
    onda(ONDA_SALTO, MAD.p, ALTO + 0.6, 8, 50, tramo(u, SALTO[0], SALTO[0] + 0.035), COL.ambar, 0.5);
    onda(ONDA_PUNTO + 1, MEN.p, ALTO + 0.6 + dipM, 10, 110, tramo(u, SALTO[1], SALTO[1] + 0.05), COL.menta, 0.6);
    for (const m of [anillos, ondas, charcos, haces, pilares, bandas, ganchos, piezas]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }

  // ── los pasos, fotograma a fotograma (el beat va de 0.51 a 0.66: seis pasos, uno cada 0.025) ──
  const pasosLi = { lista: null, activo: -2 };
  function pasos(uN, reloj) {
    const u = R(uN), fin = 1 - E.eo(tramo(u, 0.665, 0.695)), ver = u > 0.5 && fin > 0.001;
    // la lista del HTML acompaña: el paso en curso, encendido; los hechos, a media luz
    const k = uN >= 0.51 && uN < 0.66 ? Math.min(5, Math.floor((uN - 0.51) / 0.025)) : -1;
    lectura(uN, reloj, ver ? fin : 0);
    if (k !== pasosLi.activo) {
      if (!pasosLi.lista || !pasosLi.lista.length) pasosLi.lista = ctx.raiz.querySelectorAll('.beat.pasos li');
      pasosLi.lista.forEach((li, i) => { li.style.transition = 'opacity .35s ease'; li.style.opacity = k < 0 ? '' : i === k ? '1' : i < k ? '0.6' : '0.35'; });
      pasosLi.activo = k;
    }
    for (const o of [huella, barrido, lineaCom, veloCom, ruta, solar]) o.visible = ver;
    if (!ver) {
      for (let i = 0; i < 4; i++) { poner(figuras, i, 0, -99, 0, 0, 0, 0); poner(sellos, i, 0, -99, 0, 0, 0, 0); }
      poner(piezas, 7, 0, -99, 0, 0, 0, 0); poner(piezas, 8, 0, -99, 0, 0, 0, 0); poner(charcos, 7, 0, -99, 0, 0, 0, 0); cables[5].visible = false;
      for (let i = 0; i < 11; i++) onda(ONDA_P + i, NP, ALTO, 0, 0, 0, 0, 0);
      figuras.instanceMatrix.needsUpdate = true; sellos.instanceMatrix.needsUpdate = true; return;
    }
    // 1. diagnóstico de planta: la huella aparece, dos ondas de reconocimiento y una barra que la barre de punta a punta
    huella.material.opacity = 0.75 * E.eo(tramo(u, 0.51, 0.522)) * fin * (1 + 0.5 * tramo(u, 0.648, 0.66));
    onda(ONDA_P, NP, ALTO + 0.5, 6, 70, tramo(u, 0.512, 0.53), COL.ion, 0.8);
    onda(ONDA_P + 1, NP, ALTO + 0.5, 6, 70, tramo(u, 0.522, 0.54), COL.ion, 0.6);
    const bw = tramo(u, 0.515, 0.539), bx = mezcla(-17, 17, E.seno(bw));
    enNave(bx, 0, barrido.position); barrido.position.y = ALTO + 0.5; barrido.material.color.setHex(COL.ion).multiplyScalar(bw > 0 && bw < 1 ? 0.9 * Math.sin(Math.PI * bw) : 0);
    // 2. acuerdo y territorio: la pluma traza la comarca y queda un velo
    UP2.uPluma.value = mezcla(0, 1.08, E.eio(tramo(u, 0.54, 0.563)));
    lineaCom.material.opacity = 0.85 * fin; veloCom.material.color.setHex(COL.ion).multiplyScalar(0.045 * E.eo(tramo(u, 0.552, 0.568)) * fin);
    // 3. moldes y puesta en marcha: la grúa baja el molde, encaja, sale la serie cero, se lee (ion) y se verifica (menta)
    const bm = tramo(u, 0.57, 0.582), ym = ALTO + 260 * (1 - E.eo5(bm)), cm = tramo(u, 0.582, 0.594), aplM = cm > 0 && cm < 1 ? mezcla(0.8, 1, E.rebote(cm)) : 1;
    const vm = u > 0.569 ? 1 : 0;
    poner(piezas, 7, MOLDE2.x, ym, MOLDE2.z, 14 * vm * fin, 3 * vm * aplM * fin, 9 * vm * fin, -GIRO);
    const suelta = E.ei(tramo(u, 0.584, 0.6));
    if (vm && suelta < 1) cables[5].tender(v1.set(MOLDE2.x, ym + 3 + 1.1 + 1400 * suelta, MOLDE2.z), 420, 0, 0); else cables[5].visible = false;
    onda(ONDA_P + 2, MOLDE2, ALTO + 0.5, 5, 32, tramo(u, 0.582, 0.597), COL.cuerda, 0.6);
    const sale = tramo(u, 0.584, 0.589), va = tramo(u, 0.594, 0.6), sc = u > 0.584 ? 1 : 0;
    let px = mezcla(MOLDE2.x, BANCO.x, E.eio(va)), py = mezcla(ALTO + 3 + 7 * E.eo(sale), ALTO + 0.1, E.firme(va)) + 5 * Math.sin(Math.PI * va), pz = mezcla(MOLDE2.z, BANCO.z, E.eio(va));
    // 5. la primera obra: la pieza sale por el camino hasta el solar, con el punto encima
    const viaje = E.eio(tramo(u, 0.636, 0.655));
    if (viaje > 0) { rutaEn(viaje, tmp); px = tmp.x; pz = tmp.z; py = ALTO + 0.1 + 4 * Math.sin(Math.PI * viaje); }
    poner(piezas, 8, px, py, pz, 13 * sc * fin, 2 * Math.max(0.05, E.eo(sale)) * sc * fin, 8 * sc * fin, -GIRO + 0.6 * viaje);
    onda(ONDA_P + 3, BANCO, ALTO + 2.5, 5, 26, tramo(u, 0.587, 0.596), COL.ion, 1.1);
    onda(ONDA_P + 4, BANCO, ALTO + 2.5, 6, 34, tramo(u, 0.594, 0.604), COL.menta, 1.0);
    // 4. formación del equipo: cuatro figuras aparecen y, una a una, se certifican con su aro menta
    for (let i = 0; i < 4; i++) {
      const e = EQUIPO[i], s1 = E.vivo(tramo(u, 0.6 + i * 0.004, 0.612 + i * 0.004)), t = 0.607 + i * 0.0055, s2 = E.vivo(tramo(u, t, t + 0.01));
      poner(figuras, i, e.x, ALTO, e.z, Math.max(0.001, s1) * fin, Math.max(0.001, s1) * fin, Math.max(0.001, s1) * fin, reloj * 0.2 + i);
      poner(sellos, i, e.x, ALTO + 0.5, e.z, 3.6 * s2 * fin, 1, 3.6 * s2 * fin); color(sellos, i, COL.menta, 0.9 * Math.min(1, s2) * fin * (0.85 + 0.15 * Math.sin(reloj * 2 + i)));
      onda(ONDA_P + 5 + i, e, ALTO + 0.5, 3, 16, tramo(u, t, t + 0.012), COL.menta, 0.9);
    }
    // 5. el camino se dibuja, el solar aparece y, al llegar la pieza, el punto queda en marcha (a media luz, no activo)
    ruta.geometry.setDrawRange(0, Math.max(2, Math.round(NR * E.eo(tramo(u, 0.63, 0.642))))); ruta.material.opacity = 0.75 * E.eo(tramo(u, 0.63, 0.636)) * fin;
    solar.material.opacity = 0.8 * E.eo(tramo(u, 0.632, 0.64)) * fin;
    onda(ONDA_P + 9, SITIO, ALTO + 0.5, 4, 34, tramo(u, 0.655, 0.668), COL.menta, 0.9);
    const marcha = E.eo(tramo(u, 0.648, 0.66));
    onda(ONDA_P + 10, NP, ALTO + 0.5, 10, 55, tramo(u, 0.65, 0.666), COL.cuerda, 0.5);
    poner(charcos, 7, NP.x, ALTO + 0.4, NP.z, 30, 1, 30); color(charcos, 7, COL.cuerda, 0.3 * marcha * fin * (0.85 + 0.15 * Math.sin(reloj * 1.3)));
    figuras.instanceMatrix.needsUpdate = true; sellos.instanceMatrix.needsUpdate = true; sellos.instanceColor.needsUpdate = true;
  }
  // 0. qué fabricas hoy: el punto lee la nave; tres lecturas se encienden y se recogen al empezar el diagnóstico
  function lectura(u, reloj, fin) {
    nave.visible = fin > 0.001; nave.material.opacity = 0.42 * E.eo(tramo(u, 0.503, 0.515)) * fin;
    const lv = (1 - E.eo(tramo(u, 0.537, 0.548))) * (fin > 0.001 ? 1 : 0), on = (a, b2) => Math.max(0.001, E.vivo(tramo(u, a, b2))) * lv;
    // la pieza tipo: sube de pie, gira despacio y se lee (ion)
    const sc = on(0.513, 0.52); poner(piezas, 9, COMPONENTE.x, ALTO + 0.1, COMPONENTE.z, 7 * sc, 5 * sc, 0.9 * sc, 0.6 + reloj * 0.35);
    onda(ONDA_P + 11, COMPONENTE, ALTO + 0.5, 4, 20, tramo(u, 0.516, 0.528), COL.ion, 1.1 * lv);
    // los materiales: hormigón, madera y acero; la luz los recorre (cualquiera vale: es ilustrativo)
    const cual = Math.floor(reloj * 0.8) % 3;
    MATERIALES.forEach((m, i) => { const s2 = on(0.519 + i * 0.0025, 0.526 + i * 0.0025), sube = i === cual ? 1.3 : 0; poner(piezas, 10 + i, m.x, ALTO + 0.1 + sube * s2, m.z, 3.2 * s2, 3.2 * s2, 3.2 * s2, 0.35); });
    const ml = MATERIALES[cual], fm = (reloj * 0.8) % 1;
    onda(ONDA_P + 12, ml, ALTO + 0.5, 2.4, 6.5, tramo(u, 0.522, 0.6) > 0 ? fm : 0, COL.cuerda, 0.9 * lv * tramo(u, 0.522, 0.526));
    // la escala de digitalización y automatización: cinco barras que se encienden de abajo arriba
    const sube = E.eo(tramo(u, 0.527, 0.535)), base = on(0.525, 0.531);
    ESCALA.forEach((e, i) => { const h = 1.6 + i * 1.3, lleno = tramo(sube * 5, i, i + 0.8);
      poner(escala, i, e.x, ALTO + 0.1, e.z, 1.5 * base, h * base, 1.5 * base); color(escala, i, lleno > 0 ? COL.ion : COL.cuerda, lleno > 0 ? 0.35 + 0.95 * lleno : 0.18); });
    onda(ONDA_P + 13, ESCALA[2], ALTO + 0.5, 4, 22, tramo(u, 0.533, 0.545), COL.ion, 0.9 * lv);
    escala.instanceMatrix.needsUpdate = true; escala.instanceColor.needsUpdate = true;
  }
  // el u de la página (620vh, con los pasos) llevado al guion de antes, tramo a tramo
  const MAPA = [[0, 0], [0.175, 0.2], [0.335, 0.405], [0.38, 0.485], [0.49, 0.585], [0.665, 0.6], [0.7, 0.67], [1, 1]];
  function Q(u) { let i = 0; while (i < MAPA.length - 2 && u > MAPA[i + 1][0]) i++; const a = MAPA[i], b2 = MAPA[i + 1]; return mezcla(a[1], b2[1], tramo(u, a[0], b2[0])); }

  // normales suaves en los cantos redondeados y vivas en las esquinas (la de la apertura)
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

  return {
    escena, camara,
    medir(w, h) { W = w; H = h; camAux.fov = camara.fov; huecos(); medido = -9; },
    actualizar(u, reloj, dt = 0.016) {
      if (reloj - medido > 1) { medido = reloj; huecos(); }                // los textos pueden cambiar de alto (fuentes, ancho): se vuelven a medir
      const q = Q(u), d = encuadrar(q, u, reloj);
      señalar(u, dt);
      pasos(u, reloj);
      fotograma(q, reloj, d);
      moverPunto(u, reloj, d);
    },
  };
});

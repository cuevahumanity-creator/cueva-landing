// ─────────────────────────────────────────────────────────────────────
//  Motor de propuestas CUEVA · la maqueta
//  Un renderer propio y pequeño (no es un capítulo del núcleo: es una sección del DOM).
//  1. Cada pieza del despiece es una placa de esmalte blanco con los cantos redondeados:
//     las losas tumbadas y los paneles de fachada de pie, con sus huecos cortados.
//  2. La casa se monta en orden de obra: forjado sanitario, muros de la planta baja,
//     forjado de planta, muros de arriba y cubiertas. Cada pieza cae con su peso, rebota un
//     poco y se asienta; el punto ámbar salta a la que acaba de llegar.
//  3. El sol es el de tu parcela: azimut y elevación del algoritmo de la NOAA a la hora
//     que elijas, con sombras reales. El cielo pasa del blanco del día al azul del ocaso.
//  4. Se gira arrastrando (o con las flechas), se acerca con la rueda sobre la maqueta
//     enfocada, con los botones o pellizcando. Solo dibuja cuando algo cambia.
//  Las luces nunca se ocultan: se apagan bajando su intensidad.
// ─────────────────────────────────────────────────────────────────────
(() => {
  const T3 = window.THREE;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), mezcla = (a, b, u) => a + (b - a) * u;
  const muelle = (z, w) => (u) => { if (u <= 0) return 0; if (u >= 1) return 1; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * u) * (Math.cos(wd * u) + (z * w / wd) * Math.sin(wd * u)); };
  const caer = muelle(0.42, 13), eo = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const COL = { blanco: 0xF4F6FA, tinta: 0x1B2951, ion: 0x0EA5E9, cian: 0x56DCE6, ambar: 0xF59E0B, menta: 0x00D4AA };
  const PASO = 0.75, ZOCALO = 0.45, LOSA = 0.25, ALTO = 3.0, MURO = 0.2;

  function crear(caja, opciones = {}) {
    const lienzo = document.createElement('canvas');
    lienzo.className = 'cf-lienzo3d'; lienzo.tabIndex = 0;
    lienzo.setAttribute('role', 'img'); lienzo.setAttribute('aria-label', 'Maqueta 3D de la propuesta. Arrastra o usa las flechas para girarla; más y menos para acercar.');
    caja.appendChild(lienzo);
    const renderer = new T3.WebGLRenderer({ canvas: lienzo, antialias: true, preserveDrawingBuffer: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = T3.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T3.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
    const escena = new T3.Scene(), camara = new T3.PerspectiveCamera(30, 1, 0.1, 500);
    const cieloDia = new T3.Color(0xE7EBF1), cieloOcaso = new T3.Color(0xD7DFEC), cieloNoche = new T3.Color(0x0E1730), fondo = new T3.Color();
    // lo que se refleja en el esmalte: una sala clara con ventanales (la del plató blanco)
    escena.environment = (() => {
      const pm = new T3.PMREMGenerator(renderer), sala = new T3.Scene();
      sala.add(new T3.Mesh(new T3.BoxGeometry(20, 20, 20), new T3.MeshBasicMaterial({ color: new T3.Color(0.72, 0.75, 0.8), side: T3.BackSide })));
      const vent = (x, y, z, w, h, k) => { const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({ color: new T3.Color(k, k, k * 1.02), side: T3.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sala.add(m); };
      vent(-4, 6, 7, 9, 3.2, 4.5); vent(7.5, 2, 5, 2.4, 8, 2.6); vent(0, 8, 0, 16, 5, 1.3); vent(0, -6, 0, 20, 20, 0.5);
      const t = pm.fromScene(sala, 0.03).texture; pm.dispose(); return t;
    })();
    const cielo = new T3.HemisphereLight(0xffffff, 0xc9d1de, 0.55);
    const sol = new T3.DirectionalLight(0xfff6ea, 3.1);
    sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02; sol.shadow.radius = 4;
    const relleno = new T3.DirectionalLight(0xcfe3ff, 0.35);
    escena.add(cielo, sol, sol.target, relleno, relleno.target);
    const suelo = new T3.Mesh(new T3.PlaneGeometry(400, 400), new T3.ShadowMaterial({ color: COL.tinta, opacity: 0.24 }));
    suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; escena.add(suelo);
    // el punto ámbar: lee cada pieza que llega
    const punto = new T3.Group();
    const matPunto = new T3.MeshPhysicalMaterial({ color: COL.ambar, emissive: COL.ambar, emissiveIntensity: 1.3, roughness: 0.25, clearcoat: 1 });
    const esfera = new T3.Mesh(new T3.SphereGeometry(0.16, 32, 20), matPunto);
    const luzPunto = new T3.PointLight(0xffa726, 0, 6, 2);
    punto.add(esfera, luzPunto); escena.add(punto);

    // ── materiales ──
    const esmalte = new T3.MeshPhysicalMaterial({ color: COL.blanco, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1 });
    const esmalteMadera = new T3.MeshPhysicalMaterial({ color: 0xC9A27A, roughness: 0.55, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.3 });
    const vidrio = new T3.MeshPhysicalMaterial({ color: 0x1f2f55, roughness: 0.05, metalness: 0.2, clearcoat: 1, transparent: true, opacity: 0.62, depthWrite: false, emissive: 0xffe2b8, emissiveIntensity: 0 });
    const tabique = new T3.MeshStandardMaterial({ color: 0xDCE1E9, roughness: 0.85, metalness: 0 });
    const matSuelos = new Map(), matSuelo = (hex) => { if (!matSuelos.has(hex)) matSuelos.set(hex, new T3.MeshStandardMaterial({ color: hex, roughness: 0.9, envMapIntensity: 0.35 })); return matSuelos.get(hex); };
    // sombra de contacto: una mancha suave bajo la casa
    const contactoTx = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, 'rgba(27,41,81,.55)'); g.addColorStop(0.6, 'rgba(27,41,81,.18)'); g.addColorStop(1, 'rgba(27,41,81,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; })();
    const puerta = new T3.MeshPhysicalMaterial({ color: COL.tinta, roughness: 0.35, clearcoat: 0.6 });
    const agua = new T3.MeshPhysicalMaterial({ color: 0x5fc9df, roughness: 0.05, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85 });
    const pavimento = new T3.MeshStandardMaterial({ color: 0xE6E9EF, roughness: 0.9 });
    const matPilar = esmalte;

    // ── geometría: placas con los cantos redondeados ──
    const GEO = new Map();
    function rectR(s, x0, y0, x1, y1, r) {
      r = Math.min(r, (x1 - x0) / 2 - 1e-3, (y1 - y0) / 2 - 1e-3);
      s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
      s.lineTo(x1, y1 - r); s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
      s.lineTo(x0 + r, y1); s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
      s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false); return s;
    }
    // placa de largo l (x) por ancho a (y de la forma), grueso g; huecos en coordenadas de la forma
    function placa(l, a, g, huecos) {
      const k = `${l.toFixed(3)}|${a.toFixed(3)}|${g}|${huecos ? huecos.map((h) => h.map((v) => v.toFixed(2)).join(',')).join(';') : ''}`;
      if (GEO.has(k)) return GEO.get(k);
      const sh = rectR(new T3.Shape(), 0, 0, l, a, 0.05);
      if (huecos) for (const [x0, y0, x1, y1] of huecos) sh.holes.push(rectR(new T3.Path(), x0, y0, x1, y1, 0.03));
      const bis = Math.min(0.025, g / 4);
      const geo = new T3.ExtrudeGeometry(sh, { depth: g - 2 * bis, bevelEnabled: true, bevelThickness: bis, bevelSize: bis, bevelOffset: -bis, bevelSegments: 2, curveSegments: 3 });
      geo.translate(0, 0, bis);
      GEO.set(k, geo); return geo;
    }
    const cajaGeo = new T3.BoxGeometry(1, 1, 1);

    // ── estado ──
    let casa = null, piezas = [], extras = [], t0 = 0, montando = false, centro = new T3.Vector3(), radio = 10;
    const vista = { az: -0.62, el: 0.6, d: 30, objetivo: new T3.Vector3() };
    let corte = 0, corteAuto = true, tFin = 0;
    let solPos = { az: 180, elev: 45 }, noche = 0, sucio = true, girando = 0, tUltimo = 0, visible = true, autogiro = 0;
    let W = 0, H = 0;

    function limpiar() {
      if (casa) { escena.remove(casa); casa = null; }
      for (const e of extras) e.parent?.remove(e);
      piezas = []; extras = []; marcas = [];
    }
    // colores por tipo de pieza J (para la vista despiezada); los cortes, más claros
    const BASE_J = { J1: 0x9FB4D9, J2: 0x6F9BE0, J4: 0x56DCE6, J6: 0x0EA5E9, J8: 0x3B6FD1, J10: 0x1B2951, J12: 0x5B6478 };
    const matJ = new Map();
    function matTipo(nombre) {
      if (matJ.has(nombre)) return matJ.get(nombre);
      const tipo = (nombre || '').split(' ')[0], c = new T3.Color(BASE_J[tipo] ?? 0x8A93A6);
      if (/\(/.test(nombre || '')) c.lerp(new T3.Color(0xffffff), 0.38);
      const m = new T3.MeshPhysicalMaterial({ color: c, roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.12 });
      matJ.set(nombre, m); return m;
    }
    const colorTipo = (nombre) => '#' + matTipo(nombre).color.getHexString();
    // la grúa torre: mástil, pluma, contrapluma, carro y cable
    const acero = new T3.MeshStandardMaterial({ color: 0x2B3A63, roughness: 0.5, metalness: 0.3 });
    const grua = new T3.Group(); grua.visible = false; escena.add(grua);
    const mastil = new T3.Mesh(cajaGeo, acero), pluma = new T3.Group(), brazo = new T3.Mesh(cajaGeo, acero), contra = new T3.Mesh(cajaGeo, acero), lastre = new T3.Mesh(cajaGeo, acero), carro = new T3.Mesh(cajaGeo, acero), cabina = new T3.Mesh(cajaGeo, acero);
    [mastil, brazo, contra, lastre, carro, cabina].forEach((m) => { m.castShadow = true; });
    pluma.add(brazo, contra, lastre, carro, cabina); grua.add(mastil, pluma);
    const cable = new T3.Line(new T3.BufferGeometry().setFromPoints([new T3.Vector3(), new T3.Vector3(0, -1, 0)]), new T3.LineBasicMaterial({ color: 0x1B2951 })); cable.frustumCulled = false; grua.add(cable);
    let gruaAlto = 9, gruaPluma = 14;
    function armarGrua(x, z, alto, alcance) {
      gruaAlto = alto; gruaPluma = alcance; grua.position.set(x, 0, z);
      mastil.scale.set(0.32, alto, 0.32); mastil.position.set(0, alto / 2, 0);
      pluma.position.set(0, alto, 0);
      brazo.scale.set(alcance, 0.28, 0.28); brazo.position.set(alcance / 2, 0.14, 0);
      contra.scale.set(alcance * 0.3, 0.26, 0.26); contra.position.set(-alcance * 0.15, 0.14, 0);
      lastre.scale.set(0.9, 0.7, 0.7); lastre.position.set(-alcance * 0.27, -0.2, 0);
      cabina.scale.set(0.7, 0.6, 0.6); cabina.position.set(0.4, -0.45, 0.45);
      carro.scale.set(0.45, 0.2, 0.4); carro.position.set(alcance * 0.6, -0.05, 0);
    }
    const gTmp = new T3.Vector3();
    function apuntarGrua(w) {
      // w: punto del mundo donde cuelga la pieza
      const dx = w.x - grua.position.x, dz = w.z - grua.position.z, r = Math.hypot(dx, dz);
      pluma.rotation.y = Math.atan2(-dz, dx);
      carro.position.x = clamp(r, 1, gruaPluma - 0.3);
      const pos = cable.geometry.attributes.position;
      pos.setXYZ(0, carro.position.x * Math.cos(-pluma.rotation.y), gruaAlto - 0.1, carro.position.x * Math.sin(-pluma.rotation.y));
      pos.setXYZ(1, dx, w.y + 0.05, dz); pos.needsUpdate = true;
    }
    // marcas de uniones
    let marcas = [];
    const MAT_UNION = { atornillada: new T3.MeshStandardMaterial({ color: 0x5B6478, metalness: 0.6, roughness: 0.35 }), soldada: new T3.MeshStandardMaterial({ color: 0x0EA5E9, roughness: 0.4 }), apoyada: new T3.MeshStandardMaterial({ color: 0x00A88A, roughness: 0.5 }) };
    let modo = 'normal', abre = 0;
    // ── construir la maqueta a partir de la propuesta ──
    function mostrar(P, op = {}) {
      limpiar();
      const madera = !!op.madera;
      casa = new T3.Group(); escena.add(casa);
      const interior = new T3.Group(); casa.add(interior);
      const Wm = P.W * PASO, Hm = P.H * PASO;
      interior.position.set(-Wm / 2, 0, -Hm / 2);
      casa.rotation.y = -(P.rot || 0) * Math.PI / 2;
      const orden = [];
      const nivel = (z) => ZOCALO + z * ALTO;                   // cara superior del forjado de la planta z
      // losas
      const faldones = [];
      for (const L of P.losas) {
        const y0 = L.k === 'sanitario' ? ZOCALO - LOSA : nivel(L.z) - LOSA;
        const fase = L.k === 'sanitario' ? 0 : L.k === 'planta1' ? 2 : L.k === 'cubierta0' ? (P.plantas > 1 ? 2.5 : 2) : 4;
        // los faldones de una cubierta a dos aguas giran sobre su alero
        let padre = interior, zAlero = 0, kz = 1;
        if (L.inclinado) {
          const I = L.inclinado, ang = I.pendiente * Math.PI / 180, piv = new T3.Group();
          zAlero = I.alero * PASO; kz = 1 / Math.cos(ang);
          piv.position.set(0, y0 + LOSA, zAlero); piv.rotation.x = I.lado === 0 ? -ang : ang; interior.add(piv); padre = piv;
          faldones.push(I);
        }
        for (const p of L.piezas) {
          const l = p.w * PASO - 0.03, a = p.h * PASO - 0.03;
          const m = new T3.Mesh(placa(l, a, LOSA), esmalte);
          m.rotation.x = Math.PI / 2;                       // la forma queda en el plano XZ, el grueso hacia abajo
          if (L.inclinado) { m.position.set(p.x * PASO + 0.015, 0, (p.y * PASO + 0.015 - zAlero) * kz); m.scale.y = kz; }
          else m.position.set(p.x * PASO + 0.015, y0 + LOSA, p.y * PASO + 0.015);
          m.castShadow = true; m.receiveShadow = true; padre.add(m);
          orden.push({ m, mesh: m, tipo: p.nombre, etapa: L.n, fase, clave: p.y * 100 + p.x, base: m.position.clone(), centro: [m.position.x + l / 2, m.position.z + a / 2], tam: Math.max(l, a), techo: L.uso === 'cubierta', alta: L.z >= 1 && L.k !== 'cubierta0' });
        }
      }
      // muros, con sus huecos
      const esquinaX = (f, c, cx) => P.muros.some((q) => q.f === f && q.eje === 'x' && q.c === c && q.a <= cx && cx <= q.b);
      for (const m of P.muros) {
        const y0 = nivel(m.f), hAlto = ALTO - LOSA;
        const largo = (m.b - m.a) * PASO;
        // los muros en «y» se recogen en las esquinas donde ya hay un muro en «x»
        let i0 = 0, i1 = 0;
        if (m.eje === 'y') { if (esquinaX(m.f, m.a, m.c)) i0 = MURO; if (esquinaX(m.f, m.b, m.c)) i1 = MURO; }
        const fase = m.f === 0 ? 1 : 3;
        for (const pn of m.paneles) {
          let u0 = pn.x * PASO, u1 = (pn.x + pn.w) * PASO;
          if (pn.x === 0) u0 += i0; if (pn.x + pn.w === m.b - m.a) u1 -= i1;
          const l = u1 - u0 - 0.03; if (l <= 0.05) continue;
          const hu = [];
          for (const h of m.huecos) {
            const a = Math.max(h.a, u0 + 0.12) - u0, b = Math.min(h.b, u1 - 0.12) - u0;
            if (b - a < 0.3) continue;
            hu.push([a, h.z0 <= 0.01 ? 0.0 : h.z0, b, Math.min(h.z1, hAlto - 0.15), h.tipo]);
          }
          // un hueco que toca el suelo se abre por abajo: la forma lo deja como entalla
          const agujeros = hu.filter((q) => q[1] > 0.05).map((q) => q.slice(0, 4));
          let geo;
          if (hu.some((q) => q[1] <= 0.05)) geo = panelConEntallas(l, hAlto, MURO, hu);
          else geo = placa(l, hAlto, MURO, agujeros.length ? agujeros : null);
          const mesh = new T3.Mesh(geo, madera && m.f === 1 ? esmalteMadera : esmalte);
          mesh.castShadow = true; mesh.receiveShadow = true;
          const g = new T3.Group(); g.add(mesh);
          // orientación: la forma va en el plano XY local (u a lo largo del muro, v hacia arriba), el grueso en z local
          if (m.eje === 'x') {
            const zc = m.c * PASO + (m.lado === 'ym' ? 0 : -MURO);
            g.position.set(m.a * PASO + u0 + 0.015, y0, zc);
          } else {
            const xc = m.c * PASO + (m.lado === 'xm' ? MURO : 0);
            g.rotation.y = -Math.PI / 2;
            g.position.set(xc, y0, m.a * PASO + u0 + 0.015);
            // tras girar, el grueso apunta a −x: desde x + 0,20 (lado oeste) o desde x (lado este), siempre hacia dentro
          }
          // vidrios y puertas en los huecos
          for (const q of hu) {
            const [a, z0, b, z1, tipo] = q;
            const v = new T3.Mesh(cajaGeo, tipo === 'puerta' || tipo === 'portón' ? puerta : vidrio);
            v.scale.set(b - a - 0.04, z1 - z0 - 0.04, 0.03); v.position.set((a + b) / 2, (z0 + z1) / 2, MURO / 2); g.add(v);
          }
          interior.add(g);
          const cxp = m.eje === 'x' ? g.position.x + l / 2 : g.position.x, czp = m.eje === 'x' ? g.position.z : g.position.z + l / 2;
          orden.push({ m: g, mesh, tipo: pn.nombre, etapa: m.f ? 'Muros de la planta primera' : 'Muros de la planta baja', fase, clave: (m.eje === 'x' ? m.c * 50 + m.a + pn.x : m.c * 50 + 1000 + m.a + pn.x), base: g.position.clone(), centro: [cxp, czp], tam: l, alta: m.f >= 1, muro: true });
        }
      }
      // por dentro: el suelo de cada estancia con su tinte y los tabiques (que no son piezas J)
      const TIN = { salon: '#9CCBEB', cocina: '#A6DADF', principal: '#C2CCDD', dormitorio: '#C7D0E0', estudio: '#B9C8E6', bano: '#9FD6DD', aseo: '#9FD6DD', lavadero: '#B5D8DC', vestidor: '#C7D0E0', vestibulo: '#D3D8E2', paso: '#D9DDE5', escalera: '#C4CAD6', garaje: '#CDD1D9', porche: '#DDE1E8' };
      const hexDe = (t) => parseInt((TIN[t] || '#EEF1F6').slice(1), 16);
      for (let f = 0; f < P.plantas; f++) {
        const g = P.grids[f], yS = nivel(f) + 0.004;
        const abiertas = (a, b) => { const A = P.rooms[a], B = P.rooms[b]; return (A.t === 'cocina' && A.abierta && B.t === 'salon') || (B.t === 'cocina' && B.abierta && A.t === 'salon') || (A.t === 'paso' && B.t === 'paso'); };
        const separa = (a, b) => a >= 0 && b >= 0 && a !== b && !abiertas(a, b) && P.rooms[a].t !== 'porche' && P.rooms[b].t !== 'porche';
        // suelos: por estancia, tramos de fila
        for (let y = 0; y < P.H; y++) {
          let x = 0;
          while (x < P.W) {
            const v = g[y * P.W + x]; if (v < 0) { x++; continue; }
            let x2 = x; while (x2 < P.W && g[y * P.W + x2] === v) x2++;
            const s2 = new T3.Mesh(cajaGeo, matSuelo(hexDe(P.rooms[v].t)));
            s2.scale.set((x2 - x) * PASO, 0.012, PASO); s2.position.set((x + x2) / 2 * PASO, yS, (y + 0.5) * PASO); s2.receiveShadow = true; interior.add(s2);
            orden.push({ m: s2, fase: f * 2 + 0.6, clave: y * 100 + x, base: s2.position.clone(), tam: 0, interior: true, alta: f >= 1 });
            x = x2;
          }
        }
        // tabiques: aristas entre estancias distintas, en tramos rectos
        const huecosP = new Map();
        for (const d of P.puertas || []) if (d.f === f) { const k = d.eje + '|' + d.c; if (!huecosP.has(k)) huecosP.set(k, []); huecosP.get(k).push([d.a, d.b]); }
        // un tramo de tabique, partido donde hay puerta
        const tramoP = (eje, c, u0, u1) => {
          const hs = (huecosP.get(eje + '|' + c) || []).filter(([a, b]) => b > u0 && a < u1).sort((p, q) => p[0] - q[0]);
          let u = u0;
          for (const [a, b] of hs) { if (a - u > 0.12) (eje === 'y' ? tramo(c * PASO, u, c * PASO, a) : tramo(u, c * PASO, a, c * PASO)); u = Math.max(u, b); }
          if (u1 - u > 0.12) (eje === 'y' ? tramo(c * PASO, u, c * PASO, u1) : tramo(u, c * PASO, u1, c * PASO));
        };
        const tramo = (x0, z0, x1, z1) => {
          const t = new T3.Mesh(cajaGeo, tabique), lx = Math.abs(x1 - x0), lz = Math.abs(z1 - z0);
          t.scale.set(Math.max(lx, 0.08), 2.45, Math.max(lz, 0.08)); t.position.set((x0 + x1) / 2, nivel(f) + 1.225, (z0 + z1) / 2);
          t.castShadow = true; t.receiveShadow = true; interior.add(t);
          orden.push({ m: t, fase: f * 2 + 1.2, clave: x0 * 7 + z0, base: t.position.clone(), tam: 0, interior: true, alta: f >= 1 });
        };
        for (let x = 1; x < P.W; x++) {
          let ini = -1;
          for (let y = 0; y <= P.H; y++) {
            const ok = y < P.H && separa(g[y * P.W + x - 1], g[y * P.W + x]);
            if (ok && ini < 0) ini = y;
            if (!ok && ini >= 0) { tramoP('y', x, ini * PASO + 0.1, y * PASO - 0.1); ini = -1; }
          }
        }
        for (let y = 1; y < P.H; y++) {
          let ini = -1;
          for (let x = 0; x <= P.W; x++) {
            const ok = x < P.W && separa(g[(y - 1) * P.W + x], g[y * P.W + x]);
            if (ok && ini < 0) ini = x;
            if (!ok && ini >= 0) { tramoP('x', y, ini * PASO + 0.1, x * PASO - 0.1); ini = -1; }
          }
        }
      }
      // sombra de contacto
      { const sc = new T3.Mesh(new T3.PlaneGeometry(Wm + 3, Hm + 3), new T3.MeshBasicMaterial({ map: contactoTx, transparent: true, depthWrite: false, opacity: 0.55 })); sc.rotation.x = -Math.PI / 2; sc.position.set(Wm / 2, 0.003, Hm / 2); interior.add(sc); }
      // porche: pilares en sus esquinas abiertas
      const g0 = P.grids[0];
      P.rooms.forEach((r, i) => {
        if (r.t !== 'porche') return;
        const esq = [[r.x0, r.y0], [r.x1, r.y0], [r.x0, r.y1], [r.x1, r.y1]];
        for (const [x, y] of esq) {
          // si la esquina no toca ninguna otra estancia, lleva pilar
          const cel = (xx, yy) => (xx >= 0 && yy >= 0 && xx < P.W && yy < P.H ? g0[yy * P.W + xx] : -1);
          const vecinas = [cel(x - 1, y - 1), cel(x, y - 1), cel(x - 1, y), cel(x, y)].filter((q) => q >= 0 && q !== i).length;
          if (vecinas) continue;
          const pil = new T3.Mesh(cajaGeo, matPilar); pil.scale.set(0.16, ALTO - LOSA, 0.16);
          pil.position.set(x * PASO + (x === r.x0 ? 0.12 : -0.12), ZOCALO + (ALTO - LOSA) / 2, y * PASO + (y === r.y0 ? 0.12 : -0.12));
          pil.castShadow = true; interior.add(pil); orden.push({ m: pil, fase: 1, clave: 9999, base: pil.position.clone(), tam: 1 });
        }
      });
      // los patios (celdas −2 de la planta baja): pavimento, por tramos de fila
      { const g = P.grids[0]; for (let y = 0; y < P.H; y++) { let x = 0; while (x < P.W) { if (g[y * P.W + x] !== -2) { x++; continue; } let x2 = x; while (x2 < P.W && g[y * P.W + x2] === -2) x2++; const pv = new T3.Mesh(cajaGeo, pavimento); pv.scale.set((x2 - x) * PASO, 0.05, PASO + 0.002); pv.position.set((x + x2) / 2 * PASO, 0.025, (y + 0.5) * PASO); pv.receiveShadow = true; interior.add(pv); x = x2; } } }
      // hastiales de la cubierta a dos aguas: triángulos de esmalte en los dos extremos
      if (faldones.length === 2) {
        const I = faldones[0], ang = I.pendiente * Math.PI / 180, za = Math.min(...faldones.map((q) => q.alero)) * PASO, zb = Math.max(...faldones.map((q) => q.alero)) * PASO, zc = I.cumbrera * PASO;
        const xsF = P.losas.filter((L) => L.inclinado).flatMap((L) => L.piezas.flatMap((p) => [p.x, p.x + p.w]));
        const y0 = nivel(2) - LOSA + LOSA, hm = (zc - za) * Math.tan(ang);
        const sh = new T3.Shape(); sh.moveTo(0, 0); sh.lineTo(zb - za, 0); sh.lineTo(zc - za, hm); sh.lineTo(0, 0);
        const geoH = new T3.ExtrudeGeometry(sh, { depth: MURO, bevelEnabled: false });
        for (const x of [Math.min(...xsF) * PASO, Math.max(...xsF) * PASO - MURO]) {
          const hz = new T3.Mesh(geoH, esmalte); hz.rotation.y = -Math.PI / 2; hz.position.set(x + MURO, y0 - LOSA, za); hz.castShadow = true; hz.receiveShadow = true; interior.add(hz);
          orden.push({ m: hz, mesh: hz, tipo: 'hastial', fase: 4.5, clave: x, base: hz.position.clone(), centro: [x, (za + zb) / 2], tam: 1, techo: true });
        }
      }
      // la piscina, en el jardín (orientativa)
      if (op.piscina) {
        const pis = new T3.Group();
        const borde = new T3.Mesh(cajaGeo, pavimento); borde.scale.set(4.4, 0.08, 8.4); pis.add(borde);
        const lam = new T3.Mesh(cajaGeo, agua); lam.scale.set(3.4, 0.05, 7.4); lam.position.y = 0.05; pis.add(lam);
        // al jardín: fuera de la casa, por el lado contrario a la calle
        const off = op.jardin || { x: 0, z: 1 };
        const impar = (P.rot || 0) % 2 === 1, dist = (Math.abs(off.x) ? (impar ? Hm : Wm) : (impar ? Wm : Hm)) / 2;
        pis.position.set(off.x * (dist + 4.8), 0.04, off.z * (dist + 4.8));
        if (Math.abs(off.x)) pis.rotation.y = Math.PI / 2;
        pis.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
        escena.add(pis); extras.push(pis); casa.userData.piscina = pis;
      }
      // la parcela y la trama
      if (op.parcela) {
        const { an, fo, cx, cz } = op.parcela;
        const pts = [[-an / 2, -fo / 2], [an / 2, -fo / 2], [an / 2, fo / 2], [-an / 2, fo / 2], [-an / 2, -fo / 2]].map(([x, z]) => new T3.Vector3(x + cx, 0.01, z + cz));
        const lin = new T3.Line(new T3.BufferGeometry().setFromPoints(pts), new T3.LineBasicMaterial({ color: COL.ion, transparent: true, opacity: 0.7 }));
        escena.add(lin); extras.push(lin);
      }
      {
        const ext = Math.ceil((Math.max(Wm, Hm) / 2 + 6) / PASO) * PASO, v = [];
        for (let x = -ext; x <= ext + 1e-6; x += PASO) { v.push(x, 0.004, -ext, x, 0.004, ext); v.push(-ext, 0.004, x, ext, 0.004, x); }
        const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(v, 3));
        const trama = new T3.LineSegments(geo, new T3.LineBasicMaterial({ color: COL.tinta, transparent: true, opacity: 0.07 }));
        escena.add(trama); extras.push(trama);
      }
      // las uniones (reparto ilustrativo), como marcas pequeñas en su sitio
      if (P.uniones) {
        const porTipo = { atornillada: [], soldada: [], apoyada: [] };
        for (const u of P.uniones.pts) porTipo[u.t]?.push(u);
        const geoU = { atornillada: new T3.BoxGeometry(0.42, 0.05, 0.42), soldada: new T3.BoxGeometry(0.07, 2.2, 0.07), apoyada: new T3.BoxGeometry(0.5, 0.07, 0.24) };
        const mtx = new T3.Matrix4();
        for (const t of Object.keys(porTipo)) {
          const L = porTipo[t]; if (!L.length) continue;
          const im = new T3.InstancedMesh(geoU[t], MAT_UNION[t], L.length);
          L.forEach((u, k) => { const y = t === 'atornillada' ? nivel(u.z) + 0.03 : t === 'soldada' ? nivel(u.z) + 1.375 : nivel(u.z) - LOSA - 0.035; mtx.makeTranslation(u.x, y, u.y); im.setMatrixAt(k, mtx); });
          im.visible = false; interior.add(im); marcas.push(im);
        }
      }
      // la grúa: al lado de la casa, por la calle, con alcance hasta la esquina más lejana
      {
        const rotq = (P.rot || 0) % 2, wx = rotq ? Hm : Wm, wz = rotq ? Wm : Hm, gx = wx / 2 + 2.6, gz = -wz / 2 + 1.2;
        armarGrua(gx, gz, P.plantas * ALTO + 6.5, Math.hypot(gx + wx / 2, gz - wz / 2) + 1.2);
      }
      // orden de montaje: por fases y, dentro de cada fase, de un extremo a otro
      orden.sort((a, b) => a.fase - b.fase || a.clave - b.clave);
      const nJ = orden.filter((o) => !o.interior).length, dur = clamp(5.2 / Math.max(1, nJ), 0.035, 0.1);
      let kk = 0, tI = 0.35;
      for (const o of orden) { if (o.interior) o.t = tI + 0.05; else { o.t = 0.35 + kk * dur + o.fase * 0.22; tI = o.t; kk++; } o.lift = 0; o.m.position.y = o.base.y + 7; o.m.visible = false; }
      tFin = Math.max(...orden.map((o) => o.t)) + 0.7; corte = 0; corteAuto = P.cubierta !== 'dosAguas'; modo = 'normal'; abre = 0; grua.visible = true;
      for (const o of orden) if (o.mesh) o.matBase = o.mesh.material;
      piezas = orden;
      // encuadre
      const alto = P.plantas * ALTO + ZOCALO;
      centro.set(0, alto * 0.3, 0); radio = Math.hypot(Wm, Hm, alto) / 2;
      if (P.cubierta === 'dosAguas') vista.az = -1.15; else vista.az = -0.62;
      vista.objetivo.copy(centro); caja3 = { wx: (P.rot || 0) % 2 ? Hm : Wm, wz: (P.rot || 0) % 2 ? Wm : Hm, alto }; encuadrar();
      t0 = performance.now(); montando = true; autogiro = 1; sucio = true; visto = visible;
      actualizarSol();
      arrancar();
    }
    // panel con huecos que llegan al suelo (puertas, ventanales): se arma con tiras
    function panelConEntallas(l, h, g, hu) {
      const k = `E|${l.toFixed(3)}|${h.toFixed(3)}|${hu.map((q) => q.slice(0, 4).map((v) => v.toFixed(2)).join(',')).join(';')}`;
      if (GEO.has(k)) return GEO.get(k);
      const sh = new T3.Shape();
      const bajos = hu.filter((q) => q[1] <= 0.05).sort((a, b) => a[0] - b[0]);
      sh.moveTo(0, 0);
      for (const [a, , b, z1] of bajos) { sh.lineTo(a, 0); sh.lineTo(a, z1); sh.lineTo(b, z1); sh.lineTo(b, 0); }
      sh.lineTo(l, 0); sh.lineTo(l, h); sh.lineTo(0, h); sh.lineTo(0, 0);
      for (const [a, z0, b, z1] of hu.filter((q) => q[1] > 0.05)) sh.holes.push(rectR(new T3.Path(), a, z0, b, z1, 0.03));
      const bis = 0.02;
      const geo = new T3.ExtrudeGeometry(sh, { depth: g - 2 * bis, bevelEnabled: true, bevelThickness: bis, bevelSize: bis, bevelOffset: -bis, bevelSegments: 2, curveSegments: 2 });
      geo.translate(0, 0, bis); GEO.set(k, geo); return geo;
    }
    // encuadre: la distancia a la que caben las ocho esquinas de la casa, dejando libre la franja de los controles
    let caja3 = null, dMeta = null;
    const esq = new T3.Vector3();
    function encuadrar() {
      if (!caja3) { vista.d = distanciaPara(radio); return; }
      vista.d = distanciaPara(radio);
      for (let it = 0; it < 6; it++) {
        colocarCamara(); camara.updateMatrixWorld();
        let mx = 0, my = 0, ny = 0;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0, caja3.alto]) {
          esq.set(sx * caja3.wx / 2, y, sz * caja3.wz / 2).project(camara);
          mx = Math.max(mx, Math.abs(esq.x)); my = Math.max(my, esq.y); ny = Math.min(ny, esq.y);
        }
        const k = Math.max(mx / 0.84, my / 0.74, -ny / 0.5);
        vista.d *= 1 + (k - 1) * 0.85;
      }
      dMeta = vista.d * (grua.visible ? 1.28 : 1); vista.d = dMeta;
    }
    const distanciaPara = (r) => r / Math.sin((camara.fov * Math.PI / 180) / 2) * (W < H ? 1.45 : 0.84);

    // ── el sol ──
    function fijarSol(p) { solPos = p; actualizarSol(); }
    function actualizarSol() {
      const az = solPos.az * Math.PI / 180, el = Math.max(-0.2, solPos.elev * Math.PI / 180);
      const d = Math.max(radio * 3, 25);
      sol.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(Math.max(el, 0.02)) * d, -Math.cos(az) * Math.cos(el) * d);
      sol.target.position.set(0, 0, 0);
      const cam = sol.shadow.camera, r = radio * 1.6 + 6;
      cam.left = -r; cam.right = r; cam.top = r; cam.bottom = -r; cam.near = 0.5; cam.far = d * 2.5; cam.updateProjectionMatrix();
      // de día a noche: intensidades y color del cielo (la luz no se oculta: baja a cero)
      const dia = clamp((solPos.elev + 4) / 14, 0, 1), dorado = clamp(1 - Math.abs(solPos.elev - 6) / 10, 0, 1);
      noche = 1 - dia;
      sol.intensity = 3.1 * dia;
      sol.color.setRGB(1, mezcla(0.97, 0.78, dorado), mezcla(0.92, 0.6, dorado));
      cielo.intensity = mezcla(0.14, 0.55, dia);
      relleno.intensity = mezcla(0.05, 0.35, dia);
      relleno.position.set(-sol.position.x * 0.6, d * 0.5, -sol.position.z * 0.6);
      renderer.toneMappingExposure = mezcla(0.85, 1.0, dia);
      vidrio.emissiveIntensity = noche * 0.9;
      fondo.copy(cieloDia).lerp(cieloOcaso, dorado * 0.8);
      fondo.lerp(cieloNoche, noche * 0.92);
      renderer.setClearColor(fondo, 1);
      suelo.material.opacity = 0.24 * dia + 0.03;
      renderer.shadowMap.needsUpdate = true; sucio = true; arrancar();
    }

    // ── cámara ──
    function colocarCamara() {
      const { az, el, d, objetivo } = vista;
      camara.position.set(objetivo.x + Math.sin(az) * Math.cos(el) * d, objetivo.y + Math.sin(el) * d, objetivo.z + Math.cos(az) * Math.cos(el) * d);
      camara.lookAt(objetivo); camara.near = Math.max(0.1, d * 0.02); camara.far = d * 12; camara.updateProjectionMatrix();
      if (opciones.alGirar) opciones.alGirar(az);
    }
    function medir() {
      const r = caja.getBoundingClientRect(); W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      renderer.setSize(W, H, false); camara.aspect = W / H; camara.updateProjectionMatrix(); if (!tocado) encuadrar(); sucio = true; arrancar();
    }
    const ro = new ResizeObserver(medir); ro.observe(caja);
    const io = new IntersectionObserver((e) => { const antes = visible; visible = e[0].isIntersecting; if (visible && !antes) alVerse(); if (visible) arrancar(); }, { threshold: 0.01 });
    // el montaje empieza cuando la maqueta se ve por primera vez (en el móvil, al abrir la hoja)
    let visto = false;
    function alVerse() { if (!visto && montando) { visto = true; t0 = performance.now(); } else visto = true; }
    io.observe(caja);

    // ── entrada: arrastrar, rueda (con la maqueta enfocada o con Ctrl), pellizco y teclado ──
    const punteros = new Map(); let pinza = 0;
    lienzo.addEventListener('pointerdown', (e) => { lienzo.setPointerCapture(e.pointerId); punteros.set(e.pointerId, { x: e.clientX, y: e.clientY }); autogiro = 0; if (punteros.size === 2) { const [a, b] = [...punteros.values()]; pinza = Math.hypot(a.x - b.x, a.y - b.y); } });
    lienzo.addEventListener('pointermove', (e) => {
      const p = punteros.get(e.pointerId); if (!p) return;
      if (punteros.size === 2) { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...punteros.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinza) zoom(pinza / d); pinza = d; return; }
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      vista.az -= dx * 0.008; vista.el = clamp(vista.el + dy * 0.006, 0.08, 1.35); sucio = true; arrancar();
    });
    const soltar = (e) => { punteros.delete(e.pointerId); pinza = 0; };
    lienzo.addEventListener('pointerup', soltar); lienzo.addEventListener('pointercancel', soltar);
    lienzo.addEventListener('wheel', (e) => { if (document.activeElement !== lienzo && !e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0012)); }, { passive: false });
    lienzo.addEventListener('keydown', (e) => {
      const k = e.key; let usado = true;
      if (k === 'ArrowLeft') vista.az += 0.12; else if (k === 'ArrowRight') vista.az -= 0.12;
      else if (k === 'ArrowUp') vista.el = clamp(vista.el + 0.08, 0.08, 1.35); else if (k === 'ArrowDown') vista.el = clamp(vista.el - 0.08, 0.08, 1.35);
      else if (k === '+' || k === '=') zoom(0.88); else if (k === '-' || k === '_') zoom(1.14); else usado = false;
      if (usado) { e.preventDefault(); autogiro = 0; sucio = true; arrancar(); }
    });
    let tocado = false;
    function zoom(f) { tocado = true; vista.d = clamp(vista.d * f, radio * 1.4, radio * 9); sucio = true; arrancar(); }

    // ── el bucle: solo mientras algo cambia ──
    let raf = 0, etapaAhora = null;
    function arrancar() { if (!raf && visible) raf = requestAnimationFrame(cuadro); }
    function cuadro(ahora) {
      raf = 0;
      const dt = Math.min(0.05, (ahora - (tUltimo || ahora)) / 1000); tUltimo = ahora;
      let seguir = false;
      if (montando) {
        const t = (ahora - t0) / 1000; let ultimo = null, todas = true;
        for (const o of piezas) {
          const u = (t - o.t) / 0.55;
          if (u <= 0) { o.m.visible = false; todas = false; continue; }
          o.m.visible = true;
          const k = caer(u), alto = o.interior ? 2.2 : 7;
          o.m.position.set(o.base.x, o.base.y + (1 - k) * alto, o.base.z);
          if (u < 1) { todas = false; if (!o.interior) ultimo = o; }
        }
        // el punto ámbar salta a la pieza que está llegando
        if (ultimo) {
          const w = new T3.Vector3(); ultimo.m.getWorldPosition(w);
          { const c = ultimo.centro ? gTmp.set(ultimo.centro[0], ultimo.m.position.y + (ultimo.muro ? ALTO - LOSA : 0.02), ultimo.centro[1]) : gTmp.copy(ultimo.m.position); ultimo.m.parent.localToWorld(c); apuntarGrua(c); }
          if (opciones.alMontaje && ultimo.etapa !== etapaAhora) { etapaAhora = ultimo.etapa; opciones.alMontaje(etapaAhora, piezas.filter((q) => !q.interior && q.t <= ultimo.t).length, piezas.filter((q) => !q.interior).length); }
          punto.position.lerp(w.add(new T3.Vector3(0, 0.9, 0)), 1 - Math.exp(-dt * 14));
          luzPunto.intensity = 1.2; esfera.scale.setScalar(1);
        } else if (todas) {
          montando = false; renderer.shadowMap.needsUpdate = true; grua.visible = false; etapaAhora = null; opciones.alMontaje?.(null); if (dMeta != null) dMeta /= 1.28;
        }
        renderer.shadowMap.needsUpdate = true; seguir = true;
      } else {
        // terminado: el punto se posa sobre la cubierta y se queda respirando poco a poco hasta apagarse
        const fin = (ahora - t0) / 1000 - (piezas.length ? piezas[piezas.length - 1].t + 0.6 : 0);
        const v = clamp(1 - fin / 2.5, 0, 1);
        luzPunto.intensity = 1.2 * v; esfera.scale.setScalar(Math.max(0.001, v));
        if (v > 0) seguir = true;
      }
      // el corte: la cubierta (y la planta alta) se levantan para ver la distribución
      { const t = (ahora - t0) / 1000; if (corteAuto && !montando && t > tFin + 0.9) { corteAuto = false; corte = 1; opciones.alCortar?.(corte); } if (corteAuto) seguir = true; }
      const metaAbre = modo === 'despiece' ? 1 : 0;
      if (Math.abs(abre - metaAbre) > 0.002) { abre += (metaAbre - abre) * (1 - Math.exp(-dt * 3.6)); seguir = true; renderer.shadowMap.needsUpdate = true; } else abre = metaAbre;
      const ea = abre * abre * (3 - 2 * abre), cx0 = casa ? casa.children[0].position.x * -1 : 0, cz0 = casa ? casa.children[0].position.z * -1 : 0;
      if (!montando) for (const o of piezas) {
        const meta = modo === 'despiece' ? 0 : (o.techo && corte >= 1) || (o.alta && corte >= 2) ? 1 : 0;
        if (Math.abs(o.lift - meta) > 0.002) { o.lift += (meta - o.lift) * (1 - Math.exp(-dt * 4.5)); seguir = true; renderer.shadowMap.needsUpdate = true; }
        else o.lift = meta;
        const e = o.lift * o.lift * (3 - 2 * o.lift);
        let ox = 0, oz = 0, oy = 0;
        if (ea > 0 && o.centro) {
          // despiezada: cada capa sube y se separa del centro
          const dx = o.centro[0] - cx0, dz = o.centro[1] - cz0, dl = Math.hypot(dx, dz) || 1;
          const sep = o.muro ? 1.6 : 0.5; ox = dx / dl * sep * ea; oz = dz / dl * sep * ea; oy = (o.fase * 1.35 + (o.muro ? 0.3 : 0)) * ea;
        }
        o.m.position.set(o.base.x + ox, o.base.y + e * 9 + oy, o.base.z + oz);
        o.m.visible = o.interior ? o.lift < 0.985 && ea < 0.05 : o.lift < 0.985;
      }
      if (dMeta != null && Math.abs(vista.d - dMeta) > 0.01 && !tocado) { vista.d += (dMeta - vista.d) * (1 - Math.exp(-dt * 2.2)); seguir = true; sucio = true; }
      if (autogiro > 0) { vista.az += dt * 0.12 * autogiro; autogiro = Math.max(0, autogiro - dt * 0.07); seguir = true; sucio = true; }
      if (sucio || seguir) { colocarCamara(); renderer.render(escena, camara); sucio = false; }
      if (seguir && visible) arrancar();
    }

    medir(); colocarCamara();
    return {
      mostrar, fijarSol, lienzo,
      girar(a) { vista.az = a; sucio = true; arrancar(); }, zoom,
      reencuadrar() { tocado = false; encuadrar(); sucio = true; arrancar(); },
      captura(w = 1600, h = 1000) {
        const pw = W, ph = H, d0 = vista.d; renderer.setSize(w, h, false); camara.aspect = w / h; camara.updateProjectionMatrix();
        vista.d = radio / Math.sin((camara.fov * Math.PI / 180) / 2) * 0.9; colocarCamara(); renderer.shadowMap.needsUpdate = true; renderer.render(escena, camara);
        const url = lienzo.toDataURL('image/png'); vista.d = d0; renderer.setSize(pw, ph, false); camara.aspect = pw / ph; camara.updateProjectionMatrix(); sucio = true; arrancar(); return url;
      },
      cortar(n) { corte = n; corteAuto = false; if (modo !== 'normal') this.modo('normal'); arrancar(); },
      // normal, despiece (colores por tipo J, separadas por capas) o uniones (marcas del reparto ilustrativo)
      modo(m) {
        modo = m; corteAuto = false;
        for (const o of piezas) if (o.mesh && o.matBase) o.mesh.material = m === 'despiece' ? matTipo(o.tipo) : o.matBase;
        for (const im of marcas) im.visible = m === 'uniones';
        if (m === 'uniones') corte = Math.max(corte, 1);
        renderer.shadowMap.needsUpdate = true; sucio = true; arrancar();
      },
      // volver a montar la casa, con la grúa
      montar() { if (dMeta != null && !grua.visible) dMeta *= 1.28; modo = 'normal'; abre = 0; for (const o of piezas) { if (o.mesh && o.matBase) o.mesh.material = o.matBase; o.lift = 0; } for (const im of marcas) im.visible = false; corte = 0; corteAuto = true; grua.visible = true; t0 = performance.now(); montando = true; etapaAhora = null; sucio = true; arrancar(); },
      colorTipo,
      get corte() { return corte; },
      saltarMontaje() { t0 = performance.now() - 60000; sucio = true; arrancar(); },
      destruir() { ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf); renderer.dispose(); lienzo.remove(); },
      despertar() { if (!visible) { visible = true; alVerse(); } medir(); arrancar(); },
      get azimut() { return vista.az; },
      get diagnostico() { return { montando, piezas: piezas.length, visibles: piezas.filter((o) => o.m.visible).length, W, H, d: vista.d, dMeta, visible, modo, corte, cam: camara.position.toArray().map((v) => +v.toFixed(1)) }; },
    };
  }

  window.CUEVA_MAQUETA = { crear };
})();

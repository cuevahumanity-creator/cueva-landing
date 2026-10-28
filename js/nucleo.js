// ─────────────────────────────────────────────────────────────────────
//  CUEVA · núcleo de la página
//  Un solo renderer de three.js para toda la página. Cada sección con data-cap es un
//  capítulo: su escena se monta cuando se acerca y se dibuja mientras ocupa la pantalla.
//  El lienzo se mueve dentro del .fijo (sticky) del capítulo activo, así entra y sale con él.
//  El avance de cada capítulo (u, de 0 a 1) sale del scroll y se suaviza; los textos con
//  data-en="a b" se encienden entre u = a y u = b.
//  Contrato completo en docs/CONTRATO.md.
// ─────────────────────────────────────────────────────────────────────
(() => {
  const T3 = window.THREE;
  const mezcla = (a, b, u) => a + (b - a) * u, tramo = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const muelle = (z, w) => (u) => { if (u <= 0) return 0; if (u >= 1) return 1; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * u) * (Math.cos(wd * u) + (z * w / wd) * Math.sin(wd * u)); };
  const E = { eo: (u) => 1 - Math.pow(1 - u, 3), eo5: (u) => 1 - Math.pow(1 - u, 5), ei: (u) => u * u * u, eio: (u) => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
    seno: (u) => -(Math.cos(Math.PI * u) - 1) / 2, rebote: muelle(0.32, 15), vivo: muelle(0.45, 14), suave: muelle(0.72, 11), firme: muelle(0.6, 16), muelle };
  const COL = { noche: 0x05070A, blanco: 0xF4F6FA, tinta: 0x1B2951, cian: 0x56DCE6, menta: 0x00D4AA, ion: 0x0EA5E9, coral: 0xFF6B4A, ambar: 0xF59E0B, niebla: 0x8A93A6, cuerda: 0xC9D2E3 };

  // ── el renderer, compartido ──
  const lienzo = document.createElement('canvas'); lienzo.className = 'lienzo'; lienzo.setAttribute('aria-hidden', 'true');
  const renderer = new T3.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(COL.noche, 1);
  renderer.toneMapping = T3.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T3.PCFSoftShadowMap;

  // lo que se refleja en el esmalte: una sala oscura con softboxes (el mismo plató de la apertura)
  const entorno = (() => {
    const pm = new T3.PMREMGenerator(renderer), sala = new T3.Scene();
    sala.add(new T3.Mesh(new T3.BoxGeometry(20, 20, 20), new T3.MeshBasicMaterial({ color: new T3.Color(0.1, 0.11, 0.13), side: T3.BackSide })));
    const caja = (x, y, z, w, h, k, c = [1, 1, 1]) => { const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({ color: new T3.Color(k * c[0], k * c[1], k * c[2]), side: T3.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sala.add(m); };
    caja(-4, 6, 7, 9, 3.2, 9); caja(7.5, 2, 5, 2.4, 8, 4); caja(0, 8, 0, 16, 5, 0.9); caja(0, 1, -9.5, 14, 2.2, 3, [0.6, 0.8, 1]);
    const tx = pm.fromScene(sala, 0.03).texture; pm.dispose(); return tx;
  })();
  // y el de los capítulos claros: una sala blanca con los mismos softboxes (el blanco sobre blanco se lee por las sombras)
  const entornoClaro = (() => {
    const pm = new T3.PMREMGenerator(renderer), sala = new T3.Scene();
    sala.add(new T3.Mesh(new T3.BoxGeometry(20, 20, 20), new T3.MeshBasicMaterial({ color: new T3.Color(0.78, 0.8, 0.84), side: T3.BackSide })));
    const caja = (x, y, z, w, h, k) => { const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({ color: new T3.Color(k, k, k), side: T3.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sala.add(m); };
    caja(-4, 6, 7, 9, 3.2, 5); caja(7.5, 2, 5, 2.4, 8, 3); caja(0, 8, 0, 16, 5, 1.4); caja(0, -6, 0, 20, 20, 0.55);
    const tx = pm.fromScene(sala, 0.03).texture; pm.dispose(); return tx;
  })();
  const FONDO = { oscuro: COL.noche, claro: 0xFFFFFF };
  const esmalte = (hex, o = {}) => new T3.MeshPhysicalMaterial({ color: hex, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1, ...o });
  const brilloPropio = (hex, k = 0.22) => ({ emissive: hex, emissiveIntensity: k });

  // el plató de noche: foco cenital con sombras, luz de recorte fría, suelo oscuro y niebla
  // tema «oscuro» (la noche de la apertura) o «claro» (el plató blanco: suelo que solo recibe sombras, sin niebla)
  function estudio(escena, { suelo = true, niebla = true, foco, tema = 'oscuro' } = {}) {
    const claro = tema === 'claro';
    escena.environment = claro ? entornoClaro : entorno;
    escena.add(claro ? new T3.HemisphereLight(0xffffff, 0xdfe4ee, 0.6) : new T3.HemisphereLight(0xffffff, 0x202634, 0.35));
    const clave = new T3.SpotLight(claro ? 0xffffff : 0xfff4e8, foco ?? (claro ? 2.6 : 3.4), 0, claro ? 0.5 : 0.36, claro ? 0.95 : 0.85, 0);
    clave.castShadow = true; clave.shadow.mapSize.set(2048, 2048); clave.shadow.bias = -0.0003; clave.shadow.normalBias = 0.8; clave.shadow.radius = 5;
    Object.assign(clave.shadow.camera, { near: 50, far: 8000 });
    const contra = new T3.DirectionalLight(claro ? 0xffffff : 0x8fc3ff, claro ? 0.45 : 0.9);
    escena.add(clave, clave.target, contra, contra.target);
    let piso = null;
    if (suelo) {
      const mat = claro ? new T3.ShadowMaterial({ color: COL.tinta, opacity: 0.14 }) : new T3.MeshStandardMaterial({ color: 0x080a0f, roughness: 0.82, metalness: 0, envMapIntensity: 0.12 });
      piso = new T3.Mesh(new T3.PlaneGeometry(40000, 40000), mat); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; escena.add(piso);
    }
    if (niebla && !claro) escena.fog = new T3.Fog(COL.noche, 1000, 4000);
    return {
      clave, contra, suelo: piso, tema, fondo: FONDO[tema],
      // apunta el foco a (x, y, z), con la distancia de cámara d para escalar luces y niebla
      enfocar(x, y, z, d) {
        clave.position.set(x - d * 0.3, y + d * 1.2, z + d * 0.4); clave.target.position.set(x, y, z);
        contra.position.set(x + d * 0.25, y + d * 0.6, z - d * 0.9); contra.target.position.set(x, y, z);
        if (escena.fog) { escena.fog.near = d * 1.1; escena.fog.far = d * 2.6; }
        // la sombra del foco, a la escala del plano (en los primeros planos no se pierde)
        const sc = clave.shadow.camera, n2 = Math.max(5, d * 0.25), f2 = d * 6; if (sc.near !== n2 || sc.far !== f2) { sc.near = n2; sc.far = f2; sc.updateProjectionMatrix(); }
      },
    };
  }
  // el punto ámbar: esfera que da luz, con halo
  const haloTx = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,200,110,.9)'); g.addColorStop(0.22, 'rgba(245,158,11,.32)'); g.addColorStop(1, 'rgba(245,158,11,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t;
  })();
  function punto(escena, { alcance = 330, tema = 'oscuro' } = {}) {
    const grupo = new T3.Group();
    const mat = new T3.MeshPhysicalMaterial({ color: COL.ambar, emissive: COL.ambar, emissiveIntensity: 1.2, roughness: 0.22, clearcoat: 1 });
    const esfera = new T3.Mesh(new T3.SphereGeometry(1, 40, 28), mat);
    const luz = new T3.PointLight(0xffa726, 3.4, alcance, 0);
    // de noche el halo suma luz; sobre blanco sumar no se ve, así que se pinta como un resplandor ámbar suave
    const halo = new T3.Sprite(new T3.SpriteMaterial({ map: haloTx, blending: tema === 'claro' ? T3.NormalBlending : T3.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    grupo.add(esfera, luz, halo); escena.add(grupo);
    return { grupo, esfera, luz, halo, mat,
      poner(x, y, z, r = 4, brillo = 1) { grupo.position.set(x, y, z); esfera.scale.setScalar(r); halo.scale.setScalar(r * 9 * brillo); halo.material.opacity = (tema === 'claro' ? 0.45 : 0.85) * Math.min(1, brillo); luz.intensity = 3.4 * brillo; mat.emissiveIntensity = 1.2 + 0.5 * (brillo - 1);
        // la luz nunca se oculta (solo se apaga): cambiar el número de luces obliga a recompilar todos los materiales
        const v = brillo > 0.001; esfera.visible = v; halo.visible = v; } };
  }
  // cuerdas: líneas finas que se comban cuando van flojas y vibran al tensarse
  const NC = 18;
  function cuerda(escena, { color = COL.cuerda, opacidad = 0.8 } = {}) {
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(new Float32Array(NC * 3), 3));
    const m = new T3.Line(g, new T3.LineBasicMaterial({ color, transparent: true, opacity: opacidad })); m.frustumCulled = false; m.visible = false; escena.add(m);
    m.tender = (a, b, comba = 0, vib = 0) => {
      const p = g.attributes.position, dx = b.x - a.x, dy = b.y - a.y, k = Math.hypot(dx, dy) || 1, nx = -dy / k, ny = dx / k;
      for (let i = 0; i < NC; i++) { const s = i / (NC - 1), o = vib * Math.sin(Math.PI * s); p.setXYZ(i, mezcla(a.x, b.x, s) + nx * o, mezcla(a.y, b.y, s) - comba * 4 * s * (1 - s) + ny * o, mezcla(a.z, b.z, s)); }
      p.needsUpdate = true; m.visible = true;
    };
    return m;
  }
  // cámara que mira a un punto desde un ángulo (lado: giro horizontal, el: elevación), a distancia d
  function mirar(camara, x, y, z, d, lado = 0, el = 0.1) {
    camara.position.set(x + Math.sin(lado) * Math.cos(el) * d, y + Math.sin(el) * d, z + Math.cos(lado) * Math.cos(el) * d);
    camara.lookAt(x, y, z); camara.near = Math.max(1, d * 0.05); camara.far = d * 12; camara.updateProjectionMatrix();
  }
  // distancia a la que hay que poner una cámara para que un alto (o un ancho) quepa
  function distancia(camara, alto, ancho = 0) { const f = Math.tan(camara.fov * Math.PI / 360); return Math.max(alto / 2 / f, ancho / 2 / (f * camara.aspect)); }

  // ── capítulos y director ──
  const fabricas = {}, secciones = [];
  let W = 0, H = 0, tPrev = 0, reloj = 0, listo = false, saltar = false, previa = null;
  const calentar = [], tiempos = [];
  const ctx = { T3, renderer, E, mezcla, tramo, COL, FONDO, entornoClaro, esmalte, brilloPropio, estudio, punto, cuerda, mirar, distancia, entorno, DATOS: window.DATOS, get W() { return W; }, get H() { return H; } };
  // dibujar un capítulo: por defecto, su escena a pantalla completa; si trae dibujar(renderer), lo hace él
  // (por ejemplo, varias escenas pequeñas, cada una en el hueco de una tarjeta, con viewport y scissor)
  function dibujarCap(s) {
    renderer.setClearColor(s.cap.fondo ?? FONDO[s.tema], 1);
    if (s.cap.dibujar) { s.cap.dibujar(renderer); renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H); renderer.autoClear = true; }
    else renderer.render(s.cap.escena, s.cap.camara);
  }
  // se compila todo, también lo que nace oculto: así nada compila su sombreador la primera vez que aparece
  // (las luces no se tocan: su número debe ser el mismo que al dibujar)
  function compilarCap(s) {
    const pares = s.cap.escenas || [[s.cap.escena, s.cap.camara]];
    return Promise.all(pares.map(([e, c]) => {
      const ocultos = []; e.traverse((o) => { if (!o.visible && !o.isLight) { ocultos.push(o); o.visible = true; } });
      const pr = renderer.compileAsync ? renderer.compileAsync(e, c) : Promise.resolve(renderer.compile(e, c));
      for (const o of ocultos) o.visible = false;
      return pr;
    }));
  }
  function montar(s) {
    if (s.cap || !fabricas[s.id]) return;
    try {
      s.cap = fabricas[s.id]({ ...ctx, raiz: s.el, fijo: s.fijo, tema: s.tema, punto: (e, o) => punto(e, { tema: s.tema, ...o }) }); if (s.cap.camara) { s.cap.camara.aspect = W / H; s.cap.camara.updateProjectionMatrix(); } s.cap.medir?.(W, H);
      // los sombreadores se compilan en paralelo y luego la escena se dibuja una vez «en vacío» (texturas y sombras):
      // así su primer fotograma de verdad no da un tirón
      const c = compilarCap(s);
      c.then(() => calentar.push(s), () => calentar.push(s));
    }
    catch (e) { console.error('capítulo', s.id, e); s.cap = { roto: true }; }
  }
  function medir() {
    W = innerWidth; H = innerHeight; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W, H, false);
    for (const s of secciones) if (s.cap && !s.cap.roto) { if (s.cap.camara) { s.cap.camara.aspect = W / H; s.cap.camara.updateProjectionMatrix(); } s.cap.medir?.(W, H); }
  }
  function leerSecciones() {
    secciones.length = 0;
    for (const el of document.querySelectorAll('[data-cap], [data-avance]')) {
      secciones.push({ el, id: el.dataset.cap || null, tema: el.classList.contains('tema-claro') ? 'claro' : 'oscuro', fijo: el.querySelector('.fijo') || el, u: 0, uS: 0, cap: null,
        beats: [...el.querySelectorAll('[data-en]')].map((b) => { const [a, z] = b.dataset.en.split(' ').map(Number); return { b, a, z, v: -1 }; }) });
    }
  }
  const navegacion = document.querySelector('.nav');
  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const q0 = performance.now();
    const dt = Math.min(0.05, (ahora - (tPrev || ahora)) / 1000); tPrev = ahora; reloj += dt;
    let activa = null, mejor = 0;
    for (const s of secciones) {
      const r = s.el.getBoundingClientRect(), vis = Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0));
      s.visible = vis > 0;
      // avance: 0 cuando la sección llega arriba, 1 cuando su final llega abajo; si es corta, mientras cruza la pantalla
      s.u = r.height > H * 1.05 ? tramo(-r.top, 0, r.height - H) : tramo(H - r.top, 0, H + r.height);
      if (!s.visible || saltar) s.uS = s.u; else s.uS += (s.u - s.uS) * (1 - Math.exp(-dt * 8));
      if (Math.abs(s.u - s.uS) < 1e-4) s.uS = s.u;
      if (s.visible || s.beats.some((bt) => bt.v !== 0)) for (const bt of s.beats) {
        const ra = Math.min(0.04, (bt.z - bt.a) * 0.22);                 // en los beats cortos, la rampa se acorta para que lleguen a verse del todo
        const v = s.visible ? tramo(s.uS, bt.a, bt.a + ra) * (1 - tramo(s.uS, bt.z - ra, bt.z)) : 0;
        if (Math.abs(v - bt.v) > 0.002) { bt.v = v; bt.b.style.setProperty('--v', v.toFixed(3)); bt.b.classList.toggle('visto', v > 0.5); }
      }
      if (s.id && fabricas[s.id]) {
        if (!s.cap && r.top < H * 2.2 && r.bottom > -H) montar(s);
        if (s.cap && !s.cap.roto && vis > mejor) { mejor = vis; activa = s; }
      }
    }
    saltar = false;
    // como mucho un capítulo por fotograma se dibuja en vacío, antes del activo (que lo tapa)
    const cal = calentar.shift();
    if (cal && cal !== activa && cal.cap && !cal.cap.roto) { cal.cap.actualizar(0.5, reloj, 0, true); dibujarCap(cal); cal.cap.actualizar(cal.uS, reloj, 0); }
    if (activa) {
      if (lienzo.parentNode !== activa.fijo) {
        // el capítulo que sale se queda con una foto de su último fotograma: sin saltos a negro
        if (previa && previa !== activa && previa.visible && previa.cap && !previa.cap.roto) {
          dibujarCap(previa);
          let f = previa.fijo.querySelector(':scope > .foto');
          if (!f) { f = document.createElement('canvas'); f.className = 'foto'; f.setAttribute('aria-hidden', 'true'); previa.fijo.prepend(f); }
          f.width = lienzo.width; f.height = lienzo.height; f.getContext('2d').drawImage(lienzo, 0, 0); f.hidden = false;
        }
        const f2 = activa.fijo.querySelector(':scope > .foto'); if (f2) f2.hidden = true;
        activa.fijo.prepend(lienzo);
      }
      previa = activa;
      activa.cap.actualizar(activa.uS, reloj, dt);
      renderer.setClearColor(activa.cap.fondo ?? FONDO[activa.tema], 1);
      dibujarCap(activa);
    }
    tiempos.push(performance.now() - q0); if (tiempos.length > 240) tiempos.shift();
    if (navegacion) {
      navegacion.classList.toggle('vista', scrollY > H * 0.6 || document.documentElement.classList.contains('abierta'));
      const bajo = secciones.find((s) => { const r = s.el.getBoundingClientRect(); return r.top <= 30 && r.bottom > 30; });
      document.documentElement.classList.toggle('nav-clara', !!bajo && bajo.tema === 'claro');
    }
  }
  // montaje en segundo plano: un capítulo por pausa, para que la apertura no se resienta
  function precargar() {
    const pend = secciones.filter((s) => s.id && fabricas[s.id] && !s.cap);
    if (!pend.length) return;
    const sig = () => { const s = pend.shift(); if (s && !s.cap) montar(s); if (pend.length) setTimeout(() => (window.requestIdleCallback || setTimeout)(sig, { timeout: 800 }), 400); };
    setTimeout(sig, 1500);
  }

  window.CUEVA = {
    ...ctx,
    capitulo(id, fabrica) { fabricas[id] = fabrica; },
    // para revisar y capturar: lleva el scroll al punto u de un capítulo y salta el suavizado
    ir(id, u = 0) {
      const s = secciones.find((q) => q.id === id || q.el.id === id); if (!s) return false;
      const top = s.el.getBoundingClientRect().top + scrollY, h = s.el.offsetHeight;
      scrollTo(0, h > H * 1.05 ? top + u * (h - H) : top - H + u * (H + h)); saltar = true; return true;
    },
    tiempos,
    // el avance suavizado de cada sección (por su capítulo o por su id): lo usan también las secciones sin 3D
    get avance() { return Object.fromEntries(secciones.map((s) => [s.id || s.el.id, s.uS])); },
    arrancar() {
      if (listo) return; listo = true;
      leerSecciones(); medir(); addEventListener('resize', medir);
      const prim = secciones.find((s) => s.id && fabricas[s.id]); if (prim) montar(prim);
      requestAnimationFrame(cuadro); precargar();
    },
  };
})();

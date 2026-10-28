// ─────────────────────────────────────────────────────────────────────
//  CUEVA · los mundos, contados con el scroll
//  Un escenario blanco que se queda fijo mientras la página baja, y en él una baraja de tarjetas
//  en profundidad (CSS 3D: solo transform y opacity):
//    1. la apertura: el titular a la izquierda y la baraja cerrada a la derecha, en perspectiva;
//    2. los capítulos (Viviendas, Industrial, Infraestructura): cada mundo sale de la pila y viene
//       al frente, casi a pantalla completa, con sus fotos en fundido y un Ken Burns leve, su
//       categoría, su nombre, una frase y su botón; el anterior se aparta y se desvanece;
//       arriba, el rótulo del capítulo y su contador («Viviendas, 1 de 5»);
//    3. el final: la baraja se abre en una rejilla de ocho, con las fichas de categoría para
//       filtrar, y el escenario se suelta y sigue la página.
//  En el móvil, una tarjeta a pantalla y la siguiente asomando; al final, una rejilla de dos.
//  El avance sale del scroll (de la pista que contiene el escenario), suavizado; todo es función
//  del avance, así que un salto de scroll (un enlace, el teclado) deja la escena en su sitio.
//  Con el teclado, al enfocar una tarjeta la página baja hasta su momento.
// ─────────────────────────────────────────────────────────────────────
(() => {
  const raiz = document.querySelector('[data-mundos-galeria]');
  const M = Array.isArray(window.MUNDOS) ? window.MUNDOS : [];
  if (!raiz || !M.length) return;

  const N = M.length;
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const enArchivo = location.protocol === 'file:';
  const verbo = (m) => (m.tipo === 'Mundo' || m.tipo === 'Modelo' ? 'Explorar' : 'Abrir');
  const enlace = (m) => (m.abre === 'servidor' && enArchivo && m.local ? m.local : m.url);
  const fotos = (m) => Array.from({ length: Math.max(1, m.fotos || 1) }, (_, i) => (i ? m.img.replace(/\.webp$/, `-${i}.webp`) : m.img));
  const CATS = [...new Set(M.map((m) => m.familia))];
  const enCat = M.map((m) => M.filter((q) => q.familia === m.familia).indexOf(m) + 1);
  const totCat = M.map((m) => M.filter((q) => q.familia === m.familia).length);

  // el guion, en unidades de avance: apertura, un tramo por mundo, la rejilla y una pausa final
  const INTRO = 1.2, REJ0 = INTRO + (N - 1) + 0.25, REJ = 1.0, FIN = REJ0 + REJ + 0.45;
  const tramo = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const suave = (t) => t * t * (3 - 2 * t);
  const mezcla = (a, b, t) => a + (b - a) * t;

  // ── el esqueleto ──
  raiz.classList.add('mg');
  raiz.innerHTML = `
    <div class="mg-pista">
      <div class="mg-escena">
        <div class="mg-intro"></div>
        <div class="mg-capitulo" aria-hidden="true"><b></b><span></span></div>
        <div class="mg-filtros" role="toolbar" aria-label="Filtrar los mundos por categoría">
          ${['Todos', ...CATS].map((f) => `<button type="button" class="mg-ficha" data-cat="${esc(f)}" aria-pressed="${f === 'Todos'}">${esc(f)}<span class="mg-cuenta" aria-hidden="true">${f === 'Todos' ? N : M.filter((m) => m.familia === f).length}</span></button>`).join('')}
        </div>
        <ul class="mg-mazo" role="list" aria-label="Los mundos de CUEVA">
          ${M.map((m, i) => {
            const fs = fotos(m), servidor = m.abre === 'servidor';
            const nombre = `${m.n}, ${m.familia.toLowerCase()}, ${m.tipo.toLowerCase()}: ${m.d} Se abre en una pestaña nueva${servidor ? ' y necesita su servidor local' : ''}.`;
            return `<li class="mg-c" data-i="${i}">
              <a href="${esc(enlace(m))}" target="_blank" rel="noopener" aria-label="${esc(nombre)}"${servidor && m.arranque ? ` title="${esc(`Necesita su servidor local: ${m.arranque}`)}"` : ''}>
                <span class="mg-c-fondo"></span>
                <span class="mg-c-foto">
                  ${fs.map((src, j) => `<img class="${j ? '' : 'visible'}" ${j ? `data-src="${esc(src)}"` : `src="${esc(src)}" loading="${i < 2 ? 'eager' : 'lazy'}"`} alt="" width="960" height="600" decoding="async">`).join('')}
                  <span class="mg-c-velo"></span>
                  <span class="mg-c-tipo">${esc(m.tipo)}</span>
                  <span class="mg-c-mini"><b>${esc(m.n)}</b><span>${esc(m.familia)}</span></span>
                </span>
                <span class="mg-c-texto">
                  <span class="mg-c-cat">${esc(m.familia)}</span>
                  <span class="mg-c-nombre">${esc(m.n)}</span>
                  <span class="mg-c-desc">${esc(m.d)}</span>
                  <span class="mg-c-acciones"><span class="mg-c-boton">${verbo(m)}</span>${servidor ? '<span class="mg-c-servidor">Servidor local</span>' : ''}</span>
                </span>
              </a>
            </li>`;
          }).join('')}
        </ul>
        <p class="mg-nota">Los que llevan la marca <span class="mg-servidor-marca">Servidor local</span> necesitan arrancar antes su servidor en este equipo (el arranque de cada uno aparece al pasar el ratón por su tarjeta). El resto se abre con un clic.</p>
      </div>
    </div>`;

  // el titular de la sección abre la escena: se muda dentro, a la izquierda de la baraja
  const cabeza = raiz.parentNode.querySelector(':scope > .cabeza');
  const intro = raiz.querySelector('.mg-intro');
  if (cabeza) intro.append(cabeza);

  const pista = raiz.querySelector('.mg-pista'), escena = raiz.querySelector('.mg-escena'), mazo = raiz.querySelector('.mg-mazo');
  const cap = raiz.querySelector('.mg-capitulo'), capB = cap.querySelector('b'), capS = cap.querySelector('span');
  const filtros = raiz.querySelector('.mg-filtros'), nota = raiz.querySelector('.mg-nota');
  const cartas = [...mazo.children].map((li) => ({
    li, a: li.querySelector('a'), texto: li.querySelector('.mg-c-texto'), mini: li.querySelector('.mg-c-mini'), fondo: li.querySelector('.mg-c-fondo'),
    velo: li.querySelector('.mg-c-velo'), tipo: li.querySelector('.mg-c-tipo'), imgs: [...li.querySelectorAll('img')], cache: {},
  }));

  // ── medidas: la tarjeta, la pila y la rejilla final, en píxeles ──
  let vw = 0, vh = 0, movil = false, W = 0, H = 0, Hf = 0, frenteX = 0, frenteY = 0, rej = [], sg = 1;
  function medir() {
    vw = innerWidth; vh = innerHeight; movil = vw < 720;
    const mg = Math.max(20, Math.min(88, vw * 0.05));
    if (movil) {
      W = Math.round(vw - mg - 52); Hf = Math.round(W / 1.6); H = Math.round(Math.min(vh * 0.64, Hf + 250));
      frenteX = Math.round(-vw / 2 + mg + W / 2); frenteY = Math.round(vh * 0.05);
    } else {
      W = Math.round(Math.min(vw * 0.64, vh * 1.05, 1080)); H = Hf = Math.round(W / 1.6);
      frenteX = Math.round(-vw / 2 + mg + W / 2); frenteY = Math.round(vh * 0.045);
    }
    escena.style.setProperty('--cap-top', Math.round(vh / 2 + frenteY - H / 2 - (movil ? 44 : 58)) + 'px');
    mazo.style.setProperty('--W', W + 'px'); mazo.style.setProperty('--H', H + 'px'); mazo.style.setProperty('--Hf', Hf + 'px');
    // la rejilla final: 4 × 2 en escritorio y 2 × 4 en el móvil, entre las fichas y la nota
    const cols = movil ? 2 : 4, filas = Math.ceil(N / cols), gap = movil ? 10 : 18;
    const arriba = movil ? 150 : 170, abajo = movil ? 92 : 96;
    const Aw = Math.min(vw - 2 * mg, 1180), Ah = vh - arriba - abajo;
    sg = Math.min((Aw - gap * (cols - 1)) / cols / W, (Ah - gap * (filas - 1)) / filas / Hf);
    const tw = W * sg, th = Hf * sg, totW = cols * tw + (cols - 1) * gap, totH = filas * th + (filas - 1) * gap;
    const y0 = -vh / 2 + arriba + (Ah - totH) / 2;
    rej = M.map((_, i) => { const c = i % cols, f = Math.floor(i / cols); return { x: -totW / 2 + tw / 2 + c * (tw + gap), y: y0 + th / 2 + f * (th + gap) - ((Hf - H) / 2) * sg }; });
    mazo.style.setProperty('--sg', sg.toFixed(4));
    escena.style.setProperty('--rej-arriba', (vh / 2 + y0 - (movil ? 58 : 66)) + 'px');
    escena.style.setProperty('--rej-abajo', (vh / 2 + y0 + totH + 18) + 'px');
    for (const c of cartas) c.cache = {};
    xs = -1;
  }

  // la posición de una tarjeta a una distancia d del frente (d > 0: en la pila; d < 0: ya pasó)
  function enHistoria(d) {
    if (movil) {
      const ad = Math.abs(d);
      return { x: frenteX + d * (W + 14), y: frenteY, z: 0, ry: 0, s: 1 - 0.05 * Math.min(ad, 1), o: Math.min(1, Math.max(0, 1.9 - ad)) };
    }
    // la pila, a la derecha del frente y entera en pantalla: cada carta más honda asoma un poco más arriba
    const sp = Math.min(0.42, (vw / 2 - (frenteX + W / 2) - 64) / W), px = vw / 2 - Math.max(40, vw * 0.035) - (W * sp) / 2;
    const pila = (e) => ({ x: px + e * 8, y: frenteY - e * 16, z: -e * 64, ry: -22, s: sp, o: Math.max(0, Math.min(1, 1 - e * 0.07, 7 - e)) });
    const frente = { x: frenteX, y: frenteY, z: 0, ry: 0, s: 1, o: 1 };
    if (d >= 1) return pila(d - 1);
    if (d >= 0) { const t = suave(d), p = pila(0); return { x: mezcla(frente.x, p.x, t), y: mezcla(frente.y, p.y, t), z: mezcla(0, p.z - 60, Math.sin(t * Math.PI) * 0.6 + t * 0.4), ry: mezcla(0, p.ry, t), s: mezcla(1, sp, t), o: 1 }; }
    const t = suave(Math.min(1, -d));
    return { x: mezcla(frente.x, -vw / 2 - W * 0.25, t), y: frente.y + t * 10, z: -220 * t, ry: 20 * t, s: mezcla(1, 0.78, t), o: 1 - tramo(-d, 0.15, 0.85) };
  }

  // ── el avance: de la pista al guion ──
  let xs = -1, xObj = 0, activa = -1, filtro = 'Todos', tCiclo = 0, enRejilla = false;
  function avance() {
    const r = pista.getBoundingClientRect(), largo = r.height - vh;
    return largo > 0 ? tramo(-r.top, 0, largo) * FIN : 0;
  }
  // x del guion al mundo s (continuo, con pausa en cada entero) y a la apertura de la rejilla g
  function guion(x) {
    let s;
    if (x < INTRO) { const s0 = movil ? -1 : -1.6; s = s0 - s0 * suave(x / INTRO); }
    else { const u = Math.min(x - INTRO, N - 1), k = Math.floor(u), f = u - k; s = Math.min(N - 1, k + suave(tramo(f, 0.32, 0.82))); }
    const g = suave(tramo(x, REJ0, REJ0 + REJ));
    return { s, g };
  }

  function poner(c, clave, el, prop, v) { if (c.cache[clave] !== v) { c.cache[clave] = v; el.style[prop] = v; } }
  function pintar(x) {
    const { s, g } = guion(x);
    // la apertura y el rótulo del capítulo
    intro.style.opacity = (1 - tramo(x, 0.35, 0.95)).toFixed(3);
    intro.style.transform = `translate3d(0, ${(-40 * tramo(x, 0.35, 1)).toFixed(1)}px, 0)`;
    intro.style.visibility = x > 1 ? 'hidden' : '';
    const vCap = tramo(x, 0.75, 1.15) * (1 - tramo(g, 0, 0.4));
    cap.style.opacity = vCap.toFixed(3);
    filtros.style.opacity = tramo(g, 0.55, 1).toFixed(3); nota.style.opacity = tramo(g, 0.6, 1).toFixed(3);
    const listo = g > 0.96;
    if (listo !== enRejilla) { enRejilla = listo; escena.classList.toggle('rejilla', listo); }
    const a = Math.round(Math.max(0, s));
    if (a !== activa) activar(a);
    for (let i = 0; i < N; i++) {
      const c = cartas[i], d = i - s;
      let p = enHistoria(d);
      // la rejilla: cada tarjeta vuela a su hueco, con un leve escalonado
      const gi = suave(tramo(g * 1.35 - i * 0.045, 0, 1));
      if (gi > 0) {
        // la última sale del frente; las demás vuelven desde donde se apartaron, a la izquierda
        const q = rej[i], ultima = i === N - 1, dsd = ultima ? p : enHistoria(Math.min(d, -1));
        p = { x: mezcla(dsd.x, q.x, gi), y: mezcla(dsd.y, q.y, gi), z: mezcla(dsd.z, 0, gi), ry: mezcla(dsd.ry, 0, gi), s: mezcla(dsd.s, sg, gi), o: mezcla(ultima ? p.o : 0, 1, gi) };
      }
      const apagada = enRejilla && filtro !== 'Todos' && M[i].familia !== filtro;
      const o = p.o * (apagada ? 0.22 : 1);
      poner(c, 't', c.li, 'transform', `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, ${p.z.toFixed(1)}px) rotateY(${p.ry.toFixed(2)}deg) scale(${p.s.toFixed(4)})`);
      poner(c, 'o', c.li, 'opacity', o.toFixed(3));
      poner(c, 'v', c.li, 'visibility', o < 0.005 ? 'hidden' : '');
      // el texto grande solo en el frente; la etiqueta pequeña, en la rejilla
      const vt = (1 - tramo(Math.abs(d), 0.08, 0.42)) * (1 - tramo(gi, 0, 0.35));
      poner(c, 'tx', c.texto, 'opacity', vt.toFixed(3));
      poner(c, 'fo', c.fondo, 'opacity', movil ? vt.toFixed(3) : '1');
      poner(c, 've', c.velo, 'opacity', movil ? '0' : Math.max(vt, 0.35 * (1 - gi)).toFixed(3));
      poner(c, 'ti', c.tipo, 'opacity', (vt * 1).toFixed(3));
      poner(c, 'mi', c.mini, 'opacity', tramo(gi, 0.55, 1).toFixed(3));
    }
  }

  // el mundo activo: su rótulo de capítulo, sus fotos (la activa y la siguiente) y su fundido
  function activar(a) {
    activa = a; const m = M[a];
    capB.textContent = m.familia; capS.textContent = `${enCat[a]} de ${totCat[a]}`;
    cap.classList.remove('cambia'); void cap.offsetWidth; cap.classList.add('cambia');
    cartas.forEach((c, i) => c.li.classList.toggle('activa', i === a));
    for (const i of [a, a + 1]) if (cartas[i]) for (const im of cartas[i].imgs) { if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } im.loading = 'eager'; }
    ciclo();
  }
  function ciclo() {
    clearTimeout(tCiclo);
    const c = cartas[activa]; if (!c || c.imgs.length < 2) return;
    tCiclo = setTimeout(function sig() {
      if (!enRejilla && visible) {
        const n = c.imgs.findIndex((im) => im.classList.contains('visible')), k = (n + 1) % c.imgs.length;
        if (c.imgs[k].complete && c.imgs[k].naturalWidth) { c.imgs[n].classList.remove('visible'); c.imgs[k].classList.add('visible'); }
      }
      tCiclo = setTimeout(sig, 3400);
    }, 3000);
  }

  // ── el bucle: solo mientras la pista está en pantalla ──
  let visible = false, tPrev = 0, corriendo = false;
  function cuadro(t) {
    if (!visible) { corriendo = false; return; }
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.05, (t - (tPrev || t)) / 1000); tPrev = t;
    xObj = avance();
    if (xs < 0 || Math.abs(xObj - xs) > 2.5) xs = xObj; else xs += (xObj - xs) * (1 - Math.exp(-dt * 11));
    if (Math.abs(xObj - xs) < 1e-4) xs = xObj;
    if (xs !== pintar.ultimo) { pintar.ultimo = xs; pintar(xs); }
  }
  new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting);
    if (visible && !corriendo) { corriendo = true; tPrev = 0; requestAnimationFrame(cuadro); }
  }, { rootMargin: '20% 0px' }).observe(pista);

  // ── teclado: al enfocar una tarjeta, la página baja hasta su momento ──
  function irA(x) {
    const r = pista.getBoundingClientRect(), top = r.top + scrollY, largo = pista.offsetHeight - vh;
    scrollTo({ top: top + (x / FIN) * largo, behavior: 'instant' });
  }
  mazo.addEventListener('focusin', (e) => {
    const li = e.target.closest('.mg-c'); if (!li || enRejilla) return;
    const i = +li.dataset.i; irA(INTRO + i + 0.1);
  });
  filtros.addEventListener('focusin', () => { if (!enRejilla) irA(FIN - 0.1); });
  filtros.addEventListener('click', (e) => {
    const b = e.target.closest('.mg-ficha'); if (!b) return;
    filtro = b.dataset.cat;
    for (const x of filtros.children) x.setAttribute('aria-pressed', String(x === b));
    cartas.forEach((c, i) => { const fuera = filtro !== 'Todos' && M[i].familia !== filtro; c.a.tabIndex = fuera ? -1 : 0; c.li.classList.toggle('fuera', fuera); });
    pintar.ultimo = -1;
  });
  filtros.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const bs = [...filtros.children], i = bs.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault(); bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length].focus();
  });
  addEventListener('resize', () => { medir(); pintar.ultimo = -1; });
  // para revisar y capturar: lleva la escena a un punto del guion (de 0 a 1)
  window.MUNDOS_ESCENA = { ir: (u) => irA(u * FIN), FIN, INTRO, REJ0 };
  medir(); pintar(0);
})();

// ─────────────────────────────────────────────────────────────────────
//  CUEVA · lo que no es 3D: notas de fuente, obras, tramos, puertas, interfaces,
//  enlaces de configuración, sonido, barra y el sello de la #406.
// ─────────────────────────────────────────────────────────────────────
(() => {
  const D = window.DATOS, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nota = (f) => `<sup class="f" data-f="${f}"></sup>`;

  // ── notas de fuente: se numeran por orden de aparición y se listan al pie ──
  const orden = [];
  function numerar(raiz = document) {
    let nuevas = false;
    for (const s of $$('sup.f', raiz)) { const f = s.dataset.f; if (!orden.includes(f)) { orden.push(f); nuevas = true; } const n = orden.indexOf(f) + 1; s.innerHTML = `<a href="#f-${f}" aria-label="Fuente ${n}">${n}</a>`; }
    if (nuevas && $('[data-fuentes]')) $('[data-fuentes]').innerHTML = orden.map((f) => `<li id="f-${f}">${esc(D.FUENTES[f] || f)}</li>`).join('');
  }

  // ── obras: tres dossieres en una galería que avanza en horizontal con el scroll ──
  //  Cada obra tiene un escenario (foto y gemelo con corte, la película o una foto), una galería
  //  que lo cambia, sus cifras y cómo se hizo. El panel centrado se asienta; el medio va con paralaje.
  // las cifras cuentan hasta su valor (el mismo formato que en los datos: 3.000, 26,25)
  function contar(raiz) {
    for (const b of $$('.mini b', raiz)) {
      if (!b.dataset.valor) b.dataset.valor = b.textContent;
      const m = b.dataset.valor.match(/^([\d.]+)(,(\d+))?(.*)$/); if (!m) continue;
      const fin = parseFloat(m[1].replace(/\./g, '') + (m[3] ? '.' + m[3] : '')), dec = m[3] ? m[3].length : 0, miles = m[1].includes('.'), resto = m[4], t0 = performance.now();
      const fmt = (v) => { let [e, d] = v.toFixed(dec).split('.'); if (miles) e = e.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return e + (d ? ',' + d : '') + resto; };
      (function f(ahora) { const u = Math.min(1, (ahora - t0) / 1100), k = 1 - Math.pow(1 - u, 3); b.textContent = fmt(fin * k); if (u < 1) requestAnimationFrame(f); })(t0);
    }
  }
  const miniatura = (o, [id, t]) => id === 'anim' ? `assets/obras/${o.k}_anim-min.webp` : id === 'corte' ? `assets/obras/${o.k}_foto-min.webp` : id === 'video' ? 'assets/obras/llar_video-min.webp' : `assets/obras/${id.split('/')[1]}-min.webp`;
  const obraHTML = (o, i) => {
    const tieneVideo = o.galeria.some(([id]) => id === 'video'), tieneCorte = o.galeria.some(([id]) => id === 'corte');
    return `<div class="columna-medio">
        <figure class="medio${o.k === 'navalcarnero' ? ' vertical' : ''}" data-medio>
          ${tieneCorte ? `<div class="capas capa-corte" data-corte>
            <img class="capa foto" src="assets/obras/${o.k}_foto.webp" alt="${esc(o.n)}: la obra en foto" loading="lazy"><img class="capa gemelo" src="assets/obras/${o.k}_gemelo.webp" alt="${esc(o.n)}: el gemelo, en ilustración" loading="lazy">
            <div class="filo"><span></span></div><div class="leyenda"><span>Foto</span><span>Gemelo, en ilustración</span></div>
            <input class="solo-lector" type="range" min="0" max="100" value="100" aria-label="Corte entre la foto y el gemelo de ${esc(o.n)}"></div>` : ''}
          ${tieneVideo ? `<div class="capas capa-video"><video muted loop playsinline preload="none" poster="assets/video/llar-poster.webp" aria-label="${esc(o.n)} desde el dron"><source data-src="assets/video/llar.mp4" type="video/mp4"></video></div>` : ''}
          <div class="capas capa-foto"><img class="capa" alt="" data-sola></div>
          <div class="capas capa-anim" data-hueco aria-label="${esc(o.n)}, animación de la obra" role="img"></div>
          <figcaption class="pie-medio" data-pie>${esc(o.galeria[0][1])}</figcaption>
        </figure>
        <div class="galeria-obra" role="tablist" aria-label="Fotos de ${esc(o.n)}">${o.galeria.map((g, k) => `<button type="button" role="tab" aria-selected="${k === 0}" data-g="${k}" aria-label="${esc(g[1])}"><img src="${miniatura(o, g)}" alt="" loading="lazy"></button>`).join('')}</div>
        ${o.credito ? `<p class="credito">${esc(o.credito)}</p>` : ''}
      </div>
      <div class="ficha">
        <span class="num">${String(i + 1).padStart(2, '0')} de ${String(D.OBRAS.length).padStart(2, '0')}</span>
        <span class="tipo">${esc(o.tipo)}</span><h3>${esc(o.n)}</h3><p class="lugar">${esc(o.lugar)}</p>
        <p class="lema-obra">${esc(o.lema)}</p><p class="entrada">${esc(o.d)}</p>
        <div class="mini">${o.cifras.map(([v, u, f]) => `<div><b>${esc(v)}</b><span>${esc(u)}${nota(f)}</span></div>`).join('')}</div>
        ${o.cronica ? `<div class="cronica"><h4>${esc(o.cronica.t)}${nota(o.cronica.f)}</h4><ol>${o.cronica.filas.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ol></div>` : ''}
        ${o.enlace ? `<a class="enlace" href="${o.enlace[0]}">${esc(o.enlace[1])}</a>` : ''}
      </div>`;
  };
  const paneles = $$('.panel.obra');
  paneles.forEach((p) => { const i = D.OBRAS.findIndex((o) => o.k === p.dataset.obra); p.innerHTML = obraHTML(D.OBRAS[i], i); p.obra = D.OBRAS[i]; });
  $('[data-progreso]').innerHTML = D.OBRAS.map((o) => `<span><i></i>${esc(o.n)}</span>`).join('');
  const barras = $$('[data-progreso] i');

  // el corte: se arrastra, se mueve con el teclado y, la primera vez que se ve, barre solo
  for (const corte of $$('[data-corte]')) {
    const rango = corte.querySelector('input'); let id = 0;
    const poner = (v) => { const c = Math.max(0, Math.min(100, v)); corte.style.setProperty('--c', `${c}%`); rango.value = Math.round(c); };
    corte.barrer = (desde, hasta, ms = 1700) => {
      const t0 = performance.now(), mio = ++id, ease = (u) => 1 - Math.exp(-6 * u) * Math.cos(6.3 * u);
      (function f(ahora) { if (mio !== id) return; const u = Math.min(1, (ahora - t0) / ms); poner(desde + (hasta - desde) * ease(u)); if (u < 1) requestAnimationFrame(f); })(t0);
    };
    const arrastre = (e) => { const r = corte.getBoundingClientRect(); id++; poner((e.clientX - r.left) / r.width * 100); };
    corte.addEventListener('pointerdown', (e) => { corte.setPointerCapture(e.pointerId); arrastre(e); });
    corte.addEventListener('pointermove', (e) => { if (corte.hasPointerCapture(e.pointerId)) arrastre(e); });
    rango.addEventListener('input', () => { id++; poner(+rango.value); });
    poner(100);
  }
  // la película: solo se carga y se reproduce cuando su panel está a la vista y es la que se mira
  const video = $('.panel.obra video'), fuente = video?.querySelector('source');
  if (fuente && innerWidth < 900) fuente.dataset.src = 'assets/video/llar-960.mp4';
  let cargado = false;
  const reproducir = (si) => { if (!video) return; if (si) { if (!cargado) { fuente.src = fuente.dataset.src; video.load(); cargado = true; } if (video.paused) video.play().catch(() => {}); } else if (!video.paused) video.pause(); };
  // la galería cambia el escenario: corte, película o una foto a toda la caja
  for (const p of paneles) {
    const medio = $('[data-medio]', p), sola = $('[data-sola]', p), pie = $('[data-pie]', p), o = p.obra;
    p.modo = o.galeria[0][0];
    const modoDe = (g) => g === 'corte' || g === 'video' || g === 'anim' ? g : 'foto';
    medio.dataset.modo = modoDe(p.modo);
    $('.galeria-obra', p).addEventListener('click', (e) => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      const [gid, texto] = o.galeria[+b.dataset.g];
      for (const x of $$('.galeria-obra button', p)) x.setAttribute('aria-selected', String(x === b));
      medio.classList.add('cambiando');
      setTimeout(() => {
        p.modo = gid;
        if (modoDe(gid) === 'foto') { sola.src = `assets/${gid}.webp`; sola.alt = texto; }
        medio.dataset.modo = modoDe(gid); pie.textContent = texto;
        const listo = () => { medio.classList.remove('cambiando'); if (gid === 'corte') $('[data-corte]', p).barrer(100, 42, 1400); };
        if (medio.dataset.modo === 'foto' && !sola.complete) sola.decode().then(listo, listo); else requestAnimationFrame(listo);
      }, 220);
    });
  }

  // cada fotograma: la pista se desplaza con el avance de la sección (suavizado por el núcleo)
  const pista = $('[data-pista]'), seccion = $('#obras');
  const vistos = new Set();
  let recorrido = 0;
  // el recorrido se mide por el último panel (scrollWidth no cuenta el relleno final en flex): al acabar, queda centrado
  const medirPista = () => { const u = pista.lastElementChild, fin = u.offsetLeft + u.offsetWidth + parseFloat(getComputedStyle(pista).paddingRight); recorrido = Math.max(0, fin - innerWidth); };
  addEventListener('resize', medirPista); setTimeout(medirPista, 300);
  (function mover() {
    requestAnimationFrame(mover);
    const r = seccion.getBoundingClientRect(); if (r.bottom < -50 || r.top > innerHeight + 50) { reproducir(false); return; }
    if (!recorrido) medirPista();
    const u = window.CUEVA?.avance?.obras ?? 0, x = -u * recorrido;
    pista.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    const cx = innerWidth / 2;
    paneles.forEach((p, i) => {
      const q = p.getBoundingClientRect(), d = (q.left + q.width / 2 - cx) / innerWidth;     // −1…1: cuánto le falta para estar centrado
      const cerca = Math.max(0, 1 - Math.abs(d) * 1.6);
      p.style.setProperty('--d', d.toFixed(3)); p.style.setProperty('--cerca', cerca.toFixed(3));
      barras[i].style.transform = `scaleX(${Math.max(0, Math.min(1, 1 - d * 1.4)).toFixed(3)})`;
      if (cerca > 0.7 && !vistos.has(i)) { vistos.add(i); p.classList.add('visto'); contar(p); if (p.modo === 'corte') $('[data-corte]', p).barrer(100, 42); }
      if (p.obra.k === 'llar') reproducir(cerca > 0.25 && p.modo === 'video' && r.top < innerHeight && r.bottom > 0);
    });
  })();

  // el logo del cierre se dibuja cuando se ve

  // ── para quién: seis tarjetas, cada una con su escena de línea que se anima sola ──
  //  Son dibujos, no datos: el estudio traza sobre la trama, el promotor repite sin copiar, la
  //  fábrica saca una pieza identificada, el montador la posa, la ciudad coloca su acera y la casa late.
  const T = 'stroke="#1B2951" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const trama = (() => { let s = ''; for (let x = 20; x <= 220; x += 20) for (let y = 20; y <= 100; y += 20) s += `<circle cx="${x}" cy="${y}" r="1" fill="#1B2951" opacity=".18"/>`; return s; })();
  const ESCENA = {
    arquitecto: `${trama}
      <path id="pl" d="M60 80 V40 H120 V60 H180 V80 Z M120 40 V80" ${T} pathLength="1" stroke-dasharray="1" stroke-dashoffset="1">
        <animate attributeName="stroke-dashoffset" values="1;0;0;1" keyTimes="0;.55;.85;1" dur="5s" repeatCount="indefinite"/></path>
      <circle r="4" fill="#F59E0B"><animateMotion dur="5s" repeatCount="indefinite" keyPoints="0;1;1;0" keyTimes="0;.55;.85;1" calcMode="linear"><mpath href="#pl"/></animateMotion></circle>`,
    promotor: `<path d="M14 96 H226" ${T} opacity=".35"/>
      ${[[24, 'M0 0 V-34 H40 V0'], [92, 'M0 0 V-34 H60 V0 M40 -34 V0'], [176, 'M0 0 V-56 H40 V0 M0 -28 H40']].map(([x, d], i) => `<g transform="translate(${x} 96)"><path d="${d}" ${T} opacity="0"><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="6s" begin="${i * 0.6}s" repeatCount="indefinite"/></path></g>`).join('')}
      <circle r="4" fill="#F59E0B" cy="58"><animate attributeName="cx" values="44;122;196;44" keyTimes="0;.33;.66;1" dur="6s" repeatCount="indefinite"/></circle>`,
    fabricante: `<path d="M30 84 V64 H130 V84" ${T}/><path d="M24 84 H216" ${T} opacity=".35"/>
      <rect y="68" width="92" height="12" rx="2" ${T} fill="#FFFFFF"><animate attributeName="x" values="34;34;120;120;34" keyTimes="0;.25;.6;.9;1" dur="5s" repeatCount="indefinite"/></rect>
      <circle r="4" fill="#00D4AA" cy="74" opacity="0"><animate attributeName="cx" values="80;80;166;166;80" keyTimes="0;.25;.6;.9;1" dur="5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;0;1;0" keyTimes="0;.25;.6;.7;1" dur="5s" repeatCount="indefinite"/></circle>
      <circle r="4" fill="#F59E0B" cx="166" cy="40"/><path d="M166 44 V58" ${T} stroke-dasharray="2 3" opacity=".5"/>`,
    montador: `<path d="M20 98 H220" ${T} opacity=".35"/><path d="M86 98 V82 H154 V98" ${T} opacity=".5"/>
      <g><animateTransform attributeName="transform" type="translate" values="0 -34;0 0;0 0;0 -34" keyTimes="0;.45;.8;1" dur="5s" repeatCount="indefinite"/>
        <path d="M120 0 V40 M120 40 L96 58 M120 40 L144 58" ${T}/><rect x="88" y="58" width="64" height="10" rx="2" ${T} fill="#FFFFFF"/><circle r="4" fill="#F59E0B" cx="120" cy="40"/></g>`,
    administracion: `<path d="M14 92 H226" ${T} opacity=".35"/><path d="M196 92 V40 M196 40 H184" ${T}/><circle cx="184" cy="44" r="3" fill="#F59E0B"/>
      ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${24 + i * 22}" y="78" width="18" height="10" rx="2" ${T} opacity="0"><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.85;1" dur="6s" begin="${i * 0.35}s" repeatCount="indefinite"/></rect>`).join('')}`,
    propietario: `<path d="M60 96 V56 L96 30 L132 56 V96 Z M84 96 V74 H108 V96" ${T}/><path d="M20 96 H220" ${T} opacity=".35"/>
      <circle cx="96" cy="58" r="4" fill="#F59E0B"><animate attributeName="r" values="4;6;4;4" keyTimes="0;.15;.3;1" dur="1.6s" repeatCount="indefinite"/></circle>
      <g transform="translate(150 40)"><rect width="54" height="40" rx="5" ${T} fill="#FFFFFF"/><path d="M10 12 H40 M10 21 H34 M10 30 H28" ${T} opacity=".6"/>
        <circle cx="44" cy="30" r="3" fill="#00D4AA"><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.2;.8;1" dur="3s" repeatCount="indefinite"/></circle></g>`,
  };
  $('[data-roles]').innerHTML = D.PARA.map((r) => `<article class="rol">
      <svg class="escena-rol" viewBox="0 0 240 120" aria-hidden="true">${ESCENA[r.k]}</svg>
      <h3>${esc(r.n)}</h3><p>${esc(r.d)}</p><div class="puertas-rol">${r.puertas.map((p) => `<span>${esc(p)}</span>`).join('')}</div>
    </article>`).join('');
  // las escenas solo se mueven a la vista (las animaciones SVG se pausan fuera)
  const obRoles = new IntersectionObserver((es) => { for (const e of es) { const s = e.target.querySelector('svg'); if (e.isIntersecting) { e.target.classList.add('visto'); s.unpauseAnimations?.(); } else s.pauseAnimations?.(); } }, { threshold: 0.2 });
  $$('.rol').forEach((el, i) => { el.style.setProperty('--i', i); obRoles.observe(el); });

  $('[data-pasos]').innerHTML = D.PASOS.map(([n, d]) => `<li><b>${esc(n)}</b><span>${esc(d)}</span></li>`).join('');
  $('[data-tramos]').innerHTML = D.TRAMOS.map((t) => `<div class="tramo"><h3>${esc(t.n)}</h3><p class="sub">${esc(t.sub)}</p><p class="entrada">${esc(t.d)}</p></div>`).join('');
  for (const el of $$('[data-interfaz]')) {
    const i = D.INTERFACES.find((q) => q.k === el.dataset.interfaz);
    el.innerHTML = `<span class="etiqueta">Interfaz ${D.INTERFACES.indexOf(i) + 1} de 4</span><h3>${esc(i.n)}</h3><p class="entrada">${esc(i.d)}${nota('os')}</p><span class="estado${i.estado === 'En uso' ? ' uso' : ''}">${esc(i.estado)}</span>`;
  }

  numerar();
  window.NOTAS = { numerar };                                            // para las notas que se generan después (el configurador)
  for (const o of D.OBRAS) for (const q of o.cifras) if (!orden.includes(q[2])) { orden.push(q[2]); }
  if ($('[data-fuentes]')) $('[data-fuentes]').innerHTML = orden.map((f) => `<li id="f-${f}">${esc(D.FUENTES[f] || f)}</li>`).join('');

  // ── enlaces que dependen de CUEVA: sin dirección confirmada, no se enseñan ──
  for (const a of $$('[data-config]')) {
    const v = D.CONFIG[a.dataset.config];
    if (!v) { a.hidden = true; continue; }
    a.href = a.dataset.config === 'contacto' ? `mailto:${v}` : v;
  }
  for (const el of $$('[data-si-config]')) if (!D.CONFIG[el.dataset.siConfig]) el.hidden = true;

  // ── sonido de la apertura ──
  const bS = $('[data-accion="sonido"]'); let sonido = false;
  bS.addEventListener('click', () => {
    sonido = !sonido; window.APERTURA?.sonido(sonido); window.SONIDO?.activar(sonido);
    bS.setAttribute('aria-pressed', String(sonido)); bS.textContent = sonido ? 'Silenciar' : 'Activar sonido';
  });

  // ── la barra marca dónde estás ──
  const enlaces = $$('.nav a.ir'), destinos = enlaces.map((a) => $(a.getAttribute('href')));
  addEventListener('scroll', () => {
    const y = innerHeight * 0.4; let k = -1;
    destinos.forEach((d, i) => { const r = d.getBoundingClientRect(); if (r.top <= y && r.bottom > y) k = i; });
    enlaces.forEach((a, i) => a.setAttribute('aria-current', String(i === k)));
  }, { passive: true });

  // ── el sello: cada lectura lleva el SHA-256 de la anterior ──
  //  huella_i = sha256(huella_(i-1) + lectura_i). Al alterar una lectura, se recalcula y
  //  deja de coincidir con la huella guardada: la cadena se rompe ahí y en todas las siguientes.
  const L = window.PIEZA406.lecturasLista, cadena = $('[data-cadena]'), veredicto = $('[data-veredicto]');
  const texto = (l) => `${l.n}|${l.hora}|${l.lugar}|${l.fase}|${l.neurona}`;
  const guardadas = []; { let h = '0'.repeat(64); for (const l of L) { h = window.sha256(h + texto(l)); guardadas.push(h); } }
  const lugar = { fabrica: 'Fábrica', obra: 'Obra' };
  cadena.innerHTML = L.map((l, i) => `<div class="eslabon ok" title="Lectura ${l.n}, ${lugar[l.lugar] || l.lugar}, ${l.hora}"><b>${l.n}<span> ${lugar[l.lugar] || ''}</span></b><i>${guardadas[i].slice(0, 8)}</i></div>`).join('');
  const eslabones = $$('.eslabon', cadena);
  window.SELLO = { roto: null, alterada: null, n: L.length };
  function verificar(alterada) {
    let h = '0'.repeat(64), roto = null;
    L.forEach((l, i) => {
      const t = alterada === i ? texto({ ...l, hora: l.hora.replace(/:(\d\d):/, (m, mm) => `:${String((+mm + 7) % 60).padStart(2, '0')}:`) }) : texto(l);
      h = window.sha256(h + t);
      const ok = h === guardadas[i]; if (!ok && roto === null) roto = i;
      const e = eslabones[i]; e.classList.toggle('ok', ok); e.classList.toggle('roto', !ok); e.classList.toggle('alterado', alterada === i);
      e.querySelector('i').textContent = h.slice(0, 8);
    });
    window.SELLO.roto = roto; window.SELLO.alterada = alterada;
    veredicto.className = `veredicto ${roto === null ? 'ok' : 'roto'}`;
    veredicto.textContent = roto === null ? `Cadena íntegra: ${L.length} de ${L.length}` : `Rota en la lectura ${roto + 1}: no coinciden ${L.length - roto} huellas`;
    $('[data-accion="alterar"]').hidden = roto !== null; $('[data-accion="restaurar"]').hidden = roto === null;
  }
  $('[data-accion="alterar"]').addEventListener('click', () => verificar(20));
  $('[data-accion="restaurar"]').addEventListener('click', () => verificar(null));

  // ── arranque: con la tipografía cargada (la apertura traza sus letras de ella) ──
  const fuentes = Promise.all([document.fonts.load('760 160px Inter'), document.fonts.load('760 420px Inter'), document.fonts.load('400 15px "JetBrains Mono"')]);
  Promise.race([fuentes, new Promise((r) => setTimeout(r, 2500))]).then(() => window.CUEVA.arrancar(), () => window.CUEVA.arrancar());
})();

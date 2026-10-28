// ─────────────────────────────────────────────────────────────────────
//  CUEVA · el motor de propuestas, en forma de conversación
//  «Cuéntanos tu casa»: una ventana de chat, como un móvil, y a su lado la ficha de la casa.
//  No hay nadie al otro lado ni un modelo de lenguaje: es un programa determinista que corre
//  en tu navegador (mismo mensaje, misma respuesta).
//  1. Lees, escribes y adjuntas: ubicación (mapa, ciudad o tu posición), habitaciones,
//     gustos, parcela, un plano en imagen o un croquis dibujado aquí.
//  2. El analizador (motor/texto.js) entiende el castellano y el motor pregunta lo que falta,
//     de una en una, y resume lo entendido en fichas que se pueden cambiar.
//  3. Si hay plano, se lee y se traduce a la trama (motor/vision.js y motor/lector.js).
//  4. El motor generativo (motor/generativo.js) corre en un Web Worker hecho con un Blob:
//     enumera la gramática, busca la distribución con recocido simulado y despieza en la
//     serie J. Mientras busca, enseña su mejor planta en vivo.
//  5. La propuesta llega como un mensaje rico y se abre en la ficha: la maqueta 3D con el sol
//     de tu parcela (motor/vista3d.js), la planta, el despiece, lo entendido y mundos afines.
//  Se monta cuando la sección se acerca a la pantalla.
// ─────────────────────────────────────────────────────────────────────
(() => {
  const raiz = document.querySelector('[data-configurador]');
  if (!raiz) return;
  let montado = false;
  const io = new IntersectionObserver((e) => { if (!montado && e.some((x) => x.isIntersecting)) { montado = true; io.disconnect(); montar(); } }, { rootMargin: '900px 0px' });
  io.observe(raiz);
  window.CUEVA_CONFIGURADOR = { montar: () => { if (!montado) { montado = true; io.disconnect(); montar(); } } };

  function montar() {
    const D = window.DATOS || {}, TX = window.CUEVA_TEXTO, SOL = window.CUEVA_SOL, VI = window.CUEVA_VISION, PL = window.CUEVA_PLANO, LE = window.CUEVA_LECTOR, MQ = window.CUEVA_MAQUETA;
    if (!TX || !SOL || !PL || !window.CUEVA_MOTOR_DEF) { raiz.textContent = 'El motor de propuestas no ha podido cargar.'; return; }
    const PASO = D.TRAMA?.paso ?? 0.75;
    const SERIE = (D.SERIE_J || []).filter((j) => j.f === 'plano');
    const CORTES = D.CORTES || [0.75, 1.5, 2.25];
    const { num, esc } = PL;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── DOM con poco ruido ──
    function h(tag, at = {}, ...hijos) {
      const el = document.createElement(tag);
      for (const [k, v] of Object.entries(at || {})) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v); else el.setAttribute(k, v === true ? '' : v);
      }
      for (const c of hijos.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
      return el;
    }
    const ICO = {
      clip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 6.5 8.6 14.4a2 2 0 0 0 2.8 2.8l7.5-7.5a3.6 3.6 0 0 0-5.1-5.1l-7.7 7.7a5.2 5.2 0 0 0 7.4 7.4l6-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
      enviar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.4 11.2 19 4.6c.6-.3 1.2.3.9.9l-6.6 14.6c-.3.6-1.1.6-1.3-.1l-1.6-5.4a1 1 0 0 0-.6-.6L4.5 12.5c-.7-.2-.7-1-.1-1.3Z" fill="currentColor"/></svg>',
      lugar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.3" fill="currentColor"/></svg>',
      cama: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18V7m0 6h18v5m0-5v-1.5A3.5 3.5 0 0 0 17.5 8H11v5M6.5 11.5h.01" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
      gusto: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 14.2 9l5.8.4-4.5 3.7 1.4 5.7L12 15.7l-4.9 3.1 1.4-5.7L4 9.4 9.8 9 12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      parcela: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 9h8v6H8z" fill="currentColor" opacity=".35"/></svg>',
      plano: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z M4 11h7v8 M11 5v4 M15 11h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
      croquis: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z M13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
      nuevo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      cerrar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      mas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      menos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      sol: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      gps: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="currentColor"/><circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    };
    const icono = (k) => h('span', { class: 'cf-ico', html: ICO[k] });
    // una nota de fuente con el mismo número que el pie de la página
    function nota(f) {
      const li = document.getElementById('f-' + f), lista = li?.parentElement ? [...li.parentElement.children] : [];
      const n = li ? lista.indexOf(li) + 1 : null;
      return n ? `<sup class="f"><a href="#f-${f}" aria-label="Fuente ${n}: ${esc(D.FUENTES?.[f] || f)}" title="${esc(D.FUENTES?.[f] || f)}">${n}</a></sup>` : `<sup class="f" title="${esc(D.FUENTES?.[f] || f)}">*</sup>`;
    }
    const hora = () => { const d = new Date(); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };

    // ── el estado de la conversación ──
    const est = {
      prog: { plantas: null, dormitorios: null, banos: null, aseos: null, cocina: null, superficie: null, parcela: null, lugar: null, calle: null, gustos: {}, afinar: { orient: {} } },
      origen: {},                  // de dónde sale cada dato: «dicho», «supuesto», «mapa», «plano»
      preguntado: new Set(), pendiente: null, gustosPreguntados: false,
      plano: null, propuestas: [], elegida: -1, semilla: 1, excluir: [], generando: false, cambiosTrasPropuesta: false,
    };

    // ── la ventana ──
    const lista = h('div', { class: 'cf-mensajes', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions', 'aria-label': 'Conversación' });
    const sugerencias = h('div', { class: 'cf-sugerencias', role: 'group', 'aria-label': 'Respuestas rápidas' });
    const campo = h('textarea', { class: 'cf-campo', rows: '1', placeholder: 'Escribe cómo es tu casa', 'aria-label': 'Tu mensaje', enterkeyhint: 'send' });
    const botonAdjuntar = h('button', { type: 'button', class: 'cf-adjuntar', 'aria-label': 'Adjuntar', 'aria-haspopup': 'menu', 'aria-expanded': 'false' }, icono('clip'));
    const botonEnviar = h('button', { type: 'submit', class: 'cf-enviar', 'aria-label': 'Enviar' }, icono('enviar'));
    const menu = h('div', { class: 'cf-menu', role: 'menu', 'aria-label': 'Adjuntar', hidden: true });
    const borrador = h('div', { class: 'cf-borrador', hidden: true });
    const archivo = h('input', { type: 'file', accept: 'image/*', class: 'solo-lector', tabindex: '-1', 'aria-hidden': 'true' });
    const formulario = h('form', { class: 'cf-entrada', onsubmit: (e) => { e.preventDefault(); enviarTexto(); } }, botonAdjuntar, campo, botonEnviar, menu, archivo);
    const avatar = h('span', { class: 'cf-avatar', 'aria-hidden': 'true' }, h('i'));
    const cabeza = h('header', { class: 'cf-cabeza' }, avatar,
      h('div', { class: 'cf-titulo' }, h('b', {}, 'Motor de propuestas CUEVA'), h('small', {}, 'Un programa que corre en tu navegador. Sin personas ni servidores al otro lado.')),
      h('button', { type: 'button', class: 'cf-nuevo', 'aria-label': 'Empezar de nuevo', title: 'Empezar de nuevo', onclick: () => reiniciar() }, icono('nuevo')));
    const chat = h('section', { class: 'cf-chat', 'aria-label': 'Conversación con el motor de propuestas' }, cabeza, lista, borrador, sugerencias, formulario);
    const panelCuerpo = h('div', { class: 'cf-panel-cuerpo' });
    const panelCerrar = h('button', { type: 'button', class: 'cf-panel-cerrar', 'aria-label': 'Cerrar la propuesta', onclick: () => abrirPanel(false) }, icono('cerrar'));
    const panel = h('section', { class: 'cf-panel', 'aria-label': 'Ficha de la casa' }, panelCerrar, panelCuerpo);
    const dispositivo = h('div', { class: 'cf-dispositivo' }, chat, panel);
    raiz.classList.add('cf'); raiz.append(dispositivo);
    const movil = () => matchMedia('(max-width: 860px)').matches;
    function abrirPanel(v) { if (v) setTimeout(() => maqueta?.despertar(), 520); panel.classList.toggle('abierto', v); document.documentElement.classList.toggle('cf-hoja-abierta', v && movil()); if (v && movil()) panelCerrar.focus(); }

    // ── mensajes ──
    let cadena = Promise.resolve();
    function burbuja(quien, contenido, op = {}) {
      const cuerpo = h('div', { class: 'cf-texto' });
      if (typeof contenido === 'string') cuerpo.innerHTML = contenido; else if (contenido) cuerpo.append(contenido);
      const b = h('div', { class: `cf-msg ${quien}${op.rico ? ' rico' : ''}` }, quien === 'motor' && !op.seguido ? h('span', { class: 'cf-avatar mini', 'aria-hidden': 'true' }, h('i')) : null,
        h('div', { class: 'cf-burbuja' }, cuerpo, h('time', { class: 'cf-hora' }, hora())));
      if (quien === 'motor' && op.seguido) b.classList.add('seguido');
      lista.append(b);
      requestAnimationFrame(() => b.classList.add('vista'));
      bajar();
      return b;
    }
    function bajar() { requestAnimationFrame(() => { lista.scrollTo({ top: lista.scrollHeight, behavior: reducido ? 'auto' : 'smooth' }); }); }
    // el motor «escribe»: tres puntos, un momento proporcional al texto, y la burbuja
    let ultimoMotor = 0;
    function decir(contenido, op = {}) {
      cadena = cadena.then(async () => {
        const largo = typeof contenido === 'string' ? contenido.replace(/<[^>]+>/g, '').length : 120;
        const seguido = Date.now() - ultimoMotor < 2600 && lista.lastElementChild?.classList.contains('motor');
        const tipeo = h('div', { class: 'cf-msg motor escribiendo' + (seguido ? ' seguido' : '') }, seguido ? null : h('span', { class: 'cf-avatar mini', 'aria-hidden': 'true' }, h('i')), h('div', { class: 'cf-burbuja', 'aria-label': 'El motor está escribiendo' }, h('span', { class: 'cf-puntos' }, h('i'), h('i'), h('i'))));
        lista.append(tipeo); requestAnimationFrame(() => tipeo.classList.add('vista')); bajar();
        avatar.classList.add('pensando');
        await espera(reducido ? 120 : op.rapido ? 280 : clamp(260 + largo * 7, 420, 1150));
        tipeo.remove(); avatar.classList.remove('pensando');
        const b = burbuja('motor', typeof contenido === 'function' ? contenido() : contenido, { ...op, seguido });
        ultimoMotor = Date.now();
        if (op.chips) ponerChips(op.chips);
        op.listo?.(b);
        return b;
      });
      return cadena;
    }
    // tu mensaje, con lo entendido subrayado
    function yoDigo(texto, trazas = []) {
      const f = document.createDocumentFragment(); let i = 0;
      for (const t of trazas) { if (t.a > i) f.append(texto.slice(i, t.a)); f.append(h('mark', { class: 'cf-entendido', 'data-campo': t.campo, title: etiquetaCampo(t.campo) }, texto.slice(t.a, t.b))); i = t.b; }
      if (i < texto.length) f.append(texto.slice(i));
      return burbuja('yo', f);
    }
    const etiquetaCampo = (c) => ({ plantas: 'Plantas', dormitorios: 'Dormitorios', banos: 'Baños', aseos: 'Aseos', cocina: 'Cocina', parcela: 'Parcela', lugar: 'Lugar', gustos: 'Gustos', superficie: 'Superficie', calle: 'Orientación de la calle', personas: 'Quién vive', hijos: 'Quién vive' }[c] || c);
    // respuestas rápidas
    function ponerChips(chips) {
      sugerencias.replaceChildren(...chips.map((c) => h('button', { type: 'button', class: 'cf-chip' + (c.primario ? ' primario' : ''), onclick: () => { quitarChips(); c.hacer ? c.hacer() : enviarTexto(c.t); } }, c.t)));
      sugerencias.classList.toggle('con', chips.length > 0);
    }
    const quitarChips = () => { sugerencias.replaceChildren(); sugerencias.classList.remove('con'); };

    // ── el menú de adjuntar ──
    const OPC = [
      ['lugar', 'Ubicación', () => tarjetaLugar()], ['cama', 'Habitaciones', () => tarjetaHabitaciones()], ['gusto', 'Gustos', () => tarjetaGustos()],
      ['parcela', 'Parcela', () => tarjetaParcela()], ['plano', 'Plano', () => tarjetaPlano()], ['croquis', 'Croquis', () => tarjetaCroquis()],
    ];
    for (const [ico, t, fn] of OPC) menu.append(h('button', { type: 'button', role: 'menuitem', class: `cf-opcion ${ico}`, onclick: () => { cerrarMenu(); fn(); } }, h('span', { class: 'cf-opcion-ico' }, icono(ico)), h('span', {}, t)));
    function abrirMenu() { menu.hidden = false; botonAdjuntar.setAttribute('aria-expanded', 'true'); requestAnimationFrame(() => menu.classList.add('abierto')); menu.querySelector('button')?.focus(); }
    function cerrarMenu() { menu.classList.remove('abierto'); botonAdjuntar.setAttribute('aria-expanded', 'false'); setTimeout(() => { if (!menu.classList.contains('abierto')) menu.hidden = true; }, 180); }
    botonAdjuntar.addEventListener('click', () => (menu.hidden ? abrirMenu() : cerrarMenu()));
    menu.addEventListener('keydown', (e) => {
      const bs = [...menu.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
      if (e.key === 'Escape') { cerrarMenu(); botonAdjuntar.focus(); }
      else if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); bs[(i + (e.key === 'ArrowDown' ? 3 : 1)) % bs.length].focus(); }
      else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); bs[(i - (e.key === 'ArrowUp' ? 3 : 1) + bs.length * 2) % bs.length].focus(); }
    });
    document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && e.target !== botonAdjuntar && !botonAdjuntar.contains(e.target)) cerrarMenu(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!borrador.hidden) cerrarBorrador(); else if (panel.classList.contains('abierto')) abrirPanel(false); } });
    // el campo crece con el texto; Intro envía y Mayúsculas + Intro hace salto de línea
    campo.addEventListener('input', () => { campo.style.height = 'auto'; campo.style.height = Math.min(120, campo.scrollHeight) + 'px'; });
    campo.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviarTexto(); } });

    // ── las tarjetas de adjuntar (un borrador sobre la barra) ──
    function abrirBorrador(titulo, contenido, acciones) {
      borrador.replaceChildren(h('div', { class: 'cf-borrador-cabeza' }, h('b', {}, titulo), h('button', { type: 'button', class: 'cf-x', 'aria-label': 'Cerrar', onclick: cerrarBorrador }, icono('cerrar'))), contenido, acciones ? h('div', { class: 'cf-borrador-acciones' }, acciones) : null);
      borrador.hidden = false; requestAnimationFrame(() => borrador.classList.add('abierto'));
      setTimeout(() => borrador.querySelector('input, button:not(.cf-x), canvas, [tabindex]')?.focus(), 60);
    }
    function cerrarBorrador() { borrador.classList.remove('abierto'); setTimeout(() => { if (!borrador.classList.contains('abierto')) { borrador.hidden = true; borrador.replaceChildren(); } }, 200); campo.focus({ preventScroll: true }); }
    const boton = (t, fn, cls = '') => h('button', { type: 'button', class: 'cf-boton ' + cls, onclick: fn }, t);

    // ubicación: el mapa, una ciudad o tu posición
    function tarjetaLugar() {
      const { svg, pr } = PL.mapa({ red: D.RED || [], lugar: est.prog.lugar });
      const mapa = h('div', { class: 'cf-mapa-caja', html: svg, tabindex: '0', role: 'button', 'aria-label': 'Toca el mapa para marcar la parcela' });
      const ciudad = h('input', { class: 'cf-input', type: 'text', placeholder: 'O escribe la ciudad', list: 'cf-ciudades', 'aria-label': 'Ciudad' });
      const datalist = h('datalist', { id: 'cf-ciudades' }, TX.LUGARES.map((L) => h('option', { value: L.n })));
      let elegido = est.prog.lugar ? { ...est.prog.lugar } : null;
      const leyenda = h('p', { class: 'cf-leyenda' }, elegido ? `Marcado: ${elegido.v}` : 'Toca el mapa o escribe una capital de provincia.');
      const repintar = () => { mapa.innerHTML = PL.mapa({ red: D.RED || [], lugar: elegido }).svg; };
      mapa.addEventListener('click', (e) => {
        const s = mapa.querySelector('svg'), r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * pr.ancho, y = (e.clientY - r.top) / r.height * pr.alto;
        const [lon, lat] = pr.inv(x, y), c = TX.lugarCercano(lat, lon);
        elegido = { v: c.km < 45 ? c.L.n : `cerca de ${c.L.n}`, lat, lon, desde: 'mapa', isla: TX.ISLAS[c.L.n] || null };
        leyenda.textContent = `Marcado: ${elegido.v} (${num(lat, 2)}°, ${num(lon, 2)}°)`; repintar();
      });
      ciudad.addEventListener('change', () => { const r = TX.analizar(ciudad.value); if (r.campos.lugar) { elegido = { ...r.campos.lugar, desde: 'ciudad' }; leyenda.textContent = `Marcado: ${elegido.v}`; repintar(); } else leyenda.textContent = 'No tengo esa ciudad en mi lista: márcala en el mapa.'; });
      const gps = boton(h('span', {}, icono('gps'), 'Usar mi ubicación'), () => {
        if (!navigator.geolocation) { leyenda.textContent = 'Este navegador no da la ubicación.'; return; }
        leyenda.textContent = 'Esperando el permiso del navegador…';
        navigator.geolocation.getCurrentPosition((p) => { const { latitude: lat, longitude: lon } = p.coords, c = TX.lugarCercano(lat, lon); elegido = { v: c.km < 45 ? c.L.n : `cerca de ${c.L.n}`, lat, lon, desde: 'gps', isla: TX.ISLAS[c.L.n] || null }; leyenda.textContent = `Marcado: ${elegido.v}`; repintar(); },
          () => { leyenda.textContent = 'No ha llegado la ubicación. Márcala en el mapa.'; }, { timeout: 9000, maximumAge: 600000 });
      }, 'fantasma');
      abrirBorrador('Ubicación', h('div', { class: 'cf-tarjeta-lugar' }, mapa, h('div', { class: 'cf-fila' }, ciudad, gps), datalist, leyenda), [
        boton('Cancelar', cerrarBorrador, 'fantasma'),
        boton('Enviar', () => { if (!elegido) { leyenda.textContent = 'Primero marca un sitio.'; return; } cerrarBorrador(); adjuntoLugar(elegido); }, 'primario'),
      ]);
    }
    function adjuntoLugar(L) {
      const { svg } = PL.mapa({ red: D.RED || [], lugar: L, ancho: 240 });
      burbuja('yo', h('div', { class: 'cf-adj-lugar' }, h('div', { class: 'cf-adj-mapa', html: svg }), h('span', {}, L.v)), { rico: true });
      est.prog.lugar = L; est.origen.lugar = L.desde === 'gps' ? 'tu ubicación' : 'dicho'; est.preguntado.add('lugar'); est.pendiente = null;
      tras('lugar');
    }
    // habitaciones: plantas, dormitorios, baños y aseos
    function tarjetaHabitaciones() {
      const v = { plantas: est.prog.plantas ?? 1, dormitorios: est.prog.dormitorios ?? 3, banos: est.prog.banos ?? 2, aseos: est.prog.aseos ?? 0 };
      const filas = [['plantas', 'Plantas', 1, 2], ['dormitorios', 'Dormitorios', 0, 6], ['banos', 'Baños', 1, 4], ['aseos', 'Aseos', 0, 2]].map(([k, t, lo, hi]) => {
        const out = h('output', { 'aria-live': 'polite' }, String(v[k]));
        const cambia = (d) => { v[k] = clamp(v[k] + d, lo, hi); out.textContent = String(v[k]); };
        return h('div', { class: 'cf-paso' }, h('span', {}, t), h('div', { class: 'cf-paso-ctl' }, h('button', { type: 'button', 'aria-label': `Menos ${t.toLowerCase()}`, onclick: () => cambia(-1) }, icono('menos')), out, h('button', { type: 'button', 'aria-label': `Más ${t.toLowerCase()}`, onclick: () => cambia(1) }, icono('mas'))));
      });
      abrirBorrador('Habitaciones', h('div', { class: 'cf-pasos' }, filas), [boton('Cancelar', cerrarBorrador, 'fantasma'), boton('Enviar', () => {
        cerrarBorrador();
        const t = `${v.plantas === 1 ? 'Una planta' : 'Dos plantas'}, ${v.dormitorios} dormitorio${v.dormitorios === 1 ? '' : 's'}, ${v.banos} baño${v.banos === 1 ? '' : 's'}${v.aseos ? ` y ${v.aseos} aseo${v.aseos > 1 ? 's' : ''}` : ''}`;
        burbuja('yo', t);
        Object.assign(est.prog, v); for (const k of Object.keys(v)) { est.origen[k] = 'dicho'; est.preguntado.add(k); }
        if (v.plantas === 2 && est.prog.gustos.accesible) delete est.prog.gustos.accesible;
        est.pendiente = null; tras('habitaciones');
      }, 'primario')]);
    }
    // gustos: fichas que se encienden
    const GUSTOS = [['luz', 'Luz natural'], ['patio', 'Patio'], ['piscina', 'Piscina'], ['porche', 'Porche'], ['terraza', 'Terraza'], ['madera', 'Madera'], ['minimalista', 'Minimalista'], ['mediterraneo', 'Mediterráneo'], ['garaje', 'Garaje'], ['estudio', 'Estudio'], ['accesible', 'Accesible, sin escalones'], ['lavadero', 'Lavadero'], ['vestidor', 'Vestidor'], ['dosAguas', 'Cubierta a dos aguas'], ['dobleAltura', 'Doble altura'], ['larga', 'Planta larga'], ['celosia', 'Celosía de lamas'], ['altillo', 'Altillo'], ['chimenea', 'Chimenea']];
    function fichasGustos(sel, alCambiar) {
      return h('div', { class: 'cf-gustos', role: 'group', 'aria-label': 'Gustos' }, GUSTOS.map(([k, t]) => {
        const b = h('button', { type: 'button', class: 'cf-gusto', 'aria-pressed': sel[k] ? 'true' : 'false', onclick: () => { sel[k] = !sel[k]; b.setAttribute('aria-pressed', sel[k] ? 'true' : 'false'); alCambiar?.(); } }, t);
        return b;
      }));
    }
    function tarjetaGustos() {
      const sel = { ...est.prog.gustos };
      abrirBorrador('Gustos', fichasGustos(sel), [boton('Cancelar', cerrarBorrador, 'fantasma'), boton('Enviar', () => { cerrarBorrador(); enviarGustos(sel); }, 'primario')]);
    }
    function enviarGustos(sel) {
      const on = GUSTOS.filter(([k]) => sel[k]).map(([, t]) => t);
      burbuja('yo', on.length ? on.join(', ') : 'Nada en especial');
      est.prog.gustos = Object.fromEntries(Object.entries(sel).filter(([, v]) => v));
      if (est.prog.gustos.accesible) { est.prog.plantas = 1; est.origen.plantas = 'por ser accesible'; }
      est.gustosPreguntados = true; est.origen.gustos = 'dicho'; est.pendiente = null; tras('gustos');
    }
    // parcela: frente × fondo, con un dibujo a escala
    function tarjetaParcela() {
      const p = est.prog.parcela || { an: 20, fo: 30 };
      const an = h('input', { class: 'cf-input num', type: 'number', min: '6', max: '300', step: '0.5', value: String(p.an), 'aria-label': 'Frente de la parcela, en metros' });
      const fo = h('input', { class: 'cf-input num', type: 'number', min: '6', max: '300', step: '0.5', value: String(p.fo), 'aria-label': 'Fondo de la parcela, en metros' });
      const calle = h('select', { class: 'cf-input', 'aria-label': 'Lado de la calle' }, [['N', 'Calle al norte'], ['S', 'Calle al sur'], ['E', 'Calle al este'], ['O', 'Calle al oeste']].map(([v, t]) => h('option', { value: v, selected: (est.prog.calle || 'N') === v }, t)));
      const dib = h('div', { class: 'cf-parcela-dib' });
      const re = () => { dib.innerHTML = PL.parcela({ an: +an.value || 20, fo: +fo.value || 30 }, { calle: calle.value }); };
      an.addEventListener('input', re); fo.addEventListener('input', re); calle.addEventListener('change', re); re();
      abrirBorrador('Parcela', h('div', { class: 'cf-tarjeta-parcela' }, h('div', { class: 'cf-fila' }, h('label', {}, 'Frente', an, h('span', {}, 'm')), h('span', { class: 'cf-por' }, '×'), h('label', {}, 'Fondo', fo, h('span', {}, 'm'))), calle, dib,
        h('p', { class: 'cf-leyenda' }, 'La línea discontinua es lo edificable con retranqueos supuestos de 3 m. Comprueba los de tu municipio.')), [
        boton('Cancelar', cerrarBorrador, 'fantasma'),
        boton('Enviar', () => { const A = clamp(+an.value || 0, 6, 300), F = clamp(+fo.value || 0, 6, 300); cerrarBorrador(); burbuja('yo', h('div', { class: 'cf-adj-parcela' }, h('div', { html: PL.parcela({ an: A, fo: F }, { calle: calle.value }) }), h('span', {}, `Parcela de ${num(A, A % 1 ? 1 : 0)} × ${num(F, F % 1 ? 1 : 0)} m`)), { rico: true });
          est.prog.parcela = { an: A, fo: F }; est.prog.calle = calle.value; est.origen.parcela = 'dicho'; est.origen.calle = 'dicho'; est.preguntado.add('parcela'); est.pendiente = null; tras('parcela'); }, 'primario'),
      ]);
    }
    // plano: una imagen, o el de ejemplo
    function tarjetaPlano() {
      abrirBorrador('Plano o croquis', h('div', { class: 'cf-tarjeta-plano' },
        h('p', { class: 'cf-leyenda' }, 'Una foto o un escaneo de la planta, con los muros bien marcados. Se lee aquí, en tu navegador: la imagen no sale de él.'),
        h('div', { class: 'cf-fila' }, boton('Elegir imagen', () => { archivo.value = ''; archivo.click(); }, 'primario'), boton('Probar con uno de ejemplo', () => { cerrarBorrador(); leerPlano(LE.planoEjemplo(), { ejemplo: true }); }, 'fantasma'))), null);
    }
    archivo.addEventListener('change', () => {
      const f = archivo.files && archivo.files[0]; if (!f) return; cerrarBorrador();
      const url = URL.createObjectURL(f), img = new Image();
      img.onload = () => leerPlano(img, { nombre: f.name }); img.onerror = () => decir('No he podido abrir esa imagen. Prueba con un PNG o un JPG.'); img.src = url;
    });
    // croquis: dibujar aquí mismo
    function tarjetaCroquis() {
      const caja = h('div', { class: 'cf-croquis-caja' });
      let C = null;
      const enviarB = boton('Traducir', () => { if (!C || C.vacio()) return; const img = C.imagen(); cerrarBorrador(); leerPlano(img, { croquis: true }); }, 'primario');
      const rect = h('button', { type: 'button', class: 'cf-gusto', 'aria-pressed': 'true' }, 'Líneas rectas');
      rect.addEventListener('click', () => { const v = rect.getAttribute('aria-pressed') !== 'true'; rect.setAttribute('aria-pressed', v ? 'true' : 'false'); C.fijarRecto(v); });
      abrirBorrador('Dibuja tu planta', h('div', { class: 'cf-tarjeta-croquis' }, caja, h('div', { class: 'cf-fila' }, rect, boton('Deshacer', () => C.deshacer(), 'fantasma'), boton('Borrar', () => C.borrar(), 'fantasma'))),
        [h('p', { class: 'cf-leyenda' }, 'Dibuja los muros; los huecos de puerta, déjalos abiertos.'), enviarB]);
      requestAnimationFrame(() => { C = LE.croquis(caja, { recto: true, cambio: (n) => { enviarB.disabled = !n; } }); window.CUEVA_CONFIGURADOR.croquis = C; });
    }

    // ── leer el texto ──
    function enviarTexto(t) {
      const texto = (t ?? campo.value).trim(); if (!texto) return;
      campo.value = ''; campo.style.height = 'auto'; quitarChips();
      const R = TX.analizar(texto);
      // una respuesta suelta a la pregunta pendiente
      const p = est.pendiente;
      if (p && R.numeroSuelto != null && !R.trazas.length) {
        const n = R.numeroSuelto;
        yoDigo(texto, [{ a: 0, b: texto.length, campo: p }]);
        if (p === 'dormitorios') { est.prog.dormitorios = clamp(Math.round(n), 0, 6); est.origen.dormitorios = 'dicho'; }
        else if (p === 'banos') { est.prog.banos = clamp(Math.round(n), 1, 4); est.origen.banos = 'dicho'; }
        else if (p === 'plantas') { est.prog.plantas = clamp(Math.round(n), 1, 2); est.origen.plantas = 'dicho'; }
        else if (p === 'ladoLargo' && est.plano) { est.plano.pista = { ladoLargo: n }; est.pendiente = null; reescalar(); return; }
        else if (p === 'areaPlano' && est.plano) { est.plano.pista = { area: n }; est.pendiente = null; reescalar(); return; }
        est.pendiente = null; tras(p); return;
      }
      if (p === 'parcela' && R.parSuelto) { yoDigo(texto, [{ a: 0, b: texto.length, campo: 'parcela' }]); est.prog.parcela = { an: R.parSuelto[0], fo: R.parSuelto[1] }; est.origen.parcela = 'dicho'; est.pendiente = null; tras('parcela'); return; }
      if (p && (R.igual || R.no) && !R.trazas.length) {
        yoDigo(texto);
        est.preguntado.add(p); est.origen[p] = 'lo dejas en mis manos';
        if (p === 'gustos') est.gustosPreguntados = true;
        est.pendiente = null; tras(p); return;
      }
      if (p === 'generar' && R.si && !R.trazas.length) { yoDigo(texto); est.pendiente = null; generar(); return; }
      yoDigo(texto, R.trazas);
      const cambios = fundir(R);
      // órdenes
      if (R.ordenes.includes('reiniciar')) { reiniciar(); return; }
      if (R.ordenes.includes('descargar') && est.propuestas.length) { descargar(); return; }
      if (R.ordenes.includes('otra') && est.propuestas.length && !cambios.length) { otraAlternativa(); return; }
      if (R.ordenes.includes('ejemplo') && !cambios.length) { leerPlano(LE.planoEjemplo(), { ejemplo: true }); return; }
      if (R.ordenes.includes('plano') && !cambios.length) { decir('Adjúntalo con el clip: «Plano». Lo leo aquí mismo y lo traduzco a la trama de 0,75 m.', { chips: [{ t: 'Subir un plano', hacer: tarjetaPlano }, { t: 'Dibujar un croquis', hacer: tarjetaCroquis }] }); return; }
      if (R.ordenes.includes('croquis') && !cambios.length) { tarjetaCroquis(); return; }
      // un plano leído: «el lado largo mide 12 m», «son 90 m²»
      if (est.plano && !est.plano.traducido) {
        const n = /mide|miden|largo|lado|fachada/.test(TX.normalizar(texto)) ? (texto.match(/(\d+(?:[.,]\d+)?)/) || [])[1] : null;
        if (n) { est.plano.pista = { ladoLargo: parseFloat(n.replace(',', '.')) }; reescalar(); return; }
        if (R.campos.superficie) { est.plano.pista = { area: R.campos.superficie.v }; reescalar(); return; }
      }
      if (R.ordenes.includes('generar') && !cambios.length) { generar(); return; }
      if (R.vacio) {
        decir('No he encontrado nada de la casa en ese mensaje. Prueba con algo como «una casa de una planta con tres dormitorios en Valladolid», o usa el clip para adjuntar datos.', { chips: chipsAyuda() });
        return;
      }
      if (cambios.length) responderCambios(cambios, R);
      else if (R.si && est.pendiente === 'generar') generar();
      else siguiente();
    }
    // mezcla lo entendido en el estado; devuelve qué ha cambiado
    function fundir(R) {
      const c = [], P = est.prog, C = R.campos;
      const pon = (k, v, origen = 'dicho') => { if (JSON.stringify(P[k]) !== JSON.stringify(v)) { P[k] = v; c.push(k); } est.origen[k] = origen; est.preguntado.add(k); };
      if (C.plantas) pon('plantas', C.plantas.v);
      if (C.dormitorios) pon('dormitorios', C.dormitorios.hi != null && C.dormitorios.hi !== C.dormitorios.lo ? C.dormitorios.hi : C.dormitorios.v, C.dormitorios.hi !== C.dormitorios.lo ? `pediste de ${C.dormitorios.lo} a ${C.dormitorios.hi}` : 'dicho');
      else if (C.dormitoriosInferidos && P.dormitorios == null) pon('dormitorios', C.dormitoriosInferidos.v, C.dormitoriosInferidos.por === 'hijos' ? 'uno por hijo y el vuestro' : 'por las personas');
      if (C.banos && !C.banos.debil) pon('banos', C.banos.v); else if (C.banos && P.banos == null) pon('banos', 1);
      if (C.aseos) pon('aseos', C.aseos.v);
      if (C.cocina) pon('cocina', C.cocina.v);
      if (C.superficie) pon('superficie', C.superficie.v);
      if (C.parcela) pon('parcela', { an: C.parcela.an, fo: C.parcela.fo });
      else if (C.parcelaArea) { const A = C.parcelaArea.v, an = Math.round(Math.sqrt(A / 1.5) * 2) / 2; pon('parcela', { an, fo: Math.round(A / an * 2) / 2, area: A }, `${num(A)} m², supongo de ${num(an, an % 1 ? 1 : 0)} m de frente`); }
      if (C.lugar) pon('lugar', { ...C.lugar, desde: 'texto' });
      if (C.calle) pon('calle', C.calle.v);
      if (R.modelo) pon('modelo', R.modelo);
      for (const [k, v] of Object.entries(R.gustos)) { if (!!P.gustos[k] !== v) { if (v) P.gustos[k] = true; else delete P.gustos[k]; c.push('gusto:' + k); } est.gustosPreguntados = true; }
      if (R.gustos.accesible) { if (P.plantas !== 1) { P.plantas = 1; c.push('plantas'); } est.origen.plantas = 'por ser accesible'; }
      // afinar: «un dormitorio más», «otro baño», «más luz en el salón», «el salón al oeste», «terraza al sur», «más compacta», «más grande»
      for (const [k, d] of Object.entries(R.relativos || {})) {
        const actual = P[k] ?? (k === 'dormitorios' ? 3 : k === 'banos' ? ((P.dormitorios ?? 3) >= 3 ? 2 : 1) : 0);
        pon(k, clamp(actual + d, k === 'banos' ? 1 : 0, k === 'aseos' ? 2 : 6));
      }
      const A = P.afinar;
      if (R.luzSalon && !A.luzSalon) { A.luzSalon = true; c.push('luzSalon'); }
      for (const [k, v] of Object.entries(R.orient || {})) if (A.orient[k] !== v) { A.orient[k] = v; c.push('orient:' + k); }
      if (R.compacta && !A.compacta) { A.compacta = true; c.push('compacta'); }
      if (R.ordenes.includes('mayor') || R.ordenes.includes('menor')) {
        const base = est.propuestas[Math.max(0, est.elegida)]?.areaTot || P.superficie || 110;
        pon('superficie', Math.round(base * (R.ordenes.includes('mayor') ? 1.15 : 0.87)));
      }
      if (R.lugarDesconocido && !C.lugar) est.lugarDesconocido = R.lugarDesconocido;
      if (c.length && est.propuestas.length) est.cambiosTrasPropuesta = true;
      return c;
    }
    function responderCambios(cambios, R) {
      const ent = entendido(), chips = ent.map((e) => ({ t: e.t, hacer: e.editar }));
      if (!est.propuestas.length) decir(() => h('div', {}, h('p', {}, 'Esto es lo que he entendido:'), resumenFichas()), { rico: true });
      if (est.lugarDesconocido && !est.prog.lugar) { decir(`No tengo «${esc(est.lugarDesconocido)}» en mi lista de ciudades. ¿Lo marcas en el mapa?`, { chips: [{ t: 'Marcar en el mapa', hacer: tarjetaLugar }, { t: 'Aún no lo sé', hacer: () => { est.preguntado.add('lugar'); est.lugarDesconocido = null; siguiente(); } }] }); est.lugarDesconocido = null; return; }
      if (est.propuestas.length) { afinar(cambios); return; }
      siguiente();
      actualizarFicha();
    }
    // lo entendido, en frases con su origen
    function entendido() {
      const P = est.prog, o = est.origen, out = [];
      const add = (t, k, editar) => out.push({ t, k, origen: o[k] || (P[k] == null ? null : 'dicho'), editar });
      if (P.plantas) add(P.plantas === 1 ? 'Una planta' : 'Dos plantas', 'plantas', tarjetaHabitaciones);
      if (P.dormitorios != null) add(`${P.dormitorios} dormitorio${P.dormitorios === 1 ? '' : 's'}`, 'dormitorios', tarjetaHabitaciones);
      if (P.banos != null) add(`${P.banos} baño${P.banos === 1 ? '' : 's'}`, 'banos', tarjetaHabitaciones);
      if (P.aseos) add(`${P.aseos} aseo${P.aseos === 1 ? '' : 's'}`, 'aseos', tarjetaHabitaciones);
      if (P.cocina) add(P.cocina === 'abierta' ? 'Cocina abierta al salón' : 'Cocina independiente', 'cocina', null);
      if (P.superficie) add(`Unos ${num(P.superficie)} m²`, 'superficie', null);
      if (P.parcela) add(`Parcela de ${num(P.parcela.an, P.parcela.an % 1 ? 1 : 0)} × ${num(P.parcela.fo, P.parcela.fo % 1 ? 1 : 0)} m`, 'parcela', tarjetaParcela);
      if (P.calle && P.calle !== 'N') add(`Calle al ${{ S: 'sur', E: 'este', O: 'oeste' }[P.calle]}`, 'calle', tarjetaParcela);
      if (P.lugar) add(P.lugar.v, 'lugar', tarjetaLugar);
      if (P.modelo) add(`Como el modelo ${{ basic: 'Basic', line: 'Line', natura: 'Natura', myway: 'My Way' }[P.modelo]}`, 'modelo', null);
      for (const [k, t] of GUSTOS) if (P.gustos[k]) out.push({ t, k: 'gustos', origen: 'dicho', editar: tarjetaGustos });
      const A = P.afinar || { orient: {} }, RN = { N: 'norte', S: 'sur', E: 'este', O: 'oeste' };
      if (A.luzSalon) out.push({ t: 'Más luz en el salón', k: 'afinar', origen: 'dicho' });
      if (A.compacta) out.push({ t: 'Más compacta', k: 'afinar', origen: 'dicho' });
      for (const [k, v] of Object.entries(A.orient || {})) out.push({ t: `${k === 'salon' ? 'Salón' : k === 'terraza' ? 'Terraza' : 'Porche'} al ${RN[v]}`, k: 'afinar', origen: 'dicho' });
      return out;
    }
    function resumenFichas() {
      const ent = entendido();
      return h('div', { class: 'cf-fichas' }, ent.map((e) => h(e.editar ? 'button' : 'span', { type: e.editar ? 'button' : null, class: 'cf-ficha' + (e.origen && e.origen !== 'dicho' ? ' supuesta' : ''), title: e.origen && e.origen !== 'dicho' ? e.origen : 'Lo has dicho tú', onclick: e.editar ? () => e.editar() : null }, e.t, e.origen && e.origen !== 'dicho' ? h('small', {}, e.origen) : null)));
    }
    const chipsAyuda = () => [{ t: 'Una planta, tres dormitorios y porche' }, { t: 'Tengo un plano', hacer: tarjetaPlano }, { t: 'Dibujar un croquis', hacer: tarjetaCroquis }];

    // ── qué falta: se pregunta de uno en uno ──
    function tras(k) { actualizarFicha(); if (est.propuestas.length) { afinar([k]); return; } siguiente(); }
    // con una propuesta delante, cada cambio la afina: misma forma si sigue encajando, y se explica qué cambia y por qué
    function afinar(cambios) {
      const ant = est.propuestas[Math.max(0, est.elegida)], txt = textoCambios(cambios);
      decir(`Entendido: ${txt}. Rehago la alternativa ${'ABCD'[Math.max(0, est.elegida)]} con eso y te cuento qué cambia.`, { rapido: true });
      generar({ afinar: true, anterior: ant, cambios, titulo: 'Afino la propuesta sobre la misma gramática.' });
    }
    function textoCambios(cambios) {
      const P = est.prog, A = P.afinar, R = { N: 'norte', S: 'sur', E: 'este', O: 'oeste' }, out = [];
      for (const c of cambios) {
        if (c === 'plantas') out.push(P.plantas === 1 ? 'en una planta' : 'en dos plantas');
        else if (c === 'dormitorios') out.push(`${P.dormitorios} dormitorio${P.dormitorios === 1 ? '' : 's'}`);
        else if (c === 'banos') out.push(`${P.banos} baño${P.banos === 1 ? '' : 's'}`);
        else if (c === 'aseos') out.push(`${P.aseos} aseo${P.aseos === 1 ? '' : 's'}`);
        else if (c === 'luzSalon') out.push('más luz en el salón');
        else if (c === 'compacta') out.push('más compacta');
        else if (c.startsWith('orient:')) { const k = c.slice(7); out.push(`${k === 'salon' ? 'el salón' : k === 'terraza' ? 'la terraza' : 'el porche'} al ${R[A.orient[k]]}`); }
        else if (c.startsWith('gusto:') && cambios.includes('orient:' + c.slice(6))) continue;
        else if (c.startsWith('gusto:')) { const k = c.slice(6), g = GUSTOS.find(([q]) => q === k); out.push(`${P.gustos[k] ? 'con' : 'sin'} ${(g ? g[1] : k).toLowerCase()}`); }
        else if (c === 'superficie') out.push(`unos ${num(P.superficie)} m²`);
        else if (c === 'parcela' && P.parcela) out.push(`parcela de ${num(P.parcela.an)} × ${num(P.parcela.fo)} m`);
        else if (c === 'lugar' && P.lugar) out.push(`en ${P.lugar.v}`);
        else if (c === 'habitaciones') out.push(`${P.dormitorios} dormitorios y ${P.banos} baños`);
        else if (c === 'gustos') out.push('tus gustos');
        else if (c === 'calle') out.push('la calle cambia de lado');
        else if (c === 'cocina') out.push(P.cocina === 'abierta' ? 'cocina abierta' : 'cocina independiente');
      }
      return out.join(', ') || 'lo que me has dicho';
    }
    function siguiente() {
      const P = est.prog, pre = est.preguntado;
      actualizarFicha();
      if (P.dormitorios == null && !pre.has('dormitorios')) {
        est.pendiente = 'dormitorios';
        return decir('¿Cuántos dormitorios necesitas?', { chips: [1, 2, 3, 4, 5].map((n) => ({ t: String(n), hacer: () => enviarTexto(`${n} dormitorio${n > 1 ? 's' : ''}`) })) });
      }
      if (P.plantas == null && !pre.has('plantas')) {
        est.pendiente = 'plantas';
        return decir('¿La quieres en una planta o en dos?', { chips: [{ t: 'Una planta' }, { t: 'Dos plantas' }, { t: 'Me da igual', hacer: () => { burbuja('yo', 'Me da igual'); pre.add('plantas'); est.origen.plantas = 'lo dejas en mis manos'; est.pendiente = null; siguiente(); } }] });
      }
      if (!P.lugar && !pre.has('lugar')) {
        est.pendiente = 'lugar';
        return decir('¿Dónde está la parcela? Con la ciudad me basta: con ella calculo el sol y la distancia a la red.', { chips: [{ t: 'Marcar en el mapa', hacer: tarjetaLugar }, { t: 'Usar mi ubicación', hacer: () => { tarjetaLugar(); setTimeout(() => borrador.querySelector('.cf-fila .cf-boton')?.click(), 120); } }, { t: 'Aún no lo sé', hacer: () => { burbuja('yo', 'Aún no lo sé'); pre.add('lugar'); est.pendiente = null; siguiente(); } }] });
      }
      if (!P.parcela && !pre.has('parcela')) {
        est.pendiente = 'parcela';
        return decir('¿Sabes cuánto mide la parcela? El frente y el fondo, por ejemplo «20 por 30».', { chips: [{ t: 'Indicar medidas', hacer: tarjetaParcela }, { t: '20 × 30 m', hacer: () => enviarTexto('parcela de 20 por 30') }, { t: 'Aún no la tengo', hacer: () => { burbuja('yo', 'Aún no la tengo'); pre.add('parcela'); est.pendiente = null; siguiente(); } }] });
      }
      if (!est.gustosPreguntados) {
        est.pendiente = 'gustos'; est.gustosPreguntados = true;
        const sel = { ...P.gustos };
        return decir(() => h('div', {}, h('p', {}, '¿Algo que te guste especialmente? Elige las que quieras.'), fichasGustos(sel), h('div', { class: 'cf-fila fin' }, boton('Listo', (e) => { e.currentTarget.disabled = true; enviarGustos(sel); }, 'primario'))), { rico: true });
      }
      // ya está: lo que supongo, y la pregunta de generar
      const sup = [];
      if (P.banos == null) sup.push(`${(P.dormitorios ?? 3) >= 3 ? 2 : 1} baño${(P.dormitorios ?? 3) >= 3 ? 's' : ''}`);
      if (P.plantas == null) sup.push('pruebo con una y con dos plantas');
      if (!P.lugar) sup.push('el sol de Madrid');
      if (!P.parcela) sup.push('sin parcela, la casa no se ajusta a ninguna');
      est.pendiente = 'generar';
      decir(`Con esto ya puedo proponerte casas${sup.length ? `. Supongo ${sup.join(', ')}` : ''}. ¿Las genero?`, { chips: [{ t: 'Generar propuestas', primario: true, hacer: generar }, { t: 'Añadir un plano', hacer: tarjetaPlano }, { t: 'Cambiar algo', hacer: cambiarAlgo }] });
    }
    function cambiarAlgo() {
      decir(() => h('div', {}, h('p', {}, 'Dime qué cambio, como lo dirías: «añade un estudio», «mejor dos plantas», «quita el porche». O toca una ficha:'), resumenFichas()), { rico: true, chips: [{ t: 'Añade un estudio' }, { t: 'Mejor dos plantas' }, { t: 'Con piscina' }] });
      est.pendiente = null; campo.focus({ preventScroll: true });
    }

    // ── el trabajador: el motor en un Web Worker hecho con un Blob (o, si no se deja, aquí, a trozos) ──
    let trabajador = null, idTrabajo = 0;
    const local = window.CUEVA_MOTOR_DEF();
    function crearTrabajador() {
      if (trabajador !== null) return trabajador;
      try {
        const src = `${window.CUEVA_MOTOR_DEF.toString()}
const M = CUEVA_MOTOR_DEF();
self.onmessage = (e) => {
  const d = e.data;
  try {
    if (d.tipo === 'proponer') {
      const g = M.proponer(d.P, d.ctx); let r = g.next(), t = 0;
      while (!r.done) { const v = r.value; const ya = Date.now(); if (v.etapa !== 'recocido' || ya - t > 70) { if (typeof v.vista === 'function') v.vista = v.vista(); else delete v.vista; self.postMessage({ id: d.id, tipo: 'progreso', v }); t = ya; } r = g.next(); }
      self.postMessage({ id: d.id, tipo: 'fin', v: r.value });
    } else if (d.tipo === 'traducir') self.postMessage({ id: d.id, tipo: 'fin', v: M.traducir(d.plano, d.ctx) });
  } catch (err) { self.postMessage({ id: d.id, tipo: 'error', v: String(err && err.stack || err) }); }
};`;
        const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
        trabajador = new Worker(url);
        trabajador.onerror = (e) => { console.warn('motor: sin Web Worker, sigo en la página', e.message || ''); trabajador = false; };
        window.CUEVA_CONFIGURADOR.trabajador = 'blob';
      } catch (e) { trabajador = false; window.CUEVA_CONFIGURADOR.trabajador = 'pagina'; }
      return trabajador;
    }
    function pedir(tipo, datos, alProgreso) {
      const w = crearTrabajador(), id = ++idTrabajo;
      const enLocal = () => new Promise((res, rej) => {
        try {
          if (tipo === 'traducir') return res(local.traducir(datos.plano, datos.ctx));
          const g = local.proponer(datos.P, datos.ctx); let t = 0;
          const paso = () => {
            const t0 = performance.now();
            try { while (performance.now() - t0 < 12) { const r = g.next(); if (r.done) return res(r.value); const v = r.value; if (v.etapa !== 'recocido' || performance.now() - t > 70) { if (typeof v.vista === 'function') v.vista = v.vista(); alProgreso?.(v); t = performance.now(); } } }
            catch (e) { return rej(e); }
            requestAnimationFrame(paso);
          };
          paso();
        } catch (e) { rej(e); }
      });
      if (!w) return enLocal();
      return new Promise((res, rej) => {
        let vivo = false;
        const vigia = setTimeout(() => { if (!vivo) { w.removeEventListener('message', oir); trabajador = false; enLocal().then(res, rej); } }, 2500);
        const oir = (e) => {
          const d = e.data; if (d.id !== id) return; vivo = true;
          if (d.tipo === 'progreso') alProgreso?.(d.v);
          else { clearTimeout(vigia); w.removeEventListener('message', oir); d.tipo === 'fin' ? res(d.v) : rej(new Error(d.v)); }
        };
        w.addEventListener('message', oir);
        w.postMessage({ id, tipo, ...datos });
      });
    }
    // el contexto del motor: la trama, la serie, el sol del lugar y lo edificable de la parcela
    function contexto(extra = {}) {
      const P = est.prog, L = P.lugar || { lat: 40.42, lon: -3.70, v: 'Madrid' }, calle = P.calle || 'N';
      let edificable = null;
      if (P.parcela) { const a = Math.max(3, P.parcela.an - 6), f = Math.max(3, P.parcela.fo - 6); edificable = calle === 'N' || calle === 'S' ? [a, f] : [f, a]; }
      const A = P.afinar || { orient: {} };
      return { datos: { paso: PASO, serie: SERIE, cortes: CORTES }, calle, fachadas: SOL.fachadas(L.lat, L.lon), edificable, semilla: est.semilla, excluir: est.excluir, orient: { ...A.orient }, luzSalon: !!A.luzSalon, ...extra };
    }
    function programaMotor() {
      const P = est.prog;
      const g = { ...P.gustos }; if (P.afinar?.compacta) g.minimalista = true; if (P.afinar?.orient?.terraza) g.terraza = true;
      return { plantas: P.plantas, dormitorios: P.dormitorios, banos: P.banos, aseos: P.aseos, cocina: P.cocina, superficie: P.superficie, gustos: g, modelo: P.modelo || null };
    }

    // ── generar: la tarjeta en vivo de la búsqueda ──
    async function generar(op = {}) {
      if (est.generando) return;
      est.generando = true; est.pendiente = null; quitarChips(); est.cambiosTrasPropuesta = false;
      const etapas = [
        ['gramatica', 'Enumero la gramática'], ['modelos', 'Busco el modelo CUEVA más parecido'], ['variantes', 'Genero variantes con su lógica'], ['reglas', 'Compruebo las reglas espaciales'], ['despiece', 'Despiezo en la serie J'],
      ];
      const lis = etapas.map(([k, t]) => h('li', { 'data-k': k }, h('i'), h('span', {}, t), h('small')));
      const vivo = h('div', { class: 'cf-vivo-caja' }), barra = h('div', { class: 'cf-progreso' }, h('i'));
      const grafica = h('canvas', { class: 'cf-grafica', width: '240', height: '56', 'aria-hidden': 'true' });
      const tarjeta = h('div', { class: 'cf-busqueda' }, h('p', {}, op.titulo || 'Buscando tu casa entre todas las que permite la gramática.'), h('ol', { class: 'cf-etapas' }, lis), vivo, h('div', { class: 'cf-fila' }, barra, grafica));
      await decir(() => tarjeta, { rico: true, rapido: true });
      const marca = (k, txt, hecho) => { const li = tarjeta.querySelector(`li[data-k="${k}"]`); if (!li) return; li.classList.add('activa'); if (hecho) li.classList.add('hecha'); if (txt) li.querySelector('small').innerHTML = txt; for (const o of tarjeta.querySelectorAll('li')) { if (o === li) break; o.classList.add('hecha'); } };
      let historia = [];
      const alProgreso = (v) => {
        if (v.etapa === 'gramatica') marca('gramatica', `${num(v.envolventes)} envolventes válidas y ${num(v.aristas)} aristas de crecimiento, enumeradas aquí en ${num(Math.max(1, v.ms))} ms${nota('generativa')}`, true);
        else if (v.etapa === 'modelos') marca('modelos', `${v.orden.map((o) => o.n).join(', luego ')}: por plantas, dormitorios y gustos`, true);
        else if (v.etapa === 'variantes') { marca('variantes', `Variante ${v.k + 1}, sobre el modelo ${esc(v.n)}`); if (v.vista) vivo.innerHTML = PL.vivo(v.vista); barra.firstChild.style.transform = `scaleX(${clamp((v.k + 1) / 4, 0, 1)})`; }
        else if (v.etapa === 'reglas') marca('reglas', `${v.ok.filter(Boolean).length} de ${v.n} cumplen todas: proporciones, anchos, zonas, accesos, sol y luces de placa`, true);
        else if (v.etapa === 'candidatas') marca('candidatas', `${num(v.elegidas)} de ${num(v.formas)} formas distintas, por superficie, parcela y gustos`, true);
        else if (v.etapa === 'recocido') {
          marca('recocido', `${v.ronda ? 'Afino' : 'Pruebo'} la forma ${v.k + 1} de ${v.de}`);
          if (v.vista) vivo.innerHTML = PL.vivo(v.vista);
          historia = v.hist || historia;
          const tot = (v.ronda ? 0.6 : 0) + ((v.k + v.it / v.total) / v.de) * (v.ronda ? 0.4 : 0.6);
          barra.firstChild.style.transform = `scaleX(${clamp(tot, 0, 1)})`;
          pintarGrafica(grafica, historia);
        } else if (v.etapa === 'despiece') marca('despiece', 'Forjados y cubiertas por ramificación y poda; fachadas por programación dinámica', false);
      };
      try {
        let res;
        if (op.plano) {
          const A = await pedir('traducir', { plano: op.plano, ctx: contexto() });
          alProgreso({ etapa: 'gramatica', envolventes: local.enumerar().lista.length, aristas: local.enumerar().aristas, ms: local.enumerar().ms });
          res = await pedir('proponer', { P: op.programa || programaMotor(), ctx: contexto({ alternativas: 2 }) }, alProgreso);
          res.alternativas.unshift(A);
        } else res = await pedir('proponer', { P: programaMotor(), ctx: contexto(op.afinar && op.anterior && !op.anterior.fiel ? { preferir: { sig: op.anterior.sig }, excluir: [] } : {}) }, alProgreso);
        marca('despiece', `${num(res.alternativas.reduce((a, p) => a + p.totales.piezas, 0))} piezas en ${res.alternativas.length} propuestas`, true);
        barra.firstChild.style.transform = 'scaleX(1)';
        tarjeta.classList.add('terminada');
        est.propuestas = res.alternativas; est.stats = res.stats; est.generando = false; est.elegida = -1;
        if (op.afinar && op.anterior) decir(() => h('div', { class: 'cf-explica', html: explicar(op.anterior, res.alternativas[0], op.cambios || []) }), { rico: true });
        mostrarPropuestas(res);
      } catch (e) {
        console.error(e); est.generando = false;
        decir('Algo ha fallado en el cálculo. Prueba a cambiar algún dato y vuelve a generar.', { chips: [{ t: 'Generar de nuevo', hacer: generar }] });
      }
    }
    function pintarGrafica(c, hist) {
      const x = c.getContext('2d'), w = c.width, hh = c.height; x.clearRect(0, 0, w, hh);
      if (hist.length < 2) return;
      const lo = Math.min(...hist), hi = Math.max(...hist.slice(0, 3)), sp = hi - lo || 1;
      x.strokeStyle = '#0EA5E9'; x.lineWidth = 2; x.beginPath();
      hist.forEach((v, i) => { const px = (i / (hist.length - 1)) * (w - 4) + 2, py = 4 + (1 - (hi - v) / sp) * (hh - 8); i ? x.lineTo(px, py) : x.moveTo(px, py); });
      x.stroke();
    }

    // ── las propuestas, en el chat ──
    function datosClave(P) {
      const dorm = P.rooms.filter((r) => r.t === 'principal' || r.t === 'dormitorio').length, banos = P.rooms.filter((r) => r.t === 'bano').length, aseos = P.rooms.filter((r) => r.t === 'aseo').length;
      return { dorm, banos, aseos, m2: P.areaTot };
    }
    function mostrarPropuestas(res) {
      const ALF = 'ABCD', comp = compromisos(res.alternativas);
      const tarjetas = res.alternativas.map((P, i) => {
        const k = datosClave(P);
        return h('button', { type: 'button', class: 'cf-alt', 'aria-label': `Alternativa ${ALF[i]}: ${P.nombre}`, onclick: () => elegir(i, true) },
          h('div', { class: 'cf-alt-mini', html: PL.mini(P) }),
          h('span', { class: 'cf-alt-letra' }, ALF[i]),
          h('b', {}, P.nombre),
          h('span', { class: 'cf-alt-datos' }, `${num(k.m2)} m² orientativos, ${k.dorm} dorm., ${k.banos} baño${k.banos === 1 ? '' : 's'}`),
          h('span', { class: 'cf-alt-datos' }, `${num(P.totales.piezas)} piezas J, compacidad ${num(medir(P).compacidad, 2)}`),
          P.basada ? h('span', { class: 'cf-alt-datos' }, P.basada) : null,
          h('span', { class: 'cf-alt-sellos' }, (comp[i] || []).map((t) => h('i', {}, t))));
      });
      const cuantas = res.alternativas.length;
      decir(() => h('div', { class: 'cf-propuestas' },
        h('p', {}, res.alternativas[0]?.fiel ? `Tu plano, traducido a la trama, y ${cuantas - 1} alternativa${cuantas - 1 === 1 ? '' : 's'} dentro de la gramática CUEVA. Toca una para verla en grande.` : `${cuantas === 1 ? 'Una propuesta' : `${['', '', 'Dos', 'Tres', 'Cuatro'][cuantas]} propuestas`}, cada una con su planta, su maqueta y su despiece. Toca una para verla en grande.`),
        h('div', { class: 'cf-alts' }, tarjetas),
        h('div', { class: 'cf-tabla-caja', html: htmlComparar(res.alternativas, -1, true) }),
        res.alternativas[0]?.porque ? h('div', { class: 'cf-porque' }, h('b', {}, `Por qué funciona la A (${res.alternativas[0].basada.replace(/^B/, 'b')})`), h('ul', {}, res.alternativas[0].porque.slice(0, 3).map((t) => h('li', {}, t)))) : null,
        h('p', { class: 'cf-aviso' }, 'Propuesta orientativa generada en tu navegador. No sustituye a un proyecto técnico.')), {
        rico: true, chips: [{ t: 'Otra alternativa', hacer: otraAlternativa }, { t: 'Cambiar algo', hacer: cambiarAlgo }, { t: 'Descargar propuesta', hacer: descargar }],
        listo: () => { elegir(0, false); },
      });
    }
    function otraAlternativa() {
      est.excluir = [...new Set([...est.excluir, ...est.propuestas.filter((p) => !p.fiel).map((p) => p.sig)])];
      est.semilla++;
      burbuja('yo', 'Otra alternativa');
      generar({ titulo: 'Busco otras formas, sin repetir las que ya has visto.' });
    }

    // ── la ficha: en reposo, lo que vamos sabiendo; con propuesta, la propuesta ──
    function actualizarFicha() {
      if (est.elegida >= 0) return;
      const P = est.prog, L = P.lugar, red = L ? SOL.puntoCercano(L.lat, L.lon, D.RED) : null;
      const { svg } = PL.mapa({ red: D.RED || [], lugar: L, destino: red?.p });
      const hoy = new Date(), Ls = L || { lat: 40.42, lon: -3.70 };
      const rec = SOL.recorrido(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), Ls.lat, Ls.lon);
      const ver = SOL.recorrido(hoy.getFullYear(), 5, 21, Ls.lat, Ls.lon), inv = SOL.recorrido(hoy.getFullYear(), 11, 21, Ls.lat, Ls.lon);
      const ahora = SOL.posicion(new Date(), Ls.lat, Ls.lon);
      const ent = entendido();
      panelCuerpo.replaceChildren(h('div', { class: 'cf-ficha-reposo' },
        h('div', { class: 'cf-bloque' }, h('span', { class: 'cf-etq' }, 'Tu casa, hasta ahora'), ent.length ? resumenFichas() : h('p', { class: 'cf-tenue' }, 'Lo que me cuentes aparecerá aquí.')),
        h('div', { class: 'cf-bloque cf-dos' },
          h('div', {}, h('span', { class: 'cf-etq' }, 'Dónde'), h('div', { class: 'cf-mapa-ficha', html: svg }),
            h('p', { class: 'cf-tenue', html: L ? (red ? `${esc(L.v)}. A ${num(Math.round(red.km / 5) * 5)} km del punto de producción de ${esc(red.p.n)}${nota('red')}: distancia en línea recta, estimación.` : esc(L.v)) : 'Sin ubicación todavía. El punto azul es el punto de producción activo de la red.' })),
          h('div', {}, h('span', { class: 'cf-etq' }, L ? 'El sol en tu parcela, hoy' : 'El sol, hoy (en Madrid, mientras no digas dónde)'), h('div', { class: 'cf-solar-caja', html: PL.solar(rec, { verano: ver, invierno: inv, ahora }) }),
            h('p', { class: 'cf-tenue' }, `Sale a las ${rec.orto} y se pone a las ${rec.ocaso}. Las curvas tenues son el 21 de junio y el 21 de diciembre; el salón buscará el sur.`))),
        P.parcela ? h('div', { class: 'cf-bloque' }, h('span', { class: 'cf-etq' }, 'La parcela'), h('div', { class: 'cf-parcela-ficha', html: PL.parcela(P.parcela, { calle: P.calle || 'N' }) }), h('p', { class: 'cf-tenue' }, 'Lo edificable, con retranqueos supuestos de 3 m.')) : null,
        h('div', { class: 'cf-bloque cf-gramatica' }, h('span', { class: 'cf-etq' }, 'Con qué se construye'),
          h('p', { class: 'cf-tenue', html: `Trama de ${num(PASO, 2)} m${nota('plano')}, piezas de la serie J de la J1 a la J10${nota('plano')} y cortes de ancho de ${CORTES.map((c) => num(c, 2)).join(', ').replace(/, ([^,]*)$/, ' y $1')} m. La gramática del motor generativo: 2 plantas, 3 cuerpos y 3 bandas${nota('generativa')}.` }),
          h('div', { class: 'cf-serie', 'aria-hidden': 'true' }, SERIE.map((j) => h('span', { title: `${j.id}: ${num(j.l, 2)} × ${num(j.a, 2)} m` }, h('i', { style: { width: `${j.l * 7}px`, height: `${j.a * 7}px` } }), j.id))))));
    }

    // ── la propuesta, en la ficha ──
    let maqueta = null, pestana = 'maqueta', plantaVista = 0, verPiezas = false, verMuebles = true, horaSol = 12, diaSol = (() => { const n = new Date(), i = new Date(n.getFullYear(), 0, 0); return Math.round((n - i) / 86400000); })();
    function elegir(i, abrir) {
      est.elegida = i; const P = est.propuestas[i]; if (!P) return;
      for (const b of lista.querySelectorAll('.cf-alts')) [...b.children].forEach((c, k) => c.classList.toggle('activa', k === i));
      pintarPropuesta(P);
      if (abrir || !movil()) abrirPanel(movil() ? !!abrir : true);
    }
    function pintarPropuesta(P) {
      const k = datosClave(P), M = medir(P), ALF = 'ABCD', i = est.elegida;
      const tabs = [['maqueta', 'Maqueta'], ['plano', 'Planta'], ['despiece', 'Piezas y montaje'], ['comparar', 'Comparar'], ['ficha', 'Ficha']];
      if (!tabs.some(([t]) => t === pestana)) pestana = 'maqueta';
      const barra = h('div', { class: 'cf-pestanas', role: 'tablist', 'aria-label': 'Vistas de la propuesta' }, tabs.map(([t, n]) => h('button', { type: 'button', role: 'tab', id: `cf-tab-${t}`, 'aria-selected': pestana === t ? 'true' : 'false', 'aria-controls': `cf-vista-${t}`, tabindex: pestana === t ? '0' : '-1', onclick: () => { pestana = t; mostrarPestana(); } }, n)));
      barra.addEventListener('keydown', (e) => { if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return; const j = tabs.findIndex(([t]) => t === pestana), n = (j + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; pestana = tabs[n][0]; mostrarPestana(); barra.children[n].focus(); });
      const cab = h('div', { class: 'cf-prop-cabeza' },
        h('div', {}, h('span', { class: 'cf-etq' }, `Alternativa ${ALF[i]} de ${est.propuestas.length}${P.basada ? `. ${P.basada}` : ''}`), h('h4', {}, P.nombre),
          h('p', { class: 'cf-cifras' }, h('span', {}, h('b', {}, `${num(k.m2)} m²`), ' orientativos'), h('span', {}, h('b', {}, String(k.dorm)), ` dormitorio${k.dorm === 1 ? '' : 's'}`), h('span', {}, h('b', {}, String(k.banos + k.aseos)), ` baño${k.banos + k.aseos === 1 ? '' : 's'}`), h('span', {}, h('b', {}, num(P.totales.piezas)), ' piezas J'),
            M.salonRumbo ? h('span', {}, 'salón al ', h('b', {}, RUMBO_N[M.salonRumbo]), `, ${num(M.solSalonInv, 1)} h de sol en invierno`) : null)),
        h('div', { class: 'cf-cambiar' }, est.propuestas.map((Q, j) => h('button', { type: 'button', class: 'cf-letra' + (j === i ? ' activa' : ''), 'aria-label': `Ver la alternativa ${ALF[j]}`, 'aria-pressed': j === i ? 'true' : 'false', onclick: () => elegir(j, true) }, ALF[j]))));
      const vistas = h('div', { class: 'cf-vistas' });
      panelCuerpo.replaceChildren(h('div', { class: 'cf-propuesta' }, cab, barra, vistas));
      // ── maqueta ──
      const vM = h('div', { class: 'cf-vista', id: 'cf-vista-maqueta', role: 'tabpanel', 'aria-labelledby': 'cf-tab-maqueta' });
      const caja3d = h('div', { class: 'cf-caja3d' });
      const brujula = h('div', { class: 'cf-brujula', 'aria-hidden': 'true' }, h('span', {}, 'N'));
      const Ls = est.prog.lugar || { lat: 40.42, lon: -3.70 };
      const horaTxt = h('output', { class: 'cf-hora-sol' }), solTxt = h('span', { class: 'cf-sol-txt' }), diaTxt = h('output', { class: 'cf-dia-sol' });
      const deslizador = h('input', { type: 'range', min: '5', max: '22', step: '0.25', value: String(horaSol), 'aria-label': 'Hora del día para el sol de la maqueta' });
      const deslizaDia = h('input', { type: 'range', min: '1', max: '365', step: '1', value: String(diaSol), 'aria-label': 'Día del año para el sol de la maqueta' });
      const controles = h('div', { class: 'cf-controles' }, h('div', { class: 'cf-fila' }, icono('sol'), horaTxt, deslizador, solTxt), h('div', { class: 'cf-fila' }, h('span', { class: 'cf-dia-ico', 'aria-hidden': 'true' }), diaTxt, deslizaDia));
      const zoom = h('div', { class: 'cf-zoom' }, h('button', { type: 'button', 'aria-label': 'Acercar', onclick: () => maqueta?.zoom(0.85) }, icono('mas')), h('button', { type: 'button', 'aria-label': 'Alejar', onclick: () => maqueta?.zoom(1.18) }, icono('menos')));
      const modos = [['Entera', 0], ['Sin cubierta', 1]].concat(P.plantas > 1 ? [['Planta baja', 2]] : []).concat([['Despiezada', 'despiece'], ['Uniones', 'uniones']]);
      const segModo = h('div', { class: 'cf-seg cf-corte', role: 'group', 'aria-label': 'Ver la maqueta' }, modos.map(([t, n]) => h('button', { type: 'button', 'aria-pressed': n === 0 ? 'true' : 'false', onclick: () => { if (typeof n === 'number') maqueta?.cortar(n); else maqueta?.modo(n); marcarModo(n); } }, t)));
      const leyenda = h('div', { class: 'cf-leyenda3d', hidden: true });
      const etapa = h('div', { class: 'cf-etapa3d', hidden: true, 'aria-live': 'polite' });
      const marcarModo = (n) => {
        [...segModo.children].forEach((b, q) => b.setAttribute('aria-pressed', modos[q][1] === n ? 'true' : 'false'));
        if (n === 'despiece') { leyenda.hidden = false; leyenda.replaceChildren(h('b', {}, 'Piezas por tipo'), ...P.despiece.map((d) => h('span', {}, h('i', { style: { background: maqueta ? maqueta.colorTipo(d.nombre) : '#ccc' } }), `${d.nombre}: ${d.n}`))); }
        else if (n === 'uniones') { const U = P.uniones?.n || {}; leyenda.hidden = false; leyenda.replaceChildren(h('b', {}, 'Uniones, reparto ilustrativo'), h('span', {}, h('i', { style: { background: '#5B6478' } }), `Atornilladas: ${U.atornillada || 0} nudos`), h('span', {}, h('i', { style: { background: '#0EA5E9' } }), `Soldadas: ${U.soldada || 0} juntas`), h('span', {}, h('i', { style: { background: '#00A88A' } }), `Apoyadas: ${U.apoyada || 0} apoyos`)); }
        else leyenda.hidden = true;
      };
      const botonMontaje = boton('Ver el montaje con la grúa', () => { maqueta?.montar(); marcarModo(0); }, 'fantasma');
      caja3d.append(brujula, zoom, segModo, leyenda, etapa, controles);
      vM.append(caja3d, h('div', { class: 'cf-fila cf-bajo3d' }, botonMontaje, h('p', { class: 'cf-pie-vista' }, 'Arrastra para girar. Cada placa es una pieza de la serie J y llega en su orden de montaje; los tabiques, en gris, quedan fuera de la serie. El sol es el de tu parcela, a la hora y el día que elijas.')));
      // ── planta ──
      const vP = h('div', { class: 'cf-vista', id: 'cf-vista-plano', role: 'tabpanel', 'aria-labelledby': 'cf-tab-plano', hidden: true });
      const svgP = h('div', { class: 'cf-planta-caja' });
      const conm = h('div', { class: 'cf-fila' }, P.plantas > 1 ? h('div', { class: 'cf-seg', role: 'group', 'aria-label': 'Planta' }, ['Planta baja', 'Planta primera'].map((t, f) => h('button', { type: 'button', 'aria-pressed': plantaVista === f ? 'true' : 'false', onclick: (e) => { plantaVista = f; for (const q of e.currentTarget.parentElement.children) q.setAttribute('aria-pressed', q === e.currentTarget ? 'true' : 'false'); dibujarPlanta(); } }, t))) : null,
        h('button', { type: 'button', class: 'cf-gusto', 'aria-pressed': verMuebles ? 'true' : 'false', onclick: (e) => { verMuebles = !verMuebles; e.currentTarget.setAttribute('aria-pressed', verMuebles ? 'true' : 'false'); dibujarPlanta(); } }, 'Mobiliario'),
        h('button', { type: 'button', class: 'cf-gusto', 'aria-pressed': verPiezas ? 'true' : 'false', onclick: (e) => { verPiezas = !verPiezas; e.currentTarget.setAttribute('aria-pressed', verPiezas ? 'true' : 'false'); dibujarPlanta(); } }, 'Piezas del forjado'));
      const dibujarPlanta = () => { const f = Math.min(plantaVista, P.plantas - 1); svgP.innerHTML = PL.planta(P, f, { titulo: f ? 'Planta primera' : 'Planta baja', piezas: verPiezas ? (f ? 'planta1' : 'sanitario') : null, muebles: verMuebles }); };
      dibujarPlanta();
      const malas = (P.reglas || []).filter((r) => !r.ok);
      const porque = P.porque ? h('div', { class: 'cf-porque' }, h('b', {}, 'Por qué funciona esta planta'), h('ul', {}, P.porque.map((t) => h('li', {}, t))),
        malas.length ? h('p', { class: 'cf-revisar' }, `A revisar: ${malas.map((r) => `${r.t.toLowerCase()}, ${r.detalle}`).join('; ')}.`) : h('p', { class: 'cf-tenue' }, 'Comprobado en esta propuesta: proporciones, anchos mínimos, zonas de día y de noche, accesos, cocina y salón, sol del salón y luces de placa.')) : null;
      vP.append(conm, svgP, porque, h('p', { class: 'cf-pie-vista', html: `Superficies y medidas orientativas, sobre la trama de ${num(PASO, 2)} m${nota('plano')}; las cotas de arriba y de la izquierda siguen los ejes de las estancias. Mobiliario esquemático. ${P.fiel ? 'Supongo que el norte está arriba de tu plano.' : 'El norte es el de verdad, con la casa girada sobre la parcela; los ventanales miran al jardín y al sol.'}` }));
      // ── piezas y montaje ──
      const vD = h('div', { class: 'cf-vista', id: 'cf-vista-despiece', role: 'tabpanel', 'aria-labelledby': 'cf-tab-despiece', hidden: true });
      vD.append(h('span', { class: 'cf-etq' }, 'Despiece por tipo de pieza'), h('div', { class: 'cf-tabla-caja', html: PL.tablaDespiece(P) }),
        h('span', { class: 'cf-etq cf-sep' }, 'Secuencia de montaje'), h('div', { html: htmlMontaje(P) }),
        h('span', { class: 'cf-etq cf-sep' }, 'Uniones'), h('div', { html: htmlUniones(P) }),
        h('ul', { class: 'cf-notas' }, P.losas.map((l) => h('li', {}, `${l.n}: ${num(l.piezas.length)} piezas sobre ${num(l.celdas * PASO * PASO, 1)} m², ${l.demostrado ? 'mínimo demostrado' : 'la mejor encontrada'} tras ${num(l.nodos)} nodos de búsqueda.`)),
          h('li', { html: htmlLuz(P) }),
          h('li', {}, `Fachadas con piezas de pie de 3,00 m de alto y ${num(P.totales.huecos)} huecos cortados en ellas. Tabiquería interior, fuera de la serie J: unos ${num(P.totales.tabique)} m lineales.`)));
      // ── comparar ──
      const vC = h('div', { class: 'cf-vista', id: 'cf-vista-comparar', role: 'tabpanel', 'aria-labelledby': 'cf-tab-comparar', hidden: true });
      const comp = compromisos(est.propuestas);
      vC.append(h('div', { class: 'cf-tabla-caja', html: htmlComparar(est.propuestas, i) }),
        h('ul', { class: 'cf-notas' }, est.propuestas.map((Q, j) => h('li', {}, h('b', {}, `${ALF[j]}. ${Q.nombre}. `), (comp[j] || []).length ? `${(comp[j] || []).join(', ')}.` : 'Un término medio entre las demás.', ' ', textoDebil(Q, est.propuestas)))),
        h('p', { class: 'cf-pie-vista' }, 'Horas de sol directo por las ventanas de la estancia, contando el sol sobre el horizonte y de frente a la fachada: estimación del motor, sin sombras de vecinos ni de arbolado. La compacidad compara la huella con un cuadrado de la misma superficie.'));
      // ── ficha ──
      const vR = h('div', { class: 'cf-vista', id: 'cf-vista-ficha', role: 'tabpanel', 'aria-labelledby': 'cf-tab-ficha', hidden: true });
      const red = est.prog.lugar ? SOL.puntoCercano(est.prog.lugar.lat, est.prog.lugar.lon, D.RED) : null;
      const motivos = (P.motivos || []).filter((m) => m[1] > 8);
      vR.append(
        h('span', { class: 'cf-etq' }, 'Esto es lo que he entendido'), resumenFichas(),
        h('span', { class: 'cf-etq cf-sep' }, 'Supuestos'), h('div', { html: htmlSupuestos(P) }),
        h('span', { class: 'cf-etq cf-sep' }, 'Qué hay que validar con un técnico'), h('div', { html: htmlValidar(P) }),
        h('ul', { class: 'cf-notas' },
          red ? h('li', { html: `${esc(est.prog.lugar.v)} queda a ${num(Math.round(red.km / 5) * 5)} km del punto de producción de ${esc(red.p.n)}${nota('red')}: distancia en línea recta, estimación.` }) : null,
          motivos.length ? h('li', {}, `Lo que no se ha podido cumplir del todo: ${motivos.map((m) => m[0].toLowerCase()).join('; ')}.`) : h('li', {}, 'La planta cumple todas sus reglas: proporciones, anchos, zonas, accesos, sol del salón y luces de placa.'),
          est.stats ? h('li', {}, est.stats.variantes != null ? `Se han comparado ${num(est.stats.variantes)} variantes de los modelos CUEVA (${est.stats.modelos.join(', ')}), con sus reglas espaciales, en ${num(Math.max(0.1, est.stats.ms / 1000), 1)} s y en tu navegador.` : `Se han medido ${num(est.stats.iteraciones)} distribuciones sobre ${num(est.stats.candidatas)} envolventes en ${num(est.stats.ms / 1000, 1)} s, en tu navegador.`) : null),
        h('div', { class: 'cf-fila' }, boton('Descargar la ficha', descargar, 'primario'), boton('Otra alternativa', otraAlternativa, 'fantasma'), boton('Cambiar algo', cambiarAlgo, 'fantasma')),
        h('p', { class: 'cf-aviso' }, 'Propuesta orientativa generada en tu navegador. No sustituye a un proyecto técnico. Las cifras que calcula el motor son estimaciones ilustrativas.'));
      vistas.append(vM, vP, vD, vC, vR);
      mostrarPestana();
      // la maqueta, con su propio renderer, solo cuando hace falta
      if (!window.THREE || !MQ) { caja3d.append(h('p', { class: 'cf-tenue' }, 'La maqueta 3D necesita WebGL.')); return; }
      requestAnimationFrame(() => {
        try {
          if (maqueta) maqueta.destruir();
          maqueta = MQ.crear(caja3d, {
            alGirar: (az) => { brujula.style.transform = `rotate(${(az * 180 / Math.PI).toFixed(1)}deg)`; }, alCortar: (n) => marcarModo(n),
            alMontaje: (t, n, tot) => { if (!t) { etapa.hidden = true; return; } etapa.hidden = false; etapa.textContent = `${t}: pieza ${n} de ${tot}`; },
          });
          window.CUEVA_CONFIGURADOR.maqueta = maqueta;
          maqueta.mostrar(P, opcionesMaqueta(P));
          ponerSol();
        } catch (e) { console.error('maqueta', e); caja3d.append(h('p', { class: 'cf-tenue' }, 'No he podido abrir la maqueta 3D en este navegador.')); }
      });
      function ponerSol() {
        horaSol = +deslizador.value; diaSol = +deslizaDia.value;
        const anio = new Date().getFullYear(), f = new Date(anio, 0, diaSol);
        const t = SOL.instante(anio, f.getMonth(), f.getDate(), horaSol, Ls.lat, Ls.lon), p = SOL.posicion(t, Ls.lat, Ls.lon);
        const hh = Math.floor(horaSol), mm = Math.round((horaSol - hh) * 60);
        horaTxt.textContent = `${hh}:${String(mm).padStart(2, '0')}`;
        diaTxt.textContent = f.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        solTxt.textContent = p.elev > 0 ? `sol a ${num(p.elev)}° de altura, rumbo ${num(p.az)}°` : 'el sol está bajo el horizonte';
        maqueta?.fijarSol(p);
      }
      deslizador.addEventListener('input', ponerSol); deslizaDia.addEventListener('input', ponerSol);
    }

    // ── medir una propuesta: compacidad, orientación del salón y horas de sol (estimaciones del motor) ──
    const RUMBO_N = { N: 'norte', S: 'sur', E: 'este', O: 'oeste' }, NORMAL = { N: 0, E: 90, S: 180, O: 270 };
    const difAng = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
    function medir(P) {
      if (P._m) return P._m;
      const L = est.prog.lugar || { lat: 40.42, lon: -3.70 }, anio = new Date().getFullYear();
      const ventanas = (i) => { const out = {}; for (const m of P.muros) for (const hq of m.huecos) if (hq.r === i && hq.tipo !== 'puerta' && hq.tipo !== 'portón') out[m.rumbo] = (out[m.rumbo] || 0) + (hq.b - hq.a); return out; };
      const horas = (i, mes, dia) => {
        if (i < 0) return 0; const rs = Object.keys(ventanas(i)); if (!rs.length) return 0; let n = 0;
        for (let hh = 4.5; hh <= 22; hh += 0.25) { const p = SOL.posicion(SOL.instante(anio, mes, dia, hh, L.lat, L.lon), L.lat, L.lon); if (p.elev < 4) continue; if (rs.some((r) => difAng(p.az, NORMAL[r]) < 75)) n += 0.25; }
        return n;
      };
      const iS = P.rooms.findIndex((r) => r.t === 'salon'), iP = P.rooms.findIndex((r) => r.t === 'principal');
      const vs = iS >= 0 ? ventanas(iS) : {}, salonRumbo = Object.keys(vs).sort((a, b) => vs[b] - vs[a])[0] || null;
      P._m = { modelo: P.modelo ? P.modelo.n : P.fiel ? 'tu plano' : 'gramática', m2: P.areaTot, piezas: P.totales.piezas, tipos: P.despiece.length, cortes: P.totales.cortes, compacidad: P.metricas?.compacidad || 0, luzMax: P.metricas?.luzMax || 0, fachada: P.metricas?.fachada || 0, salonRumbo, solSalonInv: horas(iS, 11, 21), solSalonVer: horas(iS, 5, 21), solPrincipalInv: horas(iP, 11, 21), plantas: P.plantas };
      return P._m;
    }
    // lo mejor de cada una (para que la comparación tenga sentido)
    function compromisos(props) {
      const out = props.map(() => []), M = props.map(medir);
      if (props.length < 2) return out;
      const mejor = (f, dir, txt) => { let k = 0; M.forEach((m, j) => { if (dir * f(m) > dir * f(M[k])) k = j; }); if (M.filter((m) => f(m) === f(M[k])).length === 1) out[k].push(txt); };
      mejor((m) => m.compacidad, 1, 'la más compacta');
      mejor((m) => m.solSalonInv, 1, 'más sol en el salón en invierno');
      mejor((m) => m.piezas, -1, 'menos piezas');
      mejor((m) => m.fachada, 1, 'más fachada y más luz');
      mejor((m) => m.m2, 1, 'la más amplia');
      return out;
    }
    function textoDebil(Q, props) {
      const M = props.map(medir), m = medir(Q), t = [];
      const peor = (f, dir) => { const v = M.map(f), tope = dir > 0 ? Math.max(...v) : Math.min(...v); return props.length > 1 && f(m) === tope && v.filter((x) => x === tope).length === 1; };
      if (peor((x) => x.compacidad, -1)) t.push('a cambio, más fachada que construir');
      if (peor((x) => x.piezas, 1)) t.push('es la que más piezas necesita');
      if (peor((x) => x.solSalonInv, -1)) t.push('su salón recibe menos sol en invierno');
      return t.length ? t.join(', ').replace(/^./, (c) => c.toUpperCase()) + '.' : '';
    }
    function htmlComparar(props, sel, corta) {
      const ALF = 'ABCD', M = props.map(medir);
      const filas = [
        ['Modelo de partida', (m) => m.modelo, null, 1],
        ['Superficie orientativa', (m) => `${num(m.m2)} m²`, (m) => m.m2, 0],
        ['Plantas', (m) => String(m.plantas), null, 0],
        ['Piezas J', (m) => `${num(m.piezas)} (${m.tipos} tipos)`, (m) => -m.piezas, 1],
        ['Cortes de ancho', (m) => num(m.cortes), (m) => -m.cortes, 0],
        ['Compacidad (1 es un cuadrado)', (m) => num(m.compacidad, 2), (m) => m.compacidad, 1],
        ['El salón mira al', (m) => (m.salonRumbo ? RUMBO_N[m.salonRumbo] : 'interior'), null, 1],
        ['Sol en el salón, 21 de diciembre', (m) => `${num(m.solSalonInv, 1)} h`, (m) => m.solSalonInv, 1],
        ['Sol en el salón, 21 de junio', (m) => `${num(m.solSalonVer, 1)} h`, null, 0],
        ['Sol en el dormitorio principal, 21 de diciembre', (m) => `${num(m.solPrincipalInv, 1)} h`, (m) => m.solPrincipalInv, 0],
        ['Placa más larga', (m) => `${num(m.luzMax, 2)} m`, null, 0],
      ].filter((f) => !corta || f[3]);
      const cab = `<tr><th scope="col"></th>${props.map((Q, j) => `<th scope="col"${j === sel ? ' class="sel"' : ''}>${ALF[j]}</th>`).join('')}</tr>`;
      const cuerpo = filas.map(([t, f, v]) => { const vals = v ? M.map(v) : null, top = vals ? Math.max(...vals) : null, unico = vals && vals.filter((x) => x === top).length === 1; return `<tr><th scope="row">${esc(t)}</th>${M.map((m, j) => `<td class="${[j === sel ? 'sel' : '', unico && vals[j] === top ? 'mejor' : ''].join(' ').trim()}">${esc(f(m))}</td>`).join('')}</tr>`; }).join('');
      return `<table class="cf-tabla cf-comparar"><thead>${cab}</thead><tbody>${cuerpo}</tbody></table><p class="cf-tenue">Estimaciones del motor, para comparar; sin precios.</p>`;
    }
    function htmlMontaje(P) {
      const fases = (P.montaje || []).map((f, j) => `<li><b>${j + 1}. ${esc(f.n)}</b>: ${num(f.piezas)} pieza${f.piezas === 1 ? '' : 's'}. <span>${esc(f.detalle)}.</span></li>`).join('');
      return `<ol class="cf-montaje">${fases}</ol><p class="cf-tenue">Orden del manual de montaje del sistema${nota('catalogo')}: forjado sanitario, muros, forjado superior y cubierta, planta a planta. En la maqueta, «Ver el montaje con la grúa» lo reproduce pieza a pieza.</p>`;
    }
    function htmlUniones(P) {
      const U = P.uniones?.n || { atornillada: 0, soldada: 0, apoyada: 0 }, UN = D.UNION || {};
      return `<ul class="cf-notas"><li><b>Atornilladas</b>: ${num(U.atornillada)} nudos entre placas de forjado, con enlaces de acero ${esc(UN.acero || 'S355')} y ${UN.porNudo || 4} tornillos ${esc(UN.tornillo || 'M24')} por nudo${nota(UN.f || 'plano')}: unos ${num(U.atornillada * (UN.porNudo || 4))} tornillos.</li><li><b>Soldadas</b>: ${num(U.soldada)} juntas entre paneles de fachada, sobre chapas embebidas.</li><li><b>Apoyadas</b>: ${num(U.apoyada)} apoyos de placas de cubierta sobre los muros.</li></ul><p class="cf-tenue">Reparto ilustrativo del motor: las uniones de cada obra se deciden en el proyecto, y pueden ir atornilladas, soldadas o apoyadas.</p>`;
    }
    function htmlLuz(P) {
      const L = D.LUZ || {}, lm = P.metricas?.luzMax || 0;
      return `La placa más larga mide ${num(lm, 2)} m${L.sinVigas ? `, dentro de la luz sin vigas de ${esc(L.sinVigas)}${nota(L.f || 'obra')}` : ''}. Serie J${nota('plano')} de la J1 a la J10 y cortes de ancho de ${CORTES.map((c) => num(c, 2)).join(', ').replace(/, ([^,]*)$/, ' y $1')} m; la J12 del catálogo 2026${nota('catalogo')}, de 9 m, queda fuera hasta que se valide.`;
    }
    function htmlSupuestos(P) {
      const pr = est.prog, t = [
        'Superficies de diseño orientativas por estancia; la circulación sale de la propia distribución.',
        'Altura de planta de 3,00 m: el lado de las piezas de pie de la fachada.',
        pr.parcela ? 'Retranqueos de 3 m a todos los lindes; la casa, pegada al retranqueo norte para dejar el jardín al sur.' : 'Sin parcela: la casa no se ha ajustado a ninguna.',
        pr.lugar ? `El sol de ${pr.lugar.v}, con coordenadas aproximadas de la ciudad y sin sombras de vecinos.` : 'El sol de Madrid, mientras no digas dónde está la parcela.',
        P.fiel ? 'Tu plano: norte arriba, una sola planta, usos leídos por superficie, forma y vecindad.' : 'La calle, al ' + RUMBO_N[pr.calle || 'N'] + (pr.calle ? '.' : ', mientras no digas otra cosa.'),
        'Uniones: reparto ilustrativo por tipo de encuentro.',
        P.modelo ? `Planta tipo del modelo ${P.modelo.n}, llevada a la trama de 0,75 m y adaptada a tu programa con sus reglas: bahías de día y de noche, núcleo húmedo y crujía de 7,50 m como máximo.` : null,
        P.cubierta === 'dosAguas' ? 'Cubierta a dos aguas con placas J en los dos faldones; los hastiales se cierran con piezas a medida, fuera de este despiece.' : null,
      ];
      if (pr.gustos.madera) t.push(`Madera: la familia de madera contralaminada del catálogo está en planteamiento${nota('catalogo')}; aquí la estructura es la serie J de hormigón y la madera va en acabados.`);
      return `<ul class="cf-notas">${t.filter(Boolean).map((x) => `<li>${x}</li>`).join('')}</ul>`;
    }
    function htmlValidar(P) {
      const t = ['La estructura: canto y armado de cada placa según sus luces y sus cargas.', 'Las uniones: tipo y número por nudo, y su ejecución.', 'La cimentación, con el estudio geotécnico de la parcela.',
        'La normativa urbanística del municipio: retranqueos, ocupación, edificabilidad y alturas.', 'Habitabilidad, accesibilidad, seguridad en caso de incendio y ahorro de energía, según el Código Técnico.',
        'Las instalaciones: bajantes, ventilación de los baños interiores y paso de conductos por las placas.', 'El transporte y el izado: acceso de la góndola y sitio para la grúa.'];
      return `<ul class="cf-notas">${t.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    }
    // ── explicar qué cambia entre dos propuestas, con la lógica del sistema ──
    function explicar(A, B, cambios) {
      const MA = medir(A), MB = medir(B), out = [];
      const dimTxt = (P) => { const a = P.W * PASO, b = P.H * PASO; return `${num(Math.max(a, b), 2)} × ${num(Math.min(a, b), 2)} m`; };
      out.push(`<p><b>${esc(textoCambios(cambios).replace(/^./, (c) => c.toUpperCase()))}.</b> ${B.sig === A.sig ? 'Sigo con la misma variante' : 'Cambio de variante: la anterior ya no encajaba igual de bien'}, «${esc(B.nombre.replace(/^./, (c) => c.toLowerCase()))}».</p>`);
      const d = Math.round(MB.m2 - MA.m2);
      out.push(`<p>La superficie pasa de ${num(MA.m2)} a ${num(MB.m2)} m²${d ? ` (${d > 0 ? '+' : ''}${num(d)})` : ''} y la huella, de ${dimTxt(A)} a ${dimTxt(B)}.</p>`);
      // cuerpos y bandas, con su rumbo real
      if (A.bahias && B.bahias) {
        const t = [];
        if (A.modelo?.k !== B.modelo?.k) t.push(`paso del modelo ${A.modelo?.n || 'anterior'} al ${B.modelo?.n}, que encaja mejor con lo que pides`);
        const cuenta = (bs, ts) => bs.filter((b) => ts.includes(b.t)).length;
        const nA = cuenta(A.bahias, ['noche2', 'noche2c', 'noche1', 'noche1c']), nB = cuenta(B.bahias, ['noche2', 'noche2c', 'noche1', 'noche1c']);
        if (nB !== nA) t.push(`${nB > nA ? 'añado' : 'quito'} ${Math.abs(nB - nA) === 1 ? 'una bahía' : `${Math.abs(nB - nA)} bahías`} de noche de 3,75 m, con sus dormitorios en el ala de noche`);
        const cA = cuenta(A.bahias, ['nucleo', 'nucleoE', 'nucleoM']), cB = cuenta(B.bahias, ['nucleo', 'nucleoE', 'nucleoM']);
        if (cB !== cA) t.push(`${cB > cA ? 'sumo' : 'quito'} un núcleo de baños junto a los dormitorios`);
        const dA = A.bahias.find((b) => b.t === 'dia'), dB = B.bahias.find((b) => b.t === 'dia');
        if (dA && dB && dA.w !== dB.w) t.push(`la bahía de día pasa de ${num(dA.w * PASO, 2)} a ${num(dB.w * PASO, 2)} m, para que el salón siga entre 1:1 y 1:1,8`);
        if (A.plantas !== B.plantas) t.push(B.plantas > 1 ? 'aparece la planta alta sobre el núcleo de la escalera' : 'todo baja a una planta');
        // qué estancias cambian
        const cuantas = (P, ts) => P.rooms.filter((r) => ts.includes(r.t)).length;
        const nombres = [[['principal', 'dormitorio'], 'dormitorio', 'dormitorios'], [['bano'], 'baño', 'baños'], [['aseo'], 'aseo', 'aseos'], [['estudio'], 'estudio', 'estudios'], [['lavadero'], 'lavadero', 'lavaderos'], [['vestidor'], 'vestidor', 'vestidores']];
        const dif = nombres.map(([ts, s1, s2]) => { const a = cuantas(A, ts), b = cuantas(B, ts); return a === b ? null : `${b} ${b === 1 ? s1 : s2} (antes ${a})`; }).filter(Boolean);
        if (dif.length) t.push(`ahora hay ${dif.join(', ')}`);
        if (t.length) out.push(`<p>${t.join('; ').replace(/^./, (c) => c.toUpperCase())}. Todo se mueve sobre la trama de 0,75 m${nota('plano')}, en bahías que cruzan la crujía de fachada a fachada.</p>`);
      }
      if (A.geo && B.geo && A.sig === B.sig) {
        const rot = B.rot || 0, DIRS = ['N', 'E', 'S', 'O'], g = (x) => DIRS[(DIRS.indexOf(x) + rot) % 4];
        const NOMB = { I: `el cuerpo del ${RUMBO_N[g('O')]}`, P: 'el cuerpo central', D: `el cuerpo del ${RUMBO_N[g('E')]}` }, NOMBA = { 2: `la banda del ${RUMBO_N[g('N')]}`, 1: 'la banda de servicios', 3: `la banda del ${RUMBO_N[g('S')]}` };
        const t = [];
        for (const b of ['I', 'P', 'D']) if (A.geo.w[b] !== B.geo.w[b] && B.geo.bx[b]) t.push(`${NOMB[b]} pasa de ${num(A.geo.w[b] * PASO, 2)} a ${num(B.geo.w[b] * PASO, 2)} m`);
        for (const n of [2, 1, 3]) if (A.geo.d[n] !== B.geo.d[n]) { const dm = B.geo.d[n] - A.geo.d[n]; t.push(`${NOMBA[n]} pasa de ${num(A.geo.d[n] * PASO, 2)} a ${num(B.geo.d[n] * PASO, 2)} m (${Math.abs(dm)} módulo${Math.abs(dm) === 1 ? '' : 's'} de 0,75 m ${dm > 0 ? 'más' : 'menos'})`); }
        if (t.length) out.push(`<p>${t.join('; ').replace(/^./, (c) => c.toUpperCase())}. Los cuerpos crecen de 1,50 m en 1,50 m para que las placas los cubran sin cortes de largo; las bandas, de módulo en módulo de la trama${nota('plano')}.</p>`);
      }
      // piezas
      const tiposA = new Map(A.despiece.map((x) => [x.nombre, x.n])), tiposB = new Map(B.despiece.map((x) => [x.nombre, x.n]));
      const nuevos = [...tiposB.keys()].filter((k) => !tiposA.has(k)), fuera = [...tiposA.keys()].filter((k) => !tiposB.has(k));
      const dp = MB.piezas - MA.piezas;
      out.push(`<p>Piezas J: de ${num(MA.piezas)} a ${num(MB.piezas)}${dp ? ` (${dp > 0 ? '+' : ''}${dp})` : ''}${nuevos.length ? `; entran ${nuevos.join(', ')}` : ''}${fuera.length ? `; salen ${fuera.join(', ')}` : ''}. ${htmlLuz(B).split('. ')[0]}.</p>`);
      // salón y sol
      if (MB.salonRumbo) out.push(`<p>El salón ${MA.salonRumbo === MB.salonRumbo ? 'sigue mirando' : 'pasa a mirar'} al ${RUMBO_N[MB.salonRumbo]} y recibe unas ${num(MB.solSalonInv, 1)} h de sol directo el 21 de diciembre${Math.abs(MB.solSalonInv - MA.solSalonInv) >= 0.25 ? ` (antes ${num(MA.solSalonInv, 1)} h)` : ''}: estimación sin sombras de vecinos.</p>`);
      if (B.plantas === 1 && est.prog.afinar?.orient?.terraza && cambios.includes('orient:terraza')) out.push(`<p>En una sola planta no hay terraza alta: el porche hace de terraza, abierto al jardín${est.prog.afinar.orient.terraza === 'S' ? ' y al sol del sur' : ''}. Con dos plantas, la terraza sería la cubierta de la planta baja.</p>`);
      if (MA.plantas !== MB.plantas) out.push(`<p>${MB.plantas === 1 ? 'En una sola planta no hay escalera: la casa se extiende por la parcela y gana fachada.' : 'Con dos plantas la huella se recoge, aparece la escalera en la banda de servicios y la planta alta apoya sobre la baja.'}</p>`);
      out.push(`<p class="cf-tenue">Compacidad: de ${num(MA.compacidad, 2)} a ${num(MB.compacidad, 2)}. Abajo tienes las tres opciones de nuevo, comparables.</p>`);
      return out.join('');
    }
    function mostrarPestana() {
      for (const b of panelCuerpo.querySelectorAll('.cf-pestanas [role=tab]')) { const s = b.id === `cf-tab-${pestana}`; b.setAttribute('aria-selected', s ? 'true' : 'false'); b.tabIndex = s ? 0 : -1; }
      for (const v of panelCuerpo.querySelectorAll('.cf-vista')) v.hidden = v.id !== `cf-vista-${pestana}`;
    }
    function opcionesMaqueta(P) {
      const pr = est.prog, calle = pr.calle || 'N', rot = P.rot || 0;
      const Wm = P.W * PASO, Hm = P.H * PASO, wx = rot % 2 ? Hm : Wm, wz = rot % 2 ? Wm : Hm;
      let parcela = null;
      if (pr.parcela) {
        const PX = calle === 'N' || calle === 'S' ? pr.parcela.an : pr.parcela.fo, PZ = calle === 'N' || calle === 'S' ? pr.parcela.fo : pr.parcela.an;
        // la casa, centrada de este a oeste y pegada al retranqueo norte: el jardín queda al sur
        const hz = 3 + wz / 2; parcela = { an: PX, fo: PZ, cx: 0, cz: PZ / 2 - hz };
      }
      const jardin = pr.parcela ? { x: 0, z: 1 } : { N: { x: 0, z: 1 }, S: { x: 0, z: -1 }, E: { x: -1, z: 0 }, O: { x: 1, z: 0 } }[calle];
      return { parcela, piscina: !!pr.gustos.piscina, jardin, madera: !!pr.gustos.madera };
    }

    // ── mundos relacionados: por etiquetas, del catálogo de la galería (o, si aún no está, las puertas de la página) ──
    function relacionados(P) {
      const pr = est.prog, quiero = new Set(['vivienda', 'casa']);
      quiero.add(P && P.plantas === 1 ? 'una planta' : 'dos plantas');
      for (const k of Object.keys(pr.gustos)) quiero.add(k === 'mediterraneo' ? 'mediterráneo' : k);
      if (pr.lugar?.isla) { quiero.add(pr.lugar.isla); quiero.add('islas'); quiero.add('baleares'); }
      if (pr.lugar && /madrid|navalcarnero/i.test(pr.lugar.v)) quiero.add('madrid');
      const norm = (s) => TX.normalizar(String(s || '')).trim();
      const Q = new Set([...quiero].map(norm));
      const M = Array.isArray(window.MUNDOS) ? window.MUNDOS : [];
      if (M.length) {
        return M.map((m) => { const et = (m.etiquetas || []).map(norm); let s = et.filter((e) => Q.has(e)).length * 2; if (m.vivienda) s += 2; if (norm(m.tipo).includes('vivienda')) s += 1; return { m, s }; })
          .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 4).map((x) => ({ n: x.m.n, d: x.m.d, url: x.m.url, img: x.m.img, tipo: /^modelo$/i.test(x.m.tipo || '') ? 'Modelo de vivienda CUEVA' : (x.m.tipo || ''), abre: x.m.abre }));
      }
      return [];
    }
    function tarjetaMundo(m) {
      const fuera = /^https?:/.test(m.url || '') || m.abre === 'nueva';
      return h('a', { class: 'cf-mundo', href: m.url || '#', target: fuera ? '_blank' : null, rel: fuera ? 'noopener' : null },
        m.img ? h('span', { class: 'cf-mundo-img' }, h('img', { src: m.img, alt: '', loading: 'lazy' })) : h('span', { class: 'cf-mundo-img vacia' }),
        h('span', { class: 'cf-mundo-txt' }, h('b', {}, m.n), h('small', {}, m.tipo || ''), m.d ? h('span', {}, m.d) : null));
    }

    // ── el plano: leer, enseñar la lectura y traducir ──
    function leerPlano(img, op = {}) {
      est.pendiente = null; quitarChips();
      const miniatura = h('div', { class: 'cf-adj-img' });
      const vista = img.cloneNode ? (img.tagName === 'CANVAS' ? (() => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return c; })() : img.cloneNode()) : img;
      miniatura.append(vista);
      burbuja('yo', h('div', {}, miniatura, h('span', { class: 'cf-adj-pie' }, op.croquis ? 'Mi croquis' : op.ejemplo ? 'Plano de ejemplo' : (op.nombre || 'Mi plano'))), { rico: true });
      const etapasTxt = ['A grises', 'Umbral adaptativo', 'Muros y huecos', 'Estancias', 'A la trama de 0,75 m', 'Plano traducido'];
      const pasos = h('ol', { class: 'cf-etapas en-linea' }, etapasTxt.map((t) => h('li', {}, h('i'), h('span', {}, t))));
      const caja = h('div', { class: 'cf-visor-caja' });
      decir(() => h('div', { class: 'cf-lectura' }, h('p', {}, op.croquis ? 'Leo tu croquis.' : 'Leo tu plano, aquí mismo.'), caja, pasos), {
        rico: true, rapido: true,
        listo: () => setTimeout(() => {
          let L;
          try { L = VI.leer(img, { croquis: !!op.croquis }); } catch (e) { console.error(e); decir('No he podido leer esa imagen.'); return; }
          if (!L.envolvente || !L.estancias.length) {
            decir('No he sabido cerrar las estancias: necesito muros oscuros y continuos. Prueba con otra foto más recta o dibuja un croquis.', { chips: [{ t: 'Dibujar un croquis', hacer: tarjetaCroquis }, { t: 'Probar con uno de ejemplo', hacer: () => leerPlano(LE.planoEjemplo(), { ejemplo: true }) }] });
            return;
          }
          est.plano = { img, L, op, pista: est.prog.superficie ? { area: est.prog.superficie } : {} };
          window.CUEVA_CONFIGURADOR.lectura = L;
          traducirLectura(caja, pasos, true);
        }, 60),
      });
    }
    function traducirLectura(caja, pasos, primera) {
      const E = est.plano, L = E.L;
      const escala = VI.escala(L, E.pista || {});
      const T = VI.aTrama(L, escala, PASO);
      const U = VI.usos(T, { dormitorios: est.prog.dormitorios, banos: est.prog.banos }, PASO);
      E.escala = escala; E.T = T; E.U = U;
      if (E.visor) E.visor.destruir();
      const marcar = (k) => { [...pasos.children].forEach((li, i) => { li.classList.toggle('hecha', i < k); li.classList.toggle('activa', i === k); }); };
      E.visor = LE.visor(caja, L, T, escala, { etapas: marcar, fin: () => { marcar(6); if (primera) informarLectura(); } });
      E.visor.reproducir(primera ? 0 : 3.1);
      if (!primera) informarLectura();
    }
    const USOS_CICLO = [['salon', 'Salón comedor'], ['cocina', 'Cocina'], ['principal', 'Dormitorio principal'], ['dormitorio', 'Dormitorio'], ['bano', 'Baño'], ['aseo', 'Aseo'], ['estudio', 'Estudio'], ['paso', 'Distribuidor'], ['vestibulo', 'Vestíbulo'], ['lavadero', 'Lavadero']];
    function informarLectura() {
      const E = est.plano, T = E.T, U = E.U, L = E.L;
      const area = U.reduce((a, e) => a + e.area, 0);
      const exteriores = L.muros.filter((m) => { const [x0, y0, x1, y1] = L.envolvente; const tol = Math.max(8, m.t * 2); return m.eje === 'h' ? (Math.abs(m.c - y0) < tol || Math.abs(m.c - y1) < tol) : (Math.abs(m.c - x0) < tol || Math.abs(m.c - x1) < tol); }).length;
      const p1 = `He encontrado ${L.muros.length} muros (${exteriores} de fachada y ${L.muros.length - exteriores} interiores), ${L.huecos.length} huecos de puerta o ventana y ${U.length} estancias. En la trama queda de ${num(T.W * PASO, 2)} × ${num(T.H * PASO, 2)} m, unos ${num(area)} m² útiles.`;
      const p2 = `${E.escala.txt}.${L.giro ? ` La imagen estaba girada ${num(Math.abs(L.giro), 1)}°: la he enderezado antes de leerla.` : ''} Cada eje de muro ha ido al múltiplo de 0,75 m más cercano${nota('plano')}, sin que dos muros caigan en el mismo.`;
      const chipsUso = U.slice().sort((a, b) => b.area - a.area).map((e) => {
        const bt = h('button', { type: 'button', class: 'cf-ficha', title: 'Toca para cambiar el uso' }, `${e.n}, ${num(e.area, e.area < 10 ? 1 : 0)} m²`);
        bt.addEventListener('click', () => { const k = USOS_CICLO.findIndex(([t]) => t === e.t), [t, n] = USOS_CICLO[(k + 1) % USOS_CICLO.length]; e.t = t; e.n = n; bt.textContent = `${e.n}, ${num(e.area, e.area < 10 ? 1 : 0)} m²`; });
        return bt;
      });
      decir(() => h('div', {}, h('p', { html: esc(p1) }), h('p', { html: p2 }), h('p', {}, 'Los usos los deduzco de la superficie, la forma y la vecindad. Si alguno no es, tócalo y lo cambio:'), h('div', { class: 'cf-fichas' }, chipsUso)), {
        rico: true,
        chips: [{ t: 'Traducir a piezas J', primario: true, hacer: traducirPlano }, { t: 'El lado largo mide…', hacer: () => { est.pendiente = 'ladoLargo'; decir('¿Cuánto mide el lado largo de la casa, en metros?'); campo.focus({ preventScroll: true }); } }, { t: 'La superficie es…', hacer: () => { est.pendiente = 'areaPlano'; decir('¿Cuántos metros cuadrados tiene la planta?'); campo.focus({ preventScroll: true }); } }],
      });
    }
    function reescalar() {
      const E = est.plano; if (!E) return;
      const caja = [...lista.querySelectorAll('.cf-visor-caja')].pop(), pasos = [...lista.querySelectorAll('.cf-lectura .cf-etapas')].pop();
      decir('Ajusto la escala y vuelvo a llevarlo a la trama.', { rapido: true, listo: () => { const c2 = h('div', { class: 'cf-visor-caja' }), p2 = pasos.cloneNode(true); decir(() => h('div', { class: 'cf-lectura' }, c2, p2), { rico: true, rapido: true, listo: () => traducirLectura(c2, p2, false) }); } });
      void caja;
    }
    function traducirPlano() {
      const E = est.plano; if (!E) return;
      E.traducido = true;
      burbuja('yo', 'Traducir a piezas J');
      const plano = { W: E.T.W, H: E.T.H, etiquetas: Array.from(E.T.etiquetas), estancias: E.U.map((e) => ({ t: e.t, n: e.n, celdas: e.celdas, x0: e.x0, x1: e.x1, y0: e.y0, y1: e.y1 })) };
      // el programa del plano, para las alternativas dentro de la gramática
      const cuenta = (t) => E.U.filter((e) => e.t === t).length;
      const prog = { plantas: 1, dormitorios: cuenta('principal') + cuenta('dormitorio'), banos: Math.max(1, cuenta('bano')), aseos: cuenta('aseo'), cocina: 'abierta', superficie: E.U.reduce((a, e) => a + e.area, 0), gustos: { ...est.prog.gustos, estudio: cuenta('estudio') > 0 || est.prog.gustos.estudio } };
      if (est.prog.dormitorios == null) { est.prog.dormitorios = prog.dormitorios; est.origen.dormitorios = 'de tu plano'; }
      if (est.prog.banos == null) { est.prog.banos = prog.banos; est.origen.banos = 'de tu plano'; }
      generar({ plano, programa: prog, titulo: 'Despiezo tu plano y busco dos alternativas con el mismo programa dentro de la gramática.' });
    }

    // ── descargar: una página que se sostiene sola, con la maqueta, las plantas y el despiece ──
    function descargar() {
      const P = est.propuestas[est.elegida >= 0 ? est.elegida : 0]; if (!P) return;
      let foto = null; try { foto = maqueta ? maqueta.captura(1600, 1000) : null; } catch (e) { foto = null; }
      const red = est.prog.lugar ? SOL.puntoCercano(est.prog.lugar.lat, est.prog.lugar.lon, D.RED) : null;
      const html = PL.resumenHTML({ P, entendido: entendido().map((e) => e.t + (e.origen && e.origen !== 'dicho' ? ` (${e.origen})` : '')), foto, lugar: est.prog.lugar?.v, fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        red: red ? `${est.prog.lugar.v} queda a ${num(Math.round(red.km / 5) * 5)} km del punto de producción de ${red.p.n}: distancia en línea recta, estimación.` : null,
        secciones: [
          { t: 'Las tres opciones, comparadas', html: htmlComparar(est.propuestas, est.elegida >= 0 ? est.elegida : 0) },
          { t: 'Secuencia de montaje', html: htmlMontaje(P) },
          { t: 'Uniones', html: htmlUniones(P) },
          { t: 'Luces y piezas', html: `<p>${htmlLuz(P)}</p>` },
          { t: 'Supuestos', html: htmlSupuestos(P) },
          { t: 'Qué hay que validar con un técnico', html: htmlValidar(P) },
        ],
        fuentes: ['plano', 'obra', 'generativa', 'catalogo', 'red'].map((f) => D.FUENTES?.[f]).filter(Boolean).concat(['Posición del sol: algoritmo astronómico de la NOAA (ecuaciones de Meeus).', 'Superficies de diseño orientativas, horas de sol, compacidad y reparto de uniones: estimaciones ilustrativas del motor de propuestas.', 'Retranqueos supuestos de 3 m.']) });
      const a = h('a', { href: URL.createObjectURL(new Blob([html], { type: 'text/html' })), download: `propuesta-cueva-${(P.nombre || 'casa').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.html` });
      document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      decir('Descargada: una página con la maqueta, las plantas, el despiece y lo que he entendido. Se abre en cualquier navegador, sin conexión.', { rapido: true });
    }

    function reiniciar() {
      Object.assign(est, { prog: { plantas: null, dormitorios: null, banos: null, aseos: null, cocina: null, superficie: null, parcela: null, lugar: null, calle: null, gustos: {}, afinar: { orient: {} } }, origen: {}, preguntado: new Set(), pendiente: null, gustosPreguntados: false, plano: null, propuestas: [], elegida: -1, excluir: [], semilla: 1 });
      if (maqueta) { maqueta.destruir(); maqueta = null; }
      lista.replaceChildren(); quitarChips(); abrirPanel(false); actualizarFicha(); saludar();
    }
    function saludar() {
      decir(`Hola. Soy el motor de propuestas de CUEVA: un programa que corre en tu navegador, no una persona. Cuéntame qué casa quieres y te propongo varias, con su planta, su maqueta y su despiece en piezas de la serie J${nota('plano')}.`, { rapido: true });
      decir('Puedes escribir todo de una vez o ir poco a poco. Si tienes un plano o un croquis, adjúntalo con el clip.', { chips: [{ t: 'Una casa en planta baja con 3 dormitorios, dos baños, cocina abierta al salón y un porche' }, { t: 'Tengo un plano', hacer: tarjetaPlano }, { t: 'Dibujar un croquis', hacer: tarjetaCroquis }] });
    }

    actualizarFicha();
    saludar();
    Object.assign(window.CUEVA_CONFIGURADOR, { estado: est, enviar: enviarTexto, generar, leerPlano, elegir, descargar, reiniciar, abrirPanel, adjuntoLugar, tarjetaLugar, tarjetaCroquis, tarjetaParcela, tarjetaPlano, tarjetaGustos, tarjetaHabitaciones });
  }
})();

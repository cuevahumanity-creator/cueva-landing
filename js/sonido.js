// ─────────────────────────────────────────────────────────────────────
//  CUEVA · el sonido de la página (fuera de la apertura, que tiene el suyo)
//  Todo sintetizado con WebAudio: nada se descarga ni se copia. Suena solo si el visitante
//  lo activa con el botón de la barra (un gesto, como exigen los navegadores).
//
//  Uso desde un capítulo:
//    SONIDO.cruce('os-apagon', u, 0.82, 'apagon')     dispara al pasar el umbral hacia delante
//    SONIDO.efecto('clank', { tono: 1.2, v: 0.3, en: 0.1 })   un efecto suelto (en: retardo en s)
//    SONIDO.efecto('transforma', { golpes: [0.2, 0.45, …], dur: 2.4 })   el montaje mecánico entero
//  Efectos: apagon, encendido, servo, clank, trinquete, impacto, subida, rotura, transforma.
// ─────────────────────────────────────────────────────────────────────
window.SONIDO = (() => {
  let a = null, bus = null, eco = null, ruido = null, activo = false;
  const ultimo = {}, previo = {};

  function iniciar() {
    if (a) return;
    a = new (window.AudioContext || window.webkitAudioContext)();
    const comp = a.createDynamicsCompressor(), g = a.createGain();
    comp.threshold.value = -16; comp.ratio.value = 4; g.gain.value = 0.85;
    comp.connect(g).connect(a.destination); bus = comp;
    // ruido blanco reutilizable y una reverberación de nave (respuesta al impulso generada)
    const b = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = b.getChannelData(0);
    let s = 9871; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = s / 1073741823.5 - 1; } ruido = b;
    const larga = 2.6, ir = a.createBuffer(2, a.sampleRate * larga, a.sampleRate);
    for (let c = 0; c < 2; c++) { const x = ir.getChannelData(c); for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 3.2); }
    const conv = a.createConvolver(), ge = a.createGain(); conv.buffer = ir; ge.gain.value = 0.32; conv.connect(ge).connect(comp); eco = conv;
  }

  // ── piezas básicas ──
  const osc = (tp, f) => { const q = a.createOscillator(); q.type = tp; q.frequency.value = f; return q; };
  const fuente = () => { const n = a.createBufferSource(); n.buffer = ruido; n.loop = true; return n; };
  const env = (g, t0, at, dec, pico) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(pico, t0 + at); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dec); };
  // cada voz va al bus y, con su parte, a la reverberación
  const salida = (nodo, mojado = 0.3) => { nodo.connect(bus); if (mojado > 0) { const m = a.createGain(); m.gain.value = mojado; nodo.connect(m).connect(eco); } };
  const distorsion = (k) => { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } const w = a.createWaveShaper(); w.curve = c; return w; };

  const EF = {
    // el apagón de CUEVA OS: un motivo descendente suave, como un sistema que se despide,
    // y el «tubo» que se apaga con una caída grave y un chasquido
    apagon(t0, o) {
      const v = o.v || 0.22, notas = [987.77, 739.99, 587.33, 369.99];          // si, fa#, re, fa# grave: motivo propio
      notas.forEach((f, i) => {
        const t = t0 + i * 0.17, g = a.createGain(), q1 = osc('sine', f), q2 = osc('triangle', f * 0.5), q3 = osc('sine', f * 2.002);
        const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 1.4);
        env(g, t, 0.012, 1.1 + i * 0.35, v * (i === 3 ? 0.9 : 0.6));
        [q1, q2, q3].forEach((q) => { q.connect(lp); q.start(t); q.stop(t + 2.2); }); lp.connect(g); salida(g, 0.5);
      });
      const caida = osc('sine', 180), gc = a.createGain(), tc = t0 + 0.5;
      caida.frequency.setValueAtTime(180, tc); caida.frequency.exponentialRampToValueAtTime(32, tc + 1.6);
      env(gc, tc, 0.05, 1.6, v * 0.7); caida.connect(gc); salida(gc, 0.15); caida.start(tc); caida.stop(tc + 1.8);
      const n = fuente(), hp = a.createBiquadFilter(), gn = a.createGain(), tn = t0 + 1.9;
      hp.type = 'highpass'; hp.frequency.value = 2500; env(gn, tn, 0.001, 0.05, v * 0.5); n.connect(hp).connect(gn); salida(gn, 0.2); n.start(tn); n.stop(tn + 0.1);
    },
    // la vuelta de la red: el mismo motivo hacia arriba, breve
    encendido(t0, o) {
      const v = o.v || 0.16;
      [369.99, 587.33, 739.99, 987.77].forEach((f, i) => {
        const t = t0 + i * 0.09, g = a.createGain(), q = osc('sine', f), q2 = osc('sine', f * 2.003);
        env(g, t, 0.01, 0.7, v * 0.6); q.connect(g); q2.connect(g); salida(g, 0.45); q.start(t); q2.start(t); q.stop(t + 0.9); q2.stop(t + 0.9);
      });
    },
    // un servo que gira: diente de sierra filtrado con el tono que se desliza
    servo(t0, o) {
      const d = o.dur || 0.5, f0 = o.de || 140, f1 = o.a || 420, v = o.v || 0.08;
      const q = osc('sawtooth', f0), q2 = osc('square', f0 * 1.5), bp = a.createBiquadFilter(), g = a.createGain();
      q.frequency.setValueAtTime(f0, t0); q.frequency.exponentialRampToValueAtTime(f1, t0 + d);
      q2.frequency.setValueAtTime(f0 * 1.5, t0); q2.frequency.exponentialRampToValueAtTime(f1 * 1.5, t0 + d);
      bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.setValueAtTime(f0 * 4, t0); bp.frequency.exponentialRampToValueAtTime(f1 * 5, t0 + d);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.04); g.gain.setValueAtTime(v, t0 + d - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      q.connect(bp); q2.connect(bp); bp.connect(g); salida(g, 0.2); q.start(t0); q2.start(t0); q.stop(t0 + d + 0.02); q2.stop(t0 + d + 0.02);
    },
    // un encaje metálico: golpe de ruido resonante y parciales inarmónicos de chapa
    clank(t0, o) {
      const k = o.tono || 1, v = o.v || 0.28;
      const n = fuente(), bp = a.createBiquadFilter(), gn = a.createGain();
      bp.type = 'bandpass'; bp.frequency.value = 2400 * k; bp.Q.value = 6; env(gn, t0, 0.001, 0.08, v * 1.4);
      n.connect(bp).connect(gn); salida(gn, 0.35); n.start(t0); n.stop(t0 + 0.12);
      [1, 2.32, 3.87, 5.21, 7.4].forEach((m, i) => {
        const q = osc('sine', 310 * k * m), g = a.createGain(), d = 0.55 / (1 + i * 0.5);
        env(g, t0, 0.001, d, v * 0.5 / (1 + i)); q.connect(g); salida(g, 0.45); q.start(t0); q.stop(t0 + d + 0.05);
      });
      const golpe = osc('sine', 120 * k), gg = a.createGain(); golpe.frequency.exponentialRampToValueAtTime(55 * k, t0 + 0.12);
      env(gg, t0, 0.002, 0.16, v * 0.9); golpe.connect(gg); salida(gg, 0.1); golpe.start(t0); golpe.stop(t0 + 0.2);
    },
    // trinquete: clics rápidos que se aceleran
    trinquete(t0, o) {
      const d = o.dur || 0.4, v = o.v || 0.14; let t = t0, paso = 0.05;
      while (t < t0 + d) {
        const n = fuente(), hp = a.createBiquadFilter(), g = a.createGain();
        hp.type = 'bandpass'; hp.frequency.value = 3800 + Math.random() * 900; hp.Q.value = 4; env(g, t, 0.001, 0.025, v);
        n.connect(hp).connect(g); salida(g, 0.15); n.start(t); n.stop(t + 0.04); t += paso; paso = Math.max(0.018, paso * 0.88);
      }
    },
    // la subida antes del golpe: ruido que crece y se abre, con un tono que asciende
    subida(t0, o) {
      const d = o.dur || 1.2, v = o.v || 0.12;
      const n = fuente(), bp = a.createBiquadFilter(), g = a.createGain();
      bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.setValueAtTime(300, t0); bp.frequency.exponentialRampToValueAtTime(5200, t0 + d);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + d * 0.95); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.04);
      n.connect(bp).connect(g); salida(g, 0.4); n.start(t0); n.stop(t0 + d + 0.1);
      const q = osc('sawtooth', 80), lp = a.createBiquadFilter(), gq = a.createGain();
      q.frequency.setValueAtTime(80, t0); q.frequency.exponentialRampToValueAtTime(320, t0 + d);
      lp.type = 'lowpass'; lp.frequency.value = 900; env(gq, t0, d * 0.9, 0.12, v * 0.5);
      q.connect(lp).connect(gq); salida(gq, 0.3); q.start(t0); q.stop(t0 + d + 0.15);
    },
    // el golpe final: grave que cae, con cuerpo distorsionado y cola de nave
    impacto(t0, o) {
      const v = o.v || 0.5;
      const q = osc('sine', 110), g = a.createGain(), ds = distorsion(6);
      q.frequency.setValueAtTime(110, t0); q.frequency.exponentialRampToValueAtTime(38, t0 + 0.9);
      env(g, t0, 0.004, 1.3, v); q.connect(ds).connect(g); salida(g, 0.5); q.start(t0); q.stop(t0 + 1.4);
      const n = fuente(), lp = a.createBiquadFilter(), gn = a.createGain();
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(6000, t0); lp.frequency.exponentialRampToValueAtTime(200, t0 + 0.6);
      env(gn, t0, 0.002, 0.6, v * 0.5); n.connect(lp).connect(gn); salida(gn, 0.6); n.start(t0); n.stop(t0 + 0.7);
      EF.clank(t0 + 0.01, { tono: 0.6, v: v * 0.6 });
    },
    // la rotura de un suelo: un crujido que corre (chasquidos agudos que se aceleran), fragmentos que
    // se sueltan (golpes graves cortos, cada uno con su tono) y la cola de cascotes que se aleja
    rotura(t0, o) {
      const v = o.v || 0.4;
      let t = t0, paso = 0.045;
      for (let i = 0; i < 22; i++) {                                         // el crujido: cada vez más rápido y más brillante
        const n = fuente(), bp = a.createBiquadFilter(), g = a.createGain();
        bp.type = 'bandpass'; bp.frequency.value = 1800 + i * 160 + ((i * 53) % 7) * 220; bp.Q.value = 5;
        env(g, t, 0.001, 0.03 + ((i * 17) % 5) * 0.006, v * (0.25 + 0.03 * i));
        n.connect(bp).connect(g); salida(g, 0.3); n.start(t); n.stop(t + 0.08); t += paso; paso = Math.max(0.012, paso * 0.86);
      }
      [0, 0.09, 0.17, 0.3, 0.46].forEach((d, i) => {                         // los trozos que se sueltan
        const tg = t0 + 0.32 + d, q = osc('sine', 150 - i * 18), g = a.createGain();
        q.frequency.setValueAtTime(150 - i * 18, tg); q.frequency.exponentialRampToValueAtTime(48, tg + 0.18);
        env(g, tg, 0.002, 0.22, v * (0.55 - i * 0.07)); q.connect(g); salida(g, 0.4); q.start(tg); q.stop(tg + 0.3);
        EF.clank(tg + 0.005, { tono: 0.55 + ((i * 7) % 4) * 0.12, v: v * 0.2 });
      });
      const n = fuente(), lp = a.createBiquadFilter(), g = a.createGain(), tc = t0 + 0.35;  // los cascotes que caen lejos
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(3800, tc); lp.frequency.exponentialRampToValueAtTime(260, tc + 1.8);
      g.gain.setValueAtTime(0.0001, tc); g.gain.exponentialRampToValueAtTime(v * 0.28, tc + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, tc + 1.9);
      n.connect(lp).connect(g); salida(g, 0.6); n.start(tc); n.stop(tc + 2);
    },
    // el montaje mecánico completo: subida, servos y trinquetes entre encajes metálicos, y el golpe.
    // golpes: instantes (s desde ahora) en que encaja cada pieza; dur: cuándo llega el golpe final
    transforma(t0, o) {
      const golpes = o.golpes || [0.25, 0.5, 0.7, 0.95, 1.15, 1.4, 1.6, 1.85], dur = o.dur || 2.2, v = o.v || 1;
      EF.subida(t0, { dur: Math.min(1.1, golpes[0] + 0.6), v: 0.07 * v });
      golpes.forEach((g, i) => {
        const t = t0 + g, sig = golpes[i + 1] != null ? t0 + golpes[i + 1] : t0 + dur;
        EF.clank(t, { tono: 0.8 + ((i * 37) % 9) / 10, v: 0.24 * v });
        const hueco = sig - t - 0.06;
        if (hueco > 0.12) (i % 2 ? EF.trinquete : EF.servo)(t + 0.05, { dur: Math.min(0.45, hueco), de: 120 + i * 30, a: 360 + i * 60, v: 0.06 * v });
      });
      EF.impacto(t0 + dur, { v: 0.5 * v });
    },
  };

  return {
    get activo() { return activo; },
    activar(on) { iniciar(); a.resume(); activo = !!on; },
    // un efecto ahora (o con retardo en: s). Silencio si el visitante no lo ha activado
    efecto(nombre, o = {}) {
      if (!activo || !a || !EF[nombre]) return;
      const ahora = performance.now();
      if (o.unaVez !== false && ultimo[nombre + (o.clave || '')] && ahora - ultimo[nombre + (o.clave || '')] < (o.espera ?? 400)) return;
      ultimo[nombre + (o.clave || '')] = ahora;
      EF[nombre](a.currentTime + 0.01 + (o.en || 0), o);
    },
    // dispara al cruzar el umbral hacia delante (con el scroll); hacia atrás no suena
    cruce(id, u, umbral, nombre, o = {}) {
      const p = previo[id]; previo[id] = u;
      if (p != null && p < umbral && u >= umbral && u - p < 0.05) this.efecto(nombre, { espera: 1500, ...o, clave: id });
    },
  };
})();

// ─────────────────────────────────────────────────────────────────────
//  Motor de propuestas CUEVA · el sol y la distancia
//  1. La posición del sol con el algoritmo de la NOAA (las ecuaciones de Meeus de su
//     calculadora solar): día juliano, longitud media, anomalía, ecuación del centro,
//     oblicuidad corregida, declinación, ecuación del tiempo, ángulo horario y, al final,
//     elevación (con refracción atmosférica) y acimut desde el norte, en sentido horario.
//  2. La hora oficial en España: peninsular y Baleares en UTC+1, Canarias en UTC+0,
//     con el horario de verano entre el último domingo de marzo y el último de octubre.
//  3. La ganancia solar de cada fachada (norte, este, sur, oeste) en un día de invierno y
//     otro de verano: la usa el optimizador para orientar el salón y los dormitorios.
//  4. La distancia al punto de producción activo más cercano, por la fórmula del haversine:
//     es distancia en línea recta y se dice como estimación.
//  Clásico: window.CUEVA_SOL. Sin DOM.
// ─────────────────────────────────────────────────────────────────────
(() => {
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;

  // ── NOAA: posición del sol para un instante (Date, en UTC) y un lugar ──
  function posicion(fecha, lat, lon) {
    const jd = fecha.getTime() / 86400000 + 2440587.5;            // día juliano
    const T = (jd - 2451545) / 36525;                             // siglo juliano
    const L0 = ((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360 + 360) % 360;   // longitud media
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);      // anomalía media
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T); // excentricidad de la órbita
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    const verdadera = L0 + C;
    const omega = 125.04 - 1934.136 * T;
    const aparente = verdadera - 0.00569 - 0.00478 * Math.sin(omega * RAD);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(omega * RAD);           // oblicuidad corregida
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(aparente * RAD)) * DEG;
    const y = Math.tan(eps * RAD / 2) ** 2;
    const eqT = 4 * DEG * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD) + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD)
      - 0.5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD));   // ecuación del tiempo, en minutos
    const minUTC = fecha.getUTCHours() * 60 + fecha.getUTCMinutes() + fecha.getUTCSeconds() / 60;
    let tst = (minUTC + eqT + 4 * lon) % 1440; if (tst < 0) tst += 1440; // tiempo solar verdadero
    let H = tst / 4 - 180; if (H < -180) H += 360;                // ángulo horario
    const cz = Math.max(-1, Math.min(1, Math.sin(lat * RAD) * Math.sin(decl * RAD) + Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(H * RAD)));
    const zen = Math.acos(cz) * DEG;
    let elev = 90 - zen;
    // refracción atmosférica (la aproximación de la NOAA por tramos)
    const te = Math.tan(elev * RAD);
    let refr = 0;
    if (elev > 85) refr = 0;
    else if (elev > 5) refr = 58.1 / te - 0.07 / te ** 3 + 0.000086 / te ** 5;
    else if (elev > -0.575) refr = 1735 + elev * (-518.2 + elev * (103.4 + elev * (-12.79 + elev * 0.711)));
    else refr = -20.774 / te;
    elev += refr / 3600;
    // acimut desde el norte, en sentido horario
    const den = Math.cos(lat * RAD) * Math.sin(zen * RAD);
    let az;
    if (Math.abs(den) > 1e-6) {
      let a = ((Math.sin(lat * RAD) * cz) - Math.sin(decl * RAD)) / den;
      a = Math.max(-1, Math.min(1, a));
      az = H > 0 ? (Math.acos(a) * DEG + 180) % 360 : (540 - Math.acos(a) * DEG) % 360;
    } else az = lat > 0 ? 180 : 0;
    // mediodía solar, en minutos UTC
    const mediodia = 720 - 4 * lon - eqT;
    const ha = Math.acos(Math.max(-1, Math.min(1, Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) - Math.tan(lat * RAD) * Math.tan(decl * RAD)))) * DEG;
    return { elev, az, decl, eqT, mediodia, orto: mediodia - 4 * ha, ocaso: mediodia + 4 * ha };
  }

  // ── la hora oficial en España ──
  const ultimoDomingo = (anio, mes) => { const d = new Date(Date.UTC(anio, mes + 1, 0)); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d; };
  function desfase(fechaUTC, lon, lat) {
    const canarias = lat < 30 && lon < -12;
    const base = canarias ? 0 : 1, a = fechaUTC.getUTCFullYear();
    const ini = ultimoDomingo(a, 2), fin = ultimoDomingo(a, 9);
    ini.setUTCHours(1); fin.setUTCHours(1);                      // el cambio es a la 01:00 UTC
    const verano = fechaUTC >= ini && fechaUTC < fin;
    return base + (verano ? 1 : 0);
  }
  // un instante a partir de la fecha (año, mes, día) y una hora local decimal
  function instante(anio, mes, dia, horaLocal, lat, lon) {
    const prov = new Date(Date.UTC(anio, mes, dia, 12));
    const off = desfase(prov, lon, lat);
    return new Date(Date.UTC(anio, mes, dia, 0, 0) + (horaLocal - off) * 3600000);
  }
  const hora = (min, off) => { let m = ((min + off * 60) % 1440 + 1440) % 1440; const h = Math.floor(m / 60), mm = Math.round(m % 60); return `${h}:${String(mm === 60 ? 59 : mm).padStart(2, '0')}`; };

  // ── el recorrido del sol en un día: para el diagrama y para la luz de la maqueta ──
  function recorrido(anio, mes, dia, lat, lon, paso = 0.25) {
    const pts = [];
    for (let h = 0; h <= 24; h += paso) { const p = posicion(instante(anio, mes, dia, h, lat, lon), lat, lon); pts.push({ h, elev: p.elev, az: p.az }); }
    const p0 = posicion(instante(anio, mes, dia, 12, lat, lon), lat, lon), off = desfase(new Date(Date.UTC(anio, mes, dia, 12)), lon, lat);
    return { pts, orto: hora(p0.orto, off), ocaso: hora(p0.ocaso, off), mediodia: hora(p0.mediodia, off), mediodiaH: ((p0.mediodia / 60 + off) % 24 + 24) % 24, off };
  }

  // ── ganancia de cada fachada: suma de la componente del sol sobre su normal, cada cuarto de hora ──
  //  (un índice relativo para comparar orientaciones en ese lugar, no una cifra de energía)
  function fachadas(lat, lon, anio = 2026) {
    const dias = { invierno: [11, 21], verano: [5, 21] }, out = {};
    const NORMAL = { N: 0, E: 90, S: 180, O: 270 };
    for (const [k, [mes, dia]] of Object.entries(dias)) {
      const g = { N: 0, E: 0, S: 0, O: 0 };
      for (let h = 4; h <= 22; h += 0.25) {
        const p = posicion(instante(anio, mes, dia, h, lat, lon), lat, lon); if (p.elev <= 1) continue;
        const ce = Math.cos(p.elev * RAD), se = Math.sin(p.elev * RAD), masa = Math.pow(0.7, Math.pow(1 / se, 0.678));   // atenuación del aire
        for (const o in NORMAL) g[o] += Math.max(0, Math.cos((p.az - NORMAL[o]) * RAD)) * ce * masa;
      }
      const max = Math.max(...Object.values(g)) || 1; for (const o in g) g[o] /= max;
      out[k] = g;
    }
    return out;
  }

  // ── la red: distancia en línea recta al punto de producción activo más cercano ──
  function haversine(la1, lo1, la2, lo2) {
    const R = 6371, dLa = (la2 - la1) * RAD, dLo = (lo2 - lo1) * RAD;
    const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * RAD) * Math.cos(la2 * RAD) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function puntoCercano(lat, lon, red) {
    const activos = (red || []).filter((p) => p.est === 'activo' && /producci/i.test(p.t));
    let mejor = null;
    for (const p of activos) { const d = haversine(lat, lon, p.lat, p.lon); if (!mejor || d < mejor.km) mejor = { p, km: d }; }
    return mejor;
  }

  window.CUEVA_SOL = { posicion, desfase, instante, recorrido, fachadas, haversine, puntoCercano, hora };
})();

// ─────────────────────────────────────────────────────────────────────
//  Motor de propuestas CUEVA · lectura del castellano
//  Un analizador por reglas, sin modelos ni servidores: lo que escribes se lee aquí mismo.
//  1. Normaliza carácter a carácter (sin tildes, en minúsculas) sin perder la posición
//     original, para poder subrayar en tu mensaje lo que se ha entendido.
//  2. Trocea en palabras y números; convierte los números escritos con letra
//     («veintidós», «ciento veinte», «dos y medio», «un par») en cifras.
//  3. Reduce cada palabra a su raíz (plurales, género, diminutivos) y la compara con un
//     léxico; las erratas cortas se perdonan con una distancia de edición de uno.
//  4. Reconoce cantidades con su sustantivo, rangos («entre 3 y 4», «3 o 4», «al menos 3»),
//     medidas de parcela («20 por 30», «20 × 30 m», «600 m²»), negaciones («sin garaje»),
//     relaciones («cocina abierta al salón»), lugares (capitales de provincia) y órdenes.
//  Clásico: window.CUEVA_TEXTO. Sin DOM.
// ─────────────────────────────────────────────────────────────────────
(() => {
  // ── normalización con el mismo largo: cada carácter original da uno normalizado ──
  const ESPECIAL = { '²': '2', '³': '3', 'º': 'o', 'ª': 'a', '×': 'x', '–': '-', '—': '-', '’': "'", '´': "'", '·': ' ' };
  function normalizar(s) {
    let o = '';
    for (const c of String(s)) {
      if (ESPECIAL[c]) { o += ESPECIAL[c]; continue; }
      const d = c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      o += d.length === 1 ? d : (d[0] || ' ');
    }
    return o;
  }

  // ── números con letra ──
  const UNI = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
    dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
    veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29 };
  const DEC = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 };
  const CEN = { cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500,
    seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900 };
  const esNumPal = (w) => w in UNI || w in DEC || w in CEN || w === 'mil';

  // ── raíces: un lematizador ligero para el castellano ──
  function raiz(w) {
    if (w.length <= 3 || /^\d/.test(w)) return w;
    let r = w.replace(/(.){2,}/g, '$1$1').replace(/s{2,}$/, 's');   // «bañoss», «holaaa»
    r = r.replace(/(cit|cill|it|ill|in)(o|a)s?$/, (m, a, g) => (r.length > 6 ? g : m));   // diminutivos: casita → casa
    if (/ces$/.test(r)) r = r.replace(/ces$/, 'z');                                       // luces → luz
    else if (/(ion|or|al|el|ar|er)es$/.test(r)) r = r.slice(0, -2);                        // habitaciones → habitacion
    else if (/[aeo]s$/.test(r)) r = r.slice(0, -1);                                       // dormitorios → dormitorio
    if (r.length > 4 && /[aoe]$/.test(r)) r = r.slice(0, -1);                              // abierta → abiert, dormitorio → dormitori
    return r;
  }
  // distancia de edición (Damerau, con tope): para perdonar erratas
  function dist(a, b, tope = 2) {
    if (Math.abs(a.length - b.length) > tope) return tope + 1;
    const m = a.length, n = b.length, d = [];
    for (let i = 0; i <= m; i++) { d[i] = [i]; }
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      let mejor = 99;
      for (let j = 1; j <= n; j++) {
        const c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        mejor = Math.min(mejor, d[i][j]);
      }
      if (mejor > tope) return tope + 1;
    }
    return d[m][n];
  }

  // ── el léxico: concepto → raíces que lo nombran ──
  const LEX = {
    dormitorio: ['dormitorio', 'habitacion', 'cuarto', 'alcoba', 'dorm', 'suite', 'hab'],
    bano: ['bano', 'banito'],
    aseo: ['aseo', 'servicio', 'toilette', 'lavabo'],
    planta: ['planta', 'altura', 'nivel', 'piso'],
    cocina: ['cocina', 'office'],
    salon: ['salon', 'estar', 'living', 'comedor'],
    casa: ['casa', 'vivienda', 'chalet', 'hogar', 'construccion', 'construida', 'edificacion'],
    parcela: ['parcela', 'solar', 'terreno', 'finca', 'lote', 'suelo'],
    metro: ['metro', 'm', 'mt', 'mts', 'm2', 'mq'],
    porche: ['porche', 'porchado', 'soportal', 'galeria'],
    patio: ['patio', 'claustro'],
    piscina: ['piscina', 'pileta', 'alberca'],
    terraza: ['terraza', 'azotea', 'solarium', 'balcon'],
    garaje: ['garaje', 'cochera', 'aparcamiento', 'parking', 'coche', 'plaza'],
    madera: ['madera', 'clt', 'roble', 'pino'],
    minimalista: ['minimalista', 'minimal', 'sencilla', 'limpia', 'depurada', 'sobria'],
    mediterraneo: ['mediterranea', 'encalada', 'blanca', 'ibicenca', 'menorquina', 'mallorquina'],
    luz: ['luz', 'luminosa', 'claridad', 'ventanal', 'sol', 'soleada'],
    estudio: ['estudio', 'despacho', 'teletrabajo', 'oficina', 'biblioteca'],
    accesible: ['accesible', 'escalon', 'silla', 'ruedas', 'movilidad', 'mayores', 'anciano'],
    lavadero: ['lavadero', 'tendedero', 'colada', 'plancha'],
    vestidor: ['vestidor'],
    jardin: ['jardin', 'huerto', 'cesped'],
    persona: ['persona', 'miembro'],
    hijo: ['hijo', 'nino', 'crio', 'peque', 'bebe'],
    pareja: ['pareja', 'matrimonio'],
    calle: ['calle', 'acceso', 'entrada', 'fachada', 'carretera', 'camino'],
  };
  // cada palabra del léxico, por su raíz (la misma reducción que se aplica a lo que escribes)
  const LEX_INV = [];
  for (const [k, ps] of Object.entries(LEX)) for (const p of ps) LEX_INV.push([raiz(p), k]);
  function concepto(w) {
    if (/^\d/.test(w)) return null;
    const r = raiz(w);
    for (const [rz, k] of LEX_INV) if (r === rz) return k;
    for (const [rz, k] of LEX_INV) if (rz.length >= 5 && r.startsWith(rz) && r.length - rz.length <= 3) return k;
    if (r.length >= 4) for (const [rz, k] of LEX_INV) if (rz.length >= 4 && r.slice(0, 3) === rz.slice(0, 3) && dist(r, rz, 1) <= 1) return k;
    if (r.length >= 5) for (const [rz, k] of LEX_INV) if (rz.length >= 5 && dist(r, rz, 1) <= 1) return k;
    return null;
  }


  // ── el diccionario de lugares: capitales de provincia, islas y algunas ciudades ──
  //  Coordenadas aproximadas de cada ciudad (grados): bastan para el sol y la distancia estimada.
  const LUGARES = [
    ['A Coruña', 43.37, -8.40, ['a coruna', 'la coruna', 'coruna']], ['Albacete', 38.99, -1.86], ['Alicante', 38.35, -0.48, ['alacant']], ['Almería', 36.84, -2.46],
    ['Ávila', 40.66, -4.70], ['Badajoz', 38.88, -6.97], ['Barcelona', 41.39, 2.17], ['Bilbao', 43.26, -2.93, ['bizkaia', 'vizcaya']], ['Burgos', 42.34, -3.70],
    ['Cáceres', 39.47, -6.37], ['Cádiz', 36.53, -6.29], ['Castellón de la Plana', 39.99, -0.05, ['castellon', 'castello']], ['Ciudad Real', 38.99, -3.93], ['Córdoba', 37.89, -4.78],
    ['Cuenca', 40.07, -2.13], ['Girona', 41.98, 2.82, ['gerona']], ['Granada', 37.18, -3.60], ['Guadalajara', 40.63, -3.17], ['Huelva', 37.26, -6.95], ['Huesca', 42.14, -0.41],
    ['Jaén', 37.77, -3.79], ['Las Palmas de Gran Canaria', 28.12, -15.43, ['las palmas', 'gran canaria']], ['León', 42.60, -5.57], ['Lleida', 41.62, 0.63, ['lerida']],
    ['Logroño', 42.47, -2.45, ['la rioja', 'rioja']], ['Lugo', 43.01, -7.56], ['Madrid', 40.42, -3.70], ['Málaga', 36.72, -4.42], ['Murcia', 37.99, -1.13], ['Ourense', 42.34, -7.86, ['orense']],
    ['Oviedo', 43.36, -5.85, ['asturias']], ['Palencia', 42.01, -4.53], ['Palma', 39.57, 2.65, ['palma de mallorca', 'mallorca', 'baleares']], ['Pamplona', 42.81, -1.64, ['iruna', 'navarra']],
    ['Pontevedra', 42.43, -8.64], ['Salamanca', 40.97, -5.66], ['San Sebastián', 43.32, -1.98, ['donostia', 'guipuzcoa', 'gipuzkoa']], ['Santa Cruz de Tenerife', 28.46, -16.25, ['tenerife', 'santa cruz']],
    ['Santander', 43.46, -3.80, ['cantabria']], ['Segovia', 40.95, -4.12], ['Sevilla', 37.39, -5.98], ['Soria', 41.76, -2.46], ['Tarragona', 41.12, 1.25], ['Teruel', 40.34, -1.11],
    ['Toledo', 39.86, -4.02], ['Valencia', 39.47, -0.38, ['valencia ciudad']], ['Valladolid', 41.65, -4.72], ['Vitoria-Gasteiz', 42.85, -2.67, ['vitoria', 'gasteiz', 'alava', 'araba']],
    ['Zamora', 41.50, -5.75], ['Zaragoza', 41.65, -0.88], ['Ceuta', 35.89, -5.32], ['Melilla', 35.29, -2.94],
    ['Maó', 39.89, 4.26, ['mahon', 'mao', 'menorca']], ['Ciutadella', 40.00, 3.84, ['ciudadela']], ['Ibiza', 38.91, 1.43, ['eivissa']], ['Gijón', 43.54, -5.66, ['xixon']], ['Vigo', 42.24, -8.72],
    ['Santiago de Compostela', 42.88, -8.54, ['santiago']], ['Marbella', 36.51, -4.88], ['Jerez de la Frontera', 36.69, -6.14, ['jerez']], ['Elche', 38.27, -0.70, ['elx']],
    ['Cartagena', 37.60, -0.98], ['Mérida', 38.92, -6.34], ['Plasencia', 40.03, -6.09], ['Piedrahíta', 40.47, -5.33, ['piedrahita']], ['Navalcarnero', 40.29, -4.01],
    ['Ponferrada', 42.55, -6.60], ['Talavera de la Reina', 39.96, -4.83, ['talavera']], ['Benidorm', 38.54, -0.13], ['Torrevieja', 37.98, -0.68], ['Lanzarote', 29.0, -13.6, ['arrecife']],
    ['Fuerteventura', 28.4, -14.0, ['puerto del rosario']], ['La Palma', 28.68, -17.76], ['Formentera', 38.70, 1.45],
  ].map(([n, lat, lon, alias]) => ({ n, lat, lon, claves: [normalizar(n), ...(alias || [])].map((s) => s.replace(/-/g, ' ')) }));
  const ISLAS = { 'Maó': 'menorca', 'Ciutadella': 'menorca', 'Palma': 'mallorca', 'Ibiza': 'ibiza', 'Formentera': 'ibiza' };

  // ── trocear: palabras y números con su posición en el texto original ──
  function trocear(original) {
    const t = normalizar(original), toks = [];
    const re = /m2(?![0-9])|mts2(?![0-9])|\d+(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?|[a-zñ]+|[x*\/+\-]|[.,;:!?()]/g;
    let m;
    while ((m = re.exec(t))) {
      let w = m[0], v = null, tipo = 'pal';
      if (/^\d/.test(w)) { tipo = 'num'; v = parseFloat(w.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')); }
      else if (/^[x*\/+\-]$/.test(w)) tipo = 'sim';
      else if (/^[.,;:!?()]$/.test(w)) tipo = 'pun';
      // «20x30» y «m2» llegan pegados: se separan
      toks.push({ w, tipo, v, a: m.index, b: m.index + w.length });
    }
    // «20x30» → 20 x 30 (la regex ya los separa porque «x» no es dígito); «x» suelta entre números es «por»
    return { t, toks };
  }
  // números con letra → un token numérico (une «treinta y cinco», «ciento veinte», «mil doscientos», «dos y medio»)
  function juntarNumeros(toks) {
    const out = [];
    for (let i = 0; i < toks.length; i++) {
      const k = toks[i];
      if (k.tipo === 'pal' && k.w === 'par' && toks[i - 1]?.w === 'un' && toks[i + 1]?.w === 'de') { const prev = out.pop(); out.push({ ...prev, w: 'un par', tipo: 'num', v: 2, b: k.b }); i++; continue; }
      if (k.tipo !== 'pal' || !esNumPal(k.w)) { out.push(k); continue; }
      let total = 0, actual = 0, j = i, fin = k.b, visto = false;
      while (j < toks.length) {
        const w = toks[j].w;
        if (w in UNI) { actual += UNI[w]; } else if (w in DEC) { actual += DEC[w]; } else if (w in CEN) { actual += CEN[w]; }
        else if (w === 'mil') { total += (actual || 1) * 1000; actual = 0; }
        else if (w === 'y' && visto && toks[j + 1] && (toks[j + 1].w in UNI) && toks[j - 1] && (toks[j - 1].w in DEC)) { j++; continue; }
        else break;
        visto = true; fin = toks[j].b; j++;
      }
      let v = total + actual;
      // «dos y medio», «tres y media»
      if (toks[j]?.w === 'y' && (toks[j + 1]?.w === 'medio' || toks[j + 1]?.w === 'media')) { v += 0.5; fin = toks[j + 1].b; j += 2; }
      out.push({ w: toks.slice(i, j).map((q) => q.w).join(' '), tipo: 'num', v, a: k.a, b: fin, letra: true });
      i = j - 1;
    }
    // «medio», solo, tras un número: «ocho metros y medio» se resuelve abajo
    return out;
  }

  const NEG = new Set(['sin', 'no', 'nada', 'ni', 'ningun', 'ninguna', 'ninguno', 'tampoco', 'quita', 'quitar', 'quitale', 'elimina', 'eliminar', 'fuera', 'sobra', 'sobran']);
  const CORTE = new Set([',', '.', ';', ':', 'pero', 'aunque', '!', '?']);
  const ADD = new Set(['pon', 'poner', 'anade', 'anadir', 'agrega', 'agregar', 'incluye', 'incluir', 'mete', 'meter', 'quiero', 'con', 'tenga', 'tener']);

  // ── analizar: devuelve los campos entendidos y dónde estaba cada uno en el texto ──
  function analizar(original) {
    const { toks: crudos } = trocear(original);
    const toks = juntarNumeros(crudos);
    for (const k of toks) if (k.tipo === 'pal') k.c = concepto(k.w);
    const R = { campos: {}, gustos: {}, enlaces: [], ordenes: [], trazas: [], lugarDesconocido: null, relativos: {}, orient: {} };
    const marcar = (a, b, campo, txt) => R.trazas.push({ a, b, campo, txt });
    const n = toks.length, w = (i) => toks[i]?.w, c = (i) => toks[i]?.c, esNum = (i) => toks[i]?.tipo === 'num';
    const negado = (i) => { for (let j = i - 1; j >= Math.max(0, i - 4); j--) { const x = w(j); if (NEG.has(x)) return true; if (CORTE.has(x) || ADD.has(x) || (x === 'y' && j < i - 1) || toks[j].c) return false; } return false; };

    // cantidad delante de un concepto (con rango y hasta dos palabras en medio): «entre 3 y 4 dormitorios dobles»
    function cantidadAntes(i) {
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        if (CORTE.has(w(j))) return null;
        if (esNum(j)) {
          let v = toks[j].v, lo = v, hi = v, a = toks[j].a;
          // rangos: «3 o 4», «3-4», «3 a 4», «entre 3 y 4», «de 3 a 4»
          if (esNum(j - 2) && ['o', 'a', '-', 'y', 'u'].includes(w(j - 1))) { lo = Math.min(toks[j - 2].v, v); hi = Math.max(toks[j - 2].v, v); a = toks[j - 2].a; if (w(j - 3) === 'entre' || w(j - 3) === 'de') a = toks[j - 3].a; }
          const pre = w(j - 1), pre2 = w(j - 2);
          let modo = 'igual';
          if (pre === 'menos' || (pre === 'de' && pre2 === 'menos') || pre === 'maximo' || pre === 'hasta') modo = 'max';
          if (pre === 'minimo' || (pre === 'menos' && pre2 === 'al') || (pre === 'de' && pre2 === 'mas') || pre === 'mas') modo = 'min';
          if (pre2 === 'al' && pre === 'menos') modo = 'min';
          return { v: lo === hi ? v : Math.round((lo + hi) / 2), lo, hi, modo, a, j };
        }
      }
      return null;
    }
    // cantidad detrás: «dormitorios: 3», «baños 2»
    function cantidadDespues(i) { if (esNum(i + 1) && !c(i + 2)) return { v: toks[i + 1].v, lo: toks[i + 1].v, hi: toks[i + 1].v, b: toks[i + 1].b }; if (w(i + 1) === ':' && esNum(i + 2)) return { v: toks[i + 2].v, lo: toks[i + 2].v, hi: toks[i + 2].v, b: toks[i + 2].b }; return null; }

    for (let i = 0; i < n; i++) {
      const k = toks[i], cc = k.c;
      if (!cc) continue;
      // «cuarto de baño», «cuarto de estar», «cuarto de lavado»: el cuarto no es un dormitorio
      if (cc === 'dormitorio' && w(i) && w(i).startsWith('cuart') && w(i + 1) === 'de' && ['bano', 'banos', 'estar', 'lavado', 'plancha', 'aseo'].includes(w(i + 2))) continue;
      if (cc === 'dormitorio' || cc === 'bano' || cc === 'aseo') {
        // «un dormitorio más», «dos baños menos»: cambios relativos
        if (w(i + 1) === 'mas' || w(i + 1) === 'menos') {
          const q = cantidadAntes(i), d = (q ? q.v : 1) * (w(i + 1) === 'mas' ? 1 : -1), campo = cc === 'dormitorio' ? 'dormitorios' : cc === 'bano' ? 'banos' : 'aseos';
          R.relativos[campo] = (R.relativos[campo] || 0) + d; marcar(q ? q.a : k.a, toks[i + 1].b, campo); continue;
        }
        if (w(i - 1) === 'otro' || w(i - 1) === 'otra') { const campo = cc === 'dormitorio' ? 'dormitorios' : cc === 'bano' ? 'banos' : 'aseos'; R.relativos[campo] = (R.relativos[campo] || 0) + 1; marcar(toks[i - 1].a, k.b, campo); continue; }
        if (/^(quita|quitar|quitale|elimina|sobra)/.test(w(i - 2) || '') && /^(un|una)$/.test(w(i - 1) || '')) { const campo = cc === 'dormitorio' ? 'dormitorios' : cc === 'bano' ? 'banos' : 'aseos'; R.relativos[campo] = (R.relativos[campo] || 0) - 1; marcar(toks[i - 2].a, k.b, campo); continue; }
        if (cc === 'aseo' && w(i) === 'servicio' && w(i - 1) !== 'de' && !esNum(i - 1)) continue;
        const q = cantidadAntes(i) || cantidadDespues(i);
        const campo = cc === 'dormitorio' ? 'dormitorios' : cc === 'bano' ? 'banos' : 'aseos';
        if (q) { R.campos[campo] = { v: q.v, lo: q.lo, hi: q.hi, modo: q.modo }; marcar(q.a ?? k.a, q.b ?? k.b, campo); }
        else if (negado(i)) { R.campos[campo] = { v: 0 }; marcar(k.a, k.b, campo); }
        else if (cc === 'dormitorio' && w(i) === 'suite') { R.gustos.suite = true; marcar(k.a, k.b, 'gustos'); }
        else if (/^[a-z]+s$/.test(w(i)) === false && cc !== 'dormitorio') { R.campos[campo] = R.campos[campo] || { v: 1, debil: true }; marcar(k.a, k.b, campo); }
        if (cc === 'dormitorio' && w(i + 1) === 'principal' && w(i + 2) === 'con' && concepto(w(i + 3) || '') === 'bano') { R.gustos.suite = true; marcar(k.a, toks[i + 3].b, 'gustos'); }
        continue;
      }
      if (cc === 'planta') {
        // «planta baja» sola es una casa de una planta; «planta baja y primera», «baja más una», dos
        if (w(i + 1) === 'baja' && !/^(y|mas|\+)$/.test(w(i + 2) || '')) {
          const q = cantidadAntes(i);
          if (!q || q.v === 1) { if (!R.campos.plantas) { R.campos.plantas = { v: 1 }; marcar((q && q.a) ?? k.a, toks[i + 1].b, 'plantas'); } continue; }
        }
        if (w(i + 1) === 'baja' && /^(y|mas|\+)$/.test(w(i + 2) || '')) { R.campos.plantas = { v: 2 }; marcar(k.a, toks[Math.min(n - 1, i + 3)].b, 'plantas'); continue; }
        if (w(i + 1) === 'alta' || w(i + 1) === 'primera' || w(i + 1) === 'superior') { if (!negado(i)) { R.campos.plantas = { v: 2 }; marcar(k.a, toks[i + 1].b, 'plantas'); } else { R.campos.plantas = { v: 1 }; marcar(k.a, toks[i + 1].b, 'plantas'); } continue; }
        const q = cantidadAntes(i);
        if (q && q.v >= 1 && q.v <= 4) { R.campos.plantas = { v: Math.min(2, Math.round(q.v)), lo: q.lo, hi: q.hi, pedido: q.v }; marcar(q.a, k.b, 'plantas'); }
        else if (w(i - 1) === 'sola' || w(i - 2) === 'una') { R.campos.plantas = { v: 1 }; marcar(toks[Math.max(0, i - 2)].a, k.b, 'plantas'); }
        continue;
      }
      if (cc === 'cocina') {
        marcar(k.a, k.b, 'cocina');
        // «abierta al salón», «americana», «integrada», «con isla», «independiente», «cerrada»
        for (let j = i + 1; j < Math.min(n, i + 7); j++) {
          const x = w(j);
          if (CORTE.has(x)) break;
          if (/^(abiert|american|integrad|diafan|unid|conectad)/.test(x)) { R.campos.cocina = { v: 'abierta' }; R.enlaces.push(['cocina', 'salon', 'abierta']); marcar(k.a, toks[j].b, 'cocina'); for (let q = j + 1; q < Math.min(n, j + 4); q++) if (c(q) === 'salon') { marcar(k.a, toks[q].b, 'cocina'); break; } break; }
          if (/^(independient|cerrad|separad|aparte)/.test(x)) { R.campos.cocina = { v: 'cerrada' }; marcar(k.a, toks[j].b, 'cocina'); break; }
          if (/^isla/.test(x)) { R.campos.cocina = { v: 'abierta' }; R.gustos.isla = true; R.enlaces.push(['cocina', 'salon', 'abierta']); marcar(k.a, toks[j].b, 'cocina'); break; }
        }
        if (w(i - 1) === 'office') R.campos.cocina = { v: 'abierta' };
        continue;
      }
      if (cc === 'salon') { if (/^(grande|amplio|enorme)/.test(w(i + 1) || '')) R.gustos.salonGrande = true; continue; }
      if (cc === 'persona') { const q = cantidadAntes(i); if (q) { R.campos.personas = { v: q.v }; marcar(q.a, k.b, 'personas'); } continue; }
      if (cc === 'hijo') { const q = cantidadAntes(i); if (q && q.v <= 8) { R.campos.hijos = { v: q.v }; marcar(q.a, k.b, 'hijos'); } continue; }
      if (cc === 'pareja') { R.campos.pareja = { v: true }; marcar(k.a, k.b, 'personas'); continue; }
      if (cc === 'parcela') {
        // «parcela de 20 por 30», «solar de 20 x 30 m», «20 metros de frente y 30 de fondo», «parcela de 600 m²»
        let hecho = false;
        for (let j = i + 1; j < Math.min(n, i + 9) && !hecho; j++) {
          if (CORTE.has(w(j)) && w(j) !== ',') break;
          if (esNum(j)) {
            let q = j + 1; if (c(q) === 'metro') q++;
            if ((w(q) === 'por' || w(q) === 'x' || w(q) === '*') && esNum(q + 1)) {
              const a = toks[j].v, b = toks[q + 1].v; let fin = toks[q + 1].b; if (c(q + 2) === 'metro') fin = toks[q + 2].b;
              if (a >= 4 && b >= 4 && a <= 400 && b <= 400) { R.campos.parcela = { an: a, fo: b }; marcar(k.a, fin, 'parcela'); hecho = true; }
            } else if (c(q) === 'metro' || c(j + 1) === 'metro') {
              const unidad = toks[c(j + 1) === 'metro' ? j + 1 : q], cuad = /2|q/.test(unidad.w) || w(j + 2) === 'cuadrados' || w(j + 3) === 'cuadrados';
              if (cuad || toks[j].v > 120) { R.campos.parcelaArea = { v: toks[j].v }; marcar(k.a, (w(j + 2) === 'cuadrados' ? toks[j + 2] : unidad).b, 'parcela'); hecho = true; }
              else {
                // «20 metros de frente y 30 de fondo»
                const fr = toks.slice(j, j + 5).find((t) => /^(frente|fachada|ancho)/.test(t.w)); let fo = null;
                for (let q2 = j + 2; q2 < Math.min(n, j + 9); q2++) if (esNum(q2) && toks.slice(q2, q2 + 4).some((t) => /^(fondo|profundidad|largo)/.test(t.w))) { fo = q2; break; }
                if (fr && fo != null) { R.campos.parcela = { an: toks[j].v, fo: toks[fo].v }; marcar(k.a, toks[fo + 2]?.b ?? toks[fo].b, 'parcela'); hecho = true; }
              }
            }
          }
        }
        continue;
      }
      if (cc === 'calle') {
        // «la calle está al sur», «la entrada da al este», «fachada principal a norte»
        for (let j = i + 1; j < Math.min(n, i + 6); j++) {
          const x = w(j); if (CORTE.has(x)) break;
          const o = { norte: 'N', sur: 'S', este: 'E', oeste: 'O', levante: 'E', poniente: 'O', mediodia: 'S' }[x];
          if (o) { R.campos.calle = { v: o }; marcar(k.a, toks[j].b, 'calle'); break; }
        }
        continue;
      }
      // gustos, con su negación
      const GUSTO = { porche: 'porche', patio: 'patio', piscina: 'piscina', terraza: 'terraza', garaje: 'garaje', madera: 'madera', minimalista: 'minimalista', mediterraneo: 'mediterraneo', luz: 'luz', estudio: 'estudio', accesible: 'accesible', lavadero: 'lavadero', vestidor: 'vestidor', jardin: 'jardin' };
      if (GUSTO[cc]) {
        // falsos amigos: «plaza» solo es garaje con «de garaje / aparcamiento»; «coche» sí; «sol» como luz
        if (cc === 'garaje' && /^plaz/.test(w(i)) && !/^(de|para)$/.test(w(i + 1) || '')) continue;
        if (cc === 'mediterraneo' && /^blanc/.test(w(i)) && !/^(casa|fachad|encalad)/.test(w(i - 1) || '') && !/^(cas)/.test(w(i - 2) || '')) continue;
        if (cc === 'accesible' && /^(mayor|ancian)/.test(w(i)) && !/^(persona|padre|abuel|gente)/.test(w(i - 1) || w(i - 2) || '')) continue;
        if (cc === 'accesible' && /^(silla|ruedas)/.test(w(i)) && !toks.some((t) => t.w === 'ruedas')) continue;
        if (cc === 'accesible' && /^escalon/.test(w(i)) && !negado(i)) continue;
        if (cc === 'luz' && w(i) === 'sol' && w(i - 1) === 'al') continue;
        const no = negado(i) && !(cc === 'accesible' && /^escalon/.test(w(i)));
        R.gustos[GUSTO[cc]] = !no;
        let a = k.a; if (no) for (let j = i - 1; j >= Math.max(0, i - 4); j--) if (NEG.has(w(j))) { a = toks[j].a; break; }
        marcar(a, k.b, 'gustos', GUSTO[cc]);
        if (cc === 'accesible') { R.campos.plantas = { v: 1 }; }
        continue;
      }
    }
    // «sin escaleras», «nada de escaleras»: una planta y accesible
    for (let i = 0; i < n; i++) if (/^escaler/.test(w(i)) && negado(i)) { R.campos.plantas = { v: 1 }; R.gustos.accesible = true; let a = toks[i].a; for (let j = i - 1; j >= Math.max(0, i - 3); j--) if (NEG.has(w(j))) a = toks[j].a; marcar(a, toks[i].b, 'plantas'); }
    // «dúplex», «en dos alturas», «una sola altura», «casa baja», «de una planta»
    for (let i = 0; i < n; i++) {
      if (/^duplex/.test(w(i))) { R.campos.plantas = { v: 2 }; marcar(toks[i].a, toks[i].b, 'plantas'); }
      if (w(i) === 'baja' && c(i - 1) === 'casa') { R.campos.plantas = R.campos.plantas || { v: 1 }; marcar(toks[i - 1].a, toks[i].b, 'plantas'); }
      if (/^(mucha|buena)$/.test(w(i)) && c(i + 1) === 'luz') { R.gustos.luz = true; marcar(toks[i].a, toks[i + 1].b, 'gustos', 'luz'); }
    }
    // superficie de la casa: «de unos 120 m²», «120 metros cuadrados» (cuando no es la parcela)
    for (let i = 0; i < n; i++) {
      if (!esNum(i)) continue;
      const u = toks[i + 1]; if (!u || u.c !== 'metro') continue;
      const cuad = /2|q/.test(u.w) || w(i + 2) === 'cuadrados' || w(i + 2) === 'cuadrado';
      if (!cuad) continue;
      // ¿de quién es? el sustantivo más cercano hacia atrás
      let duen = null;
      for (let j = i - 1; j >= Math.max(0, i - 7); j--) { if (c(j) === 'parcela') { duen = 'parcela'; break; } if (c(j) === 'casa') { duen = 'casa'; break; } if (CORTE.has(w(j)) && w(j) !== ',') break; }
      if (duen === 'parcela') continue;
      if (duen === null && toks[i].v > 450) { if (!R.campos.parcela && !R.campos.parcelaArea) { R.campos.parcelaArea = { v: toks[i].v }; marcar(toks[i].a, (w(i + 2) === 'cuadrados' ? toks[i + 2] : u).b, 'parcela'); } continue; }
      const q = cantidadAntes(i + 1);
      R.campos.superficie = { v: toks[i].v, lo: q?.lo ?? toks[i].v, hi: q?.hi ?? toks[i].v, modo: q?.modo };
      marcar(q?.a ?? toks[i].a, (w(i + 2) === 'cuadrados' ? toks[i + 2] : u).b, 'superficie');
    }
    // personas → dormitorios (si no se han dicho): una pareja y n hijos
    if (!R.campos.dormitorios) {
      if (R.campos.hijos) R.campos.dormitoriosInferidos = { v: Math.max(1, Math.min(5, 1 + R.campos.hijos.v)), por: 'hijos' };
      else if (R.campos.personas) R.campos.dormitoriosInferidos = { v: Math.max(1, Math.min(5, Math.ceil((R.campos.personas.v - 2) / 1) + 1)), por: 'personas' };
    }
    // lugar: el diccionario, de la clave más larga a la más corta
    const plano = ' ' + toks.filter((k) => k.tipo !== 'pun').map((k) => k.w).join(' ') + ' ';
    let mejor = null;
    for (const L of LUGARES) for (const cl of L.claves) {
      const at = plano.indexOf(' ' + cl + ' ');
      if (at >= 0 && (!mejor || cl.length > mejor.cl.length)) {
        // «valencia» también es nombre de pila poco probable aquí; «santiago» y «santa cruz» se aceptan
        mejor = { L, cl, at };
      }
    }
    if (mejor) {
      // posición en el texto original: buscamos el primer token de la clave
      const primera = mejor.cl.split(' ')[0], nPal = mejor.cl.split(' ').length;
      const iTok = toks.findIndex((k, i) => k.w === primera && toks.slice(i, i + nPal).map((q) => q.w).join(' ') === mejor.cl);
      R.campos.lugar = { v: mejor.L.n, lat: mejor.L.lat, lon: mejor.L.lon, isla: ISLAS[mejor.L.n] || null };
      if (iTok >= 0) marcar(toks[iTok].a, toks[iTok + nPal - 1].b, 'lugar');
    } else {
      // «en Villanueva del Pardillo»: un lugar que no está en el diccionario
      const m = /\b(?:en|cerca de|junto a)\s+((?:[A-ZÁÉÍÓÚÑ][\wáéíóúñü-]+)(?:\s+(?:de|del|la|las|los|el)?\s*[A-ZÁÉÍÓÚÑ][\wáéíóúñü-]+)*)/.exec(original);
      if (m && !/^(Una|Un|La|El|Planta)$/.test(m[1])) R.lugarDesconocido = m[1];
    }
    // afinar: «más luz en el salón», «el salón al oeste», «terraza al sur», «más compacta», «una planta más»
    const T = plano;
    const RUMBO = { norte: 'N', sur: 'S', este: 'E', oeste: 'O', levante: 'E', poniente: 'O', mediodia: 'S' };
    const marcaTexto = (re, campo) => { const m = re.exec(T); if (!m) return null; const ini = T.indexOf(m[0]); const t0 = toks.filter((k) => k.tipo !== 'pun'); let pos = 1, a = null, b = null; for (const k of t0) { if (pos >= ini && a == null) a = k.a; pos += k.w.length + 1; if (pos <= ini + m[0].length + 1) b = k.b; } if (a != null && b != null && b > a) marcar(a, b, campo); return m; };
    if (marcaTexto(/ (mas luz (en el |al )?(salon|estar)|(salon|estar) (mas )?(luminoso|con mas luz)) /, 'gustos')) { R.luzSalon = true; R.gustos.luz = true; }
    let mo = marcaTexto(/ (salon|estar|comedor) (orientado |mirando |abierto )?(al|hacia el|a|hacia) (norte|sur|este|oeste|levante|poniente|mediodia) /, 'gustos'); if (mo) R.orient.salon = RUMBO[mo[4]];
    mo = marcaTexto(/ (terraza|porche) (orientad[ao] |mirando |abiert[ao] )?(al|hacia el|a|hacia) (norte|sur|este|oeste|levante|poniente|mediodia) /, 'gustos'); if (mo) { R.orient[mo[1]] = RUMBO[mo[4]]; R.gustos[mo[1]] = true; }
    if (marcaTexto(/ mas compacta | menos fachada | mas recogida /, 'gustos')) R.compacta = true;
    // rasgos de los modelos CUEVA: dos aguas, doble altura, planta larga, celosía, altillo, chimenea
    if (marcaTexto(/ (a dos aguas|dos aguas|cubierta inclinada|tejado inclinado|tejado|cubierta a dos aguas) /, 'gustos')) R.gustos.dosAguas = true;
    if (marcaTexto(/ (doble altura|techo alto|techos altos) /, 'gustos')) R.gustos.dobleAltura = true;
    if (marcaTexto(/ (planta larga|casa larga|alargada|larga) /, 'gustos')) R.gustos.larga = true;
    if (marcaTexto(/ (celosia|celosias|lamas) /, 'gustos')) R.gustos.celosia = true;
    if (marcaTexto(/ (altillo|buhardilla) /, 'gustos')) R.gustos.altillo = true;
    if (marcaTexto(/ (chimenea|hogar de lena) /, 'gustos')) R.gustos.chimenea = true;
    const mm = marcaTexto(/ (basic|line|natura|my way|myway) /, 'modelo'); if (mm) R.modelo = { basic: 'basic', line: 'line', natura: 'natura', 'my way': 'myway', myway: 'myway' }[mm[1]];
    if (marcaTexto(/ (una|otra) planta mas /, 'plantas')) R.campos.plantas = { v: 2 };
    if (marcaTexto(/ (una|otra) planta menos /, 'plantas')) R.campos.plantas = { v: 1 };
    // órdenes
    if (/ (otra|otras|distinta|diferente) (alternativa|opcion|propuesta|version|casa) | otra mas | otra | dame otra | enseñame otra /.test(T) || /^\s*otra\s*$/.test(T)) R.ordenes.push('otra');
    if (/ (genera|generar|propon|proponme|proponer|hazme|haz|dise[nñ]a|disenar|calcula|adelante|empieza|venga|dale) /.test(T)) R.ordenes.push('generar');
    if (/ (descarga|descargar|guardar|guarda|exporta|exportar|bajar) /.test(T)) R.ordenes.push('descargar');
    if (/ (reinicia|reiniciar|empezar de nuevo|empezamos de nuevo|borra todo|desde cero) /.test(T)) R.ordenes.push('reiniciar');
    if (/ (ejemplo|demostracion|demo) /.test(T)) R.ordenes.push('ejemplo');
    if (/ (plano|croquis|dibujo|boceto) /.test(T) && / (tengo|subo|subir|adjunto|adjuntar|cuelgo|colgar|mando|envio) /.test(T)) R.ordenes.push('plano');
    if (/ (dibujar|dibujo yo|pintar|bocetar) /.test(T)) R.ordenes.push('croquis');
    if (/ (mas grande|mas amplia|mas espacio) /.test(T)) R.ordenes.push('mayor');
    if (/ (mas pequena|mas compacta|menos espacio|mas barata) /.test(T)) R.ordenes.push('menor');
    // sí, no, me da igual
    if (/^ (si|vale|ok|okay|claro|perfecto|de acuerdo|adelante|correcto|exacto|eso es|venga|dale|si por favor)( |$)/.test(T)) R.si = true;
    if (/^ (no|nop|para nada|ninguno|ninguna|nada)( |$)/.test(T)) R.no = true;
    if (/ (me da igual|da igual|lo que veas|como veas|como quieras|indiferente|no se|ni idea|aun no|todavia no|lo que sea|sorprendeme) /.test(T)) R.igual = true;
    // un número suelto, para responder a la pregunta pendiente
    const nums = toks.filter((k) => k.tipo === 'num');
    if (nums.length === 1 && toks.filter((k) => k.tipo === 'pal' && !k.letra).length <= 2) R.numeroSuelto = nums[0].v;
    if (nums.length === 2 && toks.some((k) => k.w === 'x' || k.w === 'por' || k.w === '*')) R.parSuelto = [nums[0].v, nums[1].v];
    R.vacio = !R.trazas.length && !R.modelo && !Object.keys(R.relativos).length && !R.luzSalon && !Object.keys(R.orient).length && !R.compacta && !R.ordenes.length && !R.si && !R.no && !R.igual && R.numeroSuelto == null && !R.parSuelto;
    // trazas ordenadas y sin solapes, para subrayar
    R.trazas.sort((p, q) => p.a - q.a || q.b - p.b);
    const limpias = [];
    for (const t of R.trazas) { const u = limpias[limpias.length - 1]; if (u && t.a < u.b) { if (t.b > u.b) u.b = t.b; continue; } limpias.push({ ...t }); }
    R.trazas = limpias;
    return R;
  }

  // el lugar más cercano a unas coordenadas (para un clic en el mapa o la geolocalización)
  function lugarCercano(lat, lon) {
    let mejor = null, d = Infinity;
    for (const L of LUGARES) { const k = km(lat, lon, L.lat, L.lon); if (k < d) { d = k; mejor = L; } }
    return { L: mejor, km: d };
  }
  function km(la1, lo1, la2, lo2) {
    const R = 6371, r = Math.PI / 180, dLa = (la2 - la1) * r, dLo = (lo2 - lo1) * r;
    const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  window.CUEVA_TEXTO = { normalizar, raiz, dist, concepto, analizar, trocear, juntarNumeros, LUGARES, ISLAS, lugarCercano, km };
})();

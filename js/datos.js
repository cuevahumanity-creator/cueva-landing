// ─────────────────────────────────────────────────────────────────────
//  CUEVA · datos de la página
//  Regla de la casa: ninguna cifra sin fuente. Todo número que se pinta sale de aquí
//  (o de datos406.js) y lleva su clave de fuente, que se lista al pie de la página.
//  Tomado de CUEVA_ORIGEN/js/nucleo/datos.js y CUEVA_WEB_OS/docs/CUEVA_OS_fuentes.md.
// ─────────────────────────────────────────────────────────────────────
window.DATOS = {
  FUENTES: {
    plano: 'CUEVA PLANO v9, TRASPASO §6 «Datos verificados» (14/08/2026)',
    catalogo: 'Catálogo técnico CUEVA hormigón 2026 (decisiones de octubre de 2026, pendientes de validación técnica)',
    piedrahita: 'Piedrahita Connect, carpeta madre v34; campaña del 16 al 19/06/2026',
    pieza406: 'Base bruta Piedrahita Connect (dataset maestro v2), trackeo depurado y carpeta madre v36; hora corregida +2 h',
    fieldnotes: 'CUEVA Field Notes 03, Architect Edition (2026)',
    red: 'CUEVA PLANO v9, hojas 05 y 14 (red-data.ts de la comunidad)',
    hub: 'Cueva Hub, rama feature/gemelo-vivienda (swarm/ y twin/): neurona, enjambre, diario sellado',
    os: 'CUEVA ORIGEN, mundo Neuronas (os.js) y hoja 13 de CUEVA PLANO v9',
    brand: 'Brandbook CUEVA Master v2',
    patente: 'Patente ES 2 569 130 B1 (2014)',
    ciclo: 'Motor CUEVA Carbono (EN 15804+A2 y EN 15978; transporte según ISO 14083 y GLEC)',
    ipath: 'Catálogo municipal iPath v5.5 (2026)',
    islab: 'Llar de Mar: planos del forjado tipo A y web de i-Slab',
    forjados: 'Planos de forjado: carpeta madre v36 de Piedrahita, planos del forjado tipo A de Llar de Mar y proyecto de ejecución de la vivienda de Madrid (2021)',
    generativa: 'Motor generativo CUEVA (Generativa v7): gramática de 2 plantas × 3 cuerpos × 3 bandas',
    obra: 'Datos de obra y de sistema facilitados por CUEVA (octubre de 2026)',
    reparacion: 'Simulación CUEVA de reparación de redes con acera auxiliar, sobre el catálogo iPath (octubre de 2026); comparación cualitativa, sin cifras',
  },
  MARCA: {
    claim: 'La capa operativa de la nueva construcción.',
    linea: ['Diseñado como software.', 'Construido como arquitectura.', 'Verificado como activo.'],
  },
  TRAMA: { paso: 0.75, f: 'plano' },
  // la serie J (largo × ancho, en metros); J12 está en el catálogo 2026, pendiente de validar
  SERIE_J: [
    { id: 'J1', l: 1.5, a: 1.5, f: 'plano' }, { id: 'J2', l: 3.0, a: 1.5, f: 'plano' }, { id: 'J4', l: 3.0, a: 3.0, f: 'plano' },
    { id: 'J6', l: 4.5, a: 3.0, f: 'plano' }, { id: 'J8', l: 6.0, a: 3.0, f: 'plano' }, { id: 'J10', l: 7.5, a: 3.0, f: 'plano' },
    { id: 'J12', l: 9.0, a: 3.0, f: 'catalogo' },
  ],
  // el motor generativo: una malla de 16,5 × 9 m, 2 plantas, 3 cuerpos y 3 bandas
  GENERATIVA: { plantas: 2, cuerpos: 3, bandas: 3, envolventes: 3355, malla: [16.5, 9.0], f: 'generativa' },
  // cortes de ancho compatibles: mismo largo, anchos reducidos
  CORTES: [0.75, 1.5, 2.25],                                         // fuente: plano
  UNION: { acero: 'S355', tornillo: 'M24 8.8', porNudo: 4, f: 'plano' },
  HORMIGON: { tipo: 'HA-40/P/12/I', f: 'plano' },
  ESPESORES: { min: 80, max: 300, f: 'plano' },
  LUZ: { sinVigas: 'hasta 7,5 m', f: 'obra' },
  PIEDRAHITA: {
    lugar: 'Piedrahita, Ávila', fabrica: 'Plasencia', fechas: 'del 16 al 19 de junio de 2026',
    cifras: [['29', 'piezas'], ['828', 'lecturas'], ['5', 'camiones'], ['43,34 m³', 'de hormigón'], ['136 km', 'de carretera'], ['4', 'días de montaje'], ['4', 'lectores']],
    f: 'piedrahita',
  },
  // las obras, como dossieres: medio principal, galería, cifras y cómo se hizo
  // (el gemelo es una ilustración de la lectura del sistema sobre la foto)
  OBRAS: [
    { k: 'piedrahita', n: 'Piedrahita', lugar: 'Ávila', tipo: 'Vivienda ejecutada', lema: 'De pieza a lugar.',
      d: 'La primera campaña completa con identidad de pieza: fabricada en Plasencia, trazada por carretera y montada pieza a pieza.',
      cifras: [['29', 'piezas', 'piedrahita'], ['828', 'lecturas', 'piedrahita'], ['5', 'camiones', 'piedrahita'], ['136 km', 'de carretera', 'piedrahita']],
      galeria: [['anim', 'La obra, animada'], ['corte', 'Foto y gemelo'], ['img/piedrahita_field', 'La parcela, lista para recibir'], ['img/piedrahita_crane', 'Los muros, en pie y apuntalados'], ['img/piedrahita_lift', 'Una losa, en el aire'], ['img/piedrahita_skeleton', 'El forjado, colocado'], ['img/piedrahita_exterior_a', 'La casa, en estructura']],
      cronica: { t: 'La vida de la #406', f: 'pieza406', filas: [['16 jun, 09:34', 'Primera lectura de la campaña'], ['17 jun, 08:09', 'Sale el camión 2 de 5, con la #406'], ['17 jun, 10:15', 'Llega a la obra tras 2 h 06 min sin lecturas'], ['18 jun, 12:18', 'Se iza: una hora hasta su sitio'], ['19 jun', 'Se certifica su colocación']] },
      enlace: ['#activo', 'Sigue la vida de la pieza #406'] },
    { k: 'llar', n: 'Llar de Mar', lugar: 'Son Parc, Menorca', tipo: 'Promoción residencial', lema: 'Repetir sin borrar.',
      d: 'Dieciséis viviendas aisladas de hormigón y madera sobre forjados de placas, en una isla con licencia territorial: cantera y planta de hormigón propias.',
      cifras: [['16', 'viviendas', 'islab'], ['190', 'piezas en total', 'obra'], ['3.000 m²', 'de placas', 'islab'], ['30 cm', 'de canto', 'islab']],
      galeria: [['anim', 'La obra, animada'], ['video', 'La obra desde el dron'], ['obras/llar_camion', 'Las placas llegan en góndola'], ['obras/llar_losa_415', 'Una losa, izada a su sitio'], ['obras/llar_union', 'Pernos pasantes y placa de unión'], ['obras/llar_madera', 'La vivienda de madera, sobre su forjado'], ['obras/llar_portada', 'La promoción']],
      credito: 'Fotos: @Santylo.ph, sesión de obra para OADAC',
      cronica: { t: 'El forjado tipo A', f: 'islab', filas: [['28 mar 2025', 'Memoria de cálculo del forjado, de 30 cm de canto'], ['6 jun 2025', 'Plano de la losa J10, a escala 1:75'], ['La promoción', '190 piezas en total, en forjados de placas J10'], ['El izado', 'Seis puntos de elevación, con un útil de 6 m'], ['La unión', 'Placas de 400 × 400 mm con cuatro pernos M24: atornillada y soldada, y apoyada en muretes']] } },
    { k: 'navalcarnero', n: 'Madrid', lugar: 'Comunidad de Madrid', tipo: 'Vivienda entre medianeras', lema: 'El sistema no impone un módulo visible.',
      d: 'Una casa profunda ordenada por la luz, el patio, la privacidad y la continuidad interior.',
      cifras: [['396 m²', 'totales de vivienda', 'obra'], ['4', 'niveles', 'fieldnotes'], ['4', 'dormitorios', 'fieldnotes'], ['26,25 m²', 'de patio', 'fieldnotes']],
      galeria: [['anim', 'La obra, animada'], ['corte', 'Foto y gemelo'], ['obras/navalcarnero_exterior', 'La fachada'], ['obras/navalcarnero_threshold', 'El umbral'], ['obras/navalcarnero_patio', 'El patio'], ['obras/navalcarnero_living', 'El salón'], ['obras/navalcarnero_stair', 'La escalera'], ['obras/navalcarnero_pool', 'La piscina']] },
  ],
  // el atlas: las tres plantas a la misma escala sobre la trama de 75 cm (metros)
  ATLAS: {
    f: 'forjados',
    plantas: [
      { k: 'piedrahita', n: 'Piedrahita', w: 10.5, h: 6.0, bandas: [2.25, 2.25, 2.25, 2.25, 1.5], nota: 'Forjado de cubierta: cuatro J8 de 2,25 m y una de 1,5 m' },
      { k: 'navalcarnero', n: 'Madrid', w: 12.16, h: 7.29, bandas: null, nota: 'Planta del proyecto; el despiece no está publicado' },
      { k: 'llar', n: 'Llar de Mar', w: 23.27, h: 7.48, bandas: [2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 1.76, 1.76, 1.75], nota: 'Losa tipo A: ocho J10 de 2,25 m y tres cortes (orden, ilustrativo)' },
    ],
    metricas: [
      ['Planta', '10,50 × 6,00 m', '12,16 × 7,29 m', '23,27 × 7,48 m'],
      ['Módulos de 75 cm', '14 × 8', '16,2 × 9,7', '31 × 10'],
      ['Formato de la serie J', 'J8 a 2,25 y a 1,5', 'Sin dato publicado', 'J10 a 2,25 y cortes'],
      ['Bandas de 2,25 m', '4', 'Sin dato publicado', '8'],
      ['Canto de losa', '26 cm', 'Sin dato publicado', '30 cm'],
      ['Escala de la obra', '29 piezas', '4 niveles', '16 viviendas'],
    ],
  },
  // Piedrahita en cuatro días, en fotos de la obra
  PIEDRAHITA_FOTOS: [['piedrahita_field', 'La parcela, lista para recibir'], ['piedrahita_crane', 'Los muros, en pie y apuntalados'], ['piedrahita_lift', 'Una losa, en el aire'], ['piedrahita_skeleton', 'El forjado, colocado'], ['piedrahita_exterior_a', 'La casa, en estructura']],
  // la vida de una pieza en CUEVA Manager, en orden
  ESTADOS: ['Asignada', 'En fabricación', 'Identificada', 'En almacén de fábrica', 'En transporte', 'En obra', 'Instalada'],
  ROLES: ['Estudio de arquitectura', 'Promotor', 'Fabricante', 'Montador', 'Administración pública', 'Propietario de vivienda'],
  // para quién: qué recibe cada rol y por qué puertas entra (CUEVA ORIGEN, datos.js)
  PARA: [
    { k: 'arquitecto', n: 'Estudio de arquitectura', d: 'Proyecta libre sobre una gramática común y recibe encaje, despiece y secuencia.', puertas: ['Designer', 'Plaza'] },
    { k: 'promotor', n: 'Promotor o propietario de suelo', d: 'Repite aprendizaje, no imagen: coordinación entre unidades y una obra que se puede leer.', puertas: ['Manager', 'Plaza'] },
    { k: 'fabricante', n: 'Fabricante o prefabricador', d: 'Abre un punto de producción con molde, identidad de pieza y control de calidad.', puertas: ['Manager', 'Plaza'] },
    { k: 'montador', n: 'Montador o instalador', d: 'Firma instalaciones verificadas y entra en el directorio de la red.', puertas: ['Manager', 'Plaza'] },
    { k: 'administracion', n: 'Administración pública', d: 'Infraestructura urbana reparable y verificable con iPath.', puertas: ['Plaza'] },
    { k: 'propietario', n: 'Propietario de vivienda', d: 'Una casa con memoria: el pasaporte de cada pieza y el gemelo de su vivienda.', puertas: ['Plaza'] },
  ],
  INTERFACES: [
    { k: 'dashboard', n: 'Dashboard', d: 'Qué se ha fabricado, qué ha salido, qué ha llegado y qué está montado.', estado: 'En desarrollo' },
    { k: 'auditor', n: 'Auditor', d: 'Verifica hitos y el destino de cada partida, para la financiación, la propiedad y el control público.', estado: 'En desarrollo' },
    { k: 'marketplace', n: 'Marketplace', d: 'Componentes, capacidad productiva y material recuperado para un segundo ciclo.', estado: 'Definida' },
    { k: 'comunidad', n: 'Comunidad', d: 'Estudios, fabricantes, montadores e ingenierías sobre la misma gramática. Es la Plaza.', estado: 'En uso' },
  ],
  // coordenadas aproximadas de la ciudad; activos: Madrid (producción) y Menorca (licencia)
  RED: [
    { k: 'madrid', n: 'Madrid', t: 'Punto de producción', est: 'activo', lat: 40.42, lon: -3.70 },
    { k: 'menorca', n: 'Menorca', t: 'Licencia territorial', est: 'activo', lat: 39.95, lon: 4.05 },
    { k: 'barcelona', n: 'Barcelona', t: 'Licencia territorial', est: 'implantacion', lat: 41.39, lon: 2.17 },
    { k: 'valencia', n: 'Valencia', t: 'Punto de producción', est: 'libre', lat: 39.47, lon: -0.38 },
    { k: 'sevilla', n: 'Sevilla', t: 'Punto de producción', est: 'libre', lat: 37.39, lon: -5.98 },
    { k: 'bilbao', n: 'Bilbao', t: 'Punto de producción', est: 'libre', lat: 43.26, lon: -2.93 },
    { k: 'zaragoza', n: 'Zaragoza', t: 'Punto de producción', est: 'libre', lat: 41.65, lon: -0.88 },
    { k: 'coruna', n: 'A Coruña', t: 'Punto de producción', est: 'libre', lat: 43.36, lon: -8.41 },
    { k: 'lisboa', n: 'Lisboa', t: 'Licencia territorial', est: 'libre', lat: 38.72, lon: -9.14 },
    { k: 'malaga', n: 'Málaga', t: 'Punto de producción', est: 'libre', lat: 36.72, lon: -4.42 },
    { k: 'canarias', n: 'Canarias', t: 'Licencia territorial', est: 'libre', lat: 28.29, lon: -16.63 },
  ],
  // cómo se entra en la red: seis pasos (CUEVA ORIGEN, datos.js; el primero, de partida, añadido en la v6)
  PASOS: [
    ['Qué fabricas hoy', '¿Qué componente produces, en qué material y con qué nivel de digitalización y automatización? De ahí sale tu encaje en el sistema.'],
    ['Diagnóstico de planta', 'Se visita la nave y se evalúan superficie, puente grúa, bancadas, curado y acopio.'],
    ['Acuerdo y territorio', 'Se define la comarca en exclusiva, el volumen objetivo y el canon.'],
    ['Moldes y puesta en marcha', 'Llegan moldes y fichas; una serie cero se ensaya y se audita antes de vender nada.'],
    ['Formación del equipo', 'Producción, control de calidad e identidad de pieza, certificados.'],
    ['Primera obra acompañada', 'La primera serie sale con CUEVA en planta y en obra; después, el punto opera solo.'],
  ],
  TRAMOS: [
    { k: 'inst', n: 'Instalador certificado', sub: 'Entra en la red sin inversión industrial.', d: 'Para equipos de montaje que quieren firmar instalaciones del sistema.' },
    { k: 'dist', n: 'Distribuidor', sub: 'Stock, plazo y última milla.', d: 'Para almacenes que quieren servir el sistema a las constructoras de su comarca.' },
    { k: 'prod', n: 'Punto de producción', sub: 'El tramo central del modelo.', d: 'El molde, la nave y el equipo son tuyos; el sistema, la formación y el control de calidad los pone CUEVA.' },
    { k: 'terr', n: 'Licencia territorial', sub: 'El modelo de Menorca.', d: 'Fabricación, montaje y comercialización en exclusiva para un territorio, con marca conjunta.' },
  ],
  PUERTAS: [
    { k: 'nanca', n: 'NANCA', t: 'Licenciataria peninsular', d: 'Casas con sistema, hogares con carácter.', url: 'https://nancananca.com/', img: 'nanca' },
    { k: 'oadac', n: 'OADAC', t: 'Licenciataria insular', d: 'Arquitectura hecha en las islas.', url: '../OADAC_NEW_ERA/index.html', img: 'oadac' },
    { k: 'catalogo', n: 'Catálogo técnico', t: 'Para técnicos', d: 'Piezas, uniones, detalles y cálculo interactivo.', url: '../CATALOGO_CUEVA/index.html', img: 'catalogo' },
    { k: 'ipath', n: 'iPath', t: 'Para la ciudad', d: 'Infraestructura urbana modular y circular.', url: 'https://oadac.github.io/catalogo-ipath-aytos/', img: 'ipath' },
    { k: 'moolde', n: 'mOOlDe', t: 'Encofrado', d: 'Encofrado circular con identidad por panel.', url: 'https://oadac.github.io/moolde2/', img: 'moolde' },
    { k: 'fieldnotes', n: 'Field Notes', t: 'Para arquitectos', d: 'Arquitectura libre sobre una lógica constructiva común.', url: 'https://oadac.github.io/Info_Cueva/', img: 'fieldnotes' },
  ],
  // pendiente de CUEVA: mientras estén vacíos, sus botones no aparecen
  CONFIG: { plaza: '', contacto: 'hola@cueva.info', os: '../CUEVA_WEB/CUEVA_WEB_OS/index.html' },
};

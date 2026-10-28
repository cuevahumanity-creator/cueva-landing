// ─────────────────────────────────────────────────────────────────────
//  CUEVA · catálogo de mundos
//  Ocho mundos de CUEVA en tres categorías: viviendas, industrial e infraestructura. Cada uno con la
//  puerta de entrada que de verdad funciona (comprobada con Chrome el 27/10/2026).
//
//  Campos de cada mundo:
//    k          clave; también el nombre de sus imágenes: assets/mundos/<k>.webp y <k>-1.webp, <k>-2.webp…
//    n          nombre
//    familia    la categoría: Viviendas, Industrial o Infraestructura (la lee la galería para filtrar)
//    tipo       Mundo, Modelo, Simulador o Herramienta
//    d          una frase, sin cifras
//    url        ruta relativa a CUEVA_WEB_PUNTO/index.html (o la dirección pública)
//    img        la miniatura; fotos: cuántos fotogramas tiene para el paso al pasar el ratón
//    etiquetas  en minúsculas, para que el configurador recomiende mundos parecidos a la casa que pides
//    abre       'directo' (doble clic, file://) o 'servidor' (módulos o 3D que necesitan un servidor local)
//    local      la dirección que da su propio arranque, para cuando esta página se abre con doble clic
//    arranque   cómo se arranca ese servidor (se enseña al pasar el ratón; sin nombres de empresa)
//    vivienda   solo los cuatro modelos: lo que dice la ficha del propio modelo (cifras aproximadas del
//               modelo 3D); la usa el configurador para comparar con la casa que pides
//
//  Las carpetas reales están en la url: los cuatro modelos y la nave viven en OADAC_NEW_ERA/mundos,
//  el motor generativo en ClaudeGenerativa-v7 y el forjado sanitario en i-Slab/web.
// ─────────────────────────────────────────────────────────────────────
(() => {
  const MODELOS_ARRANQUE = 'el de los modelos, en el puerto 8790';
  const img = (k) => `assets/mundos/${k}.webp`;

  window.MUNDOS = [
    // ── viviendas: los cuatro modelos, en tiempo real, con sol, acabados y paseo ──
    { k: 'natura', n: 'Natura', familia: 'Viviendas', tipo: 'Modelo', fotos: 4,
      d: 'Dos plantas, planta baja acristalada y una celosía de lamas de madera que envuelve el patio.',
      url: '../OADAC_NEW_ERA/mundos/natura/index.html', local: 'http://localhost:8790/mundos/natura/index.html', arranque: MODELOS_ARRANQUE, abre: 'servidor',
      etiquetas: ['vivienda', 'casa', 'modelo', 'dos plantas', 'tres dormitorios', 'madera', 'lamas', 'celosía', 'patio', 'piscina', 'terraza', 'porche', 'chimenea', 'luz', 'mediterráneo', 'jardín', 'mallorca', 'islas', 'baleares', 'tiempo real', 'paseo'],
      vivienda: { plantas: 2, dormitorios: 3, banos: 2, construida: 176, util: 190, terrazas: 65, estilo: 'volumen de dos plantas con celosía de lamas de madera a doble altura', exterior: ['piscina', 'terraza volada', 'patio de lamas', 'jardín'], interior: ['salón, cocina y comedor en una sola pieza', 'chimenea exenta', 'suite con vestidor'], fuente: 'OADAC_NEW_ERA/mundos/natura/index.html (ficha del modelo)' } },
    { k: 'basic', n: 'Basic', familia: 'Viviendas', tipo: 'Modelo', fotos: 4,
      d: 'Una caja limpia de una sola altura, con el salón abierto al jardín por una gran corredera.',
      url: '../OADAC_NEW_ERA/mundos/basic/index.html', local: 'http://localhost:8790/mundos/basic/index.html', arranque: MODELOS_ARRANQUE, abre: 'servidor',
      etiquetas: ['vivienda', 'casa', 'modelo', 'una planta', 'dos dormitorios', 'estudio', 'despacho', 'pequeña', 'compacta', 'minimalista', 'jardín', 'luz', 'accesible', 'mediterráneo', 'olivos', 'tiempo real', 'paseo'],
      vivienda: { plantas: 1, dormitorios: 2, banos: 1, construida: 75, util: 65, huella: [12.0, 6.3], estilo: 'caja de una altura con paneles lisos y juntas vistas en retícula', exterior: ['jardín', 'parcela con olivos y lavanda'], interior: ['despacho', 'cocina en un frente abierta al salón', 'corredera de gran formato al jardín'], fuente: 'OADAC_NEW_ERA/mundos/basic/index.html (ficha del modelo; superficies aproximadas)' } },
    { k: 'line', n: 'Line', familia: 'Viviendas', tipo: 'Modelo', fotos: 4,
      d: 'Una planta larga de hormigón blanco sobre piedra seca, con porche entre sus alas y piscina.',
      url: '../OADAC_NEW_ERA/mundos/line/index.html', local: 'http://localhost:8790/mundos/line/index.html', arranque: MODELOS_ARRANQUE, abre: 'servidor',
      etiquetas: ['vivienda', 'casa', 'modelo', 'una planta', 'cuatro dormitorios', 'grande', 'familia', 'piscina', 'porche', 'terraza', 'piedra seca', 'hormigón', 'lamas', 'madera', 'mediterráneo', 'pinar', 'accesible', 'tiempo real', 'paseo'],
      vivienda: { plantas: 1, dormitorios: 4, banos: 4, util: 110, huella: [21.1, 6.9], estilo: 'volumen de una planta con paneles de hormigón blanco sobre zócalo de piedra seca', exterior: ['piscina', 'porche entre las dos alas', 'pinar'], interior: ['salón con frente de vidrio y lamas', 'comedor'], fuente: 'OADAC_NEW_ERA/mundos/line/index.html (ficha del modelo; huella aproximada)' } },
    { k: 'myway', n: 'My Way', familia: 'Viviendas', tipo: 'Modelo', fotos: 4,
      d: 'Cubierta a dos aguas, salón a doble altura hasta la cumbrera, altillo y balcón de madera.',
      url: '../OADAC_NEW_ERA/mundos/myway/index.html', local: 'http://localhost:8790/mundos/myway/index.html', arranque: MODELOS_ARRANQUE, abre: 'servidor',
      etiquetas: ['vivienda', 'casa', 'modelo', 'una planta', 'altillo', 'doble altura', 'un dormitorio', 'pequeña', 'cubierta inclinada', 'dos aguas', 'madera', 'balcón', 'porche', 'terraza', 'chimenea', 'ladera', 'piedra seca', 'pinar', 'luz', 'tiempo real', 'paseo'],
      vivienda: { plantas: 1, altillo: true, dormitorios: 1, banos: 2, construida: 81, util: 81, terrazas: 30, estilo: 'volumen a dos aguas de panel de hormigón con gran ventanal en el hastial', exterior: ['balcón de madera volado', 'porche', 'ladera con piedra seca y pinar'], interior: ['salón a doble altura hasta la cumbrera', 'chimenea corrida', 'isla de hormigón y roble'], fuente: 'OADAC_NEW_ERA/mundos/myway/index.html (ficha del modelo)' } },
    { k: 'generativa', n: 'Motor generativo', familia: 'Viviendas', tipo: 'Simulador', fotos: 3,
      d: 'Combina la gramática en casas distintas: una galaxia de conjuntos y cada casa, montada.',
      url: '../../Escritorio/Componentes%20Interior%20Est%C3%A1ndar/ClaudeGenerativa-v7/index.html', abre: 'directo',
      etiquetas: ['generativo', 'simulador', 'vivienda', 'casa', 'configurador', 'una planta', 'dos plantas', 'volúmenes', 'montaje', 'interiores', 'mobiliario', 'energía'] },

    // ── industrial ──
    { k: 'nave', n: 'Nave CUEVA', familia: 'Industrial', tipo: 'Simulador', fotos: 4,
      d: 'Una nave de piezas CUEVA que se configura, se monta con grúa y se recorre a pie.',
      url: '../OADAC_NEW_ERA/mundos/nave/index.html', local: 'http://localhost:8790/mundos/nave/index.html', arranque: MODELOS_ARRANQUE, abre: 'servidor',
      etiquetas: ['industrial', 'nave', 'simulador', 'configurador', 'montaje', 'grúa', 'cubierta', 'fachada', 'madera', 'hormigón', 'muelles de carga', 'placas solares', 'paseo', 'tiempo real'] },

    // ── infraestructura ──
    { k: 'sanitario', n: 'Forjado sanitario', familia: 'Infraestructura', tipo: 'Simulador', fotos: 2,
      d: 'Planta, apoyos, cámara y vuelos de un forjado sanitario, con su despiece y lista de piezas.',
      url: '../../i-Slab/web/index.html?solo=sanitario', local: 'http://localhost:8931/i-Slab/web/?solo=sanitario', arranque: 'el de la web del forjado, en el puerto 8931', abre: 'servidor',
      etiquetas: ['simulador', 'configurador', 'forjado', 'sanitario', 'cimentación', 'despiece', 'vivienda', 'casa', 'hormigón', 'técnico', 'infraestructura'] },
    { k: 'ipath', n: 'Catálogo iPath', familia: 'Infraestructura', tipo: 'Herramienta', fotos: 3,
      d: 'El catálogo municipal de infraestructura urbana modular y circular, del diagnóstico al diseño.',
      url: 'https://oadac.github.io/catalogo-ipath-aytos/', abre: 'directo',
      etiquetas: ['ipath', 'ciudad', 'urbano', 'infraestructura', 'aceras', 'parques', 'catálogo', 'administración', 'circular', 'configurador'] },
  ];
  for (const m of window.MUNDOS) m.img = img(m.k);
})();

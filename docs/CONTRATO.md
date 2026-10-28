# Contrato de los capítulos 3D

La página es `index.html`. Hay un solo renderer de three.js (r180, `vendor/three.js`, script clásico: `window.THREE`) para toda la página. Lo lleva `js/nucleo.js`.

Cada sección con `data-cap="id"` es un capítulo:
- su escena se monta cuando se acerca a la pantalla;
- se dibuja mientras es la sección que más pantalla ocupa;
- su avance `u` (de 0 a 1) sale del scroll, ya suavizado;
- el lienzo vive dentro de su `.fijo` (sticky, 100 vh).

Los textos ya están escritos en `index.html`: son los `.beat` con `data-en="a b"`, que el núcleo enciende entre `u = a` y `u = b`. **Tu escena tiene que contar lo mismo que dicen esos textos y dejarles sitio.** Si el texto está en `.izq`, el protagonista va en el tercio derecho, y al revés con `.der`. Si está en `.arriba` o en `.abajo`, el protagonista va centrado y deja libre esa franja.

## Qué escribes
Solo tu archivo, `js/cap/<id>.js`. No toques ningún otro archivo. Si crees que hace falta un cambio fuera de tu archivo, dilo en tu informe final.

```js
// Capítulo «<id>»: … (cabecera en español: qué cuenta la escena, paso a paso)
CUEVA.capitulo('<id>', (ctx) => {
  const { T3, E, mezcla, tramo, COL, esmalte, brilloPropio, estudio, punto, cuerda, mirar, distancia, DATOS } = ctx;
  const escena = new T3.Scene(), camara = new T3.PerspectiveCamera(30, 1, 1, 10000);
  const plato = estudio(escena);            // foco cenital con sombras, recorte frío, suelo oscuro y niebla
  // … construye todo aquí, una vez
  return {
    escena, camara,
    medir(W, H) { /* reencuadra para el aspecto nuevo; en vertical (W < H), aléjate o recoloca */ },
    actualizar(u, reloj, dt) { /* todo depende de u (y del reloj para lo que respira); sin crear objetos */ },
  };
});
```

## Lo que te da `ctx`
- `T3`: three.js.
- `E`: curvas de animación.
  - `eo`, `eo5`, `ei`, `eio` y `seno`;
  - muelles `rebote`, `vivo`, `suave` y `firme`, que pasan de 0 a 1 con rebote;
  - `muelle(z, w)` para hacer muelles a medida.
- `mezcla(a, b, u)` y `tramo(t, a, b)`: este último devuelve la posición de t entre a y b, limitada a [0, 1].
- `COL`: la paleta de la marca, en hex numérico: noche, blanco, tinta, cian, menta, ion, coral, ámbar, niebla y cuerda.
- `esmalte(hex, opciones)`: MeshPhysicalMaterial con clearcoat, el material de las letras y piezas de la apertura. `brilloPropio(hex)` añade emisivo suave, para las piezas de color de noche.
- `estudio(escena, { suelo, niebla, foco })`: el plató de la apertura.
  - Devuelve `{ clave, contra, suelo, enfocar(x, y, z, d) }`.
  - Llama a `enfocar` cada vez que muevas la cámara, con `d` igual a la distancia de cámara: así recoloca el foco, la luz de recorte y la niebla.
- `punto(escena)`: el punto ámbar (esfera + luz + halo). Devuelve `{ grupo, esfera, luz, halo, mat, poner(x, y, z, radio, brillo) }`.
  - Es el hilo conductor de toda la página: debe aparecer en tu escena con un papel claro.
  - Por ejemplo: el que enciende la trama, el que lee la pieza, el que salta de nodo en nodo.
- `cuerda(escena)`: una línea fina con `tender(a, b, comba, vibración)` (a y b son Vector3). Las cuerdas y las grúas son el otro motivo de la apertura.
- `mirar(camara, x, y, z, d, lado, el)`: pone la cámara a distancia d, girada `lado` radianes en horizontal y elevada `el`.
- `distancia(camara, alto, ancho)`: la distancia a la que cabe ese alto, o ese ancho, en pantalla.
- `DATOS` (`js/datos.js`), `window.PIEZA406` (`js/datos406.js`, las 33 lecturas reales de la #406) y `window.CONTORNO` (`js/contorno.js`, polígonos lon/lat de la península y las islas).

## El aspecto: el de la apertura
Mira `js/cap/apertura.js`: es la referencia de calidad y de estilo.
- **Fondo y suelo:** noche #05070A, con un charco de luz del foco en el suelo.
- **Materiales:** esmalte blanco (`COL.blanco`) con cantos redondeados (ExtrudeGeometry con bisel), sombras reales y luz de recorte fría.
- **El color:** pocas cosas de color, y con sentido.
  - Ion (#0EA5E9) y cian para datos y piezas.
  - Menta (#00D4AA) para lo verificado.
  - Coral (#FF6B4A) solo para lo roto.
  - Ámbar solo para el punto.
- **El movimiento** tiene referencias Pixar: anticipación, muelles que se pasan un poco, peso, cuerdas que se tensan y la cámara que respira. Nada lineal ni mecánico.
- **La cámara:** perspectiva con un poco de lado y algo de elevación. Nunca planos totalmente frontales y quietos.

## Normas
- **Nada de texto en 3D.** Los textos son los del HTML. Si necesitas una marca pequeña (una cota, un número), dibújala en un CanvasTexture con Inter. Sin mayúsculas sostenidas ni separadores «·».
- **Ninguna cifra sin fuente:** si la escena enseña un número, tiene que estar en `DATOS` o en `PIEZA406`. Lo simulado se dice como simulado.
- **Prohibido:** blockchain, token, DAO, «Logistik», −85 % CO₂, 185 €/m² y 966.000 M€. Las uniones nunca «todo atornillado»: pueden ir atornilladas, soldadas o apoyadas. El punto de producción es Madrid.
- **Rendimiento:** 60 fps en un portátil decente.
  - Como máximo unas 80 llamadas de dibujo y 300.000 triángulos.
  - Sin crear objetos ni geometrías en `actualizar` (reutiliza vectores).
  - Usa InstancedMesh si hay muchos elementos.
  - Sombras solo en lo que las necesita.
- **Móvil:** en vertical (390 × 844) el protagonista tiene que caber y no taparse con el texto (en vertical, los `.izq` y los `.der` bajan al pie de la pantalla).
- **Robustez:** `u` puede saltar de golpe (un enlace a la sección). La escena tiene que ser una función de `u` (más el reloj para lo que respira), nunca acumular estado.
- **Comentarios** en español, en el tono de `apertura.js`.

## Cómo probar
- Abre `index.html` con doble clic: funciona por file://.
- **Capturas:**
  ```
  python herramientas/capturar.py <tu_carpeta_del_scratchpad> <prefijo> id:0.1,id:0.3,... [ancho alto]
  ```
  Haz capturas a 1440 × 900 y a 390 × 844. Míralas de verdad (léelas como imagen) y corrige lo que se vea mal.
- La herramienta imprime los errores de la consola: tienen que salir «ninguno».
- No lances varias pruebas de navegador a la vez desde el mismo agente.

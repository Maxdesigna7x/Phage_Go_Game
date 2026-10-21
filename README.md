# Phage-Go!

Juego táctil sobre el ciclo lítico de un bacteriófago. No necesita instalar dependencias.

La referencia de jugabilidad vigente, incluidos los cinco minijuegos de nucleótidos y su orden por infección, está en [docs/estado-actual.md](docs/estado-actual.md).

```bash
python3 -m http.server 8873
```

Abre http://localhost:8873. Para probar en tablet o móvil en la misma red, usa la dirección local del ordenador.

El tablero ocupa toda la pantalla horizontal, tanto en tablet 4:3 como en móvil panorámico, sin fijarlo a 16:9 ni añadir bandas. En vertical se pausa y aparece un aviso para girar la pantalla con `Story.webp` de fondo; si el bloqueo inicial permanece activo en horizontal antes de entrar en pantalla completa, el aviso muestra `Intro_back_V2.webp` de fondo. En móviles se ofrece pantalla completa; también puedes continuar en horizontal si prefieres o si el navegador la rechaza. Los controles respetan los márgenes seguros del dispositivo. El botón **Menú** está disponible durante la partida.

## Controles

Toca cualquier zona libre y desliza: el punto inicial es el origen y el desplazamiento determina dirección e intensidad. No hay joystick visible. Al soltar, el fago conserva su inercia. Puedes usar **Adherirse** con otro dedo.

Basta acercarse a una bacteria compatible y pulsar **Adherirse**. El fago se coloca automáticamente; sus fibras permanecen quietas durante la adhesión y la inyección. Mantén pulsado para **inyectar ADN**.

En ordenador: flechas o WASD y Espacio. La tarjeta «Mover» alterna movimiento simple y rotación con propulsión.

Con teclado, Tab recorre los controles y Enter o Espacio activa el control enfocado. En ADN, selecciona una copia; en nucleótidos, las teclas A/T/C/G responden a los juegos de pulsar y memoria, 1–4 intercambian fichas en ordenar, las flechas o A/D mueven la cesta en atrapar y Tab permite elegir fichas o destinos en los juegos restantes. El foco de teclado se marca en amarillo. Mantener Enter o Espacio sobre el control de inyección transfiere ADN; en lisis, pulsa varias veces. Escape vuelve al menú.

## Carga priorizada de recursos

La carga inicial está optimizada para mostrar de inmediato el fondo correspondiente a la orientación del dispositivo y evitar contención de ancho de banda en GitHub Pages:

1. **Fondo inicial de bloqueo y portada (`fetchpriority="high"`):** `index.html` precarga únicamente la imagen de la orientación activa mediante `<link rel="preload" media="...">` y `<picture>` (`Story.webp` en vertical e `Intro_back_V2.webp` en horizontal). Los scripts se cargan con `defer fetchpriority="low"` y las fuentes web (`Nunito` y `Lilita One`) se activan tras cargar el fondo y el menú (`.fonts-ready`), evitando que `world-shapes.js` o las tipografías retrasen el primer fondo visible.
2. **Menú y precarga de iconos (`MENU_ASSETS`):** En entrada vertical, `loadImages()` completa primero `Story.webp` y acto seguido descarga en paralelo `Intro_back_V2.webp`, `Title.webp`, `phage_easy.webp` y `phage_hard.webp`. El lienzo pinta el fondo del menú y el título en cuanto llegan.
3. **Botones de modo ocultos durante la carga:** El contenedor `#menuButtons` permanece oculto (`.hidden`) y deshabilitado mientras se descargan los 83 recursos del juego (`EARLY_ASSETS` y el resto del catálogo en una cola continua de 4 workers sin pausas intermedias). Cuando `gameReady` pasa a `true`, se oculta `#loading` y aparecen los dos botones de modo (**Fácil** y **Difícil**) con sus iconos ya en caché. Un recurso esencial que falle muestra **Reintentar**; las decoraciones y fuentes tienen alternativas para permitir jugar.

## Ciclo y continuidad

Cada partida genera una semilla aleatoria nueva para el mundo y el fondo. La semilla se mantiene al explorar, volver a una zona y completar ciclos de infección.

- Duplica el ADN hasta cinco copias. Cada copia activa uno de los cinco minijuegos de nucleótidos: aparecen todos en un orden aleatorio por bacteria.
- Completa la secuencia arrastrando, pulsa las letras pedidas de una en una, ordena las cuatro fichas, atrapa las bases que caen o memoriza y repite el patrón. La descripción de controles está en [docs/minijuegos-nucleotidos.md](docs/minijuegos-nucleotidos.md).
- La maquinaria bacteriana fabrica las piezas. Guarda el ADN en la cabeza y ensambla cabeza, cola y fibras.
- Completa la lisis con diez pulsaciones o toques en cualquier parte de la pantalla. La barra no retrocede. La destrucción recorre todos los assets intermedios y la explosión final; una transición breve evita saltárselos al pulsar muy rápido.
- La bacteria se acerca y gira suavemente al entrar. La inyección y los minijuegos comparten el mismo asset interior, escala y centro.
- Tras la lisis salen 18 fagos. La cámara sigue al más rápido y se aleja gradualmente hasta devolverte el control de ese mismo fago, sin cambiar su posición. Ambos modos continúan explorando después de cada ciclo.

No hay cuenta atrás por infección. Difícil conserva el reto global de diez minutos de simulación activa. La física avanza en pasos de 1/60 s a cualquier frecuencia de render. Cada frame recupera como máximo 250 ms de un bloqueo largo; el exceso tampoco consume el cronómetro ni el bonus de lisis. Girar a vertical, salir de la pestaña o abrir el panel de sonido pausa el mundo, incluidas las burbujas explotadas. Al volver no se recupera el tiempo de pausa.

Las ayudas de ADN y ensamblaje usan un glow pulsante siguiendo la silueta del sprite. En ensamblaje se ilumina solo la pieza que se mueve; al agarrarla, la ayuda cambia a su destino. Los fagos construidos nadan por el interior y se separan entre sí.

## Mundo y rendimiento

Fuera de las bacterias puedes explotar burbujas. Solo se muestra el multiplicador animado sobre el fago; el total de burbujas no se dibuja. Diez burbujas con menos de 3,5 segundos entre ellas activan ocho segundos de superenergía: el fago acelera y su velocidad máxima aumenta un 65 %, con un efecto suave en los bordes de la pantalla. Cada burbuja adicional renueva la energía. Infectar una bacteria cancela el efecto, conservando el total de burbujas. Los aros se han eliminado.

Las tres capas de fondo conservan los colores originales y la composición con transparencia del aspecto anterior. Se descartó el tinte azul uniforme. La profundidad aumenta por capa, manteniendo un tamaño similar dentro de cada una (±7 %), independientemente de las dimensiones del asset. Se usan los ocho sprites originales de fondo. Las burbujas y los tres fotogramas de los fagos se almacenan una vez, sin filtros por fotograma.

Un grupo fijo de seis escenas ambientales muestra fagos nadando, infectando bacterias y saliendo de ellas. Solo existen en las capas del fondo: no afectan a colisiones, objetivos, puntos ni bacterias jugables. Las escenas ocupan las mismas posiciones que la decoración, sustituyéndola sin dibujar bacterias duplicadas. Cada posición tiene margen para evitar solapamientos dentro de su capa. Los fagos nadan siguiendo curvas, miran en la dirección de avance, animan sus fibras al nadar y giran suavemente para posarse. Solo se conserva la vecindad visible de cada capa; no se mantiene un historial del mundo recorrido. Las partículas de primer plano también tienen un límite.

## Verificación

```bash
node --test tests/game.test.cjs tests/sound.test.cjs
python3 -m pip install -r requirements-dev.txt
python3 scripts/check_assets.py
```

Las pruebas cubren acople, control multitáctil, lisis, ADN y empaquetado, continuidad de cámara y posición, escenas ambientales, pausa, adaptación a distintas proporciones de pantalla, menú y pantalla completa. La respuesta táctil y el rendimiento final deben comprobarse también en dispositivos reales.

Con un servidor en el puerto 8765 y Playwright disponible, `node tests/browser-enemies.cjs` y `node tests/browser-audit.cjs` prueban render, captura, empujes, un ciclo completo por teclado, dos toques simultáneos y fallos de carga. `PHAGE_CHROME_PATH=/ruta/a/chrome` permite usar un Chrome ya instalado. La CI verifica lógica, recursos y regeneración idéntica de `world-shapes.js`. El detalle de cada decisión de la auditoría está en [docs/REVISION-AUDITORIA-2026-10-20.md](docs/REVISION-AUDITORIA-2026-10-20.md).

## Publicación

La aplicación se publica mediante GitHub Pages desde la raíz de la rama `main`: https://maxdesigna7x.github.io/Phage_Go_Game/

## Nuevos sprites

El ensamblaje usa `Phage_phase_1.webp` al empaquetar ADN, `Phage_phase_2.webp` al unir cabeza y cola, y `Phage_phase_3.webp` al completar las fibras. Comparten lienzo de 354×469 y se conservan sus márgenes para mantener alineadas las piezas entre fases.

Las reglas y el comando de conversión de imágenes están en [AGENTS.md](AGENTS.md). Los WebP nuevos se generan con calidad 90, método 6, transparencia y dimensiones originales.

## Efectos de sonido

El botón provisional de sonidos se ha retirado. Se conserva la selección de efectos guardada en el navegador; los valores predeterminados se definen en `audio/settings.json`. No hay música ni ambientes continuos de fondo. Se carga bajo demanda la versión comprimida más pequeña compatible de cada efecto. Ver [audio/README.md](audio/README.md) para el formato de configuración.

Las bacterias de infección usan el interior y las seis fases exteriores de `assets_webp/new_size/`, convertidas desde los PNG de lienzo compartido 1001×535. El centro, la escala y los márgenes se conservan al cambiar de fase; los restos finales se expanden dentro del mismo lienzo. Esto también se aplica a los ciclos de infección del fondo.

## Células y colisiones

El mundo combina 50 % de posiciones no bacterianas, 25 % de bacterias sanas y 25 % de bacterias rotas. Incluye tres variantes de cada familia celular, información al chocar y glow rojo para elementos incompatibles. Las plaquetas reciben empujones, giran y frenan con resistencia. Las colisiones siguen campos precalculados de alfa, incluidos entrantes y huecos. La brújula usa icono de bacteria y flecha; la etapa activa se muestra a más del doble del tamaño de las restantes.

La distribución visible puede variar con la cámara y el ciclo de infección. Los tamaños son una adaptación jugable. Decisiones de planos, tamaños, conversión y validación en [docs/PLAN-MUNDO-CELULAS.md](docs/PLAN-MUNDO-CELULAS.md).

## Macrófago en modo difícil

Solo el modo difícil incorpora un macrófago cercano. Patrulla, detecta al fago, lo persigue y abandona el objetivo si se aleja. Antes de cerrar sus prolongaciones muestra una zona de captura durante 1,15 s. Un roce desplaza al fago; la captura requiere permanecer en la copa durante el cierre. La inyección, los minijuegos y el escape suspenden la amenaza, con tres segundos de protección al volver al vuelo.

El macrófago aparece completamente fuera de cámara: se comprueba el lienzo entero de sus imágenes, con rotación, escala, zoom y margen adicional. Si no hay un lugar exterior libre, la aparición se pospone. Al acercarte, un glow rojo en el borde señala su dirección y se intensifica con la proximidad a su membrana. Se oculta durante la protección y las fases interiores.

El macrófago empuja plaquetas, otras células y bacterias al desplazarse, con masas, freno y transferencia de empujes. La bacteria objetivo está protegida. Los cuerpos conservan su posición mientras permanecen en la vecindad activa. La captura muestra Game Over y permite volver al menú con un toque/clic o automáticamente tras seis segundos.

Animación y conducta en `enemies.js`; originales de lienzo compartido en `assets/macrofago/` y tres WebP en `assets_webp/macrofago/`. Las siluetas se regeneran con `python scripts/build_collision_shapes.py`. Detalles y validación en [docs/macrofago-gameplay.md](docs/macrofago-gameplay.md).

Pruebas automáticas: `node --test tests/game.test.cjs tests/sound.test.cjs`. La prueba opcional `node tests/browser-enemies.cjs` requiere Playwright y Chromium, y un servidor local en el puerto 8765; admite `PHAGE_TEST_URL` y `PHAGE_TEST_OUTPUT`.

# Macrófago: implementación y validación

Implementado exclusivamente en modo difícil. Fácil conserva su juego sin enemigos. Los protistas propuestos anteriormente siguen siendo conceptos y no forman parte de este enemigo.

## Conducta

Un solo macrófago por vecindad activa. La primera aparición espera cuatro segundos. Busca posiciones desde 780 unidades, ampliando el radio en pasos de 180 dentro de la vecindad activa. Debe estar libre de obstáculos y completamente fuera de la cámara real: se proyecta el lienzo completo de las tres imágenes, con rotación, escala y zoom, y se exige un margen adicional de 96 unidades de pantalla lógica. No basta con ocultar su centro. Si no hay posición válida, reintenta más tarde. Patrulla a 48 unidades/s y persigue a 155, frente al máximo de 430 del fago. Detecta a 760 unidades; para abandonar debe perder al jugador a más de 1100 durante 2,4 segundos. También limita su alejamiento del área de patrulla. Vuelve a su zona antes de patrullar de nuevo.

Un resplandor rojo periférico señala la dirección desde la posición real del fago al enemigo, aunque la cámara todavía esté siguiendo al jugador. La dirección se proyecta hasta el borde, incluidas diagonales. La intensidad aumenta suavemente al acercarse a la membrana: comienza a 1050 unidades de distancia de superficie y alcanza su máximo a 180. Se dibuja sobre el fondo y la energía, debajo del HUD; no tapa toda la pantalla ni convierte al enemigo en objetivo de la brújula. Solo aparece en vuelo difícil y se oculta durante la protección y el ciclo interior.

Se orienta mediante giros limitados. Al acercarse la copa al jugador, anuncia el cierre durante 1,15 segundos con texto y un círculo discontinuo en la región de captura. La orientación del ataque queda fijada, por lo que se puede esquivar. El cierre dura 0,65 segundos y exige una permanencia continua de 0,24 segundos en una región de radio 88. Salir de ella reinicia la acumulación. Tocar el resto de la membrana empuja, sin captura instantánea. Tras fallar se recupera durante dos segundos.

El acople, la inyección, todos los minijuegos, la lisis y el escape congelan la amenaza. Al volver al vuelo hay tres segundos de protección. La pausa del navegador, la orientación y las restricciones de pantalla completa usan el mismo mecanismo existente y congelan también el ataque. Los intervalos son reglas de juego, no tiempos biológicos.

## Empujes aprobados

Se amplía la física existente a bacterias y todas las familias celulares. El enemigo aplica fuerza limitada en su dirección de marcha tanto en patrulla como en persecución. Las plaquetas tienen menor masa y los cuerpos grandes se desplazan más lentamente. Hay freno, límites de velocidad, contactos por silueta alfa y transmisión de impulsos entre cuerpos vecinos. El enemigo espera espacio mientras empuja y rodea la bacteria protegida.

El jugador sigue pudiendo empujar directamente las plaquetas; la fuerza del enemigo es la que activa el movimiento adicional de los cuerpos pesados. La bacteria objetivo no recibe empujes ni transferencia de impulsos. Mientras se resuelve el ciclo no se simula desplazamiento de estos cuerpos.

Las bacterias y células reutilizan su identidad por coordenadas de casilla, evitando que vuelvan a su casilla al actualizar el mundo. También se conserva la posición real de los restos al terminar la infección. Al abandonar la vecindad se liberan esos cuerpos; no se mantiene un historial ilimitado. Las proporciones de generación por bloque permanecen en una bacteria sana, una rota y dos células.

## Animación y archivos

Herramienta integrada de generación de imágenes. Se reutilizó el concepto `assets/depredadores_fagos/macrofago_01.png` como fase abierta y se generaron dos ediciones alineadas: reposo y cierre. Prompts exactos y manifiesto en `assets/macrofago/`. Originales y WebP comparten lienzo de **1254×1254**, sin recorte ni recentrado independiente; se conserva el alfa completo. Se revisó visualmente el WebP y se verificó igualdad de dimensiones y alfa con los PNG.

Conversión: `python scripts/convert_assets.py --output-dir assets_webp/macrofago assets/macrofago/macrofago_idle.png assets/macrofago/macrofago_reach.png assets/macrofago/macrofago_closed.png`. Usa Pillow, RGBA, WebP con pérdida, calidad 90, método 6 y exact=True. Tamaños: reposo 147670 bytes, apertura 192388 bytes y cierre 145576 bytes.

Las fases se interpolan mediante un único lienzo auxiliar reutilizable de 512×512 y composición de alfa premultiplicado. Es una caché de dibujado, no un cambio de resolución de los originales o los WebP. Los campos de distancia se precalculan desde alfa ≥48 y el script incluye ahora `assets_webp/macrofago/`; no se leen píxeles por fotograma.

## Fin de partida

La captura guarda la última pose del fago, lo contrae hacia la copa y presenta una pantalla **GAME OVER** con motivo, puntos y bacterias destruidas. Se detiene el movimiento y no se siguen acumulando acciones. El botón Volver al menú admite clic y toque; el retorno automático ocurre a los seis segundos, respetando las pausas. El menú y el siguiente inicio limpian todos los enemigos y la captura anterior. El fin por tiempo del modo difícil sigue su pantalla anterior.

## Verificación

- La suite global actual tiene 119 pruebas de juego y sonido. Incluye cobertura del macrófago para modos, aparición segura y limitada, detección, pérdida del objetivo, aviso, esquiva, captura sostenida, roces inocuos, pausa, protección durante cada fase, Game Over y regreso al menú, además de las regresiones del ciclo lítico, controles y sonido.
- Apariciones completamente exteriores en proporciones de escritorio, tablet y móvil, con cámara desplazada, zoom y rotaciones; espera si no hay sitio exterior libre. Aviso periférico en cuatro direcciones y diagonal, intensidad por cercanía y suspensión por protección/estado/modo.
- Empujes de plaquetas, células grandes y bacterias sanas/rotas a velocidades de patrulla y persecución; transmisión entre cuerpos; objetivo anclado; conservación de posiciones al regenerar la vecindad y al finalizar un ciclo.
- Navegador Chromium con imágenes y fuentes reales en escritorio 1440×900 y móvil táctil 844×390. Prueba de fácil sin enemigos, aparición en difícil, aviso, escape mediante arrastre táctil, captura, vuelta al menú por botón y automática, y empuje de una bacteria. Comprobación de errores JavaScript y recursos HTTP.

Las pruebas de navegador usan avance de animación controlado para reproducir los escenarios; no sustituyen una sesión prolongada en un teléfono físico. Las capturas de comprobación se guardan en `tmp/browser-enemies/` y algunas se conservan en `docs/previews/`.

# Comprobación y aplicación de la auditoría

## Estado actual de la aplicación

Este informe conserva la instantánea de auditoría tomada antes de la versión publicada 2026.10.20-52. Sus cifras de pruebas, inventario de WebP y frases de publicación describen aquel corte, no el estado vigente. Desde entonces, la versión actual tiene 119 pruebas automatizadas, 84 WebP revisados por el comprobador de recursos y 40 campos alfa/SDF; la CI y la publicación de GitHub Pages están completas. El juego publicado está en [GitHub Pages](https://maxdesigna7x.github.io/Phage_Go_Game/) y su guía actual está en [docs/estado-actual.md](estado-actual.md).

Revisión del 20 de octubre de 2026 sobre el código de trabajo de Phage-Go!, comparado con `794a94a9eecc686cca1566515c31196a2b871d0c`. Sus hallazgos corresponden a la versión anterior.

Antes de editar, las 76 pruebas originales pasaban y las sondas entregadas reprodujeron sus observaciones. El árbol local solo tenía cambios de permisos en archivos existentes; se conservaron. El informe acierta en los fallos de lógica. Sus estimaciones de memoria y propuestas de rendimiento no equivalen a mediciones de GPU, FPS o latencia de un teléfono.

## Hallazgos funcionales

| ID | Verificación y decisión | Resultado y comprobación |
| --- | --- | --- |
| F01 | Confirmado: 20 frames de 50 ms simulaban 0,66 s mientras difícil consumía 1 s. Corregido. | Acumulador de pasos de 1/60 s. Un frame recupera hasta 250 ms; se descarta el exceso para física **y** cronómetros. Difícil y bonus de lisis usan tiempo simulado. A 20/30/60/120 FPS, un segundo produce el mismo tiempo, movimiento y consumo del reto. Pausas de 30 s no generan recuperación masiva. |
| F02 | Confirmado para cámara, giro y amortiguamiento. Corregido. | Coeficientes dependientes de `dt` para cámara, giro simple/táctil, ADN, partículas y contención suave. El paso fijo mantiene las separaciones y correcciones físicas a frecuencia constante. Las interpolaciones por progreso de animación se conservan. Regresión directa de cámara/frenado y equivalencia de movimiento entre frecuencias. |
| F03 | Confirmado: otro dedo cambiaba o soltaba el arrastre. Corregido. | `mouse.pointerId` identifica al propietario. Otro down/move/up/cancel no altera su objeto. Regresiones VM y eventos multitáctiles de Chrome con dos identificadores. Se mantiene movimiento y acción independientes en vuelo. |
| F04 | Confirmado: perder captura no cancelaba el arrastre. Corregido. | Cancelación común por propietario para pérdida de captura, cancelación, pausa y transición. Vuelve a la posición al agarrarlo; también restaura la pareja unida que se hubiera desplazado. No encaja una pieza al cancelar. Un up normal seguido de lostcapture genera un solo drop. |
| F05 | Confirmadas 18 repeticiones del hash en 40 401 casillas. Corregido el uso como identidad. | IDs `gx:gy` en organismos, conservación y bacterias infectadas. La semilla sigue definiendo apariencia y distribución. La regresión fuerza el mismo hash para todas las casillas y verifica identidades e infecciones independientes. Se conserva el mezclador para no redistribuir el mundo por un cambio innecesario. |
| F06 | Confirmado: un cuerpo cercano desplazado desde un origen lejano desaparecía. Corregido. | Primero conserva instancias por posición real, con histéresis de una casilla. Sus IDs reservan el origen y evitan duplicados mientras sigan cargadas. Se liberan al alejarse de su posición real. Regresiones para bacteria sana, restos, célula y plaqueta, más las pruebas existentes de empujes y fin de ciclo. No se guarda un historial ilimitado de cuerpos. |
| F07 | Confirmada la política de bloqueo; la incidencia depende del navegador. Corregido. | Un rechazo permite seguir en horizontal. Hay opción explícita de continuar y opción de reintentar fullscreen. Se mantiene la pausa vertical. Probados rechazo, éxito, salida y API ausente en lógica; rechazo también en Chrome móvil emulado. WebKit y gestos de sistema requieren hardware compatible. |
| F08 | Confirmado: el inicio antes de cargar se perdía al inicializar. Corregido. | Botones deshabilitados desde HTML y guardia `gameReady` en código. Progreso de carga y una inicialización única. Red detenida artificialmente en Chrome comprueba que iniciar antes no cambia el estado. |
| F09 | Confirmado: colisión reach durante cierre e idle al comenzar recuperación. Corregido con SDF discretos. | `macrophagePose` deriva mezcla, SDF dominante y disponibilidad del sensor desde la misma animación. Captura exige permanencia de 0,24 s **y** mezcla cerrada ≥85 %. La copa controla la permanencia durante el cierre sin que la membrana expulse antes al ocupante. Salir reinicia el contador. Recuperación comienza con collider cerrado. Se conservan advertencia de 1,15 s y duraciones de cierre/recuperación. Pruebas de captura, escape, pausa y render. `debugMacrophageCollision=true` muestra muestras del contorno, sondas y sensor; no lee píxeles. La mezcla de opacidades continúa siendo una aproximación, no una deformación física exacta. |
| F10 | Confirmado: faltaban las tres máscaras del enemigo. Corregido. | Máscaras precalculadas con halo rojo explícito, limitado por las cachés existentes. Verificado visualmente en escritorio/móvil emulado. El enemigo sigue fuera de brújula y de Infectar. Los glows de ensamblaje siguen dorados. |
| F11 | Confirmada la caducidad por reloj de pared. Elegida congelación del mundo. | Las burbujas reaparecen a los 12 s simulados. Pruebas para pestaña, orientación y panel de sonidos. Energía y combo conservan sus duraciones. |
| F12 | Confirmados botones obsoletos entre transición y render. Corregido. | Invalida controles Canvas y DOM en transiciones, reinicios y resize. Los callbacks validan estado. Un botón que vuelve al menú no captura el puntero en la pantalla nueva. Pruebas con eventos sin render intermedio. |
| F13 | Confirmado por flujo y por fallos provocados de red. Corregido. | Dos intentos por imagen, con timeout de 10 s por intento. Decoraciones explícitamente opcionales usan un lienzo transparente; fuentes tienen fallback y espera máxima de 1,5 s. Los recursos de juego esenciales muestran error y Reintentar. Conserva imágenes cargadas; un reintento no duplica el bucle. Probados timeout, errores de fuentes, fallo decorativo y recuperación de uno esencial. Se pospone carga por fases/modos: requiere diseño y medición adicionales. |
| F14 | Confirmada carencia semántica. Implementada alternativa por teclado. | `controls.js` mantiene botones DOM con foco visible y nodos estables por identidad sobre controles y minijuegos. Tab, Enter y Espacio seleccionan ADN, nucleótido/destino y pieza/destino; hay activación de lisis y regreso de Game Over. Mantener una tecla sobre acción permite inyectar, y keyup la libera aunque cambie el nodo por una transición. Una región de estado anuncia cambios y selecciones, no cada frame. El Canvas sigue recibiendo ratón y toque. Probado el ciclo en Chrome mediante teclado, incluidas adhesión e inyección, y activación sin acción global duplicada. Esto no certifica compatibilidad completa con todos los lectores de pantalla. |
| F15 | Confirmado: la zona segura era toda la ventana. Implementado soporte de insets. | `viewport-fit=cover`, sonda CSS `env(safe-area-inset-*)` y conversión a coordenadas lógicas al redimensionar. HUD y controles superiores respetan insets. Regresión con insets distintos en cada lado. No se añade `visualViewport` sin un caso concreto. Pendiente comprobar recortes físicos y Safari móvil. |
| F16 | Confirmado: ocho solicitudes viejas sonaban juntas al resolver el buffer. Corregido. | Caducidad de 250 ms para efectos transitorios y 1,5 s para hitos; previews 2 s. Una solicitud pendiente por grupo se sustituye por la más reciente. Loops conservan cancelación por acción/epoch. Desactivar un sonido cancela también solicitudes pendientes, aunque luego se reactive. Pruebas con decodificación demorada, grupos, menú y finales importantes. |
| F17 | Confirmado el uso de “infestar” y la misma orden en fases diferentes. Corregido donde correspondía. | Prompts centralizados de Adherirse, inicio de inyección e Inyectar ADN; tildes e instrucciones de teclado. En las familias actuales el nombre no está duplicado dentro de `info`, por lo que no se reescribió esa plantilla. Se conserva que las plaquetas son fragmentos y que la incompatibilidad corresponde al fago del juego. |

## Optimizaciones y organización

| ID | Decisión |
| --- | --- |
| O01 | Aplicación parcial con evidencia: se retiran del manifiesto `phage` y `bubble`, sin referencias de dibujo; el fago usa `phageSprite` y las burbujas un raster generado. Se conservan los archivos. En esta instantánea el inventario era de 76 WebP y 107,94 MiB RGBA estimados, sin contar superficies auxiliares ni audio; la comprobación actual registra 84 WebP. Carga por fases y reducción de resolución se posponen hasta medir inicio y memoria en hardware. No se cambian lienzos ni tamaño de recursos. |
| O02 | Mantener el único canvas reutilizado de mezcla. No hay medición que justifique un atlas precalculado, más superficies o cuantizar la animación. Las hojas nuevas tampoco están listas para sustituirlo. |
| O03 | Aplicación pequeña: las consultas de rumbo que solo deben evitar el objetivo anclado consultan directamente `targetBacteria`; no reconstruyen/recorren todos los cuerpos para filtrarlos. Se mantienen sondas locales y superficies independientes; reutilizarlas globalmente sin perfilado puede introducir errores por aliasing. |
| O04 | Pospuesto: no se demostró un cuello de botella con la vecindad actual. Dormir cuerpos o cambiar pares de contacto exige medir y probar propagación de empujes; no se cambia la física por una sospecha. |
| O05 | Pospuesto: se mantienen las cachés y generador existentes. Cachear también casillas de burbujas, reducir densidad o migrar a WebGL requiere medir el render primero. |
| O06 | Evita reasignar dimensiones iguales del backbuffer y mide insets solo en resize, no en cada render. Se conserva la altura lógica de 900. No se añade DPR completo, calidad adaptativa o cachés de transformaciones sin medir legibilidad y coste. |
| O07 | Se conservan límites: 220 partículas, cuatro variantes de halo por asset, mundo por vecindad y un solo canvas de mezcla. Las tres máscaras nuevas se limitan a 384 px. La cola de audio queda acotada por grupos del catálogo. Compartir buffers de pops y presupuestos por bytes queda pendiente de un perfil; no se afirma una meseta de memoria medida. |
| O08 | Aplicado: revisión explícita en las URL de todos los WebP cargados por JS e iconos HTML; versiones coherentes de archivos modificados. `scripts/check_assets.py` verifica rutas, WebP, alfa, dimensiones compartidas, límite de células, metadatos SDF y versiones. Dependencias Python fijadas y workflow Node 22/Python 3.12 con pruebas y regeneración idéntica de SDF. En el corte de esta auditoría aún no se había ejecutado remotamente ni publicado; después, la CI pasó y GitHub Pages publicó las versiones 2026.10.20-52 y 2026.10.20-53. |
| O09 | Extracción gradual limitada a controles semánticos en `controls.js`. Se mantienen scripts clásicos, orden explícito y harness VM actualizado. No se justifica migrar todo a módulos ES/framework ni mezclar una reescritura general con estos arreglos. |

## Hojas de animación recibidas

Se abrieron visualmente ambas imágenes y se verificó con Pillow que miden 1774×887, RGBA, alfa 0–255. Coinciden con el informe: no son divisibles en celdas iguales 4×2. Se observan residuos coloreados transparentes, figuras muy próximas a los bordes/cortes, diferencias de tamaño y de orgánulos, especialmente durante fagocitosis.

**Decisión: conservarlas como propuestas, sin incorporarlas al juego.** Dividir el lienzo por redondeo y recentrar cada figura violaría el pivote y los márgenes compartidos. Limpiarlas y alinearlas correctamente es un trabajo artístico adicional, no un arreglo automático de colisión. Las tres fases originales de 1254×1254 mantienen su posición, alfa, WebP y SDF. No se han editado los PNG recibidos ni los originales ignorados de `assets/`.

La especificación de bucle 8–12 FPS, cierre y deglución es razonable para una futura animación aprobada. No aporta un beneficio comprobado reemplazar ahora los sprites estables por estas hojas. Si se preparan después, necesitarán manifiesto de frames/pivote/copa, margen común, WebP, SDF por fase y revisión visual del bucle y sensores. No deben enviarse como una membrana única al generador actual.

## Validación y límites

- En el corte de esta auditoría, la suite Node tenía 97 pruebas de regresiones temporales, punteros, mundo, carga, UI y audio; todas pasaban. La suite actual tiene 119 pruebas.
- Chrome real de escritorio y móvil emulado: pruebas de aparición exclusiva en difícil, advertencia, escape, captura, regreso por toque/ratón y automático, empujes y ausencia de errores JS/404 en carga normal.
- Prueba adicional Chrome: ciclo mediante controles nativos por teclado, selector de movimiento, Game Over, bloqueo de inicio prematuro, recurso decorativo fallido, reintento de esencial, un solo bucle, fullscreen rechazado y eventos de dos toques independientes.
- Verificación gráfica en el corte: 76 rutas WebP y 40 formas alfa/SDF válidas. La comprobación actual registra 84 WebP y 40 formas. Regenerar `world-shapes.js` mantiene SHA-256 `c977a6b81fe10c26fc56ecf8e9c8502fdc7dbcc006d21f8a1b51b0bea5cf913f`.
- Las capturas de pruebas se guardan localmente en `tmp/audit-browser/` y `tmp/browser-audit/`. Se revisaron halo de amenaza, Game Over, ensamblaje y foco del teclado. No son mediciones de rendimiento.
- Quedan pruebas de hardware: pantalla recortada real, WebKit/Safari, gestos fullscreen, lector de pantalla y perfil de CPU/GPU/memoria/latencia en un móvil objetivo. Se conservan como límites de validación; no se atribuyen porcentajes de mejora ni FPS no medidos.

Comandos principales:

```bash
node --test tests/game.test.cjs tests/sound.test.cjs
python3 scripts/check_assets.py
python3 scripts/build_collision_shapes.py
git diff --exit-code -- world-shapes.js
```

Para navegador, con Playwright disponible y el servidor estático en 8765:

```bash
PHAGE_CHROME_PATH=/ruta/a/chrome node tests/browser-enemies.cjs
PHAGE_CHROME_PATH=/ruta/a/chrome node tests/browser-audit.cjs
```

Las sondas originales son evidencia de la revisión anterior. Algunas acceden a nombres internos que cambiaron (`infectedBacteriaSeeds`, por ejemplo); las regresiones oficiales sustituyen ese contrato de harness.

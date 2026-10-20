# Tutorial visual y controles táctiles

Cambios solicitados (2026-10-20):

- [x] Convertir `assets/pointing_pulse_on.png` y `pointing_pulse_off.png` a WebP, conservando lienzo y alfa; usar estos originales.
- [x] Al empezar, mostrar el puntero tocando y deslizándose en varias direcciones para enseñar el movimiento.
- [x] Retirar el botón de infección. Exigir pulsación sostenida sobre la silueta de una bacteria compatible y al alcance; mostrar el gesto y su progreso.
- [x] Mantener la interacción sobre la bacteria durante acople e inyección; permitir soltar y volver a mantener para continuar la inyección.
- [x] Mostrar pulsación sobre el primer ADN para duplicar, y sobre una copia disponible cuando corresponda procesar.
- [x] Mostrar arrastre desde la primera letra pendiente hasta su casilla correspondiente, moviendo solamente el puntero.
- [x] Enseñar cada unión del primer fago: ADN → cabeza, cabeza → cola y conjunto → fibras, sin desplazar las piezas reales.
- [x] En lisis, mostrar pulsaciones repetidas sobre la bacteria para enseñar a explotarla.
- [x] Recordar cada acción aprendida entre partidas y recargas; no repetir ayudas para los elementos restantes. Una acción pendiente puede retomarse tras abandonar una partida.
- [x] Conservar controles de teclado y accesibilidad, pausar/cancelar entradas correctamente, actualizar versión y verificar con pruebas y revisión visual.

Las ayudas son una capa de dibujo: no generan eventos, no arrastran objetos, no avanzan el juego y no bloquean los controles. La fabricación automática no requiere un gesto. El progreso local se almacena con la clave `phage-go-tutorial-v1`; si el navegador impide guardarlo, se conserva durante la sesión.

## Verificación

- `node --test tests/game.test.cjs tests/sound.test.cjs`: 108 pruebas correctas.
- Ambas conversiones conservan exactamente 399×434 y los valores del canal alfa. WebP con pérdida, calidad 90, método 6, RGBA y `exact=True`; revisión visual de ambos archivos.
- Revisión en navegador del juego real dentro de un iframe horizontal: movimiento, letras, ensamblaje y lisis. Una pulsación de 4,6 segundos sobre una bacteria compatible completó acople e inyección hasta la fase de ADN. Sin errores ni avisos de consola.
- Se conserva ESPACIO y el control semántico de teclado sobre la bacteria, sin dibujar el antiguo botón. Ratón y toque comparten el gesto de mantener; el arrastre de movimiento también funciona con ratón.
- La infección necesita 0,65 segundos continuos antes del acople. Salir de la silueta reinicia ese tiempo; durante inyección se pausa el avance al dejar de pulsar dentro de la bacteria. Cancelación, pérdida de captura, pausa, menú y fin de interacción liberan el dedo.
- Versión de `game.js` y referencias de scripts actualizadas a `20261020-31`.

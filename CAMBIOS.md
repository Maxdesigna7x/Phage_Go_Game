# Historial de cambios del juego

## Estado publicado — versión 2026.10.20-53

- [x] Cada bacteria presenta una vez cada uno de los cinco minijuegos de nucleótidos, en orden aleatorio: arrastrar, pulsar la letra indicada, ordenar, atrapar piezas que caen y memoria.
- [x] Las secuencias usan A, T, C y G en orden aleatorio. Ordenar comienza siempre con las cuatro fichas fuera de su posición correcta.
- [x] Pulsar muestra una letra objetivo a la vez, inicia con casillas vacías y deja de señalar tras el primer acierto. Ordenar deja de mostrar el puntero después del primer intercambio.
- [x] Memoria muestra las cuatro letras de una en una antes de pedir que se repita el patrón. Atrapar usa una caída lenta.
- [x] En Atrapar, ratón y toque mueven la cesta por el desplazamiento del puntero desde cualquier zona del tablero; el gesto no coloca la cesta debajo del dedo.
- [x] El progreso de los tutoriales visuales dura una partida y se reinicia al empezar otra.
- [x] Documentación de jugabilidad, controles, tutoriales, mundo, recursos y verificaciones actualizada para reflejar el código actual.
- Verificación actual: 119 pruebas automatizadas y comprobación de recursos con 84 WebP registrados y 40 siluetas alfa/SDF.
- Publicación: GitHub Pages desde main en https://maxdesigna7x.github.io/Phage_Go_Game/

El detalle vigente está en [docs/estado-actual.md](docs/estado-actual.md). Las entradas posteriores conservan el historial de versiones anteriores.

## Implementación inicial — 19 de octubre de 2026

- [x] Restaurar todos los assets de destrucción de la bacteria hasta la lisis.
- [x] Eliminar aros y su panel.
- [x] Contador flotante de burbujas y combo de diez con caducidad.
- [x] Superenergía temporal renovable: velocidad y efecto de pantalla; termina al infectar.
- [x] Ensamblaje: señalar solo la pieza que se mueve y su destino al arrastrar.
- [x] Glow pulsante siguiendo la silueta, sin círculos de ayuda.
- [x] Fagos construidos nadando y separados dentro de la bacteria.
- [x] Llenar cualquier pantalla horizontal sin bandas; solicitar giro y pantalla completa en móvil.
- [x] Verificar lógica, controles y presentación.
- [x] Publicar la aplicación y entregar el enlace online.

Verificación: 30 pruebas automatizadas; revisión visual en 1024×768 y 844×390, sin bandas y sin errores de consola.

Publicación: GitHub Pages desde `main` en https://maxdesigna7x.github.io/Phage_Go_Game/


# Manos tutoriales y marcador de difícil — 20 de octubre de 2026

- Las manos permanecen visibles durante toques y arrastres y durante todo el ciclo de animación. Cada tutorial pendiente reinicia su animación al comenzar una partida nueva.
- El marcador de difícil muestra únicamente la bacteria rota, el reloj y sus valores en texto grande; se elimina la tarjeta de fondo.
- `clock.png` y `Bacteria_Background_7.png` se distribuyen como WebP RGBA con dimensiones y alfa conservados.
- Verificación: cobertura automatizada de los diez gestos en móvil y escritorio, más validación de las dimensiones y transparencia de ambos iconos.
- Versión de `game.js` y referencias de recursos actualizadas a `20261020-40`.


# Tutorial visual — 20 de octubre de 2026

- Punteros originales `pointing_pulse_on/off` convertidos a WebP con lienzo y alfa intactos.
- Ayudas animadas para movimiento, mantener sobre bacteria, inyección, duplicar/procesar ADN, arrastrar letras, las tres uniones del fago y pulsaciones de lisis.
- En esa versión, cada ayuda se retiraba al completar su acción y se guardaba entre partidas. Ese comportamiento se reemplazó después: en la versión actual el aprendizaje se conserva solo durante la partida y se reinicia al empezar otra.
- Se retira el botón de infección: mantener sobre una bacteria compatible al alcance inicia el acople y permite continuar inyectando. Se conservan teclado y accesibilidad.
- Verificación en ese corte: 108 pruebas, revisión visual y recorrido en navegador desde pulsación sobre bacteria hasta ADN, sin errores de consola.

Detalle y lista de cambios: [docs/tutorial-visual.md](docs/tutorial-visual.md).


# Corrección de tutorial móvil y salida de presentación — 20 de octubre de 2026

- La demostración de movimiento tiene prioridad aunque haya una bacteria cercana; en móvil sigue visible con el joystick en uso y el guardado anterior no la oculta.
- La última imagen de presentación se desvanece sobre la partida ya renderizada.
- Unificación de la versión de caché de la página.

# Tutorial visual y controles táctiles

Las ayudas visuales enseñan movimiento, adhesión, inyección, duplicación y procesamiento de ADN, los gestos de los minijuegos, las uniones del fago y la lisis. Se reinician al empezar una partida nueva; el progreso no se guarda en localStorage ni se comparte entre partidas.

Las manos son una capa de dibujo. No generan eventos, no mueven letras o piezas, no completan acciones ni bloquean la entrada del jugador. Las acciones automáticas, como la biosíntesis, no necesitan una demostración.

## Lecciones de nucleótidos

- Completar la secuencia muestra un gesto de arrastre hasta el primer destino válido y deja de repetirlo después del primer encaje correcto.
- Pulsar la letra indicada enseña con el puntero únicamente la primera letra de esta modalidad. Las casillas empiezan vacías; después del primer acierto ya no aparece un puntero en las letras siguientes. No hay glow amarillo en este minijuego.
- Ordenar muestra un intercambio con el puntero hasta que el jugador hace el primer intercambio. El tutorial no reaparece en los intercambios restantes de esa partida.
- Atrapar no tiene un puntero que mueva la cesta por el jugador.
- Memoria muestra el patrón de forma secuencial, sin mano ni señal que adelante la respuesta.

Las demás ayudas también se aprenden una vez por partida. El primer tutorial de movimiento recorre cuatro direcciones y debe verse completo mientras el jugador mueve el fago antes de considerarse aprendido. La ayuda de infección enseña a mantener sobre una bacteria compatible; durante inyección enseña a mantener la acción. El tutorial de ensamblaje cambia de origen a destino al completar cada unión.

## Entrada y accesibilidad

La interacción de toque, ratón y teclado usa las mismas acciones del juego. Los controles semánticos DOM permiten recorrer con Tab y activar con Enter o Espacio. Las teclas A/T/C/G responden en los juegos de pulsar y memoria; 1–4 seleccionan fichas al ordenar; flechas y A/D mueven la cesta al atrapar.

Las entradas se cancelan correctamente al perder la captura del puntero, pausar, abrir el menú o cambiar de fase. En móvil, el dedo de movimiento es independiente del dedo de acción.

## Verificación vigente

- Suite Node: 119 pruebas correctas con node --test tests/game.test.cjs tests/sound.test.cjs.
- La suite comprueba el reinicio por partida, que el puntero de ordenar desaparezca después del primer intercambio y que las demostraciones no muten el juego ni sinteticen entradas.
- La conversión de las manos conserva el lienzo de 399×434 y el alfa. Los archivos que carga el juego son WebP.
- La versión publicada del juego es 2026.10.20-53. El historial de cambios anteriores está en [CAMBIOS.md](../CAMBIOS.md).

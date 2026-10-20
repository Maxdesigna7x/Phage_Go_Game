# Minijuegos de nucleótidos

Referencia de las cinco modalidades que forman la etapa de replicación del ADN en la versión 2026.10.20-53.

## Cómo se seleccionan

Después de inyectar el ADN, el jugador lo duplica hasta tener cinco copias. Al empezar la infección se sortea un orden de las cinco modalidades. Cada copia conserva la modalidad que le tocó y cada una aparece exactamente una vez por bacteria.

Cada minijuego crea una secuencia objetivo aleatoria de cuatro bases, con A, T, C y G una vez cada una. Las opciones de la bandeja también se mezclan. El contenido visual ocupa el panel disponible y se adapta al espacio horizontal y a los controles móviles.

## Modalidades

### Completa la secuencia

El ADN muestra cuatro espacios vacíos con su letra objetivo. La bandeja contiene A, T, C y G en orden aleatorio. Se arrastra cada ficha al espacio con la misma letra. Una coincidencia correcta ocupa ese espacio; un error muestra una indicación breve y deja continuar.

### Pulsa la letra indicada

El objetivo cambia una letra por vez. Las cuatro casillas comienzan vacías; cada acierto llena la siguiente. Hay cuatro bases pulsables en orden aleatorio.

El puntero de ayuda aparece sobre la primera letra objetivo de esta modalidad durante la partida. Al acertar la primera, la ayuda se da por aprendida y no vuelve a señalar las letras siguientes. Esta modalidad no usa glow amarillo de selección ni de respuesta.

### Ordena la secuencia

Arriba aparece la secuencia objetivo. Abajo hay cuatro fichas de nucleótidos, mezcladas de nuevo en cada partida y siempre con todas en una posición incorrecta. La secuencia es una permutación completa de las cuatro bases.

Se pueden intercambiar dos fichas tocándolas en orden o arrastrando una sobre otra. La ayuda con puntero desaparece después del primer intercambio de la partida. El intercambio no revela toda la solución: la secuencia objetivo permanece visible para que se pueda comparar.

### Atrapa los nucleótidos

La cadena objetivo muestra la siguiente base necesaria. Las fichas caen desde la zona superior a una velocidad inicial de 92–118 unidades por segundo; el incremento durante la ronda está limitado a 18 unidades por segundo. Aparece una ficha cada 0,88 segundos y cada segunda ficha garantiza la base que hace falta.

Arrastrar el ratón o dedo desde cualquier zona del tablero mueve la cesta por el delta horizontal del gesto; no se fija bajo el puntero. Las flechas y A/D también la mueven. Atrapar la letra pedida avanza la cadena. Las otras fichas no cuentan como acierto.

### Memoriza la secuencia

Las cuatro bases del objetivo se muestran una a una. Cada una se ilumina durante 0,68 segundos con pausas de 0,22 segundos entre letras. Cuando termina la demostración, las bases quedan ocultas y el jugador pulsa A, T, C y G en el orden recordado.

Un error reinicia el progreso y vuelve a mostrar el patrón después de una pausa breve. La animación visual no tiene mano ni puntero, para que la pista no adelante la respuesta.

## Teclado y acceso semántico

- En «Pulsa la letra indicada» y «Memoriza la secuencia», A, T, C y G responden a las teclas correspondientes.
- En «Ordena la secuencia», las teclas 1–4 seleccionan las fichas por posición; la segunda selección realiza el intercambio.
- En «Atrapa los nucleótidos», flechas izquierda/derecha o A/D mueven la cesta. Tab también recorre botones semánticos para desplazarla.
- En «Completa la secuencia», Tab recorre fichas y destinos. Enter o Espacio selecciona y coloca.
- Toque y ratón funcionan en todas las modalidades. Ordenar permite tanto toque como arrastre.

Las demostraciones son una capa visual, no entradas simuladas. Solo las lecciones de tocar, arrastrar, mantener e intercambiar usan puntero; el juego de memoria no muestra una pista de respuesta. El progreso de las lecciones se conserva durante una partida y se reinicia al iniciar otra.

## Transición

Al completar cualquiera de las cinco modalidades, esa copia de ADN queda procesada y comienza la biosíntesis automática de las piezas necesarias. Después se vuelve al ADN restante para procesar otra copia, hasta completar las cinco.

Las verificaciones automatizadas están en tests/game.test.cjs. La suite completa actual se ejecuta con:

    node --test tests/game.test.cjs tests/sound.test.cjs

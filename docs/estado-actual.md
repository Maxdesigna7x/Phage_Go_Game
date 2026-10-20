# Estado actual de Phage-Go!

Referencia del juego publicado y de su comportamiento actual. Corresponde a la versión 2026.10.20-53.

## Partida

Phage-Go! es un juego web táctil y accesible con teclado sobre el ciclo lítico de un bacteriófago. Se juega en horizontal en ordenador, tablet y móvil. El menú ofrece modo fácil o difícil; difícil añade un macrófago perseguidor y un límite de diez minutos de simulación activa.

En móvil, toca una zona libre y desliza para mover el fago; el desplazamiento controla dirección e intensidad. Un segundo dedo puede mantener la acción de adherirse o inyectar. En ordenador se usan flechas o WASD para moverse y Espacio para la acción. La tarjeta Mover alterna movimiento directo y giro con propulsión.

Para infectar, acércate a una bacteria compatible y mantén la acción sobre ella durante el acople. Después mantén para inyectar ADN. En escritorio también se usa Espacio o Enter. No hay botón independiente de infectar. Se puede soltar y volver a mantener durante la inyección.

Al explorar, las burbujas se pueden reventar. Una racha de diez activa superenergía temporal y cada burbuja adicional la renueva. Infectar cancela la energía. La semilla del mundo se conserva al volver a zonas visitadas y después de cada ciclo dentro de la misma partida.

## Ciclo de infección

1. Duplica el ADN hasta tener cinco copias. Cada copia se procesa una vez.
2. Cada copia inicia uno de cinco minijuegos de nucleótidos. En cada infección aparecen los cinco, en orden aleatorio. Cada minijuego usa una secuencia aleatoria de cuatro letras: A, T, C y G, cada una una vez.
3. La bacteria produce las piezas automáticamente. Empaqueta el ADN en la cabeza y ensambla cinco fagos uniendo cabeza, cuerpo y fibras.
4. Completa la lisis con diez pulsaciones o toques. Mantener pulsado cuenta como una sola pulsación. La bacteria pasa por las fases de destrucción antes de liberar 18 fagos.
5. La cámara sigue a uno de los fagos liberados y devuelve el control a ese mismo fago. La partida continúa explorando.

La ayuda de ensamblaje resalta con glow dorado la pieza que se mueve y, al agarrarla, su destino. Las animaciones de ayuda solo dibujan el gesto: no generan entradas ni completan acciones.

## Minijuegos de nucleótidos

| Modalidad | Objetivo y controles |
| --- | --- |
| Completa la secuencia | Arrastra cada nucleótido hasta el espacio con su misma letra. El orden de las fichas es aleatorio. |
| Pulsa la letra indicada | El juego muestra una letra objetivo cada vez. Pulsa esa base entre las cuatro opciones; las casillas empiezan vacías y se llenan solo al acertar. El puntero señala la primera letra objetivo hasta que aciertas; después no señala las letras siguientes y no hay glow amarillo. |
| Ordena la secuencia | Usa la secuencia superior como objetivo y ordena las cuatro fichas inferiores, siempre mezcladas sin ninguna en su posición correcta. Toca dos fichas para intercambiarlas o arrastra una sobre otra. El puntero enseña el primer intercambio de la partida. |
| Atrapa los nucleótidos | Mueve la cesta para atrapar, en orden, las letras que pide la cadena. En móvil y PC puedes arrastrar desde cualquier zona del tablero: la cesta se desplaza según el delta del gesto y no salta debajo del puntero. Las piezas caen despacio; una de cada dos apariciones garantiza la letra necesaria. En teclado usa izquierda/derecha o A/D. |
| Memoriza la secuencia | Observa cómo se iluminan las cuatro letras, una detrás de otra, y luego tócalas en el mismo orden. Si te equivocas, el patrón se vuelve a mostrar. La demostración no tiene puntero que revele la respuesta. |

La distribución de la bandeja y la secuencia cambian en cada minijuego. La guía detallada está en [minijuegos-nucleotidos.md](minijuegos-nucleotidos.md).

## Mundo y modos

El mundo incluye bacterias sanas y rotas, células sanguíneas, plaquetas y células animales. Bacilos y espirilos aparecen como decoración ambiental. Solo las bacterias compatibles se pueden infectar; la brújula apunta a objetivos compatibles y las células incompatibles no habilitan la acción.

El modo fácil permite explorar y completar ciclos sin enemigos. En difícil aparece un macrófago: patrulla, persigue al fago, anuncia el cierre de su copa y solo captura si el jugador permanece dentro durante el cierre. Acople, inyección, minijuegos, lisis y escape suspenden la amenaza; al volver al vuelo se concede protección temporal. La captura lleva a Game Over.

El fondo contiene escenas decorativas de fagos que infectan bacterias. No colisionan, no alteran puntuación ni reemplazan objetivos del mundo jugable.

## Pantalla, sonido y recursos

El tablero ocupa la pantalla horizontal disponible sin fijarse a una proporción. En vertical se pausa y pide girar el dispositivo. En móviles se ofrece pantalla completa; si el navegador la rechaza se puede seguir en horizontal. La interfaz respeta los márgenes seguros.

El audio carga efectos comprimidos bajo demanda; no hay música ni ambientes continuos. Las preferencias guardadas en el navegador siguen aplicándose, aunque el panel temporal de edición de sonidos ya no aparece en la interfaz. El catálogo está descrito en [audio/README.md](../audio/README.md).

El juego carga imágenes WebP de distribución. Los originales gráficos se conservan localmente en assets, carpeta ignorada por Git. Las reglas están en [AGENTS.md](../AGENTS.md).

## Documentación del proyecto

- [README](../README.md): ejecución local, controles, verificaciones y publicación.
- [Minijuegos de nucleótidos](minijuegos-nucleotidos.md): reglas, orden por infección y ayudas.
- [Tutorial visual](tutorial-visual.md): cuándo aparecen las demostraciones y cómo se reinician.
- [Macrófago](macrofago-gameplay.md): comportamiento del enemigo y validación.
- [Integración de células](PLAN-MUNDO-CELULAS.md) y [guía gráfica](guia-grafica-celulas.md): familias, recursos y colisiones.
- [Propuesta de consumidores de fagos](propuesta-depredadores-fagos.md): referencias biológicas y protistas aún no implementados.
- [Efectos de sonido](../audio/README.md) y [créditos de la grabación](../audio/sonidos/fuentes/CREDITOS.md).
- [Auditoría histórica](REVISION-AUDITORIA-2026-10-20.md): revisión anterior y nota de estado actual.
- [Cambios solicitados](../CAMBIOS.md): registro de implementación.

## Verificación y publicación

La suite actual contiene 119 pruebas automatizadas:

    node --test tests/game.test.cjs tests/sound.test.cjs

La comprobación de recursos revisa WebP, alfa, dimensiones, siluetas y versiones:

    python3 scripts/check_assets.py

GitHub Pages publica desde la raíz de main: [maxdesigna7x.github.io/Phage_Go_Game](https://maxdesigna7x.github.io/Phage_Go_Game/).

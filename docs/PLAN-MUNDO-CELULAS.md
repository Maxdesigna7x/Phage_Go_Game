# Integración de células y mundo

## Lista de trabajo

- [x] Convertir los 30 PNG de `assets/celulas/` a WebP sin recortar alfa ni lienzo.
- [x] Mantener en cada bloque de generación dos elementos no bacterianos, una bacteria sana y una rota: 50/25/25. La vecindad visible puede variar al desplazarse.
- [x] Células humanas y plaquetas en el plano jugable, con tres variantes por tipo e información educativa propia. Bacilos y espirilos nuevos en el fondo: son bacterias de otras formas, sin ciclo interior compatible con los assets actuales.
- [x] Mantener las ocho decoraciones anteriores del fondo, sumar las nuevas células y respetar tintes/profundidad. Los fagos ambientales solo ocupan posiciones bacterianas.
- [x] Tamaños jugables acotados: plaquetas cercanas al tamaño del fago, eritrocitos medianos, leucocitos y células animales mayores. Escala adaptada al juego, no una representación microscópica a escala real.
- [x] Precocinar campos de distancia desde el alfa de los sprites; colisiones y proximidad sobre su silueta, sin tratar figuras irregulares como elipses sólidas.
- [x] Plaquetas desplazables: impulso al chocar, resistencia del medio, giro y límite de velocidad; conservar cuerpos cercanos al regenerar la vecindad y acotar la memoria.
- [x] Glow rojo solo al acercarse a elementos incompatibles; nunca habilitar Infectar para ellos. Información al chocar con nombre y motivo.
- [x] Brújula con icono de bacteria y flecha, sin el texto anterior; apunta únicamente a bacterias compatibles.
- [x] Destacar la etapa actual con icono claramente mayor y texto más grande, sin solapar los otros iconos.
- [x] Verificar proporciones, generación determinista, colisiones cóncavas/rotadas, reacción física, información, accesibilidad de objetivos y regresión del ciclo completo.

## Criterios

Las plaquetas son fragmentos celulares, no bacterias. Los bacilos y espirilos no deben describirse como células animales ni como bacterias universalmente inmunes: la especificidad depende del fago. Para los objetivos del juego solo la bacteria compatible original tiene ciclo de infección.

La conversión mantiene los 30 originales intactos. La física usa una versión reducida y precalculada de la silueta, independiente del color. No se leen píxeles ni calculan campos de distancia en cada fotograma.

## Resultado y referencias

Todos los puntos implementados. WebP de distribución: 30 archivos, **1.247.530 bytes**, máximo 512 px. Se ha comprobado que su alfa coincide con el del PNG reducido con el mismo filtro, conservando proporción y lienzo. La estimación de memoria de imagen RGBA de estas copias es de unos 30 MiB; no se cargan los originales de 1254 px en el juego.

`world-shapes.js` contiene 40 campos precalculados: 30 variantes celulares, siete fases de bacteria y tres fases del macrófago, a 128 muestras por lado mayor. La física consulta estos campos en el sistema local del sprite, respetando giro y escala. El fago utiliza tres sondas en cabeza, cuerpo y fibras; las plaquetas consultan además puntos de su contorno al chocar con otros cuerpos. Es una aproximación de silueta para móvil, no una simulación de membranas deformables.

| Familia | Plano jugable | Tamaño visible aproximado en unidades del mundo | Movimiento al chocar |
| --- | --- | --- | --- |
| Eritrocito | Sí | 391–449 | Cuerpo estático |
| Neutrófilo | Sí | 502–578 | Cuerpo estático |
| Plaqueta | Sí | 104–120 | Impulso, giro y frenado en el medio |
| Linfocito | Sí | 465–535 | Cuerpo estático |
| Monocito | Sí | 539–621 | Cuerpo estático |
| Eosinófilo | Sí | 493–567 | Cuerpo estático |
| Basófilo | Sí | 484–556 | Cuerpo estático |
| Célula animal | Sí | 577–663 | Cuerpo estático |
| Bacilo y espirilo | Solo fondo | Según capa | Decoración de otro tipo de huésped |

Se conservan las ocho decoraciones bacterianas anteriores y las seis escenas de fagos ambientales. Las nuevas células humanas nunca son sustituidas por una escena de infección. Los fagos ambientales tampoco infectan los bacilos o espirilos decorativos nuevos. En el juego, únicamente la bacteria sana compatible original acepta la infección.

La proporción 50/25/25 corresponde a los tipos de posiciones del generador. El recorte de cámara y los estados de infección modifican lo que se ve en un instante. Se separaron los centros de aparición y se limitó la escala para evitar solapamientos iniciales; el jugador comienza en el agua libre entre posiciones. Los cuerpos móviles se conservan al reconstruir la misma vecindad, y se descartan al alejarse. No hay historial de células de todo el mapa.

Las funciones generales de eritrocitos, leucocitos y plaquetas se apoyan en [NHLBI: Blood Tests](https://www.nhlbi.nih.gov/health/blood-tests). La compatibilidad se presenta como una propiedad del fago del juego, de acuerdo con la especificidad del huésped descrita en [Molecular and Evolutionary Determinants of Bacteriophage Host Range](https://pubmed.ncbi.nlm.nih.gov/30181062/). No se representa el tamaño biológico real: el rango se comprime para que pueda jugarse en móvil.

Verificación: pruebas automáticas de proporciones por bloque y regiones, separación inicial, aparición en agua libre, diversidad, incompatibilidad, campos de silueta y concavidades giradas, impulso y arrastre, conservación y descarte de cuerpos, brújula y tamaño de la etapa. También sigue pasando la regresión del ciclo completo. Revisión en navegador del choque contra un eritrocito y una plaqueta, avisos educativos y móvil horizontal 844×390 sin errores de consola. El rendimiento en un teléfono físico todavía no se ha medido.

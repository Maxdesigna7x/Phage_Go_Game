# Consumidores de fagos: biología y propuesta para Phage GO

## Qué existe realmente

Sí hay consumidores de fagos. La captura de partículas, su ingestión y su destrucción son fenómenos distintos: no todos los virus ingeridos quedan inactivados. Estos diseños representan consumidores o células fagocíticas, no animales que cazan virus individualmente con intención.

| Propuesta | Evidencia y límites | Aspecto de la ilustración |
| --- | --- | --- |
| Tetrahymena | Protista ciliado. Se ha observado ingestión e inactivación de T4 y, en experimentos de coincubación, inactivación de T5 y lambda. No implica que destruya cualquier fago. [Hennemuth y colaboradores](https://onlinelibrary.wiley.com/doi/10.1111/j.1550-7408.2007.00303.x). | Cuerpo ovalado o piriforme, cilios cortos, surco oral y vacuolas. Verde turquesa pintado, núcleos violetas. |
| Nanoflagelado fagótrofo | Las poblaciones y cultivos estudiados de nanoflagelados marinos ingirieron virus y mostraron diferencias entre las presas virales. [González y Suttle](https://www.int-res.com/articles/meps/94/m094p001.pdf). El dibujo es una propuesta genérica de flagelado con dos flagelos, no una identificación de especie ni prueba de consumo de todos los fagos por ese morfotipo. | Cuerpo pequeño y ovoide, dos flagelos curvos desiguales, núcleo y vacuolas; ocre salvia. |
| Macrófago | Célula inmunitaria de un animal, no organismo independiente. Se ha documentado captación y degradación de fagos en macrófagos en un modelo de ratón. [Hodyra-Stefaniak y colaboradores](https://www.nature.com/articles/srep14802.pdf). | Célula irregular grande, núcleo arriñonado, vesículas y prolongaciones anchas que forman una copa de fagocitosis. Marfil salvia y violeta. |

La ingestión tampoco garantiza destrucción: un estudio de Tetrahymena encontró ingestión de PhiX174 sin inactivación de los fagos ensayados. [Estudio de ingestión sin inactivación](https://pubmed.ncbi.nlm.nih.gov/18460158/).

Los colores, el tamaño visible de los orgánulos y las formas simplificadas son decisiones artísticas. Las imágenes no son fotografías ni láminas taxonómicas. Los fagos son mucho menores que estas células; al compartir pantalla se necesitan escalas jugables deliberadamente exageradas.

## Elección de ambiente

Para el mundo actual con eritrocitos y leucocitos, empezaría con el macrófago. Tetrahymena y el nanoflagelado funcionan mejor como amenazas de niveles acuáticos diferenciados. No presentar a todos como habitantes normales de la sangre. Si se mantiene un único escenario abstracto, explicar que reúne ambientes distintos por motivos educativos.

## Mecánicas propuestas, todavía sin implementar

Las siguientes reglas son adaptaciones de diseño, no comportamientos o tiempos medidos en los artículos.

| Elemento | Comportamiento jugable | Cómo se evita |
| --- | --- | --- |
| Macrófago | Patrulla lenta, breve aproximación al detectar proximidad y cierre de pseudópodos tras un aviso visible de aproximadamente un segundo. La captura debe requerir solapamiento sostenido, no un toque. | Alejarse de la copa antes del cierre; el cuerpo también desplaza al fago, sin captura inmediata. |
| Tetrahymena | Nada por rutas curvas y crea un pequeño sector de arrastre frente al surco oral. Captura solo cerca de la abertura. | Cruzar por sus costados o escapar lateralmente del sector anunciado. El arrastre es una exageración para hacer visible la filtración. |
| Nanoflagelado | Desplazamientos cortos alternados con pausas de alimentación. Zona de captura frontal pequeña. | Leer las pausas y rodearlo; no debe ser un perseguidor con seguimiento perfecto. |

Prototipo recomendado: un solo macrófago activo en modo difícil, más lento que el jugador, con zona inicial libre y límite de persecución. En fácil, mostrar primero una captura de un fago ambiental con un aviso explicativo. Su acción no debe tratarse como maldad del sistema inmunitario: el jugador representa un fago que puede ser eliminado.

Para una primera prueba, la captura podría hacer perder unos segundos y reaparecer lejos del enemigo, conservando ciclos ya completados. Es una concesión arcade; la inactivación biológica de ese virión no sería reversible. Como alternativa más estricta, la captura termina la partida en difícil. No decidir una penalización definitiva antes de probar dificultad y claridad.

Durante acople, inyección y minijuegos, suspender capturas del jugador y reanudarlas al terminar el escape con una breve protección. Es una regla de equidad jugable, no una afirmación de que las bacterias sean refugios inmunológicos garantizados. No permitir que estos depredadores retiren la bacteria objetivo durante un ciclo activo.

## Integración técnica futura

- Mantener los PNG originales en `assets/depredadores_fagos/`. Los tres conceptos no son fotogramas de animación.
- Seleccionar diseños antes de preparar estados de reposo, aviso, captura y recuperación; usar lienzos compartidos por personaje para impedir saltos. Conservar márgenes y posiciones comunes.
- Convertir las versiones elegidas a `assets_webp/depredadores_fagos/` con el script del proyecto y los ajustes establecidos. La excepción de 512 px vigente corresponde a las 30 células existentes; cualquier nueva excepción de resolución se debe decidir y documentar.
- Añadir rutas en `ASSETS`, compatibilidad y conducta diferenciadas; nunca habilitar Infectar ni permitir que la brújula los seleccione. Mantener el aviso rojo para incompatibles y las ayudas doradas del ensamblaje.
- Incorporar los nuevos WebP al generador de siluetas antes de regenerar `world-shapes.js`: el script actual busca células en `assets_webp/celulas/` y fases en `assets_webp/new_size/`. No bastará con guardarlos en una carpeta nueva. No leer píxeles por fotograma.
- Usar una reserva pequeña de amenazas dentro de la vecindad activa. Mantener la proporción actual de una bacteria sana, una rota y dos células por bloque; los enemigos pueden tener un sistema adicional con sus propias distancias de seguridad y cupos.
- Separar contorno de colisión y región de captura para respetar surco/copa, y probar contactos rotados y márgenes. Verificar también pausa, dispositivos táctiles, protección en minijuegos y disponibilidad de bacterias compatibles.
- Actualizar las versiones de scripts al integrar. Esta entrega añade conceptos y una propuesta; no activa enemigos ni publica cambios del juego.

## Entrega gráfica

Herramienta integrada `image_gen`; referencias de estilo: bacteria sana activa y monocito existente. Prompts exactos en `assets/depredadores_fagos/prompts.json`. Originales: `tetrahymena_01.png`, `nanoflagelado_01.png` y `macrofago_01.png`. El manifiesto y la vista conjunta registran y muestran los resultados finales.

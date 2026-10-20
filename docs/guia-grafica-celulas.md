# Guía gráfica de Phage GO y selección de células

## Alcance

Este análisis nació con un inventario de 52 WebP. Desde entonces se produjeron e integraron las 30 variantes de células descritas aquí; la comprobación actual revisa 84 WebP de distribución y 40 formas alfa/SDF. Las diez familias tienen tres variantes cada una en los originales de `assets/celulas/`; la integración en el mundo se describe en [PLAN-MUNDO-CELULAS.md](PLAN-MUNDO-CELULAS.md). Los nombres biológicos son interpretaciones visuales para organizar referencias ilustradas, no identificaciones microscópicas verificadas.

## Lenguaje visual observado

La bacteria activa `assets_webp/new_size/Bacteria_Outside_1.webp` es la referencia principal para materia orgánica. Tiene volumen 2.5D pintado, membrana redondeada con ribete verde, luz amplia desde arriba a la izquierda, sombra inferior derecha y manchas orgánicas discretas. Los verdes van de salvia y lima suave a esmeralda y petróleo. El moteado aporta vida sin convertirse en ruido fotográfico. Las ocho bacterias decorativas mantienen este lenguaje con variantes de detalle y contraste.

`Phage.webp`, sus partes y fases aportan el lenguaje de superficies geométricas: cian, azul acero y sombras azul petróleo, planos sencillos, brillos anchos y siluetas claras. Los nuevos elementos orgánicos deben seguir principalmente a las bacterias, sin convertir todas las células en poliedros. Los iconos de dificultad tienen rostros; esa característica no pertenece a los sprites normales del mundo.

ADN y nucleótidos usan naranja, coral, verde y azul como acentos cálidos o funcionales. La introducción tiene atmósfera azul verdosa, mientras las burbujas usan transparencia y reflejos suaves. Los fondos, halos y partículas son recursos de escena, no parte del lienzo de cada nueva célula.

## Reglas de dibujo

- Silueta reconocible a 96–160 px; masas grandes antes que microdetalle.
- Contorno coloreado suave, nunca línea negra dura de cómic.
- Volumen mediante tres masas de valor: luz amplia superior izquierda, medio tono principal y sombra inferior derecha. Evitar múltiples luces especulares.
- Superficie orgánica mate o satinada con moteado escaso; membrana ligeramente translúcida y contenido simplificado. Evitar vidrio, cristal, acabado plástico mojado, neón y brillos blancos quemados.
- Mantener los rasgos que distinguen cada célula: concavidad sin agujero en eritrocitos; forma nuclear y gránulos en leucocitos; ausencia de núcleo en plaquetas y bacterias.
- Verdes salvia/esmeralda para bacterias; marfil verdoso y violetas apagados para leucocitos; coral para eritrocitos; ocre suave para plaquetas. Son extensiones propuestas de la paleta existente, no colores históricos medidos.
- Sin caras, ojos, letras, diagramas, sombras externas ni fondos incorporados.

## Composición y variantes

Un elemento por PNG RGBA, fondo realmente transparente, lienzo solicitado de 1024×1024, cuerpo alrededor del 75 % del lienzo y márgenes suficientes para flagelos o pseudópodos. El generador entregó los primeros originales a 1254×1254; se conservan sin redimensionar. Las dimensiones efectivas de cada archivo se registran en el manifiesto. Cada familia ofrece tres diseños del mismo elemento: compacto/base, más ovalado y frío, más ancho y cálido. Son alternativas artísticas, no fases de animación ni estados de infección.

La escala biológica no se expresa normalizando todo al mismo tamaño visible en el juego. La integración actual define tamaños relativos jugables: plaquetas menores que eritrocitos y leucocitos; células eucariotas mayores que bacterias. Los fagos infectan las bacterias compatibles; las células humanas y animales son decoración ambiental, no objetivos de infección.

## Inventario y decisión por referencia

Los números corresponden al orden alfabético de los archivos originales. Se conservan intactos en `ref/celulas/`; esta tabla proporciona nombres semánticos sin renombrar los originales.

| ID | Archivo original | Grupo | Decisión |
| --- | --- | --- | --- |
| 01 | `Imagen de ChatGPT 19 oct 2026, 06_17_58 p.m-1.png` | eritrocito | Tres variantes producidas e integradas; distribución en el plano jugable. |
| 02 | `Imagen de ChatGPT 19 oct 2026, 06_18_03 p.m-2.png` | neutrofilo | Tres variantes producidas e integradas; distribución en el plano jugable. |
| 03 | `Imagen de ChatGPT 19 oct 2026, 06_18_06 p.m-3.png` | neurona | Excluir: célula especializada de tejido nervioso; fuera del ambiente solicitado. |
| 04 | `Imagen de ChatGPT 19 oct 2026, 06_18_10 p.m-4.png` | celula_vegetal | Excluir: pared rígida y cloroplastos; introduce un ambiente vegetal ajeno al actual. |
| 05 | `Imagen de ChatGPT 19 oct 2026, 06_18_13 p.m-5.png` | espermatozoide | Excluir: célula reproductora; exclusión expresa del usuario. |
| 06 | `Imagen de ChatGPT 19 oct 2026, 06_18_28 p.m-1.png` | plaqueta | Tres variantes producidas e integradas; distribución en el plano jugable. |
| 07 | `Imagen de ChatGPT 19 oct 2026, 06_18_32 p.m-2.png` | linfocito | Tres variantes producidas e integradas; distribución en el plano jugable. |
| 08 | `Imagen de ChatGPT 19 oct 2026, 06_18_35 p.m-3.png` | monocito | Tres variantes producidas e integradas; distribución en el plano jugable. |
| 09 | `Imagen de ChatGPT 19 oct 2026, 06_18_38 p.m-4.png` | eosinofilo | Tres variantes producidas e integradas; distribución en el plano jugable. |
| 10 | `Imagen de ChatGPT 19 oct 2026, 06_18_41 p.m-5.png` | basofilo | Tres variantes producidas e integradas; distribución en el plano jugable. |
| 11 | `Imagen de ChatGPT 19 oct 2026, 06_22_32 p.m-1.png` | plaqueta | Agrupar con la plaqueta 06; sin serie adicional. |
| 12 | `Imagen de ChatGPT 19 oct 2026, 06_22_36 p.m-2.png` | celula_animal | Tres variantes producidas e integradas; distribución en el plano jugable. |
| 13 | `Imagen de ChatGPT 19 oct 2026, 06_22_39 p.m-3.png` | bacilo | Tres variantes producidas e integradas como decoración ambiental. |
| 14 | `Imagen de ChatGPT 19 oct 2026, 06_22_42 p.m-4.png` | espirilo | Tres variantes producidas e integradas como decoración ambiental. |
| 15 | `Imagen de ChatGPT 19 oct 2026, 06_22_45 p.m-5.png` | celula_animal | Agrupar con la célula animal 12; sin serie adicional. Su forma cuadrada es una licencia visual, no una identidad distinta demostrable. |
| 16 | `Plaqueta brillante activada.png` | plaqueta | Agrupar con la plaqueta 06; sin serie adicional. |

Se excluyen neurona, espermatozoide y célula vegetal. Las células sanguíneas y la célula animal genérica se consideran coherentes como ambiente del huésped; bacilo y espirilo amplían la variedad bacteriana. No se presume una localización anatómica concreta del nivel actual. Las referencias de plaquetas 06, 11 y 16 comparten una familia aunque cambien de color; las células animales 12 y 15 comparten otra.

## Producción y entrega

Generación con la herramienta integrada de imágenes, una llamada por variante. `assets/celulas/prompts.json` conserva el texto exacto de cada encargo y su referencia de sujeto. Los originales PNG se guardan junto a ese archivo. El manifiesto registra rutas, dimensiones y alfa; la hoja de contacto permite revisión conjunta.

Para regenerar los recursos de distribución se usa `python scripts/convert_assets.py --max-size 512 --output-dir assets_webp/celulas assets/celulas/*.png`. La integración actual conserva los PNG originales, usa WebP RGBA de hasta 512 px y registra los recursos cargados por el juego. Se deben mantener dimensiones proporcionales y márgenes, y revisar cualquier cambio visual. Las reglas completas están en `AGENTS.md`.

Las fases existentes de bacteria siguen compartiendo 1001×535, centro, escala y rotación. No sustituirlas por estos diseños ni recortar sus márgenes. Las ocho bacterias decorativas conservan su normalización independiente. `assets/` está ignorado por Git: conservar/copiar los originales como recursos locales; la guía versionable queda en `docs/`.

## Verificación de la entrega

Se completaron los 30 PNG, tres por cada una de las diez familias. Todos son RGBA, con alfa de 0 a 255, imágenes distintas verificadas por SHA-256 y lienzo de 1254×1254. El margen mínimo de la silueta visible (alfa > 8/255) es de 27 píxeles. Se conserva el alfa original, incluidos los píxeles casi transparentes; no se recortaron ni reescalaron los originales. La lámina de revisión utiliza miniaturas sobre azul petróleo para comparar legibilidad y estilo.

Dos resultados iniciales de bacilo incluyeron un halo ambiental; una edición posterior tampoco lo eliminó adecuadamente. Se descartaron esas propuestas y se regeneraron las variantes 02 y 03 a partir de `bacilo_01.png`, obteniendo siluetas aisladas. Los prompts finales y originales quedan diferenciados en `prompts.json`. La vista general y el manifiesto corresponden únicamente a los 30 resultados seleccionados.

Archivos fuente de la entrega: `assets/celulas/README.md`, `assets/celulas/vista_general.jpg`, `assets/celulas/manifest.json`, `assets/celulas/prompts.json` y los 30 PNG nombrados por elemento y variante. La revisión visual conjunta confirma siluetas completas y un lenguaje pintado coherente. Sus tamaños de juego y la separación entre plano jugable y decoración están definidos en [PLAN-MUNDO-CELULAS.md](PLAN-MUNDO-CELULAS.md).

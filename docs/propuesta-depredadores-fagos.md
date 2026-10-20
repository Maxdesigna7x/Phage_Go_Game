# Consumidores de fagos: biología y propuestas para Phage-Go!

## Estado actual

El macrófago ya está implementado como amenaza exclusiva del modo difícil. El modo fácil no tiene enemigos. Su conducta, reglas de captura, protección, recursos y validación están descritos en [macrofago-gameplay.md](macrofago-gameplay.md).

Tetrahymena y el nanoflagelado fagótrofo descritos abajo son conceptos para posibles ambientes acuáticos futuros; no forman parte del juego actual. Este documento conserva el fundamento biológico y la dirección artística de esos conceptos.

## Qué existe en biología

Sí hay consumidores de fagos. La captura de partículas, su ingestión y su destrucción son fenómenos distintos: no todos los virus ingeridos quedan inactivados. Estos diseños representan consumidores o células fagocíticas, no animales que cazan virus individualmente con intención.

| Organismo/célula | Evidencia y límites | Aspecto de la ilustración |
| --- | --- | --- |
| Tetrahymena | Protista ciliado. Se ha observado ingestión e inactivación de T4 y, en experimentos de coincubación, inactivación de T5 y lambda. No implica que destruya cualquier fago. [Hennemuth y colaboradores](https://onlinelibrary.wiley.com/doi/10.1111/j.1550-7408.2007.00303.x). | Cuerpo ovalado o piriforme, cilios cortos, surco oral y vacuolas. Verde turquesa pintado, núcleos violetas. |
| Nanoflagelado fagótrofo | Las poblaciones y cultivos estudiados de nanoflagelados marinos ingirieron virus y mostraron diferencias entre las presas virales. [González y Suttle](https://www.int-res.com/articles/meps/94/m094p001.pdf). El dibujo es una propuesta genérica de flagelado con dos flagelos, no una identificación de especie ni prueba de consumo de todos los fagos por ese morfotipo. | Cuerpo pequeño y ovoide, dos flagelos curvos desiguales, núcleo y vacuolas; ocre salvia. |
| Macrófago | Célula inmunitaria de un animal, no organismo independiente. Se ha documentado captación y degradación de fagos en macrófagos en un modelo de ratón. [Hodyra-Stefaniak y colaboradores](https://www.nature.com/articles/srep14802.pdf). | Célula irregular grande, núcleo arriñonado, vesículas y prolongaciones anchas que forman una copa de fagocitosis. |

La ingestión tampoco garantiza destrucción: un estudio de Tetrahymena encontró ingestión de PhiX174 sin inactivación de los fagos ensayados. [Estudio de ingestión sin inactivación](https://pubmed.ncbi.nlm.nih.gov/18460158/).

Los colores, el tamaño visible de los orgánulos y las formas simplificadas son decisiones artísticas. Las imágenes no son fotografías ni láminas taxonómicas. Los fagos son mucho menores que estas células; al compartir pantalla se necesitan escalas jugables deliberadamente exageradas.

## Elección de ambiente

El macrófago encaja como amenaza del entorno con células sanguíneas y leucocitos. Tetrahymena y el nanoflagelado tendrían más sentido en ambientes acuáticos diferenciados. El juego actual no afirma que todos estos elementos compartan un único ambiente biológico.

## Ideas mecánicas para protistas futuros

Estas reglas son posibilidades de diseño, no comportamientos o tiempos medidos en los artículos.

| Elemento | Idea de comportamiento | Respuesta del jugador |
| --- | --- | --- |
| Tetrahymena | Nadar por rutas curvas y crear un pequeño sector de arrastre frente al surco oral. Captura solo cerca de la abertura. | Cruzar por los costados o escapar lateralmente del sector anunciado. |
| Nanoflagelado | Alternar desplazamientos cortos con pausas de alimentación y usar una zona de captura frontal pequeña. | Leer las pausas y rodearlo. |

No se han definido el nivel, penalización ni reglas finales de estos protistas. No reutilizar las antiguas propuestas de captura del macrófago como descripción actual: la implementación aprobada se detalla en el documento enlazado arriba.

## Recursos de concepto

Las ilustraciones originales de Tetrahymena, nanoflagelado y macrófago se conservan en assets/depredadores_fagos/. El macrófago incorporado al juego tiene fases alineadas de reposo, apertura y cierre en assets/macrofago/, y versiones WebP en assets_webp/macrofago/. El manifiesto y los prompts documentan su procedencia. La carpeta assets/ está ignorada por Git; las imágenes cargadas por el juego usan WebP.

# Efectos del juego

`catalog.js` enumera los 63 efectos activos disponibles en `sonidos/web/`, en su mayoría generados localmente. Las explosiones de burbujas reutilizan una grabación CC0 importada; su procedencia está en [sonidos/fuentes/CREDITOS.md](sonidos/fuentes/CREDITOS.md). El catálogo no incluye `ambiente_menu`, `ambiente_exterior` ni `ambiente_interior`: el juego no carga música ni ambientes de fondo.

Para cada efecto, las rutas se ordenan por tamaño real. Se usa el archivo comprimido más pequeño que el navegador pueda reproducir; si la decodificación falla, se intenta el siguiente formato. Predomina MP3; para biosíntesis el OGG es menor. La suma de las opciones preferidas es 335.894 bytes (unos 328 KiB). Los WAV de `originales/` y el generador no se cargan en el juego.

Web Audio se activa con la primera interacción. Los efectos se descargan y decodifican bajo demanda, con caché de buffers y un máximo de 14 voces. Solo se repiten los efectos funcionales de inyección, biosíntesis y energía mientras ocurre su acción. El nado usa un burbujeo líquido dedicado de 160 ms, formado por dos tonos acuáticos suaves sin transitorio de golpe por cada ciclo de tres fotogramas de patas (12 fps), con entrada y salida suaves y volumen moderado. Comparte el reloj de la animación, incluye el movimiento por inercia y se detiene al chocar o posarse; no utiliza un bucle de audio independiente. Al pausar o cambiar de pestaña se detienen. Los sonidos ambientales de infección y explosión solo se disparan para escenas visibles y a volumen bajo.

## Menú provisional retirado

El botón **Sonidos** se retiró de la interfaz. Las preferencias ya guardadas se siguen aplicando. El panel de revisión queda conservado en el código, sin acceso desde la pantalla de juego. Durante su uso provisional, abría una lista por categorías y pausaba la partida. Cada variante tiene su interruptor y un botón para escucharla durante un máximo de dos segundos. Se puede escuchar una muestra aunque esté desactivada. Los cambios se aplican durante la sesión; **Guardar y exportar JSON** los conserva en `localStorage` y descarga `phage-sound-settings.json`.

```json
{"version":1,"disabled":["fago_nadar","lisis_pulsar_01"]}
```

Los identificadores de `disabled` coinciden con `id` en el catálogo. Para convertir una selección en el ajuste predeterminado del proyecto, copiar su JSON a `audio/settings.json`. Las preferencias que un jugador ya haya guardado en su navegador tienen prioridad sobre ese archivo. No es necesario subir originales ni regenerar sonidos para cambiar la selección. Los ID desconocidos se ignoran.

El botón Guardar descarga un archivo; por seguridad del navegador no puede sobrescribir automáticamente un archivo dentro del repositorio. La selección sí permanece activa en ese navegador entre visitas.

## Validación

Ejecutar `node --test tests/*.test.cjs`. Además de la lógica del juego se comprueban catálogo, exclusión de ambientes, formatos, cancelación de bucles y persistencia/exportación de preferencias. La valoración del timbre y la mezcla final se realiza escuchando el juego en un dispositivo real.

Para reconstruir el catálogo después de añadir variantes, actualizar las categorías en `scripts/build_audio_catalog.py` y ejecutar `python scripts/build_audio_catalog.py` desde la raíz. Solo se incluyen archivos con el nombre exacto del efecto o su sufijo numérico (`_01`, `_02`, etc.), evitando confundir efectos que comparten prefijo.

Las explosiones de burbujas usan una grabación publicada por el_boss en Freesound bajo CC0, en lugar de la síntesis anterior. Se conserva el tono y se elimina el aviso musical de racha que acompañaba a cada pop. Fuente, alcance de la información sobre su grabación y reconstrucción en [sonidos/fuentes/CREDITOS.md](sonidos/fuentes/CREDITOS.md).

## Avisos del macrófago

Cinco efectos breves acompañan la detección, preparación de captura, cierre de copa, captura y abandono de persecución. El aviso de apertura dura menos que la preparación visual del ataque. La captura tiene su propio descenso sonoro y ya no reutiliza el aviso de tiempo agotado. La detección suena al pasar de patrulla a persecución, sin repetirse en cada actualización. Los avisos de ataque se cancelan al entrar en infección, minijuegos, escape o menú, y respetan las preferencias de audio y las pausas.

Regenerar solo estos archivos con `python audio/sonidos/generar_sonidos.py --enemies-only`, seguido de `python scripts/build_audio_catalog.py`. No requiere descargar grabaciones externas. Los demás sonidos de infección, construcción, lisis, liberación, energía, movimiento e interfaz conservan sus eventos existentes; el pop de burbujas continúa sin un aviso musical extra de racha.

## Abrir index.html directamente

En `file://`, Chromium bloquea `fetch()` de archivos locales. El motor carga `local-data.js` como script clásico y decodifica sus MP3 con Web Audio; así funcionan los efectos sin servidor. Ese archivo se genera junto con el catálogo mediante `python scripts/build_audio_catalog.py` e incluye la configuración predeterminada de `settings.json`. Solo se carga al abrir el juego como archivo local; por HTTP se conservan las descargas comprimidas bajo demanda. Las preferencias guardadas siguen teniendo prioridad en ambos modos.

La racha de burbujas se detiene en ×10 durante la superenergía: recoger más burbujas mantiene el pop y el total, pero no reinicia el multiplicador, el aviso de activación ni la duración del boost. Al agotarse se permite una nueva racha.

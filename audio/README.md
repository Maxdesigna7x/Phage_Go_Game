# Efectos del juego

`catalog.js` enumera los 58 efectos activos disponibles en `sonidos/web/`, en su mayoría generados localmente. Las explosiones de burbujas reutilizan una grabación CC0 importada; su procedencia está en [sonidos/fuentes/CREDITOS.md](sonidos/fuentes/CREDITOS.md). El catálogo no incluye `ambiente_menu`, `ambiente_exterior` ni `ambiente_interior`: el juego no carga música ni ambientes de fondo.

Para cada efecto, las rutas se ordenan por tamaño real. Se usa el archivo comprimido más pequeño que el navegador pueda reproducir; si la decodificación falla, se intenta el siguiente formato. Predomina MP3; para biosíntesis el OGG es menor. La suma de las opciones preferidas es 308.458 bytes (unos 301 KiB). Los WAV de `originales/` y el generador no se cargan en el juego.

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

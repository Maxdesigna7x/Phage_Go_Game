# Grabación de explosión de burbuja

- Título: **The Best Bubble Pop Sound For Game and UI**.
- Autor: **el_boss**.
- Página original: https://freesound.org/people/el_boss/sounds/669918/
- Archivo de escucha de alta calidad publicado por Freesound: https://cdn.freesound.org/previews/669/669918_9129912-hq.mp3
- Licencia verificada el 19 de octubre de 2026: **CC0 1.0 Universal**, https://creativecommons.org/publicdomain/zero/1.0/
- Descripción del autor: sesión de grabación de sonidos de burbujas para juegos. No detalla la técnica de grabación ni si se trata de una burbuja física o de Foley; no afirmar ese origen como comprobado.
- Archivo conservado: `el_boss_669918_bubble_pop.mp3`.
- Adaptación: codificación MP3 mono a 64 kbps y OGG calidad 3, sin filtros, cambios de tono, efectos ni reverberación. Se conserva la duración. Las cinco variantes anteriores reutilizan exactamente esta misma grabación, manteniendo los identificadores de las preferencias del usuario.
- Reconstrucción: `python scripts/import_bubble_pop.py` y después `python scripts/build_audio_catalog.py`.

El juego no reproduce la nota de racha junto a cada pop; conserva los avisos de superenergía. El generador procedural omite las explosiones de burbujas cuando está presente esta fuente, para no sobrescribir la grabación importada.

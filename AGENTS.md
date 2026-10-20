# Recursos gráficos

- Los originales se conservan en `assets/` (carpeta ignorada por Git). El juego carga los archivos de distribución desde `assets_webp/`.
- Usar WebP para nuevos sprites. Todos los sprites cargados por el juego deben ser WebP. La excepción heredada `DNA_icon.png` ya fue convertida a `DNA_icon.webp`. El proyecto ya utilizaba WebP con pérdida. No se pudo determinar la calidad de codificación histórica; no asumir que todos los archivos antiguos siguen el ajuste nuevo.
- Criterio para nuevas conversiones: Pillow, WebP con pérdida, `quality=90`, `method=6`, `exact=True`, RGBA. Ejecutar `python scripts/convert_assets.py assets/Nombre.png` (requiere Pillow).
- Conservar dimensiones originales, canal alfa y márgenes transparentes. No recortar ni centrar por separado las fases de una animación: sus coordenadas comunes forman parte del asset.
- Verificar dimensiones y alfa, y revisar visualmente el WebP antes de integrarlo. Si aparecen artefactos visibles, subir la calidad o usar WebP sin pérdida y documentar la excepción.
- Registrar las rutas nuevas en `ASSETS` dentro de `game.js`. Versionar los WebP de distribución y actualizar la versión del script en `index.html` al cambiar el juego.

## Bacterias con lienzo compartido

- Las siete fases activas proceden de `assets/new_size/` y se distribuyen en `assets_webp/new_size/`. Convertir con `python scripts/convert_assets.py --output-dir assets_webp/new_size assets/new_size/*.png`.
- Interior y exteriores 1–6 comparten un lienzo de **1001×535**. Conservarlo completo: el margen transparente fija la posición y permite que los fragmentos crezcan hacia fuera.
- `BACTERIA_CANVAS_WIDTH=1001` es la referencia de dibujado común; `BACTERIA_BODY_WIDTH=805` corresponde al ancho aproximado del cuerpo sano, usado para dimensionar las escenas del fondo. No normalizar cada fase por sus píxeles visibles ni recortar su alfa.
- Usar el mismo centro, rotación y escala al alternar fases. Las ocho imágenes decorativas `Bacteria_Background_*` siguen su normalización independiente por tamaño y no deben sustituirse por estas fases.

## Células, siluetas y generación

- Las 30 variantes de `assets/celulas/` se distribuyen en `assets_webp/celulas/`. Excepción explícita a la conservación de resolución: sus copias móviles se limitan a **512 px**, sin recortar ni alterar proporciones o márgenes. Los PNG originales permanecen intactos. Comando: `python scripts/convert_assets.py --max-size 512 --output-dir assets_webp/celulas assets/celulas/*.png`.
- Después de cambiar una célula o una fase de bacteria, ejecutar `python scripts/build_collision_shapes.py`. Requiere Pillow, NumPy y SciPy. Genera `world-shapes.js` con distancias firmadas desde alfa ≥48, radio y puntos de contorno. No generar estos campos ni leer píxeles por fotograma en el navegador.
- `world.js` define familias, información, tamaños y compatibilidad. Los identificadores `cell_<familia>_0<n>` corresponden a los WebP; no usar PNG desde el juego. Las plaquetas son fragmentos celulares móviles. Bacilos y espirilos nuevos solo se dibujan en el fondo, porque carecen del ciclo interior de la bacteria jugable.
- La generación usa una bacteria sana, una rota y dos células por bloque de 2×2 posiciones. No seleccionar proporciones independientemente por cada fotograma. Las proporciones visibles cambian al recortar el mundo y al infectarse bacterias.
- Mantener separación entre posiciones y sus radios visibles. La física reutiliza cuerpos que siguen en la vecindad activa, pero no conserva indefinidamente elementos de regiones lejanas.
- La brújula solo apunta a `isBacteriaInteractable`. El glow rojo de un elemento incompatible no debe habilitar Infectar. Las ayudas del ensamblaje siguen usando su glow dorado y su lógica de origen/destino.

## Macrófago de modo difícil

- `enemies.js` mantiene una única amenaza cercana, solo en difícil. La captura se anuncia y exige permanencia en la copa; nunca habilitar Infectar ni incluir enemigos en la brújula.
- Originales en `assets/macrofago/`; distribución en `assets_webp/macrofago/`. Reposo, apertura y cierre comparten lienzo **1254×1254**; conservar posiciones y alfa. Regenerar `world-shapes.js` tras cambiar fases. El generador incluye esa carpeta.
- El enemigo empuja células y bacterias con fuerza y velocidad limitadas; `targetBacteria` permanece anclada. Conservar las identidades y posiciones de los cuerpos dentro de la vecindad activa y los restos de una bacteria desplazada al completar su ciclo.
- Acople, inyección, minijuegos, lisis y escape suspenden la amenaza; el regreso al vuelo concede protección. Game Over debe funcionar con teclado, ratón y toque, y limpiar enemigos al regresar al menú.

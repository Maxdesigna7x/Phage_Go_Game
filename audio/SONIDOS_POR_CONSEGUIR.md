# Inventario de sonidos y especificación original de Phage GO

La búsqueda y producción descritas en este documento se completaron. El catálogo actual contiene 58 efectos en `audio/sonidos/web/`; consulta [audio/README.md](README.md) para saber qué se carga en el juego y cómo se aplican las preferencias. Las tablas siguientes conservan la especificación sonora de origen y el inventario de archivos como registro, no como lista de tareas pendientes.

## Criterios sonoros de producción

El sonido del juego es acuático, microscópico, orgánico, amable y ligeramente fantástico. Se evitan terror, explosiones violentas, chillidos y avisos agresivos. Los efectos frecuentes son cortos y suaves; las melodías comparten una familia de notas.

Los efectos se prepararon en formatos comprimidos para navegador y móvil. La mayoría se sintetizó localmente; las explosiones de burbujas usan una grabación CC0 importada, documentada en [CREDITOS.md](sonidos/fuentes/CREDITOS.md). Los bucles se suavizaron en sus extremos.

Las duraciones de la tabla siguiente son orientativas y corresponden a la especificación original. Varias interacciones comparten un sonido base o variantes moderadas.

## Menú y exploración

| Archivo propuesto | Contexto y disparador | Cómo debe sonar | Duración / variantes |
| --- | --- | --- | --- |
| `ambiente_menu` | Pantalla de inicio. | Agua tranquila, burbujas lejanas y notas brillantes muy espaciadas; relajante. | Bucle de 20–40 s. |
| `ui_pulsar` | Botones del menú, fullscreen y otras acciones de interfaz. | Un «plip» acuático claro y discreto. | 0,05–0,15 s. |
| `partida_iniciar` | Al comenzar una partida. | Barrido suave que abre el espacio, con una nota de bienvenida. | 0,5–1 s. |
| `ambiente_exterior` | Exploración libre entre bacterias. | Murmullo acuático tenue, pequeñas burbujas distantes; deja espacio a los efectos. | Bucle de 30–60 s. |
| `fago_nadar` | Mientras el jugador se desplaza. | «Fuuu» ligero y orgánico, sin motor mecánico. Intensidad ligada al movimiento, con entrada y salida suaves. | Bucle de 1–3 s. |
| `choque_suave` | Si existe una colisión física con respuesta visible. | «Bop» blando y elástico, sin indicar daño. | 0,1–0,25 s; 2–3 variantes. |
| `burbuja_explotar` | Cada burbuja que explota el jugador. | Pop húmedo, redondo y satisfactorio. Variar ligeramente según tamaño. | 0,08–0,3 s; 4–6 variantes. |
| `burbuja_racha` | Al aumentar la racha de burbujas dentro del plazo. | Nota muy corta que sube de tono con la racha; puede combinarse con el pop. | 0,08–0,2 s; un sonido afinable. |
| `burbuja_racha_fin` | Se agota el plazo de la racha sin alcanzar superenergía. | Una gotita descendente muy sutil; no debe sentirse como perder. | 0,15–0,3 s. Opcional. |
| `energia_activar` | Se alcanza una racha de 10 burbujas. | «Shiuum» ascendente con acorde alegre y chispa acuática. | 0,6–1 s. |
| `energia_activa` | Mientras está activa la velocidad extra. | Zumbido brillante muy tenue, con sensación de fluidez y pequeñas chispas. | Bucle de 1–3 s. |
| `energia_renovar` | Explotar otra burbuja mientras hay superenergía renueva su tiempo. | «Ting» corto integrado con el pop; no repetir la fanfarria de activación. | 0,1–0,2 s. |
| `energia_terminar` | La energía se acaba o se consume al iniciar una infección. | Descenso suave de tono que se apaga. | 0,3–0,6 s. |
| `bacteria_disponible` | Al entrar en rango de una bacteria que puede infectarse. | Una nota cálida de descubrimiento. Reproducir al entrar en rango, no continuamente. | 0,15–0,35 s. |

## Adsorción, inyección y entrada

| Archivo propuesto | Contexto y disparador | Cómo debe sonar | Duración / variantes |
| --- | --- | --- | --- |
| `infeccion_acercamiento` | El fago interpola su posición hasta posarse en la bacteria. | Barrido acuático breve, con sensación de aproximación. | 0,5–0,85 s. |
| `infeccion_anclaje` | Las fibras del fago se fijan a la superficie. | Pequeños «tic» orgánicos seguidos de un «plop» blando. | 0,2–0,4 s. |
| `adn_inyectar` | Mientras se mantiene la acción de inyectar ADN. | Pulsos líquidos o un flujo fino, con ritmo suave. Al soltar debe apagarse rápidamente sin error. | Bucle de 0,8–1,5 s. |
| `adn_inyeccion_completa` | Se termina de introducir el ADN. | «Gluup» pequeño seguido de una nota luminosa de confirmación. | 0,35–0,6 s. |
| `bacteria_entrar` | La cámara se acerca al interior para comenzar los minijuegos. | Barrido envolvente; sensación de sumergirse. El ambiente exterior puede amortiguarse durante la transición. | 0,8–1,5 s. |
| `ambiente_interior` | Durante los minijuegos dentro de la bacteria. | Agua amortiguada y pulsación orgánica muy suave; sin latidos inquietantes. Puede derivarse del ambiente exterior mediante filtro. | Bucle de 20–40 s, o reutilización procesada. |

## ADN y nucleótidos

| Archivo propuesto | Contexto y disparador | Cómo debe sonar | Duración / variantes |
| --- | --- | --- | --- |
| `adn_seleccionar` | Al tocar o tomar una molécula de ADN interactiva. | Toque cristalino blando y acuático. | 0,08–0,18 s. |
| `adn_copiar` | Una molécula se divide o aparece una nueva copia. | «Blip-blip» que sugiera duplicación. | 0,2–0,4 s; 2–3 variantes. |
| `adn_copias_completas` | Se alcanza el objetivo de copias y se pasa a la siguiente etapa. | Pequeña melodía ascendente de éxito. | 0,6–1 s. |
| `nucleotido_tomar` | Al agarrar una letra para arrastrarla. | «Tic» suave y preciso, que confirme la selección. | 0,05–0,12 s. |
| `nucleotido_encajar` | Una letra se coloca correctamente. | «Clac» acolchado más una nota agradable; puede progresar melódicamente. | 0,12–0,25 s. |
| `pieza_no_encaja` | Se suelta una letra o pieza en un destino incorrecto y vuelve a su origen. | «Poc» neutro, ligero y sin castigo; nada de buzzer de error. | 0,1–0,2 s. Compartido con ensamblaje. |
| `adn_secuencia_completa` | Se completa la secuencia de letras. | Melodía breve de unas cuatro notas, claramente satisfactoria. | 0,6–1 s. |

## Biosíntesis, empaquetado y ensamblaje

| Archivo propuesto | Contexto y disparador | Cómo debe sonar | Duración / variantes |
| --- | --- | --- | --- |
| `biosintesis_proceso` | Animación en la que el ADN da lugar a piezas del fago. | Pulsos y clics orgánicos rítmicos, como una pequeña fábrica biológica amable. | Bucle corto o secuencia de 2–4 s. |
| `pieza_aparecer` | Aparecen cabezas, cuerpos o fibras. | Pops ligeros diferenciados por tipo de pieza. | 0,1–0,2 s; 3 variantes. |
| `pieza_tomar` | Se toma una pieza para arrastrarla. | Toque suave con algo más de cuerpo que el de un nucleótido. | 0,08–0,18 s. |
| `adn_empaquetar` | El genoma entra en la cabeza del fago. | Barrido hacia dentro y pequeño clic de cierre al terminar. | 0,4–0,8 s. |
| `fago_unir_cabeza_cuerpo` | Encaja la cabeza con el cuerpo o cola. | «Cloc» pequeño, limpio y acolchado. | 0,15–0,3 s. |
| `fago_unir_fibras` | Se añaden las fibras y se completa el montaje. | Varios tics rápidos, como pequeñas conexiones que encajan. | 0,2–0,4 s. |
| `fago_construido` | Termina un fago y comienza a moverse dentro de la bacteria. | Trino alegre corto, con ligeras variantes para evitar repetición. | 0,35–0,6 s; 2–3 variantes. |
| `fagos_objetivo_completo` | Se alcanza el total requerido de fagos y comienza la lisis. | Acorde breve de celebración que enlaza con la siguiente etapa. | 0,7–1,2 s. |

## Lisis, liberación y vuelta al mundo

| Archivo propuesto | Contexto y disparador | Cómo debe sonar | Duración / variantes |
| --- | --- | --- | --- |
| `lisis_pulsar` | Cada pulsación de teclado o toque que aumenta la presión. | Golpecito orgánico y elástico. Aumentar ligeramente tono e intensidad con el progreso. | 0,07–0,15 s; 3–4 variantes. |
| `lisis_deterioro` | La bacteria cambia de asset a una etapa de destrucción mayor. | Crujido blando, húmedo y elástico; evitar huesos, cristales o daño corporal realista. | 0,2–0,45 s; varias intensidades. |
| `lisis_presion_maxima` | La presión llega al máximo, justo antes de estallar. | Crescendo corto que anticipa la liberación. | 0,4–0,7 s. |
| `bacteria_explotar` | Se rompe la bacteria y salen los fagos. | «Plooosh» amplio con gotas y burbujas; divertido y satisfactorio, sin violencia. | 0,7–1,2 s. |
| `fagos_liberar` | Los nuevos fagos se dispersan desde la bacteria. | Pequeños barridos suaves en abanico, con movimiento espacial. | 0,4–0,8 s; limitar voces simultáneas. |
| `fago_seguimiento` | La cámara sigue al fago protagonista hasta devolverle el control. | Whoosh fluido que se calma al estabilizarse la cámara. | 1–2 s, con fundido adaptable. |
| `ciclo_completo` | Se completa el ciclo y se vuelve a explorar. | Motivo musical breve y reconocible de logro. Coordinarlo con explosión y seguimiento para no saturar. | 1–1,5 s. |

## Fondo y cierre

| Archivo propuesto | Contexto y disparador | Cómo debe sonar | Duración / variantes |
| --- | --- | --- | --- |
| `fondo_infeccion` | Un fago ambiental infecta una bacteria en una capa lejana. | Versión distante y filtrada del anclaje; volumen muy bajo. | Reutilizar sonido de anclaje. Opcional. |
| `fondo_explosion` | Estalla una bacteria en el fondo. | Pop acuático lejano, filtrado y apagado, que no se confunda con la bacteria del jugador. | Reutilizar explosión procesada. Opcional. |
| `partida_tiempo_agotado` | Final del tiempo global en modo difícil. | Melodía de cierre amable, sin sensación de regaño. | 1–2 s. |
| `volver_menu` | Se sale de la partida hacia el menú. | Barrido descendente corto y toque de confirmación. | 0,3–0,6 s. |

## Indicaciones para quien busque los archivos

El catálogo actual integra efectos de interfaz, exploración, infección, ADN y nucleótidos, biosíntesis, ensamblaje, lisis y finales de partida. No se cargan ambientes continuos. Para la lista de archivos activos, consultar el catálogo y la descripción actual en audio/README.md.

## Registro de archivos producidos

Los efectos sintetizados localmente se generaron con [generar_sonidos.py](sonidos/generar_sonidos.py). Sus másteres son WAV PCM estéreo de 44,1 kHz y 16 bits en `audio/sonidos/originales/`; las versiones comprimidas OGG Vorbis y MP3 están en `audio/sonidos/web/`. Las explosiones de burbujas son la excepción: reutilizan una grabación externa CC0, con fuente y tratamiento descritos en [CREDITOS.md](sonidos/fuentes/CREDITOS.md). El juego usa el catálogo de `audio/catalog.js`; no carga música ni ambientes continuos.

| Identificador(es) | Archivos locales (máster y versiones web) | Fuente / autor | Licencia / atribución | Duración y observaciones |
| --- | --- | --- | --- | --- |
| `ambiente_menu` | [WAV](sonidos/originales/ambiente_menu.wav) · [OGG](sonidos/web/ambiente_menu.ogg) · [MP3](sonidos/web/ambiente_menu.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 30.00 s; Bucle con cierre suavizado; cama cálida y notas espaciadas. |
| `ambiente_exterior` | [WAV](sonidos/originales/ambiente_exterior.wav) · [OGG](sonidos/web/ambiente_exterior.ogg) · [MP3](sonidos/web/ambiente_exterior.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 36.00 s; Bucle con cierre suavizado; burbujas escasas para dejar espacio a los efectos. |
| `ambiente_interior` | [WAV](sonidos/originales/ambiente_interior.wav) · [OGG](sonidos/web/ambiente_interior.ogg) · [MP3](sonidos/web/ambiente_interior.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 28.00 s; Bucle amortiguado; pulso fluido muy tenue. |
| `fago_nadar` | [WAV](sonidos/originales/fago_nadar.wav) · [OGG](sonidos/web/fago_nadar.ogg) · [MP3](sonidos/web/fago_nadar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 2.40 s; Bucle suave de propulsión acuática; ajustar volumen según movimiento. |
| `energia_activa` | [WAV](sonidos/originales/energia_activa.wav) · [OGG](sonidos/web/energia_activa.ogg) · [MP3](sonidos/web/energia_activa.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 2.00 s; Bucle brillante muy tenue; no requiere emitir un sonido en cada latido visual. |
| `biosintesis_proceso` | [WAV](sonidos/originales/biosintesis_proceso.wav) · [OGG](sonidos/web/biosintesis_proceso.ogg) · [MP3](sonidos/web/biosintesis_proceso.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 3.20 s; Bucle de pulsos y clics orgánicos. |
| `adn_inyectar` | [WAV](sonidos/originales/adn_inyectar.wav) · [OGG](sonidos/web/adn_inyectar.ogg) · [MP3](sonidos/web/adn_inyectar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 1.20 s; Bucle de flujo y pulsos; aplicar fundido corto al soltar. |
| `ui_pulsar` | [WAV](sonidos/originales/ui_pulsar.wav) · [OGG](sonidos/web/ui_pulsar.ogg) · [MP3](sonidos/web/ui_pulsar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.15 s; Plip cristalino discreto. |
| `partida_iniciar` | [WAV](sonidos/originales/partida_iniciar.wav) · [OGG](sonidos/web/partida_iniciar.ogg) · [MP3](sonidos/web/partida_iniciar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.85 s; Barrido ascendente con nota de bienvenida. |
| `choque_suave` | [WAV](sonidos/originales/choque_suave_01.wav) · [OGG](sonidos/web/choque_suave_01.ogg) · [MP3](sonidos/web/choque_suave_01.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.24 s; Variación ligera de tono; contacto blando, sin indicar daño. |
| `choque_suave` | [WAV](sonidos/originales/choque_suave_02.wav) · [OGG](sonidos/web/choque_suave_02.ogg) · [MP3](sonidos/web/choque_suave_02.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.27 s; Variación ligera de tono; contacto blando, sin indicar daño. |
| `choque_suave` | [WAV](sonidos/originales/choque_suave_03.wav) · [OGG](sonidos/web/choque_suave_03.ogg) · [MP3](sonidos/web/choque_suave_03.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.30 s; Variación ligera de tono; contacto blando, sin indicar daño. |
| `burbuja_explotar` | [WAV](sonidos/originales/burbuja_explotar_01.wav) · [OGG](sonidos/web/burbuja_explotar_01.ogg) · [MP3](sonidos/web/burbuja_explotar_01.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.24 s; Pop redondo; cinco variaciones cortas de tono y duración. |
| `burbuja_explotar` | [WAV](sonidos/originales/burbuja_explotar_02.wav) · [OGG](sonidos/web/burbuja_explotar_02.ogg) · [MP3](sonidos/web/burbuja_explotar_02.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.27 s; Pop redondo; cinco variaciones cortas de tono y duración. |
| `burbuja_explotar` | [WAV](sonidos/originales/burbuja_explotar_03.wav) · [OGG](sonidos/web/burbuja_explotar_03.ogg) · [MP3](sonidos/web/burbuja_explotar_03.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.29 s; Pop redondo; cinco variaciones cortas de tono y duración. |
| `burbuja_explotar` | [WAV](sonidos/originales/burbuja_explotar_04.wav) · [OGG](sonidos/web/burbuja_explotar_04.ogg) · [MP3](sonidos/web/burbuja_explotar_04.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.32 s; Pop redondo; cinco variaciones cortas de tono y duración. |
| `burbuja_explotar` | [WAV](sonidos/originales/burbuja_explotar_05.wav) · [OGG](sonidos/web/burbuja_explotar_05.ogg) · [MP3](sonidos/web/burbuja_explotar_05.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.26 s; Pop redondo; cinco variaciones cortas de tono y duración. |
| `burbuja_racha` | [WAV](sonidos/originales/burbuja_racha.wav) · [OGG](sonidos/web/burbuja_racha.ogg) · [MP3](sonidos/web/burbuja_racha.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.20 s; Nota ascendente afinable para la racha. |
| `burbuja_racha_fin` | [WAV](sonidos/originales/burbuja_racha_fin.wav) · [OGG](sonidos/web/burbuja_racha_fin.ogg) · [MP3](sonidos/web/burbuja_racha_fin.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.28 s; Gota descendente sutil. |
| `energia_activar` | [WAV](sonidos/originales/energia_activar.wav) · [OGG](sonidos/web/energia_activar.ogg) · [MP3](sonidos/web/energia_activar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.90 s; Barrido ascendente con acorde alegre. |
| `energia_renovar` | [WAV](sonidos/originales/energia_renovar.wav) · [OGG](sonidos/web/energia_renovar.ogg) · [MP3](sonidos/web/energia_renovar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.17 s; Ting breve; no repite la fanfarria. |
| `energia_terminar` | [WAV](sonidos/originales/energia_terminar.wav) · [OGG](sonidos/web/energia_terminar.ogg) · [MP3](sonidos/web/energia_terminar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.48 s; Descenso suave de tono. |
| `bacteria_disponible` | [WAV](sonidos/originales/bacteria_disponible.wav) · [OGG](sonidos/web/bacteria_disponible.ogg) · [MP3](sonidos/web/bacteria_disponible.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.33 s; Nota cálida de descubrimiento. |
| `infeccion_acercamiento` | [WAV](sonidos/originales/infeccion_acercamiento.wav) · [OGG](sonidos/web/infeccion_acercamiento.ogg) · [MP3](sonidos/web/infeccion_acercamiento.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.74 s; Barrido breve de aproximación. |
| `infeccion_anclaje` | [WAV](sonidos/originales/infeccion_anclaje.wav) · [OGG](sonidos/web/infeccion_anclaje.ogg) · [MP3](sonidos/web/infeccion_anclaje.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.37 s; Tics orgánicos y plop acolchado. |
| `adn_inyeccion_completa` | [WAV](sonidos/originales/adn_inyeccion_completa.wav) · [OGG](sonidos/web/adn_inyeccion_completa.ogg) · [MP3](sonidos/web/adn_inyeccion_completa.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.55 s; Gluup y confirmación luminosa. |
| `bacteria_entrar` | [WAV](sonidos/originales/bacteria_entrar.wav) · [OGG](sonidos/web/bacteria_entrar.ogg) · [MP3](sonidos/web/bacteria_entrar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 1.30 s; Barrido de inmersión envolvente. |
| `adn_seleccionar` | [WAV](sonidos/originales/adn_seleccionar.wav) · [OGG](sonidos/web/adn_seleccionar.ogg) · [MP3](sonidos/web/adn_seleccionar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.16 s; Toque cristalino blando. |
| `adn_copiar` | [WAV](sonidos/originales/adn_copiar.wav) · [OGG](sonidos/web/adn_copiar.ogg) · [MP3](sonidos/web/adn_copiar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.38 s; Doble blip ascendente. |
| `adn_copias_completas` | [WAV](sonidos/originales/adn_copias_completas.wav) · [OGG](sonidos/web/adn_copias_completas.ogg) · [MP3](sonidos/web/adn_copias_completas.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.90 s; Melodía ascendente de cuatro notas. |
| `nucleotido_tomar` | [WAV](sonidos/originales/nucleotido_tomar.wav) · [OGG](sonidos/web/nucleotido_tomar.ogg) · [MP3](sonidos/web/nucleotido_tomar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.13 s; Tic suave y preciso. |
| `nucleotido_encajar` | [WAV](sonidos/originales/nucleotido_encajar.wav) · [OGG](sonidos/web/nucleotido_encajar.ogg) · [MP3](sonidos/web/nucleotido_encajar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.24 s; Encaje acolchado con nota agradable. |
| `pieza_no_encaja` | [WAV](sonidos/originales/pieza_no_encaja.wav) · [OGG](sonidos/web/pieza_no_encaja.ogg) · [MP3](sonidos/web/pieza_no_encaja.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.19 s; Poc neutro, ligero y sin castigo. |
| `adn_secuencia_completa` | [WAV](sonidos/originales/adn_secuencia_completa.wav) · [OGG](sonidos/web/adn_secuencia_completa.ogg) · [MP3](sonidos/web/adn_secuencia_completa.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.96 s; Melodía de cuatro notas en la misma familia tonal. |
| `pieza_aparecer` | [WAV](sonidos/originales/pieza_aparecer_01.wav) · [OGG](sonidos/web/pieza_aparecer_01.ogg) · [MP3](sonidos/web/pieza_aparecer_01.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.22 s; Pop ligero; variante por tono y paneo estéreo. |
| `pieza_aparecer` | [WAV](sonidos/originales/pieza_aparecer_02.wav) · [OGG](sonidos/web/pieza_aparecer_02.ogg) · [MP3](sonidos/web/pieza_aparecer_02.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.22 s; Pop ligero; variante por tono y paneo estéreo. |
| `pieza_aparecer` | [WAV](sonidos/originales/pieza_aparecer_03.wav) · [OGG](sonidos/web/pieza_aparecer_03.ogg) · [MP3](sonidos/web/pieza_aparecer_03.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.22 s; Pop ligero; variante por tono y paneo estéreo. |
| `pieza_tomar` | [WAV](sonidos/originales/pieza_tomar.wav) · [OGG](sonidos/web/pieza_tomar.ogg) · [MP3](sonidos/web/pieza_tomar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.19 s; Toque con algo más de cuerpo que el nucleótido. |
| `adn_empaquetar` | [WAV](sonidos/originales/adn_empaquetar.wav) · [OGG](sonidos/web/adn_empaquetar.ogg) · [MP3](sonidos/web/adn_empaquetar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.70 s; Barrido hacia dentro con toque de cierre. |
| `fago_unir_cabeza_cuerpo` | [WAV](sonidos/originales/fago_unir_cabeza_cuerpo.wav) · [OGG](sonidos/web/fago_unir_cabeza_cuerpo.ogg) · [MP3](sonidos/web/fago_unir_cabeza_cuerpo.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.29 s; Cloc limpio y acolchado. |
| `fago_unir_fibras` | [WAV](sonidos/originales/fago_unir_fibras.wav) · [OGG](sonidos/web/fago_unir_fibras.ogg) · [MP3](sonidos/web/fago_unir_fibras.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.38 s; Cuatro tics rápidos de conexión. |
| `fago_construido` | [WAV](sonidos/originales/fago_construido_01.wav) · [OGG](sonidos/web/fago_construido_01.ogg) · [MP3](sonidos/web/fago_construido_01.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.50 s; Trino corto; tres variaciones de altura. |
| `fago_construido` | [WAV](sonidos/originales/fago_construido_02.wav) · [OGG](sonidos/web/fago_construido_02.ogg) · [MP3](sonidos/web/fago_construido_02.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.50 s; Trino corto; tres variaciones de altura. |
| `fago_construido` | [WAV](sonidos/originales/fago_construido_03.wav) · [OGG](sonidos/web/fago_construido_03.ogg) · [MP3](sonidos/web/fago_construido_03.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.50 s; Trino corto; tres variaciones de altura. |
| `fagos_objetivo_completo` | [WAV](sonidos/originales/fagos_objetivo_completo.wav) · [OGG](sonidos/web/fagos_objetivo_completo.ogg) · [MP3](sonidos/web/fagos_objetivo_completo.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 1.10 s; Acorde de celebración que enlaza con la lisis. |
| `lisis_pulsar` | [WAV](sonidos/originales/lisis_pulsar_01.wav) · [OGG](sonidos/web/lisis_pulsar_01.ogg) · [MP3](sonidos/web/lisis_pulsar_01.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.16 s; Golpe orgánico; cuatro alturas ascendentes para graduar progreso. |
| `lisis_pulsar` | [WAV](sonidos/originales/lisis_pulsar_02.wav) · [OGG](sonidos/web/lisis_pulsar_02.ogg) · [MP3](sonidos/web/lisis_pulsar_02.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.16 s; Golpe orgánico; cuatro alturas ascendentes para graduar progreso. |
| `lisis_pulsar` | [WAV](sonidos/originales/lisis_pulsar_03.wav) · [OGG](sonidos/web/lisis_pulsar_03.ogg) · [MP3](sonidos/web/lisis_pulsar_03.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.16 s; Golpe orgánico; cuatro alturas ascendentes para graduar progreso. |
| `lisis_pulsar` | [WAV](sonidos/originales/lisis_pulsar_04.wav) · [OGG](sonidos/web/lisis_pulsar_04.ogg) · [MP3](sonidos/web/lisis_pulsar_04.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.16 s; Golpe orgánico; cuatro alturas ascendentes para graduar progreso. |
| `lisis_deterioro` | [WAV](sonidos/originales/lisis_deterioro_01.wav) · [OGG](sonidos/web/lisis_deterioro_01.ogg) · [MP3](sonidos/web/lisis_deterioro_01.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.32 s; Crujido húmedo suave; tres intensidades, sin daño realista. |
| `lisis_deterioro` | [WAV](sonidos/originales/lisis_deterioro_02.wav) · [OGG](sonidos/web/lisis_deterioro_02.ogg) · [MP3](sonidos/web/lisis_deterioro_02.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.40 s; Crujido húmedo suave; tres intensidades, sin daño realista. |
| `lisis_deterioro` | [WAV](sonidos/originales/lisis_deterioro_03.wav) · [OGG](sonidos/web/lisis_deterioro_03.ogg) · [MP3](sonidos/web/lisis_deterioro_03.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.50 s; Crujido húmedo suave; tres intensidades, sin daño realista. |
| `lisis_presion_maxima` | [WAV](sonidos/originales/lisis_presion_maxima.wav) · [OGG](sonidos/web/lisis_presion_maxima.ogg) · [MP3](sonidos/web/lisis_presion_maxima.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.64 s; Crescendo breve previo a la liberación. |
| `bacteria_explotar` | [WAV](sonidos/originales/bacteria_explotar.wav) · [OGG](sonidos/web/bacteria_explotar.ogg) · [MP3](sonidos/web/bacteria_explotar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 1.08 s; Plooosh amplio con burbujas; sin carácter violento. |
| `fagos_liberar` | [WAV](sonidos/originales/fagos_liberar.wav) · [OGG](sonidos/web/fagos_liberar.ogg) · [MP3](sonidos/web/fagos_liberar.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.74 s; Barridos cortos en abanico; repartir con moderación. |
| `fago_seguimiento` | [WAV](sonidos/originales/fago_seguimiento.wav) · [OGG](sonidos/web/fago_seguimiento.ogg) · [MP3](sonidos/web/fago_seguimiento.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 1.60 s; Whoosh fluido de cámara, termina calmado. |
| `ciclo_completo` | [WAV](sonidos/originales/ciclo_completo.wav) · [OGG](sonidos/web/ciclo_completo.ogg) · [MP3](sonidos/web/ciclo_completo.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 1.30 s; Motivo melódico de logro. |
| `fondo_infeccion` | [WAV](sonidos/originales/fondo_infeccion.wav) · [OGG](sonidos/web/fondo_infeccion.ogg) · [MP3](sonidos/web/fondo_infeccion.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.37 s; Derivado filtrado y muy bajo del anclaje. |
| `fondo_explosion` | [WAV](sonidos/originales/fondo_explosion.wav) · [OGG](sonidos/web/fondo_explosion.ogg) · [MP3](sonidos/web/fondo_explosion.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 1.08 s; Derivado con filtro pasa-bajos para distancia. |
| `partida_tiempo_agotado` | [WAV](sonidos/originales/partida_tiempo_agotado.wav) · [OGG](sonidos/web/partida_tiempo_agotado.ogg) · [MP3](sonidos/web/partida_tiempo_agotado.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 1.55 s; Cierre amable, sin regaño. |
| `volver_menu` | [WAV](sonidos/originales/volver_menu.wav) · [OGG](sonidos/web/volver_menu.ogg) · [MP3](sonidos/web/volver_menu.mp3) | Síntesis procedural local / Codex | Sin muestras de terceros; sin atribución externa. | 0.52 s; Barrido descendente y toque de confirmación. |

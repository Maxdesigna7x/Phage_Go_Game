# Cambios solicitados — 19 de octubre de 2026

- [x] Restaurar todos los assets de destrucción de la bacteria hasta la lisis.
- [x] Eliminar aros y su panel.
- [x] Contador flotante de burbujas y combo de diez con caducidad.
- [x] Superenergía temporal renovable: velocidad y efecto de pantalla; termina al infectar.
- [x] Ensamblaje: señalar solo la pieza que se mueve y su destino al arrastrar.
- [x] Glow pulsante siguiendo la silueta, sin círculos de ayuda.
- [x] Fagos construidos nadando y separados dentro de la bacteria.
- [x] Llenar cualquier pantalla horizontal sin bandas; solicitar giro y pantalla completa en móvil.
- [x] Verificar lógica, controles y presentación.
- [x] Publicar la aplicación y entregar el enlace online.

Verificación: 30 pruebas automatizadas; revisión visual en 1024×768 y 844×390, sin bandas y sin errores de consola.

Publicación: GitHub Pages desde `main` en https://maxdesigna7x.github.io/Phage_Go_Game/


# Tutorial visual — 20 de octubre de 2026

- Punteros originales `pointing_pulse_on/off` convertidos a WebP con lienzo y alfa intactos.
- Ayudas animadas para movimiento, mantener sobre bacteria, inyección, duplicar/procesar ADN, arrastrar letras, las tres uniones del fago y pulsaciones de lisis.
- Cada ayuda se retira al completar su acción y se recuerda localmente entre partidas. Las demostraciones solo mueven el puntero.
- Se retira el botón de infección: mantener sobre una bacteria compatible al alcance inicia el acople y permite continuar inyectando. Se conservan teclado y accesibilidad.
- Verificación: 108 pruebas, revisión visual y recorrido en navegador desde pulsación sobre bacteria hasta ADN, sin errores de consola.

Detalle y lista de cambios: [docs/tutorial-visual.md](docs/tutorial-visual.md).

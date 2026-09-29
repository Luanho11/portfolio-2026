# Luis Hostos — Portfolio web

Portfolio de Luis Hostos: landing con efecto de tinta, proyectos con capturas reales, perfil con stack ligado a proyectos y servicios para empresas. Selector ES/EN.

## Ejecutar

```bash
npm install
npm run dev
```

## Publicar en GitHub Pages

GitHub Pages **no puede servir el código fuente directamente**: las imágenes viven en `public/` y el JS importa paquetes de npm (`lenis`), así que hay que compilar. Si Pages publica la rama tal cual, las capturas dan 404, la página de proyectos no arranca y todo carga sin optimizar (esa era la causa de las imágenes rotas y la lentitud).

El flujo `.github/workflows/deploy.yml` compila y publica en cada `push` a `main`:

1. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions** (una sola vez; si dice "Deploy from a branch", está mal).
2. Haz `push` a `main` (o en **Actions → Publicar en GitHub Pages → Run workflow**). Al terminar, el sitio queda actualizado.
3. Comprobación rápida: `https://luanho11.github.io/portfolio-2026/src/main.js` debe dar 404; si muestra código, Pages sigue sirviendo la rama.

Para probar el resultado en local: `npm run build && npm run preview`.

## Proyectos

Cada panel de `projects.html` es un `<button class="reel-card">` con sus textos en atributos `data-*` (ES/EN):
`data-title-*`, `data-label-*`, `data-kicker-*`, `data-context-*` (empresa/tipo y año), `data-desc-*` (la línea que aparece bajo los paneles al pasar el cursor), `data-problem-*` y `data-solution-*` (bloques negro y blanco del detalle), `data-wins-*` (separados por `|`), `data-metric-*` y `data-metric-label-*` (opcional: resultado en cifras, se muestra como aproximado), `data-before` y `data-before-captions-*` (opcional: capturas del sitio anterior; activan los botones Antes / Ahora del carrusel), `data-cta-*`, `data-href` y `data-tech`.

- La imagen del `<img>` es la del panel. Si el panel usa una captura vertical (móvil), `data-hero` indica la captura de escritorio para el banner del detalle; en móvil el detalle usa la del panel.
- `data-gallery` lista las diapositivas del carrusel separadas por `|` (todas locales, en `public/projects/`). Una diapositiva `escritorio.webp+movil.webp` muestra la versión móvil superpuesta a la de escritorio. `data-captions-es` / `data-captions-en` describen cada diapositiva en el mismo orden (se usan como texto alternativo). Se navega con flechas, teclado, arrastre, trackpad o miniaturas, y un clic amplía la captura.
- Los proyectos técnicos usan un afiche propio en el panel (`*-card.webp`: esquema de endpoints, flujo de autenticación o capturas reales) y su versión horizontal como banner y primera diapositiva.
- Los proyectos profesionales van en `<li class="reel-item reel-item--featured">` (más grandes); los técnicos en `reel-item`.
- Al final del detalle hay un CTA a WhatsApp con el nombre del proyecto ya escrito en el mensaje.
- Se puede abrir un proyecto directamente con su id en la URL, por ejemplo `projects.html#noova`.

## Menú en celular

En pantallas de hasta 640 px, la cabecera queda en una sola fila y la navegación se abre con el botón "Menú" (lo agrega `src/main.js`; sin JavaScript la navegación se ve completa).

## Servicios: preguntas frecuentes

Cuatro preguntas cerradas por defecto (`<details>`), antes del llamado final. Sin precios.

## CV

`public/LUIS-HOSTOS-CV.pdf` es el CV de una página. Los certificados van en un PDF aparte, fuera del sitio.

## Volver arriba

En todas las páginas aparece un botón abajo a la derecha al bajar (el menú no es fijo). Con un proyecto abierto, sube dentro del detalle. Código en `src/main.js`.

## Traducciones

El inglés se aplica con el mapa `COPY_EN` de `src/main.js`, que busca el texto en español exacto. Si editas una frase, actualiza también su clave en `COPY_EN`. En `npm run dev`, la consola avisa con `[i18n] Falta traducción EN` cuando un texto en español queda sin traducir.

## Iconos y fuentes

Los iconos de tecnologías están en `public/icons/` (Simple Icons, CC0) y se muestran con el color de cada marca. Las fuentes se sirven desde `src/fonts/` (SIL OFL), sin CDN: **Bricolage Grotesque** para títulos e interfaz y **Newsreader** (reducida a peso 400 y a los caracteres de español/inglés) para el texto de lectura y las etiquetas en cursiva.

## Formación y certificaciones

`credentials.html` es un carrusel 3D: cada `<button class="cred-card">` define su título (`data-t-es`/`data-t-en`, líneas separadas por `|`), subtítulo (`data-s-*`), etiqueta (`data-tag-*`) e imagen (`data-img`). Detrás del carrusel se ve, grande y tenue, el documento que está al frente. Se navega con flechas, teclado, arrastre o los puntos; al hacer clic en la tarjeta central se abre el certificado.

El scroll del detalle de proyectos usa [Lenis](https://github.com/darkroomengineering/lenis) (incluido en `package.json`).

## Inicio: efectos al bajar

- **Proyectos destacados:** en escritorio la captura queda fija en el centro de la pantalla mientras los textos pasan a su lado; al llegar al siguiente proyecto, la captura se funde con la nueva. Empieza alineada con el primer proyecto y termina alineada con el último. Los textos entran desenfocados desde abajo y se desenfocan al salir por arriba (`data-letter-fx`). En móvil cada captura va con su texto. Código en `src/home.js`.
- Todo sigue al scroll con inercia y no se anima con "reducir movimiento".

## Servicios: detalles

Sin título grande: una etiqueta "Servicios" con un punto de color, iconos de línea en las pestañas y en los pasos de "Cómo trabajo".

## Color

Además del negro y el verde azulado (`--accent`), el sitio usa un tono sanguina (`--sanguine`) en detalles: el punto final de los títulos del inicio, la empresa de cada proyecto, las flechas al pasar el cursor y los iconos de Servicios.

## Logos

Isotipos sin placa en `public/logos/`: `noova-mark.webp` y `deriva-mark.webp` (sacados de los sitios oficiales), `upn.svg` y `cibertec-mark.svg` (de los logos oficiales en SVG).

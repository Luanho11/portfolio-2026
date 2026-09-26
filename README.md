# Luis Hostos — Portfolio web

Versión refinada con landing fija, selector ES/EN, proyectos con capturas reales, stack ligado a proyectos y servicios para empresas.

## Ejecutar

```bash
npm install
npm run dev
```

## Publicar en GitHub Pages

GitHub Pages **no puede servir el código fuente directamente**: las imágenes viven en `public/` y el JS importa paquetes de npm (`lenis`), así que hay que compilar. El flujo `.github/workflows/deploy.yml` lo hace solo en cada `push` a `main`:

1. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions** (una sola vez).
2. Haz `push` a `main`. En la pestaña **Actions** verás el flujo "Publicar en GitHub Pages"; al terminar, el sitio queda actualizado.

Para probar el resultado en local: `npm run build && npm run preview`.

## Proyectos

Cada panel de `projects.html` es un `<button class="reel-card">` con sus textos en atributos `data-*` (ES/EN):
`data-title-*`, `data-label-*`, `data-kicker-*`, `data-context-*` (empresa/tipo y año), `data-role-*` (opcional), `data-desc-*`, `data-wins-*` (separados por `|`), `data-note-*` (nota corta sobre las capturas), `data-cta-*`, `data-href` y `data-tech`.

- La imagen del `<img>` es la del panel. Si el panel usa una captura vertical (móvil), `data-hero` indica la captura de escritorio para el detalle; en móvil el detalle usa la del panel.
- `data-gallery` lista las capturas del detalle separadas por `|` (todas locales, en `public/projects/`), y `data-captions-es` / `data-captions-en` su pie de foto en el mismo orden. El detalle las muestra en un carrusel con miniaturas; se navega con flechas, teclado, arrastre o trackpad, y un clic amplía la captura.
- Las capturas cuyo nombre incluye `movil` o `mobile` se muestran dentro de un marco de teléfono.
- Los proyectos profesionales van en `<li class="reel-item reel-item--featured">` (más grandes); los académicos en `reel-item`.
- Al final del detalle hay un CTA a WhatsApp con el nombre del proyecto ya escrito en el mensaje, y un enlace al siguiente proyecto.
- Se puede abrir un proyecto directamente con su id en la URL, por ejemplo `projects.html#noova`.

## Traducciones

El inglés se aplica con el mapa `COPY_EN` de `src/main.js`, que busca el texto en español exacto. Si editas una frase, actualiza también su clave en `COPY_EN`. En `npm run dev`, la consola avisa con `[i18n] Falta traducción EN` cuando un texto en español queda sin traducir.

## Iconos y fuentes

Los iconos de tecnologías están en `public/icons/` (Simple Icons, CC0) y se muestran con el color de cada marca. Las fuentes (Bricolage Grotesque y Manrope, SIL OFL) se sirven desde `src/fonts/`; no hay dependencias de CDN.

## Formación y certificaciones

`credentials.html` es un carrusel 3D: cada `<button class="cred-card">` define su título (`data-t-es`/`data-t-en`, líneas separadas por `|`), subtítulo (`data-s-*`), etiqueta (`data-tag-*`) e imagen (`data-img`). Se navega con flechas, teclado, arrastre o los puntos; al hacer clic en la tarjeta central se abre el certificado.

El scroll del detalle de proyectos usa [Lenis](https://github.com/darkroomengineering/lenis) (incluido en `package.json`).

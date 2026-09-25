# Luis Hostos — Portfolio web

Versión refinada con landing fija, selector ES/EN, proyectos con capturas reales, stack ligado a proyectos y servicios para empresas.

## Ejecutar

```bash
npm install
npm run dev
```

## Publicar

```bash
npm run build
```

El build mantiene las rutas relativas para GitHub Pages.

## Proyectos

Cada panel de `projects.html` es un `<button class="reel-card">` con sus textos en atributos `data-*` (ES/EN):
`data-title-*`, `data-label-*`, `data-kicker-*`, `data-context-*` (empresa/tipo y año), `data-role-*` (opcional), `data-desc-*`, `data-wins-*` (separados por `|`), `data-note-*` (nota corta sobre las capturas), `data-cta-*`, `data-href` y `data-tech`.

- La imagen del `<img>` es la del panel. Si el panel usa una captura vertical (móvil), `data-hero` indica la captura de escritorio para el detalle; en móvil el detalle usa la del panel.
- `data-gallery` lista las capturas del detalle separadas por `|`. Todas son locales (`public/projects/`); no se usan imágenes de stock.
- Los proyectos profesionales van en `<li class="reel-item reel-item--featured">` (más grandes); los académicos en `reel-item`.
- Al final del detalle hay un CTA a WhatsApp con el nombre del proyecto ya escrito en el mensaje.
- Se puede abrir un proyecto directamente con su id en la URL, por ejemplo `projects.html#noova`.

## Traducciones

El inglés se aplica con el mapa `COPY_EN` de `src/main.js`, que busca el texto en español exacto. Si editas una frase, actualiza también su clave en `COPY_EN`. En `npm run dev`, la consola avisa con `[i18n] Falta traducción EN` cuando un texto en español queda sin traducir.

## Iconos

Los iconos de tecnologías están en `public/icons/` (Simple Icons, CC0); no dependen de un CDN.

## Formación y certificaciones

`credentials.html` es un carrusel 3D: cada `<button class="cred-card">` define su título (`data-t-es`/`data-t-en`, líneas separadas por `|`), subtítulo (`data-s-*`), etiqueta (`data-tag-*`) e imagen (`data-img`). Se navega con flechas, teclado, arrastre o los puntos; al hacer clic en la tarjeta central se abre el certificado.

El scroll del detalle de proyectos usa [Lenis](https://github.com/darkroomengineering/lenis) (incluido en `package.json`).

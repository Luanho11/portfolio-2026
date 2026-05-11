# Portfolio — Luis Hostos

Portfolio personal de desarrollador web freelance.

## Estructura

```
portfolio/
├── index.html          # Página principal
├── img/
│   └── fotoperfil.jpg  # Foto de perfil
├── css/
│   ├── base.css        # Variables CSS, reset, estilos globales, mouse glow, scroll reveal
│   ├── navbar.css      # Barra de navegación fija
│   ├── hero.css        # Sección hero, foto, texto, botones, social
│   ├── sections.css    # Servicios, proceso, experiencia, formación, skills, proyectos, contacto
│   ├── footer.css      # Footer, scroll-top, WhatsApp float
│   ├── loader.css      # Pantalla de carga
│   └── responsive.css  # Media queries, utilidades de color
└── js/
    ├── loader.js           # Loader curtain
    ├── particles-system.js # Partículas flotantes
    ├── mouse-effects.js    # Efecto glow del mouse
    ├── scroll-animations.js # Animaciones al hacer scroll
    ├── hero-animations.js  # Animaciones hero (photo, name stagger, typing)
    ├── skills-interactions.js # Skills panel + parallax en proyectos
    ├── i18n.js             # Internacionalización ES/EN
    ├── theme.js            # Toggle dark/light
    ├── navigation.js       # Navbar, smooth scroll, progress bar
    └── main.js             # Orquestador de módulos
```

## Secciones

1. **Hero** — Foto con anillo verde, nombre con stagger, headline, typing effect, métricas, CTAs, redes sociales (GitHub, LinkedIn, Fiverr, Freelancer)
2. **Servicios** — Cards con imagen, descripción y precios en USD/PEN
3. **Proyectos** — Grid de cards con overlay y tech stack
4. **Cómo trabajo** — 5 pasos del proceso
5. **Trayectoria** — Timeline con experiencia y formación (incluye idiomas: Español, English, Français)
6. **Stack técnico** — Skills agrupados por categoría
7. **Contacto** — Email, teléfono, descarga CV, disponibilidad

## Características

- **Bilingüe**: ES/EN con toggle en navbar
- **Dark/Light mode**: Toggle con persistencia en localStorage
- **Responsive**: Mobile-first, adaptado a 768px y 480px
- **Animaciones**: Scroll reveal, typing effect, parallax, partículas
- **Sin dependencias de build**: HTML/CSS/JS puro

## Despliegue

1. Subir todos los archivos a un servidor estático
2. No requiere build process ni Node.js
3. Las imágenes de servicios y proyectos se cargan desde Unsplash (requieren internet)

## Convenciones

- CSS: Variables de diseño, kebab-case, comentarios cortos
- JS: Module Pattern (IIFE), sin dependencias externas
- HTML: data-i18n para traducciones, data-reveal para animaciones

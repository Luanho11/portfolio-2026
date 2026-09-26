const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');
const metaTheme = document.querySelector('meta[name="theme-color"]');

function updateTheme() {
  const dark = root.dataset.theme === 'dark';
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    const english = root.lang === 'en';
    const label = dark ? (english ? 'Switch to light mode' : 'Cambiar a modo claro') : (english ? 'Switch to dark mode' : 'Cambiar a modo oscuro');
    button.setAttribute('aria-label', label);
    button.title = label;
  });
  metaTheme?.setAttribute('content', dark ? '#111111' : '#f7f7f5');
  window.dispatchEvent(new Event('portfolio-theme-change'));
}

document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('portfolio-theme', root.dataset.theme); } catch { /* Theme still works without storage. */ }
    updateTheme();
  });
});
updateTheme();

const transitionStage = document.getElementById('transitionStage');
const pageOrder = new Map([
  ['index.html', 0],
  ['', 0],
  ['projects.html', 1],
  ['about.html', 2],
  ['credentials.html', 2.5],
  ['services.html', 3],
]);
const pageName = (pathname) => pathname.endsWith('/') ? 'index.html' : (pathname.split('/').filter(Boolean).pop() || 'index.html');
const currentRank = pageOrder.get(pageName(location.pathname)) ?? 0;
let leaving = false;

function resetTransition() {
  leaving = false;
  root.classList.remove('page-leaving', 'page-leaving-back');
  window.setTimeout(() => root.classList.remove('page-entering', 'page-entering-back'), 340);
}
window.addEventListener('pageshow', resetTransition);
resetTransition();

document.querySelectorAll('a[href]').forEach((link) => {
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || link.target || link.hasAttribute('download') || /\.(pdf|webp|png|jpe?g)$/i.test(url.pathname)) return;
  if (url.pathname === location.pathname || (link.hasAttribute('data-contact-trigger') && document.getElementById('contactDialog'))) return;

  link.addEventListener('click', (event) => {
    if (!transitionStage || reducedMotion.matches || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true;

    const destinationRank = pageOrder.get(pageName(url.pathname));
    const direction = destinationRank !== undefined && destinationRank < currentRank ? 'back' : 'forward';
    root.classList.add(direction === 'back' ? 'page-leaving-back' : 'page-leaving');
    try {
      sessionStorage.setItem('portfolio-transition', '1');
      sessionStorage.setItem('portfolio-transition-direction', direction);
    } catch { /* Navigation does not depend on storage. */ }
    window.setTimeout(() => location.assign(url.href), 270);
  });
});

const landing = document.getElementById('landing');
const canvas = document.getElementById('fx');

/* El hero ocupa exactamente la pantalla visible bajo la cabecera (que en móvil tiene dos filas). */
const siteHeader = document.querySelector('.site-header');
if (landing && siteHeader) {
  const syncHeaderHeight = () => root.style.setProperty('--header-h', `${siteHeader.offsetHeight}px`);
  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight, { passive: true });
}
if (landing && canvas && finePointer.matches && !reducedMotion.matches) {
  import('./fluid-graphite.js').then(({ createSplashCursor }) => {
    const effect = createSplashCursor(canvas, landing, {
      SIM_RESOLUTION: 144,
      DYE_RESOLUTION: 960,
      DENSITY_DISSIPATION: 3.55,
      VELOCITY_DISSIPATION: 1.86,
      PRESSURE: .10,
      PRESSURE_ITERATIONS: 20,
      CURL: 3.1,
      SPLAT_RADIUS: .092,
      DYE_RADIUS_SCALE: .58,
      VELOCITY_RADIUS_SCALE: .96,
      SPLAT_STRETCH: 2.45,
      SPLAT_FORCE: 6200,
      SHADING: true,
      INPUT_DEADZONE_PX: 4.5,
      TRAIL_SPACING_PX: 3.9,
      MAX_SEGMENT_SPLATS: 16,
      MAX_SPLATS_PER_FRAME: 16,
      VELOCITY_SMOOTHING: .72,
      PREDICTION_MS: 4.4,
      MAX_PREDICTION_PX: 7,
      CLICK_SPLAT: false,
      DPR_CAP: 1.8,
      COLOR_PALETTE: [[255,255,255],[236,236,236],[218,218,218]],
      COLOR_INTENSITY: .12,
      INK_OPACITY: .66,
      INK_DENSITY_GAIN: 5.15
    });
    if (!effect) return;
    let visible = true;
    let idle = false;
    let idleTimer;
    const syncEffect = () => {
      canvas.hidden = reducedMotion.matches;
      effect.setActive(visible && !idle && !document.hidden && !reducedMotion.matches);
    };
    const wakeEffect = () => {
      idle = false;
      clearTimeout(idleTimer);
      syncEffect();
      idleTimer = window.setTimeout(() => { idle = true; syncEffect(); }, 2600);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncEffect(); });
    observer.observe(landing);
    landing.addEventListener('pointerenter', wakeEffect, { passive:true });
    landing.addEventListener('pointermove', wakeEffect, { passive:true });
    document.addEventListener('visibilitychange', syncEffect);
    reducedMotion.addEventListener('change', syncEffect);
    window.addEventListener('pagehide', () => { clearTimeout(idleTimer); effect.setActive(false); });
    window.addEventListener('pageshow', wakeEffect);
    wakeEffect();
  }).catch(() => { canvas.hidden = true; });
}

const identityInner = document.getElementById('identityInner');
if (identityInner) {
  const identities = [
    'React · TypeScript · Vite',
    'Java · Spring Boot · REST',
    'Firebase · Firestore · Functions',
    'Python · SQL · APIs',
    'Ingeniería de Sistemas — UPN',
    'Computación e Informática — CIBERTEC',
  ];
  let index = 0;
  let timer;
  let animation;

  function stopRotation() {
    clearTimeout(timer);
    animation?.cancel();
    animation = null;
  }

  function scheduleRotation() {
    stopRotation();
    if (reducedMotion.matches || document.hidden) return;
    timer = setTimeout(async () => {
      try {
        animation = identityInner.animate([
          { transform: 'translateY(0)', opacity: 1 },
          { transform: 'translateY(125%)', opacity: 0 },
        ], { duration: 360, easing: 'cubic-bezier(.55,0,.3,1)', fill: 'forwards' });
        await animation.finished;
        index = (index + 1) % identities.length;
        identityInner.textContent = identities[index];
        animation.cancel();
        animation = identityInner.animate([
          { transform: 'translateY(-125%)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ], { duration: 440, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
        await animation.finished;
        scheduleRotation();
      } catch { /* Cancellation keeps the current technology line readable. */ }
    }, 3200);
  }

  document.addEventListener('visibilitychange', scheduleRotation);
  reducedMotion.addEventListener('change', scheduleRotation);
  window.addEventListener('pagehide', stopRotation);
  window.addEventListener('pageshow', scheduleRotation);
  scheduleRotation();
}

const contactDialog = document.getElementById('contactDialog');
document.querySelectorAll('[data-contact-trigger]').forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    if (!contactDialog) return;
    event.preventDefault();
    if (!contactDialog.open) {
      contactDialog.showModal();
      document.body.classList.add('contact-open');
    }
  });
});
document.querySelectorAll('[data-contact-close]').forEach((button) => button.addEventListener('click', () => contactDialog?.close()));
contactDialog?.addEventListener('close', () => document.body.classList.remove('contact-open'));
contactDialog?.addEventListener('click', (event) => {
  const rect = contactDialog.getBoundingClientRect();
  if (event.target === contactDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) contactDialog.close();
});

const email = 'luis.hostos.hostos@gmail.com';
document.querySelectorAll('[data-copy-email]').forEach((button) => {
  let restoreTimer;
  let before = null;
  button.setAttribute('aria-live', 'polite');
  button.addEventListener('click', async () => {
    // Se cambia el valor del mismo nodo de texto para no romper la capa de traducción.
    const label = button.firstChild;
    clearTimeout(restoreTimer);
    if (before === null) before = label.nodeValue;
    try {
      await navigator.clipboard.writeText(email);
      label.nodeValue = root.lang === 'en' ? 'Email copied' : 'Correo copiado';
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    restoreTimer = window.setTimeout(() => { label.nodeValue = before; before = null; }, 1600);
  });
});

/* Lightweight bilingual layer: keeps one DOM and swaps only real copy. */
const COPY_EN = new Map(Object.entries({
  'Saltar al contenido':'Skip to content','Proyectos':'Projects','Perfil':'Profile','Servicios':'Services','Hablemos':'Let\'s talk','HABLEMOS':'LET\'S TALK',
  'Desarrollador Full Stack':'Full Stack Developer','Sitios web y aplicaciones, del diseño a producción.':'Websites and applications, from design to production.',
  'Ver proyectos':'View projects','Mi experiencia':'My experience','Disponible para nuevas oportunidades y proyectos.':'Available for new opportunities and projects.',
  'Mi perfil.':'My profile.','Desarrollador web, egresado de CIBERTEC y estudiante de Ingeniería de Sistemas en UPN.':'Web developer, CIBERTEC graduate and Systems Engineering student at UPN.',
  'Ver CV (PDF) ↗':'View CV (PDF) ↗','Formación y certificaciones':'Education and certifications','Experiencia':'Experience','Practicante de Sistemas':'Systems Intern',
  'Junio 2026 — Actualidad · Lima, Perú':'June 2026 — Present · Lima, Peru','Desarrollador Web Freelance':'Freelance Web Developer',
  'Desarrollé y publiqué la web corporativa con React y TypeScript. Configuré SEO técnico, datos estructurados, dominio y Firebase Hosting.':'I developed and published the corporate website with React and TypeScript, including technical SEO, structured data, domain setup and Firebase Hosting.',
  'Desarrollé flujos de clientes, cotizaciones y compras en un ERP interno, con permisos por rol, dashboards y generación de documentos PDF.':'I developed client, quotation and purchasing workflows in an internal ERP with role-based permissions, dashboards and PDF generation.',
  'En desarrollo: la intranet de NOOVA (Noova Learn Mining), una plataforma de formación con registro, acceso por correo o Google y Firebase Authentication.':'In progress: the NOOVA intranet (Noova Learn Mining), a training platform with sign-up, email or Google sign-in and Firebase Authentication.',
  'Construí una plataforma editorial con panel administrativo, autenticación, roles y gestión de publicaciones y autores.':'I built an editorial platform with an admin panel, authentication, roles, and publication and author management.',
  'Integré Firestore, Storage y metadatos Open Graph por artículo mediante Firebase Functions.':'I integrated Firestore, Storage and per-article Open Graph metadata through Firebase Functions.',
  'Ver proyectos de NOOVA →':'View NOOVA projects →','Ver proyecto →':'View project →','Habilidades técnicas':'Technical skills','Frontend':'Frontend','Backend / APIs':'Backend / APIs','Datos / Cloud':'Data / Cloud','Herramientas / QA':'Tools / QA',
  'Idiomas':'Languages','Español':'Spanish','Nativo':'Native','Inglés':'English','Avanzado':'Advanced','Francés':'French','Básico':'Basic',
  'Lo que puedo hacer por ti.':'What I can build for you.','Sitios web':'Websites','Sistemas internos':'Internal systems','Mejoras e integraciones':'Improvements and integrations','Escritorio':'Desktop','Móvil':'Mobile','Integraciones':'Integrations','¿Tienes un proyecto?':'Have a project?',
  '¿Qué necesitas?':'What do you need?','Tengo un proyecto':'I have a project','Oportunidad laboral':'Job opportunity','Correo':'Email','Otros canales':'Other channels',
  'Web corporativa · Laboral':'Corporate website · Work','Servicios, productos y proyectos mineros reunidos en una web publicada.':'Mining services, products and projects brought together in a published website.','Visitar sitio':'Visit site','Publicación, SEO técnico, dominio y mantenimiento.':'Publishing, technical SEO, domain and maintenance.',
  'Plataforma editorial · Freelance':'Editorial platform · Freelance','Publicaciones jurídicas administrables con autenticación, roles y autores.':'Manageable legal publications with authentication, roles and authors.','Panel / roles / publicaciones':'Panel / roles / publications','Contenido administrable sin editar el sitio.':'Manageable content without editing the site.',
  'Sistema interno · Laboral':'Internal system · Work','Procesos, usuarios, documentos e información operativa en un mismo sistema.':'Processes, users, documents and operational information in one system.','Permisos por rol, dashboards y generación de PDF.':'Role-based permissions, dashboards and PDF generation.',
  'Académico · Visión por computadora':'Academic · Computer vision','Reconocimiento':'Recognition','Asistencia por cámara, identificación de estudiantes y control de duplicados.':'Camera-based attendance, student identification and duplicate control.','Repositorio':'Repository',
  'Académico · NLP':'Academic · NLP','Clasificación de consultas por intención, historial, feedback y monitoreo.':'Intent-based query classification, history, feedback and monitoring.',
  'Académico · Backend':'Academic · Backend','Backend por capas con persistencia relacional y documentación navegable.':'Layered backend with relational persistence and browsable documentation.',
  'Académico · Seguridad':'Academic · Security','Registro e inicio de sesión con frontend y backend separados.':'Registration and sign-in with separate frontend and backend.','Token, roles y rutas protegidas.':'Token, roles and protected routes.',
  'Académico · C#':'Academic · C#','Pacientes, doctores, citas y consultorios organizados con estructuras de datos.':'Patients, doctors, appointments and offices organized with data structures.','Listas, colas, pilas, árboles y grafos.':'Lists, queues, stacks, trees and graphs.',
  "React, TypeScript, Java, Spring Boot, Firebase, Python y SQL. Estudiante de Ingeniería de Sistemas en UPN y egresado de CIBERTEC.":"React, TypeScript, Java, Spring Boot, Firebase, Python and SQL. Systems Engineering student at UPN and CIBERTEC graduate.",
  "Lima, Perú":"Lima, Peru",
  "Luis Hostos · Lima, Perú":"Luis Hostos · Lima, Peru",
  "2025 — 2026 · Lima, Perú":"2025 — 2026 · Lima, Peru",
  "Proyectos destacados":"Featured projects",
  "Deriva Jurídico":"Deriva Jurídico",
  "Dos proyectos para NOOVA y uno freelance, todos en uso.":"Two projects for NOOVA and one freelance, all in use.",
  "Sistema interno · NOOVA S.A.C.":"Internal system · NOOVA S.A.C.",
  "Web corporativa · NOOVA S.A.C.":"Corporate website · NOOVA S.A.C.",
  "Plataforma editorial · Freelance":"Editorial platform · Freelance",
  "ERP NOOVA":"NOOVA ERP",
  "Web corporativa NOOVA":"NOOVA corporate website",
  "Web NOOVA":"NOOVA website",
  "Clientes, cotizaciones, compras y catálogo de equipos en un solo sistema, con permisos por rol, dashboards y generación de PDF.":"Clients, quotations, purchasing and an equipment catalog in a single system, with role-based permissions, dashboards and PDF generation.",
  "Sitio de una consultora minera con catálogo de productos filtrable, páginas de proyectos y contacto por correo y WhatsApp. Diseño, desarrollo y publicación.":"Website for a mining consultancy with a filterable product catalog, project pages and contact by email and WhatsApp. Design, development and publishing.",
  "Plataforma de publicaciones jurídicas con panel administrativo, autores, roles y metadatos para compartir cada artículo en redes.":"Legal publishing platform with an admin panel, authors, roles and metadata for sharing each article on social media.",
  "Sistema privado":"Private system",
  "Ver todos los proyectos, incluidos los académicos":"See all projects, including academic work",
  "Qué hago":"What I do",
  "Me encargo del proceso completo: interfaz, desarrollo, publicación con dominio propio y mantenimiento.":"I handle the whole process: interface, development, publishing on your own domain and maintenance.",
  "Sitios web y landing pages":"Websites and landing pages",
  "Webs adaptadas a móvil, con SEO técnico y contacto directo por correo o WhatsApp.":"Mobile-friendly websites with technical SEO and direct contact by email or WhatsApp.",
  "Ejemplo: web de NOOVA →":"Example: NOOVA website →",
  "Catálogos y sistemas internos":"Catalogs and internal systems",
  "Catálogos con filtros y fichas de producto, y sistemas con usuarios, roles, documentos PDF y dashboards.":"Catalogs with filters and product pages, and systems with users, roles, PDF documents and dashboards.",
  "Ejemplo: ERP NOOVA →":"Example: NOOVA ERP →",
  "Mantenimiento y mejoras":"Maintenance and improvements",
  "Nuevas secciones, correcciones, rendimiento y SEO en sitios que ya están publicados.":"New sections, fixes, performance and SEO for websites that are already live.",
  "Ver servicios →":"View services →",
  "Stack principal":"Main stack",
  "Ver stack y experiencia →":"View stack and experience →",
  "¿Hablamos?":"Let's talk",
  "Para empresas y equipos que buscan un desarrollador · Correo":"For companies and teams looking for a developer · Email",
  "Proyecto web":"Web project",
  "Una web nueva, un catálogo o mejorar tu sitio actual · WhatsApp":"A new website, a catalog or improving your current site · WhatsApp",
  "Copiar correo":"Copy email",
  "Caso interno":"Internal case",
  "Desarrollo sitios web y sistemas internos, desde la interfaz hasta la publicación.":"I build websites and internal systems, from the interface to launch.",
  "Practicante de Sistemas en NOOVA S.A.C. Egresado de Computación e Informática en CIBERTEC y estudiante de Ingeniería de Sistemas en UPN.":"Systems Intern at NOOVA S.A.C. Computing and IT graduate from CIBERTEC and Systems Engineering student at UPN.",
  "Hablemos →":"Let's talk →",
  "UPN · CIBERTEC · Scrum · Idiomas":"UPN · CIBERTEC · Scrum · Languages",
  "Web corporativa →":"Corporate website →",
  "ERP interno →":"Internal ERP →",
  "Usado en":"Used in",
  "Autenticación":"Authentication",
  "Reconocimiento facial":"Facial recognition",
  "Chatbot académico":"Academic chatbot",
  "Gestión de clínica":"Clinic management",
  "API Hoteles":"Hotels API",
  "Herramientas":"Tools",
  "Repositorios en GitHub ↗":"GitHub repositories ↗",
  "Otras tecnologías":"Other technologies",
  "Webs y sistemas para empresas.":"Websites and systems for businesses.",
  "Para empresas que necesitan su primera web, un catálogo de productos o mejorar el sitio que ya tienen.":"For businesses that need their first website, a product catalog or a better version of the site they already have.",
  "Catálogos de productos":"Product catalogs",
  "Sitio corporativo o landing page adaptada a móvil, con SEO técnico, dominio propio y contacto directo por correo o WhatsApp.":"A mobile-friendly corporate site or landing page with technical SEO, your own domain and direct contact by email or WhatsApp.",
  "Productos organizados por marca, categoría y tipo, con filtros y una ficha para cada uno, fáciles de actualizar.":"Products organized by brand, category and type, with filters and a page for each one, easy to keep up to date.",
  "Catálogo de NOOVA":"NOOVA catalog",
  "Clientes":"Clients",
  "Cotizaciones":"Quotations",
  "Compras":"Purchasing",
  "Clientes, cotizaciones, compras y documentos en un solo sistema, con usuarios, permisos por rol y reportes en PDF.":"Clients, quotations, purchasing and documents in a single system, with users, role-based permissions and PDF reports.",
  "Contenido":"Content",
  "Textos, imágenes, productos y nuevas secciones.":"Text, images, products and new sections.",
  "Correcciones":"Fixes",
  "Errores, formularios y vista en móvil.":"Bugs, forms and mobile layout.",
  "SEO técnico":"Technical SEO",
  "Metadatos, datos estructurados y sitemap.":"Metadata, structured data and sitemap.",
  "Dominio y hosting":"Domain and hosting",
  "Configuración y publicación del sitio.":"Setup and publishing of the site.",
  "Para sitios que ya están publicados: cambios de contenido, correcciones y mejoras de rendimiento y SEO.":"For websites that are already live: content changes, fixes, and performance and SEO improvements.",
  "SEO y hosting de la web de NOOVA":"SEO and hosting for the NOOVA website",
  "Cómo trabajo":"How I work",
  "Conversamos":"We talk",
  "Qué necesita tu empresa y qué debe lograr la web.":"What your business needs and what the website should achieve.",
  "Diseño y desarrollo":"Design and development",
  "Revisas los avances antes de publicar.":"You review progress before anything goes live.",
  "Publicación y soporte":"Launch and support",
  "Dominio, hosting y mantenimiento cuando lo necesites.":"Domain, hosting and maintenance whenever you need it.",
  "¿Tu empresa necesita una web o mejorar la que tiene?":"Does your business need a website, or a better one?",
  "Escríbeme por WhatsApp":"Message me on WhatsApp",
  "Enviar un correo":"Send an email",
  'Formación y':'Education and','certificaciones.':'certifications.','← Perfil':'← Profile','Ingeniería de Sistemas Computacionales':'Computer Systems Engineering','Actualidad':'Present','Computación e Informática':'Computing and IT','Egresado':'Graduate','Certificados':'Certificates','Inglés avanzado':'Advanced English'
}));
const originalText = new WeakMap();
const SPANISH_HINT = /[áéíóúñ¿¡]|\b(de|del|la|las|los|el|y|con|para|por|que|una|tu|mi)\b/i;
const reportedMissing = new Set();
function applyLanguage(lang) {
  const target = lang === 'en' ? 'en' : 'es';
  root.lang = target;
  try { localStorage.setItem('portfolio-lang', target); } catch {}
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.parentElement || ['SCRIPT','STYLE','NOSCRIPT'].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const source = originalText.get(node);
    const key = source.trim();
    const translated = COPY_EN.get(key);
    if (target === 'en' && translated) node.nodeValue = source.replace(key, translated);
    else node.nodeValue = source;
    // Solo en desarrollo: avisa si un texto en español no tiene traducción (p. ej. tras editar una frase).
    if (import.meta.env?.DEV && target === 'en' && !translated && SPANISH_HINT.test(key) && !reportedMissing.has(key)
      && !node.parentElement.closest('[data-ui], .reel-card, .reel-detail, .reel-info, .cred-stage')) {
      reportedMissing.add(key);
      console.warn(`[i18n] Falta traducción EN: "${key}"`);
    }
  });
  document.querySelectorAll('[data-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === target)));
  updateTheme();
  window.dispatchEvent(new Event('portfolio-language-change'));
}
document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.lang)));
let initialLang = root.lang === 'en' ? 'en' : 'es';
try { const savedLang = localStorage.getItem('portfolio-lang'); if (savedLang === 'en' || savedLang === 'es') initialLang = savedLang; } catch {}
applyLanguage(initialLang);

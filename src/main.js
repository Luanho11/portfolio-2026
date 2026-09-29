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
  metaTheme?.setAttribute('content', dark ? '#000000' : '#f7f7f5');
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
/* El efecto de tinta (grafito): en computadora arranca cuando el cursor entra al hero; en celular
   arranca solo, con un trazo suave de bienvenida, y luego sigue el dedo al deslizar. */
const pantallaTactil = !finePointer.matches;
function startInk() {
  import('./fluid-graphite.js').then(({ createSplashCursor }) => {
    const effect = createSplashCursor(canvas, landing, {
      SIM_RESOLUTION: pantallaTactil ? 96 : 128,
      DYE_RESOLUTION: pantallaTactil ? 512 : 768,
      DENSITY_DISSIPATION: pantallaTactil ? 4.2 : 3.55,
      VELOCITY_DISSIPATION: 1.86,
      PRESSURE: .10,
      PRESSURE_ITERATIONS: pantallaTactil ? 10 : 14,
      CURL: 3.1,
      SPLAT_RADIUS: pantallaTactil ? .05 : .092,
      DYE_RADIUS_SCALE: .58,
      VELOCITY_RADIUS_SCALE: .96,
      SPLAT_STRETCH: 2.45,
      SPLAT_FORCE: pantallaTactil ? 3000 : 6200,
      SHADING: true,
      INPUT_DEADZONE_PX: 4.5,
      TRAIL_SPACING_PX: 3.9,
      MAX_SEGMENT_SPLATS: 16,
      MAX_SPLATS_PER_FRAME: 16,
      VELOCITY_SMOOTHING: .72,
      PREDICTION_MS: 4.4,
      MAX_PREDICTION_PX: 7,
      CLICK_SPLAT: false,
      DPR_CAP: pantallaTactil ? 1.25 : 1.5,
      COLOR_PALETTE: [[255,255,255],[236,236,236],[218,218,218]],
      COLOR_INTENSITY: .12,
      INK_OPACITY: pantallaTactil ? .5 : .66,
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

    if (pantallaTactil && effect.trace) {
      // El dedo deja tinta mientras se desliza por el hero (sin bloquear el scroll).
      const seguirDedo = (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        const r = landing.getBoundingClientRect();
        wakeEffect();
        effect.trace(touch.clientX - r.left, touch.clientY - r.top);
      };
      landing.addEventListener('touchstart', (event) => { effect.lift(); seguirDedo(event); }, { passive: true });
      landing.addEventListener('touchmove', seguirDedo, { passive: true });
      landing.addEventListener('touchend', () => effect.lift(), { passive: true });

      // Trazo de bienvenida: una curva lenta que cruza el hero.
      let inicio = 0;
      let trazoFrame = 0;
      const duracion = 2600;
      const trazar = (ahora) => {
        if (!inicio) inicio = ahora;
        const t = Math.min(1, (ahora - inicio) / duracion);
        const r = landing.getBoundingClientRect();
        const x = r.width * (0.08 + 0.84 * t);
        const y = r.height * (0.8 + 0.08 * Math.sin(t * Math.PI * 2.2));
        wakeEffect();
        effect.trace(x, y);
        if (t < 1) trazoFrame = requestAnimationFrame(trazar);
        else effect.lift();
      };
      landing.addEventListener('touchstart', () => cancelAnimationFrame(trazoFrame), { passive: true, once: true });
      trazoFrame = requestAnimationFrame(trazar);
    }
  }).catch(() => { canvas.hidden = true; });
}
if (landing && canvas && !reducedMotion.matches) {
  if (finePointer.matches) landing.addEventListener('pointermove', startInk, { once: true, passive: true });
  else {
    // En celular se espera a que la página termine de cargar para no competir con el primer pintado.
    const arrancar = () => ('requestIdleCallback' in window ? requestIdleCallback(startInk, { timeout: 1500 }) : setTimeout(startInk, 600));
    if (document.readyState === 'complete') arrancar(); else window.addEventListener('load', arrancar, { once: true });
  }
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

/* El menú pasa a negrita al pasar el cursor; esta copia del texto reserva su ancho para que no salte. */
function syncBoldLabels() {
  document.querySelectorAll('.site-nav a').forEach((link) => { link.dataset.text = link.textContent.trim(); });
}

/* Lightweight bilingual layer: keeps one DOM and swaps only real copy. */
const COPY_EN = new Map(Object.entries({
  "Saltar al contenido":"Skip to content",
  "Proyectos":"Projects",
  "Perfil":"Profile",
  "Servicios":"Services",
  "Hablemos":"Let's talk",
  "Desarrollador Full Stack":"Full Stack Developer",
  "Ver proyectos":"View projects",
  "Mi experiencia":"My experience",
  "Ver servicios":"View services",
  "Learn Mining →":"Learn Mining →",
  "Disponible para nuevas oportunidades y proyectos.":"Available for new opportunities and projects.",
  "Mi perfil.":"My profile.",
  "Formación y certificaciones":"Education and certifications",
  "Experiencia":"Experience",
  "Responsable del área de TI":"In charge of the IT area",
  "Estoy a cargo del área de TI: entrevisté y seleccioné a un equipo de 2 personas, reporto el avance a gerencia y defino los requerimientos, la arquitectura, los flujos y la dirección visual de cada proyecto.":"I am in charge of the IT area: I interviewed and hired a team of 2, report progress to management and define the requirements, architecture, workflows and visual direction of every project.",
  "Junio 2026 — Actualidad · Lima, Perú":"June 2026 — Present · Lima, Peru",
  "Desarrollador Web Freelance":"Freelance Web Developer",
  "Desarrollé y publiqué la web corporativa con React y TypeScript. Configuré SEO técnico, datos estructurados, dominio y Firebase Hosting.":"I developed and published the corporate website with React and TypeScript, including technical SEO, structured data, domain setup and Firebase Hosting.",
  "Desarrollé flujos de clientes, cotizaciones y compras en un ERP interno, con permisos por rol, dashboards y generación de documentos PDF.":"I developed client, quotation and purchasing workflows in an internal ERP with role-based permissions, dashboards and PDF generation.",
  "En desarrollo: la intranet de NOOVA (Noova Learn Mining), una plataforma de formación con registro, acceso por correo o Google y Firebase Authentication.":"In progress: the NOOVA intranet (Noova Learn Mining), a training platform with sign-up, email or Google sign-in and Firebase Authentication.",
  "Construí una plataforma editorial con panel administrativo, autenticación, roles y gestión de publicaciones y autores.":"I built an editorial platform with an admin panel, authentication, roles, and publication and author management.",
  "Integré Firestore, Storage y metadatos Open Graph por artículo mediante Firebase Functions.":"I integrated Firestore, Storage and per-article Open Graph metadata through Firebase Functions.",
  "Ver proyecto →":"View project →",
  "Frontend":"Frontend",
  "Backend / APIs":"Backend / APIs",
  "Datos / Cloud":"Data / Cloud",
  "Idiomas":"Languages",
  "Español":"Spanish",
  "Nativo":"Native",
  "Inglés":"English",
  "Avanzado":"Advanced",
  "Francés":"French",
  "Básico":"Basic",
  "Sistemas internos":"Internal systems",
  "Escritorio":"Desktop",
  "Móvil":"Mobile",
  "¿Qué necesitas?":"What do you need?",
  "Oportunidad laboral":"Job opportunity",
  "Correo":"Email",
  "Visitar sitio":"Visit site",
  "Plataforma editorial · Freelance":"Editorial platform · Freelance",
  "React, TypeScript, Java, Spring Boot, Firebase, Python y SQL. Estudiante de Ingeniería de Sistemas en UPN y egresado de CIBERTEC.":"React, TypeScript, Java, Spring Boot, Firebase, Python and SQL. Systems Engineering student at UPN and CIBERTEC graduate.",
  "Lima, Perú":"Lima, Peru",
  "Luis Hostos · Lima, Perú":"Luis Hostos · Lima, Peru",
  "2025 — 2026 · Lima, Perú":"2025 — 2026 · Lima, Peru",
  "Proyectos destacados":"Featured projects",
  "Deriva Jurídico":"Deriva Jurídico",
  "Sistema interno · NOOVA S.A.C.":"Internal system · NOOVA S.A.C.",
  "Web corporativa · NOOVA S.A.C.":"Corporate website · NOOVA S.A.C.",
  "ERP NOOVA":"NOOVA ERP",
  "Web corporativa NOOVA":"NOOVA corporate website",
  "Web NOOVA":"NOOVA website",
  "Clientes, cotizaciones, compras y catálogo de equipos en un solo sistema, con permisos por rol, dashboards y generación de PDF.":"Clients, quotations, purchasing and an equipment catalog in a single system, with role-based permissions, dashboards and PDF generation.",
  "Sitio de una consultora minera con catálogo de productos filtrable, páginas de proyectos y contacto por correo y WhatsApp. Diseño, desarrollo y publicación.":"Website for a mining consultancy with a filterable product catalog, project pages and contact by email and WhatsApp. Design, development and publishing.",
  "Plataforma de publicaciones jurídicas con un panel para publicar artículos y gestionar autores.":"Legal publishing platform with a panel to publish articles and manage authors.",
  "Sistema privado":"Private system",
  "Qué hago":"What I do",
  "Sitios web y landing pages":"Websites and landing pages",
  "Webs adaptadas a móvil, con SEO técnico y contacto directo por correo o WhatsApp.":"Mobile-friendly websites with technical SEO and direct contact by email or WhatsApp.",
  "Catálogos y sistemas internos":"Catalogs and internal systems",
  "Catálogos con filtros y fichas de producto, y sistemas con usuarios, roles, documentos PDF y dashboards.":"Catalogs with filters and product pages, and systems with users, roles, PDF documents and dashboards.",
  "Mantenimiento y mejoras":"Maintenance and improvements",
  "Nuevas secciones, correcciones, rendimiento y SEO en sitios que ya están publicados.":"New sections, fixes, performance and SEO for websites that are already live.",
  "Stack principal":"Main stack",
  "¿Hablamos?":"Let's talk",
  "Para empresas y equipos que buscan un desarrollador · Correo":"For companies and teams looking for a developer · Email",
  "Proyecto web":"Web project",
  "Una web nueva, un catálogo o mejorar tu sitio actual · WhatsApp":"A new website, a catalog or improving your current site · WhatsApp",
  "Copiar correo":"Copy email",
  "Caso interno":"Internal case",
  "Desarrollo sitios web y sistemas internos, desde la interfaz hasta la publicación.":"I build websites and internal systems, from the interface to launch.",
  "Egresado de Computación e Informática en CIBERTEC y estudiante de Ingeniería de Sistemas en UPN.":"Computing and IT graduate from CIBERTEC and Systems Engineering student at UPN.",
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
  "Ver proyecto":"View project",
  "Ver todos los proyectos":"See all projects",
  "Ejemplo: web de NOOVA":"Example: NOOVA website",
  "Aparece en Google":"Shows up on Google",
  "Automático":"Automatic",
  "Categoría":"Category",
  "Cliente":"Client",
  "Comercial":"Sales",
  "Cotización":"Quotation",
  "Cotizar":"Get a quote",
  "Escríbenos":"Contact us",
  "Ficha del producto":"Product sheet",
  "Filtrar por":"Filter by",
  "Formulario":"Form",
  "Gerencia":"Management",
  "Lo que hace tu negocio, en una frase":"What your business does, in one sentence",
  "Marca":"Brand",
  "Orden de compra":"Purchase order",
  "PDF al cliente":"PDF to the client",
  "Pedir cotización":"Request a quote",
  "Reportes":"Reports",
  "Se adapta al celular":"Works on phones",
  "Servicio":"Service",
  "Tipo":"Type",
  "Tu propio dominio":"Your own domain",
  "Ubicación":"Location",
  "Visión artificial":"Computer vision",
  "Ejemplo: ERP NOOVA":"Example: NOOVA ERP",
  "Ejemplo: SEO y hosting de NOOVA":"Example: SEO and hosting for NOOVA",
  "Ver stack y experiencia":"View stack and experience",
  "Ver CV (PDF)":"View CV (PDF)",
  "Capturas":"Screenshots",
  "Stack":"Stack",
  "Contacto":"Contact",
  "Una web nueva, un catálogo o mejorar tu sitio actual":"A new website, a catalog or improving your current site",
  "Oportunidades laborales y propuestas de trabajo":"Job opportunities and work proposals",
  "Finalizado":"Completed",
  "Una web que se ve bien en el celular, aparece en Google y lleva a tus clientes directo a tu WhatsApp o a tu correo.":"A website that looks good on phones, shows up on Google and takes your customers straight to your WhatsApp or email.",
  "Vista de ejemplo":"Example view",
  "Requisitos (SRS)":"Requirements (SRS)",
  "Conversamos sobre tu negocio y dejo por escrito lo que tendrá la web: secciones, funciones y alcance.":"We talk about your business and I write down what the website will include: sections, features and scope.",
  "Propuesta":"Proposal",
  "Con ese documento te envío el precio y los plazos. Empezamos solo cuando estés de acuerdo.":"With that document I send you the price and timeline. We only start once you agree.",
  "Diseño":"Design",
  "Te muestro cómo se verá la web en celular y computadora antes de programarla.":"I show you how the website will look on phone and desktop before building it.",
  "Desarrollo":"Development",
  "Construyo la web y la revisas en un enlace privado mientras avanza.":"I build the website and you review it on a private link as it progresses.",
  "Publicación":"Launch",
  "La publico con tu dominio, te entrego los accesos y, si quieres, sigo cuidándola cada mes.":"I launch it on your domain, hand over the access and, if you want, keep looking after it every month.",
  "Cuando quieras, conversamos sobre tu proyecto.":"Whenever you're ready, let's talk about your project.",
  "Del primer trazo":"From the first stroke",
  "a una web":"to a website",
  "publicada.":"that's live.",
  "Cotiza tu web por WhatsApp":"Get a quote on WhatsApp",
  "Preguntas frecuentes":"Frequently asked questions",
  "¿Tienes otra duda? Escríbeme y lo vemos.":"Have another question? Message me and we'll sort it out.",
  "¿Cuánto demora una web?":"How long does a website take?",
  "Una landing sencilla está lista en pocos días. Una web con varias secciones, un catálogo o un sistema toma más; te doy el plazo exacto cuando revisemos lo que necesitas.":"A simple landing page is ready in a few days. A website with several sections, a catalog or a system takes longer; I will give you the exact timeline once we review what you need.",
  "¿Qué necesito para empezar?":"What do I need to get started?",
  "Tu logo, los textos de tu negocio, fotos de tus productos o servicios y cómo quieres que te contacten. Si aún no tienes los textos, los ordenamos juntos.":"Your logo, the texts about your business, photos of your products or services and how you want customers to reach you. If you do not have the texts yet, we will put them together.",
  "¿Qué pasa después de publicarla?":"What happens after it goes live?",
  "El primer mes de mantenimiento es gratis: corrijo detalles y reviso que todo funcione bien. Después puedes seguir con un mantenimiento mensual o quedarte con todos los accesos y administrarla tú.":"The first month of maintenance is free: I fix details and check that everything works well. After that you can keep a monthly maintenance plan or take all the access and manage it yourself.",
  "¿Quién paga el dominio y el hosting?":"Who pays for the domain and hosting?",
  "El dominio se registra a nombre de tu empresa, así la web siempre es tuya, y su costo anual se paga directo al proveedor. Si la web es informativa (sin sistema ni base de datos), el hosting puede ser gratuito y solo pagas el dominio.":"The domain is registered in your company's name, so the website is always yours, and its yearly fee is paid directly to the provider. If the website is informational (no system or database), hosting can be free and you only pay for the domain.",
  "Menú":"Menu",
  "Volver arriba":"Back to top"
}));
const originalText = new WeakMap();
const SPANISH_HINT = /[áéíóúñ¿¡]|\b(de|del|la|las|los|el|y|con|para|por|que|una|tu|mi)\b/i;
const reportedMissing = new Set();
let hasTranslated = false;
function translateText(target) {
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
    node.nodeValue = target === 'en' && translated ? source.replace(key, translated) : source;
    // Solo en desarrollo: avisa si un texto en español no tiene traducción (p. ej. tras editar una frase).
    if (import.meta.env?.DEV && target === 'en' && !translated && SPANISH_HINT.test(key) && !reportedMissing.has(key)
      && !node.parentElement.closest('[data-ui], .reel-card, .reel-detail, .reel-info, .cred-stage')) {
      reportedMissing.add(key);
      console.warn(`[i18n] Falta traducción EN: "${key}"`);
    }
  });
}
function applyLanguage(lang) {
  const target = lang === 'en' ? 'en' : 'es';
  root.lang = target;
  try { localStorage.setItem('portfolio-lang', target); } catch {}
  // El HTML ya está en español: solo se recorre el DOM si hay que traducir o deshacer una traducción.
  if (target === 'en' || hasTranslated) {
    translateText(target);
    hasTranslated = true;
  }
  document.querySelectorAll('[data-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === target)));
  syncBoldLabels();
  updateTheme();
  window.dispatchEvent(new Event('portfolio-language-change'));
}
/* ---------- Menú en celular: una sola fila con botón "Menú" que despliega la navegación ---------- */
const cabecera = document.querySelector('.site-header');
const navegacion = cabecera?.querySelector('.site-nav');
if (cabecera && navegacion) {
  navegacion.id ||= 'navegacion-principal';
  const botonMenu = document.createElement('button');
  botonMenu.type = 'button';
  botonMenu.className = 'menu-toggle';
  botonMenu.setAttribute('aria-expanded', 'false');
  botonMenu.setAttribute('aria-controls', navegacion.id);
  botonMenu.innerHTML = '<span>Menú</span><i aria-hidden="true"></i>';
  cabecera.append(botonMenu);
  cabecera.classList.add('has-menu');
  const cerrarMenu = () => { cabecera.classList.remove('is-menu-open'); botonMenu.setAttribute('aria-expanded', 'false'); };
  botonMenu.addEventListener('click', () => {
    const abierto = cabecera.classList.toggle('is-menu-open');
    botonMenu.setAttribute('aria-expanded', String(abierto));
  });
  navegacion.addEventListener('click', (event) => { if (event.target.closest('a, button')) cerrarMenu(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && cabecera.classList.contains('is-menu-open')) { cerrarMenu(); botonMenu.focus(); } });
  document.addEventListener('click', (event) => { if (!cabecera.contains(event.target)) cerrarMenu(); });
}

/* ---------- Cabecera fija: línea sutil al bajar ---------- */
if (cabecera) {
  let cabeceraFrame = 0;
  const marcarCabecera = () => { cabeceraFrame = 0; cabecera.classList.toggle('is-scrolled', window.scrollY > 4); };
  window.addEventListener('scroll', () => { if (!cabeceraFrame) cabeceraFrame = requestAnimationFrame(marcarCabecera); }, { passive: true });
  marcarCabecera();
}

/* ---------- Volver arriba: el menú no acompaña al bajar, así que este botón aparece abajo ---------- */
const toTop = document.createElement('button');
toTop.type = 'button';
toTop.className = 'to-top';
toTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5M5 12l7-7 7 7"/></svg><span class="sr-only">Volver arriba</span>';
document.body.append(toTop);
// En Proyectos, el detalle abierto tiene su propio scroll.
const openDetail = () => document.querySelector('.reel-detail.is-open, .reel-stage.is-detail') && document.getElementById('reelDetail');
const scrolledEnough = () => {
  const detail = openDetail();
  const y = detail ? detail.scrollTop : window.scrollY;
  return y > window.innerHeight * 0.8;
};
let toTopFrame = 0;
const syncToTop = () => {
  toTopFrame = 0;
  const show = scrolledEnough();
  toTop.classList.toggle('is-visible', show);
  toTop.tabIndex = show ? 0 : -1;
  toTop.setAttribute('aria-hidden', String(!show));
};
document.addEventListener('scroll', () => { if (!toTopFrame) toTopFrame = requestAnimationFrame(syncToTop); }, { passive: true, capture: true });
window.addEventListener('resize', syncToTop);
document.addEventListener('click', () => requestAnimationFrame(syncToTop));
window.addEventListener('hashchange', () => requestAnimationFrame(syncToTop));
toTop.addEventListener('click', () => {
  if (openDetail()) { window.dispatchEvent(new Event('portfolio-scroll-top')); return; }
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  document.querySelector('.site-header a, .brand')?.focus({ preventScroll: true });
});
syncToTop();
document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.lang)));
let initialLang = root.lang === 'en' ? 'en' : 'es';
try { const savedLang = localStorage.getItem('portfolio-lang'); if (savedLang === 'en' || savedLang === 'es') initialLang = savedLang; } catch {}
applyLanguage(initialLang);

/* Aparición al entrar en pantalla: [data-reveal] recibe .is-revealed una sola vez. */
const revealTargets = document.querySelectorAll('[data-reveal]');
if (revealTargets.length) {
  revealTargets.forEach((el) => el.querySelectorAll('.skill').forEach((skill, i) => skill.style.setProperty('--i', i)));
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-revealed'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px 12% 0px' });
    revealTargets.forEach((el) => revealObserver.observe(el));
  }
}

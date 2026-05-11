// I18N — Language switching and translations

const I18N = (() => {
    const translations = {
        es: {
            "nav.services": "Servicios",
            "nav.process": "Proceso",
            "nav.trayectoria": "Trayectoria",
            "nav.stack": "Stack",
            "nav.proyectos": "Proyectos",
            "nav.contacto": "Contacto",
            "hero.available": "Disponible para proyectos",
            "hero.greeting": "Hola, soy",
            "hero.headline": "Construyo sitios web, paneles admin y automatizaciones a medida para negocios pequeños.",
            "hero.bio": "Entiendo tu negocio antes de escribir una línea de código. Proyecto en producción. Respondo en menos de 24 horas.",
            "hero.metric1": "Proyectos entregados",
            "hero.metric2": "Tecnologías en stack",
            "hero.metric3": "Cliente en producción activa",
            "hero.btn_services": 'Ver servicios <i class="fas fa-arrow-right"></i>',
            "hero.btn_projects": 'Ver proyectos <i class="fas fa-code"></i>',
            "hero.scroll": "Scroll",
            "services.title": "Lo que puedo hacer por ti",
            "services.subtitle": "Servicios enfocados en lo que tu negocio necesita. Cotización sin compromiso.",
            "services.recommended": "Recomendado",
            "plan1.title": "Web Corporativa",
            "plan1.duration": "Hosting 1 año incluido",
            "plan1.desc": "Tu negocio existe en internet o no existe. Sitio profesional con contacto, servicios y diseño responsive.",
            "plan1.f1": "Diseño responsive",
            "plan1.f2": "SEO básico",
            "plan1.f3": "Hosting 1 año",
            "plan1.f4": "Formulario de contacto",
            "plan1.f5": "Entrega en 7 días hábiles",
            "plan1.cta": "Cotizar sin compromiso",
            "plan2.title": "Panel Admin",
            "plan2.duration": "Hosting 1 año incluido",
            "plan2.desc": "Deja de gestionar tu negocio en Excel. Panel personalizado para gestionar usuarios, productos o reservas.",
            "plan2.f1": "Todo del plan Web",
            "plan2.f2": "CRUD completo",
            "plan2.f3": "Autenticación y roles",
            "plan2.f4": "Base de datos incluida",
            "plan2.f5": "Panel de administración",
            "plan2.cta": "Cotizar sin compromiso",
            "plan3.title": "Mantenimiento",
            "plan3.duration": "Renovación mensual",
            "plan3.desc": "Tu web necesita cuidado después de lanzarla. Soporte técnico continuo por una cuota mensual fija.",
            "plan3.f1": "Backups automáticos",
            "plan3.f2": "Actualizaciones",
            "plan3.f3": "Corrección de errores",
            "plan3.f4": "Soporte técnico",
            "plan3.f5": "Sin sorpresas",
            "plan3.cta": "Cotizar sin compromiso",
            "services.consult_title": "¿No estás seguro qué necesitas?",
            "services.consult_desc": "Conversemos sin compromiso. Te ayudo a definir el alcance ideal para tu negocio.",
            "services.consult_cta": "Consultar gratis",
            "process.title": "Cómo trabajo",
            "process.subtitle": "Metodología clara para que sepas qué esperar en cada etapa",
            "step1.title": "Diagnóstico",
            "step1.desc": "Entiendo tu negocio, necesidad y alcance. Sin compromiso.",
            "step2.title": "Propuesta",
            "step2.desc": "Te envío un documento claro: precio, entregables y plazos.",
            "step3.title": "Desarrollo + validación",
            "step3.desc": "Construyo y pruebo cada funcionalidad con herramientas modernas, incluyendo IA como acelerador. Tú revisas en entorno de prueba antes de aprobar.",
            "step4.title": "Entrega",
            "step4.desc": "Puesta en producción, capacitación básica y entrega de credenciales.",
            "step5.title": "Soporte",
            "step5.desc": "30 días de ajustes incluidos. Plan de mantenimiento opcional.",
            "step6.title": "Mejora continua",
            "step6.desc": "Analizo métricas y feedback para evolucionar tu producto según datos reales de uso.",
            "exp.title": "Trayectoria",
            "exp.subtitle": "Resultado, no solo conocimiento",
            "exp.job1.title": "Desarrollador Web Freelance",
            "exp.job1.bullet1": "Lideré el desarrollo end-to-end de una plataforma jurídica digital desde el levantamiento de requisitos hasta producción",
            "exp.job1.bullet2": "Construí una arquitectura serverless con Firebase Hosting, Firestore y Cloud Functions",
            "exp.job1.bullet3": "Implementé autenticación, panel administrativo y gestión de publicaciones para múltiples usuarios",
            "exp.job1.bullet4": "Desarrollé renderizado dinámico de metadatos Open Graph para mejorar SEO y visualización en redes sociales",
            "exp.job1.bullet5": "Realicé pruebas de carga con K6 y optimizaciones de rendimiento antes del despliegue",
            "exp.job1.bullet6": "Elaboré documentación técnica y manuales operativos para administración y mantenimiento del sistema",
            "exp.inprod": '<i class="fas fa-check"></i> En producción',
            "exp.lastupdate": "Últ. actualización: 04/05/2026",
            "exp.job2.title": "Practicante — Desarrollo Web",
            "exp.job2.bullet1": "Interfaces responsivas con HTML5, CSS3 y JavaScript",
            "exp.job2.bullet2": "Validación de formularios, flujos de usuario e integración de APIs REST",
            "exp.job2.bullet3": "Pruebas de endpoints con Postman y control de versiones con Git",
            "exp.edu.title": "Formación",
            "exp.edu.bullet1": "Técnico en Computación e Informática — CIBERTEC (2021–2024)",
            "exp.edu.bullet2": "Ingeniería de Sistemas Computacionales — UPN (En curso)",
            "skills.title": "Stack técnico",
            "skills.subtitle": "Lo que domino y lo que incorporo",
            "proj.title": "Proyectos",
            "proj.subtitle": "Construido y validado de principio a fin",
            "proj.inprod": "En producción",
            "proj.p2.title": "Sistema de acceso con roles para SaaS",
            "proj.p1": "Sitio corporativo completo: autenticación, panel admin, CRUD, validación de flujos y pruebas de rendimiento con K6.",
            "proj.p2": "Login seguro con gestión de roles, rutas protegidas y recuperación de contraseña.",
            "proj.p3.title": "API REST para reservas y disponibilidad",
            "proj.p3": "Backend Java + Spring Boot para reservas. Endpoints REST, validación de negocio y pruebas con Postman.",
            "proj.p4.title": "Panel de gestión con CRUD para negocio local",
            "proj.p4": "Aplicación full stack con registro, consulta, actualización y eliminación. Diseño de estructura de datos, validaciones y comunicación frontend-backend.",
            "proj.live": 'Ver en vivo <i class="fas fa-arrow-right"></i>',
            "proj.code": 'Ver código <i class="fas fa-arrow-right"></i>',
            "contact.label": "¿Tu negocio necesita una web que funcione de verdad?",
            "contact.title": "Hablemos.",
            "contact.sub": "Trabajo con negocios pequeños que necesitan presencia digital real, paneles de gestión o automatizaciones a medida. Respondo en menos de 24 horas.",
            "contact.cv": "Descargar CV",
            "contact.urgency": "Soy de Perú. Actualmente tengo disponibilidad para proyectos nuevos."
        },
        en: {
            "nav.services": "Services",
            "nav.process": "Process",
            "nav.trayectoria": "Background",
            "nav.stack": "Stack",
            "nav.proyectos": "Projects",
            "nav.contacto": "Contact",
            "hero.available": "Available for projects",
            "hero.greeting": "Hi, I'm",
            "hero.headline": "I build websites, admin panels, and custom automations for small businesses.",
            "hero.bio": "I understand your business before writing a single line of code. Live project in production. Reply within 24h.",
            "hero.metric1": "Projects delivered",
            "hero.metric2": "Technologies in stack",
            "hero.metric3": "Active client in production",
            "hero.btn_services": 'View services <i class="fas fa-arrow-right"></i>',
            "hero.btn_projects": 'View projects <i class="fas fa-code"></i>',
            "hero.scroll": "Scroll",
            "services.title": "What I can do for you",
            "services.subtitle": "Services focused on what your business needs. Free quote, no commitment.",
            "services.recommended": "Recommended",
            "plan1.title": "Corporate Website",
            "plan1.duration": "Hosting 1 year included",
            "plan1.desc": "Your business exists on the internet or it doesn't. Professional site with contact, services and responsive design.",
            "plan1.f1": "Responsive design",
            "plan1.f2": "Basic SEO",
            "plan1.f3": "Hosting 1 year",
            "plan1.f4": "Contact form",
            "plan1.f5": "Delivery in 7 business days",
            "plan1.cta": "Get a free quote",
            "plan2.title": "Admin Panel",
            "plan2.duration": "Hosting 1 year included",
            "plan2.desc": "Stop managing your business in spreadsheets. Custom panel to manage users, products or reservations.",
            "plan2.f1": "Everything in Website plan",
            "plan2.f2": "Full CRUD",
            "plan2.f3": "Auth & roles",
            "plan2.f4": "Database included",
            "plan2.f5": "Admin dashboard",
            "plan2.cta": "Get a free quote",
            "plan3.title": "Maintenance",
            "plan3.duration": "Monthly renewal",
            "plan3.desc": "Your website needs care after launch. Continuous technical support for a fixed monthly fee.",
            "plan3.f1": "Automatic backups",
            "plan3.f2": "Updates",
            "plan3.f3": "Bug fixes",
            "plan3.f4": "Technical support",
            "plan3.f5": "No surprises",
            "plan3.cta": "Get a free quote",
            "services.consult_title": "Not sure what you need?",
            "services.consult_desc": "Let's talk with no commitment. I'll help you define the ideal scope for your business.",
            "services.consult_cta": "Free consultation",
            "process.title": "How I Work",
            "process.subtitle": "Clear methodology so you know what to expect at each stage",
            "step1.title": "Diagnosis",
            "step1.desc": "I understand your business, need and scope. No commitment.",
            "step2.title": "Proposal",
            "step2.desc": "I send you a clear document: price, deliverables and deadlines.",
            "step3.title": "Development + Validation",
            "step3.desc": "I build and test each feature with modern tools, including AI as an accelerator. You review in a test environment before approving.",
            "step4.title": "Delivery",
            "step4.desc": "Production deployment, basic training and credentials handover.",
            "step5.title": "Support",
            "step5.desc": "30 days of included adjustments. Optional maintenance plan.",
            "step6.title": "Continuous Improvement",
            "step6.desc": "I analyze metrics and feedback to evolve your product based on real usage data.",
            "exp.title": "Background",
            "exp.subtitle": "Results, not just knowledge",
            "exp.job1.title": "Freelance Web Developer",
            "exp.job1.bullet1": "Led end-to-end development of a digital legal platform from requirements gathering to production",
            "exp.job1.bullet2": "Built a serverless architecture with Firebase Hosting, Firestore and Cloud Functions",
            "exp.job1.bullet3": "Implemented authentication, admin panel and publication management for multiple users",
            "exp.job1.bullet4": "Developed dynamic Open Graph metadata rendering to improve SEO and social media visualization",
            "exp.job1.bullet5": "Conducted load testing with K6 and performance optimizations before deployment",
            "exp.job1.bullet6": "Created technical documentation and operational manuals for system administration and maintenance",
            "exp.inprod": '<i class="fas fa-check"></i> In production',
            "exp.lastupdate": "Last update: 05/04/2026",
            "exp.job2.title": "Web Development Intern",
            "exp.job2.bullet1": "Responsive interfaces with HTML5, CSS3, and JavaScript",
            "exp.job2.bullet2": "Form validation, user flows, and REST API integration",
            "exp.job2.bullet3": "Endpoint testing with Postman and version control with Git",
            "exp.edu.title": "Education",
            "exp.edu.bullet1": "Computer and IT Technician — CIBERTEC (2021–2024)",
            "exp.edu.bullet2": "Computer Systems Engineering — UPN (In progress)",
            "skills.title": "Tech Stack",
            "skills.subtitle": "What I master and what I'm incorporating",
            "proj.title": "Projects",
            "proj.subtitle": "Built and validated end-to-end",
            "proj.inprod": "In production",
            "proj.p2.title": "Role-based Access System for SaaS",
            "proj.p1": "Complete corporate site: authentication, admin panel, CRUD, flow validation and K6 performance testing.",
            "proj.p2": "Secure login with role management, protected routes and password recovery.",
            "proj.p3.title": "REST API for Reservations & Availability",
            "proj.p3": "Java + Spring Boot backend for reservations. REST endpoints, business validation and Postman tests.",
            "proj.p4.title": "Management Panel with CRUD for Local Business",
            "proj.p4": "Full stack application with create, read, update and delete. Data structure design, validations and frontend-backend communication.",
            "proj.live": 'View live <i class="fas fa-arrow-right"></i>',
            "proj.code": 'View code <i class="fas fa-arrow-right"></i>',
            "contact.label": "Does your business need a website that actually works?",
            "contact.title": "Let's talk.",
            "contact.sub": "I work with small businesses that need real digital presence, management panels, or custom automations. I reply within 24 hours.",
            "contact.cv": "Download CV",
            "contact.urgency": "I'm from Peru. Currently available for new projects."
        }
    };

    const typingRoles = {
        es: ['Desarrollador Web Freelance', 'Sitios web que generan negocios'],
        en: ['Freelance Web Developer', 'Websites that generate business']
    };

    let currentLang = 'es';
    let langToggle = null;
    let langLabel = null;

    function init() {
        langToggle = document.getElementById('lang-toggle');
        langLabel = langToggle ? langToggle.querySelector('.lang-label') : null;
        currentLang = localStorage.getItem('lang') || 'es';
        applyLanguage(currentLang);
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                setLanguage(currentLang === 'es' ? 'en' : 'es');
            });
        }
    }

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        applyLanguage(lang);
    }

    function applyLanguage(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });
        if (langLabel) langLabel.textContent = lang.toUpperCase();
        document.documentElement.lang = lang;
        if (typeof HeroAnimations !== 'undefined' && typingRoles[lang]) {
            HeroAnimations.startTyping(typingRoles[lang]);
        }
    }

    function getCurrentLang() { return currentLang; }

    return { init, setLanguage, getCurrentLang };
})();
// Navigation: navbar, smooth scroll, progress bar
const Navigation = (() => {
    let navbar = null;
    let navToggle = null;
    let navMenu = null;
    let navLinks = null;
    let allSections = null;
    let progressBar = null;
    let topBtn = null;
    let scrollTicking = false;

    function init() {
        navbar = document.getElementById('navbar');
        navToggle = document.getElementById('nav-toggle');
        navMenu = document.getElementById('nav-menu');
        navLinks = document.querySelectorAll('.nav-link');
        allSections = document.querySelectorAll('.section');
        progressBar = document.getElementById('scroll-progress');
        topBtn = document.getElementById('scroll-top');

        initMobileMenu();
        initSmoothScroll();
        initScrollTop();
        initScrollHandler();
    }

    function initMobileMenu() {
        if (!navToggle || !navMenu) return;

        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('active');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                navToggle.classList.remove('active');
            });
        });
    }

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const href = anchor.getAttribute('href');
                if (!href || href === '#') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                const target = document.querySelector(href);
                if (target) {
                    const navHeight = navbar ? navbar.offsetHeight : 0;
                    const scrollPos = target.offsetTop - navHeight - 30;
                    window.scrollTo({ top: scrollPos, behavior: 'smooth' });
                }
            });
        });
    }

    function initScrollTop() {
        if (!topBtn) return;
        topBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function initScrollHandler() {
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    function onScroll() {
        if (scrollTicking) return;
        scrollTicking = true;

        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;

            // Progress bar
            if (progressBar) {
                progressBar.style.width = (docHeight > 0 ? (scrollY / docHeight) * 100 : 0) + '%';
            }

            // Navbar scroll state
            if (navbar) {
                navbar.classList.toggle('scrolled', scrollY > 60);
            }

            // Scroll top button
            if (topBtn) {
                topBtn.classList.toggle('visible', scrollY > 500);
            }

            // Active nav link
            let currentSection = '';
            if (allSections) {
                allSections.forEach(section => {
                    if (scrollY >= section.offsetTop - 200) {
                        currentSection = section.id;
                    }
                });
            }

            if (navLinks) {
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('data-section') === currentSection);
                });
            }

            scrollTicking = false;
        });
    }

    return { init };
})();

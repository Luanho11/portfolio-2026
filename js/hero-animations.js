// Hero animations: photo glow, name stagger, entrance

const HeroAnimations = (() => {
    let typingTimeout = null;
    let currentRoles = [];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let countersDone = false;

    function init() {
        initPhotoGlowReveal();
        initLetterStagger();
        initStaggeredEntrance();
        initCounters();
    }

    /* ─── Glow Reveal on Photo ─── */
    function initPhotoGlowReveal() {
        const revealEl = document.querySelector('.photo-glow-reveal');
        const photo = document.querySelector('.hero-photo');

        setTimeout(() => {
            if (revealEl) revealEl.classList.add('active');
            if (photo) photo.classList.add('loaded');
        }, 300);
    }

    /* ─── Letter Stagger on Name ─── */
    function initLetterStagger() {
        const nameEl = document.getElementById('hero-name');
        if (!nameEl) return;

        const text = nameEl.textContent.trim();
        nameEl.innerHTML = '';

        [...text].forEach((char, i) => {
            const span = document.createElement('span');
            span.className = char === ' ' ? 'letter space' : 'letter';
            span.textContent = char === ' ' ? '' : char;
            nameEl.appendChild(span);

            setTimeout(() => {
                span.classList.add('visible');
            }, 600 + i * 45);
        });
    }

    /* ─── Staggered Entrance ─── */
    function initStaggeredEntrance() {
        const elements = [
            { selector: '.hero-greeting', delay: 400 },
            { selector: '.hero-headline', delay: 900 },
            { selector: '.hero-role-line', delay: 1100 },
            { selector: '.hero-bio', delay: 1300 },
            { selector: '.hero-metrics', delay: 1500 },
            { selector: '.hero-actions', delay: 1700 },
            { selector: '.hero-social', delay: 1900 },
            { selector: '.scroll-hint', delay: 2200 },
        ];

        elements.forEach(({ selector, delay }) => {
            const el = document.querySelector(selector);
            if (el) {
                setTimeout(() => el.classList.add('animate-in'), delay);
            }
        });
    }

    /* ─── Typing Effect ─── */
    function startTyping(rolesArray) {
        if (!rolesArray || !rolesArray.length) return;
        clearTimeout(typingTimeout);
        currentRoles = rolesArray;
        roleIndex = 0;
        charIndex = 0;
        isDeleting = false;
        const typedEl = document.getElementById('typed-role');
        if (typedEl) typedEl.textContent = '';
        typeLoop();
    }

    function typeLoop() {
        const typedEl = document.getElementById('typed-role');
        if (!typedEl || !currentRoles.length) return;

        const word = currentRoles[roleIndex];

        if (isDeleting) {
            charIndex--;
            typedEl.textContent = word.substring(0, charIndex);
        } else {
            charIndex++;
            typedEl.textContent = word.substring(0, charIndex);
        }

        // Delete faster than type
        let delay = isDeleting ? 22 : 55;

        if (!isDeleting && charIndex === word.length) {
            delay = 2200;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % currentRoles.length;
            delay = 320;
        }

        typingTimeout = setTimeout(typeLoop, delay);
    }

    /* ─── Animated Counters ─── */
    function initCounters() {
        const metricsEl = document.getElementById('hero-metrics');
        if (!metricsEl) return;

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    animateCounters();
                    observer.unobserve(entries[0].target);
                }
            }, { threshold: 0.5 });
            observer.observe(metricsEl);
        } else {
            setTimeout(animateCounters, 1800);
        }
    }

    function animateCounters() {
        if (countersDone) return;
        countersDone = true;

        const metricNums = document.querySelectorAll('.metric-num');
        metricNums.forEach(el => {
            const target = parseInt(el.getAttribute('data-target'), 10);
            if (isNaN(target)) return;
            const decimal = el.getAttribute('data-decimal') || '';
            const duration = 1500;
            let startTime = null;

            function step(ts) {
                if (!startTime) startTime = ts;
                const progress = Math.min((ts - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(target * eased) + (progress >= 1 ? decimal : '');
                if (progress < 1) requestAnimationFrame(step);
            }

            requestAnimationFrame(step);
        });
    }

    function destroy() {
        clearTimeout(typingTimeout);
    }

    return { init, startTyping, destroy };
})();

// Scroll animations: IntersectionObserver + fade/blur effects (repeats on scroll)

const ScrollAnimations = (() => {
    let observer = null;

    function init() {
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('[data-reveal]').forEach(el => {
                el.classList.add('revealed');
            });
            return;
        }

        observer = new IntersectionObserver(onIntersect, {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.08
        });

        const revealElements = document.querySelectorAll('[data-reveal]');
        revealElements.forEach((el) => {
            const parent = el.parentElement;
            if (parent) {
                const siblings = Array.from(parent.querySelectorAll('[data-reveal]'));
                const siblingIndex = siblings.indexOf(el);
                el.setAttribute('data-reveal-delay', siblingIndex * 80);
            }
            observer.observe(el);
        });
    }

    function onIntersect(entries) {
        entries.forEach(entry => {
            const el = entry.target;

            if (entry.isIntersecting) {
                const delay = el.getAttribute('data-reveal-delay') || '0';
                el.style.transitionDelay = `${delay}ms`;
                el.classList.add('revealed');

                if (el.classList.contains('project-card')) {
                    el.classList.add('card-visible');
                }

                const totalMs = parseInt(delay, 10) + 700;
                setTimeout(() => {
                    el.style.transitionDelay = '';
                }, totalMs);
            } else {
                el.classList.remove('revealed');
                if (el.classList.contains('project-card')) {
                    el.classList.remove('card-visible');
                }
            }
        });
    }

    function destroy() {
        if (observer) observer.disconnect();
    }

    return { init, destroy };
})();

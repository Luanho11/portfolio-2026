/* ═══════════════════════════════════════════════════
   SKILLS INTERACTIONS — Simplified (no tabs) + Project Parallax
   ═══════════════════════════════════════════════════ */

const SkillsInteractions = (() => {
    function init() {
        // Skills panel is always visible now (no tabs)
        const panel = document.querySelector('.skills-panel.active');
        if (panel) {
            requestAnimationFrame(() => {
                panel.classList.add('fade-in');
            });
        }
        initProjectParallax();
    }

    /* ─── Project Card Parallax ─── */
    function initProjectParallax() {
        const isMobile = window.innerWidth < 768;
        if (isMobile) return;

        const cards = document.querySelectorAll('.project-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                const bg = card.querySelector('.project-bg');
                if (bg) {
                    bg.style.transform = `scale(1.06) translate(${x * -8}px, ${y * -8}px)`;
                }
            });

            card.addEventListener('mouseleave', () => {
                const bg = card.querySelector('.project-bg');
                if (bg) {
                    bg.style.transform = '';
                }
            });
        });
    }

    return { init };
})();
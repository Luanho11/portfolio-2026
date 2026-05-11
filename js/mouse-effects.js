/* ═══════════════════════════════════════════════════
   MOUSE EFFECTS — Premium dual-color glow
   ═══════════════════════════════════════════════════ */

const MouseEffects = (() => {
    let glowEl = null;
    let mouseX = -600;
    let mouseY = -600;
    let targetX = -600;
    let targetY = -600;
    let animFrameId = null;
    let isIntensified = false;
    const isMobile = window.innerWidth < 768;

    function init() {
        if (isMobile) return; // No mouse glow on mobile
        glowEl = document.getElementById('mouse-glow');
        if (!glowEl) return;

        document.addEventListener('mousemove', onMouseMove, { passive: true });

        // Intensify on interactive elements
        const interactiveEls = document.querySelectorAll('.btn-primary, .btn-outline, .btn-ghost, .project-card, .service-card, .skill-item, .nav-icon-btn, .nav-link, .contact-link-item');
        interactiveEls.forEach(el => {
            el.addEventListener('mouseenter', () => intensify());
            el.addEventListener('mouseleave', () => relax());
        });

        loop();
    }

    function onMouseMove(e) {
        targetX = e.clientX;
        targetY = e.clientY;
    }

    function intensify() {
        if (!glowEl || isIntensified) return;
        isIntensified = true;
        glowEl.classList.add('intensify');
    }

    function relax() {
        if (!glowEl || !isIntensified) return;
        isIntensified = false;
        glowEl.classList.remove('intensify');
    }

    function loop() {
        // Smooth interpolation
        mouseX += (targetX - mouseX) * 0.12;
        mouseY += (targetY - mouseY) * 0.12;

        if (glowEl) {
            const w = glowEl.offsetWidth / 2;
            const h = glowEl.offsetHeight / 2;
            glowEl.style.transform = `translate(${mouseX - w}px, ${mouseY - h}px)`;
        }

        animFrameId = requestAnimationFrame(loop);
    }

    function destroy() {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        document.removeEventListener('mousemove', onMouseMove);
    }

    return { init, destroy };
})();

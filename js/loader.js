/* ═══════════════════════════════════════════════════
   LOADER — Premium curtain with LH logo
   ═══════════════════════════════════════════════════ */

const Loader = (() => {
    function init() {
        const curtain = document.getElementById('loader-curtain');

        // Wait for everything to be ready
        window.addEventListener('load', () => {
            // Small delay for polish
            setTimeout(() => {
                if (curtain) {
                    curtain.classList.add('done');
                }
                // Remove curtain from DOM after transition
                setTimeout(() => {
                    if (curtain && curtain.parentNode) {
                        curtain.parentNode.removeChild(curtain);
                    }
                }, 700);
            }, 600);
        });

        // Fallback: remove curtain after max time
        setTimeout(() => {
            if (curtain && !curtain.classList.contains('done')) {
                curtain.classList.add('done');
                setTimeout(() => {
                    if (curtain && curtain.parentNode) {
                        curtain.parentNode.removeChild(curtain);
                    }
                }, 700);
            }
        }, 4000);
    }

    return { init };
})();

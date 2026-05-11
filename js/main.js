// Init all modules in order
(function () {
    'use strict';

    Loader.init();
    Theme.init();
    I18N.init();

    document.body.classList.remove('body-preload');
    document.body.classList.add('ready');
    document.documentElement.style.visibility = 'visible';
    document.documentElement.style.opacity = '1';

    ParticlesSystem.init();
    MouseEffects.init();
    Navigation.init();

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            HeroAnimations.init();
            ScrollAnimations.init();
            SkillsInteractions.init();
        });
    });
})();
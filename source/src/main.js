const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const metaTheme = document.querySelector('meta[name="theme-color"]');

function updateTheme() {
  const dark = root.dataset.theme === 'dark';
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    const label = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
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
let leaving = false;
function resetTransition() {
  leaving = false;
  root.classList.remove('page-leaving');
  window.setTimeout(() => root.classList.remove('page-entering'), 320);
}
window.addEventListener('pageshow', resetTransition);
resetTransition();

document.querySelectorAll('a[href]').forEach((link) => {
  const url = new URL(link.href);
  if (url.origin !== location.origin || link.target || link.hasAttribute('download') || /\.pdf$/i.test(url.pathname)) return;
  if (url.pathname === location.pathname || !transitionStage) return;
  link.addEventListener('click', (event) => {
    if (reducedMotion.matches || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true;
    root.classList.add('page-leaving');
    try { sessionStorage.setItem('portfolio-transition', '1'); } catch { /* Navigation does not depend on storage. */ }
    window.setTimeout(() => location.assign(url.href), 260);
  });
});

const landing = document.getElementById('landing');
const canvas = document.getElementById('fx');
const motionToggle = document.getElementById('motionToggle');
if (landing && canvas && matchMedia('(pointer: fine)').matches && !reducedMotion.matches) {
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
    motionToggle.hidden = false;
    let paused = false;
    let visible = true;
    const syncEffect = () => {
      const active = !paused && visible && !document.hidden && !reducedMotion.matches;
      effect.setActive(active);
      canvas.hidden = paused || reducedMotion.matches;
      motionToggle.setAttribute('aria-pressed', String(paused));
      motionToggle.textContent = paused ? 'Activar efecto' : 'Pausar efecto';
    };
    motionToggle.addEventListener('click', () => { paused = !paused; syncEffect(); });
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncEffect(); });
    observer.observe(landing);
    document.addEventListener('visibilitychange', syncEffect);
    reducedMotion.addEventListener('change', syncEffect);
    window.addEventListener('pagehide', () => effect.setActive(false));
    window.addEventListener('pageshow', syncEffect);
    syncEffect();
  }).catch(() => { canvas.hidden = true; });
}

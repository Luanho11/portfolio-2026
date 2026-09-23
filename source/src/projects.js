const root = document.documentElement;
const stage = document.getElementById('projectStage');
const slides = [...stage.querySelectorAll('.project-slide')];
const indexButtons = [...document.querySelectorAll('[data-project-index]')];
const meta = document.getElementById('projectMeta');
const toggle = document.getElementById('viewToggle');
const nav = document.querySelector('.project-nav');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let index = Math.max(0, slides.findIndex((slide) => `#${slide.id}` === location.hash));
let listView = matchMedia('(max-width: 640px)').matches || new URLSearchParams(location.search).get('vista') === 'lista';
let locked = false;

function updateChrome() {
  const slide = slides[index];
  const style = getComputedStyle(slide);
  const dark = root.dataset.theme === 'dark';
  const background = style.getPropertyValue(dark ? '--slide-dark' : '--slide-light').trim();
  const color = style.getPropertyValue(dark ? '--text-dark' : '--text-light').trim();
  const darkSurface = dark || ['theme-graphite', 'theme-burgundy', 'theme-plum'].some((name) => slide.classList.contains(name));
  document.body.style.setProperty('--project-bg', background);
  document.body.style.setProperty('--project-ink', color);
  document.body.classList.toggle('project-light-chrome', darkSurface);
  document.querySelector('meta[name="theme-color"]').content = listView ? getComputedStyle(root).getPropertyValue('--page').trim() : background;
}

function syncView() {
  document.body.classList.toggle('list-view', listView);
  toggle.textContent = listView ? 'Vista de carrusel' : 'Vista de lista';
  toggle.setAttribute('aria-pressed', String(listView));
  meta.textContent = listView ? `${slides.length} proyectos · Trabajo y exploración técnica` : `${slides[index].dataset.kind} · ${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === index);
    slide.inert = !listView && i !== index;
    if (!listView && i !== index) slide.setAttribute('aria-hidden', 'true');
    else slide.removeAttribute('aria-hidden');
  });
  indexButtons.forEach((button, i) => {
    button.classList.toggle('is-active', i === index);
    if (i === index) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
  updateChrome();
}

function goTo(target, updateHash = true) {
  const next = (target + slides.length) % slides.length;
  if (locked || next === index) return;
  const current = slides[index];
  const incoming = slides[next];
  const forward = target > index;
  const inClass = forward ? 'is-entering-next' : 'is-entering-prev';
  const outClass = forward ? 'is-leaving-next' : 'is-leaving-prev';
  const duration = reducedMotion.matches || listView ? 0 : 480;
  locked = true;
  current.inert = true;
  current.setAttribute('aria-hidden', 'true');
  incoming.inert = false;
  incoming.removeAttribute('aria-hidden');
  incoming.querySelector('.project-content').scrollTop = 0;
  if (duration) { current.classList.add(outClass); incoming.classList.add(inClass); }
  index = next;
  if (updateHash) history.replaceState(null, '', `#${incoming.id}`);
  window.setTimeout(() => {
    current.classList.remove(outClass);
    incoming.classList.remove(inClass);
    locked = false;
    syncView();
  }, duration);
}

document.getElementById('prevProject').addEventListener('click', () => goTo(index - 1));
document.getElementById('nextProject').addEventListener('click', () => goTo(index + 1));
indexButtons.forEach((button) => button.addEventListener('click', () => goTo(Number(button.dataset.projectIndex))));
toggle.addEventListener('click', () => {
  if (locked) return;
  listView = !listView;
  syncView();
  if (listView) slides[index].scrollIntoView({ behavior: 'instant', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'instant' });
});
window.addEventListener('keydown', (event) => {
  if (listView || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable]')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    goTo(index + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
let touchStart = null;
stage.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  touchStart = event.target.closest('a,button') ? null : { x: touch.clientX, y: touch.clientY };
}, { passive: true });
stage.addEventListener('touchend', (event) => {
  if (!touchStart || listView) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(index + (dx < 0 ? 1 : -1));
  touchStart = null;
}, { passive: true });
window.addEventListener('hashchange', () => {
  const target = slides.findIndex((slide) => `#${slide.id}` === location.hash);
  if (target >= 0) goTo(target, false);
});
window.addEventListener('portfolio-theme-change', updateChrome);
document.body.classList.add('carousel-ready');
toggle.hidden = false;
nav.hidden = false;
syncView();
if (listView && location.hash) slides[index].scrollIntoView({ behavior: 'instant' });

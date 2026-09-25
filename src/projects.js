/* Proyectos — reel de paneles con expansión fluida al detalle. */
import Lenis from 'lenis';

const root = document.documentElement;
const stage = document.getElementById('reelStage');
const rack = document.getElementById('reelRack');
const items = [...rack.querySelectorAll('.reel-item')];
const cards = items.map((item) => item.querySelector('.reel-card'));
const detail = document.getElementById('reelDetail');
const detailContent = document.getElementById('reelDetailContent');
const hero = document.getElementById('detailHero');
const heroImg = document.getElementById('detailImage');
const backButton = document.getElementById('detailBack');
const moreButton = document.getElementById('detailMore');
const shotsBox = document.getElementById('galleryShots');
const el = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 720px)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

const UI = {
  es: { back: 'Proyectos', more: 'Ver detalles', gallery: 'Capturas', next: 'Siguiente proyecto', wins: 'Qué construí', ctaTitle: '¿Necesitas algo similar para tu empresa?', ctaButton: 'Escríbeme por WhatsApp', context: 'Contexto', role: 'Mi rol', stack: 'Stack', heading: 'Proyectos', lead: 'Sitios publicados, sistemas internos y proyectos académicos: del diseño a producción.', hint: 'Pasa el cursor para explorar', open: 'Clic para abrir', work: 'Profesionales', academic: 'Académicos', zoom: 'Ampliar imagen' },
  en: { back: 'Projects', more: 'View details', gallery: 'Screenshots', next: 'Next project', wins: 'What I built', ctaTitle: 'Need something similar for your business?', ctaButton: 'Message me on WhatsApp', context: 'Context', role: 'My role', stack: 'Stack', heading: 'Projects', lead: 'Published websites, internal systems and academic projects: from design to production.', hint: 'Hover to explore', open: 'Click to open', work: 'Professional', academic: 'Academic', zoom: 'Enlarge image' },
};
// Curva suave al inicio y al final; duración corta para llegar rápido al contenido.
const MORPH = { duration: 760, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'both' };
const HOT_SCALE = 1.08;

let hot = -1;
let current = -1;
let isOpen = false;
let busy = false;
let leaveTimer;
let closeQueued = false;

const lang = () => (root.lang === 'en' ? 'en' : 'es');
const pad = (n) => String(n).padStart(2, '0');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const lerp = (a, b, t) => a + (b - a) * t;
const text = (card, key) => card.dataset[key + (lang() === 'en' ? 'En' : 'Es')] || card.dataset[`${key}Es`] || '';
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const localSources = (card) => (card.dataset.gallery || '').split('|').map((s) => s.trim()).filter((s) => s.startsWith('./'));

/* ---------- Scroll suave del detalle ---------- */
const lenis = new Lenis({
  wrapper: detail,
  content: detailContent,
  lerp: 0.085,
  smoothWheel: true,
  wheelMultiplier: 0.9,
  autoRaf: false,
});
lenis.stop();

/* ---------- Textos / idioma ---------- */
const ticks = cards.map(() => {
  const li = document.createElement('li');
  el('reelTicks').append(li);
  return li;
});
el('reelTotal').textContent = pad(cards.length);
cards.forEach((card, i) => {
  const num = document.createElement('span');
  num.className = 'reel-card__num';
  num.textContent = pad(i + 1);
  num.setAttribute('aria-hidden', 'true');
  const kicker = document.createElement('span');
  kicker.className = 'reel-card__kicker';
  kicker.setAttribute('aria-hidden', 'true');
  card.append(num, kicker);
});

/* Barra inferior: muestra el proyecto bajo el cursor */
let infoIndex = null;
function renderInfo(index, animate = true) {
  const changed = infoIndex !== index;
  infoIndex = index;
  const card = cards[index];
  const apply = () => {
    el('infoNum').textContent = card ? pad(index + 1) : '—';
    el('infoTitle').textContent = card ? text(card, 'title') : UI[lang()].hint;
    el('infoKicker').textContent = card ? text(card, 'kicker') : '';
    el('infoTech').textContent = card ? card.dataset.tech : UI[lang()].open;
  };
  ticks.forEach((tick, i) => tick.classList.toggle('is-on', i === index));
  const now = el('infoTitle').parentElement;
  if (!animate || !changed || reduced.matches) { apply(); return; }
  now.getAnimations().forEach((a) => a.cancel());
  now.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px)' }], { duration: 160, easing: 'ease-in' })
    .finished.then(() => {
      apply();
      now.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
    }).catch(() => {});
}

function renderCopy() {
  cards.forEach((card) => {
    card.querySelector('.reel-card__kicker').textContent = text(card, 'kicker');
    card.querySelector('.reel-card__label').innerHTML = text(card, 'label') || text(card, 'title');
    card.setAttribute('aria-label', `${text(card, 'title')} — ${text(card, 'kicker')}`);
  });
  document.querySelectorAll('[data-ui]').forEach((node) => { node.textContent = UI[lang()][node.dataset.ui]; });
  if (current >= 0) fillDetail(current, { rebuildGallery: false });
  renderInfo(infoIndex ?? -1, false);
}

/* Si una imagen remota falla, usa una captura local del mismo proyecto. */
cards.forEach((card) => {
  const img = card.querySelector('img');
  img.addEventListener('error', () => {
    const fallback = localSources(card).find((src) => !img.src.endsWith(src.slice(1)));
    if (fallback && !img.dataset.fellBack) { img.dataset.fellBack = '1'; img.src = fallback; }
    else card.classList.add('is-broken');
  });
});

// Los paneles se revelan cuando sus imágenes ya cargaron, así la animación no muestra cajas vacías.
const cardImages = cards.map((card) => card.querySelector('img').decode().catch(() => {}));
Promise.race([Promise.all(cardImages), wait(2500)]).then(() => rack.classList.add('is-ready'));

/* ---------- Hover / foco (acordeón estable, sin carrusel) ---------- */
function setHot(index) {
  if (hot === index) return;
  hot = index;
  cards.forEach((card, i) => card.classList.toggle('is-hot', i === index));
  rack.classList.toggle('has-hot', index >= 0);
  renderInfo(index);
  // Adelanta la descarga de la imagen grande del detalle.
  if (cards[index]?.dataset.hero) new Image().src = cards[index].dataset.hero;
}

cards.forEach((card, i) => {
  card.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch' || isOpen) return;
    clearTimeout(leaveTimer);
    setHot(i);
  });
  card.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch' || isOpen) return;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => { if (!isOpen) setHot(-1); }, 160);
  });
});

cards.forEach((card, i) => {
  card.addEventListener('focus', () => { if (!isOpen && card.matches(':focus-visible')) setHot(i); });
  card.addEventListener('click', () => openProject(i));
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (i + (event.key === 'ArrowRight' ? 1 : -1) + cards.length) % cards.length;
    cards[next].focus();
  });
});

/* ---------- Movimiento de imágenes (se interpola cada frame) ---------- */
const pointer = { cx: 0, cy: 0 };
const pans = cards.map(() => ({ x: 0, y: 0, tx: 0, ty: 0 }));

window.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  pointer.cx = event.clientX;
  pointer.cy = event.clientY;
}, { passive: true });

function updatePans() {
  const active = !isOpen && finePointer.matches && !reduced.matches && !compact.matches;
  cards.forEach((card, i) => {
    const pan = pans[i];
    if (active && i === hot) {
      const r = card.getBoundingClientRect();
      const nx = Math.max(-0.5, Math.min(0.5, (pointer.cx - (r.left + r.width / 2)) / r.width));
      const ny = Math.max(-0.5, Math.min(0.5, (pointer.cy - (r.top + r.height / 2)) / r.height));
      // Nunca más de lo que cubre el zoom: la imagen no deja bordes vacíos.
      pan.tx = -nx * r.width * (HOT_SCALE - 1) * 0.9;
      pan.ty = -ny * r.height * (HOT_SCALE - 1) * 0.9;
    } else { pan.tx = 0; pan.ty = 0; }
    pan.x = lerp(pan.x, pan.tx, 0.07);
    pan.y = lerp(pan.y, pan.ty, 0.07);
    if (Math.abs(pan.x) < 0.05 && Math.abs(pan.y) < 0.05 && !pan.tx && !pan.ty) { pan.x = 0; pan.y = 0; }
    card.style.setProperty('--pan-x', `${pan.x.toFixed(2)}px`);
    card.style.setProperty('--pan-y', `${pan.y.toFixed(2)}px`);
  });
}

function updateDetailMotion() {
  if (!isOpen) return;
  const still = reduced.matches;
  const scroll = lenis.animatedScroll || detail.scrollTop;

  // Hero: la imagen baja más lento que el marco (parallax) sin dejar huecos.
  const heroH = hero.offsetHeight || 1;
  const shift = still ? 0 : Math.min(scroll, heroH) * 0.12;
  heroImg.style.translate = `0 ${shift.toFixed(1)}px`;
  heroImg.style.scale = String(1 + (2 * shift) / heroH);
}

function tick(time) {
  lenis.raf(time);
  updatePans();
  updateDetailMotion();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ---------- Detalle ---------- */
const zoom = el('reelZoom');
const zoomImg = el('reelZoomImg');
zoom.addEventListener('click', () => zoom.close());
let shotObserver;

function buildGallery(card) {
  const sources = card.dataset.gallery.split('|').map((s) => s.trim()).filter(Boolean);
  shotObserver?.disconnect();
  shotObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); shotObserver.unobserve(entry.target); }
    });
  }, { root: detail, threshold: 0.1 });

  shotsBox.replaceChildren(...sources.map((src) => {
    const fig = document.createElement('figure');
    fig.className = 'reel-shot';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', UI[lang()].zoom);
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    // Las capturas anchas ocupan toda la fila; las verticales o cuadradas van de a dos.
    img.addEventListener('load', () => fig.classList.toggle('is-wide', img.naturalWidth / img.naturalHeight >= 1.6));
    img.addEventListener('error', () => fig.remove());
    button.addEventListener('click', () => {
      zoomImg.src = src;
      zoom.showModal();
    });
    button.append(img);
    fig.append(button);
    shotObserver.observe(fig);
    return fig;
  }));
}

function fillDetail(index, { rebuildGallery = true } = {}) {
  const card = cards[index];
  el('detailKicker').textContent = text(card, 'kicker');
  el('detailTitle').textContent = text(card, 'title');
  el('detailIndex').textContent = pad(index + 1);
  el('detailCount').textContent = `${pad(index + 1)} / ${pad(cards.length)}`;
  el('detailDescription').textContent = text(card, 'desc');
  el('detailStack').textContent = card.dataset.tech || '';
  el('detailContext').textContent = text(card, 'context');
  el('detailContextRow').hidden = !text(card, 'context');
  el('detailRole').textContent = text(card, 'role');
  el('detailRoleRow').hidden = !text(card, 'role');
  el('detailNote').textContent = text(card, 'note');
  // CTA final: WhatsApp con el nombre del proyecto ya escrito en el mensaje.
  const message = lang() === 'en'
    ? `Hi Luis, I saw the ${text(card, 'title')} project in your portfolio and would like information about a similar project.`
    : `Hola Luis, vi el proyecto ${text(card, 'title')} en tu portfolio y quisiera información para un proyecto similar.`;
  el('detailWhatsapp').href = `https://wa.me/51970465608?text=${encodeURIComponent(message)}`;
  const wins = text(card, 'wins').split('|').filter(Boolean);
  el('detailWins').replaceChildren(...wins.map((win) => { const li = document.createElement('li'); li.textContent = win; return li; }));
  heroImg.alt = text(card, 'title');
  const href = card.dataset.href || '';
  const link = el('detailLink');
  link.hidden = !href;
  el('detailPrivate').hidden = Boolean(href);
  if (href) { link.href = href; el('detailCta').textContent = text(card, 'cta'); }
  else el('detailPrivateText').textContent = text(card, 'cta');
  if (rebuildGallery) buildGallery(card);
}

function setDistances(index) {
  cards.forEach((card, i) => card.style.setProperty('--d', String(Math.abs(i - index))));
}

/* Coloca el rack al instante (sin transición) con el panel indicado "caliente". */
function settleRack(index) {
  rack.classList.add('is-frozen');
  setHot(index);
  void rack.offsetWidth;
  rack.classList.remove('is-frozen');
}

async function loadHero(src) {
  if (heroImg.getAttribute('src') !== src) heroImg.src = src;
  try { await heroImg.decode(); } catch { /* Una imagen rota no bloquea la animación. */ }
}

function resetHeroMotion() {
  heroImg.style.translate = '';
  heroImg.style.scale = '';
}

/* Geometría para que el panel y el hero coincidan píxel a píxel. */
function morphFrames(card) {
  const cardRect = card.getBoundingClientRect();
  const imgRect = card.querySelector('img').getBoundingClientRect();
  const h = hero.getBoundingClientRect();
  const iw = heroImg.naturalWidth || h.width;
  const ih = heroImg.naturalHeight || h.height;
  const scalePanel = Math.max(imgRect.width / iw, imgRect.height / ih);
  const scaleHero = Math.max(h.width / iw, h.height / ih);
  const dx = imgRect.left + imgRect.width / 2 - (h.left + h.width / 2);
  const dy = imgRect.top + imgRect.height / 2 - (h.top + h.height / 2);
  const x1 = cardRect.left - h.left;
  const y1 = cardRect.top - h.top;
  const x2 = cardRect.right - h.left;
  const y2 = cardRect.bottom - h.top;
  return {
    clipFrom: `polygon(${x1}px ${y1}px, ${x2}px ${y1}px, ${x2}px ${y2}px, ${x1}px ${y2}px)`,
    clipTo: `polygon(0px 0px, ${h.width}px 0px, ${h.width}px ${h.height}px, 0px ${h.height}px)`,
    imgFrom: `translate(${dx}px, ${dy}px) scale(${scalePanel / scaleHero})`,
    imgTo: 'translate(0px, 0px) scale(1)',
    // Tamaño completo del bitmap "cover": así la imagen nunca queda recortada por su propia caja.
    imgBox: { w: iw * scaleHero, h: ih * scaleHero, x: (h.width - iw * scaleHero) / 2, y: (h.height - ih * scaleHero) / 2 },
  };
}

let morphAnimations = [];
function clearMorph() {
  morphAnimations.forEach((a) => a.cancel());
  morphAnimations = [];
  hero.style.overflow = '';
  ['width', 'height', 'left', 'top', 'right', 'bottom'].forEach((prop) => heroImg.style.removeProperty(prop));
}
async function runMorph(card, direction, duration = MORPH.duration) {
  clearMorph();
  resetHeroMotion();
  const f = morphFrames(card);
  const opening = direction === 'open';
  hero.style.overflow = 'visible';
  Object.assign(heroImg.style, {
    width: `${f.imgBox.w}px`, height: `${f.imgBox.h}px`, left: `${f.imgBox.x}px`, top: `${f.imgBox.y}px`, right: 'auto', bottom: 'auto',
  });
  morphAnimations = [
    hero.animate([{ clipPath: opening ? f.clipFrom : f.clipTo }, { clipPath: opening ? f.clipTo : f.clipFrom }], { ...MORPH, duration }),
    heroImg.animate([{ transform: opening ? f.imgFrom : f.imgTo }, { transform: opening ? f.imgTo : f.imgFrom }], { ...MORPH, duration }),
  ];
  try { await Promise.all(morphAnimations.map((a) => a.finished)); } catch { /* cancelada */ }
}

/* Los paneles destacados usan una captura vertical y el detalle la versión de escritorio:
   una copia del panel se desvanece sobre la expansión para que el cambio de imagen no salte. */
/* En móvil el hero es vertical: se usa la misma captura del panel (móvil) en lugar de la de escritorio. */
const usesOwnHero = (card) => Boolean(card.dataset.hero) && !compact.matches;
const heroSource = (card) => {
  const img = card.querySelector('img');
  return usesOwnHero(card) ? card.dataset.hero : (img.currentSrc || img.src);
};

function fadePanelImage(card) {
  if (!usesOwnHero(card) || reduced.matches) return;
  const img = card.querySelector('img');
  const r = card.getBoundingClientRect();
  const ghost = img.cloneNode();
  Object.assign(ghost.style, {
    position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
    margin: '0', objectFit: 'cover', objectPosition: getComputedStyle(img).objectPosition,
    transform: 'none', translate: 'none', zIndex: '8', pointerEvents: 'none',
  });
  ghost.setAttribute('aria-hidden', 'true');
  document.body.append(ghost);
  ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease', fill: 'forwards' })
    .finished.catch(() => {}).finally(() => ghost.remove());
}

async function openProject(index, { instant = false } = {}) {
  if (busy || isOpen) return;
  busy = true;
  clearTimeout(leaveTimer);
  const card = cards[index];
  const img = card.querySelector('img');
  current = index;

  fillDetail(index);
  setDistances(index);
  await loadHero(heroSource(card));

  lenis.scrollTo(0, { immediate: true, force: true });
  detail.inert = false;
  rack.inert = true;
  history.replaceState(null, '', `#${card.dataset.id}`);

  if (instant || reduced.matches) {
    settleRack(index);
    isOpen = true;
    detail.classList.add('is-open', 'is-revealed');
    card.classList.add('is-source');
    stage.classList.add('is-detail');
    lenis.start();
    busy = false;
    if (!instant) backButton.focus({ preventScroll: true });
    return;
  }

  // Se mide con el hero ya en su sitio, pero recortado exactamente al panel.
  detail.classList.add('is-open');
  const pending = runMorph(card, 'open');
  fadePanelImage(card);
  isOpen = true;
  card.classList.add('is-source');
  stage.classList.add('is-detail');
  await pending;
  clearMorph();
  detail.classList.add('is-revealed');
  lenis.start();
  busy = false;
  backButton.focus({ preventScroll: true });
  if (closeQueued) { closeQueued = false; closeProject(); }
}

function scrollDetailTop() {
  const start = lenis.animatedScroll || detail.scrollTop;
  if (start < 2) return Promise.resolve();
  if (reduced.matches) { lenis.scrollTo(0, { immediate: true, force: true }); return Promise.resolve(); }
  return new Promise((resolve) => {
    lenis.scrollTo(0, {
      duration: Math.min(0.6, 0.3 + start / 3000),
      easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      force: true,
      lock: true,
      onComplete: resolve,
    });
  });
}

async function closeProject() {
  if (!isOpen) return;
  if (busy) { closeQueued = true; return; }
  busy = true;
  const card = cards[current];
  detail.classList.remove('is-revealed');
  await scrollDetailTop();
  lenis.stop();
  settleRack(current);

  let heroFade;
  if (!reduced.matches) {
    await wait(60);
    await runMorph(card, 'close', 640);
    if (usesOwnHero(card)) {
      // La captura de escritorio se funde con la imagen propia del panel.
      card.classList.remove('is-source');
      heroFade = hero.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease', fill: 'forwards' });
      await heroFade.finished.catch(() => {});
    }
  }

  card.classList.add('is-returning');
  stage.classList.remove('is-detail');
  card.classList.remove('is-source');
  setTimeout(() => card.classList.remove('is-returning'), 800);
  detail.classList.remove('is-open');
  clearMorph();
  heroFade?.cancel();
  resetHeroMotion();
  detail.inert = true;
  rack.inert = false;
  history.replaceState(null, '', location.pathname + location.search);
  isOpen = false;
  busy = false;
  current = -1;
  card.focus({ preventScroll: true });
  // Si el cursor no está sobre el panel, vuelve a su tamaño con suavidad.
  setTimeout(() => {
    if (!isOpen && !card.matches(':hover') && !card.matches(':focus-visible')) setHot(-1);
  }, 700);
}

async function switchProject(index) {
  if (!isOpen || busy || index === current) return;
  busy = true;
  const oldCard = cards[current];
  const card = cards[index];
  detail.classList.remove('is-revealed');
  await scrollDetailTop();
  if (!reduced.matches) {
    await wait(60);
    await heroImg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease', fill: 'forwards' }).finished.catch(() => {});
  }
  current = index;
  const img = card.querySelector('img');
  await loadHero(heroSource(card));
  fillDetail(index);
  rack.classList.add('is-frozen');
  oldCard.classList.remove('is-source');
  card.classList.add('is-source');
  setDistances(index);
  settleRack(index);
  heroImg.getAnimations().forEach((a) => a.cancel());
  if (!reduced.matches) {
    heroImg.animate(
      [{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)' },
    );
  }
  history.replaceState(null, '', `#${card.dataset.id}`);
  await nextFrame();
  detail.classList.add('is-revealed');
  busy = false;
  if (closeQueued) { closeQueued = false; closeProject(); }
}

/* ---------- Controles ---------- */
backButton.addEventListener('click', closeProject);
moreButton.addEventListener('click', () => {
  lenis.scrollTo(el('detailAbout'), { offset: -24, duration: reduced.matches ? 0 : 0.9 });
});

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !isOpen) return;
  if (document.querySelector('dialog[open]')) return;
  event.preventDefault();
  closeProject();
});

window.addEventListener('portfolio-language-change', renderCopy);

/* ---------- Inicio ---------- */
renderCopy();
requestAnimationFrame(() => document.querySelector('.reel-intro').classList.add('is-in'));
const fromHash = cards.findIndex((card) => `#${card.dataset.id}` === location.hash);
if (fromHash >= 0) openProject(fromHash, { instant: true });

/* Proyectos — paneles verticales con expansión fluida al detalle. */
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
const nextButton = document.getElementById('detailNext');
const el = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 720px)');
const canHover = matchMedia('(hover: hover) and (pointer: fine)');

const UI = {
  es: {
    back: 'Proyectos', more: 'Ver detalles', gallery: 'Capturas', next: 'Siguiente proyecto', wins: 'Qué construí',
    ctaTitle: '¿Necesitas algo similar para tu empresa?', ctaButton: 'Escríbeme por WhatsApp', context: 'Contexto', role: 'Mi rol', stack: 'Stack',
    heading: 'Proyectos', lead: 'Sitios publicados, sistemas internos y proyectos académicos: del diseño a producción.',
    work: 'Profesionales', academic: 'Académicos', zoom: 'Ampliar', prev: 'Captura anterior', nextShot: 'Captura siguiente',
    idleKicker: '3 profesionales · 5 académicos', idleTitle: 'Elige un proyecto',
    idleDesc: 'Los profesionales están publicados y en uso; los académicos incluyen su repositorio.',
    idleHintHover: 'Pasa el cursor por los paneles', idleHintTouch: 'Desliza para ver más →',
    open: 'Clic para ver el proyecto →', openTouch: 'Toca para ver el proyecto →',
  },
  en: {
    back: 'Projects', more: 'View details', gallery: 'Screenshots', next: 'Next project', wins: 'What I built',
    ctaTitle: 'Need something similar for your business?', ctaButton: 'Message me on WhatsApp', context: 'Context', role: 'My role', stack: 'Stack',
    heading: 'Projects', lead: 'Published websites, internal systems and academic projects: from design to production.',
    work: 'Professional', academic: 'Academic', zoom: 'Enlarge', prev: 'Previous screenshot', nextShot: 'Next screenshot',
    idleKicker: '3 professional · 5 academic', idleTitle: 'Pick a project',
    idleDesc: 'Professional projects are live and in use; academic ones include their repository.',
    idleHintHover: 'Hover over the panels', idleHintTouch: 'Swipe to see more →',
    open: 'Click to view the project →', openTouch: 'Tap to view the project →',
  },
};
// Curva suave al inicio y al final; duración corta para llegar rápido al contenido.
const MORPH = { duration: 760, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'both' };

let hot = -1;
let current = -1;
let isOpen = false;
let busy = false;
let leaveTimer;
let closeQueued = false;

const lang = () => (root.lang === 'en' ? 'en' : 'es');
const t = (key) => UI[lang()][key];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (card, key) => card.dataset[key + (lang() === 'en' ? 'En' : 'Es')] || card.dataset[`${key}Es`] || '';
const list = (value) => (value || '').split('|').map((s) => s.trim()).filter(Boolean);
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

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
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

/* ---------- Categoría dentro de cada panel ---------- */
cards.forEach((card) => {
  const kicker = document.createElement('span');
  kicker.className = 'reel-card__kicker';
  kicker.setAttribute('aria-hidden', 'true');
  card.append(kicker);
});

/* ---------- Ficha inferior: describe el proyecto bajo el cursor ---------- */
// Categoría + empresa/tipo y año, sin el cargo (que ya aparece en el detalle).
const infoKicker = (card) => [text(card, 'kicker'), ...text(card, 'context').split(' · ').filter((part) => !/practicante|intern/i.test(part))]
  .filter(Boolean).join(' · ');
let infoIndex = null;
function renderInfo(index, animate = true) {
  const changed = infoIndex !== index;
  infoIndex = index;
  const card = cards[index];
  const touch = !canHover.matches || compact.matches;
  const apply = () => {
    el('infoKicker').textContent = card ? infoKicker(card) : t('idleKicker');
    el('infoTitle').textContent = card ? text(card, 'title') : t('idleTitle');
    el('infoDesc').textContent = card ? text(card, 'desc') : t('idleDesc');
    el('infoTech').textContent = card ? card.dataset.tech : '';
    el('infoHint').textContent = card ? t(touch ? 'openTouch' : 'open') : t(touch ? 'idleHintTouch' : 'idleHintHover');
  };
  const box = document.querySelector('.reel-info');
  if (!animate || !changed || reduced.matches) { apply(); return; }
  box.getAnimations().forEach((a) => a.cancel());
  box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-in' }).finished.then(() => {
    apply();
    box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
  }).catch(() => {});
}

function renderCopy() {
  cards.forEach((card) => {
    card.querySelector('.reel-card__kicker').textContent = text(card, 'kicker');
    card.querySelector('.reel-card__label').innerHTML = text(card, 'label') || text(card, 'title');
    card.setAttribute('aria-label', `${text(card, 'title')} — ${text(card, 'kicker')}`);
  });
  document.querySelectorAll('[data-ui]').forEach((node) => { node.textContent = t(node.dataset.ui); });
  el('shotsPrev').setAttribute('aria-label', t('prev'));
  el('shotsNext').setAttribute('aria-label', t('nextShot'));
  if (current >= 0) fillDetail(current, { rebuildGallery: false });
  renderInfo(infoIndex ?? -1, false);
}

// Los paneles se revelan cuando sus imágenes ya cargaron, así la animación no muestra cajas vacías.
const cardImages = cards.map((card) => card.querySelector('img').decode().catch(() => card.classList.add('is-broken')));
Promise.race([Promise.all(cardImages), wait(2500)]).then(() => rack.classList.add('is-ready'));

/* ---------- Hover / foco (acordeón estable) ---------- */
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
  card.addEventListener('focus', () => { if (!isOpen && card.matches(':focus-visible')) setHot(i); });
  card.addEventListener('click', () => openProject(i));
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (i + (event.key === 'ArrowRight' ? 1 : -1) + cards.length) % cards.length;
    cards[next].focus();
  });
});

/* En móvil (sin cursor) la ficha describe el panel más visible del carrusel horizontal. */
let scrollTimer;
rack.addEventListener('scroll', () => {
  if (!compact.matches || isOpen) return;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    const box = rack.getBoundingClientRect();
    const anchor = box.left + box.width * 0.3;
    let best = -1;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - anchor);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    renderInfo(rack.scrollLeft < 8 ? -1 : best);
  }, 90);
}, { passive: true });

/* ---------- Carrusel de capturas ---------- */
const zoom = el('reelZoom');
const zoomImg = el('reelZoomImg');
zoom.addEventListener('click', () => zoom.close());
const track = el('shotsTrack');
const thumbs = el('shotsThumbs');
const shots = { index: 0, sources: [], captions: [] };
const isPhoneShot = (src) => /(movil|mobile)/i.test(src);

function buildGallery(card) {
  shots.sources = list(card.dataset.gallery);
  shots.captions = list(text(card, 'captions'));
  shots.index = 0;
  const single = shots.sources.length < 2;
  el('shots').classList.toggle('is-single', single);

  track.replaceChildren(...shots.sources.map((src, i) => {
    const li = document.createElement('li');
    li.className = `shot${isPhoneShot(src) ? ' shot--phone' : ''}`;
    li.setAttribute('aria-roledescription', 'slide');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shot__zoom';
    const img = document.createElement('img');
    img.src = src;
    img.alt = shots.captions[i] || '';
    img.decoding = 'async';
    if (i > 1) img.loading = 'lazy';
    // Capturas altas de código: se muestran desde arriba llenando el marco; se amplían al hacer clic.
    img.addEventListener('load', () => {
      if (!isPhoneShot(src) && img.naturalWidth / img.naturalHeight < 1.25) li.classList.add('shot--tall');
    });
    button.addEventListener('click', () => {
      if (dragMoved) return;
      zoomImg.src = src;
      zoomImg.alt = img.alt;
      zoom.showModal();
    });
    button.append(img);
    li.append(button);
    return li;
  }));

  thumbs.replaceChildren(...shots.sources.map((src, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `shots__thumb${isPhoneShot(src) ? ' is-phone' : ''}`;
    b.setAttribute('aria-label', shots.captions[i] || `${i + 1}`);
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    b.append(img);
    b.addEventListener('click', () => showShot(i));
    return b;
  }));
  showShot(0, { instant: true });
}

function showShot(index, { instant = false } = {}) {
  const n = shots.sources.length;
  if (!n) return;
  shots.index = (index + n) % n;
  track.style.transition = instant || reduced.matches ? 'none' : '';
  track.style.transform = `translate3d(${-shots.index * 100}%,0,0)`;
  [...track.children].forEach((li, i) => {
    li.inert = i !== shots.index;
    li.querySelector('button').setAttribute('aria-label', `${t('zoom')}: ${shots.captions[i] || ''}`);
  });
  [...thumbs.children].forEach((b, i) => b.setAttribute('aria-current', String(i === shots.index)));
  el('shotsCount').textContent = `${String(shots.index + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
  el('shotsCaption').textContent = shots.captions[shots.index] || '';
  thumbs.children[shots.index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

el('shotsPrev').addEventListener('click', () => showShot(shots.index - 1));
el('shotsNext').addEventListener('click', () => showShot(shots.index + 1));
el('shots').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showShot(shots.index - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showShot(shots.index + 1); }
});

/* Arrastre con el dedo o el mouse y desplazamiento horizontal del trackpad. */
let drag = null;
let dragMoved = false;
const stageEl = document.querySelector('.shots__stage');
stageEl.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || event.target.closest('.shots__arrow')) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, width: stageEl.offsetWidth };
  dragMoved = false;
});
stageEl.addEventListener('pointermove', (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  if (!dragMoved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(event.clientY - drag.y)) {
    dragMoved = true;
    track.style.transition = 'none';
  }
  if (dragMoved) track.style.transform = `translate3d(calc(${-shots.index * 100}% + ${dx}px),0,0)`;
});
const endDrag = (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  const width = drag.width;
  drag = null;
  if (!dragMoved) return;
  track.style.transition = '';
  if (Math.abs(dx) > width * 0.15) showShot(shots.index + (dx < 0 ? 1 : -1));
  else showShot(shots.index);
  setTimeout(() => { dragMoved = false; }, 60);
};
stageEl.addEventListener('pointerup', endDrag);
stageEl.addEventListener('pointercancel', endDrag);
let wheelLock = 0;
stageEl.addEventListener('wheel', (event) => {
  if (Math.abs(event.deltaX) < Math.abs(event.deltaY) || Math.abs(event.deltaX) < 20) return;
  event.preventDefault();
  event.stopPropagation();
  const now = performance.now();
  if (now < wheelLock) return;
  wheelLock = now + 600;
  showShot(shots.index + (event.deltaX > 0 ? 1 : -1));
}, { passive: false });

/* ---------- Detalle ---------- */
function fillDetail(index, { rebuildGallery = true } = {}) {
  const card = cards[index];
  el('detailKicker').textContent = text(card, 'kicker');
  el('detailTitle').textContent = text(card, 'title');
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
  el('detailWins').replaceChildren(...list(text(card, 'wins')).map((win) => { const li = document.createElement('li'); li.textContent = win; return li; }));
  heroImg.alt = text(card, 'title');
  const href = card.dataset.href || '';
  const link = el('detailLink');
  link.hidden = !href;
  el('detailPrivate').hidden = Boolean(href);
  if (href) { link.href = href; el('detailCta').textContent = text(card, 'cta'); }
  else el('detailPrivateText').textContent = text(card, 'cta');
  el('nextTitle').textContent = text(cards[(index + 1) % cards.length], 'title');
  if (rebuildGallery) buildGallery(card);
  else {
    shots.captions = list(text(card, 'captions'));
    [...thumbs.children].forEach((b, i) => b.setAttribute('aria-label', shots.captions[i] || `${i + 1}`));
    [...track.children].forEach((li, i) => { li.querySelector('img').alt = shots.captions[i] || ''; });
    showShot(shots.index, { instant: true });
  }
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
   una copia del panel se desvanece sobre la expansión para que el cambio de imagen no salte.
   En móvil el hero es vertical: se usa la misma captura del panel. */
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
    margin: '0', objectFit: 'cover', objectPosition: getComputedStyle(img).objectPosition, zIndex: '8', pointerEvents: 'none',
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
      easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
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
  await loadHero(heroSource(card));
  fillDetail(index);
  oldCard.classList.remove('is-source');
  card.classList.add('is-source');
  setDistances(index);
  settleRack(index);
  heroImg.getAnimations().forEach((a) => a.cancel());
  if (!reduced.matches) heroImg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' });
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
nextButton.addEventListener('click', () => switchProject((current + 1) % cards.length));

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !isOpen) return;
  if (document.querySelector('dialog[open]')) return;
  event.preventDefault();
  closeProject();
});

// Enlaces a otro proyecto dentro de la misma página (por ejemplo, #erp).
window.addEventListener('hashchange', () => {
  const index = cards.findIndex((card) => `#${card.dataset.id}` === location.hash);
  if (index < 0) return;
  if (isOpen) switchProject(index);
  else openProject(index);
});

window.addEventListener('portfolio-language-change', renderCopy);

/* ---------- Inicio ---------- */
renderCopy();
requestAnimationFrame(() => document.querySelector('.reel-intro').classList.add('is-in'));
const fromHash = cards.findIndex((card) => `#${card.dataset.id}` === location.hash);
if (fromHash >= 0) openProject(fromHash, { instant: true });

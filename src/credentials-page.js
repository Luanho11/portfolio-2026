/* Formación y certificaciones — carrusel 3D con título superpuesto. */
const root = document.documentElement;
const stage = document.getElementById('credStage');
const ring = document.getElementById('credRing');
const caption = document.getElementById('credCaption');
const titleEl = document.getElementById('credTitle');
const subEl = document.getElementById('credSub');
const dotsBox = document.getElementById('credDots');
const bgLayers = [...document.querySelectorAll('.cred-bg__layer')];
const dialog = document.getElementById('certificateDialog');
const dialogImage = document.getElementById('certificateImage');
const dialogTitle = document.getElementById('certificateTitle');
const dialogIssuer = document.getElementById('certificateIssuer');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const UI = {
  es: { back: 'Perfil', heading: 'Formación y certificaciones', es: 'Español · Nativo', en: 'Inglés · Avanzado', fr: 'Francés · Básico', prev: 'Anterior', next: 'Siguiente', view: 'Ver certificado', close: 'Cerrar' },
  en: { back: 'Profile', heading: 'Education and certifications', es: 'Spanish · Native', en: 'English · Advanced', fr: 'French · Basic', prev: 'Previous', next: 'Next', view: 'View certificate', close: 'Close' },
};
const lang = () => (root.lang === 'en' ? 'en' : 'es');
const text = (el, key) => el.dataset[key + (lang() === 'en' ? 'En' : 'Es')] || el.dataset[`${key}Es`] || '';
const pad = (n) => String(n).padStart(2, '0');

/* ---------- Construcción: dos copias para que el giro sea infinito sin saltos visibles ---------- */
const sourceCards = [...ring.querySelectorAll('.cred-card')];
const count = sourceCards.length;
const inner = document.createElement('div');
inner.className = 'cred-ring__inner';
ring.append(inner);
sourceCards.forEach((card) => inner.append(card));
sourceCards.forEach((card) => {
  inner.append(card.cloneNode(true));
});
const cards = [...inner.querySelectorAll('.cred-card')];
const total = cards.length;
const itemOf = (k) => k % count;

let position = 0; // índice virtual (no acotado)
let captionToken = 0;
let bgFront = 0;

const dots = sourceCards.map((card, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'cred-dot';
  dot.setAttribute('role', 'tab');
  dot.addEventListener('click', () => goTo(i));
  dotsBox.append(dot);
  return dot;
});

/* ---------- Geometría (arco cóncavo: los bordes exteriores se acercan) ---------- */
const SLOTS = [
  { x: 0, z: 0, ry: 0, s: 1, o: 1, b: 1 },
  { x: 1.0, z: -70, ry: 17, s: 0.9, o: 1, b: 0.5 },
  { x: 1.86, z: -200, ry: 27, s: 0.8, o: 1, b: 0.38 },
  { x: 2.55, z: -320, ry: 34, s: 0.7, o: 0, b: 0.3 },
];

function signedDistance(k) {
  let d = (((k - position) % total) + total) % total;
  if (d > total / 2) d -= total;
  return d;
}

function layout({ instant = false } = {}) {
  const cw = cards[0].offsetWidth || 240;
  const active = ((position % count) + count) % count;
  cards.forEach((card, k) => {
    const d = signedDistance(k);
    const ad = Math.min(Math.abs(d), 3);
    const side = Math.sign(d);
    const slot = SLOTS[ad];
    const prevD = Number(card.dataset.d ?? d);
    // Una tarjeta que cruza de un extremo al otro va oculta y sin transición.
    const wraps = Math.abs(d - prevD) > 3;
    card.classList.toggle('is-instant', instant || wraps);
    card.dataset.d = String(d);
    // La tarjeta del frente queda sin transformación 3D ni filtro: así el navegador la dibuja nítida.
    card.style.transform = d === 0 ? 'none' : `translate3d(${(side * slot.x * cw).toFixed(1)}px,0,${slot.z}px) rotateY(${(side * slot.ry).toFixed(1)}deg) scale(${slot.s})`;
    card.style.opacity = String(Math.abs(d) >= 3 ? 0 : slot.o);
    card.style.filter = d === 0 ? 'none' : `brightness(${slot.b})`;
    card.style.zIndex = String(10 - Math.abs(d));
    const isActive = d === 0;
    card.classList.toggle('is-active', isActive);
    card.tabIndex = isActive ? 0 : -1;
    card.inert = Math.abs(d) > 2;
  });
  // Aplica las posiciones "sin transición" y luego reactiva las transiciones.
  void inner.offsetWidth;
  cards.forEach((c) => c.classList.remove('is-instant'));
  dots.forEach((dot, i) => dot.setAttribute('aria-selected', String(i === active)));
}

/* ---------- Título, fondo y contenido ---------- */
function setBackground(card, immediate = false) {
  const img = card.querySelector('.cred-card__media > img');
  const src = img?.getAttribute('src') || './logos/upn.png';
  const next = bgLayers[(bgFront + 1) % bgLayers.length];
  next.style.backgroundImage = `url("${src}")`;
  next.classList.add('is-visible');
  const prev = bgLayers[bgFront];
  if (immediate) prev.classList.remove('is-visible');
  else requestAnimationFrame(() => prev.classList.remove('is-visible'));
  bgFront = (bgFront + 1) % bgLayers.length;
}

function fillCaption(card) {
  const lines = text(card, 't').split('|');
  titleEl.replaceChildren(...lines.map((line) => {
    const wrap = document.createElement('span');
    wrap.className = 'cred-line';
    const span = document.createElement('span');
    span.textContent = line;
    wrap.append(span);
    return wrap;
  }));
  subEl.textContent = text(card, 's');
}

async function showCaption(card, immediate = false) {
  const token = ++captionToken;
  if (immediate || reduced.matches) {
    caption.classList.remove('is-out');
    fillCaption(card);
    caption.classList.add('is-in');
    return;
  }
  caption.classList.add('is-out');
  await new Promise((r) => setTimeout(r, 340));
  if (token !== captionToken) return;
  caption.classList.remove('is-in', 'is-out');
  fillCaption(card);
  void caption.offsetWidth;
  // Espera a que la tarjeta nueva llegue casi al centro antes de revelar el texto.
  await new Promise((r) => setTimeout(r, 180));
  if (token !== captionToken) return;
  caption.classList.add('is-in');
}

function renderStaticCopy() {
  document.querySelectorAll('[data-ui]').forEach((node) => { node.textContent = UI[lang()][node.dataset.ui]; });
  document.getElementById('credPrev').setAttribute('aria-label', UI[lang()].prev);
  document.getElementById('credNext').setAttribute('aria-label', UI[lang()].next);
  document.querySelector('[data-certificate-close]')?.setAttribute('aria-label', UI[lang()].close);
  cards.forEach((card) => {
    card.querySelector('.cred-card__tag').textContent = `#${text(card, 'tag')}`;
    const img = card.querySelector('.cred-card__media > img');
    if (img && card.dataset.img) img.alt = text(card, 'alt');
    const name = text(card, 't').replace('|', ' ');
    card.setAttribute('aria-label', card.dataset.img ? `${name} — ${UI[lang()].view}` : name);
  });
  sourceCards.forEach((card, i) => dots[i].setAttribute('aria-label', text(card, 't').replace('|', ' ')));
}

/* ---------- Navegación ---------- */
function go(step) {
  if (!step) return;
  position += step;
  layout();
  const card = cards[((position % total) + total) % total];
  setBackground(card);
  showCaption(card);
}
function goTo(index) {
  const active = ((position % count) + count) % count;
  let step = index - active;
  if (step > count / 2) step -= count;
  if (step < -count / 2) step += count;
  go(step);
}

function openCertificate(card) {
  if (!card.dataset.img) return;
  dialogImage.src = card.dataset.img;
  dialogImage.alt = text(card, 'alt');
  dialogTitle.textContent = text(card, 't').replace('|', ' ');
  dialogIssuer.textContent = text(card, 's');
  dialog.showModal();
}

let suppressClick = false;
cards.forEach((card, k) => {
  card.addEventListener('click', () => {
    if (suppressClick) return;
    const d = signedDistance(k);
    if (d === 0) openCertificate(card);
    else go(d);
  });
});

document.getElementById('credPrev').addEventListener('click', () => go(-1));
document.getElementById('credNext').addEventListener('click', () => go(1));

window.addEventListener('keydown', (event) => {
  if (dialog.open || document.querySelector('dialog[open]')) return;
  if (event.target.closest('input,textarea,select,[contenteditable]')) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
});

/* Arrastre / swipe */
let drag = null;
stage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || event.target.closest('.cred-arrow,.cred-dot,a')) return;
  drag = { id: event.pointerId, x: event.clientX, moved: false };
});
stage.addEventListener('pointermove', (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  if (Math.abs(event.clientX - drag.x) > 8) drag.moved = true;
});
const endDrag = (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  const moved = drag.moved;
  drag = null;
  if (moved) {
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 60);
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  }
};
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', () => { drag = null; });

/* Trackpad horizontal */
let wheelLock = 0;
stage.addEventListener('wheel', (event) => {
  if (Math.abs(event.deltaX) < Math.abs(event.deltaY) || Math.abs(event.deltaX) < 24) return;
  event.preventDefault();
  const now = performance.now();
  if (now < wheelLock) return;
  wheelLock = now + 700;
  go(event.deltaX > 0 ? 1 : -1);
}, { passive: false });

/* ---------- Visor ---------- */
document.querySelector('[data-certificate-close]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', (e) => {
  const r = dialog.getBoundingClientRect();
  if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();
});

/* ---------- Inicio ---------- */
window.addEventListener('portfolio-language-change', () => {
  renderStaticCopy();
  const card = cards[((position % total) + total) % total];
  fillCaption(card);
});
window.addEventListener('resize', () => layout({ instant: true }), { passive: true });

const startAt = Math.max(0, sourceCards.findIndex((card) => `#${card.dataset.id}` === location.hash));
position = startAt;
renderStaticCopy();
layout({ instant: true });
setBackground(cards[startAt], true);
showCaption(cards[startAt], true);

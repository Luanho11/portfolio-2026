/*
 * Inicio, debajo del hero:
 * - Proyectos destacados: en escritorio la captura queda fija mientras los textos pasan; cada texto
 *   entra desenfocado desde abajo y se desenfoca al salir por arriba.
 * Todo responde al scroll con inercia; sin scroll no hay movimiento. Con "reducir movimiento" no se anima.
 */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function frameLoop(update, target) {
  let raf = 0;
  let visible = false;
  const request = () => { if (!raf && visible) raf = requestAnimationFrame(tick); };
  const tick = () => { raf = 0; if (update()) request(); };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; request(); }, { rootMargin: '25% 0px' }).observe(target);
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  return request;
}

/* ---------- Texto con desenfoque ---------- */
function letterEffect(section) {
  const lines = [...section.querySelectorAll('[data-letter-fx]')].flatMap((el) => (el.children.length ? [...el.children] : [el]));
  lines.forEach((el) => el.classList.add('fx-line'));
  section.classList.add('is-lettered');
  const state = new Map(lines.map((el) => [el, { v: -1 }]));

  frameLoop(() => {
    const vh = innerHeight;
    let moving = false;
    lines.forEach((el) => {
      const r = el.getBoundingClientRect();
      // Entra entre el 100 % y el 72 % de la pantalla; sale entre el 14 % y el −6 %: el texto queda
      // nítido casi todo su recorrido y solo se desenfoca en los bordes.
      const enter = smooth(vh - r.top, 0, vh * 0.28);
      const exit = smooth(vh * 0.14 - r.bottom, 0, vh * 0.2);
      const target = enter * (1 - exit) + exit * 2;
      const s = state.get(el);
      s.v = s.v < 0 ? target : s.v + (target - s.v) * 0.12;
      if (Math.abs(target - s.v) > 0.002) moving = true;
      const inV = Math.min(s.v, 1);
      const outV = Math.max(s.v - 1, 0);
      el.style.opacity = (inV * (1 - outV)).toFixed(3);
      el.style.filter = `blur(${((1 - inV) * 5 + outV * 4).toFixed(2)}px)`;
      el.style.transform = `translate3d(0, ${((1 - inV) * 24 - outV * 12).toFixed(1)}px, 0)`;
    });
    return moving;
  }, section)();
}

/* ---------- Captura fija (escritorio) ---------- */
function stickyStage(section) {
  const rows = section.querySelector('.work-rows');
  const shots = [...section.querySelectorAll('.work-shot')];
  const copies = [...section.querySelectorAll('.work-copy')];
  if (!rows || shots.length !== copies.length) return;
  const wide = matchMedia('(min-width: 901px)');
  let active = -1;

  const measure = () => {
    section.classList.toggle('is-staged', wide.matches);
    const h = shots[0].getBoundingClientRect().height;
    if (h) rows.style.setProperty('--shot-h', `${Math.round(h)}px`);
  };
  const pick = () => {
    if (!wide.matches) return;
    const mid = innerHeight / 2;
    let best = 0;
    let dist = Infinity;
    copies.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < dist) { dist = d; best = i; }
    });
    if (best === active) return;
    active = best;
    shots.forEach((el, i) => {
      el.classList.toggle('is-active', i === best);
      // Las capturas ocultas no deben recibir foco ni clics.
      if (i === best) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', '-1');
    });
  };

  measure();
  pick();
  addEventListener('scroll', pick, { passive: true });
  addEventListener('resize', () => { measure(); active = -1; pick(); });
  wide.addEventListener('change', () => {
    measure();
    active = -1;
    if (!wide.matches) shots.forEach((el) => { el.classList.remove('is-active'); el.removeAttribute('tabindex'); });
    pick();
  });
}

if (!reduced) {
  const work = document.getElementById('trabajo');
  if (work) { stickyStage(work); letterEffect(work); }
}

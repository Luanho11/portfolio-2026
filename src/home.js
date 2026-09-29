/*
 * Inicio, debajo del hero:
 * - Proyectos destacados: en escritorio la captura queda fija mientras los textos pasan; cada texto
 *   aparece desde abajo y se desvanece al salir por arriba (sin desenfoque).
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

  const cabecera = document.querySelector('.site-header');
  frameLoop(() => {
    const vh = innerHeight;
    // Primero se leen todas las medidas y después se escriben los estilos: así el navegador
    // no recalcula el diseño por cada línea (mejor rendimiento al hacer scroll).
    // Con la cabecera fija, el texto sale por debajo de ella para que se vea el desvanecido.
    const topeCabecera = cabecera ? cabecera.getBoundingClientRect().bottom : 0;
    const medidas = lines.map((el) => el.getBoundingClientRect());
    let moving = false;
    lines.forEach((el, i) => {
      const r = medidas[i];
      // Entra desde abajo de la pantalla y sale justo debajo de la cabecera, solo con opacidad y
      // desplazamiento: sin desenfoque, para que el texto no se vea grueso y luego nítido.
      const enter = smooth(vh - r.top, 0, vh * 0.28);
      const exit = smooth(topeCabecera + vh * 0.16 - r.bottom, 0, vh * 0.2);
      const target = enter * (1 - exit) + exit * 2;
      const s = state.get(el);
      s.v = s.v < 0 ? target : s.v + (target - s.v) * 0.2;
      // Cerca del final se ajusta al valor exacto: el texto termina 100 % opaco y quieto (nítido).
      if (Math.abs(target - s.v) < 0.01) s.v = target; else moving = true;
      const inV = Math.min(s.v, 1);
      const outV = Math.max(s.v - 1, 0);
      const alpha = inV * (1 - outV);
      const opacity = alpha >= 0.999 ? '' : alpha.toFixed(3);
      const shift = ((1 - inV) * 24 - outV * 12).toFixed(1);
      const transform = shift === '0.0' || shift === '-0.0' ? 'none' : `translate3d(0, ${shift}px, 0)`;
      // Solo se escribe lo que cambió.
      if (s.opacity !== opacity) { el.style.opacity = opacity; s.opacity = opacity; }
      if (s.transform !== transform) { el.style.transform = transform; s.transform = transform; }
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
  let pickFrame = 0;
  addEventListener('scroll', () => { if (!pickFrame) pickFrame = requestAnimationFrame(() => { pickFrame = 0; pick(); }); }, { passive: true });
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
  // En celular el texto queda siempre nítido: el desenfoque al hacer scroll se sentía como cortes.
  const escritorio = matchMedia('(min-width: 901px) and (pointer: fine)').matches;
  if (work) { stickyStage(work); if (escritorio) letterEffect(work); }
}

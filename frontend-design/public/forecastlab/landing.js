// Landing page interactions

const TWEAKS = /*EDITMODE-BEGIN*/{
  "gradient": 3,
  "heroVisual": "band"
}/*EDITMODE-END*/;

const GRADIENTS = [
  { name: 'Violet · Blue · Cyan', c: ['#7c3aed', '#3b82f6', '#06b6d4'] },
  { name: 'Pink · Violet · Blue', c: ['#ec4899', '#8b5cf6', '#3b82f6'] },
  { name: 'Cyan · Indigo · Violet', c: ['#22d3ee', '#6366f1', '#a78bfa'] },
  { name: 'Emerald · Cyan · Indigo', c: ['#10b981', '#06b6d4', '#6366f1'] }
];

function applyGradient(idx) {
  const g = GRADIENTS[idx];
  window.__GRAD_COLORS = g.c;
  const root = document.documentElement;
  root.style.setProperty('--grad-1', g.c[0]);
  root.style.setProperty('--grad-2', g.c[1]);
  root.style.setProperty('--grad-3', g.c[2]);
  root.style.setProperty('--grad', `linear-gradient(135deg, ${g.c[0]} 0%, ${g.c[1]} 50%, ${g.c[2]} 100%)`);
  root.style.setProperty('--grad-soft', `linear-gradient(135deg, ${hex2rgba(g.c[0],0.16)}, ${hex2rgba(g.c[1],0.10)} 50%, ${hex2rgba(g.c[2],0.16)})`);
}

function hex2rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}

function renderHeroVisual(variant) {
  const card = document.getElementById('heroCard');
  if (window.HERO_VISUALS && window.HERO_VISUALS[variant]) {
    window.HERO_VISUALS[variant](card);
    requestAnimationFrame(() => animateDraw(card));
  }
}

function animateDraw(card) {
  // Phase 1: actual line draws first (stroke-dashoffset trick)
  const actualLine = card.querySelector('.ts-line');
  const predLine = card.querySelector('.ts-pred');
  const actualDur = 1800;
  const predDur = 2400;

  if (actualLine) {
    const len = actualLine.getTotalLength();
    actualLine.style.strokeDasharray = len;
    actualLine.style.strokeDashoffset = len;
    actualLine.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: actualDur, delay: 200, easing: 'cubic-bezier(.65,.05,.35,1)', fill: 'forwards' }
    );
  }

  // Phase 2: forecast (pred) line — dashed pattern preserved (kept as SVG attr).
  // Reveal it with clip-path inset wipe so the dashed segments stay readable.
  if (predLine) {
    // Wipe direction is left → right within the pred line's bounding box.
    // Use clipPath inset relative to the path itself.
    predLine.style.clipPath = 'inset(0 100% 0 0)';
    predLine.style.webkitClipPath = 'inset(0 100% 0 0)';
    predLine.animate(
      [
        { clipPath: 'inset(0 100% 0 0)', webkitClipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', webkitClipPath: 'inset(0 0% 0 0)' }
      ],
      { duration: predDur, delay: 200 + actualDur, easing: 'cubic-bezier(.4,.0,.2,1)', fill: 'forwards' }
    );
    // pulse glow at end of forecast draw
    predLine.animate(
      [
        { filter: 'drop-shadow(0 0 12px currentColor)' },
        { filter: 'drop-shadow(0 0 28px currentColor) brightness(1.4)' },
        { filter: 'drop-shadow(0 0 12px currentColor)' }
      ],
      { duration: 900, delay: 200 + actualDur + predDur - 300, easing: 'ease-in-out', fill: 'forwards' }
    );
  }

  // Bands: fade in synced with forecast line
  card.querySelectorAll('.ts-band-outer, .ts-band-inner').forEach((p, i) => {
    p.style.opacity = '0';
    p.animate(
      [{ opacity: 0, transform: 'scaleY(0.6)' }, { opacity: 1, transform: 'scaleY(1)' }],
      { duration: 1400, delay: 200 + actualDur + i * 250, easing: 'cubic-bezier(.65,.05,.35,1)', fill: 'forwards' }
    );
    p.style.transformOrigin = 'center';
  });
}

/* Hero card: hover → redraw (with cooldown), click → redraw (always, instantly) */
const heroCardEl = document.getElementById('heroCard');
let heroHoverCooldown = false;
heroCardEl?.addEventListener('mouseenter', () => {
  if (heroHoverCooldown) return;
  heroHoverCooldown = true;
  setTimeout(() => heroHoverCooldown = false, 2400);
  animateDraw(heroCardEl);
});
heroCardEl?.addEventListener('click', () => {
  // click overrides cooldown — replay from the start every time
  heroHoverCooldown = true;
  setTimeout(() => heroHoverCooldown = false, 1200);
  // re-render the SVG to reset all state (including ts-band-* opacity, etc.)
  renderHeroVisual(TWEAKS.heroVisual);
});

/* === Init === */
applyGradient(TWEAKS.gradient);
renderHeroVisual(TWEAKS.heroVisual);

/* Build swatch UI */
const swatchRow = document.getElementById('swatchRow');
GRADIENTS.forEach((g, i) => {
  const el = document.createElement('div');
  el.className = 'swatch' + (i === TWEAKS.gradient ? ' active' : '');
  el.style.background = `linear-gradient(135deg, ${g.c[0]}, ${g.c[1]}, ${g.c[2]})`;
  el.title = g.name;
  el.addEventListener('click', () => {
    TWEAKS.gradient = i;
    applyGradient(i);
    [...swatchRow.children].forEach((s, j) => s.classList.toggle('active', j === i));
    persist();
    renderHeroVisual(TWEAKS.heroVisual); // re-render so SVG picks up new colors
    renderOverview3D();
    renderModelSparks();
  });
  swatchRow.appendChild(el);
});

/* Hero visual radio */
const visualRow = document.getElementById('visualRow');
[...visualRow.querySelectorAll('button')].forEach(btn => {
  btn.classList.toggle('active', btn.dataset.v === TWEAKS.heroVisual);
  btn.addEventListener('click', () => {
    TWEAKS.heroVisual = btn.dataset.v;
    [...visualRow.children].forEach(b => b.classList.toggle('active', b.dataset.v === TWEAKS.heroVisual));
    renderHeroVisual(TWEAKS.heroVisual);
    persist();
  });
});

function persist() {
  window.parent.postMessage({ type: '__edit_mode_set_keys', edits: TWEAKS }, '*');
}

/* Tweaks panel host integration */
const tweaks = document.getElementById('tweaks');
window.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === '__activate_edit_mode') tweaks.classList.add('visible');
  else if (d.type === '__deactivate_edit_mode') tweaks.classList.remove('visible');
});
window.parent.postMessage({ type: '__edit_mode_available' }, '*');

/* === Cursor blob follows mouse === */
const blob = document.getElementById('cursorBlob');
let mx = window.innerWidth / 2, my = window.innerHeight / 2;
let bx = mx, by = my;
window.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  // 3D tilt for hero visual
  const visual = document.getElementById('visualStage');
  if (visual) {
    const rect = document.getElementById('heroVisual').getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    visual.style.transform = `rotateY(${dx * 14}deg) rotateX(${-dy * 14}deg)`;
  }
});
function blobLoop() {
  bx += (mx - bx) * 0.08;
  by += (my - by) * 0.08;
  blob.style.transform = `translate(${bx}px, ${by}px) translate(-50%, -50%)`;
  requestAnimationFrame(blobLoop);
}
blobLoop();

/* === Nav scroll glass === */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

/* === Reveal on scroll + character split === */
// Split h2 / .lead headings into per-word spans for richer entry animation
document.querySelectorAll('.section h2, .hero h1, .cta-block h2, .section p.lead').forEach(h => {
  if (h.dataset.split) return;
  h.dataset.split = '1';
  // Walk inline children, wrap their text in word spans, but keep <span class="grad-text"> structure
  const wrapText = (node) => {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      const words = node.textContent.split(/(\s+)/);
      words.forEach(w => {
        if (/^\s+$/.test(w)) {
          frag.appendChild(document.createTextNode(w));
        } else if (w.length) {
          const s = document.createElement('span');
          s.className = 'word-anim';
          s.textContent = w;
          frag.appendChild(s);
        }
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && !node.classList.contains('line')) {
      [...node.childNodes].forEach(wrapText);
    }
  };
  [...h.childNodes].forEach(wrapText);
});

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      // stagger words inside this element
      const words = e.target.querySelectorAll('.word-anim');
      words.forEach((w, i) => {
        w.style.transitionDelay = (i * 70) + 'ms';
      });
      // Replay model spark animations when models grid enters viewport
      if (e.target.classList.contains('models-grid')) {
        e.target.querySelectorAll('.msp-actual, .msp-pred').forEach((p, i) => {
          const len = p.getTotalLength();
          p.style.strokeDasharray = (p.classList.contains('msp-pred') ? '4 3, ' : '') + len;
          p.style.strokeDashoffset = len;
          p.animate(
            [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
            { duration: 1800, delay: 200 + i * 120, easing: 'cubic-bezier(.65,.05,.35,1)', fill: 'forwards' }
          );
        });
      }
      // Replay metric bar fill animations
      if (e.target.classList.contains('metrics-grid')) {
        e.target.querySelectorAll('.metric-bar-fill').forEach((bar, i) => {
          // Read --w from inline style (CSS getComputedStyle doesn't always expose it)
          const inline = bar.getAttribute('style') || '';
          const m = inline.match(/--w:\s*([0-9.]+%)/);
          const w = m ? m[1] : '60%';
          bar.style.animation = 'none';
          bar.style.width = '0%';
          // Force reflow
          void bar.offsetWidth;
          bar.animate(
            [{ width: '0%' }, { width: w }],
            { duration: 1400, delay: 200 + i * 140, easing: 'cubic-bezier(.65,.05,.35,1)', fill: 'forwards' }
          );
        });
      }
    } else {
      // re-trigger on re-entry — remove .in when leaving viewport upward
      const r = e.target.getBoundingClientRect();
      if (r.top > window.innerHeight) {
        e.target.classList.remove('in');
        e.target.querySelectorAll('.word-anim').forEach(w => w.style.transitionDelay = '');
      }
    }
  });
}, { threshold: [0, 0.15, 0.5], rootMargin: '0px 0px -80px 0px' });
document.querySelectorAll('.reveal, .section h2, .cta-block h2, .section p.lead').forEach(el => io.observe(el));

/* Continuous scroll-driven slide for h2 and lead — even after they've entered */
const scrollTextEls = document.querySelectorAll('.section h2, .section p.lead, .cta-block h2');
function updateScrollTexts() {
  const vh = window.innerHeight;
  scrollTextEls.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const center = r.top + r.height / 2;
    const norm = (center - vh / 2) / vh; // -1 (bottom) to 1 (top)
    // Subtle continuous Y shift driven by scroll position
    el.style.setProperty('--scroll-y', (norm * -24).toFixed(1) + 'px');
  });
}
updateScrollTexts();
window.addEventListener('scroll', updateScrollTexts, { passive: true });

/* Scroll-driven parallax: shift section eyebrows + lead text based on viewport position */
const parallaxEls = document.querySelectorAll('.section, .cta-block');
window.addEventListener('scroll', () => {
  const vh = window.innerHeight;
  parallaxEls.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const center = r.top + r.height / 2;
    const offset = (center - vh / 2) / vh; // -1 .. 1
    el.style.setProperty('--p', offset.toFixed(3));
  });
}, { passive: true });

/* === Parallax for hero visual when scrolling === */
const heroVisual = document.getElementById('heroVisual');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (heroVisual && y < window.innerHeight) {
    heroVisual.style.transform = `translateY(${y * 0.3}px)`;
    heroVisual.style.opacity = Math.max(0, 1 - y / window.innerHeight * 1.2);
  }
}, { passive: true });

/* === Smooth scroll for nav anchors === */
function smoothScrollTo(target, duration = 700) {
  const scroller = document.scrollingElement || document.documentElement;
  const start = scroller.scrollTop;
  const change = target - start;
  if (Math.abs(change) < 2) return;
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - t0) / duration);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    scroller.scrollTop = start + change * e;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const navH = document.getElementById('nav').offsetHeight || 0;
    const scroller = document.scrollingElement || document.documentElement;
    const top = target.getBoundingClientRect().top + scroller.scrollTop - navH - 20;
    smoothScrollTo(top, 700);
    document.querySelectorAll('.nav-links a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });
});

/* Update active nav link based on scroll position */
const sectionIds = ['overview', 'pipeline', 'models', 'metrics'];
const scroller = document.scrollingElement || document.documentElement;
function updateActiveNav() {
  const navH = document.getElementById('nav').offsetHeight || 0;
  const y = scroller.scrollTop + navH + 60;
  let activeId = null;
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= y) activeId = id;
  }
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href').slice(1);
    a.classList.toggle('active', id === activeId);
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* === Overview chart: cinematic single line with sweep + pulse points === */
function renderOverview3D() {
  const host = document.getElementById('overview3d');
  if (!host) return;
  const colors = window.__GRAD_COLORS || ['#7c3aed', '#3b82f6', '#06b6d4'];
  const [c1, c2, c3] = colors;

  const W = 700, H = 360;
  const N = 80;
  // Two morphable shapes — line oscillates between them
  const shapeA = []; // primary
  const shapeB = []; // secondary morph target
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = 30 + t * (W - 60);
    // Shape A: rolling wave with growing amplitude
    const yA = H * 0.55
      - Math.sin(t * Math.PI * 3) * 70
      - Math.sin(t * Math.PI * 8) * 18
      - t * 30;
    // Shape B: phase-shifted, different amplitude
    const yB = H * 0.55
      - Math.cos(t * Math.PI * 3.3) * 75
      - Math.sin(t * Math.PI * 6) * 22
      - t * 35;
    shapeA.push({ x, yA, yB });
  }

  const buildPath = (phase) => {
    // Cosine ease between shapeA and shapeB
    const k = (1 - Math.cos(phase)) / 2;
    return shapeA.map((p, i) => {
      const y = p.yA * (1 - k) + p.yB * k;
      return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
  };
  const buildArea = (phase) => {
    return buildPath(phase) + ` L ${(shapeA[N-1].x).toFixed(1)} ${H} L ${shapeA[0].x.toFixed(1)} ${H} Z`;
  };

  host.innerHTML = `
    <svg class="ov-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="overflow:visible;">
      <defs>
        <linearGradient id="ovLineGrad" x1="0" x2="1">
          <stop offset="0" stop-color="${c1}"/>
          <stop offset="0.5" stop-color="${c2}"/>
          <stop offset="1" stop-color="${c3}"/>
        </linearGradient>
        <linearGradient id="ovFillGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="${c2}" stop-opacity="0.36"/>
          <stop offset="1" stop-color="${c2}" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="ovDotGlow">
          <stop offset="0" stop-color="${c2}" stop-opacity="0.7"/>
          <stop offset="1" stop-color="${c2}" stop-opacity="0"/>
        </radialGradient>
        <filter id="ovBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>

      <!-- horizontal grid (subtle, no frame) -->
      ${[0,1,2,3,4].map(i => `<line x1="20" y1="${50 + i * 60}" x2="${W-20}" y2="${50 + i * 60}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2 6"/>`).join('')}

      <!-- area under curve (very subtle, almost transparent) -->
      <path id="ovArea" d="${buildArea(0)}" fill="url(#ovFillGrad)" opacity="0.35"/>

      <!-- soft blur trail -->
      <path id="ovTrail" d="${buildPath(0)}" fill="none" stroke="url(#ovLineGrad)" stroke-width="5" stroke-linecap="round" filter="url(#ovBlur)" opacity="0.28"/>

      <!-- main line — thinner, lower opacity so it sits in background -->
      <path id="ovLine" d="${buildPath(0)}" fill="none" stroke="url(#ovLineGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>

      <!-- pulse dot riding the line -->
      <circle id="ovDotGlow" r="14" fill="url(#ovDotGlow)" pointer-events="none"/>
      <circle id="ovDot" r="3.5" fill="white" stroke="${c2}" stroke-width="1.5" pointer-events="none" opacity="0.85" style="filter: drop-shadow(0 0 6px ${c2});"/>

      <!-- decoration: 3 stationary highlight dots -->
      <g id="ovHighlights"></g>
    </svg>
  `;

  const lineEl = host.querySelector('#ovLine');
  const trailEl = host.querySelector('#ovTrail');
  const areaEl = host.querySelector('#ovArea');
  const dotEl = host.querySelector('#ovDot');
  const dotGlowEl = host.querySelector('#ovDotGlow');
  const highlights = host.querySelector('#ovHighlights');

  // Initial draw-on animation
  const totalLen = lineEl.getTotalLength();
  lineEl.style.strokeDasharray = totalLen;
  lineEl.style.strokeDashoffset = totalLen;
  trailEl.style.strokeDasharray = totalLen;
  trailEl.style.strokeDashoffset = totalLen;
  lineEl.animate(
    [{ strokeDashoffset: totalLen }, { strokeDashoffset: 0 }],
    { duration: 2400, delay: 200, easing: 'cubic-bezier(.65,.05,.35,1)', fill: 'forwards' }
  );
  trailEl.animate(
    [{ strokeDashoffset: totalLen }, { strokeDashoffset: 0 }],
    { duration: 2400, delay: 200, easing: 'cubic-bezier(.65,.05,.35,1)', fill: 'forwards' }
  );
  areaEl.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 1600, delay: 1400, easing: 'cubic-bezier(.65,.05,.35,1)', fill: 'forwards' }
  );

  // Continuous loop: gentle morph + dot riding the line
  const start = performance.now();
  function tick(now) {
    const elapsed = (now - start) / 1000;
    const phase = elapsed * 0.28; // slower, calmer morph
    const d = buildPath(phase);
    lineEl.setAttribute('d', d);
    trailEl.setAttribute('d', d);
    areaEl.setAttribute('d', buildArea(phase));

    // Dot rides along the line: progress 0→1 (slower)
    const dotT = (elapsed * 0.06) % 1;
    const len = lineEl.getTotalLength();
    const pt = lineEl.getPointAtLength(dotT * len);
    dotEl.setAttribute('cx', pt.x);
    dotEl.setAttribute('cy', pt.y);
    dotGlowEl.setAttribute('cx', pt.x);
    dotGlowEl.setAttribute('cy', pt.y);

    // 3 stationary highlight dots — gentler pulse
    const stops = [0.25, 0.55, 0.82];
    let html = '';
    stops.forEach((s, i) => {
      const p = lineEl.getPointAtLength(s * len);
      const pulse = 0.5 + Math.sin(elapsed * 0.8 + i * 1.5) * 0.5;
      html += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(2 + pulse * 1.2).toFixed(1)}" fill="${c2}" opacity="${(0.25 + pulse * 0.25).toFixed(2)}" filter="drop-shadow(0 0 4px ${c2})"/>`;
    });
    highlights.innerHTML = html;

    requestAnimationFrame(tick);
  }
  setTimeout(() => requestAnimationFrame(tick), 2600);
}
renderOverview3D();

/* === Model cards: per-model signature spark chart === */
function renderModelSparks() {
  const colors = window.__GRAD_COLORS || ['#7c3aed', '#3b82f6', '#06b6d4'];
  const [c1, c2, c3] = colors;
  const W = 360, H = 200;

  function buildSeries(kind) {
    const N = 60;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      let y;
      if (kind === 'arima') {
        // Smooth oscillation w/ slight trend — clean statistical
        y = H * 0.5 - t * 30 + Math.sin(t * Math.PI * 4) * 22 + (Math.sin(i * 1.7) * 4);
      } else if (kind === 'holt_winters') {
        // Strong seasonality + trend
        y = H * 0.55 - t * 20 + Math.sin(t * Math.PI * 6) * 28;
      } else if (kind === 'ets') {
        // Smooth exponential — gentle damped curve
        y = H * 0.7 - (1 - Math.exp(-t * 3)) * 70 + Math.sin(t * Math.PI * 3) * 8;
      } else {
        // Holt: linear trend with slight noise
        y = H * 0.6 - t * 80 + (Math.sin(i * 0.5) * 2);
      }
      pts.push({ x: 10 + t * (W - 20), y });
    }
    return pts;
  }

  const path = (arr) => arr.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
  const filled = (arr) => path(arr) + ` L ${(W-10).toFixed(1)} ${H} L 10 ${H} Z`;

  document.querySelectorAll('.model-spark').forEach(host => {
    const kind = host.dataset.kind;
    const pts = buildSeries(kind);
    // Split into actual + forecast
    const splitIdx = Math.floor(pts.length * 0.7);
    const actual = pts.slice(0, splitIdx + 1);
    const pred = pts.slice(splitIdx);
    const color = kind === 'arima' ? c1 : kind === 'holt_winters' ? c2 : kind === 'ets' ? c3 : c1;
    const colorB = kind === 'arima' ? c2 : kind === 'holt_winters' ? c3 : kind === 'ets' ? c1 : c3;
    const id = 'sp-' + kind;
    host.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${id}-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="${color}" stop-opacity="0.35"/>
            <stop offset="1" stop-color="${color}" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="${id}-line" x1="0" x2="1">
            <stop offset="0" stop-color="${color}"/>
            <stop offset="1" stop-color="${colorB}"/>
          </linearGradient>
        </defs>
        <path d="${filled(pts)}" fill="url(#${id}-fill)"/>
        <path d="${path(actual)}" fill="none" stroke="url(#${id}-line)" stroke-width="2.2" stroke-linecap="round" class="msp-actual" style="filter: drop-shadow(0 0 6px ${color});"/>
        <path d="${path(pred)}" fill="none" stroke="url(#${id}-line)" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3" class="msp-pred" opacity="0.85"/>
        <circle cx="${pts[pts.length-1].x.toFixed(1)}" cy="${pts[pts.length-1].y.toFixed(1)}" r="3.5" fill="${colorB}" stroke="white" stroke-width="1"/>
      </svg>
    `;
    // Animate stroke draw
    requestAnimationFrame(() => {
      host.querySelectorAll('.msp-actual, .msp-pred').forEach((p, i) => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = (p.classList.contains('msp-pred') ? '4 3, ' : '') + len;
        p.style.strokeDashoffset = len;
        p.animate(
          [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
          { duration: 1800, delay: 300 + i * 400, easing: 'cubic-bezier(.65,.05,.35,1)', fill: 'forwards' }
        );
      });
    });
  });

  // Hover → redraw
  document.querySelectorAll('.model-card').forEach(card => {
    let cooldown = false;
    card.addEventListener('mouseenter', () => {
      if (cooldown) return;
      cooldown = true;
      setTimeout(() => cooldown = false, 2200);
      card.querySelectorAll('.msp-actual, .msp-pred').forEach((p, i) => {
        const len = p.getTotalLength();
        p.animate(
          [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
          { duration: 1600, delay: i * 300, easing: 'cubic-bezier(.65,.05,.35,1)', fill: 'forwards' }
        );
      });
    });
  });
}
renderModelSparks();

/* === Mouse interactions: hero stage + diagram-card tilt === */
function setupTilt(el, maxDeg = 12) {
  if (!el) return;
  const parent = el.closest('.hero-visual, .diagram-card, .reveal') || el.parentElement;
  if (!parent) return;
  parent.addEventListener('mousemove', e => {
    const r = parent.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * maxDeg}deg) rotateX(${-y * maxDeg}deg)`;
  });
  parent.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
}
setupTilt(document.getElementById('visualStage'), 16);

/* Overview: continuous auto-rotate + smooth mouse blend */
(function setupOvStage(){
  const stage = document.getElementById('ovStage');
  if (!stage) return;
  const card = stage.closest('.diagram-card');
  let mx = 0, my = 0;       // target mouse offsets (-0.5..0.5)
  let cx = 0, cy = 0;       // current eased values
  let hasMouse = false;
  if (card) {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      hasMouse = true;
    });
    card.addEventListener('mouseleave', () => { hasMouse = false; });
  }
  const start = performance.now();
  function loop(t) {
    const time = (t - start) / 1000;
    // base auto-rotate (gentle figure-8)
    const baseY = Math.sin(time * 0.45) * 8;       // -8..8 deg yaw
    const baseX = 48 + Math.sin(time * 0.32) * 4;  // 44..52 deg pitch (kept tilted as designed)
    const baseZ = -12 + Math.cos(time * 0.4) * 3;  // -15..-9 deg roll
    // Mouse contribution (smoothed)
    cx += ((hasMouse ? mx : 0) - cx) * 0.06;
    cy += ((hasMouse ? my : 0) - cy) * 0.06;
    const mY = cx * 18;     // additional yaw from mouse
    const mX = -cy * 12;    // additional pitch from mouse
    stage.style.transform =
      `rotateX(${(baseX + mX).toFixed(2)}deg) ` +
      `rotateZ(${baseZ.toFixed(2)}deg) ` +
      `rotateY(${(baseY + mY).toFixed(2)}deg)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* === Cursor-following gradient blob behind hero === */
const heroSection = document.querySelector('.hero');
if (heroSection) {
  heroSection.addEventListener('mousemove', e => {
    const r = heroSection.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
    const y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
    heroSection.style.setProperty('--mx', x + '%');
    heroSection.style.setProperty('--my', y + '%');
  });
}

// Hero visuals — 4 variants. Each function renders into the given .visual-card element.

(function(global){
  function colors() {
    const c = global.__GRAD_COLORS || ['#7c3aed', '#3b82f6', '#06b6d4'];
    return { c1: c[0], c2: c[1], c3: c[2] };
  }
  const HERO_VISUALS = {

    // 1. True-3D rotating line chart — depth planes, perspective grid, shadow line, orbit
    line(host) {
      const { c1, c2, c3 } = colors();
      const N = 60;
      const split = 42;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const trend = 480 - t * 280;  // start very low, steep descent
        const season = Math.sin(t * Math.PI * 4) * 28;
        const noise = (Math.sin(i * 1.7) + Math.cos(i * 2.3)) * 7;
        pts.push({ x: 30 + t * 540, y: trend + season + noise });
      }
      const path = (arr) => arr.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' ');
      const actual = pts.slice(0, split + 1);
      const pred = pts.slice(split);
      const upper = pred.map((p, i) => ({ x: p.x, y: p.y - 14 - i * 1.2 }));
      const lower = pred.map((p, i) => ({ x: p.x, y: p.y + 14 + i * 1.2 }));
      const bandPath = path(upper) + ' L ' + lower.slice().reverse().map(p => p.x + ' ' + p.y).join(' L ') + ' Z';

      // Perspective ground grid — trapezoid that recedes
      const groundRows = 8;
      const groundCols = 12;
      const gx0 = 80, gx1 = 520; // top (far) edge
      const gx0b = 10, gx1b = 590; // bottom (near) edge
      const gy0 = 0, gy1 = 180;
      const ground = [];
      for (let r = 0; r <= groundRows; r++) {
        const t = r / groundRows;
        const lx = gx0 + (gx0b - gx0) * t;
        const rx = gx1 + (gx1b - gx1) * t;
        const y = gy0 + (gy1 - gy0) * t;
        const opacity = 0.05 + t * 0.18;
        ground.push(`<line x1="${lx}" y1="${y}" x2="${rx}" y2="${y}" stroke="${c2}" stroke-opacity="${opacity}" stroke-width="0.6"/>`);
      }
      for (let c = 0; c <= groundCols; c++) {
        const t = c / groundCols;
        const tx = gx0 + (gx1 - gx0) * t;
        const bx = gx0b + (gx1b - gx0b) * t;
        ground.push(`<line x1="${tx}" y1="${gy0}" x2="${bx}" y2="${gy1}" stroke="${c2}" stroke-opacity="0.12" stroke-width="0.6"/>`);
      }

      // Shadow projection of the line on the ground
      const groundY = 240;
      const shadowActual = actual.map(p => ({ x: p.x, y: groundY + (p.y * 0.05) }));
      const shadowPred = pred.map(p => ({ x: p.x, y: groundY + (p.y * 0.05) }));

      // Z-stacked echoes of the line — each shifted up & faded
      const echoes = [];
      for (let k = 4; k >= 1; k--) {
        const dy = k * 6;
        const op = 0.06 + (4 - k) * 0.04;
        echoes.push(`<path d="${path(actual.map(p => ({x: p.x, y: p.y - dy})))}" fill="none" stroke="url(#tsGrad)" stroke-width="1.2" opacity="${op}" stroke-linecap="round"/>`);
        echoes.push(`<path d="${path(pred.map(p => ({x: p.x, y: p.y - dy})))}" fill="none" stroke="${c3}" stroke-width="1.2" opacity="${op}" stroke-linecap="round" stroke-dasharray="4 4"/>`);
      }

      // Vertical "rain" lines from data points to ground (depth cue)
      const rain = pts.filter((_,i)=>i%4===0).map(p => `<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${groundY + p.y * 0.05}" stroke="url(#rainGrad)" stroke-width="0.6" opacity="0.35"/>`).join('');

      host.innerHTML = `
      <svg viewBox="0 0 600 600" preserveAspectRatio="none" style="overflow:visible">
        <defs>
          <linearGradient id="tsGrad" x1="0" x2="1">
            <stop offset="0" stop-color="${c1}"/>
            <stop offset="0.5" stop-color="${c2}"/>
            <stop offset="1" stop-color="${c3}"/>
          </linearGradient>
          <linearGradient id="bandGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="${c3}" stop-opacity="0.35"/>
            <stop offset="1" stop-color="${c1}" stop-opacity="0.04"/>
          </linearGradient>
          <linearGradient id="rainGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="${c2}" stop-opacity="0.6"/>
            <stop offset="1" stop-color="${c2}" stop-opacity="0"/>
          </linearGradient>
          <filter id="glow3d" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <style>
            @keyframes orbit3d {
              0%   { transform: rotateX(58deg) rotateZ(-14deg); }
              50%  { transform: rotateX(52deg) rotateZ(-22deg); }
              100% { transform: rotateX(58deg) rotateZ(-14deg); }
            }
            @keyframes lineRise {
              0%   { transform: translateY(20px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes dotPulse3d {
              0%,100% { r: 3; opacity: 1; }
              50%     { r: 4.5; opacity: 0.7; }
            }
            .scene3d {
              transform-origin: 300px 240px;
              transform-box: fill-box;
              animation: orbit3d 14s ease-in-out infinite;
            }
            .ground-plane { animation: lineRise 1.4s 0.2s cubic-bezier(.2,.9,.2,1) backwards; }
            .line-stack   { animation: lineRise 1.6s 0.5s cubic-bezier(.2,.9,.2,1) backwards; }
            .ts-dot3d     { animation: dotPulse3d 2.6s ease-in-out infinite; }
          </style>
        </defs>

        <g class="scene3d" transform="translate(0, 100)">
          <!-- ground -->
          <g class="ground-plane" transform="translate(0, 240)">
            ${ground.join('')}
            <!-- shadow band -->
            <path d="${path(shadowActual)}" fill="none" stroke="${c2}" stroke-width="2" opacity="0.18" stroke-linecap="round" filter="blur(2px)"/>
            <path d="${path(shadowPred)}" fill="none" stroke="${c3}" stroke-width="2" opacity="0.14" stroke-linecap="round" stroke-dasharray="4 4"/>
          </g>

          <!-- depth rain -->
          <g opacity="0.9">${rain}</g>

          <!-- z-stack echoes -->
          <g class="line-stack">${echoes.join('')}</g>

          <!-- now divider plane -->
          <g>
            <line x1="${pts[split].x}" y1="0" x2="${pts[split].x}" y2="240" stroke="rgba(255,255,255,0.22)" stroke-dasharray="2 4"/>
            <line x1="${pts[split].x - 4}" y1="240" x2="${pts[split].x + 60}" y2="252" stroke="rgba(255,255,255,0.18)"/>
            <text x="${pts[split].x + 6}" y="-2" fill="#cfd2f2" font-family="JetBrains Mono" font-size="10" letter-spacing="2">NOW</text>
          </g>

          <!-- prediction band -->
          <path class="ts-band" d="${bandPath}" fill="url(#bandGrad)" stroke="none"/>

          <!-- main lines -->
          <path d="${path(actual)}" fill="none" stroke="url(#tsGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow3d)"/>
          <path d="${path(pred)}" fill="none" stroke="${c3}" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="10 7" filter="url(#glow3d)"/>

          <!-- pulse dots -->
          ${pts.filter((_,i)=>i%6===0).map((p,i) => `<circle class="ts-dot3d" cx="${p.x}" cy="${p.y}" r="5" fill="${i*6 > split ? c3 : c2}" stroke="white" stroke-width="1.5" style="animation-delay:${i*0.13}s"/>`).join('')}
        </g>
      </svg>`;
    },

    // 2. Flowing wave field — sine waves that ripple subtly with cursor
    wave(host) {
      const { c1, c2, c3 } = colors();
      const lines = 6;
      const paths = [];
      for (let i = 0; i < lines; i++) {
        const points = [];
        for (let x = 0; x <= 600; x += 20) {
          const y = 300 + Math.sin((x + i * 50) * 0.012) * (30 + i * 8) + i * 4;
          points.push(x + ' ' + y);
        }
        paths.push(`<path d="M${points.join(' L ')}" stroke="url(#waveGrad)" stroke-width="${1 + i*0.3}" fill="none" opacity="${0.85 - i*0.12}" stroke-linecap="round" style="animation: wavePulse ${3 + i*0.4}s ease-in-out infinite;animation-delay:${i*0.2}s;"/>`);
      }
      host.innerHTML = `
      <svg viewBox="0 0 600 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGrad" x1="0" x2="1">
            <stop offset="0" stop-color="${c1}"/>
            <stop offset="0.5" stop-color="${c2}"/>
            <stop offset="1" stop-color="${c3}"/>
          </linearGradient>
        </defs>
        <style>
          @keyframes wavePulse {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        </style>
        ${paths.join('')}
        <text x="40" y="80" fill="#a4a8d0" font-family="JetBrains Mono" font-size="11" letter-spacing="3">FREQ · 0.012 Hz</text>
        <text x="40" y="540" fill="#a4a8d0" font-family="JetBrains Mono" font-size="11" letter-spacing="3">PHASE LOCK</text>
      </svg>`;
    },

    // 3. Forecast band — actual data + animated cone of uncertainty
    band(host) {
      const { c1, c2, c3 } = colors();
      const N = 80;
      const split = 50;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        // Very low start (y=580) + much steeper climb (-540) — strong upward trend
        const trend = 580 - t * 540;
        const season = Math.sin(t * Math.PI * 5) * 28;
        const noise = Math.sin(i * 2.1) * 6;
        pts.push({ x: 30 + t * 540, y: trend + season + noise });
      }
      const actual = pts.slice(0, split + 1);
      const pred = pts.slice(split);
      const path = (arr) => arr.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
      const u90 = pred.map((p, i) => ({ x: p.x, y: p.y - 10 - i * 2.0 }));
      const l90 = pred.map((p, i) => ({ x: p.x, y: p.y + 10 + i * 2.0 }));
      const u50 = pred.map((p, i) => ({ x: p.x, y: p.y - 5 - i * 1.0 }));
      const l50 = pred.map((p, i) => ({ x: p.x, y: p.y + 5 + i * 1.0 }));
      const band = (u, l) => path(u) + ' L ' + l.slice().reverse().map(p => p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' L ') + ' Z';

      host.innerHTML = `
      <svg viewBox="0 0 600 600" preserveAspectRatio="none" style="overflow:visible;">
        <defs>
          <linearGradient id="tsGrad" x1="0" x2="1">
            <stop offset="0" stop-color="${c1}"/>
            <stop offset="0.5" stop-color="${c2}"/>
            <stop offset="1" stop-color="${c3}"/>
          </linearGradient>
          <linearGradient id="predGrad" x1="0" x2="1">
            <stop offset="0" stop-color="${c2}"/>
            <stop offset="1" stop-color="${c3}"/>
          </linearGradient>
          <linearGradient id="bandOuter" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="${c1}" stop-opacity="0.32"/>
            <stop offset="1" stop-color="${c3}" stop-opacity="0.06"/>
          </linearGradient>
          <linearGradient id="bandInner" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="${c2}" stop-opacity="0.6"/>
            <stop offset="1" stop-color="${c2}" stop-opacity="0.18"/>
          </linearGradient>
        </defs>
        <g transform="translate(0, 0)">
          ${[0,1,2,3,4,5,6,7].map(i => `<line class="grid-line" x1="20" y1="${i*70 + 50}" x2="580" y2="${i*70 + 50}"/>`).join('')}
          <path class="ts-band-outer" d="${band(u90, l90)}" fill="url(#bandOuter)"/>
          <path class="ts-band-inner" d="${band(u50, l50)}" fill="url(#bandInner)"/>
          <line x1="${pts[split].x}" y1="50" x2="${pts[split].x}" y2="560" stroke="rgba(255,255,255,0.22)" stroke-dasharray="3 5" stroke-width="1"/>
          <text x="${pts[split].x + 10}" y="70" fill="#a4a8d0" font-family="JetBrains Mono" font-size="11" letter-spacing="2.5">FORECAST →</text>
          <path class="ts-line" d="${path(actual)}" fill="none" stroke="url(#tsGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 12px ${c1});"/>
          <path class="ts-pred" d="${path(pred)}" fill="none" stroke="url(#predGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 4" style="filter: drop-shadow(0 0 12px ${c3});"/>
          <text x="${pred[pred.length-1].x - 56}" y="${u90[u90.length-1].y - 6}" fill="#a4a8d0" font-family="JetBrains Mono" font-size="10" letter-spacing="2">CI 90</text>
          <text x="${pred[pred.length-1].x - 56}" y="${u50[u50.length-1].y - 6}" fill="#a4a8d0" font-family="JetBrains Mono" font-size="10" letter-spacing="2">CI 50</text>
          <circle cx="${actual[actual.length-1].x}" cy="${actual[actual.length-1].y}" r="6" fill="${c2}" stroke="white" stroke-width="2"/>
        </g>
      </svg>`;
    },

    // 4. Particle field — points scattered, drift toward cursor
    particle(host) {
      const { c1, c2, c3 } = colors();
      const N = 90;
      const dots = [];
      for (let i = 0; i < N; i++) {
        const x = Math.random() * 580 + 10;
        const y = Math.random() * 580 + 10;
        const r = Math.random() * 2 + 0.6;
        const o = Math.random() * 0.8 + 0.2;
        const d = Math.random() * 2;
        dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#partGrad)" opacity="${o}" style="animation: pFloat ${4 + Math.random()*3}s ease-in-out ${d}s infinite;"/>`);
      }
      // connecting lines for "constellation"
      const lines = [];
      for (let i = 0; i < 14; i++) {
        const x1 = Math.random() * 580 + 10, y1 = Math.random() * 580 + 10;
        const x2 = x1 + (Math.random()-0.5) * 200, y2 = y1 + (Math.random()-0.5) * 200;
        lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#partGrad)" stroke-width="0.5" opacity="${0.15 + Math.random()*0.2}"/>`);
      }
      host.innerHTML = `
      <svg viewBox="0 0 600 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="partGrad">
            <stop offset="0" stop-color="${c1}"/>
            <stop offset="0.5" stop-color="${c2}"/>
            <stop offset="1" stop-color="${c3}"/>
          </linearGradient>
          <radialGradient id="partGlow">
            <stop offset="0" stop-color="${c2}" stop-opacity="0.4"/>
            <stop offset="1" stop-color="${c2}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <style>
          @keyframes pFloat {
            0%,100% { transform: translate(0,0); }
            50% { transform: translate(8px, -12px); }
          }
        </style>
        <circle cx="300" cy="300" r="240" fill="url(#partGlow)"/>
        ${lines.join('')}
        ${dots.join('')}
        <text x="40" y="50" fill="#a4a8d0" font-family="JetBrains Mono" font-size="10" letter-spacing="3">N · ${N} OBS</text>
        <text x="40" y="568" fill="#a4a8d0" font-family="JetBrains Mono" font-size="10" letter-spacing="3">∂t · 1.0s</text>
      </svg>`;
    }
  };

  global.HERO_VISUALS = HERO_VISUALS;
})(window);

(() => {
  'use strict';

  const MINUS = '−';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function fmt(value, digits = 2) {
    if (!Number.isFinite(value)) return '—';
    const p = 10 ** digits;
    const rounded = Math.round(value * p) / p;
    return String(rounded).replace(/-/g, MINUS);
  }

  function paren(value) {
    return value < 0 ? `(${fmt(value)})` : fmt(value);
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function polyText(a, b, c) {
    a = round2(a);
    b = round2(b);
    c = round2(c);
    let text;
    if (Math.abs(a) < 1e-9) {
      text = '0';
    } else if (Math.abs(a - 1) < 1e-9) {
      text = 'x²';
    } else if (Math.abs(a + 1) < 1e-9) {
      text = `${MINUS}x²`;
    } else {
      text = `${fmt(a)}x²`;
    }

    if (Math.abs(b) > 1e-9) {
      const coeff = Math.abs(Math.abs(b) - 1) < 1e-9 ? '' : fmt(Math.abs(b));
      text += `${b > 0 ? ' + ' : ' − '}${coeff}x`;
    }

    if (Math.abs(c) > 1e-9) {
      text += `${c > 0 ? ' + ' : ' − '}${fmt(Math.abs(c))}`;
    }

    return text;
  }

  function factorTerm(root) {
    if (Math.abs(root) < 1e-9) return 'x';
    return root > 0 ? `(x − ${fmt(root)})` : `(x + ${fmt(-root)})`;
  }

  function squareText(a) {
    return `y = ${polyText(a, 0, 0)}`;
  }

  function vertexText(a, h, k) {
    a = round2(a);
    h = round2(h);
    k = round2(k);
    let inner = 'x';
    if (Math.abs(h) > 1e-9) {
      inner = h > 0 ? `x − ${fmt(h)}` : `x + ${fmt(-h)}`;
    }

    let coefficient;
    if (Math.abs(a - 1) < 1e-9) coefficient = '';
    else if (Math.abs(a + 1) < 1e-9) coefficient = MINUS;
    else coefficient = fmt(a);

    const power = Math.abs(h) < 1e-9 ? 'x²' : `(${inner})²`;
    let text = `y = ${coefficient}${power}`;
    if (Math.abs(k) > 1e-9) {
      text += `${k > 0 ? ' + ' : ' − '}${fmt(Math.abs(k))}`;
    }
    return text;
  }

  function clamp(v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
  }

  function createAnimator() {
    let token = 0;
    return {
      cancel() {
        token += 1;
      },
      value(from, to, duration, onUpdate, onDone) {
        const my = ++token;
        const start = performance.now();
        const ease = t => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
        function frame(now) {
          if (my !== token) return;
          const t = Math.min(1, (now - start) / duration);
          onUpdate(from + (to - from) * ease(t));
          if (t < 1) requestAnimationFrame(frame);
          else if (onDone) onDone();
        }
        requestAnimationFrame(frame);
      }
    };
  }

  function mountCanvas(canvas, draw) {
    let ctx = null;
    let cssW = 0;
    let cssH = 0;
    let dpr = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      const d = Math.min(window.devicePixelRatio || 1, 2);
      if (w < 10 || h < 10) return;

      if (w !== cssW || h !== cssH || d !== dpr) {
        cssW = w;
        cssH = h;
        dpr = d;
        canvas.width = Math.round(w * d);
        canvas.height = Math.round(h * d);
        ctx = canvas.getContext('2d');
        ctx.setTransform(d, 0, 0, d, 0, 0);
      }

      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h);
    };

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(render);
      ro.observe(canvas.parentElement);
    } else {
      window.addEventListener('resize', render);
    }

    render();
    return render;
  }

  function makePlot(w, h, { xmin, xmax, ymin, ymax, pad = 34, ox = 0, oy = 0 }) {
    const X = x => ox + pad + ((x - xmin) / (xmax - xmin)) * (w - 2 * pad);
    const Y = y => oy + h - pad - ((y - ymin) / (ymax - ymin)) * (h - 2 * pad);
    return { w, h, ox, oy, pad, xmin, xmax, ymin, ymax, X, Y };
  }

  function niceStep(range, target = 8) {
    if (!Number.isFinite(range) || range <= 0) return 1;
    const raw = range / target;
    const pow = 10 ** Math.floor(Math.log10(raw));
    const n = raw / pow;
    let m;
    if (n <= 1) m = 1;
    else if (n <= 2) m = 2;
    else if (n <= 2.5) m = 2.5;
    else if (n <= 5) m = 5;
    else m = 10;
    return m * pow;
  }

  function plotClip(ctx, P) {
    ctx.beginPath();
    ctx.rect(P.ox + P.pad, P.oy + P.pad, P.w - 2 * P.pad, P.h - 2 * P.pad);
    ctx.clip();
  }

  function drawGridAxes(ctx, P, options = {}) {
    const xs = options.xstep || niceStep(P.xmax - P.xmin, 8);
    const ys = options.ystep || niceStep(P.ymax - P.ymin, 6);

    ctx.save();
    plotClip(ctx, P);
    ctx.strokeStyle = '#e9eef7';
    ctx.lineWidth = 1;

    for (let x = Math.ceil(P.xmin / xs) * xs; x <= P.xmax + 1e-9; x += xs) {
      const px = P.X(x);
      ctx.beginPath();
      ctx.moveTo(px, P.oy + P.pad);
      ctx.lineTo(px, P.oy + P.h - P.pad);
      ctx.stroke();
    }

    for (let y = Math.ceil(P.ymin / ys) * ys; y <= P.ymax + 1e-9; y += ys) {
      const py = P.Y(y);
      ctx.beginPath();
      ctx.moveTo(P.ox + P.pad, py);
      ctx.lineTo(P.ox + P.w - P.pad, py);
      ctx.stroke();
    }

    const xAxisY = P.Y(clamp(0, P.ymin, P.ymax));
    const yAxisX = P.X(clamp(0, P.xmin, P.xmax));

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(P.ox + P.pad, xAxisY);
    ctx.lineTo(P.ox + P.w - P.pad, xAxisY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(yAxisX, P.oy + P.pad);
    ctx.lineTo(yAxisX, P.oy + P.h - P.pad);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#7b8aa0';
    ctx.font = '11px ui-sans-serif, system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';

    const labelY = xAxisY > P.oy + P.h - P.pad - 18 ? xAxisY - 8 : xAxisY + 16;
    ctx.textAlign = 'center';
    for (let x = Math.ceil(P.xmin / xs) * xs; x <= P.xmax + 1e-9; x += xs) {
      if (Math.abs(x) < 1e-9) continue;
      const px = P.X(x);
      if (px < P.ox + P.pad - 4 || px > P.ox + P.w - P.pad + 4) continue;
      ctx.fillText(fmt(x, 2), px, labelY);
    }

    const labelX = yAxisX < P.ox + P.pad + 30 ? yAxisX + 8 : yAxisX - 8;
    ctx.textAlign = labelX > yAxisX ? 'left' : 'right';
    for (let y = Math.ceil(P.ymin / ys) * ys; y <= P.ymax + 1e-9; y += ys) {
      if (Math.abs(y) < 1e-9) continue;
      const py = P.Y(y);
      if (py < P.oy + P.pad - 4 || py > P.oy + P.h - P.pad + 4) continue;
      ctx.fillText(fmt(y, 2), labelX, py);
    }

    ctx.textAlign = 'right';
    ctx.fillText('O', yAxisX - 6, xAxisY + 14);
  }

  function drawParabola(ctx, P, a, b, c, options = {}) {
    const color = options.color || '#2563eb';
    const width = options.width || 2.6;
    const dash = options.dash || [];

    ctx.save();
    plotClip(ctx, P);
    ctx.beginPath();
    const N = 320;
    for (let i = 0; i <= N; i += 1) {
      const x = P.xmin + ((P.xmax - P.xmin) * i) / N;
      const y = a * x * x + b * x + c;
      const px = P.X(x);
      const py = P.Y(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  function dashedLine(ctx, P, x1, y1, x2, y2, color = '#94a3b8', dash = [5, 5], width = 1.4) {
    ctx.save();
    ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(P.X(x1), P.Y(y1));
    ctx.lineTo(P.X(x2), P.Y(y2));
    ctx.stroke();
    ctx.restore();
  }

  function drawDot(ctx, P, x, y, color = '#ef4444', r = 5, label = '', below = false) {
    if (x < P.xmin || x > P.xmax || y < P.ymin || y > P.ymax) return;
    const px = P.X(x);
    const py = P.Y(y);

    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    if (label) {
      ctx.font = '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
      const textWidth = ctx.measureText(label).width;
      const boxX = below ? px + 12 : px + 5;
      const boxY = below ? py + 14 : py - 27;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(boxX, boxY, textWidth + 9, 19);
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, boxX + 4, boxY + 10);
    }
    ctx.restore();
  }

  function drawText(ctx, text, x, y, options = {}) {
    ctx.save();
    ctx.font = options.font || '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = options.color || '#334155';
    ctx.textAlign = options.align || 'left';
    ctx.textBaseline = options.baseline || 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function saveLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      return false;
    }
    return true;
  }

  function loadLocal(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  const goals = [
    '能判断一个方程是不是一元二次方程，并说出 a、b、c',
    '会用直接开平方法解 x² = p',
    '理解配方法“一次项系数一半的平方”',
    '会用公式法，先算判别式 Δ',
    '会用因式分解法，把方程变成两个括号相乘',
    '知道二次函数的图像是抛物线',
    '理解 a 对开口方向和胖瘦的影响',
    '会把 y = ax² 平移成 y = a(x − h)² + k',
    '会把一般式化成顶点式，并说出顶点',
    '会用顶点求二次函数的最大值或最小值'
  ];

  const goalKey = 'math9a-goals-v1';
  let doneGoals = loadLocal(goalKey, []);
  if (!Array.isArray(doneGoals)) doneGoals = [];

  const goalList = $('#goalList');
  const goalBar = $('#goalBar');
  const goalCount = $('#goalCount');

  function renderGoals() {
    goalList.innerHTML = goals
      .map((goal, i) => {
        const checked = doneGoals.includes(i);
        return `<label class="goal ${checked ? 'done' : ''}">
          <input type="checkbox" data-goal="${i}" ${checked ? 'checked' : ''}>
          <span>${goal}</span>
        </label>`;
      })
      .join('');

    const count = doneGoals.length;
    goalBar.style.width = `${(count / goals.length) * 100}%`;
    goalCount.textContent = `${count} / ${goals.length}`;
  }

  goalList.addEventListener('change', event => {
    const input = event.target.closest('input[data-goal]');
    if (!input) return;
    const index = Number(input.dataset.goal);
    if (input.checked) {
      if (!doneGoals.includes(index)) doneGoals.push(index);
    } else {
      doneGoals = doneGoals.filter(i => i !== index);
    }
    saveLocal(goalKey, doneGoals);
    renderGoals();
  });

  renderGoals();

  const navLinks = $$('.nav a');
  const navSections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function updateActiveNav() {
    if (!navSections.length) return;
    const line = window.innerHeight * 0.3;
    let current = navSections[0];
    navSections.forEach(section => {
      if (section.getBoundingClientRect().top <= line) current = section;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  window.addEventListener('resize', updateActiveNav);
  updateActiveNav();

  const csSteps = [
    {
      title: '先把常数项移到右边',
      text: '原方程 x² + 6x − 7 = 0，移项得 x² + 6x = 7。左边先看成一个正方形 x²，再加上两条长方形。',
      show: ['square']
    },
    {
      title: 'x² 是一个正方形',
      text: '边长是 x 的正方形，面积是 x²。先把它画出来。',
      show: ['square']
    },
    {
      title: '右边补一个 3x',
      text: '一次项是 6x，把它拆成 3x + 3x。先补一个 3×x 的长方形。',
      show: ['square', 'right']
    },
    {
      title: '下面再补一个 3x',
      text: '再补一个 x×3 的长方形。现在总面积是 x² + 6x。',
      show: ['square', 'right', 'bottom']
    },
    {
      title: '还缺一个角',
      text: '右下角空着，它是一个 3×3 的正方形，面积是 9。',
      show: ['square', 'right', 'bottom', 'ghost']
    },
    {
      title: '两边同时加 9',
      text: '在等式左边补上 9，右边也要加 9：x² + 6x + 9 = 7 + 9 = 16。',
      show: ['square', 'right', 'bottom', 'corner']
    },
    {
      title: '拼成大正方形',
      text: '现在左边正好是边长 x+3 的大正方形，所以 (x+3)² = 16。',
      show: ['square', 'right', 'bottom', 'corner', 'outline']
    },
    {
      title: '开平方，得到两个根',
      text: 'x + 3 = ±4，所以 x₁ = 1，x₂ = −7。几何长度只取正根，代数上不要漏掉负根。',
      show: ['square', 'right', 'bottom', 'corner', 'outline']
    }
  ];

  let csStep = 0;
  let csTimer = null;
  const csEls = {
    square: $('#csSquare'),
    right: $('#csRight'),
    bottom: $('#csBottom'),
    ghost: $('#csGhost'),
    corner: $('#csCorner'),
    outline: $('#csOutline')
  };
  const csDots = $('#csDots');
  const csPrev = $('#csPrev');
  const csNext = $('#csNext');
  const csAuto = $('#csAuto');

  csSteps.forEach((step, index) => {
    const dot = document.createElement('button');
    dot.className = 'step-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `第 ${index + 1} 步`);
    dot.addEventListener('click', () => {
      stopCsAuto();
      setCsStep(index);
    });
    csDots.appendChild(dot);
  });

  function stopCsAuto() {
    if (csTimer) {
      clearInterval(csTimer);
      csTimer = null;
    }
    csAuto.textContent = '自动播放';
  }

  function setCsStep(index) {
    csStep = clamp(index, 0, csSteps.length - 1);
    const step = csSteps[csStep];

    Object.entries(csEls).forEach(([name, el]) => {
      el.classList.toggle('show', step.show.includes(name));
    });

    $('#csStepNum').textContent = `第 ${csStep + 1} / ${csSteps.length} 步`;
    $('#csStepTitle').textContent = step.title;
    $('#csStepText').textContent = step.text;
    csPrev.disabled = csStep === 0;
    csNext.disabled = csStep === csSteps.length - 1;

    $$('.step-dot', csDots).forEach((dot, i) => {
      dot.classList.toggle('active', i === csStep);
    });

    $$('#completing .eq-line').forEach(line => {
      const min = Number(line.dataset.minStep);
      line.classList.toggle('on', csStep >= min);
      line.classList.toggle('active', min === csStep);
    });
  }

  csPrev.addEventListener('click', () => {
    stopCsAuto();
    setCsStep(csStep - 1);
  });

  csNext.addEventListener('click', () => {
    stopCsAuto();
    setCsStep(csStep + 1);
  });

  csAuto.addEventListener('click', () => {
    if (csTimer) {
      stopCsAuto();
      return;
    }
    if (csStep >= csSteps.length - 1) setCsStep(0);
    csAuto.textContent = '暂停';
    csTimer = setInterval(() => {
      if (csStep >= csSteps.length - 1) {
        stopCsAuto();
        return;
      }
      setCsStep(csStep + 1);
    }, 2400);
  });

  setCsStep(0);

  const sqrtState = { p: 4 };
  const sqrtAnim = createAnimator();
  const sqrtP = $('#sqrtP');

  const drawSqrt = (ctx, w, h) => {
    const P = makePlot(w, h, { xmin: -4, xmax: 4, ymin: -2, ymax: 10 });
    drawGridAxes(ctx, P);
    drawParabola(ctx, P, 1, 0, 0, { color: '#2563eb' });

    const p = sqrtState.p;
    dashedLine(ctx, P, P.xmin, p, P.xmax, p, '#f59e0b', [6, 5], 2);

    if (p >= -1e-9) {
      const r = Math.sqrt(Math.max(0, p));
      dashedLine(ctx, P, -r, 0, -r, p, '#fca5a5', [3, 5]);
      dashedLine(ctx, P, r, 0, r, p, '#fca5a5', [3, 5]);
      drawDot(ctx, P, -r, p, '#ef4444', 5, 'x₁');
      if (r > 1e-9) drawDot(ctx, P, r, p, '#ef4444', 5, 'x₂');
    }

    drawText(ctx, 'y = x²', P.X(-3.6), P.Y(8.4), { color: '#2563eb' });
    drawText(ctx, 'y = p', P.X(-3.8), P.Y(p) - 11, { color: '#b45309' });
  };

  const renderSqrt = mountCanvas($('#canvasSqrt'), drawSqrt);

  function updateSqrt() {
    const p = sqrtState.p;
    $('#sqrtPOut').textContent = fmt(p, 1);
    $('#sqrtEq').textContent = `x² = ${fmt(p)}`;

    if (p > 1e-9) {
      $('#sqrtRoots').textContent = `x = ±${fmt(Math.sqrt(p))}`;
    } else if (Math.abs(p) < 1e-9) {
      $('#sqrtRoots').textContent = 'x = 0';
    } else {
      $('#sqrtRoots').textContent = '实数范围内无解';
    }

    renderSqrt();
  }

  sqrtP.addEventListener('input', () => {
    sqrtAnim.cancel();
    sqrtState.p = Number(sqrtP.value);
    updateSqrt();
  });

  $('#sqrtPlay').addEventListener('click', () => {
    sqrtAnim.cancel();
    sqrtAnim.value(9, -2, 4200, value => {
      sqrtState.p = value;
      sqrtP.value = value;
      updateSqrt();
    });
  });

  $('#sqrtReset').addEventListener('click', () => {
    sqrtAnim.cancel();
    sqrtState.p = 4;
    sqrtP.value = 4;
    updateSqrt();
  });

  updateSqrt();

  const formulaState = { a: 1, b: -4, c: 3 };
  const formulaAnim = createAnimator();
  const fa = $('#fa');
  const fb = $('#fb');
  const fc = $('#fc');

  const drawFormula = (ctx, w, h) => {
    const { a, b, c } = formulaState;
    const P = makePlot(w, h, { xmin: -6, xmax: 6, ymin: -10, ymax: 12 });
    drawGridAxes(ctx, P);
    drawParabola(ctx, P, a, b, c, { color: '#2563eb' });

    const disc = b * b - 4 * a * c;
    if (disc >= -1e-9) {
      const sq = Math.sqrt(Math.max(0, disc));
      const r1 = (-b - sq) / (2 * a);
      const r2 = (-b + sq) / (2 * a);
      dashedLine(ctx, P, r1, 0, r1, 0, '#fca5a5', [3, 5]);
      dashedLine(ctx, P, r2, 0, r2, 0, '#fca5a5', [3, 5]);
      drawDot(ctx, P, r1, 0, '#ef4444', 5, 'x₁');
      if (Math.abs(r1 - r2) > 1e-6) drawDot(ctx, P, r2, 0, '#ef4444', 5, 'x₂');
    }

    const hx = -b / (2 * a);
    const ky = c - (b * b) / (4 * a);
    dashedLine(ctx, P, hx, P.ymin, hx, P.ymax, '#c4b5fd', [4, 5]);
    drawDot(ctx, P, hx, ky, '#7c3aed', 5, '顶点', ky < 0);

    drawText(ctx, 'y = ax² + bx + c', P.X(-5.4), P.Y(10.5), { color: '#2563eb' });
  };

  const renderFormula = mountCanvas($('#canvasFormula'), drawFormula);

  function syncFormulaControls() {
    fa.value = formulaState.a;
    fb.value = formulaState.b;
    fc.value = formulaState.c;
    $('#faOut').textContent = fmt(formulaState.a, 1);
    $('#fbOut').textContent = fmt(formulaState.b, 1);
    $('#fcOut').textContent = fmt(formulaState.c, 1);
  }

  function updateFormula() {
    const { a, b, c } = formulaState;
    const disc = b * b - 4 * a * c;
    const hx = -b / (2 * a);
    const ky = c - (b * b) / (4 * a);

    $('#formulaEq').textContent = `y = ${polyText(a, b, c)}`;
    $('#formulaDisc').textContent = `Δ = ${paren(b)}² − 4 × ${paren(a)} × ${paren(c)} = ${fmt(disc)}`;
    $('#formulaVertex').textContent = `(${fmt(hx)}, ${fmt(ky)})`;

    const badge = $('#formulaBadge');
    if (disc > 1e-9) {
      badge.textContent = '两个不相等实根';
      badge.className = 'badge-pos';
      const sq = Math.sqrt(disc);
      const r1 = (-b - sq) / (2 * a);
      const r2 = (-b + sq) / (2 * a);
      $('#formulaRoots').textContent = `x₁ = ${fmt(r1)}，x₂ = ${fmt(r2)}`;
    } else if (Math.abs(disc) <= 1e-9) {
      badge.textContent = '两个相等实根';
      badge.className = 'badge-zero';
      $('#formulaRoots').textContent = `x₁ = x₂ = ${fmt(-b / (2 * a))}`;
    } else {
      badge.textContent = '没有实根';
      badge.className = 'badge-neg';
      $('#formulaRoots').textContent = '在实数范围内无解';
    }

    renderFormula();
  }

  [fa, fb, fc].forEach(input => {
    input.addEventListener('input', () => {
      formulaAnim.cancel();
      formulaState.a = Number(fa.value);
      formulaState.b = Number(fb.value);
      formulaState.c = Number(fc.value);
      syncFormulaControls();
      updateFormula();
    });
  });

  $('#formulaPlay').addEventListener('click', () => {
    formulaAnim.cancel();
    formulaState.c = 8;
    syncFormulaControls();
    updateFormula();
    formulaAnim.value(8, -6, 4400, value => {
      formulaState.c = value;
      syncFormulaControls();
      updateFormula();
    });
  });

  $$('#formula .preset').forEach(button => {
    button.addEventListener('click', () => {
      formulaAnim.cancel();
      formulaState.a = Number(button.dataset.a);
      formulaState.b = Number(button.dataset.b);
      formulaState.c = Number(button.dataset.c);
      syncFormulaControls();
      updateFormula();
    });
  });

  syncFormulaControls();
  updateFormula();

  const factorState = { p: 2, q: 3 };
  const factorAnim = createAnimator();
  const factorP = $('#factorP');
  const factorQ = $('#factorQ');

  const drawFactor = (ctx, w, h) => {
    const { p, q } = factorState;
    const b = -(p + q);
    const c = p * q;
    const hx = (p + q) / 2;
    const ky = c - (b * b) / 4;
    const ymin = Math.min(-2, ky - 2);
    const P = makePlot(w, h, { xmin: -6, xmax: 6, ymin, ymax: 7 });
    drawGridAxes(ctx, P);
    drawParabola(ctx, P, 1, b, c, { color: '#7c3aed' });

    [p, q].forEach((root, i) => {
      dashedLine(ctx, P, root, 0, root, 0, '#c4b5fd', [3, 5]);
      drawDot(ctx, P, root, 0, '#ef4444', 5, i === 0 ? 'p' : 'q');
    });

    dashedLine(ctx, P, hx, P.ymin, hx, P.ymax, '#ddd6fe', [4, 5]);
    drawDot(ctx, P, hx, ky, '#7c3aed', 4);

    drawText(ctx, 'y = x² − (p+q)x + pq', P.X(-5.4), P.Y(5.6), { color: '#7c3aed' });
  };

  const renderFactor = mountCanvas($('#canvasFactor'), drawFactor);

  function updateFactor() {
    const { p, q } = factorState;
    factorP.value = p;
    factorQ.value = q;
    $('#factorPOut').textContent = fmt(p, 1);
    $('#factorQOut').textContent = fmt(q, 1);

    const b = -(p + q);
    const c = p * q;
    $('#factorEq').textContent = `${polyText(1, b, c)} = 0`;

    if (Math.abs(p - q) < 1e-9) {
      $('#factorFactored').textContent = `${factorTerm(p)}² = 0`;
    } else {
      $('#factorFactored').textContent = `${factorTerm(p)}${factorTerm(q)} = 0`;
    }

    $('#factorSum').textContent = fmt(p + q);
    $('#factorProduct').textContent = fmt(c);
    renderFactor();
  }

  [factorP, factorQ].forEach(input => {
    input.addEventListener('input', () => {
      factorAnim.cancel();
      factorState.p = Number(factorP.value);
      factorState.q = Number(factorQ.value);
      updateFactor();
    });
  });

  $('#factorPlay').addEventListener('click', () => {
    factorAnim.cancel();
    factorState.p = 2;
    factorState.q = -4;
    updateFactor();
    factorAnim.value(-4, 4, 3600, value => {
      factorState.q = value;
      updateFactor();
    });
  });

  updateFactor();

  const rectState = { x: 3 };
  const rectAnim = createAnimator();
  const rectX = $('#rectX');

  const drawRect = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);

    const x = rectState.x;
    const leftW = Math.min(w * 0.42, 265);
    const pad = 24;
    const baseY = h - 40;
    const scale = Math.min((leftW - pad * 2) / 9, (h - 92) / 9);
    const rx = pad;
    const rw = x * scale;
    const rh = (10 - x) * scale;
    const ry = baseY - rh;

    ctx.save();
    ctx.fillStyle = 'rgba(37, 99, 235, 0.12)';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, baseY);
    ctx.lineTo(leftW - 8, baseY);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#1e3a8a';
    ctx.font = '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`x = ${fmt(x, 1)}`, rx + rw / 2, baseY + 8);

    ctx.save();
    ctx.translate(rx - 9, ry + rh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#475569';
    ctx.font = '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(`10 − x = ${fmt(10 - x, 1)}`, 0, 0);
    ctx.restore();

    if (rw > 46 && rh > 26) {
      ctx.fillStyle = '#1d4ed8';
      ctx.font = '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`A = ${fmt(x * (10 - x), 1)}`, rx + rw / 2, ry + rh / 2);
    }

    ctx.fillStyle = '#475569';
    ctx.font = '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('周长 = 20 m，长 + 宽 = 10 m', pad, 14);

    const plotW = w - leftW - 24;
    const P = makePlot(plotW, h, {
      xmin: 1,
      xmax: 9,
      ymin: 0,
      ymax: 26,
      pad: 30,
      ox: leftW + 14
    });
    drawGridAxes(ctx, P, { xstep: 1, ystep: 5 });
    drawParabola(ctx, P, -1, 10, 0, { color: '#7c3aed' });

    dashedLine(ctx, P, 1, 21, 9, 21, '#10b981', [5, 5], 1.6);
    drawDot(ctx, P, 3, 21, '#10b981', 4, '');
    drawDot(ctx, P, 7, 21, '#10b981', 4, '');

    dashedLine(ctx, P, x, 0, x, x * (10 - x), '#94a3b8', [3, 5]);
    drawDot(ctx, P, x, x * (10 - x), '#ef4444', 5, '当前');

    drawText(ctx, 'A = x(10 − x)', P.X(6.2), P.Y(24.6), { color: '#7c3aed' });
  };

  const renderRect = mountCanvas($('#canvasRect'), drawRect);

  function updateRect() {
    const x = rectState.x;
    rectX.value = x;
    $('#rectXOut').textContent = fmt(x, 1);
    const area = x * (10 - x);
    $('#rectArea').textContent = fmt(area, 1);
    $('#rectOther').textContent = fmt(10 - x, 1);

    const hit = $('#rectHit');
    if (Math.abs(area - 21) < 0.06) {
      hit.classList.add('show');
      hit.textContent = `命中：x = ${fmt(x, 1)}，面积 = 21`;
    } else {
      hit.classList.remove('show');
    }

    renderRect();
  }

  rectX.addEventListener('input', () => {
    rectAnim.cancel();
    rectState.x = Number(rectX.value);
    updateRect();
  });

  $('#rectPlay').addEventListener('click', () => {
    rectAnim.cancel();
    rectAnim.value(1, 9, 4600, value => {
      rectState.x = value;
      updateRect();
    });
  });

  $('#rectReset').addEventListener('click', () => {
    rectAnim.cancel();
    rectState.x = 3;
    updateRect();
  });

  updateRect();

  const projectileState = { t: 0, playing: false };
  let projectileRaf = 0;
  let projectileLast = 0;
  const projectilePlay = $('#projectilePlay');

  const drawProjectile = (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#eef6ff');
    sky.addColorStop(0.65, '#f8fbff');
    sky.addColorStop(1, '#ffffff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const P = makePlot(w, h, { xmin: -0.4, xmax: 4.4, ymin: -0.6, ymax: 4.8 });
    drawGridAxes(ctx, P);

    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(P.X(0), P.Y(0));
    ctx.lineTo(P.X(4.4), P.Y(0));
    ctx.stroke();
    ctx.restore();

    drawParabola(ctx, P, -1, 4, 0, { color: 'rgba(37, 99, 235, 0.28)', width: 2, dash: [5, 6] });

    const t = projectileState.t;
    const xNow = 4 * t;

    ctx.save();
    plotClip(ctx, P);
    ctx.beginPath();
    const N = 90;
    for (let i = 0; i <= N; i += 1) {
      const x = (xNow * i) / N;
      const y = -x * x + 4 * x;
      if (i === 0) ctx.moveTo(P.X(x), P.Y(y));
      else ctx.lineTo(P.X(x), P.Y(y));
    }
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    const x = xNow;
    const y = -x * x + 4 * x;
    const px = P.X(x);
    const py = P.Y(y);

    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, 13, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();

    drawDot(ctx, P, 2, 4, '#f59e0b', 4, '最高点 (2, 4)');
    drawText(ctx, 'y = −x² + 4x', P.X(-0.2), P.Y(4.5), { color: '#2563eb' });
  };

  const renderProjectile = mountCanvas($('#canvasProjectile'), drawProjectile);

  function updateProjectileButton() {
    if (projectileState.playing) projectilePlay.textContent = '暂停';
    else if (projectileState.t >= 1) projectilePlay.textContent = '再次发射';
    else if (projectileState.t > 0) projectilePlay.textContent = '继续';
    else projectilePlay.textContent = '发射';
  }

  function projectileTick(now) {
    if (!projectileState.playing) return;
    if (!projectileLast) projectileLast = now;
    const dt = Math.min(60, now - projectileLast);
    projectileLast = now;
    projectileState.t += dt / 2800;

    if (projectileState.t >= 1) {
      projectileState.t = 1;
      projectileState.playing = false;
      updateProjectileButton();
    }

    renderProjectile();

    if (projectileState.playing) projectileRaf = requestAnimationFrame(projectileTick);
  }

  projectilePlay.addEventListener('click', () => {
    if (projectileState.playing) {
      projectileState.playing = false;
      cancelAnimationFrame(projectileRaf);
      updateProjectileButton();
      return;
    }
    if (projectileState.t >= 1) projectileState.t = 0;
    projectileState.playing = true;
    projectileLast = 0;
    updateProjectileButton();
    projectileRaf = requestAnimationFrame(projectileTick);
  });

  $('#projectileReset').addEventListener('click', () => {
    projectileState.playing = false;
    projectileState.t = 0;
    projectileLast = 0;
    cancelAnimationFrame(projectileRaf);
    updateProjectileButton();
    renderProjectile();
  });

  updateProjectileButton();

  const basicState = { a: 1 };
  const basicAnim = createAnimator();
  const basicA = $('#basicA');

  const drawBasic = (ctx, w, h) => {
    const P = makePlot(w, h, { xmin: -4, xmax: 4, ymin: -9, ymax: 9 });
    drawGridAxes(ctx, P);

    [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2].forEach(a => {
      const color = a > 0 ? 'rgba(37, 99, 235, 0.10)' : 'rgba(249, 115, 22, 0.10)';
      drawParabola(ctx, P, a, 0, 0, { color, width: 1.6 });
    });

    const a = basicState.a;
    const color = Math.abs(a) < 1e-9 ? '#94a3b8' : a > 0 ? '#2563eb' : '#ea580c';
    drawParabola(ctx, P, a, 0, 0, { color, width: 3 });
    dashedLine(ctx, P, 0, P.ymin, 0, P.ymax, '#94a3b8', [4, 5], 1.2);

    if (Math.abs(a) > 1e-9) {
      drawDot(ctx, P, 0, 0, '#7c3aed', 5, '顶点 (0, 0)');
    }

    drawText(ctx, squareText(a), P.X(-3.6), P.Y(8.1), { color });
  };

  const renderBasic = mountCanvas($('#canvasBasic'), drawBasic);

  function updateBasic() {
    const a = basicState.a;
    basicA.value = a;
    $('#basicAOut').textContent = fmt(a, 1);
    $('#basicARead').textContent = fmt(a, 1);
    $('#basicEq').textContent = Math.abs(a) < 1e-9 ? 'y = 0（不是二次函数）' : squareText(a);

    const dir = $('#basicDir');
    if (Math.abs(a) < 1e-9) {
      dir.textContent = '退化为直线';
      dir.className = '';
    } else if (a > 0) {
      dir.textContent = '向上';
      dir.className = 'badge-pos';
    } else {
      dir.textContent = '向下';
      dir.className = 'badge-neg';
    }

    renderBasic();
  }

  basicA.addEventListener('input', () => {
    basicAnim.cancel();
    basicState.a = Number(basicA.value);
    updateBasic();
  });

  $('#basicPlay').addEventListener('click', () => {
    basicAnim.cancel();
    basicState.a = -2;
    updateBasic();
    basicAnim.value(-2, 2, 4200, value => {
      basicState.a = value;
      updateBasic();
    });
  });

  updateBasic();

  const shiftState = { a: 1, h: 0, k: 0 };
  const shiftAnim = createAnimator();
  const shiftA = $('#shiftA');
  const shiftH = $('#shiftH');
  const shiftK = $('#shiftK');

  const drawShift = (ctx, w, h) => {
    const { a, h: hv, k } = shiftState;
    const P = makePlot(w, h, { xmin: -7, xmax: 7, ymin: -6, ymax: 12 });
    drawGridAxes(ctx, P);

    drawParabola(ctx, P, a, 0, 0, { color: 'rgba(37, 99, 235, 0.38)', width: 2, dash: [6, 6] });

    const color = Math.abs(a) < 1e-9 ? '#94a3b8' : a > 0 ? '#7c3aed' : '#ea580c';
    drawParabola(ctx, P, a, -2 * a * hv, a * hv * hv + k, { color, width: 3 });
    dashedLine(ctx, P, hv, P.ymin, hv, P.ymax, '#c4b5fd', [4, 5], 1.2);

    if (Math.abs(a) > 1e-9) {
      drawDot(ctx, P, hv, k, '#ef4444', 5, `(${fmt(hv, 1)}, ${fmt(k, 1)})`, k < 0);
    }

    drawText(ctx, '基准：y = ax²', P.X(-6.4), P.Y(10.8), { color: '#64748b' });
    drawText(ctx, '平移后', P.X(2.4), P.Y(10.8), { color });
  };

  const renderShift = mountCanvas($('#canvasShift'), drawShift);

  function syncShift() {
    shiftA.value = shiftState.a;
    shiftH.value = shiftState.h;
    shiftK.value = shiftState.k;
    $('#shiftAOut').textContent = fmt(shiftState.a, 1);
    $('#shiftHOut').textContent = fmt(shiftState.h, 1);
    $('#shiftKOut').textContent = fmt(shiftState.k, 1);
  }

  function updateShift() {
    const { a, h, k } = shiftState;
    if (Math.abs(a) < 1e-9) {
      $('#shiftEq').textContent = `y = ${fmt(k)}（水平直线，不是二次函数）`;
    } else {
      $('#shiftEq').textContent = vertexText(a, h, k);
    }
    $('#shiftVertex').textContent = `(${fmt(h)}, ${fmt(k)})`;
    $('#shiftAxis').textContent = `x = ${fmt(h)}`;
    renderShift();
  }

  function setShiftState(patch) {
    Object.assign(shiftState, patch);
    syncShift();
    updateShift();
  }

  [shiftA, shiftH, shiftK].forEach(input => {
    input.addEventListener('input', () => {
      shiftAnim.cancel();
      setShiftState({
        a: Number(shiftA.value),
        h: Number(shiftH.value),
        k: Number(shiftK.value)
      });
      $('#shiftStatus').textContent = '自由探索：拖动 a、h、k，观察图像怎么动。';
    });
  });

  function resetShift(statusText) {
    shiftAnim.cancel();
    setShiftState({ a: 1, h: 0, k: 0 });
    $('#shiftStatus').textContent = statusText || '当前是基准抛物线 y = x²。';
  }

  $('#shiftKPlay').addEventListener('click', () => {
    shiftAnim.cancel();
    setShiftState({ a: 1, h: 0, k: 0 });
    $('#shiftStatus').textContent = '先回到 y = x²，再让 k 从 0 变到 2。';
    shiftAnim.value(0, 2, 1400, value => {
      setShiftState({ k: value });
    }, () => {
      $('#shiftStatus').textContent = 'k = 2：图像整体向上平移 2 个单位，顶点从 (0,0) 到 (0,2)。';
    });
  });

  $('#shiftHPlay').addEventListener('click', () => {
    shiftAnim.cancel();
    setShiftState({ a: 1, h: 0, k: 0 });
    $('#shiftStatus').textContent = '先回到 y = x²，再让 h 从 0 变到 2。';
    shiftAnim.value(0, 2, 1400, value => {
      setShiftState({ h: value });
    }, () => {
      $('#shiftStatus').textContent = 'h = 2：图像整体向右平移 2 个单位，顶点从 (0,0) 到 (2,0)。括号里写成 (x − 2)²。';
    });
  });

  $('#shiftBoth').addEventListener('click', () => {
    shiftAnim.cancel();
    setShiftState({ a: 1, h: 0, k: 0 });
    $('#shiftStatus').textContent = '先向上平移，再向右平移。';
    shiftAnim.value(0, 2, 1200, value => {
      setShiftState({ k: value });
    }, () => {
      $('#shiftStatus').textContent = 'k = 2 后，再让 h 从 0 变到 2。';
      shiftAnim.value(0, 2, 1200, value => {
        setShiftState({ h: value });
      }, () => {
        $('#shiftStatus').textContent = '合起来：顶点 (2,2)，解析式 y = (x − 2)² + 2。';
      });
    });
  });

  $('#shiftReset').addEventListener('click', () => resetShift());

  syncShift();
  updateShift();

  const vertexPresets = [
    {
      a: 1,
      h: 2,
      k: -1,
      view: { xmin: -1, xmax: 5, ymin: -3, ymax: 6 },
      steps: [
        { eq: 'y = x² − 4x + 3', note: '这是一般式。先只看前两项，准备配方。' },
        { eq: 'y = (x² − 4x) + 3', note: '把二次项和一次项括起来。' },
        { eq: 'y = (x² − 4x + <span class="hl">4</span>) − 4 + 3', note: '一次项系数 −4 的一半是 −2，平方是 4。加 4 再减 4，值不变。' },
        { eq: 'y = <span class="hl2">(x − 2)²</span> − 1', note: '前三项写成完全平方，整理常数，得到顶点式。' }
      ]
    },
    {
      a: 2,
      h: 2,
      k: -3,
      view: { xmin: -1, xmax: 5, ymin: -5, ymax: 7 },
      steps: [
        { eq: 'y = 2x² − 8x + 5', note: '二次项系数是 2，先把 2 提出来。' },
        { eq: 'y = 2(x² − 4x) + 5', note: '括号内一次项系数是 −4。' },
        { eq: 'y = 2(x² − 4x + <span class="hl">4</span> − 4) + 5', note: '−4 的一半是 −2，平方是 4。括号内加 4 减 4。' },
        { eq: 'y = 2(x − 2)² − 8 + 5', note: '把 −4 乘上外面的 2，得到 −8。' },
        { eq: 'y = <span class="hl2">2(x − 2)² − 3</span>', note: '整理常数，得到顶点式。' }
      ]
    },
    {
      a: -1,
      h: 1,
      k: 4,
      view: { xmin: -2, xmax: 4, ymin: -2, ymax: 7 },
      steps: [
        { eq: 'y = −x² + 2x + 3', note: '二次项系数是 −1，先把负号提出来。' },
        { eq: 'y = −(x² − 2x) + 3', note: '提出负号后，括号内一次项变成 −2x。' },
        { eq: 'y = −(x² − 2x + <span class="hl">1</span> − 1) + 3', note: '−2 的一半是 −1，平方是 1。括号内加 1 减 1。' },
        { eq: 'y = −(x − 1)² + 1 + 3', note: '注意：−(−1) = +1。' },
        { eq: 'y = <span class="hl2">−(x − 1)² + 4</span>', note: '整理常数，得到顶点式。开口向下。' }
      ]
    }
  ];

  const vertexState = { preset: 0, step: 0 };
  let vertexTimer = null;
  const vertexStepsEl = $('#vertexSteps');
  const vertexAuto = $('#vertexAuto');

  const drawVertex = (ctx, w, h) => {
    const preset = vertexPresets[vertexState.preset];
    const { a, h: hv, k } = preset;
    const P = makePlot(w, h, preset.view);
    drawGridAxes(ctx, P);

    const b = -2 * a * hv;
    const c = a * hv * hv + k;
    drawParabola(ctx, P, a, b, c, { color: a > 0 ? '#2563eb' : '#ea580c', width: 3 });
    dashedLine(ctx, P, hv, P.ymin, hv, P.ymax, '#c4b5fd', [4, 5], 1.2);
    drawDot(ctx, P, hv, k, '#7c3aed', 6, `顶点 (${fmt(hv)}, ${fmt(k)})`, k < 0);

    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      const r1 = (-b - sq) / (2 * a);
      const r2 = (-b + sq) / (2 * a);
      drawDot(ctx, P, r1, 0, '#ef4444', 4, '');
      if (Math.abs(r1 - r2) > 1e-6) drawDot(ctx, P, r2, 0, '#ef4444', 4, '');
    }
  };

  const renderVertex = mountCanvas($('#canvasVertex'), drawVertex);

  function renderVertexSteps() {
    const preset = vertexPresets[vertexState.preset];
    vertexStepsEl.innerHTML = preset.steps
      .map((step, index) => {
        const cls = index === vertexState.step ? 'active' : index < vertexState.step ? 'done' : '';
        return `<div class="v-step ${cls}">
          <span class="v-num">${index + 1}</span>
          <div>
            <div class="v-eq">${step.eq}</div>
            <div class="v-note">${step.note}</div>
          </div>
        </div>`;
      })
      .join('');
  }

  function updateVertex() {
    const preset = vertexPresets[vertexState.preset];
    $('#vertexEq').textContent = vertexText(preset.a, preset.h, preset.k);
    $('#vertexPoint').textContent = `(${fmt(preset.h)}, ${fmt(preset.k)})`;
    $('#vertexAxis').textContent = `x = ${fmt(preset.h)}`;
    $('#vertexPrev').disabled = vertexState.step === 0;
    $('#vertexNext').disabled = vertexState.step === preset.steps.length - 1;
    renderVertexSteps();
    renderVertex();
  }

  function stopVertexAuto() {
    if (vertexTimer) {
      clearTimeout(vertexTimer);
      vertexTimer = null;
    }
    vertexAuto.textContent = '自动播放';
  }

  function vertexAutoStep() {
    const preset = vertexPresets[vertexState.preset];
    if (vertexState.step >= preset.steps.length - 1) {
      stopVertexAuto();
      return;
    }
    vertexState.step += 1;
    updateVertex();
    vertexTimer = setTimeout(vertexAutoStep, 1700);
  }

  vertexAuto.addEventListener('click', () => {
    if (vertexTimer) {
      stopVertexAuto();
      return;
    }
    const preset = vertexPresets[vertexState.preset];
    if (vertexState.step >= preset.steps.length - 1) vertexState.step = 0;
    updateVertex();
    vertexAuto.textContent = '暂停';
    vertexTimer = setTimeout(vertexAutoStep, 1200);
  });

  $('#vertexPrev').addEventListener('click', () => {
    stopVertexAuto();
    vertexState.step = Math.max(0, vertexState.step - 1);
    updateVertex();
  });

  $('#vertexNext').addEventListener('click', () => {
    stopVertexAuto();
    vertexState.step += 1;
    updateVertex();
  });

  $$('#vertexPresets .preset').forEach(button => {
    button.addEventListener('click', () => {
      stopVertexAuto();
      vertexState.preset = Number(button.dataset.preset);
      vertexState.step = 0;
      $$('#vertexPresets .preset').forEach(item => {
        item.classList.toggle('active', item === button);
      });
      updateVertex();
    });
  });

  updateVertex();

  const profitState = { price: 50 };
  const profitAnim = createAnimator();
  const profitPrice = $('#profitPrice');

  const profitOf = price => (price - 40) * (200 - 2 * price);

  const drawProfit = (ctx, w, h) => {
    const P = makePlot(w, h, { xmin: 35, xmax: 105, ymin: -300, ymax: 2000 });
    drawGridAxes(ctx, P, { xstep: 10, ystep: 500 });
    drawParabola(ctx, P, -2, 280, -8000, { color: '#7c3aed' });

    dashedLine(ctx, P, 40, 1800, 100, 1800, '#a7f3d0', [5, 5], 1.4);
    dashedLine(ctx, P, 70, 0, 70, 1800, '#c4b5fd', [4, 5], 1.2);
    drawDot(ctx, P, 70, 1800, '#10b981', 5, '最大 1800');

    const price = profitState.price;
    const profit = profitOf(price);
    dashedLine(ctx, P, price, 0, price, profit, '#94a3b8', [3, 5]);
    drawDot(ctx, P, price, profit, '#ef4444', 5, '当前');

    drawText(ctx, 'y = −2(x − 70)² + 1800', P.X(44), P.Y(1880), { color: '#7c3aed' });
  };

  const renderProfit = mountCanvas($('#canvasProfit'), drawProfit);

  function updateProfit() {
    const price = profitState.price;
    profitPrice.value = price;
    $('#profitPriceOut').textContent = `${fmt(price, 0)} 元`;
    $('#profitValue').textContent = `${fmt(profitOf(price), 0)} 元`;
    renderProfit();
  }

  profitPrice.addEventListener('input', () => {
    profitAnim.cancel();
    profitState.price = Number(profitPrice.value);
    updateProfit();
  });

  $('#profitPlay').addEventListener('click', () => {
    profitAnim.cancel();
    profitState.price = 40;
    updateProfit();
    profitAnim.value(40, 100, 4600, value => {
      profitState.price = value;
      updateProfit();
    });
  });

  $('#profitReset').addEventListener('click', () => {
    profitAnim.cancel();
    profitState.price = 50;
    updateProfit();
  });

  updateProfit();

  const quizData = [
    {
      q: '下列哪个是一元二次方程？',
      options: ['x² + 2x = 0', '2x + 1 = 0', 'x² + 1/x = 0', 'x³ = 1'],
      answer: 0,
      explain: '一元二次方程必须只含一个未知数、最高次数为 2，并且是整式方程。第一个符合；第二个是一次方程；第三个含分式；第四个是三次。'
    },
    {
      q: '方程 x² = 16 的解是：',
      options: ['x = 4', 'x = −4', 'x = ±4', 'x = 8'],
      answer: 2,
      explain: '开平方要带“±”：4² = 16，(−4)² 也等于 16，所以 x = ±4。'
    },
    {
      q: '抛物线 y = 2(x − 3)² + 1 的顶点是：',
      options: ['(3, 1)', '(−3, 1)', '(3, −1)', '(1, 3)'],
      answer: 0,
      explain: '顶点式 y = a(x − h)² + k 的顶点是 (h, k)。这里 h = 3，k = 1，所以顶点是 (3, 1)。'
    },
    {
      q: '把 y = x² 向右平移 2 个单位，得到：',
      options: ['y = x² + 2', 'y = x² − 2', 'y = (x + 2)²', 'y = (x − 2)²'],
      answer: 3,
      explain: '左右平移改变括号里的符号：向右移 2，写成 (x − 2)²。向上或向下平移才在括号外加减。'
    },
    {
      q: '方程 x² − 2x + 3 = 0 的根的情况是：',
      options: ['两个不相等实根', '两个相等实根', '没有实根', '无法判断'],
      answer: 2,
      explain: 'Δ = b² − 4ac = (−2)² − 4×1×3 = 4 − 12 = −8 < 0，所以没有实根。'
    },
    {
      q: '用配方法解 x² + 6x = 7，两边应同时加上：',
      options: ['3', '6', '9', '36'],
      answer: 2,
      explain: '一次项系数 6 的一半是 3，平方是 9。两边同时加 9，左边变成 (x + 3)²，右边变成 16。'
    }
  ];

  const answers = new Array(quizData.length).fill(null);
  const quizList = $('#quizList');
  const quizScore = $('#quizScore');

  function renderQuiz() {
    quizList.innerHTML = quizData
      .map((item, qi) => {
        const answered = answers[qi] !== null;
        const options = item.options
          .map((option, oi) => {
            let cls = 'quiz-option';
            if (answered) {
              if (oi === item.answer) cls += ' correct';
              else if (oi === answers[qi]) cls += ' wrong';
            }
            return `<button class="${cls}" type="button" data-q="${qi}" data-o="${oi}" ${answered ? 'disabled' : ''}>${String.fromCharCode(65 + oi)}. ${option}</button>`;
          })
          .join('');

        return `<div class="quiz-item">
          <div class="quiz-q">${qi + 1}. ${item.q}</div>
          <div class="quiz-options">${options}</div>
          <div class="quiz-explain" style="${answered ? 'display:block' : ''}">${item.explain}</div>
        </div>`;
      })
      .join('');

    const correct = answers.reduce((sum, answer, index) => sum + (answer === quizData[index].answer ? 1 : 0), 0);
    quizScore.textContent = `答对 ${correct} / ${quizData.length}`;
  }

  quizList.addEventListener('click', event => {
    const button = event.target.closest('.quiz-option');
    if (!button) return;
    const qi = Number(button.dataset.q);
    const oi = Number(button.dataset.o);
    if (answers[qi] !== null) return;
    answers[qi] = oi;
    renderQuiz();
  });

  $('#quizReset').addEventListener('click', () => {
    answers.fill(null);
    renderQuiz();
  });

  renderQuiz();
})();

(() => {
  'use strict';

  const MINUS = '−';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function fmt(value, digits = 2) {
    if (!Number.isFinite(value)) return '—';
    const p = 10 ** digits;
    return String(Math.round(value * p) / p).replace(/-/g, MINUS);
  }

  function clamp(value, lo, hi) {
    return Math.min(Math.max(value, lo), hi);
  }

  function deg(radians) {
    return (radians * 180) / Math.PI;
  }

  function rad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function rotatePoint(x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x * cos - y * sin, x * sin + y * cos];
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

  function makeSquarePlot(w, h, range, pad = 34) {
    const size = Math.min(w, h) - 2 * pad;
    const cx = w / 2;
    const cy = h / 2;
    const scale = size / (2 * range);
    return {
      w,
      h,
      range,
      pad,
      size,
      cx,
      cy,
      scale,
      X: x => cx + x * scale,
      Y: y => cy - y * scale
    };
  }

  function drawSquareGrid(ctx, P, step = 1) {
    const r = P.range;
    const labelStep = r <= 4 ? 1 : 2;

    ctx.save();
    ctx.strokeStyle = '#e9eef7';
    ctx.lineWidth = 1;

    for (let x = -r; x <= r + 1e-9; x += step) {
      if (Math.abs(x) < 1e-9) continue;
      const px = P.X(x);
      ctx.beginPath();
      ctx.moveTo(px, P.Y(-r));
      ctx.lineTo(px, P.Y(r));
      ctx.stroke();
    }

    for (let y = -r; y <= r + 1e-9; y += step) {
      if (Math.abs(y) < 1e-9) continue;
      const py = P.Y(y);
      ctx.beginPath();
      ctx.moveTo(P.X(-r), py);
      ctx.lineTo(P.X(r), py);
      ctx.stroke();
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(P.X(-r), P.Y(0));
    ctx.lineTo(P.X(r), P.Y(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(P.X(0), P.Y(-r));
    ctx.lineTo(P.X(0), P.Y(r));
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#8a98ab';
    ctx.font = '11px ui-sans-serif, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let x = -r + (labelStep - (r % labelStep)); x <= r; x += labelStep) {
      if (Math.abs(x) < 1e-9) continue;
      ctx.fillText(fmt(x, 1), P.X(x), P.Y(0) + 15);
    }

    ctx.textAlign = 'right';
    for (let y = -r + (labelStep - (r % labelStep)); y <= r; y += labelStep) {
      if (Math.abs(y) < 1e-9) continue;
      ctx.fillText(fmt(y, 1), P.X(0) - 7, P.Y(y));
    }

    ctx.textAlign = 'right';
    ctx.fillText('O', P.X(0) - 7, P.Y(0) + 15);
  }

  function drawLine(ctx, P, x1, y1, x2, y2, color = '#334155', width = 2, dash = []) {
    ctx.save();
    ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(P.X(x1), P.Y(y1));
    ctx.lineTo(P.X(x2), P.Y(y2));
    ctx.stroke();
    ctx.restore();
  }

  function drawCircle(ctx, P, cx, cy, r, color = '#2563eb', width = 2, dash = [], fill = null) {
    ctx.save();
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.arc(P.X(cx), P.Y(cy), r * P.scale, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  }

  function arcPoint(cx, cy, r, angle) {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  function drawArc(ctx, P, cx, cy, r, a1, a2, color = '#f59e0b', width = 2, dash = []) {
    const steps = Math.max(16, Math.ceil(Math.abs(a2 - a1) * 36));
    ctx.save();
    ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const a = a1 + (a2 - a1) * t;
      const [x, y] = arcPoint(cx, cy, r, a);
      if (i === 0) ctx.moveTo(P.X(x), P.Y(y));
      else ctx.lineTo(P.X(x), P.Y(y));
    }
    ctx.stroke();
    ctx.restore();
  }

  function fillSector(ctx, P, cx, cy, r, a1, a2, fill = 'rgba(37, 99, 235, 0.16)') {
    const steps = Math.max(20, Math.ceil(Math.abs(a2 - a1) * 36));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(P.X(cx), P.Y(cy));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const a = a1 + (a2 - a1) * t;
      const [x, y] = arcPoint(cx, cy, r, a);
      ctx.lineTo(P.X(x), P.Y(y));
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }

  function drawPolygon(ctx, P, points, options = {}) {
    if (!points.length) return;
    ctx.save();
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(P.X(x), P.Y(y));
      else ctx.lineTo(P.X(x), P.Y(y));
    });
    ctx.closePath();
    if (options.fill) {
      ctx.fillStyle = options.fill;
      ctx.fill();
    }
    if (options.stroke !== null) {
      ctx.strokeStyle = options.stroke || '#2563eb';
      ctx.lineWidth = options.width || 2;
      ctx.setLineDash(options.dash || []);
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDot(ctx, P, x, y, color = '#ef4444', r = 5, label = '', labelDx = 9, labelDy = -9) {
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(px + labelDx - 3, py + labelDy - 10, textWidth + 6, 16);
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, px + labelDx, py + labelDy - 1);
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

  function drawRightAngle(ctx, corner, p1, p2, size = 10, color = '#64748b') {
    const ux = p1[0] - corner[0];
    const uy = p1[1] - corner[1];
    const vx = p2[0] - corner[0];
    const vy = p2[1] - corner[1];
    const lu = Math.hypot(ux, uy) || 1;
    const lv = Math.hypot(vx, vy) || 1;
    const ax = (ux / lu) * size;
    const ay = (uy / lu) * size;
    const bx = (vx / lv) * size;
    const by = (vy / lv) * size;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(corner[0] + ax, corner[1] + ay);
    ctx.lineTo(corner[0] + ax + bx, corner[1] + ay + by);
    ctx.lineTo(corner[0] + bx, corner[1] + by);
    ctx.stroke();
    ctx.restore();
  }

  function initQuiz(data) {
    const list = $('#quizList');
    const score = $('#quizScore');
    const reset = $('#quizReset');
    if (!list || !score) return;

    const answers = new Array(data.length).fill(null);

    function render() {
      list.innerHTML = data
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

      const correct = answers.reduce((sum, answer, index) => sum + (answer === data[index].answer ? 1 : 0), 0);
      score.textContent = `答对 ${correct} / ${data.length}`;
    }

    list.addEventListener('click', event => {
      const button = event.target.closest('.quiz-option');
      if (!button) return;
      const qi = Number(button.dataset.q);
      const oi = Number(button.dataset.o);
      if (answers[qi] !== null) return;
      answers[qi] = oi;
      render();
    });

    if (reset) {
      reset.addEventListener('click', () => {
        answers.fill(null);
        render();
      });
    }

    render();
  }

  function initChecklist(goals, key) {
    const list = $('#goalList');
    const bar = $('#goalBar');
    const count = $('#goalCount');
    if (!list) return;

    let done = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) done = JSON.parse(raw);
    } catch (error) {
      done = [];
    }
    if (!Array.isArray(done)) done = [];

    function render() {
      list.innerHTML = goals
        .map((goal, index) => {
          const checked = done.includes(index);
          return `<label class="goal ${checked ? 'done' : ''}">
            <input type="checkbox" data-goal="${index}" ${checked ? 'checked' : ''}>
            <span>${goal}</span>
          </label>`;
        })
        .join('');

      if (bar) bar.style.width = `${(done.length / goals.length) * 100}%`;
      if (count) count.textContent = `${done.length} / ${goals.length}`;
    }

    list.addEventListener('change', event => {
      const input = event.target.closest('input[data-goal]');
      if (!input) return;
      const index = Number(input.dataset.goal);
      if (input.checked) {
        if (!done.includes(index)) done.push(index);
      } else {
        done = done.filter(item => item !== index);
      }
      try {
        localStorage.setItem(key, JSON.stringify(done));
      } catch (error) {
        /* ignore */
      }
      render();
    });

    render();
  }

  window.ChapterKit = {
    $,
    $$,
    MINUS,
    fmt,
    clamp,
    deg,
    rad,
    rotatePoint,
    createAnimator,
    mountCanvas,
    makeSquarePlot,
    drawSquareGrid,
    drawLine,
    drawCircle,
    drawArc,
    fillSector,
    drawPolygon,
    drawDot,
    drawText,
    drawRightAngle,
    arcPoint,
    initQuiz,
    initChecklist
  };
})();

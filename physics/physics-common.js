(() => {
  'use strict';

  const K = window.ChapterKit;
  const { clamp, fmt, drawText } = K;

  function makePlot(w, h, xmin, xmax, ymin, ymax, pad = 44) {
    const iw = w - pad * 2;
    const ih = h - pad * 2;
    return {
      w,
      h,
      xmin,
      xmax,
      ymin,
      ymax,
      pad,
      iw,
      ih,
      sx: iw / (xmax - xmin),
      sy: ih / (ymax - ymin),
      X: x => pad + ((x - xmin) / (xmax - xmin)) * iw,
      Y: y => h - pad - ((y - ymin) / (ymax - ymin)) * ih
    };
  }

  function drawPlotGrid(ctx, P, stepX, stepY, color = '#e9eef7') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (let x = Math.ceil(P.xmin / stepX) * stepX; x <= P.xmax + 1e-9; x += stepX) {
      const px = P.X(x);
      ctx.beginPath();
      ctx.moveTo(px, P.Y(P.ymin));
      ctx.lineTo(px, P.Y(P.ymax));
      ctx.stroke();
    }

    for (let y = Math.ceil(P.ymin / stepY) * stepY; y <= P.ymax + 1e-9; y += stepY) {
      const py = P.Y(y);
      ctx.beginPath();
      ctx.moveTo(P.X(P.xmin), py);
      ctx.lineTo(P.X(P.xmax), py);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawPlotAxes(ctx, P, options = {}) {
    const stepX = options.stepX || 1;
    const stepY = options.stepY || 1;
    const color = options.color || '#94a3b8';
    const axisY = P.ymin <= 0 && P.ymax >= 0 ? P.Y(0) : P.Y(P.ymin) + 14;
    const axisX = P.xmin <= 0 && P.xmax >= 0 ? P.X(0) : P.X(P.xmin) + 14;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(P.X(P.xmin), axisY);
    ctx.lineTo(P.X(P.xmax) + 6, axisY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(axisX, P.Y(P.ymax));
    ctx.lineTo(axisX, P.Y(P.ymin) - 6);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(P.X(P.xmax) + 10, axisY);
    ctx.lineTo(P.X(P.xmax) + 2, axisY - 4);
    ctx.lineTo(P.X(P.xmax) + 2, axisY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(axisX, P.Y(P.ymax) - 10);
    ctx.lineTo(axisX - 4, P.Y(P.ymax) - 2);
    ctx.lineTo(axisX + 4, P.Y(P.ymax) - 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#8a98ab';
    ctx.font = '11px ui-sans-serif, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let x = Math.ceil(P.xmin / stepX) * stepX; x <= P.xmax + 1e-9; x += stepX) {
      if (Math.abs(x) < 1e-9) continue;
      ctx.fillText(fmt(x, stepX < 1 ? 1 : 0), P.X(x), axisY + 15);
    }

    ctx.textAlign = 'right';
    for (let y = Math.ceil(P.ymin / stepY) * stepY; y <= P.ymax + 1e-9; y += stepY) {
      if (Math.abs(y) < 1e-9) continue;
      ctx.fillText(fmt(y, stepY < 1 ? 1 : 0), axisX - 7, P.Y(y));
    }

    if (P.xmin <= 0 && P.xmax >= 0 && P.ymin <= 0 && P.ymax >= 0) {
      ctx.textAlign = 'right';
      ctx.fillText('O', P.X(0) - 6, P.Y(0) + 15);
    }
    ctx.restore();

    if (options.xLabel) {
      drawText(ctx, options.xLabel, P.X(P.xmax) - 4, axisY + 28, { color: '#64748b', align: 'right', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }
    if (options.yLabel) {
      drawText(ctx, options.yLabel, axisX - 6, P.Y(P.ymax) - 17, { color: '#64748b', align: 'right', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }
  }

  function drawPlotLine(ctx, P, fn, color = '#2563eb', width = 2.4, dash = [], samples = 180) {
    ctx.save();
    ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= samples; i += 1) {
      const x = P.xmin + ((P.xmax - P.xmin) * i) / samples;
      const y = fn(x);
      if (!Number.isFinite(y)) continue;
      if (i === 0) ctx.moveTo(P.X(x), P.Y(y));
      else ctx.lineTo(P.X(x), P.Y(y));
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawPlotDot(ctx, P, x, y, color = '#ef4444', r = 5, label = '', dx = 9, dy = -10) {
    const px = P.X(x);
    const py = P.Y(y);
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    if (label) drawText(ctx, label, px + dx, py + dy, { color, font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  function drawArrow(ctx, x1, y1, x2, y2, color = '#ef4444', width = 2.2, head = 7) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle - 0.42), y2 - head * Math.sin(angle - 0.42));
    ctx.lineTo(x2 - head * Math.cos(angle + 0.42), y2 - head * Math.sin(angle + 0.42));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawWire(ctx, points, color = '#334155', width = 2.4, dash = []) {
    if (!points.length) return;
    ctx.save();
    ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  function drawBattery(ctx, x, y, len = 34, vertical = false, label = '') {
    const long = len * 0.62;
    const short = len * 0.34;
    const gap = 5;
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    if (vertical) {
      ctx.beginPath();
      ctx.moveTo(x, y - len / 2);
      ctx.lineTo(x, y - gap);
      ctx.moveTo(x, y + gap);
      ctx.lineTo(x, y + len / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - long / 2, y - gap);
      ctx.lineTo(x + long / 2, y - gap);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - short / 2, y + gap);
      ctx.lineTo(x + short / 2, y + gap);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - len / 2, y);
      ctx.lineTo(x - gap, y);
      ctx.moveTo(x + gap, y);
      ctx.lineTo(x + len / 2, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - gap, y - long / 2);
      ctx.lineTo(x - gap, y + long / 2);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + gap, y - short / 2);
      ctx.lineTo(x + gap, y + short / 2);
      ctx.stroke();
    }
    ctx.restore();
    drawText(ctx, '+', vertical ? x + 9 : x - 16, vertical ? y - 14 : y - len / 2 + 2, { color: '#ef4444', font: '700 13px ui-sans-serif, system-ui, sans-serif' });
    if (label) drawText(ctx, label, x, vertical ? y + len / 2 + 14 : y + len / 2 + 15, { color: '#64748b', align: 'center' });
  }

  function drawLamp(ctx, x, y, on = false, r = 14, label = '') {
    if (on) {
      const glow = ctx.createRadialGradient(x, y, 2, x, y, r * 2.6);
      glow.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.save();
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = on ? '#fef3c7' : '#ffffff';
    ctx.strokeStyle = on ? '#f59e0b' : '#475569';
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const d = r * 0.6;
    ctx.beginPath();
    ctx.moveTo(x - d, y - d);
    ctx.lineTo(x + d, y + d);
    ctx.moveTo(x + d, y - d);
    ctx.lineTo(x - d, y + d);
    ctx.stroke();
    ctx.restore();
    if (label) drawText(ctx, label, x, y + r + 16, { color: '#64748b', align: 'center' });
  }

  function drawSwitch(ctx, x, y, closed = false, len = 38, label = '') {
    const left = x - len / 2;
    const right = x + len / 2;
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(left, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(right, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(left, y);
    if (closed) {
      ctx.lineTo(right, y);
    } else {
      ctx.lineTo(left + len * 0.82, y - len * 0.44);
    }
    ctx.stroke();
    ctx.restore();
    if (label) drawText(ctx, label, x, y - 20, { color: '#64748b', align: 'center' });
  }

  function drawMeter(ctx, x, y, letter = 'A', r = 16, label = '') {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    drawText(ctx, letter, x, y + 1, { color: '#1d4ed8', align: 'center', font: '800 13px ui-sans-serif, system-ui, sans-serif' });
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.42, y + r * 0.52);
    ctx.lineTo(x, y + r * 0.3);
    ctx.lineTo(x + r * 0.42, y + r * 0.52);
    ctx.stroke();
    ctx.restore();
    if (label) drawText(ctx, label, x, y + r + 16, { color: '#64748b', align: 'center' });
  }

  function drawResistor(ctx, x, y, len = 48, vertical = false, label = 'R') {
    const half = len / 2;
    const amp = 7;
    const steps = 6;
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(x, y - half - 8);
      ctx.lineTo(x, y - half);
      for (let i = 0; i < steps; i += 1) {
        const t = i / steps;
        ctx.lineTo(x + (i % 2 === 0 ? amp : -amp), y - half + (len * (t + 1 / (steps * 2))));
      }
      ctx.lineTo(x, y + half);
      ctx.lineTo(x, y + half + 8);
    } else {
      ctx.moveTo(x - half - 8, y);
      ctx.lineTo(x - half, y);
      for (let i = 0; i < steps; i += 1) {
        const t = i / steps;
        ctx.lineTo(x - half + (len * (t + 1 / (steps * 2))), y + (i % 2 === 0 ? -amp : amp));
      }
      ctx.lineTo(x + half, y);
      ctx.lineTo(x + half + 8, y);
    }
    ctx.stroke();
    ctx.restore();
    if (label) drawText(ctx, label, vertical ? x + 16 : x, vertical ? y : y - 18, { color: '#64748b', align: 'center' });
  }

  function drawRheostat(ctx, x, y, len = 58, pos = 0.5, label = 'R') {
    const left = x - len / 2;
    const right = x + len / 2;
    const top = y - 12;
    const bottom = y + 12;
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.strokeRect(left, top, len, bottom - top);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(left, top, len, bottom - top);
    ctx.strokeRect(left, top, len, bottom - top);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    for (let i = 1; i < 8; i += 1) {
      const px = left + (len * i) / 8;
      ctx.beginPath();
      ctx.moveTo(px, top + 3);
      ctx.lineTo(px, bottom - 3);
      ctx.stroke();
    }
    ctx.restore();
    const sliderX = left + len * clamp(pos, 0, 1);
    drawArrow(ctx, sliderX, top - 18, sliderX, top - 3, '#ef4444', 2, 6);
    drawText(ctx, '滑片', sliderX, top - 27, { color: '#b91c1c', align: 'center', font: '600 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    if (label) drawText(ctx, label, x, bottom + 18, { color: '#64748b', align: 'center' });
  }

  function drawJunction(ctx, x, y, color = '#334155') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawElectron(ctx, x, y, r = 4.2) {
    ctx.save();
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    drawText(ctx, '−', x, y + 0.5, { color: '#ffffff', align: 'center', font: '800 8px ui-sans-serif, system-ui, sans-serif' });
    ctx.restore();
  }

  function drawCharge(ctx, x, y, positive = true, r = 9) {
    ctx.save();
    ctx.fillStyle = positive ? '#ef4444' : '#2563eb';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawText(ctx, positive ? '+' : '−', x, y + 1, { color: '#ffffff', align: 'center', font: '800 13px ui-sans-serif, system-ui, sans-serif' });
  }

  function heatColor(ratio) {
    const t = clamp(ratio, 0, 1);
    const r = Math.round(51 + t * 204);
    const g = Math.round(65 + t * 92);
    const b = Math.round(85 + t * 40);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function createLoop(render) {
    let frame = 0;
    let last = 0;
    let running = false;
    function tick(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      render(dt, now);
      frame = requestAnimationFrame(tick);
    }
    return {
      start() {
        if (running) return;
        running = true;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      },
      stop() {
        running = false;
        cancelAnimationFrame(frame);
      },
      get running() {
        return running;
      }
    };
  }

  window.PhysicsKit = Object.assign({}, K, {
    makePlot,
    drawPlotGrid,
    drawPlotAxes,
    drawPlotLine,
    drawPlotDot,
    drawArrow,
    drawWire,
    drawBattery,
    drawLamp,
    drawSwitch,
    drawMeter,
    drawResistor,
    drawRheostat,
    drawJunction,
    drawElectron,
    drawCharge,
    heatColor,
    createLoop
  });
})();

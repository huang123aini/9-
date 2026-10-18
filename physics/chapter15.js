(() => {
  'use strict';

  const K = window.PhysicsKit;
  const {
    $, fmt, clamp, createAnimator, createLoop, mountCanvas, drawText, drawArrow,
    drawWire, drawBattery, drawLamp, drawSwitch, drawMeter, drawJunction,
    drawElectron, drawCharge
  } = K;

  K.initChecklist([
    '知道两种电荷及相互作用规律',
    '理解摩擦起电的实质是电子转移',
    '知道电流的形成和方向规定',
    '能判断通路、断路和短路',
    '能判断串联和并联，会正确使用电流表'
  ], 'physics9a-ch15-goals');

  const pairs = {
    glass: {
      left: '玻璃棒',
      right: '丝绸',
      direction: '玻璃棒 → 丝绸',
      leftCharge: '带正电',
      rightCharge: '带负电',
      leftPositive: true,
      leftColor: '#bfdbfe',
      rightColor: '#fbcfe8'
    },
    rubber: {
      left: '橡胶棒',
      right: '毛皮',
      direction: '毛皮 → 橡胶棒',
      leftCharge: '带负电',
      rightCharge: '带正电',
      leftPositive: false,
      leftColor: '#475569',
      rightColor: '#d6b48a'
    }
  };
  const staticState = { pair: 'glass', progress: 0 };
  const staticAnim = createAnimator();
  const pairButtons = Array.from(document.querySelectorAll('[data-pair]'));

  function drawStatic(ctx, w, h) {
    const pair = pairs[staticState.pair];
    const ly = h * 0.40;
    const ry = h * 0.40;
    const lx = w * 0.16;
    const rx = w * 0.68;
    const lw = w * 0.18;
    const rw = w * 0.18;
    const lh = 26;
    const direction = staticState.pair === 'glass' ? 1 : -1;
    const startX = staticState.pair === 'glass' ? lx + lw : rx;
    const endX = staticState.pair === 'glass' ? rx : lx + lw;
    const pathY = ly + lh / 2;

    ctx.save();
    ctx.fillStyle = pair.leftColor;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(lx, ly, lw, lh);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = pair.rightColor;
    ctx.beginPath();
    ctx.rect(rx, ry, rw, lh);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawText(ctx, pair.left, lx + lw / 2, ly - 14, { color: '#334155', align: 'center', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, pair.right, rx + rw / 2, ry - 14, { color: '#334155', align: 'center', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    drawWire(ctx, [[lx + lw / 2, ly + lh], [lx + lw / 2, pathY + 70]], '#e2e8f0', 2, [4, 5]);
    drawWire(ctx, [[rx + rw / 2, ry + lh], [rx + rw / 2, pathY + 70]], '#e2e8f0', 2, [4, 5]);

    drawArrow(ctx, startX, pathY + 42, endX, pathY + 42, '#2563eb', 2.2, 7);
    drawText(ctx, '电子转移方向', w * 0.5, pathY + 62, { color: '#1d4ed8', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    for (let i = 0; i < 9; i += 1) {
      const offset = i * 0.075;
      const t = clamp(staticState.progress * 1.5 - offset, 0, 1);
      const ex = startX + (endX - startX) * t;
      drawElectron(ctx, ex, pathY + 42 + Math.sin((i + staticState.progress * 6) * 0.9) * 10);
    }

    if (staticState.progress > 0.32) {
      const alpha = clamp((staticState.progress - 0.32) / 0.3, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawCharge(ctx, lx + lw / 2, ly - 38, pair.leftPositive, 10);
      drawCharge(ctx, rx + rw / 2, ry - 38, !pair.leftPositive, 10);
      ctx.restore();
      drawText(ctx, pair.leftCharge, lx + lw / 2, ly + lh + 26, { color: pair.leftPositive ? '#b91c1c' : '#1d4ed8', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, pair.rightCharge, rx + rw / 2, ry + lh + 26, { color: pair.leftPositive ? '#1d4ed8' : '#b91c1c', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }

    drawText(ctx, '摩擦起电的实质：电子转移，不是创造电荷', w / 2, h * 0.92, { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderStatic = mountCanvas($('#canvasStatic'), drawStatic);

  function syncStatic() {
    const pair = pairs[staticState.pair];
    $('#staticPair').textContent = `${pair.left}和${pair.right}`;
    $('#staticDirection').textContent = staticState.progress > 0.3 ? pair.direction : '—';
    $('#staticLeft').textContent = staticState.progress > 0.3 ? pair.leftCharge : '不带电';
    $('#staticRight').textContent = staticState.progress > 0.3 ? pair.rightCharge : '不带电';
    pairButtons.forEach(button => {
      const active = button.dataset.pair === staticState.pair;
      button.classList.toggle('is-active', active);
      button.classList.toggle('ghost', !active);
    });
    renderStatic();
  }

  pairButtons.forEach(button => {
    button.addEventListener('click', () => {
      staticAnim.cancel();
      staticState.pair = button.dataset.pair;
      staticState.progress = 0;
      syncStatic();
    });
  });

  $('#staticPlay').addEventListener('click', () => {
    staticAnim.cancel();
    staticState.progress = 0;
    syncStatic();
    staticAnim.value(0, 1, 2600, value => {
      staticState.progress = value;
      syncStatic();
    });
  });

  $('#staticReset').addEventListener('click', () => {
    staticAnim.cancel();
    staticState.progress = 0;
    syncStatic();
  });

  syncStatic();

  function pathLength(points) {
    let total = 0;
    for (let i = 1; i < points.length; i += 1) {
      total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    }
    return total;
  }

  function pointOnPath(points, t) {
    const total = pathLength(points);
    let target = ((t % 1) + 1) % 1 * total;
    for (let i = 1; i < points.length; i += 1) {
      const [x1, y1] = points[i - 1];
      const [x2, y2] = points[i];
      const len = Math.hypot(x2 - x1, y2 - y1);
      if (target <= len) {
        const f = len < 1e-9 ? 0 : target / len;
        return [x1 + (x2 - x1) * f, y1 + (y2 - y1) * f];
      }
      target -= len;
    }
    return points[points.length - 1];
  }

  function drawFlow(ctx, points, phase, color, count = 9) {
    for (let i = 0; i < count; i += 1) {
      const [x, y] = pointOnPath(points, phase + i / count);
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const circuitState = { mode: 'closed', phase: 0 };
  const circuitLoop = createLoop(dt => {
    circuitState.phase = (circuitState.phase + dt * 0.22) % 1;
    renderCircuit();
  });

  function drawCircuit(ctx, w, h) {
    const x1 = w * 0.20;
    const x2 = w * 0.80;
    const y1 = h * 0.24;
    const y2 = h * 0.80;
    const midY = (y1 + y2) / 2;
    const midX = (x1 + x2) / 2;
    const open = circuitState.mode === 'open';
    const short = circuitState.mode === 'short';
    const batteryLen = 38;
    const lampR = 14;
    const switchLen = 38;

    drawWire(ctx, [[x1, y1], [midX - switchLen / 2, y1]], '#334155', 2.6);
    drawSwitch(ctx, midX, y1, !open, switchLen, 'S');
    drawWire(ctx, [[midX + switchLen / 2, y1], [x2, y1]], '#334155', 2.6);
    drawWire(ctx, [[x2, y1], [x2, midY - lampR]], '#334155', 2.6);
    drawLamp(ctx, x2, midY, circuitState.mode === 'closed', lampR, 'L');
    drawWire(ctx, [[x2, midY + lampR], [x2, y2]], '#334155', 2.6);
    drawWire(ctx, [[x2, y2], [x1, y2]], '#334155', 2.6);
    drawWire(ctx, [[x1, y2], [x1, midY + batteryLen / 2]], '#334155', 2.6);
    drawBattery(ctx, x1, midY, batteryLen, true, '电源');
    drawWire(ctx, [[x1, midY - batteryLen / 2], [x1, y1]], '#334155', 2.6);

    if (short) {
      const sx = x1 + 34;
      drawWire(ctx, [[x1, y1], [sx, y1], [sx, y2], [x1, y2]], '#ef4444', 3);
      drawJunction(ctx, x1, y1, '#ef4444');
      drawJunction(ctx, x1, y2, '#ef4444');
      drawText(ctx, '短路导线', sx + 10, midY, { color: '#b91c1c', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      const glow = ctx.createRadialGradient(x1, midY, 4, x1, midY, 46);
      glow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.save();
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x1, midY, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawText(ctx, '电源短路，电流很大！', w / 2, h * 0.94, { color: '#b91c1c', align: 'center', font: '800 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    } else if (open) {
      drawText(ctx, '开关断开，电路中没有电流', w / 2, h * 0.94, { color: '#64748b', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    } else {
      drawText(ctx, '电流沿导线流动，灯泡发光', w / 2, h * 0.94, { color: '#047857', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }

    if (!open) {
      const loopPath = short
        ? [[x1, y1], [x1 + 34, y1], [x1 + 34, y2], [x1, y2], [x1, y1]]
        : [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
      drawFlow(ctx, loopPath, circuitState.phase, short ? '#ef4444' : '#2563eb', short ? 12 : 9);
    }

    drawText(ctx, 'L', x2 + 22, midY, { color: circuitState.mode === 'closed' ? '#b45309' : '#64748b', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderCircuit = mountCanvas($('#canvasCircuit'), drawCircuit);

  function syncCircuit() {
    const mode = circuitState.mode;
    const labels = {
      closed: ['通路', '有电流', '发光', '正常'],
      open: ['断路', '无电流', '不发光', '正常'],
      short: ['短路', '电流很大', '不发光', '可能损坏']
    };
    const item = labels[mode];
    $('#circuitState').textContent = item[0];
    $('#circuitCurrent').textContent = item[1];
    $('#circuitLamp').textContent = item[2];
    $('#circuitSource').textContent = item[3];
    $('#circuitClosed').classList.toggle('is-active', mode === 'closed');
    $('#circuitOpen').classList.toggle('is-active', mode === 'open');
    $('#circuitShort').classList.toggle('is-active', mode === 'short');
    $('#circuitClosed').classList.toggle('ghost', mode !== 'closed');
    $('#circuitOpen').classList.toggle('ghost', mode !== 'open');
    $('#circuitShort').classList.toggle('ghost', mode !== 'short');
    renderCircuit();
  }

  $('#circuitClosed').addEventListener('click', () => {
    circuitState.mode = 'closed';
    syncCircuit();
  });
  $('#circuitOpen').addEventListener('click', () => {
    circuitState.mode = 'open';
    syncCircuit();
  });
  $('#circuitShort').addEventListener('click', () => {
    circuitState.mode = 'short';
    syncCircuit();
  });
  $('#circuitReset').addEventListener('click', () => {
    circuitState.mode = 'closed';
    circuitState.phase = 0;
    syncCircuit();
  });

  syncCircuit();
  circuitLoop.start();

  const seriesState = { type: 'series', s1: true, s2: true, phase: 0 };
  const seriesLoop = createLoop(dt => {
    seriesState.phase = (seriesState.phase + dt * 0.18) % 1;
    renderSeries();
  });

  function drawSeriesCircuit(ctx, w, h) {
    const x1 = w * 0.16;
    const x2 = w * 0.84;
    const y1 = h * 0.24;
    const y2 = h * 0.76;
    const midY = (y1 + y2) / 2;

    if (seriesState.type === 'series') {
      const s1x = w * 0.30;
      const l1x = w * 0.48;
      const l2x = w * 0.64;
      const s2x = w * 0.50;
      const batteryLen = 36;

      drawWire(ctx, [[x1, y2], [x1, midY + batteryLen / 2]], '#334155', 2.6);
      drawBattery(ctx, x1, midY, batteryLen, true, '电源');
      drawWire(ctx, [[x1, midY - batteryLen / 2], [x1, y1]], '#334155', 2.6);
      drawWire(ctx, [[x1, y1], [s1x - 19, y1]], '#334155', 2.6);
      drawSwitch(ctx, s1x, y1, seriesState.s1, 38, 'S₁');
      drawWire(ctx, [[s1x + 19, y1], [l1x - 14, y1]], '#334155', 2.6);
      drawLamp(ctx, l1x, y1, seriesState.s1 && seriesState.s2, 14, 'L₁');
      drawWire(ctx, [[l1x + 14, y1], [l2x - 14, y1]], '#334155', 2.6);
      drawLamp(ctx, l2x, y1, seriesState.s1 && seriesState.s2, 14, 'L₂');
      drawWire(ctx, [[l2x + 14, y1], [x2, y1], [x2, y2]], '#334155', 2.6);
      drawWire(ctx, [[x2, y2], [s2x + 19, y2]], '#334155', 2.6);
      drawSwitch(ctx, s2x, y2, seriesState.s2, 38, 'S₂');
      drawWire(ctx, [[s2x - 19, y2], [x1, y2]], '#334155', 2.6);

      if (seriesState.s1 && seriesState.s2) {
        drawFlow(ctx, [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]], seriesState.phase, '#2563eb', 10);
      }

      drawText(ctx, '一条电流路径，开关控制整个电路', w / 2, h * 0.92, { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    } else {
      const s1x = w * 0.30;
      const l1x = w * 0.58;
      const s2x = w * 0.30;
      const l2x = w * 0.58;
      const batteryLen = 36;

      drawWire(ctx, [[x1, y2], [x1, midY + batteryLen / 2]], '#334155', 2.6);
      drawBattery(ctx, x1, midY, batteryLen, true, '电源');
      drawWire(ctx, [[x1, midY - batteryLen / 2], [x1, y1]], '#334155', 2.6);

      drawWire(ctx, [[x1, y1], [s1x - 19, y1]], '#334155', 2.6);
      drawSwitch(ctx, s1x, y1, seriesState.s1, 38, 'S₁');
      drawWire(ctx, [[s1x + 19, y1], [l1x - 14, y1]], '#334155', 2.6);
      drawLamp(ctx, l1x, y1, seriesState.s1, 14, 'L₁');
      drawWire(ctx, [[l1x + 14, y1], [x2, y1]], '#334155', 2.6);

      drawWire(ctx, [[x1, y2], [s2x - 19, y2]], '#334155', 2.6);
      drawSwitch(ctx, s2x, y2, seriesState.s2, 38, 'S₂');
      drawWire(ctx, [[s2x + 19, y2], [l2x - 14, y2]], '#334155', 2.6);
      drawLamp(ctx, l2x, y2, seriesState.s2, 14, 'L₂');
      drawWire(ctx, [[l2x + 14, y2], [x2, y2]], '#334155', 2.6);
      drawWire(ctx, [[x2, y1], [x2, y2]], '#334155', 2.6);

      if (seriesState.s1) {
        drawFlow(ctx, [[x1, y1], [x2, y1]], seriesState.phase, '#2563eb', 6);
      }
      if (seriesState.s2) {
        drawFlow(ctx, [[x2, y2], [x1, y2]], (seriesState.phase + 0.25) % 1, '#f59e0b', 6);
      }

      drawText(ctx, '两条支路独立工作，开关控制本支路', w / 2, h * 0.92, { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }
  }

  const renderSeries = mountCanvas($('#canvasSeries'), drawSeriesCircuit);

  function syncSeries() {
    const isSeries = seriesState.type === 'series';
    const l1 = isSeries ? seriesState.s1 && seriesState.s2 : seriesState.s1;
    const l2 = isSeries ? seriesState.s1 && seriesState.s2 : seriesState.s2;
    $('#seriesType').textContent = isSeries ? '串联' : '并联';
    $('#seriesPath').textContent = isSeries ? '一条' : '两条';
    $('#seriesL1').textContent = l1 ? '发光' : '不发光';
    $('#seriesL2').textContent = l2 ? '发光' : '不发光';
    $('#seriesSwitch').textContent = isSeries ? '控制整个电路' : '分别控制本支路';
    $('#typeSeries').classList.toggle('is-active', isSeries);
    $('#typeParallel').classList.toggle('is-active', !isSeries);
    $('#typeSeries').classList.toggle('ghost', !isSeries);
    $('#typeParallel').classList.toggle('ghost', isSeries);
    $('#switchOne').textContent = seriesState.s1 ? 'S₁ 闭合' : 'S₁ 断开';
    $('#switchTwo').textContent = seriesState.s2 ? 'S₂ 闭合' : 'S₂ 断开';
    $('#switchOne').classList.toggle('ghost', !seriesState.s1);
    $('#switchTwo').classList.toggle('ghost', !seriesState.s2);
    renderSeries();
  }

  $('#typeSeries').addEventListener('click', () => {
    seriesState.type = 'series';
    syncSeries();
  });
  $('#typeParallel').addEventListener('click', () => {
    seriesState.type = 'parallel';
    syncSeries();
  });
  $('#switchOne').addEventListener('click', () => {
    seriesState.s1 = !seriesState.s1;
    syncSeries();
  });
  $('#switchTwo').addEventListener('click', () => {
    seriesState.s2 = !seriesState.s2;
    syncSeries();
  });

  syncSeries();
  seriesLoop.start();

  const ammeterState = { range: 0.6, current: 0.3 };
  const ammeterButtons = Array.from(document.querySelectorAll('[data-range]'));

  function drawAmmeter(ctx, w, h) {
    const cx = w * 0.30;
    const cy = h * 0.58;
    const r = Math.min(w * 0.19, h * 0.30);
    const over = ammeterState.current > ammeterState.range + 1e-9;
    const fraction = clamp(ammeterState.current / ammeterState.range, 0, 1);

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.76, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i <= 30; i += 1) {
      const f = i / 30;
      const angle = Math.PI + f * Math.PI;
      const inner = i % 5 === 0 ? r * 0.70 : r * 0.76;
      const outer = r * 0.84;
      const x1 = cx + Math.cos(angle) * inner;
      const y1 = cy + Math.sin(angle) * inner;
      const x2 = cx + Math.cos(angle) * outer;
      const y2 = cy + Math.sin(angle) * outer;
      ctx.save();
      ctx.strokeStyle = i % 5 === 0 ? '#475569' : '#94a3b8';
      ctx.lineWidth = i % 5 === 0 ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i <= 6; i += 1) {
      const f = i / 6;
      const angle = Math.PI + f * Math.PI;
      const value = ammeterState.range * f;
      const tx = cx + Math.cos(angle) * r * 0.58;
      const ty = cy + Math.sin(angle) * r * 0.58;
      drawText(ctx, ammeterState.range === 0.6 ? value.toFixed(1) : fmt(value, 1), tx, ty, { color: '#334155', align: 'center', font: '700 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }

    const needleAngle = Math.PI + fraction * Math.PI;
    const nx = cx + Math.cos(needleAngle) * r * 0.72;
    const ny = cy + Math.sin(needleAngle) * r * 0.72;
    ctx.save();
    ctx.strokeStyle = over ? '#ef4444' : '#dc2626';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawText(ctx, 'A', cx, cy - r * 0.18, { color: '#1d4ed8', align: 'center', font: '800 20px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, over ? '超量程！' : `${fmt(ammeterState.current, 2)} A`, cx, cy + r * 0.46, { color: over ? '#b91c1c' : '#0f172a', align: 'center', font: '800 16px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    const x1 = w * 0.58;
    const x2 = w * 0.92;
    const y1 = h * 0.28;
    const y2 = h * 0.76;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const batteryLen = 30;

    drawWire(ctx, [[x1, y2], [x1, midY + batteryLen / 2]], '#334155', 2.2);
    drawBattery(ctx, x1, midY, batteryLen, true, '电源');
    drawWire(ctx, [[x1, midY - batteryLen / 2], [x1, y1], [midX - 14, y1]], '#334155', 2.2);
    drawLamp(ctx, midX, y1, ammeterState.current > 0.01, 12, 'L');
    drawWire(ctx, [[midX + 14, y1], [x2, y1], [x2, midY - 16]], '#334155', 2.2);
    drawMeter(ctx, x2, midY, 'A', 16);
    drawWire(ctx, [[x2, midY + 16], [x2, y2], [x1, y2]], '#334155', 2.2);

    drawText(ctx, '+', x2 - 24, midY - 8, { color: '#ef4444', font: '800 12px ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, '−', x2 - 24, midY + 18, { color: '#2563eb', font: '800 12px ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, '电流表串联接入', x2, h * 0.94, { color: '#64748b', align: 'center', font: '600 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    if (ammeterState.current > 0.01) {
      drawFlow(ctx, [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]], 0.1, '#2563eb', 7);
    }

    drawText(ctx, ammeterState.range === 0.6 ? '量程 0–0.6 A，分度值 0.02 A' : '量程 0–3 A，分度值 0.1 A', cx, h * 0.94, { color: '#64748b', align: 'center', font: '600 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderAmmeter = mountCanvas($('#canvasAmmeter'), drawAmmeter);

  function syncAmmeter() {
    const over = ammeterState.current > ammeterState.range + 1e-9;
    $('#ammeterRange').textContent = ammeterState.range === 0.6 ? '0–0.6 A' : '0–3 A';
    $('#ammeterStep').textContent = ammeterState.range === 0.6 ? '0.02 A' : '0.1 A';
    $('#ammeterRead').textContent = over ? '超量程' : `${fmt(ammeterState.current, 2)} A`;
    $('#ammeterCurrentOut').textContent = `${fmt(ammeterState.current, 2)} A`;
    ammeterButtons.forEach(button => {
      const active = Number(button.dataset.range) === ammeterState.range;
      button.classList.toggle('is-active', active);
      button.classList.toggle('ghost', !active);
    });
    renderAmmeter();
  }

  ammeterButtons.forEach(button => {
    button.addEventListener('click', () => {
      ammeterState.range = Number(button.dataset.range);
      syncAmmeter();
    });
  });

  $('#ammeterCurrent').addEventListener('input', event => {
    ammeterState.current = Number(event.target.value);
    syncAmmeter();
  });

  $('#ammeterReset').addEventListener('click', () => {
    ammeterState.range = 0.6;
    ammeterState.current = 0.3;
    $('#ammeterCurrent').value = 0.3;
    syncAmmeter();
  });

  syncAmmeter();

  K.initQuiz([
    {
      q: '摩擦起电的实质是：',
      options: ['创造了电荷', '电子从一个物体转移到另一个物体', '质子从一个物体转移到另一个物体', '正电荷被消灭了'],
      answer: 1,
      explain: '摩擦起电不是创造电荷，而是电子在不同物体之间转移，使物体带上等量异种电荷。'
    },
    {
      q: '物理学中规定电流的方向是：',
      options: ['自由电子定向移动的方向', '正电荷定向移动的方向', '负电荷定向移动的方向', '导线中电流最快的方向'],
      answer: 1,
      explain: '规定正电荷定向移动的方向为电流方向。金属导体中自由电子带负电，其移动方向与电流方向相反。'
    },
    {
      q: '串联电路中，开关的作用是：',
      options: ['只控制一个用电器', '控制整个电路', '控制干路电流大小', '没有作用'],
      answer: 1,
      explain: '串联电路只有一条电流路径，任何一个开关断开都会使整个电路断路，所以开关控制整个电路。'
    },
    {
      q: '关于并联电路，下列说法正确的是：',
      options: [
        '各支路电流一定相等',
        '各支路用电器互相影响',
        '各支路可以独立工作',
        '总电流等于各支路电流之差'
      ],
      answer: 2,
      explain: '并联电路各支路独立工作，互不影响；总电流等于各支路电流之和。'
    },
    {
      q: '使用电流表时，正确的做法是：',
      options: [
        '与被测用电器并联',
        '直接接在电源两极上',
        '串联接入，电流从“+”接线柱流入',
        '不需要考虑量程'
      ],
      answer: 2,
      explain: '电流表必须串联接入，电流从“+”接线柱流入、“−”接线柱流出，且被测电流不能超过量程。'
    },
    {
      q: '用导线把电源两极直接连接起来，会造成：',
      options: ['通路，电路正常工作', '断路，没有电流', '电源短路，电流很大', '用电器更亮'],
      answer: 2,
      explain: '导线直接连接电源两极会造成电源短路，电流很大，可能烧坏电源。'
    }
  ]);
})();

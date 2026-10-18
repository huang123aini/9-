(() => {
  'use strict';

  const K = window.PhysicsKit;
  const {
    $, fmt, clamp, rad, createAnimator, createLoop, mountCanvas, drawText,
    drawArrow, drawWire, drawPlotDot
  } = K;

  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };

  function sup(n) {
    return String(n).split('').map(ch => SUP[ch] || ch).join('');
  }

  function sci(value, digits = 2) {
    if (!Number.isFinite(value)) return '—';
    if (Math.abs(value) < 1000) return fmt(value, 0);
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mant = value / 10 ** exp;
    return `${mant.toFixed(digits).replace(/\.?0+$/, '')}×10${sup(exp)}`;
  }

  K.initChecklist([
    '能说出热机的工作原理',
    '能区分四冲程内燃机的四个冲程',
    '知道热值的含义，会用 Q放 = mq',
    '理解热机效率，会进行简单计算',
    '能说出能量守恒定律'
  ], 'physics9a-ch14-goals');

  const STROKES = [
    { name: '吸气冲程', piston: '向下', valve: '进气门开', convert: '—' },
    { name: '压缩冲程', piston: '向上', valve: '两气门关', convert: '机械能 → 内能' },
    { name: '做功冲程', piston: '向下', valve: '两气门关', convert: '内能 → 机械能' },
    { name: '排气冲程', piston: '向上', valve: '排气门开', convert: '—' }
  ];

  const engineState = { pos: 0 };
  const engineAnim = createAnimator();

  function engineCurrent() {
    const stroke = Math.min(3, Math.floor(engineState.pos));
    const phase = engineState.pos >= 4 ? 1 : engineState.pos - stroke;
    return { stroke, phase };
  }

  function drawValve(ctx, x, y, open, label) {
    const top = y - 26;
    const seat = y;
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, seat - (open ? 10 : 3));
    ctx.stroke();
    ctx.fillStyle = open ? '#10b981' : '#64748b';
    ctx.beginPath();
    ctx.ellipse(x, seat - (open ? 8 : 1), 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawText(ctx, label, x, top - 10, { color: open ? '#047857' : '#64748b', align: 'center', font: '700 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  function drawEngine(ctx, w, h) {
    const { stroke, phase } = engineCurrent();
    const cx = w * 0.48;
    const cw = Math.min(w * 0.30, 150);
    const top = h * 0.22;
    const bottom = h * 0.69;
    const left = cx - cw / 2;
    const right = cx + cw / 2;
    const pistonFrac = stroke % 2 === 0 ? phase : 1 - phase;
    const pistonY = top + pistonFrac * (bottom - top - 14);
    const crankY = h * 0.87;
    const crankR = Math.min(h * 0.09, 30);
    const angle = engineState.pos * Math.PI;
    const pinX = cx + Math.cos(angle) * crankR;
    const pinY = crankY + Math.sin(angle) * crankR;

    let gasTop;
    let gasBottom;
    if (stroke === 0) {
      gasTop = 'rgba(186, 230, 253, 0.55)';
      gasBottom = 'rgba(125, 211, 252, 0.7)';
    } else if (stroke === 1) {
      gasTop = 'rgba(254, 215, 170, 0.55)';
      gasBottom = 'rgba(251, 146, 60, 0.7)';
    } else if (stroke === 2) {
      gasTop = 'rgba(254, 202, 202, 0.6)';
      gasBottom = 'rgba(239, 68, 68, 0.78)';
    } else {
      gasTop = 'rgba(226, 232, 240, 0.6)';
      gasBottom = 'rgba(148, 163, 184, 0.7)';
    }

    ctx.save();
    const gas = ctx.createLinearGradient(0, top, 0, pistonY);
    gas.addColorStop(0, gasTop);
    gas.addColorStop(1, gasBottom);
    ctx.fillStyle = gas;
    ctx.fillRect(left + 7, top, cw - 14, Math.max(0, pistonY - top));
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(left, top - 8);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right, top - 8);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(left + 3, pistonY, cw - 6, 13);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, pistonY + 13);
    ctx.lineTo(pinX, pinY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, crankY, crankR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, crankY);
    ctx.lineTo(pinX, pinY);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pinX, pinY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(cx, crankY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawWire(ctx, [[left - 34, top - 6], [left, top - 6]], '#64748b', 5);
    drawWire(ctx, [[right, top - 6], [right + 34, top - 6]], '#64748b', 5);
    drawValve(ctx, left + cw * 0.24, top, stroke === 0, '进气门');
    drawValve(ctx, right - cw * 0.24, top, stroke === 3, '排气门');

    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 6, top - 28, 12, 24);
    ctx.strokeRect(cx - 6, top - 28, 12, 24);
    ctx.restore();


    if (stroke === 2 && phase < 0.16) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        const a = -Math.PI / 2 + (i - 1) * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, top - 4);
        ctx.lineTo(cx + Math.cos(a) * 18, top - 4 - Math.sin(a) * 18);
        ctx.stroke();
      }
      ctx.restore();
      drawText(ctx, '点火', cx + 34, top + 8, { color: '#b45309', font: '800 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }

    if (stroke === 0) {
      drawArrow(ctx, left - 24, top - 22, left + 12, top + 8, '#0284c7', 2.4, 7);
      drawText(ctx, '空气 + 汽油', left - 86, top - 30, { color: '#0369a1', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }
    if (stroke === 3) {
      drawArrow(ctx, right - 12, top + 8, right + 26, top - 22, '#64748b', 2.4, 7);
      drawText(ctx, '废气', right + 34, top - 30, { color: '#475569', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }

    drawText(ctx, '活塞', cx, pistonY + 7, { color: '#0f172a', align: 'center', font: '700 10px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, '曲轴', cx, crankY + crankR + 20, { color: '#475569', align: 'center', font: '700 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, STROKES[stroke].name, cx, h * 0.085, { color: '#1d4ed8', align: 'center', font: '800 20px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    drawText(ctx, '一个循环：活塞往复 2 次，曲轴转 2 圈，做功 1 次', cx, h * 0.96, { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderEngine = mountCanvas($('#canvasEngine'), drawEngine);

  function syncEngine() {
    const { stroke } = engineCurrent();
    const info = STROKES[stroke];
    $('#engineStroke').textContent = info.name;
    $('#enginePiston').textContent = info.piston;
    $('#engineValve').textContent = info.valve;
    $('#engineConvert').textContent = info.convert;
    document.querySelectorAll('.engine-step').forEach(button => {
      button.classList.toggle('is-active', Number(button.dataset.stroke) === stroke);
      button.classList.toggle('ghost', Number(button.dataset.stroke) !== stroke);
    });
    renderEngine();
  }

  $('#enginePlay').addEventListener('click', () => {
    engineAnim.cancel();
    engineState.pos = 0;
    syncEngine();
    engineAnim.value(0, 4, 7200, value => {
      engineState.pos = value;
      syncEngine();
    });
  });

  $('#engineReset').addEventListener('click', () => {
    engineAnim.cancel();
    engineState.pos = 0;
    syncEngine();
  });

  document.querySelectorAll('.engine-step').forEach(button => {
    button.addEventListener('click', () => {
      engineAnim.cancel();
      engineState.pos = Number(button.dataset.stroke) + 0.45;
      syncEngine();
    });
  });

  syncEngine();

  const fuels = {
    wood: { name: '干木柴', q: 1.2e7 },
    alcohol: { name: '酒精', q: 3.0e7 },
    gasoline: { name: '汽油', q: 4.6e7 },
    hydrogen: { name: '氢气', q: 1.4e8 }
  };
  const fuelState = { fuel: 'gasoline', mass: 1 };
  const fuelButtons = Array.from(document.querySelectorAll('[data-fuel]'));

  function drawFuel(ctx, w, h) {
    const keys = Object.keys(fuels);
    const maxQ = 1.5e8;
    const baseY = h * 0.76;
    const chartX = w * 0.14;
    const chartW = w * 0.72;
    const chartH = h * 0.56;
    const gap = chartW / keys.length;
    const barW = Math.min(52, gap * 0.5);

    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(chartX, baseY);
    ctx.lineTo(chartX + chartW + 10, baseY);
    ctx.stroke();
    ctx.restore();

    keys.forEach((key, index) => {
      const fuel = fuels[key];
      const x = chartX + gap * (index + 0.5);
      const barH = (fuel.q / maxQ) * chartH;
      const active = key === fuelState.fuel;
      ctx.save();
      const grad = ctx.createLinearGradient(0, baseY - barH, 0, baseY);
      if (active) {
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(1, '#fbbf24');
      } else {
        grad.addColorStop(0, '#cbd5e1');
        grad.addColorStop(1, '#e2e8f0');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x - barW / 2, baseY - barH, barW, barH);
      ctx.restore();
      drawText(ctx, `${fmt(fuel.q / 1e7, 1)}`, x, baseY - barH - 12, { color: active ? '#b45309' : '#64748b', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, fuel.name, x, baseY + 20, { color: active ? '#b45309' : '#475569', align: 'center', font: active ? '800 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' : '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    });

    drawText(ctx, '热值 q / (×10⁷ J/kg)', chartX, h * 0.12, { color: '#475569', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `完全燃烧 ${fmt(fuelState.mass, 1)} kg，放出 ${sci(fuels[fuelState.fuel].q * fuelState.mass)} J`, w / 2, h * 0.92, { color: '#2563eb', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderFuel = mountCanvas($('#canvasFuel'), drawFuel);

  function syncFuel() {
    const fuel = fuels[fuelState.fuel];
    $('#fuelName').textContent = fuel.name;
    $('#fuelQ').textContent = `${sci(fuel.q)} J/kg`;
    $('#fuelMassRead').textContent = `${fmt(fuelState.mass, 1)} kg`;
    $('#fuelHeat').textContent = `${sci(fuel.q * fuelState.mass)} J`;
    fuelButtons.forEach(button => {
      const active = button.dataset.fuel === fuelState.fuel;
      button.classList.toggle('is-active', active);
      button.classList.toggle('ghost', !active);
    });
    renderFuel();
  }

  fuelButtons.forEach(button => {
    button.addEventListener('click', () => {
      fuelState.fuel = button.dataset.fuel;
      syncFuel();
    });
  });

  $('#fuelMass').addEventListener('input', event => {
    fuelState.mass = Number(event.target.value);
    $('#fuelMassOut').textContent = `${fmt(fuelState.mass, 1)} kg`;
    syncFuel();
  });

  $('#fuelReset').addEventListener('click', () => {
    fuelState.fuel = 'gasoline';
    fuelState.mass = 1;
    $('#fuelMass').value = 1;
    $('#fuelMassOut').textContent = '1.0 kg';
    syncFuel();
  });

  syncFuel();

  const effState = { total: 500, rate: 30 };

  function drawEfficiency(ctx, w, h) {
    const total = effState.total;
    const rate = effState.rate;
    const useful = total * rate / 100;
    const loss = total - useful;
    const exhaust = loss * 0.6;
    const cooling = loss * 0.25;
    const friction = loss * 0.15;

    const barX = w * 0.30;
    const barY = h * 0.16;
    const barW = Math.min(w * 0.20, 74);
    const barH = h * 0.66;
    const segments = [
      { value: friction, color: '#94a3b8', label: '摩擦' },
      { value: cooling, color: '#fbbf24', label: '散热' },
      { value: exhaust, color: '#fb923c', label: '废气' },
      { value: useful, color: '#10b981', label: '有用功' }
    ];

    ctx.save();
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.6;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeRect(barX, barY, barW, barH);
    let bottom = barY + barH;
    segments.forEach(seg => {
      const segH = (seg.value / total) * barH;
      ctx.fillStyle = seg.color;
      ctx.fillRect(barX + 2, bottom - segH, barW - 4, segH);
      bottom -= segH;
    });
    ctx.restore();

    drawText(ctx, `总热量 Q = ${fmt(total, 0)} kJ`, barX + barW / 2, barY - 18, { color: '#475569', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    const labelX = w * 0.58;
    let labelY = h * 0.22;
    segments.slice().reverse().forEach(seg => {
      const pct = (seg.value / total) * 100;
      ctx.save();
      ctx.fillStyle = seg.color;
      ctx.fillRect(labelX, labelY - 7, 12, 12);
      ctx.restore();
      drawText(ctx, `${seg.label}  ${fmt(seg.value, 0)} kJ（${fmt(pct, 1)}%）`, labelX + 20, labelY, { color: '#334155', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      labelY += h * 0.14;
    });

    drawArrow(ctx, w * 0.14, h * 0.48, barX - 10, h * 0.48, '#f59e0b', 2.6, 7);
    drawText(ctx, '燃料', w * 0.14, h * 0.40, { color: '#b45309', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `η = ${fmt(rate, 0)}%`, barX + barW / 2, h * 0.94, { color: '#047857', align: 'center', font: '800 16px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderEfficiency = mountCanvas($('#canvasEfficiency'), drawEfficiency);

  function syncEfficiency() {
    const useful = effState.total * effState.rate / 100;
    $('#effTotalRead').textContent = `${fmt(effState.total, 0)} kJ`;
    $('#effUseful').textContent = `${fmt(useful, 0)} kJ`;
    $('#effLoss').textContent = `${fmt(effState.total - useful, 0)} kJ`;
    $('#effRateRead').textContent = `${fmt(effState.rate, 0)}%`;
    $('#effTotalOut').textContent = `${fmt(effState.total, 0)} kJ`;
    $('#effRateOut').textContent = `${fmt(effState.rate, 0)}%`;
    renderEfficiency();
  }

  $('#effTotal').addEventListener('input', event => {
    effState.total = Number(event.target.value);
    syncEfficiency();
  });

  $('#effRate').addEventListener('input', event => {
    effState.rate = Number(event.target.value);
    syncEfficiency();
  });

  $('#effReset').addEventListener('click', () => {
    effState.total = 500;
    effState.rate = 30;
    $('#effTotal').value = 500;
    $('#effRate').value = 30;
    syncEfficiency();
  });

  syncEfficiency();

  const pendState = { maxAngle: 50, angle: 50, phase: 0, running: false };
  const pendLoop = createLoop(dt => {
    if (!pendState.running) return;
    pendState.phase += dt * (Math.PI * 2 / 2.8);
    pendState.angle = pendState.maxAngle * Math.cos(pendState.phase);
    syncPendulum(false);
  });

  function pendulumEnergy(angle) {
    const maxRad = rad(pendState.maxAngle);
    const maxH = 1 - Math.cos(maxRad);
    if (maxH < 1e-9) return { pe: 0, ke: 100 };
    const h = 1 - Math.cos(rad(Math.abs(angle)));
    const pe = clamp((h / maxH) * 100, 0, 100);
    return { pe, ke: 100 - pe };
  }

  function drawPendulum(ctx, w, h) {
    const pivotX = w * 0.34;
    const pivotY = h * 0.16;
    const length = Math.min(h * 0.56, w * 0.30);
    const angleRad = rad(pendState.angle);
    const bobX = pivotX + Math.sin(angleRad) * length;
    const bobY = pivotY + Math.cos(angleRad) * length;
    const maxRad = rad(pendState.maxAngle);

    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + length + 20);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.22)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, length, Math.PI / 2 - maxRad, Math.PI / 2 + maxRad);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
    ctx.fill();
    const bobR = 14;
    const grad = ctx.createRadialGradient(bobX - 4, bobY - 4, 2, bobX, bobY, bobR);
    grad.addColorStop(0, '#fca5a5');
    grad.addColorStop(1, '#ef4444');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bobX, bobY, bobR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const speed = Math.abs(Math.sin(angleRad)) * (Math.sin(pendState.phase) >= 0 ? -1 : 1);
    if (pendState.running && Math.abs(speed) > 0.08) {
      const tx = Math.cos(angleRad) * speed;
      const ty = -Math.sin(angleRad) * speed;
      const norm = Math.hypot(tx, ty) || 1;
      drawArrow(ctx, bobX, bobY, bobX + (tx / norm) * 34, bobY + (ty / norm) * 34, '#f59e0b', 2.4, 7);
      drawText(ctx, 'v', bobX + (tx / norm) * 44, bobY + (ty / norm) * 44, { color: '#b45309', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }

    drawText(ctx, '最低点', pivotX, pivotY + length + 34, { color: '#94a3b8', align: 'center', font: '600 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    const energy = pendulumEnergy(pendState.angle);
    const barX = w * 0.68;
    const barW = Math.min(w * 0.14, 44);
    const barH = h * 0.52;
    const barTop = h * 0.24;
    const bars = [
      { label: '重力势能', value: energy.pe, color: '#2563eb' },
      { label: '动能', value: energy.ke, color: '#f59e0b' },
      { label: '机械能', value: 100, color: '#10b981' }
    ];
    bars.forEach((bar, index) => {
      const x = barX + index * (barW + 20);
      ctx.save();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x, barTop, barW, barH);
      const fillH = (bar.value / 100) * (barH - 4);
      ctx.fillStyle = bar.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x + 2, barTop + barH - fillH - 2, barW - 4, fillH);
      ctx.restore();
      drawText(ctx, bar.label, x + barW / 2, barTop + barH + 20, { color: '#475569', align: 'center', font: '700 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, `${fmt(bar.value, 0)}%`, x + barW / 2, barTop - 12, { color: bar.color, align: 'center', font: '700 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    });
  }

  const renderPendulum = mountCanvas($('#canvasPendulum'), drawPendulum);

  function syncPendulum(fromInput = true) {
    if (fromInput) {
      $('#pendAngleOut').textContent = `${fmt(pendState.maxAngle, 0)}°`;
    }
    $('#pendAngleRead').textContent = `${fmt(pendState.angle, 0)}°`;
    const energy = pendulumEnergy(pendState.angle);
    $('#pendPE').textContent = `${fmt(energy.pe, 0)}%`;
    $('#pendKE').textContent = `${fmt(energy.ke, 0)}%`;
    $('#pendTotal').textContent = '100%';
    $('#pendPlay').textContent = pendState.running ? '暂停摆动' : '开始摆动';
    renderPendulum();
  }

  $('#pendAngle').addEventListener('input', event => {
    pendLoop.stop();
    pendState.running = false;
    pendState.maxAngle = Number(event.target.value);
    pendState.angle = pendState.maxAngle;
    pendState.phase = 0;
    syncPendulum();
  });

  $('#pendPlay').addEventListener('click', () => {
    if (pendState.running) {
      pendLoop.stop();
      pendState.running = false;
      syncPendulum(false);
      return;
    }
    if (pendState.maxAngle < 2) {
      pendState.maxAngle = 50;
      $('#pendAngle').value = 50;
    }
    const ratio = clamp(pendState.angle / pendState.maxAngle, -1, 1);
    pendState.phase = Math.acos(ratio);
    pendState.running = true;
    pendLoop.start();
    syncPendulum(false);
  });

  $('#pendReset').addEventListener('click', () => {
    pendLoop.stop();
    pendState.running = false;
    pendState.maxAngle = 50;
    pendState.angle = 50;
    pendState.phase = 0;
    $('#pendAngle').value = 50;
    syncPendulum();
  });

  syncPendulum();

  K.initQuiz([
    {
      q: '四冲程汽油机中，将机械能转化为内能的是：',
      options: ['吸气冲程', '压缩冲程', '做功冲程', '排气冲程'],
      answer: 1,
      explain: '压缩冲程中活塞向上运动，压缩气体做功，机械能转化为内能，气体温度升高。'
    },
    {
      q: '关于燃料的热值，下列说法正确的是：',
      options: [
        '燃料的质量越大，热值越大',
        '燃料燃烧越充分，热值越大',
        '热值是燃料的一种属性',
        '热值的单位是 J'
      ],
      answer: 2,
      explain: '热值是 1 kg 燃料完全燃烧放出的热量，是燃料的属性，与质量、是否完全燃烧无关。单位是 J/kg。'
    },
    {
      q: '2 kg 汽油完全燃烧放出的热量约为：（q汽油 = 4.6×10⁷ J/kg）',
      options: ['4.6×10⁷ J', '9.2×10⁷ J', '2.3×10⁷ J', '9.2×10⁶ J'],
      answer: 1,
      explain: 'Q放 = mq = 2 kg × 4.6×10⁷ J/kg = 9.2×10⁷ J。'
    },
    {
      q: '某热机消耗燃料放出 3.0×10⁷ J 的热量，用来做有用功的能量为 1.2×10⁷ J，效率是：',
      options: ['25%', '40%', '60%', '75%'],
      answer: 1,
      explain: 'η = W有用 / Q放 × 100% = 1.2×10⁷ ÷ 3.0×10⁷ × 100% = 40%。'
    },
    {
      q: '关于能量守恒定律，下列说法正确的是：',
      options: [
        '能量在转化过程中会逐渐消失',
        '能量只能从一种形式转化为另一种形式',
        '能量的总量保持不变',
        '热机效率可以达到 100%'
      ],
      answer: 2,
      explain: '能量既不会凭空消灭，也不会凭空产生，只会转化或转移，总量保持不变。热机效率不可能达到 100%。'
    },
    {
      q: '汽车发动机的一个工作循环中，曲轴转动的圈数是：',
      options: ['半圈', '1 圈', '2 圈', '4 圈'],
      answer: 2,
      explain: '四冲程内燃机一个工作循环中，活塞往复运动 2 次，曲轴转 2 圈，对外做功 1 次。'
    }
  ]);
})();

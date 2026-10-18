(() => {
  'use strict';

  const K = window.PhysicsKit;
  const {
    $, fmt, clamp, createAnimator, mountCanvas, drawText, drawArrow,
    makePlot, drawPlotGrid, drawPlotAxes, drawPlotDot
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
    '能说出分子热运动的基本观点',
    '能用扩散现象解释生活现象',
    '知道内能的概念和改变内能的两种方式',
    '理解比热容的含义，记住水的比热容',
    '能用 Q = cmΔt 进行热量计算'
  ], 'physics9a-ch13-goals');

  const waterParticles = Array.from({ length: 80 }, () => ({
    x: Math.random(),
    y: Math.random(),
    phase: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 0.8
  }));

  const inkParticles = Array.from({ length: 44 }, () => ({
    sx: 0.42 + (Math.random() - 0.5) * 0.08,
    sy: 0.16 + (Math.random() - 0.5) * 0.05,
    tx: 0.10 + Math.random() * 0.80,
    ty: 0.10 + Math.random() * 0.78,
    phase: Math.random() * Math.PI * 2,
    r: 2.2 + Math.random() * 2
  }));

  const diffState = { temp: 20, progress: 0 };
  const diffAnim = createAnimator();

  function beakerPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h - r);
    ctx.quadraticCurveTo(x, y + h, x + r, y + h);
    ctx.lineTo(x + w - r, y + h);
    ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
    ctx.lineTo(x + w, y);
  }

  function drawThermometer(ctx, x, top, bottom, value, max, color = '#ef4444') {
    const height = bottom - top;
    const level = clamp(value / max, 0, 1);
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 7, top);
    ctx.lineTo(x - 7, bottom - 12);
    ctx.arc(x, bottom - 4, 12, Math.PI, 0, true);
    ctx.lineTo(x + 7, top);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(x - 3, bottom - 14);
    ctx.lineTo(x - 3, bottom - 12 - (height - 22) * level);
    ctx.lineTo(x + 3, bottom - 12 - (height - 22) * level);
    ctx.lineTo(x + 3, bottom - 14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, bottom - 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    for (let i = 0; i <= 4; i += 1) {
      const y = bottom - 12 - ((height - 22) * i) / 4;
      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 8, y);
      ctx.lineTo(x + 14, y);
      ctx.stroke();
      ctx.restore();
    }
    drawText(ctx, `${fmt(value, 0)}℃`, x, top - 12, { color: '#475569', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  function drawDiffusion(ctx, w, h) {
    const bx = w * 0.10;
    const by = h * 0.15;
    const bw = w * 0.54;
    const bh = h * 0.72;
    const wx = bx + 8;
    const wy = by + bh * 0.26;
    const ww = bw - 16;
    const wh = bh * 0.70;

    ctx.save();
    const water = ctx.createLinearGradient(0, wy, 0, wy + wh);
    water.addColorStop(0, 'rgba(191, 219, 254, 0.55)');
    water.addColorStop(1, 'rgba(147, 197, 253, 0.78)');
    ctx.fillStyle = water;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.restore();

    beakerPath(ctx, bx, by, bw, bh, 16);
    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    const k = 0.8 + diffState.temp / 40;
    const spread = 1 - Math.exp(-diffState.progress * k);
    const time = diffState.progress * 9;

    waterParticles.forEach(p => {
      const wob = 0.006 + (diffState.temp / 100) * 0.012;
      const px = wx + clamp(p.x + Math.sin(time * p.speed + p.phase) * wob, 0.01, 0.99) * ww;
      const py = wy + clamp(p.y + Math.cos(time * p.speed + p.phase * 1.3) * wob, 0.01, 0.99) * wh;
      ctx.save();
      ctx.fillStyle = 'rgba(37, 99, 235, 0.45)';
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    inkParticles.forEach(p => {
      const mixX = p.sx + (p.tx - p.sx) * spread;
      const mixY = p.sy + (p.ty - p.sy) * spread;
      const wob = 0.006 + (diffState.temp / 100) * 0.016;
      const px = wx + clamp(mixX + Math.sin(time * 1.3 + p.phase) * wob, 0.01, 0.99) * ww;
      const py = wy + clamp(mixY + Math.cos(time * 1.1 + p.phase) * wob, 0.01, 0.99) * wh;
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.82)';
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (diffState.progress < 0.08) {
      drawText(ctx, '墨水', wx + ww * 0.42, wy + wh * 0.08, { color: '#b91c1c', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawArrow(ctx, wx + ww * 0.42, wy + wh * 0.12, wx + ww * 0.42, wy + wh * 0.18, '#ef4444', 2, 6);
    }

    drawThermometer(ctx, w * 0.78, h * 0.24, h * 0.82, diffState.temp, 100);

    drawText(ctx, '水', bx + bw / 2, by + bh + 22, { color: '#475569', align: 'center', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, '扩散程度', w * 0.78, h * 0.90, { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `${Math.round(spread * 100)}%`, w * 0.78, h * 0.95, { color: '#2563eb', align: 'center', font: '800 16px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderDiffusion = mountCanvas($('#canvasDiffusion'), drawDiffusion);
  const diffTemp = $('#diffTemp');

  function syncDiffusion() {
    diffTemp.value = diffState.temp;
    $('#diffTempOut').textContent = `${fmt(diffState.temp, 0)}℃`;
    $('#diffTempRead').textContent = `${fmt(diffState.temp, 0)}℃`;
    $('#diffSpeedRead').textContent = diffState.temp < 25 ? '较慢' : diffState.temp < 65 ? '较快' : '很快';
    const spread = 1 - Math.exp(-diffState.progress * (0.8 + diffState.temp / 40));
    $('#diffMixRead').textContent = `${Math.round(spread * 100)}%`;
    renderDiffusion();
  }

  diffTemp.addEventListener('input', () => {
    diffState.temp = Number(diffTemp.value);
    syncDiffusion();
  });

  $('#diffPlay').addEventListener('click', () => {
    diffAnim.cancel();
    diffState.progress = 0;
    syncDiffusion();
    diffAnim.value(0, 1, 4600, value => {
      diffState.progress = value;
      syncDiffusion();
    });
  });

  $('#diffReset').addEventListener('click', () => {
    diffAnim.cancel();
    diffState.temp = 20;
    diffState.progress = 0;
    syncDiffusion();
  });

  syncDiffusion();

  const pistonState = { volume: 0.55, mode: 'idle' };
  const pistonAnim = createAnimator();
  const pistonParticles = Array.from({ length: 30 }, () => ({
    x: 0.12 + Math.random() * 0.76,
    y: 0.10 + Math.random() * 0.80,
    phase: Math.random() * Math.PI * 2
  }));

  function pistonTemperature() {
    return clamp(20 + (0.55 - pistonState.volume) * 220, 0, 90);
  }

  function drawPiston(ctx, w, h) {
    const cx = w * 0.5;
    const cw = w * 0.34;
    const top = h * 0.14;
    const bottom = h * 0.88;
    const left = cx - cw / 2;
    const right = cx + cw / 2;
    const temp = pistonTemperature();
    const vFrac = clamp((pistonState.volume - 0.35) / 0.35, 0, 1);
    const pistonY = top + (1 - vFrac) * (bottom - top - 18);

    ctx.save();
    const gas = ctx.createLinearGradient(0, pistonY, 0, bottom);
    const heat = clamp(temp / 80, 0, 1);
    gas.addColorStop(0, `rgba(${Math.round(125 + 130 * heat)}, ${Math.round(211 - 120 * heat)}, ${Math.round(252 - 180 * heat)}, 0.55)`);
    gas.addColorStop(1, `rgba(${Math.round(186 + 69 * heat)}, ${Math.round(230 - 150 * heat)}, ${Math.round(253 - 150 * heat)}, 0.75)`);
    ctx.fillStyle = gas;
    ctx.fillRect(left + 6, pistonY, cw - 12, bottom - pistonY - 5);
    ctx.restore();

    pistonParticles.forEach(p => {
      const wob = 0.018 + heat * 0.02;
      const px = left + 12 + clamp(p.x + Math.sin(temp * 0.3 + p.phase) * wob, 0.02, 0.98) * (cw - 24);
      const py = pistonY + 10 + clamp(p.y + Math.cos(temp * 0.25 + p.phase) * wob, 0.02, 0.98) * Math.max(8, bottom - pistonY - 20);
      ctx.save();
      ctx.fillStyle = `rgba(239, 68, 68, ${0.35 + heat * 0.5})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right, top);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(left + 3, pistonY, cw - 6, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 6, top - 6, 12, pistonY - top + 6);
    ctx.strokeRect(cx - 6, top - 6, 12, pistonY - top + 6);
    ctx.restore();

    drawText(ctx, '活塞', cx, pistonY + 8, { color: '#0f172a', align: 'center', font: '700 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    if (pistonState.mode === 'compress') {
      drawArrow(ctx, cx, top - 34, cx, top + 4, '#ef4444', 2.6, 8);
      drawText(ctx, '外界对气体做功', cx + 12, top - 22, { color: '#b91c1c', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    } else if (pistonState.mode === 'expand') {
      drawArrow(ctx, cx, top + 6, cx, top - 34, '#2563eb', 2.6, 8);
      drawText(ctx, '气体对外做功', cx + 12, top - 22, { color: '#1d4ed8', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }

    drawText(ctx, `气体温度 ${fmt(temp, 0)}℃`, cx, bottom + 24, { color: temp > 40 ? '#b91c1c' : '#1d4ed8', align: 'center', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderPiston = mountCanvas($('#canvasPiston'), drawPiston);

  function syncPiston() {
    const temp = pistonTemperature();
    $('#pistonVolume').textContent = `${fmt(pistonState.volume * 10, 1)} L`;
    $('#pistonTemp').textContent = `${fmt(temp, 0)}℃`;
    $('#pistonEnergy').textContent = temp > 42 ? '较大' : temp > 24 ? '中等' : '较小';
    $('#pistonConvert').textContent = pistonState.mode === 'compress'
      ? '机械能 → 内能'
      : pistonState.mode === 'expand'
        ? '内能 → 机械能'
        : '—';
    renderPiston();
  }

  function movePiston(target, mode) {
    pistonAnim.cancel();
    pistonState.mode = mode;
    syncPiston();
    const from = pistonState.volume;
    pistonAnim.value(from, target, 1100, value => {
      pistonState.volume = value;
      syncPiston();
    }, () => {
      pistonState.mode = 'idle';
      syncPiston();
    });
  }

  $('#pistonCompress').addEventListener('click', () => movePiston(0.35, 'compress'));
  $('#pistonExpand').addEventListener('click', () => movePiston(0.70, 'expand'));
  $('#pistonReset').addEventListener('click', () => {
    pistonAnim.cancel();
    pistonState.volume = 0.55;
    pistonState.mode = 'idle';
    syncPiston();
  });

  syncPiston();

  const heatState = { time: 0 };
  const heatAnim = createAnimator();
  const HEAT_POWER = 1000;
  const HEAT_MASS = 1;

  function waterTemp(t) {
    return 20 + (HEAT_POWER * 60 * t) / (4200 * HEAT_MASS);
  }

  function oilTemp(t) {
    return 20 + (HEAT_POWER * 60 * t) / (2100 * HEAT_MASS);
  }

  function drawPartialLine(ctx, P, fn, tEnd, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const samples = 120;
    for (let i = 0; i <= samples; i += 1) {
      const t = (tEnd * i) / samples;
      const y = fn(t);
      if (i === 0) ctx.moveTo(P.X(t), P.Y(y));
      else ctx.lineTo(P.X(t), P.Y(y));
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawHeatCurves(ctx, w, h) {
    const P = makePlot(w, h, 0, 5, 0, 180, 48);
    drawPlotGrid(ctx, P, 1, 30);
    drawPlotAxes(ctx, P, { stepX: 1, stepY: 30, xLabel: 't/min', yLabel: 'T/℃' });

    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let t = 0; t <= 5 + 1e-9; t += 0.05) {
      if (t === 0) ctx.moveTo(P.X(t), P.Y(waterTemp(t)));
      else ctx.lineTo(P.X(t), P.Y(waterTemp(t)));
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
    ctx.beginPath();
    for (let t = 0; t <= 5 + 1e-9; t += 0.05) {
      if (t === 0) ctx.moveTo(P.X(t), P.Y(oilTemp(t)));
      else ctx.lineTo(P.X(t), P.Y(oilTemp(t)));
    }
    ctx.stroke();
    ctx.restore();

    drawPartialLine(ctx, P, waterTemp, heatState.time, '#2563eb', 2.8);
    drawPartialLine(ctx, P, oilTemp, heatState.time, '#f59e0b', 2.8);

    if (heatState.time > 0.02) {
      drawPlotDot(ctx, P, heatState.time, waterTemp(heatState.time), '#2563eb', 5, '水', 8, -10);
      drawPlotDot(ctx, P, heatState.time, oilTemp(heatState.time), '#f59e0b', 5, '煤油', 8, -10);
    } else {
      drawPlotDot(ctx, P, 0, 20, '#2563eb', 5);
      drawPlotDot(ctx, P, 0, 20, '#f59e0b', 5);
    }

    drawText(ctx, '质量相同、加热功率相同', P.X(2.5), P.Y(172), { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderHeatCurves = mountCanvas($('#canvasHeatCurves'), drawHeatCurves);
  const heatTime = $('#heatTime');

  function syncHeatCurves() {
    heatTime.value = heatState.time;
    $('#heatTimeOut').textContent = `${fmt(heatState.time, 1)} min`;
    $('#heatQ').textContent = `${sci(HEAT_POWER * 60 * heatState.time)} J`;
    $('#heatWaterT').textContent = `${fmt(waterTemp(heatState.time), 1)}℃`;
    $('#heatOilT').textContent = `${fmt(oilTemp(heatState.time), 1)}℃`;
    $('#heatFaster').textContent = heatState.time < 0.05 ? '—' : '煤油';
    renderHeatCurves();
  }

  heatTime.addEventListener('input', () => {
    heatAnim.cancel();
    heatState.time = Number(heatTime.value);
    syncHeatCurves();
  });

  $('#heatPlay').addEventListener('click', () => {
    heatAnim.cancel();
    heatState.time = 0;
    syncHeatCurves();
    heatAnim.value(0, 5, 4800, value => {
      heatState.time = value;
      syncHeatCurves();
    });
  });

  $('#heatReset').addEventListener('click', () => {
    heatAnim.cancel();
    heatState.time = 0;
    syncHeatCurves();
  });

  syncHeatCurves();

  const materials = {
    water: { name: '水', c: 4200, color: '#60a5fa' },
    iron: { name: '铁', c: 460, color: '#64748b' },
    aluminum: { name: '铝', c: 880, color: '#cbd5e1' }
  };
  const calcState = { material: 'water', mass: 2, delta: 30 };
  const calcButtons = Array.from(document.querySelectorAll('[data-material]'));

  function calcQ() {
    return materials[calcState.material].c * calcState.mass * calcState.delta;
  }

  function drawHeatCalc(ctx, w, h) {
    const mat = materials[calcState.material];
    const q = calcQ();
    const qMax = materials[calcState.material].c * 5 * 80;
    const targetT = 20 + calcState.delta;

    const bx = w * 0.08;
    const by = h * 0.24;
    const bw = w * 0.30;
    const bh = h * 0.54;

    ctx.save();
    beakerPath(ctx, bx, by, bw, bh, 14);
    ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx + 5, by + bh * 0.24, bw - 10, bh * 0.72);
    ctx.fillStyle = mat.color;
    ctx.globalAlpha = 0.65;
    ctx.fill();
    ctx.restore();

    drawText(ctx, mat.name, bx + bw / 2, by + bh * 0.58, { color: '#0f172a', align: 'center', font: '800 18px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `${fmt(calcState.mass, 1)} kg`, bx + bw / 2, by + bh * 0.72, { color: '#334155', align: 'center', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    for (let i = 0; i < 3; i += 1) {
      const y = by + bh + 14 + i * 9;
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.22, y);
      ctx.quadraticCurveTo(bx + bw * 0.34, y - 5, bx + bw * 0.46, y);
      ctx.quadraticCurveTo(bx + bw * 0.58, y + 5, bx + bw * 0.70, y);
      ctx.stroke();
      ctx.restore();
    }
    drawText(ctx, '吸热', bx + bw / 2, by + bh + 46, { color: '#b91c1c', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    drawThermometer(ctx, w * 0.52, h * 0.18, h * 0.82, targetT, 120);

    const barX = w * 0.68;
    const barY = h * 0.20;
    const barW = Math.max(26, w * 0.14);
    const barH = h * 0.56;
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);
    const fillH = (barH - 4) * clamp(q / qMax, 0.02, 1);
    const grad = ctx.createLinearGradient(0, barY + barH, 0, barY);
    grad.addColorStop(0, '#93c5fd');
    grad.addColorStop(1, '#2563eb');
    ctx.fillStyle = grad;
    ctx.fillRect(barX + 2, barY + barH - fillH - 2, barW - 4, fillH);
    ctx.restore();
    drawText(ctx, '热量', barX + barW / 2, barY - 14, { color: '#475569', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, sci(q), barX + barW / 2, barY + barH + 18, { color: '#2563eb', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, 'J', barX + barW / 2, barY + barH + 34, { color: '#64748b', align: 'center', font: '600 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderHeatCalc = mountCanvas($('#canvasHeatCalc'), drawHeatCalc);

  function syncHeatCalc() {
    const mat = materials[calcState.material];
    const q = calcQ();
    $('#calcMaterial').textContent = mat.name;
    $('#calcC').textContent = `${mat.c.toLocaleString('en-US')} J/(kg·℃)`;
    $('#calcQ').textContent = `${sci(q)} J`;
    $('#calcKJ').textContent = `${fmt(q / 1000, 1)} kJ`;
    $('#calcMassOut').textContent = `${fmt(calcState.mass, 1)} kg`;
    $('#calcDeltaOut').textContent = `${fmt(calcState.delta, 0)}℃`;
    calcButtons.forEach(button => {
      const active = button.dataset.material === calcState.material;
      button.classList.toggle('is-active', active);
      button.classList.toggle('ghost', !active);
    });
    renderHeatCalc();
  }

  calcButtons.forEach(button => {
    button.addEventListener('click', () => {
      calcState.material = button.dataset.material;
      syncHeatCalc();
    });
  });

  $('#calcMass').addEventListener('input', event => {
    calcState.mass = Number(event.target.value);
    syncHeatCalc();
  });

  $('#calcDelta').addEventListener('input', event => {
    calcState.delta = Number(event.target.value);
    syncHeatCalc();
  });

  $('#calcReset').addEventListener('click', () => {
    calcState.material = 'water';
    calcState.mass = 2;
    calcState.delta = 30;
    $('#calcMass').value = 2;
    $('#calcDelta').value = 30;
    syncHeatCalc();
  });

  syncHeatCalc();

  K.initQuiz([
    {
      q: '下列现象中，能说明分子在不停地做无规则运动的是：',
      options: ['春天柳絮飞舞', '炒菜时闻到香味', '秋天落叶纷飞', '冬天雪花飘落'],
      answer: 1,
      explain: '炒菜时香味分子进入空气，是扩散现象，说明分子在不停地做无规则运动。柳絮、落叶、雪花都是宏观物体的运动。'
    },
    {
      q: '下列改变内能的方式中，属于做功的是：',
      options: ['用热水袋取暖', '把手放在火炉旁', '反复弯折铁丝使弯折处变热', '喝热水使身体变暖'],
      answer: 2,
      explain: '反复弯折铁丝是克服分子间作用力做功，机械能转化为内能。其余三项都是热传递。'
    },
    {
      q: '2 kg 的水温度升高 30℃，吸收的热量是：',
      options: ['2.52×10⁴ J', '2.52×10⁵ J', '8.4×10⁴ J', '8.4×10⁵ J'],
      answer: 1,
      explain: 'Q = cmΔt = 4.2×10³ J/(kg·℃) × 2 kg × 30℃ = 2.52×10⁵ J。'
    },
    {
      q: '关于比热容，下列说法正确的是：',
      options: [
        '比热容与物体的质量有关',
        '比热容与温度变化有关',
        '比热容是物质的一种属性',
        '水的比热容比煤油小'
      ],
      answer: 2,
      explain: '比热容是物质的一种属性，与质量、温度变化无关。水的比热容比煤油大。'
    },
    {
      q: '关于内能，下列说法正确的是：',
      options: [
        '0℃ 的冰没有内能',
        '温度越高的物体内能一定越大',
        '一切物体都有内能',
        '内能增加时温度一定升高'
      ],
      answer: 2,
      explain: '一切物体都有内能。内能大小还与质量、状态有关；晶体熔化时内能增加但温度不变。'
    },
    {
      q: '“物体吸收了热量”这句话说明：',
      options: [
        '物体的热量增加了',
        '物体的内能一定增加了',
        '物体的温度一定升高了',
        '热量是物体本身具有的'
      ],
      answer: 1,
      explain: '吸收热量通常使内能增加。但热量是过程量，不能说物体“含有热量”；晶体熔化时吸热但温度不变。'
    }
  ]);
})();

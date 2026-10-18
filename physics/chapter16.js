(() => {
  'use strict';

  const K = window.PhysicsKit;
  const {
    $, fmt, clamp, createLoop, mountCanvas, drawText, drawArrow,
    drawWire, drawBattery, drawLamp, drawMeter, drawResistor, drawRheostat
  } = K;

  K.initChecklist([
    '知道电压的作用和单位，记住常见电压值',
    '会正确连接电压表并读数',
    '掌握串联和并联电路的电压规律',
    '知道电阻的含义和影响因素',
    '理解滑动变阻器的原理和正确接法'
  ], 'physics9a-ch16-goals');

  const voltageState = { source: 6, target: 'lamp' };
  const R_LAMP = 20;
  const R_FIXED = 10;

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

  function drawFlow(ctx, points, phase, color, count = 8) {
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

  function voltageLamp() {
    return voltageState.source * R_LAMP / (R_LAMP + R_FIXED);
  }

  function voltageFixed() {
    return voltageState.source * R_FIXED / (R_LAMP + R_FIXED);
  }

  function drawVoltage(ctx, w, h) {
    const x1 = w * 0.28;
    const x2 = w * 0.64;
    const y1 = h * 0.24;
    const y2 = h * 0.78;
    const midY = (y1 + y2) / 2;
    const lampR = 15;
    const batteryLen = 38;
    const mx = voltageState.target === 'lamp' ? w * 0.84 : w * 0.10;

    drawWire(ctx, [[x1, y2], [x1, midY + batteryLen / 2]], '#334155', 2.6);
    drawBattery(ctx, x1, midY, batteryLen, true, '电源');
    drawWire(ctx, [[x1, midY - batteryLen / 2], [x1, y1]], '#334155', 2.6);
    drawWire(ctx, [[x1, y1], [w * 0.42 - 30, y1]], '#334155', 2.6);
    drawResistor(ctx, w * 0.42, y1, 44, false, 'R定');
    drawWire(ctx, [[w * 0.42 + 30, y1], [x2, y1]], '#334155', 2.6);
    drawWire(ctx, [[x2, y1], [x2, midY - lampR]], '#334155', 2.6);
    drawLamp(ctx, x2, midY, true, lampR, 'L');
    drawWire(ctx, [[x2, midY + lampR], [x2, y2]], '#334155', 2.6);
    drawWire(ctx, [[x2, y2], [x1, y2]], '#334155', 2.6);

    const anchor = voltageState.target === 'lamp' ? x2 : x1;
    drawWire(ctx, [[anchor, y1], [mx, y1], [mx, midY - 18]], '#94a3b8', 1.8);
    drawWire(ctx, [[anchor, y2], [mx, y2], [mx, midY + 18]], '#94a3b8', 1.8);
    drawMeter(ctx, mx, midY, 'V', 16);
    drawText(ctx, '+', mx - 22, midY - 10, { color: '#ef4444', font: '800 12px ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, '−', mx - 22, midY + 16, { color: '#2563eb', font: '800 12px ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, voltageState.target === 'lamp' ? `${fmt(voltageLamp(), 1)} V` : `${fmt(voltageState.source, 1)} V`, mx, midY + 36, { color: '#1d4ed8', align: 'center', font: '800 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    drawText(ctx, '电压表并联', mx, h * 0.88, { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, '串联分压：电阻越大，分得电压越多', w / 2, h * 0.94, { color: '#475569', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderVoltage = mountCanvas($('#canvasVoltage'), drawVoltage);
  const targetButtons = Array.from(document.querySelectorAll('[data-target]'));

  function syncVoltage() {
    const lampU = voltageLamp();
    const fixedU = voltageFixed();
    $('#voltageTargetRead').textContent = voltageState.target === 'lamp' ? '灯泡两端' : '电源两端';
    $('#voltageReading').textContent = `${fmt(voltageState.target === 'lamp' ? lampU : voltageState.source, 1)} V`;
    $('#voltageLampRead').textContent = `${fmt(lampU, 1)} V`;
    $('#voltageResistorRead').textContent = `${fmt(fixedU, 1)} V`;
    $('#voltageSourceOut').textContent = `${fmt(voltageState.source, 1)} V`;
    targetButtons.forEach(button => {
      const active = button.dataset.target === voltageState.target;
      button.classList.toggle('is-active', active);
      button.classList.toggle('ghost', !active);
    });
    renderVoltage();
  }

  targetButtons.forEach(button => {
    button.addEventListener('click', () => {
      voltageState.target = button.dataset.target;
      syncVoltage();
    });
  });

  $('#voltageSource').addEventListener('input', event => {
    voltageState.source = Number(event.target.value);
    syncVoltage();
  });

  $('#voltageReset').addEventListener('click', () => {
    voltageState.source = 6;
    voltageState.target = 'lamp';
    $('#voltageSource').value = 6;
    syncVoltage();
  });

  syncVoltage();

  const rulesState = { type: 'series', source: 6, r1: 10, r2: 20 };

  function ruleValues() {
    if (rulesState.type === 'series') {
      const total = rulesState.r1 + rulesState.r2;
      return {
        u1: rulesState.source * rulesState.r1 / total,
        u2: rulesState.source * rulesState.r2 / total,
        total: rulesState.source
      };
    }
    return { u1: rulesState.source, u2: rulesState.source, total: rulesState.source };
  }

  function voltmeterAcross(ctx, x, y, dir, value, label) {
    const r = 14;
    const dy = dir * 42;
    drawWire(ctx, [[x - r, y], [x - r, y + dy], [x - 15, y + dy]], '#94a3b8', 1.8);
    drawMeter(ctx, x, y + dy, 'V', 15);
    drawWire(ctx, [[x + 15, y + dy], [x + r, y + dy], [x + r, y]], '#94a3b8', 1.8);
    const textY = y + dy + (dir > 0 ? 30 : -22);
    drawText(ctx, `${fmt(value, 1)} V`, x, textY, { color: '#1d4ed8', align: 'center', font: '800 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, label, x, textY + (dir > 0 ? 15 : -15), { color: '#64748b', align: 'center', font: '600 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  function drawRules(ctx, w, h) {
    const x1 = w * 0.16;
    const x2 = w * 0.84;
    const y1 = h * 0.30;
    const y2 = h * 0.72;
    const midY = (y1 + y2) / 2;
    const batteryLen = 36;
    const values = ruleValues();

    drawWire(ctx, [[x1, y2], [x1, midY + batteryLen / 2]], '#334155', 2.6);
    drawBattery(ctx, x1, midY, batteryLen, true, '电源');
    drawWire(ctx, [[x1, midY - batteryLen / 2], [x1, y1]], '#334155', 2.6);

    if (rulesState.type === 'series') {
      const l1x = w * 0.42;
      const l2x = w * 0.64;
      drawWire(ctx, [[x1, y1], [l1x - 15, y1]], '#334155', 2.6);
      drawLamp(ctx, l1x, y1, true, 15, 'L₁');
      drawWire(ctx, [[l1x + 15, y1], [l2x - 15, y1]], '#334155', 2.6);
      drawLamp(ctx, l2x, y1, true, 15, 'L₂');
      drawWire(ctx, [[l2x + 15, y1], [x2, y1], [x2, y2], [x1, y2]], '#334155', 2.6);
      voltmeterAcross(ctx, l1x, y1, 1, values.u1, 'V₁');
      voltmeterAcross(ctx, l2x, y1, 1, values.u2, 'V₂');
      drawText(ctx, '串联：U = U₁ + U₂', w / 2, h * 0.93, { color: '#1d4ed8', align: 'center', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    } else {
      const l1x = w * 0.56;
      const l2x = w * 0.56;
      drawWire(ctx, [[x1, y1], [l1x - 15, y1]], '#334155', 2.6);
      drawLamp(ctx, l1x, y1, true, 15, 'L₁');
      drawWire(ctx, [[l1x + 15, y1], [x2, y1]], '#334155', 2.6);
      drawWire(ctx, [[x1, y2], [l2x - 15, y2]], '#334155', 2.6);
      drawLamp(ctx, l2x, y2, true, 15, 'L₂');
      drawWire(ctx, [[l2x + 15, y2], [x2, y2]], '#334155', 2.6);
      drawWire(ctx, [[x2, y1], [x2, y2]], '#334155', 2.6);
      voltmeterAcross(ctx, l1x, y1, -1, values.u1, 'V₁');
      voltmeterAcross(ctx, l2x, y2, -1, values.u2, 'V₂');
      drawText(ctx, '并联：U = U₁ = U₂', w / 2, h * 0.93, { color: '#047857', align: 'center', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }
  }

  const renderRules = mountCanvas($('#canvasVoltageRules'), drawRules);

  function syncRules() {
    const values = ruleValues();
    $('#voltType').textContent = rulesState.type === 'series' ? '串联' : '并联';
    $('#voltU1').textContent = `${fmt(values.u1, 1)} V`;
    $('#voltU2').textContent = `${fmt(values.u2, 1)} V`;
    $('#voltTotal').textContent = `${fmt(values.total, 1)} V`;
    $('#voltRule').textContent = rulesState.type === 'series' ? 'U = U₁ + U₂' : 'U = U₁ = U₂';
    $('#voltSourceOut').textContent = `${fmt(rulesState.source, 1)} V`;
    $('#voltR1Out').textContent = `${fmt(rulesState.r1, 0)} Ω`;
    $('#voltR2Out').textContent = `${fmt(rulesState.r2, 0)} Ω`;
    $('#voltSeries').classList.toggle('is-active', rulesState.type === 'series');
    $('#voltParallel').classList.toggle('is-active', rulesState.type === 'parallel');
    $('#voltSeries').classList.toggle('ghost', rulesState.type !== 'series');
    $('#voltParallel').classList.toggle('ghost', rulesState.type !== 'parallel');
    renderRules();
  }

  $('#voltSeries').addEventListener('click', () => {
    rulesState.type = 'series';
    syncRules();
  });
  $('#voltParallel').addEventListener('click', () => {
    rulesState.type = 'parallel';
    syncRules();
  });
  $('#voltSource2').addEventListener('input', event => {
    rulesState.source = Number(event.target.value);
    syncRules();
  });
  $('#voltR1').addEventListener('input', event => {
    rulesState.r1 = Number(event.target.value);
    syncRules();
  });
  $('#voltR2').addEventListener('input', event => {
    rulesState.r2 = Number(event.target.value);
    syncRules();
  });

  syncRules();

  const resistMaterials = {
    copper: { name: '铜', rho: 0.017, color: '#c2410c' },
    iron: { name: '铁', rho: 0.10, color: '#64748b' },
    nichrome: { name: '镍铬合金', rho: 1.1, color: '#475569' }
  };
  const resistState = { material: 'copper', length: 1, area: 1 };
  const resistButtons = Array.from(document.querySelectorAll('[data-resist]'));

  function resistValue() {
    return resistMaterials[resistState.material].rho * resistState.length / resistState.area;
  }

  function drawResistance(ctx, w, h) {
    const mat = resistMaterials[resistState.material];
    const R = resistValue();
    const xStart = w * 0.12;
    const maxLen = w * 0.72;
    const len = maxLen * (resistState.length / 2);
    const thickness = 5 + (resistState.area / 2) * 9;
    const wireY = h * 0.34;
    const barMax = 5;
    const barX = w * 0.12;
    const barY = h * 0.78;
    const barW = w * 0.76;
    const barH = 16;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = mat.color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(xStart, wireY);
    ctx.lineTo(xStart + len, wireY);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 7; i += 1) {
      const x = xStart + 10 + ((len - 20) * i) / 6;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(x, wireY, Math.min(3.2, thickness * 0.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = mat.color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    drawArrow(ctx, xStart, h * 0.52, xStart + len, h * 0.52, '#2563eb', 1.6, 6);
    drawArrow(ctx, xStart + len, h * 0.52, xStart, h * 0.52, '#2563eb', 1.6, 6);
    drawText(ctx, `L = ${fmt(resistState.length, 1)} m`, xStart + len / 2, h * 0.60, { color: '#1d4ed8', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `S = ${fmt(resistState.area, 1)} mm²`, w * 0.83, wireY + 28, { color: '#475569', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, mat.name, xStart, wireY - 26, { color: mat.color, font: '800 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    ctx.save();
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeRect(barX, barY, barW, barH);
    const fillW = (barW - 4) * clamp(R / barMax, 0.005, 1);
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, '#93c5fd');
    grad.addColorStop(1, '#2563eb');
    ctx.fillStyle = grad;
    ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);
    ctx.restore();
    drawText(ctx, '电阻 R', barX, barY - 10, { color: '#475569', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `${fmt(R, R < 0.1 ? 3 : 2)} Ω`, barX + barW + 8, barY + barH / 2, { color: '#2563eb', font: '800 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderResistance = mountCanvas($('#canvasResistance'), drawResistance);

  function syncResistance() {
    const mat = resistMaterials[resistState.material];
    const R = resistValue();
    $('#resMaterial').textContent = mat.name;
    $('#resRho').textContent = `${mat.rho} Ω·mm²/m`;
    $('#resLengthRead').textContent = `${fmt(resistState.length, 1)} m`;
    $('#resAreaRead').textContent = `${fmt(resistState.area, 1)} mm²`;
    $('#resR').textContent = `${fmt(R, R < 0.1 ? 3 : 2)} Ω`;
    $('#resLengthOut').textContent = `${fmt(resistState.length, 1)} m`;
    $('#resAreaOut').textContent = `${fmt(resistState.area, 1)} mm²`;
    resistButtons.forEach(button => {
      const active = button.dataset.resist === resistState.material;
      button.classList.toggle('is-active', active);
      button.classList.toggle('ghost', !active);
    });
    renderResistance();
  }

  resistButtons.forEach(button => {
    button.addEventListener('click', () => {
      resistState.material = button.dataset.resist;
      syncResistance();
    });
  });

  $('#resLength').addEventListener('input', event => {
    resistState.length = Number(event.target.value);
    syncResistance();
  });
  $('#resArea').addEventListener('input', event => {
    resistState.area = Number(event.target.value);
    syncResistance();
  });
  $('#resReset').addEventListener('click', () => {
    resistState.material = 'copper';
    resistState.length = 1;
    resistState.area = 1;
    $('#resLength').value = 1;
    $('#resArea').value = 1;
    syncResistance();
  });

  syncResistance();

  const rheoState = { pos: 0.5, source: 6, lampR: 10, maxR: 20, phase: 0 };
  const rheoLoop = createLoop(dt => {
    rheoState.phase = (rheoState.phase + dt * 0.25) % 1;
    renderRheostat();
  });

  function rheoValues() {
    const r = rheoState.maxR * rheoState.pos;
    const current = rheoState.source / (rheoState.lampR + r);
    return {
      r,
      current,
      lampU: current * rheoState.lampR,
      power: current * current * rheoState.lampR
    };
  }

  function drawRheostatDemo(ctx, w, h) {
    const values = rheoValues();
    const x1 = w * 0.18;
    const x2 = w * 0.82;
    const y1 = h * 0.26;
    const y2 = h * 0.70;
    const midY = (y1 + y2) / 2;
    const midX = (x1 + x2) / 2;
    const batteryLen = 36;
    const lampR = 15;
    const rheoLen = 90;

    drawWire(ctx, [[x1, y2], [x1, midY + batteryLen / 2]], '#334155', 2.6);
    drawBattery(ctx, x1, midY, batteryLen, true, '电源');
    drawWire(ctx, [[x1, midY - batteryLen / 2], [x1, y1]], '#334155', 2.6);
    drawWire(ctx, [[x1, y1], [midX - lampR, y1]], '#334155', 2.6);
    drawLamp(ctx, midX, y1, values.power > 0.05, lampR, 'L');
    drawWire(ctx, [[midX + lampR, y1], [x2, y1], [x2, y2], [midX + rheoLen / 2, y2]], '#334155', 2.6);
    drawRheostat(ctx, midX, y2, rheoLen, rheoState.pos, 'R变');
    drawWire(ctx, [[midX - rheoLen / 2, y2], [x1, y2]], '#334155', 2.6);

    if (values.power > 0.9) {
      const glow = ctx.createRadialGradient(midX, y1, 3, midX, y1, 40);
      glow.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.save();
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(midX, y1, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawFlow(ctx, [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]], rheoState.phase, '#2563eb', 8);

    drawText(ctx, '滑动变阻器与灯泡串联', w / 2, h * 0.88, { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `R总 = ${fmt(rheoState.lampR, 0)} Ω + ${fmt(values.r, 1)} Ω = ${fmt(rheoState.lampR + values.r, 1)} Ω`, w / 2, h * 0.94, { color: '#2563eb', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderRheostat = mountCanvas($('#canvasRheostat'), drawRheostatDemo);

  function syncRheostat() {
    const values = rheoValues();
    $('#rheoR').textContent = `${fmt(values.r, 1)} Ω`;
    $('#rheoCurrent').textContent = `${fmt(values.current, 2)} A`;
    $('#rheoLampU').textContent = `${fmt(values.lampU, 1)} V`;
    $('#rheoBright').textContent = values.power > 1.5 ? '很亮' : values.power > 0.6 ? '较亮' : values.power > 0.2 ? '较暗' : '很暗';
    $('#rheoPosOut').textContent = `${fmt(rheoState.pos * 100, 0)}%`;
    $('#rheoSourceOut').textContent = `${fmt(rheoState.source, 1)} V`;
    renderRheostat();
  }

  $('#rheoPos').addEventListener('input', event => {
    rheoState.pos = Number(event.target.value) / 100;
    syncRheostat();
  });
  $('#rheoSource').addEventListener('input', event => {
    rheoState.source = Number(event.target.value);
    syncRheostat();
  });
  $('#rheoReset').addEventListener('click', () => {
    rheoState.pos = 0.5;
    rheoState.source = 6;
    $('#rheoPos').value = 50;
    $('#rheoSource').value = 6;
    syncRheostat();
  });

  syncRheostat();
  rheoLoop.start();

  K.initQuiz([
    {
      q: '关于电压，下列说法正确的是：',
      options: [
        '电压是形成电流的原因',
        '电路中有电压就一定有电流',
        '电压的单位是欧姆',
        '一节干电池的电压是 2 V'
      ],
      answer: 0,
      explain: '电压是形成电流的原因，但电路还必须闭合才有电流。电压单位是伏特（V），一节干电池电压是 1.5 V。'
    },
    {
      q: '使用电压表时，正确的做法是：',
      options: [
        '与被测用电器串联',
        '与被测用电器并联',
        '电流从“−”接线柱流入',
        '不需要考虑量程'
      ],
      answer: 1,
      explain: '电压表应并联在被测用电器两端，电流从“+”接线柱流入、“−”接线柱流出，被测电压不能超过量程。'
    },
    {
      q: '两个电阻串联接在 6 V 电源上，R₁ = 10 Ω，R₂ = 20 Ω，则 R₁ 两端电压为：',
      options: ['2 V', '3 V', '4 V', '6 V'],
      answer: 0,
      explain: '串联分压：U₁ = U × R₁/(R₁+R₂) = 6 × 10/30 = 2 V。'
    },
    {
      q: '两个电阻并联接在电源上，它们两端的电压：',
      options: ['一定相等', '电阻大的电压大', '电阻小的电压大', '无法判断'],
      answer: 0,
      explain: '并联电路中各支路两端电压相等，都等于电源电压。电阻大小影响的是各支路电流。'
    },
    {
      q: '关于导体电阻，下列说法正确的是：',
      options: [
        '导体两端电压越大，电阻越大',
        '通过导体的电流越大，电阻越小',
        '电阻是导体本身的一种性质',
        '导体越长，电阻一定越小'
      ],
      answer: 2,
      explain: '电阻是导体本身的性质，与电压、电流无关。同种材料、同横截面积时，导体越长电阻越大。'
    },
    {
      q: '滑动变阻器正确接入电路的方法是：',
      options: [
        '接两个上接线柱',
        '接两个下接线柱',
        '“一上一下”接入',
        '任意两个接线柱都可以'
      ],
      answer: 2,
      explain: '滑动变阻器要“一上一下”接入，才能通过移动滑片改变接入电路的电阻丝长度。接同侧两个接线柱，移动滑片不起作用。'
    }
  ]);
})();

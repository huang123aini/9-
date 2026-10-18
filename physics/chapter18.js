(() => {
  'use strict';

  const K = window.PhysicsKit;
  const {
    $, fmt, clamp, mountCanvas, drawText, drawWire, drawArrow,
    drawBattery, drawLamp, heatColor, makePlot, drawPlotGrid, drawPlotAxes,
    drawPlotLine, drawPlotDot
  } = K;

  K.initChecklist([
    '知道电能、电功的单位和换算',
    '会用 W = Pt 计算电能',
    '理解额定功率和实际功率的区别',
    '能用 P = UI 和 P = I²R 计算功率',
    '能用 Q = I²Rt 计算电热'
  ], 'physics9a-ch18-goals');

  const appliances = {
    lamp: { name: '电灯', power: 40 },
    tv: { name: '电视', power: 150 },
    air: { name: '空调', power: 1500 },
    heater: { name: '热水器', power: 2000 }
  };
  const energyState = { appliance: 'lamp', time: 2 };
  const applianceButtons = Array.from(document.querySelectorAll('[data-appliance]'));

  function energyWork(power, time) {
    return power / 1000 * time;
  }

  function drawEnergy(ctx, w, h) {
    const keys = Object.keys(appliances);
    const values = keys.map(key => energyWork(appliances[key].power, energyState.time));
    const maxValue = Math.max(0.1, ...values) * 1.15;
    const labelX = w * 0.10;
    const barX = w * 0.34;
    const barMaxW = w * 0.50;
    const top = h * 0.22;
    const rowH = h * 0.145;

    drawText(ctx, '消耗电能 / kW·h', barX, h * 0.10, { color: '#475569', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `工作时间 ${fmt(energyState.time, 1)} h`, w * 0.92, h * 0.10, { color: '#64748b', align: 'right', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    keys.forEach((key, index) => {
      const item = appliances[key];
      const value = values[index];
      const y = top + index * rowH;
      const active = key === energyState.appliance;
      const barW = (value / maxValue) * barMaxW;

      drawText(ctx, item.name, labelX, y + 12, { color: active ? '#b45309' : '#475569', font: active ? '800 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' : '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, `${item.power} W`, labelX, y + 28, { color: '#94a3b8', font: '600 10px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

      ctx.save();
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(barX, y, barMaxW, 22);
      const grad = ctx.createLinearGradient(barX, 0, barX + barMaxW, 0);
      if (active) {
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#ef4444');
      } else {
        grad.addColorStop(0, '#93c5fd');
        grad.addColorStop(1, '#2563eb');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(barX, y, Math.max(2, barW), 22);
      ctx.restore();

      drawText(ctx, `${fmt(value, 2)}`, barX + Math.max(barW, 2) + 8, y + 11, { color: active ? '#b45309' : '#1d4ed8', font: '800 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    });

    drawText(ctx, '功率越大、时间越长，消耗的电能越多', w / 2, h * 0.94, { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderEnergy = mountCanvas($('#canvasEnergy'), drawEnergy);

  function syncEnergy() {
    const item = appliances[energyState.appliance];
    const work = energyWork(item.power, energyState.time);
    $('#energyName').textContent = item.name;
    $('#energyPower').textContent = `${item.power} W`;
    $('#energyTimeRead').textContent = `${fmt(energyState.time, 1)} h`;
    $('#energyTimeOut').textContent = `${fmt(energyState.time, 1)} h`;
    $('#energyWork').textContent = `${fmt(work, 2)} kW·h`;
    $('#energyCost').textContent = `${fmt(work * 0.6, 2)} 元`;
    applianceButtons.forEach(button => {
      const active = button.dataset.appliance === energyState.appliance;
      button.classList.toggle('is-active', active);
      button.classList.toggle('ghost', !active);
    });
    renderEnergy();
  }

  applianceButtons.forEach(button => {
    button.addEventListener('click', () => {
      energyState.appliance = button.dataset.appliance;
      syncEnergy();
    });
  });

  $('#energyTime').addEventListener('input', event => {
    energyState.time = Number(event.target.value);
    syncEnergy();
  });
  $('#energyReset').addEventListener('click', () => {
    energyState.appliance = 'lamp';
    energyState.time = 2;
    $('#energyTime').value = 2;
    syncEnergy();
  });

  syncEnergy();

  const RATED_U = 220;
  const RATED_P = 100;
  const RATED_R = RATED_U * RATED_U / RATED_P;
  const ratedState = { voltage: 220 };

  function ratedPower() {
    return ratedState.voltage * ratedState.voltage / RATED_R;
  }

  function drawRated(ctx, w, h) {
    const P = makePlot(w, h, 0, 240, 0, 130, 48);
    drawPlotGrid(ctx, P, 40, 20);
    drawPlotAxes(ctx, P, { stepX: 40, stepY: 20, xLabel: 'U/V', yLabel: 'P/W' });

    drawPlotLine(ctx, P, u => u * u / RATED_R, '#2563eb', 2.8);
    drawPlotDot(ctx, P, RATED_U, RATED_P, '#10b981', 5, '额定点', -72, 18);

    const actual = ratedPower();
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(P.X(ratedState.voltage), P.Y(0));
    ctx.lineTo(P.X(ratedState.voltage), P.Y(actual));
    ctx.lineTo(P.X(0), P.Y(actual));
    ctx.stroke();
    ctx.restore();
    const actualDx = ratedState.voltage < 100 ? 12 : -72;
    const actualDy = actual > 118 ? 18 : -16;
    drawPlotDot(ctx, P, ratedState.voltage, actual, '#ef4444', 6, `${fmt(actual, 1)} W`, actualDx, actualDy);

    drawText(ctx, 'P ∝ U²', P.X(150), P.Y(112), { color: '#1d4ed8', font: '800 14px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `R = ${fmt(RATED_R, 0)} Ω 保持不变`, P.X(110), P.Y(96), { color: '#64748b', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderRated = mountCanvas($('#canvasRated'), drawRated);

  function syncRated() {
    const actual = ratedPower();
    $('#ratedRated').textContent = '220 V / 100 W';
    $('#ratedR').textContent = `${fmt(RATED_R, 0)} Ω`;
    $('#ratedActualP').textContent = `${fmt(actual, 1)} W`;
    $('#ratedVoltageOut').textContent = `${fmt(ratedState.voltage, 0)} V`;
    $('#ratedBright').textContent = actual > 112
      ? '过亮，可能烧坏'
      : actual > 85
        ? '正常发光'
        : actual > 35
          ? '较暗'
          : actual > 3
            ? '很暗'
            : '不发光';
    renderRated();
  }

  $('#ratedVoltage').addEventListener('input', event => {
    ratedState.voltage = Number(event.target.value);
    syncRated();
  });
  $('#ratedReset').addEventListener('click', () => {
    ratedState.voltage = 220;
    $('#ratedVoltage').value = 220;
    syncRated();
  });

  syncRated();

  const BULB1 = { name: 'L₁（100 W）', r: RATED_U * RATED_U / 100 };
  const BULB2 = { name: 'L₂（40 W）', r: RATED_U * RATED_U / 40 };
  const bulbState = { type: 'series', voltage: 220 };

  function bulbValues() {
    if (bulbState.type === 'series') {
      const current = bulbState.voltage / (BULB1.r + BULB2.r);
      return {
        u1: current * BULB1.r,
        u2: current * BULB2.r,
        p1: current * current * BULB1.r,
        p2: current * current * BULB2.r
      };
    }
    return {
      u1: bulbState.voltage,
      u2: bulbState.voltage,
      p1: bulbState.voltage * bulbState.voltage / BULB1.r,
      p2: bulbState.voltage * bulbState.voltage / BULB2.r
    };
  }

  function drawPowerLamp(ctx, x, y, power, label) {
    const glowR = 18 + Math.sqrt(clamp(power, 0, 140)) * 2.4;
    if (power > 0.2) {
      const glow = ctx.createRadialGradient(x, y, 2, x, y, glowR);
      glow.addColorStop(0, `rgba(251, 191, 36, ${clamp(0.25 + power / 200, 0.25, 0.65)})`);
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.save();
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawLamp(ctx, x, y, power > 0.2, 15, label);
    drawText(ctx, `${fmt(power, 1)} W`, x, y + 46, { color: '#b45309', align: 'center', font: '800 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  function drawBulbs(ctx, w, h) {
    const values = bulbValues();
    const x1 = w * 0.16;
    const x2 = w * 0.84;
    const y1 = h * 0.28;
    const y2 = h * 0.72;
    const midY = (y1 + y2) / 2;
    const batteryLen = 34;

    drawWire(ctx, [[x1, y2], [x1, midY + batteryLen / 2]], '#334155', 2.4);
    drawBattery(ctx, x1, midY, batteryLen, true, '电源');
    drawWire(ctx, [[x1, midY - batteryLen / 2], [x1, y1]], '#334155', 2.4);

    if (bulbState.type === 'series') {
      const l1x = w * 0.42;
      const l2x = w * 0.64;
      drawWire(ctx, [[x1, y1], [l1x - 15, y1]], '#334155', 2.4);
      drawWire(ctx, [[l1x + 15, y1], [l2x - 15, y1]], '#334155', 2.4);
      drawWire(ctx, [[l2x + 15, y1], [x2, y1], [x2, y2], [x1, y2]], '#334155', 2.4);
      drawPowerLamp(ctx, l1x, y1, values.p1, 'L₁');
      drawPowerLamp(ctx, l2x, y1, values.p2, 'L₂');
      drawText(ctx, `串联：I 相同，P = I²R`, w / 2, h * 0.90, { color: '#1d4ed8', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    } else {
      const l1x = w * 0.56;
      const l2x = w * 0.56;
      drawWire(ctx, [[x1, y1], [l1x - 15, y1]], '#334155', 2.4);
      drawWire(ctx, [[l1x + 15, y1], [x2, y1]], '#334155', 2.4);
      drawWire(ctx, [[x1, y2], [l2x - 15, y2]], '#334155', 2.4);
      drawWire(ctx, [[l2x + 15, y2], [x2, y2]], '#334155', 2.4);
      drawWire(ctx, [[x2, y1], [x2, y2]], '#334155', 2.4);
      drawPowerLamp(ctx, l1x, y1, values.p1, 'L₁');
      drawPowerLamp(ctx, l2x, y2, values.p2, 'L₂');
      drawText(ctx, `并联：U 相同，P = U²/R`, w / 2, h * 0.90, { color: '#047857', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }

    drawText(ctx, `电源 ${fmt(bulbState.voltage, 0)} V`, w * 0.50, h * 0.96, { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderBulbs = mountCanvas($('#canvasBulbs'), drawBulbs);

  function syncBulbs() {
    const values = bulbValues();
    const brighter = Math.abs(values.p1 - values.p2) < 0.05
      ? '一样亮'
      : values.p1 > values.p2
        ? BULB1.name
        : BULB2.name;
    $('#bulbType').textContent = bulbState.type === 'series' ? '串联' : '并联';
    $('#bulbP1').textContent = `${fmt(values.p1, 1)} W`;
    $('#bulbP2').textContent = `${fmt(values.p2, 1)} W`;
    $('#bulbBrighter').textContent = brighter;
    $('#bulbVoltageOut').textContent = `${fmt(bulbState.voltage, 0)} V`;
    $('#bulbSeries').classList.toggle('is-active', bulbState.type === 'series');
    $('#bulbParallel').classList.toggle('is-active', bulbState.type === 'parallel');
    $('#bulbSeries').classList.toggle('ghost', bulbState.type !== 'series');
    $('#bulbParallel').classList.toggle('ghost', bulbState.type !== 'parallel');
    renderBulbs();
  }

  $('#bulbSeries').addEventListener('click', () => {
    bulbState.type = 'series';
    syncBulbs();
  });
  $('#bulbParallel').addEventListener('click', () => {
    bulbState.type = 'parallel';
    syncBulbs();
  });
  $('#bulbVoltage').addEventListener('input', event => {
    bulbState.voltage = Number(event.target.value);
    syncBulbs();
  });
  $('#bulbReset').addEventListener('click', () => {
    bulbState.type = 'series';
    bulbState.voltage = 220;
    $('#bulbVoltage').value = 220;
    syncBulbs();
  });

  syncBulbs();

  const jouleState = { current: 2, resistance: 10, time: 60 };

  function jouleValues() {
    const power = jouleState.current * jouleState.current * jouleState.resistance;
    return { power, heat: power * jouleState.time };
  }

  function drawJoule(ctx, w, h) {
    const values = jouleValues();
    const ratio = clamp(values.power / 180, 0, 1);
    const xStart = w * 0.12;
    const xEnd = w * 0.62;
    const wireY = h * 0.42;
    const thickness = 12;

    for (let i = 0; i < 3; i += 1) {
      const y = wireY - 34 - i * 12;
      const amp = 3 + ratio * 8;
      ctx.save();
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.25 + ratio * 0.55})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(xStart + 20, y);
      ctx.quadraticCurveTo(w * 0.28, y - amp, w * 0.36, y);
      ctx.quadraticCurveTo(w * 0.44, y + amp, w * 0.52, y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = heatColor(ratio);
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(xStart, wireY);
    ctx.lineTo(xEnd, wireY);
    ctx.stroke();
    ctx.restore();

    if (ratio > 0.05) {
      const glow = ctx.createLinearGradient(xStart, wireY - 30, xStart, wireY + 30);
      glow.addColorStop(0, 'rgba(239, 68, 68, 0)');
      glow.addColorStop(0.5, `rgba(239, 68, 68, ${ratio * 0.35})`);
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.save();
      ctx.fillStyle = glow;
      ctx.fillRect(xStart, wireY - 30, xEnd - xStart, 60);
      ctx.restore();
    }

    drawText(ctx, `I = ${fmt(jouleState.current, 1)} A`, w / 2, h * 0.24, { color: '#1d4ed8', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawArrow(ctx, xStart + 30, wireY + 28, xStart + 90, wireY + 28, '#2563eb', 2, 6);
    drawText(ctx, `R = ${fmt(jouleState.resistance, 0)} Ω`, w / 2, h * 0.56, { color: '#475569', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    const barX = w * 0.12;
    const barY = h * 0.74;
    const barW = w * 0.76;
    const barH = 14;
    const maxHeat = 54000;
    ctx.save();
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.3;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeRect(barX, barY, barW, barH);
    const fillW = (barW - 4) * clamp(values.heat / maxHeat, 0.002, 1);
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, '#fbbf24');
    grad.addColorStop(1, '#ef4444');
    ctx.fillStyle = grad;
    ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);
    ctx.restore();
    drawText(ctx, '产生的热量 Q', barX, barY - 10, { color: '#475569', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `${fmt(values.heat, 0)} J`, barX + barW, barY + barH + 16, { color: '#b91c1c', align: 'right', font: '800 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, 'Q = I²Rt', w / 2, h * 0.95, { color: '#64748b', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderJoule = mountCanvas($('#canvasJoule'), drawJoule);

  function syncJoule() {
    const values = jouleValues();
    $('#jouleP').textContent = `${fmt(values.power, 1)} W`;
    $('#jouleQ').textContent = `${fmt(values.heat, 0)} J`;
    $('#jouleQKJ').textContent = `${fmt(values.heat / 1000, 2)} kJ`;
    $('#jouleLevel').textContent = values.power > 100 ? '非常明显' : values.power > 40 ? '明显' : values.power > 10 ? '较明显' : '不明显';
    $('#jouleCurrentOut').textContent = `${fmt(jouleState.current, 1)} A`;
    $('#jouleResistanceOut').textContent = `${fmt(jouleState.resistance, 0)} Ω`;
    $('#jouleTimeOut').textContent = `${fmt(jouleState.time, 0)} s`;
    renderJoule();
  }

  $('#jouleCurrent').addEventListener('input', event => {
    jouleState.current = Number(event.target.value);
    syncJoule();
  });
  $('#jouleResistance').addEventListener('input', event => {
    jouleState.resistance = Number(event.target.value);
    syncJoule();
  });
  $('#jouleTime').addEventListener('input', event => {
    jouleState.time = Number(event.target.value);
    syncJoule();
  });
  $('#jouleReset').addEventListener('click', () => {
    jouleState.current = 2;
    jouleState.resistance = 10;
    jouleState.time = 60;
    $('#jouleCurrent').value = 2;
    $('#jouleResistance').value = 10;
    $('#jouleTime').value = 60;
    syncJoule();
  });

  syncJoule();

  K.initQuiz([
    {
      q: '一个 1000 W 的用电器工作 2 h，消耗的电能是：',
      options: ['0.5 kW·h', '2 kW·h', '2000 kW·h', '7.2×10⁶ kW·h'],
      answer: 1,
      explain: 'W = Pt = 1 kW × 2 h = 2 kW·h，合 7.2×10⁶ J。注意单位换算。'
    },
    {
      q: '某用电器两端电压为 220 V，通过它的电流为 0.5 A，电功率是：',
      options: ['44 W', '110 W', '220 W', '440 W'],
      answer: 1,
      explain: 'P = UI = 220 V × 0.5 A = 110 W。'
    },
    {
      q: '关于额定功率和实际功率，下列说法正确的是：',
      options: [
        '额定功率随电压变化',
        '实际功率只有一个',
        '额定功率是用电器在额定电压下的功率',
        '实际功率一定等于额定功率'
      ],
      answer: 2,
      explain: '额定功率是用电器在额定电压下的功率，只有一个；实际功率随实际电压变化，可以有很多个。'
    },
    {
      q: '“220 V 100 W”和“220 V 40 W”的两只灯泡串联在 220 V 电路中，更亮的是：',
      options: ['100 W 的灯泡', '40 W 的灯泡', '一样亮', '都不亮'],
      answer: 1,
      explain: '串联电流相同，P = I²R。40 W 灯泡电阻更大，实际功率更大，所以更亮。'
    },
    {
      q: '电流 2 A 通过 10 Ω 的电阻，通电 60 s 产生的热量是：',
      options: ['120 J', '240 J', '1200 J', '2400 J'],
      answer: 3,
      explain: 'Q = I²Rt = 2² × 10 × 60 = 2400 J。'
    },
    {
      q: '在纯电阻电路中，下列计算电功率的式子正确的是：',
      options: [
        'P = UI 不适用',
        'P = I²R',
        'P = U²/R 不适用',
        'P = IR'
      ],
      answer: 1,
      explain: '纯电阻电路中，P = UI = I²R = U²/R。P = IR 不是功率公式。'
    }
  ]);
})();

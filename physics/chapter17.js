(() => {
  'use strict';

  const K = window.PhysicsKit;
  const {
    $, fmt, clamp, createLoop, mountCanvas, drawText, drawWire, drawArrow,
    drawBattery, drawLamp, drawMeter, drawResistor, drawRheostat, drawSwitch,
    makePlot, drawPlotGrid, drawPlotAxes, drawPlotLine, drawPlotDot
  } = K;

  K.initChecklist([
    '理解欧姆定律的内容和适用条件',
    '能看懂 I–U 图像和 I–R 图像',
    '会用 R = U/I 测电阻',
    '掌握串联和并联的电阻规律',
    '能用欧姆定律解决简单电路问题'
  ], 'physics9a-ch17-goals');

  function guide(ctx, x1, y1, x2, y2, color) {
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  const iuState = { r: 10, u: 6 };

  function drawIU(ctx, w, h) {
    const P = makePlot(w, h, 0, 12, 0, 2.5, 48);
    drawPlotGrid(ctx, P, 2, 0.5);
    drawPlotAxes(ctx, P, { stepX: 2, stepY: 0.5, xLabel: 'U/V', yLabel: 'I/A' });

    drawPlotLine(ctx, P, u => u / iuState.r, '#2563eb', 2.8);
    const i = iuState.u / iuState.r;
    guide(ctx, P.X(iuState.u), P.Y(0), P.X(iuState.u), P.Y(i), 'rgba(37, 99, 235, 0.35)');
    guide(ctx, P.X(0), P.Y(i), P.X(iuState.u), P.Y(i), 'rgba(37, 99, 235, 0.35)');
    drawPlotDot(ctx, P, iuState.u, i, '#ef4444', 6, `(${fmt(iuState.u, 1)} V, ${fmt(i, 2)} A)`, 10, -12);

    drawText(ctx, `R = ${fmt(iuState.r, 0)} Ω`, P.X(8.6), P.Y(2.2), { color: '#1d4ed8', font: '800 14px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, 'I 与 U 成正比', P.X(7.2), P.Y(1.8), { color: '#64748b', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderIU = mountCanvas($('#canvasIU'), drawIU);

  function syncIU() {
    const i = iuState.u / iuState.r;
    $('#iuROut').textContent = `${fmt(iuState.r, 0)} Ω`;
    $('#iuUOut').textContent = `${fmt(iuState.u, 1)} V`;
    $('#iuRRead').textContent = `${fmt(iuState.r, 0)} Ω`;
    $('#iuURead').textContent = `${fmt(iuState.u, 1)} V`;
    $('#iuIRead').textContent = `${fmt(i, 2)} A`;
    $('#iuSlopeRead').textContent = `${fmt(1 / iuState.r, 3)} A/V`;
    renderIU();
  }

  $('#iuR').addEventListener('input', event => {
    iuState.r = Number(event.target.value);
    syncIU();
  });
  $('#iuU').addEventListener('input', event => {
    iuState.u = Number(event.target.value);
    syncIU();
  });
  $('#iuReset').addEventListener('click', () => {
    iuState.r = 10;
    iuState.u = 6;
    $('#iuR').value = 10;
    $('#iuU').value = 6;
    syncIU();
  });

  syncIU();

  const irState = { u: 6, r: 10 };

  function drawIR(ctx, w, h) {
    const ymax = Math.max(1, Math.ceil((irState.u / 2) * 2) / 2);
    const stepY = ymax <= 3 ? 0.5 : 1;
    const P = makePlot(w, h, 2, 30, 0, ymax, 48);
    drawPlotGrid(ctx, P, 5, stepY);
    drawPlotAxes(ctx, P, { stepX: 5, stepY, xLabel: 'R/Ω', yLabel: 'I/A' });

    drawPlotLine(ctx, P, r => irState.u / r, '#f59e0b', 2.8);
    const i = irState.u / irState.r;
    guide(ctx, P.X(irState.r), P.Y(0), P.X(irState.r), P.Y(i), 'rgba(245, 158, 11, 0.4)');
    guide(ctx, P.X(2), P.Y(i), P.X(irState.r), P.Y(i), 'rgba(245, 158, 11, 0.4)');
    drawPlotDot(ctx, P, irState.r, i, '#ef4444', 6, `(${fmt(irState.r, 0)} Ω, ${fmt(i, 2)} A)`, 10, -12);

    drawText(ctx, `U = ${fmt(irState.u, 1)} V 保持不变`, P.X(14), P.Y(ymax * 0.82), { color: '#b45309', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, 'I 与 R 成反比', P.X(14), P.Y(ymax * 0.66), { color: '#64748b', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderIR = mountCanvas($('#canvasIR'), drawIR);

  function syncIR() {
    const i = irState.u / irState.r;
    $('#irUOut').textContent = `${fmt(irState.u, 1)} V`;
    $('#irROut').textContent = `${fmt(irState.r, 0)} Ω`;
    $('#irURead').textContent = `${fmt(irState.u, 1)} V`;
    $('#irRRead').textContent = `${fmt(irState.r, 0)} Ω`;
    $('#irIRead').textContent = `${fmt(i, 2)} A`;
    $('#irConclusion').textContent = 'I 与 R 成反比';
    renderIR();
  }

  $('#irU').addEventListener('input', event => {
    irState.u = Number(event.target.value);
    syncIR();
  });
  $('#irR').addEventListener('input', event => {
    irState.r = Number(event.target.value);
    syncIR();
  });
  $('#irReset').addEventListener('click', () => {
    irState.u = 6;
    irState.r = 10;
    $('#irU').value = 6;
    $('#irR').value = 10;
    syncIR();
  });

  syncIR();

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

  const ohmState = { source: 6, rx: 10, rheo: 0.5, phase: 0 };
  const ohmLoop = createLoop(dt => {
    ohmState.phase = (ohmState.phase + dt * 0.22) % 1;
    renderOhm();
  });

  function ohmValues() {
    const rRheo = 20 * ohmState.rheo;
    const current = ohmState.source / (ohmState.rx + rRheo);
    const ux = current * ohmState.rx;
    return { rRheo, current, ux, measured: ux / current };
  }

  function drawOhm(ctx, w, h) {
    const values = ohmValues();
    const x1 = w * 0.14;
    const x2 = w * 0.66;
    const y1 = h * 0.22;
    const y2 = h * 0.78;
    const midY = (y1 + y2) / 2;
    const batteryLen = 36;
    const switchLen = 34;
    const rheoLen = 66;
    const rxLen = 40;
    const switchX = w * 0.25;
    const rheoX = w * 0.47;
    const ampX = w * 0.42;
    const vmX = w * 0.88;

    drawWire(ctx, [[x1, y2], [x1, midY + batteryLen / 2]], '#334155', 2.6);
    drawBattery(ctx, x1, midY, batteryLen, true, '电源');
    drawWire(ctx, [[x1, midY - batteryLen / 2], [x1, y1], [switchX - switchLen / 2, y1]], '#334155', 2.6);
    drawSwitch(ctx, switchX, y1, true, switchLen, 'S');
    drawWire(ctx, [[switchX + switchLen / 2, y1], [rheoX - rheoLen / 2, y1]], '#334155', 2.6);
    drawRheostat(ctx, rheoX, y1, rheoLen, ohmState.rheo, 'R变');
    drawWire(ctx, [[rheoX + rheoLen / 2, y1], [x2, y1]], '#334155', 2.6);
    drawWire(ctx, [[x2, y1], [x2, midY - rxLen / 2 - 6]], '#334155', 2.6);
    drawResistor(ctx, x2, midY, rxLen, true, 'Rₓ');
    drawWire(ctx, [[x2, midY + rxLen / 2 + 6], [x2, y2]], '#334155', 2.6);
    drawWire(ctx, [[x2, y2], [ampX + 16, y2]], '#334155', 2.6);
    drawMeter(ctx, ampX, y2, 'A', 16, '电流表');
    drawWire(ctx, [[ampX - 16, y2], [x1, y2]], '#334155', 2.6);

    drawWire(ctx, [[x2, y1], [vmX, y1], [vmX, midY - 18]], '#94a3b8', 1.8);
    drawWire(ctx, [[x2, y2], [vmX, y2], [vmX, midY + 18]], '#94a3b8', 1.8);
    drawMeter(ctx, vmX, midY, 'V', 16);
    drawText(ctx, '电压表', vmX, midY - 32, { color: '#64748b', align: 'center', font: '600 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `${fmt(values.ux, 2)} V`, vmX, midY + 38, { color: '#1d4ed8', align: 'center', font: '800 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `${fmt(values.current, 3)} A`, ampX, y2 - 26, { color: '#1d4ed8', align: 'center', font: '800 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    drawFlow(ctx, [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]], ohmState.phase, '#2563eb', 9);

    drawText(ctx, '伏安法：电压表并联，电流表串联', w / 2, h * 0.92, { color: '#64748b', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, `R = U/I = ${fmt(values.measured, 1)} Ω`, w / 2, h * 0.97, { color: '#047857', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderOhm = mountCanvas($('#canvasOhm'), drawOhm);

  function syncOhm() {
    const values = ohmValues();
    $('#ohmSourceOut').textContent = `${fmt(ohmState.source, 1)} V`;
    $('#ohmRxOut').textContent = `${fmt(ohmState.rx, 0)} Ω`;
    $('#ohmRheoOut').textContent = `${fmt(ohmState.rheo * 100, 0)}%`;
    $('#ohmIRead').textContent = `${fmt(values.current, 3)} A`;
    $('#ohmURead').textContent = `${fmt(values.ux, 2)} V`;
    $('#ohmRRead').textContent = `${fmt(values.measured, 1)} Ω`;
    $('#ohmRxRead').textContent = `${fmt(ohmState.rx, 0)} Ω`;
    renderOhm();
  }

  $('#ohmSource').addEventListener('input', event => {
    ohmState.source = Number(event.target.value);
    syncOhm();
  });
  $('#ohmRx').addEventListener('input', event => {
    ohmState.rx = Number(event.target.value);
    syncOhm();
  });
  $('#ohmRheo').addEventListener('input', event => {
    ohmState.rheo = Number(event.target.value) / 100;
    syncOhm();
  });
  $('#ohmReset').addEventListener('click', () => {
    ohmState.source = 6;
    ohmState.rx = 10;
    ohmState.rheo = 0.5;
    $('#ohmSource').value = 6;
    $('#ohmRx').value = 10;
    $('#ohmRheo').value = 50;
    syncOhm();
  });

  syncOhm();
  ohmLoop.start();

  const rulesState = { type: 'series', source: 6, r1: 10, r2: 20 };

  function rulesValues() {
    if (rulesState.type === 'series') {
      const req = rulesState.r1 + rulesState.r2;
      const i = rulesState.source / req;
      return {
        req,
        current: i,
        u1: i * rulesState.r1,
        u2: i * rulesState.r2,
        i1: i,
        i2: i
      };
    }
    const req = (rulesState.r1 * rulesState.r2) / (rulesState.r1 + rulesState.r2);
    const i1 = rulesState.source / rulesState.r1;
    const i2 = rulesState.source / rulesState.r2;
    return {
      req,
      current: i1 + i2,
      u1: rulesState.source,
      u2: rulesState.source,
      i1,
      i2
    };
  }

  function drawRules(ctx, w, h) {
    const values = rulesValues();
    const x1 = w * 0.16;
    const x2 = w * 0.84;
    const y1 = h * 0.28;
    const y2 = h * 0.74;
    const midY = (y1 + y2) / 2;
    const batteryLen = 36;

    drawWire(ctx, [[x1, y2], [x1, midY + batteryLen / 2]], '#334155', 2.6);
    drawBattery(ctx, x1, midY, batteryLen, true, '电源');
    drawWire(ctx, [[x1, midY - batteryLen / 2], [x1, y1]], '#334155', 2.6);

    if (rulesState.type === 'series') {
      const r1x = w * 0.44;
      const r2x = w * 0.66;
      drawWire(ctx, [[x1, y1], [r1x - 30, y1]], '#334155', 2.6);
      drawResistor(ctx, r1x, y1, 44, false, 'R₁');
      drawWire(ctx, [[r1x + 30, y1], [r2x - 30, y1]], '#334155', 2.6);
      drawResistor(ctx, r2x, y1, 44, false, 'R₂');
      drawWire(ctx, [[r2x + 30, y1], [x2, y1], [x2, y2], [x1, y2]], '#334155', 2.6);
      drawText(ctx, `I = ${fmt(values.current, 3)} A`, w / 2, h * 0.86, { color: '#2563eb', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, `U₁ = ${fmt(values.u1, 2)} V，U₂ = ${fmt(values.u2, 2)} V`, w / 2, h * 0.93, { color: '#475569', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    } else {
      const r1x = w * 0.56;
      const r2x = w * 0.56;
      drawWire(ctx, [[x1, y1], [r1x - 30, y1]], '#334155', 2.6);
      drawResistor(ctx, r1x, y1, 44, false, 'R₁');
      drawWire(ctx, [[r1x + 30, y1], [x2, y1]], '#334155', 2.6);
      drawWire(ctx, [[x1, y2], [r2x - 30, y2]], '#334155', 2.6);
      drawResistor(ctx, r2x, y2, 44, false, 'R₂');
      drawWire(ctx, [[r2x + 30, y2], [x2, y2]], '#334155', 2.6);
      drawWire(ctx, [[x2, y1], [x2, y2]], '#334155', 2.6);
      drawText(ctx, `I总 = ${fmt(values.current, 3)} A`, w / 2, h * 0.86, { color: '#2563eb', align: 'center', font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, `I₁ = ${fmt(values.i1, 3)} A，I₂ = ${fmt(values.i2, 3)} A`, w / 2, h * 0.93, { color: '#475569', align: 'center', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    }
  }

  const renderRules = mountCanvas($('#canvasRules17'), drawRules);

  function syncRules() {
    const values = rulesValues();
    $('#rule17Type').textContent = rulesState.type === 'series' ? '串联' : '并联';
    $('#rule17Req').textContent = `${fmt(values.req, 2)} Ω`;
    $('#rule17Current').textContent = `${fmt(values.current, 3)} A`;
    $('#rule17Voltages').textContent = `${fmt(values.u1, 2)} V / ${fmt(values.u2, 2)} V`;
    $('#rule17Currents').textContent = `${fmt(values.i1, 3)} A / ${fmt(values.i2, 3)} A`;
    $('#rule17SourceOut').textContent = `${fmt(rulesState.source, 1)} V`;
    $('#rule17R1Out').textContent = `${fmt(rulesState.r1, 0)} Ω`;
    $('#rule17R2Out').textContent = `${fmt(rulesState.r2, 0)} Ω`;
    $('#rule17Series').classList.toggle('is-active', rulesState.type === 'series');
    $('#rule17Parallel').classList.toggle('is-active', rulesState.type === 'parallel');
    $('#rule17Series').classList.toggle('ghost', rulesState.type !== 'series');
    $('#rule17Parallel').classList.toggle('ghost', rulesState.type !== 'parallel');
    renderRules();
  }

  $('#rule17Series').addEventListener('click', () => {
    rulesState.type = 'series';
    syncRules();
  });
  $('#rule17Parallel').addEventListener('click', () => {
    rulesState.type = 'parallel';
    syncRules();
  });
  $('#rule17Source').addEventListener('input', event => {
    rulesState.source = Number(event.target.value);
    syncRules();
  });
  $('#rule17R1').addEventListener('input', event => {
    rulesState.r1 = Number(event.target.value);
    syncRules();
  });
  $('#rule17R2').addEventListener('input', event => {
    rulesState.r2 = Number(event.target.value);
    syncRules();
  });

  syncRules();

  K.initQuiz([
    {
      q: '欧姆定律 I = U/R 的适用条件是：',
      options: [
        '同一段导体，同一状态',
        '任何电路、任何时刻',
        '只适用于串联电路',
        '只适用于并联电路'
      ],
      answer: 0,
      explain: '欧姆定律要求 U、I、R 属于同一段导体，并且是同一时刻的值，具有同体性和同时性。'
    },
    {
      q: '某导体两端电压为 4 V，通过它的电流为 0.2 A，电阻是：',
      options: ['0.8 Ω', '5 Ω', '20 Ω', '80 Ω'],
      answer: 2,
      explain: 'R = U/I = 4 V ÷ 0.2 A = 20 Ω。'
    },
    {
      q: '导体两端电压增大时，导体的电阻：',
      options: ['变大', '变小', '不变', '无法判断'],
      answer: 2,
      explain: '电阻是导体本身的性质，由材料、长度、横截面积和温度决定，与电压、电流无关。'
    },
    {
      q: '两个电阻 R₁ = 10 Ω、R₂ = 20 Ω 串联，总电阻是：',
      options: ['6.7 Ω', '10 Ω', '20 Ω', '30 Ω'],
      answer: 3,
      explain: '串联总电阻等于各电阻之和：R总 = R₁ + R₂ = 30 Ω。'
    },
    {
      q: '两个电阻 R₁ = 10 Ω、R₂ = 20 Ω 并联，总电阻：',
      options: ['大于 20 Ω', '等于 30 Ω', '小于 10 Ω', '等于 10 Ω'],
      answer: 2,
      explain: '并联总电阻小于任一分电阻。1/R总 = 1/10 + 1/20 = 3/20，R总 ≈ 6.7 Ω。'
    },
    {
      q: '在 I–U 图像中，过原点的直线斜率表示：',
      options: ['电阻 R', '电阻的倒数 1/R', '电压 U', '电功率 P'],
      answer: 1,
      explain: 'I = U/R，所以 I–U 图像的斜率是 1/R。电阻越大，斜率越小。'
    }
  ]);
})();

(() => {
  'use strict';

  const K = window.ChapterKit;
  const { $, fmt, createAnimator, mountCanvas, drawText } = K;

  const goals = [
    '能区分必然事件、不可能事件和随机事件',
    '理解概率的意义，知道概率在 0 到 1 之间',
    '会用列举法求一步试验的概率',
    '会用表格或树状图求两步试验的概率',
    '理解频率与概率的关系，会用频率估计概率'
  ];
  K.initChecklist(goals, 'math9a-ch25-goals');

  function roundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  const spinnerColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
  const spinnerNames = ['红色', '蓝色', '绿色', '黄色'];
  const spinnerState = { angle: -Math.PI / 4, counts: [0, 0, 0, 0], total: 0, last: -1, spinning: false };
  const spinnerAnim = createAnimator();

  function drawSpinner(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = Math.min(w * 0.26, 145);
    const cy = h * 0.52;
    const radius = Math.min(h * 0.35, w * 0.2, 118);
    const startBase = -Math.PI / 2;

    for (let i = 0; i < 4; i += 1) {
      const a1 = startBase + (i * Math.PI) / 2 + spinnerState.angle;
      const a2 = a1 + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, a1, a2);
      ctx.closePath();
      ctx.fillStyle = spinnerColors[i];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      const mid = a1 + Math.PI / 4;
      drawText(ctx, spinnerNames[i][0], cx + Math.cos(mid) * radius * 0.62, cy + Math.sin(mid) * radius * 0.62, {
        color: '#ffffff',
        align: 'center',
        font: '800 20px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
    }

    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - radius - 18);
    ctx.lineTo(cx + 10, cy - radius - 18);
    ctx.lineTo(cx, cy - radius + 3);
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    const hasLast = typeof spinnerState.last === 'number' && spinnerState.last >= 0;
    const lastText = spinnerState.last === 'quick'
      ? '快速试验 100 次'
      : hasLast
        ? `本次：${spinnerNames[spinnerState.last]}`
        : '点击“转一次”';
    drawText(ctx, lastText, cx, h - 18, {
      color: hasLast ? spinnerColors[spinnerState.last] : '#64748b',
      align: 'center',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });

    const chartX = Math.max(w * 0.55, cx + radius + 55);
    const chartTop = 64;
    const chartBottom = h - 54;
    const chartW = w - chartX - 24;
    const chartH = chartBottom - chartTop;
    const baseY = chartBottom;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(chartX, baseY);
    ctx.lineTo(chartX + chartW, baseY);
    ctx.stroke();

    const quarterY = baseY - chartH * 0.25;
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(chartX, quarterY);
    ctx.lineTo(chartX + chartW, quarterY);
    ctx.stroke();
    ctx.restore();
    drawText(ctx, '理论 25%', chartX + chartW, quarterY - 9, {
      color: '#64748b',
      align: 'right',
      font: '11px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });

    const slot = chartW / 4;
    const barW = Math.min(34, slot * 0.5);
    for (let i = 0; i < 4; i += 1) {
      const freq = spinnerState.total ? spinnerState.counts[i] / spinnerState.total : 0;
      const barH = freq * chartH;
      const bx = chartX + slot * i + (slot - barW) / 2;
      const by = baseY - barH;
      ctx.fillStyle = spinnerColors[i];
      ctx.fillRect(bx, by, barW, barH);
      drawText(ctx, `${Math.round(freq * 100)}%`, bx + barW / 2, by - 8, {
        color: spinnerColors[i],
        align: 'center',
        font: '700 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
      drawText(ctx, spinnerNames[i][0], bx + barW / 2, baseY + 16, {
        color: '#64748b',
        align: 'center',
        font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
    }

    drawText(ctx, '频率', chartX, 34, {
      color: '#334155',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, '转盘：4 个等可能扇形', chartX, 50, {
      color: '#64748b',
      font: '11px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
  }

  const renderSpinner = mountCanvas($('#canvasSpinner'), drawSpinner);

  function updateSpinner() {
    $('#spinnerTotal').textContent = spinnerState.total;
    $('#spinnerLast').textContent = spinnerState.last === 'quick'
      ? '快速试验 100 次'
      : spinnerState.last >= 0
        ? spinnerNames[spinnerState.last]
        : '还没转';
    renderSpinner();
  }

  $('#spinnerSpin').addEventListener('click', () => {
    spinnerAnim.cancel();
    const target = Math.floor(Math.random() * 4);
    const current = spinnerState.angle;
    const targetAngle = -Math.PI / 4 - (target * Math.PI) / 2;
    let delta = ((targetAngle - current) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    delta += Math.PI * 2 * 4;
    const final = current + delta;
    spinnerState.spinning = true;
    spinnerAnim.value(current, final, 2200, value => {
      spinnerState.angle = value;
      renderSpinner();
    }, () => {
      spinnerState.angle = final % (Math.PI * 2);
      spinnerState.counts[target] += 1;
      spinnerState.total += 1;
      spinnerState.last = target;
      spinnerState.spinning = false;
      updateSpinner();
    });
  });

  $('#spinnerQuick').addEventListener('click', () => {
    spinnerAnim.cancel();
    spinnerState.spinning = false;
    for (let i = 0; i < 100; i += 1) {
      const target = Math.floor(Math.random() * 4);
      spinnerState.counts[target] += 1;
    }
    spinnerState.total += 100;
    spinnerState.last = 'quick';
    updateSpinner();
  });

  $('#spinnerReset').addEventListener('click', () => {
    spinnerAnim.cancel();
    spinnerState.angle = -Math.PI / 4;
    spinnerState.counts = [0, 0, 0, 0];
    spinnerState.total = 0;
    spinnerState.last = -1;
    spinnerState.spinning = false;
    updateSpinner();
  });

  updateSpinner();

  const diceState = { a: 1, b: 1, selected: 7, last: null, rolling: false };
  let diceTimer = null;
  const diceSum = $('#diceSum');

  function sumColor(sum) {
    const hue = 210 - (sum - 2) * 18;
    return `hsl(${hue}, 72%, 89%)`;
  }

  function drawDie(ctx, x, y, size, value, label) {
    roundedRect(ctx, x, y, size, size, size * 0.16);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    const positions = {
      1: [[0.5, 0.5]],
      2: [[0.28, 0.28], [0.72, 0.72]],
      3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
      4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
      5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
      6: [[0.28, 0.25], [0.72, 0.25], [0.28, 0.5], [0.72, 0.5], [0.28, 0.75], [0.72, 0.75]]
    };

    ctx.fillStyle = '#0f172a';
    positions[value].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(x + px * size, y + py * size, size * 0.075, 0, Math.PI * 2);
      ctx.fill();
    });

    drawText(ctx, label, x + size / 2, y + size + 16, {
      color: '#64748b',
      align: 'center',
      font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
  }

  function drawDice(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const leftW = Math.min(w * 0.34, 180);
    const dieSize = Math.min(62, leftW * 0.34);
    const dieY = 56;
    drawDie(ctx, 24, dieY, dieSize, diceState.a, '第一枚');
    drawDie(ctx, 24 + dieSize + 16, dieY, dieSize, diceState.b, '第二枚');

    drawText(ctx, `和 = ${diceState.a + diceState.b}`, 24, dieY + dieSize + 46, {
      color: '#7c3aed',
      font: '800 16px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, diceState.last ? `本次：${diceState.last.a} + ${diceState.last.b}` : '点击“掷一次”', 24, dieY + dieSize + 68, {
      color: '#64748b',
      font: '12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });

    const tableX = leftW + 12;
    const tableY = 66;
    const tableSize = Math.min(w - tableX - 22, h - 106);
    const cell = tableSize / 6;

    drawText(ctx, '两枚骰子的和：6 × 6 = 36 种', tableX, 34, {
      color: '#334155',
      font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });

    ctx.font = '600 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 6; i += 1) {
      drawText(ctx, String(i + 1), tableX + i * cell + cell / 2, tableY - 12, {
        color: '#64748b',
        align: 'center',
        font: '600 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
      drawText(ctx, String(i + 1), tableX - 12, tableY + i * cell + cell / 2, {
        color: '#64748b',
        align: 'center',
        font: '600 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
    }

    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const sum = row + col + 2;
        const x = tableX + col * cell;
        const y = tableY + row * cell;
        ctx.fillStyle = sum === diceState.selected ? '#fde68a' : sumColor(sum);
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x, y, cell, cell);
        drawText(ctx, String(sum), x + cell / 2, y + cell / 2, {
          color: sum === diceState.selected ? '#92400e' : '#334155',
          align: 'center',
          font: `${sum === diceState.selected ? '800' : '600'} ${Math.max(10, cell * 0.3)}px "PingFang SC", ui-sans-serif, system-ui, sans-serif`
        });
      }
    }

    if (diceState.last) {
      const row = diceState.last.a - 1;
      const col = diceState.last.b - 1;
      const x = tableX + col * cell;
      const y = tableY + row * cell;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
    }
  }

  const renderDice = mountCanvas($('#canvasDice'), drawDice);

  function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
  }

  function updateDice() {
    const selected = diceState.selected;
    let ways = 0;
    for (let i = 1; i <= 6; i += 1) {
      for (let j = 1; j <= 6; j += 1) {
        if (i + j === selected) ways += 1;
      }
    }
    const g = gcd(ways, 36);
    diceSum.value = selected;
    $('#diceSumOut').textContent = selected;
    $('#diceSumRead').textContent = selected;
    $('#diceWays').textContent = `${ways} 种`;
    $('#diceProb').textContent = ways === 36
      ? '1'
      : g === 1
        ? `${ways}/36`
        : `${ways}/36 = ${ways / g}/${36 / g}`;
    $('#diceLast').textContent = diceState.last ? `${diceState.last.a} + ${diceState.last.b} = ${diceState.last.a + diceState.last.b}` : '还没掷';
    renderDice();
  }

  diceSum.addEventListener('input', () => {
    diceState.selected = Number(diceSum.value);
    updateDice();
  });

  $('#diceRoll').addEventListener('click', () => {
    if (diceState.rolling) return;
    diceState.rolling = true;
    let ticks = 0;
    if (diceTimer) clearInterval(diceTimer);
    diceTimer = setInterval(() => {
      diceState.a = 1 + Math.floor(Math.random() * 6);
      diceState.b = 1 + Math.floor(Math.random() * 6);
      renderDice();
      ticks += 1;
      if (ticks >= 9) {
        clearInterval(diceTimer);
        diceTimer = null;
        diceState.a = 1 + Math.floor(Math.random() * 6);
        diceState.b = 1 + Math.floor(Math.random() * 6);
        diceState.last = { a: diceState.a, b: diceState.b };
        diceState.rolling = false;
        updateDice();
      }
    }, 70);
  });

  $('#diceReset').addEventListener('click', () => {
    if (diceTimer) {
      clearInterval(diceTimer);
      diceTimer = null;
    }
    diceState.a = 1;
    diceState.b = 1;
    diceState.selected = 7;
    diceState.last = null;
    diceState.rolling = false;
    updateDice();
  });

  updateDice();

  const coinState = { heads: 0, tails: 0, total: 0, last: null, flipping: false, phase: 0, face: '正' };
  const coinAnim = createAnimator();

  function drawCoin(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = Math.min(w * 0.25, 140);
    const cy = h * 0.48;
    const radius = Math.min(h * 0.25, w * 0.16, 70);
    const scaleX = coinState.flipping ? Math.max(0.08, Math.abs(Math.cos(coinState.phase))) : 1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX, 1);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fcd34d';
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawText(ctx, coinState.face, 0, 1, {
      color: '#92400e',
      align: 'center',
      font: `800 ${Math.round(radius * 0.72)}px "PingFang SC", ui-sans-serif, system-ui, sans-serif`
    });
    ctx.restore();

    const lastText = coinState.last === 'quick'
      ? '快速试验'
      : coinState.last
        ? `本次：${coinState.last === 'heads' ? '正面' : '反面'}`
        : '点击“抛一次”';
    drawText(ctx, lastText, cx, h - 20, {
      color: coinState.last ? '#0f172a' : '#64748b',
      align: 'center',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });

    const chartX = Math.max(w * 0.52, cx + radius + 55);
    const chartTop = 64;
    const chartBottom = h - 54;
    const chartW = w - chartX - 24;
    const chartH = chartBottom - chartTop;
    const baseY = chartBottom;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(chartX, baseY);
    ctx.lineTo(chartX + chartW, baseY);
    ctx.stroke();

    const halfY = baseY - chartH * 0.5;
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(chartX, halfY);
    ctx.lineTo(chartX + chartW, halfY);
    ctx.stroke();
    ctx.restore();
    drawText(ctx, '理论 50%', chartX + chartW, halfY - 9, {
      color: '#64748b',
      align: 'right',
      font: '11px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });

    const bars = [
      { label: '正面', count: coinState.heads, color: '#3b82f6' },
      { label: '反面', count: coinState.tails, color: '#f59e0b' }
    ];
    const slot = chartW / 2;
    const barW = Math.min(48, slot * 0.45);
    bars.forEach((bar, index) => {
      const freq = coinState.total ? bar.count / coinState.total : 0;
      const barH = freq * chartH;
      const bx = chartX + slot * index + (slot - barW) / 2;
      const by = baseY - barH;
      ctx.fillStyle = bar.color;
      ctx.fillRect(bx, by, barW, barH);
      drawText(ctx, `${Math.round(freq * 100)}%`, bx + barW / 2, by - 8, {
        color: bar.color,
        align: 'center',
        font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
      drawText(ctx, `${bar.label} ${bar.count} 次`, bx + barW / 2, baseY + 16, {
        color: '#64748b',
        align: 'center',
        font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
    });

    drawText(ctx, '频率', chartX, 34, {
      color: '#334155',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, '抛硬币：正面概率 1/2', chartX, 50, {
      color: '#64748b',
      font: '11px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
  }

  const renderCoin = mountCanvas($('#canvasCoin'), drawCoin);

  function updateCoin() {
    $('#coinTotal').textContent = coinState.total;
    $('#coinHeads').textContent = coinState.total ? `${fmt((coinState.heads / coinState.total) * 100, 1)}%` : '—';
    $('#coinTails').textContent = coinState.total ? `${fmt((coinState.tails / coinState.total) * 100, 1)}%` : '—';
    $('#coinLast').textContent = coinState.last === 'quick'
      ? '快速试验'
      : coinState.last === 'heads'
        ? '正面'
        : coinState.last === 'tails'
          ? '反面'
          : '还没抛';
    renderCoin();
  }

  $('#coinFlip').addEventListener('click', () => {
    if (coinState.flipping) return;
    coinAnim.cancel();
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    coinState.face = result === 'heads' ? '正' : '反';
    coinState.flipping = true;
    coinState.phase = 0;
    coinAnim.value(0, Math.PI, 650, value => {
      coinState.phase = value;
      renderCoin();
    }, () => {
      coinState.flipping = false;
      coinState.phase = 0;
      if (result === 'heads') coinState.heads += 1;
      else coinState.tails += 1;
      coinState.total += 1;
      coinState.last = result;
      updateCoin();
    });
  });

  function quickCoin(times) {
    coinAnim.cancel();
    coinState.flipping = false;
    coinState.phase = 0;
    for (let i = 0; i < times; i += 1) {
      if (Math.random() < 0.5) coinState.heads += 1;
      else coinState.tails += 1;
    }
    coinState.total += times;
    coinState.last = 'quick';
    updateCoin();
  }

  $('#coinQuick100').addEventListener('click', () => quickCoin(100));
  $('#coinQuick1000').addEventListener('click', () => quickCoin(1000));

  $('#coinReset').addEventListener('click', () => {
    coinAnim.cancel();
    coinState.heads = 0;
    coinState.tails = 0;
    coinState.total = 0;
    coinState.last = null;
    coinState.flipping = false;
    coinState.phase = 0;
    coinState.face = '正';
    updateCoin();
  });

  updateCoin();

  K.initQuiz([
    {
      q: '下列事件中，是随机事件的是：',
      options: ['太阳从东方升起', '抛一枚硬币，正面朝上', '水往高处流', '三角形内角和是 180°'],
      answer: 1,
      explain: '抛硬币可能正面朝上，也可能反面朝上，是随机事件；太阳升起、三角形内角和是必然事件，水往高处流是不可能事件。'
    },
    {
      q: '抛一枚均匀硬币，正面朝上的概率是：',
      options: ['0', '1/2', '1', '2'],
      answer: 1,
      explain: '硬币有正、反两种等可能结果，正面是其中一种，所以概率是 1/2。'
    },
    {
      q: '掷一枚均匀骰子，点数大于 4 的概率是：',
      options: ['1/6', '1/3', '1/2', '2/3'],
      answer: 1,
      explain: '大于 4 的点数是 5、6，共 2 种；总共有 6 种等可能结果，所以概率是 2/6 = 1/3。'
    },
    {
      q: '掷两枚均匀骰子，和为 7 的概率是：',
      options: ['1/12', '1/9', '1/6', '1/3'],
      answer: 2,
      explain: '两枚骰子共有 36 种等可能结果，和为 7 的情况有 6 种，所以概率是 6/36 = 1/6。'
    },
    {
      q: '袋中有 3 个红球、2 个蓝球，随机摸一个，摸到红球的概率是：',
      options: ['2/5', '3/5', '1/2', '3/2'],
      answer: 1,
      explain: '一共有 5 个球，红球有 3 个，所以 P(红) = 3/5。'
    },
    {
      q: '关于频率和概率，下列说法正确的是：',
      options: ['频率就是概率', '试验次数越多，频率一定等于概率', '大量重复试验时，频率会稳定在概率附近', '概率一定等于 0.5'],
      answer: 2,
      explain: '频率是实验值，概率是理论值。大量重复试验时，频率会稳定在概率附近，但不一定完全相等。'
    }
  ]);
})();

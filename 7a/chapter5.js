(() => {
  'use strict';

  const K = window.ChapterKit;
  const {
    $, $$, fmt, clamp, createAnimator, mountCanvas, drawText, initChecklist, initQuiz
  } = K;

  const goals = [
    '能判断一个式子是不是方程，并说出方程的解',
    '理解并会应用等式的两条性质',
    '会移项、合并同类项解一元一次方程',
    '会去括号、去分母解一元一次方程',
    '会用一元一次方程解决行程、销售、工程等实际问题',
    '会检验方程的解是否符合实际意义'
  ];
  initChecklist(goals, 'math7a-ch5-goals');

  const balanceSteps = [
    {
      title: '原来的方程',
      text: '左边是 2 个 x 和 3 个 1，右边是 11 个 1，天平平衡。',
      op: '观察天平',
      eq: '2x + 3 = 11',
      leftX: 2,
      leftW: 3,
      rightW: 11
    },
    {
      title: '两边同时减 3',
      text: '左边去掉 3 个 1，右边也去掉 3 个 1。天平仍然平衡，得到 2x = 8。',
      op: '两边同时减 3',
      eq: '2x = 8',
      leftX: 2,
      leftW: 0,
      rightW: 8
    },
    {
      title: '两边同时除以 2',
      text: '把左边的 2 个 x 平均分成 2 份，右边也平均分成 2 份，每份是 4。得到 x = 4。',
      op: '两边同时除以 2',
      eq: 'x = 4',
      leftX: 1,
      leftW: 0,
      rightW: 4
    },
    {
      title: '检验',
      text: '把 x = 4 代回原方程：左边 2 × 4 + 3 = 11，右边 = 11，左右相等，所以 x = 4 是解。',
      op: '检验：x = 4',
      eq: '2 × 4 + 3 = 11',
      leftX: 1,
      leftW: 0,
      rightW: 4
    }
  ];

  let balanceStep = 0;
  let balanceTimer = null;
  const balanceDots = $('#balanceDots');
  const balancePrev = $('#balancePrev');
  const balanceNext = $('#balanceNext');
  const balanceAuto = $('#balanceAuto');

  function drawWeight(ctx, x, y, size, label, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.max(9, size * 0.48)}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + size / 2, y + size / 2 + 1);
    ctx.restore();
  }

  function drawBalance(ctx, w, h) {
    const step = balanceSteps[balanceStep];
    const cy = h * 0.26;
    const standX = w / 2;
    const panY = h * 0.58;
    const leftX = w * 0.3;
    const rightX = w * 0.7;

    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(standX, cy);
    ctx.lineTo(standX, panY + 55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(standX - 46, panY + 55);
    ctx.lineTo(standX + 46, panY + 55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(standX, panY + 30);
    ctx.lineTo(standX - 28, panY + 55);
    ctx.lineTo(standX + 28, panY + 55);
    ctx.closePath();
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(leftX, cy);
    ctx.lineTo(rightX, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(standX, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#475569';
    ctx.fill();

    [leftX, rightX].forEach(x => {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, cy);
      ctx.lineTo(x - 58, panY);
      ctx.moveTo(x, cy);
      ctx.lineTo(x + 58, panY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 72, panY);
      ctx.quadraticCurveTo(x, panY + 30, x + 72, panY);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    });

    const items = [];
    for (let i = 0; i < step.leftX; i += 1) {
      items.push({ size: 34, label: 'x', color: '#2563eb' });
    }
    for (let i = 0; i < step.leftW; i += 1) {
      items.push({ size: 16, label: '1', color: '#f59e0b' });
    }
    const gap = 6;
    const total = items.reduce((sum, item) => sum + item.size, 0) + gap * Math.max(0, items.length - 1);
    let itemX = leftX - total / 2;
    items.forEach(item => {
      drawWeight(ctx, itemX, panY - item.size - 4, item.size, item.label, item.color);
      itemX += item.size + gap;
    });

    const rightCols = step.rightW > 6 ? 6 : Math.max(1, step.rightW);
    if (step.rightW > 0) {
      const rows = Math.ceil(step.rightW / rightCols);
      const rightTotal = rightCols * 15 - 2;
      for (let i = 0; i < step.rightW; i += 1) {
        const col = i % rightCols;
        const row = Math.floor(i / rightCols);
        drawWeight(
          ctx,
          rightX - rightTotal / 2 + col * 15,
          panY - 16 - (rows - 1 - row) * 15,
          13,
          '1',
          '#f59e0b'
        );
      }
    }

    drawText(ctx, '左边', leftX, panY + 48, {
      color: '#2563eb',
      align: 'center',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, '右边', rightX, panY + 48, {
      color: '#b45309',
      align: 'center',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });

    drawText(ctx, step.eq, w / 2, h - 24, {
      color: '#1e3a8a',
      align: 'center',
      font: '700 20px Georgia, "Times New Roman", "Songti SC", serif'
    });
    drawText(ctx, '天平平衡：两边质量相等', w / 2, 26, {
      color: '#64748b',
      align: 'center',
      font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    ctx.restore();
  }

  const renderBalance = mountCanvas($('#canvasBalance'), drawBalance);

  balanceSteps.forEach((step, index) => {
    const dot = document.createElement('button');
    dot.className = 'step-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `第 ${index + 1} 步`);
    dot.addEventListener('click', () => {
      stopBalanceAuto();
      setBalanceStep(index);
    });
    balanceDots.appendChild(dot);
  });

  function stopBalanceAuto() {
    if (balanceTimer) {
      clearInterval(balanceTimer);
      balanceTimer = null;
    }
    balanceAuto.textContent = '自动播放';
  }

  function setBalanceStep(index) {
    balanceStep = clamp(index, 0, balanceSteps.length - 1);
    const step = balanceSteps[balanceStep];
    $('#balanceStepNum').textContent = `第 ${balanceStep + 1} / ${balanceSteps.length} 步`;
    $('#balanceTitle').textContent = step.title;
    $('#balanceText').textContent = step.text;
    $('#balanceEq').textContent = step.eq;
    $('#balanceOp').textContent = step.op;
    $('#balanceRead').textContent = step.eq;
    balancePrev.disabled = balanceStep === 0;
    balanceNext.disabled = balanceStep === balanceSteps.length - 1;

    $$('.step-dot', balanceDots).forEach((dot, i) => {
      dot.classList.toggle('active', i === balanceStep);
    });

    $$('#balance .eq-line').forEach(line => {
      const min = Number(line.dataset.minStep);
      line.classList.toggle('on', balanceStep >= min);
      line.classList.toggle('active', min === balanceStep);
    });

    renderBalance();
  }

  balancePrev.addEventListener('click', () => {
    stopBalanceAuto();
    setBalanceStep(balanceStep - 1);
  });

  balanceNext.addEventListener('click', () => {
    stopBalanceAuto();
    setBalanceStep(balanceStep + 1);
  });

  balanceAuto.addEventListener('click', () => {
    if (balanceTimer) {
      stopBalanceAuto();
      return;
    }
    balanceAuto.textContent = '暂停';
    balanceStep = -1;
    setBalanceStep(0);
    balanceTimer = setInterval(() => {
      if (balanceStep >= balanceSteps.length - 1) {
        stopBalanceAuto();
        return;
      }
      setBalanceStep(balanceStep + 1);
    }, 1800);
  });

  setBalanceStep(0);

  const transSteps = [
    {
      title: '先看原方程',
      text: '未知数在两边都有，先把含 x 的项移到左边，常数项移到右边。',
      left: '<span>5x</span><span>−</span><span>2</span>',
      right: '<span>3x</span><span>+</span><span>6</span>',
      moved: []
    },
    {
      title: '移项：3x 过桥变 −3x',
      text: '右边的 3x 移到左边，变成 −3x；左边的 −2 移到右边，变成 +2。',
      left: '<span>5x</span><span>−</span><span class="moved">3x</span>',
      right: '<span>6</span><span>+</span><span class="moved">2</span>',
      moved: ['left-3', 'right-2']
    },
    {
      title: '合并同类项',
      text: '左边 5x − 3x = 2x，右边 6 + 2 = 8，得到 2x = 8。',
      left: '<span>2x</span>',
      right: '<span>8</span>',
      moved: []
    },
    {
      title: '系数化为 1',
      text: '两边同时除以 2，得到 x = 4。把 x = 4 代回原方程检验。',
      left: '<span>x</span>',
      right: '<span>4</span>',
      moved: []
    }
  ];

  let transStep = 0;
  let transTimer = null;
  const transDots = $('#transDots');
  const transPrev = $('#transPrev');
  const transNext = $('#transNext');
  const transAuto = $('#transAuto');

  transSteps.forEach((step, index) => {
    const dot = document.createElement('button');
    dot.className = 'step-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `第 ${index + 1} 步`);
    dot.addEventListener('click', () => {
      stopTransAuto();
      setTransStep(index);
    });
    transDots.appendChild(dot);
  });

  function stopTransAuto() {
    if (transTimer) {
      clearInterval(transTimer);
      transTimer = null;
    }
    transAuto.textContent = '自动播放';
  }

  function transSide(html, changed) {
    return `<span class="side${changed ? ' changed' : ''}">${html}</span>`;
  }

  function setTransStep(index) {
    transStep = clamp(index, 0, transSteps.length - 1);
    const step = transSteps[transStep];
    $('#transEq').innerHTML = `${transSide(step.left, transStep === 1)}<span class="eq-sign">=</span>${transSide(step.right, transStep === 1)}`;
    $('#transStepNum').textContent = `第 ${transStep + 1} / ${transSteps.length} 步`;
    $('#transTitle').textContent = step.title;
    $('#transText').textContent = step.text;
    transPrev.disabled = transStep === 0;
    transNext.disabled = transStep === transSteps.length - 1;

    $$('.step-dot', transDots).forEach((dot, i) => {
      dot.classList.toggle('active', i === transStep);
    });

    $$('#transposition .eq-line').forEach(line => {
      const min = Number(line.dataset.minStep);
      line.classList.toggle('on', transStep >= min);
      line.classList.toggle('active', min === transStep);
    });
  }

  transPrev.addEventListener('click', () => {
    stopTransAuto();
    setTransStep(transStep - 1);
  });

  transNext.addEventListener('click', () => {
    stopTransAuto();
    setTransStep(transStep + 1);
  });

  transAuto.addEventListener('click', () => {
    if (transTimer) {
      stopTransAuto();
      return;
    }
    transAuto.textContent = '暂停';
    transStep = -1;
    setTransStep(0);
    transTimer = setInterval(() => {
      if (transStep >= transSteps.length - 1) {
        stopTransAuto();
        return;
      }
      setTransStep(transStep + 1);
    }, 1700);
  });

  setTransStep(0);

  function frac(num, den) {
    return `<span class="frac"><span class="num">${num}</span><span class="den">${den}</span></span>`;
  }

  const fracSteps = [
    {
      title: '先看原方程',
      text: '分母是 2 和 3，最小公倍数是 6。两边每一项都要乘 6。',
      eq: `${frac('x + 1', '2')}<span> − </span>${frac('2x − 1', '3')}<span> = 1</span>`
    },
    {
      title: '两边同时乘 6',
      text: '第一项乘 6 得 3(x + 1)，第二项乘 6 得 2(2x − 1)，右边的 1 也要乘 6 得 6。',
      eq: '<span>3(x + 1) − 2(2x − 1) = 6</span>'
    },
    {
      title: '去括号',
      text: '3(x + 1) = 3x + 3；−2(2x − 1) = −4x + 2。',
      eq: '<span>3x + 3 − 4x + 2 = 6</span>'
    },
    {
      title: '合并同类项',
      text: '3x − 4x = −x，3 + 2 = 5，得到 −x + 5 = 6。',
      eq: '<span>−x + 5 = 6</span>'
    },
    {
      title: '移项',
      text: '把 +5 移到右边，变成 −5：−x = 6 − 5 = 1。',
      eq: '<span>−x = 1</span>'
    },
    {
      title: '系数化为 1',
      text: '两边同时乘 −1，得到 x = −1。代回原方程检验。',
      eq: '<span>x = −1</span>'
    }
  ];

  let fracStep = 0;
  let fracTimer = null;
  const fracDots = $('#fracDots');
  const fracPrev = $('#fracPrev');
  const fracNext = $('#fracNext');
  const fracAuto = $('#fracAuto');

  fracSteps.forEach((step, index) => {
    const dot = document.createElement('button');
    dot.className = 'step-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `第 ${index + 1} 步`);
    dot.addEventListener('click', () => {
      stopFracAuto();
      setFracStep(index);
    });
    fracDots.appendChild(dot);
  });

  function stopFracAuto() {
    if (fracTimer) {
      clearInterval(fracTimer);
      fracTimer = null;
    }
    fracAuto.textContent = '自动播放';
  }

  function setFracStep(index) {
    fracStep = clamp(index, 0, fracSteps.length - 1);
    const step = fracSteps[fracStep];
    $('#fracEq').innerHTML = step.eq;
    $('#fracStepNum').textContent = `第 ${fracStep + 1} / ${fracSteps.length} 步`;
    $('#fracTitle').textContent = step.title;
    $('#fracText').textContent = step.text;
    fracPrev.disabled = fracStep === 0;
    fracNext.disabled = fracStep === fracSteps.length - 1;

    $$('.step-dot', fracDots).forEach((dot, i) => {
      dot.classList.toggle('active', i === fracStep);
    });

    $$('#fractions .eq-line').forEach(line => {
      const min = Number(line.dataset.minStep);
      line.classList.toggle('on', fracStep >= min);
      line.classList.toggle('active', min === fracStep);
    });
  }

  fracPrev.addEventListener('click', () => {
    stopFracAuto();
    setFracStep(fracStep - 1);
  });

  fracNext.addEventListener('click', () => {
    stopFracAuto();
    setFracStep(fracStep + 1);
  });

  fracAuto.addEventListener('click', () => {
    if (fracTimer) {
      stopFracAuto();
      return;
    }
    fracAuto.textContent = '暂停';
    fracStep = -1;
    setFracStep(0);
    fracTimer = setInterval(() => {
      if (fracStep >= fracSteps.length - 1) {
        stopFracAuto();
        return;
      }
      setFracStep(fracStep + 1);
    }, 1700);
  });

  setFracStep(0);

  const travelState = { D: 60, v1: 20, v2: 40, t: 0 };
  const travelAnim = createAnimator();

  function travelMeeting() {
    return travelState.D / (travelState.v1 + travelState.v2);
  }

  function drawTravel(ctx, w, h) {
    const { D, v1, v2, t } = travelState;
    const left = 58;
    const right = w - 58;
    const roadW = right - left;
    const roadY = h * 0.5;
    const meet = travelMeeting();
    const now = clamp(t, 0, meet);
    const xA = left + (now * v1 / D) * roadW;
    const xB = right - (now * v2 / D) * roadW;

    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(left, roadY);
    ctx.lineTo(right, roadY);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(left, roadY);
    ctx.lineTo(right, roadY);
    ctx.stroke();
    ctx.setLineDash([]);

    drawText(ctx, 'A', left, roadY + 40, {
      color: '#2563eb',
      align: 'center',
      font: '700 14px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, 'B', right, roadY + 40, {
      color: '#b45309',
      align: 'center',
      font: '700 14px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });

    function drawCar(x, color, label, direction) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 22, roadY - 30, 44, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 14, roadY - 30);
      ctx.lineTo(x - 7, roadY - 40);
      ctx.lineTo(x + 9, roadY - 40);
      ctx.lineTo(x + 16, roadY - 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, roadY - 8);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + direction * 27, roadY - 19);
      ctx.lineTo(x + direction * 18, roadY - 25);
      ctx.lineTo(x + direction * 18, roadY - 13);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawCar(xA, '#2563eb', '甲', 1);
    drawCar(xB, '#f59e0b', '乙', -1);

    const gapPx = Math.max(0, xB - xA);
    if (gapPx > 6) {
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(xA + 24, roadY - 54);
      ctx.lineTo(xB - 24, roadY - 54);
      ctx.stroke();
      ctx.fillStyle = '#7c3aed';
      ctx.font = '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`还剩 ${fmt(Math.max(0, D - (v1 + v2) * now), 1)} km`, (xA + xB) / 2, roadY - 60);
    }

    if (now >= meet - 1e-9) {
      drawText(ctx, '相遇', (xA + xB) / 2, roadY - 82, {
        color: '#047857',
        align: 'center',
        font: '700 18px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
    }

    drawText(ctx, `t = ${fmt(now, 1)} h`, w / 2, 28, {
      color: '#334155',
      align: 'center',
      font: '700 14px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, `甲走了 ${fmt(v1 * now, 1)} km`, left + 10, roadY + 70, {
      color: '#2563eb',
      font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, `乙走了 ${fmt(v2 * now, 1)} km`, right - 10, roadY + 70, {
      color: '#b45309',
      align: 'right',
      font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    ctx.restore();
  }

  const renderTravel = mountCanvas($('#canvasTravel'), drawTravel);

  function syncTravel() {
    const { D, v1, v2, t } = travelState;
    const meet = travelMeeting();
    $('#travelD').value = D;
    $('#travelV1').value = v1;
    $('#travelV2').value = v2;
    $('#travelDOut').textContent = `${D} km`;
    $('#travelV1Out').textContent = `${v1} km/h`;
    $('#travelV2Out').textContent = `${v2} km/h`;
    $('#travelEq').textContent = `(${v1} + ${v2})t = ${D}`;
    $('#travelTime').textContent = `${fmt(meet, 1)} 小时`;
    $('#travelNow').textContent = `${fmt(t, 1)} 小时`;
    $('#travelGap').textContent = `${fmt(Math.max(0, D - (v1 + v2) * t), 1)} km`;
    renderTravel();
  }

  ['travelD', 'travelV1', 'travelV2'].forEach(id => {
    $(`#${id}`).addEventListener('input', event => {
      travelAnim.cancel();
      travelState[id === 'travelD' ? 'D' : id === 'travelV1' ? 'v1' : 'v2'] = Number(event.target.value);
      travelState.t = 0;
      syncTravel();
    });
  });

  $('#travelPlay').addEventListener('click', () => {
    travelAnim.cancel();
    travelState.t = 0;
    syncTravel();
    const meet = travelMeeting();
    travelAnim.value(0, meet, 3200, value => {
      travelState.t = value;
      syncTravel();
    }, () => {
      travelState.t = meet;
      syncTravel();
    });
  });

  $('#travelReset').addEventListener('click', () => {
    travelAnim.cancel();
    travelState.t = 0;
    syncTravel();
  });

  syncTravel();

  initQuiz([
    {
      q: '下列方程中，是一元一次方程的是：',
      options: ['x² + 1 = 0', '2x + 3y = 5', '3x − 1 = 5', '1/x = 2'],
      answer: 2,
      explain: '只含一个未知数，并且未知数的次数是 1 的整式方程，叫一元一次方程。3x − 1 = 5 符合。'
    },
    {
      q: '方程 2x + 3 = 11 的解是：',
      options: ['x = 2', 'x = 4', 'x = 7', 'x = 8'],
      answer: 1,
      explain: '移项得 2x = 11 − 3 = 8，两边除以 2，得 x = 4。'
    },
    {
      q: '解方程 3(x − 2) = 2x + 1，去括号后得到：',
      options: ['3x − 2 = 2x + 1', '3x − 6 = 2x + 1', '3x + 6 = 2x + 1', '3x − 6 = 2x − 1'],
      answer: 1,
      explain: '3 要乘括号里的每一项：3 × x = 3x，3 × (−2) = −6，所以是 3x − 6 = 2x + 1。'
    },
    {
      q: '解方程 (x + 1)/2 − (2x − 1)/3 = 1，两边应同时乘：',
      options: ['2', '3', '5', '6'],
      answer: 3,
      explain: '分母是 2 和 3，最小公倍数是 6。两边每一项都要乘 6。'
    },
    {
      q: '两地相距 60 km，两人相向而行，速度分别为 20 km/h 和 40 km/h，几小时相遇？',
      options: ['0.5 小时', '1 小时', '1.5 小时', '3 小时'],
      answer: 1,
      explain: '相遇时间 = 路程 ÷ 速度和 = 60 ÷ (20 + 40) = 1 小时。'
    },
    {
      q: '一件商品进价 80 元，标价 x 元，打八折后利润 16 元，标价是：',
      options: ['96 元', '100 元', '120 元', '128 元'],
      answer: 2,
      explain: '打八折后的售价是 0.8x。由 0.8x − 80 = 16，得 0.8x = 96，所以 x = 120。'
    }
  ]);
})();

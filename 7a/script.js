(() => {
  'use strict';

  const K = window.ChapterKit;
  const {
    $, $$, fmt, clamp, createAnimator, mountCanvas,
    makeLinePlot, drawNumberLine, drawLinePoint, drawJump, drawBracket,
    drawText, initQuiz, initChecklist
  } = K;

  const goals = [
    '能在数轴上表示有理数，并说出相反数与绝对值',
    '会比较两个有理数的大小',
    '能按“先定符号，再算绝对值”做有理数加减',
    '能正确进行乘除与乘方，区分 −2² 与 (−2)²',
    '会用科学记数法表示较大的数',
    '会把文字关系列成代数式，并规范书写',
    '会求代数式的值，先代入再按顺序计算',
    '能识别同类项并正确合并',
    '会去括号，括号前是负号时每一项都变号',
    '会解一元一次方程：去分母、去括号、移项、合并、系数化 1',
    '会用方程解决行程、销售、年龄等实际问题并检验',
    '会计算线段中点、角的和差、余角和补角'
  ];

  initChecklist(goals, 'math7a-goals-v1');

  const navLinks = $$('.nav a');
  const navSections = navLinks
    .map(link => {
      const href = link.getAttribute('href');
      return href && href.startsWith('#') ? document.querySelector(href) : null;
    })
    .filter(Boolean);

  function updateActiveNav() {
    if (!navSections.length) return;
    const line = window.innerHeight * 0.3;
    let current = navSections[0];
    navSections.forEach(section => {
      if (section.getBoundingClientRect().top <= line) current = section;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  window.addEventListener('resize', updateActiveNav);
  updateActiveNav();

  function superscript(n) {
    const map = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '−': '⁻'
    };
    return String(n).split('').map(ch => map[ch] || ch).join('');
  }

  const tempState = { t: -6 };
  const tempAnim = createAnimator();
  const tempInput = $('#tempT');

  function drawTemperature(ctx, w, h) {
    const narrow = w < 520;
    const cx = narrow ? 72 : Math.max(92, w * 0.28);
    const top = 26;
    const bottom = h - 42;
    const bulbR = narrow ? 16 : 20;
    const tubeW = narrow ? 24 : 30;
    const minT = -20;
    const maxT = 40;
    const y = t => bottom - ((t - minT) / (maxT - minT)) * (bottom - top);
    const t = tempState.t;
    const color = t > 0 ? '#ef4444' : t < 0 ? '#2563eb' : '#64748b';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - tubeW / 2, top + 4);
    ctx.lineTo(cx - tubeW / 2, y(minT));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + tubeW / 2, top + 4);
    ctx.lineTo(cx + tubeW / 2, y(minT));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, top + 4, tubeW / 2, Math.PI, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, bottom + 8, bulbR, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, bottom + 8, bulbR - 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - tubeW / 2 + 5, y(minT));
    ctx.lineTo(cx - tubeW / 2 + 5, y(t));
    ctx.lineTo(cx + tubeW / 2 - 5, y(t));
    ctx.lineTo(cx + tubeW / 2 - 5, y(minT));
    ctx.lineTo(cx + bulbR - 6, bottom + 8);
    ctx.arc(cx, bottom + 8, bulbR - 6, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    for (let value = minT; value <= maxT; value += 10) {
      const py = y(value);
      const major = value === 0;
      ctx.strokeStyle = major ? '#ef4444' : '#94a3b8';
      ctx.lineWidth = major ? 2 : 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + tubeW / 2 + 4, py);
      ctx.lineTo(cx + tubeW / 2 + (major ? 18 : 12), py);
      ctx.stroke();
      ctx.fillStyle = major ? '#dc2626' : '#7b8aa0';
      ctx.font = major
        ? '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
        : '11px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${value} °C`, cx + tubeW / 2 + 22, py);
    }

    const px = narrow ? w * 0.52 : Math.max(cx + 150, w * 0.58);
    if (narrow) {
      drawText(ctx, '0 °C 是分界线', px, 56, {
        color: '#334155',
        font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
      drawText(ctx, 't > 0：正数，零上', px, 94, { color: '#dc2626', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, 't < 0：负数，零下', px, 120, { color: '#2563eb', font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, `当前 ${fmt(t, 0)} °C`, px, 172, {
        color,
        font: '700 20px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
      drawText(ctx, t > 0 ? `零上 ${fmt(t, 0)} 摄氏度` : t < 0 ? `零下 ${fmt(-t, 0)} 摄氏度` : '正好在 0 °C', px, 204, {
        color: '#64748b',
        font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
    } else {
      drawText(ctx, '0 °C 是分界线', px, 64, {
        color: '#334155',
        font: '700 16px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
      drawText(ctx, 't > 0：正数，表示零上', px, 100, { color: '#dc2626', font: '600 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, 't = 0：既不是正数，也不是负数', px, 130, { color: '#475569', font: '600 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, 't < 0：负数，表示零下', px, 160, { color: '#2563eb', font: '600 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
      drawText(ctx, `当前 ${fmt(t, 0)} °C`, px, 216, {
        color,
        font: '700 24px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
      drawText(ctx, t > 0 ? `零上 ${fmt(t, 0)} 摄氏度` : t < 0 ? `零下 ${fmt(-t, 0)} 摄氏度` : '正好在 0 °C', px, 250, {
        color: '#64748b',
        font: '600 14px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
    }
    ctx.restore();
  }

  const renderTemp = mountCanvas($('#canvasPositive'), drawTemperature);

  function syncTemp() {
    tempInput.value = tempState.t;
    $('#tempTOut').textContent = `${fmt(tempState.t, 0)} °C`;
    $('#tempValue').textContent = `${fmt(tempState.t, 0)} °C`;
    $('#tempKind').textContent = tempState.t > 0 ? '正数' : tempState.t < 0 ? '负数' : '0';
    $('#tempPos').textContent =
      tempState.t > 0
        ? `零上 ${fmt(tempState.t, 0)} 摄氏度`
        : tempState.t < 0
          ? `零下 ${fmt(-tempState.t, 0)} 摄氏度`
          : '与 0 °C 相同';
    renderTemp();
  }

  tempInput.addEventListener('input', () => {
    tempAnim.cancel();
    tempState.t = Number(tempInput.value);
    syncTemp();
  });

  $('#tempPlay').addEventListener('click', () => {
    tempAnim.cancel();
    tempState.t = -15;
    syncTemp();
    tempAnim.value(-15, 35, 3200, value => {
      tempState.t = Math.round(value);
      syncTemp();
    });
  });

  $('#tempReset').addEventListener('click', () => {
    tempAnim.cancel();
    tempState.t = -6;
    syncTemp();
  });

  syncTemp();

  const nlState = { x: 2 };
  const nlAnim = createAnimator();
  const nlInput = $('#nlX');

  function drawNumberlineDemo(ctx, w, h) {
    const P = makeLinePlot(w, h, -6, 6, 46, h * 0.52);
    drawNumberLine(ctx, P, { step: 1, labelStep: w < 520 ? 2 : 1, zeroLabel: false });

    const x = nlState.x;
    const opp = -x;
    const px = P.X(x);
    const po = P.X(opp);

    ctx.save();
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(px, P.cy - 14);
    ctx.lineTo(po, P.cy - 14);
    ctx.stroke();
    ctx.restore();

    drawBracket(ctx, P, 0, x, {
      offset: 40,
      color: '#7c3aed',
      label: `|a| = ${fmt(Math.abs(x), 1)}`
    });

    drawLinePoint(ctx, P, 0, { color: '#ef4444', label: 'O', r: 5, above: true });
    drawLinePoint(ctx, P, x, { color: '#2563eb', label: `A (${fmt(x, 1)})`, r: 7 });
    if (Math.abs(x) > 1e-9) {
      drawLinePoint(ctx, P, opp, { color: '#f59e0b', label: `A′ (${fmt(opp, 1)})`, r: 7, above: false });
    }

    drawText(ctx, '相反数关于 O 对称', P.X(-5.6), 34, { color: '#7c3aed', font: '600 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
  }

  const renderNl = mountCanvas($('#canvasNumberline'), drawNumberlineDemo);

  function syncNl() {
    nlInput.value = nlState.x;
    $('#nlXOut').textContent = fmt(nlState.x, 1);
    $('#nlValue').textContent = fmt(nlState.x, 1);
    $('#nlOpp').textContent = fmt(-nlState.x, 1);
    $('#nlAbs').textContent = fmt(Math.abs(nlState.x), 1);
    renderNl();
  }

  nlInput.addEventListener('input', () => {
    nlAnim.cancel();
    nlState.x = Number(nlInput.value);
    syncNl();
  });

  $('#nlPlay').addEventListener('click', () => {
    nlAnim.cancel();
    nlState.x = -5;
    syncNl();
    nlAnim.value(-5, 5, 3600, value => {
      nlState.x = Math.round(value * 2) / 2;
      syncNl();
    });
  });

  $('#nlReset').addEventListener('click', () => {
    nlAnim.cancel();
    nlState.x = 2;
    syncNl();
  });

  syncNl();

  const cmpState = { a: -2, b: -4 };
  const cmpAnim = createAnimator();

  function drawCompare(ctx, w, h) {
    const P = makeLinePlot(w, h, -6, 6, 46, h * 0.48);
    drawNumberLine(ctx, P, { step: 1, labelStep: w < 520 ? 2 : 1, zeroLabel: false });

    const { a, b } = cmpState;
    drawBracket(ctx, P, Math.min(a, b), Math.max(a, b), {
      offset: 42,
      color: '#f59e0b',
      label: `|a − b| = ${fmt(Math.abs(a - b), 1)}`
    });

    drawLinePoint(ctx, P, a, { color: '#2563eb', label: `a = ${fmt(a, 1)}`, r: 7 });
    drawLinePoint(ctx, P, b, { color: '#f59e0b', label: `b = ${fmt(b, 1)}`, r: 7, above: false });
    drawLinePoint(ctx, P, 0, { color: '#ef4444', label: 'O', r: 4, above: true });

    const right = Math.max(a, b);
    const rightColor = right === a ? '#2563eb' : '#f59e0b';
    drawText(ctx, `右边的数更大：${fmt(right, 1)}`, P.X(right) + (right > 3 ? -10 : 12), 36, {
      color: rightColor,
      align: right > 3 ? 'right' : 'left',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
  }

  const renderCmp = mountCanvas($('#canvasCompare'), drawCompare);

  function syncCmp() {
    $('#cmpA').value = cmpState.a;
    $('#cmpB').value = cmpState.b;
    $('#cmpAOut').textContent = fmt(cmpState.a, 1);
    $('#cmpBOut').textContent = fmt(cmpState.b, 1);
    const { a, b } = cmpState;
    $('#cmpRead').textContent = `${fmt(a, 1)} ${a > b ? '>' : a < b ? '<' : '='} ${fmt(b, 1)}`;
    $('#cmpDiff').textContent = fmt(a - b, 1);
    $('#cmpDist').textContent = fmt(Math.abs(a - b), 1);
    renderCmp();
  }

  $('#cmpA').addEventListener('input', event => {
    cmpAnim.cancel();
    cmpState.a = Number(event.target.value);
    syncCmp();
  });

  $('#cmpB').addEventListener('input', event => {
    cmpAnim.cancel();
    cmpState.b = Number(event.target.value);
    syncCmp();
  });

  $('#cmpSwap').addEventListener('click', () => {
    cmpAnim.cancel();
    const t = cmpState.a;
    cmpState.a = cmpState.b;
    cmpState.b = t;
    syncCmp();
  });

  $('#cmpPlay').addEventListener('click', () => {
    cmpAnim.cancel();
    cmpState.a = -5;
    syncCmp();
    cmpAnim.value(-5, 5, 3200, value => {
      cmpState.a = Math.round(value * 2) / 2;
      syncCmp();
    });
  });

  $('#cmpReset').addEventListener('click', () => {
    cmpAnim.cancel();
    cmpState.a = -2;
    cmpState.b = -4;
    syncCmp();
  });

  syncCmp();

  const addState = { a: 3, b: -5, progress: 1 };
  const addAnim = createAnimator();

  function drawAdd(ctx, w, h) {
    const P = makeLinePlot(w, h, -13, 13, 42, h * 0.58);
    drawNumberLine(ctx, P, { step: 1, labelStep: w < 520 ? 4 : 2, zeroLabel: false });

    const { a, b, progress } = addState;
    const result = a + b * progress;
    drawJump(ctx, P, 0, a, { color: '#2563eb', lift: 30, label: `a = ${fmt(a, 0)}` });
    if (Math.abs(b) > 1e-9) {
      drawJump(ctx, P, a, result, { color: '#f59e0b', lift: 62, label: `b = ${fmt(b, 0)}` });
    }

    drawLinePoint(ctx, P, 0, { color: '#ef4444', label: 'O', r: 4, above: true });
    drawLinePoint(ctx, P, a, { color: '#2563eb', label: 'a', r: 6 });
    drawLinePoint(ctx, P, a + b, { color: '#7c3aed', label: `a + b = ${fmt(a + b, 0)}`, r: 7, above: false });

    drawText(ctx, '从 0 出发，先走 a，再走 b', P.X(-12), 34, {
      color: '#64748b',
      font: '600 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
  }

  const renderAdd = mountCanvas($('#canvasAdd'), drawAdd);

  function addRule(a, b) {
    if (a === 0) return '任何数加 0 都不变';
    if (b === 0) return '任何数加 0 都不变';
    if (a + b === 0) return '互为相反数，和为 0';
    if (a > 0 && b > 0) return '同号相加，取正号，绝对值相加';
    if (a < 0 && b < 0) return '同号相加，取负号，绝对值相加';
    return '异号相加，取绝对值大的符号，用大绝对值减小绝对值';
  }

  function syncAdd() {
    const { a, b } = addState;
    $('#addA').value = a;
    $('#addB').value = b;
    $('#addAOut').textContent = fmt(a, 0);
    $('#addBOut').textContent = fmt(b, 0);
    $('#addExpr').textContent = `${a < 0 ? `(${fmt(a, 0)})` : fmt(a, 0)} + ${b < 0 ? `(${fmt(b, 0)})` : fmt(b, 0)} = ?`;
    $('#addResult').textContent = fmt(a + b, 0);
    $('#addRule').textContent = addRule(a, b);
    renderAdd();
  }

  $('#addA').addEventListener('input', event => {
    addAnim.cancel();
    addState.a = Number(event.target.value);
    addState.progress = 1;
    syncAdd();
  });

  $('#addB').addEventListener('input', event => {
    addAnim.cancel();
    addState.b = Number(event.target.value);
    addState.progress = 1;
    syncAdd();
  });

  $('#addPlay').addEventListener('click', () => {
    addAnim.cancel();
    addState.progress = 0;
    syncAdd();
    addAnim.value(0, 1, 1600, value => {
      addState.progress = value;
      syncAdd();
    });
  });

  $('#addReset').addEventListener('click', () => {
    addAnim.cancel();
    addState.a = 3;
    addState.b = -5;
    addState.progress = 1;
    syncAdd();
  });

  syncAdd();

  const subState = { a: 2, b: -3, progress: 1 };
  const subAnim = createAnimator();

  function drawSubtract(ctx, w, h) {
    const P = makeLinePlot(w, h, -13, 13, 42, h * 0.52);
    drawNumberLine(ctx, P, { step: 1, labelStep: w < 520 ? 4 : 2, zeroLabel: false });

    const { a, b, progress } = subState;
    const result = a - b * progress;

    drawJump(ctx, P, 0, a, { color: '#2563eb', lift: 30, label: `a = ${fmt(a, 0)}` });
    drawJump(ctx, P, a, result, { color: '#7c3aed', lift: 64, label: `−b = ${fmt(-b, 0)}` });
    drawBracket(ctx, P, Math.min(a, b), Math.max(a, b), {
      offset: 44,
      color: '#f59e0b',
      label: `|a − b| = ${fmt(Math.abs(a - b), 0)}`
    });

    drawLinePoint(ctx, P, b, { color: '#f59e0b', label: `b = ${fmt(b, 0)}`, r: 6, above: false });
    drawLinePoint(ctx, P, a, { color: '#2563eb', label: 'a', r: 6 });
    drawLinePoint(ctx, P, a - b, { color: '#7c3aed', label: 'a − b', r: 7, above: true });
    drawLinePoint(ctx, P, 0, { color: '#ef4444', label: 'O', r: 4, above: true });

    drawText(ctx, '减去 b，就是加上 −b', P.X(-8), 34, {
      color: '#7c3aed',
      font: '600 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
  }

  const renderSub = mountCanvas($('#canvasSubtract'), drawSubtract);

  function syncSub() {
    const { a, b } = subState;
    $('#subA').value = a;
    $('#subB').value = b;
    $('#subAOut').textContent = fmt(a, 0);
    $('#subBOut').textContent = fmt(b, 0);
    $('#subExpr').textContent = `${a < 0 ? `(${fmt(a, 0)})` : fmt(a, 0)} − ${b < 0 ? `(${fmt(b, 0)})` : fmt(b, 0)} = ${a < 0 ? `(${fmt(a, 0)})` : fmt(a, 0)} + ${-b < 0 ? `(${fmt(-b, 0)})` : fmt(-b, 0)}`;
    $('#subResult').textContent = fmt(a - b, 0);
    $('#subDistance').textContent = fmt(Math.abs(a - b), 0);
    renderSub();
  }

  $('#subA').addEventListener('input', event => {
    subAnim.cancel();
    subState.a = Number(event.target.value);
    subState.progress = 1;
    syncSub();
  });

  $('#subB').addEventListener('input', event => {
    subAnim.cancel();
    subState.b = Number(event.target.value);
    subState.progress = 1;
    syncSub();
  });

  $('#subPlay').addEventListener('click', () => {
    subAnim.cancel();
    subState.progress = 0;
    syncSub();
    subAnim.value(0, 1, 1500, value => {
      subState.progress = value;
      syncSub();
    });
  });

  $('#subReset').addEventListener('click', () => {
    subAnim.cancel();
    subState.a = 2;
    subState.b = -3;
    subState.progress = 1;
    syncSub();
  });

  syncSub();

  const mulState = { a: -3, b: 4, progress: 1 };
  const mulAnim = createAnimator();

  function drawMultiply(ctx, w, h) {
    const Ptop = makeLinePlot(w, h, -6, 6, 44, h * 0.33);
    const Pbot = makeLinePlot(w, h, -25, 25, 44, h * 0.77);
    drawNumberLine(ctx, Ptop, { step: 1, labelStep: 2, zeroLabel: false });
    drawNumberLine(ctx, Pbot, { step: 5, labelStep: 5, zeroLabel: false });

    const { a, b, progress } = mulState;
    const product = a * b;
    const moving = product * progress;

    drawText(ctx, '两个因数', Ptop.X(-5.5), 20, { color: '#64748b', font: '700 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, '积', Pbot.X(-24), h * 0.55, { color: '#64748b', font: '700 11px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    drawLinePoint(ctx, Ptop, a, { color: '#2563eb', label: `a = ${fmt(a, 0)}`, r: 6 });
    drawLinePoint(ctx, Ptop, b, { color: '#f59e0b', label: `b = ${fmt(b, 0)}`, r: 6, above: false });
    drawLinePoint(ctx, Ptop, 0, { color: '#ef4444', label: 'O', r: 4, above: true });

    if (Math.abs(product) > 1e-9) {
      drawJump(ctx, Pbot, 0, moving, {
        color: product > 0 ? '#10b981' : '#ef4444',
        lift: 34,
        label: `a × b = ${fmt(product, 0)}`
      });
    }
    drawLinePoint(ctx, Pbot, 0, { color: '#ef4444', label: 'O', r: 4, above: true });
    drawLinePoint(ctx, Pbot, product, { color: product > 0 ? '#10b981' : '#ef4444', label: fmt(product, 0), r: 7 });

    drawText(ctx, '同号得正，异号得负', w - 16, 24, {
      color: '#7c3aed',
      align: 'right',
      font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
  }

  const renderMul = mountCanvas($('#canvasMultiply'), drawMultiply);

  function syncMul() {
    const { a, b } = mulState;
    $('#mulA').value = a;
    $('#mulB').value = b;
    $('#mulAOut').textContent = fmt(a, 0);
    $('#mulBOut').textContent = fmt(b, 0);
    $('#mulExpr').textContent = `${a < 0 ? `(${fmt(a, 0)})` : fmt(a, 0)} × ${b < 0 ? `(${fmt(b, 0)})` : fmt(b, 0)} = ?`;
    $('#mulResult').textContent = fmt(a * b, 0);
    $('#mulRule').textContent = a === 0 || b === 0 ? '有因数 0，积为 0' : (a > 0) === (b > 0) ? '同号得正' : '异号得负';
    renderMul();
  }

  $('#mulA').addEventListener('input', event => {
    mulAnim.cancel();
    mulState.a = Number(event.target.value);
    mulState.progress = 1;
    syncMul();
  });

  $('#mulB').addEventListener('input', event => {
    mulAnim.cancel();
    mulState.b = Number(event.target.value);
    mulState.progress = 1;
    syncMul();
  });

  $('#mulPlay').addEventListener('click', () => {
    mulAnim.cancel();
    mulState.progress = 0;
    syncMul();
    mulAnim.value(0, 1, 1500, value => {
      mulState.progress = value;
      syncMul();
    });
  });

  $('#mulReset').addEventListener('click', () => {
    mulAnim.cancel();
    mulState.a = -3;
    mulState.b = 4;
    mulState.progress = 1;
    syncMul();
  });

  syncMul();

  const powState = { base: -2, exp: 3 };
  const powAnim = createAnimator();

  function drawPower(ctx, w, h) {
    const base = powState.base;
    const exp = powState.exp;
    const pad = 44;
    const x0 = pad;
    const x1 = w - pad;
    const y0 = h * 0.62;
    const maxAbs = Math.max(1, Math.abs(base) ** 6);
    const scaleY = (h * 0.42) / maxAbs;
    const slot = (x1 - x0) / 6;
    const barW = Math.min(54, slot * 0.56);

    ctx.save();
    ctx.strokeStyle = '#e9eef7';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 6; i += 1) {
      const px = x0 + slot * (i - 0.5);
      ctx.beginPath();
      ctx.moveTo(px, 24);
      ctx.lineTo(px, y0 + 8);
      ctx.stroke();
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y0 - h * 0.4);
    ctx.lineTo(x0, y0 + h * 0.28);
    ctx.stroke();

    for (let i = 1; i <= 6; i += 1) {
      const value = base ** i;
      const px = x0 + slot * (i - 0.5);
      const height = Math.abs(value) * scaleY;
      const py = value >= 0 ? y0 - height : y0;
      ctx.fillStyle = value >= 0 ? 'rgba(37, 99, 235, 0.68)' : 'rgba(239, 68, 68, 0.68)';
      ctx.strokeStyle = value >= 0 ? '#2563eb' : '#ef4444';
      ctx.lineWidth = i === exp ? 2.6 : 1.2;
      ctx.beginPath();
      ctx.roundRect(px - barW / 2, py, barW, Math.max(2, height), 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = i === exp ? (value >= 0 ? '#1d4ed8' : '#b91c1c') : '#7b8aa0';
      ctx.font = i === exp
        ? '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
        : '11px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = value >= 0 ? 'bottom' : 'top';
      ctx.fillText(fmt(value, 0), px, value >= 0 ? py - 5 : py + height + 5);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 1; i <= 6; i += 1) {
      const px = x0 + slot * (i - 0.5);
      ctx.fillText(`n = ${i}`, px, y0 + 12);
    }

    drawText(ctx, `底数 ${fmt(base, 0)} 的幂`, x0 + 6, 28, {
      color: '#334155',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, '负底数：偶次在上，奇次在下', x1, 28, {
      color: '#7c3aed',
      align: 'right',
      font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    ctx.restore();
  }

  const renderPow = mountCanvas($('#canvasPower'), drawPower);

  function syncPow() {
    const { base, exp } = powState;
    $('#powBase').value = base;
    $('#powExp').value = exp;
    $('#powBaseOut').textContent = fmt(base, 0);
    $('#powExpOut').textContent = exp;
    $('#powExpr').textContent = `${base < 0 ? `(${fmt(base, 0)})` : fmt(base, 0)}${superscript(exp)} = ?`;
    $('#powValue').textContent = fmt(base ** exp, 0);
    $('#powRule').textContent =
      base > 0
        ? '正数的任何次幂都是正数'
        : base === 0
          ? '0 的正整数次幂是 0'
          : exp % 2 === 0
            ? '负数的偶次幂为正'
            : '负数的奇次幂为负';
    renderPow();
  }

  $('#powBase').addEventListener('input', event => {
    powAnim.cancel();
    powState.base = Number(event.target.value);
    syncPow();
  });

  $('#powExp').addEventListener('input', event => {
    powAnim.cancel();
    powState.exp = Number(event.target.value);
    syncPow();
  });

  $('#powPlay').addEventListener('click', () => {
    powAnim.cancel();
    powState.exp = 1;
    syncPow();
    powAnim.value(1, 6, 2600, value => {
      powState.exp = Math.round(value);
      syncPow();
    });
  });

  $('#powReset').addEventListener('click', () => {
    powAnim.cancel();
    powState.base = -2;
    powState.exp = 3;
    syncPow();
  });

  syncPow();

  function expandedNumber(a, n) {
    const digits = a.toFixed(1).replace('.', '');
    const zeros = n - (digits.length - 1);
    if (zeros >= 0) return digits + '0'.repeat(zeros);
    const cut = digits.length + zeros;
    return `${digits.slice(0, cut)}.${digits.slice(cut)}`;
  }

  const sciState = { a: 3.2, n: 5 };
  const sciAnim = createAnimator();

  function drawScientific(ctx, w, h) {
    const { a, n } = sciState;
    const expanded = expandedNumber(a, n);
    const text = `${fmt(a, 1)} × 10${superscript(n)}`;

    drawText(ctx, text, w / 2, 46, {
      color: '#2563eb',
      align: 'center',
      font: '700 30px Georgia, "Times New Roman", "Songti SC", serif'
    });
    drawText(ctx, '科学记数法：1 ≤ |a| < 10', w / 2, 82, {
      color: '#64748b',
      align: 'center',
      font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });

    const chars = expanded.split('');
    const boxW = Math.min(34, (w - 60) / chars.length - 4);
    const gap = 4;
    const total = chars.length * boxW + (chars.length - 1) * gap;
    const startX = (w - total) / 2;
    const y = h * 0.52;

    chars.forEach((ch, index) => {
      const x = startX + index * (boxW + gap);
      const isPoint = ch === '.';
      ctx.fillStyle = isPoint ? '#fffbeb' : '#ffffff';
      ctx.strokeStyle = isPoint ? '#f59e0b' : '#cbd5e1';
      ctx.lineWidth = isPoint ? 2 : 1.2;
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, 44, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isPoint ? '#b45309' : '#1e293b';
      ctx.font = `${isPoint ? '700' : '600'} 20px Georgia, "Times New Roman", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, x + boxW / 2, y + 22);
    });

    drawText(ctx, `小数点向右移动 ${n} 位`, w / 2, y + 74, {
      color: '#b45309',
      align: 'center',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, '整数位数 = n + 1', w / 2, y + 104, {
      color: '#64748b',
      align: 'center',
      font: '600 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
  }

  const renderSci = mountCanvas($('#canvasScientific'), drawScientific);

  function syncSci() {
    const { a, n } = sciState;
    $('#sciA').value = a;
    $('#sciN').value = n;
    $('#sciAOut').textContent = fmt(a, 1);
    $('#sciNOut').textContent = n;
    $('#sciExpr').textContent = `${fmt(a, 1)} × 10${superscript(n)}`;
    $('#sciExpanded').textContent = expandedNumber(a, n);
    $('#sciDigits').textContent = `${n + 1} 位`;
    $('#sciMove').textContent = `向右 ${n} 位`;
    renderSci();
  }

  $('#sciA').addEventListener('input', event => {
    sciAnim.cancel();
    sciState.a = Number(event.target.value);
    syncSci();
  });

  $('#sciN').addEventListener('input', event => {
    sciAnim.cancel();
    sciState.n = Number(event.target.value);
    syncSci();
  });

  $('#sciPlay').addEventListener('click', () => {
    sciAnim.cancel();
    sciState.n = 1;
    syncSci();
    sciAnim.value(1, 10, 3200, value => {
      sciState.n = Math.round(value);
      syncSci();
    });
  });

  $('#sciReset').addEventListener('click', () => {
    sciAnim.cancel();
    sciState.a = 3.2;
    sciState.n = 5;
    syncSci();
  });

  syncSci();

  initQuiz([
    {
      q: '−(−3) 的值是：',
      options: ['−3', '3', '−1/3', '1/3'],
      answer: 1,
      explain: '−(−3) 表示 −3 的相反数，所以等于 3。'
    },
    {
      q: '比较 −2/3 与 −3/4 的大小：',
      options: ['−2/3 > −3/4', '−2/3 &lt; −3/4', '−2/3 = −3/4', '无法比较'],
      answer: 0,
      explain: '|−2/3| = 2/3 ≈ 0.667，|−3/4| = 0.75。两个负数比较，绝对值大的反而小，所以 −2/3 > −3/4。'
    },
    {
      q: '−2² 的值是：',
      options: ['4', '−4', '2', '−2'],
      answer: 1,
      explain: '−2² 表示 −(2²)，底数是 2，所以结果是 −4。若写成 (−2)²，底数是 −2，结果才是 4。'
    },
    {
      q: '合并同类项 3x + 2y − x + 4y 的结果是：',
      options: ['2x + 6y', '2x + 2y', '3x + 6y', '4x + 6y'],
      answer: 0,
      explain: 'x 的同类项：3x − x = 2x；y 的同类项：2y + 4y = 6y。所以结果是 2x + 6y。'
    },
    {
      q: '解方程 2x − 5 = 9，x 等于：',
      options: ['2', '5', '7', '14'],
      answer: 2,
      explain: '移项得 2x = 9 + 5 = 14，两边除以 2，得 x = 7。'
    },
    {
      q: '去括号 a − (b − c) 的结果是：',
      options: ['a − b − c', 'a − b + c', 'a + b − c', 'a + b + c'],
      answer: 1,
      explain: '括号前是负号，括号里每一项都变号：a − b + c。'
    },
    {
      q: '线段 AB = 10，M 是 AB 的中点，AM 等于：',
      options: ['2.5', '5', '10', '20'],
      answer: 1,
      explain: '中点把线段分成两条相等的线段，AM = MB = AB ÷ 2 = 5。'
    },
    {
      q: '一个角的补角是它的 3 倍，这个角是：',
      options: ['30°', '45°', '60°', '135°'],
      answer: 1,
      explain: '设这个角为 x，则补角为 180° − x。由题意 x + 3x = 180°，得 x = 45°。'
    }
  ]);
})();

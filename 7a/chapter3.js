(() => {
  'use strict';

  const K = window.ChapterKit;
  const {
    $, fmt, createAnimator, mountCanvas, drawText, initChecklist, initQuiz
  } = K;

  const goals = [
    '能用字母表示数，并说出字母的实际意义',
    '会按规范书写代数式',
    '能把文字关系列成代数式',
    '会求代数式的值，先代入再按顺序计算',
    '能从图形规律中写出含 n 的式子'
  ];
  initChecklist(goals, 'math7a-ch3-goals');

  const matchState = { n: 3 };
  const matchAnim = createAnimator();
  const matchInput = $('#matchN');

  function drawMatch(ctx, w, h) {
    const n = matchState.n;
    const size = Math.min(74, (w - 90) / n);
    const totalW = size * n;
    const left = (w - totalW) / 2;
    const top = h / 2 - size / 2 + 8;

    ctx.save();
    ctx.lineCap = 'round';

    for (let i = 0; i < n; i += 1) {
      const x = left + i * size;
      const isLast = i === n - 1;
      ctx.strokeStyle = isLast ? '#f59e0b' : '#2563eb';
      ctx.lineWidth = isLast ? 4 : 3;

      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x + size, top);
      ctx.lineTo(x + size, top + size);
      ctx.lineTo(x, top + size);
      ctx.closePath();
      ctx.stroke();

      if (size >= 42) {
        ctx.fillStyle = isLast ? '#f59e0b' : '#2563eb';
        ctx.font = '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`第 ${i + 1} 个`, x + size / 2, top + size + 10);
      }
    }

    drawText(ctx, `n = ${n}`, w / 2, 32, {
      color: '#334155',
      align: 'center',
      font: '700 18px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, `${3 * n + 1} 根小棒`, w / 2, h - 30, {
      color: '#b45309',
      align: 'center',
      font: '700 18px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    ctx.restore();
  }

  const renderMatch = mountCanvas($('#canvasMatch'), drawMatch);

  function syncMatch() {
    const n = matchState.n;
    matchInput.value = n;
    $('#matchNOut').textContent = n;
    $('#matchCount').textContent = `${n} 个`;
    $('#matchSticks').textContent = `${3 * n + 1} 根`;
    $('#matchExpr').textContent = `3 × ${n} + 1 = ${3 * n + 1} 根`;
    renderMatch();
  }

  matchInput.addEventListener('input', () => {
    matchAnim.cancel();
    matchState.n = Number(matchInput.value);
    syncMatch();
  });

  $('#matchPlay').addEventListener('click', () => {
    matchAnim.cancel();
    matchState.n = 1;
    syncMatch();
    matchAnim.value(1, 8, 2800, value => {
      matchState.n = Math.round(value);
      syncMatch();
    });
  });

  $('#matchReset').addEventListener('click', () => {
    matchAnim.cancel();
    matchState.n = 3;
    syncMatch();
  });

  syncMatch();

  const valueState = { x: -2 };
  const valueAnim = createAnimator();
  const valueInput = $('#valueX');

  function valueOf(x) {
    return 2 * x * x - 3 * x + 1;
  }

  function drawValue(ctx, w, h) {
    const x = valueState.x;
    const pad = 26;
    const tableW = Math.min(w - 2 * pad, 420);
    const left = (w - tableW) / 2;
    const top = 26;
    const rowH = Math.min(36, (h - 2 * top) / 8);

    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left, top, tableW, rowH * 8, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('x', left + tableW * 0.25, top + rowH * 0.5);
    ctx.fillText('2x² − 3x + 1', left + tableW * 0.68, top + rowH * 0.5);

    for (let i = 0; i < 7; i += 1) {
      const xv = i - 3;
      const y = top + rowH * (i + 1);
      const active = xv === x;
      if (active) {
        ctx.fillStyle = '#dbeafe';
        ctx.fillRect(left + 1, y, tableW - 2, rowH);
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(left + 1, y);
      ctx.lineTo(left + tableW - 1, y);
      ctx.stroke();

      ctx.fillStyle = active ? '#1d4ed8' : '#475569';
      ctx.font = active
        ? '700 14px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
        : '13px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(fmt(xv, 0), left + tableW * 0.25, y + rowH / 2);
      ctx.fillText(fmt(valueOf(xv), 0), left + tableW * 0.68, y + rowH / 2);
    }
    ctx.restore();
  }

  const renderValue = mountCanvas($('#canvasValue'), drawValue);

  function syncValue() {
    const x = valueState.x;
    valueInput.value = x;
    $('#valueXOut').textContent = fmt(x, 0);
    $('#valueXRead').textContent = fmt(x, 0);
    $('#valueExpr').textContent = '2x² − 3x + 1';
    $('#valueSub').textContent = `= 2 × ${x < 0 ? `(${fmt(x, 0)})` : fmt(x, 0)}² − 3 × ${x < 0 ? `(${fmt(x, 0)})` : fmt(x, 0)} + 1`;
    $('#valueResult').textContent = fmt(valueOf(x), 0);
    renderValue();
  }

  valueInput.addEventListener('input', () => {
    valueAnim.cancel();
    valueState.x = Number(valueInput.value);
    syncValue();
  });

  $('#valuePlay').addEventListener('click', () => {
    valueAnim.cancel();
    valueState.x = -3;
    syncValue();
    valueAnim.value(-3, 3, 3000, value => {
      valueState.x = Math.round(value);
      syncValue();
    });
  });

  $('#valueReset').addEventListener('click', () => {
    valueAnim.cancel();
    valueState.x = -2;
    syncValue();
  });

  syncValue();

  const rectState = { a: 6, b: 3 };
  const rectAnim = createAnimator();

  function drawRectExpr(ctx, w, h) {
    const { a, b } = rectState;
    const maxW = w - 150;
    const maxH = h - 120;
    const scale = Math.min(maxW / a, maxH / b);
    const rw = a * scale;
    const rh = b * scale;
    const left = (w - rw) / 2;
    const top = (h - rh) / 2 + 8;

    ctx.save();
    ctx.fillStyle = 'rgba(37, 99, 235, 0.12)';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.rect(left, top, rw, rh);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1d4ed8';
    ctx.font = '700 15px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`a = ${a}`, left + rw / 2, top - 8);
    ctx.save();
    ctx.translate(left - 14, top + rh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText(`b = ${b}`, 0, 0);
    ctx.restore();

    drawText(ctx, '周长 = 2(a + b)', left + rw / 2, top + rh / 2 - 10, {
      color: '#1e3a8a',
      align: 'center',
      font: '700 14px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, '面积 = ab', left + rw / 2, top + rh / 2 + 14, {
      color: '#047857',
      align: 'center',
      font: '700 14px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    ctx.restore();
  }

  const renderRect = mountCanvas($('#canvasRectExpr'), drawRectExpr);

  function syncRect() {
    const { a, b } = rectState;
    $('#rectA').value = a;
    $('#rectB').value = b;
    $('#rectAOut').textContent = a;
    $('#rectBOut').textContent = b;
    $('#rectARead').textContent = a;
    $('#rectBRead').textContent = b;
    $('#rectExprP').textContent = `周长 = 2(a + b) = ${2 * (a + b)}`;
    $('#rectExprA').textContent = `面积 = ab = ${a * b}`;
    renderRect();
  }

  $('#rectA').addEventListener('input', event => {
    rectAnim.cancel();
    rectState.a = Number(event.target.value);
    syncRect();
  });

  $('#rectB').addEventListener('input', event => {
    rectAnim.cancel();
    rectState.b = Number(event.target.value);
    syncRect();
  });

  $('#rectPlay').addEventListener('click', () => {
    rectAnim.cancel();
    rectState.b = 1;
    syncRect();
    rectAnim.value(1, 8, 2800, value => {
      rectState.b = Math.round(value);
      syncRect();
    });
  });

  $('#rectReset').addEventListener('click', () => {
    rectAnim.cancel();
    rectState.a = 6;
    rectState.b = 3;
    syncRect();
  });

  syncRect();

  initQuiz([
    {
      q: '“比 x 的 2 倍少 3”用代数式表示是：',
      options: ['2x − 3', '2(x − 3)', '3 − 2x', '2x + 3'],
      answer: 0,
      explain: '先写 x 的 2 倍是 2x，再少 3，就是 2x − 3。注意“少 3”是在 2x 的基础上减 3。'
    },
    {
      q: '“x 与 3 的和的 2 倍”用代数式表示是：',
      options: ['2x + 3', '2(x + 3)', 'x + 6', '2x + 6'],
      answer: 1,
      explain: '先求和 x + 3，再乘 2，所以必须加括号：2(x + 3)。'
    },
    {
      q: '当 x = −2 时，代数式 3x² − 2x + 1 的值是：',
      options: ['9', '17', '−7', '5'],
      answer: 1,
      explain: '3 × (−2)² − 2 × (−2) + 1 = 3 × 4 + 4 + 1 = 12 + 4 + 1 = 17。'
    },
    {
      q: '下列书写规范正确的是：',
      options: ['a × 3 写成 a3', '1 × a 写成 1a', 'a ÷ 3 写成 a/3', 'a × 3 写成 3 × a'],
      answer: 2,
      explain: '数字应写在字母前面，a × 3 应写成 3a，1 × a 写成 a；除法写成分数形式 a/3。'
    },
    {
      q: '用火柴棒摆正方形，第 1 个用 4 根，以后每多一个多用 3 根。第 n 个图形用多少根？',
      options: ['4n', '3n + 1', '4n − 1', '3n + 4'],
      answer: 1,
      explain: '第 1 个 4 根，以后每多一个加 3 根，所以是 4 + 3(n − 1) = 3n + 1。'
    },
    {
      q: '已知 x² + x = 3，则 2x² + 2x + 1 的值是：',
      options: ['4', '6', '7', '9'],
      answer: 2,
      explain: '把 x² + x 看成一个整体：2x² + 2x + 1 = 2(x² + x) + 1 = 2 × 3 + 1 = 7。'
    }
  ]);
})();

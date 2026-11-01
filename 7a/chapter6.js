(() => {
  'use strict';

  const K = window.ChapterKit;
  const {
    $, $$, fmt, clamp, createAnimator, mountCanvas, drawText,
    makeLinePlot, drawNumberLine, drawLinePoint, drawBracket, initChecklist, initQuiz
  } = K;

  const goals = [
    '能区分立体图形与平面图形，认识常见展开图',
    '理解点、线、面、体的关系',
    '能说出直线、射线、线段的区别',
    '会利用中点进行线段计算',
    '会进行角的度量、比较与和差计算',
    '理解余角和补角，并会计算'
  ];
  initChecklist(goals, 'math7a-ch6-goals');

  const nets = [
    {
      name: '1-4-1 型',
      valid: true,
      cells: [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]]
    },
    {
      name: '2-3-1 型',
      valid: true,
      cells: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 1]]
    },
    {
      name: '2-2-2 型',
      valid: true,
      cells: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]]
    },
    {
      name: '3-3 型',
      valid: true,
      cells: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]]
    },
    {
      name: '6 个一排',
      valid: false,
      cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]
    }
  ];

  const netState = { index: 0 };

  function drawNets(ctx, w, h) {
    const net = nets[netState.index];
    const cols = Math.max(...net.cells.map(cell => cell[0])) + 1;
    const rows = Math.max(...net.cells.map(cell => cell[1])) + 1;
    const cell = Math.min(64, (w - 110) / cols, (h - 120) / rows);
    const totalW = cols * cell;
    const totalH = rows * cell;
    const left = (w - totalW) / 2;
    const top = (h - totalH) / 2 - 6;
    const color = net.valid ? '#2563eb' : '#ef4444';

    ctx.save();
    net.cells.forEach(([col, row], index) => {
      const x = left + col * cell;
      const y = top + row * cell;
      ctx.fillStyle = net.valid ? 'rgba(37, 99, 235, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, cell - 4, cell - 4, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = `700 ${Math.max(13, cell * 0.26)}px Georgia, "Times New Roman", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), x + cell / 2, y + cell / 2);
    });

    drawText(ctx, net.name, w / 2, 30, {
      color: '#334155',
      align: 'center',
      font: '700 17px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, net.valid ? '可以折成正方体' : '不能折成正方体', w / 2, h - 30, {
      color: net.valid ? '#047857' : '#b91c1c',
      align: 'center',
      font: '700 15px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    ctx.restore();
  }

  const renderNets = mountCanvas($('#canvasNets'), drawNets);

  function syncNets() {
    const net = nets[netState.index];
    $('#netType').textContent = net.name;
    $('#netFaces').textContent = '6 个';
    $('#netValid').textContent = net.valid ? '能' : '不能';
    $('#netValid').className = net.valid ? 'badge-pos' : 'badge-neg';
    $$('.net-btn').forEach((button, index) => {
      button.classList.toggle('active', index === netState.index);
      button.classList.toggle('ghost', index !== netState.index);
    });
    renderNets();
  }

  $$('.net-btn').forEach(button => {
    button.addEventListener('click', () => {
      netState.index = Number(button.dataset.net);
      syncNets();
    });
  });

  syncNets();

  const segState = { a: 1, b: 9 };
  const segAnim = createAnimator();

  function drawSegment(ctx, w, h) {
    const P = makeLinePlot(w, h, 0, 12, 46, h * 0.5);
    drawNumberLine(ctx, P, { step: 1, labelStep: w < 520 ? 2 : 1, zeroLabel: false, min: 0, max: 12 });

    let { a, b } = segState;
    if (a > b) [a, b] = [b, a];
    const m = (a + b) / 2;

    ctx.save();
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(P.X(a), P.cy);
    ctx.lineTo(P.X(b), P.cy);
    ctx.stroke();
    ctx.restore();

    drawBracket(ctx, P, a, m, {
      offset: 34,
      color: '#2563eb',
      label: `AM = ${fmt(m - a, 1)}`
    });
    drawBracket(ctx, P, m, b, {
      offset: 34,
      color: '#f59e0b',
      label: `MB = ${fmt(b - m, 1)}`
    });

    drawLinePoint(ctx, P, a, { color: '#2563eb', label: `A (${fmt(a, 0)})`, r: 6, above: true });
    drawLinePoint(ctx, P, b, { color: '#f59e0b', label: `B (${fmt(b, 0)})`, r: 6, above: true });
    drawLinePoint(ctx, P, m, { color: '#7c3aed', label: `M (${fmt(m, 1)})`, r: 7, above: false });

    drawText(ctx, '中点 M 把 AB 分成相等的两段', w / 2, 28, {
      color: '#7c3aed',
      align: 'center',
      font: '600 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
  }

  const renderSeg = mountCanvas($('#canvasSegment'), drawSegment);

  function syncSeg() {
    let { a, b } = segState;
    if (a > b) [a, b] = [b, a];
    const m = (a + b) / 2;
    $('#segA').value = segState.a;
    $('#segB').value = segState.b;
    $('#segAOut').textContent = segState.a;
    $('#segBOut').textContent = segState.b;
    $('#segM').textContent = fmt(m, 1);
    $('#segAM').textContent = fmt(m - a, 1);
    $('#segMB').textContent = fmt(b - m, 1);
    $('#segEq').textContent = `AB = ${fmt(b - a, 1)}，AM = MB = ${fmt(m - a, 1)}`;
    renderSeg();
  }

  $('#segA').addEventListener('input', event => {
    segAnim.cancel();
    segState.a = Number(event.target.value);
    if (segState.a >= segState.b) segState.b = Math.min(12, segState.a + 1);
    syncSeg();
  });

  $('#segB').addEventListener('input', event => {
    segAnim.cancel();
    segState.b = Number(event.target.value);
    if (segState.b <= segState.a) segState.a = Math.max(0, segState.b - 1);
    syncSeg();
  });

  $('#segPlay').addEventListener('click', () => {
    segAnim.cancel();
    segState.b = 2;
    syncSeg();
    segAnim.value(2, 12, 3200, value => {
      segState.b = Math.round(value);
      syncSeg();
    });
  });

  $('#segReset').addEventListener('click', () => {
    segAnim.cancel();
    segState.a = 1;
    segState.b = 9;
    syncSeg();
  });

  syncSeg();

  const angState = { a: 35, b: 45 };
  const angAnim = createAnimator();

  function drawAngle(ctx, w, h) {
    const cx = w / 2;
    const cy = h * 0.62;
    const r = Math.min(w, h) * 0.34;
    const { a, b } = angState;
    const alpha = (a * Math.PI) / 180;
    const beta = (b * Math.PI) / 180;

    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.stroke();

    const radial = (angle, length, color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + length * Math.cos(angle), cy - length * Math.sin(angle));
      ctx.stroke();
    };

    radial(0, r * 1.08, '#2563eb', 2.4);
    radial(alpha, r * 1.08, '#f59e0b', 2.4);
    radial(alpha + beta, r * 1.08, '#7c3aed', 2.4);

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.46, 0, -alpha, true);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, -alpha, -(alpha + beta), true);
    ctx.stroke();

    ctx.strokeStyle = '#7c3aed';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, 0, -(alpha + beta), true);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    drawText(ctx, 'O', cx - 14, cy + 16, { color: '#ef4444', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, 'A', cx + r * 1.08 + 6, cy + 4, { color: '#2563eb', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, 'B', cx + r * 1.08 * Math.cos(alpha + beta) - 4, cy - r * 1.08 * Math.sin(alpha + beta) - 10, {
      color: '#7c3aed',
      align: 'center',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, 'C', cx + r * 1.08 * Math.cos(alpha) + 2, cy - r * 1.08 * Math.sin(alpha) - 10, {
      color: '#f59e0b',
      align: 'center',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });

    ctx.fillStyle = '#1d4ed8';
    ctx.font = '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`∠AOC = ${fmt(a, 0)}°`, cx + r * 0.52 * Math.cos(alpha / 2), cy - r * 0.52 * Math.sin(alpha / 2));
    ctx.fillStyle = '#b45309';
    ctx.fillText(`∠COB = ${fmt(b, 0)}°`, cx + r * 0.68 * Math.cos(alpha + beta / 2), cy - r * 0.68 * Math.sin(alpha + beta / 2));
    ctx.restore();
  }

  const renderAngle = mountCanvas($('#canvasAngleSum'), drawAngle);

  function angleKind(deg) {
    if (deg < 90) return '锐角';
    if (deg === 90) return '直角';
    if (deg < 180) return '钝角';
    return '平角';
  }

  function syncAngle() {
    const maxB = Math.max(10, 180 - angState.a);
    $('#angB').max = maxB;
    if (angState.b > maxB) angState.b = maxB;
    $('#angA').value = angState.a;
    $('#angB').value = angState.b;
    $('#angAOut').textContent = `${fmt(angState.a, 0)}°`;
    $('#angBOut').textContent = `${fmt(angState.b, 0)}°`;
    $('#angARead').textContent = `${fmt(angState.a, 0)}°`;
    $('#angBRead').textContent = `${fmt(angState.b, 0)}°`;
    $('#angEq').textContent = `∠AOB = ${fmt(angState.a, 0)}° + ${fmt(angState.b, 0)}° = ${fmt(angState.a + angState.b, 0)}°`;
    $('#angKind').textContent = angleKind(angState.a + angState.b);
    renderAngle();
  }

  $('#angA').addEventListener('input', event => {
    angAnim.cancel();
    angState.a = Number(event.target.value);
    syncAngle();
  });

  $('#angB').addEventListener('input', event => {
    angAnim.cancel();
    angState.b = Number(event.target.value);
    syncAngle();
  });

  $('#angPlay').addEventListener('click', () => {
    angAnim.cancel();
    const maxB = Math.max(10, 180 - angState.a);
    angState.b = 10;
    syncAngle();
    angAnim.value(10, maxB, 3000, value => {
      angState.b = Math.round(value);
      syncAngle();
    });
  });

  $('#angReset').addEventListener('click', () => {
    angAnim.cancel();
    angState.a = 35;
    angState.b = 45;
    syncAngle();
  });

  syncAngle();

  const compState = { x: 35 };
  const compAnim = createAnimator();

  function drawComp(ctx, w, h) {
    const cx = w / 2;
    const cy = h * 0.6;
    const r = Math.min(w, h) * 0.34;
    const x = (compState.x * Math.PI) / 180;

    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.stroke();

    const radial = (angle, color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * 1.08 * Math.cos(angle), cy - r * 1.08 * Math.sin(angle));
      ctx.stroke();
    };

    radial(0, '#2563eb', 2.4);
    radial(x, '#7c3aed', 2.4);
    radial(Math.PI / 2, '#f59e0b', 2);
    radial(Math.PI, '#10b981', 2);

    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.42, 0, -x, true);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.58, -x, -Math.PI / 2, true);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.74, -x, -Math.PI, true);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(cx, cy - 16, 16, 16);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    drawText(ctx, 'O', cx - 14, cy + 16, { color: '#ef4444', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, 'A', cx + r * 1.08 + 6, cy + 4, { color: '#2563eb', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, 'B', cx + r * 1.08 * Math.cos(x) - 4, cy - r * 1.08 * Math.sin(x) - 10, {
      color: '#7c3aed',
      align: 'center',
      font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    drawText(ctx, 'C', cx + 6, cy - r * 1.08 - 8, { color: '#f59e0b', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });
    drawText(ctx, 'D', cx - r * 1.08 - 14, cy + 4, { color: '#10b981', font: '700 13px "PingFang SC", ui-sans-serif, system-ui, sans-serif' });

    drawText(ctx, `∠AOB = ${fmt(compState.x, 0)}°`, cx + r * 0.5 * Math.cos(x / 2), cy - r * 0.5 * Math.sin(x / 2), {
      color: '#7c3aed',
      align: 'center',
      font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    const compMid = (x + Math.PI / 2) / 2;
    drawText(ctx, `余角 ${fmt(90 - compState.x, 0)}°`, cx + r * 0.64 * Math.cos(compMid), cy - r * 0.64 * Math.sin(compMid), {
      color: '#b45309',
      align: 'center',
      font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    const suppMid = (x + Math.PI) / 2;
    drawText(ctx, `补角 ${fmt(180 - compState.x, 0)}°`, cx + r * 0.9 * Math.cos(suppMid), cy - r * 0.9 * Math.sin(suppMid), {
      color: '#047857',
      align: 'center',
      font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
    });
    ctx.restore();
  }

  const renderComp = mountCanvas($('#canvasCompSupp'), drawComp);

  function syncComp() {
    const x = compState.x;
    $('#compX').value = x;
    $('#compXOut').textContent = `${fmt(x, 0)}°`;
    $('#compXRead').textContent = `${fmt(x, 0)}°`;
    $('#compRead').textContent = `${fmt(90 - x, 0)}°`;
    $('#suppRead').textContent = `${fmt(180 - x, 0)}°`;
    $('#compEq').textContent = `余角：90° − ${fmt(x, 0)}° = ${fmt(90 - x, 0)}°`;
    $('#suppEq').textContent = `补角：180° − ${fmt(x, 0)}° = ${fmt(180 - x, 0)}°`;
    renderComp();
  }

  $('#compX').addEventListener('input', event => {
    compAnim.cancel();
    compState.x = Number(event.target.value);
    syncComp();
  });

  $('#compPlay').addEventListener('click', () => {
    compAnim.cancel();
    compState.x = 0;
    syncComp();
    compAnim.value(0, 90, 3200, value => {
      compState.x = Math.round(value);
      syncComp();
    });
  });

  $('#compReset').addEventListener('click', () => {
    compAnim.cancel();
    compState.x = 35;
    syncComp();
  });

  syncComp();

  initQuiz([
    {
      q: '把 6 个同样大小的正方形排成一排，能折成正方体吗？',
      options: ['能', '不能', '一定能', '无法判断'],
      answer: 1,
      explain: '6 个正方形排成一排会首尾重叠，不能围成正方体的 6 个面。正方体展开图需要错开排列。'
    },
    {
      q: '两点之间，最短的是：',
      options: ['直线', '射线', '线段', '折线'],
      answer: 2,
      explain: '两点之间线段最短。两点之间线段的长度，叫两点间的距离。'
    },
    {
      q: '线段 AB = 10，M 是 AB 的中点，AM 等于：',
      options: ['2.5', '5', '10', '20'],
      answer: 1,
      explain: '中点把线段分成两条相等的线段，AM = MB = AB ÷ 2 = 5。'
    },
    {
      q: '一个角是 30°，它的余角是：',
      options: ['30°', '60°', '150°', '330°'],
      answer: 1,
      explain: '互为余角的两个角和为 90°，所以余角 = 90° − 30° = 60°。'
    },
    {
      q: '3 点 30 分，时针与分针的夹角是：',
      options: ['60°', '75°', '90°', '105°'],
      answer: 1,
      explain: '分针指向 6，是 180°；时针在 3 和 4 的正中间，是 105°。夹角 = 180° − 105° = 75°。'
    },
    {
      q: '点 C 在直线 AB 上，AB = 5，BC = 3，则 AC 的长度是：',
      options: ['2', '8', '2 或 8', '无法确定'],
      answer: 2,
      explain: '点 C 可能在线段 AB 上，此时 AC = 5 − 3 = 2；也可能在 AB 的延长线上，此时 AC = 5 + 3 = 8。所以要分类讨论。'
    }
  ]);
})();

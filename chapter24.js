(() => {
  'use strict';

  const K = window.ChapterKit;
  const {
    $, fmt, rad, deg, createAnimator, mountCanvas, makeSquarePlot,
    drawSquareGrid, drawLine, drawCircle, drawArc, fillSector,
    drawPolygon, drawDot, drawText, drawRightAngle
  } = K;

  const goals = [
    '认识圆心、半径、弦、直径、弧、圆心角和圆周角',
    '掌握垂径定理，会在直角三角形里计算',
    '掌握圆周角定理，知道直径所对的圆周角是直角',
    '会判断点、直线与圆的位置关系，理解切线性质',
    '会计算弧长和扇形面积',
    '了解正多边形的中心角、内角和边心距'
  ];
  K.initChecklist(goals, 'math9a-ch24-goals');

  const chordR = 4;
  const chordState = { d: 2 };
  const chordAnim = createAnimator();

  function drawChord(ctx, w, h) {
    const P = makeSquarePlot(w, h, 5);
    drawSquareGrid(ctx, P, 1);
    drawCircle(ctx, P, 0, 0, chordR, '#2563eb', 2.4);

    const d = chordState.d;
    const half = Math.sqrt(Math.max(0, chordR * chordR - d * d));
    const A = [-half, -d];
    const B = [half, -d];
    const M = [0, -d];

    if (half > 0.02) {
      drawLine(ctx, P, A[0], A[1], B[0], B[1], '#f59e0b', 3.2);
    }

    drawLine(ctx, P, 0, 0, A[0], A[1], 'rgba(37, 99, 235, 0.65)', 1.6);
    drawLine(ctx, P, 0, 0, B[0], B[1], 'rgba(37, 99, 235, 0.65)', 1.6);
    drawLine(ctx, P, 0, 0, 0, -d, '#7c3aed', 2, [4, 5]);

    if (d > 0.08 && half > 0.08) {
      drawRightAngle(
        ctx,
        [P.X(0), P.Y(-d)],
        [P.X(0), P.Y(0)],
        [P.X(1), P.Y(-d)],
        10,
        '#7c3aed'
      );
    }

    if (half > 0.02) {
      const aA = Math.atan2(A[1], A[0]);
      let aB = Math.atan2(B[1], B[0]);
      if (aB < aA) aB += Math.PI * 2;
      drawArc(ctx, P, 0, 0, chordR, aA, aB, 'rgba(245, 158, 11, 0.35)', 6);
    }

    drawDot(ctx, P, 0, 0, '#ef4444', 5, 'O', 9, -9);
    if (d > 0.08) drawDot(ctx, P, M[0], M[1], '#7c3aed', 4, 'M', 9, 10);
    if (half > 0.02) {
      drawDot(ctx, P, A[0], A[1], '#2563eb', 5, 'A', -18, -4);
      drawDot(ctx, P, B[0], B[1], '#2563eb', 5, 'B', 9, -4);
    }

    drawText(ctx, 'r', P.X(-1.35), P.Y(-d / 2) - 12, { color: '#2563eb' });
    drawText(ctx, 'd', P.X(0.25), P.Y(-d / 2) + 8, { color: '#7c3aed' });
    if (half > 0.3) {
      drawText(ctx, 'AB/2', P.X(-half / 2), P.Y(-d) - 16, { color: '#b45309', align: 'center' });
    }

    if (d < 0.08) {
      drawText(ctx, 'AB 是直径', P.X(-4.5), P.Y(4.5), { color: '#f59e0b' });
    } else {
      drawText(ctx, '过圆心作弦的垂线，垂足 M 是弦的中点', P.X(-4.6), P.Y(4.5), { color: '#64748b' });
    }
  }

  const renderChord = mountCanvas($('#canvasChord'), drawChord);
  const chordD = $('#chordD');

  function syncChord() {
    const d = chordState.d;
    const half = Math.sqrt(Math.max(0, chordR * chordR - d * d));
    const full = 2 * half;
    chordD.value = d;
    $('#chordDOut').textContent = fmt(d, 1);
    $('#chordDRead').textContent = fmt(d, 1);
    $('#chordHalf').textContent = fmt(half);
    $('#chordLen').textContent = fmt(full);
    $('#chordFormula').textContent = `4² = ${fmt(d)}² + (${fmt(full)}/2)²`;
    renderChord();
  }

  chordD.addEventListener('input', () => {
    chordAnim.cancel();
    chordState.d = Number(chordD.value);
    syncChord();
  });

  $('#chordPlay').addEventListener('click', () => {
    chordAnim.cancel();
    chordState.d = 0;
    syncChord();
    chordAnim.value(0, 3.9, 3600, value => {
      chordState.d = value;
      syncChord();
    });
  });

  $('#chordReset').addEventListener('click', () => {
    chordAnim.cancel();
    chordState.d = 2;
    syncChord();
  });

  syncChord();

  const inscribedState = { t: 0.5, mode: 'arc' };
  const inscribedAnim = createAnimator();
  const inscribedT = $('#inscribedT');
  const inscribedDiameter = $('#inscribedDiameter');

  function inscribedGeometry() {
    const r = 4;
    if (inscribedState.mode === 'diameter') {
      const A = [r * Math.cos(Math.PI), 0];
      const B = [r, 0];
      const pAngle = Math.PI * inscribedState.t;
      const P = [r * Math.cos(pAngle), r * Math.sin(pAngle)];
      return { r, A, B, P, central: 180, arcStart: Math.PI, arcEnd: Math.PI * 2 };
    }

    const aA = rad(210);
    const aB = rad(330);
    const A = [r * Math.cos(aA), r * Math.sin(aA)];
    const B = [r * Math.cos(aB), r * Math.sin(aB)];
    const pAngle = rad(330 + inscribedState.t * 240);
    const P = [r * Math.cos(pAngle), r * Math.sin(pAngle)];
    return { r, A, B, P, central: 120, arcStart: aA, arcEnd: aB };
  }

  function smallArc(ctx, P, cx, cy, radius, a1, a2, color) {
    let delta = a2 - a1;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    drawArc(ctx, P, cx, cy, radius, a1, a1 + delta, color, 2.2);
  }

  function drawInscribed(ctx, w, h) {
    const P = makeSquarePlot(w, h, 5);
    drawSquareGrid(ctx, P, 1);
    const g = inscribedGeometry();
    const { r, A, B, P: pointP, arcStart, arcEnd } = g;

    drawCircle(ctx, P, 0, 0, r, '#2563eb', 2.4);
    drawArc(ctx, P, 0, 0, r, arcStart, arcEnd, '#f59e0b', 5.5);

    drawLine(ctx, P, 0, 0, A[0], A[1], 'rgba(37, 99, 235, 0.65)', 1.6);
    drawLine(ctx, P, 0, 0, B[0], B[1], 'rgba(37, 99, 235, 0.65)', 1.6);
    drawLine(ctx, P, pointP[0], pointP[1], A[0], A[1], '#7c3aed', 1.8);
    drawLine(ctx, P, pointP[0], pointP[1], B[0], B[1], '#7c3aed', 1.8);

    const aO1 = Math.atan2(A[1], A[0]);
    const aO2 = Math.atan2(B[1], B[0]);
    smallArc(ctx, P, 0, 0, 0.95, aO1, aO2, '#2563eb');

    const aP1 = Math.atan2(A[1] - pointP[1], A[0] - pointP[0]);
    const aP2 = Math.atan2(B[1] - pointP[1], B[0] - pointP[0]);
    smallArc(ctx, P, pointP[0], pointP[1], 0.95, aP1, aP2, '#f59e0b');

    drawDot(ctx, P, 0, 0, '#ef4444', 5, 'O', 9, -9);
    drawDot(ctx, P, A[0], A[1], '#2563eb', 5, 'A', -18, -4);
    drawDot(ctx, P, B[0], B[1], '#2563eb', 5, 'B', 9, -4);
    drawDot(ctx, P, pointP[0], pointP[1], '#7c3aed', 5, 'P', 9, -9);

    drawText(ctx, `∠AOB = ${g.central}°`, P.X(-4.6), P.Y(4.5), { color: '#2563eb' });
    drawText(ctx, `∠APB = ${g.central / 2}°`, P.X(2.4), P.Y(4.5), { color: '#b45309' });
  }

  const renderInscribed = mountCanvas($('#canvasInscribed'), drawInscribed);

  function syncInscribed() {
    const g = inscribedGeometry();
    inscribedT.value = inscribedState.t;
    $('#inscribedTOut').textContent = fmt(inscribedState.t, 2);
    $('#inscribedCentral').textContent = `${g.central}°`;
    $('#inscribedAngle').textContent = `${g.central / 2}°`;
    inscribedDiameter.textContent = inscribedState.mode === 'arc' ? 'AB 变成直径' : '恢复 120°';
    renderInscribed();
  }

  inscribedT.addEventListener('input', () => {
    inscribedAnim.cancel();
    inscribedState.t = Number(inscribedT.value);
    syncInscribed();
  });

  $('#inscribedPlay').addEventListener('click', () => {
    inscribedAnim.cancel();
    inscribedState.t = 0.1;
    syncInscribed();
    inscribedAnim.value(0.1, 0.9, 3200, value => {
      inscribedState.t = value;
      syncInscribed();
    });
  });

  inscribedDiameter.addEventListener('click', () => {
    inscribedAnim.cancel();
    inscribedState.mode = inscribedState.mode === 'arc' ? 'diameter' : 'arc';
    inscribedState.t = 0.5;
    syncInscribed();
  });

  $('#inscribedReset').addEventListener('click', () => {
    inscribedAnim.cancel();
    inscribedState.mode = 'arc';
    inscribedState.t = 0.5;
    syncInscribed();
  });

  syncInscribed();

  const lineR = 3.5;
  const lineState = { d: 2 };
  const lineAnim = createAnimator();

  function drawLineCircle(ctx, w, h) {
    const P = makeSquarePlot(w, h, 6);
    drawSquareGrid(ctx, P, 1);
    drawCircle(ctx, P, 0, 0, lineR, '#2563eb', 2.4);
    drawLine(ctx, P, -5.4, -lineState.d, 5.4, -lineState.d, '#0f172a', 2.2);
    drawLine(ctx, P, 0, 0, 0, -lineState.d, '#7c3aed', 1.8, [4, 5]);

    if (lineState.d > 0.08) {
      drawRightAngle(
        ctx,
        [P.X(0), P.Y(-lineState.d)],
        [P.X(0), P.Y(0)],
        [P.X(1), P.Y(-lineState.d)],
        10,
        '#7c3aed'
      );
    }

    const d = lineState.d;
    if (d < lineR - 0.05) {
      const half = Math.sqrt(lineR * lineR - d * d);
      drawDot(ctx, P, -half, -d, '#ef4444', 5, '');
      drawDot(ctx, P, half, -d, '#ef4444', 5, '');
      drawText(ctx, '两个公共点', P.X(-4.7), P.Y(5.3), { color: '#047857' });
    } else if (Math.abs(d - lineR) <= 0.05) {
      drawDot(ctx, P, 0, -d, '#f59e0b', 6, '切点');
      drawText(ctx, '相切：一个公共点', P.X(-4.7), P.Y(5.3), { color: '#b45309' });
    } else {
      drawText(ctx, '相离：没有公共点', P.X(-4.7), P.Y(5.3), { color: '#b91c1c' });
    }

    drawLine(ctx, P, 0, 0, lineR, 0, 'rgba(37, 99, 235, 0.55)', 1.5);
    drawDot(ctx, P, 0, 0, '#ef4444', 5, 'O', 9, -9);
    drawText(ctx, 'd', P.X(0.25), P.Y(-d / 2) + 8, { color: '#7c3aed' });
    drawText(ctx, 'r', P.X(lineR / 2), P.Y(0) - 11, { color: '#2563eb' });
  }

  const renderLineCircle = mountCanvas($('#canvasLineCircle'), drawLineCircle);
  const lineD = $('#lineD');

  function syncLineCircle() {
    const d = lineState.d;
    lineD.value = d;
    $('#lineDOut').textContent = fmt(d, 1);
    $('#lineDRead').textContent = fmt(d, 1);

    let relation;
    let points;
    if (d < lineR - 0.05) {
      relation = '相交';
      points = 2;
    } else if (Math.abs(d - lineR) <= 0.05) {
      relation = '相切';
      points = 1;
    } else {
      relation = '相离';
      points = 0;
    }

    $('#lineRelation').textContent = relation;
    $('#linePoints').textContent = points;
    renderLineCircle();
  }

  lineD.addEventListener('input', () => {
    lineAnim.cancel();
    lineState.d = Number(lineD.value);
    syncLineCircle();
  });

  $('#linePlay').addEventListener('click', () => {
    lineAnim.cancel();
    lineState.d = 0;
    syncLineCircle();
    lineAnim.value(0, 5.5, 4000, value => {
      lineState.d = value;
      syncLineCircle();
    });
  });

  $('#lineReset').addEventListener('click', () => {
    lineAnim.cancel();
    lineState.d = 2;
    syncLineCircle();
  });

  syncLineCircle();

  const sectorState = { r: 4, theta: 120 };
  const sectorAnim = createAnimator();
  const sectorR = $('#sectorR');
  const sectorTheta = $('#sectorTheta');

  function drawSector(ctx, w, h) {
    const P = makeSquarePlot(w, h, 6);
    drawSquareGrid(ctx, P, 1);
    const { r } = sectorState;
    const theta = rad(sectorState.theta);
    const a1 = Math.PI / 2 - theta / 2;
    const a2 = Math.PI / 2 + theta / 2;

    drawCircle(ctx, P, 0, 0, r, '#93c5fd', 1.8);
    fillSector(ctx, P, 0, 0, r, a1, a2, 'rgba(37, 99, 235, 0.16)');
    drawLine(ctx, P, 0, 0, r * Math.cos(a1), r * Math.sin(a1), '#2563eb', 1.8);
    drawLine(ctx, P, 0, 0, r * Math.cos(a2), r * Math.sin(a2), '#2563eb', 1.8);
    drawArc(ctx, P, 0, 0, r, a1, a2, '#f59e0b', 5);
    drawArc(ctx, P, 0, 0, 0.9, a1, a2, '#f59e0b', 2);

    drawDot(ctx, P, 0, 0, '#ef4444', 5, 'O', 9, -9);
    drawText(ctx, 'r', P.X(r * 0.48 * Math.cos(a2) + 0.15), P.Y(r * 0.48 * Math.sin(a2) + 0.15), {
      color: '#2563eb'
    });
    drawText(ctx, `θ = ${fmt(sectorState.theta, 0)}°`, P.X(0), P.Y(0.55), {
      color: '#b45309',
      align: 'center'
    });
  }

  const renderSector = mountCanvas($('#canvasSector'), drawSector);

  function syncSector() {
    const { r, theta } = sectorState;
    const arc = (theta / 360) * 2 * Math.PI * r;
    const area = (theta / 360) * Math.PI * r * r;
    sectorR.value = r;
    sectorTheta.value = theta;
    $('#sectorROut').textContent = fmt(r, 1);
    $('#sectorThetaOut').textContent = `${fmt(theta, 0)}°`;
    $('#sectorArc').textContent = fmt(arc);
    $('#sectorArea').textContent = fmt(area);
    renderSector();
  }

  sectorR.addEventListener('input', () => {
    sectorAnim.cancel();
    sectorState.r = Number(sectorR.value);
    syncSector();
  });

  sectorTheta.addEventListener('input', () => {
    sectorAnim.cancel();
    sectorState.theta = Number(sectorTheta.value);
    syncSector();
  });

  $('#sectorPlay').addEventListener('click', () => {
    sectorAnim.cancel();
    sectorState.theta = 30;
    syncSector();
    sectorAnim.value(30, 330, 4200, value => {
      sectorState.theta = value;
      syncSector();
    });
  });

  $('#sectorReset').addEventListener('click', () => {
    sectorAnim.cancel();
    sectorState.r = 4;
    sectorState.theta = 120;
    syncSector();
  });

  syncSector();

  const polyState = { n: 6 };
  const polyR = 4;
  const polyN = $('#polyN');

  function drawPolygonDemo(ctx, w, h) {
    const P = makeSquarePlot(w, h, 5.5);
    drawSquareGrid(ctx, P, 1);
    const n = polyState.n;
    const start = Math.PI / 2;
    const vertices = [];
    for (let i = 0; i < n; i += 1) {
      const a = start + (i * Math.PI * 2) / n;
      vertices.push([polyR * Math.cos(a), polyR * Math.sin(a)]);
    }

    drawCircle(ctx, P, 0, 0, polyR, '#93c5fd', 1.8, [4, 5]);

    const A = vertices[0];
    const B = vertices[1];
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];

    drawPolygon(ctx, P, vertices, {
      fill: 'rgba(37, 99, 235, 0.08)',
      stroke: '#2563eb',
      width: 2.4
    });

    drawPolygon(ctx, P, [[0, 0], A, B], {
      fill: 'rgba(245, 158, 11, 0.16)',
      stroke: '#f59e0b',
      width: 1.8
    });

    drawLine(ctx, P, 0, 0, A[0], A[1], '#2563eb', 2);
    drawLine(ctx, P, 0, 0, B[0], B[1], '#2563eb', 2);
    drawLine(ctx, P, 0, 0, M[0], M[1], '#7c3aed', 2, [4, 5]);

    drawRightAngle(
      ctx,
      [P.X(M[0]), P.Y(M[1])],
      [P.X(0), P.Y(0)],
      [P.X(B[0]), P.Y(B[1])],
      9,
      '#7c3aed'
    );

    drawDot(ctx, P, 0, 0, '#ef4444', 5, 'O', 9, -9);
    drawDot(ctx, P, A[0], A[1], '#2563eb', 5, 'A', -18, -4);
    drawDot(ctx, P, B[0], B[1], '#2563eb', 5, 'B', 9, -4);
    drawDot(ctx, P, M[0], M[1], '#7c3aed', 4, 'M', 9, 10);

    drawText(ctx, 'R', P.X(A[0] * 0.45 + 0.15), P.Y(A[1] * 0.45) - 10, { color: '#2563eb' });
    drawText(ctx, 'a', P.X(M[0] * 0.45 + 0.2), P.Y(M[1] * 0.45) + 12, { color: '#7c3aed' });
    drawText(ctx, `正 ${n} 边形`, P.X(-5.2), P.Y(4.9), { color: '#2563eb' });
  }

  const renderPolygon = mountCanvas($('#canvasPolygon'), drawPolygonDemo);

  function syncPolygon() {
    const n = polyState.n;
    const central = 360 / n;
    const interior = ((n - 2) * 180) / n;
    const side = 2 * polyR * Math.sin(Math.PI / n);
    const apothem = polyR * Math.cos(Math.PI / n);
    polyN.value = n;
    $('#polyNOut').textContent = n;
    $('#polyCentral').textContent = `${fmt(central, 1)}°`;
    $('#polyInterior').textContent = `${fmt(interior, 1)}°`;
    $('#polySide').textContent = fmt(side);
    $('#polyApothem').textContent = fmt(apothem);
    renderPolygon();
  }

  polyN.addEventListener('input', () => {
    polyState.n = Number(polyN.value);
    syncPolygon();
  });

  syncPolygon();

  K.initQuiz([
    {
      q: '圆的半径是 5，圆心到弦的距离是 3，这条弦长是：',
      options: ['4', '6', '8', '10'],
      answer: 2,
      explain: '半弦长 = √(5² − 3²) = √16 = 4，所以整条弦长是 2 × 4 = 8。'
    },
    {
      q: '同弧所对的圆心角是 100°，它所对的圆周角是：',
      options: ['25°', '50°', '100°', '200°'],
      answer: 1,
      explain: '同弧所对的圆周角等于圆心角的一半，所以是 100° ÷ 2 = 50°。'
    },
    {
      q: '直径所对的圆周角是：',
      options: ['30°', '60°', '90°', '180°'],
      answer: 2,
      explain: '直径所对的圆周角是直角，即 90°；反过来，90° 的圆周角所对的弦是直径。'
    },
    {
      q: '圆的半径是 3，圆心到直线的距离是 5，直线与圆：',
      options: ['相交', '相切', '相离', '无法判断'],
      answer: 2,
      explain: 'd = 5 > r = 3，所以直线与圆相离，没有公共点。'
    },
    {
      q: '半径是 6，圆心角是 60° 的弧长是：',
      options: ['π', '2π', '3π', '6π'],
      answer: 1,
      explain: 'L = nπr/180 = 60 × π × 6 / 180 = 2π。'
    },
    {
      q: '半径是 3，圆心角是 120° 的扇形面积是：',
      options: ['π', '2π', '3π', '6π'],
      answer: 2,
      explain: 'S = nπr²/360 = 120 × π × 9 / 360 = 3π。'
    }
  ]);
})();

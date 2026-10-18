(() => {
  'use strict';

  const K = window.ChapterKit;
  const {
    $, fmt, deg, rad, rotatePoint, createAnimator, mountCanvas,
    makeSquarePlot, drawSquareGrid, drawLine, drawCircle, drawArc,
    drawPolygon, drawDot, drawText
  } = K;

  const goals = [
    '能说出旋转的三要素：中心、方向、角度',
    '理解对应点到旋转中心的距离相等',
    '理解对应点与中心连线的夹角等于旋转角',
    '认识中心对称，知道关于原点对称的坐标规律',
    '能用旋转设计简单的对称图案'
  ];
  K.initChecklist(goals, 'math9a-ch23-goals');

  const rotationState = { angle: 90, dir: 1 };
  const rotationAnim = createAnimator();
  const shape = [
    [2, 0],
    [3.2, 0.6],
    [3.4, 2.4],
    [2.2, 3.1],
    [1.1, 1.7]
  ];
  const pointA = shape[0];

  function drawRotation(ctx, w, h) {
    const P = makeSquarePlot(w, h, 5);
    drawSquareGrid(ctx, P, 1);

    drawPolygon(ctx, P, shape, {
      fill: 'rgba(37, 99, 235, 0.14)',
      stroke: '#2563eb',
      width: 2.4
    });

    const angleRad = rad(rotationState.angle) * rotationState.dir;
    const image = shape.map(([x, y]) => rotatePoint(x, y, angleRad));
    drawPolygon(ctx, P, image, {
      fill: 'rgba(245, 158, 11, 0.16)',
      stroke: '#f59e0b',
      width: 2.4
    });

    const [ax, ay] = pointA;
    const [bx, by] = rotatePoint(ax, ay, angleRad);
    const radius = Math.hypot(ax, ay);

    drawCircle(ctx, P, 0, 0, radius, '#fcd34d', 1.4, [4, 5]);
    drawLine(ctx, P, 0, 0, ax, ay, '#94a3b8', 1.4, [4, 5]);
    drawLine(ctx, P, 0, 0, bx, by, '#f59e0b', 1.4, [4, 5]);

    if (rotationState.angle > 0.5) {
      const a1 = Math.atan2(ay, ax);
      const a2 = a1 + angleRad;
      drawArc(ctx, P, 0, 0, radius * 0.62, a1, a2, '#f59e0b', 2.4);
      const mid = a1 + angleRad / 2;
      const labelR = radius * 0.78;
      drawText(ctx, `θ = ${fmt(rotationState.angle, 0)}°`, P.X(Math.cos(mid) * labelR), P.Y(Math.sin(mid) * labelR), {
        color: '#b45309',
        align: 'center',
        font: '700 12px "PingFang SC", ui-sans-serif, system-ui, sans-serif'
      });
    }

    drawDot(ctx, P, 0, 0, '#ef4444', 5, 'O', 9, -9);
    drawDot(ctx, P, ax, ay, '#2563eb', 5, 'A', 9, -9);
    drawDot(ctx, P, bx, by, '#f59e0b', 5, 'A′', 9, -9);

    drawText(ctx, '原图', P.X(-4.6), P.Y(4.5), { color: '#2563eb' });
    drawText(ctx, '旋转后', P.X(2.7), P.Y(4.5), { color: '#b45309' });
  }

  const renderRotation = mountCanvas($('#canvasRotation'), drawRotation);
  const rotAngle = $('#rotAngle');
  const rotCCW = $('#rotCCW');
  const rotCW = $('#rotCW');

  function syncRotation() {
    rotAngle.value = rotationState.angle;
    $('#rotAngleOut').textContent = `${fmt(rotationState.angle, 0)}°`;
    $('#rotAngleRead').textContent = `${fmt(rotationState.angle, 0)}°`;
    $('#rotDirRead').textContent = rotationState.dir === 1 ? '逆时针' : '顺时针';
    $('#rotDistRead').textContent = `OA = OA′ = ${fmt(Math.hypot(pointA[0], pointA[1]))}`;
    rotCCW.classList.toggle('ghost', rotationState.dir !== 1);
    rotCW.classList.toggle('ghost', rotationState.dir !== -1);
    renderRotation();
  }

  rotAngle.addEventListener('input', () => {
    rotationAnim.cancel();
    rotationState.angle = Number(rotAngle.value);
    syncRotation();
  });

  rotCCW.addEventListener('click', () => {
    rotationAnim.cancel();
    rotationState.dir = 1;
    syncRotation();
  });

  rotCW.addEventListener('click', () => {
    rotationAnim.cancel();
    rotationState.dir = -1;
    syncRotation();
  });

  $('#rotPlay').addEventListener('click', () => {
    rotationAnim.cancel();
    rotationState.angle = 0;
    syncRotation();
    rotationAnim.value(0, 360, 4200, value => {
      rotationState.angle = value;
      syncRotation();
    });
  });

  $('#rotReset').addEventListener('click', () => {
    rotationAnim.cancel();
    rotationState.angle = 90;
    rotationState.dir = 1;
    syncRotation();
  });

  syncRotation();

  const centerState = { angle: 180 };
  const centerAnim = createAnimator();
  const centerShape = [
    [-3.2, -1.2],
    [-1.6, 1.8],
    [0.4, -0.4]
  ];

  function drawCenter(ctx, w, h) {
    const P = makeSquarePlot(w, h, 5);
    drawSquareGrid(ctx, P, 1);

    drawPolygon(ctx, P, centerShape, {
      fill: 'rgba(37, 99, 235, 0.14)',
      stroke: '#2563eb',
      width: 2.4
    });

    const angleRad = rad(centerState.angle);
    const image = centerShape.map(([x, y]) => rotatePoint(x, y, angleRad));
    drawPolygon(ctx, P, image, {
      fill: 'rgba(124, 58, 237, 0.14)',
      stroke: '#7c3aed',
      width: 2.4
    });

    const [ax, ay] = centerShape[0];
    const [bx, by] = rotatePoint(ax, ay, angleRad);

    drawLine(ctx, P, ax, ay, bx, by, '#c4b5fd', 1.4, [4, 5]);
    drawLine(ctx, P, 0, 0, ax, ay, '#94a3b8', 1.3, [4, 5]);
    drawLine(ctx, P, 0, 0, bx, by, '#94a3b8', 1.3, [4, 5]);

    if (centerState.angle > 0.5) {
      const a1 = Math.atan2(ay, ax);
      drawArc(ctx, P, 0, 0, Math.hypot(ax, ay) * 0.64, a1, a1 + angleRad, '#8b5cf6', 2.2);
    }

    drawDot(ctx, P, 0, 0, '#ef4444', 5, 'O', 9, -9);
    drawDot(ctx, P, ax, ay, '#2563eb', 5, 'A', 9, -9);
    drawDot(ctx, P, bx, by, '#7c3aed', 5, 'A′', 9, -9);

    drawText(ctx, '旋转 180° 就是中心对称', P.X(-4.6), P.Y(4.5), { color: '#7c3aed' });
  }

  const renderCenter = mountCanvas($('#canvasCenter'), drawCenter);
  const centerAngle = $('#centerAngle');

  function syncCenter() {
    centerAngle.value = centerState.angle;
    $('#centerAngleOut').textContent = `${fmt(centerState.angle, 0)}°`;
    $('#centerRead').textContent = `${fmt(centerState.angle, 0)}°`;
    $('#centerRelation').textContent =
      Math.abs(centerState.angle - 180) < 0.5
        ? 'A、O、A′ 共线，OA = OA′'
        : '还没到 180°，继续转到 180° 看中心对称';
    renderCenter();
  }

  centerAngle.addEventListener('input', () => {
    centerAnim.cancel();
    centerState.angle = Number(centerAngle.value);
    syncCenter();
  });

  $('#centerPlay').addEventListener('click', () => {
    centerAnim.cancel();
    centerState.angle = 0;
    syncCenter();
    centerAnim.value(0, 180, 2200, value => {
      centerState.angle = value;
      syncCenter();
    });
  });

  $('#centerReset').addEventListener('click', () => {
    centerAnim.cancel();
    centerState.angle = 180;
    syncCenter();
  });

  syncCenter();

  const coordState = { x: 3, y: 2 };
  const coordX = $('#coordX');
  const coordY = $('#coordY');

  function drawCoord(ctx, w, h) {
    const P = makeSquarePlot(w, h, 6);
    drawSquareGrid(ctx, P, 1);

    const { x, y } = coordState;
    const px = -x;
    const py = -y;

    drawLine(ctx, P, x, y, px, py, '#c4b5fd', 1.5, [4, 5]);
    drawDot(ctx, P, 0, 0, '#94a3b8', 4, 'O', 9, -9);
    drawDot(ctx, P, x, y, '#2563eb', 6);
    drawDot(ctx, P, px, py, '#7c3aed', 6);

    drawText(ctx, `P(${fmt(x)}, ${fmt(y)})`, P.X(x) + 10, P.Y(y) - 16, { color: '#2563eb' });
    drawText(ctx, `P′(${fmt(px)}, ${fmt(py)})`, P.X(px) + 10, P.Y(py) + 16, { color: '#7c3aed' });

    drawText(ctx, '关于原点对称：两个坐标都变相反数', P.X(-5.6), P.Y(5.3), { color: '#64748b' });
  }

  const renderCoord = mountCanvas($('#canvasCoord'), drawCoord);

  function syncCoord() {
    coordX.value = coordState.x;
    coordY.value = coordState.y;
    $('#coordXOut').textContent = fmt(coordState.x, 1);
    $('#coordYOut').textContent = fmt(coordState.y, 1);
    $('#coordP').textContent = `(${fmt(coordState.x)}, ${fmt(coordState.y)})`;
    $('#coordP2').textContent = `(${fmt(-coordState.x)}, ${fmt(-coordState.y)})`;
    renderCoord();
  }

  coordX.addEventListener('input', () => {
    coordState.x = Number(coordX.value);
    syncCoord();
  });

  coordY.addEventListener('input', () => {
    coordState.y = Number(coordY.value);
    syncCoord();
  });

  $('#coordReset').addEventListener('click', () => {
    coordState.x = 3;
    coordState.y = 2;
    syncCoord();
  });

  syncCoord();

  const patternState = { n: 6, reveal: 6 };
  const patternAnim = createAnimator();
  const patternN = $('#patternN');

  function drawPattern(ctx, w, h) {
    const P = makeSquarePlot(w, h, 5);
    const { n, reveal } = patternState;

    ctx.save();
    ctx.beginPath();
    ctx.arc(P.X(0), P.Y(0), 2.8 * P.scale, 0, Math.PI * 2);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 5]);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(P.X(0), P.Y(0));
    ctx.scale(P.scale, -P.scale);
    for (let i = 0; i < reveal; i += 1) {
      const hue = (i * 360) / n;
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / n);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(1.5, 0.95, 2.75, 0);
      ctx.quadraticCurveTo(1.5, -0.95, 0, 0);
      ctx.fillStyle = `hsla(${hue}, 72%, 62%, 0.82)`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 60%, 45%, 0.7)`;
      ctx.lineWidth = 1.2 / P.scale;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    drawDot(ctx, P, 0, 0, '#0f172a', 4);
    drawText(ctx, `n = ${n}，每份旋转 ${fmt(360 / n, 1)}°`, P.X(-4.6), P.Y(4.5), { color: '#7c3aed' });
  }

  const renderPattern = mountCanvas($('#canvasPattern'), drawPattern);

  function syncPattern() {
    patternN.value = patternState.n;
    $('#patternNOut').textContent = patternState.n;
    $('#patternStep').textContent = `360° ÷ ${patternState.n} = ${fmt(360 / patternState.n, 1)}°`;
    $('#patternCount').textContent = `${patternState.reveal} / ${patternState.n} 份`;
    renderPattern();
  }

  patternN.addEventListener('input', () => {
    patternAnim.cancel();
    patternState.n = Number(patternN.value);
    patternState.reveal = patternState.n;
    syncPattern();
  });

  $('#patternPlay').addEventListener('click', () => {
    patternAnim.cancel();
    patternState.reveal = 0;
    syncPattern();
    patternAnim.value(0, patternState.n, 2600, value => {
      patternState.reveal = Math.max(1, Math.round(value));
      syncPattern();
    }, () => {
      patternState.reveal = patternState.n;
      syncPattern();
    });
  });

  $('#patternReset').addEventListener('click', () => {
    patternAnim.cancel();
    patternState.n = 6;
    patternState.reveal = 6;
    syncPattern();
  });

  syncPattern();

  K.initQuiz([
    {
      q: '旋转的三要素是：',
      options: ['旋转中心、旋转方向、旋转角', '边长、面积、周长', '横坐标、纵坐标、原点', '对称轴、顶点、开口'],
      answer: 0,
      explain: '旋转由旋转中心、旋转方向和旋转角共同确定。三者确定，旋转后的位置就确定了。'
    },
    {
      q: '一个图形绕点 O 旋转后，对应点到点 O 的距离：',
      options: ['变大', '变小', '相等', '无法判断'],
      answer: 2,
      explain: '旋转不改变图形的大小，也不改变点到旋转中心的距离，所以对应点到旋转中心的距离相等。'
    },
    {
      q: '中心对称是旋转多少度？',
      options: ['90°', '120°', '180°', '360°'],
      answer: 2,
      explain: '中心对称就是绕对称中心旋转 180° 后能与另一个图形重合。'
    },
    {
      q: '点 (3, −2) 关于原点对称的点是：',
      options: ['(3, 2)', '(−3, −2)', '(−3, 2)', '(2, −3)'],
      answer: 2,
      explain: '关于原点对称，横坐标、纵坐标都变成相反数：(x, y) → (−x, −y)，所以 (3, −2) → (−3, 2)。'
    },
    {
      q: '钟表的分针 20 分钟转多少度？',
      options: ['30°', '60°', '120°', '180°'],
      answer: 2,
      explain: '分针每分钟转 360° ÷ 60 = 6°，20 分钟转 20 × 6° = 120°。'
    },
    {
      q: '正方形绕它的中心至少旋转多少度能与自身重合？',
      options: ['45°', '60°', '90°', '180°'],
      answer: 2,
      explain: '正方形绕中心旋转 90° 后，四个顶点位置互换，图形与自身重合；45° 时不会重合。'
    }
  ]);
})();

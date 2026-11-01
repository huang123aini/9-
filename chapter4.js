(() => {
  'use strict';

  const K = window.ChapterKit;
  const {
    $, $$, fmt, initChecklist, initQuiz
  } = K;

  const goals = [
    '能说出单项式的系数和次数',
    '能识别多项式及其项、常数项和次数',
    '能判断两个项是不是同类项',
    '会合并同类项',
    '会去括号，并进行整式加减与化简求值'
  ];
  initChecklist(goals, 'math7a-ch4-goals');

  function coefficientTerm(coef, variable, colorClass) {
    if (coef === 0) {
      return '<span class="term-chip plain">0</span>';
    }
    const abs = Math.abs(coef);
    const number = abs === 1 ? '' : abs;
    const sign = coef < 0 ? '−' : '';
    const cls = coef < 0 ? `${colorClass}-neg` : `${colorClass}-pos`;
    return `<span class="term-chip ${cls}">${sign}${number}${variable}</span>`;
  }

  function signedTerm(coef, variable) {
    if (coef === 0) return '0';
    const abs = Math.abs(coef);
    const number = abs === 1 ? '' : abs;
    return `${coef < 0 ? '−' : ''}${number}${variable}`;
  }

  function twoVarText(xCoef, yCoef) {
    const parts = [];
    if (xCoef !== 0) parts.push(signedTerm(xCoef, 'x'));
    if (yCoef !== 0) parts.push(`${yCoef < 0 ? '−' : '+'} ${signedTerm(Math.abs(yCoef), 'y')}`);
    if (!parts.length) return '0';
    return parts.join(' ').replace(/^\+ /, '');
  }

  function fourTermText(a, b, c, d) {
    const parts = [];
    if (a !== 0) parts.push(signedTerm(a, 'x'));
    if (b !== 0) parts.push(`${b < 0 ? '−' : '+'} ${signedTerm(Math.abs(b), 'y')}`);
    if (c !== 0) parts.push(`${c < 0 ? '−' : '+'} ${signedTerm(Math.abs(c), 'x')}`);
    if (d !== 0) parts.push(`${d < 0 ? '−' : '+'} ${signedTerm(Math.abs(d), 'y')}`);
    if (!parts.length) return '0';
    return parts.join(' ').replace(/^\+ /, '');
  }

  const likeState = { a: 3, b: 2, c: -1, d: 4 };

  function renderLikeTerms() {
    const { a, b, c, d } = likeState;
    const xCoef = a + c;
    const yCoef = b + d;

    $('#likeTermsBoard').innerHTML = `
      <div>
        <div class="term-row-label">x 的同类项</div>
        <div class="term-row">
          ${coefficientTerm(a, 'x', 'x')}
          ${coefficientTerm(c, 'x', 'x')}
          <span class="term-chip plain">→</span>
          ${coefficientTerm(xCoef, 'x', 'x')}
        </div>
      </div>
      <div>
        <div class="term-row-label">y 的同类项</div>
        <div class="term-row">
          ${coefficientTerm(b, 'y', 'y')}
          ${coefficientTerm(d, 'y', 'y')}
          <span class="term-chip plain">→</span>
          ${coefficientTerm(yCoef, 'y', 'y')}
        </div>
      </div>
      <div class="term-result">${twoVarText(xCoef, yCoef)}</div>
    `;

    $('#likeA').value = a;
    $('#likeB').value = b;
    $('#likeC').value = c;
    $('#likeD').value = d;
    $('#likeAOut').textContent = fmt(a, 0);
    $('#likeBOut').textContent = fmt(b, 0);
    $('#likeCOut').textContent = fmt(c, 0);
    $('#likeDOut').textContent = fmt(d, 0);

    $('#likeExpr').textContent = fourTermText(a, b, c, d);
    $('#likeResult').textContent = `= ${twoVarText(xCoef, yCoef)}`;
    $('#likeX').textContent = `${fmt(a, 0)} + (${fmt(c, 0)}) = ${fmt(xCoef, 0)}`;
    $('#likeY').textContent = `${fmt(b, 0)} + ${fmt(d, 0)} = ${fmt(yCoef, 0)}`;
  }

  ['likeA', 'likeB', 'likeC', 'likeD'].forEach(id => {
    $(`#${id}`).addEventListener('input', event => {
      const key = id.slice(-1).toLowerCase();
      likeState[key] = Number(event.target.value);
      renderLikeTerms();
    });
  });

  renderLikeTerms();

  const bracketSteps = [
    {
      eq: '3(x + 2) − 2(x − 1)',
      title: '先看原式',
      text: '两个括号，前面分别是 3 和 −2。去括号时，要把外面的数乘到括号里的每一项。'
    },
    {
      eq: '= 3x + 6 − 2(x − 1)',
      title: '先分配第一个括号',
      text: '3 乘括号里的每一项：3 × x = 3x，3 × 2 = 6。'
    },
    {
      eq: '= 3x + 6 − 2x + 2',
      title: '再分配第二个括号',
      text: '−2 乘 x 得 −2x；−2 乘 (−1) 得 +2。注意负负得正。'
    },
    {
      eq: '= (3x − 2x) + (6 + 2)',
      title: '把同类项放在一起',
      text: 'x 项和常数项分别合并，避免漏项。'
    },
    {
      eq: '= x + 8',
      title: '合并同类项',
      text: '3x − 2x = x，6 + 2 = 8，所以结果是 x + 8。'
    }
  ];

  let bracketStep = 0;
  let bracketTimer = null;
  const bracketDots = $('#bracketDots');
  const bracketPrev = $('#bracketPrev');
  const bracketNext = $('#bracketNext');
  const bracketAuto = $('#bracketAuto');

  $('#bracketChips').innerHTML = `
    <span class="term-chip x-pos">3(x + 2)</span>
    <span class="term-chip x-neg">−2(x − 1)</span>
  `;

  bracketSteps.forEach((step, index) => {
    const dot = document.createElement('button');
    dot.className = 'step-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `第 ${index + 1} 步`);
    dot.addEventListener('click', () => {
      stopBracketAuto();
      setBracketStep(index);
    });
    bracketDots.appendChild(dot);
  });

  function stopBracketAuto() {
    if (bracketTimer) {
      clearInterval(bracketTimer);
      bracketTimer = null;
    }
    bracketAuto.textContent = '自动播放';
  }

  function setBracketStep(index) {
    bracketStep = Math.max(0, Math.min(bracketSteps.length - 1, index));
    const step = bracketSteps[bracketStep];
    $('#bracketEq').textContent = step.eq;
    $('#bracketStepNum').textContent = `第 ${bracketStep + 1} / ${bracketSteps.length} 步`;
    $('#bracketTitle').textContent = step.title;
    $('#bracketText').textContent = step.text;
    bracketPrev.disabled = bracketStep === 0;
    bracketNext.disabled = bracketStep === bracketSteps.length - 1;

    $$('.step-dot', bracketDots).forEach((dot, i) => {
      dot.classList.toggle('active', i === bracketStep);
    });

    $$('#brackets .eq-line').forEach(line => {
      const min = Number(line.dataset.minStep);
      line.classList.toggle('on', bracketStep >= min);
      line.classList.toggle('active', min === bracketStep);
    });
  }

  bracketPrev.addEventListener('click', () => {
    stopBracketAuto();
    setBracketStep(bracketStep - 1);
  });

  bracketNext.addEventListener('click', () => {
    stopBracketAuto();
    setBracketStep(bracketStep + 1);
  });

  bracketAuto.addEventListener('click', () => {
    if (bracketTimer) {
      stopBracketAuto();
      return;
    }
    bracketAuto.textContent = '暂停';
    bracketStep = -1;
    setBracketStep(0);
    bracketTimer = setInterval(() => {
      if (bracketStep >= bracketSteps.length - 1) {
        stopBracketAuto();
        return;
      }
      setBracketStep(bracketStep + 1);
    }, 1500);
  });

  setBracketStep(0);

  const polyState = {
    a: 3, b: -2, c: 5,
    d: 1, e: 4, f: -3,
    op: 'add'
  };

  function formatPolyResult(a, b, c) {
    const parts = [];
    if (a !== 0) parts.push(signedTerm(a, 'x²'));
    if (b !== 0) parts.push(`${b < 0 ? '−' : '+'} ${signedTerm(Math.abs(b), 'x')}`);
    if (c !== 0) parts.push(`${c < 0 ? '−' : '+'} ${Math.abs(c)}`);
    if (!parts.length) return '0';
    return parts.join(' ').replace(/^\+ /, '');
  }

  function renderPoly() {
    const { a, b, c, d, e, f, op } = polyState;
    const sign = op === 'add' ? 1 : -1;
    const ra = a + sign * d;
    const rb = b + sign * e;
    const rc = c + sign * f;

    $('#polyTable').innerHTML = `
      <thead><tr><th></th><th>x²</th><th>x</th><th>常数项</th></tr></thead>
      <tbody>
        <tr><td>P</td><td>${signedTerm(a, 'x²')}</td><td>${signedTerm(b, 'x')}</td><td>${fmt(c, 0)}</td></tr>
        <tr><td>${op === 'add' ? '+' : '−'}</td><td>${signedTerm(d, 'x²')}</td><td>${signedTerm(e, 'x')}</td><td>${fmt(f, 0)}</td></tr>
        <tr><td>=</td><td>${signedTerm(ra, 'x²')}</td><td>${signedTerm(rb, 'x')}</td><td>${fmt(rc, 0)}</td></tr>
      </tbody>
    `;

    $('#polyOpRead').textContent = op === 'add' ? 'P + Q' : 'P − Q';
    $('#polyResult').textContent = formatPolyResult(ra, rb, rc);
    $('#polyAdd').classList.toggle('ghost', op !== 'add');
    $('#polySub').classList.toggle('ghost', op !== 'sub');

    ['a', 'b', 'c', 'd', 'e', 'f'].forEach(key => {
      const el = $(`#poly${key.toUpperCase()}`);
      if (el) el.value = polyState[key];
      const out = $(`#poly${key.toUpperCase()}Out`);
      if (out) out.textContent = fmt(polyState[key], 0);
    });
  }

  ['a', 'b', 'c', 'd', 'e', 'f'].forEach(key => {
    const el = $(`#poly${key.toUpperCase()}`);
    el.addEventListener('input', event => {
      polyState[key] = Number(event.target.value);
      renderPoly();
    });
  });

  $('#polyAdd').addEventListener('click', () => {
    polyState.op = 'add';
    renderPoly();
  });

  $('#polySub').addEventListener('click', () => {
    polyState.op = 'sub';
    renderPoly();
  });

  renderPoly();

  initQuiz([
    {
      q: '下列各组中，是同类项的是：',
      options: ['3x 与 3x²', '2xy 与 2x', '−5x²y 与 2x²y', '3a 与 3b'],
      answer: 2,
      explain: '同类项要求字母相同，并且相同字母的指数也相同。−5x²y 与 2x²y 都含 x²y，是同类项。'
    },
    {
      q: '合并同类项 3a + 2b − a + 4b 的结果是：',
      options: ['2a + 6b', '2a + 2b', '4a + 6b', '3a + 6b'],
      answer: 0,
      explain: 'a 的同类项：3a − a = 2a；b 的同类项：2b + 4b = 6b。所以结果是 2a + 6b。'
    },
    {
      q: '2(x + 3) 去括号后是：',
      options: ['2x + 3', '2x + 6', 'x + 6', '2x − 6'],
      answer: 1,
      explain: '用分配律，2 要乘括号里的每一项：2 × x = 2x，2 × 3 = 6，所以是 2x + 6。'
    },
    {
      q: 'a − (b − c) 去括号后是：',
      options: ['a − b − c', 'a − b + c', 'a + b − c', 'a + b + c'],
      answer: 1,
      explain: '括号前是负号，括号里每一项都变号：a − b + c。'
    },
    {
      q: '化简 2(3x − 1) − (x + 2) 的结果是：',
      options: ['5x − 4', '5x', '5x + 4', '7x − 4'],
      answer: 0,
      explain: '2(3x − 1) = 6x − 2，−(x + 2) = −x − 2，合并得 5x − 4。'
    },
    {
      q: '若 (2x² + ax − y + 6) − (2bx² − 3x + 5y − 1) 的值与 x 无关，则 a、b 分别是：',
      options: ['a = −3，b = 1', 'a = 3，b = 1', 'a = −3，b = −1', 'a = 3，b = −1'],
      answer: 0,
      explain: '合并后 x² 的系数是 2 − 2b，x 的系数是 a + 3。要与 x 无关，两个系数都为 0，所以 b = 1，a = −3。'
    }
  ]);
})();

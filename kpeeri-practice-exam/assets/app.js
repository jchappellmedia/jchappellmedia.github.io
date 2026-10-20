/* KPEERI Practice Exam — app logic. No build step, no dependencies. */
(function () {
  'use strict';

  // ---------- Data ----------
  const QUESTIONS = Array.isArray(window.KPEERI_QUESTIONS) ? window.KPEERI_QUESTIONS : [];
  const BYID = new Map(QUESTIONS.map(q => [q.id, q]));
  const EXAM_MS = 2 * 60 * 60 * 1000;
  const LETTERS = ['A', 'B', 'C', 'D'];
  const KEY = 'kpeeri-practice:v1';

  const DOMAINS = [
    { id: 1, name: 'Foundational Concepts', real: 54, subs: ['1A', '1B', '1C', '1D'] },
    { id: 2, name: 'Structured Literacy Planning and Teaching', real: 38, subs: ['2A', '2B', '2C'] },
    { id: 3, name: 'Ethical Standards', real: 8, subs: ['3A', '3B'] }
  ];
  const SUBS = {
    '1A': { name: 'Oral and written language learning', real: 10 },
    '1B': { name: 'Structure of language', real: 17 },
    '1C': { name: 'Recognition and intervention of reading difficulties', real: 12 },
    '1D': { name: 'Assessment', real: 15 },
    '2A': { name: 'Lesson planning', real: 13 },
    '2B': { name: 'Lesson implementation', real: 18 },
    '2C': { name: 'Managing the learning environment', real: 7 },
    '3A': { name: 'Trust', real: 5 },
    '3B': { name: 'Respect', real: 3 }
  };
  const LEVELS = [
    { id: 'recall', name: 'Recall', share: 34, desc: 'Remembering terms, concepts, and facts.' },
    { id: 'application', name: 'Application', share: 48, desc: 'Using that knowledge in a classroom scenario.' },
    { id: 'analysis', name: 'Analysis', share: 18, desc: 'Reading student data to make an instructional decision.' }
  ];
  const LEVEL_NAME = Object.fromEntries(LEVELS.map(l => [l.id, l.name]));

  // ---------- Helpers ----------
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);
  // Escape everything, then restore a small set of inline formatting tags.
  const rich = s => esc(s).replace(/&lt;(\/?)(em|strong|u|b|i|sup|sub)&gt;/g, '<$1$2>').replace(/&lt;br\s*\/?&gt;/g, '<br>');
  const plain = s => String(s || '').replace(/<[^>]+>/g, '');
  const pct = (c, t) => (t ? Math.round((c / t) * 100) : 0);

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function fmt(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  function fmtShort(ms) {
    const mins = Math.round(ms / 60000);
    if (mins < 60) return mins + ' min';
    return Math.floor(mins / 60) + ' hr ' + String(mins % 60).padStart(2, '0') + ' min';
  }
  function fmtDate(t) {
    try {
      return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return ''; }
  }

  // ---------- Storage (browser-only, best effort) ----------
  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '{}');
      return v && typeof v === 'object' ? v : {};
    } catch (e) { return {}; }
  }
  const db = load();
  db.attempts = Array.isArray(db.attempts) ? db.attempts : [];
  db.missed = Array.isArray(db.missed) ? db.missed.filter(id => BYID.has(id)) : [];
  if (db.exam && (!Array.isArray(db.exam.order) || !db.exam.order.length)) delete db.exam;
  if (db.exam) db.exam.order = db.exam.order.filter(id => BYID.has(id));
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* storage unavailable: keep going in memory */ }
  }
  function markMissed(id, wasCorrect) {
    const i = db.missed.indexOf(id);
    if (wasCorrect && i >= 0) db.missed.splice(i, 1);
    if (!wasCorrect && i < 0) db.missed.push(id);
  }

  // ---------- Views ----------
  let S = null; // active session (exam or study)

  function show(view) {
    document.body.dataset.view = view;
    $$('.view').forEach(v => { v.hidden = v.id !== 'view-' + view; });
    window.scrollTo(0, 0);
  }

  // ---------- Question rendering ----------
  function sampleHTML(sample) {
    const lines = String(sample).replace(/\s+$/, '').split('\n');
    const rows = lines.map(l => l.trim().split(/\s{2,}|\t/));
    const cols = rows[0].length;
    const tabular = lines.length > 1 && cols >= 2 && rows.every(r => r.length === cols);
    if (tabular) {
      return '<figure class="q-data q-data-sample"><div class="table-wrap"><table><thead><tr>' +
        rows[0].map(c => '<th scope="col">' + rich(c) + '</th>').join('') + '</tr></thead><tbody>' +
        rows.slice(1).map(r => '<tr>' + r.map((c, i) => (i === 0 ? '<th scope="row">' : '<td class="student">') + rich(c) + (i === 0 ? '</th>' : '</td>')).join('') + '</tr>').join('') +
        '</tbody></table></div></figure>';
    }
    return '<pre class="q-sample">' + rich(sample) + '</pre>';
  }

  function dataHTML(d) {
    if (!d) return '';
    let h = '<figure class="q-data">';
    if (d.title) h += '<figcaption>' + rich(d.title) + '</figcaption>';
    h += '<div class="table-wrap"><table>';
    if (Array.isArray(d.headers) && d.headers.length) {
      h += '<thead><tr>' + d.headers.map(x => '<th scope="col">' + rich(x) + '</th>').join('') + '</tr></thead>';
    }
    h += '<tbody>' + (d.rows || []).map(r => '<tr>' + r.map((c, i) => (i === 0 ? '<th scope="row">' + rich(c) + '</th>' : '<td>' + rich(c) + '</td>')).join('') + '</tr>').join('') + '</tbody>';
    h += '</table></div>';
    if (d.note) h += '<p class="q-note">' + rich(d.note) + '</p>';
    return h + '</figure>';
  }

  function metaHTML(q) {
    return '<p class="q-meta"><span class="chip">' + esc(SUBS[q.subdomain] ? SUBS[q.subdomain].name : q.subdomain) +
      '</span><span class="chip">' + esc(LEVEL_NAME[q.level] || q.level) + '</span></p>';
  }

  function bodyHTML(q) {
    let h = '<div class="q-stem"><p>' + rich(q.stem) + '</p></div>';
    if (q.data) h += dataHTML(q.data);
    if (q.sample) h += sampleHTML(q.sample);
    return h;
  }

  function optionsHTML(q, name, chosen, locked) {
    let h = '<fieldset class="opts"><legend class="sr-only">Answer choices</legend>';
    q.options.forEach((o, i) => {
      const cls = ['opt'];
      if (chosen === i) cls.push('is-chosen');
      if (locked) {
        cls.push('is-locked');
        if (i === q.answer) cls.push('is-correct');
        else if (chosen === i) cls.push('is-wrong');
      }
      let tag = '';
      if (locked && i === q.answer) tag = chosen === i ? 'Your answer, correct' : 'Correct answer';
      else if (locked && chosen === i) tag = 'Your answer';
      h += '<label class="' + cls.join(' ') + '" data-i="' + i + '">' +
        '<input type="radio" name="' + name + '" value="' + i + '"' + (chosen === i ? ' checked' : '') + (locked ? ' disabled' : '') + '>' +
        '<span class="opt-letter" aria-hidden="true">' + LETTERS[i] + '</span>' +
        '<span class="opt-text"><span class="sr-only">' + LETTERS[i] + '. </span>' + rich(o) +
        (tag ? '<span class="opt-tag">' + tag + '</span>' : '') + '</span></label>';
    });
    return h + '</fieldset>';
  }

  function setChosen(container, idx) {
    $$('.opt', container).forEach(l => l.classList.toggle('is-chosen', Number(l.dataset.i) === idx));
  }

  // ---------- Scoring ----------
  function score(order, answers) {
    const out = { correct: 0, total: order.length, bySub: {}, byDomain: {}, byLevel: {} };
    order.forEach(id => {
      const q = BYID.get(id);
      if (!q) return;
      const ok = answers[id] === q.answer;
      const bump = (map, k) => { map[k] = map[k] || { c: 0, t: 0 }; map[k].t++; if (ok) map[k].c++; };
      bump(out.bySub, q.subdomain);
      bump(out.byDomain, String(q.domain));
      bump(out.byLevel, q.level);
      if (ok) out.correct++;
    });
    return out;
  }
  const answeredCount = s => Object.keys(s.answers || {}).filter(id => s.answers[id] != null).length;

  // ---------- Home ----------
  function renderHome() {
    $('#fact-count').textContent = QUESTIONS.length;

    const r = $('#resume');
    if (db.exam) {
      r.hidden = false;
      $('#resume-text').textContent = 'You have an exam in progress: question ' + (db.exam.index + 1) + ' of ' +
        db.exam.order.length + ', ' + answeredCount(db.exam) + ' answered, ' + fmt(db.exam.remaining) + ' left on the clock.';
      $('#btn-start').textContent = 'Start a new exam';
      $('#btn-start').classList.remove('primary');
    } else {
      r.hidden = true;
      $('#btn-start').textContent = 'Start the timed exam';
      $('#btn-start').classList.add('primary');
    }
    $('#btn-last').hidden = !db.lastResult;

    const hs = $('#history-section');
    if (db.attempts.length) {
      hs.hidden = false;
      $('#history-body').innerHTML = db.attempts.slice(0, 10).map(a =>
        '<tr><td>' + esc(fmtDate(a.date)) + (a.timedOut ? ' <span class="note">(time ran out)</span>' : '') + '</td>' +
        '<td class="num">' + a.correct + ' of ' + a.total + '</td>' +
        '<td class="num">' + pct(a.correct, a.total) + '%</td>' +
        '<td class="num">' + esc(fmtShort(a.timeUsed || 0)) + '</td></tr>').join('');
    } else {
      hs.hidden = true;
    }

    // Outline table
    const counts = {};
    QUESTIONS.forEach(q => { counts[q.subdomain] = (counts[q.subdomain] || 0) + 1; });
    let h = '';
    DOMAINS.forEach(d => {
      const mine = d.subs.reduce((n, s) => n + (counts[s] || 0), 0);
      h += '<tr class="domain-row"><th scope="row">' + esc(d.name) + '</th><td class="num">' + d.real + '</td><td class="num">' + mine + '</td></tr>';
      d.subs.forEach(s => {
        h += '<tr class="sub-row"><th scope="row">' + esc(SUBS[s].name) + '</th><td class="num">' + SUBS[s].real + '</td><td class="num">' + (counts[s] || 0) + '</td></tr>';
      });
    });
    $('#outline-body').innerHTML = h;
    $('#outline-total').textContent = QUESTIONS.length;

    const lc = {};
    QUESTIONS.forEach(q => { lc[q.level] = (lc[q.level] || 0) + 1; });
    $('#level-list').innerHTML = LEVELS.map(l =>
      '<li><strong>' + l.name + ', ' + l.share + '% of the real exam</strong><span>' + esc(l.desc) + ' ' + (lc[l.id] || 0) + ' questions here.</span></li>').join('');
  }

  // ---------- Dialog helpers ----------
  function openDialog(d) {
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
  }
  function confirmDialog(opts) {
    return new Promise(resolve => {
      const d = $('#dlg-confirm');
      $('#cf-title').textContent = opts.title;
      $('#cf-body').textContent = opts.body;
      $('#cf-ok').textContent = opts.ok;
      $('#cf-cancel').textContent = opts.cancel || 'Cancel';
      d.returnValue = '';
      d.addEventListener('close', () => resolve(d.returnValue === 'ok'), { once: true });
      openDialog(d);
    });
  }

  // ---------- Exam ----------
  let timerId = null;
  let lastTick = 0;
  let paused = false;
  let saveTick = 0;
  const announced = {};

  async function startExam() {
    if (db.exam) {
      const ok = await confirmDialog({
        title: 'Start a new exam?',
        body: 'The exam you have in progress will be discarded.',
        ok: 'Start new exam',
        cancel: 'Keep it'
      });
      if (!ok) return;
    }
    db.exam = {
      mode: 'exam',
      order: shuffle(QUESTIONS.map(q => q.id)),
      answers: {},
      flags: {},
      index: 0,
      remaining: EXAM_MS,
      started: Date.now()
    };
    persist();
    enterExam();
  }

  function enterExam() {
    S = db.exam;
    S.index = Math.min(Math.max(0, S.index || 0), S.order.length - 1);
    Object.keys(announced).forEach(k => delete announced[k]);
    $('#ex-total').textContent = S.order.length;
    show('exam');
    renderExam();
    paused = false;
    startTimer();
  }

  function renderExam(focusQuestion) {
    const q = BYID.get(S.order[S.index]);
    $('#ex-num').textContent = S.index + 1;
    const box = $('#ex-q');
    box.innerHTML = bodyHTML(q) + optionsHTML(q, 'ex-opt', S.answers[q.id], false);
    const flagged = !!S.flags[q.id];
    const fb = $('#ex-flag');
    fb.setAttribute('aria-pressed', String(flagged));
    fb.textContent = flagged ? 'Flagged' : 'Flag';
    $('#ex-prev').disabled = S.index === 0;
    $('#ex-next').textContent = S.index === S.order.length - 1 ? 'Review and submit' : 'Next';
    updateExamProgress();
    if (focusQuestion) {
      const first = $('input', box);
      if (first) first.focus({ preventScroll: true });
    }
  }

  function updateExamProgress() {
    const n = answeredCount(S);
    $('#ex-progress').style.width = (n / S.order.length) * 100 + '%';
    $('#ex-answered').textContent = n + ' of ' + S.order.length + ' answered';
  }

  function go(delta) {
    const i = S.index + delta;
    if (i < 0) return;
    if (i >= S.order.length) { openSubmit(); return; }
    S.index = i;
    persist();
    renderExam();
    window.scrollTo(0, 0);
  }

  function toggleFlag() {
    const id = S.order[S.index];
    if (S.flags[id]) delete S.flags[id]; else S.flags[id] = true;
    persist();
    renderExam();
  }

  function startTimer() {
    stopTimer();
    lastTick = performance.now();
    timerId = setInterval(tick, 250);
    updateTimer();
  }
  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }
  function tick() {
    const now = performance.now();
    const dt = now - lastTick;
    lastTick = now;
    if (!S || S.mode !== 'exam') return;
    if (!paused && !document.hidden) S.remaining -= dt;
    if (S.remaining <= 0) {
      S.remaining = 0;
      updateTimer();
      submitExam(true);
      return;
    }
    updateTimer();
    if (++saveTick % 20 === 0) persist();
  }
  function updateTimer() {
    const t = $('#ex-timer');
    t.textContent = fmt(S.remaining);
    t.classList.toggle('is-low', S.remaining <= 10 * 60 * 1000);
    [30, 10, 5, 1].forEach(m => {
      if (S.remaining <= m * 60000 && S.remaining > (m * 60000) - 5000 && !announced[m]) {
        announced[m] = true;
        $('#ex-announce').textContent = m + (m === 1 ? ' minute' : ' minutes') + ' left.';
      }
    });
  }

  function openNav() {
    const grid = $('#nav-grid');
    let a = 0, f = 0;
    grid.innerHTML = S.order.map((id, i) => {
      const cls = [];
      if (S.answers[id] != null) { cls.push('is-answered'); a++; }
      if (S.flags[id]) { cls.push('is-flagged'); f++; }
      if (i === S.index) cls.push('is-current');
      const label = 'Question ' + (i + 1) + (S.answers[id] != null ? ', answered' : ', not answered') + (S.flags[id] ? ', flagged' : '');
      return '<button type="button" class="' + cls.join(' ') + '" data-go="' + i + '" aria-label="' + label + '">' + (i + 1) + '</button>';
    }).join('');
    $('#lg-answered').textContent = a;
    $('#lg-flagged').textContent = f;
    $('#lg-open').textContent = S.order.length - a;
    openDialog($('#dlg-nav'));
    const cur = $('.is-current', grid);
    if (cur) cur.focus();
  }

  function openSubmit() {
    const a = answeredCount(S);
    const open = S.order.length - a;
    const f = Object.keys(S.flags).length;
    const parts = [];
    parts.push(open ? open + (open === 1 ? ' question is' : ' questions are') + ' not answered yet, and unanswered questions count as wrong.' : 'You have answered every question.');
    if (f) parts.push(f + (f === 1 ? ' question is' : ' questions are') + ' flagged for review.');
    parts.push(fmt(S.remaining) + ' is left on the clock.');
    $('#submit-body').textContent = parts.join(' ');
    openDialog($('#dlg-submit'));
  }

  function submitExam(timedOut) {
    stopTimer();
    const sc = score(S.order, S.answers);
    const timeUsed = EXAM_MS - S.remaining;
    const date = Date.now();
    db.attempts.unshift({ date, correct: sc.correct, total: sc.total, timeUsed, timedOut: !!timedOut });
    db.attempts = db.attempts.slice(0, 25);
    S.order.forEach(id => markMissed(id, S.answers[id] === BYID.get(id).answer));
    db.lastResult = { mode: 'exam', order: S.order, answers: S.answers, flags: S.flags, timeUsed, timedOut: !!timedOut, date };
    delete db.exam;
    S = null;
    persist();
    $$('dialog[open]').forEach(d => d.close());
    renderResults(db.lastResult);
  }

  // ---------- Study ----------
  let preselect = null;

  function renderStudySetup(subsToSelect) {
    const counts = {};
    QUESTIONS.forEach(q => { counts[q.subdomain] = (counts[q.subdomain] || 0) + 1; });
    const sel = subsToSelect ? new Set(subsToSelect) : null;
    $('#study-topics').innerHTML = DOMAINS.map(d => {
      const subs = d.subs.map(s =>
        '<label class="check"><input type="checkbox" name="sub" value="' + s + '"' + (!sel || sel.has(s) ? ' checked' : '') + '>' +
        '<span>' + esc(SUBS[s].name) + '</span><span class="count">' + (counts[s] || 0) + '</span></label>').join('');
      return '<div class="sg"><label class="check sg-head"><input type="checkbox" data-domain="' + d.id + '"><span>' + esc(d.name) + '</span></label><div class="sg-subs">' + subs + '</div></div>';
    }).join('');
    const missedInput = $('#src-missed');
    missedInput.disabled = db.missed.length === 0;
    $('#src-missed-label').textContent = db.missed.length
      ? 'Only questions I’ve missed (' + db.missed.length + ' so far)'
      : 'Only questions I’ve missed (none yet — take the exam or study a set first)';
    if (missedInput.disabled) $('input[name="src"][value="all"]').checked = true;
    syncDomainBoxes();
    updateStudySummary();
    show('study-setup');
  }

  function syncDomainBoxes() {
    $$('#study-topics .sg').forEach(g => {
      const subs = $$('input[name="sub"]', g);
      const on = subs.filter(i => i.checked).length;
      const head = $('input[data-domain]', g);
      head.checked = on === subs.length;
      head.indeterminate = on > 0 && on < subs.length;
    });
  }

  function studyPool() {
    const subs = new Set($$('#study-topics input[name="sub"]:checked').map(i => i.value));
    const src = ($('input[name="src"]:checked') || {}).value;
    let pool = QUESTIONS.filter(q => subs.has(q.subdomain)).map(q => q.id);
    if (src === 'missed') pool = pool.filter(id => db.missed.includes(id));
    return pool;
  }

  function updateStudySummary() {
    const pool = studyPool();
    const c = $('#study-count').value;
    const n = c === 'all' ? pool.length : Math.min(pool.length, Number(c));
    $('#study-summary').textContent = pool.length
      ? 'This set will have ' + n + (n === 1 ? ' question.' : ' questions.')
      : 'No questions match. Pick at least one topic.';
    $('#study-go').disabled = pool.length === 0;
  }

  function startStudy(ids) {
    if (!ids.length) return;
    S = { mode: 'study', order: shuffle(ids), answers: {}, checked: {}, index: 0, correct: 0 };
    show('study');
    renderStudy();
  }

  function renderStudy(focus) {
    const q = BYID.get(S.order[S.index]);
    const done = !!S.checked[q.id];
    $('#st-progress').textContent = 'Question ' + (S.index + 1) + ' of ' + S.order.length;
    const checkedN = Object.keys(S.checked).length;
    $('#st-score').textContent = S.correct + ' of ' + checkedN + ' correct so far';
    $('#st-bar').style.width = (checkedN / S.order.length) * 100 + '%';
    let h = metaHTML(q) + bodyHTML(q) + optionsHTML(q, 'st-opt', S.answers[q.id], done);
    if (done) {
      const ok = S.answers[q.id] === q.answer;
      h += '<div class="feedback ' + (ok ? 'is-good' : 'is-bad') + '" role="status" tabindex="-1" id="st-feedback">' +
        '<p class="fb-head">' + (ok ? 'Correct.' : 'Not quite. The answer is ' + LETTERS[q.answer] + '.') + '</p>' +
        '<p>' + rich(q.explanation) + '</p></div>';
    }
    $('#st-q').innerHTML = h;
    const btn = $('#st-action');
    if (done) {
      btn.disabled = false;
      btn.textContent = S.index === S.order.length - 1 ? 'See how you did' : 'Next question';
    } else {
      btn.textContent = 'Check answer';
      btn.disabled = S.answers[q.id] == null;
    }
    if (focus === 'feedback') { const fb = $('#st-feedback'); if (fb) fb.focus({ preventScroll: false }); }
    if (focus === 'question') { const first = $('#st-q input'); if (first) first.focus({ preventScroll: true }); }
  }

  function studyAction() {
    const q = BYID.get(S.order[S.index]);
    if (!S.checked[q.id]) {
      if (S.answers[q.id] == null) return;
      S.checked[q.id] = true;
      const ok = S.answers[q.id] === q.answer;
      if (ok) S.correct++;
      markMissed(q.id, ok);
      persist();
      renderStudy('feedback');
      return;
    }
    if (S.index < S.order.length - 1) {
      S.index++;
      renderStudy('question');
      window.scrollTo(0, 0);
    } else {
      finishStudy();
    }
  }

  function finishStudy() {
    const order = S.order.filter(id => S.checked[id]);
    if (!order.length) { S = null; renderHome(); show('home'); return; }
    const res = { mode: 'study', order, answers: S.answers, flags: {}, date: Date.now() };
    S = null;
    renderResults(res);
  }

  // ---------- Results ----------
  let currentResult = null;

  function bar(c, t) {
    return '<div class="bar" aria-hidden="true"><span style="width:' + pct(c, t) + '%"></span></div>';
  }

  function renderResults(res) {
    currentResult = res;
    const sc = score(res.order, res.answers);
    const isExam = res.mode === 'exam';
    const answered = res.order.filter(id => res.answers[id] != null).length;

    $('#res-title').textContent = isExam
      ? 'You answered ' + sc.correct + ' of ' + sc.total + ' questions correctly'
      : 'Study set done: ' + sc.correct + ' of ' + sc.total + ' correct';

    const line = [['' + pct(sc.correct, sc.total) + '%', 'correct']];
    if (isExam) {
      line.push([fmtShort(res.timeUsed || 0), 'of 2 hours used']);
      line.push(['' + (sc.total - answered), 'left unanswered']);
    }
    $('#res-line').innerHTML = line.map(x => '<li><strong>' + esc(x[0]) + '</strong><span>' + esc(x[1]) + '</span></li>').join('');

    let notes = '';
    if (res.timedOut) notes += '<p class="callout is-warn">Time ran out, so the exam was submitted automatically. On the real test, budget a little over a minute per question.</p>';
    if (isExam) notes += '<p class="callout">The real KPEERI reports a scaled score from 200 to 800, and 500 passes. IDA doesn’t publish how many correct answers equal 500, so use this percentage as a readiness check rather than a predicted score. Your weakest areas below matter more than the total.</p>';
    $('#res-notes').innerHTML = notes;

    // Domain breakdown
    let h = '';
    DOMAINS.forEach(d => {
      const dv = sc.byDomain[String(d.id)];
      if (!dv) return;
      h += '<tr class="domain-row"><th scope="row">' + esc(d.name) + '</th><td class="num">' + dv.c + ' of ' + dv.t + ' (' + pct(dv.c, dv.t) + '%)</td><td class="bar-cell">' + bar(dv.c, dv.t) + '</td></tr>';
      d.subs.forEach(s => {
        const v = sc.bySub[s];
        if (!v) return;
        h += '<tr class="sub-row"><th scope="row">' + esc(SUBS[s].name) + '</th><td class="num">' + v.c + ' of ' + v.t + '</td><td class="bar-cell">' + bar(v.c, v.t) + '</td></tr>';
      });
    });
    $('#res-domains').innerHTML = h;

    $('#res-levels').innerHTML = LEVELS.filter(l => sc.byLevel[l.id]).map(l => {
      const v = sc.byLevel[l.id];
      return '<tr><th scope="row">' + l.name + '</th><td class="num">' + v.c + ' of ' + v.t + ' (' + pct(v.c, v.t) + '%)</td><td class="bar-cell">' + bar(v.c, v.t) + '</td></tr>';
    }).join('');

    // Weakest areas
    const weak = Object.keys(sc.bySub)
      .map(s => ({ s, v: sc.bySub[s], p: sc.bySub[s].c / sc.bySub[s].t }))
      .filter(x => x.v.c < x.v.t)
      .sort((a, b) => a.p - b.p || b.v.t - a.v.t)
      .slice(0, 3);
    const nx = $('#res-next');
    if (isExam && weak.length) {
      nx.hidden = false;
      $('#res-next-list').innerHTML = weak.map(x => '<li>' + esc(SUBS[x.s].name) + ' <span class="note">(' + x.v.c + ' of ' + x.v.t + ')</span></li>').join('');
      nx.dataset.subs = weak.map(x => x.s).join(',');
    } else {
      nx.hidden = true;
    }

    const missedHere = res.order.filter(id => res.answers[id] !== BYID.get(id).answer);
    $('#res-study-missed').hidden = missedHere.length === 0;
    $('#res-study-missed').dataset.ids = missedHere.join(',');

    // Review list
    $('#res-review').innerHTML = res.order.map((id, i) => {
      const q = BYID.get(id);
      const chosen = res.answers[id];
      const status = chosen == null ? 'unanswered' : chosen === q.answer ? 'correct' : 'incorrect';
      const label = { correct: 'Correct', incorrect: 'Missed', unanswered: 'Not answered' }[status];
      const flagged = !!(res.flags && res.flags[id]);
      return '<details class="rv" data-status="' + status + '" data-flagged="' + flagged + '">' +
        '<summary><span class="rv-num">' + (i + 1) + '</span><span class="rv-status st-' + status + '">' + label +
        (flagged ? '<span class="rv-flag">Flagged</span>' : '') + '</span><span class="rv-stem">' + esc(plain(q.stem)) + '</span></summary>' +
        '<div class="rv-body">' + metaHTML(q) + bodyHTML(q) + optionsHTML(q, 'rv-' + i, chosen, true) +
        '<div class="explain"><p>' + rich(q.explanation) + '</p></div></div></details>';
    }).join('');
    setFilter('all');
    show('results');
  }

  function setFilter(f) {
    $$('.filter button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
    $$('#res-review .rv').forEach(d => {
      const st = d.dataset.status;
      let on = true;
      if (f === 'incorrect') on = st !== 'correct';
      if (f === 'correct') on = st === 'correct';
      if (f === 'flagged') on = d.dataset.flagged === 'true';
      d.hidden = !on;
    });
  }

  // ---------- Events ----------
  document.addEventListener('click', async e => {
    const goBtn = e.target.closest('[data-go]');
    if (goBtn && S && S.mode === 'exam') {
      S.index = Number(goBtn.dataset.go);
      persist();
      $('#dlg-nav').close();
      renderExam(true);
      window.scrollTo(0, 0);
      return;
    }
    const fBtn = e.target.closest('[data-filter]');
    if (fBtn) { setFilter(fBtn.dataset.filter); return; }

    const homeLink = e.target.closest('[data-home-link]');
    if (homeLink && document.body.dataset.view !== 'home') {
      e.preventDefault();
      renderHome();
      show('home');
      const target = document.querySelector(homeLink.getAttribute('href'));
      if (target) target.scrollIntoView();
      return;
    }

    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    if (a === 'home') { renderHome(); show('home'); }
    else if (a === 'start') startExam();
    else if (a === 'resume') { if (db.exam) enterExam(); }
    else if (a === 'discard') {
      const ok = await confirmDialog({ title: 'Discard this exam?', body: 'Your answers so far will be deleted. This can’t be undone.', ok: 'Discard exam', cancel: 'Keep it' });
      if (ok) { delete db.exam; persist(); renderHome(); }
    }
    else if (a === 'last') { if (db.lastResult) renderResults(db.lastResult); }
    else if (a === 'study-setup') renderStudySetup(null);
    else if (a === 'open-nav') openNav();
    else if (a === 'pause') {
      paused = true;
      persist();
      $('#pause-time').textContent = fmt(S.remaining);
      openDialog($('#dlg-pause'));
    }
    else if (a === 'finish') openSubmit();
    else if (a === 'end-study') finishStudy();
    else if (a === 'study-missed') {
      const ids = (el.dataset.ids || '').split(',').filter(id => BYID.has(id));
      startStudy(ids);
    }
    else if (a === 'study-weak') renderStudySetup(($('#res-next').dataset.subs || '').split(','));
    else if (a === 'clear-history') {
      const ok = await confirmDialog({ title: 'Clear your history?', body: 'This deletes your past scores, your last score report, and the list of questions you’ve missed. An exam in progress is kept.', ok: 'Clear history', cancel: 'Cancel' });
      if (ok) { db.attempts = []; db.missed = []; delete db.lastResult; persist(); renderHome(); }
    }
  });

  $('#ex-prev').addEventListener('click', () => go(-1));
  $('#ex-next').addEventListener('click', () => go(1));
  $('#ex-flag').addEventListener('click', toggleFlag);

  $('#ex-q').addEventListener('change', e => {
    if (e.target.name !== 'ex-opt' || !S) return;
    const id = S.order[S.index];
    S.answers[id] = Number(e.target.value);
    setChosen($('#ex-q'), S.answers[id]);
    persist();
    updateExamProgress();
  });

  $('#st-q').addEventListener('change', e => {
    if (e.target.name !== 'st-opt' || !S) return;
    const id = S.order[S.index];
    if (S.checked[id]) return;
    S.answers[id] = Number(e.target.value);
    setChosen($('#st-q'), S.answers[id]);
    $('#st-action').disabled = false;
  });
  $('#st-action').addEventListener('click', studyAction);

  $('#dlg-submit').addEventListener('close', () => {
    const v = $('#dlg-submit').returnValue;
    if (v === 'submit' && S) submitExam(false);
    else if (v === 'list' && S) openNav();
  });
  $('#dlg-pause').addEventListener('close', () => {
    const v = $('#dlg-pause').returnValue;
    if (!S || S.mode !== 'exam') return;
    if (v === 'exit') {
      stopTimer();
      persist();
      S = null;
      renderHome();
      show('home');
    } else {
      paused = false;
      lastTick = performance.now();
    }
  });
  // Escape on the pause dialog should resume, not leave the clock stopped.
  $('#dlg-pause').addEventListener('cancel', () => { $('#dlg-pause').returnValue = 'resume'; });

  const form = $('#study-form');
  form.addEventListener('change', e => {
    if (e.target.matches('input[data-domain]')) {
      $$('input[name="sub"]', e.target.closest('.sg')).forEach(i => { i.checked = e.target.checked; });
    }
    syncDomainBoxes();
    updateStudySummary();
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    let pool = shuffle(studyPool());
    const c = $('#study-count').value;
    if (c !== 'all') pool = pool.slice(0, Number(c));
    startStudy(pool);
  });

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    const view = document.body.dataset.view;
    if ((view !== 'exam' && view !== 'study') || !S) return;
    const t = e.target;
    if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || (t.tagName === 'INPUT' && t.type !== 'radio'))) return;
    const k = e.key.toLowerCase();
    const idx = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 }[k];
    if (idx !== undefined) {
      const input = $$('input[name="' + (view === 'exam' ? 'ex-opt' : 'st-opt') + '"]')[idx];
      if (input && !input.disabled) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus({ preventScroll: true });
      }
      e.preventDefault();
      return;
    }
    if (view === 'exam') {
      if (k === 'n') { e.preventDefault(); go(1); }
      else if (k === 'p') { e.preventDefault(); go(-1); }
      else if (k === 'f') { e.preventDefault(); toggleFlag(); }
    }
  });

  document.addEventListener('visibilitychange', () => {
    lastTick = performance.now();
    if (document.hidden && S && S.mode === 'exam') persist();
  });
  window.addEventListener('pagehide', () => { if (S && S.mode === 'exam') persist(); });

  // ---------- Start ----------
  if (!QUESTIONS.length) {
    $('#main').innerHTML = '<div class="wrap" style="padding:3rem 16px"><h1>The questions didn’t load</h1><p>Reload the page. If it keeps happening, the file data/questions.js may be missing.</p></div>';
    return;
  }
  renderHome();
  show('home');
})();

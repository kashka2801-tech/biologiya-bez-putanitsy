(function () {
  "use strict";
  var LESSONS = window.LESSONS, Q = window.QUESTIONS, TERMS = window.TERMS, CONCEPTS = window.CONCEPTS, BOARD = window.BOARD, SUMMARY = window.SUMMARY, D = window.DIAGRAMS;
  var KEY = "biologiya-bez-putanitsy-v1";
  var app = document.getElementById("app");

  /* ---------- Хранилище ---------- */
  var memoryStore = null;
  function blank() { return { pos: null, read: {}, checks: {}, concepts: {}, errors: {}, practiced: {}, board: {}, lastTest: null, seenTerms: {} }; }
  function load() {
    try { var raw = window.localStorage.getItem(KEY); if (raw) { var s = JSON.parse(raw); return Object.assign(blank(), s); } } catch (e) { if (memoryStore) return memoryStore; }
    return blank();
  }
  var S = load();
  var storageOk = true;
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOk = false; memoryStore = S; }
  }

  /* ---------- Утилиты ---------- */
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var QBY = {}; Q.forEach(function (q) { QBY[q.id] = q; });
  var CHECK_IDS = {}; var SCREEN_OF_CONCEPT = {}; var ALL_SCREENS = [];
  LESSONS.forEach(function (L, li) { L.screens.forEach(function (sc, si) { CHECK_IDS[sc.check] = true; if (!SCREEN_OF_CONCEPT[sc.c]) SCREEN_OF_CONCEPT[sc.c] = { l: li + 1, s: si }; ALL_SCREENS.push({ l: li + 1, s: si, sc: sc }); }); });
  var TERM_LESSON = {}; ALL_SCREENS.forEach(function (x) { (x.sc.terms || []).forEach(function (t) { if (!TERM_LESSON[t]) TERM_LESSON[t] = { l: x.l, s: x.s }; }); });
  function cstate(cid) { if (!S.concepts[cid]) S.concepts[cid] = { i: 0, h: 0, w: 0, streak: 0, qs: [] }; return S.concepts[cid]; }
  function conceptRead(cid) { var p = SCREEN_OF_CONCEPT[cid]; if (!p) return false; return !!S.read[LESSONS[p.l - 1].screens[p.s].id]; }
  function status(cid) {
    var c = S.concepts[cid];
    if (c && c.streak >= 2 && c.qs.length >= 2 && !S.errors[cid]) return "mastered";
    if (c && c.i > 0 && c.streak > 0) return "recalled";
    if (c && (c.h > 0 || c.w > 0 || c.i > 0)) return "hint";
    if (conceptRead(cid)) return "read";
    return "none";
  }
  var STATUS_TXT = { none: "не начато", read: "прочитано", hint: "отвечено с подсказкой или с ошибкой", recalled: "вспомнено самостоятельно", mastered: "усвоено" };
  var STATUS_SHORT = { none: "не начато", read: "прочитано", hint: "с подсказкой", recalled: "вспомнено", mastered: "усвоено" };
  function lessonConcepts(l) { return LESSONS[l - 1].screens.map(function (s) { return s.c; }); }
  function lessonRead(l) { return LESSONS[l - 1].screens.every(function (s) { return S.read[s.id]; }); }
  function countRead(l) { return LESSONS[l - 1].screens.filter(function (s) { return S.read[s.id]; }).length; }
  function similarFor(q, exclude) {
    var pool = Q.filter(function (x) { return x.c === q.c && x.id !== q.id && (!exclude || !exclude[x.id]); });
    if (!pool.length) pool = Q.filter(function (x) { return x.c === q.c && x.id !== q.id; });
    return pool.length ? shuffle(pool)[0] : null;
  }

  function record(q, result) {
    var c = cstate(q.c);
    if (result === "indep") {
      c.i++; c.streak++; if (c.qs.indexOf(q.id) < 0) c.qs.push(q.id);
      if (S.errors[q.c] && S.errors[q.c].lastQ !== q.id) delete S.errors[q.c];
    } else if (result === "hint") { c.h++; c.streak = 0; }
    else { c.w++; c.streak = 0; c.qs = []; var e = S.errors[q.c] || { count: 0 }; e.count++; e.lastQ = q.id; S.errors[q.c] = e; }
    save();
  }

  /* ---------- Визуальные блоки ---------- */
  function visual(v) {
    if (!v) return "";
    if (v.type === "chain") return '<div class="chain" role="list">' + v.items.map(function (t, i) { return (i ? '<span class="arrow" aria-hidden="true">→</span>' : "") + '<span class="chip" role="listitem">' + esc(t) + "</span>"; }).join("") + "</div>";
    if (v.type === "steps") return '<ol class="steps">' + v.items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>";
    if (v.type === "cards") return '<div class="cards">' + v.items.map(function (c) { return '<div class="mini"><b>' + esc(c[0]) + "</b><span>" + esc(c[1]) + "</span></div>"; }).join("") + "</div>";
    if (v.type === "compare") {
      var cols = v.cols.slice(); if (v.rows[0] && v.rows[0].length > cols.length) cols.unshift("");
      var h = '<div class="tablewrap"><table class="cmp"><thead><tr>' + cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
      v.rows.forEach(function (r) { h += "<tr>" + r.map(function (c, i) { return (i === 0 ? "<th scope=\"row\">" : "<td>") + esc(c) + (i === 0 ? "</th>" : "</td>"); }).join("") + "</tr>"; });
      return h + "</tbody></table></div>";
    }
    if (v.type === "svg") {
      var out = '<figure class="fig">' + D[v.id]() + "</figure>";
      if (v.id === "wall") out = '<figure class="fig">' + D.wall() + '<figcaption><ol class="dia-legend">' + Object.keys(window.WALL_POINTS).map(function (k) { return "<li value=\"" + k + "\">" + esc(window.WALL_POINTS[k]) + "</li>"; }).join("") + "</ol></figcaption></figure>";
      return out;
    }
    return "";
  }
  function termCard(k) {
    var t = TERMS[k]; if (!t) return "";
    return '<div class="term"><div class="term-n">' + esc(t.n) + '</div><dl><dt>Что значит</dt><dd>' + esc(t.m) + "</dd><dt>Роль в теме</dt><dd>" + esc(t.r) + '</dd><dt>У доски</dt><dd class="board-line">' + esc(t.b) + "</dd></dl></div>";
  }

  /* ---------- Вопросы ---------- */
  function hydraNames() { var hp = window.HYDRA_POINTS; return Object.keys(hp).map(function (k) { return hp[k].name; }); }
  function labelOptions(q) { return q.svg === "wall" ? Object.keys(window.WALL_POINTS).map(function (k) { return window.WALL_POINTS[k]; }) : hydraNames(); }
  function typeName(t) { return { choice: "Выбери ответ", match: "Сопоставь", order: "Расставь по порядку", label: "Подпиши схему", fix: "Найди и исправь ошибку", compare: "Сравни", recall: "Вспомни без подсказки", explain: "Объясни своими словами" }[t]; }

  /* Возвращает объект: { el, grade() } — grade -> {ok, html, complete} */
  function renderQ(q, host, opts) {
    opts = opts || {};
    var test = opts.mode === "test";
    var usedHint = false, done = false;
    var box = document.createElement("div"); box.className = "q"; box.setAttribute("data-qid", q.id);
    var head = '<div class="q-type">' + typeName(q.t) + '</div>';
    var body = "", ans = {};
    if (q.t === "choice") {
      var order = shuffle(q.opts.map(function (_, i) { return i; }));
      head += '<p class="q-text">' + esc(q.q) + "</p>";
      body = '<div class="opts" role="radiogroup">' + order.map(function (i) { return '<button type="button" class="opt" role="radio" aria-checked="false" data-i="' + i + '">' + esc(q.opts[i]) + "</button>"; }).join("") + "</div>";
    } else if (q.t === "match") {
      var rights = shuffle(q.pairs.map(function (p, i) { return i; }));
      head += '<p class="q-text">' + esc(q.q) + '</p><p class="q-help">Для каждого слова слева выбери значение из списка.</p>';
      body = '<div class="match">' + q.pairs.map(function (p, i) { return '<label class="mrow"><span class="mleft">' + esc(p[0]) + '</span><select data-i="' + i + '"><option value="">— выбери —</option>' + rights.map(function (r) { return '<option value="' + r + '">' + esc(q.pairs[r][1]) + "</option>"; }).join("") + "</select></label>"; }).join("") + "</div>";
    } else if (q.t === "order") {
      head += '<p class="q-text">' + esc(q.q) + '</p><p class="q-help">Нажимай на пункты в нужном порядке. Нажми на выбранный пункт, чтобы убрать его.</p>';
      body = '<ol class="ord-picked" aria-label="Твой порядок"></ol><div class="ord-pool"></div><button type="button" class="btn ghost small ord-reset">Начать заново</button>';
    } else if (q.t === "label") {
      var pts = Object.keys(q.answers);
      var optsL = labelOptions(q);
      head += '<p class="q-text">' + esc(q.q) + '</p><p class="q-help">Посмотри на номера на схеме и выбери подпись для каждого.</p>';
      var svg = q.svg === "wall" ? D.wall() : D.hydra({ numbers: true, points: pts.map(Number) });
      body = '<figure class="fig">' + svg + '</figure><div class="match">' + pts.map(function (n) { return '<label class="mrow"><span class="mleft num">' + n + '</span><select data-n="' + n + '"><option value="">— выбери —</option>' + shuffle(optsL).map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + "</option>"; }).join("") + "</select></label>"; }).join("") + "</div>";
    } else if (q.t === "fix") {
      head += '<p class="q-text">В утверждении есть ошибка. Нажми на неверную часть, затем выбери, чем её заменить.</p>';
      body = '<p class="fix-s">' + q.parts.map(function (p, i) { return p.trim().length > 3 ? '<button type="button" class="seg" data-i="' + i + '" aria-pressed="false">' + esc(p) + "</button>" : "<span>" + esc(p) + "</span>"; }).join("") + '</p><div class="fix-opts" hidden><p class="q-help">Чем заменить выбранную часть?</p><div class="opts">' + shuffle(q.opts.map(function (_, i) { return i; })).map(function (i) { return '<button type="button" class="opt" role="radio" aria-checked="false" data-r="' + i + '">' + esc(q.opts[i]) + "</button>"; }).join("") + "</div></div>";
    } else if (q.t === "compare") {
      head += '<p class="q-text">' + esc(q.q) + "</p>";
      body = '<div class="cmp-q">' + q.rows.map(function (r, i) { return '<div class="crow"><div class="ctext">' + esc(r[0]) + '</div><div class="cbtns" role="group">' + q.cols.map(function (c, j) { return '<button type="button" class="cbtn" aria-pressed="false" data-r="' + i + '" data-c="' + j + '">' + esc(c) + "</button>"; }).join("") + "</div></div>"; }).join("") + "</div>";
    } else if (q.t === "recall") {
      head += '<p class="q-text">' + esc(q.q) + '</p><p class="q-help">Сначала попробуй вспомнить сама — вслух или про себя. Потом открой ответ и честно оцени.</p>';
      body = '<div class="recall-ans" hidden><div class="answer"><b>Ответ:</b> ' + esc(q.answer) + '</div><p class="q-help">Как получилось?</p><div class="opts rate"><button type="button" class="opt" data-rate="indep">Вспомнила сама</button><button type="button" class="opt" data-rate="hint">Вспомнила частично</button><button type="button" class="opt" data-rate="wrong">Не вспомнила</button></div></div>';
    } else if (q.t === "explain") {
      head += '<p class="q-text">' + esc(q.q) + '</p><p class="q-help">Можно написать ответ, а можно сказать вслух. Затем сверься с ключевыми мыслями. Программа не оценивает текст автоматически — отмечаешь сама.</p>';
      body = '<textarea rows="5" class="ta" aria-label="Твой ответ" placeholder="Мой ответ…"></textarea><div class="explain-check" hidden><p class="q-help"><b>Отметь мысли, которые есть в твоём ответе:</b></p><div class="checks">' + q.points.map(function (p, i) { return '<label class="chk"><input type="checkbox" data-i="' + i + '"> <span>' + esc(p) + "</span></label>"; }).join("") + '</div><details class="sample"><summary>Показать образец ответа</summary><p>' + esc(q.sample) + '</p></details></div>';
    }
    var hintBtn = (!test && q.hint) ? '<button type="button" class="btn ghost small hint-btn">Подсказка</button><div class="hint" hidden></div>' : "";
    var actBtn = "";
    if (q.t === "recall") actBtn = '<button type="button" class="btn primary act-reveal">Показать ответ</button>';
    else if (q.t === "explain") actBtn = '<button type="button" class="btn primary act-reveal">Сверить с ключевыми мыслями</button><button type="button" class="btn primary act-done" hidden>Готово</button>';
    else actBtn = '<button type="button" class="btn primary act-check" disabled>' + (test ? "Ответить" : "Проверить") + "</button>";
    box.innerHTML = head + body + '<div class="q-actions">' + actBtn + hintBtn + '</div><div class="fb" aria-live="polite"></div>';
    host.appendChild(box);

    var actCheck = box.querySelector(".act-check");
    function setReady(v) { if (actCheck) actCheck.disabled = !v; }

    /* обработчики */
    if (q.t === "choice") {
      box.querySelectorAll(".opt").forEach(function (b) { b.addEventListener("click", function () { if (done) return; box.querySelectorAll(".opt").forEach(function (x) { x.setAttribute("aria-checked", "false"); }); b.setAttribute("aria-checked", "true"); ans.sel = +b.dataset.i; setReady(true); }); });
    } else if (q.t === "match" || q.t === "label") {
      box.querySelectorAll("select").forEach(function (sel) { sel.addEventListener("change", function () { setReady(Array.prototype.every.call(box.querySelectorAll("select"), function (s) { return s.value !== ""; })); }); });
    } else if (q.t === "order") {
      ans.picked = [];
      var pool = shuffle(q.items.map(function (_, i) { return i; }));
      if (pool.every(function (v, i) { return v === i; }) && pool.length > 1) pool.reverse();
      var poolEl = box.querySelector(".ord-pool"), pickedEl = box.querySelector(".ord-picked");
      var drawOrder = function () {
        poolEl.innerHTML = pool.filter(function (i) { return ans.picked.indexOf(i) < 0; }).map(function (i) { return '<button type="button" class="opt" data-i="' + i + '">' + esc(q.items[i]) + "</button>"; }).join("") || '<p class="q-help">Все пункты выбраны.</p>';
        pickedEl.innerHTML = ans.picked.map(function (i) { return '<li><button type="button" class="picked" data-i="' + i + '" aria-label="Убрать: ' + esc(q.items[i]) + '">' + esc(q.items[i]) + "</button></li>"; }).join("");
        poolEl.querySelectorAll(".opt").forEach(function (b) { b.addEventListener("click", function () { if (done) return; ans.picked.push(+b.dataset.i); drawOrder(); }); });
        pickedEl.querySelectorAll(".picked").forEach(function (b) { b.addEventListener("click", function () { if (done) return; ans.picked.splice(ans.picked.indexOf(+b.dataset.i), 1); drawOrder(); }); });
        setReady(ans.picked.length === q.items.length);
      };
      drawOrder();
      box.querySelector(".ord-reset").addEventListener("click", function () { if (done) return; ans.picked = []; drawOrder(); });
    } else if (q.t === "fix") {
      box.querySelectorAll(".seg").forEach(function (b) { b.addEventListener("click", function () { if (done) return; box.querySelectorAll(".seg").forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true"); ans.seg = +b.dataset.i; box.querySelector(".fix-opts").hidden = false; setReady(ans.seg != null && ans.rep != null); }); });
      box.querySelectorAll("[data-r]").forEach(function (b) { b.addEventListener("click", function () { if (done) return; box.querySelectorAll("[data-r]").forEach(function (x) { x.setAttribute("aria-checked", "false"); }); b.setAttribute("aria-checked", "true"); ans.rep = +b.dataset.r; setReady(ans.seg != null && ans.rep != null); }); });
    } else if (q.t === "compare") {
      ans.rows = {};
      box.querySelectorAll(".cbtn").forEach(function (b) { b.addEventListener("click", function () { if (done) return; var r = +b.dataset.r; box.querySelectorAll('.cbtn[data-r="' + r + '"]').forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true"); ans.rows[r] = +b.dataset.c; setReady(Object.keys(ans.rows).length === q.rows.length); }); });
    }
    var hb = box.querySelector(".hint-btn");
    if (hb) hb.addEventListener("click", function () { var h = box.querySelector(".hint"); h.hidden = false; h.textContent = "Подсказка: " + q.hint; usedHint = true; hb.disabled = true; var ind = box.querySelector('[data-rate="indep"]'); if (ind) ind.disabled = true; });

    function grade() {
      var ok = false, html = "";
      if (q.t === "choice") { ok = ans.sel === q.a;
        if (!test) box.querySelectorAll(".opt").forEach(function (b) { var i = +b.dataset.i; if (i === q.a) b.classList.add("is-good"); else if (i === ans.sel) b.classList.add("is-bad"); }); html = (ok ? "" : '<p>Ты выбрала: «' + esc(q.opts[ans.sel]) + '».</p>') + '<p><b>Правильно:</b> ' + esc(q.opts[q.a]) + "</p>"; }
      else if (q.t === "match") {
        var rows = []; ok = true;
        box.querySelectorAll("select").forEach(function (s) { var i = +s.dataset.i, v = s.value === "" ? -1 : +s.value, good = v === i; if (!good) ok = false; rows.push('<li class="' + (good ? "good" : "bad") + '"><b>' + esc(q.pairs[i][0]) + "</b> — " + esc(q.pairs[i][1]) + (good ? "" : ' <span class="was">(у тебя: ' + esc(v >= 0 ? q.pairs[v][1] : "не выбрано") + ")</span>") + "</li>"); });
        html = '<ul class="res">' + rows.join("") + "</ul>";
      } else if (q.t === "label") {
        var rows2 = []; ok = true;
        box.querySelectorAll("select").forEach(function (s) { var n = s.dataset.n, good = s.value === q.answers[n]; if (!good) ok = false; rows2.push('<li class="' + (good ? "good" : "bad") + '"><b>' + n + "</b> — " + esc(q.answers[n]) + (good ? "" : ' <span class="was">(у тебя: ' + esc(s.value || "не выбрано") + ")</span>") + "</li>"); });
        html = '<ul class="res">' + rows2.join("") + "</ul>";
      } else if (q.t === "order") {
        ok = ans.picked.every(function (v, i) { return v === i; }) && ans.picked.length === q.items.length;
        html = (ok ? "" : '<p>Твой порядок: ' + ans.picked.map(function (i) { return esc(q.items[i]); }).join(" → ") + "</p>") + '<p><b>Правильный порядок:</b></p><ol class="res">' + q.items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>";
      } else if (q.t === "fix") {
        ok = ans.seg === q.wrong && ans.rep === q.a;
        var fixed = q.parts.map(function (p, i) { return i === q.wrong ? "<b>" + esc(q.opts[q.a]) + "</b>" : esc(p); }).join("");
        html = (ok ? "" : '<p>Ты выбрала: «' + esc(q.parts[ans.seg]) + "» → «" + esc(q.opts[ans.rep]) + "».</p><p>Ошибка была в части: «" + esc(q.parts[q.wrong]) + "».</p>") + '<p><b>Верное утверждение:</b> ' + fixed + "</p>";
      } else if (q.t === "compare") {
        ok = true; var rr = [];
        q.rows.forEach(function (r, i) { var good = ans.rows[i] === r[1]; if (!good) ok = false; rr.push('<li class="' + (good ? "good" : "bad") + '">' + esc(r[0]) + " — <b>" + esc(q.cols[r[1]]) + "</b>" + (good ? "" : ' <span class="was">(у тебя: ' + esc(ans.rows[i] != null ? q.cols[ans.rows[i]] : "не выбрано") + ")</span>") + "</li>"); });
        html = '<ul class="res">' + rr.join("") + "</ul>";
      }
      return { ok: ok, html: html };
    }

    function lockInputs() { box.querySelectorAll("button.opt, button.seg, button.cbtn, button.picked, select, .ord-reset").forEach(function (x) { x.disabled = true; }); }

    function finish(result, html) {
      done = true; lockInputs();
      var fb = box.querySelector(".fb");
      if (!test) {
        var msg = "";
        if (result === "indep") msg = '<div class="fb-box ok"><p class="fb-title">' + (q.t === "recall" || q.t === "explain" ? "Отлично, ты вспомнила сама." : "Верно.") + "</p></div>";
        else if (result === "hint") msg = '<div class="fb-box mid"><p class="fb-title">' + (q.t === "recall" || q.t === "explain" ? "Частично. Это нормально — тема вернётся в повторении." : "Верно, но с подсказкой. Позже попробуешь без неё.") + "</p>" + (q.t === "explain" ? "" : "") + "</div>";
        else {
          var sim = similarFor(q);
          msg = '<div class="fb-box bad"><p class="fb-title">Здесь путаница — давай разберём.</p>' + (html || "") + (q.why ? '<p class="why"><b>Что перепутано:</b> ' + esc(q.why) + "</p>" : "") + (sim ? '<p class="later">Похожий вопрос в другой формулировке будет позже.</p>' : "") + "</div>";
        }
        if (result !== "wrong" && q.why && q.t !== "recall" && q.t !== "explain" && result === "hint") msg = msg.replace("</div>", '<p class="why">' + esc(q.why) + "</p></div>");
        fb.innerHTML = msg;
      }
      if (opts.onAnswered) opts.onAnswered(result, { html: html, q: q });
    }

    if (actCheck) actCheck.addEventListener("click", function () {
      if (done) return;
      var g = grade();
      var result = g.ok ? (usedHint ? "hint" : "indep") : "wrong";
      actCheck.hidden = true; if (hb) hb.hidden = true;
      finish(result, g.html);
    });
    if (q.t === "recall") {
      var rv = box.querySelector(".act-reveal");
      rv.addEventListener("click", function () { box.querySelector(".recall-ans").hidden = false; rv.hidden = true; if (hb) hb.hidden = true; if (usedHint) { var ind = box.querySelector('[data-rate="indep"]'); ind.disabled = true; ind.textContent = "Вспомнила сама (недоступно: была подсказка)"; } });
      box.querySelectorAll("[data-rate]").forEach(function (b) { b.addEventListener("click", function () { if (done) return; var r = b.dataset.rate; if (usedHint && r === "indep") r = "hint"; box.querySelectorAll("[data-rate]").forEach(function (x) { x.disabled = true; }); b.classList.add("chosen"); finish(r, ""); }); });
    }
    if (q.t === "explain") {
      var rv2 = box.querySelector(".act-reveal"), dn = box.querySelector(".act-done");
      rv2.addEventListener("click", function () { box.querySelector(".explain-check").hidden = false; rv2.hidden = true; dn.hidden = false; if (hb) hb.hidden = true; });
      dn.addEventListener("click", function () {
        if (done) return;
        var n = box.querySelectorAll(".checks input:checked").length, tot = q.points.length;
        var r = n === tot ? (usedHint ? "hint" : "indep") : (n >= Math.ceil(tot / 2) ? "hint" : "wrong");
        dn.hidden = true;
        box.querySelectorAll(".checks input").forEach(function (x) { x.disabled = true; });
        var missed = q.points.filter(function (_, i) { return !box.querySelector('.checks input[data-i="' + i + '"]').checked; });
        var html = missed.length ? '<p><b>Добавь в ответ:</b></p><ul class="res">' + missed.map(function (m) { return '<li class="bad">' + esc(m) + "</li>"; }).join("") + "</ul>" : "";
        if (r !== "wrong" && missed.length && !test) {
          done = true; lockInputs();
          box.querySelector(".fb").innerHTML = '<div class="fb-box mid"><p class="fb-title">Отмечено ' + n + " из " + tot + ". Хорошая основа.</p>" + html + '<p class="later">Эта тема вернётся в повторении.</p></div>';
          if (opts.onAnswered) opts.onAnswered(r, { html: html, q: q });
          return;
        }
        finish(r, html || '<p>Сравни свой ответ с образцом выше.</p>');
      });
    }
    return { box: box };
  }

  /* ---------- Каркас страниц ---------- */
  function page(html, title) {
    app.innerHTML = html;
    document.title = (title ? title + " — " : "") + "Биология без путаницы";
    window.scrollTo(0, 0);
    var h = app.querySelector("h1, h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  function backBar(label, href) { return '<nav class="topbar"><a class="back" href="' + (href || "#/") + '">← ' + esc(label || "На главную") + '</a></nav>'; }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }

  /* ---------- Главная ---------- */
  function currentPos() {
    if (S.pos) return S.pos;
    return { v: "lesson", l: 1, s: 0 };
  }
  function posHref(p) { if (p.v === "practice") return "#/practice/" + p.l; if (p.v === "done") return "#/test"; return "#/lesson/" + p.l + "/" + p.s; }
  function posLabel(p) {
    if (p.v === "done") return "Все уроки пройдены. Можно решать проверочную и готовиться к ответу у доски.";
    var L = LESSONS[p.l - 1];
    if (p.v === "practice") return "Урок " + p.l + ". " + L.title + " — тренировка";
    return "Урок " + p.l + ". " + L.title + " — «" + L.screens[p.s].title + "»";
  }
  function home() {
    var started = Object.keys(S.read).length > 0;
    var p = currentPos();
    var totalScreens = ALL_SCREENS.length, readN = ALL_SCREENS.filter(function (x) { return S.read[x.sc.id]; }).length;
    var cids = Object.keys(CONCEPTS), counts = { none: 0, read: 0, hint: 0, recalled: 0, mastered: 0 };
    cids.forEach(function (c) { counts[status(c)]++; });
    var errN = Object.keys(S.errors).length;
    var h = '<header class="hero"><h1>Биология без путаницы</h1><p class="sub">§ 5. Подцарство Многоклеточные. Тип Кишечнополостные</p></header>';
    h += '<section class="card now"><p class="label">' + (started ? "Сейчас" : "С чего начнём") + '</p><p class="now-t">' + esc(started ? posLabel(p) : "Урок 1. Многоклеточный организм") + '</p><a class="btn primary big" href="' + posHref(p) + '" data-testid="button-continue">' + (started ? "Продолжить" : "Начать") + "</a></section>";
    h += '<nav class="sections" aria-label="Разделы">';
    h += '<a class="sec" href="#/errors"><b>Повторить ошибки</b><span>' + (errN ? "Тем для повторения: " + errN : "Ошибок пока нет") + "</span></a>";
    h += '<a class="sec" href="#/board"><b>У доски</b><span>Подготовка устного ответа</span></a>';
    h += '<a class="sec" href="#/test"><b>Проверочная</b><span>' + (S.lastTest ? "Последний результат: " + S.lastTest.score + " из " + S.lastTest.total : "Смешанные задания") + "</span></a>";
    h += '<a class="sec" href="#/dict"><b>Словарь</b><span>Все термины</span></a>';
    h += '<a class="sec" href="#/summary"><b>Краткий конспект</b><span>Главное по урокам</span></a>';
    h += "</nav>";
    h += '<section class="card"><h2 class="h">Прогресс</h2>';
    h += '<p class="stat">Прочитано экранов: <b>' + readN + " из " + totalScreens + '</b></p><div class="bar" aria-hidden="true"><span style="width:' + Math.round(readN / totalScreens * 100) + '%"></span></div>';
    h += '<p class="stat">Темы усвоены: <b>' + counts.mastered + " из " + cids.length + '</b></p><div class="bar alt" aria-hidden="true"><span style="width:' + Math.round(counts.mastered / cids.length * 100) + '%"></span></div>';
    h += '<p class="small">Вспомнено самостоятельно: ' + counts.recalled + " · С подсказкой или с ошибкой: " + counts.hint + " · Только прочитано: " + counts.read + "</p>";
    h += '<details class="lessons-list"><summary>Прогресс по урокам</summary><ul>' + LESSONS.map(function (L, i) {
      var l = i + 1, cs = lessonConcepts(l), m = cs.filter(function (c) { return status(c) === "mastered"; }).length;
      return '<li><a href="#/lesson/' + l + '/0"><span>Урок ' + l + ". " + esc(L.title) + '</span><span class="small">прочитано ' + countRead(l) + "/" + L.screens.length + " · усвоено " + m + "/" + cs.length + (S.practiced[l] ? " · тренировка пройдена" : "") + "</span></a></li>";
    }).join("") + "</ul></details>";
    h += '<details class="legend"><summary>Что значат состояния тем</summary><ul><li><b>Прочитано</b> — экран открыт.</li><li><b>С подсказкой</b> — ответ был с подсказкой, частичный или с ошибкой.</li><li><b>Вспомнено</b> — последний ответ дан самостоятельно и верно.</li><li><b>Усвоено</b> — два верных самостоятельных ответа подряд на разные вопросы и нет открытых ошибок.</li></ul></details></section>';
    h += '<section class="card src"><h2 class="h">Источник</h2><p>Д.И. Трайтак, С.В. Суматохин. «Биология. Живые организмы. Животные. 7 класс» (Мнемозина). Текст сверен с изданием 2012 года: там этот материал разбит на § 8 «Общая характеристика многоклеточных животных» и § 9 «Тип Кишечнополостные. Гидра — пресноводный полип» (с. 33–39, рис. 13). В программе к учебнику он идёт как § 5. Параграф о медузах и коралловых полипах, рубрики «Для любознательных» и практическая работа не включены. Если в твоём учебнике формулировки немного другие, у доски опирайся на свой учебник.</p>' + (storageOk ? "" : '<p class="warn">Браузер не разрешает сохранять прогресс. Он сохранится только до закрытия вкладки.</p>') + '<button type="button" class="btn ghost danger" id="reset">Сбросить прогресс</button></section>';
    page(h);
    document.getElementById("reset").addEventListener("click", confirmReset);
  }

  function confirmReset() {
    var d = document.createElement("div"); d.className = "modal-back";
    d.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><h2 id="mt">Сбросить весь прогресс?</h2><p>Будут удалены прочитанные экраны, ответы, ошибки и результаты проверочной. Отменить это нельзя.</p><div class="row"><button type="button" class="btn danger" id="yes">Да, сбросить</button><button type="button" class="btn ghost" id="no">Отмена</button></div></div>';
    document.body.appendChild(d);
    var no = d.querySelector("#no"); no.focus();
    function close() { d.remove(); }
    no.addEventListener("click", close);
    d.addEventListener("click", function (e) { if (e.target === d) close(); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    d.querySelector("#yes").addEventListener("click", function () { S = blank(); try { localStorage.removeItem(KEY); } catch (e) {} save(); close(); go("#/"); });
  }

  /* ---------- Урок ---------- */
  function lesson(l, s) {
    var L = LESSONS[l - 1]; if (!L) return go("#/");
    var sc = L.screens[s]; if (!sc) return go("#/lesson/" + l + "/0");
    S.read[sc.id] = true; S.pos = { v: "lesson", l: l, s: s }; save();
    var simple = false;
    var h = backBar() + '<div class="crumbs">Урок ' + l + " из " + LESSONS.length + " · " + esc(L.title) + '</div><div class="dots" aria-label="Экран ' + (s + 1) + " из " + L.screens.length + '">' + L.screens.map(function (x, i) { return '<span class="dot' + (i === s ? " cur" : (S.read[x.id] ? " done" : "")) + '"></span>'; }).join("") + "</div>";
    h += '<article class="card screen"><h2>' + esc(sc.title) + '</h2><div class="explain" id="explain"><p>' + esc(sc.text) + '</p></div><button type="button" class="btn ghost small" id="simpler" aria-pressed="false">Объясни проще</button>';
    if (sc.analogy) { var an = sc.analogy.replace(/^Сравнение[^:]*:\s*/, ""); an = an.charAt(0).toUpperCase() + an.slice(1); h += '<aside class="analogy"><b>Сравнение — не точное описание процесса.</b> ' + esc(an) + "</aside>"; }
    h += visual(sc.visual);
    if (sc.terms && sc.terms.length) h += '<section class="terms"><h3>Новые термины</h3>' + sc.terms.map(termCard).join("") + "</section>";
    h += '<section class="checkwrap"><h3>Проверь себя</h3><div id="check"></div></section></article>';
    var last = s === L.screens.length - 1;
    h += '<div class="navrow">' + (s > 0 ? '<a class="btn ghost" href="#/lesson/' + l + "/" + (s - 1) + '">← Назад</a>' : (l > 1 ? '<a class="btn ghost" href="#/lesson/' + (l - 1) + "/" + (LESSONS[l - 2].screens.length - 1) + '">← Прошлый урок</a>' : "<span></span>")) + '<button type="button" class="btn primary" id="next"' + (S.checks[sc.id] ? "" : " disabled") + ">" + (last ? "К тренировке →" : "Дальше →") + "</button></div>";
    if (!S.checks[sc.id]) h += '<p class="small center" id="nexthint">Ответь на вопрос «Проверь себя», чтобы идти дальше.</p>';
    page(h, L.title);
    var ex = document.getElementById("explain"), sb = document.getElementById("simpler");
    sb.addEventListener("click", function () { simple = !simple; ex.innerHTML = "<p>" + esc(simple ? sc.simple : sc.text) + "</p>"; if (simple) ex.classList.add("simple"); else ex.classList.remove("simple"); sb.textContent = simple ? "Обычное объяснение" : "Объясни проще"; sb.setAttribute("aria-pressed", simple ? "true" : "false"); });
    var nextBtn = document.getElementById("next");
    renderQ(QBY[sc.check], document.getElementById("check"), { mode: "learn", onAnswered: function (r) { record(QBY[sc.check], r); S.checks[sc.id] = true; save(); nextBtn.disabled = false; var nh = document.getElementById("nexthint"); if (nh) nh.remove(); } });
    nextBtn.addEventListener("click", function () { go(last ? "#/practice/" + l : "#/lesson/" + l + "/" + (s + 1)); });
  }

  /* ---------- Сессия вопросов (тренировка и ошибки) ---------- */
  function reviewPick(beforeLesson, n, exclude) {
    var cands = Q.filter(function (q) { return q.l < beforeLesson && !exclude[q.id] && q.t !== "explain" && conceptRead(q.c); });
    function weight(q) { var st = status(q.c); var w = S.errors[q.c] ? 100 + S.errors[q.c].count * 10 : 0; w += { none: 5, read: 30, hint: 25, recalled: 10, mastered: 2 }[st]; return w + Math.random() * 8; }
    cands.sort(function (a, b) { return weight(b) - weight(a); });
    var out = [], used = {};
    cands.forEach(function (q) { if (out.length < n && !used[q.c]) { out.push(q); used[q.c] = 1; } });
    return out;
  }
  function session(cfg) {
    var queue = cfg.questions.slice(), idx = 0, stats = { indep: 0, hint: 0, wrong: 0 }, asked = {}, inserted = 0, wrongConcepts = {};
    queue.forEach(function (q) { asked[q.id] = 1; });
    function show() {
      if (idx >= queue.length) return finish();
      var q = queue[idx];
      var h = backBar() + '<div class="crumbs">' + esc(cfg.title) + '</div><p class="counter">Вопрос ' + (idx + 1) + " из " + queue.length + (q.l ? ' · <span class="small">из урока ' + q.l + (cfg.lesson && q.l !== cfg.lesson ? " — повторение" : "") + "</span>" : "") + '</p><div class="card"><div id="qhost"></div></div><div class="navrow"><span></span><button type="button" class="btn primary" id="qnext" disabled>Дальше →</button></div>';
      page(h, cfg.title);
      var nb = document.getElementById("qnext");
      renderQ(q, document.getElementById("qhost"), { mode: "learn", onAnswered: function (r) {
        record(q, r); stats[r]++;
        if (r === "wrong") { wrongConcepts[q.c] = 1; if (inserted < 6) { var sim = similarFor(q, asked); if (sim) { asked[sim.id] = 1; queue.splice(Math.min(idx + 3, queue.length), 0, sim); inserted++; } } }
        nb.disabled = false; nb.focus({ preventScroll: true });
      } });
      nb.addEventListener("click", function () { idx++; show(); });
    }
    function finish() { cfg.onFinish(stats, wrongConcepts); }
    show();
  }
  function practice(l) {
    var L = LESSONS[l - 1]; if (!L) return go("#/");
    S.pos = { v: "practice", l: l }; save();
    var own = Q.filter(function (q) { return q.l === l && !CHECK_IDS[q.id]; });
    var expl = own.filter(function (q) { return q.t === "explain"; }), rest = shuffle(own.filter(function (q) { return q.t !== "explain"; }));
    var ex = {}; own.forEach(function (q) { ex[q.id] = 1; });
    var rev = reviewPick(l, 3, ex);
    var qs = rest.slice(0, 7);
    rev.forEach(function (r, i) { qs.splice(Math.min(qs.length, 2 + i * 3), 0, r); });
    qs = qs.concat(expl.slice(0, 1));
    session({ title: "Тренировка · Урок " + l + ". " + L.title, lesson: l, questions: qs, onFinish: function (st, wc) {
      S.practiced[l] = true;
      S.pos = l < LESSONS.length ? { v: "lesson", l: l + 1, s: 0 } : { v: "done" };
      save();
      var cs = lessonConcepts(l);
      var h = backBar() + '<article class="card"><h2>Тренировка урока ' + l + ' завершена</h2><ul class="tally"><li>Самостоятельно и верно: <b>' + st.indep + "</b></li><li>С подсказкой или частично: <b>" + st.hint + "</b></li><li>Нужно повторить: <b>" + st.wrong + "</b></li></ul>";
      h += '<h3>Темы урока</h3><ul class="topics">' + cs.map(function (c) { var stt = status(c); return '<li><span>' + esc(CONCEPTS[c]) + '</span><span class="badge ' + stt + '">' + STATUS_SHORT[stt] + "</span></li>"; }).join("") + "</ul>";
      h += '<p class="small">Тема становится «усвоенной», когда ты дважды подряд верно отвечаешь на разные вопросы по ней без подсказки. Вопросы будут возвращаться в следующих уроках.</p>';
      h += '<div class="stack">' + (l < LESSONS.length ? '<a class="btn primary big" href="#/lesson/' + (l + 1) + '/0">Следующий урок: ' + esc(LESSONS[l].title) + "</a>" : '<a class="btn primary big" href="#/test">Пройти проверочную</a>') + (Object.keys(S.errors).length ? '<a class="btn ghost" href="#/errors">Повторить ошибки</a>' : "") + '<a class="btn ghost" href="#/practice/' + l + '">Ещё раз потренироваться</a><a class="btn ghost" href="#/">На главную</a></div></article>';
      page(h, "Итог тренировки");
    } });
  }
  function errors() {
    var cids = Object.keys(S.errors);
    if (!cids.length) {
      var weak = Object.keys(CONCEPTS).filter(function (c) { var s = status(c); return s === "hint" || s === "read" || s === "recalled"; });
      var h = backBar() + '<article class="card"><h2>Повторить ошибки</h2><p>Сейчас открытых ошибок нет.</p>';
      if (weak.length) h += '<p>Можно повторить темы, которые ещё не усвоены: ' + weak.length + '.</p><button type="button" class="btn primary big" id="weak">Повторить неусвоенные темы</button>';
      else if (!Object.keys(S.read).length) h += '<p>Начни с первого урока — ошибки и слабые темы будут собираться здесь.</p><a class="btn primary big" href="#/lesson/1/0">Начать урок 1</a>';
      else h += "<p>Все прочитанные темы усвоены.</p>";
      h += "</article>";
      page(h, "Повторить ошибки");
      var w = document.getElementById("weak"); if (w) w.addEventListener("click", function () { runRepeat(shuffle(weak).slice(0, 8), "Повторение неусвоенных тем"); });
      return;
    }
    var h2 = backBar() + '<article class="card"><h2>Повторить ошибки</h2><p>Темы, где была путаница. Вопросы будут в другой формулировке. Тема уходит из списка после верного самостоятельного ответа на другой вопрос.</p><ul class="topics">' + cids.map(function (c) { var p = SCREEN_OF_CONCEPT[c]; return '<li><span>' + esc(CONCEPTS[c]) + '</span><a class="small" href="#/lesson/' + p.l + "/" + p.s + '">к объяснению</a></li>'; }).join("") + '</ul><button type="button" class="btn primary big" id="go">Начать повторение</button></article>';
    page(h2, "Повторить ошибки");
    document.getElementById("go").addEventListener("click", function () { runRepeat(cids, "Повторение ошибок"); });
  }
  function runRepeat(cids, title) {
    var qs = [];
    cids.forEach(function (c) {
      var last = S.errors[c] && S.errors[c].lastQ;
      var pool = shuffle(Q.filter(function (q) { return q.c === c && q.id !== last; }));
      if (pool.length) qs.push(pool[0]);
    });
    qs = shuffle(qs).slice(0, 10);
    session({ title: title, questions: qs, onFinish: function (st) {
      var left = Object.keys(S.errors).length;
      var h = backBar() + '<article class="card"><h2>Повторение завершено</h2><ul class="tally"><li>Самостоятельно и верно: <b>' + st.indep + "</b></li><li>С подсказкой или частично: <b>" + st.hint + "</b></li><li>Ещё есть путаница: <b>" + st.wrong + "</b></li></ul><p>" + (left ? "Тем в списке ошибок: " + left + ". Их можно повторить ещё раз чуть позже." : "Список ошибок пуст.") + '</p><div class="stack">' + (left ? '<a class="btn primary" href="#/errors">Повторить ещё</a>' : "") + '<a class="btn ghost" href="#/">На главную</a></div></article>';
      page(h, "Итог повторения");
    } });
  }

  /* ---------- Проверочная ---------- */
  var AUTO = { choice: 1, match: 1, order: 1, label: 1, fix: 1, compare: 1 };
  function test() {
    var avail = LESSONS.map(function (_, i) { return i + 1; }).filter(lessonRead);
    var h = backBar() + '<article class="card"><h2>Проверочная</h2>';
    if (!avail.length) {
      h += '<p>Проверочная собирается только из уроков, которые ты уже прочитала полностью. Пока таких уроков нет.</p><a class="btn primary big" href="' + posHref(currentPos()) + '">Продолжить обучение</a></article>';
      return page(h, "Проверочная");
    }
    h += "<p>Вопросы из пройденных уроков: " + avail.map(function (l) { return "№" + l; }).join(", ") + (avail.length < LESSONS.length ? ". Остальные уроки появятся, когда ты их прочитаешь." : ".") + "</p><ul class=\"plain\"><li>Без таймера.</li><li>Правильные ответы и разбор — в конце.</li><li>Подсказок нет — так ты узнаешь, что помнишь сама.</li></ul>";
    h += '<button type="button" class="btn primary big" id="start">Начать проверочную</button></article>';
    page(h, "Проверочная");
    document.getElementById("start").addEventListener("click", function () { runTest(avail); });
  }
  function runTest(avail) {
    var per = avail.length >= 6 ? 2 : (avail.length >= 3 ? 3 : 5);
    var qs = [];
    avail.forEach(function (l) {
      var pool = shuffle(Q.filter(function (q) { return q.l === l && AUTO[q.t]; }));
      var usedC = {}, picked = [];
      pool.forEach(function (q) { if (picked.length < per && !usedC[q.c]) { picked.push(q); usedC[q.c] = 1; } });
      qs = qs.concat(picked);
    });
    qs = shuffle(qs).slice(0, 14);
    var idx = 0, results = [];
    function show() {
      if (idx >= qs.length) return finish();
      var q = qs[idx];
      var h = '<nav class="topbar"><button type="button" class="back linkbtn" id="quit">← Прервать</button></nav><div class="crumbs">Проверочная</div><p class="counter">Вопрос ' + (idx + 1) + " из " + qs.length + '</p><div class="card"><div id="qhost"></div></div><div class="navrow"><button type="button" class="btn ghost" id="skip">Не знаю</button><span></span></div>';
      page(h, "Проверочная");
      document.getElementById("quit").addEventListener("click", quitDialog);
      renderQ(q, document.getElementById("qhost"), { mode: "test", onAnswered: function (r, det) { results.push({ q: q, ok: r !== "wrong", html: det.html }); idx++; show(); } });
      document.getElementById("skip").addEventListener("click", function () { results.push({ q: q, ok: false, html: "", skipped: true }); idx++; show(); });
    }
    function quitDialog() {
      var d = document.createElement("div"); d.className = "modal-back";
      d.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="qt"><h2 id="qt">Прервать проверочную?</h2><p>Ответы этой попытки не сохранятся.</p><div class="row"><button type="button" class="btn danger" id="yes">Прервать</button><button type="button" class="btn ghost" id="no">Продолжить</button></div></div>';
      document.body.appendChild(d); d.querySelector("#no").focus();
      d.querySelector("#no").addEventListener("click", function () { d.remove(); });
      d.querySelector("#yes").addEventListener("click", function () { d.remove(); go("#/"); });
    }
    function finish() {
      results.forEach(function (r) { record(r.q, r.ok ? "indep" : "wrong"); });
      var score = results.filter(function (r) { return r.ok; }).length;
      S.lastTest = { score: score, total: results.length, date: new Date().toISOString() }; save();
      var wrong = results.filter(function (r) { return !r.ok; });
      var topics = {}; wrong.forEach(function (r) { topics[r.q.c] = 1; });
      var h = backBar() + '<article class="card"><h2>Результат: ' + score + " из " + results.length + '</h2><p>' + (score === results.length ? "Все ответы верные." : (score >= results.length * 0.7 ? "Хороший результат. Посмотри разбор — он поможет закрепить." : "Есть темы, которые стоит повторить. Разбор ниже.")) + "</p>";
      if (wrong.length) {
        h += '<h3>Темы для повторения</h3><ul class="topics">' + Object.keys(topics).map(function (c) { var p = SCREEN_OF_CONCEPT[c]; return '<li><span>' + esc(CONCEPTS[c]) + '</span><a class="btn ghost small" href="#/lesson/' + p.l + "/" + p.s + '">Открыть объяснение</a></li>'; }).join("") + '</ul><a class="btn primary" href="#/errors">Повторить ошибки</a>';
        h += '<h3>Разбор ошибок</h3>' + wrong.map(function (r, i) {
          var q = r.q, qt = q.q || "Найди и исправь ошибку: «" + q.parts.join("") + "»";
          return '<div class="review"><p class="q-type">Ошибка ' + (i + 1) + " · урок " + q.l + '</p><p class="q-text">' + esc(qt) + "</p>" + (r.skipped ? "<p>Ответ не дан.</p>" + skippedAnswer(q) : r.html) + (q.why ? '<p class="why"><b>Что перепутано:</b> ' + esc(q.why) + "</p>" : "") + "</div>";
        }).join("");
      }
      h += '<div class="stack"><a class="btn ghost" href="#/test">Пройти ещё раз</a><a class="btn ghost" href="#/">На главную</a></div></article>';
      page(h, "Результат проверочной");
    }
    show();
  }
  function skippedAnswer(q) {
    if (q.t === "choice") return "<p><b>Правильно:</b> " + esc(q.opts[q.a]) + "</p>";
    if (q.t === "match") return '<ul class="res">' + q.pairs.map(function (p) { return "<li><b>" + esc(p[0]) + "</b> — " + esc(p[1]) + "</li>"; }).join("") + "</ul>";
    if (q.t === "order") return '<ol class="res">' + q.items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>";
    if (q.t === "label") return '<ul class="res">' + Object.keys(q.answers).map(function (n) { return "<li><b>" + n + "</b> — " + esc(q.answers[n]) + "</li>"; }).join("") + "</ul>";
    if (q.t === "fix") return "<p><b>Верное утверждение:</b> " + q.parts.map(function (p, i) { return i === q.wrong ? "<b>" + esc(q.opts[q.a]) + "</b>" : esc(p); }).join("") + "</p>";
    if (q.t === "compare") return '<ul class="res">' + q.rows.map(function (r) { return "<li>" + esc(r[0]) + " — <b>" + esc(q.cols[r[1]]) + "</b></li>"; }).join("") + "</ul>";
    return "";
  }

  /* ---------- У доски ---------- */
  function board(id) {
    if (!id) {
      var h = backBar() + '<article class="card"><h2>У доски</h2><p>Выбери вопрос. Сначала увидишь только вопрос: ответь вслух или про себя, как у доски. Потом нажми «Я ответила» и сверься с планом и образцом. Микрофон не нужен.</p><button type="button" class="btn primary big" id="rnd">Случайный вопрос</button></article><ul class="boardlist">' + BOARD.map(function (b) {
        var st = S.board[b.id]; var lr = lessonRead(b.l);
        return '<li><a href="#/board/' + b.id + '"><span>' + esc(b.q) + '</span><span class="small">' + (st === "ready" ? '<span class="badge mastered">готова</span>' : st === "again" ? '<span class="badge hint">ещё потренироваться</span>' : "") + (lr ? "" : " Тема из урока " + b.l + ", который ещё не пройден.") + "</span></a></li>";
      }).join("") + "</ul>";
      page(h, "У доски");
      document.getElementById("rnd").addEventListener("click", function () { var pool = BOARD.filter(function (b) { return S.board[b.id] !== "ready"; }); if (!pool.length) pool = BOARD; go("#/board/" + shuffle(pool)[0].id); });
      return;
    }
    var b = BOARD.filter(function (x) { return x.id === id; })[0]; if (!b) return go("#/board");
    var h2 = backBar("К списку вопросов", "#/board") + '<article class="card board"><p class="label">Вопрос для устного ответа</p><h2>' + esc(b.q) + '</h2>' + (lessonRead(b.l) ? "" : '<p class="warn">Эта тема из урока ' + b.l + ', который ты ещё не прошла. Можно сначала <a href="#/lesson/' + b.l + '/0">открыть урок</a>.</p>') + '<p class="small">Расскажи связно, своими словами: не перечисляй термины, а объясняй, как одно связано с другим.</p><button type="button" class="btn primary big" id="done">Я ответила</button><div id="after" hidden></div></article>';
    page(h2, "У доски");
    document.getElementById("done").addEventListener("click", function () {
      this.hidden = true;
      var a = document.getElementById("after"); a.hidden = false;
      a.innerHTML = '<h3>План ответа</h3><ol class="plan">' + b.plan.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + '</ol><h3>Образец ответа</h3><p class="sample-ans">' + esc(b.sample) + '</p><h3>Проверь себя: что было в твоём ответе?</h3><div class="checks">' + b.points.map(function (p, i) { return '<label class="chk"><input type="checkbox" data-i="' + i + '"> <span>' + esc(p) + "</span></label>"; }).join("") + '</div><p class="small" id="cnt">Отмечено: 0 из ' + b.points.length + '</p><div class="stack"><button type="button" class="btn primary" id="ready">Готова отвечать</button><button type="button" class="btn ghost" id="again">Ещё потренируюсь</button><a class="btn ghost" href="#/board">Другой вопрос</a></div><p class="small" id="saved" aria-live="polite"></p>';
      a.querySelectorAll(".checks input").forEach(function (x) { x.addEventListener("change", function () { document.getElementById("cnt").textContent = "Отмечено: " + a.querySelectorAll(".checks input:checked").length + " из " + b.points.length; }); });
      document.getElementById("ready").addEventListener("click", function () { S.board[b.id] = "ready"; save(); document.getElementById("saved").textContent = "Сохранено: «готова отвечать»."; });
      document.getElementById("again").addEventListener("click", function () { S.board[b.id] = "again"; save(); document.getElementById("saved").textContent = "Сохранено: вопрос останется в списке для тренировки."; });
      a.querySelector("h3").focus && a.querySelector("h3").setAttribute("tabindex", "-1");
      a.scrollIntoView({ block: "start" });
    });
  }

  /* ---------- Словарь и конспект ---------- */
  function dict() {
    var keys = Object.keys(TERMS).sort(function (a, b) { return TERMS[a].n.localeCompare(TERMS[b].n, "ru"); });
    var h = backBar() + '<article class="card"><h2>Словарь</h2><label class="search"><span>Найти термин</span><input type="search" id="find" placeholder="Например: энтодерма" autocomplete="off"></label><p class="small" id="found">Терминов: ' + keys.length + '</p><div id="terms">' + keys.map(function (k) { var tl = TERM_LESSON[k]; return '<div class="dterm" data-n="' + esc(TERMS[k].n.toLowerCase()) + '">' + termCard(k) + (tl ? '<a class="small" href="#/lesson/' + tl.l + "/" + tl.s + '">Урок ' + tl.l + " — к объяснению</a>" : "") + "</div>"; }).join("") + "</div></article>";
    page(h, "Словарь");
    var f = document.getElementById("find");
    f.addEventListener("input", function () { var v = f.value.trim().toLowerCase(), n = 0; document.querySelectorAll(".dterm").forEach(function (d) { var show = !v || d.dataset.n.indexOf(v) >= 0 || d.textContent.toLowerCase().indexOf(v) >= 0; d.hidden = !show; if (show) n++; }); document.getElementById("found").textContent = n ? "Найдено: " + n : "Ничего не найдено. Попробуй часть слова."; });
  }
  function summary() {
    var h = backBar() + '<article class="card"><h2>Краткий конспект</h2><p class="small">Главное из каждого урока — для быстрого повторения перед проверочной.</p></article>' + SUMMARY.map(function (s) { var L = LESSONS[s.l - 1]; return '<section class="card"><h3>Урок ' + s.l + ". " + esc(L.title) + '</h3><ul class="sum">' + s.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + '</ul><a class="btn ghost small" href="#/lesson/' + s.l + '/0">Открыть урок</a></section>'; }).join("");
    page(h, "Краткий конспект");
  }

  /* ---------- Маршрутизация ---------- */
  function route() {
    var parts = (location.hash || "#/").replace(/^#\/?/, "").split("/");
    var r = parts[0];
    if (r === "lesson") return lesson(+parts[1] || 1, +parts[2] || 0);
    if (r === "practice") return practice(+parts[1] || 1);
    if (r === "errors") return errors();
    if (r === "board") return board(parts[1]);
    if (r === "test") return test();
    if (r === "dict") return dict();
    if (r === "summary") return summary();
    return home();
  }
  window.addEventListener("hashchange", route);
  route();
})();

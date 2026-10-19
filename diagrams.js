/* Схемы в формате SVG. Все подписи сверены с текстом учебника и рис. 13. */
(function () {
  var C = { ecto: "#4a8f6a", meso: "#e8c95c", endo: "#bfe0c7", cav: "#e3f0f6", ink: "#1f2b28", sting: "#1f4e79", line: "#33423e", sole: "#2f6b4f" };

  function q(p0, p1, p2, t) { var u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; }

  var TENTS = [
    [[200, 150], [160, 95], [110, 45]],
    [[220, 150], [262, 95], [318, 52]],
    [[196, 158], [140, 132], [78, 140]],
    [[224, 158], [285, 132], [346, 135]]
  ];
  function tPath(t) { return "M" + t[0] + " Q" + t[1] + " " + t[2]; }

  /* Точки для подписей гидры */
  var HP = {
    1: { name: "Щупальце", tx: 292, ty: 75, lx: 330, ly: 32, anchor: "start" },
    2: { name: "Рот", tx: 210, ty: 97, lx: 210, ly: 24, anchor: "middle" },
    8: { name: "Мезоглея", tx: 251, ty: 240, lx: 300, ly: 236, anchor: "start" },
    3: { name: "Эктодерма", tx: 260, ty: 295, lx: 300, ly: 292, anchor: "start" },
    4: { name: "Энтодерма", tx: 240, ty: 350, lx: 300, ly: 350, anchor: "start" },
    5: { name: "Кишечная полость", tx: 210, ty: 410, lx: 300, ly: 420, anchor: "start" },
    6: { name: "Подошва", tx: 222, ty: 498, lx: 300, ly: 505, anchor: "start" },
    7: { name: "Стрекательная клетка", tx: 0, ty: 0, lx: 10, ly: 196, anchor: "start" }
  };
  (function () { var p = q(TENTS[2][0], TENTS[2][1], TENTS[2][2], 0.72); HP[7].tx = p[0]; HP[7].ty = p[1]; })();

  function hydra(opts) {
    opts = opts || {};
    var show = opts.points || [1, 2, 3, 4, 5, 6, 7, 8];
    var numbers = !!opts.numbers;
    var s = '<svg viewBox="0 0 420 540" class="dia" role="img" aria-label="Схема продольного разреза гидры">';
    var body = "M210 445 L210 150";
    function layer(col, bw, tw) {
      var out = '<path d="' + body + '" stroke="' + col + '" stroke-width="' + bw + '" stroke-linecap="round" fill="none"/>';
      TENTS.forEach(function (t) { out += '<path d="' + tPath(t) + '" stroke="' + col + '" stroke-width="' + tw + '" stroke-linecap="round" fill="none"/>'; });
      return out;
    }
    s += layer(C.ecto, 110, 26) + layer(C.meso, 86, 17) + layer(C.endo, 78, 14) + layer(C.cav, 40, 5);
    s += '<path d="M210 152 L210 92" stroke="' + C.cav + '" stroke-width="14" fill="none"/>';
    s += '<ellipse cx="210" cy="497" rx="44" ry="8" fill="' + C.sole + '"/>';
    TENTS.forEach(function (t) {
      [0.45, 0.62, 0.78, 0.92].forEach(function (k) { var p = q(t[0], t[1], t[2], k); s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4.2" fill="' + C.sting + '"/>'; });
    });
    show.forEach(function (n) {
      var P = HP[n]; if (!P) return;
      var lx = P.lx, ly = P.ly;
      var ex = P.anchor === "start" ? lx - 6 : lx, ey = P.anchor === "middle" ? ly + 8 : ly - 5;
      if (numbers) { ex = lx + 14 * (P.anchor === "start" ? 1 : 0); ey = ly - 5; }
      s += '<line x1="' + P.tx + '" y1="' + P.ty + '" x2="' + ex + '" y2="' + ey + '" stroke="' + C.line + '" stroke-width="1.6"/>';
      s += '<circle cx="' + P.tx + '" cy="' + P.ty + '" r="3.5" fill="' + C.ink + '"/>';
      if (numbers) {
        var cx = P.anchor === "start" ? lx + 14 : lx;
        s += '<circle cx="' + cx + '" cy="' + (ly - 5) + '" r="15" fill="#fff" stroke="' + C.ink + '" stroke-width="2"/>';
        s += '<text x="' + cx + '" y="' + (ly + 1) + '" text-anchor="middle" class="dn">' + n + "</text>";
      } else {
        var words = P.name.split(" ");
        if (P.name.length > 12 && words.length > 1) {
          s += '<text x="' + lx + '" y="' + ly + '" text-anchor="' + P.anchor + '" class="dl">' + words[0] + "</text>";
          s += '<text x="' + lx + '" y="' + (ly + 19) + '" text-anchor="' + P.anchor + '" class="dl">' + words.slice(1).join(" ") + "</text>";
        } else s += '<text x="' + lx + '" y="' + ly + '" text-anchor="' + P.anchor + '" class="dl">' + P.name + "</text>";
      }
    });
    s += "</svg>";
    return s;
  }

  /* Стенка тела гидры: клетки */
  var WALL = { 1: "Кожно-мускульная клетка", 2: "Стрекательная клетка", 3: "Нервная клетка", 4: "Железистая клетка", 5: "Пищеварительная клетка" };
  function wall(opts) {
    opts = opts || {};
    var X0 = 112, W = 68;
    var s = '<svg viewBox="0 0 460 400" class="dia" role="img" aria-label="Схема клеток стенки тела гидры">';
    s += '<rect x="0" y="0" width="460" height="64" fill="#eef6f9"/>';
    s += '<text x="8" y="26" class="dw">Вода (снаружи)</text>';
    s += '<rect x="' + X0 + '" y="150" width="' + (W * 5) + '" height="10" fill="' + C.meso + '"/>';
    s += '<rect x="0" y="262" width="460" height="138" fill="' + C.cav + '"/>';
    var ecto = ["km", "st", "km", "km", "st"];
    ecto.forEach(function (k, i) {
      var x = X0 + i * W;
      s += '<rect x="' + (x + 1) + '" y="64" width="' + (W - 2) + '" height="86" rx="6" fill="' + C.ecto + '" stroke="#2d6249" stroke-width="1.5"/>';
      if (k === "km") s += '<line x1="' + (x + 8) + '" y1="142" x2="' + (x + W - 8) + '" y2="142" stroke="#c0504d" stroke-width="5" stroke-linecap="round"/>';
      else {
        var cx = x + W / 2;
        s += '<ellipse cx="' + cx + '" cy="104" rx="14" ry="24" fill="#d8e8f6" stroke="' + C.sting + '" stroke-width="2"/>';
        s += '<path d="M' + cx + ' 120 q-8 -6 0 -12 q8 -6 0 -12 q-8 -6 0 -12" stroke="' + C.sting + '" stroke-width="2" fill="none"/>';
        s += '<line x1="' + (cx + 8) + '" y1="66" x2="' + (cx + 14) + '" y2="44" stroke="' + C.ink + '" stroke-width="2.4"/>';
      }
    });
    /* нервная клетка */
    var nx = X0 + 3 * W + 6, ny = 140;
    s += '<path d="M' + (nx - 40) + ' ' + (ny + 4) + ' L' + nx + ' ' + ny + ' L' + (nx + 44) + ' ' + (ny + 6) + ' M' + nx + ' ' + ny + ' L' + (nx + 8) + ' ' + (ny - 26) + '" stroke="#e6b422" stroke-width="3" fill="none"/>';
    s += '<circle cx="' + nx + '" cy="' + ny + '" r="8" fill="#e6b422" stroke="#8a6a10" stroke-width="1.5"/>';
    var endo = ["pd", "gl", "pd", "gl", "pd"];
    endo.forEach(function (k, i) {
      var x = X0 + i * W, cx = x + W / 2;
      s += '<rect x="' + (x + 1) + '" y="160" width="' + (W - 2) + '" height="102" rx="6" fill="' + C.endo + '" stroke="#7fb393" stroke-width="1.5"/>';
      if (k === "gl") { [[cx - 12, 240], [cx, 246], [cx + 12, 238], [cx - 4, 226], [cx + 8, 222]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#d98c3a"/>'; }); }
      else {
        s += '<circle cx="' + (cx - 10) + '" cy="205" r="8" fill="#fff" stroke="#7fb393"/><circle cx="' + (cx + 10) + '" cy="225" r="6" fill="#fff" stroke="#7fb393"/>';
        s += '<path d="M' + cx + ' 262 q8 10 0 20 q-8 10 0 20" stroke="' + C.ink + '" stroke-width="2" fill="none"/>';
      }
    });
    s += '<text x="8" y="112" class="dw">Эктодерма</text>';
    s += '<text x="8" y="160" class="dw">Мезоглея</text>';
    s += '<text x="8" y="215" class="dw">Энтодерма</text>';
    s += '<text x="8" y="360" class="dw">Кишечная полость</text>';
    var M = { 1: [X0 + W * 0.5, 64, X0 + W * 0.5, 40], 2: [X0 + W * 1.5, 82, X0 + W * 1.5 - 22, 40], 3: [nx + 40, ny + 6, 438, 182], 4: [X0 + W * 1.5, 250, X0 + W * 1.5, 340], 5: [X0 + W * 2.5, 300, X0 + W * 2.5 + 40, 340] };
    Object.keys(M).forEach(function (n) {
      var m = M[n];
      s += '<line x1="' + m[0] + '" y1="' + m[1] + '" x2="' + m[2] + '" y2="' + m[3] + '" stroke="' + C.line + '" stroke-width="1.6"/>';
      s += '<circle cx="' + m[2] + '" cy="' + m[3] + '" r="15" fill="#fff" stroke="' + C.ink + '" stroke-width="2"/>';
      s += '<text x="' + m[2] + '" y="' + (m[3] + 6) + '" text-anchor="middle" class="dn">' + n + "</text>";
    });
    s += "</svg>";
    return s;
  }

  function symmetry() {
    var s = '<svg viewBox="0 0 320 336" class="dia small" role="img" aria-label="Лучевая симметрия: вид гидры сверху">';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, x = 160 + Math.cos(a) * 118, y = 145 + Math.sin(a) * 118;
      s += '<line x1="160" y1="145" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + C.ecto + '" stroke-width="18" stroke-linecap="round"/>';
    }
    s += '<circle cx="160" cy="145" r="44" fill="' + C.ecto + '"/>';
    [0, 45, 90, 135].forEach(function (d) { var a = d * Math.PI / 180, dx = Math.cos(a) * 140, dy = Math.sin(a) * 140; s += '<line x1="' + (160 - dx).toFixed(1) + '" y1="' + (145 - dy).toFixed(1) + '" x2="' + (160 + dx).toFixed(1) + '" y2="' + (145 + dy).toFixed(1) + '" stroke="#b5533c" stroke-width="2" stroke-dasharray="7 6"/>'; });
    s += '<circle cx="160" cy="145" r="10" fill="' + C.cav + '" stroke="' + C.ink + '" stroke-width="1.5"/>';
    s += '<text x="160" y="306" text-anchor="middle" class="ds">В центре — рот. Пунктир — линии,</text><text x="160" y="326" text-anchor="middle" class="ds">которые делят тело на похожие части</text>';
    s += "</svg>";
    return s;
  }

  function layers() {
    var s = '<svg viewBox="0 0 470 270" class="dia" role="img" aria-label="Поперечный разрез тела: два слоя клеток и мезоглея">';
    s += '<circle cx="130" cy="135" r="112" fill="' + C.ecto + '"/><circle cx="130" cy="135" r="86" fill="' + C.meso + '"/><circle cx="130" cy="135" r="80" fill="' + C.endo + '"/><circle cx="130" cy="135" r="46" fill="' + C.cav + '"/>';
    var L = [[230, 70, 262, 52, "Эктодерма (снаружи)"], [214, 118, 262, 112, "Мезоглея"], [196, 160, 262, 170, "Энтодерма (внутри)"], [150, 140, 262, 228, "Кишечная полость"]];
    L.forEach(function (l) { s += '<line x1="' + l[0] + '" y1="' + l[1] + '" x2="' + (l[2] - 6) + '" y2="' + (l[3] - 5) + '" stroke="' + C.line + '" stroke-width="1.6"/><circle cx="' + l[0] + '" cy="' + l[1] + '" r="3.5" fill="' + C.ink + '"/><text x="' + l[2] + '" y="' + l[3] + '" class="dl">' + l[4] + "</text>"; });
    s += "</svg>";
    return s;
  }

  function net() {
    var s = '<svg viewBox="0 0 320 260" class="dia small" role="img" aria-label="Сетчатая нервная система">';
    s += '<rect x="70" y="20" width="180" height="220" rx="60" fill="' + C.endo + '" stroke="' + C.ecto + '" stroke-width="6"/>';
    var pts = [];
    for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) pts.push([110 + c * 50 + (r % 2) * 12, 55 + r * 50 + (c % 2) * 8]);
    function d(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
    pts.forEach(function (a, i) { pts.forEach(function (b, j) { if (j > i && d(a, b) < 66) s += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#b48a12" stroke-width="2.4"/>'; }); });
    pts.forEach(function (a) { s += '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="6" fill="#e6b422" stroke="#8a6a10"/>'; });
    s += '<text x="160" y="256" text-anchor="middle" class="ds">Нервные клетки соединены отростками в сеть</text>';
    s += "</svg>";
    return s;
  }

  function forms() {
    var s = '<svg viewBox="0 0 440 290" class="dia" role="img" aria-label="Полип и медуза">';
    s += '<text x="105" y="24" text-anchor="middle" class="dh">Полип</text><text x="330" y="24" text-anchor="middle" class="dh">Медуза</text>';
    s += '<line x1="20" y1="236" x2="200" y2="236" stroke="#8a7b5c" stroke-width="4"/>';
    s += '<rect x="86" y="104" width="38" height="126" rx="16" fill="' + C.ecto + '"/>';
    s += '<ellipse cx="105" cy="231" rx="26" ry="6" fill="' + C.sole + '"/>';
    ["M98 108 Q80 70 58 50", "M112 108 Q130 70 152 50", "M100 106 Q96 70 92 40", "M110 106 Q114 70 120 40"].forEach(function (p) { s += '<path d="' + p + '" stroke="' + C.ecto + '" stroke-width="8" stroke-linecap="round" fill="none"/>'; });
    s += '<circle cx="105" cy="106" r="5" fill="' + C.cav + '" stroke="' + C.ink + '"/>';
    s += '<text x="132" y="112" class="ds">рот вверху</text><text x="138" y="214" class="ds">подошва</text><line x1="134" y1="210" x2="122" y2="228" stroke="#5b6b66" stroke-width="1.4"/><text x="105" y="262" text-anchor="middle" class="ds">прикреплён</text><text x="105" y="280" text-anchor="middle" class="ds">подошвой ко дну</text>';
    s += '<path d="M255 120 Q260 40 330 40 Q400 40 405 120 Q330 104 255 120 Z" fill="#9ccdb3" stroke="' + C.ecto + '" stroke-width="3"/>';
    ["M275 118 q-6 30 4 60 q8 26 -2 52", "M300 114 q-6 30 4 60 q8 26 -2 52", "M360 114 q6 30 -4 60 q-8 26 2 52", "M385 118 q6 30 -4 60 q-8 26 2 52"].forEach(function (p) { s += '<path d="' + p + '" stroke="' + C.ecto + '" stroke-width="3" fill="none"/>'; });
    s += '<circle cx="330" cy="112" r="6" fill="' + C.cav + '" stroke="' + C.ink + '"/>';
    s += '<line x1="330" y1="118" x2="330" y2="160" stroke="' + C.line + '" stroke-width="1.6"/><text x="330" y="176" text-anchor="middle" class="ds">рот снизу</text>';
    s += '<text x="330" y="80" class="ds" text-anchor="middle">зонтик</text>';
    s += '<text x="330" y="262" text-anchor="middle" class="ds">плавает выпуклой</text><text x="330" y="280" text-anchor="middle" class="ds">стороной вперёд</text>';
    s += "</svg>";
    return s;
  }

  function mini(x, base, h, extra) {
    var top = base - h;
    var s = '<line x1="' + x + '" y1="' + base + '" x2="' + x + '" y2="' + top + '" stroke="' + C.ecto + '" stroke-width="16" stroke-linecap="round"/>';
    [-40, -20, 0, 20, 40].forEach(function (d) { s += '<path d="M' + x + ' ' + top + ' q' + (d * 0.5) + ' -20 ' + d + ' -36" stroke="' + C.ecto + '" stroke-width="4" fill="none" stroke-linecap="round"/>'; });
    return s + (extra || "");
  }

  function budding() {
    var s = '<svg viewBox="0 0 460 250" class="dia" role="img" aria-label="Этапы почкования гидры">';
    var xs = [60, 175, 290, 395], base = 200;
    s += mini(xs[0], base, 110, '<circle cx="' + (xs[0] + 10) + '" cy="150" r="9" fill="#d07a5b"/>');
    s += mini(xs[1], base, 110, '<line x1="' + (xs[1] + 6) + '" y1="150" x2="' + (xs[1] + 34) + '" y2="132" stroke="#d07a5b" stroke-width="12" stroke-linecap="round"/>');
    s += mini(xs[2], base, 110, '<line x1="' + (xs[2] + 6) + '" y1="150" x2="' + (xs[2] + 40) + '" y2="122" stroke="#d07a5b" stroke-width="12" stroke-linecap="round"/>' + [-14, 0, 14].map(function (d) { return '<path d="M' + (xs[2] + 40) + ' 122 q' + (d * 0.5) + ' -10 ' + d + ' -18" stroke="#d07a5b" stroke-width="3" fill="none"/>'; }).join(""));
    s += mini(xs[3] - 20, base, 110, "");
    s += '<line x1="' + (xs[3] + 42) + '" y1="200" x2="' + (xs[3] + 42) + '" y2="150" stroke="#d07a5b" stroke-width="12" stroke-linecap="round"/>' + [-16, 0, 16].map(function (d) { return '<path d="M' + (xs[3] + 42) + ' 150 q' + (d * 0.5) + ' -12 ' + d + ' -22" stroke="#d07a5b" stroke-width="3" fill="none"/>'; }).join("");
    ["1", "2", "3", "4"].forEach(function (n, i) { s += '<circle cx="' + xs[i] + '" cy="230" r="13" fill="#fff" stroke="' + C.ink + '" stroke-width="2"/><text x="' + xs[i] + '" y="236" text-anchor="middle" class="dn">' + n + "</text>"; });
    s += "</svg>";
    s += '<ol class="dia-legend"><li>На теле образуется выпячивание — почка (показана другим цветом).</li><li>Почка увеличивается.</li><li>На вершине почки прорывается рот, появляются щупальца.</li><li>Молодая гидра отделяется и живёт самостоятельно.</li></ol>';
    return s;
  }

  function regen() {
    var s = '<svg viewBox="0 0 460 230" class="dia" role="img" aria-label="Регенерация гидры из части тела">';
    s += '<line x1="70" y1="190" x2="70" y2="70" stroke="' + C.ecto + '" stroke-width="16" stroke-linecap="round"/>';
    [-30, -15, 0, 15, 30].forEach(function (d) { s += '<path d="M70 70 q' + d * 0.5 + ' -20 ' + d + ' -36" stroke="' + C.ecto + '" stroke-width="4" fill="none"/>'; });
    s += '<line x1="40" y1="105" x2="100" y2="105" stroke="#b5533c" stroke-width="2.5" stroke-dasharray="6 5"/><line x1="40" y1="160" x2="100" y2="160" stroke="#b5533c" stroke-width="2.5" stroke-dasharray="6 5"/>';
    s += '<text x="70" y="222" text-anchor="middle" class="ds">разрез</text>';
    s += '<path d="M125 132 L165 132" stroke="' + C.line + '" stroke-width="3" marker-end="url(#ar2)"/>';
    s += '<line x1="215" y1="155" x2="215" y2="110" stroke="' + C.ecto + '" stroke-width="16" stroke-linecap="round"/>';
    s += '<text x="215" y="222" text-anchor="middle" class="ds">часть тела</text>';
    s += '<path d="M260 132 L300 132" stroke="' + C.line + '" stroke-width="3" marker-end="url(#ar2)"/>';
    s += '<line x1="370" y1="190" x2="370" y2="158" stroke="#b9d9a4" stroke-width="16" stroke-linecap="round"/>';
    s += '<line x1="370" y1="155" x2="370" y2="110" stroke="' + C.ecto + '" stroke-width="16" stroke-linecap="round"/>';
    s += '<line x1="370" y1="106" x2="370" y2="70" stroke="#b9d9a4" stroke-width="16" stroke-linecap="round"/>';
    [-30, -15, 0, 15, 30].forEach(function (d) { s += '<path d="M370 70 q' + d * 0.5 + ' -20 ' + d + ' -36" stroke="#9cc584" stroke-width="4" fill="none"/>'; });
    s += '<text x="370" y="222" text-anchor="middle" class="ds">целая гидра</text>';
    s += '<defs><marker id="ar2" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="' + C.line + '"/></marker></defs>';
    s += "</svg>";
    s += '<p class="dia-note">Светлым показаны восстановленные части. Это один из трёх случаев рис. 13: восстановлены и нижняя, и верхняя части. В других случаях восстанавливается только нижняя или только верхняя часть.</p>';
    return s;
  }

  function move() {
    var s = '<svg viewBox="0 0 460 230" class="dia" role="img" aria-label="Сокращение и изгиб тела гидры">';
    s += mini(70, 180, 100, "");
    s += '<ellipse cx="225" cy="160" rx="26" ry="20" fill="' + C.ecto + '"/>';
    [-14, 0, 14].forEach(function (d) { s += '<path d="M225 142 q' + d * 0.5 + ' -8 ' + d + ' -14" stroke="' + C.ecto + '" stroke-width="4" fill="none"/>'; });
    s += '<path d="M370 180 Q370 110 410 80" stroke="' + C.ecto + '" stroke-width="16" fill="none" stroke-linecap="round"/>';
    [-30, -10, 10, 30].forEach(function (d) { s += '<path d="M410 80 q' + (d * 0.6 + 10) + ' -14 ' + (d + 20) + ' -26" stroke="' + C.ecto + '" stroke-width="4" fill="none"/>'; });
    s += '<path d="M364 178 Q362 120 396 86" stroke="#c0504d" stroke-width="3" fill="none"/>';
    s += '<text x="70" y="212" text-anchor="middle" class="ds">обычное</text><text x="225" y="212" text-anchor="middle" class="ds">сократились все</text><text x="225" y="228" text-anchor="middle" class="ds">волоконца</text><text x="380" y="212" text-anchor="middle" class="ds">сократились с</text><text x="380" y="228" text-anchor="middle" class="ds">одной стороны</text>';
    s += "</svg>";
    return s;
  }

  function tissue() {
    var s = '<svg viewBox="0 0 400 216" class="dia small" role="img" aria-label="Ткань: клетки и межклеточное вещество">';
    s += '<rect x="10" y="10" width="380" height="150" rx="14" fill="#f3ead2"/>';
    for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) s += '<ellipse cx="' + (45 + c * 62) + '" cy="' + (40 + r * 45) + '" rx="22" ry="16" fill="#8cc5a6" stroke="#2d6249" stroke-width="1.5"/><circle cx="' + (45 + c * 62) + '" cy="' + (40 + r * 45) + '" r="5" fill="#2d6249"/>';
    s += '<text x="200" y="184" text-anchor="middle" class="ds">Зелёные — похожие клетки,</text><text x="200" y="204" text-anchor="middle" class="ds">бежевое — межклеточное вещество</text>';
    return s + "</svg>";
  }

  function cover() {
    var s = '<svg viewBox="0 0 400 190" class="dia small" role="img" aria-label="Покровная ткань: клетки тесно прилегают">';
    for (var c = 0; c < 8; c++) s += '<rect x="' + (20 + c * 45) + '" y="80" width="45" height="60" fill="#8cc5a6" stroke="#2d6249" stroke-width="2"/><circle cx="' + (42 + c * 45) + '" cy="110" r="6" fill="#2d6249"/>';
    s += '<rect x="150" y="38" width="34" height="14" rx="7" fill="#b5533c"/><text x="194" y="50" class="ds">бактерия</text>';
    s += '<text x="200" y="174" text-anchor="middle" class="ds">Клетки стоят вплотную — проникнуть трудно</text>';
    return s + "</svg>";
  }

  function conn() {
    var s = '<svg viewBox="0 0 400 206" class="dia small" role="img" aria-label="Соединительная ткань: клетки далеко друг от друга">';
    s += '<rect x="10" y="10" width="380" height="140" rx="14" fill="#f3ead2"/>';
    for (var i = 0; i < 12; i++) s += '<path d="M' + (20 + i * 30) + ' 20 q20 60 -6 120" stroke="#c9b27a" stroke-width="2.5" fill="none"/>';
    [[70, 50], [190, 110], [300, 55], [120, 120], [340, 120]].forEach(function (p) { s += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="16" ry="11" fill="#8cc5a6" stroke="#2d6249" stroke-width="1.5"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#2d6249"/>'; });
    s += '<text x="200" y="174" text-anchor="middle" class="ds">Клетки далеко друг от друга, между ними —</text><text x="200" y="194" text-anchor="middle" class="ds">много межклеточного вещества</text>';
    return s + "</svg>";
  }

  function neuron() {
    var s = '<svg viewBox="0 0 420 190" class="dia small" role="img" aria-label="Нейрон и глиальные клетки">';
    s += '<circle cx="90" cy="90" r="22" fill="#e6b422" stroke="#8a6a10" stroke-width="2"/>';
    ["M72 78 L40 50", "M74 104 L38 130", "M86 68 L80 30", "M100 110 L104 148"].forEach(function (p) { s += '<path d="' + p + '" stroke="#b48a12" stroke-width="4" stroke-linecap="round"/>'; });
    s += '<path d="M112 90 L340 90" stroke="#b48a12" stroke-width="5" stroke-linecap="round"/><path d="M340 90 L366 70 M340 90 L370 92 M340 90 L364 112" stroke="#b48a12" stroke-width="3"/>';
    s += '<path d="M150 72 L250 72" stroke="#b5533c" stroke-width="2.5" marker-end="url(#ar3)"/><text x="200" y="62" text-anchor="middle" class="ds">нервный импульс</text>';
    [[160, 116], [230, 118], [300, 114]].forEach(function (p) { s += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="14" ry="9" fill="#cfd8e8" stroke="#56688a"/>'; });
    s += '<text x="90" y="178" text-anchor="middle" class="ds">нейрон</text><text x="230" y="150" text-anchor="middle" class="ds">глиальные клетки</text>';
    s += '<defs><marker id="ar3" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#b5533c"/></marker></defs>';
    return s + "</svg>";
  }

  window.DIAGRAMS = {
    hydra: function (o) { return hydra(o); },
    sac: function () { return hydra({ points: [1, 2, 5] }); },
    wall: function (o) { return wall(o); },
    symmetry: symmetry, layers: layers, net: net, forms: forms, budding: budding, regen: regen, move: move,
    tissue: tissue, cover: cover, conn: conn, neuron: neuron
  };
  window.HYDRA_POINTS = HP;
  window.WALL_POINTS = WALL;
})();

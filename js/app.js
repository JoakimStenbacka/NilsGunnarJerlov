(function () {
  "use strict";
  var O = window.Optics;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = { type: "II", depth: 10, zenith: 30, ag: 0.05, chl: 0.1, kp: 0.02, mixZ: 8, lambda: 480 };

  function sv(n, d) { return n.toFixed(d).replace(".", ","); }
  function deg(rad) { return sv(rad * 180 / Math.PI, 1) + "°"; }
  function pct(p) {
    if (p >= 10) return sv(p, 0) + " %";
    if (p >= 1) return sv(p, 1) + " %";
    if (p >= 0.01) return sv(p, 2) + " %";
    return "< 0,01 %";
  }

  /* ---------- typknappar och pelare ---------- */
  var oceanEl = document.getElementById("oceanTypes");
  var coastEl = document.getElementById("coastTypes");
  O.ORDER.forEach(function (t) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = t;
    b.id = "type-" + t;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { setType(t); });
    (O.TYPES[t].g === "ocean" ? oceanEl : coastEl).appendChild(b);
  });

  var depthEl = document.getElementById("depth");
  depthEl.addEventListener("input", function () { state.depth = +depthEl.value; renderDive(false); });
  var columnBox = document.getElementById("columnBox");
  var dragging = false;
  function pickDepth(e) {
    var r = columnBox.getBoundingClientRect();
    var y = (e.clientY - r.top) / r.height;
    state.depth = Math.round(Math.max(0, Math.min(1, y)) * 100);
    depthEl.value = state.depth;
    renderDive(false);
  }
  columnBox.addEventListener("pointerdown", function (e) { dragging = true; columnBox.setPointerCapture(e.pointerId); pickDepth(e); });
  columnBox.addEventListener("pointermove", function (e) { if (dragging) pickDepth(e); });
  columnBox.addEventListener("pointerup", function () { dragging = false; });

  var water = document.getElementById("water");
  var wctx = water.getContext("2d");
  var ticks = document.getElementById("ticks");
  [0, 25, 50, 75, 100].forEach(function (d) {
    var s = document.createElement("span");
    s.style.top = (d === 0 ? 2 : d === 100 ? 98 : d) + "%";
    s.textContent = d + " m";
    ticks.appendChild(s);
  });

  function drawWater() {
    var H = water.height, W = water.width;
    for (var y = 0; y < H; y += 2) {
      wctx.fillStyle = O.css(O.colorAt(state.type, y / H * 100).rgb);
      wctx.fillRect(0, y, W, 2);
    }
  }

  var strip = document.getElementById("strip");
  O.ORDER.forEach(function (t) {
    var b = document.createElement("button");
    b.type = "button";
    b.dataset.type = t;
    var c = document.createElement("canvas");
    c.width = 40; c.height = 92;
    b.appendChild(c);
    var lab = document.createElement("span");
    lab.textContent = t;
    b.appendChild(lab);
    b.addEventListener("click", function () { setType(t); });
    strip.appendChild(b);
    var ctx = c.getContext("2d");
    for (var y = 0; y < c.height; y++) {
      ctx.fillStyle = O.css(O.colorAt(t, y / c.height * 40).rgb);
      ctx.fillRect(0, y, c.width, 1);
    }
  });

  function chartFrame(svg, aria) {
    if (aria) svg.setAttribute("aria-label", aria);
    return { x0: 48, x1: 620, y0: 18, y1: 200 };
  }
  function drawSpectrum() {
    var svg = document.getElementById("spectrum");
    var f = chartFrame(svg);
    function X(w) { return f.x0 + (w - 400) / 300 * (f.x1 - f.x0); }
    function Y(p) { return f.y1 - Math.max(0, Math.min(1, p)) * (f.y1 - f.y0); }
    var s = '<defs><linearGradient id="vis" x1="0" x2="1">';
    for (var w = 400; w <= 700; w += 20) s += '<stop offset="' + ((w - 400) / 300) + '" stop-color="' + O.wlRGB(w) + '"/>';
    s += "</linearGradient></defs>";
    [0, 0.25, 0.5, 0.75, 1].forEach(function (p) {
      s += '<line x1="' + f.x0 + '" x2="' + f.x1 + '" y1="' + Y(p) + '" y2="' + Y(p) + '" stroke="#23465d"/>';
      s += '<text x="' + (f.x0 - 8) + '" y="' + (Y(p) + 4) + '" fill="#9bb3bf" font-family="IBM Plex Mono, monospace" font-size="11" text-anchor="end">' + Math.round(p * 100) + "%</text>";
    });
    [400, 500, 600, 700].forEach(function (w) {
      s += '<text x="' + X(w) + '" y="' + (f.y1 + 18) + '" fill="#9bb3bf" font-family="IBM Plex Mono, monospace" font-size="11" text-anchor="middle">' + w + "</text>";
    });
    s += '<text x="' + f.x1 + '" y="' + (f.y1 + 36) + '" fill="#9bb3bf" font-size="11" text-anchor="end">våglängd, nm</text>';
    var pts = O.GRID.map(function (w) { return X(w) + "," + Y(Math.exp(-O.kAt(state.type, w) * state.depth)); });
    s += '<polygon points="' + X(400) + "," + f.y1 + " " + pts.join(" ") + " " + X(700) + "," + f.y1 + '" fill="url(#vis)" opacity="0.88"/>';
    s += '<polyline points="' + pts.join(" ") + '" fill="none" stroke="#e7f1f4" stroke-width="1.6"/>';
    svg.innerHTML = s;
    document.getElementById("specCaption").textContent =
      "Andel av det förenklade solljuset som finns kvar på " + state.depth + " m i typ " + state.type +
      ". Rött dör först. Vilken färg som når längst beror på vattnet.";
  }

  function drawTable() {
    var rows = O.knots(state.type);
    var html = "<thead><tr><th>nm</th><th>K<sub>d</sub></th><th>kvar efter 1 m</th></tr></thead><tbody>";
    rows.forEach(function (r) {
      html += "<tr><td>" + r.nm + "</td><td>" + sv(r.kd, r.kd >= 2 ? 2 : 3) + "</td><td>" + sv(Math.exp(-r.kd) * 100, 1) + " %</td></tr>";
    });
    document.getElementById("kdTable").innerHTML = html + "</tbody>";
    document.getElementById("tableType").textContent = state.type;
  }

  function renderDive(redrawColumn) {
    document.querySelectorAll("#oceanTypes button, #coastTypes button, #strip button").forEach(function (b) {
      var on = (b.id === "type-" + state.type) || b.dataset.type === state.type;
      if (b.hasAttribute("aria-pressed") || b.id) b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.getElementById("typeDesc").textContent = "Typ " + state.type + ". " + O.TYPES[state.type].d;
    if (redrawColumn !== false) drawWater();
    var c = O.colorAt(state.type, state.depth);
    document.getElementById("depthVal").textContent = state.depth + " m";
    document.getElementById("marker").style.top = state.depth + "%";
    document.getElementById("markerLabel").textContent = state.depth + " m";
    document.getElementById("pctLeft").textContent = pct(c.Y * 100);
    document.getElementById("colorHere").innerHTML = '<span class="swatch" style="background:' + O.css(c.rgb) + '"></span>' + O.hueName(c.rgb);
    var best = O.bestBand(state.type);
    document.getElementById("euphotic").textContent = sv(best.z1, best.z1 >= 20 ? 0 : 1) + " m";
    document.getElementById("bestNm").innerHTML = '<span class="swatch" style="background:' + O.wlRGB(best.nm) + '"></span>' + best.nm + " nm · K<sub>d</sub> " + sv(best.kd, 3);
    var ps = O.PAULSON[state.type];
    document.getElementById("paulsonLine").textContent = ps
      ? "I Paulson och Simpsons tvåbandsmodell sjunker det synliga bandet till 37 % på ungefär " + sv(ps.a2, ps.a2 < 10 ? 1 : 0) + " m i den här typen. Det korta, röda bandet gör det redan på " + sv(ps.a1, 2) + " m."
      : "Paulson och Simpson satte bara upp två band för de öppna havstyperna I–III. Kusttyperna är för grumliga för den enkla delningen.";
    drawSpectrum();
    drawTable();
    renderMeasure(false);
    drawRay();
    drawWindow();
  }

  function setType(t) {
    state.type = t;
    depthEl.value = state.depth;
    renderDive(true);
  }

  /* ---------- brytning ---------- */
  var rayCanvas = document.getElementById("ray");
  var winCanvas = document.getElementById("window");
  function fit(canvas, aspect) {
    var width = canvas.parentElement.getBoundingClientRect().width;
    if (width < 40) width = 640;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = width, h = width / aspect;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  function drawRay() {
    var box = fit(rayCanvas, 880 / 420);
    var ctx = box.ctx, w = box.w, h = box.h;
    var zen = state.zenith * Math.PI / 180;
    var fr = O.fresnelUnpolarized(zen);
    var hy = h * 0.44;
    var ix = w * 0.58;
    var len = Math.min(w * 0.42, h * 0.7);
    var sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, "#10283a");
    sky.addColorStop(1, "#9ec3d4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, hy + 1);
    for (var y = Math.floor(hy); y < h; y += 2) {
      ctx.fillStyle = O.css(O.colorAt(state.type, (y - hy) / (h - hy) * 36).rgb);
      ctx.fillRect(0, y, w, 2);
    }
    ctx.strokeStyle = "rgba(231,241,244,0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(w, hy); ctx.stroke();
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "rgba(231,241,244,0.7)";
    ctx.beginPath(); ctx.moveTo(ix, hy - 78); ctx.lineTo(ix, hy + 100); ctx.stroke();
    ctx.restore();

    var sin = Math.sin(zen), cos = Math.cos(zen);
    var sin2 = Math.sin(fr.theta2), cos2 = Math.cos(fr.theta2);
    var x1 = ix - sin * len, y1 = hy - cos * len;
    ctx.lineCap = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f0c36a";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ix, hy); ctx.stroke();
    ctx.beginPath(); ctx.arc(x1, y1, 7, 0, Math.PI * 2); ctx.fillStyle = "#fff4d2"; ctx.fill();
    ctx.globalAlpha = 0.25 + 0.75 * fr.T;
    ctx.strokeStyle = "#f0c36a";
    ctx.beginPath(); ctx.moveTo(ix, hy); ctx.lineTo(ix + sin2 * len * 0.92, hy + cos2 * len * 0.92); ctx.stroke();
    ctx.globalAlpha = 0.2 + 0.8 * fr.R;
    ctx.beginPath(); ctx.moveTo(ix, hy); ctx.lineTo(ix + sin * len * 0.72, hy - cos * len * 0.72); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#e7f1f4";
    ctx.beginPath(); ctx.arc(ix, hy, 34, -Math.PI / 2, -Math.PI / 2 + zen, false); ctx.stroke();
    ctx.beginPath(); ctx.arc(ix, hy, 46, Math.PI / 2 - fr.theta2, Math.PI / 2, false); ctx.stroke();
    ctx.font = "600 14px IBM Plex Sans, sans-serif";
    ctx.fillStyle = "#07141d";
    ctx.fillText("luft", 14, 24);
    ctx.fillStyle = "#e7f1f4";
    ctx.fillText("hav · typ " + state.type, 14, hy + 24);
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.fillStyle = "#f0c36a";
    ctx.fillText("θ₁", ix - 18, hy - 40);
    ctx.fillText("θ₂", ix + 10, hy + 58);
  }
  function drawWindow() {
    var box = fit(winCanvas, 880 / 420);
    var ctx = box.ctx, w = box.w, h = box.h;
    var zen = state.zenith * Math.PI / 180;
    var fr = O.fresnelUnpolarized(zen);
    var crit = O.criticalAngle();
    var deep = O.colorAt(state.type, 40).rgb;
    ctx.fillStyle = O.css([deep[0] * 0.28, deep[1] * 0.28, deep[2] * 0.28]);
    ctx.fillRect(0, 0, w, h);
    var cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.36;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    var g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
    g.addColorStop(0, "#e7f4fb");
    g.addColorStop(0.45, "#8ebbd0");
    g.addColorStop(1, "#3c7594");
    ctx.fillStyle = g;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    [[-0.25, -0.42, 0.18, 0.07], [0.22, -0.12, 0.2, 0.06], [-0.05, 0.18, 0.14, 0.05]].forEach(function (c) {
      ctx.beginPath();
      ctx.ellipse(cx + c[0] * R, cy + c[1] * R, c[2] * R, c[3] * R, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    var rr = (fr.theta2 / crit) * (R * 0.82);
    var sx = cx - rr, sy = cy;
    ctx.fillStyle = "#fff6dc";
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(8, R * 0.045), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(240,195,106,0.9)";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(14, R * 0.09), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = "#f0c36a";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#e7f1f4";
    ctx.font = "600 14px IBM Plex Sans, sans-serif";
    ctx.fillText("upp mot ytan", 16, 26);
    ctx.font = "12px IBM Plex Sans, sans-serif";
    ctx.fillStyle = "#9bb3bf";
    ctx.fillText("utanför cirkeln speglas vattnet under dig", 16, h - 16);
  }
  function renderRefract() {
    var zen = state.zenith * Math.PI / 180;
    var fr = O.fresnelUnpolarized(zen);
    document.getElementById("zenithVal").textContent = state.zenith + "°";
    document.getElementById("angIn").textContent = state.zenith + "°";
    document.getElementById("angOut").textContent = deg(fr.theta2);
    document.getElementById("refl").textContent = sv(fr.R * 100, 1) + " %";
    document.getElementById("crit").textContent = deg(O.criticalAngle()) + " från lodlinjen";
    document.getElementById("rayCaption").textContent =
      "Brytningsindex 1,34. " + sv(fr.R * 100, 1) + " procent speglas, " + sv((1 - fr.R) * 100, 1) +
      " procent bryts ner. Under ytan syns solen " + deg(fr.theta2) + " från fönstrets mitt.";
    drawRay();
    drawWindow();
  }
  document.getElementById("zenith").addEventListener("input", function (e) {
    state.zenith = +e.target.value;
    renderRefract();
  });

  /* ---------- blandning ---------- */
  function renderMix() {
    document.getElementById("cdomVal").textContent = sv(state.ag, 2) + " m⁻¹";
    document.getElementById("chlVal").textContent = sv(state.chl, 2) + " mg/m³";
    document.getElementById("partVal").textContent = sv(state.kp, 2) + " m⁻¹";
    document.getElementById("mixDepthVal").textContent = state.mixZ + " m";
    var near = O.nearestType(state.ag, state.chl, state.kp);
    var label = near.clearerThanI ? "klarare än typ I" : "typ " + near.type;
    if (!near.clearerThanI && near.rms > 0.45) label += ", med avvikelse";
    document.getElementById("nearType").textContent = label;
    var col = O.colorModel(state.ag, state.chl, state.kp, state.mixZ);
    document.getElementById("mixColor").innerHTML = '<span class="swatch" style="background:' + O.css(col.rgb) + '"></span>' + O.hueName(col.rgb);
    var svg = document.getElementById("mixSpec");
    var f = chartFrame(svg);
    function X(w) { return f.x0 + (w - 400) / 300 * (f.x1 - f.x0); }
    function Y(p) { return f.y1 - Math.max(0, Math.min(1, p)) * (f.y1 - f.y0); }
    var s = "";
    [0, 0.5, 1].forEach(function (p) {
      s += '<line x1="' + f.x0 + '" x2="' + f.x1 + '" y1="' + Y(p) + '" y2="' + Y(p) + '" stroke="#23465d"/>';
      s += '<text x="' + (f.x0 - 8) + '" y="' + (Y(p) + 4) + '" fill="#9bb3bf" font-family="IBM Plex Mono, monospace" font-size="11" text-anchor="end">' + Math.round(p * 100) + "%</text>";
    });
    [400, 500, 600, 700].forEach(function (w) {
      s += '<text x="' + X(w) + '" y="' + (f.y1 + 18) + '" fill="#9bb3bf" font-family="IBM Plex Mono, monospace" font-size="11" text-anchor="middle">' + w + "</text>";
    });
    var modelPts = O.GRID.map(function (w) { return X(w) + "," + Y(Math.exp(-O.modelK(state.ag, state.chl, state.kp, w) * state.mixZ)); });
    var typePts = O.GRID.map(function (w) { return X(w) + "," + Y(Math.exp(-O.kAt(near.type, w) * state.mixZ)); });
    s += '<polyline points="' + typePts.join(" ") + '" fill="none" stroke="#f0c36a" stroke-width="1.4" stroke-dasharray="5 4"/>';
    s += '<polyline points="' + modelPts.join(" ") + '" fill="none" stroke="#e7f1f4" stroke-width="1.8"/>';
    svg.innerHTML = s;
    var tail = near.clearerThanI
      ? "Heldragen kurva är modellen, streckad är typ I. Modellen ligger under tabellen i det blå: rent vatten är klarare än det klaraste hav Jerlov namngav."
      : "Heldragen kurva är modellen på " + state.mixZ + " m. Streckad är typ " + near.type + " på samma djup.";
    document.getElementById("mixCaption").textContent = tail;
  }
  [["cdom", "ag"], ["chl", "chl"], ["part", "kp"], ["mixDepth", "mixZ"]].forEach(function (pair) {
    document.getElementById(pair[0]).addEventListener("input", function (e) {
      state[pair[1]] = +e.target.value;
      renderMix();
    });
  });

  /* ---------- mätning ---------- */
  var sea = document.getElementById("sea");
  var sctx = sea.getContext("2d");
  var logplot = document.getElementById("logplot");
  var step = 8, timer = null;
  function axisMax() {
    var k = O.kAt(state.type, state.lambda);
    var z = Math.log(1000) / Math.max(k, 0.02);
    return Math.max(10, Math.min(40, Math.ceil(z / 5) * 5));
  }
  function samples() {
    var m = axisMax(), out = [];
    for (var i = 0; i <= 8; i++) out.push(m * i / 8);
    return out;
  }
  function drawSea(probeZ) {
    var H = sea.height, W = sea.width, m = axisMax();
    for (var y = 28; y < H; y += 2) {
      sctx.fillStyle = O.css(O.colorAt(state.type, (y - 28) / (H - 28) * m).rgb);
      sctx.fillRect(0, y, W, 2);
    }
    sctx.fillStyle = "#8fb4c9";
    sctx.fillRect(0, 0, W, 28);
    sctx.fillStyle = "#d5dde2";
    sctx.fillRect(18, 16, 78, 14);
    sctx.fillRect(28, 8, 46, 10);
    if (probeZ != null) {
      var py = 28 + probeZ / m * (H - 28);
      sctx.strokeStyle = "#f0c36a";
      sctx.lineWidth = 1.5;
      sctx.beginPath(); sctx.moveTo(62, 30); sctx.lineTo(62, py); sctx.stroke();
      sctx.fillStyle = "#f0c36a";
      sctx.fillRect(52, py - 2, 20, 12);
    }
  }
  function drawPlot(n) {
    var k = O.kAt(state.type, state.lambda);
    var m = axisMax();
    var MZ = samples();
    var x0 = 58, x1 = 440, y0 = 16, y1 = 250;
    function X(z) { return x0 + z / m * (x1 - x0); }
    function Y(v) {
      var l = Math.log10(Math.max(v, 1e-3));
      return y0 + (-l / 3) * (y1 - y0);
    }
    var s = "";
    [1, 0.1, 0.01, 0.001].forEach(function (v) {
      s += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#23465d"/>';
      s += '<text x="' + (x0 - 6) + '" y="' + (Y(v) + 4) + '" fill="#9bb3bf" font-family="IBM Plex Mono, monospace" font-size="11" text-anchor="end">' + Math.round(v * 100) + "%</text>";
    });
    for (var z = 0; z <= m; z += m / 4) {
      s += '<text x="' + X(z) + '" y="' + (y1 + 18) + '" fill="#9bb3bf" font-family="IBM Plex Mono, monospace" font-size="11" text-anchor="middle">' + Math.round(z) + "</text>";
    }
    s += '<line x1="' + X(0) + '" y1="' + Y(1) + '" x2="' + X(m) + '" y2="' + Y(Math.exp(-k * m)) + '" stroke="#e7f1f4" stroke-dasharray="4 4"/>';
    s += '<text x="' + x1 + '" y="28" fill="#f0c36a" font-family="IBM Plex Mono, monospace" font-size="13" text-anchor="end">K_d = ' + sv(k, 3) + " m⁻¹</text>";
    var limit = n == null ? MZ.length - 1 : n;
    for (var i = 0; i <= limit && i < MZ.length; i++) {
      var zz = MZ[i];
      var v = Math.exp(-k * zz) * (1 + Math.sin(zz * 1.7 + k * 40) * 0.05);
      s += '<circle cx="' + X(zz) + '" cy="' + Y(v) + '" r="4.5" fill="#f0c36a"/>';
    }
    logplot.innerHTML = s;
    document.getElementById("measCaption").textContent =
      "Typ " + state.type + " vid " + state.lambda + " nm. Den streckade linjen är e^(−K_d z). Punkterna är samma kurva med en liten spridning.";
  }
  function renderMeasure(restart) {
    if (timer) { clearInterval(timer); timer = null; }
    if (restart) step = -1;
    var MZ = samples();
    if (step < 0) { drawSea(null); drawPlot(-1); return; }
    drawSea(MZ[Math.min(step, MZ.length - 1)]);
    drawPlot(step);
  }
  var lambdas = [450, 500, 550, 600, 650];
  var lbox = document.getElementById("lambdaBtns");
  lambdas.forEach(function (nm) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = nm + " nm";
    b.setAttribute("aria-pressed", nm === state.lambda ? "true" : "false");
    b.addEventListener("click", function () {
      state.lambda = nm;
      lbox.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      renderMeasure(false);
    });
    lbox.appendChild(b);
  });
  document.getElementById("lower").addEventListener("click", function () {
    if (timer) clearInterval(timer);
    var MZ = samples();
    if (reduce) { step = MZ.length - 1; drawSea(MZ[step]); drawPlot(step); return; }
    step = -1;
    drawPlot(-1);
    timer = setInterval(function () {
      step++;
      drawSea(MZ[step]);
      drawPlot(step);
      if (step >= MZ.length - 1) { clearInterval(timer); timer = null; }
    }, 480);
  });

  /* ---------- karta ---------- */
  var NS = "http://www.w3.org/2000/svg";
  var M = window.MAPDATA;
  var SITES = {};
  M.sites.forEach(function (s) { SITES[s.id] = s; });
  var selected = "galapagos";
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  function addSite(svg, s, x, y, r, labelLeft) {
    var g = el("g", { "class": "site", "data-id": s.id, tabindex: "0", role: "button", "aria-label": s.name + ", typ " + s.range }, svg);
    el("circle", { cx: x, cy: y, r: r, fill: O.css(O.colorAt(s.type, 10).rgb) }, g);
    var t = el("text", { x: labelLeft ? x - r - 4 : x + r + 4, y: y + 4, "text-anchor": labelLeft ? "end" : "start" }, g);
    t.textContent = s.range;
    function go() { selectSite(s.id); }
    g.addEventListener("click", go);
    g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  }
  var world = document.getElementById("world");
  world.setAttribute("viewBox", "0 0 " + M.W + " " + M.H);
  el("path", { d: M.sphere, "class": "sea" }, world);
  el("path", { d: M.grat, "class": "grat" }, world);
  el("path", { d: M.land, "class": "land" }, world);
  el("path", { d: M.insetBox, fill: "none", stroke: "#9bb3bf", "stroke-width": "1", "stroke-dasharray": "2 2" }, world);
  el("path", { d: M.route, "class": "routeline" }, world);
  M.ports.forEach(function (p) {
    el("circle", { cx: p.x, cy: p.y, r: 2.2, fill: "#f0c36a" }, world);
    el("text", { x: p.x + 4, y: p.y - 4, "class": "port" }, world).textContent = p.n;
  });
  M.sites.forEach(function (s) {
    if (["nordsjon", "vastkusten", "ostersjon", "gota"].indexOf(s.id) < 0) addSite(world, s, s.x, s.y, 7, s.id === "medel");
  });
  var nordic = document.getElementById("nordic"), I = M.inset;
  nordic.setAttribute("viewBox", "0 0 " + I.IW + " " + I.IH);
  el("rect", { x: 0, y: 0, width: I.IW, height: I.IH, "class": "sea" }, nordic);
  el("path", { d: I.grat, "class": "grat" }, nordic);
  el("path", { d: I.land, "class": "land" }, nordic);
  if (I.route) el("path", { d: I.route, "class": "routeline" }, nordic);
  if (I.routeBack) el("path", { d: I.routeBack, "class": "routeline" }, nordic);
  I.labels.forEach(function (p) {
    el("circle", { cx: p.x, cy: p.y, r: 2, fill: "#9bb3bf" }, nordic);
    el("text", { x: p.x + 4, y: p.y - 4, "class": "port" }, nordic).textContent = p.n;
  });
  I.sites.forEach(function (p) { addSite(nordic, SITES[p.id], p.x, p.y, 8, p.id === "vastkusten"); });
  function selectSite(id) {
    selected = id;
    var s = SITES[id];
    document.querySelectorAll(".site").forEach(function (g) { g.classList.toggle("sel", g.getAttribute("data-id") === id); });
    document.getElementById("siteType").textContent = "Typ " + s.range;
    document.getElementById("siteName").textContent = s.name;
    document.getElementById("siteNote").textContent = s.note;
    document.getElementById("diveHere").textContent = "Dyk i typ " + s.type;
  }
  document.getElementById("diveHere").addEventListener("click", function () {
    setType(String(SITES[selected].type));
    var target = document.getElementById("typer");
    if (target && target.scrollIntoView) target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
  selectSite(selected);

  /* ---------- undervattensscener ---------- */
  function scene(canvasId, labelId, opt) {
    var cv = document.getElementById(canvasId);
    var c = cv.getContext("2d"), W = cv.width, H = cv.height;
    var seed = opt.seed || 1;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var t = opt.type, kR = O.kAt(t, 600), kG = O.kAt(t, 530), kB = O.kAt(t, 465);
    var F = 4.5, cR = F * kR, cG = F * kG, cB = F * kB;
    function E(z) { return [Math.exp(-kR * z), Math.exp(-kG * z), Math.exp(-kB * z)]; }
    var zc = opt.depth, Ec = E(zc), norm = Math.max(Ec[0], Ec[1], Ec[2]);
    var vis = 4.8 / Math.min(cR, cG, cB);
    document.getElementById(labelId).textContent = "sikt omkring " + (vis >= 10 ? String(Math.round(vis / 5) * 5) : sv(vis, 1)) + " m";
    var Wc = [Ec[0] * 0.30 / norm, Ec[1] * 0.42 / norm, Ec[2] * 0.55 / norm];
    function gv(v) { return Math.round(O.gam(Math.min(1, v)) * 255); }
    function shade(alb, d, z, bright) {
      var Ez = E(Math.max(0, z)), b = bright || 1, T = [Math.exp(-cR * d), Math.exp(-cG * d), Math.exp(-cB * d)];
      var o = [alb[0] * Ez[0] * 0.9 * b / norm, alb[1] * Ez[1] * 0.9 * b / norm, alb[2] * Ez[2] * 0.9 * b / norm];
      var K = 2.4;
      function mix(i) { var v = o[i] * T[i] + Wc[i] * (1 - T[i]); return gv(Math.max(0, Wc[i] + (v - Wc[i]) * K)); }
      return "rgb(" + mix(0) + "," + mix(1) + "," + mix(2) + ")";
    }
    var yh = H * opt.horizon;
    for (var y = 0; y < H; y += 2) {
      var f = 1.9 - 1.4 * (y / H);
      c.fillStyle = "rgb(" + gv(Wc[0] * f) + "," + gv(Wc[1] * f) + "," + gv(Wc[2] * f) + ")";
      c.fillRect(0, y, W, 2);
    }
    if (opt.rays) {
      c.save();
      c.globalCompositeOperation = "lighter";
      for (var i = 0; i < 7; i++) {
        var x0 = W * (0.1 + rnd() * 0.8);
        var gr = c.createLinearGradient(0, 0, 0, H * 0.8);
        gr.addColorStop(0, "rgba(180,220,255," + (0.10 * opt.rays) + ")");
        gr.addColorStop(1, "rgba(180,220,255,0)");
        c.fillStyle = gr;
        c.beginPath(); c.moveTo(x0 - 8, 0); c.lineTo(x0 + 8, 0); c.lineTo(x0 + 60 + rnd() * 40, H * 0.8); c.lineTo(x0 + 20, H * 0.8); c.closePath(); c.fill();
      }
      c.restore();
    }
    var FOC = 480, hc = opt.camHeight || 1.6;
    function proj(d) { return { y: yh + hc * FOC / d, s: FOC / d }; }
    var items = [];
    if (opt.bottom) {
      for (var yy = Math.ceil(yh) + 1; yy < H; yy += 2) {
        var d = hc * FOC / (yy - yh);
        if (d > 200) continue;
        var tex = 0.75 + 0.25 * Math.sin(yy * 0.9) * Math.sin(yy * 0.13);
        c.fillStyle = shade(opt.bottom.map(function (v) { return v * tex; }), d, zc + hc, 1);
        c.fillRect(0, yy, W, 2);
      }
    }
    (opt.objects || []).forEach(function (o) {
      for (var n = 0; n < o.n; n++) items.push({ kind: o.kind, d: o.dmin + rnd() * (o.dmax - o.dmin), x: rnd(), alb: o.alb, h: o.h, u: rnd(), v: rnd() });
    });
    items.sort(function (a, b) { return b.d - a.d; });
    items.forEach(function (it) {
      var p = proj(it.d), x = it.x * W * 1.3 - W * 0.15, s = p.s, col;
      var zObj = zc + hc - (it.h || 0) * 0.5;
      if (it.kind === "rock") {
        c.fillStyle = shade(it.alb, it.d, zc + hc, 1);
        c.beginPath();
        var rw = (0.1 + it.u * 0.3) * s, rh = rw * (0.5 + it.v * 0.4);
        c.ellipse(x, p.y - rh * 0.35, rw, rh, 0, Math.PI, 0); c.fill();
      } else if (it.kind === "mussel") {
        c.fillStyle = shade(it.alb, it.d, zc + hc, 1);
        for (var m = 0; m < 9; m++) { c.beginPath(); c.ellipse(x + (m % 3 - 1) * 0.09 * s, p.y - 0.05 * s - Math.floor(m / 3) * 0.05 * s, 0.05 * s, 0.025 * s, 0.6, 0, 7); c.fill(); }
      } else if (it.kind === "kelp") {
        col = shade(it.alb, it.d, zObj, 1); c.strokeStyle = col; c.fillStyle = col;
        var hgt = it.h * s;
        c.lineWidth = Math.max(1, 0.03 * s);
        c.beginPath(); c.moveTo(x, p.y); c.quadraticCurveTo(x + 0.2 * s, p.y - hgt * 0.5, x + (it.u - 0.3) * 0.6 * s, p.y - hgt * 0.35); c.stroke();
        c.beginPath();
        var bx = x + (it.u - 0.3) * 0.6 * s, by = p.y - hgt * 0.35;
        c.moveTo(bx, by);
        c.bezierCurveTo(bx + 0.35 * s, by - hgt * 0.3, bx - 0.25 * s, by - hgt * 0.6, bx + 0.3 * s * (it.v - 0.5), p.y - hgt);
        c.bezierCurveTo(bx - 0.05 * s, by - hgt * 0.55, bx + 0.15 * s, by - hgt * 0.3, bx, by);
        c.fill();
      } else if (it.kind === "wrack") {
        col = shade(it.alb, it.d, zObj, 1); c.strokeStyle = col; c.lineCap = "round";
        var hg = it.h * s;
        for (var b = 0; b < 7; b++) {
          c.lineWidth = Math.max(1, 0.045 * s);
          c.beginPath(); c.moveTo(x, p.y);
          var a = -Math.PI / 2 + (b - 3) * 0.22 + (it.u - 0.5) * 0.3;
          c.quadraticCurveTo(x + Math.cos(a) * hg * 0.5 + (it.v - 0.5) * 0.2 * s, p.y + Math.sin(a) * hg * 0.5, x + Math.cos(a) * hg, p.y + Math.sin(a) * hg);
          c.stroke();
        }
      } else if (it.kind === "fish" || it.kind === "cod" || it.kind === "wrasse" || it.kind === "herring") {
        var len = (it.kind === "cod" ? 0.7 : it.kind === "wrasse" ? 0.35 : it.kind === "herring" ? 0.22 : 0.4) * s;
        var fy = p.y - (it.h || 0.8) * s, dir = it.u > 0.5 ? 1 : -1;
        col = shade(it.alb, it.d, zc + hc - (it.h || 0.8), it.kind === "wrasse" ? 1.1 : 1);
        c.fillStyle = col;
        c.beginPath(); c.ellipse(x, fy, len * 0.5, len * (it.kind === "cod" ? 0.17 : 0.16), 0, 0, 7); c.fill();
        c.beginPath(); c.moveTo(x - dir * len * 0.45, fy); c.lineTo(x - dir * len * 0.72, fy - len * 0.16); c.lineTo(x - dir * len * 0.72, fy + len * 0.16); c.closePath(); c.fill();
        if (it.kind === "cod") {
          c.beginPath(); c.moveTo(x - dir * 0.05 * len, fy - len * 0.14); c.lineTo(x + dir * 0.1 * len, fy - len * 0.27); c.lineTo(x + dir * 0.2 * len, fy - len * 0.14); c.fill();
        }
      } else if (it.kind === "school") {
        var count = 24 + Math.floor(it.u * 20);
        col = shade(it.alb, it.d, zc - 1, 1); c.fillStyle = col;
        var cx = x, cy = yh + (it.v - 0.5) * H * 0.25;
        for (var q = 0; q < count; q++) {
          var fx = cx + (rnd() - 0.5) * 7 * s, fyy = cy + (rnd() - 0.5) * 2.5 * s, L = 0.6 * s;
          c.beginPath(); c.ellipse(fx, fyy, L * 0.5, L * 0.15, 0, 0, 7); c.fill();
          c.beginPath(); c.moveTo(fx - L * 0.45, fyy); c.lineTo(fx - L * 0.7, fyy - L * 0.14); c.lineTo(fx - L * 0.7, fyy + L * 0.14); c.fill();
        }
      } else if (it.kind === "sargassum") {
        col = shade(it.alb, it.d, 1, 1.2); c.fillStyle = col;
        var sx = x, sy = H * 0.06 + it.v * H * 0.08, R = 1.2 * s;
        for (var u = 0; u < 40; u++) {
          var ang = rnd() * 6.28, rr = rnd() * R;
          c.beginPath(); c.ellipse(sx + Math.cos(ang) * rr, sy + Math.sin(ang) * rr * 0.35, 0.08 * s, 0.03 * s, ang, 0, 7); c.fill();
        }
        c.fillStyle = shade([0.55, 0.5, 0.4], it.d + 1, zc - 2, 1);
        for (var u2 = 0; u2 < 6; u2++) {
          c.beginPath(); c.ellipse(sx + (rnd() - 0.5) * R, sy + 0.4 * s + rnd() * 0.5 * s, 0.07 * s, 0.025 * s, 0, 0, 7); c.fill();
        }
      }
    });
    var np = opt.particles || 40;
    c.fillStyle = "rgba(255,255,240,0.35)";
    for (var pz = 0; pz < np; pz++) { c.beginPath(); c.arc(rnd() * W, rnd() * H, 0.6 + rnd() * 1.6, 0, 7); c.fill(); }
  }
  scene("sc1", "v1", { type: "I", depth: 10, horizon: 0.62, rays: 1, particles: 25, seed: 7, camHeight: 30,
    objects: [{ kind: "school", n: 2, dmin: 18, dmax: 40, alb: [0.55, 0.6, 0.65] }, { kind: "sargassum", n: 3, dmin: 4, dmax: 14, alb: [0.75, 0.55, 0.2] }, { kind: "fish", n: 5, dmin: 2, dmax: 6, alb: [0.45, 0.55, 0.6], h: 30 }] });
  scene("sc2", "v2", { type: "3", depth: 6, horizon: 0.36, rays: 0.35, particles: 110, seed: 11, camHeight: 1.0, bottom: [0.55, 0.5, 0.4],
    objects: [{ kind: "rock", n: 16, dmin: 1.3, dmax: 12, alb: [0.14, 0.14, 0.13] }, { kind: "wrack", n: 12, dmin: 1.3, dmax: 9, alb: [0.16, 0.12, 0.04], h: 0.6 }, { kind: "kelp", n: 9, dmin: 1.6, dmax: 10, alb: [0.28, 0.2, 0.07], h: 1.5 }, { kind: "wrasse", n: 3, dmin: 1.5, dmax: 4, alb: [0.7, 0.35, 0.15], h: 0.6 }, { kind: "cod", n: 1, dmin: 2.2, dmax: 2.6, alb: [0.38, 0.32, 0.2], h: 0.45 }] });
  scene("sc3", "v3", { type: "7", depth: 4, horizon: 0.36, rays: 0, particles: 260, seed: 23, camHeight: 0.7, bottom: [0.5, 0.46, 0.36],
    objects: [{ kind: "rock", n: 14, dmin: 0.9, dmax: 6, alb: [0.15, 0.15, 0.14] }, { kind: "mussel", n: 14, dmin: 0.9, dmax: 3, alb: [0.03, 0.03, 0.05] }, { kind: "wrack", n: 12, dmin: 0.9, dmax: 5, alb: [0.15, 0.12, 0.04], h: 0.45 }, { kind: "herring", n: 16, dmin: 1.2, dmax: 3.5, alb: [0.95, 0.95, 0.98], h: 0.5 }] });

  /* ---------- Forel-Ule ---------- */
  var FU = [[33, 88, 188], [49, 109, 197], [50, 124, 187], [75, 128, 160], [86, 143, 150], [109, 146, 152], [105, 140, 134], [117, 158, 114], [123, 166, 84], [125, 174, 56], [149, 182, 69], [148, 182, 96], [165, 188, 118], [170, 184, 109], [173, 181, 95], [168, 169, 101], [174, 159, 92], [179, 160, 83], [175, 138, 68], [164, 105, 5], [161, 77, 4]];
  var fu = document.getElementById("fu");
  FU.forEach(function (rgb, i) {
    var d = document.createElement("div");
    d.style.background = "rgb(" + rgb.join(",") + ")";
    d.title = "Forel-Ule " + (i + 1);
    fu.appendChild(d);
  });

  /* ---------- navigation ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a:not(.brand)"));
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.setAttribute("aria-current", a.getAttribute("href") === "#" + en.target.id ? "true" : "false");
        });
      });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 });
    links.forEach(function (a) {
      var node = document.querySelector(a.getAttribute("href"));
      if (node) obs.observe(node);
    });
  }
  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { drawRay(); drawWindow(); }, 120);
  });

  renderDive(true);
  renderRefract();
  renderMix();
  step = samples().length - 1;
  renderMeasure(false);
})();

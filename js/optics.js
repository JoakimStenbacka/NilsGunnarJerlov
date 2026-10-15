/* Optik för Nisses hav.
   Kd-knutpunkterna är de tryckta värdena i Jerlov, Marine Optics (1976), tabell XXVII
   (medelvärde 0–10 m). Mellan knutpunkterna interpoleras Kd rätlinjigt i våglängd.
   Kusttyperna heter 1C–9C i tabellen och 1–9 i gränssnittet. */
(function (root) {
  "use strict";

  var KNOTS = [400, 425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700];
  /* UV-knutpunkter finns för de flesta typer, men inte för 7 och 9. */
  var UV = {
    "I":  { 310: 0.15, 350: 0.062, 375: 0.038 },
    "IA": { 310: 0.18, 350: 0.078, 375: 0.052 },
    "IB": { 310: 0.22, 350: 0.1, 375: 0.066 },
    "II": { 310: 0.37, 350: 0.175, 375: 0.122 },
    "III":{ 310: 0.65, 350: 0.32, 375: 0.22 },
    "1":  { 310: 1.8, 350: 1.2, 375: 0.8 },
    "3":  { 310: 2.4, 350: 1.7, 375: 1.1 },
    "5":  { 310: 3.5, 350: 2.3, 375: 1.6 },
    "7":  { 350: 3, 375: 2.1 },
    "9":  { 350: 3.9, 375: 3 }
  };
  /* Synligt Kd, samma ordning som KNOTS. */
  var KD = {
    "I":  [0.028, 0.022, 0.019, 0.018, 0.027, 0.043, 0.063, 0.089, 0.235, 0.305, 0.36, 0.42, 0.56],
    "IA": [0.038, 0.031, 0.026, 0.025, 0.032, 0.048, 0.067, 0.094, 0.24, 0.31, 0.37, 0.43, 0.57],
    "IB": [0.051, 0.042, 0.036, 0.033, 0.042, 0.054, 0.072, 0.099, 0.245, 0.315, 0.375, 0.435, 0.58],
    "II": [0.096, 0.081, 0.068, 0.062, 0.07, 0.076, 0.089, 0.115, 0.26, 0.335, 0.4, 0.465, 0.61],
    "III":[0.185, 0.16, 0.135, 0.116, 0.115, 0.116, 0.12, 0.148, 0.295, 0.375, 0.445, 0.52, 0.66],
    "1":  [0.51, 0.36, 0.25, 0.17, 0.14, 0.13, 0.12, 0.15, 0.3, 0.37, 0.45, 0.51, 0.65],
    "3":  [0.78, 0.54, 0.39, 0.29, 0.22, 0.2, 0.19, 0.21, 0.33, 0.4, 0.46, 0.56, 0.71],
    "5":  [1.1, 0.78, 0.56, 0.43, 0.36, 0.31, 0.3, 0.33, 0.4, 0.48, 0.54, 0.65, 0.8],
    "7":  [1.6, 1.2, 0.89, 0.71, 0.58, 0.49, 0.46, 0.46, 0.48, 0.54, 0.63, 0.78, 0.92],
    "9":  [2.4, 1.9, 1.6, 1.23, 0.99, 0.78, 0.63, 0.58, 0.6, 0.65, 0.76, 0.92, 1.1]
  };

  var TYPES = {
    "I":  { g: "ocean", d: "Det klaraste öppna havet, som Sargassohavet och mitten av de stora virvlarna. Nästan bara vattnets egen absorption, och en aning partiklar." },
    "IA": { g: "ocean", d: "Mycket klart öppet hav. En mellantyp mellan I och IB, införd när skalan förfinades." },
    "IB": { g: "ocean", d: "Klart öppet hav med lite mer plankton. Morel kopplade senare typen, ungefär, till 0,1 mg klorofyll per kubikmeter." },
    "II": { g: "ocean", d: "Öppet hav med måttligt plankton. Vanligt i tempererade hav, och den typ många modeller använder som utgångsläge." },
    "III":{ g: "ocean", d: "Det grumligaste öppna havet. Typiskt där uppvällning för upp näring och plankton blommar." },
    "1":  { g: "coast", d: "Klart kustvatten. Löst gult ämne från land börjar ta upp det blå ljuset." },
    "3":  { g: "coast", d: "Typiskt kustvatten. Grönt ljus når nu längre än blått." },
    "5":  { g: "coast", d: "Grumligt kustvatten, i samma familj som delar av Östersjön och västkustens skärgård." },
    "7":  { g: "coast", d: "Mycket gult ämne. Blått ljus är nästan borta efter några meter, och vattnet ser gulgrönt ut." },
    "9":  { g: "coast", d: "Skalans grumligaste vatten, som nära en älvmynning. Efter ett par meter är det dunkelt." }
  };

  var ORDER = ["I", "IA", "IB", "II", "III", "1", "3", "5", "7", "9"];
  var ALIAS = { "1C": "1", "3C": "3", "5C": "5", "7C": "7", "9C": "9" };

  /* Paulson & Simpson 1977: två band för kortvågig strålning i havsmodeller.
     R är andelen i det korta bandet, a1 och a2 är e-foldingdjup i meter. */
  var PAULSON = {
    "I":  { R: 0.58, a1: 0.35, a2: 23 },
    "IA": { R: 0.62, a1: 0.6, a2: 20 },
    "IB": { R: 0.67, a1: 1.0, a2: 17 },
    "II": { R: 0.77, a1: 1.5, a2: 14 },
    "III":{ R: 0.78, a1: 1.4, a2: 7.9 }
  };

  /* Absorption i rent vatten, m⁻¹, var 10:e nm. Buiteveld m.fl. 1994,
     så som Williamson & Hollins 2022 tabellerar den. */
  var AW_WL = [];
  var AW = [0.0058,0.0067,0.0079,0.0092,0.0104,0.0114,0.0124,0.0135,0.0152,0.0181,0.0238,0.0329,0.0409,0.0429,0.0495,0.0588,0.0672,0.0759,0.0952,0.1356,0.2224,0.2691,0.2810,0.2955,0.3111,0.3315,0.3791,0.4122,0.4318,0.4760,0.5722];
  for (var awi = 400; awi <= 700; awi += 10) AW_WL.push(awi);

  var N_AIR = 1;
  var N_WATER = 1.34;

  function canon(t) { return ALIAS[t] || t; }

  function kAt(type, nm) {
    type = canon(type);
    var vis = KD[type];
    if (!vis) return NaN;
    if (nm < KNOTS[0]) {
      var uv = UV[type];
      var keys = Object.keys(uv).map(Number).sort(function (a, b) { return a - b; });
      if (nm <= keys[0]) return uv[keys[0]];
      for (var i = 0; i < keys.length - 1; i++) {
        if (nm <= keys[i + 1]) {
          var f = (nm - keys[i]) / (keys[i + 1] - keys[i]);
          return uv[keys[i]] + (uv[keys[i + 1]] - uv[keys[i]]) * f;
        }
      }
      var f2 = (nm - keys[keys.length - 1]) / (KNOTS[0] - keys[keys.length - 1]);
      return uv[keys[keys.length - 1]] + (vis[0] - uv[keys[keys.length - 1]]) * f2;
    }
    if (nm >= KNOTS[KNOTS.length - 1]) return vis[vis.length - 1];
    for (var j = 0; j < KNOTS.length - 1; j++) {
      if (nm <= KNOTS[j + 1]) {
        var f3 = (nm - KNOTS[j]) / (KNOTS[j + 1] - KNOTS[j]);
        return vis[j] + (vis[j + 1] - vis[j]) * f3;
      }
    }
    return vis[vis.length - 1];
  }

  function knots(type) {
    type = canon(type);
    var rows = [];
    var uv = UV[type];
    Object.keys(uv).map(Number).sort(function (a, b) { return a - b; }).forEach(function (nm) {
      rows.push({ nm: nm, kd: uv[nm] });
    });
    KNOTS.forEach(function (nm, i) { rows.push({ nm: nm, kd: KD[type][i] }); });
    return rows;
  }

  function awAt(nm) {
    if (nm <= AW_WL[0]) return AW[0];
    if (nm >= AW_WL[AW_WL.length - 1]) return AW[AW.length - 1];
    var i = Math.floor((nm - 400) / 10);
    var f = (nm - AW_WL[i]) / 10;
    return AW[i] + (AW[i + 1] - AW[i]) * f;
  }

  /* Pedagogisk summa, inte en inversion av Jerlovs tabell.
     ag440: absorption av gult ämne vid 440 nm.
     chl: mg m⁻³. kp: extra, nästan grå, dämpning från partiklar. */
  function modelK(ag440, chl, kp, nm) {
    var ag = ag440 * Math.exp(-0.014 * (nm - 440));
    var g440 = Math.exp(-0.5 * Math.pow((nm - 440) / 28, 2));
    var g675 = Math.exp(-0.5 * Math.pow((nm - 675) / 18, 2));
    var aph = chl * (0.045 * g440 + 0.025 * g675);
    return awAt(nm) + ag + aph + kp;
  }

  function nearestType(ag440, chl, kp) {
    var wls = [];
    for (var w = 420; w <= 680; w += 20) wls.push(w);
    var best = null;
    var bestR = Infinity;
    ORDER.forEach(function (t) {
      var s = 0;
      wls.forEach(function (w) {
        var a = Math.log(Math.max(modelK(ag440, chl, kp, w), 1e-4));
        var b = Math.log(Math.max(kAt(t, w), 1e-4));
        s += (a - b) * (a - b);
      });
      var rms = Math.sqrt(s / wls.length);
      if (rms < bestR) { bestR = rms; best = t; }
    });
    /* I det blå är rent vatten klarare än typ I, eftersom Kd också innehåller spridning. */
    var blue = [430, 450, 470];
    var clearer = best === "I" && blue.every(function (w) {
      return modelK(ag440, chl, kp, w) < kAt("I", w) * 0.85;
    });
    return { type: best, rms: bestR, clearerThanI: clearer };
  }

  function g(x, m, s1, s2) {
    var s = x < m ? s1 : s2;
    var t = (x - m) / s;
    return Math.exp(-0.5 * t * t);
  }
  /* Ungefärliga CIE 1931-färgmatchningsfunktioner, gaussisk anpassning. */
  function cmf(l) {
    return [
      1.056 * g(l, 599.8, 37.9, 31.0) + 0.362 * g(l, 442.0, 16.0, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2),
      0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1),
      1.217 * g(l, 437.0, 11.8, 36.0) + 0.681 * g(l, 459.0, 26.0, 13.8)
    ];
  }
  function gam(c) {
    c = Math.max(0, c);
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  }
  /* Relativ spektral irradians för en 5772 K svartkropp. Inte ett uppmätt solspektrum. */
  function solar(l) {
    var u = 1.4388e7 / (l * 5772);
    return 1 / (Math.pow(l, 5) * (Math.exp(u) - 1));
  }

  var GRID = [];
  for (var gw = 400; gw <= 700; gw += 5) GRID.push(gw);
  var CMF = GRID.map(function (w) { var c = cmf(w); var s = solar(w); return [c[0] * s, c[1] * s, c[2] * s]; });
  var Y0 = CMF.reduce(function (a, c) { return a + c[1]; }, 0);

  function xyzToRgb(X, Y, Z) {
    var r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
    var gg = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
    var b = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;
    return [r, gg, b];
  }

  function integrate(kOf) {
    var X = 0, Y = 0, Z = 0;
    for (var i = 0; i < GRID.length; i++) {
      var e = Math.exp(-kOf(GRID[i]));
      X += e * CMF[i][0];
      Y += e * CMF[i][1];
      Z += e * CMF[i][2];
    }
    return { X: X / Y0, Y: Y / Y0, Z: Z / Y0 };
  }

  function expose(xyz) {
    var lin = xyzToRgb(xyz.X, xyz.Y, xyz.Z);
    var m = Math.max(lin[0], lin[1], lin[2], 1e-6);
    var keep = Math.pow(Math.max(xyz.Y, 0), 0.45);
    var s = keep / m;
    return {
      rgb: [gam(lin[0] * s) * 255, gam(lin[1] * s) * 255, gam(lin[2] * s) * 255],
      Y: xyz.Y
    };
  }

  function colorAt(type, z) {
    return expose(integrate(function (w) { return kAt(type, w) * z; }));
  }

  /* Nyans när ljuset vid 465 nm har gått en e-faldingslängd.
     Ljusstyrkan är lyft i expose(), så färgen skiljer typerna åt.
     Den säger inte hur ljust havet ser ut från ett fartyg. */
  function scaleColor(type) {
    return colorAt(type, 1 / kAt(type, 465));
  }

  function colorModel(ag440, chl, kp, z) {
    return expose(integrate(function (w) { return modelK(ag440, chl, kp, w) * z; }));
  }

  function css(rgb) {
    return "rgb(" + rgb.map(function (v) { return Math.round(Math.min(255, Math.max(0, v))); }).join(",") + ")";
  }

  function wlRGB(w) {
    var c = cmf(w);
    var lin = xyzToRgb(c[0], c[1], c[2]);
    var m = Math.max(lin[0], lin[1], lin[2], 1e-6);
    return css([gam(lin[0] / m) * 255, gam(lin[1] / m) * 255, gam(lin[2] / m) * 255]);
  }

  function hueName(rgb) {
    var r = rgb[0], g = rgb[1], b = rgb[2];
    if (r + g + b < 28) return "nästan mörkt";
    if (b > g * 1.12 && b > r) return "blått";
    if (b > g * 0.85 && b > r * 0.75) return "blågrönt";
    if (g > r * 1.15 && g >= b) return "grönt";
    if (b < Math.min(r, g) * 0.55) {
      var ratio = r / Math.max(g, 1);
      if (ratio < 1.12) return "gulgrönt";
      if (ratio < 1.45) return "gult";
      return "gulbrunt";
    }
    if (r > g * 1.5 && r > b) return "rödaktigt";
    return "gulgrönt";
  }

  function bestBand(type) {
    var minK = Infinity, best = 475;
    for (var w = 400; w <= 700; w += 5) {
      var k = kAt(type, w);
      if (k < minK) { minK = k; best = w; }
    }
    return { nm: best, kd: minK, z1: Math.log(100) / minK };
  }

  function snell(thetaRad) {
    var s = Math.sin(thetaRad) / N_WATER;
    if (s >= 1) return { theta2: Math.asin(1), grazing: true };
    return { theta2: Math.asin(s), grazing: false };
  }

  function fresnelUnpolarized(thetaRad) {
    var t2 = snell(thetaRad).theta2;
    var c1 = Math.cos(thetaRad);
    var c2 = Math.cos(t2);
    var n1 = N_AIR, n2 = N_WATER;
    var rs = (n1 * c1 - n2 * c2) / (n1 * c1 + n2 * c2);
    var rp = (n2 * c1 - n1 * c2) / (n2 * c1 + n1 * c2);
    return { R: 0.5 * (rs * rs + rp * rp), T: 1 - 0.5 * (rs * rs + rp * rp), theta2: t2 };
  }

  function criticalAngle() {
    return Math.asin(N_AIR / N_WATER);
  }

  root.Optics = {
    KNOTS: KNOTS,
    TYPES: TYPES,
    ORDER: ORDER,
    PAULSON: PAULSON,
    N_AIR: N_AIR,
    N_WATER: N_WATER,
    GRID: GRID,
    canon: canon,
    kAt: kAt,
    knots: knots,
    awAt: awAt,
    modelK: modelK,
    nearestType: nearestType,
    colorAt: colorAt,
    scaleColor: scaleColor,
    colorModel: colorModel,
    css: css,
    wlRGB: wlRGB,
    hueName: hueName,
    bestBand: bestBand,
    snell: snell,
    fresnelUnpolarized: fresnelUnpolarized,
    criticalAngle: criticalAngle,
    solar: solar,
    gam: gam
  };
})(typeof window !== "undefined" ? window : globalThis);

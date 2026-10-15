const d3 = require("d3-geo");
const topo = require("topojson-client");
const fs = require("fs");
const { classify, letterFor } = require("./classify");

function raster(proj, W, H, cols, rows, landGeom) {
  const dx = W / cols;
  const dy = H / rows;
  const chars = new Array(rows * cols);
  let n = 0;
  for (let j = 0; j < rows; j++) {
    const y = (j + 0.5) * dy;
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) * dx;
      const ll = proj.invert([x, y]);
      let ch = ".";
      if (ll && Number.isFinite(ll[0]) && Number.isFinite(ll[1])) {
        const back = proj([ll[0], ll[1]]);
        if (back && Math.hypot(back[0] - x, back[1] - y) <= dx) {
          ch = d3.geoContains(landGeom, ll) ? "L" : letterFor(classify(ll[0], ll[1]));
        }
      }
      chars[n++] = ch;
    }
  }
  return { cols: cols, rows: rows, cells: chars.join("") };
}
const res = process.argv[2] || "110m";
const land = topo.feature(require("world-atlas/land-" + res + ".json"), require("world-atlas/land-" + res + ".json").objects.land);
const W = 960, H = 470;
const proj = d3.geoEqualEarth().rotate([-10, 0]).fitExtent([[6, 6], [W - 6, H - 6]], { type: "Sphere" });
const path = d3.geoPath(proj).digits(1);
const route = [
  [11.9, 57.7], [10.5, 57.9], [6, 56], [2.5, 51.5], [-1.5, 50.2], [-6, 49], [-12, 43],
  [-16.9, 32.6], [-35, 22], [-58, 15.5], [-68, 14], [-79.9, 9.4], [-79.5, 8.9],
  [-80.4, 6.15], [-84.6, 3.1], [-100, -6], [-125, -14], [-149.6, -17.5],
  [-153, -5], [-157.9, 21.3], [-175, 12], [170, 6], [154.8, 1.07], [146, -2.5],
  [138, -1.5], [130, -2.5], [127, -6.5], [120, -8.2], [115.2, -8.6], [112, -9.5],
  [100, -6], [88, 2], [79.85, 6.9], [70, 1], [55.45, -4.6], [52, 8], [45, 12.3],
  [43.3, 12.8], [40, 17], [36, 23], [33.5, 27.5], [32.5, 29.9], [32.3, 31.3],
  [25, 34], [15, 37], [10, 39.5], [7.4, 43.7], [3, 39], [-3, 36.5], [-5.6, 35.95],
  [-12, 37], [-20, 42], [-12, 47], [-5, 49.2], [1.5, 51.2], [4, 54], [8, 57.2], [11.9, 57.7]
];
const sites = [
  { id: "sargasso", name: "Sargassohavet", lon: -60, lat: 28, type: "I", range: "I", note: "Ett av de klaraste haven på jorden, mitt i den nordatlantiska virveln." },
  { id: "tahiti", name: "Sydpacifiska virveln", lon: -130, lat: -25, type: "I", range: "I", note: "Det allra klaraste havsvattnet som har uppmätts. Albatross passerade Tahiti hösten 1947." },
  { id: "hawaii", name: "Hawaii", lon: -158, lat: 21, type: "IA", range: "I–IA", note: "Klart subtropiskt hav, där Albatross ankrade i Honolulu." },
  { id: "medel", name: "Östra Medelhavet", lon: 25, lat: 34, type: "IA", range: "I–IB", note: "Näringsfattigt och mycket klart, klarare än västra Medelhavet." },
  { id: "galapagos", name: "Utanför Galápagos och Peru", lon: -84, lat: -3, type: "III", range: "II–III", note: "Uppvällning för upp näringsrikt vatten och ger mycket plankton. Här mätte Albatross i augusti 1947." },
  { id: "arabian", name: "Arabiska havet", lon: 64, lat: 14, type: "II", range: "IB–III", note: "Monsunen styr. Uppvällning på sommaren gör vattnet grumligare." },
  { id: "norska", name: "Norska havet", lon: 2, lat: 68, type: "II", range: "II–III", note: "Atlant- och polarvatten är oftast typ II–III, och kusttyper under algblomning (Aas m.fl. 2013)." },
  { id: "nordsjon", name: "Nordsjön", lon: 3, lat: 56, type: "1", range: "1–3", note: "Grunt hav med partiklar och plankton. Kusttyp 1–3." },
  { id: "vastkusten", name: "Västkusten och Kattegatt", lon: 11.4, lat: 56.7, type: "3", range: "1–5", note: "Kusttyp 1, 3 och 5 är vanligast i nordiska kustvatten (Aas m.fl. 2013). Nisse mätte här på 1950-talet." },
  { id: "ostersjon", name: "Östersjön", lon: 19, lat: 57, type: "7", range: "5–9", note: "Mycket gult ämne från älvar och skog. Blått ljus försvinner fort och vattnet blir gulgrönt." },
  { id: "gota", name: "Göta älvs mynning", lon: 11.85, lat: 57.69, type: "9", range: "7–9", note: "Här visade Nisse 1953 hur löst gult ämne från älven följer vattenmassan ut i havet." }
];
const out = {
  W, H,
  sphere: path({ type: "Sphere" }),
  grat: path(d3.geoGraticule().step([30, 30])()),
  land: path(land),
  route: path({ type: "LineString", coordinates: route }),
  sites: sites.map(s => { const p = proj([s.lon, s.lat]); return { ...s, x: +p[0].toFixed(1), y: +p[1].toFixed(1) }; }),
  ports: [["Göteborg", 11.9, 57.7], ["Panama", -79.6, 9.1], ["Tahiti", -149.6, -17.5], ["Honolulu", -157.9, 21.3], ["Bali", 115.2, -8.6], ["Colombo", 79.85, 6.9], ["Seychellerna", 55.45, -4.6], ["Suez", 32.5, 29.9], ["Monaco", 7.4, 43.7]].map(([n, lo, la]) => { const p = proj([lo, la]); return { n, x: +p[0].toFixed(1), y: +p[1].toFixed(1) }; }),
  ocean: raster(proj, W, H, 480, 235, land)
};
fs.writeFileSync(process.argv[3] || "map.json", JSON.stringify(out));
console.log("land bytes", out.land.length);
// Nordic inset
const land50 = topo.feature(require("world-atlas/land-50m.json"), require("world-atlas/land-50m.json").objects.land);
const IW = 420, IH = 360;
const box = { type: "Feature", geometry: { type: "MultiPoint", coordinates: [[-1, 53.5], [26, 53.5], [-1, 66], [26, 66]] } };
const ip = d3.geoConicConformal().parallels([55, 65]).rotate([-12, 0]).fitExtent([[0, 0], [IW, IH]], box);
ip.clipExtent([[0, 0], [IW, IH]]);
const ipath = d3.geoPath(ip).digits(1);
const inset = {
  IW, IH,
  land: ipath(land50),
  grat: ipath(d3.geoGraticule().step([5, 5])()),
  sites: sites.filter(s => ["nordsjon","vastkusten","ostersjon","gota"].includes(s.id)).map(s => { const p = ip([s.lon, s.lat]); return { id: s.id, x: +p[0].toFixed(1), y: +p[1].toFixed(1) }; }),
  route: ipath({ type: "LineString", coordinates: route.slice(0, 6) }),
  routeBack: ipath({ type: "LineString", coordinates: route.slice(-4) }),
  labels: [["Göteborg", 11.95, 57.7], ["Stockholm", 18.07, 59.33], ["Köpenhamn", 12.57, 55.68], ["Lund", 13.19, 55.7]].map(([n, lo, la]) => { const p = ip([lo, la]); return { n, x: +p[0].toFixed(1), y: +p[1].toFixed(1) }; }),
  ocean: raster(ip, IW, IH, 210, 180, land50)
};
const o2 = JSON.parse(fs.readFileSync(process.argv[3] || "map.json"));
o2.inset = inset;
fs.writeFileSync(process.argv[3] || "map.json", JSON.stringify(o2));
console.log("inset bytes", inset.land.length, JSON.stringify(inset.sites));
const o3 = JSON.parse(fs.readFileSync(process.argv[3]));
o3.insetBox = path({type:"Polygon",coordinates:[[[-1,53.5],[-1,66],[26,66],[26,53.5],[-1,53.5]]]});
fs.writeFileSync(process.argv[3], JSON.stringify(o3));

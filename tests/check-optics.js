const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const code = fs.readFileSync("js/optics.js", "utf8");
const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(code, context);
const O = context.window.Optics;

function near(a, b, eps) {
  assert.ok(Math.abs(a - b) < eps, a + " not near " + b);
}

near(O.kAt("I", 475), 0.018, 1e-9);
near(O.kAt("I", 450), 0.019, 1e-9);
near(O.kAt("9", 400), 2.4, 1e-9);
near(O.kAt("1C", 500), 0.14, 1e-9);
near(O.kAt("IA", 310), 0.18, 1e-9);
near(O.kAt("III", 310), 0.65, 1e-9);
const mid = O.kAt("I", 462.5);
assert.ok(mid > 0.018 && mid < 0.019, "interpolation " + mid);

const z45 = Math.PI / 4;
const sn = O.snell(z45);
near(sn.theta2 * 180 / Math.PI, Math.asin(Math.sin(z45) / 1.34) * 180 / Math.PI, 1e-9);
near(sn.theta2 * 180 / Math.PI, 31.85, 0.02);
const fr0 = O.fresnelUnpolarized(0);
near(fr0.R, Math.pow(0.34 / 2.34, 2), 1e-9);
near(fr0.theta2, 0, 1e-12);
const fr85 = O.fresnelUnpolarized(85 * Math.PI / 180);
assert.ok(fr85.R > 0.5, "low sun should reflect a lot, got " + fr85.R);
near(O.criticalAngle() * 180 / Math.PI, Math.asin(1 / 1.34) * 180 / Math.PI, 1e-9);

const best = O.bestBand("I");
assert.strictEqual(best.nm, 475);
near(best.z1, Math.log(100) / 0.018, 0.2);

const col = O.colorAt("I", 10);
assert.strictEqual(col.rgb.length, 3);
col.rgb.forEach((v) => assert.ok(v >= 0 && v <= 255));
assert.ok(col.Y > 0.2, "type I at 10 m should still be bright, Y=" + col.Y);
const dark = O.colorAt("9", 20);
assert.ok(dark.Y < 0.02, "type 9 at 20 m should be dim, Y=" + dark.Y);

const scaleI = O.scaleColor("I");
const scale9 = O.scaleColor("9");
assert.ok(scaleI.rgb[2] > scaleI.rgb[1], "type I on the map scale should be blue");
assert.ok(scale9.rgb[0] > scale9.rgb[2], "type 9 on the map scale should be yellow");
assert.ok(scaleI.rgb[2] > O.scaleColor("III").rgb[2] * 0.5, "clearer types stay blue");
assert.strictEqual(O.hueName(scaleI.rgb), "blått");

assert.strictEqual(O.hueName(O.colorAt("I", 10).rgb), "blått");
assert.strictEqual(O.hueName(O.colorAt("3", 6).rgb), "grönt");
assert.notStrictEqual(O.hueName(O.colorAt("9", 2).rgb), "rödaktigt");
assert.ok(["gult", "gulgrönt", "gulbrunt"].includes(O.hueName(O.colorAt("9", 2).rgb)));

const pure = O.nearestType(0, 0, 0);
assert.strictEqual(pure.type, "I");
assert.strictEqual(pure.clearerThanI, true);
const coastal = O.nearestType(1.2, 0.2, 0.05);
assert.ok(["5", "7", "9", "3"].includes(coastal.type), coastal.type);

const knots = O.knots("7");
assert.ok(knots.some((r) => r.nm === 350 && r.kd === 3));
assert.ok(!knots.some((r) => r.nm === 310));

assert.strictEqual(O.PAULSON.II.a2, 14);
console.log("optics ok", {
  typeI10m: col.Y.toFixed(3),
  type9at20: dark.Y.toExponential(2),
  reflectOverhead: fr0.R.toFixed(4),
  reflect85: fr85.R.toFixed(3),
  pure: pure,
  coastal: coastal.type
});

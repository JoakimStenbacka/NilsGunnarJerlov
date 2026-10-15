const assert = require("assert");
const { classify } = require("../tools/map/classify");

const expect = {
  "Sargasso": [[-60, 28], "I"],
  "Sydpacifiska virveln": [[-130, -25], "I"],
  "Hawaii": [[-158, 21], "IA"],
  "Östra Medelhavet": [[25, 34], "IA"],
  "Galápagos": [[-84, -3], "III"],
  "Arabiska havet": [[64, 14], "II"],
  "Norska havet": [[2, 68], "II"],
  "Nordsjön": [[3, 56], "1"],
  "Västkusten": [[11.4, 56.7], "3"],
  "Östersjön": [[19, 57], "7"],
  "Göta älv": [[11.85, 57.69], "9"],
  "Benguela": [[12, -25], "III"],
  "Karibien": [[-75, 16], "IB"]
};

Object.keys(expect).forEach(function (name) {
  const pair = expect[name];
  const got = classify(pair[0][0], pair[0][1]);
  assert.strictEqual(got, pair[1], name + " became " + got);
});

console.log("types ok", Object.keys(expect).length);

"use strict";

/**
 * Schematic Jerlov type for a lon/lat point.
 *
 * Oceanic types follow the pattern of Jerlov's 1976 world map (Marine Optics,
 * fig. 72): ship stations, not a filled satellite field. The boundaries here
 * are smoothed regions in that pattern (clearest subtropical gyres as I,
 * the rest of the gyres as IA, tropics as IB, temperate water and upwelling
 * as II or III). They are not a tracing of every numeral on the figure.
 *
 * Coastal types 1, 3, 7 and 9 are only applied where this site already
 * cites them: the North Sea, the Swedish west coast and Kattegat, the
 * Baltic, and the Göta älv mouth. Jerlov did not publish a global map of
 * coastal types 1–9.
 */

function classify(lon, lat) {
  if (inBox(lon, lat, 11.4, 12.3, 57.45, 57.95)) return "9";
  if (lat >= 63.2 && lon >= 16 && lon <= 26.5) return "9";
  if (lat >= 59.3 && lat <= 60.8 && lon >= 23 && lon <= 30.2) return "9";
  if (isBaltic(lon, lat)) return "7";
  if (isWestCoast(lon, lat)) return "3";
  if (isNorthSea(lon, lat)) return "1";
  return oceanic(lon, lat);
}

function inBox(lon, lat, minLon, maxLon, minLat, maxLat) {
  return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
}

function isBaltic(lon, lat) {
  if (lat < 53.5 || lat > 66 || lon < 13.2 || lon > 30.5) return false;
  if (lat >= 63.2 && lon >= 16) return false;
  if (lat >= 59.3 && lat <= 60.8 && lon >= 23) return false;
  return true;
}

function isWestCoast(lon, lat) {
  if (inBox(lon, lat, 10, 13.2, 55.2, 57.7)) return true;
  if (inBox(lon, lat, 7.2, 11.6, 57.3, 59.2)) return true;
  return false;
}

function isNorthSea(lon, lat) {
  return inBox(lon, lat, -4.2, 8.8, 51, 59.2);
}

function ellipse(lon, lat, clon, clat, rx, ry) {
  var dlon = lon - clon;
  while (dlon > 180) dlon -= 360;
  while (dlon < -180) dlon += 360;
  return (dlon * dlon) / (rx * rx) + ((lat - clat) * (lat - clat)) / (ry * ry);
}

function isMed(lon, lat) {
  if (lat < 30.2 || lat > 45.6 || lon < -5.6 || lon > 36.3) return false;
  if (lon < 0 && lat > 36.8) return false;
  return true;
}

function oceanic(lon, lat) {
  if (inBox(lon, lat, 32, 44, 12, 28.5)) return "IA";
  if (inBox(lon, lat, 47, 57, 23, 31)) return "II";
  if (inBox(lon, lat, 27, 42.5, 40.5, 47.6)) return "III";
  if (isMed(lon, lat)) return lon >= 18 ? "IA" : "IB";

  if (ellipse(lon, lat, -76, -22, 9, 18) < 1) return "III";
  if (ellipse(lon, lat, -88, -2, 16, 7) < 1) return "III";
  if (ellipse(lon, lat, -123, 38, 9, 12) < 1) return "III";
  if (ellipse(lon, lat, 12, -24, 8, 14) < 1) return "III";
  if (ellipse(lon, lat, 52, 10, 8, 7) < 1) return "III";
  if (ellipse(lon, lat, -18, 22, 12, 12) < 1) return "II";
  if (ellipse(lon, lat, 58, 14, 16, 10) < 1) return "II";
  if (ellipse(lon, lat, 90, 15, 12, 9) < 1) return "II";
  if (ellipse(lon, lat, -120, 0, 22, 6) < 1) return "II";
  if (ellipse(lon, lat, -15, 0, 20, 5) < 1) return "II";

  if (ellipse(lon, lat, -58, 28, 16, 8) < 1) return "I";
  if (ellipse(lon, lat, -125, -26, 28, 11) < 1) return "I";

  if (ellipse(lon, lat, -42, 27, 34, 13) < 1) return "IA";
  if (ellipse(lon, lat, -170, 26, 42, 13) < 1) return "IA";
  if (ellipse(lon, lat, -130, -25, 48, 15) < 1) return "IA";
  if (ellipse(lon, lat, -20, -26, 32, 13) < 1) return "IA";
  if (ellipse(lon, lat, 80, -27, 38, 13) < 1) return "IA";

  if (lat >= 70 || lat <= -58) return "III";
  if (lat >= 46 || lat <= -42) return "II";
  if (Math.abs(lat) <= 18) return "IB";
  return "II";
}

const LETTER = {
  I: "I",
  IA: "A",
  IB: "B",
  II: "2",
  III: "3",
  1: "1",
  3: "c",
  5: "5",
  7: "7",
  9: "9"
};

function letterFor(type) {
  var letter = LETTER[type];
  if (!letter) throw new Error("unknown type " + type);
  return letter;
}

module.exports = { classify: classify, letterFor: letterFor, LETTER: LETTER };

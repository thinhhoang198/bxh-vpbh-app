/**
 * Public leaderboard API for the BTC Google Sheet "Dẫn lối khách hàng".
 *
 * Target file: "BXH Dẫn Lối Khách Hàng" (Google Sheet id 1IhlHYa4pFLXY9CdpAWoi7OsUmCUJPAUVJLoSBSiMf-g).
 * Best used container-bound (Extensions > Apps Script inside that sheet). A standalone script also works:
 * set the Script Property SPREADSHEET_ID (defaults to the id above).
 *
 * READ-ONLY: this script never writes to the sheet and never changes its structure.
 * Deploy as Web app (Execute as: Me, Who has access: Anyone). Every request needs ?key=API_KEY
 * (Script Property). Only masked phone numbers and public ranking fields are ever returned.
 *
 *   GET ?action=summary&key=...          -> Summary
 *   GET ?action=week&week=3&key=...      -> { week, entries }
 *
 * All business logic lives in pure functions (buildSnapshot_ and helpers) so it can be unit-tested
 * outside Apps Script. Vietnam has no DST, so a fixed +07:00 offset is exact.
 */

var DEFAULT_SPREADSHEET_ID = "1IhlHYa4pFLXY9CdpAWoi7OsUmCUJPAUVJLoSBSiMf-g";
var SHEET_CONFIG = "Cấu hình";
var SHEET_CVKD = "CVKD"; // computed sheet: one row per CVKD with points (formulas, do not edit)
var SHEET_DATA = "Dữ liệu"; // imported check-ins, used only for the "latest check-in" timestamp
var DATA_LAST_ROW = 4001;
var FIRST_ROW = 2;
var LAST_ROW = 1201;
var LAST_COL = 43; // column AQ
var MAX_WEEKS = 15; // weekly columns N..AB (guests) and AC..AQ (sort keys)
var TOP_OVERALL = 300;
var TOP_WEEK = 200;
var VN_OFFSET_MS = 7 * 3600 * 1000;
var DAY_MS = 24 * 3600 * 1000;

// 0-based indexes inside a CVKD row (A = 0)
var COL = { PHONE: 2, NAME: 3, AGENCY: 4, AGENCY_STD: 5, GUESTS: 6, VISITS: 7, LAST: 8, KEY: 10, WEEK_GUESTS: 13, WEEK_KEYS: 28 };

// ---------------------------------------------------------------- web app entry

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var expected = PropertiesService.getScriptProperties().getProperty("API_KEY");
    if (!expected || !safeEqual_(String(p.key || ""), String(expected))) {
      return json_({ error: "unauthorized" });
    }
    var data = readSheet_();
    var snap = buildSnapshot_(data.config, data.rows, Date.now());
    if (p.action === "summary") return json_(snap.summary);
    if (p.action === "week") {
      var w = parseInt(p.week, 10);
      if (!(w >= 1 && w <= snap.summary.meta.totalWeeks)) return json_({ error: "bad_request" });
      return json_({ week: w, entries: snap.weeks[w] });
    }
    return json_({ error: "bad_request" });
  } catch (err) {
    console.error(String(err)); // never echo internals to the caller
    return json_({ error: "server_error" });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------- sheet access (one getValues per range)

function getSpreadsheet_() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  var id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || DEFAULT_SPREADSHEET_ID;
  return SpreadsheetApp.openById(id);
}

/** Tab lookup that ignores Unicode normalisation differences (NFC vs NFD) in Vietnamese names. */
function sheetByName_(ss, name) {
  var want = name.normalize("NFC");
  var all = ss.getSheets();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getName().normalize("NFC") === want) return all[i];
  }
  throw new Error("missing sheet: " + name);
}

/** Date cells become "yyyy-MM-dd HH:mm" in the spreadsheet's own timezone (read as Vietnam wall time later). */
function wallTime_(v, tz) {
  return isDate_(v) ? Utilities.formatDate(v, tz, "yyyy-MM-dd HH:mm") : v;
}

function readSheet_() {
  var ss = getSpreadsheet_();
  var tz = ss.getSpreadsheetTimeZone();
  var cfg = sheetByName_(ss, SHEET_CONFIG).getRange("C7:C14").getValues(); // rows 7..14
  var rows = sheetByName_(ss, SHEET_CVKD).getRange(FIRST_ROW, 1, LAST_ROW - FIRST_ROW + 1, LAST_COL).getValues();
  var data = sheetByName_(ss, SHEET_DATA).getRange(2, 3, DATA_LAST_ROW - 1, 1).getValues(); // column C: check-in time
  for (var i = 0; i < rows.length; i++) rows[i][COL.LAST] = wallTime_(rows[i][COL.LAST], tz);
  return {
    config: {
      programStart: wallTime_(cfg[0][0], tz), // C7
      programEnd: wallTime_(cfg[1][0], tz), // C8
      minGuests: cfg[3][0], // C10
      prizeVnd: cfg[4][0], // C11
      weekAnchor: wallTime_(cfg[6][0], tz), // C13: Monday of the week that contains the start date
      totalWeeks: cfg[7][0], // C14: =INT((C8-C13)/7)
      dataTimes: data.map(function (r) { return wallTime_(r[0], tz); }),
    },
    rows: rows,
  };
}

// ---------------------------------------------------------------- pure helpers

function isDate_(v) {
  return Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime());
}

/** Date cell or text (yyyy-MM-dd, dd/MM/yyyy, optional HH:mm) -> epoch ms, or NaN. */
function toMs_(v) {
  if (isDate_(v)) return v.getTime();
  // Cell formatted as a plain number: Sheets serial date (days since 1899-12-30, wall time).
  if (typeof v === "number") return v > 20000 && v < 100000 ? Date.UTC(1899, 11, 30) + Math.round(v * DAY_MS) - VN_OFFSET_MS : NaN;
  if (typeof v !== "string") return NaN;
  var s = v.trim();
  var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(s);
  var y, mo, d, hh, mm;
  if (m) {
    y = +m[1]; mo = +m[2]; d = +m[3]; hh = +(m[4] || 0); mm = +(m[5] || 0);
  } else {
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(s);
    if (!m) return NaN;
    d = +m[1]; mo = +m[2]; y = +m[3]; hh = +(m[4] || 0); mm = +(m[5] || 0);
  }
  return Date.UTC(y, mo - 1, d, hh, mm) - VN_OFFSET_MS;
}

function vnIso_(ms) {
  return new Date(ms + VN_OFFSET_MS).toISOString();
}
function dateStr_(ms) {
  return vnIso_(ms).slice(0, 10);
}
/** Minute precision with offset, never seconds: 2026-11-20T10:00+07:00 */
function isoMinute_(ms) {
  return vnIso_(ms).slice(0, 16) + "+07:00";
}
function addDays_(date, n) {
  return new Date(Date.parse(date + "T00:00:00Z") + n * DAY_MS).toISOString().slice(0, 10);
}

function text_(v) {
  return String(v == null ? "" : v).trim();
}

function num_(v) {
  var n = Number(v);
  return isFinite(n) ? n : 0;
}

/** 0797123333 -> 0797***333. Returns null when there are too few digits to mask safely. */
function maskPhone_(v) {
  var digits = String(v == null ? "" : v).replace(/\D/g, "");
  if (typeof v === "number" && digits.length === 9) digits = "0" + digits; // leading zero lost by Sheets
  if (digits.length < 7) return null;
  return digits.slice(0, 4) + "***" + digits.slice(-3);
}

/** The sheet already uses PROPER(); only fix names that arrive all-upper or all-lower. */
function properCase_(s) {
  var t = String(s == null ? "" : s).trim().replace(/\s+/g, " ");
  if (t !== t.toUpperCase() && t !== t.toLowerCase()) return t;
  return t
    .toLowerCase()
    .split(" ")
    .map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/**
 * Sort by key desc then sheet row asc. rank = 1 + number of rows with a strictly greater key,
 * so equal keys share a rank. Only keys > 0 are ranked.
 */
function rank_(items, keyOf, limit, toEntry) {
  var ranked = items
    .filter(function (it) { return keyOf(it) > 0; })
    .sort(function (a, b) { return keyOf(b) - keyOf(a) || a.row - b.row; });
  var out = [];
  var rank = 1;
  for (var i = 0; i < ranked.length && i < limit; i++) {
    if (i > 0 && keyOf(ranked[i]) !== keyOf(ranked[i - 1])) rank = i + 1;
    out.push(toEntry(ranked[i], rank));
  }
  return out;
}

/**
 * Same formulas as the sheet "Giải tuần" (B/C columns) and Dữ liệu!T, with C13 = weekAnchor:
 *   week 1 : C7 .. MIN(C8, C13 + 13)         (extended first week)
 *   week k : MAX(C7, C13 + 7k) .. MIN(C8, C13 + 7k + 6)
 */
function buildWeeks_(cfg, nowMs) {
  var start = dateStr_(toMs_(cfg.programStart));
  var end = dateStr_(toMs_(cfg.programEnd));
  var anchor = dateStr_(toMs_(cfg.weekAnchor));
  var total = Math.max(1, Math.min(MAX_WEEKS, Math.floor(num_(cfg.totalWeeks)) || 1));
  var today = dateStr_(nowMs);
  var weeks = [];
  for (var k = 1; k <= total; k++) {
    var s = k === 1 ? start : addDays_(anchor, 7 * k);
    if (s < start) s = start;
    var e = addDays_(anchor, 7 * k + 6);
    if (e > end) e = end;
    weeks.push({ week: k, start: s, end: e, status: today < s ? "upcoming" : today > e ? "ended" : "ongoing" });
  }
  return weeks;
}

function buildSnapshot_(cfg, rawRows, nowMs) {
  var minGuests = num_(cfg.minGuests);
  var prizeVnd = num_(cfg.prizeVnd);
  var weeks = buildWeeks_(cfg, nowMs);

  var items = [];
  var totalGuests = 0;
  var totalVisits = 0;
  var lastMax = 0;
  // Like the sheet's "Check-in mới nhất trong dữ liệu": newest check-in in the imported data (counted or not).
  var dataTimes = cfg.dataTimes || [];
  for (var d = 0; d < dataTimes.length; d++) {
    var dt = toMs_(dataTimes[d]);
    if (!isNaN(dt) && dt > lastMax) lastMax = dt;
  }
  var lastFromData = lastMax;
  for (var i = 0; i < rawRows.length; i++) {
    var r = rawRows[i];
    if (r[COL.PHONE] === "" || r[COL.PHONE] == null) continue; // empty row
    var masked = maskPhone_(r[COL.PHONE]);
    if (!masked) continue;
    var last = toMs_(r[COL.LAST]);
    if (!lastFromData && !isNaN(last) && last > lastMax) lastMax = last; // fallback when no raw data
    totalGuests += num_(r[COL.GUESTS]);
    totalVisits += num_(r[COL.VISITS]);
    items.push({
      row: i,
      name: properCase_(r[COL.NAME]),
      agency: text_(r[COL.AGENCY]) || text_(r[COL.AGENCY_STD]), // display name, else the standardised upper-case one
      phoneMasked: masked,
      guests: num_(r[COL.GUESTS]),
      visits: num_(r[COL.VISITS]),
      last: isNaN(last) ? 0 : last,
      key: num_(r[COL.KEY]),
      raw: r,
    });
  }

  var overall = rank_(items, function (it) { return it.key; }, TOP_OVERALL, function (it, rank) {
    var e = { rank: rank, name: it.name, agency: it.agency, phoneMasked: it.phoneMasked, guests: it.guests, visits: it.visits };
    if (it.last > 0) e.lastCheckin = isoMinute_(it.last);
    return e;
  });
  var scored = items.filter(function (it) { return it.key > 0; }).length;

  var weekEntries = {};
  weeks.forEach(function (w) {
    var k = w.week - 1;
    weekEntries[w.week] = rank_(items, function (it) { return num_(it.raw[COL.WEEK_KEYS + k]); }, TOP_WEEK, function (it, rank) {
      return { rank: rank, name: it.name, agency: it.agency, phoneMasked: it.phoneMasked, guests: num_(it.raw[COL.WEEK_GUESTS + k]) };
    });
  });

  var current = weeks.filter(function (w) { return w.status === "ongoing"; })[0];
  var winners = [];
  weeks.forEach(function (w) {
    if (w.status === "upcoming") return;
    var top = weekEntries[w.week][0];
    if (!top) return;
    var ok = top.guests >= minGuests;
    winners.push({ week: w.week, name: top.name, agency: top.agency, guests: top.guests, qualified: ok, prizeVnd: ok ? prizeVnd : 0 });
  });

  return {
    summary: {
      meta: {
        generatedAt: isoMinute_(nowMs),
        dataAsOf: lastMax > 0 ? isoMinute_(lastMax) : null,
        programStart: weeks[0].start,
        programEnd: weeks[weeks.length - 1].end,
        currentWeek: current ? current.week : 0,
        totalWeeks: weeks.length,
        minGuestsPerWeek: minGuests,
        weeklyPrizeVnd: prizeVnd,
        weeks: weeks,
      },
      totals: { guests: totalGuests, cvkdCount: scored, visits: totalVisits },
      overall: overall,
      currentWeekEntries: current ? weekEntries[current.week] : [],
      winners: winners,
    },
    weeks: weekEntries,
  };
}

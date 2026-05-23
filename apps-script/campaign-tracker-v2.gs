/**
 * campaign-tracker-v2.gs: Creator Leaderboard extension (REFERENCE COPY)
 * ----------------------------------------------------------------------------
 * This is NOT the live file. The live Apps Script is bound to the Campaign
 * Tracker Google Sheet (project "Daily Campaign Updates Slack-Descript").
 *
 * To go live:
 *   1. Paste this file as a NEW Apps Script file in the bound project. Do NOT
 *      modify the existing campaign-tracker.gs. The leaderboard runs fully
 *      decoupled (own helpers, own constants, own sheet tabs, reads
 *      SIDESHIFT_KEYS read-only), so a leaderboard failure cannot affect the
 *      daily syncActive() Slack/Discord digest.
 *   2. Install a SEPARATE daily trigger for buildLeaderboardSnapshot at 06:30
 *      (Apps Script editor > Triggers > + Add Trigger > time-driven, day timer,
 *      6am-7am). This runs 30 min after the existing syncActive trigger and is
 *      still off-peak for Cloudflare. Do NOT call it from syncActive().
 *   3. Deploy: Deploy > New deployment > Web App
 *          Execute as: Me   |   Who has access: Anyone with the link
 *      Copy the deployment URL into Vercel env LEADERBOARD_DATA_URL.
 *
 * AUTH NOTE: sideshiftGet_() below sets the Sideshift auth header. The existing
 * campaign-tracker.gs already calls /programs and /analytics/overview, so it
 * already has a working fetch helper. REUSE that helper instead of this one, or
 * confirm the header here matches sideshift-api-reference.md before deploying.
 * Do not guess the auth scheme.
 * ----------------------------------------------------------------------------
 */

var SIDESHIFT_API_BASE = 'https://app.sideshift.app/api/v1';
var LB_HISTORY_SHEET = 'Leaderboard-History';
var LB_CURRENT_SHEET = 'Leaderboard-Current';
var LB_TOP_N = 10;

/**
 * Builds today's leaderboard snapshot:
 *   - pulls programs + analytics per brand from Sideshift,
 *   - aggregates lifetime views/posts per creator across all brands,
 *   - appends one history row per creator,
 *   - computes month-to-date deltas,
 *   - writes the top-N JSON to Leaderboard-Current!A1 for doGet().
 * Brand-level failures (429/5xx, zero programs) are logged and skipped; the run
 * does not fail as a whole.
 */
function buildLeaderboardSnapshot() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone() || 'Etc/UTC';
  var now = new Date();
  var today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  var monthPrefix = Utilities.formatDate(now, tz, 'yyyy-MM'); // e.g. "2026-05"

  var keysRaw = PropertiesService.getScriptProperties().getProperty('SIDESHIFT_KEYS');
  if (!keysRaw) {
    Logger.log('[leaderboard] SIDESHIFT_KEYS script property missing; aborting.');
    return;
  }
  var keys = JSON.parse(keysRaw); // { brandName: apiKey }

  // userId -> aggregate
  var agg = {};

  Object.keys(keys).forEach(function (brandName) {
    var apiKey = keys[brandName];
    var programs;
    try {
      var progResp = sideshiftGet_('/programs?page=1&limit=100&status=active', apiKey);
      programs = progResp.programs || progResp.data || progResp;
      if (!Array.isArray(programs)) {
        Logger.log('[leaderboard] ' + brandName + ': unexpected /programs shape; skipping.');
        return;
      }
    } catch (e) {
      Logger.log('[leaderboard] ' + brandName + ': /programs failed (' + e + '); skipping brand.');
      return;
    }

    if (programs.length === 0) {
      Logger.log('[leaderboard] ' + brandName + ': zero active programs.');
      return;
    }

    programs.forEach(function (program) {
      var programId = program.id || program.programId;
      var handles = program.handles || [];
      var handleByUser = {};
      handles.forEach(function (h) {
        if (h && h.userId) handleByUser[h.userId] = h;
      });

      var topCreators;
      try {
        var ovResp = sideshiftGet_(
          '/analytics/overview?programId=' + encodeURIComponent(programId) + '&programStatus=active',
          apiKey
        );
        topCreators = ovResp.topCreators || (ovResp.data && ovResp.data.topCreators) || [];
      } catch (e) {
        Logger.log('[leaderboard] ' + brandName + ' program ' + programId +
          ': /analytics/overview failed (' + e + '); skipping program.');
        return;
      }

      topCreators.forEach(function (tc) {
        var id = tc.id;
        if (!id) return;
        if (!agg[id]) {
          agg[id] = {
            userId: id,
            name: tc.name || '',
            handle: '',
            profileImageUrl: '',
            totalViews: 0,
            totalPosts: 0,
            brands: {},
            programs: {},
            viewsByPlatform: {}
          };
        }
        var a = agg[id];
        var v = Number(tc.totalViews) || 0;
        var p = Number(tc.totalPosts) || 0;
        a.totalViews += v;
        a.totalPosts += p;
        a.brands[brandName] = true;
        a.programs[programId] = true;
        if (!a.name && tc.name) a.name = tc.name;

        var h = handleByUser[id];
        if (h) {
          if (!a.handle && h.handle) a.handle = h.handle;
          if (!a.name && h.userName) a.name = h.userName;
          if (!a.profileImageUrl && h.profileImageUrl) a.profileImageUrl = h.profileImageUrl;
          // Approximation: the two Public API endpoints expose per-creator totals
          // and per-handle platforms, but NOT per-platform view splits. We
          // attribute this program's creator views to the matched handle's
          // platform to pick a primary platform. Documented limitation, not a bug.
          var plat = (h.platform || '').toLowerCase();
          if (plat) a.viewsByPlatform[plat] = (a.viewsByPlatform[plat] || 0) + v;
        }
      });
    });
  });

  var userIds = Object.keys(agg);
  if (userIds.length === 0) {
    Logger.log('[leaderboard] no creators aggregated; leaving previous snapshot intact.');
    return;
  }

  // --- write today's history rows (purge same-day rows first for idempotency) ---
  var hist = getOrCreateSheet_(ss, LB_HISTORY_SHEET, [
    'Date', 'UserId', 'Name', 'Handle', 'Platform', 'ProfileImageUrl',
    'Brands', 'Programs', 'LifetimeViews', 'LifetimePosts'
  ]);
  purgeRowsForDate_(hist, today);

  var newRows = userIds.map(function (id) {
    var a = agg[id];
    var primary = primaryPlatform_(a.viewsByPlatform);
    return [
      today,
      a.userId,
      a.name,
      a.handle,
      primary,
      a.profileImageUrl,
      Object.keys(a.brands).join(', '),
      Object.keys(a.programs).join(', '),
      a.totalViews,
      a.totalPosts
    ];
  });
  hist.getRange(hist.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);

  // --- month-to-date baselines from history ---
  var baseline = monthBaselines_(hist, monthPrefix); // userId -> {date, views, posts}
  var monthStartDate = null;
  Object.keys(baseline).forEach(function (id) {
    var d = baseline[id].date;
    if (monthStartDate === null || d < monthStartDate) monthStartDate = d;
  });

  var ranked = userIds.map(function (id) {
    var a = agg[id];
    var b = baseline[id];
    var baseViews = b ? b.views : 0;
    var basePosts = b ? b.posts : 0;
    return {
      userId: a.userId,
      name: a.name,
      handle: a.handle,
      primaryPlatform: primaryPlatform_(a.viewsByPlatform),
      profileImageUrl: a.profileImageUrl || undefined,
      mtdViews: Math.max(0, a.totalViews - baseViews),
      mtdPosts: Math.max(0, a.totalPosts - basePosts),
      activePrograms: Object.keys(a.programs).length,
      brands: Object.keys(a.brands),
      joinedMidMonth: b ? (b.date > monthStartDate) : true
    };
  });

  ranked.sort(function (x, y) {
    if (y.mtdViews !== x.mtdViews) return y.mtdViews - x.mtdViews;
    return y.mtdPosts - x.mtdPosts;
  });

  var top = ranked.slice(0, LB_TOP_N).map(function (c, i) {
    c.rank = i + 1;
    return c;
  });

  var payload = {
    updatedAt: now.toISOString(),
    month: Utilities.formatDate(now, tz, 'MMMM yyyy'),
    topCreators: top
  };

  var current = getOrCreateSheet_(ss, LB_CURRENT_SHEET, ['JSON']);
  current.getRange('A1').setValue(JSON.stringify(payload));
  Logger.log('[leaderboard] snapshot written: ' + top.length + ' creators, month ' + payload.month);
}

/** Web App: returns the current leaderboard JSON blob stored in A1. */
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(LB_CURRENT_SHEET);
  var json = sheet ? sheet.getRange('A1').getValue() : '';
  if (!json) json = JSON.stringify({ updatedAt: '', month: '', topCreators: [] });
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/* ----------------------------- helpers ----------------------------- */

/**
 * GET a Sideshift Public API path with a brand key. Throws on non-2xx so the
 * caller can skip that brand/program. REPLACE with the existing helper in
 * campaign-tracker.gs if one exists, or confirm this auth header matches
 * sideshift-api-reference.md before deploying.
 */
function sideshiftGet_(path, apiKey) {
  var res = UrlFetchApp.fetch(SIDESHIFT_API_BASE + path, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      // CONFIRM against sideshift-api-reference.md / existing campaign-tracker.gs:
      'x-api-key': apiKey,
      'Accept': 'application/json'
    }
  });
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('HTTP ' + code + ' for ' + path);
  }
  return JSON.parse(res.getContentText() || '{}');
}

function getOrCreateSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name !== LB_CURRENT_SHEET) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    }
  }
  return sheet;
}

/** Remove existing history rows for a given yyyy-MM-dd so re-runs stay clean. */
function purgeRowsForDate_(sheet, date) {
  var last = sheet.getLastRow();
  if (last < 2) return;
  var dates = sheet.getRange(2, 1, last - 1, 1).getValues();
  // delete from the bottom up so indices stay valid
  for (var i = dates.length - 1; i >= 0; i--) {
    var cell = dates[i][0];
    var asStr = (cell instanceof Date)
      ? Utilities.formatDate(cell, sheet.getParent().getSpreadsheetTimeZone() || 'Etc/UTC', 'yyyy-MM-dd')
      : String(cell);
    if (asStr === date) sheet.deleteRow(i + 2);
  }
}

/** For each userId, the earliest snapshot row within monthPrefix (yyyy-MM). */
function monthBaselines_(sheet, monthPrefix) {
  var last = sheet.getLastRow();
  var out = {};
  if (last < 2) return out;
  var rows = sheet.getRange(2, 1, last - 1, 10).getValues();
  var tz = sheet.getParent().getSpreadsheetTimeZone() || 'Etc/UTC';
  rows.forEach(function (r) {
    var d = (r[0] instanceof Date) ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]);
    if (d.indexOf(monthPrefix) !== 0) return;
    var id = r[1];
    var views = Number(r[8]) || 0;
    var posts = Number(r[9]) || 0;
    if (!out[id] || d < out[id].date) {
      out[id] = { date: d, views: views, posts: posts };
    }
  });
  return out;
}

/** Platform with the most attributed views; '' if none recorded. */
function primaryPlatform_(viewsByPlatform) {
  var best = '';
  var bestViews = -1;
  Object.keys(viewsByPlatform || {}).forEach(function (plat) {
    if (viewsByPlatform[plat] > bestViews) {
      bestViews = viewsByPlatform[plat];
      best = plat;
    }
  });
  return best;
}

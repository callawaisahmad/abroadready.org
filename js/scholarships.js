/* =========================================================================
   AbroadReady — shared scholarship engine
   Loaded on the results (filter/list) and scholarship (detail) pages.
   Depends on js/scholarships-data.js which sets window.SCHOLARSHIP_DATA.
   ========================================================================= */
(function (global) {
  "use strict";

  var DATA = global.SCHOLARSHIP_DATA || { meta: {}, scholarships: [] };
  var SCHOLARSHIPS = DATA.scholarships || [];
  var MS_PER_DAY = 24 * 60 * 60 * 1000;

  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  /* ---- Deadline & status (computed live in the browser) ----------------
     Each scholarship stores deadlineMonthNum (1-12) and optionally
     opensMonthNum (1-12). When opensMonthNum is known we check the full
     application window (opens → closes). If the current date falls outside
     the window the scholarship is shown as "Closed". When opensMonthNum is
     not set we fall back to the original behaviour: treat the deadline as
     an annual recurring date and assume it is always open (the scholarship
     simply doesn't have a well-defined annual window). */
  function deadlineInfo(s) {
    var now = new Date();
    var cy = now.getFullYear();
    var D = s.deadlineMonthNum;
    var O = s.opensMonthNum;
    var day = 15;
    var target, daysLeft, status;

    if (!D) {
      return { hasDate: false, status: "rolling", label: "Rolling / Varies", daysLeft: null, date: null, opens: null, closes: null };
    }

    // ---- Has an opening month → check the application window ----------
    if (O) {
      var openDate, closeDate, nextOpen, nextClose;

      if (O <= D) {
        // Same-year window: O → D in the same calendar year
        openDate = new Date(cy, O-1, 1);
        closeDate = new Date(cy, D-1, day, 23, 59, 59);

        if (now >= openDate && now <= closeDate) {
          daysLeft = Math.ceil((closeDate - now) / MS_PER_DAY);
          status = daysLeft <= 30 ? "closing" : "open";
          return { hasDate: true, status: status, daysLeft: daysLeft, date: closeDate,
            label: MONTH_NAMES[D-1] + " " + cy + " (approx.)", opens: openDate, closes: closeDate };
        }

        if (now < openDate) {
          return { hasDate: true, status: "upcoming", daysLeft: null, date: openDate,
            label: "Opens " + MONTH_NAMES[O-1] + " " + cy, opens: openDate, closes: closeDate };
        }

        nextOpen = new Date(cy+1, O-1, 1);
        nextClose = new Date(cy+1, D-1, day, 23, 59, 59);
        return { hasDate: true, status: "closed", daysLeft: null, date: nextOpen,
          label: "Closed · Reopens " + MONTH_NAMES[O-1] + " " + (cy+1), opens: nextOpen, closes: nextClose };
      }

      // Cross-year window: O(prev year) → D(this year)
      openDate = new Date(cy-1, O-1, 1);
      closeDate = new Date(cy, D-1, day, 23, 59, 59);

      if (now >= openDate && now <= closeDate) {
        daysLeft = Math.ceil((closeDate - now) / MS_PER_DAY);
        status = daysLeft <= 30 ? "closing" : "open";
        return { hasDate: true, status: status, daysLeft: daysLeft, date: closeDate,
          label: MONTH_NAMES[D-1] + " " + cy + " (approx.)", opens: openDate, closes: closeDate };
      }

      nextOpen = new Date(cy, O-1, 1);
      nextClose = new Date(cy+1, D-1, day, 23, 59, 59);

      if (now < nextOpen) {
        return { hasDate: true, status: "closed", daysLeft: null, date: nextOpen,
          label: "Closed · Reopens " + MONTH_NAMES[O-1] + " " + cy, opens: nextOpen, closes: nextClose };
      }

      daysLeft = Math.ceil((nextClose - now) / MS_PER_DAY);
      status = daysLeft <= 30 ? "closing" : "open";
      return { hasDate: true, status: status, daysLeft: daysLeft, date: nextClose,
        label: MONTH_NAMES[D-1] + " " + (cy+1) + " (approx.)", opens: nextOpen, closes: nextClose };
    }

    // ---- No opening month — original behaviour -------------------------
    target = new Date(cy, D-1, day, 23, 59, 59);
    if (target < now) {
      target = new Date(cy+1, D-1, day, 23, 59, 59);
    }
    daysLeft = Math.ceil((target - now) / MS_PER_DAY);
    status = daysLeft <= 30 ? "closing" : "open";
    return {
      hasDate: true, status: status,
      daysLeft: daysLeft, date: target,
      label: MONTH_NAMES[D-1] + " " + target.getFullYear() + " (approx.)",
      opens: null, closes: null
    };
  }

  function statusMeta(status) {
    switch (status) {
      case "upcoming": return { text: "Opening soon", cls: "st-upcoming" };
      case "closing": return { text: "Closing soon", cls: "st-closing" };
      case "rolling": return { text: "Rolling", cls: "st-rolling" };
      case "closed": return { text: "Closed", cls: "st-closed" };
      default: return { text: "Open", cls: "st-open" };
    }
  }

  /* ---- Intake seasons derived from the free-text intake field ---------- */
  function intakeSeasons(s) {
    var t = (s.intake || "").toLowerCase();
    var out = [];
    if (/fall|autumn|september|october|michaelmas|august/.test(t)) out.push("Fall / Autumn");
    if (/spring|march|april/.test(t)) out.push("Spring");
    if (/summer|june|july/.test(t)) out.push("Summer");
    if (out.length === 0 || /vary|varies|rolling|multiple|annual/.test(t)) {
      if (out.indexOf("Rolling / Varies") === -1) out.push("Rolling / Varies");
    }
    return out;
  }

  /* ---- Simple derived helpers ----------------------------------------- */
  function feeLabel(s) { return s.isFree ? "Free to apply" : ("Application fee: " + s.applicationFee); }

  function short(text, n) {
    if (!text) return "";
    return text.length > n ? text.slice(0, n - 1).trim() + "…" : text;
  }

  function byId(id) {
    for (var i = 0; i < SCHOLARSHIPS.length; i++) {
      if (SCHOLARSHIPS[i].id === id) return SCHOLARSHIPS[i];
    }
    return null;
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  var COUNTRY_TO_ISO = {
    "australia":"au","italy":"it","united kingdom":"gb","china":"cn","germany":"de",
    "european union":"eu","france":"fr","united states":"us","south korea":"kr",
    "ireland":"ie","netherlands":"nl","saudi arabia":"sa","new zealand":"nz",
    "japan":"jp","romania":"ro","hungary":"hu","sweden":"se","switzerland":"ch",
    "turkiye":"tr","turkey":"tr","canada":"ca","pakistan":"pk","india":"in",
    "spain":"es","portugal":"pt","brazil":"br","mexico":"mx","norway":"no",
    "denmark":"dk","finland":"fi","belgium":"be","austria":"at","poland":"pl",
    "czech republic":"cz","czechia":"cz","russia":"ru","singapore":"sg",
    "malaysia":"my","thailand":"th","philippines":"ph","indonesia":"id",
    "egypt":"eg","south africa":"za","nigeria":"ng","kenya":"ke","ghana":"gh",
    "colombia":"co","argentina":"ar","chile":"cl","peru":"pe","israel":"il",
    "lebanon":"lb","jordan":"jo","qatar":"qa","uae":"ae","united arab emirates":"ae",
    "kuwait":"kw","bahrain":"bh","oman":"om","cyprus":"cy","malta":"mt",
    "greece":"gr","croatia":"hr","serbia":"rs","slovenia":"si","estonia":"ee",
    "latvia":"lv","lithuania":"lt","luxembourg":"lu","iceland":"is","uk":"gb",
    "usa":"us","us":"us","eu":"eu","multiple":"eu"
  };

  function flagImg(country, size) {
    size = size || 20;
    var name = (country || "").toLowerCase().trim();
    var iso = COUNTRY_TO_ISO[name];
    if (!iso) return '<span style="display:inline-block;width:'+size+'px;"></span>';
    return '<img src="https://flagcdn.com/' + size + 'x' + Math.round(size * 0.75) + '/' + iso + '.png" alt="' + escapeHtml(country) + '" style="width:'+size+'px;height:auto;vertical-align:middle;border-radius:2px;">';
  }

  function flagEmoji(country) {
    var name = (country || "").toLowerCase().trim();
    var iso = COUNTRY_TO_ISO[name];
    if (!iso) return "🌍";
    return String.fromCodePoint(
      0x1F1E6 + iso.charCodeAt(0) - 65,
      0x1F1E6 + iso.charCodeAt(1) - 65
    );
  }

  global.SB = {
    data: DATA,
    all: SCHOLARSHIPS,
    meta: DATA.meta || {},
    deadlineInfo: deadlineInfo,
    statusMeta: statusMeta,
    intakeSeasons: intakeSeasons,
    feeLabel: feeLabel,
    short: short,
    byId: byId,
    esc: escapeHtml,
    flagImg: flagImg,
    flagEmoji: flagEmoji,
    monthNames: MONTH_NAMES
  };
})(window);

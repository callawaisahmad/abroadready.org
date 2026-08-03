/* =========================================================================
   AbroadReady — Shared header & footer components
   Injected on every page so the chrome is consistent and maintained in one
   place. No fetch(): works from file:// too. Replaces any existing
   <nav class="navbar"> / <footer class="footer"> with the standard chrome.
   ========================================================================= */
(function () {
  "use strict";

  var inPages = location.pathname.indexOf("/pages/") !== -1;
  var P = inPages ? "" : "pages/";                 // prefix for page files
  var HOME = inPages ? "../" : "/";

  // ---------- LOGO MARK ----------
  var LOGO_MARK = '<svg class="site-logo-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
    '<defs>' +
      '<linearGradient id="arCapG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient>' +
      '<linearGradient id="arSwooshG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#fbbf24"/></linearGradient>' +
    '</defs>' +
    '<path d="M60 18 L96 46 L60 74 L24 46 Z" fill="url(#arCapG)"/>' +
    '<path d="M50 68 L70 68 L65 86 Q60 90 55 86 Z" fill="#2563eb"/>' +
    '<path d="M74 34 Q95 30 99 12" fill="none" stroke="url(#arSwooshG)" stroke-width="7" stroke-linecap="round"/>' +
    '<circle cx="99" cy="12" r="5" fill="#f59e0b"/>' +
  '</svg>';

  // ---------- NAVIGATION ----------
  var NAV = [
    { label: "Home", href: HOME, match: "index.html" },
    { label: "Scholarships", href: P + "results.html", match: "results.html" },
    { label: "Blog", href: P + "blog.html", match: "blog.html" },
    { label: "Resources", children: [
      { label: "SOP Builder", href: P + "sop-builder.html", match: "sop-builder.html" },
      { label: "AI Advisor", href: P + "ai-advisor.html", match: "ai-advisor.html" },
      { label: "Visa Guidance", href: P + "visa-guidance.html", match: "visa-guidance.html" },
      { label: "Admission Guidance", href: P + "admission-guidance.html", match: "admission-guidance.html" },
      { label: "IELTS Guidance", href: P + "ielts-guidance.html", match: "ielts-guidance.html" }
    ]},
    { label: "Study Abroad", href: P + "study.html", match: "study.html", children: [
      { label: "All Study Abroad Destinations", href: P + "study.html", match: "study.html" },
      { label: "Study in USA", href: P + "study-in-usa.html", match: "study-in-usa.html" },
      { label: "Study in UK", href: P + "study-in-uk.html", match: "study-in-uk.html" },
      { label: "Study in Canada", href: P + "study-in-canada.html", match: "study-in-canada.html" },
      { label: "Study in Germany", href: P + "study-in-germany.html", match: "study-in-germany.html" },
      { label: "Study in Australia", href: P + "study-in-australia.html", match: "study-in-australia.html" },
      { label: "Study in France", href: P + "study-in-france.html", match: "study-in-france.html" },
      { label: "Study in Italy", href: P + "study-in-italy.html", match: "study-in-italy.html" },
      { label: "Study in Netherlands", href: P + "study-in-netherlands.html", match: "study-in-netherlands.html" },
      { label: "Study in Sweden", href: P + "study-in-sweden.html", match: "study-in-sweden.html" },
      { label: "Study in Switzerland", href: P + "study-in-switzerland.html", match: "study-in-switzerland.html" },
      { label: "Study in Spain", href: P + "study-in-spain.html", match: "study-in-spain.html" },
      { label: "Study in Ireland", href: P + "study-in-ireland.html", match: "study-in-ireland.html" },
      { label: "Study in New Zealand", href: P + "study-in-new-zealand.html", match: "study-in-new-zealand.html" },
      { label: "Study in Turkey", href: P + "study-in-turkey.html", match: "study-in-turkey.html" }
    ]},
    { label: "Immigration", href: P + "immigration.html", match: "immigration.html", children: [
      { label: "All Immigration Guides", href: P + "immigration.html", match: "immigration.html" },
      { label: "Immigrate to USA", href: P + "immigrate-to-usa.html", match: "immigrate-to-usa.html" },
      { label: "Immigrate to Canada", href: P + "immigrate-to-canada.html", match: "immigrate-to-canada.html" },
      { label: "Immigrate to UK", href: P + "immigrate-to-uk.html", match: "immigrate-to-uk.html" },
      { label: "Immigrate to Germany", href: P + "immigrate-to-germany.html", match: "immigrate-to-germany.html" },
      { label: "Immigrate to Australia", href: P + "immigrate-to-australia.html", match: "immigrate-to-australia.html" },
      { label: "Immigrate to France", href: P + "immigrate-to-france.html", match: "immigrate-to-france.html" },
      { label: "Immigrate to Italy", href: P + "immigrate-to-italy.html", match: "immigrate-to-italy.html" },
      { label: "Immigrate to Netherlands", href: P + "immigrate-to-netherlands.html", match: "immigrate-to-netherlands.html" },
      { label: "Immigrate to New Zealand", href: P + "immigrate-to-new-zealand.html", match: "immigrate-to-new-zealand.html" },
      { label: "Immigrate to Spain", href: P + "immigrate-to-spain.html", match: "immigrate-to-spain.html" },
      { label: "Immigrate to Sweden", href: P + "immigrate-to-sweden.html", match: "immigrate-to-sweden.html" },
      { label: "Immigrate to Switzerland", href: P + "immigrate-to-switzerland.html", match: "immigrate-to-switzerland.html" },
      { label: "Immigrate to Turkey", href: P + "immigrate-to-turkey.html", match: "immigrate-to-turkey.html" },
      { label: "Immigrate to Ireland", href: P + "immigrate-to-ireland.html", match: "immigrate-to-ireland.html" }
    ]},
    { label: "About", href: P + "about.html", match: "about.html" }
  ];

  var current = location.pathname.split("/").pop() || "index.html";
  function activeCls(match) { return current === match ? " active" : ""; }

  var savedHref = P + "saved.html";

  // ---------- HEADER ----------
  function navItem(item) {
    if (item.children) {
      var isActive = item.children.some(function (c) { return current === c.match; }) || current === item.match;
      var cls = "site-link site-link-drop" + (isActive ? " active" : "");
      var children = item.children.map(function (c) {
        return '<a href="' + c.href + '" class="site-drop-link' + activeCls(c.match) + '">' + c.label + "</a>";
      }).join("");
      var toggle;
      var wide = item.children.length > 7 ? " site-drop-wide" : "";
      if (item.href) {
        // Parent has a real page: label navigates, caret toggles the menu.
        toggle = '<a href="' + item.href + '" class="' + cls + '">' + item.label + '</a>' +
                 '<button class="site-caret site-caret-btn" aria-label="Open ' + item.label + ' menu" aria-haspopup="true" aria-expanded="false">▾</button>';
      } else {
        // Resources: no page, the whole label toggles the menu.
        toggle = '<a href="javascript:void(0)" class="' + cls + ' site-drop-toggle" role="button" aria-haspopup="true" aria-expanded="false">' + item.label + ' <span class="site-caret">▾</span></a>';
      }
      return '<div class="site-nav-item' + (isActive ? " active" : "") + '">' +
        toggle +
        '<div class="site-drop' + wide + '">' + children + "</div>" +
      "</div>";
    }
    return '<a href="' + item.href + '" class="site-link' + activeCls(item.match) + '">' + item.label + "</a>";
  }

  function headerHTML() {
    var links = NAV.map(navItem).join("");
    var mobileLinks = NAV.map(function (n) {
      if (n.children) {
        var kids = n.children.map(function (c) {
          return '<a href="' + c.href + '" class="site-mlink site-msub' + activeCls(c.match) + '">' + c.label + "</a>";
        }).join("");
        return '<span class="site-mlabel">' + n.label + "</span>" + kids;
      }
      return '<a href="' + n.href + '" class="site-mlink' + activeCls(n.match) + '">' + n.label + "</a>";
    }).join("");
    return '' +
    '<header class="site-header" id="site-header-el">' +
      '<div class="site-header-inner container">' +
          '<a href="' + HOME + '" class="site-logo"><span class="site-logo-icon">' + LOGO_MARK + '</span><span class="site-logo-text">Abroad<span class="text-gradient">Ready</span></span></a>' +
        '<nav class="site-nav">' + links + '</nav>' +
        '<div class="site-actions">' +
          '<a href="' + savedHref + '" class="site-saved" id="site-saved" title="Saved scholarships">♥ <span id="site-saved-count">0</span></a>' +
          '<a href="' + P + 'results.html" class="btn btn-primary btn-sm site-cta">Find Scholarships</a>' +
          '<button class="site-burger" id="site-burger" aria-label="Menu"><span></span><span></span><span></span></button>' +
        '</div>' +
      '</div>' +
    '</header>' +
    '<div class="site-mobile" id="site-mobile"><div class="site-mobile-inner">' +
      mobileLinks +
      '<a href="' + savedHref + '" class="site-mlink">♥ Saved</a>' +
      '<a href="' + P + 'results.html" class="btn btn-primary w-full" style="margin-top:12px;">Find Scholarships</a>' +
    '</div></div>';
  }

  // ---------- FOOTER ----------
  function footerHTML() {
    return '' +
    '<footer class="site-footer">' +
      '<div class="container site-footer-grid">' +
        '<div class="site-footer-brand">' +
        '<a href="' + HOME + '" class="site-logo"><span class="site-logo-icon">' + LOGO_MARK + '</span><span class="site-logo-text">Abroad<span class="text-gradient">Ready</span></span></a>' +
          '<p class="site-footer-tag">A free scholarship board — find funding, deadlines, eligibility and how to apply, all in one place.</p>' +
          '<div class="site-social">' +
            socialIcon("Facebook", "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6 4.39 10.97 10.13 11.85v-8.38H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.95h-1.52c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8V24C19.61 23.04 24 18.07 24 12.07z") +
            socialIcon("Twitter", "M18.24 2.25h3.3l-7.22 8.26L23 21.75h-6.63l-5.2-6.82-5.95 6.82H1.9l7.73-8.84L1 2.25h6.79l4.7 6.23zM17.1 19.77h1.83L7.03 4.13H5.06z") +
            socialIcon("LinkedIn", "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.44-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 11 0-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z") +
            socialIcon("Instagram", "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.4 3.94 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z") +
          '</div>' +
        '</div>' +
        footerCol("Quick Links", [
          ["Home", HOME],
          ["Scholarships", P + "results.html"],
          ["AI Advisor", P + "ai-advisor.html"],
          ["SOP Builder", P + "sop-builder.html"],
          ["IELTS Guidance", P + "ielts-guidance.html"],
          ["Saved", savedHref]
        ]) +
        footerCol("Study Abroad", [
          ["Study in USA", P + "study-in-usa.html"], ["Study in UK", P + "study-in-uk.html"],
          ["Study in Canada", P + "study-in-canada.html"],           ["Study in Germany", P + "study-in-germany.html"],
          ["All Study Destinations", P + "study.html"]
        ]) +
        footerCol("Immigration", [
          ["Immigrate to USA", P + "immigrate-to-usa.html"], ["Immigrate to Canada", P + "immigrate-to-canada.html"],
          ["Immigrate to UK", P + "immigrate-to-uk.html"], ["Immigrate to Germany", P + "immigrate-to-germany.html"],
          ["All Immigration Guides", P + "immigration.html"]
        ]) +
        footerCol("Company", [
          ["About", P + "about.html"], ["Contact", P + "contact.html"],
          ["Privacy Policy", P + "privacy.html"], ["Terms of Service", P + "terms.html"],
          ["Admission Guidance", P + "admission-guidance.html"]
        ]) +
      '</div>' +
      '<div class="container site-footer-bottom">' +
        '<p>© <span class="site-footer-year"></span> AbroadReady.org — a free scholarship board.</p>' +
        '<p class="site-footer-note">Always confirm deadlines and details on the official scholarship website before applying.</p>' +
        '<p class="site-footer-note" id="site-footer-version" style="margin-top:6px;opacity:0.6;">Loading version…</p>' +
      '</div>' +
    '</footer>';
  }

  function footerCol(title, links) {
    return '<div class="site-footer-col"><h5>' + title + "</h5>" +
      links.map(function (l) { return '<a href="' + l[1] + '">' + l[0] + "</a>"; }).join("") + "</div>";
  }
  function socialIcon(label, path) {
    return '<span class="site-social-link" aria-label="' + label + '" title="' + label + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="' + path + '"/></svg></span>';
  }

  // ---------- MOUNT ----------
  function mount() {
    // Header: replace an existing top nav if present, else insert at body top.
    var oldNav = document.querySelector("nav.navbar, header.site-header");
    var headerWrap = document.createElement("div");
    headerWrap.innerHTML = headerHTML();
    if (oldNav) {
      // insert new nodes before oldNav, then remove it
      while (headerWrap.firstChild) oldNav.parentNode.insertBefore(headerWrap.firstChild, oldNav);
      oldNav.parentNode.removeChild(oldNav);
    } else {
      document.body.insertBefore(headerWrap, document.body.firstChild);
      while (headerWrap.firstChild) document.body.insertBefore(headerWrap.firstChild, headerWrap);
      headerWrap.remove && headerWrap.remove();
    }
    // Remove leftover legacy mobile menu from the old landing markup.
    var legacyMobile = document.getElementById("mobile-menu");
    if (legacyMobile) legacyMobile.remove();

    // Footer: replace an existing footer if present, else append.
    var oldFooter = document.querySelector("footer.footer, footer.site-footer");
    var footerWrap = document.createElement("div");
    footerWrap.innerHTML = footerHTML();
    if (oldFooter) {
      while (footerWrap.firstChild) oldFooter.parentNode.insertBefore(footerWrap.firstChild, oldFooter);
      oldFooter.parentNode.removeChild(oldFooter);
    } else {
      while (footerWrap.firstChild) document.body.appendChild(footerWrap.firstChild);
    }

    // Footer year
    var yearEl = document.querySelector(".site-footer-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Footer version
    var versionUrl = (inPages ? "../" : "") + "data/version.json";
    fetch(versionUrl)
      .then(function(r) { return r.json(); })
      .then(function(v) {
        var el = document.getElementById("site-footer-version");
        if (el) {
          var d = new Date(v.date);
          var pkt = new Date(d.getTime() + 5 * 60 * 60 * 1000);
          var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          var pad = function(n) { return n < 10 ? "0" + n : n; };
          var formatted = pkt.getUTCDate() + " " + months[pkt.getUTCMonth()] + " " + pkt.getUTCFullYear() + ", " +
            pad(pkt.getUTCHours()) + ":" + pad(pkt.getUTCMinutes());
          el.textContent = "Build #" + v.build + " \u00b7 Last updated: " + formatted + " PKT";
        }
      })
      .catch(function() {
        var el = document.getElementById("site-footer-version");
        if (el) el.textContent = "Last updated: 3 August 2026, 15:32 PKT";
      });

    wire();
  }

  function wire() {
    // Mobile menu toggle
    var burger = document.getElementById("site-burger");
    var mobile = document.getElementById("site-mobile");
    if (burger && mobile) {
      burger.addEventListener("click", function () {
        var open = mobile.classList.toggle("open");
        burger.classList.toggle("is-open", open);
        document.body.style.overflow = open ? "hidden" : "";
      });
      mobile.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          mobile.classList.remove("open"); burger.classList.remove("is-open"); document.body.style.overflow = "";
        });
      });
    }
    // Desktop dropdown: caret / label toggle opens on click (touch), hover via CSS.
    document.querySelectorAll(".site-nav-item").forEach(function (item) {
      var toggle = item.querySelector(".site-drop-toggle, .site-caret-btn");
      if (!toggle) return;
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        item.classList.toggle("open");
        var exp = item.classList.contains("open");
        item.querySelectorAll("[aria-expanded]").forEach(function (el) { el.setAttribute("aria-expanded", exp ? "true" : "false"); });
      });
      item.addEventListener("mouseleave", function () { item.classList.remove("open"); });
    });
    // Keep dropdowns horizontally inside the viewport (right-edge safe).
    document.querySelectorAll(".site-nav-item").forEach(function (item) {
      var drop = item.querySelector(".site-drop");
      if (!drop) return;
      var alignDrop = function () {
        var dw = drop.offsetWidth;
        if (!dw) return;
        var r = item.getBoundingClientRect();
        var nat = r.left + r.width / 2 - dw / 2;
        var left = Math.max(12, Math.min(nat, window.innerWidth - dw - 12));
        drop.style.marginLeft = (left - nat) + "px";
      };
      alignDrop();
      window.addEventListener("resize", alignDrop);
      window.addEventListener("scroll", alignDrop, { passive: true });
    });
    // Close any open dropdown when clicking elsewhere.
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".site-nav-item")) {
        document.querySelectorAll(".site-nav-item.open").forEach(function (i) { i.classList.remove("open"); });
      }
    });
    // Sticky shadow on scroll
    var header = document.getElementById("site-header-el");
    if (header) {
      var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
      window.addEventListener("scroll", onScroll); onScroll();
    }
    // Saved badge
    updateSavedBadge();
    if (window.Saved && window.Saved.onChange) window.Saved.onChange(updateSavedBadge);
  }

  function updateSavedBadge() {
    var el = document.getElementById("site-saved-count");
    var wrap = document.getElementById("site-saved");
    if (!el || !window.Saved) return;
    var n = window.Saved.count();
    el.textContent = n;
    if (wrap) wrap.classList.toggle("has-saved", n > 0);
  }

  // components.js is injected at the end of <body>, so the DOM above is already
  // parsed — mount immediately to avoid a flash of the old markup.
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();

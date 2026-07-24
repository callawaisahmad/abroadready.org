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
  var HOME = inPages ? "../index.html" : "index.html";

  var NAV = [
    { label: "Scholarships", href: P + "results.html", match: "results.html" },
    { label: "AI Advisor", href: P + "ai-advisor.html", match: "ai-advisor.html" },
    { label: "SOP Builder", href: P + "sop-builder.html", match: "sop-builder.html" },
    { label: "Success", href: P + "success.html", match: "success.html" },
    { label: "Blog", href: P + "blog.html", match: "blog.html" },
    { label: "For Universities", href: P + "partners.html", match: "partners.html" }
  ];

  var current = location.pathname.split("/").pop() || "index.html";
  function activeCls(match) { return current === match ? " active" : ""; }

  var savedHref = P + "saved.html";

  // ---------- HEADER ----------
  function headerHTML() {
    var links = NAV.map(function (n) {
      return '<a href="' + n.href + '" class="site-link' + activeCls(n.match) + '">' + n.label + "</a>";
    }).join("");
    var mobileLinks = NAV.map(function (n) {
      return '<a href="' + n.href + '" class="site-mlink' + activeCls(n.match) + '">' + n.label + "</a>";
    }).join("");
    return '' +
    '<header class="site-header" id="site-header-el">' +
      '<div class="site-header-inner container">' +
        '<a href="' + HOME + '" class="site-logo"><span class="site-logo-icon">🎓</span><span class="site-logo-text">Abroad<span class="text-gradient">Ready</span></span></a>' +
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
          '<a href="' + HOME + '" class="site-logo"><span class="site-logo-icon">🎓</span><span class="site-logo-text">Abroad<span class="text-gradient">Ready</span></span></a>' +
          '<p class="site-footer-tag">A free scholarship board — find funding, deadlines, eligibility and how to apply, all in one place.</p>' +
          '<div class="site-social">' +
            socialIcon("Facebook", "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6 4.39 10.97 10.13 11.85v-8.38H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.95h-1.52c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8V24C19.61 23.04 24 18.07 24 12.07z") +
            socialIcon("Twitter", "M18.24 2.25h3.3l-7.22 8.26L23 21.75h-6.63l-5.2-6.82-5.95 6.82H1.9l7.73-8.84L1 2.25h6.79l4.7 6.23zM17.1 19.77h1.83L7.03 4.13H5.06z") +
            socialIcon("LinkedIn", "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.44-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 11 0-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z") +
            socialIcon("Instagram", "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.4 3.94 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z") +
          '</div>' +
        '</div>' +
        footerCol("Platform", [
          ["Scholarship Quiz", HOME + "#quiz"],           ["Scholarships", P + "results.html"],
          ["AI Advisor", P + "ai-advisor.html"], ["SOP Builder", P + "sop-builder.html"], ["Saved", savedHref]
        ]) +
        footerCol("Resources", [
          ["Blog", P + "blog.html"], ["Success Stories", P + "success.html"],
          ["SOP Samples", P + "sop-builder.html"], ["Interview Tips", P + "blog.html"]
        ]) +
        footerCol("Company", [
          ["About Us", P + "about.html"], ["Partner With Us", P + "partners.html"],
          ["Contact", P + "contact.html"], ["Privacy Policy", P + "privacy.html"], ["Terms of Service", P + "terms.html"]
        ]) +
      '</div>' +
      '<div class="container site-footer-bottom">' +
        '<p>© <span class="site-footer-year"></span> AbroadReady.org — a free scholarship board.</p>' +
        '<p class="site-footer-note">Always confirm deadlines and details on the official scholarship website before applying.</p>' +
        '<p class="site-footer-note" style="margin-top:6px;opacity:0.6;">Last updated: 24 July 2026, 3:26 PM PKT</p>' +
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

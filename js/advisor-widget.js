/* =========================================================================
   AbroadReady — sticky "Need to-the-point help?" AI Advisor widget
   Loaded on every page (via js/components.js). Self-skipping on the full
   ai-advisor page. Lazy-loads the advisor engine on first open.
   ========================================================================= */
(function () {
  "use strict";

  // Skip on the full advisor page (it already has a native chat).
  if (location.pathname.indexOf("ai-advisor") !== -1) return;
  if (document.getElementById("chat-messages")) return;

  var inPages = location.pathname.indexOf("/pages/") !== -1;
  var JS = (inPages ? "../" : "") + "js/";

  var ROBOT_SVG = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4.5" y="8" width="15" height="11" rx="3.5" fill="currentColor"/><rect x="6.2" y="9.8" width="11.6" height="1.4" rx="0.7" fill="rgba(255,255,255,0.35)"/><circle cx="9.5" cy="13.6" r="1.6" fill="#fff"/><circle cx="14.5" cy="13.6" r="1.6" fill="#fff"/><rect x="10.4" y="16" width="3.2" height="1.3" rx="0.65" fill="#fff"/><path d="M12 8V5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="4.2" r="1.5" fill="currentColor"/></svg>';

  var CSS = "" +
    '.arw-fab{position:fixed;right:22px;bottom:22px;z-index:2147483000;width:58px;height:58px;border:none;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 28px -6px rgba(59,130,246,.55),0 0 0 6px rgba(59,130,246,.12);transition:transform .18s ease,box-shadow .18s ease}' +
    '.arw-fab:hover{transform:translateY(-3px) scale(1.05);box-shadow:0 16px 34px -8px rgba(139,92,246,.6),0 0 0 8px rgba(139,92,246,.14)}' +
    '.arw-fab .arw-fab-ico{width:30px;height:30px}' +
    '.arw-fab .arw-on{position:absolute;top:2px;right:2px;width:12px;height:12px;border-radius:50%;background:#34d399;border:2px solid #fff}' +
    '.arw-tip{position:fixed;right:92px;bottom:34px;z-index:2147483000;background:#fff;color:#0f172a;font-family:Inter,system-ui,sans-serif;font-size:.82rem;line-height:1.4;padding:10px 14px;border-radius:14px 14px 2px 14px;box-shadow:0 12px 30px -8px rgba(15,23,42,.28);border:1px solid #e2e8f0;max-width:230px;opacity:0;transform:translateY(6px);pointer-events:none;transition:opacity .25s ease,transform .25s ease}' +
    '.arw-tip.on{opacity:1;transform:translateY(0);pointer-events:auto}' +
    '.arw-tip b{color:#2563eb}' +
    '.arw-tip-x{position:absolute;top:6px;right:8px;border:none;background:none;color:#94a3b8;cursor:pointer;font-size:.8rem;padding:2px 4px}' +
    '.arw-panel{position:fixed;right:22px;bottom:92px;z-index:2147483001;width:370px;max-height:min(600px,calc(100vh - 120px));display:flex;flex-direction:column;background:#fff;border-radius:22px;box-shadow:0 28px 60px -12px rgba(15,23,42,.35);border:1px solid #eef2f7;overflow:hidden;opacity:0;transform:translateY(14px) scale(.98);pointer-events:none;transition:opacity .2s ease,transform .2s ease;font-family:Inter,system-ui,sans-serif}' +
    '.arw-panel.on{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}' +
    '.arw-head{display:flex;align-items:center;gap:11px;padding:14px 16px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;flex-shrink:0}' +
    '.arw-head-ico{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
    '.arw-head-ico svg{width:22px;height:22px;color:#fff}' +
    '.arw-head-title{font-weight:800;font-size:.95rem;line-height:1.2}' +
    '.arw-head-sub{font-size:.7rem;opacity:.92;display:flex;align-items:center;gap:5px;margin-top:2px}' +
    '.arw-dot{width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,.3)}' +
    '.arw-close{margin-left:auto;border:none;background:rgba(255,255,255,.18);color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:.85rem;line-height:1;flex-shrink:0}' +
    '.arw-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f8fafc;scrollbar-width:thin;scrollbar-color:#c7d2fe transparent}' +
    '.arw-msgs::-webkit-scrollbar{width:7px}.arw-msgs::-webkit-scrollbar-thumb{background:#c7d2fe;border-radius:8px}' +
    '.arw-msg{display:flex;gap:8px;max-width:92%}' +
    '.arw-msg.arw-user{align-self:flex-end;flex-direction:row-reverse}' +
    '.arw-ico{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}' +
    '.arw-ico svg{width:15px;height:15px;color:#fff}' +
    '.arw-bub{background:#fff;border:1px solid #e2e8f0;border-radius:14px 14px 14px 2px;padding:9px 12px;font-size:.8rem;line-height:1.5;color:#0f172a;box-shadow:0 2px 8px -2px rgba(15,23,42,.08)}' +
    '.arw-msg.arw-user .arw-bub{background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;border:none;border-radius:14px 14px 2px 14px}' +
    '.arw-bub p{margin:0 0 6px}.arw-bub p:last-child{margin-bottom:0}' +
    '.arw-bub ul{margin:0 0 6px;padding-left:18px}.arw-bub ul:last-child{margin-bottom:0}' +
    '.arw-bub a{color:#2563eb;font-weight:600;text-decoration:none}.arw-bub a:hover{text-decoration:underline}' +
    '.arw-msg.arw-user .arw-bub a{color:#dbeafe}' +
    '.arw-typing{display:inline-flex;align-items:center;gap:4px;padding:2px 0}' +
    '.arw-typing span{width:6px;height:6px;background:#a5b4fc;border-radius:50%;animation:arwBounce 1.4s infinite ease-in-out both}' +
    '.arw-typing span:nth-child(2){animation-delay:-.16s}.arw-typing span:nth-child(3){animation-delay:-.32s}' +
    '@keyframes arwBounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}' +
    '.arw-msgs .msg-lead{border-left:3px solid #3b82f6;padding-left:10px}' +
    '.arw-msgs .msg-extra{margin-top:10px;padding-top:8px;border-top:1px dashed #d8dee9}' +
    '.arw-msgs .chat-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}' +
    '.arw-msgs .chat-card{background:#fff;border:1.5px solid rgba(20,184,166,.18);border-radius:12px;padding:10px;position:relative;overflow:hidden}' +
    '.arw-msgs .chat-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(135deg,#14b8a6,#2dd4bf)}' +
    '.arw-msgs .cc-top{display:flex;align-items:center;gap:6px;margin-bottom:5px}' +
    '.arw-msgs .cc-flag{display:flex;align-items:center}.arw-msgs .cc-flag img{border-radius:2px}' +
    '.arw-msgs .cc-status{font-size:.58rem;font-weight:700;text-transform:uppercase;padding:1px 6px;border-radius:999px}' +
    '.arw-msgs .cc-status.st-open{background:rgba(16,185,129,.12);color:#047857}' +
    '.arw-msgs .cc-status.st-closing{background:rgba(244,63,94,.12);color:#be123c}' +
    '.arw-msgs .cc-status.st-rolling{background:rgba(139,92,246,.12);color:#6d28d9}' +
    '.arw-msgs .cc-status.st-closed{background:rgba(107,114,128,.12);color:#4b5563}' +
    '.arw-msgs .cc-status.st-upcoming{background:rgba(245,158,11,.12);color:#92400e}' +
    '.arw-msgs .cc-heart{margin-left:auto;border:none;background:none;cursor:pointer;font-size:1.1rem;color:#cbd5e1;line-height:1}' +
    '.arw-msgs .cc-heart:hover,.arw-msgs .cc-heart.is-saved{color:#f43f5e}' +
    '.arw-msgs .cc-name{font-weight:700;font-size:.74rem;color:#0f172a;line-height:1.25;margin-bottom:3px}' +
    '.arw-msgs .cc-meta{font-size:.68rem;color:#64748b;margin-bottom:6px}' +
    '.arw-msgs .cc-link{font-size:.7rem;font-weight:700;color:#2563eb;text-decoration:none}' +
    '.arw-msgs .cc-link:hover{text-decoration:underline}' +
    '.arw-chips{display:flex;gap:6px;overflow-x:auto;padding:10px 14px 0;background:#f8fafc;scrollbar-width:none}' +
    '.arw-chips::-webkit-scrollbar{display:none}' +
    '.arw-chip{white-space:nowrap;font-size:.72rem;font-weight:600;color:#4f46e5;background:#fff;border:1.5px solid rgba(99,102,241,.25);border-radius:999px;padding:6px 11px;cursor:pointer;transition:all .15s ease;flex-shrink:0}' +
    '.arw-chip:hover{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;border-color:transparent}' +
    '.arw-foot{padding:12px 14px;background:#fff;border-top:1px solid #eef2f7;flex-shrink:0}' +
    '.arw-input-wrap{display:flex;align-items:center;gap:8px}' +
    '.arw-input-wrap input{flex:1;border:1.5px solid #e2e8f0;border-radius:999px;padding:10px 14px;font-size:.82rem;font-family:inherit;outline:none;transition:border .15s ease}' +
    '.arw-input-wrap input:focus{border-color:#3b82f6}' +
    '.arw-input-wrap button{width:36px;height:36px;border:none;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:.95rem;cursor:pointer;flex-shrink:0}' +
    '.arw-go{display:flex;align-items:center;justify-content:space-between;margin-top:9px}' +
    '.arw-go-open{font-size:.72rem;font-weight:700;color:#2563eb;text-decoration:none}' +
    '.arw-go-open:hover{text-decoration:underline}' +
    '.arw-go-close{border:none;background:none;font-size:.72rem;color:#94a3b8;cursor:pointer;padding:2px 6px}' +
    '@media (max-width:480px){.arw-panel{right:10px;left:10px;bottom:86px;width:auto;max-height:calc(100vh - 100px)}.arw-fab{right:16px;bottom:16px}.arw-tip{right:80px}}';

  function injectCSS() {
    var s = document.createElement("style");
    s.id = "arw-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---------- DOM ----------
  function build() {
    var fab = document.createElement("button");
    fab.id = "arw-fab";
    fab.className = "arw-fab";
    fab.setAttribute("aria-label", "Open AbroadReady AI Advisor");
    fab.innerHTML = '<span class="arw-fab-ico">' + ROBOT_SVG + '</span><span class="arw-on"></span>';

    var tip = document.createElement("div");
    tip.id = "arw-tip";
    tip.className = "arw-tip";
    tip.innerHTML = '<b>Need to-the-point help?</b><br>Ask the AI about scholarships, visas, PR or IELTS.<button class="arw-tip-x" aria-label="Dismiss">✕</button>';

    var panel = document.createElement("div");
    panel.id = "arw-panel";
    panel.className = "arw-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "AI Advisor");
    panel.innerHTML = "" +
      '<div class="arw-head">' +
        '<div class="arw-head-ico">' + ROBOT_SVG + "</div>" +
        '<div><div class="arw-head-title">AbroadReady AI Advisor</div>' +
        '<div class="arw-head-sub"><span class="arw-dot"></span>Online · free · to-the-point answers</div></div>' +
        '<button class="arw-close" aria-label="Close">✕</button>' +
      "</div>" +
      '<div class="arw-msgs" id="arw-msgs"></div>' +
      '<div class="arw-chips" id="arw-chips"></div>' +
      '<div class="arw-foot">' +
        '<div class="arw-input-wrap"><input id="arw-input" type="text" placeholder="Ask about scholarships, visas, PR…" aria-label="Ask the AI Advisor"><button id="arw-send" aria-label="Send">➤</button></div>' +
        '<div class="arw-go"><a class="arw-go-open" href="' + (inPages ? "" : "pages/") + 'ai-advisor.html#widget">Open full advisor →</a>' +
        '<button class="arw-go-close">Close</button></div>' +
      "</div>";

    document.body.appendChild(fab);
    document.body.appendChild(tip);
    document.body.appendChild(panel);
    return { fab: fab, tip: tip, panel: panel };
  }

  // ---------- engine lazy-load ----------
  var loaded = false;
  var pending = [];
  function loadEngine(cb) {
    if (window.ADVISOR) { loaded = true; cb(); return; }
    pending.push(cb);
    if (loaded) return;
    loaded = true;
    var queue = [];
    if (!window.SB) queue.push("scholarships-data.js", "scholarships.js");
    if (!window.IMM) queue.push("immigration-data.js");
    if (!window.ADVISOR) queue.push("advisor.js");
    (function next() {
      if (!queue.length) { pending.splice(0).forEach(function (f) { f(); }); return; }
      var s = document.createElement("script");
      s.src = JS + queue.shift();
      s.async = false;
      s.onload = s.onerror = next;
      document.head.appendChild(s);
    })();
  }

  // ---------- messages ----------
  var msgsEl, chipsEl, inputEl, panelEl, fabEl, tipEl;

  function scrollDown() { msgsEl.scrollTop = msgsEl.scrollHeight; }

  function wireHearts(wrap) {
    if (!window.Saved) return;
    var btns = wrap.querySelectorAll(".cc-heart");
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var on = window.Saved.toggle(btn.getAttribute("data-save"));
          btn.classList.toggle("is-saved", on);
          btn.textContent = on ? "\u2665" : "\u2661";
        });
      })(btns[i]);
    }
  }

  // Advisor answers link to page files (scholarship.html, immigrate-to-x.html)
  // that live under /pages/. On root-level pages we must prefix them.
  function fixLinks(html) {
    if (inPages) return html;
    return html.replace(/href="(?![^"]*(?:https?:|#|\/|\.\.\/|mailto:|tel:))/g, 'href="pages/');
  }

  function msg(role, html) {
    var wrap = document.createElement("div");
    wrap.className = "arw-msg " + (role === "user" ? "arw-user" : "arw-ai");
    wrap.innerHTML = (role === "user" ? "" : '<div class="arw-ico">' + ROBOT_SVG + "</div>") + '<div class="arw-bub">' + fixLinks(html) + "</div>";
    msgsEl.appendChild(wrap);
    wireHearts(wrap);
    scrollDown();
    return wrap;
  }

  function open() {
    panelEl.classList.add("on");
    fabEl.classList.add("on");
    document.addEventListener("keydown", onKey);
    if (!window.ADVISOR && !firstOpening) {
      firstOpening = true;
      var typing = msg("ai", '<span class="arw-typing"><span></span><span></span><span></span></span>');
      loadEngine(function () {
        typing.remove();
        greet();
      });
    }
  }
  var firstOpening = false;

  function greet() {
    if (!msgsEl.children.length) msg("ai", window.ADVISOR.renderAnswer(window.ADVISOR.greeting()));
  }

  function close() {
    panelEl.classList.remove("on");
    fabEl.classList.remove("on");
    document.removeEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  function send() {
    var val = inputEl.value.trim();
    if (!val) return;
    msg("user", "<p>" + window.ADVISOR.esc(val) + "</p>");
    inputEl.value = "";
    var typing = msg("ai", '<span class="arw-typing"><span></span><span></span><span></span></span>');
    setTimeout(function () {
      typing.remove();
      msg("ai", window.ADVISOR.renderAnswer(window.ADVISOR.answer(val)));
    }, 420 + Math.random() * 380);
  }

  function showChips() {
    if (!window.ADVISOR) return;
    var list = window.ADVISOR.chips.slice(0, 4);
    chipsEl.innerHTML = list.map(function (t) {
      return '<button type="button" class="arw-chip" data-arw-chip="1">' + window.ADVISOR.esc(t) + "</button>";
    }).join("");
  }

  // ---------- init ----------
  function init() {
    injectCSS();
    var els = build();
    fabEl = els.fab; tipEl = els.tip; panelEl = els.panel;
    msgsEl = document.getElementById("arw-msgs");
    chipsEl = document.getElementById("arw-chips");
    inputEl = document.getElementById("arw-input");

    fabEl.addEventListener("click", function () {
      var isOpen = panelEl.classList.contains("on");
      if (isOpen) { close(); return; }
      open();
      if (window.ADVISOR) { greet(); showChips(); }
      else loadEngine(function () { showChips(); setTimeout(function () { inputEl.focus(); }, 60); });
      setTimeout(function () { inputEl.focus(); }, 60);
    });

    panelEl.querySelector(".arw-close").addEventListener("click", close);
    panelEl.querySelector(".arw-go-close").addEventListener("click", close);
    document.getElementById("arw-send").addEventListener("click", send);
    inputEl.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

    document.getElementById("arw-chips").addEventListener("click", function (e) {
      var chip = e.target.closest("[data-arw-chip]");
      if (!chip) return;
      inputEl.value = chip.textContent.trim();
      send();
    });

    // dismiss tooltip
    tipEl.querySelector(".arw-tip-x").addEventListener("click", function (e) {
      e.stopPropagation();
      tipEl.classList.remove("on");
      try { sessionStorage.setItem("arw-tip-dismissed", "1"); } catch (err) {}
    });

    // click outside closes panel
    document.addEventListener("click", function (e) {
      if (!panelEl.classList.contains("on")) return;
      if (e.target.closest("#arw-panel") || e.target.closest("#arw-fab")) return;
      close();
    });

    // entrance tooltip
    var dismissed = false;
    try { dismissed = sessionStorage.getItem("arw-tip-dismissed") === "1"; } catch (err) {}
    if (!dismissed) {
      setTimeout(function () {
        tipEl.classList.add("on");
        setTimeout(function () { tipEl.classList.remove("on"); }, 9000);
      }, 1300);
    }
  }

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();

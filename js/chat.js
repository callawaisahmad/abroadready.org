/* =========================================================================
   AbroadReady — AI Advisor page chat UI (thin layer over js/advisor.js)
   Loaded only on pages/ai-advisor.html after scholarships-data.js,
   scholarships.js, immigration-data.js and advisor.js.
   ========================================================================= */
(function () {
  "use strict";

  var msgs = document.getElementById("chat-messages");
  var input = document.getElementById("chat-input");
  if (!msgs || !input || !window.ADVISOR) return;

  var SB = window.SB;
  var A = window.ADVISOR;
  var IMM = window.IMM;

  // ---------- sidebar context (from real data) ----------
  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  setText("ctx-count", SB && SB.all ? SB.all.length : 500);
  setText("ctx-countries", SB && SB.meta && (SB.meta.countryCount || "20+"));
  setText("ctx-imm", IMM ? (IMM.count + 14) : 27);

  // ---------- chips ----------
  function chipHTML(list) {
    return list.map(function (t) {
      return '<button type="button" class="quick-chip" data-quick="1">' + A.esc(t) + "</button>";
    }).join("");
  }
  var sideChips = document.getElementById("ai-side-chips");
  if (sideChips) sideChips.innerHTML = chipHTML(A.chips);

  // ---------- bubbles ----------
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

  function bubble(role, html) {
    var wrap = document.createElement("div");
    wrap.className = "message " + (role === "user" ? "user-message" : "ai-message") + " animate-fade-in-up";
    var avatar = role === "user"
      ? ""
      : '<div class="msg-avatar"><svg class="robo" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4.5" y="8" width="15" height="11" rx="3.5" fill="currentColor"/><rect x="6.2" y="9.8" width="11.6" height="1.4" rx="0.7" fill="rgba(255,255,255,0.35)"/><circle cx="9.5" cy="13.6" r="1.6" fill="#fff"/><circle cx="14.5" cy="13.6" r="1.6" fill="#fff"/><rect x="10.4" y="16" width="3.2" height="1.3" rx="0.65" fill="#fff"/><path d="M12 8V5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="4.2" r="1.5" fill="currentColor"/></svg></div>';
    wrap.innerHTML = avatar + '<div class="msg-bubble">' + html + "</div>";
    msgs.appendChild(wrap);
    wireHearts(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
  }

  // ---------- initial greeting ----------
  bubble("ai", A.renderAnswer(A.greeting()));

  // ---------- send ----------
  function send() {
    var val = input.value.trim();
    if (!val) return;
    bubble("user", "<p>" + A.esc(val) + "</p>");
    input.value = "";
    var typing = bubble("ai", '<div class="typing-indicator"><span></span><span></span><span></span></div>');
    setTimeout(function () {
      typing.remove();
      var ans = A.answer(val);
      bubble("ai", A.renderAnswer(ans));
    }, 420 + Math.random() * 380);
  }

  document.getElementById("chat-form").addEventListener("submit", function (e) {
    e.preventDefault();
    send();
  });

  // ---------- quick chips (delegated) ----------
  document.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-quick]");
    if (!chip) return;
    input.value = chip.textContent.trim();
    send();
  });

  window.askNow = function (text) {
    input.value = String(text).trim();
    send();
  };
  window.fillInput = function (text) {
    input.value = String(text).replace(/"/g, "");
    input.focus();
  };
})();

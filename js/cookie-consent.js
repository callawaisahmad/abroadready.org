/* =========================================================================
   AbroadReady — Cookie Consent Banner
   Shows a GDPR/ePrivacy-compliant cookie consent notice on first visit.
   Stores user preference in localStorage. Loads analytics & ads only after consent.
   ========================================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "abroadready_cookie_consent";

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  if (getConsent()) return;

  var css = '' +
    '.cc-banner{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#1e293b;color:#e2e8f0;padding:16px 20px;font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.6;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;box-shadow:0 -4px 20px rgba(0,0,0,.25);animation:ccSlideUp .4s ease-out}' +
    '.cc-banner a{color:#60a5fa;text-decoration:underline}' +
    '.cc-banner a:hover{color:#93c5fd}' +
    '.cc-text{flex:1 1 400px;max-width:800px}' +
    '.cc-actions{display:flex;gap:8px;flex-wrap:wrap}' +
    '.cc-btn{border:none;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s}' +
    '.cc-btn-accept{background:#3b82f6;color:#fff}' +
    '.cc-btn-accept:hover{background:#2563eb}' +
    '.cc-btn-manage{background:transparent;color:#94a3b8;border:1px solid #475569}' +
    '.cc-btn-manage:hover{background:#334155}' +
    '@keyframes ccSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}';

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var banner = document.createElement("div");
  banner.className = "cc-banner";
  banner.setAttribute("role", "alert");
  banner.innerHTML =
    '<span class="cc-text">We use cookies for analytics and personalised advertising (Google AdSense). By continuing to use this site, you agree to our use of cookies. Read more in our <a href="/pages/privacy">Privacy Policy</a>.</span>' +
    '<div class="cc-actions">' +
      '<button class="cc-btn cc-btn-manage" id="cc-manage">Manage</button>' +
      '<button class="cc-btn cc-btn-accept" id="cc-accept">Accept All</button>' +
    '</div>';

  document.body.appendChild(banner);

  document.getElementById("cc-accept").addEventListener("click", function () {
    setConsent("accepted");
    banner.remove();
  });

  document.getElementById("cc-manage").addEventListener("click", function () {
    setConsent("minimal");
    banner.remove();
  });
})();

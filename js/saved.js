/* =========================================================================
   AbroadReady — Saved / Wishlist module
   A tiny localStorage-backed store for scholarships the user bookmarks.
   Exposes window.Saved. Safe to load on every page (no DOM dependency).
   ========================================================================= */
(function (global) {
  "use strict";
  var KEY = "abroadready_saved_v1";
  var listeners = [];

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function write(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
    listeners.forEach(function (cb) { try { cb(arr); } catch (e) {} });
  }

  var Saved = {
    list: function () { return read(); },
    has: function (id) { return read().indexOf(id) !== -1; },
    count: function () { return read().length; },
    add: function (id) { var a = read(); if (a.indexOf(id) === -1) { a.push(id); write(a); } return true; },
    remove: function (id) { var a = read().filter(function (x) { return x !== id; }); write(a); return false; },
    toggle: function (id) { return this.has(id) ? this.remove(id) : this.add(id); },
    clear: function () { write([]); },
    onChange: function (cb) { listeners.push(cb); }
  };

  // Keep multiple open tabs in sync.
  global.addEventListener && global.addEventListener("storage", function (e) {
    if (e.key === KEY) listeners.forEach(function (cb) { try { cb(read()); } catch (err) {} });
  });

  global.Saved = Saved;
})(window);

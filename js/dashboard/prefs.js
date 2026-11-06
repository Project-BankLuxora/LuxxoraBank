/* Dashboard – prefs.js
   The saved settings (theme, currency, notifications, accessibility) and where they live. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});

  D.PREFS_KEY = "luxora_prefs";
  const DEFAULTS = { theme: "light", currency: "EUR", lang: "bg", n_transfers: true, n_cards: true, n_security: true, a_low: true, a_stmt: true, a_hide: false, large: false, bold: false, contrast: false };

  D.prefs = { ...DEFAULTS };
  try { Object.assign(D.prefs, JSON.parse(localStorage.getItem(D.PREFS_KEY))); } catch (e) {}
  if (!["EUR", "USD", "GBP", "CHF", "RON"].includes(D.prefs.currency)) D.prefs.currency = "EUR"; /* unknown or old saved BGN setting -> euro */
})(window.Luxora = window.Luxora || {});

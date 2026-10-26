/* Dashboard – prefs.js
   The saved settings (theme, currency, notifications, accessibility) and where they live. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});

  D.PREFS_KEY = "luxora_prefs";
  const DEFAULTS = { theme: "light", currency: "EUR", lang: "bg", n_transfers: true, n_cards: true, n_security: true, large: false, bold: false, contrast: false };

  D.prefs = { ...DEFAULTS };
  try { Object.assign(D.prefs, JSON.parse(localStorage.getItem(D.PREFS_KEY))); } catch (e) {}
  if (!(D.prefs.currency in { EUR: 1, USD: 1 })) D.prefs.currency = "EUR"; /* old saved BGN setting -> euro */
})(window.Luxora = window.Luxora || {});

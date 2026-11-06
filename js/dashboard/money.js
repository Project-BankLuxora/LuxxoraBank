/* Dashboard – money.js
   Currency conversion and formatting for every [data-money] element. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});

  D.RATES = { EUR: 1, USD: 1.08, GBP: 0.86, CHF: 0.94, RON: 5.08 }; /* amounts are stored in euro; the rest are made-up demo rates (the server has the same list and refreshes it below) */

  D.fmt = (eur, signed) => new Intl.NumberFormat(LuxoraI18n.lang === "en" ? "en-GB" : "bg-BG", { style: "currency", currency: D.prefs.currency, signDisplay: signed ? "exceptZero" : "auto" }).format(eur * D.RATES[D.prefs.currency]);

  D.money = () => document.querySelectorAll("[data-money]").forEach((el) => { el.textContent = D.fmt(+el.dataset.money, el.hasAttribute("data-signed")); });

  fetch("/api/rates").then((r) => (r.ok ? r.json() : null)).then((r) => { if (r) { Object.assign(D.RATES, r); if (D.apply) D.apply(); } }).catch(() => {});
})(window.Luxora = window.Luxora || {});

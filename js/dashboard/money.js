/* Dashboard – money.js
   Currency conversion and formatting for every [data-money] element. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});

  D.RATES = { EUR: 1, USD: 1.08 }; /* amounts are stored in euro; USD is a made-up demo rate */

  D.fmt = (eur, signed) => new Intl.NumberFormat(LuxoraI18n.lang === "en" ? "en-GB" : "bg-BG", { style: "currency", currency: D.prefs.currency, signDisplay: signed ? "exceptZero" : "auto" }).format(eur * D.RATES[D.prefs.currency]);

  D.money = () => document.querySelectorAll("[data-money]").forEach((el) => { el.textContent = D.fmt(+el.dataset.money, el.hasAttribute("data-signed")); });
})(window.Luxora = window.Luxora || {});

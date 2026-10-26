/* Dashboard – card-products.js
   The five card products and their terms (template section 2). All amounts are EUR (converted for display by D.fmt).
   Change a number here and the order form, the agreement and the limit slider all follow. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});

  /* purchase = [slider min, slider max, default] daily purchase limit; atm = daily ATM limit (null = not supported);
     fee is charged per "month" or "year"; rate = annual interest in % (null = not applicable) */
  D.CARD_PRODUCTS = {
    standard: { name: "Стандартна дебитна", issue: 0,  fee: 1,  per: "month", purchase: [100, 3000, 1500],  atm: 500,  funding: "Свързана сметка",   credit: false, rate: null },
    premium:  { name: "Премиум дебитна",    issue: 15, fee: 60, per: "year",  purchase: [100, 10000, 5000], atm: 1500, funding: "Свързана сметка",   credit: false, rate: null },
    virtual:  { name: "Виртуална",          issue: 0,  fee: 0,  per: "month", purchase: [100, 2000, 1000],  atm: null, funding: "Свързана сметка",   credit: false, rate: null },
    prepaid:  { name: "Предплатена",        issue: 5,  fee: 0,  per: "month", purchase: [100, 1000, 500],   atm: 200,  funding: "Предплатен баланс", credit: false, rate: null },
    credit:   { name: "Кредитна",           issue: 10, fee: 30, per: "year",  purchase: [100, 5000, 2000],  atm: 300,  funding: "Кредитно улеснение", credit: true,  rate: 18.9 }
  };

  /* the "Product terms" rows as [label, value-html]; used by the order form summary and by the agreement */
  D.cardTerms = function (id, limit) {
    const p = D.CARD_PRODUCTS[id];
    return [
      ["Такса за издаване:", D.fmt(p.issue)],
      ["Месечна или годишна такса:", `${D.fmt(p.fee)} <span>${p.per === "year" ? "на година" : "на месец"}</span>`],
      ["Дневен лимит за покупки:", D.fmt(limit || p.purchase[2])],
      ["Дневен лимит за ATM:", p.atm === null ? "Не се поддържа" : D.fmt(p.atm)],
      ["Източник на средства:", p.funding],
      ["Кредитно улеснение:", p.credit ? "Да" : "Не"],
      ["Приложим лихвен процент:", p.rate === null ? "Неприложимо" : D.pct(p.rate)]
    ];
  };
})(window.Luxora = window.Luxora || {});

/* Dashboard – loan-calculator.js
   The loan application tab: product rules, the risk class / rate / installment quote, the repayment schedule maths,
   and where the loan is stored. All loan amounts are in EUR (the agreement says so), whatever the currency setting is. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});
  const $ = (id) => document.getElementById(id);

  /* amount / months = [min, max, step, default]; base = starting annual rate in % */
  D.PRODUCTS = {
    micro:  { name: "Микрокредит", amount: [100, 2000, 100, 1000], months: [3, 24, 3, 12], base: 9.9, collateral: "none" },
    medium: { name: "Среден кредит", amount: [2000, 15000, 500, 8000], months: [12, 60, 6, 36], base: 7.9, collateral: "optional" },
    high:   { name: "Високостойностен кредит", amount: [15000, 100000, 5000, 30000], months: [24, 120, 12, 60], base: 6.9, collateral: "required" }
  };
  const RISK_ADD = { A: 0, B: 1, C: 2.5 }; /* percentage points added to the base rate */
  const COLLATERAL_DISCOUNT = 1; /* percentage points off when a valid pledged asset is given */
  const MAX_BURDEN = 0.5; /* (obligations + installment) / income must not be above this */

  const r2 = (x) => Math.round(x * 100) / 100;
  const loc = () => (LuxoraI18n.lang === "en" ? "en-GB" : "bg-BG");
  D.eur = (v) => new Intl.NumberFormat(loc(), { style: "currency", currency: "EUR" }).format(v);
  D.pct = (v) => new Intl.NumberFormat(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + "%";
  D.date = (d) => new Intl.DateTimeFormat(loc(), { day: "numeric", month: "long", year: "numeric" }).format(d);
  D.dateTime = (d) => new Intl.DateTimeFormat(loc(), { dateStyle: "medium", timeStyle: "short" }).format(d);

  D.addMonths = (d, k) => {
    const t = new Date(d.getFullYear(), d.getMonth() + k, 1), last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    t.setDate(Math.min(d.getDate(), last));
    return t;
  };

  const pmt = (p, rate, n) => { const r = rate / 1200; return r2(p * r / (1 - Math.pow(1 + r, -n))); };

  /* monthly reducing balance: every row is one installment */
  D.schedule = function (principal, rate, n, start) {
    const r = rate / 1200, pay = pmt(principal, rate, n), rows = [];
    let bal = principal;
    for (let i = 1; i <= n; i++) {
      const interest = r2(bal * r), prin = i === n ? bal : r2(pay - interest);
      rows.push({ date: D.addMonths(start, i), payment: r2(prin + interest), interest, principal: prin, balance: (bal = r2(bal - prin)) });
    }
    return rows;
  };

  /* the quote for the current form values; ok=false comes with the message to show */
  D.quote = function (q) {
    const P = D.PRODUCTS[q.product], pledge = q.collateral;
    const burden0 = q.income > 0 ? (q.debts + pmt(q.principal, P.base, q.months)) / q.income : Infinity;
    const risk = burden0 <= 0.25 ? "A" : burden0 <= 0.35 ? "B" : burden0 <= MAX_BURDEN ? "C" : "D";
    const rate = P.base + (RISK_ADD[risk] || 0) - (pledge ? COLLATERAL_DISCOUNT : 0);
    const payment = pmt(q.principal, rate, q.months);
    const total = r2(D.schedule(q.principal, rate, q.months, new Date()).reduce((s, x) => s + x.payment, 0));
    let msg = "";
    if (risk === "D" || !(q.income > 0) || (q.debts + payment) / q.income > MAX_BURDEN) msg = "Вноската е твърде висока спрямо дохода. Намалете сумата или удължете срока.";
    else if (pledge && q.cval < q.principal) msg = "Оценката на обезпечението трябва да покрива главницата.";
    return { ok: !msg, msg, risk, rate, payment, total };
  };

  /* ---- storage: one loan per user ---- */
  const LK = "luxora_loans";
  const owner = () => (LuxoraAuth.getSession() || {}).email || "guest";
  const all = () => { try { return JSON.parse(localStorage.getItem(LK)) || {}; } catch (e) { return {}; } };
  D.loanStore = {
    owner,
    get: () => all()[owner()] || null,
    set: (loan) => { const a = all(); if (loan) a[owner()] = loan; else delete a[owner()]; try { localStorage.setItem(LK, JSON.stringify(a)); } catch (e) {} }
  };

  /* ---- the form ---- */
  const form = $("loan-form");
  const read = () => {
    const P = D.PRODUCTS[form.product.value];
    return { product: form.product.value, principal: +form.amount.value, months: +form.months.value, income: +form.income.value || 0, debts: +form.debts.value || 0,
      collateral: P.collateral === "required" || (P.collateral === "optional" && form.collateral.value === "yes"), ctype: form.ctype.value, cval: +form.cval.value || 0 };
  };

  /* new product: reset the sliders to that product's limits */
  function setProduct() {
    const P = D.PRODUCTS[form.product.value];
    [["amount", P.amount], ["months", P.months]].forEach(([k, v]) => { Object.assign(form[k], { min: v[0], max: v[1], step: v[2], value: v[3] }); });
    form.collateral.value = P.collateral === "required" ? "yes" : "no";
    form.collateral.disabled = P.collateral !== "optional";
    form.cval.value = form.cval.value || "";
    D.loan();
  }

  D.loan = function () {
    const q = read(), res = D.quote(q), P = D.PRODUCTS[q.product];
    $("loan-amount-out").textContent = D.eur(q.principal);
    $("loan-months-out").textContent = q.months;
    $("loan-collateral-fields").hidden = !q.collateral;
    $("loan-collateral-note").hidden = P.collateral !== "none";
    $("loan-rate").textContent = D.pct(res.rate);
    $("loan-risk").textContent = res.risk === "D" ? "—" : res.risk;
    $("loan-payment").textContent = D.eur(res.payment);
    $("loan-total").textContent = D.eur(res.total);
    $("loan-fees").textContent = D.eur(0);
    $("loan-msg").textContent = LuxoraI18n.t(res.msg);
    form.querySelector("[type=submit]").disabled = !res.ok;
  };

  form.addEventListener("input", D.loan);
  form.addEventListener("change", (e) => { if (e.target === form.product) setProduct(); else D.loan(); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = read(), res = D.quote(q), cur = D.loanStore.get();
    if (!res.ok) return;
    if (cur && cur.status !== "closed") { $("loan-msg").textContent = LuxoraI18n.t("Вече имате кредит. Откажете договора или го погасете първо."); return; }
    D.loanStore.set({
      id: new Date().getFullYear() + "-" + String(Date.now()).slice(-6), product: q.product, principal: q.principal, months: q.months, rate: res.rate, risk: res.risk,
      payment: res.payment, total: res.total, status: "pending", created: Date.now(), accepted: null, paid: 0, overdue: false,
      collateral: q.collateral ? { type: q.ctype, value: q.cval, ref: "ASSET-" + String(Math.floor(10000 + Math.random() * 90000)) } : null
    });
    D.renderLoan(); D.loanTab(1);
  });

  D.loanTab = (i) => document.querySelectorAll('[data-view="loans"] .tabs button')[i].click();

  setProduct();
})(window.Luxora = window.Luxora || {});

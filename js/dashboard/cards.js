/* Dashboard – cards.js
   Cards: state, list, details and card controls (freeze, report lost + replace, activate, remove) and the order form.
   Every card carries its product, its agreement { id, status: pending | active | closed, accepted } and its transactions.
   The agreement document, closure and the payments / dispute tab live in card-agreement.js. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});

  const CK = "luxora_cards", P = D.CARD_PRODUCTS, LEGACY = { debit: "standard", credit: "credit", virtual: "virtual" };
  const STATE = { active: "Активна", frozen: "Замразена", blocked: "Блокирана", inactive: "Чака активиране", pending: "Чака приемане", closed: "Закрита" };
  const T = (s) => LuxoraI18n.t(s), $c = (id) => document.getElementById(id);
  const esc = (s) => s.replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
  const owner = () => (LuxoraAuth.getSession() || {}).email || "guest";
  const stored = () => { try { return JSON.parse(localStorage.getItem(CK)) || {}; } catch (e) { return {}; } };
  const agrId = () => "CA-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
  const seedTx = () => [{ id: "t1", name: "Супермаркет", ts: Date.now(), amount: -56.4 }, { id: "t2", name: "Онлайн магазин", ts: new Date(2026, 9, 16).getTime(), amount: -89.99 }];

  /* fills in whatever an older saved card is missing (product, agreement, transactions) */
  function upgrade(c) {
    c.product = c.product || LEGACY[c.type] || "standard"; delete c.type;
    c.tx = c.tx || (c.id === 1 ? seedTx() : []);
    c.debt = c.debt || 0;
    c.agr = c.agr || { id: agrId(), status: "active", accepted: c.id > 1e12 ? c.id : new Date(2026, 8, 14).getTime() };
    c.limit = Math.min(c.limit || P[c.product].purchase[2], P[c.product].purchase[1]);
    return c;
  }

  const cards = (stored()[owner()] || [{ id: 1, product: "standard", name: "", design: "champagne", last4: "4821", exp: "09/29", status: "active", limit: 2000 }]).map(upgrade);
  let sel = cards.length ? cards[0].id : null;
  const saveCards = () => { const all = stored(); all[owner()] = cards; try { localStorage.setItem(CK, JSON.stringify(all)); } catch (e) {} };

  function newCard(product, name, design, status, agr) {
    const d = new Date();
    return upgrade({ id: Date.now() + Math.floor(Math.random() * 1000), product, name, design, last4: String(1000 + Math.floor(Math.random() * 9000)), status, agr,
      exp: String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getFullYear() + 3).slice(2) });
  }

  /* what the customer sees: the agreement decides first (pending / closed), then the card control state */
  const state = (c) => (c.agr.status === "active" ? c.status : c.agr.status);
  const cur = () => cards.find((x) => x.id === sel) || cards[0];

  D.cardStore = { cards, state, cur, save: saveCards, agrId, STATE };
  D.cardTab = (i) => document.querySelectorAll('[data-view="cards"] .tabs button')[i].click();
  D.refreshCards = () => { D.renderCards(); D.renderDetails(); D.renderNewCard(); D.renderCardDoc(); D.renderPayments(); };

  const btn = (act, id, text, cls) => `<button type="button" class="button ${cls} button-small" data-act="${act}" data-id="${id}">${text}</button>`;
  const ACTIONS = {
    active: [["toggle", "Замрази"], ["lost", "Съобщи за загубена и замени"], ["agr", "Договор"]],
    frozen: [["toggle", "Активирай"], ["lost", "Съобщи за загубена и замени"], ["agr", "Договор"]],
    inactive: [["activate", "Активирай картата"], ["agr", "Договор"]],
    pending: [["agr", "Преглед на договора"]],
    blocked: [["agr", "Договор"], ["remove", "Премахни"]],
    closed: [["agr", "Договор"], ["remove", "Премахни"]]
  };

  D.renderCards = function () {
    $c("card-list").innerHTML = cards.length ? cards.map((c) => { const s = state(c); return `<article class="card-item">
      ${LuxoraCardArt.render(c.design, c.last4, s === "active" ? "" : "is-off")}
      <p class="card-title">${esc(c.name) || P[c.product].name}</p>
      <p class="note"><span>${P[c.product].name}</span> · <span>${STATE[s]}</span></p>
      <div class="card-actions">${ACTIONS[s].map(([a, t]) => btn(a, c.id, t, "button-outline")).join("")}</div>
    </article>`; }).join("") : "<p class=\"goal-text\">Нямате карти. Поръчайте нова от раздел „Нова карта“.</p>";
  };

  D.renderDetails = function () {
    const c = cur();
    sel = c ? c.id : null;
    document.querySelectorAll("[data-card-select]").forEach((s) => {
      s.innerHTML = "";
      cards.forEach((x) => { const o = document.createElement("option"); o.value = x.id; o.selected = x === c; o.textContent = (x.name || T(P[x.product].name)) + " •••• " + x.last4; s.appendChild(o); });
    });
    $c("card-details").innerHTML = c ? `<div><dt>Продукт</dt><dd>${P[c.product].name}</dd></div><div><dt>Номер</dt><dd>•••• ${c.last4}</dd></div><div><dt>Валидна до</dt><dd>${c.exp}</dd></div><div><dt>Статус</dt><dd>${STATE[state(c)]}</dd></div><div><dt>Дневен лимит за ATM:</dt><dd>${P[c.product].atm === null ? "Не се поддържа" : D.fmt(P[c.product].atm)}</dd></div>` : "";
    const lim = $c("card-limit");
    lim.disabled = !c || ["pending", "closed"].includes(state(c));
    if (c) { const r = P[c.product].purchase; lim.min = r[0]; lim.max = r[1]; lim.value = c.limit; $c("card-limit-out").textContent = D.fmt(c.limit); }
  };

  document.querySelectorAll("[data-card-select]").forEach((s) => s.addEventListener("change", (e) => { sel = +e.target.value; D.refreshCards(); }));

  $c("card-limit").addEventListener("input", (e) => {
    const c = cur();
    if (!c) return;
    c.limit = +e.target.value; $c("card-limit-out").textContent = D.fmt(c.limit); saveCards();
    D.renderCardDoc(); /* the agreement shows the configured limit */
  });

  $c("card-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const i = cards.findIndex((x) => x.id === +b.dataset.id), c = cards[i], a = b.dataset.act;
    if (!c) return;
    let m = "";
    if (a === "agr") { sel = c.id; D.refreshCards(); D.cardTab(4); return; }
    if (a === "toggle") c.status = c.status === "frozen" ? "active" : "frozen";
    else if (a === "activate") { c.status = "active"; m = "Картата е активирана."; }
    else if (a === "lost") { /* blocked for new transactions; the replacement has a new reference and must be activated */
      if (!confirm(T("Да съобщя ли за загубена или открадната карта? Тя ще бъде блокирана, а заместващата карта трябва да се активира."))) return;
      c.status = "blocked";
      const r = newCard(c.product, c.name, c.design, "inactive", { id: agrId(), status: "active", accepted: c.agr.accepted });
      r.limit = c.limit; cards.push(r);
      m = "Картата е блокирана. Заместващата карта има нова референция и трябва да се активира.";
    } else if (confirm(T("Да премахна ли картата?"))) cards.splice(i, 1);
    else return;
    saveCards(); D.refreshCards(); $c("card-msg").textContent = T(m);
  });

  /* ---- order form: live terms (fees and interest are shown before the agreement is even opened) ---- */
  const form = $c("card-form");
  D.renderNewCard = () => { $c("card-terms").innerHTML = D.cardTerms(form.product.value).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join(""); };
  ["input", "change"].forEach((ev) => form.addEventListener(ev, D.renderNewCard));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form), msg = form.querySelector(".form-msg");
    if (cards.filter((x) => x.agr.status !== "closed").length >= 6) { msg.textContent = T("Можете да имате до 6 карти."); return; }
    const c = newCard(d.get("product"), d.get("cname").trim(), d.get("design"), "active", { id: agrId(), status: "pending", accepted: null });
    cards.push(c); sel = c.id; saveCards(); form.reset(); msg.textContent = "";
    D.refreshCards(); D.cardTab(4); /* straight to the agreement, like the loan flow */
  });
})(window.Luxora = window.Luxora || {});

/* Dashboard – account.js
   The "Сметка" view: balance, account card, quick actions, transactions (filter, details), account details (copy, show/hide),
   management (settings reuse the data-pref engine in settings.js) and a sample CSV statement. Demo data only, no backend.
   Bulgarian text is translated by i18n (translations/account.js); only attributes and joined strings go through T(). */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});
  const $ = (id) => document.getElementById(id), T = (s, ...a) => LuxoraI18n.t(s, ...a), view = document.querySelector('[data-view="account"]');
  const BIC = "LUXOBGSF", api = LuxoraAuth.api;
  let IBAN = "", NUM = "", BAL = 0, OPEN = new Date(), TX = [], nick = "", frozen = false, loaded = false; /* all of these come from the server (see load) */
  const SK = "luxora_account_" + ((LuxoraAuth.getSession() || {}).email || ""), S = Object.assign({ mask: false }, (() => { try { return JSON.parse(localStorage.getItem(SK)); } catch (e) { return null; } })());
  const save = () => { try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) {} };
  let hidden = !!D.prefs.a_hide, dir = "all", cat = "", all = false;

  const loc = () => (LuxoraI18n.lang === "en" ? "en-GB" : "bg-BG");
  const fmt = (eur, signed) => D.fmt(eur, signed); /* follows the currency picker; the account itself is kept in EUR */
  const cur = (v, c) => new Intl.NumberFormat(loc(), { style: "currency", currency: c }).format(v);
  const dt = (d, o) => new Intl.DateTimeFormat(loc(), o).format(d);
  const holder = () => ((LuxoraAuth.getSession() || {}).name || "Клиент на Luxora");
  const mk = (s) => s.split(" ").map((g, i, a) => (i === 0 || i >= a.length - 2 ? g : "••••")).join(" ");
  const CP = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>';
  const ARR = { in: '<path d="M17 7 7 17M16 17H7V8"/>', out: '<path d="M7 17 17 7M8 7h9v9"/>' };
  const kv = (rows) => `<dl class="kv">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
  const cbtn = (what, label) => `<button type="button" class="acc-copy" data-copy="${what}" aria-label="${label}">${CP}</button>`;

  const day = (t) => { const n = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / 864e5); return n === 0 ? "Днес" : n === 1 ? "Вчера" : dt(t, { day: "numeric", month: "long" }); };
  const stCls = (s) => (s === "Изпълнена" ? "is-active" : s === "Отказана" ? "is-failed" : "");
  const months = () => [1, 2, 3, 4].map((n) => { const d = new Date(); d.setMonth(d.getMonth() - n, 1); const l = dt(d, { month: "long", year: "numeric" }); return { n, label: l[0].toUpperCase() + l.slice(1) }; });

  /* ---------- toast, dialog, copy, download ---------- */
  let tt; const toast = (m) => { const e = $("acc-toast"); e.textContent = T(m); e.classList.add("is-on"); clearTimeout(tt); tt = setTimeout(() => e.classList.remove("is-on"), 2600); };
  D.toast = toast; /* the bell uses the same toast */
  const dlg = $("acc-dialog"), open = (html) => { dlg.innerHTML = html; dlg.showModal(); };
  dlg.addEventListener("click", (e) => { const r = dlg.getBoundingClientRect(); if (e.target.closest("[data-close]") || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close(); });
  const closeBtn = '<button type="button" class="button button-outline button-small" data-close>Затвори</button>';
  const copy = (text, msg) => {
    const done = () => toast(msg);
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(done, () => { const t = document.createElement("textarea"); t.value = text; document.body.append(t); t.select(); try { document.execCommand("copy"); } catch (e) {} t.remove(); done(); });
  };
  const COPY = { iban: [IBAN, "IBAN е копиран."], bic: [BIC, "BIC е копиран."], number: [NUM, "Номерът на сметката е копиран."], holder: [null, "Името е копирано."] };
  const download = (name, text) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8" })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  function statement(label, tag) {
    const rows = TX.map((x) => [dt(x.t, { dateStyle: "short" }), dt(x.t, { hour: "2-digit", minute: "2-digit" }), x.name, x.c, x.st, x.amt.toFixed(2)].join(";"));
    download("luxora-statement-" + tag + ".csv", ["Luxora Bank – " + T("Примерно извлечение"), "IBAN;" + IBAN, T("Период") + ";" + label, T("Валута") + ";EUR", "", [T("Дата"), T("Час"), T("Описание"), T("Категория"), T("Статус"), T("Сума") + " (EUR)"].join(";"), ...rows, "", T("Наличност") + ";;;;;" + BAL.toFixed(2)].join("\r\n"));
    toast("Извлечението е изтеглено.");
  }

  /* ---------- render: one page, two modes – the account, or any one of the cards (same sections for both) ---------- */
  const CS = D.cardStore, PR = D.CARD_PRODUCTS, esc = (x) => String(x).replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
  let mode = "acct";
  const card = () => CS.cards.find((c) => String(c.id) === mode), cname = (c) => c.name || PR[c.product].name, DEBIT = ["standard", "premium", "virtual"];
  const day0 = () => new Date().setHours(0, 0, 0, 0), spent = (c) => TX.filter((x) => x.card === c.last4 && x.amt < 0 && +x.t >= day0() && x.st !== "Отказана").reduce((n, x) => n - x.amt, 0);
  const IC = { out: '<path d="M7 17 17 7M8 7h9v9"/>', in: '<path d="M17 7 7 17M16 17H7V8"/>', doc: '<path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6"/>', set: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>', cp: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', pay: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>' };
  const meter = (label, used, max) => `<div class="acc-meter"><div><span>${label}</span><b>${T("%s от %s", fmt(used), fmt(max))}</b></div><div class="progress"><span style="--v:${Math.min(100, max ? (used / max) * 100 : 0).toFixed(0)}%"></span></div></div>`;
  const cardLbl = (c) => `${esc(cname(c))}<small> •••• ${c.last4}</small>`;

  D.renderAccount = function () {
    if (!loaded) { $("acc-balance").textContent = "…"; return; }
    let c = card(); if (mode !== "acct" && !c) mode = "acct";
    const isC = !!c, st = isC && CS.state(c), pr = isC && PR[c.product], hide = (q, h) => view.querySelectorAll(q).forEach((e) => { e.hidden = h; });
    view.classList.toggle("is-card", isC); hide(".acc-card-only", !isC); hide(".acc-acct-only", isC);
    const set = (id, v) => { $(id).textContent = v; };
    const sentToday = TX.filter((x) => x.c === "Преводи" && x.amt < 0 && +x.t >= day0()).reduce((n, x) => n - x.amt, 0);

    $("acc-switch").innerHTML = `<button type="button" data-mode="acct" aria-pressed="${!isC}">Разплащателна сметка</button>` + CS.cards.map((x) => `<button type="button" data-mode="${x.id}" aria-pressed="${isC && x.id === c.id}"><span>${esc(cname(x))}</span><small> •••• ${x.last4}</small></button>`).join("");

    /* overview */
    const money = isC ? Math.max(0, c.limit - spent(c)) : BAL, pill = $("acc-status");
    set("acc-lbl", isC ? "Остатък от дневния лимит" : "Наличен баланс"); set("acc-balance", hidden ? "••••••" : fmt(money));
    set("acc-rate", isC ? T("Дневен лимит: %s · Салдо по сметката: %s", fmt(c.limit), fmt(BAL)) : D.prefs.currency === "EUR" ? "" : T("Сметката е водена в EUR · 1 EUR = %s", D.RATES[D.prefs.currency] + " " + D.prefs.currency));
    if (!$("tr-cur").dataset.t) $("tr-cur").value = D.prefs.currency; hint();
    $("acc-eye").setAttribute("aria-pressed", hidden); $("acc-eye").setAttribute("aria-label", T(hidden ? "Покажи салдото" : "Скрий салдото"));
    const badFrozen = isC ? frozen && st === "active" : frozen; /* a frozen account stops its cards too */
    set("acc-status", isC ? (badFrozen ? "Сметката е замразена" : CS.STATE[st]) : frozen ? "Замразена" : "Активна");
    pill.className = "loan-status " + (isC ? (st === "active" && !badFrozen ? "is-active" : ["frozen", "blocked", "closed"].includes(st) || badFrozen ? "is-closed" : "") : frozen ? "is-closed" : "is-active");
    const opened = dt(OPEN, { day: "numeric", month: "long", year: "numeric"});
    set("k-type", isC ? "Вид карта" : "Вид сметка"); set("acc-type", isC ? pr.name : "Разплащателна сметка"); set("k-num", isC ? "Номер на картата" : "Номер на сметка"); set("acc-number", isC ? "•••• •••• •••• " + c.last4 : NUM);
    set("k-open", isC ? "Валидна до" : "Открита на"); set("acc-opened", isC ? c.exp : opened); set("k-iban", isC ? "Свързана сметка (IBAN)" : "IBAN"); set("acc-iban", IBAN);
    set("acc-card-iban", IBAN); set("acc-holder", holder().toUpperCase());
    const art = $("acc-art"), key = isC ? c.design + c.last4 + (st === "active") : ""; /* only redraw the card when it changes, so a flipped card stays flipped */
    if (art.dataset.k !== key) { art.dataset.k = key; art.innerHTML = isC ? LuxoraCardArt.render(c.design, c.last4, st === "active" ? "" : "is-off") : ""; }

    /* quick actions */
    const acts = isC ? [["ctoggle", c.status === "frozen" ? "Активирай картата" : "Замрази картата", IC.lock], ["cpay", "Тестово плащане", IC.pay], ["cagr", "Договор", IC.doc], ["manage", "Управление", IC.set], ["copy", "Копирай IBAN", IC.cp]]
      : [["transfer", "Превод", IC.out], ["receive", "Получаване на пари", IC.in], ["statement", "Извлечение", IC.doc], ["manage", "Управление", IC.set], ["copy", "Копирай IBAN", IC.cp]];
    $("acc-actions").innerHTML = acts.map(([a, l, p]) => `<button type="button" class="acc-act" data-act="${a}"><span class="acc-ico"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg></span>${l}</button>`).join("");

    /* transactions: the account's, or only the ones paid with this card */
    const src = isC ? TX.filter((x) => x.card === c.last4) : TX, cats = [...new Set(src.map((x) => x.c))]; if (!cats.includes(cat)) cat = "";
    $("acc-cat").innerHTML = `<option value="">Всички категории</option>` + cats.map((x) => `<option value="${x}">${x}</option>`).join(""); $("acc-cat").value = cat;
    view.querySelectorAll("[data-dir]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.dir === dir));
    const list = src.filter((x) => (dir === "all" || (dir === "in") === x.amt > 0) && (!cat || x.c === cat)), shown = all ? list : list.slice(0, 6);
    $("acc-txl").innerHTML = shown.length ? shown.map((x) => `<li><button type="button" class="acc-tx-row" data-i="${x.i}">
      <span class="acc-ico ${x.amt > 0 ? "in" : "out"}"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ARR[x.amt > 0 ? "in" : "out"]}</svg></span>
      <span><b>${x.name}</b><small>${x.c}${x.card && !isC ? `<span> · •••• ${x.card}</span>` : ""}</small></span><span class="acc-when"><span>${day(x.t)}</span><small>${dt(x.t, { hour: "2-digit", minute: "2-digit" })}</small></span>
      <span class="loan-status ${stCls(x.st)}">${x.st}</span><span class="acc-amt ${x.amt > 0 ? "in" : ""}">${fmt(x.amt, true)}</span></button></li>`).join("") : '<li class="acc-empty">Няма транзакции за избрания филтър.</li>';
    set("acc-tx-title", all ? "Всички транзакции" : "Последни транзакции"); set("acc-all", all ? "Покажи по-малко" : "Виж всички"); $("acc-all").hidden = !all && list.length <= 6;

    /* details */
    const m = S.mask, val = (v, what, label) => `<span class="acc-copy-row"><span>${v}</span>${cbtn(what, label)}</span>`, ib = val(m ? mk(IBAN) : IBAN, "iban", "Копирай IBAN");
    set("acc-det-title", isC ? "Детайли на картата" : "Детайли на сметката"); set("acc-mask", m ? "Покажи данните" : "Скрий данните"); $("acc-mask").setAttribute("aria-pressed", m);
    const ln = D.loanStore.get(), loanRow = ln && ln.status === "active" ? [["Кредит", T("Вноска %s · следваща на %s", D.eur(ln.payment), D.date(D.addMonths(new Date(ln.accepted), ln.paid + 1)))]] : [];
    const rows = isC ? [["Продукт", pr.name], ["Номер на картата", "•••• •••• •••• " + c.last4], ["Валидна до", c.exp], ["Статус", badFrozen ? "Сметката е замразена" : CS.STATE[st]], ["Свързана сметка", ib], ["Договор №", c.agr.id], ["Дневен лимит за покупки", fmt(c.limit)],
        ["Дневен лимит за ATM", pr.atm === null ? "Не се поддържа" : fmt(pr.atm)], ["Такса", pr.fee ? `${fmt(pr.fee)} <span>${pr.per === "year" ? "на година" : "на месец"}</span>` : fmt(0)]]
      : [["Титуляр", holder()], ...(nick ? [["Име на сметката", esc(nick)]] : []), ["IBAN", ib], ["Номер на сметка", val(m ? mk(NUM) : NUM, "number", "Копирай номера")], ["BIC / SWIFT", val(m ? "LUXO••••" : BIC, "bic", "Копирай BIC")], ["Валута", "Евро (EUR)"], ["Вид сметка", "Разплащателна сметка"], ["Банка", "Luxora Bank"], ["Дата на откриване", opened], ["Статус", frozen ? "Замразена" : "Активна"], ...loanRow];
    $("acc-kv").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

    /* management */
    set("acc-man-title", isC ? "Управление на картата" : "Управление на сметката"); view.querySelector(".acc-manage .tabs button").textContent = isC ? "Информация за картата" : "Информация за сметката";
    set("acc-nick-lbl", isC ? "Име на картата" : "Име на сметката"); $("acc-nick").value = isC ? c.name : nick; $("acc-nick").maxLength = isC ? 24 : 30; $("acc-nick").placeholder = T(isC ? "Напр. За пътувания" : "Напр. Основна сметка");
    $("acc-freeze").checked = frozen;
    $("acc-meters").innerHTML = isC ? meter("Използвано днес", spent(c), c.limit) + (pr.atm === null ? "" : meter("Дневен лимит за ATM", 0, pr.atm))
      : meter("Дневен лимит за преводи", sentToday, 5000) + CS.cards.filter((x) => x.agr.status !== "closed").map((x) => meter(cardLbl(x), spent(x), x.limit)).join("");
    if (isC) {
      const lim = $("cl"); lim.min = pr.purchase[0]; lim.max = pr.purchase[1]; lim.value = c.limit; lim.disabled = ["pending", "closed"].includes(st); set("cl-out", fmt(c.limit));
      $("acc-cfreeze").checked = c.status === "frozen"; $("acc-cfreeze").disabled = !["active", "frozen"].includes(st); $("acc-cdesign").value = LuxoraCardArt.design(c.design);
    }
    $("acc-docs").innerHTML = months().map((x) => `<li><span>${x.label}<small>CSV</small></span><button type="button" class="button button-outline button-small" data-stmt="${x.n}">Свали</button></li>`).join("");
    spy();
  };

  /* ---------- actions ---------- */
  const go = (id) => $(id).scrollIntoView({ behavior: "smooth", block: "start" });
  const ACT = {
    transfer: () => { location.hash = "transfers"; },
    manage: () => go("acc-manage"),
    copy: () => copy(IBAN, "IBAN е копиран."),
    limits: () => toast("Заявката за промяна на лимитите е изпратена (демо)."),
    ctoggle: () => { const c = card(), b = document.querySelector('#card-list [data-act="toggle"][data-id="' + c.id + '"]'); if (!b) return toast("Картата не може да се замрази в това състояние."); b.click(); D.renderAccount(); toast(c.status === "frozen" ? "Картата е замразена." : "Картата е активна."); }, /* reuses the Cards tab's own toggle */
    clost: () => { const c = card(), b = document.querySelector('#card-list [data-act="lost"][data-id="' + c.id + '"]'); if (!b) return toast("Не е налично за тази карта."); b.click(); D.renderAccount(); },
    cagr: () => { CS.select(card().id); location.hash = "cards"; D.refreshCards(); D.cardTab(4); },
    ccsv: () => { const c = card(), rows = TX.filter((x) => x.card === c.last4).map((x) => [dt(x.t, { dateStyle: "short" }), dt(x.t, { hour: "2-digit", minute: "2-digit" }), x.name, x.c, x.st, x.amt.toFixed(2)].join(";")); download("luxora-card-" + c.last4 + ".csv", ["Luxora Bank – " + cname(c) + " •••• " + c.last4, [T("Дата"), T("Час"), T("Описание"), T("Категория"), T("Статус"), T("Сума") + " (EUR)"].join(";"), ...rows].join("\r\n")); toast("Извлечението е изтеглено."); },
    cpay: () => { const c = card(); if (!DEBIT.includes(c.product)) return toast("Тестовите плащания са налични за дебитни и виртуални карти."); open(`<h2 id="acc-dlg-title">Тестово плащане</h2><p class="note">${cardLbl(c)}</p>
      <label class="field"><span>Търговец</span><select id="pay-m"><option value="Фреш Маркет|Храна и напитки">Фреш Маркет</option><option value="Кафе Орех|Храна и напитки">Кафе Орех</option><option value="Бензиностанция Нова|Транспорт">Бензиностанция Нова</option><option value="Аптека Здраве|Здраве">Аптека Здраве</option><option value="Онлайн магазин|Пазаруване">Онлайн магазин</option></select></label>
      <label class="field"><span>Сума (EUR)</span><input id="pay-a" type="number" min="0.01" step="0.01" value="25"></label>
      <div class="loan-buttons"><button type="button" class="button button-gold button-small" data-pay>Плати</button>${closeBtn}</div>`); },
    receive: () => open(`<h2 id="acc-dlg-title">Получаване на пари</h2><p class="goal-text">Споделете тези данни с подателя.</p>${kv([["Получател", holder()], ["IBAN", IBAN], ["BIC / SWIFT", BIC], ["Банка", "Luxora Bank"], ["Валута", "EUR"]])}
      <div class="loan-buttons"><button type="button" class="button button-gold button-small" data-copy="all">Копирай всички данни</button>${closeBtn}</div>`),
    statement: () => open(`<h2 id="acc-dlg-title">Извлечение</h2><p class="goal-text">Примерно извлечение във формат CSV.</p>
      <label class="field"><span>Период</span><select id="acc-period">${months().map((x) => `<option value="${x.n}">${x.label}</option>`).join("")}</select></label>
      <div class="loan-buttons"><button type="button" class="button button-gold button-small" data-stmt="pick">Свали</button>${closeBtn}</div>`)
  };
  const detail = (x) => open(`<h2 id="acc-dlg-title">${x.name}</h2>${kv([["Сума", `<b>${fmt(x.amt, true)}</b>`], ["Статус", `<span class="loan-status ${stCls(x.st)}">${x.st}</span>`], ["Тип", x.amt > 0 ? "Входяща" : "Изходяща"], ["Категория", x.c], ["Дата и час", dt(x.t, { dateStyle: "long" }) + ", " + dt(x.t, { hour: "2-digit", minute: "2-digit" })], ["Начин", x.how], ...(x.card ? [["Карта", "•••• " + x.card]] : []), ...(x.loan && x.loan.n ? [["Вноска", x.loan.n + " / " + x.loan.of]] : []), ...(x.fx ? [["Оригинална сума", cur(x.fx.amt, x.fx.cur) + " · 1 EUR = " + x.fx.rate + " " + x.fx.cur]] : []), ["Референция", x.ref]])}
    <div class="loan-buttons"><button type="button" class="button button-gold button-small" data-ref="${x.ref}">Копирай референцията</button>${closeBtn}</div>`);

  view.addEventListener("click", (e) => {
    const t = e.target, b = (s) => t.closest(s);
    if (b("[data-mode]")) { mode = b("[data-mode]").dataset.mode; cat = ""; dir = "all"; all = false; D.renderAccount(); }
    else if (b("[data-goto]")) go(b("[data-goto]").dataset.goto);
    else if (b("[data-act]")) ACT[b("[data-act]").dataset.act]();
    else if (b("[data-copy]")) { const c = COPY[b("[data-copy]").dataset.copy]; if (c) copy(c[0] || holder(), c[1]); }
    else if (b("#acc-eye")) { hidden = !hidden; D.renderAccount(); }
    else if (b("[data-dir]")) { dir = b("[data-dir]").dataset.dir; D.renderAccount(); }
    else if (b("#acc-all")) { all = !all; D.renderAccount(); }
    else if (b(".acc-tx-row")) detail(TX[+b(".acc-tx-row").dataset.i]);
    else if (b("#acc-mask")) { S.mask = !S.mask; save(); D.renderAccount(); }
    else if (b("#acc-nick-save")) { const c = card(); if (c) { c.name = $("acc-nick").value.trim().slice(0, 24); CS.save(); D.refreshCards(); D.renderAccount(); toast("Името на картата е запазено."); } else patch({ nick: $("acc-nick").value }, "Името на сметката е запазено."); }
    else if (b("[data-stmt]")) { const m = months().find((x) => x.n === +b("[data-stmt]").dataset.stmt); statement(m.label, m.n); }
  });
  dlg.addEventListener("click", (e) => {
    if (e.target.closest("[data-pay]")) { const [mer, ct] = $("pay-m").value.split("|"); api("/pay", { card: card().id, merchant: mer, cat: ct, amount: $("pay-a").value }).then((r) => { dlg.close(); toast(r.ok ? "Плащането е одобрено." : T("Плащането е отказано: ") + T(r.reason)); D.loadAccount(); }).catch((err) => toast(err.message)); return; }
    const c = e.target.closest("[data-copy]"), r = e.target.closest("[data-ref]"), s = e.target.closest("[data-stmt]");
    if (c) copy([holder(), IBAN, BIC, "Luxora Bank"].join("\n"), "Данните са копирани.");
    if (r) copy(r.dataset.ref, "Референцията е копирана.");
    if (s) { const m = months().find((x) => x.n === +$("acc-period").value); statement(m.label, m.n); dlg.close(); }
  });
  $("acc-cat").addEventListener("change", (e) => { cat = e.target.value; D.renderAccount(); });
  view.addEventListener("input", (e) => { if (e.target.id === "cl") { const c = card(); c.limit = +e.target.value; set2("cl-out", fmt(c.limit)); } });
  const set2 = (id, v) => { $(id).textContent = v; };
  view.addEventListener("change", (e) => { /* settings.js already saved the pref; keep the Profile copies in step and confirm */
    const id = e.target.id, c = card();
    if (id === "cl") { CS.save(); D.renderCardDoc(); D.renderAccount(); return toast("Лимитът е запазен."); }
    if (id === "acc-cfreeze") return ACT.ctoggle();
    if (id === "acc-cdesign") { c.design = e.target.value; CS.save(); D.refreshCards(); D.renderAccount(); return toast("Дизайнът е запазен."); }
    const k = e.target.dataset.pref; if (!k) return;
    if (e.target.type === "checkbox") document.querySelectorAll('[data-pref="' + k + '"]').forEach((x) => { x.checked = e.target.checked; });
    toast("Настройките са запазени.");
  });

  /* ---------- server: load, settings, transfers, live updates ---------- */
  const spaced = (i) => i.replace(/(.{4})/g, "$1 ").trim();
  const mapTx = (t, i) => ({ i, t: new Date(t.ts), name: t.name, c: t.cat, amt: t.amt / 100, st: t.st, how: t.how, ref: t.ref, fx: t.fx, card: t.card, loan: t.loan });
  D.loadAccount = async function () {
    try {
      await CS.pull(); await D.loanStore.pull(); const a = await api("/account");
      IBAN = spaced(a.iban); NUM = spaced(a.iban.slice(8)); BAL = a.balance / 100; OPEN = new Date(a.opened); TX = a.tx.map(mapTx); nick = a.nick; frozen = a.frozen; loaded = true;
      CS.syncTx(a.tx); D.refreshCards(); D.renderAccount(); D.renderLoan(); syncOther(); D.money(); if (D.loadNotes) D.loadNotes();
    } catch (e) { toast(e.message); }
  };
  /* the "Преводи" tab lists the same real transfers */
  function syncOther() {
    const row = (x) => `<li><span>${x.name}<small>${day(x.t)}</small></span><b class="${x.amt > 0 ? "amount-positive" : ""}" data-money="${x.amt}" data-signed>…</b></li>`;
    const tr = (list, empty) => (list.length ? list.map(row).join("") : `<li>${empty}</li>`);
    $("tr-sent").innerHTML = tr(TX.filter((x) => x.c === "Преводи" && x.amt < 0), "Все още няма изпратени преводи."); $("tr-recv").innerHTML = tr(TX.filter((x) => x.c === "Преводи" && x.amt > 0), "Все още няма получени преводи.");
  }
  async function patch(body, msg) { try { await api("/account", body, "PATCH"); toast(msg); await D.loadAccount(); } catch (e) { toast(e.message); D.renderAccount(); } }
  $("acc-freeze").addEventListener("change", (e) => patch({ frozen: e.target.checked }, e.target.checked ? "Сметката е замразена." : "Сметката е активна."));

  function hint() { const f = $("transfer-form"), v = +f.amount.value, r = D.RATES[f.cur.value]; $("tr-fx").textContent = v > 0 ? T("≈ %s ще бъдат изтеглени от сметката.", cur(v / r, "EUR")) + (f.cur.value === "EUR" ? "" : " (1 EUR = " + r + " " + f.cur.value + ")") : ""; }
  $("transfer-form").addEventListener("input", (e) => { if (e.target.name === "cur") e.target.dataset.t = 1; hint(); });
  document.addEventListener("change", (e) => { if (e.target.matches('select[data-pref="currency"]')) document.querySelectorAll('select[data-pref="currency"]').forEach((x) => { x.value = e.target.value; }); }); /* the nav picker and the Profile setting stay in step */
  $("transfer-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, msg = f.querySelector(".form-msg"), btn = f.querySelector("button");
    btn.disabled = true; msg.textContent = T("Момент…");
    try { const r = await api("/transfer", { iban: f.iban.value, amount: f.amount.value, cur: f.cur.value, reason: f.reason.value }); f.reset(); delete f.cur.dataset.t; msg.textContent = T("Преводът към %s е изпратен.", r.to); toast("Преводът е изпратен."); await D.loadAccount(); }
    catch (err) { msg.textContent = T(err.message); }
    btn.disabled = false;
  });

  /* live: the server pings this tab when its balance changes (e.g. someone sends you money) */
  const me = LuxoraAuth.getSession();
  if (me) { const es = new EventSource("/api/events?token=" + me.token); es.onmessage = () => { const before = BAL; D.loadAccount().then(() => { if (BAL > before) toast(T("Получихте превод: %s", fmt(BAL - before))); }); }; }
  D.loadAccount();

  /* sticky nav: follows the header height and highlights the section in view */
  var ids = ["acc-overview", "acc-tx", "acc-details", "acc-manage"], nav = [...view.querySelectorAll(".acc-nav button")];
  const hdr = () => document.documentElement.style.setProperty("--hdr", (document.querySelector(".site-header") || { offsetHeight: 72 }).offsetHeight + "px");
  function spy() { if (!$("acc-overview").offsetParent) return; let cur = ids[0]; ids.forEach((id) => { if ($(id).getBoundingClientRect().top <= innerHeight * 0.4) cur = id; }); nav.forEach((n) => n.setAttribute("aria-selected", n.dataset.goto === cur)); }
  addEventListener("scroll", spy, { passive: true }); addEventListener("resize", hdr); hdr(); spy();
})(window.Luxora = window.Luxora || {});

/* Dashboard – notifications.js
   The bell: a feed of what happened on the account (transfers, card payments, security, loans, low balance, monthly statement).
   The server creates the events and only creates the kinds that are switched on in Settings (those five switches are stored on the server too).
   The server sends { kind, params }; the sentence is written here so it follows the language and currency of the page. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});
  const $ = (id) => document.getElementById(id), T = (s, ...a) => LuxoraI18n.t(s, ...a), api = LuxoraAuth.api, NK = ["n_transfers", "n_cards", "n_security", "a_low", "a_stmt"];
  const loc = () => (LuxoraI18n.lang === "en" ? "en-GB" : "bg-BG"), M = (c) => D.fmt(c / 100);
  const SEC = { frozen: "Сметката беше замразена.", unfrozen: "Сметката беше активирана.", "2fa_on": "Включена е двуфакторна защита.", "2fa_off": "Изключена е двуфакторна защита.", pw: "Паролата ви беше сменена." };
  const IC = { in: '<path d="M17 7 7 17M16 17H7V8"/>', out: '<path d="M7 17 17 7M8 7h9v9"/>', pay: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>', warn: '<path d="M12 4 3 20h18z"/><path d="M12 10v4M12 17v.5"/>', user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', doc: '<path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6"/>', loan: '<path d="M4 10 12 4l8 6M6 10v8M10 10v8M14 10v8M18 10v8M4 20h16"/>' };
  /* kind -> [icon, sentence(params)] */
  const TPL = {
    transfer_in: ["in", (p) => T("Получихте %s от %s", M(p.amt), p.name)], transfer_out: ["out", (p) => T("Изпратихте %s на %s", M(p.amt), p.name)],
    card_pay: ["pay", (p) => T("Плащане с карта •••• %s: %s – %s", p.last4, M(p.amt), p.name)], card_decline: ["warn", (p) => T("Отказано плащане с карта •••• %s на %s (%s): %s", p.last4, M(p.amt), p.name, T(p.why))],
    security: ["lock", (p) => T(SEC[p.what] || "Промяна в настройките за сигурност.")], login: ["user", (p) => T("Нов вход в профила ви от %s", p.dev)],
    low: ["warn", (p) => T("Ниска наличност по сметката: %s", M(p.amt))], statement: ["doc", (p) => T("Налично е месечното извлечение за %s", new Intl.DateTimeFormat(loc(), { month: "long", year: "numeric" }).format(new Date(p.month + "-01")))],
    loan_paid_out: ["loan", (p) => T("Кредитът е изплатен по сметката ви: %s", M(p.amt))], loan_paid: ["loan", (p) => T("Удържана вноска по кредита: %s (%s от %s)", M(p.amt), p.n, p.of)],
    loan_missed: ["warn", (p) => T("Пропусната вноска по кредита: %s", M(p.amt))], loan_closed: ["loan", () => T("Кредитът е погасен изцяло.")], support: ["doc", (p) => T("Заявка %s е приета. Ще ви отговорим до 1 работен ден.", p.id)]
  };
  const text = (n) => (TPL[n.kind] ? TPL[n.kind][1](n.p) : "");
  const svg = (k) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;

  let items = [], unread = 0, first = true;
  const seen = new Set(), bell = $("bell"), panel = $("bell-panel"), list = $("bell-list");

  D.renderNotes = function () {
    const b = $("bell-badge"); b.hidden = !unread; b.textContent = unread > 9 ? "9+" : unread; bell.setAttribute("aria-label", T("Известия") + (unread ? " (" + unread + ")" : ""));
    list.textContent = "";
    if (!items.length) { const li = document.createElement("li"); li.className = "bell-empty"; li.textContent = T("Няма известия."); list.append(li); return; }
    items.forEach((n) => {
      if (!TPL[n.kind]) return;
      const li = document.createElement("li"), btn = document.createElement("button"), when = new Date(n.ts);
      btn.type = "button"; btn.className = "bell-item" + (n.read ? "" : " is-new"); btn.dataset.id = n.id; btn.dataset.link = n.link;
      btn.innerHTML = `<span class="acc-ico">${svg(TPL[n.kind][0])}</span><span class="bell-body"><span class="bell-text"></span><small></small></span>`;
      btn.querySelector(".bell-text").textContent = text(n); btn.querySelector("small").textContent = new Intl.DateTimeFormat(loc(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(when);
      li.append(btn); list.append(li);
    });
  };

  D.loadNotes = async function () {
    try {
      const r = await api("/notes"), fresh = r.items.filter((n) => !n.read && !seen.has(n.id)); r.items.forEach((n) => seen.add(n.id));
      items = r.items; unread = r.unread; D.renderNotes();
      if (!first && fresh.length && D.toast) D.toast(text(fresh[0])); /* a live pop-up for something that just happened */
      first = false;
    } catch (e) {}
  };

  /* the five switches live on the server so they decide what gets created, whichever browser you use */
  D.pullNotify = async function () {
    try {
      const n = await api("/notify"); NK.forEach((k) => { D.prefs[k] = !!n[k]; document.querySelectorAll('[data-pref="' + k + '"]').forEach((el) => { el.checked = D.prefs[k]; }); });
      localStorage.setItem(D.PREFS_KEY, JSON.stringify(D.prefs));
    } catch (e) {}
  };
  document.addEventListener("change", (e) => { /* settings.js has already updated D.prefs when this runs */
    const k = e.target.dataset && e.target.dataset.pref;
    if (NK.includes(k)) api("/notify", Object.fromEntries(NK.map((x) => [x, !!D.prefs[x]])), "PUT").catch(() => {});
  });

  /* bell panel */
  const place = () => { const r = bell.getBoundingClientRect(); panel.style.top = r.bottom + 8 + "px"; panel.style.right = Math.max(8, innerWidth - r.right) + "px"; }; /* fixed, so the scrolling nav can't clip it */
  const open = (on) => { panel.hidden = !on; bell.setAttribute("aria-expanded", on); if (on) place(); };
  bell.addEventListener("click", () => open(panel.hidden));
  document.addEventListener("click", (e) => { if (!panel.hidden && !panel.contains(e.target) && !bell.contains(e.target)) open(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { open(false); bell.focus(); } });
  addEventListener("resize", () => { if (!panel.hidden) place(); });
  panel.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-n]"), it = e.target.closest(".bell-item");
    try {
      if (b) { await api(b.dataset.n === "read" ? "/notes/read" : "/notes/clear", {}); await D.loadNotes(); }
      else if (it) { open(false); if (it.classList.contains("is-new")) await api("/notes/read", { ids: [it.dataset.id] }); if (it.dataset.link) location.hash = it.dataset.link; await D.loadNotes(); }
    } catch (err) {}
  });

  D.pullNotify();
})(window.Luxora = window.Luxora || {});

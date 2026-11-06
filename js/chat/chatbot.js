/* Luxora Bank – chat/chatbot.js
   Floating support assistant, Bulgarian + English. Rule-based (keywords -> answer), no AI service needed.
   It reads the signed-in user's real account through the API (balance, transactions), can freeze the account after a confirmation,
   and can hand over to a human by creating a ticket on the server. Add a topic = add one line to TOPICS. */
(function (L) {
  const en = () => !!(window.LuxoraI18n && LuxoraI18n.lang === "en"), t = (bg, e) => (en() ? e : bg);
  const api = () => window.LuxoraAuth && LuxoraAuth.api, signed = () => !!(window.LuxoraAuth && LuxoraAuth.getSession());
  const loc = () => (en() ? "en-GB" : "bg-BG"), spaced = (i) => i.replace(/(.{4})/g, "$1 ").trim();
  const money = (eur) => (L.dashboard && L.dashboard.fmt ? L.dashboard.fmt(eur) : new Intl.NumberFormat(loc(), { style: "currency", currency: "EUR" }).format(eur));
  const need = () => ({ text: t("Влезте в профила си, за да видя данните ви.", "Please sign in so I can see your details.") });
  const say = (bg, e, chips) => ({ text: t(bg, e), chips });
  let confirm = null, log, input, panel, btn;
  const C = { bal: () => t("Салдо", "Balance"), tx: () => t("Последни транзакции", "Recent transactions"), tr: () => t("Как да направя превод?", "How do I send money?"), fx: () => t("Валути и курсове", "Currencies and rates"), fr: () => t("Замрази сметката", "Freeze my account"), hu: () => t("Говори с оператор", "Talk to a human") };
  const MENU = () => [C.bal(), C.tx(), C.tr(), C.fx(), C.fr(), C.hu()];

  /* topics: [regex (Bulgarian + English keywords), answer()] – first match wins, so keep the specific ones on top */
  const TOPICS = [
    [/размраз|активирай сметка|unfreeze|reactivate/i, () => { if (!signed()) return need(); confirm = "unfreeze"; return say("Да активирам отново сметката ви?", "Shall I reactivate your account?", [t("Да, активирай", "Yes, reactivate"), t("Отказ", "Cancel")]); }],
    [/замраз|блокир|загуб|открад|freeze|block|lost|stolen/i, () => { if (!signed()) return need(); confirm = "freeze"; return say("Мога да замразя сметката ви веднага – изходящите плащания ще спрат, докато не я активирате. Да го направя ли?", "I can freeze your account right now – outgoing payments stop until you reactivate it. Shall I?", [t("Да, замрази", "Yes, freeze"), t("Отказ", "Cancel")]); }],
    [/салдо|баланс|наличност|колко пари|balance|how much/i, async () => { if (!signed()) return need(); const a = await api()("/account"); const m = money(a.balance / 100).replace(/\.*$/, "."); /* some currency symbols already end in a dot */
 return say("Наличността по сметката ви е " + m, "Your account balance is " + m, [C.tx()]); }],
    [/iban|номер на сметк|account number/i, async () => { if (!signed()) return need(); const a = await api()("/account"); return say("Вашият IBAN е " + spaced(a.iban) + ". Можете да го копирате с един клик от „Моята сметка“.", "Your IBAN is " + spaced(a.iban) + ". You can copy it in one click from “My account”."); }],
    [/транзакци|последн|движени|история|transaction|recent|history/i, async () => {
      if (!signed()) return need(); const a = await api()("/account"), d = (x) => new Intl.DateTimeFormat(loc(), { day: "numeric", month: "short" }).format(x);
      return { text: t("Последните ви движения:\n", "Your latest activity:\n") + a.tx.slice(0, 4).map((x) => "• " + d(new Date(x.ts)) + " · " + x.name + " · " + money(x.amt / 100)).join("\n") };
    }],
    [/превод|изпрат|прати|transfer|send money|send/i, () => say("Отворете „Преводи“, въведете IBAN на получателя, сума и валута (EUR, USD, GBP, CHF или RON – превръща се в евро по курса). Преводите между клиенти на Luxora пристигат веднага.", "Open “Transfers”, enter the recipient’s IBAN, amount and currency (EUR, USD, GBP, CHF or RON – converted to euro at the rate). Transfers between Luxora customers arrive instantly.", [C.fx()])],
    [/валут|курс|usd|gbp|chf|ron|долар|лира|франк|лея|currenc|rate|exchange/i, async () => {
      let r = {}; try { r = await (await fetch("/api/rates")).json(); } catch (e) { r = { EUR: 1, USD: 1.08, GBP: 0.86, CHF: 0.94, RON: 5.08 }; }
      const l = Object.keys(r).filter((k) => k !== "EUR").map((k) => "1 EUR = " + r[k] + " " + k).join("\n");
      return say("Демо курсове:\n" + l + "\n\nСменете валутата за показване от менюто горе вдясно – тя важи за целия сайт.", "Demo rates:\n" + l + "\n\nChange the display currency from the menu at the top right – it applies across the whole site.");
    }],
    [/лимит|limit/i, () => say("Дневният лимит за преводи е 5 000 €, а за плащания с карта – 2 000 €. Вижте всички в „Моята сметка“ → Управление → Лимити.", "The daily transfer limit is €5,000 and €2,000 for card payments. See them all in “My account” → Manage → Limits.")],
    [/парола|2fa|двуфактор|password|security|сигурност|вход/i, () => say("Включете двуфакторна защита от „Моята сметка“ → Управление → Сигурност. Забравена парола? Натиснете „Забравена парола“ при вход.", "Turn on two-factor protection in “My account” → Manage → Security. Forgot your password? Use “Forgot password” on the sign-in form.")],
    [/такс|комисион|fee|cost|charge/i, () => say("Преводите между клиенти на Luxora са безплатни. Това е демо, затова няма реални такси.", "Transfers between Luxora customers are free. This is a demo, so there are no real fees.")],
    [/извлечени|statement|csv/i, () => say("„Моята сметка“ → бутон „Извлечение“: изберете месец и свалете CSV.", "“My account” → “Statement”: pick a month and download the CSV.")],
    [/кредит|loan/i, async () => {
      const l = signed() ? await api()("/loan") : null;
      if (l && l.status === "active") return say("Имате активен кредит: платени " + l.paid + " от " + l.months + " вноски, месечна вноска " + money(l.payment) + (l.overdue ? ". Има просрочена вноска – платете я от „Кредити“." : "."), "You have an active loan: " + l.paid + " of " + l.months + " instalments paid, monthly instalment " + money(l.payment) + (l.overdue ? ". An instalment is overdue – pay it in “Loans”." : "."));
      return say("В „Кредити“ има калкулатор за месечна вноска и заявка за кредит. След приемане на договора сумата се превежда по сметката ви.", "“Loans” has a repayment calculator and an application. Once you accept the agreement, the money is paid into your account.");
    }],
    [/карта|card/i, () => say("В „Карти“ можете да поръчате карта. В „Сметка“ изберете картата от лентата най-горе – виждате лимита, плащанията и настройките ѝ, както за сметката.", "In “Cards” you can order a card. In “Account”, pick the card from the strip at the top – you get its limit, payments and settings, just like for the account.", [C.fr()])],
    [/оператор|човек|служител|human|agent|operator|support/i, async () => {
      const last = [...log.querySelectorAll(".lxc-me")].slice(-3).map((e) => e.textContent).join(" | ") || "—";
      try { const r = await api()("/support", { message: last }); return say("Създадох заявка " + r.id + ". Колега ще ви отговори до 1 работен ден.", "I created ticket " + r.id + ". A colleague will reply within 1 business day."); } catch (e) { return { text: e.message }; }
    }],
    [/работно|контакт|телефон|имейл|hours|contact|phone|email/i, () => say("Асистентът е на линия 24/7. Операторите работят пн–пт 9:00–18:00.", "The assistant is online 24/7. Human agents work Mon–Fri 9:00–18:00.", [C.hu()])],
    [/^(здравей|здрасти|хей|добър|hi|hello|hey)/i, () => say("Здравейте! С какво мога да помогна?", "Hello! How can I help?", MENU())],
    [/благодаря|мерси|thank/i, () => say("Моля! Има ли още нещо, с което да помогна?", "You’re welcome! Anything else I can help with?")],
    [/помощ|help|какво можеш|what can you/i, () => say("Мога да отговарям за салдо, транзакции, преводи, валути, лимити и сигурност.", "I can help with balance, transactions, transfers, currencies, limits and security.", MENU())]
  ];

  const ACTIONS = { freeze: true, unfreeze: false };
  async function answer(q) {
    if (confirm && /^(да|yes|потвърж|ok|не\b|no\b|отказ|cancel)/i.test(q)) { /* waiting for a yes/no; anything else is treated as a new question */
      const k = confirm; confirm = null;
      if (/^(да|yes|потвърж|ok)/i.test(q)) { try { await api()("/account", { frozen: ACTIONS[k] }, "PATCH"); return say(k === "freeze" ? "Готово – сметката е замразена. Активирайте я отново с „Размрази сметката“." : "Готово – сметката е активна.", k === "freeze" ? "Done – your account is frozen. Say “unfreeze my account” to reactivate it." : "Done – your account is active again."); } catch (e) { return { text: e.message }; } }
      return say("Добре, не променям нищо.", "Okay, I won’t change anything.");
    }
    confirm = null;
    for (const [re, run] of TOPICS) if (re.test(q)) { try { return await run(); } catch (e) { return { text: t("Нещо се обърка: ", "Something went wrong: ") + e.message }; } }
    return say("Не съм сигурен, че разбрах. Опитайте с някоя от темите или говорете с оператор.", "I’m not sure I understood. Try one of the topics or talk to a human.", MENU());
  }

  /* ---------- UI ---------- */
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
  function add(role, text, chips) {
    log.querySelectorAll(".lxc-chips").forEach((c) => c.remove()); /* only the latest suggestions stay */
    const m = el("div", "lxc-msg " + (role === "me" ? "lxc-me" : "lxc-bot"), text); log.append(m);
    if (chips && chips.length) { const c = el("div", "lxc-chips"); chips.forEach((x) => { const b = el("button", "", x); b.type = "button"; b.onclick = () => ask(x); c.append(b); }); log.append(c); }
    log.scrollTop = log.scrollHeight; return m;
  }
  async function ask(q) {
    q = q.trim(); if (!q) return; add("me", q);
    const typing = add("bot", "…"), r = await answer(q); typing.remove(); add("bot", r.text, r.chips);
    log.scrollTop = log.scrollHeight;
  }
  function labels() { panel.setAttribute("aria-label", t("Асистент на Luxora", "Luxora assistant")); panel.querySelector(".lxc-head b").textContent = t("Асистент на Luxora", "Luxora assistant"); panel.querySelector(".lxc-head small").textContent = t("Отговаря веднага", "Replies instantly"); input.placeholder = t("Напишете въпрос…", "Type your question…"); input.setAttribute("aria-label", input.placeholder); panel.querySelector(".lxc-form button").textContent = t("Изпрати", "Send"); panel.querySelector(".lxc-x").setAttribute("aria-label", t("Затвори чата", "Close chat")); btn.setAttribute("aria-label", t("Отвори чата за помощ", "Open support chat")); }
  function toggle(open) {
    panel.hidden = !open; btn.setAttribute("aria-expanded", open);
    if (open) { if (!log.children.length) add("bot", t("Здравейте! Аз съм асистентът на Luxora. Питайте ме за салдо, преводи, валути или сигурност.", "Hi! I’m the Luxora assistant. Ask me about your balance, transfers, currencies or security."), MENU()); input.focus(); } else btn.focus();
  }
  function build() {
    btn = el("button", "lxc-btn"); btn.type = "button"; btn.setAttribute("aria-haspopup", "dialog"); btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 11h6M9 14h4"/></svg>';
    panel = el("section", "lxc-panel"); panel.hidden = true; panel.setAttribute("role", "dialog");
    panel.innerHTML = '<div class="lxc-head"><span class="lxc-mono" aria-hidden="true">LX</span><div><b></b><small></small></div><button type="button" class="lxc-x">×</button></div><div class="lxc-log" role="log" aria-live="polite"></div><form class="lxc-form"><input type="text" autocomplete="off" maxlength="200"><button type="submit"></button></form>';
    document.body.append(panel, btn); log = panel.querySelector(".lxc-log"); input = panel.querySelector("input"); labels();
    btn.onclick = () => toggle(panel.hidden); panel.querySelector(".lxc-x").onclick = () => toggle(false);
    panel.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });
    panel.querySelector("form").onsubmit = (e) => { e.preventDefault(); const q = input.value; input.value = ""; ask(q); };
    window.addEventListener("luxora:lang", labels); document.addEventListener("luxora:lang", labels);
  }
  if (document.body) build(); else document.addEventListener("DOMContentLoaded", build); /* on the landing page this script loads in <head> */
})(window.Luxora = window.Luxora || {});

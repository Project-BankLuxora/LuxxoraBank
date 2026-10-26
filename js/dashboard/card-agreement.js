/* Dashboard – card-agreement.js
   The "Agreement" tab (the simulated cardholder agreement filled in from the card: accept / decline, closure with checks)
   and the "Payments" tab (transactions, fees, report-a-problem and traceable refunds).
   Bulgarian text is translated by i18n (each label sits in its own element so it matches the dictionary). */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});
  const S = D.cardStore, P = D.CARD_PRODUCTS, $ = (id) => document.getElementById(id), T = (s) => LuxoraI18n.t(s);
  const AS = { pending: "Чака приемане", active: "Активен", closed: "Закрит" };
  const esc = (s) => s.replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
  const row = (dt, dd) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`;
  const dl = (rows) => `<dl class="kv">${rows.map(([k, v]) => row(k, v)).join("")}</dl>`;
  const sec = (h, body) => `<section><h3>${h}</h3>${body}</section>`;
  const btn = (act, text, cls, extra) => `<button type="button" class="button ${cls} button-small" data-act="${act}"${extra || ""}>${text}</button>`;

  function agreement(c) {
    const p = P[c.product], a = c.agr, refs = c.tx.filter((t) => t.dispute).map((t) => t.dispute.ref);
    return `<article class="loan-doc">
      <header class="loan-doc-head">
        <p class="loan-doc-brand">LUXORA BANK</p>
        <h2>Договор на картодържателя</h2>
        ${dl([["Референция на документа:", a.id], ["Продукт:", p.name], ["Референция на картата:", "•••• •••• •••• " + c.last4], ["Статус:", `<span class="loan-status is-${a.status}">${AS[a.status]}</span>`]])}
      </header>
      ${sec("1. Страни", dl([["Издател:", "Luxora Bank (измислена институция)"], ["Картодържател:", D.customerId()], ["Продукт на картата:", p.name]]))}
      ${sec("2. Условия на продукта", dl(D.cardTerms(c.product, c.limit)))}
      ${sec("3. Използване на картата", "<p>Картодържателят може да използва картата за транзакции, поддържани от симулацията на Luxora, в зависимост от наличния баланс или кредит, статуса на картата и зададените лимити за транзакции.</p>")}
      ${sec("4. Сигурност и контрол на картата", "<p>Картодържателят може да използва поддържаните контроли, за да замрази картата, да съобщи за загубата ѝ и да поиска замяна. Чувствителните данни на картата трябва да бъдат защитени в приложението.</p>" + dl([["Текущо състояние на картата:", S.STATE[S.state(c)]]]))}
      ${sec("5. Такси и лихви", "<p>Всички приложими такси и лихви трябва да бъдат показани преди приемане. Всяко изчисляване на такса или лихва трябва да следва политиката на съответния продукт и да се отразява в историята на транзакциите или извлеченията.</p>")}
      ${sec("6. Изгубени карти и замени", "<p>Картата, за която е подаден сигнал за загуба или кражба, трябва да бъде блокирана за нови транзакции. Заместващата карта получава нова референция и трябва да бъде активирана преди употреба.</p>")}
      ${sec("7. Спорове и грешки в транзакциите", "<p>Симулацията трябва да позволява на клиента да съобщи за непозната или грешна транзакция. Транзакцията се записва за преглед, а всяко симулирано възстановяване или корекция трябва да бъде проследимо.</p>" + dl([["Регистрирани сигнали:", refs.length ? refs.join(", ") : "Няма"]]))}
      ${sec("8. Закриване", "<p>Картодържателят може да поиска закриване. Системата проверява за неприключени авторизации, възстановявания, такси или дълг по кредитна карта, преди да завърши закриването, когато е приложимо.</p>")}
      ${sec("9. Приемане", `<p>Клиентът потвърждава, че е прегледал условията на продукта, лимитите, таксите, контролите за сигурност и приложимите задължения за погасяване.</p>
        ${dl([["Потвърждение на клиента:", a.accepted ? "Приет" : "Не е приет"], ["Час на приемане:", a.accepted ? D.dateTime(new Date(a.accepted)) : "—"]])}
        <p class="loan-notice"><strong>Известие за симулация:</strong> Luxora Bank е измислена. Този договор е документ от образователен проект, а не реален договор за платежна карта. Тези правила на симулацията не осъществяват достъп до реална платежна мрежа или банкова сметка.</p>`)}
    </article>`;
  }

  function actions(c) {
    if (c.agr.status === "pending") return `<div class="loan-actions">
      <label class="loan-check"><input type="checkbox" id="card-review"><span>Прегледах условията на продукта, лимитите, таксите, контролите за сигурност и задълженията за погасяване.</span></label>
      <div class="loan-buttons">${btn("accept", "Приемам", "button-gold", " id=\"card-accept\" disabled")}${btn("decline", "Отказвам", "button-outline")}</div></div>`;
    return c.agr.status === "active" ? `<div class="loan-actions"><div class="loan-buttons">${btn("close", "Поискай закриване на картата", "button-outline")}</div></div>` : "";
  }

  D.renderCardDoc = function () {
    const c = S.cur();
    $("card-doc").innerHTML = c ? agreement(c) + actions(c) : "<p class=\"goal-text\">Нямате карти. Поръчайте нова от раздел „Нова карта“.</p>";
  };

  $("card-doc").addEventListener("change", (e) => { if (e.target.id === "card-review") $("card-accept").disabled = !e.target.checked; });

  $("card-doc").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"), c = S.cur();
    if (!b || !c) return;
    const act = b.dataset.act, p = P[c.product];
    let m = "";
    if (act === "accept") {
      c.agr.status = "active"; c.agr.accepted = Date.now(); m = "Договорът е приет. Картата е активна.";
      if (p.issue) c.tx.unshift({ id: "f" + Date.now(), name: "Такса за издаване на карта", ts: Date.now(), amount: -p.issue }); /* fees show up in the history */
    } else if (act === "decline") {
      S.cards.splice(S.cards.indexOf(c), 1); S.save(); D.refreshCards();
      $("card-msg").textContent = T("Договорът не е приет. Поръчката на картата е отменена."); D.cardTab(0); return;
    } else if (act === "close") { /* closure checks: open reports (refund pending) and credit-card debt */
      const block = c.tx.some((t) => t.dispute && t.dispute.status === "review") ? "Закриването не е възможно: има неприключени сигнали за транзакции."
        : c.debt > 0 ? "Закриването не е възможно: има неплатен дълг по кредитната карта." : "";
      if (block) { $("card-doc-msg").textContent = T(block); return; }
      if (!confirm(T("Да закрия ли картата?"))) return;
      c.agr.status = "closed"; m = "Картата е закрита.";
    }
    S.save(); D.refreshCards(); $("card-doc-msg").textContent = T(m);
  });

  /* ---- payments: transactions of the selected card, report a problem, traceable refund ---- */
  D.renderPayments = function () {
    const c = S.cur();
    $("card-tx").innerHTML = !c ? "<p class=\"goal-text\">Нямате карти. Поръчайте нова от раздел „Нова карта“.</p>" : !c.tx.length ? "<p class=\"goal-text\">Няма транзакции по тази карта.</p>"
      : `<ul class="tx-list">${c.tx.map((t) => {
        const d = t.dispute, open = d && d.status === "review";
        const act = d ? (open ? btn("refund", "Симулирай възстановяване", "button-outline", ` data-tx="${t.id}"`) : "") : t.amount < 0 ? btn("dispute", "Съобщи за проблем", "button-outline", ` data-tx="${t.id}"`) : "";
        return `<li><span>${esc(t.name)}<small>${D.date(new Date(t.ts))}${t.ref ? " · " + t.ref : ""}</small>${d ? `<small><span class="loan-status${open ? "" : " is-closed"}">${open ? "В преглед" : "Възстановена"}</span> ${d.ref}</small>` : ""}</span>
          <span class="tx-end"><b${t.amount > 0 ? ' class="amount-positive"' : ""}>${D.fmt(t.amount, true)}</b>${act}</span></li>`;
      }).join("")}</ul>`;
  };

  $("card-tx").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"), c = S.cur(), t = b && c && c.tx.find((x) => x.id === b.dataset.tx);
    if (!t) return;
    let m;
    if (b.dataset.act === "dispute") { t.dispute = { ref: "DSP-" + String(Date.now()).slice(-6), ts: Date.now(), status: "review" }; m = "Сигналът е записан за преглед."; }
    else { /* the refund is its own history line that carries the report's reference, so it can be traced back */
      t.dispute.status = "refunded";
      c.tx.unshift({ id: "r" + Date.now(), name: "Корекция (възстановяване)", ts: Date.now(), amount: -t.amount, ref: t.dispute.ref });
      m = "Възстановяването е записано и е свързано със сигнала.";
    }
    S.save(); D.refreshCards(); $("card-pay-msg").textContent = T(m);
  });
})(window.Luxora = window.Luxora || {});

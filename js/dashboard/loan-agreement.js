/* Dashboard – loan-agreement.js
   The "Agreement and repayment" tab: the simulated loan agreement document filled in from the stored loan,
   accept / decline, and once active the repayment schedule with pay, missed payment and early repayment.
   Bulgarian text is translated by i18n (each label sits in its own element so it matches the dictionary). */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});
  const $ = (id) => document.getElementById(id);
  const T = (s, ...a) => LuxoraI18n.t(s, ...a);
  const NA = "Неприложимо";
  const STATUS = { draft: "Чернова", pending: "Чака приемане", active: "Активен", closed: "Закрит" };

  const row = (dt, dd) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`;
  const customerId = () => { let h = 7; for (const c of D.loanStore.owner()) h = (h * 31 + c.charCodeAt(0)) % 1000000; return "CUST-" + String(h).padStart(6, "0"); };
  D.customerId = customerId; /* the card agreement shows the same customer id */
  const msg = (s) => { $("loan-doc-msg").textContent = T(s); };

  function agreement(l) {
    const P = D.PRODUCTS[l.product], start = new Date(l.accepted || l.created), rows = D.schedule(l.principal, l.rate, l.months, start), c = l.collateral;
    const stat = `<span class="loan-status is-${l.status}">${STATUS[l.status]}</span>`;
    return `<article class="loan-doc">
      <header class="loan-doc-head">
        <p class="loan-doc-brand">LUXORA BANK</p>
        <h2>Симулиран договор за кредит</h2>
        <dl class="kv">${row("Референция на документа:", "LXA-" + l.id)}${row("Продукт:", P.name)}${row("Статус:", stat)}</dl>
      </header>
      <section><h3>1. Страни</h3>
        <dl class="kv">${row("Кредитор:", "Luxora Bank")}${row("Кредитополучател:", customerId())}${row("Референция на кредита:", "LN-" + l.id)}</dl></section>
      <section><h3>2. Главница и погасяване</h3>
        <dl class="kv">
          ${row("Първоначална главница:", D.eur(l.principal))}
          ${row("Валута:", "EUR")}
          ${row("Годишен лихвен процент:", D.pct(l.rate))}
          ${row("Начин на изчисляване на лихвата:", "Месечно намаляващо салдо")}
          ${row("Срок:", `${l.months} <span>месеца</span>`)}
          ${row("Месечна вноска:", D.eur(l.payment))}
          ${row("Обща сума за връщане по план:", D.eur(l.total))}
          ${row("Такси:", "€0 по първоначалната политика на симулацията")}
          ${row("Дата на първата вноска:", D.date(rows[0].date))}
          ${row("Дата на последната вноска:", D.date(rows[rows.length - 1].date))}
        </dl></section>
      <section><h3>3. Лихва и рисково класифициране</h3>
        <p>Годишният лихвен процент се определя според симулираната политика за рискова оценка на Luxora Bank и избрания кредитен продукт. Лихвата, вноската и общата сума за връщане трябва да бъдат показани на кредитополучателя преди приемане.</p>
        <dl class="kv">${row("Рисков клас (симулиран)", l.risk)}</dl></section>
      <section><h3>4. Обезпечение</h3>
        <dl class="kv">
          ${row("Изисква се обезпечение:", c ? "Да" : "Не")}
          ${row("Вид обезпечение:", c ? T({ real: "Недвижим имот", vehicle: "Превозно средство", deposit: "Депозит" }[c.type] || "Депозит") : NA)}
          ${row("Референция на актива:", c ? c.ref : NA)}
          ${row("Записана оценка:", c ? D.eur(c.value) : NA)}
          ${row("Условия за освобождаване:", c ? "След пълното погасяване на кредита." : NA)}
        </dl>
        <p>Микрокредитите са необезпечени. Средните кредити могат да бъдат необезпечени или обезпечени с допустим заложен актив. Високостойностните кредити могат да изискват обезпечение след засилен преглед.</p></section>
      <section><h3>5. Задължения за погасяване</h3>
        <p>Кредитополучателят се съгласява да спазва показания погасителен план в рамките на симулацията. Плащанията намаляват неплатеното задължение според зададените правила за разпределение на лихва и главница.</p></section>
      <section><h3>6. Пропуснати плащания</h3>
        <p>Пропуснато плащане може да доведе до напомняне, статус „просрочен“ и преглед според симулираната политика за просрочия. Допълнителни такси или изпълнение върху обезпечението не са автоматични и могат да възникнат само ако изрично се поддържат от правилата на съответния продукт.</p></section>
      <section><h3>7. Предсрочно погасяване</h3>
        <p>Предсрочното погасяване е разрешено по първоначалната политика на симулацията без допълнителна такса. Системата трябва да изчисли правилно оставащата главница и начислената лихва.</p></section>
      <section><h3>8. Приемане и разкриване</h3>
        <p>Преди приемане кредитополучателят трябва да прегледа главницата, лихвения процент, погасителния план, общата сума за връщане, правилата за просрочени плащания и условията за обезпечение, когато е приложимо.</p>
        <p class="loan-notice"><strong>Известие за симулация:</strong> Този договор е за измислена образователна банкова система. Той не е реален кредитен договор и не създава действително задължение или изпълняемо залогово право.</p>
        <dl class="kv">
          ${row("Потвърждение на кредитополучателя:", l.accepted ? "Приет" : "Не е приет")}
          ${row("Час на приемане:", l.accepted ? D.dateTime(new Date(l.accepted)) : "—")}
        </dl></section>
    </article>`;
  }

  const btn = (act, text, cls, extra) => `<button type="button" class="button ${cls} button-small" data-act="${act}"${extra || ""}>${text}</button>`;

  function schedule(l) {
    const rows = D.schedule(l.principal, l.rate, l.months, new Date(l.accepted || l.created));
    return `<h3 class="loan-h3">Погасителен план</h3><div class="loan-table-wrap"><table class="loan-table">
      <thead><tr><th>Дата</th><th>Вноска</th><th>Лихва</th><th>Главница</th><th>Остатък</th></tr></thead><tbody>${
        rows.map((x, i) => `<tr${i < l.paid ? ' class="is-paid"' : ""}><td>${D.date(x.date)}</td><td>${D.eur(x.payment)}</td><td>${D.eur(x.interest)}</td><td>${D.eur(x.principal)}</td><td>${D.eur(x.balance)}</td></tr>`).join("")
      }</tbody></table></div>`;
  }

  function actions(l) {
    if (l.status === "pending") return `<div class="loan-actions">
      <label class="loan-check"><input type="checkbox" id="loan-review"><span>Прегледах главницата, лихвения процент, погасителния план, общата сума, правилата за просрочие и условията за обезпечение.</span></label>
      <div class="loan-buttons">${btn("accept", "Приемам", "button-gold", " id=\"loan-accept\" disabled")}${btn("decline", "Отказвам", "button-outline")}</div></div>`;
    const done = l.status === "closed", pct = Math.round(l.paid / l.months * 100);
    return `<div class="loan-actions">
      <p class="goal-text"><span>Платени вноски:</span> <b>${l.paid} / ${l.months}</b></p>
      <div class="progress"><span style="width:${pct}%"></span></div>
      ${l.overdue && !done ? '<p class="loan-warn" role="status">Просрочена вноска (демо): изпратено е напомняне и случаят е за преглед по симулираната политика. Няма автоматични допълнителни такси.</p>' : ""}
      <div class="loan-buttons">${done ? btn("new", "Нов кредит", "button-gold") : btn("pay", "Плати следващата вноска", "button-gold") + btn("miss", "Симулирай пропусната вноска", "button-outline") + btn("early", "Погаси предсрочно", "button-outline")}</div>
    </div>${schedule(l)}`;
  }

  D.renderLoan = function () {
    const l = D.loanStore.get(), box = $("loan-doc");
    box.innerHTML = l ? agreement(l) + actions(l) : '<p class="goal-text">Нямате кредит. Започнете от раздел „Заявка“.</p>';
  };

  $("loan-doc").addEventListener("change", (e) => { if (e.target.id === "loan-review") $("loan-accept").disabled = !e.target.checked; });

  $("loan-doc").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"), l = D.loanStore.get();
    if (!b || !l) return;
    const act = b.dataset.act, rows = D.schedule(l.principal, l.rate, l.months, new Date(l.accepted || l.created));
    let m = "";
    if (act === "accept") { l.status = "active"; l.accepted = Date.now(); m = "Договорът е приет. Кредитът е активен."; }
    else if (act === "decline") { D.loanStore.set(null); D.renderLoan(); msg("Договорът не е приет. Заявката е отменена."); D.loanTab(0); return; }
    else if (act === "new") { D.loanStore.set(null); D.renderLoan(); msg(""); D.loanTab(0); return; }
    else if (act === "pay") { l.paid++; l.overdue = false; if (l.paid >= l.months) { l.status = "closed"; m = "Кредитът е погасен изцяло."; } else m = "Вноската е платена."; }
    else if (act === "miss") { l.overdue = true; m = "Просрочена вноска (демо): изпратено е напомняне и случаят е за преглед по симулираната политика. Няма автоматични допълнителни такси."; }
    else if (act === "early") {
      const bal = l.paid ? rows[l.paid - 1].balance : l.principal, due = Math.round(bal * (1 + l.rate / 1200) * 100) / 100; /* remaining principal + one month's accrued interest */
      if (!confirm(T("Предсрочно погасяване: %s (остатъчна главница и начислена лихва, без такса). Потвърждавате ли?", D.eur(due)))) return;
      l.paid = l.months; l.overdue = false; l.status = "closed"; m = "Кредитът е погасен предсрочно без такса.";
    }
    D.loanStore.set(l); D.renderLoan(); msg(m);
  });
})(window.Luxora = window.Luxora || {});

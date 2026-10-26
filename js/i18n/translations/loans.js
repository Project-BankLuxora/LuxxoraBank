/* Luxora Bank – i18n/translations/loans.js
   Bulgarian -> English for the loan screens (application form, statuses, messages). */
(function (L) {
  const I = (L.i18n = L.i18n || {});
  I.dict = Object.assign(I.dict || {}, {
    "Микрокредитите са необезпечени.": "Microloans are unsecured.",
    "Заявка": "Application", "Договор и погасяване": "Agreement and repayment", "Продукт": "Product",
    "Микрокредит": "Microloan", "Среден кредит": "Medium loan", "Високостойностен кредит": "High-value loan",
    "Главница:": "Principal:", "Месечен доход (EUR)": "Monthly income (EUR)", "Текущи месечни задължения (EUR)": "Current monthly obligations (EUR)",
    "Обезпечение": "Collateral", "Без обезпечение": "No collateral", "С обезпечение": "With collateral", "Вид на обезпечението": "Collateral type",
    "Недвижим имот": "Real estate", "Превозно средство": "Vehicle", "Депозит": "Deposit", "Оценка на обезпечението (EUR)": "Collateral valuation (EUR)",
    "Годишен лихвен процент": "Annual interest rate", "Рисков клас (симулиран)": "Risk class (simulated)", "Месечна вноска": "Monthly installment",
    "Обща сума за връщане": "Total repayment", "Такси": "Fees", "Прегледай договора": "Review agreement",
    "Чернова": "Draft", "Чака приемане": "Pending acceptance", "Активен": "Active", "Закрит": "Closed",
    "Вноската е твърде висока спрямо дохода. Намалете сумата или удължете срока.": "The installment is too high compared with your income. Lower the amount or lengthen the term.",
    "Оценката на обезпечението трябва да покрива главницата.": "The collateral valuation must cover the principal.",
    "Вече имате кредит. Откажете договора или го погасете първо.": "You already have a loan. Decline the agreement or repay it first.",
    "Нямате кредит. Започнете от раздел „Заявка“.": "You have no loan. Start from the “Application” tab.",
    "Дата": "Date", "Вноска": "Installment", "Лихва": "Interest", "Главница": "Principal", "Остатък": "Balance", "Погасителен план": "Repayment schedule",
    "Прегледах главницата, лихвения процент, погасителния план, общата сума, правилата за просрочие и условията за обезпечение.": "I have reviewed the principal, interest rate, repayment schedule, total repayment, overdue-payment rules and collateral conditions.",
    "Приемам": "Accept", "Отказвам": "Decline", "Платени вноски:": "Installments paid:", "Плати следващата вноска": "Pay next installment",
    "Симулирай пропусната вноска": "Simulate missed payment", "Погаси предсрочно": "Repay early", "Нов кредит": "New loan",
    "Договорът е приет. Кредитът е активен.": "Agreement accepted. The loan is active.",
    "Договорът не е приет. Заявката е отменена.": "Agreement not accepted. The application was cancelled.",
    "Вноската е платена.": "Installment paid.", "Кредитът е погасен изцяло.": "The loan is fully repaid.",
    "Просрочена вноска (демо): изпратено е напомняне и случаят е за преглед по симулираната политика. Няма автоматични допълнителни такси.": "Overdue installment (demo): a reminder was sent and the case is under review under the simulated policy. No extra charges are applied automatically.",
    "Предсрочно погасяване: %s (остатъчна главница и начислена лихва, без такса). Потвърждавате ли?": "Early repayment: %s (remaining principal and accrued interest, no fee). Do you confirm?",
    "Кредитът е погасен предсрочно без такса.": "The loan was repaid early with no fee."
  });
})(window.Luxora = window.Luxora || {});

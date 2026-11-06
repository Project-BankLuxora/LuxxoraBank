/* Luxora Bank – i18n/translations/card-agreement.js
   Bulgarian -> English for the card products, the simulated cardholder agreement, payments / reports and the new card controls.
   (Labels such as "Продукт:", "Статус:", "1. Страни", "Приемам", "Приет" are shared with loan-agreement.js / loans.js.) */
(function (L) {
  const I = (L.i18n = L.i18n || {});
  I.dict = Object.assign(I.dict || {}, {
    /* products and card states */
    "Стандартна дебитна": "Standard Debit", "Премиум дебитна": "Premium Debit", "Предплатена": "Prepaid",
    "Чака активиране": "Awaiting activation", "Закрита": "Closed",
    /* order form + terms */
    "Прегледай договора": "Review agreement", "Договор": "Agreement", "Продукт": "Product",
    "Такса за издаване:": "Issue fee:", "Месечна или годишна такса:": "Monthly or annual fee:", "на месец": "per month", "на година": "per year",
    "Дневен лимит за покупки:": "Daily purchase limit:", "Дневен лимит за ATM:": "Daily ATM limit:", "Не се поддържа": "Not supported",
    "Източник на средства:": "Funding source:", "Свързана сметка": "Linked account", "Предплатен баланс": "Prepaid balance", "Кредитно улеснение": "Credit facility",
    "Кредитно улеснение:": "Credit facility:", "Приложим лихвен процент:": "Applicable interest rate:",
    /* agreement document (template sections 1-9) */
    "Договор на картодържателя": "Cardholder Agreement", "Референция на картата:": "Card reference:",
    "Издател:": "Issuer:", "Картодържател:": "Cardholder:", "Продукт на картата:": "Card product:",
    "2. Условия на продукта": "2. Product terms",
    "3. Използване на картата": "3. Card use",
    "Картодържателят може да използва картата за транзакции, поддържани от симулацията на Luxora, в зависимост от наличния баланс или кредит, статуса на картата и зададените лимити за транзакции.": "The cardholder may use the card for transactions supported by the Luxora simulation, subject to the available balance or credit, card status, and configured transaction limits.",
    "4. Сигурност и контрол на картата": "4. Security and card controls",
    "Картодържателят може да използва поддържаните контроли, за да замрази картата, да съобщи за загубата ѝ и да поиска замяна. Чувствителните данни на картата трябва да бъдат защитени в приложението.": "The cardholder can use the supported controls to freeze the card, report it lost, and request a replacement. Sensitive card details must be protected in the application.",
    "Текущо състояние на картата:": "Current card state:",
    "5. Такси и лихви": "5. Fees and interest",
    "Всички приложими такси и лихви трябва да бъдат показани преди приемане. Всяко изчисляване на такса или лихва трябва да следва политиката на съответния продукт и да се отразява в историята на транзакциите или извлеченията.": "All applicable fees and interest must be displayed before acceptance. Any fee or interest calculation must follow the relevant product policy and be reflected in the transaction or statement history.",
    "6. Изгубени карти и замени": "6. Lost cards and replacements",
    "Картата, за която е подаден сигнал за загуба или кражба, трябва да бъде блокирана за нови транзакции. Заместващата карта получава нова референция и трябва да бъде активирана преди употреба.": "A reported lost or stolen card must be blocked from new transactions. A replacement receives a new card reference and must be activated before use.",
    "7. Спорове и грешки в транзакциите": "7. Disputes and transaction errors",
    "Симулацията трябва да позволява на клиента да съобщи за непозната или грешна транзакция. Транзакцията се записва за преглед, а всяко симулирано възстановяване или корекция трябва да бъде проследимо.": "The simulation should allow the customer to report an unfamiliar or incorrect transaction. The transaction is recorded for review, and any simulated refund or adjustment must be traceable.",
    "Регистрирани сигнали:": "Reported cases:", "Няма": "None",
    "8. Закриване": "8. Closure",
    "Картодържателят може да поиска закриване. Системата проверява за неприключени авторизации, възстановявания, такси или дълг по кредитна карта, преди да завърши закриването, когато е приложимо.": "The cardholder may request closure. The system checks for outstanding authorizations, refunds, fees, or credit-card debt before completing closure, where applicable.",
    "9. Приемане": "9. Acceptance",
    "Клиентът потвърждава, че е прегледал условията на продукта, лимитите, таксите, контролите за сигурност и приложимите задължения за погасяване.": "The customer confirms that they have reviewed the product terms, limits, fees, security controls, and applicable repayment obligations.",
    "Потвърждение на клиента:": "Customer confirmation:",
    "Luxora Bank е измислена. Този договор е документ от образователен проект, а не реален договор за платежна карта. Тези правила на симулацията не осъществяват достъп до реална платежна мрежа или банкова сметка.": "Luxora Bank is fictional. This agreement is an educational project document, not a real payment-card contract. No real payment network or bank account is accessed by these simulation rules.",
    "Прегледах условията на продукта, лимитите, таксите, контролите за сигурност и задълженията за погасяване.": "I have reviewed the product terms, limits, fees, security controls and repayment obligations.",
    /* card controls, closure, payments */
    "Съобщи за загубена и замени": "Report lost and replace", "Активирай картата": "Activate card", "Преглед на договора": "Review agreement",
    "Поискай закриване на картата": "Request card closure",
    "Да съобщя ли за загубена или открадната карта? Тя ще бъде блокирана, а заместващата карта трябва да се активира.": "Report this card lost or stolen? It will be blocked and the replacement card must be activated.",
    "Да закрия ли картата?": "Close this card?",
    "Картата е активирана.": "The card was activated.",
    "Картата е блокирана. Заместващата карта има нова референция и трябва да се активира.": "The card was blocked. The replacement has a new reference and must be activated.",
    "Договорът е приет. Картата е активна.": "Agreement accepted. The card is active.",
    "Договорът не е приет. Поръчката на картата е отменена.": "Agreement not accepted. The card order was cancelled.",
    "Картата е закрита.": "The card was closed.",
    "Закриването не е възможно: има неприключени сигнали за транзакции.": "Closure is not possible: there are unresolved transaction reports.",
    "Закриването не е възможно: има неплатен дълг по кредитната карта.": "Closure is not possible: the credit card has an unpaid balance.",
    "Такса за издаване на карта": "Card issue fee", "Няма транзакции по тази карта.": "There are no transactions on this card.",
    "Съобщи за проблем": "Report a problem", "Симулирай възстановяване": "Simulate refund", "В преглед": "Under review", "Възстановена": "Refunded",
    "Корекция (възстановяване)": "Adjustment (refund)",
    "Сигналът е записан за преглед.": "The report was recorded for review.",
    "Възстановяването е записано и е свързано със сигнала.": "The refund was recorded and linked to the report."
  });
})(window.Luxora = window.Luxora || {});

/* Luxora Bank – auth/modal-markup.js
   The popup's HTML and the title / button text for each mode. */
(function (L) {
  const A = (L.auth = L.auth || {});

  A.MODAL_HTML = `
  <div class="lx-modal" role="dialog" aria-modal="true" aria-labelledby="lx-title">
    <button type="button" class="lx-close" aria-label="Затвори">&times;</button>
    <div class="lx-tabs" id="lx-tabs" role="tablist">
      <button type="button" role="tab" data-mode="login">Вход</button>
      <button type="button" role="tab" data-mode="register">Регистрация</button>
    </div>
    <h2 id="lx-title"></h2>
    <form id="lx-form" novalidate>
      <label class="lx-field" id="lx-name-row" hidden><span>Име и фамилия</span><input id="lx-name" type="text" autocomplete="name"></label>
      <label class="lx-field" id="lx-email-row"><span>Имейл</span><input id="lx-email" type="email" autocomplete="email" required></label>
      <label class="lx-field" id="lx-code-row" hidden><span>Код от имейла (6 цифри)</span><input id="lx-code" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></label>
      <label class="lx-field" id="lx-pass-row"><span id="lx-pass-label">Парола (поне 8 символа)</span><input id="lx-pass" type="password" minlength="8" required></label>
      <button class="lx-submit" id="lx-submit" type="submit"></button>
      <button type="button" class="lx-link" id="lx-forgot">Забравена парола?</button>
      <button type="button" class="lx-link" id="lx-back" hidden>← Обратно към вход</button>
      <p class="lx-msg" id="lx-msg" role="alert" aria-live="polite"></p>
    </form>
  </div>`;

  A.TITLES = { login: "Добре дошли отново", register: "Станете клиент на Luxora", forgot: "Забравена парола", reset: "Въведете кода", twofa: "Двуфакторна защита" };
  A.SUBMIT = { login: "Влез", register: "Създай профил", forgot: "Изпрати код", reset: "Смени паролата", twofa: "Потвърди" };
})(window.Luxora = window.Luxora || {});

/* Dashboard – forms.js
   The demo forms (transfer, loan) and the log-out button. */
(function () {
  document.querySelectorAll("form[data-demo]").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); f.querySelector(".form-msg").textContent = LuxoraI18n.t(f.dataset.demo); }));
  document.querySelector("[data-logout]").addEventListener("click", () => LuxoraAuth.logout());
})();

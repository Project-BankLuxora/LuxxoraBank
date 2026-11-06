/* Luxora Bank – auth/header.js
   Hooks the existing header buttons (Log in / Become a client) and keeps their text in sync with the session. */
(function (L) {
  const A = (L.auth = L.auth || {});

  A.refreshHeader = function () {
    const s = A.getSession();
    document.querySelectorAll("[data-user-name]").forEach((el) => { el.textContent = s ? s.name.split(" ")[0] : ""; });
    const box = document.querySelector(".site-header-actions");
    if (!box) return;
    const [loginBtn, joinBtn] = box.querySelectorAll("a");
    if (loginBtn) loginBtn.textContent = s ? "Изход" : "Вход";
    if (joinBtn) {
      joinBtn.textContent = s ? s.name.split(" ")[0] : "Стани клиент";
      joinBtn.title = s ? s.email : "";
    }
  };

  A.hookHeader = function () {
    /* pages marked data-requires-auth (the dashboard) bounce visitors who are not signed in */
    if (A.isProtectedPage() && !A.getSession()) { location.replace(document.body.dataset.home || A.HOME); return; }
    const box = document.querySelector(".site-header-actions");
    if (!box) return;
    const [loginBtn, joinBtn] = box.querySelectorAll("a");
    if (loginBtn) loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      A.getSession() ? A.logout() : A.openModal("login");
    });
    if (joinBtn) joinBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!A.getSession()) A.openModal("register");
      else if (A.isProtectedPage()) location.hash = "profile";
      else location.href = A.DASHBOARD;
    });
    A.refreshHeader();
  };
})(window.Luxora = window.Luxora || {});

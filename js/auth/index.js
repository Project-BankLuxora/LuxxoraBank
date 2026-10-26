/* Luxora Bank – auth/index.js
   Loads last: publishes the public window.LuxoraAuth API and starts the header hook. */
(function (L) {
  const A = L.auth;

  window.LuxoraAuth = {
    register: A.register,
    login: A.login,
    verify2FA: A.verify2FA,
    setTwoFA: A.setTwoFA,
    hasTwoFA: A.hasTwoFA,
    requestReset: A.requestReset,
    resetPassword: A.resetPassword,
    logout: A.logout,
    getSession: A.getSession,
    open: (m) => A.openModal(m)
  };

  document.addEventListener("DOMContentLoaded", A.hookHeader);
})(window.Luxora = window.Luxora || {});

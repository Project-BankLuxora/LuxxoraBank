/* Luxora Bank – auth/session.js
   Opening and closing the signed-in session (per browser tab, see api.js). */
(function (L) {
  const A = (L.auth = L.auth || {});

  /* r = { token, user: { name, email, twofa } } as returned by the server */
  A.startSession = function (r) {
    sessionStorage.setItem(A.SESSION_KEY, JSON.stringify({ name: r.user.name, email: r.user.email, twofa: !!r.user.twofa, token: r.token, at: Date.now() }));
  };

  A.logout = function () {
    const done = () => { sessionStorage.removeItem(A.SESSION_KEY); if (A.isProtectedPage()) location.replace(document.body.dataset.home || A.HOME); else A.refreshHeader(); };
    A.api("/logout", {}).then(done, done);
  };
})(window.Luxora = window.Luxora || {});

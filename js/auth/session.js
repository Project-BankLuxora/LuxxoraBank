/* Luxora Bank – auth/session.js
   Opening and closing the signed-in session. */
(function (L) {
  const A = (L.auth = L.auth || {});

  A.startSession = function (user) {
    localStorage.setItem(A.SESSION_KEY, JSON.stringify({ name: user.name, email: user.email, at: Date.now() }));
  };

  A.logout = function () {
    localStorage.removeItem(A.SESSION_KEY);
    if (A.isProtectedPage()) location.replace(document.body.dataset.home || A.HOME);
    else A.refreshHeader();
  };
})(window.Luxora = window.Luxora || {});

/* Luxora Bank – auth/storage.js
   Storage keys, page names and the small helpers that read/write localStorage.
   Demo auth stored in localStorage – swap these for fetch() calls to a real backend later. */
(function (L) {
  const A = (L.auth = L.auth || {});

  A.USERS_KEY = "luxora_users";
  A.SESSION_KEY = "luxora_session";
  A.RESET_KEY = "luxora_resets";
  A.HOME = "MainPage.html";      /* your landing page file name */
  A.DASHBOARD = "Dashboard.html"; /* where users go after signing in */

  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } };
  A.readUsers = () => read(A.USERS_KEY, {});
  A.writeUsers = (u) => localStorage.setItem(A.USERS_KEY, JSON.stringify(u));
  A.readResets = () => read(A.RESET_KEY, {});
  A.writeResets = (r) => localStorage.setItem(A.RESET_KEY, JSON.stringify(r));
  A.getSession = () => read(A.SESSION_KEY, null);
  A.isProtectedPage = () => document.body.hasAttribute("data-requires-auth");
})(window.Luxora = window.Luxora || {});

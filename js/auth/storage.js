/* Luxora Bank – auth/storage.js
   Storage keys, page names and the small helpers that read/write localStorage.
   Users now live on the server (server/server.js); only the signed-in session (token) is kept here, per browser tab. */
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
  A.getSession = () => { try { return JSON.parse(sessionStorage.getItem(A.SESSION_KEY)); } catch (e) { return null; } }; /* per tab, so two users can be signed in at once */
  A.isProtectedPage = () => document.body.hasAttribute("data-requires-auth");
})(window.Luxora = window.Luxora || {});

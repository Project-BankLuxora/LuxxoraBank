/* Luxora Bank – auth/api.js
   Talks to the backend (server/server.js). The session lives in sessionStorage, so every browser TAB has its own login:
   two different users can be signed in side by side. */
(function (L) {
  const A = (L.auth = L.auth || {});

  A.api = async function (path, body, method) {
    const s = A.getSession();
    let r;
    try {
      r = await fetch("/api" + path, { method: method || (body ? "POST" : "GET"), headers: { "Content-Type": "application/json", ...(s ? { Authorization: "Bearer " + s.token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    } catch (e) { throw new Error("Сървърът не е достъпен. Стартирайте го с: node server/server.js"); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 401 && s && A.isProtectedPage()) { sessionStorage.removeItem(A.SESSION_KEY); location.replace(document.body.dataset.home || A.HOME); }
      throw new Error(j.error || "Грешка в сървъра.");
    }
    return j;
  };
})(window.Luxora = window.Luxora || {});

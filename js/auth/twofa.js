/* Luxora Bank – auth/twofa.js
   2FA step: 6-digit code, valid 5 minutes, 5 tries. The demo returns the code so it can be shown; a real backend emails it. */
(function (L) {
  const A = (L.auth = L.auth || {});

  let pending = null;

  A.start2FA = function (user) {
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
    pending = { user, code, expires: Date.now() + 5 * 60 * 1000, tries: 0 };
    return { twofa: code };
  };

  A.verify2FA = async function (code) {
    const bad = new Error("Грешен или изтекъл код.");
    if (!pending || Date.now() > pending.expires || pending.tries >= 5) throw bad;
    if (code.trim() !== pending.code) { pending.tries++; throw bad; }
    A.startSession(pending.user);
    pending = null;
  };

  A.setTwoFA = function (on) {
    const s = A.getSession(), users = A.readUsers();
    if (!s || !users[s.email]) return;
    users[s.email].twofa = !!on;
    A.writeUsers(users);
  };

  A.hasTwoFA = function () {
    const s = A.getSession();
    return !!(s && A.readUsers()[s.email] && A.readUsers()[s.email].twofa);
  };
})(window.Luxora = window.Luxora || {});

/* Luxora Bank – auth/twofa.js
   2FA step: 6-digit code, valid 5 minutes, 5 tries (checked by the server). The demo returns the code so it can be shown; a real backend emails it. */
(function (L) {
  const A = (L.auth = L.auth || {});

  let ticket = null;

  A.start2FA = function (r) { ticket = r.ticket; return { twofa: r.twofa }; };

  A.verify2FA = async function (code) {
    if (!ticket) throw new Error("Грешен или изтекъл код.");
    const r = await A.api("/2fa", { ticket, code });
    ticket = null;
    A.startSession(r);
  };

  A.setTwoFA = function (on) {
    const s = A.getSession();
    if (!s) return;
    A.api("/twofa", { on: !!on }).then(() => { s.twofa = !!on; sessionStorage.setItem(A.SESSION_KEY, JSON.stringify(s)); }, () => {});
  };

  A.hasTwoFA = function () { const s = A.getSession(); return !!(s && s.twofa); };
})(window.Luxora = window.Luxora || {});

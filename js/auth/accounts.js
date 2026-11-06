/* Luxora Bank – auth/accounts.js
   Creating an account and signing in (the server checks everything again, this is just for quick messages). */
(function (L) {
  const A = (L.auth = L.auth || {});

  A.register = async function (name, email, password) {
    email = email.trim().toLowerCase();
    name = name.trim();
    if (name.length < 2) throw new Error("Въведете име.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Невалиден имейл адрес.");
    if (password.length < 8) throw new Error("Паролата трябва да е поне 8 символа.");
    A.startSession(await A.api("/register", { name, email, password }));
  };

  A.login = async function (email, password) {
    const r = await A.api("/login", { email, password });
    if (r.twofa) return A.start2FA(r); /* 2FA is on: ask for a code before opening the session */
    A.startSession(r);
  };
})(window.Luxora = window.Luxora || {});

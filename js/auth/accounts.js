/* Luxora Bank – auth/accounts.js
   Creating an account and signing in. */
(function (L) {
  const A = (L.auth = L.auth || {});

  A.register = async function (name, email, password) {
    email = email.trim().toLowerCase();
    name = name.trim();
    if (name.length < 2) throw new Error("Въведете име.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Невалиден имейл адрес.");
    if (password.length < 8) throw new Error("Паролата трябва да е поне 8 символа.");
    const users = A.readUsers();
    if (users[email]) throw new Error("Вече има профил с този имейл. Влезте в него.");
    const h = await A.hash(password);
    users[email] = { name, email, salt: h.salt, hash: h.hash, created: Date.now() };
    A.writeUsers(users);
    A.startSession(users[email]);
  };

  A.login = async function (email, password) {
    email = email.trim().toLowerCase();
    const user = A.readUsers()[email];
    const bad = new Error("Грешен имейл или парола.");
    if (!user) throw bad;
    const h = await A.hash(password, user.salt);
    if (h.hash !== user.hash) throw bad;
    if (user.twofa) return A.start2FA(user); /* 2FA is on: ask for a code before opening the session */
    A.startSession(user);
  };
})(window.Luxora = window.Luxora || {});

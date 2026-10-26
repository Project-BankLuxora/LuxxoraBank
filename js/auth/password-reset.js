/* Luxora Bank – auth/password-reset.js
   "Forgot password" in two steps: request a code, then use it to set a new password. */
(function (L) {
  const A = (L.auth = L.auth || {});

  /* Step 1 of password reset: make a 6-digit code valid for 10 minutes.
     Returns the code only so the demo can show it – a real backend emails it and returns nothing. */
  A.requestReset = async function (email) {
    email = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Невалиден имейл адрес.");
    if (!A.readUsers()[email]) return null; /* the screen looks the same either way, so nobody can probe which emails exist */
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
    const resets = A.readResets();
    resets[email] = { code, expires: Date.now() + 10 * 60 * 1000, tries: 0 };
    A.writeResets(resets);
    return code;
  };

  /* Step 2: check the code (max 5 tries) and save the new password */
  A.resetPassword = async function (email, code, password) {
    email = email.trim().toLowerCase();
    if (password.length < 8) throw new Error("Паролата трябва да е поне 8 символа.");
    const resets = A.readResets();
    const r = resets[email];
    const bad = new Error("Грешен или изтекъл код.");
    if (!r || Date.now() > r.expires || r.tries >= 5) throw bad;
    if (code.trim() !== r.code) { r.tries++; A.writeResets(resets); throw bad; }
    const users = A.readUsers();
    const h = await A.hash(password);
    users[email].salt = h.salt;
    users[email].hash = h.hash;
    A.writeUsers(users);
    delete resets[email];
    A.writeResets(resets);
  };
})(window.Luxora = window.Luxora || {});

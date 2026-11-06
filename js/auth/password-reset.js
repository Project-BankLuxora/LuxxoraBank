/* Luxora Bank – auth/password-reset.js
   "Forgot password" in two steps: request a code, then use it to set a new password (both checked by the server). */
(function (L) {
  const A = (L.auth = L.auth || {});

  /* Returns the code only so the demo can show it – a real backend emails it and returns nothing. */
  A.requestReset = async function (email) {
    email = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Невалиден имейл адрес.");
    return (await A.api("/reset/request", { email })).code; /* null when the email is unknown: the screen looks the same either way */
  };

  A.resetPassword = async function (email, code, password) {
    if (password.length < 8) throw new Error("Паролата трябва да е поне 8 символа.");
    await A.api("/reset", { email, code, password });
  };
})(window.Luxora = window.Luxora || {});

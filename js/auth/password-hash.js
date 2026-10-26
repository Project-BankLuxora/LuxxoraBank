/* Luxora Bank – auth/password-hash.js
   Password hashing (PBKDF2 + random salt). */
(function (L) {
  const A = (L.auth = L.auth || {});

  const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));

  A.hash = async function (password, saltHex) {
    if (!window.crypto || !crypto.subtle) throw new Error("Отворете сайта през https или localhost.");
    const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, key, 256);
    return { salt: toHex(salt), hash: toHex(bits) };
  };
})(window.Luxora = window.Luxora || {});

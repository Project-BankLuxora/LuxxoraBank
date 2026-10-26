/* Luxora Bank – i18n/core.js
   The translation engine. Bulgarian is the source language: this swaps text to English by looking each piece of text up in the dictionary.
   To translate something new, add  "Български текст": "English text"  to a file in i18n/translations/ (must match the Bulgarian exactly). */
(function (L) {
  const I = (L.i18n = L.i18n || {});
  const EN = (I.dict = I.dict || {});
  const ATTRS = ["placeholder", "aria-label"];
  const orig = new WeakMap(); /* text node -> its original Bulgarian text */

  const state = (I.state = { lang: "bg", toggle: null });
  try { state.lang = localStorage.getItem("luxora_lang") === "en" ? "en" : "bg"; } catch (e) {}

  I.t = function (s, ...args) {
    let r = state.lang === "en" && EN[s] ? EN[s] : s;
    args.forEach((a) => { r = r.replace("%s", () => a); });
    return r;
  };

  I.fix = function fix(n) {
    const lang = state.lang;
    if (n.nodeType === 3) {
      const raw = orig.has(n) ? orig.get(n) : n.nodeValue, key = raw.trim();
      if (!orig.has(n) && !EN[key]) return;
      orig.set(n, raw);
      const v = lang === "en" ? raw.replace(key, () => EN[key]) : raw;
      if (n.nodeValue !== v) n.nodeValue = v;
    } else if (n.nodeType === 1 && n.tagName !== "SCRIPT" && n.tagName !== "STYLE") {
      ATTRS.forEach((a) => {
        const v = n.getAttribute(a);
        if (v === null) return;
        const d = "bg" + a.replace("-", ""), raw = n.dataset[d] !== undefined ? n.dataset[d] : v;
        if (n.dataset[d] === undefined && !EN[raw]) return;
        n.dataset[d] = raw;
        n.setAttribute(a, lang === "en" ? EN[raw] : raw);
      });
      n.childNodes.forEach(fix);
    }
  };
})(window.Luxora = window.Luxora || {});

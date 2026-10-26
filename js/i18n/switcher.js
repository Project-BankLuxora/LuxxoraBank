/* Luxora Bank – i18n/switcher.js
   Switching language, the EN/BG button in the header, and the public window.LuxoraI18n API.
   Load it BEFORE auth on every page that has auth. */
(function (L) {
  const I = L.i18n, state = I.state;

  I.set = function (l) {
    state.lang = l === "en" ? "en" : "bg";
    try { localStorage.setItem("luxora_lang", state.lang); } catch (e) {}
    document.documentElement.lang = state.lang;
    I.fix(document.documentElement);
    if (state.toggle) state.toggle.textContent = state.lang === "en" ? "BG" : "EN";
    const sel = document.querySelector('[data-pref="lang"]');
    if (sel) sel.value = state.lang;
    document.dispatchEvent(new Event("luxora:lang"));
  };

  window.LuxoraI18n = { t: I.t, set: I.set, get lang() { return state.lang; } };

  document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = ".lang-toggle{border:1px solid var(--color-border,#ebe4da);background:transparent;color:inherit;font-family:inherit;cursor:pointer}.lang-toggle:hover{background:rgba(128,128,128,.12)}";
    document.head.appendChild(style);
    const box = document.querySelector(".site-header-actions");
    if (box) {
      state.toggle = document.createElement("button");
      state.toggle.type = "button";
      state.toggle.className = "button button-small lang-toggle";
      state.toggle.setAttribute("aria-label", "Language");
      state.toggle.addEventListener("click", () => I.set(state.lang === "en" ? "bg" : "en"));
      box.prepend(state.toggle);
    }
    I.set(state.lang);
    /* anything added later (the login popup, rebuilt card lists) is translated as it appears */
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(I.fix))).observe(document.documentElement, { childList: true, subtree: true });
  });
})(window.Luxora = window.Luxora || {});

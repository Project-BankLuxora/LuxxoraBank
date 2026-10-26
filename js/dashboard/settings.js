/* Dashboard – settings.js
   Settings: every [data-pref] control reads and writes the prefs object. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});

  document.querySelectorAll("[data-pref]").forEach((el) => {
    const k = el.dataset.pref, box = el.type === "checkbox";
    if (k === "twofa") el.checked = LuxoraAuth.hasTwoFA();
    else if (k === "lang") el.value = LuxoraI18n.lang;
    else if (box) el.checked = D.prefs[k]; else el.value = D.prefs[k];
    el.addEventListener("change", () => {
      const v = box ? el.checked : el.value;
      if (k === "twofa") return LuxoraAuth.setTwoFA(v);
      if (k === "lang") return LuxoraI18n.set(v);
      D.prefs[k] = v;
      try { localStorage.setItem(D.PREFS_KEY, JSON.stringify(D.prefs)); } catch (e) {}
      D.apply();
    });
  });
})(window.Luxora = window.Luxora || {});

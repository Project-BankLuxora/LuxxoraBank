/* Dashboard – apply.js
   Applies the current settings to the whole page (theme / accessibility flags) and redraws everything that depends on them. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});

  D.apply = function () {
    const root = document.documentElement, prefs = D.prefs;
    root.dataset.theme = prefs.theme; root.dataset.large = prefs.large; root.dataset.bold = prefs.bold; root.dataset.contrast = prefs.contrast;
    D.money(); D.loan(); D.renderLoan(); D.refreshCards();
  };
})(window.Luxora = window.Luxora || {});

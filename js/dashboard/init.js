/* Dashboard – init.js
   Loads last: redraw when the language changes, then show the right view and apply the settings. */
(function (L) {
  const D = L.dashboard;
  document.addEventListener("luxora:lang", D.apply);
  D.show(); D.apply();
})(window.Luxora = window.Luxora || {});

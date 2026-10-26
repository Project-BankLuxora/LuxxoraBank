/* Dashboard – navigation.js
   Top-level views follow the #hash; sub-tabs inside a view match buttons to panels by position. */
(function (L) {
  const D = (L.dashboard = L.dashboard || {});

  const views = document.querySelectorAll("[data-view]");

  D.show = function () {
    const id = location.hash.slice(1) || "accounts";
    views.forEach((v) => { v.hidden = v.dataset.view !== id; });
    document.querySelectorAll(".dash-nav a").forEach((a) => a.setAttribute("aria-current", a.hash === "#" + id ? "page" : "false"));
  };

  addEventListener("hashchange", D.show);

  document.querySelectorAll("[data-tabs]").forEach((box) => {
    const tabs = [...box.querySelectorAll(":scope > .tabs > button")], panels = [...box.querySelectorAll(":scope > [role=tabpanel]")];
    const pick = (i) => tabs.forEach((t, j) => { t.setAttribute("aria-selected", j === i); panels[j].hidden = j !== i; });
    tabs.forEach((t, i) => t.addEventListener("click", () => pick(i)));
    pick(0);
  });
})(window.Luxora = window.Luxora || {});

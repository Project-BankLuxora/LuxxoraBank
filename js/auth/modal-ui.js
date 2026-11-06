/* Luxora Bank – auth/modal-ui.js
   Building, opening, closing and switching modes of the login popup. */
(function (L) {
  const A = (L.auth = L.auth || {});

  let overlay, mode = "login", lastFocus;
  const $ = (id) => document.getElementById(id);

  function build() {
    const style = document.createElement("style");
    style.textContent = A.MODAL_CSS;
    document.head.appendChild(style);

    overlay = document.createElement("div");
    overlay.className = "lx-overlay";
    overlay.innerHTML = A.MODAL_HTML;
    document.body.appendChild(overlay);

    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) closeModal(); });
    overlay.querySelector(".lx-close").addEventListener("click", closeModal);
    overlay.querySelectorAll("[data-mode]").forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));
    $("lx-forgot").addEventListener("click", () => go("forgot"));
    $("lx-back").addEventListener("click", () => go("login"));
    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab") trapFocus(e);
    });
    $("lx-form").addEventListener("submit", A.onSubmit);
  }

  /* modes: login | register | forgot (ask for email) | reset (code + new password) | twofa */
  function setMode(m) {
    mode = m;
    const reg = m === "register", forgot = m === "forgot", reset = m === "reset", twofa = m === "twofa", login = m === "login";
    $("lx-tabs").hidden = forgot || reset || twofa;
    $("lx-name-row").hidden = !reg;
    $("lx-name").required = reg;
    $("lx-email-row").hidden = reset || twofa;
    $("lx-code-row").hidden = !(reset || twofa);
    $("lx-pass-row").hidden = forgot || twofa;
    $("lx-pass-label").textContent = reset ? "Нова парола (поне 8 символа)" : "Парола (поне 8 символа)";
    $("lx-pass").autocomplete = reg || reset ? "new-password" : "current-password";
    $("lx-forgot").hidden = !login;
    $("lx-back").hidden = login || reg;
    $("lx-title").textContent = A.TITLES[m];
    $("lx-submit").textContent = A.SUBMIT[m];
    overlay.querySelectorAll("[data-mode]").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.mode === m)));
    setMsg("");
  }

  /* switch mode and put the cursor in the first visible field */
  function go(m) {
    setMode(m);
    $(m === "reset" || m === "twofa" ? "lx-code" : "lx-email").focus();
  }

  function setMsg(text, cls) {
    const el = $("lx-msg");
    el.textContent = window.LuxoraI18n ? LuxoraI18n.t(text) : text;
    el.className = "lx-msg" + (cls ? " " + cls : "");
  }

  function openModal(m) {
    if (!overlay) build();
    lastFocus = document.activeElement;
    setMode(m || "login");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => (mode === "register" ? $("lx-name") : $("lx-email")).focus(), 50);
  }

  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    $("lx-form").reset();
    $("lx-submit").disabled = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function trapFocus(e) {
    const items = [...overlay.querySelectorAll("button,input")].filter((el) => !el.closest("[hidden]") && !el.hidden && !el.disabled);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* shared with modal-submit.js */
  A.modal = { $, getMode: () => mode, setMode, go, setMsg };
  A.openModal = openModal;
  A.closeModal = closeModal;
})(window.Luxora = window.Luxora || {});

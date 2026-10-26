/* Luxora Bank – auth/modal-submit.js
   What happens when the popup form is submitted, for each mode. */
(function (L) {
  const A = (L.auth = L.auth || {});

  A.onSubmit = async function (e) {
    const { $, getMode, setMode, go, setMsg } = A.modal;
    const mode = getMode();
    e.preventDefault();
    const btn = $("lx-submit"), val = (id) => $(id).value;
    btn.disabled = true;
    setMsg("Момент…");
    try {
      if (mode === "forgot") {
        const code = await A.requestReset(val("lx-email"));
        go("reset");
        /* DEMO ONLY: no mail server here, so the code is shown on screen. Delete this branch when a real backend emails it. */
        setMsg(code ? (window.LuxoraI18n ? LuxoraI18n.t("Демо режим: кодът ви е %s. На реален сайт той се изпраща по имейл.", code) : code) : "Ако има профил с този имейл, изпратихме код за възстановяване.", "ok");
      } else if (mode === "reset") {
        await A.resetPassword(val("lx-email"), val("lx-code"), val("lx-pass"));
        setMode("login");
        $("lx-pass").value = "";
        $("lx-code").value = "";
        setMsg("Паролата е сменена. Влезте с новата парола.", "ok");
      } else {
        if (mode === "register") await A.register(val("lx-name"), val("lx-email"), val("lx-pass"));
        else if (mode === "twofa") await A.verify2FA(val("lx-code"));
        else {
          const r = await A.login(val("lx-email"), val("lx-pass"));
          if (r && r.twofa) {
            go("twofa");
            /* DEMO ONLY: shown on screen because there is no mail server */
            setMsg((window.LuxoraI18n ? LuxoraI18n.t("Демо режим: кодът за вход е %s. На реален сайт той се изпраща по имейл.", r.twofa) : r.twofa), "ok");
            btn.disabled = false;
            return;
          }
        }
        setMsg("Успех! Добре дошли.", "ok");
        A.refreshHeader();
        setTimeout(() => { A.closeModal(); if (!A.isProtectedPage()) location.href = A.DASHBOARD; }, 700);
        return;
      }
      btn.disabled = false;
    } catch (err) {
      setMsg(err.message, "err");
      btn.disabled = false;
    }
  };
})(window.Luxora = window.Luxora || {});

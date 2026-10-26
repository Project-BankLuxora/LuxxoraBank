/* Luxora Bank – auth/modal-styles.js
   The popup's CSS, injected by modal-ui.js so your own HTML/CSS stay untouched. */
(function (L) {
  const A = (L.auth = L.auth || {});

  A.MODAL_CSS = `
  .lx-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;
    background:rgba(28,26,24,.4);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
    opacity:0;visibility:hidden;transition:opacity .2s,visibility .2s}
  .lx-overlay.open{opacity:1;visibility:visible}
  .lx-modal{position:relative;width:100%;max-width:420px;max-height:calc(100vh - 40px);overflow:auto;
    padding:34px 32px 28px;border:1px solid var(--color-border,#ebe4da);border-radius:var(--radius-card,14px);
    background:var(--color-modal-bg,#fffdfa);color:var(--color-text,#1d1b19);font-family:var(--font-sans,system-ui,sans-serif);
    box-shadow:0 30px 60px rgba(28,26,24,.28);transform:translateY(12px) scale(.98);transition:transform .2s}
  .lx-overlay.open .lx-modal{transform:none}
  .lx-close{position:absolute;top:12px;right:14px;width:34px;height:34px;border:0;border-radius:50%;
    background:none;color:var(--color-text-muted,#5f5a54);font-size:24px;line-height:1;cursor:pointer}
  .lx-close:hover{background:var(--color-icon-bg,#f3ede6)}
  .lx-tabs{display:grid;grid-template-columns:1fr 1fr;margin:0 0 24px;border-bottom:1px solid var(--color-border,#ebe4da)}
  .lx-tabs[hidden]{display:none}
  .lx-tabs button{padding:10px 0;margin-bottom:-1px;border:0;border-bottom:2px solid transparent;background:none;
    color:var(--color-text-muted,#5f5a54);font:500 14px var(--font-sans,system-ui,sans-serif);cursor:pointer}
  .lx-tabs button[aria-selected="true"]{color:var(--color-text,#1d1b19);border-bottom-color:var(--color-gold,#c4a47b)}
  .lx-modal h2{margin:0 0 20px;font-family:var(--font-serif,Georgia,serif);font-weight:500;font-size:30px;line-height:1.12}
  .lx-field{display:block;margin-bottom:16px}
  .lx-field[hidden]{display:none}
  .lx-field span{display:block;margin-bottom:6px;color:var(--color-text-muted,#5f5a54);font-size:12px}
  .lx-field input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid var(--color-border,#ebe4da);
    border-radius:10px;background:#fff;color:inherit;font:400 15px var(--font-sans,system-ui,sans-serif)}
  .lx-field input:focus-visible,.lx-close:focus-visible,.lx-tabs button:focus-visible,.lx-link:focus-visible{outline:2px solid var(--color-gold,#c4a47b);outline-offset:2px}
  .lx-submit{width:100%;margin-top:6px;padding:14px 28px;border:0;border-radius:999px;cursor:pointer;
    background:var(--gradient-gold,linear-gradient(135deg,#d3b88f,#a98456));color:#fff;font:500 14px var(--font-sans,system-ui,sans-serif);transition:background .2s}
  .lx-submit:hover{background:var(--color-gold-dark,#8c6d45)}
  .lx-submit:disabled{opacity:.6;cursor:wait}
  .lx-link{display:block;margin:14px auto 0;padding:2px 4px;border:0;background:none;cursor:pointer;
    color:var(--color-gold-dark,#8c6d45);font:500 13px var(--font-sans,system-ui,sans-serif)}
  .lx-link:hover{text-decoration:underline}
  .lx-link[hidden]{display:none}
  .lx-msg{min-height:20px;margin:14px 0 0;font-size:13px}
  .lx-msg.err{color:var(--color-danger,#b3423a)}.lx-msg.ok{color:var(--color-positive,#3b8a6b)}
  @media (prefers-reduced-motion:reduce){.lx-overlay,.lx-modal{transition:none}}`;
})(window.Luxora = window.Luxora || {});

/* Luxora – card-art.js
   Builds the markup for a bank card (front + back). Styles live in css/main/bankcard.css.
   LuxoraCardArt.render(design, last4) -> HTML string of a clickable card that flips between front and back.
   designs: "champagne" | "silver" | "black"  (older saved names light / gold / dark are mapped). */
(function (w) {
  const ALIAS = { light: "champagne", gold: "champagne", dark: "black" };
  const DESIGNS = ["champagne", "silver", "black"];
  const PHONE = { champagne: "+359 2 800 1234", silver: "+359 2 800 1234", black: "+359 2 888 1234" };
  const NFC = '<svg class="bc-nfc" viewBox="0 0 24 34" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 12c1.6 3.2 1.6 6.8 0 10"/><path d="M9 8.5c2.6 5.2 2.6 11.8 0 17"/><path d="M14 5c3.6 7.2 3.6 16.8 0 24"/><path d="M19 1.5c4.6 9.2 4.6 21.8 0 31"/></svg>';

  const design = (d) => (DESIGNS.includes(d) ? d : ALIAS[d] || "champagne");

  const front = (d, last4) => `<span class="bank-card card-${d} front">
    <span class="bc-brand">LUXORA<small>BANK</small></span>${NFC}<span class="bc-chip"></span>
    <span class="bc-number"><i></i><i></i><i></i><i></i><b>${last4}</b></span><span class="bc-mono">LX</span></span>`;

  const back = (d, last4) => `<span class="bank-card card-${d} back">
    <span class="bc-top"><span>LUXORA BANK</span><span>WWW.LUXORABANK.COM</span></span><span class="bc-stripe"></span>
    <span class="bc-label">AUTHORIZED SIGNATURE</span><span class="bc-label right">NOT VALID UNLESS SIGNED</span>
    <span class="bc-sign"></span><span class="bc-cvv">${String(last4).slice(0, 3)}</span><span class="bc-holo"></span>
    <span class="bc-legal">THIS CARD IS THE PROPERTY OF LUXORA BANK.<br>IF FOUND, PLEASE RETURN TO ANY LUXORA BANK<br>BRANCH OR CONTACT ${PHONE[d]}.</span>
    <span class="bc-logo">LUXORA<small>BANK</small></span></span>`;

  w.LuxoraCardArt = {
    DESIGNS, design,
    render(d, last4, extra) {
      d = design(d);
      return `<button type="button" class="bank-card-flip${extra ? " " + extra : ""}" aria-label="Luxora ${d} card •••• ${last4}. Click to flip." aria-pressed="false"><span class="bank-card-inner">${front(d, last4)}${back(d, last4)}</span></button>`;
    }
  };
  document.addEventListener("click", (e) => {
    const c = e.target.closest(".bank-card-flip");
    if (c) { const on = c.classList.toggle("is-flipped"); c.setAttribute("aria-pressed", on); }
  });
})(window);

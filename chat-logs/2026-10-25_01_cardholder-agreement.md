# Chat log 01 – Cardholder Agreement

**Date:** 2026-10-25
**Project:** Luxora Bank (educational / fictional)
**Status at end of session:** Done – waiting for the next instruction from the project owner

---

## 1. Request

The project owner uploaded the current site (`luxora – Копие.zip`) and asked to:

1. Continue working on the site using the supplied **LUXORA BANK – Cardholder Agreement** template
   (sections 1–9: Parties, Product terms, Card use, Security and card controls, Fees and interest,
   Lost cards and replacements, Disputes and transaction errors, Closure, Acceptance).
2. Add a new chat log (this file).
3. Wait for further instructions afterwards.

## 2. Starting point (what was already in the project)

- Dashboard with a **Cards** view: list, details and limits, payments (static), new card.
  Card types were only Debit / Credit / Virtual; "Block and replace" created an immediately active card;
  "Remove" simply deleted a card.
- A finished **loan agreement** (`loan-agreement.js`, `loans.css`, `translations/loan-agreement.js`) that was
  used as the pattern: Bulgarian source text, English via the i18n dictionary, accept / decline flow,
  state kept in `localStorage`.

## 3. What was done

| Area | Change |
|---|---|
| **Products** | New `js/dashboard/card-products.js`: five products – Standard Debit, Premium Debit, Virtual, Prepaid, Credit – each with issue fee, monthly/annual fee, daily purchase limit, daily ATM limit (or *Not supported*), funding source, credit facility yes/no, interest rate (or *Not applicable*). |
| **Order form** | "New card" tab now picks a product and shows its terms (fees, limits, interest) live as a *Draft*, **before** the agreement opens. Button: *Review agreement*. |
| **Agreement** | New **Agreement** tab (`js/dashboard/card-agreement.js`): the template filled in from the card – header (document reference, product, masked card reference, status Draft / Pending / Active / Closed) and sections 1–9, ending with the simulation notice. Accept needs the review checkbox; Decline cancels the order. Acceptance timestamp is stored. |
| **Fees in history** | Accepting a card with an issue fee adds a "Card issue fee" line to its transaction history (template §5). |
| **Lost / replacement** | "Block and replace" became **Report lost and replace**: original card is blocked, replacement gets a new card reference and agreement reference and is *Awaiting activation* until the customer activates it (template §6). |
| **Disputes** | **Payments** tab is now per card. "Report a problem" records a case (`DSP-…`) for review; "Simulate refund" adds a separate adjustment line carrying the same reference so it can be traced (template §7). Cases are listed in the agreement. |
| **Closure** | "Request card closure" on the agreement; blocked while a report is open or a credit card has debt; otherwise the card and its agreement become *Closed* (template §8). |
| **Existing data** | Cards saved before this change are upgraded on load (product, agreement, transactions); limits are clamped to the product maximum. |
| **Translations** | New `js/i18n/translations/card-agreement.js` (BG → EN for every new string). |
| **Smaller edits** | `Dashboard.html` (cards view + script tags), `apply.js` (one call to `D.refreshCards`), `loan-agreement.js` (exports `D.customerId`), `cards.css` (two small rules). The agreement reuses the loan document styles. |

## 4. Assumptions to confirm

- **All fee / limit / rate numbers are invented simulation values** (they are in one table at the top of
  `card-products.js`), e.g. Standard Debit €1/month, Premium €15 issue + €60/year, Credit 18.9 % interest.
- Amounts follow the dashboard currency setting (EUR / USD demo rate), unlike the loan agreement which is fixed to EUR.
- A replacement card inherits the original product and limit; no new acceptance is required, no new issue fee.
- "Chat log" was understood as a Markdown record of the session, stored in `chat-logs/`.

## 5. Not covered yet

- There is no purchase simulation, so **outstanding authorizations**, **unpaid fees** and **credit-card debt**
  are never above zero. The closure check for debt exists but cannot trigger yet.
- Monthly / annual fees and credit-card interest are shown as terms, but nothing charges them yet.
- Checked with a scripted walk-through of the real scripts (order → accept → fee → report → refund → lost →
  activate → decline → old-data upgrade, 17/17 passed). **Not yet opened in a real browser**, so layout and the
  EN/BG switch should be eyeballed.

## 6. Next

Waiting for the project owner's next instruction.

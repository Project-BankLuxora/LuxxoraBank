/* Luxora Bank – server/server.js
   Small zero-dependency backend (Node 22.13+). Run:  node server/server.js   then open  http://localhost:3000
   Serves the site AND the /api. Data lives in an SQLite database, server/luxora.db (delete it to start fresh). Needs Node 22.13+ (built-in node:sqlite, nothing to install).
   Demo only: no HTTPS, no rate limits. */
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const ROOT = path.join(__dirname, ".."), DB_FILE = process.env.DB_FILE || path.join(__dirname, "luxora.db"), LEGACY = path.join(__dirname, "data.json"), PORT = +process.env.PORT || 3000;

/* ---------- database (SQLite) ---------- */
const sql = new DatabaseSync(DB_FILE);
sql.exec(`
PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY, name TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, twofa INTEGER NOT NULL DEFAULT 0,
  iban TEXT NOT NULL UNIQUE, nick TEXT NOT NULL DEFAULT '', frozen INTEGER NOT NULL DEFAULT 0, opened INTEGER NOT NULL,
  stmt_month TEXT, low_sent INTEGER NOT NULL DEFAULT 0, notify TEXT, cards_stored INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY, email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE, ts INTEGER NOT NULL, name TEXT NOT NULL, cat TEXT NOT NULL,
  amt INTEGER NOT NULL, st TEXT NOT NULL, how TEXT, ref TEXT, card TEXT, why TEXT, fx_cur TEXT, fx_amt REAL, fx_rate REAL, loan_n INTEGER, loan_of INTEGER,
  dispute_ref TEXT, dispute_ts INTEGER, dispute_status TEXT, dref TEXT);
CREATE INDEX IF NOT EXISTS tx_user ON transactions (email, ts);
CREATE TABLE IF NOT EXISTS cards (
  email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE, id INTEGER NOT NULL, product TEXT NOT NULL, name TEXT NOT NULL, design TEXT NOT NULL, last4 TEXT NOT NULL,
  exp TEXT NOT NULL, status TEXT NOT NULL, limit_amt INTEGER NOT NULL, debt REAL NOT NULL DEFAULT 0, fee_charged INTEGER NOT NULL DEFAULT 0,
  agr_id TEXT, agr_status TEXT, agr_accepted INTEGER, PRIMARY KEY (email, id));
CREATE TABLE IF NOT EXISTS loans (
  email TEXT PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE, id TEXT NOT NULL, product TEXT NOT NULL, principal INTEGER NOT NULL, months INTEGER NOT NULL, rate REAL NOT NULL,
  risk TEXT NOT NULL, payment REAL NOT NULL, total REAL NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL, accepted INTEGER, paid INTEGER NOT NULL DEFAULT 0,
  overdue INTEGER NOT NULL DEFAULT 0, col_type TEXT, col_value REAL, col_ref TEXT);
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY, email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE, pos INTEGER NOT NULL, ts INTEGER NOT NULL, kind TEXT NOT NULL, p TEXT NOT NULL, link TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS notes_user ON notes (email, pos);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tickets (id TEXT PRIMARY KEY, email TEXT, message TEXT NOT NULL, ts INTEGER NOT NULL);
`);
const Q = (q) => sql.prepare(q), b01 = (v) => (v ? 1 : 0), nul = (v) => (v === undefined ? null : v);
const st = {
  user: Q(`INSERT INTO users (email,name,salt,hash,twofa,iban,nick,frozen,opened,stmt_month,low_sent,notify,cards_stored) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(email) DO UPDATE SET name=excluded.name,salt=excluded.salt,hash=excluded.hash,twofa=excluded.twofa,iban=excluded.iban,nick=excluded.nick,frozen=excluded.frozen,opened=excluded.opened,stmt_month=excluded.stmt_month,low_sent=excluded.low_sent,notify=excluded.notify,cards_stored=excluded.cards_stored`),
  tx: Q(`INSERT INTO transactions (id,email,ts,name,cat,amt,st,how,ref,card,why,fx_cur,fx_amt,fx_rate,loan_n,loan_of,dispute_ref,dispute_ts,dispute_status,dref) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET ts=excluded.ts,name=excluded.name,cat=excluded.cat,amt=excluded.amt,st=excluded.st,how=excluded.how,ref=excluded.ref,card=excluded.card,why=excluded.why,fx_cur=excluded.fx_cur,fx_amt=excluded.fx_amt,fx_rate=excluded.fx_rate,loan_n=excluded.loan_n,loan_of=excluded.loan_of,dispute_ref=excluded.dispute_ref,dispute_ts=excluded.dispute_ts,dispute_status=excluded.dispute_status,dref=excluded.dref`),
  delCards: Q("DELETE FROM cards WHERE email=?"),
  card: Q("INSERT INTO cards (email,id,product,name,design,last4,exp,status,limit_amt,debt,fee_charged,agr_id,agr_status,agr_accepted) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)"),
  delLoan: Q("DELETE FROM loans WHERE email=?"),
  loan: Q("INSERT INTO loans (email,id,product,principal,months,rate,risk,payment,total,status,created,accepted,paid,overdue,col_type,col_value,col_ref) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"),
  delNotes: Q("DELETE FROM notes WHERE email=?"),
  note: Q("INSERT INTO notes (id,email,pos,ts,kind,p,link,read) VALUES (?,?,?,?,?,?,?,?)"),
  meta: Q("INSERT INTO meta (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"),
  sessNew: Q("INSERT INTO sessions (token,email,at) VALUES (?,?,?)"), sessGet: Q("SELECT email FROM sessions WHERE token=?"), sessDel: Q("DELETE FROM sessions WHERE token=?"), sessDelUser: Q("DELETE FROM sessions WHERE email=?"),
  ticketCount: Q("SELECT COUNT(*) AS n FROM tickets"), ticketNew: Q("INSERT INTO tickets (id,email,message,ts) VALUES (?,?,?,?)"),
};
/* writes a whole user (profile, transactions, cards, loan, notifications) in one SQL transaction */
function writeUser(u) {
  const a = u.acc; sql.exec("BEGIN");
  try {
    st.user.run(u.email, u.name, u.salt, u.hash, b01(u.twofa), a.iban, a.nick || "", b01(a.frozen), a.opened, nul(u.stmtMonth), b01(u.lowSent), u.notify ? JSON.stringify(u.notify) : null, b01(u.cards));
    for (const t of a.tx) { const f = t.fx || {}, l = t.loan || {}, d = t.dispute || {}; st.tx.run(t.id, u.email, t.ts, t.name, t.cat, t.amt, t.st, nul(t.how), nul(t.ref), nul(t.card), nul(t.why), nul(f.cur), nul(f.amt), nul(f.rate), nul(l.n), nul(l.of), nul(d.ref), nul(d.ts), nul(d.status), nul(t.dref)); }
    st.delCards.run(u.email); for (const c of u.cards || []) st.card.run(u.email, c.id, c.product, c.name, c.design, c.last4, c.exp, c.status, c.limit, c.debt, b01(c.feeCharged), nul(c.agr.id), nul(c.agr.status), nul(c.agr.accepted));
    st.delLoan.run(u.email); const l = u.loan; if (l) { const c = l.collateral || {}; st.loan.run(u.email, l.id, l.product, l.principal, l.months, l.rate, l.risk, l.payment, l.total, l.status, l.created, nul(l.accepted), l.paid, b01(l.overdue), nul(c.type), nul(c.value), nul(c.ref)); }
    st.delNotes.run(u.email); (u.notes || []).forEach((n, i) => st.note.run(n.id, u.email, i, n.ts, n.kind, JSON.stringify(n.p || {}), n.link || "account", b01(n.read)));
    sql.exec("COMMIT");
  } catch (e) { sql.exec("ROLLBACK"); throw e; }
}
function readUser(r) {
  const tx = sql.prepare("SELECT * FROM transactions WHERE email=? ORDER BY rowid").all(r.email).map((t) => {
    const o = { id: t.id, ts: t.ts, name: t.name, cat: t.cat, amt: t.amt, st: t.st, how: t.how, ref: t.ref };
    if (t.card !== null) o.card = t.card; if (t.why !== null) o.why = t.why; if (t.dref !== null) o.dref = t.dref;
    if (t.fx_cur !== null) o.fx = { cur: t.fx_cur, amt: t.fx_amt, rate: t.fx_rate }; if (t.loan_n !== null) o.loan = { n: t.loan_n, of: t.loan_of };
    if (t.dispute_ref !== null) o.dispute = { ref: t.dispute_ref, ts: t.dispute_ts, status: t.dispute_status }; return o;
  });
  const u = { name: r.name, email: r.email, salt: r.salt, hash: r.hash, twofa: !!r.twofa, acc: { iban: r.iban, nick: r.nick, frozen: !!r.frozen, opened: r.opened, tx }, stmtMonth: r.stmt_month, lowSent: !!r.low_sent };
  if (r.notify) u.notify = JSON.parse(r.notify);
  if (r.cards_stored) u.cards = sql.prepare("SELECT * FROM cards WHERE email=? ORDER BY id").all(r.email).map((c) => ({ id: c.id, product: c.product, name: c.name, design: c.design, last4: c.last4, exp: c.exp, status: c.status, limit: c.limit_amt, debt: c.debt, feeCharged: !!c.fee_charged, agr: { id: c.agr_id, status: c.agr_status, accepted: c.agr_accepted } }));
  const l = sql.prepare("SELECT * FROM loans WHERE email=?").get(r.email);
  if (l) u.loan = { id: l.id, product: l.product, principal: l.principal, months: l.months, rate: l.rate, risk: l.risk, payment: l.payment, total: l.total, status: l.status, created: l.created, accepted: l.accepted, paid: l.paid, overdue: !!l.overdue, collateral: l.col_type ? { type: l.col_type, value: l.col_value, ref: l.col_ref } : null };
  u.notes = sql.prepare("SELECT * FROM notes WHERE email=? ORDER BY pos").all(r.email).map((n) => ({ id: n.id, ts: n.ts, kind: n.kind, p: JSON.parse(n.p), link: n.link, read: !!n.read }));
  return u;
}

/* The users are kept in memory too (fast reads); SQLite is the source of truth. After every change save() writes back exactly the users that changed. */
let db = { users: {}, ibans: {}, seq: 0 };
const snap = {}; /* email -> JSON of the user as last written */
const save = () => {
  for (const e in db.users) { const u = db.users[e], j = JSON.stringify(u); if (snap[e] !== j) { writeUser(u); snap[e] = j; } }
  if (st.metaSeq !== db.seq) { st.meta.run("seq", String(db.seq)); st.metaSeq = db.seq; }
};
for (const r of sql.prepare("SELECT * FROM users").all()) { const u = readUser(r); db.users[u.email] = u; db.ibans[u.acc.iban] = u.email; snap[u.email] = JSON.stringify(u); }
db.seq = +((sql.prepare("SELECT value FROM meta WHERE key='seq'").get() || {}).value || 0); st.metaSeq = db.seq;
if (!Object.keys(db.users).length && fs.existsSync(LEGACY)) { /* one-time import of the old JSON file, which is then renamed so it is never imported twice */
  try {
    const old = JSON.parse(fs.readFileSync(LEGACY, "utf8")); db.users = old.users || {}; db.seq = old.seq || 0;
    for (const e in db.users) db.ibans[db.users[e].acc.iban] = e; save();
    for (const [token, s] of Object.entries(old.sessions || {})) if (db.users[s.email]) st.sessNew.run(token, s.email, s.at || Date.now());
    for (const t of old.tickets || []) st.ticketNew.run(t.id, t.email && db.users[t.email] ? t.email : null, t.message, t.ts);
    fs.renameSync(LEGACY, LEGACY + ".imported"); console.log("Imported " + Object.keys(db.users).length + " user(s) from data.json into " + path.basename(DB_FILE));
  } catch (e) { console.error("Could not import data.json:", e.message); }
}
const RATES = { EUR: 1, USD: 1.08, GBP: 0.86, CHF: 0.94, RON: 5.08 }; /* demo rates: units of each currency per 1 EUR. Accounts are kept in EUR. */
const PRODUCTS = { standard: [100, 3000, 1500, 0], premium: [100, 10000, 5000, 15], virtual: [100, 2000, 1000, 0], prepaid: [100, 1000, 500, 5], credit: [100, 5000, 2000, 10] };
const DAILY_TRANSFER = 500000; /* 5 000 EUR in cents */
const pending = {}, resets = {}, clients = {}; /* 2FA tickets, reset codes, open SSE streams (email -> Set of responses) */

/* ---------- helpers ---------- */
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString("hex");
const code6 = () => String(crypto.randomInt(0, 1e6)).padStart(6, "0");
const num = (s) => [...s].map((c) => (/\d/.test(c) ? c : c.charCodeAt(0) - 55)).join("");
const m97 = (s) => [...num(s)].reduce((r, d) => (r * 10 + +d) % 97, 0);
const ibanOk = (i) => /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(i) && m97(i.slice(4) + i.slice(0, 4)) === 1;
function newIban() { for (;;) { const bban = "LUXO" + String(crypto.randomInt(0, 1e14)).padStart(14, "0"), i = "BG" + String(98 - m97(bban + "BG00")).padStart(2, "0") + bban; if (!db.ibans[i]) return i; } }
const ref = () => "TRX-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + (1000 + ++db.seq);
const bal = (u) => u.acc.tx.reduce((s, t) => s + (t.st === "Изпълнена" || t.amt < 0 && t.st !== "Отказана" ? t.amt : 0), 0);
const tx = (ts, name, cat, amt, how, extra) => ({ id: crypto.randomUUID(), ts, name, cat, amt, st: "Изпълнена", how, ref: ref(), ...extra });
function newCard() { const d = new Date(); return { id: 1, product: "standard", name: "", design: "champagne", last4: String(crypto.randomInt(1000, 10000)), exp: String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getFullYear() + 3).slice(2), status: "active", limit: 2000, debt: 0, agr: { id: "CA-" + d.getFullYear() + "-" + crypto.randomInt(100000, 1000000), status: "active", accepted: Date.now() } }; }
const today0 = () => new Date().setHours(0, 0, 0, 0);
function seed(u) { const d = (n) => Date.now() - n * 864e5; u.acc.tx.push(tx(d(14), "Начално салдо", "Доходи", 150000, "Депозит при откриване"), tx(d(2), "Заплата – Работодател ООД", "Доходи", 125000, "Входящ превод"), tx(d(2), "Наем", "Жилище", -62000, "Периодично плащане"), tx(d(0), "Фреш Маркет", "Храна и напитки", -5640, "Плащане с карта", { card: u.cards[0].last4 }), tx(d(3), "Онлайн магазин", "Пазаруване", -8999, "Плащане с карта", { card: u.cards[0].last4 })); }
/* notifications: stored as { kind, p (params) }, the browser writes the sentence (so it can use the user's language and currency) */
const NOTE_PREF = { transfer_in: "n_transfers", transfer_out: "n_transfers", card_pay: "n_cards", card_decline: "n_cards", security: "n_security", login: "n_security", low: "a_low", statement: "a_stmt" }; /* other kinds are always sent */
const NOTIFY_KEYS = ["n_transfers", "n_cards", "n_security", "a_low", "a_stmt"];
function note(u, kind, p, link) {
  const pref = NOTE_PREF[kind]; if (pref && u.notify && u.notify[pref] === false) return;
  u.notes = u.notes || []; u.notes.unshift({ id: crypto.randomUUID(), ts: Date.now(), kind, p: p || {}, link: link || "account", read: false }); u.notes.length = Math.min(u.notes.length, 50);
}
function lowCheck(u) { /* one "low balance" alert per dip below 100 EUR */
  const b = bal(u); if (b < 10000 && !u.lowSent) { u.lowSent = true; note(u, "low", { amt: b }); return true; } if (b >= 10000 && u.lowSent) { u.lowSent = false; return true; } return false;
}
const push = (email) => { const u = db.users[email]; if (u && lowCheck(u)) save(); (clients[email] || []).forEach((r) => r.write("data: update\n\n")); };
const device = (req) => { const a = (req && req.headers["user-agent"]) || ""; return (/Edg\//.test(a) ? "Edge" : /Firefox\//.test(a) ? "Firefox" : /Chrome\//.test(a) ? "Chrome" : /Safari\//.test(a) ? "Safari" : "Browser") + " · " + (/Android/.test(a) ? "Android" : /iPhone|iPad/.test(a) ? "iOS" : /Windows/.test(a) ? "Windows" : /Mac OS/.test(a) ? "macOS" : /Linux/.test(a) ? "Linux" : "?"); };
const signin = (u, req) => { note(u, "login", { dev: device(req) }, "account"); const r = session(u); push(u.email); return r; };

/* loans: same maths as js/dashboard/loan-calculator.js. The server re-checks the terms and does every money movement. */
const LP = { micro: { amount: [100, 2000], months: [3, 24], base: 9.9 }, medium: { amount: [2000, 15000], months: [12, 60], base: 7.9 }, high: { amount: [15000, 100000], months: [24, 120], base: 6.9 } };
const r2 = (x) => Math.round(x * 100) / 100, pmt = (p, rate, n) => { const r = rate / 1200; return r2((p * r) / (1 - Math.pow(1 + r, -n))); };
const sched = (p, rate, n) => { const r = rate / 1200, pay = pmt(p, rate, n), rows = []; let b = p; for (let i = 1; i <= n; i++) { const int = r2(b * r), pr = i === n ? b : r2(pay - int); rows.push({ payment: r2(pr + int), balance: (b = r2(b - pr)) }); } return rows; };
const addMonths = (ts, k) => { const d = new Date(ts), t = new Date(d.getFullYear(), d.getMonth() + k, 1), last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); t.setDate(Math.min(d.getDate(), last)); return t.getTime(); };
function payNext(u, auto) { /* auto = charged by the schedule (never throws): not enough money -> overdue; manual = the button */
  const l = u.loan, cents = Math.round(sched(l.principal, l.rate, l.months)[l.paid].payment * 100);
  if (u.acc.frozen) { if (auto) return false; throw fail(403, "Сметката е замразена. Изходящите плащания са спрени."); }
  if (cents > bal(u)) { if (auto) { if (!l.overdue) { l.overdue = true; note(u, "loan_missed", { amt: cents }, "loans"); } return false; } throw fail(400, "Недостатъчна наличност."); }
  l.paid++; l.overdue = false; u.acc.tx.push(tx(Date.now(), "Вноска по кредит", "Кредит", -cents, "Погасителна вноска", { loan: { n: l.paid, of: l.months } })); note(u, "loan_paid", { amt: cents, n: l.paid, of: l.months }, "loans");
  if (l.paid >= l.months) { l.status = "closed"; note(u, "loan_closed", {}, "loans"); } return true;
}
function autopay(u) { const l = u.loan; if (!l || l.status !== "active") return; let n = 0; while (l.status === "active" && addMonths(l.accepted, l.paid + 1) <= Date.now() && payNext(u, true)) n++; if (n || l.overdue) save(); }
const pub = (u) => ({ name: u.name, email: u.email, twofa: !!u.twofa });
const fail = (code, error) => Object.assign(new Error(error), { code });

/* ---------- API ---------- */
const API = {
  "POST /register"({ name = "", email = "", password = "" }) {
    email = email.trim().toLowerCase(); name = name.trim();
    if (name.length < 2) throw fail(400, "Въведете име."); if (!/^\S+@\S+\.\S+$/.test(email)) throw fail(400, "Невалиден имейл адрес."); if (password.length < 8) throw fail(400, "Паролата трябва да е поне 8 символа.");
    if (db.users[email]) throw fail(409, "Вече има профил с този имейл. Влезте в него.");
    const salt = crypto.randomBytes(16).toString("hex"), iban = newIban(), u = db.users[email] = { name, email, salt, hash: hash(password, salt), twofa: false, acc: { iban, nick: "", frozen: false, opened: Date.now(), tx: [] }, cards: [newCard()] };
    u.stmtMonth = new Date().toISOString().slice(0, 7); db.ibans[iban] = email; seed(u); save(); return session(u);
  },
  "POST /login"({ email = "", password = "" }, _u, _t, req) {
    const u = db.users[email.trim().toLowerCase()];
    if (!u || hash(password, u.salt) !== u.hash) throw fail(401, "Грешен имейл или парола.");
    if (!u.twofa) return signin(u, req);
    const ticket = crypto.randomUUID(), code = code6(); pending[ticket] = { email: u.email, code, exp: Date.now() + 3e5, tries: 0 }; return { twofa: code, ticket };
  },
  "POST /2fa"({ ticket, code = "" }, _u, _t, req) {
    const p = pending[ticket]; if (!p || Date.now() > p.exp || p.tries >= 5) throw fail(401, "Грешен или изтекъл код.");
    if (String(code).trim() !== p.code) { p.tries++; throw fail(401, "Грешен или изтекъл код."); }
    delete pending[ticket]; return signin(db.users[p.email], req);
  },
  "POST /logout"(_, u, token) { st.sessDel.run(token); return {}; },
  "POST /twofa"({ on }, u) { u.twofa = !!on; note(u, "security", { what: u.twofa ? "2fa_on" : "2fa_off" }, "account"); save(); push(u.email); return pub(u); },
  "POST /reset/request"({ email = "" }) { email = email.trim().toLowerCase(); if (!db.users[email]) return { code: null }; const code = code6(); resets[email] = { code, exp: Date.now() + 6e5, tries: 0 }; return { code }; },
  "POST /reset"({ email = "", code = "", password = "" }) {
    email = email.trim().toLowerCase(); const r = resets[email], u = db.users[email]; if (password.length < 8) throw fail(400, "Паролата трябва да е поне 8 символа.");
    if (!r || !u || Date.now() > r.exp || r.tries >= 5) throw fail(400, "Грешен или изтекъл код."); if (String(code).trim() !== r.code) { r.tries++; throw fail(400, "Грешен или изтекъл код."); }
    u.salt = crypto.randomBytes(16).toString("hex"); u.hash = hash(password, u.salt); delete resets[email]; note(u, "security", { what: "pw" }, "account");
    st.sessDelUser.run(email); save(); return {};
  },
  "GET /rates"() { return RATES; },
  "POST /support"({ message = "" }, u) { /* chatbot hand-over to a human: stores a ticket (u is null for visitors who are not signed in) */
    const m = String(message).trim().slice(0, 500); if (!m) throw fail(400, "Празно съобщение.");
    const id = "SUP-" + (1001 + st.ticketCount.get().n); st.ticketNew.run(id, u ? u.email : null, m, Date.now()); if (u) note(u, "support", { id }, "account"); save(); return { id };
  },
  "GET /notes"(_, u) { u.notes = u.notes || []; return { items: u.notes, unread: u.notes.filter((n) => !n.read).length }; },
  "POST /notes/read"({ ids }, u) { (u.notes || []).forEach((n) => { if (!Array.isArray(ids) || ids.includes(n.id)) n.read = true; }); save(); push(u.email); return {}; },
  "POST /notes/clear"(_, u) { u.notes = []; save(); push(u.email); return {}; },
  "GET /notify"(_, u) { return Object.assign({ n_transfers: true, n_cards: true, n_security: true, a_low: true, a_stmt: true }, u.notify); },
  "PUT /notify"(b, u) { u.notify = {}; NOTIFY_KEYS.forEach((k) => { u.notify[k] = !!b[k]; }); save(); return {}; },
  "GET /loan"(_, u) { autopay(u); return u.loan || null; },
  "POST /loan/apply"(b, u) {
    if (u.loan && u.loan.status !== "closed") throw fail(400, "Вече имате кредит. Откажете договора или го погасете първо.");
    const P = LP[b.product], n = Math.round(+b.months), amt = Math.round(+b.principal), rate = +b.rate, c = b.collateral;
    if (!P || !(amt >= P.amount[0] && amt <= P.amount[1]) || !(n >= P.months[0] && n <= P.months[1]) || !(rate >= P.base - 1.01 && rate <= P.base + 2.51) || !["A", "B", "C"].includes(b.risk)) throw fail(400, "Невалидни условия по кредита.");
    if (b.product === "high" && !c) throw fail(400, "Невалидни условия по кредита.");
    u.loan = { id: new Date().getFullYear() + "-" + String(Date.now()).slice(-6), product: b.product, principal: amt, months: n, rate, risk: b.risk, payment: pmt(amt, rate, n), total: r2(sched(amt, rate, n).reduce((x, r) => x + r.payment, 0)), status: "pending", created: Date.now(), accepted: null, paid: 0, overdue: false,
      collateral: c ? { type: ["real", "vehicle", "deposit"].includes(c.type) ? c.type : "deposit", value: Math.max(0, +c.value || 0), ref: "ASSET-" + crypto.randomInt(10000, 100000) } : null };
    save(); return { loan: u.loan };
  },
  "POST /loan/accept"(_, u) { /* accepting pays the money out to the account */
    const l = u.loan; if (!l || l.status !== "pending") throw fail(400, "Няма чакащ договор.");
    l.status = "active"; l.accepted = Date.now(); u.acc.tx.push(tx(l.accepted, "Изплащане на кредит", "Кредит", l.principal * 100, "Изплащане"));
    note(u, "loan_paid_out", { amt: l.principal * 100 }, "loans"); save(); push(u.email); return { loan: l };
  },
  "POST /loan/clear"(_, u) { if (u.loan && u.loan.status === "active") throw fail(400, "Активен кредит не може да бъде премахнат."); u.loan = null; save(); return {}; },
  "POST /loan/pay"(_, u) { const l = u.loan; if (!l || l.status !== "active") throw fail(400, "Няма активен кредит."); payNext(u, false); save(); push(u.email); return { loan: l }; },
  "POST /loan/miss"(_, u) { const l = u.loan; if (!l || l.status !== "active") throw fail(400, "Няма активен кредит."); if (!l.overdue) { l.overdue = true; note(u, "loan_missed", { amt: Math.round(sched(l.principal, l.rate, l.months)[l.paid].payment * 100) }, "loans"); } save(); push(u.email); return { loan: l }; },
  "POST /loan/early"(_, u) { /* remaining principal + one month of interest, no fee */
    const l = u.loan; if (!l || l.status !== "active") throw fail(400, "Няма активен кредит.");
    const rows = sched(l.principal, l.rate, l.months), due = Math.round(r2((l.paid ? rows[l.paid - 1].balance : l.principal) * (1 + l.rate / 1200)) * 100);
    if (u.acc.frozen) throw fail(403, "Сметката е замразена. Изходящите плащания са спрени."); if (due > bal(u)) throw fail(400, "Недостатъчна наличност.");
    u.acc.tx.push(tx(Date.now(), "Предсрочно погасяване на кредит", "Кредит", -due, "Предсрочно погасяване")); l.paid = l.months; l.overdue = false; l.status = "closed"; note(u, "loan_closed", {}, "loans"); save(); push(u.email); return { loan: l };
  },
  "GET /cards"(_, u) { return u.cards || null; }, /* null = not stored yet, the browser then uploads the cards it already has */
  "PUT /cards"(list, u) {
    if (!Array.isArray(list) || list.length > 8) throw fail(400, "Невалидни карти.");
    u.cards = list.map((c) => {
      const P = PRODUCTS[c.product], old = (u.cards || []).find((x) => x.id === c.id), a = c.agr || {}; if (!P) throw fail(400, "Невалидни карти.");
      return { id: +c.id, product: c.product, name: String(c.name || "").slice(0, 24), design: ["champagne", "silver", "black"].includes(c.design) ? c.design : "champagne", last4: old ? old.last4 : /^\d{4}$/.test(c.last4) ? c.last4 : "0000", exp: /^\d\d\/\d\d$/.test(c.exp) ? c.exp : "01/30",
        status: ["active", "frozen", "blocked", "inactive"].includes(c.status) ? c.status : "active", limit: Math.min(Math.max(+c.limit || P[2], P[0]), P[1]), debt: Math.max(0, +c.debt || 0), feeCharged: !!(old && old.feeCharged),
        agr: { id: String(a.id || "").slice(0, 20), status: ["pending", "active", "closed"].includes(a.status) ? a.status : "pending", accepted: +a.accepted || null } };
    });
    save(); push(u.email); return {};
  },
  "POST /pay"({ card, merchant = "", cat = "Пазаруване", amount }, u) { /* demo card payment: the account, the card and its daily limit all have to agree */
    const c = (u.cards || []).find((x) => x.id === +card), cents = Math.round(Number(amount) * 100);
    if (!c) throw fail(404, "Няма такава карта."); if (!(cents > 0) || cents > 1e7) throw fail(400, "Невалидна сума.");
    if (!["standard", "premium", "virtual"].includes(c.product)) throw fail(400, "Тестовите плащания са налични за дебитни и виртуални карти.");
    const spent = u.acc.tx.filter((t) => t.card === c.last4 && t.amt < 0 && t.ts >= today0() && t.st !== "Отказана").reduce((n, t) => n - t.amt, 0);
    const why = c.agr.status !== "active" ? "Договорът на картата не е активен" : c.status !== "active" ? "Картата не е активна" : u.acc.frozen ? "Сметката е замразена" : spent + cents > c.limit * 100 ? "Надвишен дневен лимит" : cents > bal(u) ? "Недостатъчна наличност" : "";
    const t = tx(Date.now(), String(merchant).slice(0, 40) || "Търговец", String(cat).slice(0, 30), -cents, why || "Плащане с карта", { card: c.last4 }); if (why) t.st = "Отказана";
    u.acc.tx.push(t); note(u, why ? "card_decline" : "card_pay", { last4: c.last4, amt: cents, name: t.name, why }, "account"); save(); push(u.email); return { ok: !why, reason: why, ref: t.ref };
  },
  "POST /card/fee"({ id }, u) { /* one-time issue fee, charged to the account when the agreement is accepted */
    const c = (u.cards || []).find((x) => x.id === +id); if (!c) throw fail(404, "Няма такава карта.");
    const fee = PRODUCTS[c.product][3]; if (fee && !c.feeCharged) { c.feeCharged = true; u.acc.tx.push(tx(Date.now(), "Такса за издаване на карта", "Такси", -fee * 100, "Такса", { card: c.last4 })); save(); push(u.email); } return {};
  },
  "POST /card/dispute"({ txId }, u) {
    const t = u.acc.tx.find((x) => x.id === txId && x.card && x.amt < 0 && x.st !== "Отказана"); if (!t || t.dispute) throw fail(400, "Сигнал не може да бъде подаден.");
    t.dispute = { ref: "DSP-" + String(Date.now()).slice(-6), ts: Date.now(), status: "review" }; save(); push(u.email); return t.dispute;
  },
  "POST /card/refund"({ txId }, u) { /* traceable: the refund line carries the report's reference */
    const t = u.acc.tx.find((x) => x.id === txId && x.dispute && x.dispute.status === "review"); if (!t) throw fail(400, "Няма сигнал за възстановяване.");
    t.dispute.status = "refunded"; u.acc.tx.push(tx(Date.now(), "Корекция (възстановяване)", t.cat, -t.amt, "Възстановяване", { card: t.card, dref: t.dispute.ref })); save(); push(u.email); return {};
  },
  "GET /account"(_, u) {
    autopay(u); const month = new Date().toISOString().slice(0, 7); /* the monthly statement notice is created when the month changes */
    if (u.stmtMonth !== month) { if (u.stmtMonth) note(u, "statement", { month: u.stmtMonth }, "account"); u.stmtMonth = month; save(); }
    const a = u.acc; return { holder: u.name, iban: a.iban, nick: a.nick, frozen: a.frozen, opened: a.opened, balance: bal(u), tx: [...a.tx].sort((x, y) => y.ts - x.ts) };
  },
  "PATCH /account"(b, u) { if (typeof b.nick === "string") u.acc.nick = b.nick.trim().slice(0, 30); if (typeof b.frozen === "boolean" && b.frozen !== u.acc.frozen) { u.acc.frozen = b.frozen; note(u, "security", { what: b.frozen ? "frozen" : "unfrozen" }, "account"); } save(); push(u.email); return {}; },
  "POST /transfer"({ iban = "", amount, cur = "EUR", reason = "" }, u) {
    iban = String(iban).replace(/\s/g, "").toUpperCase(); cur = String(cur).toUpperCase(); const rate = RATES[cur], orig = Number(amount), cents = Math.round((orig / rate) * 100); /* the amount may be in any listed currency; accounts are in EUR */
    if (!rate) throw fail(400, "Неподдържана валута."); if (!(orig > 0) || !(cents > 0) || cents > 1e8) throw fail(400, "Невалидна сума."); if (!ibanOk(iban)) throw fail(400, "Невалиден IBAN.");
    if (u.acc.frozen) throw fail(403, "Сметката е замразена. Изходящите плащания са спрени.");
    const to = db.users[db.ibans[iban]]; if (!to) throw fail(404, "Няма сметка с този IBAN."); if (to === u) throw fail(400, "Не можете да превеждате към собствената си сметка.");
    const sentToday = u.acc.tx.filter((t) => t.cat === "Преводи" && t.amt < 0 && t.ts >= today0()).reduce((n, t) => n - t.amt, 0);
    if (sentToday + cents > DAILY_TRANSFER) throw fail(400, "Надвишен дневен лимит за преводи (5 000 €).");
    if (cents > bal(u)) throw fail(400, "Недостатъчна наличност."); /* single-threaded: check + both writes happen with nothing in between */
    const r = ref(), now = Date.now(), why = String(reason).trim().slice(0, 60), fx = cur === "EUR" ? undefined : { cur, amt: orig, rate };
    u.acc.tx.push({ ...tx(now, "Превод към " + to.name, "Преводи", -cents, "Изходящ превод", { why, fx }), ref: r });
    to.acc.tx.push({ ...tx(now, "Превод от " + u.name, "Преводи", cents, "Входящ превод", { why, fx }), ref: r });
    note(to, "transfer_in", { amt: cents, name: u.name }, "account"); note(u, "transfer_out", { amt: cents, name: to.name }, "account"); save(); push(u.email); push(to.email); return { to: to.name, ref: r };
  }
};
function session(u) { const token = crypto.randomBytes(24).toString("hex"); save(); st.sessNew.run(token, u.email, Date.now()); return { token, user: pub(u) }; }

/* ---------- http ---------- */
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon" };
/* pages are built from html/partials/: a line "<!-- @include partials/x.html -->" is replaced by that file, indented to match. Includes can nest. */
const HTML_DIR = path.join(ROOT, "html");
const build = (src, depth = 0) => src.replace(/^([ \t]*)<!-- @include ([\w\/.-]+) -->[ \t]*$/gm, (_, ind, rel) => {
  const f = path.join(HTML_DIR, rel);
  if (depth > 5 || !f.startsWith(HTML_DIR + path.sep)) throw new Error("Bad include: " + rel);
  return build(fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n").trimEnd(), depth + 1).split("\n").map((l) => (l ? ind + l : l)).join("\n");
});
const send = (res, code, body) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x"), p = decodeURIComponent(url.pathname);
  if (!p.startsWith("/api/")) { /* static files (never the server folder or git) */
    const f = path.join(ROOT, p === "/" ? "html/MainPage.html" : p);
    if (!f.startsWith(ROOT) || /[\\/](server|\.git)([\\/]|$)/.test(path.relative(ROOT, f))) { res.writeHead(403); return res.end("Forbidden"); }
    return fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end("Not found"); } if (path.extname(f) === ".html") { try { d = build(d.toString("utf8").replace(/\r\n/g, "\n")); } catch (err) { console.error(err); res.writeHead(500); return res.end("Page build error"); } } res.writeHead(200, { "Content-Type": (MIME[path.extname(f)] || "application/octet-stream") + "; charset=utf-8" }); res.end(d); });
  }
  const route = p.slice(4), token = (req.headers.authorization || "").replace("Bearer ", "") || url.searchParams.get("token"), s = token ? st.sessGet.get(token) : null, user = s && db.users[s.email];
  if (route === "/events") { /* live updates: the browser reopens this stream by itself if it drops */
    if (!user) return send(res, 401, { error: "Сесията е изтекла. Влезте отново." });
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" }); res.write("retry: 3000\n\n");
    (clients[user.email] = clients[user.email] || new Set()).add(res);
    const ping = setInterval(() => res.write(": ping\n\n"), 25000); return req.on("close", () => { clearInterval(ping); clients[user.email].delete(res); });
  }
  const h = API[req.method + " " + route]; if (!h) return send(res, 404, { error: "Not found" });
  let raw = ""; req.on("data", (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
  req.on("end", () => {
    try {
      const open = ["/register", "/login", "/2fa", "/reset/request", "/reset", "/rates", "/support"].includes(route);
      if (!open && !user) throw fail(401, "Сесията е изтекла. Влезте отново.");
      send(res, 200, h(raw ? JSON.parse(raw) : {}, user || null, token, req));
    } catch (e) { send(res, e.code || 500, { error: e.code ? e.message : "Грешка в сървъра." }); if (!e.code) console.error(e); }
  });
}).listen(PORT, () => console.log("Luxora is running: http://localhost:" + PORT));

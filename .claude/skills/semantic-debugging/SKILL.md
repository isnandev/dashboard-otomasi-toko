---
name: semantic-debugging
description: >-
  Debugs by meaning instead of by guessing. It starts from what the user sees
  and what they expected, traces that to the code path and the page it reads,
  and fixes the cause, not the symptom. It also makes page automation robust by
  using semantic selectors (roles, labels, visible text) instead of brittle CSS
  classes. Use this whenever something in the extension or dashboard is wrong
  or stopped: a "Berhenti" status, a pasted "Laporan masalah dari Dashboard
  Otomasi Toko", wrong stock numbers, a marketplace page that "changed", a
  channel that can't log in or read orders, or any bug report from the user.
---

# Semantic debugging

The user is not technical. Their bug report is a description of **meaning**
("stok di Marketplace B tidak ikut turun"), not of code. Debug in that
language first, then go to code. Don't change code until you can say in one
sentence why the bug happens.

## 1. Pin down meaning: seen vs expected

Write down, in the user's words:
- **Seen:** what the dashboard or page shows (status, history line, number).
- **Expected:** what should have happened.
- **Where and when:** which channel, which product, which time (the history
  has timestamps).

If the user pasted the "Salin laporan untuk agent" report, it already has the
seen part and the technical details. If "expected" is missing, ask one
question with an example. Reproduce with "Coba dulu" (test mode) whenever you
can: it changes nothing.

## 2. Trace the meaning through the system

Follow the path of the thing that is wrong, layer by layer, and check each
layer against what it *should* mean:

1. **Dashboard text** → which state produces it (`statusUmum`, the history
   entry, the channel card).
2. **Engine step** (`src/lib/engine.ts`) → which rule or channel call wrote that
   state.
3. **Channel** (`src/channels/*.ts`) → what it read from or wrote to the page.
4. **The page itself** → does the element still exist? Does it still mean the
   same thing (the same label, the same column)?
5. **Data** (`src/lib/db.ts`, IndexedDB) → is the stored value what the rules
   expect (codes match, numbers not negative, sources valid)?

At the first layer where meaning diverges ("the page now shows *Stok
tersedia*, but the code reads the old *Stok* column"), you've found the
cause. Write the cause in one sentence before fixing it.

## 3. Prefer semantic selectors on marketplace pages

Most "it stopped working" bugs in this template come from a seller page that
changed. Make selectors survive change by targeting meaning:

1. **Accessible role + name:** a button whose text is "Simpan", an input whose
   label is "Stok".
2. **Visible text or label nearby:** find the row by the product code or name,
   then the cell under the header "Stok".
3. **Stable attributes:** `data-*`, `name`, `aria-label`.
4. **CSS classes last:** generated class names (`.css-1x2y3z`) break on the next
   deploy.

Keep all selectors in the channel's `SELECTOR` object, with a comment saying
what each one *means* ("the stock input in the product row"). When one
fails, report it in the history in plain language ("Kolom stok di Marketplace
A tidak ditemukan") and put the technical detail in `teknis`.

## 4. Fix the cause, then prove it

- Make the smallest change that fixes the cause. Don't rewrite working parts.
- If the bug could repeat silently, make it visible: a clear history line or a
  "Berhenti" status instead of a wrong number.
- Prove it: `npm run build`, reload the extension, run "Coba dulu", and check
  that the history line now matches what the user expected. Tell the user
  which line to look for.
- Close with one or two sentences in Bahasa Indonesia: what was wrong (in
  meaning, not code), what you changed, and what they should check.

## Common causes in this template

| Symptom on the dashboard | Usual cause |
|---|---|
| "Berhenti: … belum siap" while the tab is open | URL in `host_permissions` or `URL_SELLER` doesn't match the real page, or the login check selector changed |
| Orders not counted | the order-row selector or the date parsing changed; `sejak` (last sync) is later than the order time |
| A channel shows a different number | `aturStok` didn't save (the page needs a save click), or the product code differs between channel and Stok |
| Numbers go negative or jump | an order was counted twice (same id read on two syncs), or the CSV used a comma as the decimal separator |
| Nothing happens on schedule | Chrome was closed, automations are paused, or the alarm wasn't rescheduled after a settings change |

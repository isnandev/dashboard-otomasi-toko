---
name: bangun-dari-rancangan
description: >-
  Builds a shop owner's RANCANGAN OTOMASI (the 13-field automation design from
  the rancangan-otomasi skill) into this Chrome-extension dashboard template,
  step by step, with the dashboard showing every operation. Use this whenever
  the user pastes a block starting with "RANCANGAN OTOMASI", or asks to "bangun",
  "buatkan tools", or "jadikan extension" from a rancangan or a description of a
  shop automation (stock sync, low-stock alarm, reminders, reports), even if
  they don't name the skill.
---

# Bangun dari rancangan

The user is a non-technical shop owner. They pasted a **RANCANGAN OTOMASI**
and want a working tool. You build it on this template, so the result keeps
the template's promises: one dashboard for everything, local-first data, no
API keys, and formulas instead of AI inside the tool. Read `AGENTS.md` first;
its rules apply to everything below.

## 0. Make sure the project folder is ready

Check this quietly before step 1, and only tell the user what they must do.

- **The template is here** when the folder has `AGENTS.md` and a
  `package.json` named `dashboard-otomasi-toko`. If it isn't (the skill was
  installed on its own, or the user is in an empty folder), get the template
  into a new folder `tools-toko`:
  - Run `git --version`. If it works:
    `git clone https://github.com/isnandev/dashboard-otomasi-toko.git tools-toko`.
  - **If git is missing, don't ask the user to install it.** Download the ZIP
    and extract it instead:
    - URL: `https://github.com/isnandev/dashboard-otomasi-toko/archive/refs/heads/main.zip`
    - Windows (PowerShell): `Invoke-WebRequest -Uri <URL> -OutFile template.zip`,
      then `Expand-Archive template.zip -DestinationPath .`
    - macOS / Linux: `curl -L -o template.zip <URL>`, then `unzip template.zip`
      (or `tar -xf template.zip`, which also works on Windows 10 and later).
    - The ZIP extracts to `dashboard-otomasi-toko-main/`. Rename it to
      `tools-toko`, delete `template.zip`, and work inside `tools-toko`.
- **A folder from a ZIP has no `.git`.** That is fine. Don't run git commands
  that need a repository, and don't make the user set up git. If you want a
  checkpoint before a big change and git is missing, copy the changed files to
  a `cadangan-kode/` folder instead.
- **Node.js is needed** for `npm install` and `npm run build`. If
  `node --version` fails, ask the user to install the LTS version from
  nodejs.org (the one install this needs), then continue.
- Run `npm install` and `npm run build` once, so the user can load `dist` in
  Chrome.

## 1. Read the rancangan and map it to the template

Write the user a short plan in Bahasa Indonesia (5–8 lines), mapping each
field to the part of the template that implements it:

| Rancangan field | Where it goes |
|---|---|
| Pemicu (event) | a step in `src/lib/engine.ts`, run by the dashboard and the schedule |
| Pemicu (schedule) | `src/background.ts` (chrome.alarms); the interval lives in Pengaturan |
| Data yang dipakai | `src/lib/types.ts` + `src/lib/db.ts` (IndexedDB), and the Stok screen / CSV import columns |
| Langkah / Aturan | `src/lib/engine.ts`; plain-language history lines for each step |
| Peran AI | formulas and templates in `src/lib/rules.ts` (no AI inside the tool) |
| Hasil | what the engine changes, plus what the dashboard shows afterwards |
| Batas aman | `rules.ts` (e.g. safety stock) + test mode + confirmations |
| Alarm | the "Perlu perhatian" status, a history entry, a Chrome notification |
| Dicek manusia | a dashboard button that copies a draft, or asks before acting; never automatic |
| Tempat / aplikasi | one file per channel in `src/channels/` (from `contoh-marketplace.ts`) |
| Ukuran berhasil | numbers the dashboard can count (e.g. "habis padahal ada" per week) |

If a field is missing or unclear, ask **one** question at a time, with an
example answer. If something in the rancangan needs an API key, a cloud
service or AI inside the tool, explain the template's alternative in one
sentence (a Chrome page the user is logged in to, local data, a formula) and
continue with that.

Content and chat automation (posting schedules, comment → DM, WhatsApp
replies) is not built here: tell the user it belongs in Wicara.

## 2. Build in small, visible steps

Work in this order, and after each step build (`npm run build`) and tell the
user exactly what to look at in the dashboard:

1. **Data:** types, database fields, Stok screen columns, CSV import columns.
   Update `contoh-impor.csv`. Check: the Stok screen shows their products.
2. **Formulas** in `rules.ts` for "Peran AI" and "Batas aman". Check: the
   numbers on the Stok screen make sense to the user.
3. **Engine steps and rules**, with the demo channels first. Check: "Coba dulu"
   lists the expected changes in plain language.
4. **Real channels**, one at a time (see AGENTS.md, "Adding a real
   marketplace"). Ask for screenshots of the seller pages. Use the
   semantic-debugging skill's selector rules so the channel survives page
   changes. Check: the channel card says "Siap", and "Coba dulu" reads real
   orders without changing anything.
5. **Schedule and alarms.** Check: the next sync time shows on the cards, and
   a low-stock product produces "Perlu perhatian".
6. **Remove demo leftovers:** set `modeDemo = false` and remove the demo
   channels once real ones work, then reset the sample data.

Keep every operation on the dashboard: if you add an automation, add its
status, its history lines, its button and its pause behaviour too. Use the
existing shadcn components and theme tokens; follow the react-best-practices
skill for React code.

## 3. Hand over

When it works with test mode on, give the user a short checklist in Bahasa
Indonesia:
- what to watch for a few days in test mode (history lines, numbers);
- how to turn test mode off ("Mulai sync sungguhan");
- to make a backup every week (Stok → Buat cadangan);
- what to do when it stops: copy the report from Riwayat and paste it here.

Never turn test mode off yourself, and never act on a real seller account
without the user's explicit OK in the conversation.

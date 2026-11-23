# Instruksi untuk AI coding agent

This repository is a template for a **Chrome extension (Manifest V3) with one
dashboard** that runs a small business's automations (for example, syncing
stock across marketplaces). The person you are working with owns a small shop
and is **not technical**. They usually paste a "RANCANGAN OTOMASI" (13 fields)
and ask you to build it.

## How to work with the user
- Talk in **Bahasa Indonesia**: short sentences, no jargon. Explain what you
  are doing as if to a shop owner.
- Work in **small steps**. After each step, tell them what to check in the
  dashboard.
- Ask before anything risky: deleting data, changing many files, or touching
  a real seller account.
- When something breaks, ask for a screenshot and the report from the
  dashboard's "Salin laporan untuk agent" button.
- After every change, run `npm run build`. Then tell the user to open
  `chrome://extensions` and press the reload icon on the extension.
- **Don't assume git.** Many users don't have it: this folder may come from
  the ZIP download (`dashboard-otomasi-toko-main`) and have no `.git`. Never
  make the user install or set up git. To get the template without git,
  download
  `https://github.com/isnandev/dashboard-otomasi-toko/archive/refs/heads/main.zip`
  and extract it (steps in `.claude/skills/bangun-dari-rancangan/SKILL.md`,
  section 0).

## Skills in this repository
They are in `.claude/skills/`. Claude Code loads them automatically. If your
agent doesn't, open the matching `SKILL.md` yourself when the task fits:

| Skill | Use it when |
|---|---|
| `bangun-dari-rancangan` | The user pastes a "RANCANGAN OTOMASI" or asks to build a shop automation |
| `semantic-debugging` | Something is wrong or stopped: a "Berhenti" status, a pasted problem report, wrong numbers, a changed marketplace page |
| `react-best-practices` | Writing or reviewing React code (from Vercel; see its `SOURCE.md` for which rules apply here) |

## Fixed decisions (don't change without asking)
- **Outside services go through the Chrome extension**, using pages the user
  already has open and is logged in to (seller centre, WhatsApp Web...). Don't
  use API keys, OAuth, Google Cloud, or any setup the user has to configure.
- **Local-first:** all data is in IndexedDB (`src/lib/db.ts`). There is no
  cloud and no server. Keep import (CSV) and backup/restore (JSON) working.
- **No AI inside the extension.** "Peran AI" from the rancangan becomes formulas
  and templates (`src/lib/rules.ts`). You (the agent) are the AI.
- **Every operation is visible and controllable from the dashboard.** Nothing
  runs that the dashboard doesn't show (status, history, buttons).

## Dashboard UX rules (beginners first)
1. **Status in one sentence** at the top: Semua aman / Perlu perhatian /
   Berhenti. Use colour **plus** an icon and words, never colour alone.
2. **One big button per action, named with a verb** ("Sync sekarang", "Buat
   cadangan"). There is a pause switch: "Jeda semua otomasi".
3. **Test first:** "Coba dulu (tidak mengubah apa pun)". Test mode is on until
   the user turns it off.
4. **History in plain language:** "10.15 · 2 pesanan baru dari Marketplace A".
   The newest entry is on top.
5. **Errors say what happened and what to do,** with one button. Technical
   details go only into "Salin laporan untuk agent". Never put error codes or
   jargon on screen.
6. **Channels as cards:** ready or not, last sync, next sync.
7. **Confirm before overwriting or deleting**, and offer a backup first.
8. A **first-run guide** in 3 steps.
9. Bahasa Indonesia, large text (16px base), few screens (Beranda, Stok,
   Riwayat, Pengaturan), and safe defaults.

## Map of the code
| Path | What it is |
|---|---|
| `src/App.tsx` | Layout and navigation (4 screens) |
| `src/pages/` | Beranda, Stok, Riwayat, Pengaturan |
| `src/lib/engine.ts` | The sync engine: used by the dashboard buttons and the schedule |
| `src/lib/rules.ts` | Formulas: safety stock, restock point, reorder amount, draft template |
| `src/lib/db.ts` | Local database (IndexedDB), backup/restore |
| `src/channels/` | One file per place the shop sells. `demo.ts` = simulated; `contoh-marketplace.ts` = template for a real one |
| `src/background.ts` | Schedule (chrome.alarms) and notifications |
| `public/manifest.json` | Extension manifest. Add host permissions for real channels here |
| `src/components/ui/` | shadcn/ui components (don't edit by hand; add with `npx shadcn@latest add <name>`) |
| `src/index.css` | Theme tokens (light + dark). Use the tokens, not raw colours |

## Adding a real marketplace
1. Ask the user for screenshots of the seller pages for orders and stock.
2. Copy `src/channels/contoh-marketplace.ts` and fill in the TODOs. Keep the
   selectors in one `SELECTOR` object.
3. Add the site to `host_permissions` in `public/manifest.json`.
4. Register it in `src/channels/index.ts`, and set `modeDemo = false` when no
   demo channel is left.
5. Have the user test with "Coba dulu" before turning test mode off.
6. Remind the user to check the marketplace's terms on automating seller pages.

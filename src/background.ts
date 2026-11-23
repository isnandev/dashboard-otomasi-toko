import { ambil, pengaturan, simpan } from './lib/db'
import { jalankanSync } from './lib/engine'

// Background worker: runs the schedule while Chrome is open.
// Everything it does is written to the history, so the dashboard shows it.

const ALARM = 'sync-rutin'

async function jadwalkan() {
  const set = await pengaturan()
  await chrome.alarms.clear(ALARM)
  if (set.jeda) {
    await simpan('sync-berikutnya', null)
    return
  }
  await chrome.alarms.create(ALARM, { periodInMinutes: set.intervalMenit, delayInMinutes: set.intervalMenit })
  await simpan('sync-berikutnya', Date.now() + set.intervalMenit * 60_000)
}

// No sample data is ever added: the dashboard starts empty and says so.
chrome.runtime.onInstalled.addListener(async () => {
  await jadwalkan()
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })
})

chrome.runtime.onStartup.addListener(jadwalkan)

// Clicking the extension icon opens the dashboard.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })
})

// The dashboard asks for a new schedule after settings change.
chrome.runtime.onMessage.addListener((pesan) => {
  if (pesan?.jenis === 'jadwal-ulang') jadwalkan()
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return
  const set = await pengaturan()
  if (set.jeda) return
  await simpan('sync-berikutnya', Date.now() + set.intervalMenit * 60_000)
  const hasil = await jalankanSync({ uji: set.modeUji })

  // Notify only about new problems, so notifications stay meaningful.
  const sudah = new Set(await ambil<string[]>('notif-terkirim', []))
  for (const p of hasil.perluRestock) {
    if (sudah.has(p.kode)) continue
    chrome.notifications.create(`restock-${p.kode}`, {
      type: 'basic',
      iconUrl: 'icon-128.png',
      title: `${p.nama} hampir habis`,
      message: `Sisa ${p.stokInduk}. Buka dashboard untuk melihat langkahnya.`,
    })
    sudah.add(p.kode)
  }
  const masihMenipis = new Set(hasil.perluRestock.map((p) => p.kode))
  await simpan('notif-terkirim', [...sudah].filter((k) => masihMenipis.has(k)))
  chrome.runtime.sendMessage({ jenis: 'data-berubah' }).catch(() => {})
})

chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })
})

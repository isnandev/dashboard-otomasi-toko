import type { Channel } from './types'

/**
 * TEMPLATE for a real marketplace channel. Not registered yet.
 *
 * How it works: the extension finds the seller-centre tab the user already has
 * open and logged in, and reads or fills the page with chrome.scripting.
 * No API keys, no OAuth.
 *
 * For the coding agent:
 * 1. Ask the user for a screenshot of the seller-centre pages for orders and stock.
 * 2. Fill in URL_SELLER and the TODOs below. Keep selectors in one place
 *    (SELECTOR) so they are easy to fix when the page changes.
 * 3. Add the URL to "host_permissions" in public/manifest.json.
 * 4. Register the channel in channels/index.ts, then test with "Coba dulu".
 * 5. Check the marketplace's terms on automating seller pages with the user.
 */

const URL_SELLER = 'https://seller.contoh-marketplace.id/*' // TODO

const SELECTOR = {
  tandaSudahLogin: '[data-testid="seller-name"]', // TODO
  barisPesanan: '.order-row', // TODO
  inputStok: (kode: string) => `[data-sku="${kode}"] input.stock`, // TODO
}

async function cariTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ url: URL_SELLER })
  return tab
}

async function jalankanDiHalaman<T>(fungsi: (...args: never[]) => T, args: unknown[] = []) {
  const tab = await cariTab()
  if (!tab?.id) throw new Error('Tab tidak ditemukan')
  const [hasil] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: fungsi as (...args: unknown[]) => T,
    args,
  })
  return hasil?.result as T
}

export const contohMarketplace: Channel = {
  id: 'contoh-marketplace',
  nama: 'Contoh Marketplace',
  url: 'https://seller.contoh-marketplace.id/',
  async cekSiap() {
    const tab = await cariTab()
    if (!tab) {
      return {
        siap: false,
        pesan: 'Tab belum dibuka',
        saran: 'Buka halaman penjual Contoh Marketplace di Chrome, lalu tekan Coba lagi.',
      }
    }
    const login = await jalankanDiHalaman(
      (sel: string) => !!document.querySelector(sel),
      [SELECTOR.tandaSudahLogin],
    )
    return login
      ? { siap: true, pesan: 'Siap' }
      : { siap: false, pesan: 'Belum login', saran: 'Login di tab Contoh Marketplace, lalu tekan Coba lagi.' }
  },
  async ambilPesananBaru(_sejak) {
    // TODO: read SELECTOR.barisPesanan rows into { id, kode, jumlah, waktu }.
    return []
  },
  async bacaStok(_kode) {
    // TODO: read the value of SELECTOR.inputStok(kode).
    return null
  },
  async aturStok(_kode, _jumlah) {
    // TODO: fill SELECTOR.inputStok(kode) and press the page's save button.
  },
}

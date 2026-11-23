/**
 * A channel is one place you sell (a marketplace, your own store).
 * The extension talks to it through the page you already have open and are
 * logged in to. No API keys.
 *
 * To add a real marketplace, copy `contoh-marketplace.ts`, fill in the TODOs,
 * and register it in `index.ts`.
 */
export interface Pesanan {
  id: string
  kode: string
  jumlah: number
  waktu: number
}

export interface CekSiap {
  siap: boolean
  /** Plain-language reason shown on the dashboard when not ready. */
  pesan: string
  /** What the user should do, e.g. "Buka tab Marketplace A dan login". */
  saran?: string
}

export interface Channel {
  id: string
  nama: string
  /** Page the "Buka halaman" button opens. */
  url: string
  /** Is the page open and logged in? */
  cekSiap(): Promise<CekSiap>
  /** Orders that arrived after `sejak` (ms). */
  ambilPesananBaru(sejak: number): Promise<Pesanan[]>
  /** Current stock number shown on the channel, if it can be read. */
  bacaStok(kode: string): Promise<number | null>
  /** Set the stock number shown on the channel. */
  aturStok(kode: string, jumlah: number): Promise<void>
}

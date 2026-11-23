/** Where a product comes from. Decides what happens when stock runs low. */
export type Sumber = 'sendiri' | 'supplier' | 'dropship'

export interface Produk {
  kode: string
  nama: string
  sumber: Sumber
  /** One master stock for all channels. For dropship: the supplier's stock. */
  stokInduk: number
  /** Average sales per day, used by the formulas in rules.ts. */
  penjualanPerHari: number
  /** Days until new stock arrives (production, supplier delivery). */
  lamaDatangHari: number
  /** Optional manual safety stock; otherwise the formula decides. */
  stokPengamanManual?: number
}

export type JenisRiwayat = 'sync' | 'uji' | 'alarm' | 'impor' | 'cadangan' | 'galat' | 'pengaturan'

export interface Riwayat {
  id?: number
  waktu: number
  jenis: JenisRiwayat
  /** One plain-language line, e.g. "2 pesanan baru dari Marketplace A". */
  ringkas: string
  /** Extra plain-language lines, e.g. "Brownies di Marketplace B: 30 → 26". */
  detail?: string[]
  /** Technical details for the coding agent. Never shown as the main text. */
  teknis?: string
}

export interface Pengaturan {
  namaToko: string
  intervalMenit: number
  /** Test mode: sync only shows what would change. On until the user turns it off. */
  modeUji: boolean
  /** Pause switch for every automation. */
  jeda: boolean
  panduanSelesai: boolean
  tema: 'terang' | 'gelap' | 'sistem'
}

export interface PerubahanStok {
  channel: string
  kode: string
  nama: string
  dari: number | null
  ke: number
}

export interface StatusChannel {
  id: string
  nama: string
  siap: boolean
  /** Plain-language reason when not ready, e.g. "Belum login". */
  pesan: string
  terakhirSync?: number
}

export type TingkatStatus = 'aman' | 'perhatian' | 'berhenti'

export interface StatusUmum {
  tingkat: TingkatStatus
  kalimat: string
  saran?: string
}

export interface HasilSync {
  uji: boolean
  pesananBaru: number
  perubahan: PerubahanStok[]
  channelGagal: StatusChannel[]
  perluRestock: Produk[]
  waktu: number
}

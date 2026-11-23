import type { Produk, Sumber } from './types'

// Formulas instead of AI inside the tool: nothing to set up, same answer every time.
// They match the rules of thumb of the rancangan-otomasi skill.

/** Safety stock: about one day of sales, at least 2. */
export function stokPengaman(p: Produk): number {
  if (p.stokPengamanManual !== undefined) return p.stokPengamanManual
  return Math.max(2, Math.ceil(p.penjualanPerHari))
}

/** Restock point: sales per day × days until stock arrives + safety stock. */
export function batasRestock(p: Produk): number {
  return Math.ceil(p.penjualanPerHari * p.lamaDatangHari) + stokPengaman(p)
}

/** The number every channel shows: master stock minus safety stock. */
export function stokTampil(p: Produk): number {
  return Math.max(0, p.stokInduk - stokPengaman(p))
}

export function perluRestock(p: Produk): boolean {
  return p.stokInduk <= batasRestock(p)
}

/** Suggested reorder: enough for 7 days of sales above the restock point. */
export function jumlahPesanUlang(p: Produk): number {
  return Math.max(1, Math.ceil(p.penjualanPerHari * 7) + batasRestock(p) - p.stokInduk)
}

export const labelSumber: Record<Sumber, string> = {
  sendiri: 'Buatan sendiri',
  supplier: 'Dari supplier',
  dropship: 'Dropship',
}

/** What to do when stock is low, per product source. */
export function tindakanRestock(p: Produk): string {
  switch (p.sumber) {
    case 'sendiri':
      return `Masukkan ${jumlahPesanUlang(p)} ke rencana produksi`
    case 'supplier':
      return `Pesan ulang ${jumlahPesanUlang(p)} ke supplier`
    case 'dropship':
      return 'Stok supplier menipis: siapkan produk pengganti'
  }
}

/** Template draft (no AI): a reorder message the owner checks before sending. */
export function drafPesanan(p: Produk, namaToko: string): string {
  return [
    namaToko.trim() ? 'Halo, saya dari ' + namaToko.trim() + '.' : 'Halo.',
    `Saya mau pesan ulang ${p.nama} (${p.kode}) sebanyak ${jumlahPesanUlang(p)}.`,
    'Mohon info total dan perkiraan tanggal kirim. Terima kasih.',
  ].join('\n')
}

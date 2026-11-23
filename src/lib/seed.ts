import { isiStokDemo } from '@/channels/demo'
import { channels } from '@/channels'
import { semuaProduk, simpanProduk, tambahRiwayat } from './db'
import { stokTampil } from './rules'
import type { Produk } from './types'

// Fictional sample data (Toko Kue Ani) so the dashboard is not empty on day one.
export const PRODUK_CONTOH: Produk[] = [
  { kode: 'BRW-01', nama: 'Brownies fudge 20x20', sumber: 'sendiri', stokInduk: 80, penjualanPerHari: 6, lamaDatangHari: 1 },
  { kode: 'NST-01', nama: 'Nastar toples 500 g', sumber: 'sendiri', stokInduk: 45, penjualanPerHari: 5, lamaDatangHari: 2 },
  { kode: 'KRP-01', nama: 'Keripik singkong balado', sumber: 'supplier', stokInduk: 40, penjualanPerHari: 12, lamaDatangHari: 3 },
  { kode: 'MTE-01', nama: 'Kacang mete madu', sumber: 'supplier', stokInduk: 60, penjualanPerHari: 3, lamaDatangHari: 3 },
  { kode: 'HMP-01', nama: 'Kotak hampers kayu', sumber: 'dropship', stokInduk: 25, penjualanPerHari: 2, lamaDatangHari: 2 },
  { kode: 'LYG-01', nama: 'Loyang brownies 20x20', sumber: 'dropship', stokInduk: 12, penjualanPerHari: 1, lamaDatangHari: 3 },
]

// Calls that overlap (React StrictMode runs effects twice, the 30 s refresh, a
// data-changed message) share one run, so the sample data and its history
// entry are added only once.
let sedangMengisi: Promise<void> | null = null

/** Fills the database with sample data the first time only. */
export function isiContohKalauKosong(): Promise<void> {
  sedangMengisi ??= isiContoh().finally(() => {
    sedangMengisi = null
  })
  return sedangMengisi
}

async function isiContoh() {
  if ((await semuaProduk()).length > 0) return
  await simpanProduk(PRODUK_CONTOH)
  // The demo channels start slightly out of sync, so the first test run has something to show.
  for (const [i, ch] of channels.entries()) {
    const stok: Record<string, number> = {}
    for (const p of PRODUK_CONTOH) stok[p.kode] = stokTampil(p) + (i === 2 ? 4 : 0)
    await isiStokDemo(ch.id, stok)
  }
  await tambahRiwayat({ jenis: 'pengaturan', ringkas: 'Data contoh Toko Kue Ani dimuat' })
}

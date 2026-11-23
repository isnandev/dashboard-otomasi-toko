import { openDB, type DBSchema } from 'idb'
import type { Pengaturan, Produk, Riwayat } from './types'

// Local-first: everything lives in IndexedDB on this computer. No cloud.
// The dashboard and the background worker share this database.

interface Skema extends DBSchema {
  produk: { key: string; value: Produk }
  riwayat: { key: number; value: Riwayat; indexes: { waktu: number } }
  kv: { key: string; value: unknown }
}

const db = openDB<Skema>('dashboard-toko', 1, {
  upgrade(d) {
    d.createObjectStore('produk', { keyPath: 'kode' })
    const r = d.createObjectStore('riwayat', { keyPath: 'id', autoIncrement: true })
    r.createIndex('waktu', 'waktu')
    d.createObjectStore('kv')
  },
})

export const PENGATURAN_AWAL: Pengaturan = {
  namaToko: '', // the owner fills it in Pengaturan; no sample name
  intervalMenit: 15,
  modeUji: true,
  jeda: false,
  panduanSelesai: false,
  tema: 'sistem',
}

export async function semuaProduk(): Promise<Produk[]> {
  return (await db).getAll('produk')
}

export async function simpanProduk(list: Produk[]) {
  const tx = (await db).transaction('produk', 'readwrite')
  await Promise.all([...list.map((p) => tx.store.put(p)), tx.done])
}

export async function gantiSemuaProduk(list: Produk[]) {
  const tx = (await db).transaction('produk', 'readwrite')
  await tx.store.clear()
  await Promise.all([...list.map((p) => tx.store.put(p)), tx.done])
}

export async function tambahRiwayat(r: Omit<Riwayat, 'id' | 'waktu'> & { waktu?: number }) {
  await (await db).add('riwayat', { waktu: Date.now(), ...r })
}

export async function riwayatTerbaru(batas = 200): Promise<Riwayat[]> {
  const list = await (await db).getAllFromIndex('riwayat', 'waktu')
  return list.reverse().slice(0, batas)
}

export async function ambil<T>(kunci: string, awal: T): Promise<T> {
  const v = await (await db).get('kv', kunci)
  return v === undefined ? awal : (v as T)
}

export async function simpan<T>(kunci: string, nilai: T) {
  await (await db).put('kv', nilai, kunci)
}

export async function pengaturan(): Promise<Pengaturan> {
  return { ...PENGATURAN_AWAL, ...(await ambil<Partial<Pengaturan>>('pengaturan', {})) }
}

export async function ubahPengaturan(ubah: Partial<Pengaturan>) {
  await simpan('pengaturan', { ...(await pengaturan()), ...ubah })
}

/** Backup file: everything, as JSON. */
export async function buatCadangan(): Promise<string> {
  const d = await db
  return JSON.stringify(
    {
      jenis: 'cadangan-dashboard-toko',
      versi: 1,
      dibuat: new Date().toISOString(),
      produk: await d.getAll('produk'),
      pengaturan: await pengaturan(),
    },
    null,
    2,
  )
}

export async function pulihkanCadangan(isi: string) {
  const data = JSON.parse(isi)
  if (data?.jenis !== 'cadangan-dashboard-toko') throw new Error('Bukan file cadangan dashboard ini')
  await gantiSemuaProduk(data.produk)
  await simpan('pengaturan', data.pengaturan)
}

export async function hapusSemua() {
  const d = await db
  await Promise.all([d.clear('produk'), d.clear('riwayat'), d.clear('kv')])
}

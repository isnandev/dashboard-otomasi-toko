import { ambil, simpan } from '@/lib/db'
import type { Channel, Pesanan } from './types'

// Demo channels: simulated marketplaces that live in the local database.
// They let you try every button without a real seller account.
// Replace them with real channels (see contoh-marketplace.ts).

interface DataDemo {
  siap: boolean
  stok: Record<string, number>
  pesanan: Pesanan[]
}

const kunci = (id: string) => `demo:${id}`

async function data(id: string): Promise<DataDemo> {
  return ambil<DataDemo>(kunci(id), { siap: true, stok: {}, pesanan: [] })
}

export function buatChannelDemo(id: string, nama: string, url: string): Channel {
  return {
    id,
    nama,
    url,
    async cekSiap() {
      const d = await data(id)
      return d.siap
        ? { siap: true, pesan: 'Siap' }
        : {
            siap: false,
            pesan: 'Belum login',
            saran: `Buka halaman ${nama}, login, lalu tekan Coba lagi.`,
          }
    },
    async ambilPesananBaru(sejak) {
      return (await data(id)).pesanan.filter((p) => p.waktu > sejak)
    },
    async bacaStok(kode) {
      return (await data(id)).stok[kode] ?? null
    },
    async aturStok(kode, jumlah) {
      const d = await data(id)
      d.stok[kode] = jumlah
      await simpan(kunci(id), d)
    },
  }
}

/** Demo helper: pretend a customer just ordered on this channel. */
export async function buatPesananContoh(id: string, kode: string, jumlah: number) {
  const d = await data(id)
  d.pesanan.push({ id: `DEMO-${Date.now()}`, kode, jumlah, waktu: Date.now() })
  await simpan(kunci(id), d)
}

/** Demo helper: pretend the user logged out of a channel (to see an error). */
export async function aturSiapDemo(id: string, siap: boolean) {
  const d = await data(id)
  d.siap = siap
  await simpan(kunci(id), d)
}

export async function isiStokDemo(id: string, stok: Record<string, number>) {
  const d = await data(id)
  d.stok = { ...stok }
  await simpan(kunci(id), d)
}

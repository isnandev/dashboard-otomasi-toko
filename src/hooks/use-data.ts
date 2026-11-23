import { useCallback, useEffect, useState } from 'react'
import { ambil, pengaturan, riwayatTerbaru, semuaProduk } from '@/lib/db'
import { statusUmum } from '@/lib/engine'
import type { HasilSync, Pengaturan, Produk, Riwayat, StatusChannel, StatusUmum } from '@/lib/types'
import { diExtension } from '@/lib/utils'

export interface DataDashboard {
  produk: Produk[]
  riwayat: Riwayat[]
  pengaturan: Pengaturan
  status: StatusUmum
  channel: StatusChannel[]
  hasilTerakhir: HasilSync | null
  hasilUji: HasilSync | null
  syncBerikutnya: number | null
}

/** Loads everything the dashboard shows, and reloads when the background changes data. */
export function useData() {
  const [data, setData] = useState<DataDashboard | null>(null)

  const muat = useCallback(async () => {
    const [produk, riwayat, set, status, channel, hasilTerakhir, hasilUji, berikut] = await Promise.all([
      semuaProduk(),
      riwayatTerbaru(),
      pengaturan(),
      statusUmum(),
      ambil<StatusChannel[]>('status-channel', []),
      ambil<HasilSync | null>('hasil-terakhir', null),
      ambil<HasilSync | null>('hasil-uji', null),
      ambil<number | null>('sync-berikutnya', null),
    ])
    produk.sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
    setData({ produk, riwayat, pengaturan: set, status, channel, hasilTerakhir, hasilUji, syncBerikutnya: berikut })
  }, [])

  useEffect(() => {
    muat()
    const t = setInterval(muat, 30_000)
    const dengar = (pesan: { jenis?: string }) => {
      if (pesan?.jenis === 'data-berubah') muat()
    }
    if (diExtension) chrome.runtime.onMessage.addListener(dengar)
    return () => {
      clearInterval(t)
      if (diExtension) chrome.runtime.onMessage.removeListener(dengar)
    }
  }, [muat])

  return { data, muat }
}

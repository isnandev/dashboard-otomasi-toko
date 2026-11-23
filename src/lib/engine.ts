import { channels } from '@/channels'
import type { CekSiap } from '@/channels/types'
import { ambil, pengaturan, semuaProduk, simpan, simpanProduk, tambahRiwayat } from './db'
import { perluRestock, stokTampil, tindakanRestock } from './rules'
import type { HasilSync, PerubahanStok, StatusChannel, StatusUmum } from './types'

// The sync engine. Used by the dashboard ("Coba dulu", "Sync sekarang") and by
// the background worker (the schedule). Every run is written to the history in
// plain language, so the dashboard always shows what happened.

const kunciSync = (id: string) => `sync:${id}`

export async function jalankanSync({ uji }: { uji: boolean }): Promise<HasilSync> {
  const waktu = Date.now()
  const produk = await semuaProduk()
  const perKode = new Map(produk.map((p) => [p.kode, { ...p }]))
  const channelGagal: StatusChannel[] = []
  const siap: typeof channels = []
  const statusChannel: StatusChannel[] = []
  const teknisGagal = new Map<string, string>()
  let pesananBaru = 0
  const ringkasPesanan: string[] = []

  // 1. Which channels are ready, and what new orders do they have?
  for (const ch of channels) {
    const terakhirSync = await ambil<number>(kunciSync(ch.id), 0)
    let cek: CekSiap
    let teknis: string | undefined
    try {
      cek = await ch.cekSiap()
    } catch (e) {
      cek = { siap: false, pesan: 'Tidak bisa dicek', saran: 'Tekan Coba lagi. Kalau tetap gagal, salin laporan untuk agent.' }
      teknis = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack ?? ''}` : String(e)
    }
    const st: StatusChannel = { id: ch.id, nama: ch.nama, siap: cek.siap, pesan: cek.saran ?? cek.pesan, terakhirSync }
    if (teknis) teknisGagal.set(ch.id, teknis)
    statusChannel.push(st)
    if (!cek.siap) {
      channelGagal.push(st)
      continue
    }
    siap.push(ch)
    const pesanan = await ch.ambilPesananBaru(terakhirSync)
    for (const ps of pesanan) {
      const p = perKode.get(ps.kode)
      if (p) p.stokInduk = Math.max(0, p.stokInduk - ps.jumlah)
    }
    if (pesanan.length) ringkasPesanan.push(`${pesanan.length} pesanan baru dari ${ch.nama}`)
    pesananBaru += pesanan.length
  }

  // 2. Make every ready channel show the same number: master stock − safety stock.
  const perubahan: PerubahanStok[] = []
  for (const ch of siap) {
    for (const p of perKode.values()) {
      const target = stokTampil(p)
      const sekarang = await ch.bacaStok(p.kode)
      if (sekarang === target) continue
      perubahan.push({ channel: ch.nama, kode: p.kode, nama: p.nama, dari: sekarang, ke: target })
      if (!uji) await ch.aturStok(p.kode, target)
    }
  }

  // 3. Save (only for a real run).
  if (!uji) {
    await simpanProduk([...perKode.values()])
    for (const ch of siap) await simpan(kunciSync(ch.id), waktu)
    for (const st of statusChannel) if (st.siap) st.terakhirSync = waktu
  }
  await simpan('status-channel', statusChannel)

  const restock = [...perKode.values()].filter(perluRestock)
  const hasil: HasilSync = { uji, pesananBaru, perubahan, channelGagal, perluRestock: restock, waktu }
  await simpan(uji ? 'hasil-uji' : 'hasil-terakhir', hasil)

  // 4. History, in plain language.
  const detail = perubahan.map((c) => `${c.nama} di ${c.channel}: ${c.dari ?? '?'} → ${c.ke}`)
  const bagian = [...ringkasPesanan]
  if (!perubahan.length) bagian.push('semua angka stok sudah sama')
  else bagian.push(`${perubahan.length} angka stok ${uji ? 'akan diperbarui' : 'diperbarui'}`)
  await tambahRiwayat({
    jenis: uji ? 'uji' : 'sync',
    ringkas: (uji ? 'Uji coba: ' : '') + bagian.join(' · '),
    detail,
  })
  for (const g of channelGagal) {
    await tambahRiwayat({
      jenis: 'galat',
      ringkas: `${g.nama} dilewati: ${g.pesan}`,
      teknis: JSON.stringify(
        { channel: g.id, status: g, galat: teknisGagal.get(g.id) ?? null, waktu: new Date(waktu).toISOString() },
        null,
        2,
      ),
    })
  }
  if (!uji) {
    for (const p of restock) {
      await tambahRiwayat({ jenis: 'alarm', ringkas: `${p.nama} hampir habis (sisa ${p.stokInduk}). ${tindakanRestock(p)}.` })
    }
  }
  return hasil
}

/** The one-sentence status at the top of the dashboard. */
export async function statusUmum(): Promise<StatusUmum> {
  const set = await pengaturan()
  const produk = await semuaProduk()
  const status = await ambil<StatusChannel[]>('status-channel', [])
  const gagal = status.filter((s) => !s.siap)
  if (set.jeda) {
    return { tingkat: 'berhenti', kalimat: 'Otomasi sedang dijeda', saran: 'Nyalakan lagi lewat sakelar "Jeda semua otomasi".' }
  }
  if (gagal.length) {
    return {
      tingkat: 'berhenti',
      kalimat: `Berhenti: ${gagal.map((g) => g.nama).join(', ')} belum siap`,
      saran: gagal[0].pesan,
    }
  }
  // Nothing set up yet: say so instead of "Semua aman".
  if (produk.length === 0) {
    return { tingkat: 'perhatian', kalimat: 'Belum ada data stok', saran: 'Impor stokmu di halaman Stok.' }
  }
  if (channels.length === 0) {
    return {
      tingkat: 'perhatian',
      kalimat: 'Belum ada tempat jualan',
      saran: 'Minta agent-mu menambahkan tempat jualan dari rancanganmu.',
    }
  }
  const restock = produk.filter(perluRestock)
  if (restock.length) {
    return {
      tingkat: 'perhatian',
      kalimat: `Perlu perhatian: ${restock.length} produk hampir habis`,
      saran: 'Lihat daftar di bawah dan siapkan stoknya.',
    }
  }
  return { tingkat: 'aman', kalimat: 'Semua aman', saran: set.modeUji ? 'Mode uji masih aktif: belum ada angka yang diubah.' : undefined }
}

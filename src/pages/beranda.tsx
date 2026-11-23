import { useState } from 'react'
import { Check, ClipboardCopy, ExternalLink, FlaskConical, Loader2, RefreshCw, Store } from 'lucide-react'
import { channels } from '@/channels'
import { BelumAdaData } from '@/components/belum-ada-data'
import { Konfirmasi } from '@/components/konfirmasi'
import { StatusBanner } from '@/components/status-banner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { DataDashboard } from '@/hooks/use-data'
import { tambahRiwayat, ubahPengaturan } from '@/lib/db'
import { jalankanSync } from '@/lib/engine'
import { drafPesanan, labelSumber, perluRestock, tindakanRestock } from '@/lib/rules'
import type { HasilSync } from '@/lib/types'
import { cn, diExtension, nantiRamah, waktuRamah } from '@/lib/utils'

export function Beranda({ data, muat, keHalaman }: { data: DataDashboard; muat: () => Promise<void>; keHalaman: (h: string) => void }) {
  const [sibuk, setSibuk] = useState<null | 'uji' | 'sync'>(null)
  const [disalin, setDisalin] = useState<string | null>(null)
  const set = data.pengaturan
  const restock = data.produk.filter(perluRestock)
  // Nothing to sync until there is real stock data and at least one real channel.
  const belumSiap = data.produk.length === 0 ? 'stok diimpor' : channels.length === 0 ? 'tempat jualan ditambahkan' : null

  async function sync(uji: boolean) {
    setSibuk(uji ? 'uji' : 'sync')
    try {
      await jalankanSync({ uji })
      if (!uji && !set.panduanSelesai) await ubahPengaturan({ panduanSelesai: true })
    } finally {
      setSibuk(null)
      await muat()
    }
  }

  async function aturJeda(jeda: boolean) {
    await ubahPengaturan({ jeda })
    await tambahRiwayat({ jenis: 'pengaturan', ringkas: jeda ? 'Semua otomasi dijeda' : 'Otomasi dinyalakan lagi' })
    if (diExtension) chrome.runtime.sendMessage({ jenis: 'jadwal-ulang' }).catch(() => {})
    await muat()
  }

  async function salin(teks: string, id: string) {
    await navigator.clipboard.writeText(teks)
    setDisalin(id)
    setTimeout(() => setDisalin(null), 2000)
  }

  const tombolCobaLagi = data.status.tingkat === 'berhenti' && !set.jeda && (
    <Button size="lg" className="h-12 text-base" onClick={() => sync(true)} disabled={!!sibuk}>
      <RefreshCw /> Coba lagi
    </Button>
  )

  return (
    <div className="flex flex-col gap-6">
      <StatusBanner status={data.status} aksi={tombolCobaLagi} />

      {!set.panduanSelesai && <PanduanAwal data={data} keHalaman={keHalaman} onUji={() => sync(true)} />}

      {/* Main actions: one big button per action, named with a verb. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sync stok</CardTitle>
          <CardDescription className="text-base">
            Menyamakan angka stok di semua tempat jualan dengan stok induk.
            {data.syncBerikutnya && !set.jeda && <> Sync otomatis berikutnya {nantiRamah(data.syncBerikutnya)}.</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {set.modeUji && !belumSiap && (
            <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center">
              <FlaskConical className="size-6 shrink-0 text-warning" aria-hidden />
              <p className="flex-1 text-base">
                <b>Mode uji aktif.</b> Sync otomatis hanya mencatat apa yang akan berubah, tanpa mengubah angka di
                marketplace.
              </p>
              <Konfirmasi
                pemicu={<Button variant="outline" className="h-11 text-base">Mulai sync sungguhan</Button>}
                judul="Mulai sync sungguhan?"
                isi="Setelah ini, angka stok di semua tempat jualan akan benar-benar diubah sesuai stok induk. Pastikan uji coba terakhir sudah sesuai."
                tombolYa="Ya, mulai"
                onYa={async () => {
                  await ubahPengaturan({ modeUji: false })
                  await tambahRiwayat({ jenis: 'pengaturan', ringkas: 'Mode uji dimatikan: sync sekarang mengubah angka sungguhan' })
                  await muat()
                }}
              />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button size="lg" variant="outline" className="h-14 text-base" onClick={() => sync(true)} disabled={!!sibuk || !!belumSiap}>
              {sibuk === 'uji' ? <Loader2 className="animate-spin" /> : <FlaskConical />}
              Coba dulu (tidak mengubah apa pun)
            </Button>
            <Button size="lg" className="h-14 text-base" onClick={() => sync(false)} disabled={!!sibuk || !!belumSiap || set.modeUji || set.jeda}>
              {sibuk === 'sync' ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Sync sekarang
            </Button>
          </div>
          {belumSiap ? (
            <p className="text-sm text-muted-foreground">Tombol sync aktif setelah {belumSiap}.</p>
          ) : (
            (set.modeUji || set.jeda) && (
              <p className="text-sm text-muted-foreground">
                "Sync sekarang" aktif setelah {set.jeda ? 'otomasi tidak dijeda' : 'mode uji dimatikan'}.
              </p>
            )
          )}
          <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <span>
              <span className="block text-base font-medium">Jeda semua otomasi</span>
              <span className="block text-sm text-muted-foreground">Menghentikan sync otomatis sampai kamu nyalakan lagi.</span>
            </span>
            <Switch checked={set.jeda} onCheckedChange={aturJeda} className="scale-125" />
          </label>
          <HasilTerakhir hasil={data.hasilUji && (!data.hasilTerakhir || data.hasilUji.waktu > data.hasilTerakhir.waktu) ? data.hasilUji : data.hasilTerakhir} />
        </CardContent>
      </Card>

      {/* Channels as cards. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Tempat jualan</h2>
        {channels.length === 0 && (
          <BelumAdaData
            ikon={Store}
            judul="Belum ada tempat jualan"
            isi="Tempat jualan ditambahkan oleh agent-mu dari rancanganmu. Kirim screenshot halaman pesanan dan halaman stok marketplace-mu ke agent."
          />
        )}
        <div className="grid gap-3 md:grid-cols-3">
          {channels.map((ch) => {
            const st = data.channel.find((s) => s.id === ch.id)
            const siap = st ? st.siap : true
            return (
              <Card key={ch.id} className={cn(!siap && 'border-destructive/50')}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Store className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                    <p className="flex-1 text-base font-semibold leading-snug">{ch.nama}</p>
                    <Badge variant={siap ? 'outline' : 'destructive'} className={cn('text-sm', siap && 'border-success/40 text-success')}>
                      {siap ? 'Siap' : 'Belum siap'}
                    </Badge>
                  </div>
                  {!siap && st && <p className="text-sm">{st.pesan}</p>}
                  <dl className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                    <dt>Sync terakhir</dt>
                    <dd className="text-right text-foreground">{waktuRamah(st?.terakhirSync)}</dd>
                    <dt>Berikutnya</dt>
                    <dd className="text-right text-foreground">{set.jeda ? 'dijeda' : nantiRamah(data.syncBerikutnya ?? undefined)}</dd>
                  </dl>
                  <Button variant="outline" className="h-10" onClick={() => window.open(ch.url, '_blank')}>
                    <ExternalLink /> Buka halaman
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Low stock, with the next step per product source. */}
      {restock.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Perlu perhatian</h2>
          <Card>
            <CardContent className="divide-y">
              {restock.map((p) => (
                <div key={p.kode} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="text-base font-semibold">
                      {p.nama} <span className="font-normal text-muted-foreground">· sisa {p.stokInduk}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {labelSumber[p.sumber]} · {tindakanRestock(p)}
                    </p>
                  </div>
                  {p.sumber === 'supplier' && (
                    <Button variant="outline" className="h-10" onClick={() => salin(drafPesanan(p, set.namaToko), p.kode)}>
                      {disalin === p.kode ? <Check /> : <ClipboardCopy />}
                      {disalin === p.kode ? 'Draf disalin' : 'Salin draf pesanan'}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}

function HasilTerakhir({ hasil }: { hasil: HasilSync | null }) {
  if (!hasil) return null
  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-base font-medium">
        {hasil.uji ? 'Hasil uji coba' : 'Hasil sync'} · {waktuRamah(hasil.waktu)}
      </p>
      <p className="text-sm text-muted-foreground">
        {hasil.pesananBaru} pesanan baru ·{' '}
        {hasil.perubahan.length ? `${hasil.perubahan.length} angka stok ${hasil.uji ? 'akan berubah' : 'diubah'}` : 'semua angka sudah sama'}
        {hasil.channelGagal.length > 0 && ` · ${hasil.channelGagal.length} tempat jualan dilewati`}
      </p>
      {hasil.perubahan.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {hasil.perubahan.slice(0, 8).map((c) => (
            <li key={c.channel + c.kode}>
              {c.nama} di {c.channel}: <span className="tabular-nums">{c.dari ?? '?'} → <b>{c.ke}</b></span>
            </li>
          ))}
          {hasil.perubahan.length > 8 && <li className="text-muted-foreground">dan {hasil.perubahan.length - 8} lainnya (lihat Riwayat)</li>}
        </ul>
      )}
    </div>
  )
}

function PanduanAwal({ data, keHalaman, onUji }: { data: DataDashboard; keHalaman: (h: string) => void; onUji: () => void }) {
  const langkah = [
    { judul: 'Isi stok induk', isi: 'Impor daftar produk dan stokmu dari file CSV.', selesai: data.produk.length > 0, aksi: () => keHalaman('stok'), tombol: 'Buka halaman Stok' },
    channels.length === 0
      ? { judul: 'Tambahkan tempat jualan', isi: 'Minta agent-mu menambahkan marketplace dari rancanganmu, lalu muat ulang extension.', selesai: false, aksi: undefined, tombol: undefined }
      : { judul: 'Buka tempat jualan', isi: 'Buka dan login halaman penjual tiap marketplace di Chrome.', selesai: data.channel.length > 0 && data.channel.every((c) => c.siap), aksi: onUji, tombol: 'Cek sekarang' },
    { judul: 'Coba dulu', isi: 'Lihat apa yang akan berubah, tanpa mengubah apa pun.', selesai: !!data.hasilUji, aksi: data.produk.length > 0 && channels.length > 0 ? onUji : undefined, tombol: 'Coba dulu' },
  ]
  return (
    <Card className="border-primary/50">
      <CardHeader>
        <CardTitle className="text-xl">Mulai di sini: 3 langkah</CardTitle>
        <CardDescription className="text-base">Setelah tiga langkah ini, kamu siap memakai sync stok.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-3">
          {langkah.map((l, i) => (
            <li key={l.judul} className="flex items-center gap-4 rounded-lg border p-4">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full text-base font-semibold',
                  l.selesai ? 'bg-success text-white' : 'bg-muted',
                )}
                aria-label={l.selesai ? 'selesai' : `langkah ${i + 1}`}
              >
                {l.selesai ? <Check className="size-5" /> : i + 1}
              </span>
              <div className="flex-1">
                <p className="text-base font-semibold">{l.judul}</p>
                <p className="text-sm text-muted-foreground">{l.isi}</p>
              </div>
              {l.tombol && (
                <Button variant={l.selesai ? 'ghost' : 'outline'} className="h-10" onClick={l.aksi} disabled={!l.aksi}>
                  {l.tombol}
                </Button>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

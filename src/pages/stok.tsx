import { useRef, useState } from 'react'
import { Download, Minus, Package, Plus, Upload } from 'lucide-react'
import { BelumAdaData } from '@/components/belum-ada-data'
import { Konfirmasi } from '@/components/konfirmasi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { DataDashboard } from '@/hooks/use-data'
import { buatCadangan, gantiSemuaProduk, simpanProduk, tambahRiwayat } from '@/lib/db'
import { bacaCsv } from '@/lib/csv'
import { batasRestock, labelSumber, perluRestock, stokPengaman, stokTampil } from '@/lib/rules'
import type { Produk } from '@/lib/types'
import { cn, unduhFile } from '@/lib/utils'

export function Stok({ data, muat }: { data: DataDashboard; muat: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [impor, setImpor] = useState<{ produk: Produk[]; nama: string } | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  async function ubahStok(p: Produk, beda: number) {
    const baru = { ...p, stokInduk: Math.max(0, p.stokInduk + beda) }
    await simpanProduk([baru])
    await tambahRiwayat({ jenis: 'pengaturan', ringkas: `Stok induk ${p.nama} diubah manual: ${p.stokInduk} → ${baru.stokInduk}` })
    await muat()
  }

  async function cadangan() {
    const tanggal = new Date().toISOString().slice(0, 10)
    unduhFile(`cadangan-dashboard-toko-${tanggal}.json`, await buatCadangan())
    await tambahRiwayat({ jenis: 'cadangan', ringkas: 'Cadangan dibuat dan diunduh' })
    await muat()
  }

  async function pilihFile(f: File | undefined) {
    setGalat(null)
    if (!f) return
    try {
      const produk = bacaCsv(await f.text())
      setImpor({ produk, nama: f.name })
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e))
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Stok induk</CardTitle>
          <CardDescription className="text-base">
            Satu angka stok untuk semua tempat jualan. Tersimpan di komputer ini saja, jadi buat cadangan seminggu sekali.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button size="lg" className="h-12 text-base" onClick={cadangan}>
            <Download /> Buat cadangan
          </Button>
          <Button size="lg" variant="outline" className="h-12 text-base" onClick={() => fileRef.current?.click()}>
            <Upload /> Impor dari file CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => pilihFile(e.target.files?.[0])} />
          {galat && (
            <p role="alert" className="w-full rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-base">
              File belum bisa dibaca: {galat}
            </p>
          )}
          {impor && (
            <div className="w-full rounded-lg border border-warning/40 bg-warning/10 p-4">
              <p className="text-base">
                <b>{impor.nama}</b> berisi {impor.produk.length} produk. Impor akan <b>mengganti</b> {data.produk.length} produk
                yang ada sekarang.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Konfirmasi
                  pemicu={<Button className="h-11 text-base">Ganti dengan isi file</Button>}
                  judul={`Ganti ${data.produk.length} produk?`}
                  isi="Data stok sekarang akan diganti isi file. Sebaiknya buat cadangan dulu, supaya bisa dikembalikan."
                  tombolYa="Ya, ganti"
                  bahaya
                  onYa={async () => {
                    await gantiSemuaProduk(impor.produk)
                    await tambahRiwayat({ jenis: 'impor', ringkas: `Impor ${impor.produk.length} produk dari ${impor.nama}` })
                    setImpor(null)
                    await muat()
                  }}
                />
                <Button variant="outline" className="h-11 text-base" onClick={cadangan}>
                  Buat cadangan dulu
                </Button>
                <Button variant="ghost" className="h-11 text-base" onClick={() => setImpor(null)}>
                  Batal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto">
          {data.produk.length === 0 ? (
            <BelumAdaData
              ikon={Package}
              isi={
                <>
                  Belum ada produk. Unduh sheet stokmu sebagai CSV dengan kolom seperti di <b>format-impor.csv</b>, lalu tekan{' '}
                  <b>Impor dari file CSV</b>.
                </>
              }
              aksi={
                <Button size="lg" className="h-12 text-base" onClick={() => fileRef.current?.click()}>
                  <Upload /> Impor dari file CSV
                </Button>
              }
            />
          ) : (
          <>
          <Table className="text-base">
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead className="text-right">Stok induk</TableHead>
                <TableHead className="text-right">Cadangan</TableHead>
                <TableHead className="text-right">Tampil di toko</TableHead>
                <TableHead>Keadaan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.produk.map((p) => {
                const menipis = perluRestock(p)
                return (
                  <TableRow key={p.kode}>
                    <TableCell>
                      <p className="font-medium">{p.nama}</p>
                      <p className="text-sm text-muted-foreground">{p.kode}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-sm">{labelSumber[p.sumber]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label={`Kurangi stok ${p.nama}`} onClick={() => ubahStok(p, -1)}>
                          <Minus />
                        </Button>
                        <span className="w-10 text-center font-semibold tabular-nums">{p.stokInduk}</span>
                        <Button size="icon" variant="ghost" aria-label={`Tambah stok ${p.nama}`} onClick={() => ubahStok(p, 1)}>
                          <Plus />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{stokPengaman(p)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{stokTampil(p)}</TableCell>
                    <TableCell>
                      <span className={cn('text-sm font-medium', menipis ? 'text-warning' : 'text-success')}>
                        {menipis ? `Hampir habis (batas ${batasRestock(p)})` : 'Aman'}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <p className="mt-4 text-sm text-muted-foreground">
            <b>Cadangan</b> = stok yang tidak ditampilkan, supaya barang terakhir tidak terjual dua kali. <b>Tampil di toko</b> =
            stok induk − cadangan. Angkanya dihitung otomatis dari penjualan per hari.
          </p>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

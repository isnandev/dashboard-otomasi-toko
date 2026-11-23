import { useState } from 'react'
import { Bell, Check, ClipboardCopy, Download, FlaskConical, OctagonX, RefreshCw, Settings, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DataDashboard } from '@/hooks/use-data'
import type { JenisRiwayat, Riwayat as EntriRiwayat } from '@/lib/types'
import { cn, waktuRamah } from '@/lib/utils'

const ikon: Record<JenisRiwayat, typeof RefreshCw> = {
  sync: RefreshCw,
  uji: FlaskConical,
  alarm: Bell,
  impor: Upload,
  cadangan: Download,
  galat: OctagonX,
  pengaturan: Settings,
}

/** Builds the report the user pastes to the coding agent. */
function laporanAgent(r: EntriRiwayat): string {
  return [
    'Laporan masalah dari Dashboard Otomasi Toko',
    `Waktu: ${new Date(r.waktu).toLocaleString('id-ID')}`,
    `Yang terlihat di dashboard: ${r.ringkas}`,
    'Yang seharusnya terjadi: (tulis di sini)',
    '',
    'Detail teknis:',
    r.teknis ?? '(tidak ada)',
    '',
    `Browser: ${navigator.userAgent}`,
  ].join('\n')
}

export function Riwayat({ data }: { data: DataDashboard }) {
  const [disalin, setDisalin] = useState<number | null>(null)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Riwayat</CardTitle>
        <CardDescription className="text-base">Semua yang dikerjakan dashboard ini, yang terbaru di atas.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.riwayat.length === 0 && <p className="text-base text-muted-foreground">Belum ada kegiatan.</p>}
        <ol className="flex flex-col divide-y">
          {data.riwayat.map((r) => {
            const Ikon = ikon[r.jenis]
            return (
              <li key={r.id} className="flex gap-4 py-4 first:pt-0">
                <Ikon
                  className={cn(
                    'mt-0.5 size-5 shrink-0',
                    r.jenis === 'galat' ? 'text-destructive' : r.jenis === 'alarm' ? 'text-warning' : 'text-muted-foreground',
                  )}
                  aria-hidden
                />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{waktuRamah(r.waktu)}</p>
                  <p className="text-base">{r.ringkas}</p>
                  {r.detail && r.detail.length > 0 && (
                    <details className="mt-1 text-sm">
                      <summary className="cursor-pointer text-muted-foreground">Lihat {r.detail.length} perubahan</summary>
                      <ul className="mt-1 flex flex-col gap-0.5 tabular-nums">
                        {r.detail.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {r.jenis === 'galat' && (
                    <Button
                      variant="outline"
                      className="mt-2 h-10"
                      onClick={async () => {
                        await navigator.clipboard.writeText(laporanAgent(r))
                        setDisalin(r.id ?? null)
                        setTimeout(() => setDisalin(null), 2000)
                      }}
                    >
                      {disalin === r.id ? <Check /> : <ClipboardCopy />}
                      {disalin === r.id ? 'Laporan disalin' : 'Salin laporan untuk agent'}
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

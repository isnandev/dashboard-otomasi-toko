import { useEffect, useState } from 'react'
import { History, House, Loader2, Package, Settings } from 'lucide-react'
import { modeDemo } from '@/channels'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/hooks/use-data'
import { Beranda } from '@/pages/beranda'
import { Pengaturan } from '@/pages/pengaturan'
import { Riwayat } from '@/pages/riwayat'
import { Stok } from '@/pages/stok'
import { cn } from '@/lib/utils'

// Few screens on purpose: Beranda, Stok, Riwayat, Pengaturan.
const HALAMAN = [
  { id: 'beranda', label: 'Beranda', ikon: House },
  { id: 'stok', label: 'Stok', ikon: Package },
  { id: 'riwayat', label: 'Riwayat', ikon: History },
  { id: 'pengaturan', label: 'Pengaturan', ikon: Settings },
] as const

type IdHalaman = (typeof HALAMAN)[number]['id']

export default function App() {
  const { data, muat } = useData()
  const [halaman, setHalaman] = useState<IdHalaman>('beranda')

  // Theme: light, dark, or follow the computer.
  const tema = data?.pengaturan.tema ?? 'sistem'
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const terapkan = () =>
      document.documentElement.classList.toggle('dark', tema === 'gelap' || (tema === 'sistem' && media.matches))
    terapkan()
    media.addEventListener('change', terapkan)
    return () => media.removeEventListener('change', terapkan)
  }, [tema])

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-lg text-muted-foreground">
        <Loader2 className="animate-spin" /> Memuat dashboard…
      </div>
    )
  }

  const keHalaman = (h: string) => setHalaman(h as IdHalaman)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground" aria-hidden>
              {data.pengaturan.namaToko.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">{data.pengaturan.namaToko}</p>
              <p className="text-sm text-muted-foreground">Dashboard otomasi</p>
            </div>
            {modeDemo && <Badge variant="outline" className="ml-1">Data contoh</Badge>}
          </div>
          <nav aria-label="Halaman" className="flex gap-1 overflow-x-auto">
            {HALAMAN.map((h) => (
              <button
                key={h.id}
                onClick={() => setHalaman(h.id)}
                aria-current={halaman === h.id ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium whitespace-nowrap transition-colors',
                  halaman === h.id ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <h.ikon className="size-4" aria-hidden />
                {h.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {halaman === 'beranda' && <Beranda data={data} muat={muat} keHalaman={keHalaman} />}
        {halaman === 'stok' && <Stok data={data} muat={muat} />}
        {halaman === 'riwayat' && <Riwayat data={data} />}
        {halaman === 'pengaturan' && <Pengaturan data={data} muat={muat} />}
      </main>
    </div>
  )
}

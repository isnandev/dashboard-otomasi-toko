import { buatChannelDemo } from './demo'
import type { Channel } from './types'

// The channels the dashboard syncs. Start with the demo channels; replace each
// one with a real channel built from contoh-marketplace.ts.
export const channels: Channel[] = [
  buatChannelDemo('toko-sendiri', 'Toko sendiri (tokokue-ani.id)', 'https://tokokue-ani.id'),
  buatChannelDemo('marketplace-a', 'Marketplace A', 'https://example.com'),
  buatChannelDemo('marketplace-b', 'Marketplace B', 'https://example.com'),
]

export const modeDemo = true

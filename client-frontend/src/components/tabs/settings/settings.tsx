import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import SidePanelSection from '@/components/ui/sidePanelSection'
import { useThemeStore } from '@libs/stores/theme'
import { useRFMap, DEFAULT_TILE_URL } from '@libs/stores/map'
import { Moon, Sun } from 'lucide-react'
import OfflineCacheSettings from './offlineCacheSettings'

const isElectron = window.env?.isElectron === true

function TileProviderSettings() {
  const { tileProvider, setTileProvider } = useRFMap()
  const [draft, setDraft] = useState(tileProvider.url)

  function handleApply() {
    const trimmed = draft.trim()
    if (!trimmed) return
    setTileProvider({ url: trimmed, subdomains: ['a', 'b', 'c'] })
  }

  function handleReset() {
    setDraft(DEFAULT_TILE_URL)
    setTileProvider({ url: DEFAULT_TILE_URL, subdomains: ['a', 'b', 'c'] })
  }

  const isDirty = draft.trim() !== tileProvider.url
  const isDefault = tileProvider.url === DEFAULT_TILE_URL

  return (
    <SidePanelSection title="Map Tiles">
      <span className="text-xs text-muted-foreground">
        Tile URL template — use {'{z}'}, {'{x}'}, {'{y}'}, {'{s}'} as placeholders
      </span>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        placeholder="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="text-xs"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleApply}
          disabled={!isDirty || !draft.trim()}
        >
          Apply
        </Button>
        <Button size="sm" className="flex-1" onClick={handleReset} disabled={isDefault && !isDirty}>
          Reset to Default
        </Button>
      </div>
    </SidePanelSection>
  )
}

export default function Settings() {
  const { setTheme } = useThemeStore()
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col gap-2 min-h-0 flex-1 overflow-y-auto">
        <h2>Settings</h2>

        <SidePanelSection>
          Theme:
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidePanelSection>

        <TileProviderSettings />

        <OfflineCacheSettings />
      </div>
      <div className="text-xs">
        {isElectron ? 'Electron' : 'Browser'} | v{__GIT_VERSION__}
      </div>
    </div>
  )
}

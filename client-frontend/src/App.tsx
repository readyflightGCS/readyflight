const isElectron = import.meta.env.VITE_TARGET === 'electron'

import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores/configurator'

export default function App(): React.JSX.Element {
  const ipcHandle = (): void => {
    if (isElectron) {
      window.electron.ipcRenderer.send('ping')
    }
  }
  const { currentTab, setTab } = useEditorStore()
  console.log(currentTab)

  return (
    <>
      <div className="grid grid-cols-2">
        <div className="grid">
          <div className={cn("h-20 w-20", currentTab == "Telemetry" ? "bg-red-200" : "bg-black")} onMouseDown={() => setTab("Telemetry")}>
            T
          </div>
          <div className={cn("h-20 w-20", currentTab == "Mission" ? "bg-red-200" : "bg-black")} onMouseDown={() => setTab("Mission")}>
            M
          </div>
        </div>
        <div>
        </div>

      </div>
    </>
  )
}

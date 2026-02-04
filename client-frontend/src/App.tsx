const isElectron = import.meta.env.VITE_TARGET === 'electron'

import Map from "./components/map/map"

import SideBar from '@/components/navigation/sidebar'
import SidePanel from './components/navigation/sidePanel/sidePanel'
import BottomPanel from './components/navigation/bottomPanel/bottomPanel'
import { useEditor } from "@/stores/configurator"

export default function App(): React.JSX.Element {
  //@ts-ignore
  const ipcHandle = (): void => {
    if (isElectron) {
      window.electron.ipcRenderer.send('ping')
    }
  }

  const isSidePanelOpen = useEditor((state) => state.sidePanelOpen)

  return (

    <div className="flex flex-cols-2 h-full w-full bg-gray-200 text-foreground">
      <SideBar />
      
      <div className="flex-grow relative">
        <div className="absolute top-0 left-0 h-full z-20">
          <SidePanel />
        </div>
        <div className={`absolute bottom-0 left-0 w-full z-20 flex justify-center mb-4 transition-all duration-300 pointer-events-none ${isSidePanelOpen ? 'pl-60' : ''}`}>
          <div className="pointer-events-auto w-fit">
            <BottomPanel />
          </div>
        </div>
        <Map />
      </div>
    </div>
  )
}

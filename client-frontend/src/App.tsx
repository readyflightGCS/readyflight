const isElectron = import.meta.env.VITE_TARGET === 'electron'

import Map from "./components/ui/map"

import SideBar from '@/components/navigation/sidebar'
import SidePanel from './components/navigation/sidePanel/sidePanel'
import BottomPanel from './components/navigation/bottomPanel/bottomPanel'


export default function App(): React.JSX.Element {
  const ipcHandle = (): void => {
    if (isElectron) {
      window.electron.ipcRenderer.send('ping')
    }
  }

  return (

    <div className="flex flex-cols-2 h-full w-full bg-gray-200 text-foreground">
      <SideBar />

      <div className="flex-grow relative">
        <div className="absolute top-0 left-0 h-full z-20">
          <SidePanel />
        </div>

        <div className="absolute bottom-0 left-64 right-0 z-20 pointer-events-auto">
          <BottomPanel />
        </div>

        <Map />
      </div>
    </div>
  )
}

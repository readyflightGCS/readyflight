const isElectron = import.meta.env.VITE_TARGET === 'electron'

import { Button } from './components/ui/button'
import Map from "./components/ui/map"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

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

        {/* the overlay div */}
        <div className="flex h-full absolute inset-0 ">
          <div>
            <SidePanel />
          </div>
          <div className="flex-grow flex flex-col">
            <div className="flex-grow">
            </div>
            <BottomPanel />
          </div>
        </div>

        { /*map component goes here (temporary grid for now :))*/}
        {/* <div className="w-full h-full bg-[linear-gradient(90deg,#c2c2c2_1px,transparent_1px),linear-gradient(#c2c2c2_1px,transparent_1px)] bg-[size:20px_20px]"></div>*/}
        { /* or a gradient to test overlaying stuff */}
        {/*<div className="w-full h-full bg-[radial-gradient(circle_at_top_left,#ff8a80,#80d8ff)]"></div>*/}
        <Map/>
      </div>
    </div>
  )
}

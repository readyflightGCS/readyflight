const isElectron = import.meta.env.VITE_TARGET === 'electron'

import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { Button } from './components/ui/button'
import Map from "./components/ui/map"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

function App(): React.JSX.Element {
  const ipcHandle = (): void => {
    if (isElectron) {
      window.electron.ipcRenderer.send('ping')
    }
  }

  return (
    <>
      <Map/>
      {isElectron ? <Versions /> : null}
    </>
  )
}

export default App

import Map from './components/map/map'
import SideBar from '@/components/navigation/sidebar'
import SidePanel from './components/navigation/sidePanel/sidePanel'
import BottomPanel from './components/navigation/bottomPanel/bottomPanel'
import MapControls from './components/map/mapControls'
import { useEditor } from '@libs/stores/configurator'
import ConnectionHandler from './components/telemetry/connectionHandler'
import { Toaster } from './components/ui/sonner'

export default function App(): React.JSX.Element {
  const isSidePanelOpen = useEditor((state) => state.sidePanelOpen)

  return (
    <div className="flex flex-cols-2 h-full w-full bg-gray-200 text-foreground">
      <SideBar />
      <div className="flex-grow relative">
        <div className="absolute top-0 left-0 h-full z-20">
          <SidePanel />
        </div>
        <div
          className={`absolute bottom-0 left-0 w-full z-20 flex justify-center mb-4 transition-all duration-300 pointer-events-none ${isSidePanelOpen ? 'pl-60' : ''}`}
        >
          <div className="pointer-events-auto">
            <BottomPanel />
          </div>
        </div>
        <div className="absolute top-4 right-4 z-20">
          <MapControls />
        </div>
        <Map />
      </div>
      <ConnectionHandler />
      {/* <Toaster position="top-right"/> */}

      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'bg-background text-foreground border-border',
            title: 'text-foreground',
            description: 'text-muted-foreground',
            actionButton: 'bg-primary text-primary-foreground',
            cancelButton: 'bg-muted text-muted-foreground',
            info: 'bg-blue-400'
            // error: "bg-red-500", // Style specific types
          }
        }}
      />
    </div>
  )
}

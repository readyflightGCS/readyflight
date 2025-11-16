const isElectron = import.meta.env.VITE_TARGET === 'electron'

import SideBar from '@/components/navigation/sidebar'
import SidePanel from './components/navigation/sidePanel/sidePanel'

export default function App(): React.JSX.Element {
  const ipcHandle = (): void => {
    if (isElectron) {
      window.electron.ipcRenderer.send('ping')
    }
  }

  return (
    <div className="flex flex-cols-2 h-full w-full bg-gray-200">
      <SideBar />
      <div className="flex-grow">
        <SidePanel />
      </div>
    </div>
  )
}

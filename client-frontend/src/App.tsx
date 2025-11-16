const isElectron = import.meta.env.VITE_TARGET === 'electron'

import SideBar from '@/components/navigation/sidebar'

export default function App(): React.JSX.Element {
  const ipcHandle = (): void => {
    if (isElectron) {
      window.electron.ipcRenderer.send('ping')
    }
  }

  return (
    <div className="grid grid-cols-2 h-full w-full">
      <SideBar />
    </div>
  )
}

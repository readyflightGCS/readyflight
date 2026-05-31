import SideBar from '@/components/tabs/sidebar'
import ConnectionHandler from './components/telemetry/connectionHandler'
import { Toaster } from './components/ui/sonner'
import TabView from './components/layout/tabView'

export default function App(): React.JSX.Element {

  return (
    <div className="flex flex-cols-2 h-full w-full bg-gray-200 text-foreground">
      <SideBar />
      <TabView />
      <ConnectionHandler />
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

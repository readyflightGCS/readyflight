import { useEditor } from "@libs/stores/configurator";
import { tabRegistry } from "../tabs/tabRegistry";
import Map from "@/components/map/map";

export default function TabView() {
  const currentTab = useEditor(s => s.currentTab)
  return (
    <div className="flex-1 relative overflow-hidden">
      <Map />
      {tabRegistry.map(tab => (
        <div key={tab.name} className={tab.name === currentTab ? undefined : 'hidden'}>
          {tab.view}
        </div>
      ))}
    </div >
  )
}

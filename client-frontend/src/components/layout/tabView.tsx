import { useEditor } from "@libs/stores/configurator";
import { tabRegistry } from "../tabs/tabRegistry";

export default function TabView() {
  const currentTab = useEditor(s => s.currentTab)
  return (
    <div className="flex-1 relative overflow-hidden">
      {tabRegistry.find(tab => tab.name == currentTab).view}
    </div >
  )
}

import SidePanel from "@/components/layout/sidePanel";
import Map from "@/components/map/map";
import Settings from "./settings";

export default function SettingsTabView() {
  return (
    <div>
      <Map />
      <SidePanel>
        <Settings />
      </SidePanel>
    </div>
  )
}

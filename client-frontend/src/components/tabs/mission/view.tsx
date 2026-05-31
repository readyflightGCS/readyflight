import BottomPanel from "@/components/layout/bottomPanel";
import SidePanel from "@/components/layout/sidePanel";
import Map from "@/components/map/map";
import MissionSidePanel from "./missionSidePanel";
import MissionBottomPanel from "./missionBottomPanel";
import MissionActionBump from "./actionBump";

export default function MissionTabView() {
  return (
    <div>
      <Map />
      <SidePanel>
        <MissionSidePanel />
      </SidePanel>
      <BottomPanel actionBump={<MissionActionBump />}>
        <MissionBottomPanel />
      </BottomPanel>
    </div>
  )
}

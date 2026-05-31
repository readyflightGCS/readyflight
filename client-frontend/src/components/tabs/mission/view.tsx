import BottomPanel from "@/components/layout/bottomPanel";
import SidePanel from "@/components/layout/sidePanel";
import MissionSidePanel from "./missionSidePanel";
import MissionBottomPanel from "./missionBottomPanel";
import MissionActionBump from "./actionBump";

export default function MissionTabView() {
  return (
    <div>
      <SidePanel>
        <MissionSidePanel />
      </SidePanel>
      <BottomPanel actionBump={<MissionActionBump />}>
        <MissionBottomPanel />
      </BottomPanel>
    </div>
  )
}

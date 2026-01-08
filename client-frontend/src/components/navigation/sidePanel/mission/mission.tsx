import CommandList from "./commandList";
import MissionFile from "./file";
import MissionDialog from "@/components/dialogs/mission";
import SidePanelSection from "@/components/ui/sidePanelSection";
import SubMissionList from "./subMissionList";
import { useMission } from "@/stores/mission";


export default function Mission() {
  const selectedSubMission = useMission(s => s.selectedSubMission)

  return (
    <div className="flex flex-col gap-2 h-full">

      <SidePanelSection title="File">
        <MissionDialog />
        <MissionFile />
      </SidePanelSection>

      <SidePanelSection title={selectedSubMission} className="flex-grow">
        <CommandList />
      </SidePanelSection>

      <SidePanelSection title="Sub Missions">
        <SubMissionList />
      </SidePanelSection>
    </div >
  )
}

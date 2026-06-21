import CommandList from './commandList'
import MissionFile from './file'
import SidePanelSection from '@/components/ui/sidePanelSection'
import SubMissionList from './subMissionList'
import { useMission } from '@libs/stores/mission'

export default function MissionSidePanel() {
  const selectedSubMission = useMission((s) => s.selectedSubMission)

  return (
    <div className="h-full flex flex-col gap-2 h-full">
      <SidePanelSection title="File">
        <MissionFile />
      </SidePanelSection>

      <SidePanelSection title={selectedSubMission} className="flex-grow min-h-0">
        <CommandList />
      </SidePanelSection>

      <SidePanelSection title="Sub Missions">
        <SubMissionList />
      </SidePanelSection>
    </div>
  )
}

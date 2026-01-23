import type { LeafletMouseEvent } from "leaflet";

import { useEditor } from "@/stores/configurator";
import { useMission } from "@/stores/mission";
import { RFCommand } from "@libs/commands/command";

export function useMapClickHandler() {
  const currentTab = useEditor((s) => s.currentTab);

  const setMission = useMission((s) => s.setMission);
  const mission = useMission((s) => s.mission);
  const selectedSubMission = useMission((s) => s.selectedSubMission);

  return (e: LeafletMouseEvent) => {
    switch (currentTab) {
      case "Mission": {
        const cmd: RFCommand = {
          type: "RF.Waypoint",
          frame: 0,
          params: {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
            altitude: 100,
          }
        };
        let a = mission.clone()
        a.pushToMission(selectedSubMission, cmd)
        setMission(a)
        break;
      }

      case "Telemetry":
        break;
      case "Settings":
        break;
      default: {
        const _exhaustiveCheck: never = currentTab
        return _exhaustiveCheck
      }
    }
  };
}



import type { LeafletMouseEvent } from "leaflet";

import { useEditor } from "@/stores/configurator";
import { useMission } from "@/stores/mission";
import { RFCommand } from "@libs/commands/command";

export function useMapClickHandler() {
  const currentTab = useEditor((s) => s.currentTab);

  const tool = useMission((s) => s.tool);
  const setMission = useMission((s) => s.setMission);
  const mission = useMission((s) => s.mission);
  const selectedSubMission = useMission((s) => s.selectedSubMission);

  return (e: LeafletMouseEvent) => {
    switch (currentTab) {
      case "Mission": {
        switch (tool) {
          case "Takeoff":
          case "Land":
          case "Payload":
          case "Waypoint":
            {
              const cmd: RFCommand = {
                // For now we emit a simple RF waypoint; we can refine per-tool later. TODO ***
                type: "RF.Waypoint",
                frame: 0,
                params: {
                  latitude: e.latlng.lat,
                  longitude: e.latlng.lng,
                  altitude: 0,
                }
              };
              let a = mission.clone()
              a.pushToMission(selectedSubMission, cmd)
              setMission(a)
              break;
            }
          default: {
            const _exhaustiveCheck: never = tool
            return _exhaustiveCheck
          }

        }
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



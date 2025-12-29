import type { LeafletMouseEvent } from "leaflet";

import { useEditor } from "@/stores/configurator";
import { useMission } from "@/stores/mission";
import type { DialectCommand } from "@/stores/mission";

export function useMapClickHandler() {
  const currentTab = useEditor((s) => s.currentTab);

  const tool = useMission((s) => s.tool);
  const addCommand = useMission((s) => s.addCommand);

  return (e: LeafletMouseEvent) => {
    switch (currentTab) {
      case "Mission": {
        const cmd: DialectCommand = {
          // For now we emit a simple RF waypoint; we can refine per-tool later.
          type: "RF.Waypoint",
          label: "Waypoint",
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          altitude: 0,
        } as DialectCommand;

        addCommand(cmd);
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



import SidePanel from "@/components/layout/sidePanel";
import TelemetrySidePanel from "./sidePanel";
import BottomPanel from "@/components/layout/bottomPanel";
import Telemetry from "./bottomPanel";
import TelemetryActionBump from "./actionBump";
import Map from "@/components/map/map";

export default function TelemetryView() {
  return (
    <div>
      <Map />
      <SidePanel>
        <TelemetrySidePanel />
      </SidePanel>
      <BottomPanel actionBump={<TelemetryActionBump />}>
        <Telemetry />
      </BottomPanel>
    </div>
  )
}

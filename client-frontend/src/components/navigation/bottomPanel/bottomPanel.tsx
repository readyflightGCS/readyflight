import { useEditor } from "@/stores/configurator"
import Settings from "./settings"
import Telemetry from "./telemetry"
import Mission from "./mission"
import MissionActionBump from "./mission/actionBump"
export default function BottomPanel() {

  const currentTab = useEditor((state) => state.currentTab)

  return (
    <div className="pb-2 w-fit">
      <div className="flex justify-center">
        <svg height="32" width="43">
          <path d=" M 43 0 C 27 0, 16 32, 0 32 L 43 32 Z " fill="var(--background)" />
        </svg>
        <div className="h-[32px] bg-card px-2 flex items-center">
          <MissionActionBump />
        </div>
        <svg height="32" width="43">
          <path d="M 0 0 C 16 0, 27 32, 43 32 L 0 32 Z " fill="var(--background)" />
        </svg>
      </div>
      <div className="h-60 w-fit p-2 bg-background rounded-lg">
        {
          (() => {
            switch (currentTab) {
              case "Telemetry": {
                return <Telemetry />
              }
              case "Mission": {
                return <Mission />
              }
              case "Settings": {
                return <Settings />
              }
              default: {
                const _exhaustiveCheck: never = currentTab
                return _exhaustiveCheck
              }
            }
          })()

        }

      </div>
    </div>

  )
}


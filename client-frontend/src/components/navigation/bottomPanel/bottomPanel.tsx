import { useEditorStore } from "@/stores/configurator"
import Settings from "./settings"
import Telemetry from "./telemetry"
import Mission from "./mission"
export default function BottomPanel() {

  const currentTab = useEditorStore((state) => state.currentTab)

  return (
    <div className="px-8 pb-2 w-full">
      <div className="h-60 w-full bg-background rounded-lg">
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


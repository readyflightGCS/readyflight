import { useEditorStore } from "@/stores/configurator"
import Settings from "./settings"
import Telemetry from "./telemetry"
import Mission from "./mission"
import { ArrowLeft, ArrowRight } from "lucide-react"
export default function SidePanel() {

  const { currentTab, sidePanelOpen, setSidePanelOpen } = useEditorStore()

  return (
    <div className="h-full flex items-center">
      {sidePanelOpen ?
        (
          <div className="h-full w-60 bg-background p-2">
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
        ) : null}

      <button className="h-14 w-8 bg-background rounded-r-lg" onClick={() => setSidePanelOpen(!sidePanelOpen)}>
        {sidePanelOpen ?
          <ArrowLeft /> : <ArrowRight />
        }
      </button>
    </div >
  )
}

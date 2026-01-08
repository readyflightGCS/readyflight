import { Button } from "@/components/ui/button"
import { tools, useMission } from "@/stores/mission"
import ParamEditor from "./mission/paramEdit"
import { ReactNode, useState } from "react"
import { Separator } from "@/components/ui/separator"
import HeightMap from "./mission/terrain/heightMap"

const tabs = [
  { name: "Parameter", component: <ParamEditor /> },
  { name: "Terrain", component: <HeightMap /> },
  { name: "Mission Check", component: <div /> }
] as const satisfies { name: string, component: ReactNode }[]

export default function mission() {
  const setTool = useMission((state => state.setTool))
  const currentTool = useMission((state) => state.tool)
  const [currentTab, setCurrentTab] = useState<typeof tabs[number]["name"]>("Parameter")
  return (
    <div>
      <div className="flex justify-center items-center gap-2">
        {tools.map((x) => (
          <Button variant={x.name == currentTool ? "active" : null} className="hover:bg-sidebar" onClick={() => setTool(x.name)}>
            {x.name}
          </Button>
        ))}
      </div>
      <div className="flex flex-row">
        <div className="flex flex-col">
          {tabs.map((tab, i) => (
            <Button key={i} variant={currentTab === tab.name ? "active" : "default"} onClick={() => setCurrentTab(tab.name)}>{tab.name}</Button>
          ))}

        </div>
        <Separator orientation="vertical" />
        {tabs.find(x => x.name === currentTab).component}
      </div>
    </div>

  )
}

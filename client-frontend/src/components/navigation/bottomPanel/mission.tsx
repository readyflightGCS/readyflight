import ParamEditor from "./mission/paramEdit"
import { ReactNode } from "react"
import { Separator } from "@/components/ui/separator"
import HeightMap from "./mission/terrain/heightMap"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const tabs = [
  { name: "Parameter", component: <ParamEditor /> },
  { name: "Terrain", component: <HeightMap /> },
  { name: "Mission Check", component: <div /> }
] as const satisfies { name: string, component: ReactNode }[]

export default function mission() {
  return (
    <div className="w-200">
      <Tabs defaultValue={tabs[0].name} className="flex-row">
        <TabsList className="flex flex-col h-fit w-40">
          {tabs.map((tab, i) => (
            <TabsTrigger key={i} value={tab.name} className="w-[100%] justify-start">
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <Separator orientation="vertical" />
        {tabs.map((tab, i) => (
          <TabsContent key={i} value={tab.name}>
            {tab.component}
          </TabsContent>
        ))}

      </Tabs>

    </div>

  )
}

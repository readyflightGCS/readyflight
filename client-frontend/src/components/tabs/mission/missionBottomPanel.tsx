import ParamEditor from './paramEdit'
import { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import HeightMap from './terrain/heightMap'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Optimise } from './optimise'

const tabs = [
  { name: 'Parameter', component: <ParamEditor /> },
  { name: 'Optimise', component: <Optimise /> },
  { name: 'Terrain', component: <HeightMap /> },
  { name: 'Mission Check', component: <div /> }
] as const satisfies { name: string; component: ReactNode }[]

export default function MissionBottomPanel() {
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

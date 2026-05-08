import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import TelemetryTable from './telemetry/telemetryTable'
import TelemetryIndicators from './telemetry/telemetryIndicators'
import TelemetryMixed from './telemetry/telemetryMixed'


const tabs = [
  { name: 'Table', component: <TelemetryTable /> },
  { name: 'Indicators', component: <TelemetryIndicators /> },
  { name: 'Mixed', component: <TelemetryMixed /> }
] as const

export default function Telemetry() {
  return (
    <div className="w-200">
      <Tabs defaultValue={tabs[0].name} className="flex-row">
        <TabsList className="flex flex-col h-fit w-40">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.name}
              value={tab.name}
              className="w-[100%] justify-start"
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <Separator orientation="vertical" />

        {tabs.map((tab) => (
          <TabsContent key={tab.name} value={tab.name}>
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

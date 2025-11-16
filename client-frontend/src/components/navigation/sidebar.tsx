import { cn } from "@/lib/utils";
import { ConfiguratorTab, useEditorStore } from "@/stores/configurator";
import { Cog, LucideIcon, MapPin, Satellite } from "lucide-react";

const tabs: {
  name: ConfiguratorTab,
  Icon: LucideIcon
}[] = [
    { name: "Telemetry", Icon: Satellite },
    { name: "Mission", Icon: MapPin }
  ]

export default function SideBar() {
  const currentTab = useEditorStore((state) => state.currentTab)
  const setTab = useEditorStore((state) => state.setTab)

  return (
    <div className="flex flex-col h-full bg-sidebar w-20">
      {tabs.map((tab, i) => (
        <Item key={i} name={tab.name} Icon={tab.Icon} active={tab.name == currentTab} onClick={() => setTab(tab.name)} />
      ))}
      <div className="flex-grow"></div>
      <Item name={"Settings"} Icon={Cog} active={currentTab == "Settings"} onClick={() => setTab("Settings")} />
    </div>

  )
}

export function Item({ name, Icon, onClick, active }: { name: string, Icon: LucideIcon, onClick: () => void, active: boolean }) {
  return (
    <button name={name} className="p-2" onMouseDown={onClick}>
      <div className={cn("rounded-lg", active ? "bg-foreground" : "bg-background")}>
        <Icon className={cn("w-full h-full p-2", active ? "text-accent" : "text-foreground")} />
      </div>
    </button >

  )
}

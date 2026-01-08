import { cn } from "@/lib/utils"
import { tools, useMission } from "@/stores/mission"

export default function MissionActionBump() {

  const currentTool = useMission((state) => state.tool)
  const setTool = useMission((state) => state.setTool)
  console.log(currentTool)
  return (
    <>
      {tools.filter(x => x.display).map((x, i) => (
        <button key={i} className="h-[32px] w-[32px] p-1 text-muted-foreground hover:bg-accent rounded" onClick={() => setTool(x.name)}>
          {<x.icon className={cn(currentTool === x.name ? "text-foreground" : "")} fill={currentTool === x.name ? "black" : "white"} />}
        </button>
      ))}
    </>
  )
}

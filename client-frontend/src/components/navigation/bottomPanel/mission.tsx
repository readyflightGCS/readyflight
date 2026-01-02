import { Button } from "@/components/ui/button"
import { tools, useMission } from "@/stores/mission"


export default function mission() {
  const setTool = useMission((state => state.setTool))
  const currentTool = useMission((state) => state.tool)
  return (
    <div>
      <div className="flex justify-between">
        {tools.map((x) => (
          <Button variant={x.name == currentTool ? "active" : null} onClick={() => setTool(x.name)}>
            {x.name}
          </Button>
        ))}
      </div>
    </div>

  )
}

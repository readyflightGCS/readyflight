import { Button } from "@/components/ui/button"
import { tools, useMission } from "@/stores/mission"
import ParamEditor from "./mission/paramEdit"


export default function mission() {
  const setTool = useMission((state => state.setTool))
  const currentTool = useMission((state) => state.tool)
  return (
    <div>
      <div className="flex justify-center items-center gap-2">
        {tools.map((x) => (
          <Button variant={x.name == currentTool ? "active" : null} className="hover:bg-sidebar" onClick={() => setTool(x.name)}>
            {x.name}
          </Button>
        ))}
      </div>
      <ParamEditor />
    </div>

  )
}

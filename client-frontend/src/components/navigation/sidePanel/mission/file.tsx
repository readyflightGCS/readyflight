import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

const files = ["test", "test2", "test3"]
export default function MissionFile() {
  return (<div>
    <div>
      <span className="text-bold">Test Mission <Pencil className="inline-block w-4" /></span>
    </div>
    <div className="w-full flex items-center flex-col pt-2">
      <div> Mission requires upload</div>
      <Button variant="green"> Upload </Button>
    </div>
  </div>
  )
}

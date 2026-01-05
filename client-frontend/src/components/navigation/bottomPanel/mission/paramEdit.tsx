import { useMission } from "@/stores/mission"
import { CommandDescription, MissionCommand } from "@libs/commands/command"
import { getCommandDescription } from "@libs/commands/helpers"
import CommandTypeSelector from "./commandTypeSelector"
import { LatLngEditor } from "./LatLngEditor"
import Parameter from "./parameter"


export default function ParamEditor() {
  const { selectedSubMission, selectedCommandIDs, mission, setMission, dialect } = useMission()

  function findCommonParamsForTypes(cmdTypes: Set<MissionCommand<CommandDescription>["type"]>): string[] {
    const a = Array.from(cmdTypes)
    if (a.length == 0) {
      return []
    }
    let params = new Set(getCommandDescription(a[0], dialect).parameters.map(x => x?.label?.toLowerCase()).filter(x => x !== undefined))
    for (let i = 1; i < a.length; i++) {
      //@ts-ignore
      params = params.intersection(new Set(getCommandDescription(a[1], dialect).parameters.map(x => x?.label?.toLowerCase()).filter(x => x !== undefined)))
    }
    return Array.from(params)
  }

  const curMission = mission.get(selectedSubMission)
  const selected = (selectedCommandIDs.length == 0 ? curMission : curMission.filter((_, i) => selectedCommandIDs.includes(i))).map((x) => {
    if (x.type !== "RF.Group") {
      return [x]
    } else {
      return mission.flatten(x.params.name)
    }
  }).flat()

  if (selected.length == 0) {
    return <div className="h-full w-full text-center content-center"> Select or place a waypoint to begin </div>
  }

  let types = new Set(selected.map(x => x.type))
  const params = findCommonParamsForTypes(types)

  let vals = {}

  for (const key of params) {
    const values = selected.map(obj => obj.params[key]);
    const allSame = values.every(val => val === values[0]);

    vals[key] = allSame ? values[0] : null
  }

  function onChange(event: { target: { name: string, value: number } }) {
    const tmp = mission.clone()
    tmp.changeManyParams(selectedCommandIDs.length === 0 ? curMission.map((_, i) => i) : selectedCommandIDs, selectedSubMission, (cmd: any) => {
      cmd.params[event.target.name] = event.target.value
      return cmd
    }, true)
    setMission(tmp)
  }


  return (
    <div className="flex-1 flex flex-wrap overflow-y-auto">
      <CommandTypeSelector selected={selected} />
      {Array.from(params).map((x, i) => {
        if (["longitude", "latitude"].includes(x)) {
          return
        }
        return (<Parameter key={i} name={x} value={vals[x]} onChange={onChange} />)
      }
      )}
      < LatLngEditor />

    </div>
  )
}


import { useMission } from "@/stores/mission"
import { CommandDescription, MissionCommand } from "@libs/commands/command"
import { getCommandDescription } from "@libs/commands/helpers"
import { LatLngEditor } from "./LatLngEditor"
import Parameter from "./parameter"


export default function ParamEditor() {
  const selectedSubMission = useMission(s => s.selectedSubMission)
  const selectedCommandIDs = useMission(s => s.selectedCommandIDs)
  const mission = useMission(s => s.mission)
  const setMission = useMission(s => s.setMission)
  const dialect = useMission(s => s.dialect)

  const curMission = mission.get(selectedSubMission)

  // The selected commands, if we we haven't selected any commands assume the
  // whole mission is selected. Flatten any groups so we change the parameters
  // of items in those groups as well
  const selected = (
    selectedCommandIDs.length == 0 ?
      curMission :
      curMission.filter((_, i) => selectedCommandIDs.includes(i))
  )
    .map((x) => {
      if (x.type !== "RF.Group") {
        return [x]
      } else {
        return mission.flatten(x.params.name)
      }
    })
    .flat()

  // early return if we have nothing selected
  if (selected.length == 0) {
    return (
      <div className="h-full w-full text-center content-center">
        Select or place a waypoint to begin
      </div>
    )
  }

  // we want to take the intersection of parameters for all command types selected
  function findCommonParamsForTypes(cmdTypes: Set<MissionCommand<CommandDescription>["type"]>): string[] {
    const a = Array.from(cmdTypes)

    if (a.length == 0) {
      return []
    }

    // get initial parameter names from the first command selected
    let params = new Set(
      getCommandDescription(a[0], dialect).parameters
        .map((x: CommandDescription["parameters"][number]) => x?.label?.toLowerCase())
        .filter(x => x !== undefined)
    )

    // loop over the rest and find the intersection of all
    for (let i = 1; i < a.length; i++) {

      let nextParams = new Set(
        getCommandDescription(a[i], dialect).parameters
          .map((x: CommandDescription["parameters"][number]) => x?.label?.toLowerCase())
          .filter(x => x !== undefined))

      // take the intersection
      params = new Set(Array.from(params).filter(i => nextParams.has(i)));
    }

    return Array.from(params)
  }


  let selectedCommandTypes = new Set(selected.map(x => x.type))
  const params = findCommonParamsForTypes(selectedCommandTypes)

  // as we want to be able to edit the parameters of several commands at once,
  // we need to compare all commands with the same parameter to see if they are
  // the same. if they are the same we can display the value, if not we can
  // display a placeholder thing which signifies they are different. The user
  // can then decide if they want to change all at once

  let parameterValues = {}

  for (const key of params) {
    const values = selected.map(obj => obj.params[key]);
    const allSame = values.every(val => val === values[0]);

    parameterValues[key] = allSame ? values[0] : null
  }

  function onParameterValueChange(event: { target: { name: string, value: number } }) {
    const tmp = mission.clone()
    tmp.changeManyParams(selectedCommandIDs.length === 0 ? curMission.map((_, i) => i) : selectedCommandIDs, selectedSubMission, (cmd: any) => {
      cmd.params[event.target.name] = event.target.value
      return cmd
    }, true)
    setMission(tmp)
  }


  return (
    <div className="flex-1 flex flex-wrap overflow-y-auto">
      {Array.from(params).map((x, i) => {
        // latitude and longitude are handled by the LatLng editor
        if (["longitude", "latitude"].includes(x)) {
          return
        }
        return (<Parameter key={i} name={x} value={parameterValues[x]} onChange={onParameterValueChange} />)
      }
      )}
      < LatLngEditor />

    </div>
  )
}


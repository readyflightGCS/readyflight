import { useMission } from '@libs/stores/mission'
import {
  CommandParameterDescriptionN,
  DialectCommandDescription,
  MissionCommand
} from '@libs/commands/command'
import { getCommandDescription } from '@libs/commands/helpers'
import { LatLngEditor } from './LatLngEditor'
import Parameter from './parameter'

export default function ParamEditor() {
  const selectedSubMission = useMission((s) => s.selectedSubMission)
  const selectedCommandIDs = useMission((s) => s.selectedCommandIDs)
  const mission = useMission((s) => s.mission)
  const setMission = useMission((s) => s.setMission)
  const dialect = useMission((s) => s.dialect)

  const curMission = mission.get(selectedSubMission)

  // The selected commands, if we we haven't selected any commands assume the
  // whole mission is selected. Flatten any groups so we change the parameters
  // of items in those groups as well
  const selected = (
    selectedCommandIDs.length == 0
      ? curMission
      : curMission.filter((_, i) => selectedCommandIDs.includes(i))
  )
    .map((x) => {
      if (x.type !== 'RF.Group') {
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
  function findCommonParamsForTypes(
    cmdTypesSet: Set<MissionCommand<DialectCommandDescription>['type']>
  ) {
    const cmdTypes = Array.from(cmdTypesSet)

    if (cmdTypes.length == 0) {
      return []
    }

    // get initial parameter names from the first command selected
    let commonCmdParams = new Set(
      getCommandDescription(cmdTypes[0], dialect)
        .parameters.filter((paramDesc) => paramDesc?.parameterType === 'number')
        .map((paramDesc) => paramDesc.label.toLowerCase())
        .filter((x) => x !== undefined)
    )

    // loop over the rest and find the intersection of all
    for (let i = 1; i < cmdTypes.length; i++) {
      const nextParams = new Set(
        getCommandDescription(cmdTypes[i], dialect)
          .parameters.filter((paramDesc) => paramDesc?.parameterType === 'number')
          .map((paramDesc) => paramDesc.label.toLowerCase())
          .filter((x) => x !== undefined)
      )

      // take the intersection
      commonCmdParams = new Set(Array.from(nextParams).filter((i) => nextParams.has(i)))
    }

    return getCommandDescription(cmdTypes[0], dialect)
      .parameters.filter(
        (x) => x?.parameterType === 'number' && commonCmdParams.has(x.label.toLowerCase())
      )
      .map((x) => {
        const n = x as CommandParameterDescriptionN
        return {
          name: n.label?.toLowerCase(),
          min: n.minValue,
          max: n.maxValue,
          step: n.increment
        }
      })
  }

  const selectedCommandTypes = new Set(selected.map((x) => x.type))
  const params: { name: string; min: number | null; max: number | null; step: number | null }[] =
    findCommonParamsForTypes(selectedCommandTypes)

  // as we want to be able to edit the parameters of several commands at once,
  // we need to compare all commands with the same parameter to see if they are
  // the same. if they are the same we can display the value, if not we can
  // display a placeholder thing which signifies they are different. The user
  // can then decide if they want to change all at once

  const parameterValues = {}

  for (const param of params) {
    const values = selected.map((obj) => obj.params[param.name])
    const allSame = values.every((val) => val === values[0])

    parameterValues[param.name] = allSame ? values[0] : null
  }

  function onParameterValueChange(event: {
    target: { name: string; value: number; delta: number }
  }) {
    const tmp = mission.clone()
    tmp.changeManyParams(
      selectedCommandIDs.length === 0 ? curMission.map((_, i) => i) : selectedCommandIDs,
      selectedSubMission,
      (cmd) => {
        cmd.params[event.target.name] += event.target.delta
        return cmd
      },
      true
    )
    setMission(tmp)
  }

  return (
    <div className="flex-1 flex flex-wrap overflow-y-auto">
      {Array.from(params).map((x, i) => {
        // latitude and longitude are handled by the LatLng editor
        return (
          <Parameter
            key={i}
            name={x.name}
            value={parameterValues[x.name]}
            onChange={onParameterValueChange}
            min={x.min}
            max={x.max}
            step={x.step}
          />
        )
      })}
      <LatLngEditor />
    </div>
  )
}

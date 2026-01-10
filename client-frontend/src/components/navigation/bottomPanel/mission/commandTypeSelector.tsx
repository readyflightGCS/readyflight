"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMission } from "@/stores/mission";
import { CommandDescription, MissionCommand } from "@libs/commands/command";
import { coerceCommand } from "@libs/commands/helpers";
import { RFCommandDescription } from "@libs/commands/readyflightCommands";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";

export default function CommandTypeSelector({ selected }: { selected: MissionCommand<CommandDescription>[] }) {
  const { selectedSubMission, selectedCommandIDs, mission, setMission, dialect } = useMission()

  const curMission = mission.get(selectedSubMission)
  let selectedIDs: number[] = []
  if (selectedCommandIDs.length == 0) {
    for (let i = 0; i < curMission.length; i++) {
      selectedIDs.push(i)
    }
  } else {
    selectedIDs = selectedCommandIDs
  }


  console.assert(selected.length > 0, "command type selector with 0 selected :(")

  const types: Set<string> = new Set();
  selected.forEach((x) => {
    types.add(x.type)
  })

  function onChange(type: MissionCommand<CommandDescription>["type"]) {
    const newWPs = mission.clone()
    newWPs.changeManyParams(selectedIDs, selectedSubMission, (cmd) => {
      if (type === null) return cmd
      return coerceCommand(cmd, type, dialect) as MissionCommand<CommandDescription>
    }, true)
    setMission(newWPs)
  }

  return (
    <div className="p-2 flex flex-col">
      <label>
        <span className="block pl-[3.5px]">Type</span>
        <Select value={types.size > 1 ? "--" : selected[0].type} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue />

          </SelectTrigger>
          <SelectContent>
            {types.size > 1 ? <option value="--" disabled>--</option> : null}
            <SelectGroup>
              <SelectLabel>ReadyFlight Commands</SelectLabel>
              {RFCommandDescription.filter(x => x.type !== "RF.Group").map((x, i) => (
                <SelectItem key={i} value={x.type}>{x.label}</SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Dialect Commands</SelectLabel>
              {dialect.commandDescriptions.map((x, i) => (
                <SelectItem key={i} value={x.type}>{x.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </label>
    </div >
  );
}


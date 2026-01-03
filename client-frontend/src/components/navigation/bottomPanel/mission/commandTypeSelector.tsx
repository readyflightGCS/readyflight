"use client"
import { useMission } from "@/stores/mission";
import { CommandDescription, MissionCommand } from "@libs/commands/command";
import { coerceCommand, getCommandDescription } from "@libs/commands/helpers";
import { RFCommandDescription } from "@libs/commands/readyflightCommands";
import { ChangeEvent } from "react";

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

  function onChange(e: ChangeEvent<HTMLSelectElement>) {
    const newWPs = mission.clone()
    newWPs.changeManyParams(selectedIDs, selectedSubMission, (cmd) => {
      let type = e.target.selectedOptions[0].getAttribute('data-cmd') as MissionCommand<CommandDescription>["type"]
      if (type === null) return cmd
      return coerceCommand(cmd, type, dialect) as MissionCommand<CommandDescription>
    }, true)
    setMission(newWPs)
  }

  return (
    <div className="p-2 flex flex-col">
      <label>
        <span className="block pl-[3.5px]">Type</span>
        <select className="w-40 h-[25px] border-input bg-card" onChange={onChange} value={types.size > 1 ? "" : getCommandDescription(selected[0].type, dialect).label}>

          {types.size > 1 ? <option value="" disabled>--</option> : null}
          {RFCommandDescription.map((x, i) => (
            <option key={i} data-cmd={x.type}>{x.label}</option>
          ))}
          {dialect.commandDescriptions.map((x, i) => (
            <option key={i} data-cmd={x.type}>{x.label}</option>
          ))}
        </select>
      </label>
    </div >
  );
}


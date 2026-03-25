import { cn } from "@/lib/utils"
import { useMission } from "@/stores/mission"
import { RFCommandDescription } from "@libs/commands/readyflightCommands"
import { CommandDescription, MissionCommand } from "@libs/commands/command";
import { coerceCommand } from "@libs/commands/helpers";
import { Locate, PlaneLanding, PlaneTakeoff, PlugZap, MoreHorizontal, Route, LucideIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function MissionActionBump() {
  const { selectedSubMission, selectedCommandIDs, mission, setMission, dialect } = useMission()

  // Get selected commands
  const curMission = mission.get(selectedSubMission)
  let selectedIDs: number[] = []
  if (selectedCommandIDs.length > 0) {
    selectedIDs = selectedCommandIDs
  }

  // Determine current command type if any
  const selectedCommands = selectedIDs.map(id => curMission[id]).filter(x => x !== undefined)
  const types: Set<string> = new Set();
  selectedCommands.forEach((x) => {
    types.add(x.type)
  })
  const currentType = types.size >= 1 ? Array.from(types)[0] : null
  const isMultiType = types.size > 1
  const selectionCount = selectedIDs.length

  function onChange(type: MissionCommand<CommandDescription>["type"]) {
    if (selectedIDs.length === 0) return

    const newWPs = mission.clone()
    newWPs.changeManyParams(selectedIDs, selectedSubMission, (cmd) => {
      if (type === null) return cmd
      return coerceCommand(cmd, type, dialect) as MissionCommand<CommandDescription>
    }, true)
    setMission(newWPs)
  }

  // --- Exhaustive Command Mapping ---
  // We explicitly map EVERY RF command type (excluding Group) to an icon. 
  // We use TypeScript key enforcement to ensure that if a new command is added to RFCommandDescription,
  // this file will fail to compile until an icon is added.
  type ButtonCommandType = Exclude<typeof RFCommandDescription[number]["type"], "RF.Group">

  const icons: Record<ButtonCommandType, LucideIcon> = {
    "RF.Waypoint": Locate,
    "RF.Takeoff": PlaneTakeoff,
    "RF.Land": PlaneLanding,
    "RF.SetServo": PlugZap,
    "RF.DubinsPath": Route,
  }

  const isDisabled = selectedIDs.length === 0

  // Determine label for the dialect selector
  const isRFCommand = currentType && RFCommandDescription.some(cb => cb.type === currentType)
  const isDialectCommand = currentType && !isRFCommand

  // Find label for dialect command if active
  let dialectLabel = "Other"
  if (isDialectCommand) {
    const cmdDesc = dialect.commandDescriptions.find(c => c.type === currentType)
    if (cmdDesc) dialectLabel = cmdDesc.label
  }

  return (
    <div className="flex flex-row items-center gap-2 px-2 py-1.5 w-full max-w-full overflow-hidden">
      {/* Selection Feedback */}
      {selectionCount > 0 && (
        <>
          <div className="hidden sm:flex items-center justify-center bg-accent/20 text-accent-foreground px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap min-w-[60px]">
            {selectionCount} Selected
          </div>
          {/* Divider - Only shown when selection exists */}
          <div className="h-[20px] w-[1px] bg-border shrink-0" />
        </>
      )}

      {/* Buttons Container - using flex-wrap to fit all content */}
      <div className="flex flex-1 gap-1 items-center flex-wrap">
        {RFCommandDescription.map((cmd) => {
          if (cmd.type === "RF.Group") return null

          const Icon = icons[cmd.type as ButtonCommandType]
          const isSelected = !isMultiType && currentType === cmd.type

          return (
            <button
              key={cmd.type}
              disabled={isDisabled}
              title={cmd.label}
              className={cn(
                "h-8 w-8 flex-shrink-0 flex items-center justify-center rounded transition-colors duration-100",
                isDisabled
                  ? "opacity-30 cursor-not-allowed"
                  : isSelected
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => onChange(cmd.type)}
            >
              <Icon className="h-4 w-4" strokeWidth={isSelected ? 2.5 : 2} />
            </button>
          )
        })}

        {/* Dialect Dropdown - Now grouped with commands, same styling */}
        <DropdownMenu>
          <DropdownMenuTrigger disabled={isDisabled} asChild>
            <button
              className={cn(
                "h-[32px] px-2 font-medium text-[10px] flex-shrink-0 flex items-center justify-center rounded transition-colors duration-100",
                isDisabled
                  ? "opacity-30 cursor-not-allowed"
                  : isDialectCommand
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title="Other Commands"
            >
              {dialectLabel}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {dialect.commandDescriptions.map((x, i) => (
              <DropdownMenuItem key={i} onClick={() => onChange(x.type)} className="text-xs">
                {x.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  )
}

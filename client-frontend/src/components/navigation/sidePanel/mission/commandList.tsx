import { useMission } from '@libs/stores/mission'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DialectCommandDescription, MissionCommand } from '@libs/commands/command'
import CommandItem from './commandItem'
import { getCommandLocation } from '@libs/commands/helpers'

export default function CommandList() {
  const setSelectedSubMission = useMission((s) => s.setSelectedSubMission)
  const mission = useMission((s) => s.mission)
  const setSelectedCommandIDs = useMission((s) => s.setSelectedCommandIDs)
  const selectedCommandIDs = useMission((s) => s.selectedCommandIDs)
  const dialect = useMission((s) => s.dialect)
  const setMission = useMission((s) => s.setMission)
  const selectedSubMission = useMission((s) => s.selectedSubMission)

  const curMission = mission.get(selectedSubMission)

  const missions = Array.from(mission.getMissions())

  const hasLanding = missions.includes('Landing')
  const hasTakeoff = missions.includes('Takeoff')

  function handleGroup() {
    // get name for mission
    let name: string | null = null
    name = prompt('enter name')
    if (name == null) return

    // remove all selected
    const newCmds = curMission.filter((_, id) => selectedCommandIDs.includes(id))

    // get the nodes for sub mission
    const subMissionCmds = curMission.filter((_, id) => !selectedCommandIDs.includes(id))

    // if _ at the start of the name, don't add to the main mission
    if (name.charAt(0) != '_') {
      subMissionCmds.splice(Math.min(...selectedCommandIDs), 0, {
        type: 'RF.Group',
        frame: 0,
        params: { name: name }
      })
      setSelectedCommandIDs([Math.min(...selectedCommandIDs)])
    } else {
      setSelectedCommandIDs([])
    }

    // update the actual waypoints
    const temp = mission.clone()
    temp.set(selectedSubMission, subMissionCmds)
    temp.set(name, newCmds)
    setMission(temp)
  }

  function createTakeoff() {
    const a = mission.clone()
    a.addSubMission('Takeoff', [])
    a.insert(0, 'Main', { type: 'RF.Group', frame: 0, params: { name: 'Takeoff' } })
    setMission(a)
    setSelectedSubMission('Takeoff')
    setSelectedCommandIDs([])
    setTool('Takeoff')
  }

  function createLanding() {
    const a = mission.clone()
    a.addSubMission('Landing', [])
    a.pushToMission('Main', { type: 'RF.Group', frame: 0, params: { name: 'Landing' } })
    setMission(a)
    setSelectedSubMission('Landing')
    setSelectedCommandIDs([])
    setTool('Land')
  }

  const missionWithDubinsGroups: (
    | {
        type: 'cmd'
        cmd: MissionCommand<DialectCommandDescription>
      }
    | {
        type: 'dubins'
        cmds: MissionCommand<DialectCommandDescription>[]
      }
  )[] = []

  let curDubinsPath = []
  for (let i = 0; i < curMission.length; i++) {
    if (curMission[i].type === 'RF.DubinsPath') {
      curDubinsPath.push(curMission[i])
      continue
    }
    if (getCommandLocation(curMission[i], dialect) || curMission[i].type === 'RF.Group') {
      if (curDubinsPath.length > 0) {
        missionWithDubinsGroups.push({ type: 'dubins', cmds: curDubinsPath })
        curDubinsPath = []
      }
      missionWithDubinsGroups.push({ type: 'cmd', cmd: curMission[i] })
      continue
    }
    if (curDubinsPath.length > 0) {
      curDubinsPath.push(curMission[i])
      continue
    }
    missionWithDubinsGroups.push({ type: 'cmd', cmd: curMission[i] })
  }
  if (curDubinsPath.length > 0) {
    missionWithDubinsGroups.push({ type: 'dubins', cmds: curDubinsPath })
    curDubinsPath = []
  }

  let cmdId = 0

  return (
    <div className="min-h-0">
      <ScrollArea className="h-full">
        {!hasTakeoff && selectedSubMission == 'Main' ? (
          <div className="py-2">
            <Button
              name="Add Takeoff"
              onClick={createTakeoff}
              className="text-center w-full my-2 mx-0 h-12"
            >
              Add Takeoff
            </Button>
          </div>
        ) : null}

        {missionWithDubinsGroups.map((node, i) => {
          if (node.type === 'cmd') {
            return <CommandItem id={cmdId++} key={i} command={node.cmd} />
          } else {
            return (
              <div key={i} className="pl-2">
                <div className="relative pl-2">
                  <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-red-500 rounded-full" />

                  <div>
                    {node.cmds.map((cmd, j) => (
                      <CommandItem id={cmdId++} key={j} command={cmd} />
                    ))}
                  </div>
                </div>
              </div>
            )
          }
        })}
        {selectedCommandIDs.length > 1 ? (
          <div className="w-full flex justify-center">
            <Button variant="active" onMouseDown={handleGroup} className="text-center p-1 m-1 w-44">
              Group {selectedCommandIDs.length} waypoints
            </Button>
          </div>
        ) : null}

        {!hasLanding && selectedSubMission == 'Main' ? (
          <div className="py-2">
            <Button onClick={createLanding} className="w-full my-2 mx-0 h-12">
              Add Landing
            </Button>
          </div>
        ) : null}
      </ScrollArea>
    </div>
  )
}

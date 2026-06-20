import { useState } from 'react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import ListItem from '@/components/ui/listItem'
import ConfirmDialog from '@/components/ui/confirmDialog'
import { useMission } from '@libs/stores/mission'
import {
  CornerLeftUp,
  Fence,
  MapPin,
  PlaneLanding,
  PlaneTakeoff,
  Route,
  Trash2
} from 'lucide-react'

const noAddNames = ['Main', 'Geofence', 'Takeoff', 'Landing', 'Markers']

type PendingAction = { type: 'clear' | 'delete'; missionName: string } | null

export default function SubMissionList() {
  const selectedSubMission = useMission((s) => s.selectedSubMission)
  const setSelectedSubMission = useMission((s) => s.setSelectedSubMission)
  const clearSubMission = useMission((s) => s.clearSubMission)
  const deleteSubMission = useMission((s) => s.deleteSubMission)
  const addSub = useMission((s) => s.addSub)
  const [pending, setPending] = useState<PendingAction>(null)

  const subMissionInfo = useMission(
    (s) => {
      const names = s.mission.getMissions()
      const ret: { name: string; cmdCount: number }[] = []
      for (let i = 0; i < names.length; i++) {
        ret.push({ name: names[i], cmdCount: s.mission.get(names[i]).length })
      }
      return ret
    },
    (a, b) =>
      a.length === b.length &&
      a.every((v, i) => v.name === b[i].name && v.cmdCount === b[i].cmdCount)
  )

  function handleConfirm() {
    if (!pending) return
    if (pending.type === 'clear') clearSubMission(pending.missionName)
    else deleteSubMission(pending.missionName)
    setPending(null)
  }

  return (
    <>
      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.type === 'clear'
            ? `Clear "${pending.missionName}"?`
            : `Delete "${pending?.missionName}"?`
        }
        description={
          pending?.type === 'clear'
            ? 'All commands in this sub-mission will be removed.'
            : 'This sub-mission will be permanently deleted.'
        }
        confirmLabel={pending?.type === 'clear' ? 'Clear' : 'Delete'}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    <div className="flex flex-col">
      {subMissionInfo.map((subMission, id) => {
        const canAdd = !noAddNames.includes(subMission.name)

        return (
          <ListItem
            name={`${subMission.name} (${subMission.cmdCount})`}
            icon={
              subMission.name == 'Geofence' ? (
                <span>
                  <Fence />
                </span>
              ) : subMission.name == 'Markers' ? (
                <span>
                  <MapPin />
                </span>
              ) : subMission.name == 'Landing' ? (
                <span>
                  <PlaneLanding />
                </span>
              ) : subMission.name == 'Takeoff' ? (
                <span>
                  <PlaneTakeoff />
                </span>
              ) : (
                <span>
                  <Route />
                </span>
              )
            }
            className="justify-start"
            key={id}
            onClick={() => setSelectedSubMission(subMission.name)}
            selected={selectedSubMission == subMission.name}
            menuItems={
              <>
                {canAdd ? (
                  <DropdownMenuItem
                    onClick={() => addSub(subMission.name)}
                    className="gap-2"
                    disabled={selectedSubMission === subMission.name}
                  >
                    <CornerLeftUp className="h-4 w-4" />
                    <span>Add to Mission</span>
                  </DropdownMenuItem>
                ) : null}

                {['Main', 'Geofence', 'Markers'].includes(selectedSubMission) ? (
                  <DropdownMenuItem
                    onClick={() => setPending({ type: 'clear', missionName: subMission.name })}
                    className="gap-2 text-red-500 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setPending({ type: 'delete', missionName: subMission.name })}
                    className="gap-2 text-red-500 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                )}
              </>
            }
          />
        )
      })}
    </div>
    </>
  )
}

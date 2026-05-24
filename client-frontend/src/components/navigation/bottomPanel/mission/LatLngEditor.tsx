import { useMission } from '@libs/stores/mission'
import { filterLatLngCmds, getCommandLocation } from '@libs/commands/helpers'
import { avgLatLng } from '@libs/world/latlng'
import { LocateFixed, MousePointerClick, RotateCcw, RotateCw } from 'lucide-react'
import { useEditor } from '@libs/stores/configurator'

export function LatLngEditor() {
  const { mission, setMission, selectedSubMission, selectedCommandIDs, dialect } = useMission()
  const { setTool } = useEditor()

  const curMission = mission.get(selectedSubMission)

  // all nodes if selected has none, or selected nodes
  const wps =
    selectedCommandIDs.length === 0
      ? curMission
      : curMission.filter((_, id) => selectedCommandIDs.includes(id))

  // all indexes if selected has none, or all selected indexes
  const wpsIds: number[] =
    selectedCommandIDs.length === 0 ? curMission.map((_, index) => index) : selectedCommandIDs

  const leaves = wps.map((x) => mission.flattenNode(x)).reduce((cur, acc) => acc.concat(cur), [])

  const avgll = avgLatLng(
    filterLatLngCmds(leaves, dialect).map((x) => getCommandLocation(x, dialect))
  )
  if (avgll == undefined) {
    return null
  }
  const { lat, lng } = avgll

  function move() {
    const inLat = prompt('Enter latitude')
    const inLng = prompt('Enter Longitude')
    if (inLat === null || inLng === null) {
      return
    }
    const newLat = parseFloat(inLat)
    const newLng = parseFloat(inLng)
    const leaves = wps.map((x) => mission.flattenNode(x)).reduce((cur, acc) => acc.concat(cur), [])

    const avgll = avgLatLng(
      filterLatLngCmds(leaves, dialect).map((x) => getCommandLocation(x, dialect))
    )
    if (avgll == undefined) return
    const { lat, lng } = avgll
    const temp = mission.clone()
    temp.changeManyParams(
      wpsIds,
      selectedSubMission,
      (cmd) => {
        if (
          'latitude' in cmd.params &&
          'longitude' in cmd.params &&
          typeof cmd.params.latitude == 'number' &&
          typeof cmd.params.longitude == 'number'
        ) {
          cmd.params.latitude += newLat - lat
          cmd.params.longitude += newLng - lng
        }
        return cmd
      },
      true
    )
    setMission(temp)
  }

  function rotateDeg(deg: number) {
    const angleRadians = (deg * Math.PI) / 180

    const temp = mission.clone()
    temp.changeManyParams(
      wpsIds,
      selectedSubMission,
      (cmd) => {
        if (
          'latitude' in cmd.params &&
          typeof cmd.params.latitude == 'number' &&
          typeof cmd.params.longitude == 'number'
        ) {
          const x = (cmd.params.longitude - lng) * Math.cos((lat * Math.PI) / 180)
          const y = cmd.params.latitude - lat

          const newX = x * Math.cos(angleRadians) - y * Math.sin(angleRadians)
          const newY = x * Math.sin(angleRadians) + y * Math.cos(angleRadians)

          cmd.params.longitude = newX / Math.cos((lat * Math.PI) / 180) + lng
          cmd.params.latitude = newY + lat
        }

        return cmd
      },
      true
    )
    setMission(temp)
  }

  function rotate() {
    const angleDegrees = prompt('Enter rotation angle in degrees')
    if (!angleDegrees) return
    rotateDeg(Number(angleDegrees))
  }

  function place() {
    setTool('place')
  }

  return (
    <>
      <div className="p-2">
        <label>
          <span className="block">Move Commands</span>
          <div className="border-2 border-input rounded-lg w-40 h-8 overflow-hidden flex text-sm">
            <button
              onMouseDown={move}
              className="flex-grow bg-muted flex items-center justify-evenly h-full cursor-pointer"
            >
              <LocateFixed className="h-5 w-5 inline" />
              Move
            </button>
            <span className="w-[2px] bg-border h-[100%] h-full" />
            <button
              onMouseDown={place}
              className="flex-grow bg-muted flex items-center justify-evenly h-full cursor-pointer"
            >
              <MousePointerClick className="w-5 h-5 inline" />
              Place
            </button>
          </div>
        </label>
      </div>

      {selectedCommandIDs.length == 0 || selectedCommandIDs.length > 1 ? (
        <div className="p-2">
          <label>
            <span className="block">Rotate Commands</span>
            <div className="border-2 border-input rounded-lg w-40 h-8 flex overflow-hidden">
              <button
                onMouseDown={() => rotateDeg(5)}
                className="h-full aspect-square flex items-center justify-center bg-muted cursor-pointer"
              >
                <RotateCcw className="h-5 w-5 inline" />
              </button>
              <span className="w-[2px] bg-input h-full bg-border" />
              <button
                onMouseDown={rotate}
                className="flex-grow text-center text-sm bg-muted cursor-pointer"
              >
                Rotate
              </button>
              <span className="w-[2px] bg-input h-full bg-border" />
              <button
                onMouseDown={() => rotateDeg(-5)}
                className="h-full aspect-square flex items-center justify-center bg-muted cursor-pointer"
              >
                <RotateCw className="h-5 w-5 inline" />
              </button>
            </div>
          </label>
        </div>
      ) : null}
    </>
  )
}

import { useMission } from "@libs/stores/mission"

export default function DubinsEditor() {
  const mission = useMission((s) => s.mission)
  const selectedSubMission = useMission((s) => s.selectedSubMission)
  const curMission = mission.get(selectedSubMission)
  const selectedCommandIDs = useMission((s) => s.selectedCommandIDs)

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
    .filter((x) => x.type === "RF.DubinsPath")[0]


  return (
    <div>
      {selected.params.points.map((x) => (
        <div className="flex gap-2">
          <span>{x.lat.toFixed(5)}</span>
          <span>{x.lng.toFixed(5)}</span>
          <span>{x.heading}</span>
          <span>{x.radius}</span>
        </div>
      ))}
    </div>

  )

}

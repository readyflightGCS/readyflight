import { CommandDescription, MissionCommand, RFCommand } from "@libs/commands/command";
import { LatLng } from "@libs/world/latlng";


// Type for RF.Group command
type GroupCommand = Extract<RFCommand, { type: "RF.Group" }>

export class Mission<CD extends CommandDescription> {

  private collection: Map<string, MissionCommand<CD>[]>
  private referencePoint: LatLng

  destructure() {
    return this.collection;
  }

  constructor(referencePoint: LatLng = { lat: 0, lng: 0 }, collection?: Map<string, MissionCommand<CD>[]>) {
    if (collection) {
      let newMap = new Map()
      for (let key of Array.from(collection.keys())) {
        let items = collection.get(key)
        if (!items) continue;
        newMap.set(key, [...items])
      }
      this.collection = new Map(newMap)
      return
    }
    this.collection = new Map();
    this.collection.set("Main", [])
    this.collection.set("Geofence", [])
    this.collection.set("Markers", [])
    this.referencePoint = referencePoint
  }

  getReferencePoint(): LatLng {
    return this.referencePoint
  }

  get(mission: string): MissionCommand<CD>[] {
    const a = this.collection.get(mission)
    if (a === undefined) {
      throw new MissingMission(mission)
    }
    return a
  }

  set(mission: string, nodes: MissionCommand<CD>[]) {
    this.collection.set(mission, nodes)
  }

  getMissions() {
    return Array.from(this.collection.keys())
  }

  pushToMission(missionName: string, waypoint: MissionCommand<CD>) {
    const mission = this.collection.get(missionName)
    if (!mission) throw new MissingMission(missionName)
    // Prevent recursive group references; only RF Group can be recursive.
    if ((waypoint as RFCommand).type === "RF.Group") {
      const group = waypoint as GroupCommand
      if (this.contains(group.params.name, missionName)) {
        throw new RecursiveMission()
      }
    }
    mission.push(waypoint)
  }

  clone() {
    return new Mission(this.referencePoint, this.collection)

  }

  flatten(mission: string) {
    let retList: Exclude<MissionCommand<CD>, GroupCommand>[] = []
    const commands = this.collection.get(mission)
    if (commands === undefined) return []
    for (let i = 0; i < commands.length; i++) {
      retList = retList.concat(this.flattenNode(commands[i]))

    }
    return retList
  }

  flattenNode(node: MissionCommand<CD>) {
    let retList: Exclude<MissionCommand<CD>, GroupCommand>[] = []
    if ((node as RFCommand).type == "RF.Group") {
      const group = node as GroupCommand
      retList = retList.concat(this.flatten(group.params.name))
    } else {
      retList.push(node as Exclude<MissionCommand<CD>, GroupCommand>)
    }
    return retList
  }

  addSubMission(name: string, nodes: MissionCommand<CD>[] = []) {
    this.collection.set(name, nodes)
  }

  removeSubMission(name: string) {
    this.collection.delete(name)

    // loop over all sub missions
    for (const missionKey of Array.from(this.collection.keys())) {
      const currentMissionNodes = this.collection.get(missionKey);
      if (currentMissionNodes) {
        const filteredNodes = currentMissionNodes.filter(node => {
          if ((node as RFCommand).type === "RF.Group") {
            const group = node as GroupCommand
            return group.params.name !== name;
          }
          return true;
        });
        this.collection.set(missionKey, filteredNodes);
      }
    }
  }

  contains(missionName: string, A: string): boolean {
    const commands = this.collection.get(missionName)
    if (!commands) { throw new MissingMission(missionName) }
    for (let cmd of commands) {
      if ((cmd as RFCommand).type === "RF.Group") {
        const group = cmd as GroupCommand
        if (group.params.name === A) {
          return true
        }
        if (this.contains(group.params.name, A)) return true
      }
    }
    return false
  }

  isRecursive(missionName: string = "Main") {
    return this.contains(missionName, missionName)
  }

  /**
   * Finds the nth command's position of a flattened mission.
   * @param missionName - The name of the mission to search in.
   * @param n - The index of the waypoint to find.
   * @returns A tuple containing the mission name and the index of the waypoint, or undefined if the waypoint is not found.
   */
  findNthPosition(missionName: string, n: number): [string, number] | undefined {
    const missionNodes = this.collection.get(missionName);

    if (missionNodes === undefined) {
      throw new MissingMission(missionName)
    }

    let count = 0;

    const findNth = (node: MissionCommand<CD>[], name: string): [string, number] | undefined => {
      for (let i = 0; i < node.length; i++) {
        const curNode = node[i];
        if ((curNode as RFCommand).type == "RF.Group") {
          const group = curNode as GroupCommand
          const subMission = this.collection.get(group.params.name);
          if (subMission !== undefined) {
            const result = findNth(subMission, group.params.name);
            if (result !== undefined) {
              return result;
            }
          }
        } else {
          if (count === n) {
            return [name, i]; // Found nth waypoint
          }
          count++;
        }
      }
      return undefined; // Nth waypoint not found in this collection
    }
    return findNth(missionNodes, missionName);
  }

  pop(missionName: string, id?: number): MissionCommand<CD> | undefined {
    const mission = this.collection.get(missionName)
    if (!mission) throw new MissingMission(missionName)
    if (id !== undefined) {
      const wp = mission[id]
      mission.splice(id, 1)
      return wp
    }
    return mission.pop()
  }

  jsonify() {
    return JSON.stringify(Array.from(this.collection), null, 2)
  }

  insert(id: number, missionName: string, command: MissionCommand<CD>) {

    const rec = (count: number, mission: string): number => {
      const curMission = this.collection.get(mission)
      if (!curMission) throw new MissingMission(mission)

      if (count === id) {
        curMission.splice(0, 0, command)
        return count
      }

      for (let i = 0; i < curMission.length; i++) {
        if (count === id) {
          curMission.splice(i, 0, command)
          return count
        }
        let cur = curMission[i]
        if ((cur as RFCommand).type === "RF.Group") {
          const group = cur as GroupCommand
          count = rec(count, group.params.name)
        } else {
          count++;
        }
      }
      return count
    }

    rec(0, missionName)
  }

  findAllSubMissions(missionName: string): Set<string> {
    let names = new Set<string>()
    const cur = this.collection.get(missionName)
    if (!cur) throw new MissingMission(missionName)
    cur.forEach((x) => {
      if ((x as RFCommand).type == "RF.Group") {
        const group = x as GroupCommand
        names.add(group.params.name)
        names = names.union(this.findAllSubMissions(group.params.name))
      }
    })
    return names
  }

  /**
   * Changes a single parameter in a mission at the specified index.
   * @param id - The index of the command from the mission to modify
   * @param missionName - The name of the mission containing the command
   * @param mod - A function that takes a Command and returns a modified Command
   * @param recurse - If true and the target is a Collection, recursively apply changes to all commands in the collection
   * @throws {MissingMission} If the specified mission does not exist
   */
  changeParam(id: number, missionName: string, mod: (cmd: MissionCommand<CD>) => MissionCommand<CD>, recurse?: boolean) {
    const curMission = this.collection.get(missionName)
    if (curMission == undefined) { throw new MissingMission(missionName) }

    let updatedWaypoint = curMission[id]

    if ((updatedWaypoint as RFCommand).type === "RF.Group" && recurse) {
      const group = updatedWaypoint as GroupCommand
      const col = this.collection.get(group.params.name)
      if (col != null) {
        for (let i = 0; i < col.length; i++) {
          this.changeAllParams(group.params.name, mod)
        }
      }
    } else {
      curMission[id] = mod(curMission[id])
    }
  }

  /**
   * Changes parameters for multiple commands in a mission.
   * @param ids - Array of indices of commands from the mission to modify
   * @param missionName - The name of the mission containing the commands
   * @param mod - A function that takes a Command and returns a modified Command
   * @param recurse - If true and any target is a Collection, recursively apply changes to all commands in those collections
   * @throws {MissingMission} If the specified mission does not exist
   */
  changeManyParams(ids: number[], missionName: string, mod: (cmd: MissionCommand<CD>) => MissionCommand<CD>, recurse?: boolean) {
    let names = new Set<string>()
    const cur = this.collection.get(missionName)
    if (!cur) throw new MissingMission(missionName)
    for (let x of ids) {
      if ((cur[x] as RFCommand).type == "RF.Group" && recurse) {
        const group = cur[x] as GroupCommand
        names = names.add(group.params.name)
        names = names.union(this.findAllSubMissions(group.params.name))
      } else {
        this.changeParam(x, missionName, mod)
      }
    }
    if (recurse) names.forEach(x => this.changeAllParams(x, mod, false))
  }

  /**
   * Changes parameters for all commands in a mission.
   * @param missionName - The name of the mission to modify
   * @param mod - A function that takes a Command and returns a modified Command
   * @param recurse - If true, recursively apply changes to all commands in sub-missions
   * @throws {MissingMission} If the specified mission does not exist
   */
  changeAllParams(missionName: string, mod: (cmd: MissionCommand<CD>) => MissionCommand<CD>, recurse?: boolean) {
    const cur = this.collection.get(missionName)
    if (!cur) throw new MissingMission(missionName)
    this.changeManyParams(cur.map((_, i) => i), missionName, mod, recurse)
  }
}

export class MissingMission extends Error {
  constructor(missionName: string) {
    super(`Mission cannot be found: ${missionName}`)
    this.name = this.constructor.name
  }
}


export class RecursiveMission extends Error {
  constructor() {
    super(`Mission is recursive`)
    this.name = this.constructor.name
  }
}


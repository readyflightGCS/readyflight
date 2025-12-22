import { LatLng } from "@libs/world/latlng";
import { Group, RFCommand } from "./RFCommands"
import type { BaseDialectCommand } from "./dialect";


export class Mission<DialectCommand extends BaseDialectCommand> {

  private collection: Map<string, (RFCommand | DialectCommand)[]>
  private referencePoint: LatLng

  destructure() {
    return this.collection;
  }

  constructor(referencePoint: LatLng = { lat: 0, lng: 0 }, collection?: Map<string, (RFCommand | DialectCommand)[]>) {
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

  get(mission: string): (RFCommand | DialectCommand)[] {
    const a = this.collection.get(mission)
    if (a === undefined) {
      throw new MissingMission(mission)
    }
    return a
  }

  set(mission: string, nodes: (RFCommand | DialectCommand)[]) {
    this.collection.set(mission, nodes)
  }

  getMissions() {
    return Array.from(this.collection.keys())
  }

  pushToMission(missionName: string, waypoint: RFCommand | DialectCommand) {
    const mission = this.collection.get(missionName)
    if (!mission) throw new MissingMission(missionName)
    // Prevent recursive group references; only RF Group can be recursive.
    if ((waypoint as RFCommand).type === "Group") {
      const group = waypoint as Group
      if (this.contains(group.name, missionName)) {
        throw new RecursiveMission()
      }
    }
    mission.push(waypoint)
  }

  clone() {
    return new Mission(this.referencePoint, this.collection)

  }

  flatten(mission: string) {
    let retList: Exclude<(RFCommand | DialectCommand), Group>[] = []
    const commands = this.collection.get(mission)
    if (commands === undefined) return []
    for (let i = 0; i < commands.length; i++) {
      retList = retList.concat(this.flattenNode(commands[i]))

    }
    return retList
  }

  flattenNode(node: RFCommand | DialectCommand) {
    let retList: Exclude<(RFCommand | DialectCommand), Group>[] = []
    if (node.type == "Group") {
      retList = retList.concat(this.flatten(node.name))
    } else {
      retList.push(node as Exclude<(RFCommand | DialectCommand), Group>)
    }
    return retList
  }

  addSubMission(name: string, nodes: (RFCommand | DialectCommand)[] = []) {
    this.collection.set(name, nodes)
  }

  removeSubMission(name: string) {
    this.collection.delete(name)

    // loop over all sub missions
    for (const missionKey of Array.from(this.collection.keys())) {
      const currentMissionNodes = this.collection.get(missionKey);
      if (currentMissionNodes) {
        const filteredNodes = currentMissionNodes.filter(node => {
          if (node.type === "Group") {
            return node.name !== name;
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
      if (cmd.type === "Group") {
        if (cmd.name === A) {
          return true
        }
        if (this.contains(cmd.name, A)) return true
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

    const findNth = (node: (RFCommand | DialectCommand)[], name: string): [string, number] | undefined => {
      for (let i = 0; i < node.length; i++) {
        const curNode = node[i];
        if (curNode.type == "Group") {
          const subMission = this.collection.get(curNode.name);
          if (subMission !== undefined) {
            const result = findNth(subMission, curNode.name);
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

  pop(missionName: string, id?: number): (RFCommand | DialectCommand) | undefined {
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

  insert(id: number, missionName: string, command: (RFCommand | DialectCommand)) {

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
        if (cur.type === "Group") {
          count = rec(count, cur.name)
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
      if (x.type == "Group") {
        names.add(x.name)
        names = names.union(this.findAllSubMissions(x.name))
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
  changeParam(id: number, missionName: string, mod: (cmd: (RFCommand | DialectCommand)) => (RFCommand | DialectCommand), recurse?: boolean) {
    const curMission = this.collection.get(missionName)
    if (curMission == undefined) { throw new MissingMission(missionName) }

    let updatedWaypoint = curMission[id]

    if (updatedWaypoint.type === "Group" && recurse) {
      const col = this.collection.get(updatedWaypoint.name)
      if (col != null) {
        for (let i = 0; i < col.length; i++) {
          this.changeAllParams(updatedWaypoint.name, mod)
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
  changeManyParams(ids: number[], missionName: string, mod: (cmd: (RFCommand | DialectCommand)) => (RFCommand | DialectCommand), recurse?: boolean) {
    let names = new Set<string>()
    const cur = this.collection.get(missionName)
    if (!cur) throw new MissingMission(missionName)
    for (let x of ids) {
      if (cur[x].type == "Group" && recurse) {
        names = names.add(cur[x].name)
        names = names.union(this.findAllSubMissions(cur[x].name))
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
  changeAllParams(missionName: string, mod: (cmd: (RFCommand | DialectCommand)) => (RFCommand | DialectCommand), recurse?: boolean) {
    const cur = this.collection.get(missionName)
    if (!cur) throw new MissingMission(missionName)
    this.changeManyParams(cur.map((_, i) => i), missionName, mod, recurse)
  }

  /**
   * Converts a mission into a mainline representation, which groups commands by their destination points.
   * Commands that are not destinations (like actions) are grouped with their preceding destination command.
   * @param mission - Optional mission name to convert. Defaults to "Main" mission.
   * @returns An array of MainLineItem objects, where each item contains:
   *          - cmd: The destination command (with lat/lng/alt)
   *          - id: The original index of the command in the flattened mission
   *          - other: Array of non-destination commands that should be executed at this location
   */
  mainLine(mission?: string) {
    const commands = this.flatten(mission ?? "Main")
    return convertToMainLine(commands)
  }
}

export type MainLine = MainLineItem[]
export type MainLineItem = { cmd: LatLngAltCommand, id: number, other: Command[] }

/**
 * Converts an array of commands into a mainline representation.
 * This groups non-destination commands (like actions) with their preceding destination command.
 * @param commands - Array of commands to convert
 * @returns An array of MainLineItem objects representing the mainline structure
 */
export function convertToMainLine(commands: Command[]) {
  const mainLine: MainLine = []

  commands.forEach((cmd, id) => {
    const desc = getCommandDesc(cmd.type)
    if (desc.isDestination && "latitude" in cmd.params && "longitude" in cmd.params && "altitude" in cmd.params) {
      mainLine.push({ cmd: cmd as LatLngAltCommand, id, other: [] })
    } else {
      if (mainLine.length !== 0) {
        mainLine[mainLine.length - 1].other.push(cmd)
      }
    }
  })
  return mainLine
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


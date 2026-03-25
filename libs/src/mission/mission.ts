/**
 * Represents a mission containing commands organized into sub-missions.
 * Supports hierarchical command structures with group references, flattening,
 * and various query and modification operations.
 * 
 * @template CD - The command description type that extends CommandDescription
 * 
 * @example
 * ```typescript
 * const mission = new Mission({ lat: 0, lng: 0 });
 * mission.addSubMission("Survey", []);
 * mission.pushToMission("Main", waypoint);
 * const flattened = mission.flatten("Main");
 * ```
 */
import { CommandDescription, MissionCommand, RFCommand } from "@libs/commands/command";
import { LatLng } from "@libs/world/latlng";
import { Dialect } from "./dialect";
import { getCommandLocation } from "@libs/commands/helpers";


/**
 * Represents a command of type "RF.Group" extracted from the RFCommand union.
 * 
 * This type is useful for narrowing down RFCommand instances to those specifically
 * related to group operations, enabling type-safe handling of group commands.
 */
type GroupCommand = Extract<RFCommand, { type: "RF.Group" }>

/**
 * Represents a mission
 * @extends CommandDescription
 */
export class Mission<CD extends CommandDescription> {

  /**
   * Stores a collection of mission commands grouped by their string identifiers.
   * 
   * @remarks
   * Each key in the map represents a unique mission identifier, and the value is an array of `MissionCommand<CD>` objects associated with that mission.
   * 
   * @typeParam CD - The type of command data associated with each mission command.
   */
  private collection: Map<string, MissionCommand<CD>[]>

  /**
   * The geographic reference point for the mission.
   * Used as the origin for relative positioning and calculations.
   * 
   * @remarks
   * This point is typically set during mission initialization and remains constant throughout the mission.
   *
   * @see LatLng
   */
  private referencePoint: LatLng

  /**
   * Returns the collection associated with the current instance.
   *
   * @returns The collection property of the instance.
   */
  destructure() {
    return this.collection;
  }

  /**
   * Initializes a new instance of the mission class.
   * 
   * @param referencePoint - The reference point for the mission, specified as a `LatLng` object. Defaults to `{ lat: 0, lng: 0 }`.
   * @param collection - An optional map containing mission command collections. If provided, the constructor creates a deep copy of the collection.
   * 
   * If `collection` is not provided, the constructor initializes the collection with default keys: "Main", "Geofence", and "Markers", each mapped to an empty array.
   */
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

  /**
   * Returns the reference point for the mission.
   *
   * @returns {LatLng} The reference point as a LatLng object.
   */
  getReferencePoint(): LatLng {
    return this.referencePoint
  }

  /**
   * Retrieves the list of mission commands associated with the specified mission name.
   *
   * @param mission - The name of the mission to retrieve commands for.
   * @returns An array of `MissionCommand<CD>` objects corresponding to the mission.
   * @throws {MissingMission} If the mission does not exist in the collection.
   */
  get(mission: string): MissionCommand<CD>[] {
    const a = this.collection.get(mission)
    if (a === undefined) {
      throw new MissingMission(mission)
    }
    return a
  }

  /**
   * Sets the mission commands for a given mission identifier.
   *
   * @param mission - The unique identifier for the mission.
   * @param nodes - An array of mission commands to associate with the mission.
   */
  set(mission: string, nodes: MissionCommand<CD>[]) {
    this.collection.set(mission, nodes)
  }

  /**
   * Retrieves a list of mission identifiers from the collection.
   *
   * @returns {string[]} An array containing the keys of all missions in the collection.
   */
  getMissions() {
    return Array.from(this.collection.keys())
  }

  /**
   * Adds a waypoint to the specified mission.
   *
   * @param missionName - The name of the mission to which the waypoint will be added.
   * @param waypoint - The mission command to add as a waypoint.
   * @throws {MissingMission} If the specified mission does not exist.
   * @throws {RecursiveMission} If adding the waypoint would create a recursive group reference (except for RF Group).
   */
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

  /**
   * Creates a shallow copy of the Mission instance.
   * @returns A new Mission instance with the same reference point and collection.
   */
  clone() {
    return new Mission(this.referencePoint, this.collection)
  }

  /**
   * Flattens a mission by recursively expanding all group commands into individual commands.
   * @param mission - The name of the mission to flatten
   * @returns An array of flattened mission commands, excluding any group commands
   */
  flatten(mission: string) {
    let retList: Exclude<MissionCommand<CD>, GroupCommand>[] = []
    const commands = this.collection.get(mission)
    if (commands === undefined) return []
    for (let i = 0; i < commands.length; i++) {
      retList = retList.concat(this.flattenNode(commands[i]))

    }
    return retList
  }

  /**
   * Flattens a single mission command node, expanding group commands into their constituent commands.
   * @typeParam CD - The command data type parameter.
   * @param node - The mission command node to flatten.
   * @returns An array of flattened mission commands, excluding any group commands.
   */
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

  /**
   * Adds a sub-mission to the collection with the specified name and nodes.
   * @param name - The name of the sub-mission.
   * @param nodes - An optional array of mission commands. Defaults to an empty array.
   */
  addSubMission(name: string, nodes: MissionCommand<CD>[] = []) {
    this.collection.set(name, nodes)
  }

  /**
   * Removes a sub-mission by name and filters out any references to it from all mission groups.
   * @param name - The name of the sub-mission to remove
   */
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

  /**
   * Checks if a mission contains a specific group by name, recursively searching through nested groups.
   * @param missionName - The name of the mission to search within
   * @param A - The name of the group to search for
   * @returns `true` if the group is found in the mission or any of its nested groups, `false` otherwise
   * @throws {MissingMission} Thrown when the specified mission is not found in the collection
   */
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

  /**
   * Determines whether a mission contains itself, either directly or indirectly.
   * @param missionName - The name of the mission to check for recursion. Defaults to "Main".
   * @returns `true` if the mission contains itself (is recursive), `false` otherwise.
   */
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

  /**
   * Removes and returns a command from a mission.
   * @param missionName - The name of the mission to remove the command from.
   * @param id - Optional index of the specific command to remove. If not provided, removes the last command.
   * @returns The removed command, or undefined if the mission is empty.
   * @throws {MissingMission} If the mission with the given name does not exist.
   */
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

  /**
   * Converts the mission collection to a JSON string representation.
   * @returns {string} A formatted JSON string representation of the mission collection with 2-space indentation.
   */
  jsonify() {
    return JSON.stringify(Array.from(this.collection), null, 2)
  }

  /**
   * Inserts a mission command at a specified position within a mission hierarchy.
   * 
   * @template CD - The type of command data associated with the mission command.
   * @param id - The zero-based index position where the command should be inserted.
   * @param missionName - The name of the mission where the command will be inserted.
   * @param command - The mission command object to be inserted.
   * @throws {MissingMission} Thrown when the specified mission name does not exist in the collection.
   * 
   * @remarks
   * This method performs a depth-first traversal of the mission hierarchy, recursively
   * searching through nested groups to find the correct insertion point. Non-group commands
   * increment the position counter, while group commands are traversed recursively.
   */
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

  /**
   * Finds all submissions (nested groups) for a given mission.
   * @param missionName - The name of the mission to search for submissions
   * @returns A set containing the names of all submissions found recursively
   * @throws {MissingMission} If the mission with the specified name does not exist
   */
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
  /**
    * Converts a mission into a mainline representation, which groups commands by their destination points.
    * Commands that are not destinations (like actions) are grouped with their preceding destination command.
    * @param mission - Optional mission name to convert. Defaults to "Main" mission.
    * @returns An array of MainLineItem objects, where each item contains:
    *          - cmd: The destination command (with lat/lng/alt)
    *          - id: The original index of the command in the flattened mission
    *          - other: Array of non-destination commands that should be executed at this location
    */
  mainLine(dialect: Dialect<CD>, mission?: string) {
    const commands = this.flatten(mission ?? "Main")
    return convertToMainLine(commands, dialect)
  }
}

/**
 * Represents a main line as an array of main line items.
 * @typedef {MainLineItem[]} MainLine
 */
export type MainLine = MainLineItem[]

/**
 * Represents a main line item in a mission.
 * @typedef {Object} MainLineItem
 * @property {MissionCommand<CommandDescription>} cmd - The primary mission command for this line item.
 * @property {number} id - The unique identifier for this mission line item.
 * @property {MissionCommand<CommandDescription>[]} other - An array of additional or alternative mission commands associated with this line item.
 */
export type MainLineItem = { cmd: MissionCommand<CommandDescription>, id: number, other: MissionCommand<CommandDescription>[] }

/**
 * Converts an array of commands into a mainline representation.
 * This groups non-destination commands (like actions) with their preceding destination command.
 * @param commands - Array of commands to convert
 * @returns An array of MainLineItem objects representing the mainline structure
 */
export function convertToMainLine(commands: Exclude<MissionCommand<CommandDescription>, GroupCommand>[], dialect: Dialect<CommandDescription>) {
  const mainLine: MainLine = []

  commands.forEach((cmd, id) => {
    let loc = getCommandLocation(cmd, dialect)
    if (loc !== null) {
      mainLine.push({ cmd: cmd, id, other: [] })
    } else {
      if (mainLine.length !== 0) {
        mainLine[mainLine.length - 1].other.push(cmd)
      }
    }
  })
  return mainLine
}

/**
 * Error thrown when a mission cannot be found.
 * @extends Error
 */
export class MissingMission extends Error {
  constructor(missionName: string) {
    super(`Mission cannot be found: ${missionName}`)
    this.name = this.constructor.name
  }
}


/**
 * Error thrown when a mission is detected to be recursive.
 * @extends Error
 */
export class RecursiveMission extends Error {
  constructor() {
    super(`Mission is recursive`)
    this.name = this.constructor.name
  }
}
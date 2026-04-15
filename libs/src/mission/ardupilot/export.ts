
import { DialectCommand, DialectCommandParams, RFCommand } from "@libs/commands/command";
import { Mission } from "../mission";
import { mavCmdDescription } from "./commands";
import { dubinsBetweenDubins, localiseDubinsPath } from "@libs/dubins/dubinWaypoints";
import { g2l } from "@libs/world/conversion";
import { dubinsPoint } from "@libs/dubins/types";
import { haversineDistance, worldOffset } from "@libs/world/distance";
import { LatLng } from "@libs/world/latlng";
import { Result } from "@libs/util/try-catch";
import { makeCommand } from "@libs/commands/helpers";
import { ardupilot } from "./ardupilot";

export function convertArdupilot(mission: Mission<typeof mavCmdDescription[number]>): DialectCommand<typeof mavCmdDescription[number]>[] {
    const flattened = mission.flatten("Main");
    const reference = mission.getReferencePoint();
    const result: DialectCommand<typeof mavCmdDescription[number]>[] = [];

    for (const cmd of flattened) {

        if (cmd.type.startsWith("D.")) {
            // Already a Mavlink command
            result.push(cmd as DialectCommand<typeof mavCmdDescription[number]>);
        } else {
            result.push(...RF2MAV(cmd as RFCommand, reference))
        }

    }
    return result;
}

// Helper to create basic Mavlink command
function createMavCmd<CMD extends typeof mavCmdDescription[number]>(type: CMD["type"], params: DialectCommandParams<CMD>): DialectCommand<CMD> {
    // Find the command definition to ensure we are creating a valid command
    // This is a bit dynamic/loose, ideally would use type guards or specific creators
    // But for now we trust the type string matches one of mavCmdDescription
    //@ts-ignore
    return {
        type: type,
        frame: 3, // Global Relative Alt usually
        params: params
    };
};


export type MavCommand = {
    frame: number
    type: (typeof mavCmdDescription)[number]["value"]

    param1: number
    param2: number
    param3: number
    param4: number
    param5: number
    param6: number
    param7: number

    autocontinue: number
}


export function MAV2MAVparam(command: DialectCommand<typeof mavCmdDescription[number]>): MavCommand {
    const cmdDesc = mavCmdDescription.find((x) => x.type == command.type)
    return {
        type: cmdDesc.value,
        frame: command.frame,
        autocontinue: 1,
        param1: cmdDesc?.parameters[0] ? command.params[cmdDesc.parameters[0].label.toLowerCase() as keyof typeof command.params] : 0,
        param2: cmdDesc?.parameters[1] ? command.params[cmdDesc.parameters[1].label.toLowerCase() as keyof typeof command.params] : 0,
        param3: cmdDesc?.parameters[2] ? command.params[cmdDesc.parameters[2].label.toLowerCase() as keyof typeof command.params] : 0,
        param4: cmdDesc?.parameters[3] ? command.params[cmdDesc.parameters[3].label.toLowerCase() as keyof typeof command.params] : 0,
        param5: cmdDesc?.parameters[4] ? command.params[cmdDesc.parameters[4].label.toLowerCase() as keyof typeof command.params] : 0,
        param6: cmdDesc?.parameters[5] ? command.params[cmdDesc.parameters[5].label.toLowerCase() as keyof typeof command.params] : 0,
        param7: cmdDesc?.parameters[6] ? command.params[cmdDesc.parameters[6].label.toLowerCase() as keyof typeof command.params] : 0,
    }
}

function RF2MAV(cmd: RFCommand, reference: LatLng): DialectCommand<typeof mavCmdDescription[number]>[] {
    const rfCmd = cmd as RFCommand;

    switch (rfCmd.type) {
        case "RF.Waypoint": {
            return [createMavCmd("D.MAV_CMD_NAV_WAYPOINT", {
                hold: 0,
                "accept radius": 0,
                "pass radius": 0,
                yaw: NaN,
                latitude: rfCmd.params.latitude,
                longitude: rfCmd.params.longitude,
                altitude: rfCmd.params.altitude
            })]
        }
        case "RF.Takeoff": {
            return [createMavCmd("D.MAV_CMD_NAV_TAKEOFF", {
                pitch: rfCmd.params.pitch ?? 0,
                yaw: rfCmd.params.yaw ?? NaN,
                latitude: rfCmd.params.latitude,
                longitude: rfCmd.params.longitude,
                altitude: rfCmd.params.altitude
            })]
        }
        case "RF.Land": {
            return [createMavCmd("D.MAV_CMD_NAV_LAND", {
                "abort alt": rfCmd.params["abort alt"],
                "land mode": rfCmd.params["land mode"],
                "yaw angle": rfCmd.params["yaw angle"],
                latitude: rfCmd.params.latitude,
                longitude: rfCmd.params.longitude,
                altitude: rfCmd.params.altitude
            })]
        }
        case "RF.Group": {
            // Groups should be flattened by mission.flatten, so this shouldn't happen usually
            // But if it does, it's a no-op or error. Safe to ignore/warn.
            console.warn("Encountered unflattened Group command in Ardupilot export");
            break;
        }
        case "RF.SetServo": {
            return [createMavCmd("D.MAV_CMD_DO_SET_SERVO", {
                "servo instance": rfCmd.params.instance,
                pwm: rfCmd.params.pwm
            })]
        }
        case "RF.DubinsPath": {
            return dubinsPath2MAV(rfCmd, reference)
        }
    }
}

function dubinsPath2MAV(rfCmd: Extract<RFCommand, { type: "RF.DubinsPath" }>, reference: LatLng): DialectCommand<typeof mavCmdDescription[number]>[] {
    let result = []
    const points = rfCmd.params.points;
    if (!points || points.length === 0) return []

    // Handle single point as a simple waypoint
    if (points.length === 1) {
        const p = points[0];
        return [createMavCmd("D.MAV_CMD_NAV_WAYPOINT", {
            hold: 0, "accept radius": 0, "pass radius": 0, yaw: NaN,
            latitude: p.lat,
            longitude: p.lng,
            altitude: p.alt
        })]
    }

    // Convert to Dubins points using parameters from the points
    // We assume the points structure in RF.DubinsPath has been updated to include these fields

    const dPoints: dubinsPoint[] = points.map((p: any) => ({
        pos: g2l(reference, { lat: p.lat, lng: p.lng }),
        radius: p.radius ?? 50,
        heading: p.heading ?? 0,
        tunable: p.tunable ?? true,
        passbyRadius: p.passbyRadius ?? 0,
        bounds: {}
    }));


    // we are deriving directly from a dubins path, there will only
    // be one path
    const path = dubinsBetweenDubins(dPoints)
    const dubinsPaths = path.map((x) => localiseDubinsPath(x, reference))


    for (let j = 0; j < dubinsPaths.length; j++) {
        const section = dubinsPaths[j]

        // Calculate segment lengths
        const turnALen = Math.abs(section.turnA.theta * section.turnA.radius)
        const straightLen = haversineDistance(section.straight.start, section.straight.end)
        const turnBLen = Math.abs(section.turnB.theta * section.turnB.radius)
        const totalDistance = turnALen + straightLen + turnBLen

        // Get altitude values for interpolation
        const startAlt = points[j].alt
        const endAlt = points[j].alt

        if (j === 0) {
            result.push(createMavCmd("D.MAV_CMD_NAV_WAYPOINT", {
                latitude: points[0].lat,
                longitude: points[0].lng,
                altitude: points[0].alt
            }))
        }


        // ###### Turn A ######
        const absThetaA = Math.abs(section.turnA.theta / (Math.PI * 2))
        const dirA = absThetaA !== 0 ? (absThetaA / (section.turnA.theta / (Math.PI * 2))) : 1

        // Add turn command if significant
        if (Math.abs(section.turnA.radius) > 0 && absThetaA > 0.03) {
            const turnAAlt = calculateInterpolatedAltitude(startAlt, endAlt, turnALen, totalDistance)

            result.push(createMavCmd("D.MAV_CMD_NAV_LOITER_TURNS", {
                turns: Number(absThetaA.toFixed(4)),
                "": 1, // Magic exit tangent
                altitude: turnAAlt,
                radius: Number((section.turnA.radius * dirA).toFixed(4)),
                latitude: section.turnA.center.lat,
                longitude: section.turnA.center.lng
            }))
        }


        // ###### Straight Section ######

        const straightAlt = calculateInterpolatedAltitude(startAlt, endAlt, turnALen + straightLen, totalDistance)

        result.push(createMavCmd("D.MAV_CMD_NAV_WAYPOINT", {
            yaw: 0,
            "accept radius": 0,
            latitude: section.straight.end.lat,
            longitude: section.straight.end.lng,
            hold: 0,
            altitude: straightAlt,
            "pass radius": 0
        }))

        // ###### Turn B ######
        const absThetaB = Math.abs(section.turnB.theta / (Math.PI * 2))
        const dirB = absThetaB !== 0 ? (absThetaB / (section.turnB.theta / (Math.PI * 2))) : 1

        // Add turn command if significant
        if (Math.abs(section.turnB.radius) > 0 && absThetaB > 0.03) {
            result.push(createMavCmd("D.MAV_CMD_NAV_LOITER_TURNS", {
                turns: Number(absThetaB.toFixed(4)),
                "": 1, // Magic exit tangent
                altitude: endAlt,
                radius: Number((section.turnB.radius * dirB).toFixed(4)),
                latitude: section.turnB.center.lat,
                longitude: section.turnB.center.lng
            }))
        }

        // add the last waypoint of the curve, can be ommited if next in same direction
        const next = dubinsPaths[j + 1]
        if ((next === undefined) || (next !== undefined && next.turnA.theta * section.turnB.theta < 0)) {
            const pos = worldOffset(section.turnB.center, section.turnB.radius, section.turnB.start + section.turnB.theta)
            result.push(createMavCmd("D.MAV_CMD_NAV_WAYPOINT", {
                yaw: 0,
                "accept radius": 0,
                latitude: pos.lat,
                longitude: pos.lng,
                hold: 0,
                altitude: endAlt,
                "pass radius": 0
            }))
        }
    }
    return result
}

/**
* Calculates interpolated altitude along a Dubins path segment
* @param startAlt Starting altitude
* @param endAlt Ending altitude
* @param segmentDistance Distance of current segment
* @param totalDistance Total distance of the path
* @returns Interpolated altitude for the segment
*/
function calculateInterpolatedAltitude(
    startAlt: number,
    endAlt: number,
    segmentDistance: number,
    totalDistance: number
): number {
    if (totalDistance === 0) return startAlt;
    return startAlt + (segmentDistance / totalDistance) * (endAlt - startAlt);
}


export function exportQGCWaypoints(mission: Mission<typeof mavCmdDescription[number]>): Result<Blob> {
    let returnString = "QGC WPL 110\n"

    const reference = mission.getReferencePoint()
    const mavCommands = convertArdupilot(mission)

    // QGC format expects the first point to be the reference point as a waypoint command
    // @ts-ignore REMOVE ONCE MAKECOMMAND DOES BETTER TYPE LIMITING
    returnString += waypointString(0, MAV2MAVparam(makeCommand("D.MAV_CMD_NAV_WAYPOINT", { latitude: reference.lat, longitude: reference.lng }, ardupilot)))

    mavCommands.forEach((x, i) => {
        returnString += waypointString(i + 1, MAV2MAVparam(x))
    })

    return { data: new Blob([returnString]), error: null }
}

function waypointString(i: number, wp: MavCommand): string {
    return `${i}\t${i == 0 ? "1" : "0"}\t${wp.frame}\t${wp.type}\t${wp.param1}\t${wp.param2}\t${wp.param3}\t${wp.param4}\t${wp.param5}\t${wp.param6}\t${wp.param7}\t${wp.autocontinue}\n`
}

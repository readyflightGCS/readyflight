# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is ReadyFlight

ReadyFlight is an Electron-based Ground Control Station (GCS) for UAVs. It is designed as a **dialect-agnostic framework**: all vehicle-specific protocol logic is encapsulated behind the `Dialect` interface, and the rest of the application is unaware of any particular autopilot or wire format. The goal is for ReadyFlight to be a general-purpose GCS platform that can support any UAV protocol by implementing a new dialect.

It provides: live telemetry, mission planning, flight log investigation, and vehicle configuration — all driven by the active dialect.

## Commands

```bash
bun i                   # install all workspace dependencies
bun run dev             # run the full Electron app (hot-reload)
bun run dev:web         # run only the React frontend (Vite)
bun run dev:backend     # run only the client-backend (WebSocket relay)
bun run lint            # lint all packages
bun run build:mac       # production macOS build
```

**Running tests** (bun test, run from repo root or libs/):
```bash
bun test                                    # all lib tests
bun test src/dubins/tests/dubins.test.ts    # single test file
```

**Vehicle simulator** (requires Docker):
```bash
bun run build:sim          # build the ArduPilot Docker image (one-time)
bun run start:sim:plane    # simulate ArduPlane on udp:14550
bun run start:sim:copter   # simulate ArduCopter on udp:14550
```

Enable react-scan profiling: `REACT_SCAN=true bun run dev`

## Design philosophy

**Everything protocol-specific belongs in a Dialect.** The UI, stores, mission model, and connection layer are all dialect-agnostic. When adding a feature that touches vehicle behaviour, ask: does this belong in the `Dialect` interface (protocol concern) or in the shared app layer (UI/UX concern)?

- Do not reference `ardupilot`, MAVLink message types, or any dialect-specific types outside of `libs/src/dialects/`.
- New UI features should consume `useDialect` and the `Dialect` interface, not a concrete dialect implementation.
- `RFCommand` types (Waypoint, Takeoff, Land, Group, DubinsPath, …) are the dialect-agnostic mission primitives — prefer them over `DialectCommand` wherever possible.

## Architecture

### Workspaces

| Package | Purpose |
|---|---|
| `electron/` | Main + preload processes; bundles frontend and hosts `ConnectionManager` via `ElectronIPCHostAdapter` |
| `client-frontend/` | React 19 + Vite SPA (the renderer); Tailwind CSS v4, Leaflet map, Zustand stores |
| `client-backend/` | Standalone Node process for the **web** build; hosts `ConnectionManager` via `WebSocketHostAdapter` (port 9999) |
| `libs/` | All shared, UI-free logic: dialects, mission model, dubins paths, stores, world math |

### Path aliases (available everywhere via vite/tsconfig)

- `@libs/*` → `libs/src/*`
- `@/*` → `client-frontend/src/*`
- `@/electron` → `electron/main/`

### Data flow

```
Vehicle (Serial/UDP)
  └─► ConnectionManager (libs)
        └─► IHostAdapter
              ├── ElectronIPCHostAdapter  (Electron: ipcMain ↔ ipcRenderer)
              └── WebSocketHostAdapter   (Web: ws://localhost:9999)
                    └─► client-frontend ConnectionHandler
                          └─► dialect.createSession()  →  ITelemetrySession
                                └─► session.handleTelemetryMessage()
                                      └─► useVehicle Zustand store
```

`ConnectionHandler` (`client-frontend/src/components/telemetry/connectionHandler.tsx`) is a renderless React component that bridges the transport to the Zustand stores. It reads the active dialect from `useDialect`, calls `dialect.createSession()` on connect, and feeds raw bytes into the session's parser. Switching dialect tears down the old session and creates a new one.

### Dialect system

`Dialect<CD>` (`libs/src/dialects/dialect.ts`) is the core interface every protocol implementation must satisfy:

| Member | Purpose |
|---|---|
| `id` / `name` | Unique identifier and display name |
| `availableModes` | Flight modes shown in the Telemetry panel |
| `commandDescriptions` | Supported dialect-specific commands |
| `supportedRFCommands` | Which RF commands this dialect can handle |
| `createSession(sendPacket, onPatch)` | Factory: returns an `ITelemetrySession` for one connection |
| `convert(mission)` | Mission → dialect wire commands |
| `fileFormats` | Import/export handlers |
| `getCommandLocation` / `getCommandLabel` | Map and list rendering helpers |

`ITelemetrySession` is per-connection runtime state returned by `createSession`:
- `handleTelemetryMessage(data)` — parse raw bytes, return `Partial<VehicleState>` patch
- `handleSendTelemetryMessage(cmd)` — encode and send a vehicle command
- `uploadMission(mission)` — run the dialect's mission upload handshake
- `destroy()` — clean up on disconnect

**Registry:** `libs/src/dialects/dialectRegistry.ts` holds all implemented dialects. Add new dialects here.

**Current implementations:** `libs/src/dialects/ardupilot/` (ArduPilot plane + copter via MAVLink v2).

### Dialect selection

The active dialect is a global app setting stored in `useDialect` (`libs/src/stores/dialect.ts`), persisted to `localStorage`. It is selected in the Connections panel (Telemetry tab → sidebar), above the transport config, and is locked during an active connection. Switching dialect clears the current mission (with confirmation).

### Zustand stores (all in `libs/src/stores/`)

| Store | State |
|---|---|
| `useDialect` | Active dialect + id; persisted to localStorage; locked while connected |
| `useVehicle` | Live telemetry (lat/lon/alt, attitude, battery, GPS, …) + `sendMessage`/`sendPacket` handles |
| `useMission` | Mission object, dialect reference, selected sub-mission & commands |
| `useConnections` | Connection stats, available transports, `commandSender` callback |
| `useEditor` | UI state: active sidebar tab, tool selection, side panel open/closed |
| `useMap` / `useTelemetryView` / `useTheme` | Map tile config, telemetry view layout, theme |

### Mission model

`Mission<CD>` (`libs/src/mission/mission.ts`) is a cloneable, immutable-by-convention container of named sub-missions (`Main`, `Geofence`, `Markers`, plus user-created ones). Sub-missions can reference each other via `RF.Group` commands (flattened on export). The class is dialect-agnostic; the active `Dialect<CD>` provides MAVLink conversion, file import/export, and location extraction.

### Commands type system

- `DialectCommandDescription` (`type: "D.xxx"`) — dialect-specific commands (e.g. ArduPilot MAV_CMDs)
- `RFCommand` (`type: "RF.xxx"`) — dialect-agnostic commands (Waypoint, Takeoff, Land, Group, DubinsPath, …)
- `MissionCommand<CD>` = `RFCommand | DialectCommand<CD>`
- Parameters are type-derived from the command description at compile time via `CommandParams<CD>`

### Dubins path

`libs/src/dubins/` implements Dubins shortest-path (CSC/CCC) in 2D local space, with `bakeDubins` lifting results to lat/lng. Used for mission segments that require smooth fixed-wing transitions.

### Frontend UI structure

- `App.tsx` — root layout: `SideBar` + `SidePanel` (overlaid left) + `BottomPanel` + `Map`
- `components/map/` — Leaflet map with layers for mission waypoints, Dubins arcs, geofence, vehicle marker
- `components/navigation/sidePanel/` — four tabs: Telemetry, Mission, Settings, Vehicle
- `components/ui/` — shadcn/radix-based primitives (button, card, dialog, select, …)

### Native modules

`serialport` is a native Node module. It is excluded from the Electron bundle (`rollupOptions.external`) and rebuilt for the target Electron version via `electron-rebuild`. This runs automatically on `bun i` via the `postinstall` script.

The browser build cannot use `serialport`; `libs/src/mavlink-browser-shim.ts` replaces `@ifrunistuttgart/node-mavlink` with a no-op shim in the renderer via the Vite alias.

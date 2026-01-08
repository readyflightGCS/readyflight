# readyflight

An Electron application with React and TypeScript test


## Project Setup

### prerequisites

[bun](https://bun.com/)

probably node 22 ??

### Install

```bash
$ bun i
```

### Development

Run in electron
```bash
$ bun run dev
```

run parts in isolation (one per terminal)
```bash
$ bun run dev:web
$ bun run dev:backend
```


### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Project Layout

### client-backend

Contains the client side code for handling telemetry IO and forwarding to the client frontend.

### client-frontend

React application for the GCS, responsible for displaying live telemetry, advanced mission planning, UAV configuration, flight log investigation, and more

### electron

the configuration for pulling together the client frontend and client-backend

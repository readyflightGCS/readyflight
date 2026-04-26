import { ElectronAPI } from '@electron-toolkit/preload'
import type { ConnectionStatus, ConnectionStats, ConnectionCommand, ConnectionMessage } from '@libs/connection/types'

type DataPayload = { connectionId: string; payload: number[] }
type StatusPayload = { connectionId: string; status: ConnectionStatus } & ConnectionStats
type Unsubscribe = () => void

type ExtractArgs<T> =
  keyof Omit<T, 'type'> extends never
  ? []
  : Omit<T, 'type'> extends { config: infer C }
  ? [C]
  : [Omit<T, 'type'>]

type CommandHandlers<T> = {
  [K in T as K extends { type: infer U }
  ? U extends string
  ? U
  : never
  : never]:
  (...args: ExtractArgs<K>) => void
}

type MessageHandlers<T> = {
  [K in T as K extends { type: infer U }
  ? U extends string
  ? `on${Capitalize<U>}`
  : never
  : never]:
  K extends { type: any }
  ? (
    handler: (
      data: Omit<K, 'type'> extends { payload: infer P }
        ? P
        : Omit<K, 'type'>
    ) => void
  ) => Unsubscribe
  : never
}


export type ConnectionAPI =
  CommandHandlers<ConnectionCommand> &
  MessageHandlers<ConnectionMessage>

declare global {
  interface Window {
    electron: ElectronAPI
    api: { connection: ConnectionAPI }
    env?: { isElectron?: boolean }
  }
}

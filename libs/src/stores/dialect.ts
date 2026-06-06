import { createWithEqualityFn as create } from 'zustand/traditional'
import { Dialect } from '@libs/dialects/dialect'
import { DialectCommandDescription } from '@libs/commands/command'
import { dialectRegistry, DEFAULT_DIALECT_ID } from '@libs/dialects/dialectRegistry'

type State = {
  activeDialect: Dialect<DialectCommandDescription>
  activeDialectId: string
}

type Actions = {
  /**
   * Switch to a different dialect by id.
   * Callers are responsible for showing a confirmation dialog, clearing the
   * mission, and dropping any active connection before calling this.
   */
  setDialect: (id: string) => void
}

const defaultDialect =
  dialectRegistry.find((d) => d.id === DEFAULT_DIALECT_ID) ?? dialectRegistry[0]

export const useDialect = create<State & Actions>((set) => ({
  activeDialect: defaultDialect,
  activeDialectId: defaultDialect.id,

  setDialect: (id) => {
    const dialect = dialectRegistry.find((d) => d.id === id)
    if (!dialect) {
      console.warn(`[useDialect] Unknown dialect id: "${id}"`)
      return
    }
    set({ activeDialect: dialect, activeDialectId: id })
  }
}))

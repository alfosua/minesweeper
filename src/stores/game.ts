import produce from 'immer'
import { createStore, StateCreator, StoreApi, useStore } from 'zustand'
import { createContext, ReactNode, useContext, useRef } from 'react'
import { DbMap } from '@/types/db'

export const GameStoreContext = createContext<StoreApi<GameStore> | null>(null)

const definition: StateCreator<GameStore> = (set, get) => ({
  map: {
    width: 0,
    height: 0,
    cells: [],
    mines: 0,
  },
  game: {
    state: 'start',
    cellsLeft: 0,
    flags: 0,
  },
  setup: (width, height) =>
    set(
      produce<GameStore>((state) => {
        state.map = createMap(width, height)
        state.game.cellsLeft = state.map.cells.length
        state.game.state = 'start'
        state.game.flags = 0
      }),
    ),
  discoverAndExpand: (x, y) =>
    set(
      produce<GameStore>((state) => {
        const queue = [state.map.cells[x + y * state.map.width]]
        while (queue.length > 0) {
          const cell = queue.shift()

          if (!cell || !cell.hidden) {
            continue
          }

          cell.hidden = false
          state.game.cellsLeft -= 1

          if (cell.mine) {
            state.game.state = 'lose'
            return
          }

          if (checkWin(state)) {
            return
          }

          const cellsToEnqueue = getNeighbours(state.map, cell.x, cell.y)
          const nearbyMines = cellsToEnqueue.filter((c) => c.mine).length
          if (nearbyMines > 0) {
            continue
          }
          queue.push(...cellsToEnqueue)
        }
      }),
    ),
  toggleFlag: (x, y) =>
    set(
      produce<GameStore>((state) => {
        const cell = state.map.cells[x + y * state.map.width]
        cell.flagged = !cell.flagged
        state.game.flags += cell.flagged ? 1 : -1

        if (checkWin(state)) {
          return
        }
      }),
    ),
  discoverAll: () =>
    set(
      produce<GameStore>((state) => {
        for (const cell of state.map.cells) {
          cell.hidden = false
        }
        state.game.cellsLeft = 0
      }),
    ),
  hideAll: () =>
    set(
      produce<GameStore>((state) => {
        for (const cell of state.map.cells) {
          cell.hidden = true
          state.game.cellsLeft += 1
        }
      }),
    ),
  mineMap: (mines: number, seedX: number, seedY: number) =>
    set(
      produce<GameStore>((state) => {
        const { cells, width, height } = state.map
        const seedIndex = seedX + seedY * width
        const seedNeighbourIndices = getNeighbourIndices(
          state.map,
          seedX,
          seedY,
        )

        const indicesToAvoid = [seedIndex, ...seedNeighbourIndices]

        for (let i = 0; i < mines; i++) {
          let cellMined = false
          while (!cellMined) {
            const cellIndex = Math.floor(Math.random() * width * height)

            if (indicesToAvoid.includes(cellIndex)) {
              continue
            }

            const cellToMine = cells[cellIndex]

            if (!cellToMine.mine) {
              cellToMine.mine = true
              cellMined = true
            }
          }
        }

        state.map.mines = mines
      }),
    ),
  changeGameState: (newGameState) =>
    set(
      produce<GameStore>((state) => {
        state.game.state = newGameState
      }),
    ),
  syncFromDb: (data) =>
    set(
      produce<GameStore>((state) => {
        for (const cell of state.map.cells.filter(
          (c) =>
            c.mine && data.mines.some((m) => m === getCellIndex(c, state.map)),
        )) {
          cell.mine = false
        }
        for (const mine of data.mines) {
          state.map.cells[mine].mine = true
        }
      }),
    ),
  getNearbyMines: (x: number, y: number) => {
    return getNearbyMines(get().map, x, y)
  },
  getCellIndex: (x: number, y: number) => getCellIndex({ x, y }, get().map),
})

export interface GameStore {
  map: GameMap
  game: {
    state: GameState
    flags: number
    cellsLeft: number
  }
  setup: (width: number, height: number) => void
  discoverAndExpand: (x: number, y: number) => void
  toggleFlag: (x: number, y: number) => void
  discoverAll: () => void
  hideAll: () => void
  changeGameState: (state: GameState) => void
  mineMap: (mines: number, seedX: number, seedY: number) => void
  syncFromDb: (data: DbMap) => void
  getNearbyMines: (x: number, y: number) => number
  getCellIndex: (x: number, y: number) => number
}

export type GameMap = {
  width: number
  height: number
  cells: CellData[]
  mines: number
}

type GameState = 'start' | 'sweeping' | 'win' | 'lose'

export type CellData = {
  hidden: boolean
  flagged: boolean
  mine: boolean
  x: number
  y: number
}

export function createGameStore() {
  return createStore<GameStore>(definition)
}

export function useGameStore<U>(
  selector: (state: GameStore) => U,
  equalityFn?: (a: U, b: U) => boolean,
) {
  const store = useContext(GameStoreContext)
  if (!store) {
    throw new Error('You can only use this inside a game store context')
  }
  return useStore(store, selector, equalityFn)
}

function createMap(width: number, height: number) {
  const cells = Array.from({ length: height }).flatMap((_, row) =>
    Array.from({ length: width }, (_, column) => createCell(column, row)),
  )
  const map: GameMap = { width, height, cells, mines: 0 }
  return map
}

function createCell(x: number, y: number): CellData {
  return {
    hidden: true,
    flagged: false,
    mine: false,
    x,
    y,
  }
}

function getCellIndex({ x, y }: { x: number; y: number }, { width }: GameMap) {
  return x + y * width
}

function getNeighbourIndices(
  { width, height }: GameMap,
  x: number,
  y: number,
): number[] {
  const neighbours = []

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) {
        continue
      }

      const neighbourX = x + i
      const neighbourY = y + j

      if (
        neighbourX < 0 ||
        neighbourX >= width ||
        neighbourY < 0 ||
        neighbourY >= height
      ) {
        continue
      }

      const neighbourIndex = neighbourX + neighbourY * width
      neighbours.push(neighbourIndex)
    }
  }

  return neighbours
}

function getNeighbours(map: GameMap, x: number, y: number): CellData[] {
  const { cells } = map
  return getNeighbourIndices(map, x, y).map((i) => cells[i])
}

function getNearbyMines(map: GameMap, x: number, y: number): number {
  return getNeighbours(map, x, y).filter((c) => c.mine).length
}

function checkWin(state: GameStore) {
  const flagCountIsSameAsMineCount =
    state.map.cells.filter((c) => c.flagged).length === state.map.mines

  const allCellsAreDiscoveredOrFlagged = state.map.cells.every(
    (c) => !c.hidden || c.flagged,
  )

  const allMinesAreFlagged = state.map.cells
    .filter((c) => c.mine)
    .every((c) => c.flagged)

  const win =
    flagCountIsSameAsMineCount &&
    allCellsAreDiscoveredOrFlagged &&
    allMinesAreFlagged

  if (win) {
    state.game.cellsLeft = 0
    state.game.state = 'win'
  }

  return win
}

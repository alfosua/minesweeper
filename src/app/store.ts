import produce from 'immer'
import { create } from 'zustand'

export const useStore = create<MinesweeperStore>((set) => ({
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
      produce<MinesweeperStore>((state) => {
        state.map = createMap(width, height)
        state.game.cellsLeft = state.map.cells.length
        state.game.state = 'start'
        state.game.flags = 0
      }),
    ),
  discoverAndExpand: (x, y) =>
    set(
      produce<MinesweeperStore>((state) => {
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

          const flagCountIsSameAsMineCount =
            state.map.cells.filter((c) => c.flagged).length === state.map.mines

          const allCellsAreDiscoveredOrFlagged = state.map.cells.every(
            (c) => !c.hidden || c.flagged,
          )

          const allMinesAreFlagged = state.map.cells
            .filter((c) => c.mine)
            .every((c) => c.flagged)

          if (
            flagCountIsSameAsMineCount &&
            allCellsAreDiscoveredOrFlagged &&
            allMinesAreFlagged
          ) {
            state.game.cellsLeft = 0
            state.game.state = 'win'
            return
          }

          if (cell.nearbyMines > 0) {
            continue
          }
          const cellsToEnqueue = cell.neighbours
            .map((n) => state.map.cells[n.index])
            .filter((c) => c.hidden)
          queue.push(...cellsToEnqueue)
        }
      }),
    ),
  toggleFlag: (x, y) =>
    set(
      produce<MinesweeperStore>((state) => {
        const cell = state.map.cells[x + y * state.map.width]
        cell.flagged = !cell.flagged
        state.game.flags += cell.flagged ? 1 : -1

        const flagCountIsSameAsMineCount =
          state.map.cells.filter((c) => c.flagged).length === state.map.mines

        const allCellsAreDiscoveredOrFlagged = state.map.cells.every(
          (c) => !c.hidden || c.flagged,
        )

        const allMinesAreFlagged = state.map.cells
          .filter((c) => c.mine)
          .every((c) => c.flagged)

        if (
          flagCountIsSameAsMineCount &&
          allCellsAreDiscoveredOrFlagged &&
          allMinesAreFlagged
        ) {
          state.game.cellsLeft = 0
          state.game.state = 'win'
          return
        }
      }),
    ),
  discoverAll: () =>
    set(
      produce<MinesweeperStore>((state) => {
        for (const cell of state.map.cells) {
          cell.hidden = false
        }
        state.game.cellsLeft = 0
      }),
    ),
  hideAll: () =>
    set(
      produce<MinesweeperStore>((state) => {
        for (const cell of state.map.cells) {
          cell.hidden = true
          state.game.cellsLeft += 1
        }
      }),
    ),
  mineMap: (mines: number, seedX: number, seedY: number) =>
    set(
      produce<MinesweeperStore>((state) => {
        const { cells, width, height } = state.map
        const seedIndex = seedX + seedY * width
        const seedNeighbourIndices = cells[seedIndex].neighbours.map(
          (n) => n.index,
        )
        const indicesToAvoid = [seedIndex, ...seedNeighbourIndices]

        for (let i = 0; i < mines; i++) {
          let cellMined = false
          while (!cellMined) {
            const cellIndex = Math.round(Math.random() * width * height)

            if (indicesToAvoid.some((i) => i === cellIndex)) {
              continue
            }

            const cellToMine = cells[cellIndex]

            if (!cellToMine.mine) {
              cellToMine.mine = true
              cellMined = true
            }
          }
        }

        for (const cell of cells) {
          cell.nearbyMines = cell.neighbours
            .map((n) => cells[n.index])
            .filter((c) => c.mine).length
        }

        state.map.mines = mines
      }),
    ),
  changeGameState: (newGameState) =>
    set(
      produce<MinesweeperStore>((state) => {
        state.game.state = newGameState
      }),
    ),
}))

type GameMap = {
  width: number
  height: number
  cells: CellData[]
  mines: number
}

type GameState = 'start' | 'sweeping' | 'win' | 'lose'

interface MinesweeperStore {
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
}

type CellData = {
  hidden: boolean
  flagged: boolean
  mine: boolean
  x: number
  y: number
  nearbyMines: number
  neighbours: NeighbourData[]
}

type NeighbourPosition = -1 | 0 | 1

type NeighbourData = {
  index: number
  x: NeighbourPosition
  y: NeighbourPosition
}

const addNeighbourToCell = (
  cell: CellData,
  condition: boolean,
  x: NeighbourPosition,
  y: NeighbourPosition,
  mapWidth: number,
) => {
  if (condition) {
    const index = cell.x + x + (cell.y + y) * mapWidth
    cell.neighbours.push({ index, x, y })
  }
}

const createCell = (
  x: number,
  y: number,
  mapWidth: number,
  mapHeight: number,
) => {
  const cell = {
    hidden: true,
    flagged: false,
    mine: false,
    nearbyMines: 0,
    neighbours: [],
    x,
    y,
  }
  addNeighbourToCell(cell, cell.x > 0, -1, 0, mapWidth)
  addNeighbourToCell(cell, cell.x < mapWidth - 1, 1, 0, mapWidth)
  addNeighbourToCell(cell, cell.y > 0, 0, -1, mapWidth)
  addNeighbourToCell(cell, cell.y < mapHeight - 1, 0, 1, mapWidth)
  addNeighbourToCell(cell, cell.x > 0 && cell.y > 0, -1, -1, mapWidth)
  addNeighbourToCell(
    cell,
    cell.x < mapWidth - 1 && cell.y < mapHeight - 1,
    1,
    1,
    mapWidth,
  )
  addNeighbourToCell(
    cell,
    cell.x > 0 && cell.y < mapHeight - 1,
    -1,
    1,
    mapWidth,
  )
  addNeighbourToCell(cell, cell.x < mapWidth - 1 && cell.y > 0, 1, -1, mapWidth)
  return cell
}

const createMap = (width: number, height: number) => {
  const cells = [...Array(height).keys()].flatMap((row) =>
    [...Array(width).keys()].map((column) =>
      createCell(column, row, width, height),
    ),
  )
  const map: GameMap = { width, height, cells, mines: 0 }
  return map
}

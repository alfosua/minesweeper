'use client'

import { create } from 'zustand'
import { produce } from 'immer'
import { ReactNode, useCallback, useState } from 'react'
import useRunOnce from '@/utilities/useRunOnce'

const Minesweeper = () => {
  const gameState = useStore((state) => state.game.state)
  const cellsLeft = useStore((state) => state.game.cellsLeft)
  const flags = useStore((state) => state.game.flags)
  const width = useStore((state) => state.map.width)
  const mines = useStore((state) => state.map.mines)
  const height = useStore((state) => state.map.height)
  const setup = useStore((state) => state.setup)
  const discoverAll = useStore((state) => state.discoverAll)
  const hideAll = useStore((state) => state.hideAll)
  const changeGameState = useStore((state) => state.changeGameState)

  const [targetWidth, setTargetWidth] = useState<number>(10)
  const [targetHeight, setTargetHeight] = useState<number>(10)
  const [targetMines, setTargetMines] = useState<number>(20)

  const setupWithParams = useCallback(() => {
    setup(targetWidth, targetHeight)
  }, [setup, targetWidth, targetHeight])

  const restart = useCallback(() => {
    setupWithParams()
  }, [setupWithParams])

  const surrender = useCallback(() => {
    discoverAll()
    changeGameState('lose')
  }, [discoverAll, changeGameState])

  useRunOnce({
    fn: () => {
      setupWithParams()
    },
  })

  return (
    <div className='flex gap-12 bg-violet-800 w-[100vw] h-[100vh] justify-center items-center'>
      <div className='font-mono border-3 border-purple-100'>
        {[...Array(height).keys()].map((row) => (
          <div key={row} data-row={row} className='flex flex-row'>
            {[...Array(width).keys()].map((column) => (
              <Cell key={column} x={column} y={row} targetMines={targetMines} />
            ))}
          </div>
        ))}
      </div>

      <div className='flex items-center'>
        <div className='flex flex-col gap-5 py-8 px-4 bg-amber-100 rounded-2xl min-w-[240px] min-h-[432px]'>
          <p className='p-3 bg-white rounded-xl border-amber-800 border-2 text-center'>
            {gameState === 'start' && <>Click any cell to start! 😊</>}
            {gameState === 'sweeping' && <>Go for them, tiger! 😍</>}
            {gameState === 'win' && <>You win! 🥳</>}
            {gameState === 'lose' && <>You lose... 😢</>}
          </p>
          <PanelField name='Mines' value={mines} />
          <PanelField name='Flags' value={flags} />
          <PanelField name='Cells left' value={cellsLeft} />
          {gameState !== 'start' && (
            <PanelButton onClick={restart}>Restart</PanelButton>
          )}
          {gameState === 'sweeping' && (
            <PanelButton onClick={surrender}>Surrender</PanelButton>
          )}
        </div>
      </div>
    </div>
  )
}

// const MasterModal = () => {
//   return (
//     <div className='flex flex-col'>
//       <p>Master Command Palette</p>
//       <div>
//         <input
//           value={targetWidth}
//           onChange={(e) => setTargetWidth(Number.parseInt(e.target.value))}
//           type='number'
//         />
//         <input
//           value={targetHeight}
//           onChange={(e) => setTargetHeight(Number.parseInt(e.target.value))}
//           type='number'
//         />
//       </div>
//       <div>
//         <input
//           value={targetMines}
//           onChange={(e) => setTargetMines(Number.parseInt(e.target.value))}
//           type='number'
//         />
//       </div>
//       <button onClick={discoverAll}>Discover All</button>
//       <button onClick={hideAll}>Hide All</button>
//     </div>
//   )
// }

type PanelFieldProps = {
  name: string
  value: any
}

const PanelField = ({ name, value }: PanelFieldProps) => (
  <div className='flex py-2 px-6 bg-amber-50 rounded-xl'>
    <div className='w-1/2 text-amber-900 font-extrabold text-right'>
      {name}:
    </div>
    <div className='w-1/2 text-amber-700 font-bold text-right'>{value}</div>
  </div>
)

type PanelButtonProps = {
  onClick: () => void
  children: ReactNode
}

const PanelButton = ({ children, onClick }: PanelButtonProps) => (
  <button
    className='p-3 bg-amber-50 border-amber-800 border-1 text-amber-900 font-bold rounded-xl'
    onClick={onClick}
  >
    {children}
  </button>
)

type CellProps = {
  x: number
  y: number
  targetMines: number
}

const Cell = (props: CellProps) => {
  const { x, y, targetMines } = props
  const width = useStore((state) => state.map.width)
  const mines = useStore((state) => state.map.mines)
  const cell = useStore(
    useCallback((state) => state.map.cells[x + y * width], [x, y, width]),
  )
  const discoverAndExpand = useStore((state) => state.discoverAndExpand)
  const toggleFlag = useStore((state) => state.toggleFlag)
  const changeGameState = useStore((state) => state.changeGameState)
  const mineMap = useStore((state) => state.mineMap)

  const discoverCell = useCallback(() => {
    if (mines === 0) {
      mineMap(targetMines, x, y)
      changeGameState('sweeping')
    }
    if (cell.hidden && !cell.flagged) {
      discoverAndExpand(x, y)
    }
  }, [
    mines,
    cell.hidden,
    cell.flagged,
    mineMap,
    x,
    y,
    changeGameState,
    discoverAndExpand,
    targetMines,
  ])

  const toggleCellFlag = useCallback(() => {
    if (cell.hidden) {
      toggleFlag(x, y)
    }
  }, [x, y, toggleFlag, cell.hidden])

  return (
    <div
      className='w-11 h-11 bg-white border-2 border-amber-200 flex items-center justify-center'
      onClick={discoverCell}
      onContextMenu={(e) => {
        e.preventDefault()
        toggleCellFlag()
      }}
    >
      {cell.hidden && cell.flagged && 'P'}
      {cell.hidden && !cell.flagged && '?'}
      {!cell.hidden && cell.mine && 'X'}
      {!cell.hidden && !cell.mine && cell.nearbyMines === 0 && '·'}
      {!cell.hidden &&
        !cell.mine &&
        cell.nearbyMines > 0 &&
        cell.nearbyMines.toString()}
    </div>
  )
}

const useStore = create<MinesweeperStore>((set) => ({
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

export default Minesweeper

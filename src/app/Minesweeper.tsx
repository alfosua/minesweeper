'use client'
import { CellData, useStore } from '@/app/store'
import { ReactNode, useCallback, useState } from 'react'

useStore.getState().setup(10, 10)

const Minesweeper = () => {
  const { cellsLeft, flags, state: gameState } = useStore((state) => state.game)
  const width = useStore((state) => state.map.width)
  const mines = useStore((state) => state.map.mines)
  const height = useStore((state) => state.map.height)
  const setup = useStore((state) => state.setup)
  const discoverAll = useStore((state) => state.discoverAll)
  // const hideAll = useStore((state) => state.hideAll)
  const changeGameState = useStore((state) => state.changeGameState)

  const [targetWidth, setTargetWidth] = useState<number>(10)
  const [targetHeight, setTargetHeight] = useState<number>(10)
  const [targetMines, setTargetMines] = useState<number>(20)

  const restart = () => {
    setup(targetWidth, targetHeight)
  }

  const surrender = useCallback(() => {
    discoverAll()
    changeGameState('lose')
  }, [discoverAll, changeGameState])

  return (
    <div className='flex gap-12 bg-violet-800 w-[100vw] h-[100vh] justify-center items-center'>
      <div
        className='font-mono border-3 border-purple-100 grid'
        style={{
          gridTemplate: `repeat(${width}, 1fr) / repeat(${height}, 1fr)`,
        }}
      >
        {Array.from({ length: height }, (_, row) =>
          Array.from({ length: width }, (_, column) => (
            <Cell
              key={`${row}-${column}`}
              x={column}
              y={row}
              targetMines={targetMines}
            />
          )),
        )}
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
  value: ReactNode
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
  const lose = useStore((state) => state.game.state === 'lose')
  const cell = useStore((state) => state.map.cells[x + y * width])
  const discoverAndExpand = useStore((state) => state.discoverAndExpand)
  const toggleFlag = useStore((state) => state.toggleFlag)
  const changeGameState = useStore((state) => state.changeGameState)
  const mineMap = useStore((state) => state.mineMap)

  const discoverCell = () => {
    if (mines === 0) {
      mineMap(targetMines, x, y)
      changeGameState('sweeping')
    }
    if (cell.hidden && !cell.flagged) {
      discoverAndExpand(x, y)
    }
  }

  const toggleCellFlag = () => {
    if (cell.hidden) {
      toggleFlag(x, y)
    }
  }

  const cellBgClass = getCellBgClass(cell)

  const cellTextClass = getCellTextColor(cell)

  return (
    <div
      className={`w-11 h-11 border-2 border-purple-500 flex items-center justify-center font-bold text-red ${cellBgClass} ${cellTextClass}`}
      onClick={discoverCell}
      onContextMenu={(e) => {
        e.preventDefault()
        toggleCellFlag()
      }}
    >
      {cell.mine && lose
        ? '💥'
        : cell.hidden
        ? cell.flagged
          ? '🚩'
          : '?'
        : cell.mine
        ? '💥'
        : cell.nearbyMines === 0
        ? '·'
        : cell.nearbyMines > 0
        ? cell.nearbyMines
        : null}
    </div>
  )
}

export default Minesweeper

function getCellBgClass(cell: CellData) {
  return cell.hidden
    ? cell.flagged
      ? 'bg-orange-100'
      : 'bg-purple-300'
    : cell.mine
    ? 'bg-red-300'
    : 'bg-white'
}

function getCellTextColor(cell: CellData) {
  if (cell.hidden || cell.mine) return 'text-black'

  return (
    {
      1: 'text-blue-600',
      2: 'text-green-600',
      3: 'text-yellow-600',
      4: 'text-purple-600',
      5: 'text-red-600',
      6: 'text-red-900',
      7: 'text-brown-900',
      8: 'text-black',
    }[cell.nearbyMines] || 'text-black'
  )
}

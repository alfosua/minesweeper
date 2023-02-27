'use client'
import { CellData, useGameStore } from '@/stores/game'
import { ReactNode, useCallback, useEffect } from 'react'
import { onSnapshot, doc } from 'firebase/firestore'
import { DbMap } from '@/types/db'
import { db } from '@/utils/firebase'
import GameProvider from '@/components/GameProvider'

type GameProps = {
  data: {
    id: string
    width: number
    height: number
    mineCount: number
  }
}

const WrappedGame = (props: GameProps) => (
  <GameProvider>
    <Game {...props} />
  </GameProvider>
)

const Game = (props: GameProps) => {
  const { data } = props
  const {
    cellsLeft,
    flags,
    state: gameState,
  } = useGameStore((state) => state.game)
  const width = useGameStore((state) => state.map.width)
  const mines = useGameStore((state) => state.map.mines)
  const height = useGameStore((state) => state.map.height)
  const setup = useGameStore((state) => state.setup)
  const discoverAll = useGameStore((state) => state.discoverAll)
  const syncFromDb = useGameStore((state) => state.syncFromDb)
  const changeGameState = useGameStore((state) => state.changeGameState)

  useEffect(() => {
    setup(data.width, data.height)
  }, [setup, data])

  const restart = () => {
    setup(data.width, data.height)
  }

  const surrender = useCallback(() => {
    discoverAll()
    changeGameState('lose')
  }, [discoverAll, changeGameState])

  useEffect(() => {
    const q = doc(db, 'maps', '3PzmhDw7yNWPeTQv72sV')
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.data() as DbMap
      console.log({ ...data, id: snapshot.id })
    })
    return () => unsubscribe()
  }, [syncFromDb])

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
              targetMines={data.mineCount}
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

export default WrappedGame

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
  const gameState = useGameStore((state) => state.game.state)
  const width = useGameStore((state) => state.map.width)
  const mines = useGameStore((state) => state.map.mines)
  const lose = useGameStore((state) => state.game.state === 'lose')
  const cell = useGameStore((state) => state.map.cells[x + y * width])
  const discoverAndExpand = useGameStore((state) => state.discoverAndExpand)
  const toggleFlag = useGameStore((state) => state.toggleFlag)
  const changeGameState = useGameStore((state) => state.changeGameState)
  const mineMap = useGameStore((state) => state.mineMap)
  const nearbyMines = useGameStore((state) => state.getNearbyMines(x, y))

  const discoverCell = () => {
    if (gameState === 'lose') {
      return
    }
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
  const cellTextClass = getCellTextColor(cell, nearbyMines)

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
        : nearbyMines === 0
        ? '·'
        : nearbyMines > 0
        ? nearbyMines
        : null}
    </div>
  )
}

function getCellBgClass(cell: CellData) {
  return cell.hidden
    ? cell.flagged
      ? 'bg-orange-100'
      : 'bg-purple-300'
    : cell.mine
    ? 'bg-red-300'
    : 'bg-white'
}

function getCellTextColor(cell: CellData, nearbyMines: number) {
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
    }[nearbyMines] || 'text-black'
  )
}

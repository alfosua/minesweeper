'use client'
import { ComponentType, ReactNode, useRef } from 'react'
import { StoreApi } from 'zustand'
import { createGameStore, GameStoreContext, GameStore } from '@/stores/game'

export type GameProviderProps = {
  children: ReactNode
}

export const GameProvider = ({ children }: GameProviderProps) => {
  const ref = useRef<StoreApi<GameStore> | null>(null)
  ref.current ??= createGameStore()
  return (
    <GameStoreContext.Provider value={ref.current}>
      {children}
    </GameStoreContext.Provider>
  )
}

export default GameProvider

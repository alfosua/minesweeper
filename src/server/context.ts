import { db } from '@/utils/firebase'

export function createContext() {
  return {
    firestore: db,
  }
}

export type Context = ReturnType<typeof createContext>

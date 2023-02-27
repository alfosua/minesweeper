import {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from 'firebase/firestore'

export type DbMap = {
  width: number
  height: number
  mines: number[]
  discoveries: number[]
  flags: number[]
}

export const mapConverter = {
  toFirestore(values: WithFieldValue<DbMap>): DocumentData {
    const { width, height, mines, flags, discoveries } = values
    return { mines, flags, discoveries }
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions,
  ): DbMap {
    const { width, height, mines, flags, discoveries } = snapshot.data(options)!
    return { width, height, mines, flags, discoveries }
  },
}

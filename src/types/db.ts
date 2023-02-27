import {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from 'firebase/firestore'
import { z } from 'zod'

export const dbMapSchema = z.object({
  width: z.number(),
  height: z.number(),
  mines: z.array(z.number()),
  discoveries: z.array(z.number()),
  flags: z.array(z.number()),
})

export type DbMap = z.infer<typeof dbMapSchema>

export const mapConverter = {
  toFirestore(values: WithFieldValue<DbMap>): DocumentData {
    const { width, height, mines, flags, discoveries } = values
    return { mines, flags, discoveries }
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions,
  ): DbMap {
    const data = snapshot.data(options)
    return dbMapSchema.parse(data)
  },
}

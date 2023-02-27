import { procedure, router } from '@/server/trpc'
import { DbMap, dbMapSchema, mapConverter } from '@/types/db'
import { TRPCError } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import { doc, getDoc, onSnapshot, type Firestore } from 'firebase/firestore'
import { z } from 'zod'

export const mapRouter = router({
  getById: procedure.input(z.string()).query(async ({ ctx, input: id }) => {
    const snapshot = await getDoc(
      doc(ctx.firestore, 'maps', id).withConverter(mapConverter),
    )
    const data = snapshot.data()

    if (!data) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Data not found' })
    }

    return { ...data, id: snapshot.id, mineCount: 20 }
  }),
  onMapChange: procedure
    .input(z.string())
    .subscription(async ({ ctx, input: id }) => {
      return observeMapChanges(ctx.firestore, id)
    }),
})

function observeMapChanges(firestore: Firestore, id: string) {
  return observable<DbMap & { id: string }>((emit) => {
    return onSnapshot(
      doc(firestore, 'maps', id),
      (snapshot) => {
        const data = dbMapSchema.parse(snapshot.data())
        emit.next({ ...data, id: snapshot.id })
      },
      (error) => emit.error(error),
    )
  })
}

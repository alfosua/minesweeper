import { mapRouter } from '@/server/routers/map'
import { z } from 'zod'
import { procedure, router } from '../trpc'

const gameStateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  mines: z.array(z.number()),
  open: z.array(z.number()),
  flags: z.array(z.number()),
})

export type GameState = z.infer<typeof gameStateSchema>

export const appRouter = router({
  hello: procedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query(({ input }) => {
      return {
        greeting: `hello ${input.text}`,
      }
    }),
  map: mapRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter

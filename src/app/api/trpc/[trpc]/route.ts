import { createContext } from '@/server/context'
import { appRouter } from '@/server/routers/_app'
import * as trpcNext from '@trpc/server/adapters/fetch'

// export API handler
// @see https://trpc.io/docs/api-handler
function handler(request: Request) {
  return trpcNext.fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext,
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const HEAD = handler
export const OPTIONS = handler

import { Context } from '@/server/context'
import { initTRPC } from '@trpc/server'

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create()

// Base router and procedure helpers
export const { router, procedure, middleware, mergeRouters } = t

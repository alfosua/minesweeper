import env from '@next/env'
import { applyWSSHandler } from '@trpc/server/adapters/ws'
import * as ws from 'ws'

env.loadEnvConfig(process.cwd(), true)

const { createContext } = await import('@/server/context')
const { appRouter } = await import('@/server/routers/_app')

const wss = new ws.WebSocketServer({ port: 3001 })

const handler = applyWSSHandler({ wss, router: appRouter, createContext })

wss.on('connection', (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`)
  ws.once('close', () => {
    console.log(`➖➖ Connection (${wss.clients.size})`)
  })
})

wss.on('listening', () => {
  console.log('✅ WebSocket Server listening on ws://localhost:3001')
})

process.on('SIGTERM', () => {
  console.log('SIGTERM')
  handler.broadcastReconnectNotification()
  wss.close()
})

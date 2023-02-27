import { DbMap } from '@/types/db'
import { trpc } from '@/utilities/trpc'
import { useCallback, useRef, useSyncExternalStore } from 'react'

export function useLiveMap({
  id,
  initialData,
  onData,
}: {
  id: string
  initialData: DbMap
  onData?: (data: DbMap) => void
}) {
  const snapshot = useRef<DbMap>(initialData)
  const onDataRef = useRef(onData)
  onDataRef.current = onData

  const subscribe = useCallback(
    (cb: () => void) =>
      trpc.map.onMapChange.subscribe(id, {
        onData(value) {
          snapshot.current = value
          cb()
          onDataRef.current?.(value)
        },
      }).unsubscribe,
    [id],
  )

  const getSnapshot = useCallback(() => snapshot.current, [])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

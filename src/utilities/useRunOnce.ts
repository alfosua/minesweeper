import { useEffect, useRef } from 'react'

export type UseRunOnceProps = {
  fn: (key?: string) => void
  key?: string
}

export const useRunOnce = ({ fn, key }: UseRunOnceProps) => {
  const triggered = useRef(false)

  useEffect(() => {
    const hasBeenTriggered = key
      ? sessionStorage.getItem(key)
      : triggered.current

    if (!hasBeenTriggered) {
      fn(key)
      triggered.current = true

      if (key) {
        sessionStorage.setItem(key, 'true')
      }
    }
  }, [fn, key])

  return null
}

export default useRunOnce

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { getToken } from '@/hooks/use-auth'

export type SseNotification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  createdAt: string
}

export type SseEvent = {
  type: 'notification'
  data: SseNotification
}

type EventContextValue = {
  lastEvent: SseEvent | null
  connected: boolean
}

const EventContext = createContext<EventContextValue>({
  lastEvent: null,
  connected: false,
})

export function EventProvider({ children }: { children: ReactNode }) {
  const [lastEvent, setLastEvent] = useState<SseEvent | null>(null)
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
    const url = `${base}/events/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => setConnected(true)

    es.onmessage = (event) => {
      try {
        const parsed: SseEvent = JSON.parse(event.data)
        setLastEvent(parsed)
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      setConnected(false)
    }

    return () => {
      es.close()
      esRef.current = null
      setConnected(false)
    }
  }, [])

  return (
    <EventContext.Provider value={{ lastEvent, connected }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEventSource() {
  return useContext(EventContext)
}

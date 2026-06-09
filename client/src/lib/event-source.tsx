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

export type SseErrorCreated = {
  errorGroupId: string
  title: string
}

export type SseEvent = {
  type: 'notification' | 'error_created' | 'analytics_ingested'
  data: SseNotification | SseErrorCreated | Record<string, unknown>
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
    if (!token) {
      console.debug('[SSE] no token, skipping connection')
      return
    }

    const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace('/graphql', '')
    const url = `${base}/events/stream?token=${encodeURIComponent(token)}`
    console.debug('[SSE] connecting to', url.replace(/token=.*$/, 'token=…'))
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => {
      console.log('[SSE] connected')
      setConnected(true)
    }

    es.onmessage = (event) => {
      try {
        const parsed: SseEvent = JSON.parse(event.data)
        console.log(`[SSE] received type=${parsed.type}`, parsed.data)
        setLastEvent(parsed)
      } catch {
        console.debug('[SSE] parse error:', event.data)
      }
    }

    es.onerror = () => {
      console.debug('[SSE] connection error (browser will auto-reconnect)')
      setConnected(false)
    }

    return () => {
      console.debug('[SSE] closing connection')
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

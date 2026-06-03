import { createContext, useContext, useCallback, useReducer, type ReactNode } from 'react'

export type Toast = {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  body?: string
  duration?: number
}

type State = {
  toasts: Toast[]
}

type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { ...state, toasts: [...state.toasts, action.toast] }
    case 'REMOVE':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
  }
}

type ToastContextValue = {
  toasts: Toast[]
  addToast: (t: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { toasts: [] })

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `toast_${++toastId}`
    dispatch({ type: 'ADD', toast: { ...t, id } })
    const ms = t.duration ?? 5000
    if (ms > 0) {
      setTimeout(() => dispatch({ type: 'REMOVE', id }), ms)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', id })
  }, [])

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToasts() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToasts must be used within ToastProvider')
  return ctx
}

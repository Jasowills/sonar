import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  name?: string
}

type State = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm font-semibold text-[var(--dot-down)]">Something went wrong</p>
          <p className="mt-1 max-w-md text-center text-xs text-[var(--text-muted)]">
            {this.state.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-4 border border-[var(--border-soft)] px-4 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--surface-panel-soft)]"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

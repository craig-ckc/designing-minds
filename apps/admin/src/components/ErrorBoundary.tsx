import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './primitives'

/**
 * Keeps one broken screen from taking the whole admin with it.
 *
 * React unmounts the entire root when a render throws and nothing catches it,
 * which is why a single failing field could leave nothing but the top bar on
 * screen — and no clue as to what happened. This catches the throw, keeps the
 * shell usable, and shows the actual message so the fault is reportable rather
 * than mysterious.
 */
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode; label?: string }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Admin crashed:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="grid min-h-0 flex-1 place-items-center px-6 py-10">
        <div className="grid max-w-[520px] gap-3 text-center">
          <h2 className="text-[1.2rem] font-bold tracking-[-0.02em]">
            {this.props.label ?? 'Something went wrong on this screen'}
          </h2>
          <p className="text-[0.9rem] text-ink-soft">
            The rest of the admin is still working — you can go back and carry on. If this keeps happening, the message
            below is the useful part.
          </p>
          <pre className="overflow-x-auto rounded-control border border-line bg-surface-alt px-3 py-2 text-left text-[0.8rem] text-danger">
            {error.message}
          </pre>
          <div className="flex justify-center gap-2.5">
            <Button variant="outline" size="sm" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
            <Button variant="solid" size="sm" onClick={() => window.location.assign('/')}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }
}

import { Component, type ReactNode } from 'react'

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return (
      <main className="mx-auto max-w-xl p-8" role="alert">
        <h1>Something went wrong</h1>
        <p className="my-4">Please reload the page. If you were making a purchase, check your order history before trying again.</p>
        <button type="button" className="underline" onClick={() => window.location.reload()}>Reload page</button>
      </main>
    )
    return this.props.children
  }
}

import { Component, type ReactNode } from 'react'
import { Button } from './ui/button'

/** Last-resort boundary. Sits outside the router and Shell, so it renders its
 *  own `<main>` using the same tokens and a reload action. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return (
      <main className="mx-auto grid min-h-[60vh] max-w-narrow content-center justify-items-start gap-4 px-5 py-12" role="alert">
        <h1 className="text-page-title">Something went wrong</h1>
        <p className="lead">Please reload the page. If you were making a purchase, check your order history before trying again.</p>
        <Button variant="solid" onClick={() => window.location.reload()}>Reload page</Button>
      </main>
    )
    return this.props.children
  }
}

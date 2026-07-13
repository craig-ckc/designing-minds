import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container } from '../components/ui/container'
import { Button } from '../components/ui/button'
import { apiUrl } from '../lib/api'
import { useNoindex } from '../lib/use-noindex'

type Status = 'working' | 'done' | 'invalid' | 'error'

export function UnsubscribePage() {
  useNoindex()
  const [params] = useSearchParams()
  const email = params.get('e') ?? ''
  const token = params.get('t') ?? ''
  const [status, setStatus] = useState<Status>('working')
  // Guard against the effect running twice (React 18 StrictMode double-invoke).
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    if (!email || !token) {
      setStatus('invalid')
      return
    }

    void (async () => {
      try {
        const response = await fetch(apiUrl('/api/unsubscribe'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, token }),
        })
        if (response.ok) {
          setStatus('done')
        } else {
          setStatus(response.status === 400 ? 'invalid' : 'error')
        }
      } catch {
        setStatus('error')
      }
    })()
  }, [email, token])

  const content = {
    working: { title: 'Unsubscribing…', body: 'One moment while we update your preferences.' },
    done: { title: 'You’ve been unsubscribed', body: 'You won’t receive any more marketing emails from us. You can resubscribe anytime.' },
    invalid: { title: 'This link isn’t valid', body: 'The unsubscribe link is invalid or has expired. If you keep receiving emails, reply to any of them and we’ll remove you.' },
    error: { title: 'Something went wrong', body: 'We couldn’t process your request just now. Please try again in a moment.' },
  }[status]

  return (
    <section className="section">
      <Container>
        <div className="mx-auto max-w-narrow text-center">
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-muted">Email preferences</p>
          <h1 className="mt-2 text-page-title">{content.title}</h1>
          <p className="mt-3 text-muted">{content.body}</p>
          <div className="mt-6 flex justify-center">
            <Button to="/" variant="solid">
              Back to home
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

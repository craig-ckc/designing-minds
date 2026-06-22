import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/auth'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const submit = () => {
    login()
    navigate(params.get('redirect') ?? '/account')
  }

  return (
    <AuthLayout
      eyebrow="Customer Account"
      title="Log in"
      intro="Access your orders and download your purchased resources."
      onSubmit={submit}
      footer={
        <>
          New here?{' '}
          <Link to="/sign-up" className="text-ink underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <Field label="Email">
        <input className="field" type="email" placeholder="you@example.com" autoComplete="email" />
      </Field>
      <Field label="Password">
        <input className="field" type="password" placeholder="Your password" autoComplete="current-password" />
      </Field>
      <Button type="submit" variant="solid" className="w-full">
        Log in
      </Button>
    </AuthLayout>
  )
}

import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/auth'
import { AuthLayout } from './AuthLayout'

export function SignUpPage() {
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
      title="Create your account"
      intro="Save your orders and download purchased files anytime from your account."
      onSubmit={submit}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-ink underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <Field label="Full name">
        <input className="field" placeholder="Your name" autoComplete="name" />
      </Field>
      <Field label="Email">
        <input className="field" type="email" placeholder="you@example.com" autoComplete="email" />
      </Field>
      <Field label="Password">
        <input className="field" type="password" placeholder="Create a password" autoComplete="new-password" />
      </Field>
      <Button type="submit" variant="solid" className="w-full">
        Create account
      </Button>
    </AuthLayout>
  )
}

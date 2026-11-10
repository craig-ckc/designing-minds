import { type ComponentPropsWithRef } from 'react'
import { Input as BaseInput } from '@base-ui/react/input'
import { cn, FIELD } from '../../design'

export type InputProps = Omit<ComponentPropsWithRef<typeof BaseInput>, 'className'> & { className?: string }

/** Text/number/date input on the Base UI Input primitive, with the shared field style. */
export function Input({ className, ...props }: InputProps) {
  return <BaseInput className={cn(FIELD, className)} {...props} />
}

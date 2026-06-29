import { type ComponentPropsWithoutRef } from 'react'
import { Input as BaseInput } from '@base-ui/react/input'
import { cn } from '@designing-minds/utils'
import { FIELD } from '../tokens'

export type InputProps = Omit<ComponentPropsWithoutRef<typeof BaseInput>, 'className'> & { className?: string }

/** Text/number/date input on the Base UI Input primitive, with the shared field style. */
export function Input({ className, ...props }: InputProps) {
  return <BaseInput className={cn(FIELD, className)} {...props} />
}

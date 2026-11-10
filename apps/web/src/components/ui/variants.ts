/**
 * Derive a variant-axis union from a `cv` style function, so component prop
 * types come from the one definition instead of being re-declared by hand:
 *
 *   const styles = cv({ variants: { tone: { a: [], b: [] } } })
 *   type Tone = VariantOf<typeof styles, 'tone'>   // 'a' | 'b'
 */
export type VariantOf<S, K extends string> = S extends (props?: infer P) => string
  ? K extends keyof NonNullable<P> ? NonNullable<NonNullable<P>[K]> : never
  : never

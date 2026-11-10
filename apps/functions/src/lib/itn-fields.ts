import type { PayfastFields } from './payfast.ts'

/**
 * Field names PayFast signed: every field received BEFORE `signature`, in the
 * order received. PayFast's reference code stops reading at "signature", so
 * anything posted after it is unsigned and must never be trusted.
 */
export const signedKeys = (fields: PayfastFields): string[] => {
  const keys = Object.keys(fields)
  const signatureAt = keys.indexOf('signature')
  return signatureAt === -1 ? keys : keys.slice(0, signatureAt)
}

/**
 * The signed part of an ITN, plus the signature itself. For a genuine ITN
 * (signature is the last field) this is the whole payload, unchanged; fields
 * an attacker appends after the signature are dropped.
 */
export const signedItnFields = (fields: PayfastFields): PayfastFields => {
  const result: PayfastFields = {}
  for (const key of signedKeys(fields)) result[key] = fields[key]
  if (fields.signature !== undefined) result.signature = fields.signature
  return result
}

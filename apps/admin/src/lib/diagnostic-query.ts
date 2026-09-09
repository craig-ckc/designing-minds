import { diagnosticId } from '../../../../packages/utils/src/diagnostics.ts'
export interface DiagnosticFilters {
  level: '' | 'info' | 'warning' | 'error'
  referenceType: 'requestId' | 'sessionId' | 'orderId'
  reference: string
  days: 1 | 7 | 30
}
export function validateDiagnosticFilters(filters: DiagnosticFilters): string | null {
  if (filters.reference.trim() && !diagnosticId(filters.reference.trim())) return 'Enter the complete reference ID shown to the customer or in a log event.'
  return null
}
export const diagnosticColumns = 'id,receivedAt,occurredAt,sequence,source,level,event,route,requestId,sessionId,orderId,status,durationMs,errorKind,code,asset,release'

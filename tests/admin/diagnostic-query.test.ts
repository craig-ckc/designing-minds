import assert from 'node:assert/strict'
import test from 'node:test'
import { validateDiagnosticFilters, type DiagnosticFilters } from '../../apps/admin/src/lib/diagnostic-query.ts'
const filters: DiagnosticFilters = { level: '', reference: '', referenceType: 'requestId', days: 1 }
test('accepts empty searches and complete request references', () => {
  assert.equal(validateDiagnosticFilters(filters), null)
  assert.equal(validateDiagnosticFilters({ ...filters, reference: ' 12345678-1234-4234-8234-123456789012 ' }), null)
})
test('rejects partial references and filter syntax instead of broadening the log query', () => {
  assert.ok(validateDiagnosticFilters({ ...filters, reference: '1234' }))
  assert.ok(validateDiagnosticFilters({ ...filters, reference: 'x),source.eq.server' }))
})

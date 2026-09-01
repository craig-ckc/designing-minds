import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { explainUploadFailure } from '../../apps/admin/src/lib/upload-transport.ts'

const read = (path: string) => readFileSync(new URL(`../../apps/admin/src/${path}`, import.meta.url), 'utf8')

/** How Supabase Storage words a rejection. */
const storageError = (statusCode: string, error: string, message: string) =>
  JSON.stringify({ statusCode, error, message })

const pdf = { size: 108_975_292, type: 'application/pdf' }

test('an over-limit file names the size, the limit and where to change it', () => {
  // The failure that started this: a 109MB PDF, refused with a bare 400. An
  // editor cannot act on "Upload failed (400)" — the size and the setting are
  // the whole answer, so both belong in the sentence.
  for (const status of [400, 413]) {
    const failure = explainUploadFailure(
      status,
      storageError('413', 'EntityTooLarge', 'The object exceeded the maximum allowed size'),
      pdf,
    )
    assert.match(failure.message, /109 MB/, 'should quote the file size')
    assert.match(failure.message, /upload size limit/i)
    assert.match(failure.message, /Supabase/, 'should point at where the limit lives')
    assert.equal(failure.status, status)
    assert.match(failure.detail ?? '', /EntityTooLarge/, 'storage’s own code should survive')
  }
})

test('a full project is called out as out of space, not as a bad file', () => {
  const failure = explainUploadFailure(400, storageError('400', 'quota_exceeded', 'Storage quota exceeded'), pdf)
  assert.match(failure.message, /no space left/i)
  assert.doesNotMatch(failure.message, /109 MB/, 'the file size is not the problem here')
})

test('each cause storage can report gets its own sentence', () => {
  const cases: [number, string, string, RegExp][] = [
    [409, '409', 'The resource already exists', /already holds a file/i],
    [415, '415', 'mime type text/plain is not supported', /does not accept/i],
    [400, '400', 'jwt expired', /link expired/i],
    [401, '401', 'Unauthorized', /sign-?in expired/i],
    [404, '404', 'Bucket not found', /bucket .*missing/i],
    [429, '429', 'SlowDown', /rate-?limiting/i],
    [503, '503', 'Service Unavailable', /Supabase Storage failed/i],
  ]
  const messages = new Set<string>()
  for (const [status, code, message, expected] of cases) {
    const failure = explainUploadFailure(status, storageError(code, code, message), pdf)
    assert.match(failure.message, expected, `HTTP ${status} (${message})`)
    messages.add(failure.message)
  }
  assert.equal(messages.size, cases.length, 'no two causes should read the same')
})

test('an unrecognised rejection still reports what storage said', () => {
  // The fallback is the point: a cause nobody anticipated must not collapse
  // back into a bare status code.
  const failure = explainUploadFailure(400, storageError('400', 'SomethingNew', 'A reason we have never seen'), pdf)
  assert.match(failure.message, /A reason we have never seen/)
  assert.match(failure.detail ?? '', /SomethingNew/)
})

test('a non-JSON body is passed through rather than dropped', () => {
  const failure = explainUploadFailure(502, '<html>Bad Gateway</html>', pdf)
  assert.match(failure.message, /HTTP 502/)
  assert.match(failure.detail ?? '', /Bad Gateway/)
})

test('an empty body still says something an editor can read', () => {
  const failure = explainUploadFailure(400, '', pdf)
  assert.match(failure.message, /Storage rejected the file/)
  assert.equal(failure.detail, undefined)
})

test('the upload field shows the reason, not just that it failed', () => {
  const source = read('components/editor/UploadFailure.tsx')
  assert.match(source, /job\.error/, 'the mapped sentence should be rendered')
  assert.match(source, /job\.errorDetail/, 'storage’s own words should be rendered too')
  // Three upload fields, one failure card: they each used to carry an identical
  // copy that said only "Upload failed".
  for (const field of ['FileListField', 'ImageGalleryField', 'PreviewPdfField']) {
    const fieldSource = read(`components/editor/${field}.tsx`)
    assert.match(fieldSource, /<UploadFailure /, `${field} should use the shared failure card`)
    assert.doesNotMatch(fieldSource, /Upload failed\./, `${field} should not carry its own generic message`)
  }
})

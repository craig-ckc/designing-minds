import assert from 'node:assert/strict'
import test from 'node:test'
import { cn } from '../../packages/utils/src/cn.ts'

test('a type-scale size and a text colour do not conflict', () => {
  for (const size of ['display', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body-lg', 'body', 'caption', 'label', 'micro']) {
    assert.equal(cn(`text-${size}`, 'text-ink'), `text-${size} text-ink`)
  }
  assert.equal(cn('text-h3', 'text-ink'), 'text-h3 text-ink')
})

test('two type-scale sizes conflict and the last one wins', () => {
  assert.equal(cn('text-body', 'text-body-lg'), 'text-body-lg')
  assert.equal(cn('text-h2', 'text-h3'), 'text-h3')
})

test('removed legacy size tokens are no longer treated as sizes', () => {
  // Unregistered tokens read as colours, so a later colour replaces them.
  assert.equal(cn('text-body-sm', 'text-ink'), 'text-ink')
})

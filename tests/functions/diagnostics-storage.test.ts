import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sanitizeEvent } from '../../packages/utils/src/diagnostics.ts'

const db = new PGlite()
const migration = readFileSync(new URL('../../supabase/patch/2026-09-09-diagnostics.sql', import.meta.url), 'utf8')
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create function public.is_admin() returns boolean language sql stable as
      $$select coalesce(current_setting('test.admin', true), 'false') = 'true'$$;`)
  await db.exec(migration)
  await db.exec(migration)
}, 20_000)
afterAll(() => db.close())
const event = () => sanitizeEvent({ event: 'checkout.failed', sessionId: '12345678-1234-4234-8234-123456789012' }, 'browser')!
const write = async (events: unknown[]) => db.query<{ accepted: boolean }>('select public.record_diagnostic_events($1::jsonb) as accepted', [JSON.stringify(events)])

describe('diagnostic database permissions and limits', () => {
  it('bootstraps Supabase Cron before trying to schedule retention', () => {
    const retention = readFileSync(new URL('../../supabase/patch/2026-09-09-diagnostics-retention.sql', import.meta.url), 'utf8')
    const install = retention.search(/create extension if not exists pg_cron with schema pg_catalog;/i)
    expect(install).toBeGreaterThanOrEqual(0)
    expect(install).toBeLessThan(retention.indexOf('select cron.schedule('))
  })
  it('accepts server writes and deduplicates retried events', async () => {
    await db.exec('set role service_role')
    const row = event()
    expect((await write([row])).rows[0].accepted).toBe(true)
    expect((await write([row])).rows[0].accepted).toBe(true)
    await db.exec('reset role')
    expect((await db.query('select * from public.diagnostic_events')).rows).toHaveLength(1)
  })
  it('denies anonymous reads, and denies browser writes and RPC execution', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`)
      await expect(write([event()])).rejects.toThrow(/permission denied/)
      await expect(db.exec('delete from public.diagnostic_events')).rejects.toThrow(/permission denied/)
      await expect(db.exec(`insert into public.diagnostic_events (id) values (gen_random_uuid())`)).rejects.toThrow(/permission denied/)
      if (role === 'anon') await expect(db.query('select * from public.diagnostic_events')).rejects.toThrow(/permission denied/)
      await db.exec('reset role')
    }
  })
  it('shows records only to authenticated admins', async () => {
    await db.exec("set role authenticated; set test.admin = 'false'")
    expect((await db.query('select * from public.diagnostic_events')).rows).toHaveLength(0)
    await db.exec("set test.admin = 'true'")
    expect((await db.query('select * from public.diagnostic_events')).rows).toHaveLength(1)
    await db.exec('reset role')
  })
  it('enforces per-session rate limits atomically and rejects oversized batches', async () => {
    await db.exec('truncate public.diagnostic_events; set role service_role')
    expect((await write(new Array(31).fill(null).map(event))).rows[0].accepted).toBe(false)
    for (let i = 0; i < 4; i++) expect((await write(new Array(30).fill(null).map(event))).rows[0].accepted).toBe(true)
    expect((await write([event()])).rows[0].accepted).toBe(false)
    await db.exec('reset role')
    expect((await db.query('select * from public.diagnostic_events')).rows).toHaveLength(120)
  })
  it('retention deletes old diagnostics without removing recent events', async () => {
    await db.exec(`update public.diagnostic_events set "receivedAt" = now() - interval '32 days' where id in (select id from public.diagnostic_events limit 1)`)
    const retention = readFileSync(new URL('../../supabase/patch/2026-09-09-diagnostics-retention.sql', import.meta.url), 'utf8')
    const sql = retention.match(/\$\$([\s\S]*?)\$\$/)![1]
    await db.exec(sql)
    expect((await db.query('select * from public.diagnostic_events')).rows).toHaveLength(119)
  })
})

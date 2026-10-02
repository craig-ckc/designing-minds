import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest'

const db = new PGlite()
const customer = '00000000-0000-4000-8000-0000000000aa'
const other = '00000000-0000-4000-8000-0000000000bb'
const product = '00000000-0000-4000-8000-000000000001'
const bundle = '00000000-0000-4000-8000-000000000002'
const read = (path: string) => readFileSync(new URL(`../../supabase/${path}`, import.meta.url), 'utf8')
const query = async (sql: string, args: unknown[] = []) => (await db.query<{ r: any }>(sql, args)).rows[0]?.r
const quote = (slugs = ['test', 'pack'], code: string | null = null, user = customer) => query('select public.quote_promotional_order($1::uuid, $2::text[], $3::text) as r', [user, slugs, code])
const start = (slugs = ['test', 'pack'], code: string | null = 'SAVE10', user = customer) => query('select public.create_promotional_order($1::uuid, $2::text[], $3::text, $4::text) as r', [user, slugs, code, `DM-${crypto.randomUUID()}`])
beforeAll(async () => {
  await db.exec(`create schema auth; create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role anon; create role authenticated; create role service_role; grant usage on schema auth to authenticated;`)
  await db.exec(read('schema.sql').replace('create extension if not exists pgcrypto;', ''))
  // A patch can safely be reapplied after the full schema.
  await db.exec(read('patch/2026-10-02-promotions.sql'))
  // Extension substitutes exercise scheduler SQL/permissions without real HTTP.
  await db.exec(`create schema cron; create schema net; create schema vault;
    create table cron.jobs (name text primary key, schedule text, command text);
    create function cron.schedule(job_name text, expression text, statement text) returns bigint language sql as $$
      insert into cron.jobs values (job_name,expression,statement)
      on conflict (name) do update set schedule=excluded.schedule,command=excluded.command; select 1::bigint $$;
    create table net.requests (id bigserial primary key, url text, headers jsonb, timeout integer);
    create function net.http_get(url text, headers jsonb, timeout_milliseconds integer) returns bigint language sql as $$
      insert into net.requests(url,headers,timeout) values(url,headers,timeout_milliseconds) returning id $$;
    create table vault.decrypted_secrets (name text, decrypted_secret text);`)
  await db.exec(read('patch/2026-10-02-promotions-cron.sql').replaceAll('pg_cron','plpgsql').replaceAll('pg_net','plpgsql'))
  await db.exec(`insert into auth.users (id,email) values ('${customer}','a@example.com'), ('${other}','b@example.com');
    update public.user_roles set role='admin' where "userId"='${customer}';`)
}, 30000)
beforeEach(async () => {
  await db.exec(`reset role; truncate public.coupon_redemptions, public.payments, public.orders, public.coupons, public.bundle_products, public.bundles, public.products cascade;
    insert into public.products (id,slug,title,"priceZar",grade,term,year,"resourceFormat",status)
      values ('${product}','test','Test',100,'Grade 4','Term 1','2026','Test / Assessment','queued');
    insert into public.bundles (id,slug,title,"priceZar",grade,term,year,status)
      values ('${bundle}','pack','Pack',200,'Grade 4','Term 1','2026','queued');
    select public.publish_site_content();
    insert into public.coupons (code,"discountType",value,enabled,"allowSaleItems") values ('SAVE10','percentage',10,true,false);`)
})
afterAll(() => db.close())

describe('sale scheduling and publishing', () => {
  it('uses only published sale changes and restores the normal price at the end boundary', async () => {
    await db.exec(`update products set "salePriceZar"=80, "saleStartsAt"=now()-interval '1 day', "saleEndsAt"=now()+interval '1 day' where id='${product}'`)
    expect((await quote(['test'])).totalZar).toBe(100)
    await db.exec(`update products set status='queued'; select public.publish_site_content()`)
    expect((await quote(['test'])).totalZar).toBe(80)
    expect(await query(`select public.promotion_price(100,80,now(),now()+interval '1 hour',now()) as r`)).toBe('80')
    expect(await query(`select public.promotion_price(100,80,null,now(),now()) as r`)).toBe('100')
    expect(await query(`select public.promotion_price(100,80,now()+interval '1 hour',null,now()) as r`)).toBe('100')
  })
  it('validates sale amounts and date ranges for both collections', async () => {
    for (const table of ['products','bundles']) {
      for (const assignment of ['"salePriceZar"=0','"salePriceZar"=-1','"salePriceZar"="priceZar"','"salePriceZar"="priceZar"+1', `"saleStartsAt"=now(),"saleEndsAt"=now()-interval '1 day'`]) {
        await expect(db.exec(`update ${table} set ${assignment}`)).rejects.toThrow()
      }
    }
  })
})

describe('coupon calculations and errors', () => {
  it('normalizes codes and calculates percentage and fixed discounts in cents', async () => {
    expect(await quote(undefined, ' save10 ')).toMatchObject({ subtotalZar: 300, discountZar: 30, totalZar: 270, couponCode: 'SAVE10' })
    await db.exec(`update coupons set "discountType"='fixed',value=25.55`)
    expect((await quote(undefined, 'SAVE10')).totalZar).toBe(274.45)
    await db.exec(`update products set "priceZar"=10.05,status='queued'; select public.publish_site_content(); update coupons set "discountType"='percentage',value=10`)
    expect((await quote(['test'],'SAVE10')).discountZar).toBe(1.01)
  })
  it('excludes sale items by default and includes them when the admin enables it', async () => {
    await db.exec(`update products set "salePriceZar"=80,status='queued'; select public.publish_site_content()`)
    expect(await quote(undefined,'SAVE10')).toMatchObject({ subtotalZar: 280, discountZar: 20, totalZar: 260 })
    await expect(quote(['test'],'SAVE10')).rejects.toThrow(/does not apply/)
    await db.exec(`update coupons set "allowSaleItems"=true`)
    expect((await quote(undefined,'SAVE10')).totalZar).toBe(252)
  })
  it('caps fixed discounts to eligible items and rejects a zero total', async () => {
    await db.exec(`update products set "salePriceZar"=80,status='queued'; select public.publish_site_content(); update coupons set "discountType"='fixed',value=1000`)
    expect((await quote(undefined,'SAVE10')).totalZar).toBe(80)
    await expect(quote(['pack'],'SAVE10')).rejects.toThrow(/greater than zero/)
  })
  it('rejects invalid, disabled, expired and not-yet-active codes', async () => {
    await expect(quote(undefined,'UNKNOWN')).rejects.toThrow(/Invalid discount code/)
    await db.exec(`update coupons set enabled=false`)
    await expect(quote(undefined,'SAVE10')).rejects.toThrow(/inactive or expired/)
    await db.exec(`update coupons set enabled=true,"expiresAt"=now()-interval '1 second'`)
    await expect(quote(undefined,'SAVE10')).rejects.toThrow(/inactive or expired/)
    await db.exec(`update coupons set "expiresAt"=null,"startsAt"=now()+interval '1 day'`)
    await expect(quote(undefined,'SAVE10')).rejects.toThrow(/inactive or expired/)
  })
  it('rejects empty carts and unavailable or already-owned resources; deduplicates slugs', async () => {
    await expect(quote([])).rejects.toThrow(/Cart is empty/)
    await expect(quote(['missing'])).rejects.toThrow(/unavailable/)
    expect((await quote(['test','test'])).subtotalZar).toBe(100)
    const order = await start(['test'], null)
    await query('select complete_payfast_payment($1::uuid,$2,100) as r',[order.paymentId,'PF-owned'])
    await expect(quote(['test'])).rejects.toThrow(/already owns/)
  })
  it('rejects malformed coupon settings and case-insensitive duplicates', async () => {
    for (const assignment of ['value=0','value=-1', 'value=101', `"discountType"='other'`, `"startsAt"=now(),"expiresAt"=now()-interval '1 day'`]) {
      await expect(db.exec(`update coupons set ${assignment}`)).rejects.toThrow()
    }
    await expect(db.exec(`insert into coupons (code,"discountType",value) values ('save10','fixed',1)`)).rejects.toThrow()
  })
})

describe('once per customer and payment lifecycle', () => {
  it('refuses a changed total before creating a payment or reserving the code', async () => {
    await expect(query('select create_promotional_order($1::uuid,$2::text[],$3,$4,$5::numeric) as r',[customer,['test','pack'],'SAVE10','DM-changed',299])).rejects.toThrow(/Prices changed/)
    expect(await query('select count(*)::int as r from orders')).toBe(0)
  })
  it('reserves once, resumes the same checkout, and rejects a different basket while pending', async () => {
    const order = await start()
    expect(await start()).toEqual(order)
    expect(await query('select count(*)::int as r from orders')).toBe(1)
    await expect(start(['test'])).rejects.toThrow(/pending checkout/)
    expect((await start(undefined,undefined,other)).orderId).not.toBe(order.orderId)
    expect(await query('select count(*)::int as r from coupon_redemptions')).toBe(2)
  })
  it('handles simultaneous starts without creating two coupon orders', async () => {
    const orders = await Promise.all([start(),start()])
    expect(orders[0]).toEqual(orders[1])
    expect(await query('select count(*)::int as r from coupon_redemptions')).toBe(1)
  })
  it('preserves the accepted price when a sale ends or a coupon is disabled during a payment retry', async () => {
    const order = await start()
    await db.exec(`update coupons set enabled=false; update products set "priceZar"=500,status='queued'; select public.publish_site_content()`)
    expect((await quote(undefined,'SAVE10')).totalZar).toBe(270)
    expect(await start()).toEqual(order)
  })
  it('consumes the code on success, treats duplicate notifications safely, and keeps refunds used', async () => {
    const order = await start()
    expect(await query('select complete_payfast_payment($1::uuid,$2,270) as r',[order.paymentId,'PF-1'])).toBe('processed')
    expect(await query('select complete_payfast_payment($1::uuid,$2,270) as r',[order.paymentId,'PF-1'])).toBe('duplicate')
    await expect(quote(['pack'],'SAVE10')).rejects.toThrow(/already used/)
    await db.exec(`update orders set status='refunded'; update payments set status='refunded'`)
    await expect(start(['pack'])).rejects.toThrow(/already used/)
  })
  it('releases the reservation after confirmed failure and rejects late completion for the failed payment', async () => {
    const order = await start()
    await db.query(`update payments set status='failed' where id=$1`,[order.paymentId])
    expect(await query('select count(*)::int as r from coupon_redemptions')).toBe(0)
    const retry = await start(['test'])
    expect(retry.orderId).not.toBe(order.orderId)
    expect(await query('select complete_payfast_payment($1::uuid,$2,270) as r',[order.paymentId,'PF-late'])).toBe('rejected')
  })
  it('rolls back the reservation if payment insertion fails', async () => {
    await db.exec(`create function reject_test_payment() returns trigger language plpgsql as $$begin raise exception 'test failure'; end;$$;
      create trigger reject_test_payment before insert on payments for each row execute function reject_test_payment()`)
    try { await expect(start()).rejects.toThrow(/test failure/); expect(await query('select count(*)::int as r from coupon_redemptions')).toBe(0) }
    finally { await db.exec('drop trigger reject_test_payment on payments; drop function reject_test_payment()') }
  })
  it('keeps coupon records private and RPCs service-only while allowing admin management', async () => {
    await db.exec(`grant select on user_roles to authenticated; grant select,insert,update,delete on coupons to anon,authenticated; grant select on coupon_redemptions to anon,authenticated`)
    for (const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`)
      expect(await query('select count(*)::int as r from coupons')).toBe(0)
      expect(await query('select count(*)::int as r from coupon_redemptions')).toBe(0)
      await expect(quote()).rejects.toThrow(/permission denied/)
      await expect(start()).rejects.toThrow(/permission denied/)
      await db.exec('reset role')
    }
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${customer}',false)`)
    expect(await query('select count(*)::int as r from coupons')).toBe(1)
    await db.exec(`update coupons set enabled=false; reset role; select set_config('request.jwt.claim.sub','',false)`)
  })
})

describe('scheduled rebuild leases', () => {
  const claim = (at: string) => query('select claim_promotion_rebuild($1::timestamptz) as r',[at])
  const finish = (token: string, success: boolean) => query('select finish_promotion_rebuild($1::uuid,$2::boolean) as r',[token,success])
  const schedule = async () => {
    await db.exec(`update private.promotion_rebuild_state set "checkedThrough"='2026-10-01T00:00:00Z',"leaseToken"=null,"leaseUntil"=null;
      update products set "salePriceZar"=80,"saleStartsAt"='2026-10-02T10:00:00Z',"saleEndsAt"='2026-10-02T12:00:00Z',status='queued'; select public.publish_site_content()`)
  }
  it('claims at the sale start/end and skips quiet ticks and simultaneous workers',async()=>{
    await schedule()
    expect(await claim('2026-10-02T09:59:59Z')).toBeNull()
    const job=await claim('2026-10-02T10:00:00Z')
    expect(job.token).toBeTruthy()
    expect(await claim('2026-10-02T10:00:00Z')).toBeNull()
    expect(await finish(job.token,true)).toBe(true)
    expect(await claim('2026-10-02T11:00:00Z')).toBeNull()
    expect((await claim('2026-10-02T12:00:00Z')).token).toBeTruthy()
  })
  it('keeps failed hook requests due for retry and recovers expired leases',async()=>{
    await schedule()
    const first=await claim('2026-10-02T10:00:00Z')
    await finish(first.token,false)
    const retry=await claim('2026-10-02T10:01:00Z')
    expect(retry.token).not.toBe(first.token)
    const recovered=await claim('2026-10-02T10:12:00Z')
    expect(recovered.token).not.toBe(retry.token)
    expect(await finish(retry.token,true)).toBe(false)
    expect(await finish(recovered.token,true)).toBe(true)
  })
  it('catches missed boundaries in one rebuild and never promotes draft or queued content',async()=>{
    await schedule()
    const job=await claim('2026-10-02T13:00:00Z')
    await finish(job.token,true)
    expect(await claim('2026-10-02T13:01:00Z')).toBeNull()
    await db.exec(`update products set "saleStartsAt"='2026-10-03T10:00:00Z',"saleEndsAt"='2026-10-03T12:00:00Z',status='queued'`)
    expect(await claim('2026-10-03T13:00:00Z')).toBeNull()
    expect(await query(`select status as r from products where id='${product}'`)).toBe('queued')
  })
  it('keeps an accepted hook pending until a completed build acknowledges it',async()=>{
    await schedule()
    const job=await claim('2026-10-02T10:00:00Z')
    await query('select mark_promotion_rebuild_requested($1::uuid) as r',[job.token])
    expect(await claim('2026-10-02T10:01:00Z')).toMatchObject({token:job.token,state:'waiting'})
    await finish(job.token,true)
    expect(await claim('2026-10-02T10:02:00Z')).toBeNull()
  })
  it('retains the outstanding watermark when a slow build outlives its lease',async()=>{
    await schedule()
    const job=await claim('2026-10-02T10:00:00Z')
    await query('select mark_promotion_rebuild_requested($1::uuid) as r',[job.token])
    const retry=await claim('2026-10-02T10:11:00Z')
    expect(retry.through).toBe(job.through)
    await query('select mark_promotion_rebuild_requested($1::uuid) as r',[retry.token])
    const waiting=await claim('2026-10-02T10:12:00Z')
    // The original build fetched content after the original boundary, but
    // before the retry. Its deployed timestamp must still satisfy this job.
    expect(Date.parse('2026-10-02T10:01:00Z')).toBeGreaterThanOrEqual(Date.parse(waiting.through))
    expect(await finish(waiting.token,true)).toBe(true)
    expect(await claim('2026-10-02T10:13:00Z')).toBeNull()
    // A later boundary still needs its own rebuild.
    expect((await claim('2026-10-02T12:00:00Z')).through).not.toBe(job.through)
  })
  it('only permits the service role to claim and acknowledge rebuild jobs' ,async()=>{
    await schedule()
    for(const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`)
      await expect(claim('2026-10-02T10:00:00Z')).rejects.toThrow(/permission denied/)
      await db.exec('reset role')
    }
  })
})

describe('Supabase scheduler setup',()=>{
  it('skips installation hooks for enabled extensions and safely reapplies the job',async()=>{
    // Supautils runs its after-create hook even for CREATE EXTENSION IF NOT
    // EXISTS. Model that failure with a PostgreSQL DDL hook. PGlite already
    // has plpgsql installed; substitute it only for the external extensions.
    await db.exec(`create function private.reject_extension_install() returns event_trigger language plpgsql as $$
      begin raise exception using errcode='2BP01', message='dependent privileges exist'; end $$;
      create event trigger reject_extension_install on ddl_command_end when tag in ('CREATE EXTENSION')
        execute function private.reject_extension_install()`)
    try {
      const setup=read('patch/2026-10-02-promotions-cron.sql').replaceAll('pg_cron','plpgsql').replaceAll('pg_net','plpgsql')
      await expect(db.exec(setup)).resolves.toBeDefined()
      await expect(db.exec(setup)).resolves.toBeDefined()
      expect((await db.query('select * from cron.jobs')).rows).toEqual([{name:'promotion-rebuilds',schedule:'* * * * *',command:'select private.request_promotion_rebuild()'}])
    } finally {
      await db.exec('drop event trigger reject_extension_install; drop function private.reject_extension_install()')
    }
  })
  it('schedules a named minute job with no credentials in its command',async()=>{
    const jobs=(await db.query<{name:string;schedule:string;command:string}>('select * from cron.jobs')).rows
    expect(jobs).toEqual([{name:'promotion-rebuilds',schedule:'* * * * *',command:'select private.request_promotion_rebuild()'}])
  })
  it('skips quiet ticks, reads Vault only for due requests, and sends the bearer secret',async()=>{
    await db.exec(`truncate net.requests, vault.decrypted_secrets;
      update private.promotion_rebuild_state set "checkedThrough"=now()-interval '2 days',"leaseToken"=null,"leaseUntil"=null,"leaseRequestedAt"=null`)
    expect(await query('select private.request_promotion_rebuild() as r')).toBeNull()
    await db.exec(`update products set "salePriceZar"=80,"saleStartsAt"=now()-interval '1 day',"saleEndsAt"=now()+interval '1 day',status='queued';select public.publish_site_content()`)
    await expect(query('select private.request_promotion_rebuild() as r')).rejects.toThrow(/Vault secrets/)
    await db.exec(`insert into vault.decrypted_secrets values ('promotions_cron_url','https://test.example.com/api/cron/promotions'),('promotions_cron_secret','fake-test-secret')`)
    expect(await query('select private.request_promotion_rebuild() as r')).toBeTruthy()
    expect((await db.query('select url,headers,timeout from net.requests')).rows).toEqual([{url:'https://test.example.com/api/cron/promotions',headers:{Authorization:'Bearer fake-test-secret'},timeout:30000}])
    await db.exec('set role authenticated')
    await expect(query('select private.request_promotion_rebuild() as r')).rejects.toThrow(/permission denied/)
    await db.exec('reset role')
  })
})

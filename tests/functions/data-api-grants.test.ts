import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../../supabase/${path}`, import.meta.url), 'utf8')
const schema = read('schema.sql')
const grantsPatch = read('patch/2026-11-10-data-api-grants.sql')
const BEGIN_GRANTS = '-- BEGIN core Data API grants'
const END_GRANTS = '-- END core Data API grants'

const fresh = new PGlite()
const upgraded = new PGlite()

const CUSTOMER = '00000000-0000-4000-8000-0000000000c1'
const OTHER_CUSTOMER = '00000000-0000-4000-8000-0000000000c2'
const ADMIN = '00000000-0000-4000-8000-0000000000c3'
const PRODUCT = '00000000-0000-4000-8000-0000000000c4'
const OWN_ORDER = '00000000-0000-4000-8000-0000000000c5'
const OTHER_ORDER = '00000000-0000-4000-8000-0000000000c6'
const OWN_PAYMENT = '00000000-0000-4000-8000-0000000000c7'
const OTHER_PAYMENT = '00000000-0000-4000-8000-0000000000c8'
const PHYSICAL_PRODUCT = '00000000-0000-4000-8000-0000000000c9'
const PHYSICAL_VARIANT = '00000000-0000-4000-8000-0000000000ca'
const OWN_PHYSICAL_LINE = '00000000-0000-4000-8000-0000000000cb'
const OTHER_PHYSICAL_LINE = '00000000-0000-4000-8000-0000000000cc'

const roles = ['anon', 'authenticated', 'service_role'] as const
const relations = [
  'user_roles', 'products', 'bundles', 'bundle_products', 'faqs', 'testimonials', 'value_lists',
  'users', 'orders', 'payments', 'carts', 'cart_items', 'form_contact', 'form_newsletter',
  'diagnostic_events', 'coupons', 'coupon_redemptions',
  'catalog_products', 'catalog_bundles', 'catalog_faqs', 'catalog_testimonials', 'active_slug_redirects',
  'product_variants', 'product_inventory', 'physical_cart_items', 'inventory_reservations',
]
const tablePrivileges = ['select', 'insert', 'update', 'delete'] as const
type TablePrivilege = typeof tablePrivileges[number]

const expected: Record<string, Partial<Record<TablePrivilege, boolean>>> = {
  'anon.value_lists': { select: true },
  'anon.catalog_products': { select: true },
  'anon.catalog_bundles': { select: true },
  'anon.catalog_faqs': { select: true },
  'anon.catalog_testimonials': { select: true },
  'anon.active_slug_redirects': { select: true },

  'authenticated.user_roles': { select: true },
  'authenticated.products': { select: true, insert: true, update: true, delete: true },
  'authenticated.bundles': { select: true, insert: true, update: true, delete: true },
  'authenticated.bundle_products': { select: true },
  'authenticated.faqs': { select: true, insert: true, update: true, delete: true },
  'authenticated.testimonials': { select: true, insert: true, update: true, delete: true },
  'authenticated.value_lists': { select: true },
  'authenticated.users': { select: true },
  'authenticated.orders': { select: true },
  'authenticated.payments': { select: true },
  'authenticated.carts': { select: true, insert: true, update: true, delete: true },
  'authenticated.cart_items': { select: true, insert: true, delete: true },
  'authenticated.form_contact': { select: true },
  'authenticated.form_newsletter': { select: true },
  'authenticated.diagnostic_events': { select: true },
  'authenticated.coupons': { select: true, insert: true, update: true },
  'authenticated.catalog_products': { select: true },
  'authenticated.catalog_bundles': { select: true },
  'authenticated.catalog_faqs': { select: true },
  'authenticated.catalog_testimonials': { select: true },
  'authenticated.active_slug_redirects': { select: true },

  'service_role.user_roles': { select: true },
  'service_role.products': { select: true },
  'service_role.bundles': { select: true },
  'service_role.bundle_products': { select: true },
  'service_role.users': { select: true },
  'service_role.orders': { select: true, update: true },
  'service_role.payments': { select: true, update: true },
  'service_role.form_contact': { insert: true },
  'service_role.form_newsletter': { insert: true },
  'service_role.diagnostic_events': { select: true, insert: true, update: true, delete: true },
  'service_role.coupons': { select: true, insert: true, update: true, delete: true },
  'service_role.coupon_redemptions': { select: true, insert: true, update: true, delete: true },
  'service_role.catalog_products': { select: true },
  'service_role.catalog_bundles': { select: true },
  'service_role.catalog_faqs': { select: true },
  'service_role.catalog_testimonials': { select: true },

  // Physical catalogue/stock is admin-managed; only authenticated customers
  // can access their own physical cart, and reservation rows are RPC-only.
  'authenticated.product_variants': { select: true, insert: true, update: true },
  'authenticated.product_inventory': { select: true, insert: true, update: true },
  'authenticated.physical_cart_items': { select: true, insert: true, update: true, delete: true },
  'service_role.product_variants': { select: true, insert: true, update: true },
  'service_role.product_inventory': { select: true, insert: true, update: true },
}

// These are the schema's externally callable public routines that either
// cross a trust boundary or are documented client RPCs. Keep the allowlist
// explicit so adding a new security-definer RPC requires a policy decision.
const functionExecuteAllowlist: Record<string, { authenticated: boolean; service_role: boolean }> = {
  'public.set_bundle_products(uuid,uuid[])': { authenticated: true, service_role: false },
  'public.publish_site_content()': { authenticated: false, service_role: true },
  'public.create_pending_order(uuid,uuid,text,uuid,text,text,jsonb,numeric)': { authenticated: false, service_role: true },
  'public.clear_purchased_cart_items()': { authenticated: false, service_role: false },
  'public.handle_new_user()': { authenticated: false, service_role: false },
  'public.handle_product_slug_change()': { authenticated: false, service_role: false },
  'public.record_diagnostic_events(jsonb)': { authenticated: false, service_role: true },
  'public.complete_payfast_payment(uuid,text,numeric)': { authenticated: false, service_role: true },
  'public.quote_promotional_order(uuid,text[],text)': { authenticated: false, service_role: true },
  'public.create_promotional_order(uuid,text[],text,text,numeric)': { authenticated: false, service_role: true },
  'public.claim_promotion_rebuild(timestamp with time zone)': { authenticated: false, service_role: true },
  'public.mark_promotion_rebuild_requested(uuid)': { authenticated: false, service_role: true },
  'public.finish_promotion_rebuild(uuid,boolean)': { authenticated: false, service_role: true },
  'public.quote_commerce_order(uuid,text[],jsonb,text,jsonb,text)': { authenticated: false, service_role: true },
  'public.create_commerce_order(uuid,text[],jsonb,text,jsonb,text,text,numeric)': { authenticated: false, service_role: true },
  'public.cancel_commerce_order(uuid,uuid)': { authenticated: false, service_role: true },
  'public.complete_commerce_payment(uuid,text,numeric)': { authenticated: false, service_role: true },
  'public.set_order_fulfillment(uuid,text,text,text)': { authenticated: true, service_role: false },
  'public.save_physical_product(jsonb,jsonb)': { authenticated: true, service_role: false },
}

const snapshot = async (db: PGlite, selectedRelations = relations) => {
  const result = await db.query<{
    role_name: string
    relation_name: string
    select_allowed: boolean
    insert_allowed: boolean
    update_allowed: boolean
    delete_allowed: boolean
  }>(`select role_name, relation_name,
      has_table_privilege(role_name, 'public.' || relation_name, 'select') as select_allowed,
      has_table_privilege(role_name, 'public.' || relation_name, 'insert') as insert_allowed,
      has_table_privilege(role_name, 'public.' || relation_name, 'update') as update_allowed,
      has_table_privilege(role_name, 'public.' || relation_name, 'delete') as delete_allowed
    from unnest($1::text[]) as role_names(role_name)
    cross join unnest($2::text[]) as relation_names(relation_name)
    order by role_name, relation_name`, [roles, selectedRelations])
  return result.rows
}

const initialize = async (db: PGlite, asUpgrade: boolean) => {
  await db.exec(`create schema auth;
    create table auth.users (
      id uuid primary key,
      email text,
      raw_user_meta_data jsonb not null default '{}',
      created_at timestamptz not null default now()
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;`)

  if (!asUpgrade) {
    await db.exec(schema.replace('create extension if not exists pgcrypto;', ''))
    return
  }

  const begin = schema.indexOf(BEGIN_GRANTS)
  const end = schema.indexOf(END_GRANTS)
  if (begin === -1 || end === -1 || end < begin) throw new Error('Core grant block delimiters are missing.')
  const oldSchema = `${schema.slice(0, begin)}${schema.slice(end + END_GRANTS.length)}`
  await db.exec(oldSchema.replace('create extension if not exists pgcrypto;', ''))
  const before = await snapshot(db)
  await db.exec(grantsPatch)
  await db.exec(grantsPatch)
  const after = await snapshot(db)
  expect(await snapshot(db, ['diagnostic_events', 'coupons', 'coupon_redemptions', 'catalog_products', 'catalog_bundles', 'catalog_faqs', 'catalog_testimonials', 'active_slug_redirects']))
    .toEqual(before.filter((row) => ['diagnostic_events', 'coupons', 'coupon_redemptions', 'catalog_products', 'catalog_bundles', 'catalog_faqs', 'catalog_testimonials', 'active_slug_redirects'].includes(row.relation_name)))
  expect(after).toHaveLength(roles.length * relations.length)
}

const assertExpectedGrantMatrix = async (db: PGlite) => {
  const actual = await snapshot(db)
  expect(actual).toHaveLength(roles.length * relations.length)
  for (const row of actual) {
    const key = `${row.role_name}.${row.relation_name}`
    const grants = expected[key] ?? {}
    const actualGrants = {
      select: row.select_allowed,
      insert: row.insert_allowed,
      update: row.update_allowed,
      delete: row.delete_allowed,
    }
    for (const privilege of tablePrivileges) {
      expect(actualGrants[privilege], `${key} ${privilege}`).toBe(grants[privilege] ?? false)
    }
  }
}

const seedCommerce = async (db: PGlite) => {
  await db.exec(`insert into auth.users (id, email) values
      ('${CUSTOMER}', 'customer@example.com'),
      ('${OTHER_CUSTOMER}', 'other@example.com'),
      ('${ADMIN}', 'admin@example.com');
    update public.user_roles set role = 'admin' where "userId" = '${ADMIN}';
    insert into public.products (id, slug, title, grade, term, year, "resourceFormat", status)
      values ('${PRODUCT}', 'grant-audit-product', 'Grant audit', 'Grade 4', 'Term 1', '2026', 'Worksheet', 'queued');
    insert into public.products (id, slug, title, "productType", status)
      values ('${PHYSICAL_PRODUCT}', 'grant-audit-physical', 'Physical grant audit', 'physical', 'queued');
    insert into public.product_variants (id, "productId", sku, "optionValues", "unitPriceZar")
      values ('${PHYSICAL_VARIANT}', '${PHYSICAL_PRODUCT}', 'GRANT-AUDIT-VARIANT', '{"Size":"One"}', 25);
    insert into public.physical_cart_items (id, "userId", "productSlug", "variantId", quantity) values
      ('${OWN_PHYSICAL_LINE}', '${CUSTOMER}', 'grant-audit-physical', '${PHYSICAL_VARIANT}', 1),
      ('${OTHER_PHYSICAL_LINE}', '${OTHER_CUSTOMER}', 'grant-audit-physical', '${PHYSICAL_VARIANT}', 2);
    insert into public.orders (id, reference, "customerId", "customerName", "customerEmail", status, items, "totalZar") values
      ('${OWN_ORDER}', 'GRANT-OWN', '${CUSTOMER}', 'Customer', 'customer@example.com', 'pending', '[]', 10),
      ('${OTHER_ORDER}', 'GRANT-OTHER', '${OTHER_CUSTOMER}', 'Other', 'other@example.com', 'pending', '[]', 20);
    insert into public.payments (id, "orderId", status, provider, reference, "amountZar") values
      ('${OWN_PAYMENT}', '${OWN_ORDER}', 'pending', 'PayFast', 'GRANT-OWN', 10),
      ('${OTHER_PAYMENT}', '${OTHER_ORDER}', 'pending', 'PayFast', 'GRANT-OTHER', 20);
    insert into public.form_contact (name, email) values ('Stored form', 'stored@example.com');
    insert into public.diagnostic_events (id, "occurredAt", source, level, event, route)
      values (gen_random_uuid(), now(), 'server', 'info', 'grant.audit', '/');`)
  await db.exec(`set role service_role; select public.publish_site_content(); reset role`)
}

const asRole = async <T>(db: PGlite, role: string, subject: string | null, work: () => Promise<T>): Promise<T> => {
  if (subject) await db.exec(`set request.jwt.claim.sub = '${subject}'`)
  await db.exec(`set role ${role}`)
  try {
    return await work()
  } finally {
    await db.exec('reset role; reset request.jwt.claim.sub')
  }
}

beforeAll(async () => {
  await initialize(fresh, false)
  await initialize(upgraded, true)
}, 30_000)

afterAll(async () => {
  await fresh.close()
  await upgraded.close()
})

describe('Data API grants', () => {
  it('grants only the mapped privileges on a clean install and preserves existing ACLs on patch upgrade', async () => {
    await assertExpectedGrantMatrix(fresh)
    await assertExpectedGrantMatrix(upgraded)
  })

  it('keeps physical commerce tables and public security-definer RPCs inside their intended role boundaries', async () => {
    for (const db of [fresh, upgraded]) {
      const functions = await db.query<{ signature: string; anon: boolean; authenticated: boolean; service_role: boolean }>(`
        select p.oid::regprocedure::text as signature,
          has_function_privilege('anon', p.oid, 'execute') as anon,
          has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
          has_function_privilege('service_role', p.oid, 'execute') as service_role
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prosecdef
        order by signature`)
      const seen = new Set<string>()
      for (const fn of functions.rows) {
        const key = `public.${fn.signature.slice(fn.signature.indexOf('.') + 1)}`
        const policy = functionExecuteAllowlist[key]
        expect(policy, `unreviewed public security-definer RPC ${key}`).toBeDefined()
        seen.add(key)
        expect(fn.anon, `${key} anon execute`).toBe(false)
        expect(fn.authenticated, `${key} authenticated execute`).toBe(policy?.authenticated ?? false)
        expect(fn.service_role, `${key} service_role execute`).toBe(policy?.service_role ?? false)
      }
      expect([...seen].sort()).toEqual(Object.keys(functionExecuteAllowlist).sort())
    }
  })

  it('supports public reads, owner-scoped customer access, admin CMS access, and trusted server operations', async () => {
    for (const db of [fresh, upgraded]) {
      await seedCommerce(db)
      const otherCartId = (await db.query<{ id: string }>(`select id from public.carts where "customerId" = '${OTHER_CUSTOMER}'`)).rows[0].id

      await asRole(db, 'anon', null, async () => {
        const lists = await db.query('select key from public.value_lists order by key')
        expect(lists.rows.length).toBeGreaterThan(0)
        expect((await db.query(`select slug from public.catalog_products where id = '${PRODUCT}'`)).rows).toEqual([{ slug: 'grant-audit-product' }])
        await expect(db.query('select * from public.products')).rejects.toThrow(/permission denied/)
        await expect(db.query(`insert into public.form_contact (email) values ('anon@example.com')`)).rejects.toThrow(/permission denied/)
      })

      await asRole(db, 'authenticated', CUSTOMER, async () => {
        expect((await db.query(`select role from public.user_roles where "userId" = '${CUSTOMER}'`)).rows).toEqual([{ role: 'customer' }])
        expect((await db.query(`select id from public.users where id = '${CUSTOMER}'`)).rows).toHaveLength(1)
        expect((await db.query(`select id from public.users where id = '${OTHER_CUSTOMER}'`)).rows).toEqual([])
        expect((await db.query(`select id from public.carts where "customerId" = '${CUSTOMER}'`)).rows).toHaveLength(1)
        expect((await db.query(`select id from public.carts where "customerId" = '${OTHER_CUSTOMER}'`)).rows).toEqual([])
        expect((await db.query(`select id from public.orders where id = '${OWN_ORDER}'`)).rows).toHaveLength(1)
        expect((await db.query(`select id from public.orders where id = '${OTHER_ORDER}'`)).rows).toEqual([])
        expect((await db.query(`select id from public.payments where id = '${OWN_PAYMENT}'`)).rows).toHaveLength(1)
        expect((await db.query(`select id from public.payments where id = '${OTHER_PAYMENT}'`)).rows).toEqual([])
        expect((await db.query(`select id from public.physical_cart_items where id = '${OWN_PHYSICAL_LINE}'`)).rows).toHaveLength(1)
        expect((await db.query(`select id from public.physical_cart_items where id = '${OTHER_PHYSICAL_LINE}'`)).rows).toEqual([])
        await expect(db.query(`insert into public.physical_cart_items ("userId", "productSlug", "variantId", quantity)
          values ('${OTHER_CUSTOMER}', 'grant-audit-physical', '${PHYSICAL_VARIANT}', 1)`)).rejects.toThrow(/row-level security/)
        await db.query(`update public.physical_cart_items set quantity = 3 where id = '${OWN_PHYSICAL_LINE}'`)
        expect((await db.query(`select quantity from public.physical_cart_items where id = '${OWN_PHYSICAL_LINE}'`)).rows).toEqual([{ quantity: 3 }])

        await db.query(`insert into public.carts ("customerId") values ('${CUSTOMER}')
          on conflict ("customerId") do update set "updatedAt" = excluded."updatedAt" returning id`)
        await db.query(`insert into public.cart_items ("cartId", "productId")
          select id, '${PRODUCT}' from public.carts where "customerId" = '${CUSTOMER}'`)
        await expect(db.query(`insert into public.cart_items ("cartId", "productId")
          values ('${otherCartId}', '${PRODUCT}')`)).rejects.toThrow(/row-level security/)
        expect((await db.query<{ count: number }>('select count(*)::int as count from public.cart_items')).rows[0].count).toBe(1)
        await expect(db.query(`update public.cart_items set "createdAt" = now()`)).rejects.toThrow(/permission denied/)
        await db.query(`delete from public.cart_items where "cartId" in
          (select id from public.carts where "customerId" = '${CUSTOMER}')`)
        expect((await db.query<{ count: number }>('select count(*)::int as count from public.cart_items')).rows[0].count).toBe(0)
      })

      await asRole(db, 'authenticated', ADMIN, async () => {
        await db.query(`insert into public.products (slug, title, grade, term, year, "resourceFormat")
          values ('admin-grant-audit', 'Admin insert', 'Grade 4', 'Term 1', '2026', 'Worksheet')
          on conflict (slug) do update set title = excluded.title returning id`)
        await db.query(`update public.products set title = 'Admin update' where slug = 'admin-grant-audit'`)
        await db.query(`delete from public.products where slug = 'admin-grant-audit'`)
        await db.query(`insert into public.coupons (code, "discountType", value) values ('GRANT-AUDIT', 'fixed', 1)`)
        await db.query(`update public.coupons set enabled = true where code = 'GRANT-AUDIT'`)
        expect((await db.query<{ count: number }>('select count(*)::int as count from public.bundle_products')).rows[0].count).toBe(0)
        expect((await db.query<{ count: number }>('select count(*)::int as count from public.form_contact')).rows[0].count).toBe(1)
        expect((await db.query<{ count: number }>('select count(*)::int as count from public.diagnostic_events')).rows[0].count).toBe(1)
        expect((await db.query<{ count: number }>('select count(*)::int as count from public.coupons')).rows[0].count).toBe(1)
      })

      await asRole(db, 'service_role', null, async () => {
        expect((await db.query(`select email from public.users where id = '${OTHER_CUSTOMER}'`)).rows).toEqual([{ email: 'other@example.com' }])
        await db.query(`update public.orders set "customerName" = 'Server updated' where id = '${OWN_ORDER}'`)
        await db.query(`update public.payments set "processedAt" = now() where id = '${OWN_PAYMENT}'`)
        await db.query(`insert into public.form_newsletter (email) values ('server@example.com')`)
      })
    }
  })
})

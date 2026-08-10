-- Track when FAQs and testimonials last changed.
--
-- Paste into the Supabase SQL editor. Safe to run more than once.
--
-- The admin needs to tell "this item is live" apart from "this item changed
-- since the site was last built". That comparison is `record.updatedAt` vs the
-- deployed site's content timestamp (apps/web writes build-info.json at
-- prerender time), so every editable collection needs an "updatedAt".
-- Products already had one; faqs and testimonials did not.
--
-- Backfilling with now() means everything looks "just edited" until the next
-- publish, which is the safe direction: the admin will offer to publish rather
-- than claim content is live when it might not be.

alter table public.faqs
  add column if not exists "updatedAt" timestamptz not null default now();

alter table public.testimonials
  add column if not exists "updatedAt" timestamptz not null default now();

drop trigger if exists faqs_set_updated_at on public.faqs;
create trigger faqs_set_updated_at
before update on public.faqs
for each row execute procedure public.set_updated_at();

drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at
before update on public.testimonials
for each row execute procedure public.set_updated_at();

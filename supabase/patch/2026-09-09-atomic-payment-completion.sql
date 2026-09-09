-- Called only after signature, source-IP, amount and PayFast validation succeed.
-- No existing records are modified by applying this migration.
create or replace function public.complete_payfast_payment(
  p_payment_id uuid, p_pf_payment_id text, p_amount_zar numeric
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  payment public.payments%rowtype;
  purchase public.orders%rowtype;
  was_succeeded boolean;
begin
  if p_pf_payment_id is null or btrim(p_pf_payment_id) = '' or p_amount_zar is null or p_amount_zar <= 0 then
    return 'rejected';
  end if;
  select * into payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  select * into purchase from public.orders where id = payment."orderId" for update;
  if not found then raise exception 'Order not found'; end if;

  -- Never overwrite refunds, failed records, another transaction or a mismatched order.
  if payment.provider <> 'PayFast' or payment."amountZar" <> p_amount_zar or purchase."totalZar" <> p_amount_zar
    or purchase."paymentId" is distinct from payment.id
    or payment.status not in ('pending', 'succeeded') or purchase.status not in ('pending', 'paid', 'fulfilled')
    or (payment."pfPaymentId" is not null and payment."pfPaymentId" <> p_pf_payment_id)
    or exists (select 1 from public.payments where "pfPaymentId" = p_pf_payment_id and id <> payment.id)
  then return 'rejected'; end if;

  was_succeeded := payment.status = 'succeeded';
  if was_succeeded and (payment."processedAt" is null or payment."pfPaymentId" is null) then return 'rejected'; end if;
  if was_succeeded and purchase.status in ('paid', 'fulfilled') then return 'duplicate'; end if;

  if not was_succeeded then
    update public.payments set status = 'succeeded', "pfPaymentId" = p_pf_payment_id, "processedAt" = now()
      where id = payment.id;
  end if;
  if purchase.status = 'pending' then
    -- Includes the cart-clearing trigger. Any failure rolls back BOTH updates.
    update public.orders set status = 'paid' where id = purchase.id;
  end if;
  return case when was_succeeded then 'recovered' else 'processed' end;
end;
$$;
revoke all on function public.complete_payfast_payment(uuid, text, numeric) from public, anon, authenticated;
grant execute on function public.complete_payfast_payment(uuid, text, numeric) to service_role;

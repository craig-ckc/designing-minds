export interface PaymentHandoff {
  url: string
  fields: Record<string, string | number | boolean>
}

/** Build and submit the PayFast POST form. A successful submit navigates away. */
export function postToPayment(handoff: PaymentHandoff) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = handoff.url
  for (const [name, value] of Object.entries(handoff.fields)) {
    const field = document.createElement('input')
    field.type = 'hidden'
    field.name = name
    field.value = String(value)
    form.append(field)
  }
  document.body.append(form)
  form.submit()
}

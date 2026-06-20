export interface Customer {
  id: string
  name: string
  email: string
  joined: string
}

/* Sample / wireframe data — no backend. Used to populate the admin dashboard
   so the business owner can see how customers will appear once a real store
   backend is wired in. */
export const sampleCustomers: Customer[] = [
  { id: 'c1', name: 'Amoré van Wyk', email: 'amore.vanwyk@gmail.com', joined: '2025-09-03' },
  { id: 'c2', name: 'Lizaan Botha', email: 'lizaan.botha@outlook.com', joined: '2025-10-11' },
  { id: 'c3', name: 'Thandiwe Mkhize', email: 'thandiwe.mkhize@gmail.com', joined: '2025-11-02' },
  { id: 'c4', name: 'Pieter Nel', email: 'pieter.nel@webmail.co.za', joined: '2025-11-19' },
  { id: 'c5', name: 'Nomsa Dlamini', email: 'nomsa.dlamini@gmail.com', joined: '2026-01-08' },
  { id: 'c6', name: 'Hendrik Steyn', email: 'h.steyn@gmail.com', joined: '2026-02-14' },
  { id: 'c7', name: 'Zanele Khumalo', email: 'zanele.k@yahoo.com', joined: '2026-03-22' },
  { id: 'c8', name: 'Riaan Pretorius', email: 'riaan.pretorius@gmail.com', joined: '2026-05-06' },
]

export const getCustomerById = (id: string): Customer | undefined =>
  sampleCustomers.find((customer) => customer.id === id)

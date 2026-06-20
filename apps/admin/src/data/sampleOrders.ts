import { sampleCustomers } from './sampleCustomers'

export interface OrderItem {
  title: string
  grade: string
  priceZar: number
  qty: number
}

export interface Order {
  id: string
  customerId: string
  date: string
  status: 'Paid' | 'Pending' | 'Refunded'
  items: OrderItem[]
}

/* Sample / wireframe data — no backend. Item titles and prices reference
   plausible products from the real CAPS-aligned catalogue. */
export const sampleOrders: Order[] = [
  {
    id: 'DM-1042',
    customerId: 'c1',
    date: '2026-06-18',
    status: 'Paid',
    items: [
      { title: 'Grade 5 Mathematics Term 3 Practice Test', grade: 'Grade 5', priceZar: 60, qty: 1 },
      { title: 'Grade 5 English Home Language Term 3 Test', grade: 'Grade 5', priceZar: 60, qty: 1 },
    ],
  },
  {
    id: 'DM-1041',
    customerId: 'c3',
    date: '2026-06-17',
    status: 'Paid',
    items: [{ title: 'Grade 7 Full Year Test Bundle', grade: 'Grade 7', priceZar: 1200, qty: 1 }],
  },
  {
    id: 'DM-1040',
    customerId: 'c2',
    date: '2026-06-15',
    status: 'Pending',
    items: [
      { title: 'Grade 4 Afrikaans First Additional Language Term 2 Test', grade: 'Grade 4', priceZar: 55, qty: 1 },
      { title: 'Grade 4 Natural Science & Technology Term 2 Test', grade: 'Grade 4', priceZar: 55, qty: 1 },
      { title: 'Grade 4 Mathematics Term 2 Test', grade: 'Grade 4', priceZar: 60, qty: 1 },
    ],
  },
  {
    id: 'DM-1039',
    customerId: 'c5',
    date: '2026-06-12',
    status: 'Paid',
    items: [{ title: 'Grade 6 Essential Term Access (Term 2)', grade: 'Grade 6', priceZar: 350, qty: 1 }],
  },
  {
    id: 'DM-1038',
    customerId: 'c4',
    date: '2026-06-09',
    status: 'Refunded',
    items: [{ title: 'Grade 3 Mathematics Term 2 Practice Test', grade: 'Grade 3', priceZar: 50, qty: 1 }],
  },
  {
    id: 'DM-1037',
    customerId: 'c6',
    date: '2026-06-05',
    status: 'Paid',
    items: [
      { title: 'Grade 7 History Term 2 Test', grade: 'Grade 7', priceZar: 60, qty: 1 },
      { title: 'Grade 7 Geography Term 2 Test', grade: 'Grade 7', priceZar: 60, qty: 1 },
      { title: 'Grade 7 Social Sciences Summary', grade: 'Grade 7', priceZar: 45, qty: 2 },
    ],
  },
  {
    id: 'DM-1036',
    customerId: 'c7',
    date: '2026-05-30',
    status: 'Paid',
    items: [{ title: 'Premium Full Year Access (All Grades)', grade: 'All grades', priceZar: 1200, qty: 1 }],
  },
  {
    id: 'DM-1035',
    customerId: 'c1',
    date: '2026-05-24',
    status: 'Paid',
    items: [{ title: 'Grade 5 Life Skills Term 2 Test', grade: 'Grade 5', priceZar: 50, qty: 1 }],
  },
  {
    id: 'DM-1034',
    customerId: 'c8',
    date: '2026-05-19',
    status: 'Pending',
    items: [
      { title: 'Grade 6 Mathematics Term 2 Practice Test', grade: 'Grade 6', priceZar: 60, qty: 1 },
      { title: 'Grade 6 English First Additional Language Term 2 Test', grade: 'Grade 6', priceZar: 55, qty: 1 },
    ],
  },
  {
    id: 'DM-1033',
    customerId: 'c3',
    date: '2026-05-11',
    status: 'Paid',
    items: [{ title: 'Grade 7 Mathematics Summary', grade: 'Grade 7', priceZar: 45, qty: 1 }],
  },
  {
    id: 'DM-1032',
    customerId: 'c5',
    date: '2026-04-28',
    status: 'Refunded',
    items: [{ title: 'Grade 6 Afrikaans First Additional Language Term 1 Test', grade: 'Grade 6', priceZar: 55, qty: 1 }],
  },
  {
    id: 'DM-1031',
    customerId: 'c2',
    date: '2026-04-15',
    status: 'Paid',
    items: [
      { title: 'Grade 4 English Home Language Term 1 Test', grade: 'Grade 4', priceZar: 60, qty: 1 },
      { title: 'Grade 4 Social Sciences Term 1 Test', grade: 'Grade 4', priceZar: 55, qty: 1 },
    ],
  },
]

export const orderTotal = (order: Order): number =>
  order.items.reduce((sum, item) => sum + item.priceZar * item.qty, 0)

export const orderItemCount = (order: Order): number =>
  order.items.reduce((sum, item) => sum + item.qty, 0)

export const getOrderById = (id: string): Order | undefined => sampleOrders.find((order) => order.id === id)

export const getOrdersByCustomer = (customerId: string): Order[] =>
  sampleOrders.filter((order) => order.customerId === customerId)

/* Lifetime spend = only revenue-generating (non-refunded) orders. */
export const customerSpend = (customerId: string): number =>
  getOrdersByCustomer(customerId)
    .filter((order) => order.status !== 'Refunded')
    .reduce((sum, order) => sum + orderTotal(order), 0)

/* Total revenue across all paid orders (pending / refunded excluded). */
export const totalRevenue = (): number =>
  sampleOrders.filter((order) => order.status === 'Paid').reduce((sum, order) => sum + orderTotal(order), 0)

/* Map customerId -> display name for the order tables. */
export const customerName = (customerId: string): string =>
  sampleCustomers.find((customer) => customer.id === customerId)?.name ?? 'Unknown customer'

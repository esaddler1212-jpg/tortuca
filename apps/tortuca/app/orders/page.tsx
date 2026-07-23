import { listOrders } from '@/lib/store'
import { formatPrice, formatDate } from '@ecs/shared'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const orders = await listOrders()

  return (
    <div>
      <h1 className="text-2xl font-semibold uppercase tracking-wide">Orders</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Order tracking across Easy Supply Co.
      </p>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-widest text-neutral-500">
            <th className="py-3">Order</th>
            <th className="py-3">Customer</th>
            <th className="py-3">Date</th>
            <th className="py-3">Total</th>
            <th className="py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-neutral-900">
              <td className="py-3 font-medium">{o.id}</td>
              <td className="py-3 text-neutral-400">{o.customer_email}</td>
              <td className="py-3 text-neutral-400">{formatDate(o.created_at)}</td>
              <td className="py-3 tabular-nums">
                {formatPrice(o.total, o.currency)}
              </td>
              <td className="py-3">
                <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs uppercase tracking-widest text-neutral-300">
                  {o.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

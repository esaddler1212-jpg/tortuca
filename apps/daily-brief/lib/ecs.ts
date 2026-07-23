const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3003'

export interface ApprovalOrder {
  id: string
  customer_email: string
  total: number
  currency: string
  status: string
}

export interface OpenSubmission {
  id: string
  name: string
  email: string
  company: string | null
}

export interface ActionItems {
  ordersToApprove: ApprovalOrder[]
  submissionsToAnswer: OpenSubmission[]
  source: 'tortuca' | 'sample'
}

const SAMPLE: Omit<ActionItems, 'source'> = {
  ordersToApprove: [
    { id: 'ESC-1043', customer_email: 'liam@example.com', total: 95, currency: 'USD', status: 'processing' },
  ],
  submissionsToAnswer: [
    { id: 'seed-sub-1', name: 'Jordan Ellis', email: 'jordan@studio.example', company: 'Studio Ellis' },
  ],
}

/**
 * Pulls actionable items from the Tortuca backend (orders awaiting approval and
 * open contact submissions). Falls back to sample data when Tortuca is not
 * reachable so the brief still renders standalone.
 */
export async function getActionItems(): Promise<ActionItems> {
  try {
    const [ordersRes, subsRes] = await Promise.all([
      fetch(`${ADMIN_URL}/api/orders`, { cache: 'no-store' }),
      fetch(`${ADMIN_URL}/api/submissions`, { cache: 'no-store' }),
    ])
    if (!ordersRes.ok || !subsRes.ok) throw new Error('Tortuca unreachable')

    const ordersJson = (await ordersRes.json()) as { orders: ApprovalOrder[] }
    const subsJson = (await subsRes.json()) as { submissions: OpenSubmission[] }

    return {
      ordersToApprove: ordersJson.orders.filter((o) => o.status === 'processing'),
      submissionsToAnswer: subsJson.submissions,
      source: 'tortuca',
    }
  } catch {
    return { ...SAMPLE, source: 'sample' }
  }
}

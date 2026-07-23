import { NextResponse } from 'next/server'
import Stripe from 'stripe'

interface CheckoutItem {
  id: string
  title: string
  price: number
  currency: string
  quantity: number
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY

  if (!secret) {
    return NextResponse.json(
      {
        error:
          'Stripe is not configured. Add STRIPE_SECRET_KEY to enable checkout.',
      },
      { status: 501 },
    )
  }

  let items: CheckoutItem[] = []
  try {
    const body = (await request.json()) as { items?: CheckoutItem[] }
    items = body.items ?? []
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const origin =
    request.headers.get('origin') ||
    process.env.NEXT_PUBLIC_STORE_URL ||
    'http://localhost:3001'

  try {
    const stripe = new Stripe(secret)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: (item.currency || 'usd').toLowerCase(),
          product_data: { name: item.title },
          unit_amount: Math.round(item.price * 100),
        },
      })),
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/cart?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

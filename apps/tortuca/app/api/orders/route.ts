import { NextResponse } from 'next/server'
import { listOrders } from '@/lib/store'

export async function GET() {
  const orders = await listOrders()
  return NextResponse.json({ orders })
}

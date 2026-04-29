import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Client from '@/lib/models/Client'
import { isSuperAdmin, forbidden } from '@/lib/tenant'

// GET /api/clients — list all clients (super_admin only)
export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role') ?? ''
  if (!isSuperAdmin(role)) return forbidden()

  await connectToDatabase()
  const clients = await Client.find().sort({ createdAt: -1 }).lean()

  return NextResponse.json(
    clients.map(c => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      description: c.description,
      logoUrl: c.logoUrl,
      isActive: c.isActive,
      plan: c.plan,
      settings: c.settings,
      createdAt: c.createdAt,
    }))
  )
}

// POST /api/clients — create a new client workspace (super_admin only)
export async function POST(req: NextRequest) {
  const role = req.headers.get('x-user-role') ?? ''
  const userId = req.headers.get('x-user-id') ?? ''
  if (!isSuperAdmin(role)) return forbidden()

  const body = await req.json()
  const { name, slug, description, plan, logoUrl, settings } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }

  await connectToDatabase()

  const existing = await Client.findOne({ slug })
  if (existing) {
    return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const client = await Client.create({
    name,
    slug,
    description,
    plan: plan ?? 'starter',
    logoUrl,
    settings,
    createdBy: userId || undefined,
  })

  return NextResponse.json(
    {
      id: client._id.toString(),
      name: client.name,
      slug: client.slug,
      description: client.description,
      isActive: client.isActive,
      plan: client.plan,
      createdAt: client.createdAt,
    },
    { status: 201 }
  )
}

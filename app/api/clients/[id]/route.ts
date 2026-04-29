import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Client from '@/lib/models/Client'
import ClientMembership from '@/lib/models/ClientMembership'
import Project from '@/lib/models/Project'
import { isSuperAdmin, isClientAdmin, forbidden } from '@/lib/tenant'

// GET /api/clients/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = req.headers.get('x-user-role') ?? ''
  const tenantId = req.headers.get('x-tenant-id') ?? ''

  // super_admin can view any; client_admin can only view their own
  if (!isSuperAdmin(role) && tenantId !== id) return forbidden()

  await connectToDatabase()
  const client = await Client.findById(id).lean()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: client._id.toString(),
    name: client.name,
    slug: client.slug,
    description: client.description,
    logoUrl: client.logoUrl,
    isActive: client.isActive,
    plan: client.plan,
    settings: client.settings,
    createdAt: client.createdAt,
  })
}

// PUT /api/clients/[id] — update client (super_admin or client_admin of that client)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = req.headers.get('x-user-role') ?? ''
  const tenantId = req.headers.get('x-tenant-id') ?? ''

  if (!isSuperAdmin(role) && (role !== 'client_admin' || tenantId !== id)) return forbidden()

  const body = await req.json()
  const allowed = ['name', 'description', 'logoUrl', 'settings', 'plan', 'isActive'] as const
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  // Only super_admin may deactivate or change plan
  if (!isSuperAdmin(role)) {
    delete update.isActive
    delete update.plan
  }

  await connectToDatabase()
  const client = await Client.findByIdAndUpdate(id, update, { new: true }).lean()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: client._id.toString(),
    name: client.name,
    slug: client.slug,
    isActive: client.isActive,
    plan: client.plan,
    updatedAt: client.updatedAt,
  })
}

// DELETE /api/clients/[id] — deactivate (super_admin only, no hard delete)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = req.headers.get('x-user-role') ?? ''
  if (!isSuperAdmin(role)) return forbidden()

  await connectToDatabase()
  await Client.findByIdAndUpdate(id, { isActive: false })

  return NextResponse.json({ success: true })
}

// PATCH /api/clients/[id] — actions: activate
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = req.headers.get('x-user-role') ?? ''
  if (!isSuperAdmin(role)) return forbidden()

  const { action } = await req.json()
  await connectToDatabase()

  if (action === 'activate') {
    await Client.findByIdAndUpdate(id, { isActive: true })
    return NextResponse.json({ success: true })
  }

  if (action === 'purge') {
    // Hard delete everything for this client — use carefully
    await Promise.all([
      Client.findByIdAndDelete(id),
      ClientMembership.deleteMany({ tenantId: id }),
      Project.deleteMany({ tenantId: id }),
    ])
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

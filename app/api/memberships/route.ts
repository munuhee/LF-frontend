import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import ClientMembership from '@/lib/models/ClientMembership'
import User from '@/lib/models/User'
import { requireTenant, isClientAdmin, isSuperAdmin, forbidden, isValidObjectId } from '@/lib/tenant'

// GET /api/memberships?clientId=...&clientSlug=... — list members
// super_admin can pass ?clientId= or ?clientSlug= to query any workspace
export async function GET(req: NextRequest) {
  const ctx = requireTenant(req)
  if (ctx instanceof NextResponse) return ctx
  if (!isClientAdmin(ctx.role)) return forbidden()

  const { searchParams } = new URL(req.url)
  const clientIdParam = searchParams.get('clientId')
  const clientSlugParam = searchParams.get('clientSlug')

  let tenantId = ctx.tenantId

  await connectToDatabase()

  if (isSuperAdmin(ctx.role)) {
    if (clientSlugParam) {
      const client = await (await import('@/lib/models/Client')).default.findOne({ slug: clientSlugParam }).lean()
      if (!client) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      tenantId = (client._id as { toString(): string }).toString()
    } else if (clientIdParam && isValidObjectId(clientIdParam)) {
      tenantId = clientIdParam
    }
  }

  if (!isValidObjectId(tenantId)) return forbidden('Client context required')
  const memberships = await ClientMembership.find({ tenantId })
    .populate('userId', 'name email department isActive badges createdAt')
    .sort({ joinedAt: -1 })
    .lean()

  return NextResponse.json(
    memberships.map(m => {
      const user = m.userId as unknown as {
        _id: { toString(): string }
        name: string
        email: string
        department?: string
        isActive: boolean
        badges: unknown[]
      }
      return {
        id: m._id.toString(),
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        department: user.department,
        isActive: m.isActive,
        role: m.role,
        joinedAt: m.joinedAt,
      }
    })
  )
}

// POST /api/memberships — add a user to the client workspace
export async function POST(req: NextRequest) {
  const ctx = requireTenant(req)
  if (ctx instanceof NextResponse) return ctx
  if (!isClientAdmin(ctx.role)) return forbidden()

  const body = await req.json()
  const { userId, email, role, clientId: bodyClientId } = body

  const validRoles = ['client_admin', 'qa_lead', 'reviewer', 'annotator', 'reviewer_annotator']
  if (!role || !validRoles.includes(role)) {
    return NextResponse.json({ error: `role must be one of: ${validRoles.join(', ')}` }, { status: 400 })
  }

  // Prevent non-super_admin from assigning client_admin above themselves
  if (role === 'client_admin' && !isClientAdmin(ctx.role)) return forbidden()

  // super_admin may target any workspace via clientId in the body
  const tenantId = (isSuperAdmin(ctx.role) && bodyClientId) ? bodyClientId : ctx.tenantId
  if (!tenantId) return forbidden('Client context required')

  await connectToDatabase()

  let targetUser
  if (userId) {
    targetUser = await User.findById(userId)
  } else if (email) {
    targetUser = await User.findOne({ email: email.toLowerCase() })
  }

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // super_admin cannot be added as a member — they access globally
  if (targetUser.role === 'super_admin') {
    return NextResponse.json({ error: 'Super admins access all workspaces globally' }, { status: 400 })
  }

  const membership = await ClientMembership.findOneAndUpdate(
    { userId: targetUser._id, tenantId },
    { role, isActive: true, joinedAt: new Date() },
    { upsert: true, new: true }
  )

  return NextResponse.json(
    {
      id: membership._id.toString(),
      userId: targetUser._id.toString(),
      tenantId,
      role: membership.role,
      isActive: membership.isActive,
      joinedAt: membership.joinedAt,
    },
    { status: 201 }
  )
}

// PATCH /api/memberships — update or remove a membership
export async function PATCH(req: NextRequest) {
  const ctx = requireTenant(req)
  if (ctx instanceof NextResponse) return ctx
  if (!isClientAdmin(ctx.role)) return forbidden()

  const body = await req.json()
  const { membershipId, action, role } = body

  await connectToDatabase()
  // For super_admin (no bound tenantId), look up the membership by id only
  const membershipQuery = isValidObjectId(ctx.tenantId)
    ? { _id: membershipId, tenantId: ctx.tenantId }
    : { _id: membershipId }
  const membership = await ClientMembership.findOne(membershipQuery)
  if (!membership) return NextResponse.json({ error: 'Membership not found' }, { status: 404 })

  if (action === 'update-role') {
    if (!role) return NextResponse.json({ error: 'role is required' }, { status: 400 })
    // Only super_admin can assign client_admin role
    if (role === 'client_admin' && !isSuperAdmin(ctx.role)) return forbidden()
    membership.role = role
    await membership.save()
  } else if (action === 'deactivate') {
    membership.isActive = false
    await membership.save()
  } else if (action === 'reactivate') {
    membership.isActive = true
    await membership.save()
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ success: true, role: membership.role, isActive: membership.isActive })
}

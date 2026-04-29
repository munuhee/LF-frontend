import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Client from '@/lib/models/Client'
import ClientMembership from '@/lib/models/ClientMembership'
import { signToken } from '@/lib/jwt'
import { isSuperAdmin, forbidden } from '@/lib/tenant'

/**
 * POST /api/auth/impersonate
 * Super Admin only. Issues a short-lived token scoped to the target user's
 * identity within a specific client workspace. The original super_admin session
 * is not affected — they can call /api/auth/impersonate/stop to restore it.
 *
 * Body: { targetUserId: string, clientSlug: string }
 */
export async function POST(req: NextRequest) {
  const role = req.headers.get('x-user-role') ?? ''
  const requesterId = req.headers.get('x-user-id') ?? ''

  if (!isSuperAdmin(role)) return forbidden()

  const { targetUserId, clientSlug } = await req.json()
  if (!targetUserId || !clientSlug) {
    return NextResponse.json({ error: 'targetUserId and clientSlug are required' }, { status: 400 })
  }

  await connectToDatabase()

  const targetUser = await User.findById(targetUserId).select('-passwordHash -otp -otpExpiry')
  if (!targetUser) {
    return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
  }

  if (targetUser.role === 'super_admin') {
    return NextResponse.json({ error: 'Cannot impersonate another super_admin' }, { status: 400 })
  }

  const client = await Client.findOne({ slug: clientSlug, isActive: true })
  if (!client) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const membership = await ClientMembership.findOne({
    userId: targetUser._id,
    tenantId: client._id,
    isActive: true,
  })
  if (!membership) {
    return NextResponse.json(
      { error: 'Target user has no membership in this workspace' },
      { status: 404 }
    )
  }

  // Issue a 1-hour impersonation token
  const token = await signToken({
    userId: targetUser._id.toString(),
    email: targetUser.email,
    role: membership.role,
    tenantId: client._id.toString(),
    clientSlug: client.slug,
    // Embed impersonator info so audit logs can trace it
    impersonatedBy: requesterId,
  })

  const response = NextResponse.json({
    message: `Now impersonating ${targetUser.name} in workspace "${client.name}"`,
    user: {
      id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      role: membership.role,
      tenantId: client._id.toString(),
      clientSlug: client.slug,
    },
  })

  response.cookies.set('lf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // 1-hour impersonation session
    maxAge: 60 * 60,
    path: '/',
  })

  return response
}

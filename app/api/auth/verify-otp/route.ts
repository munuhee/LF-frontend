import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Client from '@/lib/models/Client'
import ClientMembership from '@/lib/models/ClientMembership'
import { signToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  try {
    const { email, otp, clientSlug } = await req.json()
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    await connectToDatabase()
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 })
    }

    if (!user.otp || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
    }

    // Clear OTP
    user.otp = undefined
    user.otpExpiry = undefined
    await user.save()

    // ── Resolve client context ─────────────────────────────────────────────
    let tenantId: string | undefined
    let resolvedClientSlug: string | undefined
    let clientRole: string = user.role

    if (user.role === 'super_admin') {
      // super_admin: no tenant binding required; they access all workspaces
      tenantId = undefined
      resolvedClientSlug = undefined
    } else if (clientSlug) {
      // Look up the client by slug and verify the user has a membership
      const client = await Client.findOne({ slug: clientSlug, isActive: true })
      if (!client) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      }

      const membership = await ClientMembership.findOne({
        userId: user._id,
        tenantId: client._id,
        isActive: true,
      })

      if (!membership) {
        return NextResponse.json(
          { error: 'You do not have access to this workspace' },
          { status: 403 }
        )
      }

      tenantId = client._id.toString()
      resolvedClientSlug = client.slug
      clientRole = membership.role
    } else {
      // No slug provided — look up the user's first active membership
      const membership = await ClientMembership.findOne({ userId: user._id, isActive: true })
        .populate<{ tenantId: { _id: { toString(): string }; slug: string } }>('tenantId')

      if (membership) {
        const populatedClient = membership.tenantId as unknown as { _id: { toString(): string }; slug: string }
        tenantId = populatedClient._id.toString()
        resolvedClientSlug = populatedClient.slug
        clientRole = membership.role
      }
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: clientRole,
      tenantId,
      clientSlug: resolvedClientSlug,
    })

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: clientRole,
        tenantId,
        clientSlug: resolvedClientSlug,
        department: user.department,
        badges: user.badges,
      },
    })

    response.cookies.set('lf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[auth/verify-otp]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

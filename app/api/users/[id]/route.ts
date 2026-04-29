import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/User'
import ClientMembership from '@/lib/models/ClientMembership'
import { requireTenant, isClientAdmin, isValidObjectId } from '@/lib/tenant'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    const { userId: currentUserId, role } = ctx

    // Users may update their own profile; client_admin+ can update anyone in their workspace
    if (!isClientAdmin(role) && currentUserId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    await connectToDatabase()

    const update: Record<string, unknown> = {}
    if (body.name) update.name = body.name
    if (body.department !== undefined) update.department = body.department

    if (isClientAdmin(role)) {
      if (body.isActive !== undefined) update.isActive = body.isActive
      // Role changes go through membership, not the user's system role
      const mf = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
      if (body.role) {
        await ClientMembership.findOneAndUpdate(
          { userId: id, ...mf },
          { role: body.role }
        )
      }
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true })
      .select('-passwordHash -otp -otpExpiry')
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Get the membership role for the current tenant
    const mf2 = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
    const membership = await ClientMembership.findOne({ userId: id, ...mf2 })

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: membership?.role ?? user.role,
      department: user.department,
      isActive: user.isActive,
      badges: user.badges,
    })
  } catch (err) {
    console.error('[users/[id] PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { action, badge } = await req.json()
    await connectToDatabase()

    const user = await User.findById(id)
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (action === 'award-badge') {
      user.badges.push({ ...badge, awardedAt: new Date() })
      await user.save()
    } else if (action === 'remove-badge') {
      user.badges = user.badges.filter(b => b.name !== badge.name)
      await user.save()
    }

    return NextResponse.json({
      id: user._id.toString(),
      badges: user.badges,
    })
  } catch (err) {
    console.error('[users/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

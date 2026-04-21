import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role')!
    const currentUserId = req.headers.get('x-user-id')!
    const { id } = await params

    // Allow users to update their own profile; only admins can change roles/status
    if (role !== 'admin' && currentUserId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    await connectToDatabase()

    const update: Record<string, unknown> = {}
    if (body.name) update.name = body.name
    if (body.department !== undefined) update.department = body.department
    if (role === 'admin') {
      if (body.role) update.role = body.role
      if (body.isActive !== undefined) update.isActive = body.isActive
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true })
      .select('-passwordHash -otp -otpExpiry')

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      badges: user.badges,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role')!
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

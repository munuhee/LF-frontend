import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectToDatabase()
    const user = await User.findById(userId).select('-passwordHash -otp -otpExpiry')
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // tenantId and clientSlug come from the JWT (forwarded as headers by middleware)
    const tenantId = req.headers.get('x-tenant-id') ?? undefined
    const clientSlug = req.headers.get('x-client-slug') ?? undefined
    // role in the token reflects the membership role for the active client
    const role = req.headers.get('x-user-role') ?? user.role

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role,
      tenantId,
      clientSlug,
      department: user.department,
      badges: user.badges,
      createdAt: user.createdAt,
    })
  } catch (err) {
    console.error('[auth/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

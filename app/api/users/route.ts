import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role')!
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await connectToDatabase()
    const users = await User.find({}).select('-passwordHash -otp -otpExpiry').lean()

    return NextResponse.json(users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      isActive: u.isActive,
      badges: u.badges,
      createdAt: u.createdAt,
    })))
  } catch (err) {
    console.error('[users GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role')!
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(body.password, 12)

    await connectToDatabase()
    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role || 'annotator',
      department: body.department || '',
    })

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

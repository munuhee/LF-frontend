import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/User'
import ClientMembership from '@/lib/models/ClientMembership'
import { requireTenant, isClientAdmin, isSuperAdmin, isValidObjectId } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const clientSlugParam = searchParams.get('clientSlug')
    const clientIdParam = searchParams.get('clientId')

    if (isSuperAdmin(ctx.role)) {
      // Resolve an optional workspace filter for super_admin
      let scopeTenantId: string | null = null
      if (clientSlugParam) {
        const client = await (await import('@/lib/models/Client')).default.findOne({ slug: clientSlugParam }).lean()
        if (client) scopeTenantId = (client._id as { toString(): string }).toString()
      } else if (clientIdParam && isValidObjectId(clientIdParam)) {
        scopeTenantId = clientIdParam
      }

      if (scopeTenantId) {
        // Return only members of the specified workspace
        const memberships = await ClientMembership.find({ tenantId: scopeTenantId, isActive: true })
          .populate('userId', 'name email department isActive badges createdAt')
          .lean()
        return NextResponse.json(
          memberships.map(m => {
            const u = m.userId as unknown as {
              _id: { toString(): string }; name: string; email: string
              department?: string; isActive: boolean; badges: unknown[]; createdAt: Date
            }
            return { id: u._id.toString(), name: u.name, email: u.email, role: m.role, department: u.department, isActive: u.isActive, badges: u.badges, createdAt: u.createdAt }
          })
        )
      }

      // Super admin without workspace scope: return all users system-wide
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
    }

    // Client admin: return only members of their workspace
    const memberships = await ClientMembership.find({ tenantId: ctx.tenantId, isActive: true })
      .populate('userId', 'name email department isActive badges createdAt')
      .lean()

    return NextResponse.json(
      memberships.map(m => {
        const u = m.userId as unknown as {
          _id: { toString(): string }
          name: string
          email: string
          department?: string
          isActive: boolean
          badges: unknown[]
          createdAt: Date
        }
        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: m.role,
          department: u.department,
          isActive: u.isActive,
          badges: u.badges,
          createdAt: u.createdAt,
        }
      })
    )
  } catch (err) {
    console.error('[users GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(body.password, 12)

    const validRoles = ['client_admin', 'qa_lead', 'reviewer', 'annotator', 'reviewer_annotator']
    const role = body.role && validRoles.includes(body.role) ? body.role : 'annotator'

    await connectToDatabase()
    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      role,
      department: body.department || '',
    })

    // Automatically create a membership for this client
    await ClientMembership.create({
      userId: user._id,
      tenantId: ctx.tenantId,
      role,
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

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Notification from '@/lib/models/Notification'
import { requireTenant, isValidObjectId } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    await connectToDatabase()

    // Only include tenantId filter when it is a valid ObjectId.
    // super_admin has no tenantId — they see their global notifications only.
    const tenantFilter = isValidObjectId(ctx.tenantId)
      ? { $or: [{ tenantId: ctx.tenantId }, { tenantId: { $exists: false } }] }
      : { $or: [{ tenantId: { $exists: false } }] }

    const notifications = await Notification.find({
      userId: ctx.userId,
      ...tenantFilter,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json(notifications.map(n => ({
      id: n._id.toString(),
      tenantId: n.tenantId?.toString(),
      userId: n.userId.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      actionUrl: n.actionUrl,
      createdAt: n.createdAt,
    })))
  } catch (err) {
    console.error('[notifications GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    const { markAllRead } = await req.json()
    await connectToDatabase()

    if (markAllRead) {
      const tenantFilter = isValidObjectId(ctx.tenantId)
        ? { $or: [{ tenantId: ctx.tenantId }, { tenantId: { $exists: false } }] }
        : { $or: [{ tenantId: { $exists: false } }] }
      await Notification.updateMany(
        { userId: ctx.userId, read: false, ...tenantFilter },
        { read: true }
      )
    }

    return NextResponse.json({ message: 'Updated' })
  } catch (err) {
    console.error('[notifications PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

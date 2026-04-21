import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Notification from '@/lib/models/Notification'

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')!
    await connectToDatabase()

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json(notifications.map(n => ({
      id: n._id.toString(),
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
    const userId = req.headers.get('x-user-id')!
    const { markAllRead } = await req.json()
    await connectToDatabase()

    if (markAllRead) {
      await Notification.updateMany({ userId, read: false }, { read: true })
    }

    return NextResponse.json({ message: 'Updated' })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

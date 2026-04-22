import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/mongodb'
import Workflow from '@/lib/models/Workflow'
import Batch from '@/lib/models/Batch'

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const userId = req.headers.get('x-user-id')
    const role = req.headers.get('x-user-role')

    const filter: Record<string, unknown> = {}
    if (type && type !== 'all') filter.type = type

    // Non-admins only see active workflows
    if (role !== 'admin') {
      filter.isActive = true
    }

    // Annotators and reviewers only see workflows they are assigned to
    if ((role === 'annotator' || role === 'reviewer') && userId) {
      filter.assignedUsers = new mongoose.Types.ObjectId(userId)
    }

    const workflows = await Workflow.find(filter).sort({ createdAt: -1 }).lean()

    const workflowsWithStats = await Promise.all(
      workflows.map(async (w) => {
        const batches = await Batch.find({ workflowId: w._id }).lean()
        return {
          id: w._id.toString(),
          name: w.name,
          description: w.description,
          type: w.type,
          isActive: w.isActive,
          assignedUsers: (w.assignedUsers || []).map((id: unknown) => id?.toString()),
          batchCount: batches.length,
          taskCount: batches.reduce((s, b) => s + b.tasksTotal, 0),
          createdAt: w.createdAt,
        }
      })
    )

    return NextResponse.json(workflowsWithStats)
  } catch (err) {
    console.error('[workflows GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role')
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    await connectToDatabase()

    const workflow = await Workflow.create({
      ...body,
      createdBy: req.headers.get('x-user-id'),
    })

    return NextResponse.json({ id: workflow._id.toString(), ...workflow.toObject() }, { status: 201 })
  } catch (err) {
    console.error('[workflows POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

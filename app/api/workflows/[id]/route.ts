import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Workflow from '@/lib/models/Workflow'
import Batch from '@/lib/models/Batch'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()

    const workflow = await Workflow.findById(id).lean()
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const batches = await Batch.find({ workflowId: id }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      id: workflow._id.toString(),
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
      isActive: workflow.isActive,
      createdAt: workflow.createdAt,
      batches: batches.map(b => ({
        id: b._id.toString(),
        workflowId: b.workflowId.toString(),
        workflowName: b.workflowName,
        title: b.title,
        description: b.description,
        taskType: b.taskType,
        priority: b.priority,
        workloadEstimate: b.workloadEstimate,
        status: b.status,
        tasksTotal: b.tasksTotal,
        tasksCompleted: b.tasksCompleted,
        deadline: b.deadline,
        createdAt: b.createdAt,
      })),
    })
  } catch (err) {
    console.error('[workflows/[id] GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role')
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    await connectToDatabase()

    const workflow = await Workflow.findByIdAndUpdate(id, body, { new: true }).lean()
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ id: workflow._id.toString(), ...workflow })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role')
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    await connectToDatabase()

    const workflow = await Workflow.findById(id)
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (body.action === 'assign') {
      const { userId } = body
      if (!workflow.assignedUsers.map((u: unknown) => u?.toString()).includes(userId)) {
        workflow.assignedUsers.push(userId)
        await workflow.save()
      }
    } else if (body.action === 'unassign') {
      const { userId } = body
      workflow.assignedUsers = workflow.assignedUsers.filter((u: unknown) => u?.toString() !== userId) as typeof workflow.assignedUsers
      await workflow.save()
    }

    return NextResponse.json({
      id: workflow._id.toString(),
      assignedUsers: workflow.assignedUsers.map((u: unknown) => u?.toString()),
    })
  } catch (err) {
    console.error('[workflows/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectToDatabase()
    await Workflow.findByIdAndDelete(id)
    return NextResponse.json({ message: 'Deleted' })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

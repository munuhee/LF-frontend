import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Task from '@/lib/models/Task'
import Batch from '@/lib/models/Batch'
import { requireTenant, isClientAdmin, isValidObjectId } from '@/lib/tenant'

// POST /api/tasks/bulk
export async function POST(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { batchId, tasks, metadata = {} } = body

    if (!batchId) return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'tasks must be a non-empty array' }, { status: 400 })
    }

    await connectToDatabase()
    const bf = isValidObjectId(ctx.tenantId) ? { tenantId: ctx.tenantId } : {}
    const batch = await Batch.findOne({ _id: batchId, ...bf })
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

    const created: string[] = []
    const errors: { index: number; error: string }[] = []

    const globalMeta: Record<string, unknown> = {}
    if (metadata.priority != null)        globalMeta.priority = Number(metadata.priority)
    if (metadata.difficulty)              globalMeta.difficulty = metadata.difficulty
    if (metadata.estimatedDuration)       globalMeta.estimatedDuration = Number(metadata.estimatedDuration)
    if (metadata.sla)                     globalMeta.sla = new Date(metadata.sla)
    if (metadata.languageTags) {
      globalMeta.languageTags = Array.isArray(metadata.languageTags)
        ? metadata.languageTags
        : String(metadata.languageTags).split(',').map((t: string) => t.trim()).filter(Boolean)
    }

    for (let i = 0; i < tasks.length; i++) {
      const raw = tasks[i]
      if (!raw.title) { errors.push({ index: i, error: 'Missing required field: title' }); continue }

      try {
        const taskDoc: Record<string, unknown> = {
          tenantId:          ctx.tenantId,
          projectId:         batch.projectId,
          batchId:           batch._id,
          batchTitle:        batch.title,
          workflowId:        batch.workflowId,
          workflowName:      batch.workflowName,
          taskType:          batch.taskType,
          status:            'unclaimed',
          priority:          batch.priority,
          estimatedDuration: 30,
          ...globalMeta,
          ...raw,
        }

        if (typeof taskDoc.languageTags === 'string') {
          taskDoc.languageTags = (taskDoc.languageTags as string)
            .split(',').map((t: string) => t.trim()).filter(Boolean)
        }
        if (taskDoc.priority) taskDoc.priority = Number(taskDoc.priority)
        if (taskDoc.estimatedDuration) taskDoc.estimatedDuration = Number(taskDoc.estimatedDuration)

        const task = await Task.create(taskDoc)
        created.push(task._id.toString())
      } catch (err) {
        errors.push({ index: i, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    if (created.length > 0) {
      await Batch.findByIdAndUpdate(batchId, { $inc: { tasksTotal: created.length } })
    }

    return NextResponse.json({
      created: created.length,
      errors: errors.length,
      errorDetails: errors,
      taskIds: created,
    }, { status: errors.length > 0 && created.length === 0 ? 400 : 201 })
  } catch (err) {
    console.error('[tasks/bulk POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

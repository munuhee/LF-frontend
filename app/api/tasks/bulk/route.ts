import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Task from '@/lib/models/Task'
import Batch from '@/lib/models/Batch'

// POST /api/tasks/bulk
// Body: {
//   batchId: string,
//   tasks: Array<{ title, externalUrl, description?, estimatedDuration?, priority?, difficulty?, languageTags? }>,
//   metadata: { priority?, difficulty?, languageTags?, sla?, estimatedDuration? }   <- applied to all unless overridden
// }
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role')
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { batchId, tasks, metadata = {} } = body

    if (!batchId) return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'tasks must be a non-empty array' }, { status: 400 })
    }

    await connectToDatabase()
    const batch = await Batch.findById(batchId)
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

    const created: string[] = []
    const errors: { index: number; error: string }[] = []

    // Normalise global metadata
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
        // Per-task fields override global metadata
        const taskDoc: Record<string, unknown> = {
          batchId:           batch._id,
          batchTitle:        batch.title,
          workflowId:        batch.workflowId,
          workflowName:      batch.workflowName,
          taskType:          batch.taskType,
          status:            'unclaimed',
          // Global metadata defaults
          priority:          batch.priority,
          estimatedDuration: 30,
          ...globalMeta,
          // Per-task overrides (per-task languageTags normalised)
          ...raw,
        }

        // Normalise per-task languageTags if present as a string
        if (typeof taskDoc.languageTags === 'string') {
          taskDoc.languageTags = (taskDoc.languageTags as string)
            .split(',').map((t: string) => t.trim()).filter(Boolean)
        }
        // Normalise numeric fields
        if (taskDoc.priority) taskDoc.priority = Number(taskDoc.priority)
        if (taskDoc.estimatedDuration) taskDoc.estimatedDuration = Number(taskDoc.estimatedDuration)

        const task = await Task.create(taskDoc)
        created.push(task._id.toString())
      } catch (err) {
        errors.push({ index: i, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    // Increment batch.tasksTotal by number of successfully created tasks
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

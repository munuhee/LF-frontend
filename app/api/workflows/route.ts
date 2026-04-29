import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/mongodb'
import Workflow from '@/lib/models/Workflow'
import Batch from '@/lib/models/Batch'
import { requireTenant, isClientAdmin, isSuperAdmin, isValidObjectId } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx

    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const projectId = searchParams.get('projectId')
    const clientSlugParam = searchParams.get('clientSlug')
    const clientIdParam = searchParams.get('clientId')
    const { userId, role } = ctx
    let { tenantId } = ctx

    // Resolve tenantId for super_admin who may pass clientSlug/clientId as query param
    if (!isValidObjectId(tenantId) && isSuperAdmin(role)) {
      if (clientSlugParam) {
        const client = await (await import('@/lib/models/Client')).default.findOne({ slug: clientSlugParam }).lean()
        if (client) tenantId = (client._id as { toString(): string }).toString()
      } else if (clientIdParam && isValidObjectId(clientIdParam)) {
        tenantId = clientIdParam
      }
    }

    const filter: Record<string, unknown> = isValidObjectId(tenantId) ? { tenantId } : {}
    if (type && type !== 'all') filter.type = type
    if (projectId) filter.projectId = projectId

    // Non-admin roles only see active workflows
    if (!isClientAdmin(role)) {
      filter.isActive = true
    }

    // Annotators and reviewers only see workflows they are assigned to
    if ((role === 'annotator' || role === 'reviewer') && userId) {
      filter.assignedUsers = new mongoose.Types.ObjectId(userId)
    }

    const workflows = await Workflow.find(filter).sort({ createdAt: -1 }).lean()

    const workflowsWithStats = await Promise.all(
      workflows.map(async (w) => {
        const batchFilter: Record<string, unknown> = { workflowId: w._id }
        if (isValidObjectId(tenantId)) batchFilter.tenantId = tenantId
        const batches = await Batch.find(batchFilter).lean()
        return {
          id: w._id.toString(),
          tenantId: w.tenantId.toString(),
          projectId: w.projectId?.toString(),
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
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    await connectToDatabase()

    const workflow = await Workflow.create({
      ...body,
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
    })

    return NextResponse.json({ id: workflow._id.toString(), ...workflow.toObject() }, { status: 201 })
  } catch (err) {
    console.error('[workflows POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

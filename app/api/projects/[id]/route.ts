import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import { requireTenant, isClientAdmin, forbidden } from '@/lib/tenant'

// GET /api/projects/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = requireTenant(req)
  if (ctx instanceof NextResponse) return ctx

  await connectToDatabase()
  const project = await Project.findOne({ _id: id, tenantId: ctx.tenantId }).lean()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: project._id.toString(),
    tenantId: project.tenantId.toString(),
    name: project.name,
    description: project.description,
    guidelines: project.guidelines,
    taskTypes: project.taskTypes,
    workflowStages: project.workflowStages,
    isActive: project.isActive,
    createdAt: project.createdAt,
  })
}

// PUT /api/projects/[id] — update (client_admin or super_admin)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = requireTenant(req)
  if (ctx instanceof NextResponse) return ctx
  if (!isClientAdmin(ctx.role)) return forbidden()

  const body = await req.json()
  const allowed = ['name', 'description', 'guidelines', 'taskTypes', 'workflowStages', 'isActive'] as const
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  await connectToDatabase()
  const project = await Project.findOneAndUpdate(
    { _id: id, tenantId: ctx.tenantId },
    update,
    { new: true }
  ).lean()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: project._id.toString(),
    name: project.name,
    guidelines: project.guidelines,
    taskTypes: project.taskTypes,
    workflowStages: project.workflowStages,
    isActive: project.isActive,
  })
}

// DELETE /api/projects/[id] — soft-delete (client_admin or super_admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = requireTenant(req)
  if (ctx instanceof NextResponse) return ctx
  if (!isClientAdmin(ctx.role)) return forbidden()

  await connectToDatabase()
  await Project.findOneAndUpdate({ _id: id, tenantId: ctx.tenantId }, { isActive: false })
  return NextResponse.json({ success: true })
}

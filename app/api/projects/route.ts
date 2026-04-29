import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import { requireTenant, isClientAdmin, forbidden } from '@/lib/tenant'

// GET /api/projects — list projects for the current client workspace
export async function GET(req: NextRequest) {
  const ctx = requireTenant(req)
  if (ctx instanceof NextResponse) return ctx

  await connectToDatabase()
  const projects = await Project.find({ tenantId: ctx.tenantId, isActive: true })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json(
    projects.map(p => ({
      id: p._id.toString(),
      tenantId: p.tenantId.toString(),
      name: p.name,
      description: p.description,
      guidelines: p.guidelines,
      taskTypes: p.taskTypes,
      workflowStages: p.workflowStages,
      isActive: p.isActive,
      createdAt: p.createdAt,
    }))
  )
}

// POST /api/projects — create a project (client_admin or super_admin)
export async function POST(req: NextRequest) {
  const ctx = requireTenant(req)
  if (ctx instanceof NextResponse) return ctx

  if (!isClientAdmin(ctx.role)) return forbidden()

  const body = await req.json()
  const { name, description, guidelines, taskTypes, workflowStages } = body

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  await connectToDatabase()
  const project = await Project.create({
    tenantId: ctx.tenantId,
    name,
    description,
    guidelines,
    taskTypes: taskTypes ?? [],
    workflowStages: workflowStages ?? ['annotation', 'review'],
    createdBy: ctx.userId,
  })

  return NextResponse.json(
    {
      id: project._id.toString(),
      tenantId: project.tenantId.toString(),
      name: project.name,
      description: project.description,
      guidelines: project.guidelines,
      taskTypes: project.taskTypes,
      workflowStages: project.workflowStages,
      isActive: project.isActive,
      createdAt: project.createdAt,
    },
    { status: 201 }
  )
}

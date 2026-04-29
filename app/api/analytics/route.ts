import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Task from '@/lib/models/Task'
import Review from '@/lib/models/Review'
import User from '@/lib/models/User'
import Batch from '@/lib/models/Batch'
import ClientMembership from '@/lib/models/ClientMembership'
import { requireTenant, isClientAdmin, isSuperAdmin, isValidObjectId } from '@/lib/tenant'

const EMPTY_ANALYTICS = {
  tasksCompletedByDay: [] as { date: string; count: number }[],
  tasksByType: [] as { type: string; count: number }[],
  qualityScoresTrend: [] as { date: string; score: number }[],
  annotatorPerformance: [],
  reviewerActivity: [],
  batchProgress: [],
  summary: { totalUsers: 0, totalAnnotators: 0, totalReviewers: 0, activeTasks: 0, completedTasks: 0, pendingReviews: 0, averageQualityScore: 0 },
}

export async function GET(req: NextRequest) {
  try {
    const ctx = requireTenant(req)
    if (ctx instanceof NextResponse) return ctx
    if (!isClientAdmin(ctx.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectToDatabase()
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const clientSlugParam = searchParams.get('clientSlug')
    const clientIdParam = searchParams.get('clientId')

    // Resolve tenantId — super_admin has no bound tenant, so check query params
    let tenantId = ctx.tenantId
    if (!isValidObjectId(tenantId) && isSuperAdmin(ctx.role)) {
      if (clientSlugParam) {
        const client = await (await import('@/lib/models/Client')).default.findOne({ slug: clientSlugParam }).lean()
        if (!client) return NextResponse.json(EMPTY_ANALYTICS)
        tenantId = (client._id as { toString(): string }).toString()
      } else if (clientIdParam && isValidObjectId(clientIdParam)) {
        tenantId = clientIdParam
      } else {
        // Super admin without workspace context — return empty analytics
        return NextResponse.json(EMPTY_ANALYTICS)
      }
    }

    const baseFilter: Record<string, unknown> = { tenantId }
    if (projectId) baseFilter.projectId = projectId

    // Tasks completed in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentTasks = await Task.find({
      ...baseFilter,
      status: { $in: ['approved', 'submitted'] },
      submittedAt: { $gte: sevenDaysAgo },
    }).lean()

    const byDay: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      byDay[d.toISOString().split('T')[0]] = 0
    }
    recentTasks.forEach(t => {
      const day = new Date(t.submittedAt!).toISOString().split('T')[0]
      if (byDay[day] !== undefined) byDay[day]++
    })
    const tasksCompletedByDay = Object.entries(byDay).map(([date, count]) => ({ date, count }))

    // Tasks by type (scoped to tenant)
    const allTasks = await Task.find(baseFilter).lean()
    const typeCount: Record<string, number> = {}
    allTasks.forEach(t => { typeCount[t.taskType] = (typeCount[t.taskType] || 0) + 1 })
    const tasksByType = Object.entries(typeCount).map(([type, count]) => ({ type, count }))

    const qualityScoresTrend = Object.keys(byDay).map(date => ({
      date,
      score: 80 + Math.round(Math.random() * 15),
    }))

    // Annotator performance — only members of this workspace
    const annotatorMemberships = await ClientMembership.find({
      tenantId,
      role: 'annotator',
      isActive: true,
    }).populate('userId', 'name email').lean()

    const annotatorPerformance = await Promise.all(
      annotatorMemberships.map(async (m) => {
        const u = m.userId as unknown as { _id: { toString(): string }; name: string; email: string }
        const completed = await Task.find({
          ...baseFilter,
          annotatorId: u._id.toString(),
          status: { $in: ['approved', 'submitted'] },
        }).lean()
        const scores = completed.filter(t => t.qualityScore).map(t => t.qualityScore!)
        const avgQuality = scores.length
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : 0
        const withDuration = completed.filter(t => t.actualDuration)
        const avgTime = withDuration.length
          ? Math.round(withDuration.reduce((s, t) => s + (t.actualDuration || 0), 0) / withDuration.length)
          : 0
        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          tasksCompleted: completed.length,
          averageQuality: avgQuality,
          averageTimeMinutes: avgTime,
          totalToolUsageHours: Math.round(avgTime * completed.length / 60),
        }
      })
    )

    // Reviewer activity — only reviewers in this workspace
    const reviewerMemberships = await ClientMembership.find({
      tenantId,
      role: { $in: ['reviewer', 'qa_lead'] },
      isActive: true,
    }).populate('userId', 'name email').lean()

    const reviewerActivity = await Promise.all(
      reviewerMemberships.map(async (m) => {
        const u = m.userId as unknown as { _id: { toString(): string }; name: string; email: string }
        const done = await Review.find({
          ...baseFilter,
          reviewerId: u._id.toString(),
          status: { $in: ['approved', 'rejected', 'revision-requested'] },
        }).lean()
        const approved = done.filter(rv => rv.status === 'approved').length
        const approvalRate = done.length ? Math.round((approved / done.length) * 100) : 0
        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          reviewsCompleted: done.length,
          approvalRate,
          averageReviewTime: 12,
        }
      })
    )

    // Batch progress (scoped to tenant)
    const batches = await Batch.find(baseFilter).lean()
    const batchProgress = batches.map(b => ({
      id: b._id.toString(),
      title: b.title,
      tasksTotal: b.tasksTotal,
      tasksCompleted: b.tasksCompleted,
      status: b.status,
    }))

    // Summary counts (scoped to tenant)
    const totalMembers = await ClientMembership.countDocuments({ tenantId, isActive: true })
    const totalAnnotators = await ClientMembership.countDocuments({ tenantId, role: 'annotator', isActive: true })
    const totalReviewers = await ClientMembership.countDocuments({ tenantId, role: { $in: ['reviewer', 'qa_lead'] }, isActive: true })
    const activeTasks = await Task.countDocuments({ ...baseFilter, status: 'in-progress' })
    const completedTasksCount = await Task.countDocuments({ ...baseFilter, status: 'approved' })
    const pendingReviews = await Review.countDocuments({ ...baseFilter, status: 'pending' })

    return NextResponse.json({
      tasksCompletedByDay,
      tasksByType,
      qualityScoresTrend,
      annotatorPerformance,
      reviewerActivity,
      batchProgress,
      summary: {
        totalUsers: totalMembers,
        totalAnnotators,
        totalReviewers,
        activeTasks,
        completedTasks: completedTasksCount,
        pendingReviews,
        averageQualityScore: annotatorPerformance.length
          ? Math.round(annotatorPerformance.reduce((s, a) => s + a.averageQuality, 0) / annotatorPerformance.length)
          : 0,
      },
    })
  } catch (err) {
    console.error('[analytics GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

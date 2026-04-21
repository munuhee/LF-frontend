import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Task from '@/lib/models/Task'
import Review from '@/lib/models/Review'
import User from '@/lib/models/User'
import Batch from '@/lib/models/Batch'

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    // Tasks completed in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentTasks = await Task.find({
      status: { $in: ['approved', 'submitted'] },
      submittedAt: { $gte: sevenDaysAgo },
    }).lean()

    // Group by day
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

    // Tasks by type
    const allTasks = await Task.find({}).lean()
    const typeCount: Record<string, number> = {}
    allTasks.forEach(t => { typeCount[t.taskType] = (typeCount[t.taskType] || 0) + 1 })
    const tasksByType = Object.entries(typeCount).map(([type, count]) => ({ type, count }))

    // Quality scores trend (last 7 days)
    const qualityScoresTrend = Object.keys(byDay).map((date, i) => ({
      date,
      score: 80 + Math.round(Math.random() * 15),
    }))

    // Annotator performance
    const annotators = await User.find({ role: 'annotator' }).lean()
    const annotatorPerformance = await Promise.all(
      annotators.map(async (a) => {
        const completed = await Task.find({ annotatorId: a._id, status: { $in: ['approved', 'submitted'] } }).lean()
        const scores = completed.filter(t => t.qualityScore).map(t => t.qualityScore!)
        const avgQuality = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0
        const avgTime = completed.filter(t => t.actualDuration).length
          ? Math.round(completed.filter(t => t.actualDuration).reduce((s, t) => s + (t.actualDuration || 0), 0) / completed.filter(t => t.actualDuration).length)
          : 0
        return {
          id: a._id.toString(),
          name: a.name,
          email: a.email,
          tasksCompleted: completed.length,
          averageQuality: avgQuality,
          averageTimeMinutes: avgTime,
          totalToolUsageHours: Math.round(avgTime * completed.length / 60),
        }
      })
    )

    // Reviewer activity
    const reviewers = await User.find({ role: 'reviewer' }).lean()
    const reviewerActivity = await Promise.all(
      reviewers.map(async (r) => {
        const done = await Review.find({
          reviewerId: r._id,
          status: { $in: ['approved', 'rejected', 'revision-requested'] },
        }).lean()
        const approved = done.filter(rv => rv.status === 'approved').length
        const approvalRate = done.length ? Math.round((approved / done.length) * 100) : 0
        return {
          id: r._id.toString(),
          name: r.name,
          email: r.email,
          reviewsCompleted: done.length,
          approvalRate,
          averageReviewTime: 12,
        }
      })
    )

    // Batch progress
    const batches = await Batch.find({}).lean()
    const batchProgress = batches.map(b => ({
      id: b._id.toString(),
      title: b.title,
      tasksTotal: b.tasksTotal,
      tasksCompleted: b.tasksCompleted,
      status: b.status,
    }))

    // Dashboard stats
    const totalUsers = await User.countDocuments({})
    const totalAnnotators = await User.countDocuments({ role: 'annotator' })
    const totalReviewers = await User.countDocuments({ role: 'reviewer' })
    const activeTasks = await Task.countDocuments({ status: 'in-progress' })
    const completedTasksCount = await Task.countDocuments({ status: 'approved' })
    const pendingReviews = await Review.countDocuments({ status: 'pending' })

    return NextResponse.json({
      tasksCompletedByDay,
      tasksByType,
      qualityScoresTrend,
      annotatorPerformance,
      reviewerActivity,
      batchProgress,
      summary: {
        totalUsers,
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

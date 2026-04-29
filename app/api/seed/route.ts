import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Client from '@/lib/models/Client'
import ClientMembership from '@/lib/models/ClientMembership'
import Project from '@/lib/models/Project'
import Workflow from '@/lib/models/Workflow'
import Batch from '@/lib/models/Batch'
import Task from '@/lib/models/Task'
import Review from '@/lib/models/Review'
import Notification from '@/lib/models/Notification'

const now = Date.now()
const ago = (ms: number) => new Date(now - ms)
const h = (n: number) => n * 60 * 60 * 1000
const d = (n: number) => n * 24 * 60 * 60 * 1000

export async function POST() {
  try {
    await connectToDatabase()

    await Promise.all([
      User.deleteMany({}),
      Client.deleteMany({}),
      ClientMembership.deleteMany({}),
      Project.deleteMany({}),
      Workflow.deleteMany({}),
      Batch.deleteMany({}),
      Task.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
    ])

    // ── Passwords ─────────────────────────────────────────────────────────────
    const [
      pwSuper,
      pwAnnotator, pwAnnotator2, pwAnnotator3, pwAnnotator4,
      pwReviewer, pwQaLead, pwAdmin,
      pwTlAnnotator, pwTlAnnotator2, pwTlReviewer, pwTlAdmin,
    ] = await Promise.all([
      bcrypt.hash('superadmin123!', 12),
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('reviewer123!', 12),
      bcrypt.hash('reviewer123!', 12),
      bcrypt.hash('admin123!', 12),
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('reviewer123!', 12),
      bcrypt.hash('admin123!', 12),
    ])

    // ── Users — all @labelforge.ai regardless of client ───────────────────────
    const [superAdmin, wanjiru, odhiambo, njeri, kipchoge, amina, mutua, zawadi] =
      await User.insertMany([
        {
          name: 'System Administrator', email: 'superadmin@labelforge.ai',
          passwordHash: pwSuper, role: 'super_admin', department: 'Platform', isActive: true,
          badges: [{ type: 'role', name: 'Super Admin', description: 'Full system access', awardedAt: ago(d(90)) }],
        },
        {
          name: 'Wanjiru Kamau', email: 'wanjiru.kamau@labelforge.ai',
          passwordHash: pwAnnotator, role: 'annotator', department: 'AI Data Team', isActive: true,
          badges: [
            { type: 'role',      name: 'Annotator',  description: 'Certified annotator',      awardedAt: ago(d(30)) },
            { type: 'expertise', name: 'Agentic AI', description: 'Agentic AI specialist',    awardedAt: ago(d(15)) },
            { type: 'level',     name: 'Senior',     description: 'Senior-level contributor', awardedAt: ago(d(7))  },
          ],
        },
        {
          name: 'Odhiambo Otieno', email: 'odhiambo.otieno@labelforge.ai',
          passwordHash: pwAnnotator2, role: 'annotator', department: 'AI Data Team', isActive: true,
          badges: [
            { type: 'role',      name: 'Annotator',    description: 'Certified annotator',      awardedAt: ago(d(20)) },
            { type: 'expertise', name: 'Agentic AI',   description: 'Agentic AI specialist',    awardedAt: ago(d(10)) },
            { type: 'level',     name: 'Intermediate', description: 'Intermediate contributor', awardedAt: ago(d(5))  },
          ],
        },
        {
          name: 'Njeri Mwangi', email: 'njeri.mwangi@labelforge.ai',
          passwordHash: pwAnnotator3, role: 'annotator', department: 'AI Data Team', isActive: true,
          badges: [
            { type: 'role',      name: 'Annotator',  description: 'Certified annotator',   awardedAt: ago(d(25)) },
            { type: 'expertise', name: 'Agentic AI', description: 'Agentic AI specialist', awardedAt: ago(d(12)) },
            { type: 'level',     name: 'Senior',     description: 'Senior contributor',    awardedAt: ago(d(8))  },
          ],
        },
        {
          name: 'Kipchoge Ruto', email: 'kipchoge.ruto@labelforge.ai',
          passwordHash: pwAnnotator4, role: 'annotator', department: 'AI Data Team', isActive: true,
          badges: [
            { type: 'role',  name: 'Annotator', description: 'Certified annotator', awardedAt: ago(d(10)) },
            { type: 'level', name: 'Junior',    description: 'Junior contributor',  awardedAt: ago(d(3))  },
          ],
        },
        {
          name: 'Amina Hassan', email: 'amina.hassan@labelforge.ai',
          passwordHash: pwReviewer, role: 'reviewer', department: 'Quality Assurance', isActive: true,
          badges: [
            { type: 'role',      name: 'Reviewer',   description: 'Certified QA reviewer',    awardedAt: ago(d(40)) },
            { type: 'level',     name: 'Senior',     description: 'Senior reviewer',          awardedAt: ago(d(20)) },
            { type: 'expertise', name: 'Agentic AI', description: 'Agentic AI QA specialist', awardedAt: ago(d(8))  },
          ],
        },
        {
          name: 'Mutua Kibet', email: 'mutua.kibet@labelforge.ai',
          passwordHash: pwQaLead, role: 'qa_lead', department: 'Quality Assurance', isActive: true,
          badges: [
            { type: 'role',  name: 'QA Lead',      description: 'QA Lead reviewer',      awardedAt: ago(d(18)) },
            { type: 'level', name: 'Intermediate', description: 'Intermediate reviewer', awardedAt: ago(d(5))  },
          ],
        },
        {
          name: 'Zawadi Ndungu', email: 'zawadi.ndungu@labelforge.ai',
          passwordHash: pwAdmin, role: 'client_admin', department: 'Operations', isActive: true,
          badges: [{ type: 'role', name: 'Workspace Admin', description: 'Acme Corp administrator', awardedAt: ago(d(60)) }],
        },
      ])

    // ── TechLab users ─────────────────────────────────────────────────────────
    const [tlAdmin, tlReviewer, tlAnnotator1, tlAnnotator2] =
      await User.insertMany([
        {
          name: 'Fatima Al-Rashid', email: 'fatima.alrashid@labelforge.ai',
          passwordHash: pwTlAdmin, role: 'client_admin', department: 'Engineering', isActive: true,
          badges: [{ type: 'role', name: 'Workspace Admin', description: 'TechLab administrator', awardedAt: ago(d(45)) }],
        },
        {
          name: 'Marcus Osei', email: 'marcus.osei@labelforge.ai',
          passwordHash: pwTlReviewer, role: 'reviewer', department: 'Research', isActive: true,
          badges: [
            { type: 'role',      name: 'Reviewer',  description: 'LLM reviewer',         awardedAt: ago(d(30)) },
            { type: 'expertise', name: 'Agentic AI', description: 'Agentic AI specialist', awardedAt: ago(d(14)) },
            { type: 'level',     name: 'Senior',    description: 'Senior contributor',   awardedAt: ago(d(7))  },
          ],
        },
        {
          name: 'Priya Sharma', email: 'priya.sharma@labelforge.ai',
          passwordHash: pwTlAnnotator, role: 'annotator', department: 'Research', isActive: true,
          badges: [
            { type: 'role',  name: 'Annotator', description: 'Certified annotator', awardedAt: ago(d(20)) },
            { type: 'level', name: 'Senior',    description: 'Senior contributor',  awardedAt: ago(d(10)) },
          ],
        },
        {
          name: 'James Okonkwo', email: 'james.okonkwo@labelforge.ai',
          passwordHash: pwTlAnnotator2, role: 'annotator', department: 'Research', isActive: true,
          badges: [
            { type: 'role',  name: 'Annotator', description: 'Certified annotator', awardedAt: ago(d(15)) },
            { type: 'level', name: 'Junior',    description: 'Junior contributor',  awardedAt: ago(d(5))  },
          ],
        },
      ])

    // ── Clients ───────────────────────────────────────────────────────────────
    const [acmeCorp, techLab] = await Client.insertMany([
      {
        name: 'Acme Corp', slug: 'acme-corp',
        description: 'Enterprise AI data annotation for e-commerce and fintech workflows',
        plan: 'pro', isActive: true, createdBy: superAdmin._id,
      },
      {
        name: 'TechLab', slug: 'techlab',
        description: 'AI training data platform for research and evaluation',
        plan: 'starter', isActive: true, createdBy: superAdmin._id,
      },
    ])

    // ── Memberships ───────────────────────────────────────────────────────────
    await ClientMembership.insertMany([
      { userId: zawadi._id,   tenantId: acmeCorp._id, role: 'client_admin', isActive: true, joinedAt: ago(d(60)) },
      { userId: amina._id,    tenantId: acmeCorp._id, role: 'reviewer',     isActive: true, joinedAt: ago(d(40)) },
      { userId: mutua._id,    tenantId: acmeCorp._id, role: 'qa_lead',      isActive: true, joinedAt: ago(d(35)) },
      { userId: wanjiru._id,  tenantId: acmeCorp._id, role: 'annotator',          isActive: true, joinedAt: ago(d(30)) },
      { userId: odhiambo._id, tenantId: acmeCorp._id, role: 'annotator',          isActive: true, joinedAt: ago(d(28)) },
      { userId: njeri._id,    tenantId: acmeCorp._id, role: 'annotator',          isActive: true, joinedAt: ago(d(25)) },
      { userId: kipchoge._id, tenantId: acmeCorp._id, role: 'reviewer_annotator', isActive: true, joinedAt: ago(d(22)) },
    ])
    await ClientMembership.insertMany([
      { userId: tlAdmin._id,      tenantId: techLab._id, role: 'client_admin', isActive: true, joinedAt: ago(d(45)) },
      { userId: tlReviewer._id,   tenantId: techLab._id, role: 'reviewer',     isActive: true, joinedAt: ago(d(30)) },
      { userId: tlAnnotator1._id, tenantId: techLab._id, role: 'annotator',    isActive: true, joinedAt: ago(d(20)) },
      { userId: tlAnnotator2._id, tenantId: techLab._id, role: 'annotator',    isActive: true, joinedAt: ago(d(15)) },
    ])

    // ── Projects ──────────────────────────────────────────────────────────────
    const [acmeProject, tlProject] = await Project.insertMany([
      {
        tenantId: acmeCorp._id,
        name: 'Agentic AI Evaluation',
        description: 'Browser-agent task evaluation across platforms',
        guidelines: '## Guidelines\n\n- Use the LabelForge browser extension\n- Document every UI state in detailed notes\n- Never enter real personal data\n- Capture screenshots at each key step',
        taskTypes: ['agentic-ai'],
        workflowStages: ['annotation', 'review', 'qa'],
        isActive: true, createdBy: zawadi._id,
      },
      {
        tenantId: techLab._id,
        name: 'Agentic AI Evaluation',
        description: 'Agent task completion evaluation for research',
        guidelines: '## Guidelines\n\n- Follow the task steps precisely\n- Document every navigation state\n- Use test credentials only\n- Note any unexpected UI behaviour',
        taskTypes: ['agentic-ai'],
        workflowStages: ['annotation', 'review'],
        isActive: true, createdBy: tlAdmin._id,
      },
    ])

    // ═════════════════════════════════════════════════════════════════════════
    // ACME-CORP — 1 workflow, 1 batch, 8 tasks
    // ═════════════════════════════════════════════════════════════════════════

    const everyone = [wanjiru._id, odhiambo._id, njeri._id, kipchoge._id, amina._id, mutua._id, zawadi._id]
    const acTid = acmeCorp._id
    const acPid = acmeProject._id

    const [acWF] = await Workflow.insertMany([{
      tenantId: acTid, projectId: acPid,
      name: 'Agentic AI Evaluation',
      description: 'Evaluate AI agents completing multi-step browser tasks on real platforms',
      type: 'agentic-ai', isActive: true, assignedUsers: everyone, createdBy: zawadi._id,
    }])

    const [acBatch] = await Batch.insertMany([{
      tenantId: acTid, projectId: acPid,
      workflowId: acWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Agentic AI Tasks',
      description: 'Web navigation and interaction tasks across e-commerce, government, financial, and social platforms',
      instructions: '1. Open the URL with the LabelForge extension active\n2. Complete the task exactly as described\n3. Document every distinct UI state in detailed notes\n4. Note obstacles, unexpected flows, or errors\n5. Submit only when all required steps are complete',
      taskType: 'agentic-ai', priority: 0.90, workloadEstimate: 60,
      status: 'in-progress', tasksTotal: 8, tasksCompleted: 1,
      deadline: new Date(now + d(21)), createdBy: zawadi._id,
    }])

    const acBase = { tenantId: acTid, projectId: acPid, workflowId: acWF._id, workflowName: 'Agentic AI Evaluation', taskType: 'agentic-ai', batchId: acBatch._id, batchTitle: 'Agentic AI Tasks' }
    const acLog = (action: string, user: typeof wanjiru, comment?: string, ts?: Date) => ({ action, userId: user._id.toString(), userEmail: user.email, comment, timestamp: ts ?? new Date() })
    const acEtag = (id: string, sev: 'major' | 'minor', cat: string, msg: string, reviewer: typeof amina, stepRef?: string, deduct?: number) => ({
      tagId: id, severity: sev, category: cat, message: msg, stepReference: stepRef,
      scoreDeduction: deduct ?? (sev === 'major' ? 20 : 5),
      status: 'open' as const, createdBy: reviewer._id.toString(), createdByEmail: reviewer.email,
    })

    // t1: unclaimed
    const t1 = await Task.create({ ...acBase, title: 'Search and add item to wishlist on Amazon', description: 'Navigate to Amazon.com, search for "Samsung Galaxy Buds", apply the price filter (under $50), open the top result, and add it to your wishlist. Document the complete flow.', status: 'unclaimed', priority: 0.95, difficulty: 'easy', languageTags: ['en'], externalUrl: 'https://www.amazon.com', estimatedDuration: 20, sla: new Date(now + d(3)) })

    // t2: in-progress
    const t2 = await Task.create({ ...acBase, title: 'Book a bus seat on Greyhound — New York to Boston', description: 'Go to Greyhound.com, search for a New York → Boston seat departing tomorrow morning, select the first available seat, fill passenger details with test data, proceed to payment page. Do NOT complete payment.', status: 'in-progress', priority: 0.90, difficulty: 'medium', languageTags: ['en', 'sw'], externalUrl: 'https://www.greyhound.com', estimatedDuration: 30, annotatorId: wanjiru._id, annotatorEmail: wanjiru.email, startedAt: ago(h(2)), sla: new Date(now + d(2)), activityLog: [acLog('claimed', wanjiru, undefined, ago(h(2)))] })

    // t3: submitted
    const t3 = await Task.create({ ...acBase, title: 'Register a new business account on PayPal Business Portal', description: 'Log into the PayPal Business Portal using test credentials, navigate to Business Account Setup, simulate registering a new business account. Document each step.', status: 'submitted', priority: 0.88, difficulty: 'hard', languageTags: ['en', 'sw'], externalUrl: 'https://www.paypal.com/business', estimatedDuration: 45, annotatorId: odhiambo._id, annotatorEmail: odhiambo.email, startedAt: ago(h(5)), submittedAt: ago(h(1)), actualDuration: 42, notes: 'Completed all 4 registration steps. Unexpected OTP screen between step 3 and 4 documented.', activityLog: [acLog('claimed', odhiambo, undefined, ago(h(5))), acLog('submitted', odhiambo, 'Extra OTP screen documented', ago(h(1)))] })

    // t4: in-review
    const t4 = await Task.create({ ...acBase, title: 'Compare motor insurance quotes on Progressive Insurance', description: 'Visit Progressive.com, compare at least 3 comprehensive motor insurance quotes for a 2020 Toyota Corolla. Document the flow.', status: 'in-review', priority: 0.85, difficulty: 'medium', languageTags: ['en'], externalUrl: 'https://www.progressive.com', estimatedDuration: 35, annotatorId: wanjiru._id, annotatorEmail: wanjiru.email, reviewerId: amina._id, reviewerEmail: amina.email, startedAt: ago(h(8)), submittedAt: ago(h(4)), actualDuration: 32, notes: 'Three quotes captured.', errorTags: [acEtag('t4-e1', 'minor', 'low-quality-screenshot', 'Low-Quality Screenshots', amina, 'Screenshot 4')], activityLog: [acLog('claimed', wanjiru, undefined, ago(h(8))), acLog('submitted', wanjiru, 'Three providers compared', ago(h(4))), acLog('in-review', amina, 'Review started', ago(h(2)))] })

    // t5: revision-requested
    const t5 = await Task.create({ ...acBase, title: 'Download tax return transcript from IRS portal', description: 'Log into IRS.gov using test credentials, navigate to Get Transcript, download a tax return transcript, document the complete navigation process.', status: 'revision-requested', priority: 0.82, difficulty: 'hard', languageTags: ['en'], externalUrl: 'https://www.irs.gov', estimatedDuration: 40, annotatorId: kipchoge._id, annotatorEmail: kipchoge.email, reviewerId: mutua._id, reviewerEmail: mutua.email, feedback: 'Navigation screenshots for steps 2–4 are missing.', errorTags: [acEtag('t5-e1', 'major', 'missing-critical-step', 'Missing Critical Steps', mutua, 'Screenshots 2–4', 20), acEtag('t5-e2', 'minor', 'missing-minor-context', 'Missing Minor Context', mutua, 'Notes', 5)], startedAt: ago(d(2)), submittedAt: ago(h(10)), actualDuration: 35, notes: 'Transcript downloaded.', activityLog: [acLog('claimed', kipchoge, undefined, ago(d(2))), acLog('submitted', kipchoge, 'Transcript downloaded', ago(h(10))), acLog('revision-requested', mutua, 'Screenshots missing for steps 2–4', ago(h(6)))] })

    // t6: data-ready (approved)
    const t6 = await Task.create({ ...acBase, title: 'Book a domestic flight on Delta Airlines website', description: 'Go to Delta.com, search for a New York LGA → Los Angeles LAX flight next week, select cheapest fare, fill passenger details with test data. Do NOT proceed to payment.', status: 'data-ready', isLocked: true, priority: 0.85, difficulty: 'medium', languageTags: ['en'], externalUrl: 'https://www.delta.com', estimatedDuration: 25, annotatorId: odhiambo._id, annotatorEmail: odhiambo.email, reviewerId: amina._id, reviewerEmail: amina.email, qualityScore: 93, feedback: 'All required steps captured clearly. Excellent work.', startedAt: ago(d(4)), submittedAt: ago(d(3) + h(3)), completedAt: ago(d(2)), signedOffAt: ago(d(2)), actualDuration: 22, activityLog: [acLog('claimed', odhiambo, undefined, ago(d(4))), acLog('submitted', odhiambo, 'Cheapest fare found', ago(d(3) + h(3))), acLog('signed-off', amina, 'All steps clearly captured.', ago(d(2)))] })

    // t7: rejected
    const t7 = await Task.create({ ...acBase, title: 'Find and apply a discount coupon on Target website', description: 'Go to Target.com, browse the Deals section, find a product with an active discount coupon, add it to cart, apply the coupon at checkout.', status: 'rejected', priority: 0.80, difficulty: 'medium', languageTags: ['en', 'sw'], externalUrl: 'https://www.target.com', estimatedDuration: 28, annotatorId: njeri._id, annotatorEmail: njeri.email, reviewerId: mutua._id, reviewerEmail: mutua.email, feedback: 'Annotator used the search bar instead of navigating via the Offers section.', errorTags: [acEtag('t7-e1', 'major', 'wrong-navigation', 'Completely Wrong Navigation Path', mutua, 'Screenshot 1', 20), acEtag('t7-e2', 'major', 'task-not-completed', 'Task Not Completed Correctly', mutua, 'Screenshot 4', 20)], startedAt: ago(d(3)), submittedAt: ago(d(1) + h(8)), actualDuration: 30, activityLog: [acLog('claimed', njeri, undefined, ago(d(3))), acLog('submitted', njeri, 'Coupon applied', ago(d(1) + h(8))), acLog('rejected', mutua, 'Wrong navigation — Offers section bypassed.', ago(d(1) + h(4)))] })

    // t8: unclaimed
    const t8 = await Task.create({ ...acBase, title: 'Log in and check account balance on Chase Bank', description: 'Go to Chase Bank online banking, log in with test credentials, navigate to Account Summary. Do NOT initiate any transactions.', status: 'unclaimed', priority: 0.78, difficulty: 'easy', languageTags: ['en'], externalUrl: 'https://www.chase.com', estimatedDuration: 15, sla: new Date(now + d(8)) })

    await Batch.findByIdAndUpdate(acBatch._id, { tasksTotal: 8, tasksCompleted: 1 })

    // Acme-corp reviews
    const acRevBase = { tenantId: acTid, projectId: acPid, workflowId: acWF._id }
    await Review.insertMany([
      { ...acRevBase, taskId: t3._id, taskTitle: t3.title, batchId: acBatch._id, batchTitle: acBatch.title, annotatorId: odhiambo._id, annotatorEmail: odhiambo.email, annotatorName: odhiambo.name, status: 'pending', submittedAt: ago(h(1)) },
      { ...acRevBase, taskId: t4._id, taskTitle: t4.title, batchId: acBatch._id, batchTitle: acBatch.title, annotatorId: wanjiru._id, annotatorEmail: wanjiru.email, annotatorName: wanjiru.name, reviewerId: amina._id, reviewerEmail: amina.email, reviewerName: amina.name, status: 'in-review', submittedAt: ago(h(4)) },
      { ...acRevBase, taskId: t5._id, taskTitle: t5.title, batchId: acBatch._id, batchTitle: acBatch.title, annotatorId: kipchoge._id, annotatorEmail: kipchoge.email, annotatorName: kipchoge.name, reviewerId: mutua._id, reviewerEmail: mutua.email, reviewerName: mutua.name, status: 'revision-requested', decision: 'request-rework', comments: 'Navigation screenshots for steps 2–4 are missing.', reasonCode: 'incomplete', errorTags: [{ tagId: 'rv-e1', severity: 'major', category: 'missing-critical-step', message: 'Missing Critical Steps', stepReference: 'Screenshots 2–4', scoreDeduction: 20, status: 'open', createdBy: mutua._id.toString(), createdByEmail: mutua.email }, { tagId: 'rv-e2', severity: 'minor', category: 'missing-minor-context', message: 'Missing Minor Context', stepReference: 'Notes', scoreDeduction: 5, status: 'open', createdBy: mutua._id.toString(), createdByEmail: mutua.email }], submittedAt: ago(h(10)), reviewedAt: ago(h(6)) },
      { ...acRevBase, taskId: t6._id, taskTitle: t6.title, batchId: acBatch._id, batchTitle: acBatch.title, annotatorId: odhiambo._id, annotatorEmail: odhiambo.email, annotatorName: odhiambo.name, reviewerId: amina._id, reviewerEmail: amina.email, reviewerName: amina.name, status: 'approved', decision: 'approve', qualityScore: 93, criteriaScores: { accuracy: 94, completeness: 92, adherence: 93 }, comments: 'All required steps captured clearly. Excellent work.', submittedAt: ago(d(3) + h(3)), reviewedAt: ago(d(2)) },
      { ...acRevBase, taskId: t7._id, taskTitle: t7.title, batchId: acBatch._id, batchTitle: acBatch.title, annotatorId: njeri._id, annotatorEmail: njeri.email, annotatorName: njeri.name, reviewerId: mutua._id, reviewerEmail: mutua.email, reviewerName: mutua.name, status: 'rejected', decision: 'reject', comments: 'Annotator used the search bar instead of the Offers section.', reasonCode: 'inaccurate', errorTags: [{ tagId: 'rv-e3', severity: 'major', category: 'wrong-navigation', message: 'Wrong Navigation Path', stepReference: 'Screenshot 1', scoreDeduction: 20, status: 'open', createdBy: mutua._id.toString(), createdByEmail: mutua.email }], submittedAt: ago(d(1) + h(8)), reviewedAt: ago(d(1) + h(4)) },
    ])

    // Acme-corp notifications
    const acSlug = acmeCorp.slug
    await Notification.insertMany([
      { tenantId: acTid, userId: wanjiru._id,  type: 'batch-assigned',   title: 'New Tasks Available',       message: `You have been assigned to "Agentic AI Tasks". High-priority tasks are ready.`,              actionUrl: `/${acSlug}/dashboard/workflows/${acWF._id}`,   read: false },
      { tenantId: acTid, userId: wanjiru._id,  type: 'review-needed',    title: 'Task Under Review',          message: `Your task "${t4.title}" is being reviewed by Amina Hassan.`,                             actionUrl: `/${acSlug}/dashboard/tasks/${t4._id}`,          read: true  },
      { tenantId: acTid, userId: odhiambo._id, type: 'task-approved',    title: 'Task Signed Off',            message: `Your task "${t6.title}" scored 93% and is now in the training dataset.`,                 actionUrl: `/${acSlug}/dashboard/tasks/${t6._id}`,          read: false },
      { tenantId: acTid, userId: njeri._id,    type: 'task-rejected',    title: 'Task Rejected',              message: `Your task "${t7.title}" was rejected. The Offers section navigation path was not followed.`, actionUrl: `/${acSlug}/dashboard/tasks/${t7._id}`,        read: false },
      { tenantId: acTid, userId: kipchoge._id, type: 'task-rejected',    title: 'Rework Required',            message: `Your task "${t5.title}" needs rework. Screenshots for steps 2–4 missing.`,               actionUrl: `/${acSlug}/dashboard/tasks/${t5._id}`,          read: false },
      { tenantId: acTid, userId: amina._id,    type: 'review-needed',    title: 'Task Ready for Review',      message: `"${t3.title}" submitted by Odhiambo Otieno is awaiting review.`,                          actionUrl: `/${acSlug}/dashboard/reviews`,                  read: false },
      { tenantId: acTid, userId: zawadi._id,   type: 'deadline',         title: 'Batch Deadline Approaching', message: `"Agentic AI Tasks" has 7 incomplete tasks due in 21 days.`,                              actionUrl: `/${acSlug}/dashboard/workflows/${acWF._id}`,   read: false },
    ])

    // ═════════════════════════════════════════════════════════════════════════
    // TECHLAB — 1 workflow, 1 batch, 5 tasks
    // ═════════════════════════════════════════════════════════════════════════

    const tlTid = techLab._id
    const tlPid = tlProject._id
    const tlEveryone = [tlAdmin._id, tlReviewer._id, tlAnnotator1._id, tlAnnotator2._id]

    const [tlWF] = await Workflow.insertMany([{
      tenantId: tlTid, projectId: tlPid,
      name: 'Agentic AI Evaluation',
      description: 'Evaluate AI agents completing multi-step browser tasks',
      type: 'agentic-ai', isActive: true, assignedUsers: tlEveryone, createdBy: tlAdmin._id,
    }])

    const [tlBatch] = await Batch.insertMany([{
      tenantId: tlTid, projectId: tlPid,
      workflowId: tlWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Agentic AI Tasks',
      description: 'Browser-based agent task evaluation across various platforms',
      instructions: '1. Open the URL before starting\n2. Complete the full task flow end-to-end\n3. Document every meaningful state change\n4. Use test account credentials if sign-in is required\n5. Note broken links, redirects, or UI errors',
      taskType: 'agentic-ai', priority: 0.85, workloadEstimate: 30,
      status: 'in-progress', tasksTotal: 5, tasksCompleted: 1,
      deadline: new Date(now + d(14)), createdBy: tlAdmin._id,
    }])

    const tlBase = { tenantId: tlTid, projectId: tlPid, workflowId: tlWF._id, workflowName: 'Agentic AI Evaluation', taskType: 'agentic-ai', batchId: tlBatch._id, batchTitle: 'Agentic AI Tasks' }
    const tlLog = (action: string, user: typeof tlAnnotator1, comment?: string, ts?: Date) => ({ action, userId: user._id.toString(), userEmail: user.email, comment, timestamp: ts ?? new Date() })

    // tl1: unclaimed
    const tl1 = await Task.create({ ...tlBase, title: 'Search and save property listings on Zillow', description: 'Go to Zillow.com, search for 2-bedroom apartments for rent in Manhattan ($3,000–$5,000/month), open the top three results, and save each.', status: 'unclaimed', priority: 0.90, difficulty: 'easy', languageTags: ['en'], externalUrl: 'https://www.zillow.com', estimatedDuration: 25 })

    // tl2: in-progress
    const tl2 = await Task.create({ ...tlBase, title: 'Order food on Uber Eats and reach the checkout confirmation', description: 'Go to Uber Eats, navigate to a fast food restaurant, add at least two items to your cart, proceed to checkout with test address. Do NOT complete payment.', status: 'in-progress', priority: 0.85, difficulty: 'easy', languageTags: ['en'], externalUrl: 'https://www.ubereats.com', estimatedDuration: 22, annotatorId: tlAnnotator1._id, annotatorEmail: tlAnnotator1.email, startedAt: ago(h(1.5)), activityLog: [tlLog('claimed', tlAnnotator1, undefined, ago(h(1.5)))] })

    // tl3: submitted
    const tl3 = await Task.create({ ...tlBase, title: 'Track a courier parcel on FedEx tracking portal', description: 'Go to the FedEx tracking portal, enter test tracking number 1234567890, view the full shipment history timeline.', status: 'submitted', priority: 0.80, difficulty: 'easy', languageTags: ['en'], externalUrl: 'https://www.fedex.com/tracking', estimatedDuration: 15, annotatorId: tlAnnotator2._id, annotatorEmail: tlAnnotator2.email, startedAt: ago(h(3)), submittedAt: ago(h(0.5)), actualDuration: 14, notes: 'All tracking steps captured.', activityLog: [tlLog('claimed', tlAnnotator2, undefined, ago(h(3))), tlLog('submitted', tlAnnotator2, 'Tracking timeline captured', ago(h(0.5)))] })

    // tl4: data-ready (approved)
    const tl4 = await Task.create({ ...tlBase, title: 'Book a ride via the Uber web booking portal', description: 'Go to Uber web booking, enter pickup: Times Square and drop-off: JFK Airport, select UberX, review the fare estimate. Do NOT confirm the ride.', status: 'data-ready', isLocked: true, priority: 0.82, difficulty: 'easy', languageTags: ['en'], externalUrl: 'https://www.uber.com', estimatedDuration: 18, annotatorId: tlAnnotator1._id, annotatorEmail: tlAnnotator1.email, reviewerId: tlReviewer._id, reviewerEmail: tlReviewer.email, qualityScore: 91, feedback: 'Pickup, drop-off, category selection, and fare estimate clearly captured.', startedAt: ago(d(5)), submittedAt: ago(d(4) + h(2)), completedAt: ago(d(3)), signedOffAt: ago(d(3)), actualDuration: 16, notes: 'Fare estimate: $35–$42.', activityLog: [tlLog('claimed', tlAnnotator1, undefined, ago(d(5))), tlLog('submitted', tlAnnotator1, 'Fare estimate captured.', ago(d(4) + h(2))), { action: 'signed-off', userId: tlReviewer._id.toString(), userEmail: tlReviewer.email, comment: 'Clean capture.', timestamp: ago(d(3)) }] })

    // tl5: revision-requested
    const tl5 = await Task.create({ ...tlBase, title: 'Search and book a hotel room on Booking.com', description: 'Go to Booking.com, search for hotels in Manhattan for next weekend (1 night, 1 adult), open the top 2 results, compare amenities and prices, and save to a list.', status: 'revision-requested', priority: 0.75, difficulty: 'medium', languageTags: ['en'], externalUrl: 'https://www.booking.com', estimatedDuration: 30, annotatorId: tlAnnotator2._id, annotatorEmail: tlAnnotator2.email, reviewerId: tlReviewer._id, reviewerEmail: tlReviewer.email, feedback: 'Amenities comparison screenshots are missing for the second hotel result.', startedAt: ago(d(2)), submittedAt: ago(d(1) + h(3)), actualDuration: 28, activityLog: [tlLog('claimed', tlAnnotator2, undefined, ago(d(2))), tlLog('submitted', tlAnnotator2, 'Two hotels compared', ago(d(1) + h(3))), { action: 'revision-requested', userId: tlReviewer._id.toString(), userEmail: tlReviewer.email, comment: 'Missing amenities screenshots for hotel 2.', timestamp: ago(h(8)) }] })

    await Batch.findByIdAndUpdate(tlBatch._id, { tasksTotal: 5, tasksCompleted: 1 })

    // TechLab reviews
    const tlRevBase = { tenantId: tlTid, projectId: tlPid, workflowId: tlWF._id }
    await Review.insertMany([
      { ...tlRevBase, taskId: tl3._id, taskTitle: tl3.title, batchId: tlBatch._id, batchTitle: tlBatch.title, annotatorId: tlAnnotator2._id, annotatorEmail: tlAnnotator2.email, annotatorName: tlAnnotator2.name, status: 'pending', submittedAt: ago(h(0.5)) },
      { ...tlRevBase, taskId: tl4._id, taskTitle: tl4.title, batchId: tlBatch._id, batchTitle: tlBatch.title, annotatorId: tlAnnotator1._id, annotatorEmail: tlAnnotator1.email, annotatorName: tlAnnotator1.name, reviewerId: tlReviewer._id, reviewerEmail: tlReviewer.email, reviewerName: tlReviewer.name, status: 'approved', decision: 'approve', qualityScore: 91, criteriaScores: { accuracy: 92, completeness: 90, adherence: 91 }, comments: 'Pickup, drop-off, category selection, and fare estimate clearly captured.', submittedAt: ago(d(4) + h(2)), reviewedAt: ago(d(3)) },
      { ...tlRevBase, taskId: tl5._id, taskTitle: tl5.title, batchId: tlBatch._id, batchTitle: tlBatch.title, annotatorId: tlAnnotator2._id, annotatorEmail: tlAnnotator2.email, annotatorName: tlAnnotator2.name, reviewerId: tlReviewer._id, reviewerEmail: tlReviewer.email, reviewerName: tlReviewer.name, status: 'revision-requested', decision: 'request-rework', comments: 'Missing amenities screenshots for hotel 2.', reasonCode: 'incomplete', submittedAt: ago(d(1) + h(3)), reviewedAt: ago(h(8)) },
    ])

    // TechLab notifications
    const tlSlug = techLab.slug
    await Notification.insertMany([
      { tenantId: tlTid, userId: tlAnnotator1._id, type: 'batch-assigned', title: 'New Tasks Available',   message: `You have been assigned to "Agentic AI Tasks". Tasks are ready to claim.`, actionUrl: `/${tlSlug}/dashboard/workflows/${tlWF._id}`, read: false },
      { tenantId: tlTid, userId: tlAnnotator1._id, type: 'task-approved',  title: 'Task Signed Off',       message: `Your task "${tl4.title}" scored 91% and is now in the training dataset.`,    actionUrl: `/${tlSlug}/dashboard/tasks/${tl4._id}`,        read: false },
      { tenantId: tlTid, userId: tlAnnotator2._id, type: 'task-rejected',  title: 'Rework Required',       message: `Your task "${tl5.title}" needs rework. Amenities screenshots missing.`,       actionUrl: `/${tlSlug}/dashboard/tasks/${tl5._id}`,        read: false },
      { tenantId: tlTid, userId: tlReviewer._id,   type: 'review-needed',  title: 'Task Ready for Review', message: `"${tl3.title}" submitted by ${tlAnnotator2.name} is awaiting review.`,       actionUrl: `/${tlSlug}/dashboard/reviews`,                  read: false },
    ])

    // Global super-admin notification
    await Notification.create({
      userId: superAdmin._id, type: 'system',
      title: 'Database Seeded',
      message: '2 workspaces · 2 workflows · 2 batches · 13 tasks · 8 reviews — all @labelforge.ai emails.',
      read: false,
    })

    return NextResponse.json({
      message: 'Database seeded successfully',
      summary: {
        users: { total: 12, superAdmin: 1, acmeCorp: 7, techLab: 4 },
        clients: 2, memberships: 11, projects: 2,
        workflows: 2, batches: 2,
        tasks: { total: 13, acmeCorp: 8, techLab: 5 },
        reviews: { total: 8, acmeCorp: 5, techLab: 3 },
      },
      workspaces: {
        acmeCorp: { slug: 'acme-corp', loginUrl: '/acme-corp/login', users: 7 },
        techLab:  { slug: 'techlab',  loginUrl: '/techlab/login',  users: 4 },
      },
      credentials: {
        superAdmin:  { email: 'superadmin@labelforge.ai',    password: 'superadmin123!', loginUrl: '/login' },
        acAdmin:           { email: 'zawadi.ndungu@labelforge.ai', password: 'admin123!',     workspace: 'acme-corp' },
        acReviewer:        { email: 'amina.hassan@labelforge.ai',  password: 'reviewer123!',  workspace: 'acme-corp' },
        acAnnotator:       { email: 'wanjiru.kamau@labelforge.ai', password: 'annotator123!', workspace: 'acme-corp' },
        acRevAnnotator:    { email: 'kipchoge.ruto@labelforge.ai', password: 'annotator123!', workspace: 'acme-corp', note: 'reviewer_annotator role' },
        tlAdmin:     { email: 'fatima.alrashid@labelforge.ai', password: 'admin123!',    workspace: 'techlab'   },
        tlAnnotator: { email: 'priya.sharma@labelforge.ai',  password: 'annotator123!',  workspace: 'techlab'   },
      },
    })
  } catch (err) {
    console.error('[seed]', err)
    return NextResponse.json({ error: 'Seed failed', details: String(err) }, { status: 500 })
  }
}

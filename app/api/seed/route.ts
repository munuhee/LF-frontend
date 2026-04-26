import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/lib/models/User'
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
      Workflow.deleteMany({}),
      Batch.deleteMany({}),
      Task.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
    ])

    // ── Passwords ────────────────────────────────────────────────────────────
    const [pw1, pw2, pw3, pw4, pw5, pw6, pw7] = await Promise.all([
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('annotator123!', 12),
      bcrypt.hash('reviewer123!', 12),
      bcrypt.hash('reviewer123!', 12),
      bcrypt.hash('admin123!', 12),
    ])

    // ── Users ────────────────────────────────────────────────────────────────
    const [wanjiru, odhiambo, njeri, kipchoge, amina, mutua, zawadi] = await User.insertMany([
      {
        name: 'Wanjiru Kamau',
        email: 'wanjiru.kamau@labelforge.ai',
        passwordHash: pw1, role: 'annotator', department: 'AI Data Team', isActive: true,
        badges: [
          { type: 'role',      name: 'Annotator',  description: 'Certified annotator',      awardedAt: ago(d(30)) },
          { type: 'expertise', name: 'Agentic AI', description: 'Agentic AI specialist',    awardedAt: ago(d(15)) },
          { type: 'level',     name: 'Senior',     description: 'Senior-level contributor', awardedAt: ago(d(7))  },
        ],
      },
      {
        name: 'Odhiambo Otieno',
        email: 'odhiambo.otieno@labelforge.ai',
        passwordHash: pw2, role: 'annotator', department: 'AI Data Team', isActive: true,
        badges: [
          { type: 'role',      name: 'Annotator',    description: 'Certified annotator',      awardedAt: ago(d(20)) },
          { type: 'expertise', name: 'Agentic AI',   description: 'Agentic AI specialist',    awardedAt: ago(d(10)) },
          { type: 'level',     name: 'Intermediate', description: 'Intermediate contributor', awardedAt: ago(d(5))  },
        ],
      },
      {
        name: 'Njeri Mwangi',
        email: 'njeri.mwangi@labelforge.ai',
        passwordHash: pw3, role: 'annotator', department: 'AI Data Team', isActive: true,
        badges: [
          { type: 'role',      name: 'Annotator',  description: 'Certified annotator',   awardedAt: ago(d(25)) },
          { type: 'expertise', name: 'Agentic AI', description: 'Agentic AI specialist', awardedAt: ago(d(12)) },
          { type: 'level',     name: 'Senior',     description: 'Senior contributor',    awardedAt: ago(d(8))  },
        ],
      },
      {
        name: 'Kipchoge Ruto',
        email: 'kipchoge.ruto@labelforge.ai',
        passwordHash: pw4, role: 'annotator', department: 'AI Data Team', isActive: true,
        badges: [
          { type: 'role',  name: 'Annotator', description: 'Certified annotator', awardedAt: ago(d(10)) },
          { type: 'level', name: 'Junior',    description: 'Junior contributor',  awardedAt: ago(d(3))  },
        ],
      },
      {
        name: 'Amina Hassan',
        email: 'amina.hassan@labelforge.ai',
        passwordHash: pw5, role: 'reviewer', department: 'Quality Assurance', isActive: true,
        badges: [
          { type: 'role',      name: 'Reviewer',   description: 'Certified QA reviewer',    awardedAt: ago(d(40)) },
          { type: 'level',     name: 'Senior',     description: 'Senior reviewer',          awardedAt: ago(d(20)) },
          { type: 'expertise', name: 'Agentic AI', description: 'Agentic AI QA specialist', awardedAt: ago(d(8))  },
        ],
      },
      {
        name: 'Mutua Kibet',
        email: 'mutua.kibet@labelforge.ai',
        passwordHash: pw6, role: 'reviewer', department: 'Quality Assurance', isActive: true,
        badges: [
          { type: 'role',  name: 'Reviewer',     description: 'Certified QA reviewer', awardedAt: ago(d(18)) },
          { type: 'level', name: 'Intermediate', description: 'Intermediate reviewer', awardedAt: ago(d(5))  },
        ],
      },
      {
        name: 'Zawadi Ndungu',
        email: 'zawadi.ndungu@labelforge.ai',
        passwordHash: pw7, role: 'admin', department: 'Operations', isActive: true,
        badges: [{ type: 'role', name: 'Admin', description: 'Platform administrator', awardedAt: ago(d(60)) }],
      },
    ])

    // ── Workflows ────────────────────────────────────────────────────────────
    const everyone = [wanjiru._id, odhiambo._id, njeri._id, kipchoge._id, amina._id, mutua._id, zawadi._id]

    const [agenticWF, llmWF, multimodalWF, evalWF, prefWF] = await Workflow.insertMany([
      {
        name: 'Agentic AI Evaluation',
        description: 'Evaluate AI agents completing multi-step tasks on major international e-commerce and service platforms using the LabelForge browser extension',
        type: 'agentic-ai', isActive: true, assignedUsers: everyone, createdBy: zawadi._id,
      },
      {
        name: 'LLM Response Training',
        description: 'Generate, evaluate, and rank instruction-following responses for LLM fine-tuning',
        type: 'llm-training', isActive: true, assignedUsers: [], createdBy: zawadi._id,
      },
      {
        name: 'Multimodal Data Collection',
        description: 'Collect and annotate paired image-text data for vision-language model training',
        type: 'multimodal', isActive: true, assignedUsers: [], createdBy: zawadi._id,
      },
      {
        name: 'Model Output Evaluation',
        description: 'Score LLM outputs for accuracy, completeness, helpfulness, and safety',
        type: 'evaluation', isActive: true, assignedUsers: [], createdBy: zawadi._id,
      },
      {
        name: 'RLHF Preference Ranking',
        description: 'Rank paired model responses to build preference datasets for reinforcement learning from human feedback',
        type: 'preference-ranking', isActive: true, assignedUsers: [], createdBy: zawadi._id,
      },
    ])

    // ── Batches ───────────────────────────────────────────────────────────────
    const allAnnotators = [wanjiru._id, odhiambo._id, njeri._id, kipchoge._id]

    const [batchWebEC, batchWebGov, batchSocial, batchFintech] = await Batch.insertMany([
      {
        workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
        title: 'Web Navigation — E-Commerce Platforms',
        description: 'Purchase-flow and product-discovery tasks on Amazon, eBay, Walmart, Target, and Best Buy',
        instructions: '1. Open the external URL with the LabelForge extension active\n2. Complete the assigned task exactly as described\n3. Document every distinct UI state encountered in detailed notes\n4. Note obstacles, unexpected flows, or errors in the Notes field\n5. Submit only when all required steps have been completed and documented',
        taskType: 'agentic-ai', priority: 0.95, workloadEstimate: 50,
        status: 'in-progress', tasksTotal: 10, tasksCompleted: 1,
        deadline: new Date(now + d(14)), createdBy: zawadi._id, assignedAnnotators: allAnnotators,
      },
      {
        workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
        title: 'Web Navigation — Government & Financial Services',
        description: 'Form-filling, authentication, and document retrieval on IRS, SSA, DMV, banking portals, and major financial service websites',
        instructions: '1. Use a fresh browser session for each task\n2. Follow steps precisely — do NOT skip any\n3. Document every action in the extension sidebar with detailed notes\n4. Record CAPTCHAs, OTP flows, or unexpected redirects as obstacles in Notes\n5. Use test credentials provided; never enter real personal data',
        taskType: 'agentic-ai', priority: 0.88, workloadEstimate: 40,
        status: 'in-progress', tasksTotal: 7, tasksCompleted: 1,
        deadline: new Date(now + d(21)), createdBy: zawadi._id, assignedAnnotators: allAnnotators,
      },
      {
        workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
        title: 'Web Navigation — Social Commerce & Delivery Services',
        description: 'Product listings, order placement, and delivery tracking on Facebook Marketplace, Craigslist, Uber Eats, DoorDash, Airbnb, and TaskRabbit',
        instructions: '1. Open the URL with the extension active before starting\n2. Complete the full task flow end-to-end as described\n3. Document every meaningful state change with detailed notes\n4. If sign-in is required, use the test account credentials provided\n5. Note any broken links, redirects, or UI errors in Notes',
        taskType: 'agentic-ai', priority: 0.82, workloadEstimate: 35,
        status: 'in-progress', tasksTotal: 7, tasksCompleted: 1,
        deadline: new Date(now + d(18)), createdBy: zawadi._id, assignedAnnotators: allAnnotators,
      },
      {
        workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
        title: 'Web Navigation — Banking & Payment Services',
        description: 'Account access, fund transfers, loan applications, and statement downloads on Chase, Bank of America, Wells Fargo, PayPal, and Stripe portals',
        instructions: '1. Use provided test credentials only — never use real banking details\n2. Complete the full navigation flow as described\n3. Document each step including confirmation dialogs or error messages with detailed notes\n4. If an OTP is required, note it as an obstacle and document the prompt\n5. Do NOT proceed past any transaction confirmation screen',
        taskType: 'agentic-ai', priority: 0.78, workloadEstimate: 45,
        status: 'available', tasksTotal: 6, tasksCompleted: 0,
        deadline: new Date(now + d(28)), createdBy: zawadi._id, assignedAnnotators: allAnnotators,
      },
    ])

    // Empty placeholder batches for non-agentic workflows
    await Batch.insertMany([
      {
        workflowId: llmWF._id, workflowName: 'LLM Response Training',
        title: 'Instruction Following — Technical & Coding Prompts',
        description: 'Write complete, accurate responses to technical prompts',
        taskType: 'llm-training', priority: 0.80, workloadEstimate: 30,
        status: 'available', tasksTotal: 0, tasksCompleted: 0, createdBy: zawadi._id,
      },
      {
        workflowId: multimodalWF._id, workflowName: 'Multimodal Data Collection',
        title: 'Image Captioning — Kenyan Urban & Street Scenes',
        description: 'Rich, accurate captions for Kenyan urban environment images',
        taskType: 'multimodal', priority: 0.75, workloadEstimate: 20,
        status: 'available', tasksTotal: 0, tasksCompleted: 0, createdBy: zawadi._id,
      },
      {
        workflowId: evalWF._id, workflowName: 'Model Output Evaluation',
        title: 'Response Quality Evaluation — General Knowledge',
        description: 'Evaluate LLM responses for accuracy, completeness, and helpfulness',
        taskType: 'evaluation', priority: 0.78, workloadEstimate: 22,
        status: 'available', tasksTotal: 0, tasksCompleted: 0, createdBy: zawadi._id,
      },
      {
        workflowId: prefWF._id, workflowName: 'RLHF Preference Ranking',
        title: 'Preference Ranking — Customer Service Responses',
        description: 'Rank paired AI-generated customer service responses',
        taskType: 'preference-ranking', priority: 0.65, workloadEstimate: 15,
        status: 'available', tasksTotal: 0, tasksCompleted: 0, createdBy: zawadi._id,
      },
    ])

    // ── Helpers ───────────────────────────────────────────────────────────────
    const log = (action: string, user: typeof wanjiru, comment?: string, ts?: Date) => ({
      action, userId: user._id.toString(), userEmail: user.email, comment, timestamp: ts ?? new Date(),
    })

    const etag = (
      id: string, severity: 'major' | 'minor', category: string, message: string,
      reviewer: typeof amina, stepReference?: string, scoreDeduction?: number,
    ) => ({
      tagId: id, severity, category, message, stepReference,
      scoreDeduction: scoreDeduction ?? (severity === 'major' ? 20 : 5),
      status: 'open' as const,
      createdBy: reviewer._id.toString(), createdByEmail: reviewer.email,
    })

    // ════════════════════════════════════════════════════════════════════════
    // BATCH 1 — E-Commerce  (10 tasks)
    // ════════════════════════════════════════════════════════════════════════

    const t1 = await Task.create({
      batchId: batchWebEC._id, batchTitle: batchWebEC.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Search and add item to wishlist on Amazon',
      description: 'Navigate to Amazon.com, search for "Samsung Galaxy Buds", apply the price filter (under $50), open the top result, and add it to your wishlist. Document the complete navigation flow including search results display, filter application, product page interactions, and wishlist confirmation process with detailed notes about each UI state and any obstacles encountered.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.95,
      difficulty: 'easy', languageTags: ['en'],
      externalUrl: 'https://www.amazon.com', estimatedDuration: 20,
      sla: new Date(now + d(3)),
      objective: 'Capture the complete wishlist-add flow from search to confirmation',
      successCriteria: [
        'Search results with price filter applied and results visible',
        'Product detail page showing item name and price',
        'Wishlist confirmation modal or toast showing the item was added',
      ],
    })

    const t2 = await Task.create({
      batchId: batchWebEC._id, batchTitle: batchWebEC.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Book a bus seat on Greyhound — New York to Boston',
      description: 'Go to Greyhound.com, search for a New York → Boston seat departing tomorrow morning, select the first available seat, fill passenger details with test data, and proceed to the payment page. Document the complete seat selection process including route search results display, seat map interactions, passenger form completion, and payment page loading with detailed notes about each step. Do NOT complete payment.',
      taskType: 'agentic-ai', status: 'in-progress', priority: 0.90,
      difficulty: 'medium', languageTags: ['en', 'sw'],
      externalUrl: 'https://www.greyhound.com', estimatedDuration: 30,
      annotatorId: wanjiru._id, annotatorEmail: wanjiru.email,
      startedAt: ago(h(2)), sla: new Date(now + d(2)),
      objective: 'Capture the seat-booking checkout flow from search to the payment page',
      successCriteria: [
        'Route search results showing available departure times',
        'Seat map with a seat selected and highlighted',
        'Passenger details form filled with test data',
        'Payment page loaded — do not submit',
      ],
      activityLog: [log('claimed', wanjiru, undefined, ago(h(2)))],
    })

    const t3 = await Task.create({
      batchId: batchWebEC._id, batchTitle: batchWebEC.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Register a new business account on PayPal Business Portal',
      description: 'Log into the PayPal Business Portal using test credentials, navigate to Business Account Setup, and simulate registering a new business account. Document each step of the registration wizard including form fields, validation processes, and confirmation screens with detailed notes about any unexpected flows or obstacles.',
      taskType: 'agentic-ai', status: 'submitted', priority: 0.88,
      difficulty: 'hard', languageTags: ['en', 'sw'],
      externalUrl: 'https://www.paypal.com/business', estimatedDuration: 45,
      annotatorId: odhiambo._id, annotatorEmail: odhiambo.email,
      startedAt: ago(h(5)), submittedAt: ago(h(1)), actualDuration: 42,
      notes: 'Completed all 4 registration steps. Encountered an unexpected OTP confirmation screen between step 3 and 4 not in the task description — screenshotted and noted.',
      activityLog: [
        log('claimed',   odhiambo, undefined,                                 ago(h(5))),
        log('paused',    odhiambo, 'Waiting for simulated OTP to proceed',    ago(h(3))),
        log('resumed',   odhiambo, undefined,                                 ago(h(2.5))),
        log('submitted', odhiambo, 'Extra OTP screen documented in notes',    ago(h(1))),
      ],
    })

    const t4 = await Task.create({
      batchId: batchWebEC._id, batchTitle: batchWebEC.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Compare motor insurance quotes on Progressive Insurance',
      description: 'Visit Progressive.com, compare at least 3 comprehensive motor insurance quotes for a 2020 Toyota Corolla (1.8L), capture the full comparison table details, and document the quote generation process with detailed notes about each provider\'s rates, coverage options, and the lowest-rate provider information.',
      taskType: 'agentic-ai', status: 'in-review', priority: 0.85,
      difficulty: 'medium', languageTags: ['en'],
      externalUrl: 'https://www.progressive.com', estimatedDuration: 35,
      annotatorId: wanjiru._id, annotatorEmail: wanjiru.email,
      reviewerId: amina._id, reviewerEmail: amina.email,
      startedAt: ago(h(8)), submittedAt: ago(h(4)), actualDuration: 32,
      notes: 'Three quotes captured. Jubilee offered the lowest comprehensive rate at KSh 18,500/year.',
      errorTags: [
        etag('task-etag-001', 'minor', 'low-quality-screenshot', 'Low-Quality Screenshots', amina, 'Screenshot 4'),
      ],
      activityLog: [
        log('claimed',   wanjiru, undefined,                                           ago(h(8))),
        log('submitted', wanjiru, 'Three providers compared, lowest rate noted',       ago(h(4))),
        log('in-review', amina,   'Review started',                                    ago(h(2))),
        log('tag-added', amina,   'Minor: comparison table screenshot cut off on right', ago(h(1))),
      ],
    })

    const t5 = await Task.create({
      batchId: batchWebEC._id, batchTitle: batchWebEC.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Download tax return transcript from IRS portal',
      description: 'Log into IRS.gov using test credentials, navigate to the Get Transcript section, download a tax return transcript, and document the complete navigation process with detailed notes about each step from login to download, including menu paths, form interactions, and any security verification steps encountered.',
      taskType: 'agentic-ai', status: 'revision-requested', priority: 0.82,
      difficulty: 'hard', languageTags: ['en'],
      externalUrl: 'https://www.irs.gov', estimatedDuration: 40,
      annotatorId: kipchoge._id, annotatorEmail: kipchoge.email,
      reviewerId: mutua._id, reviewerEmail: mutua.email,
      feedback: 'Navigation screenshots for steps 2–4 are missing. Only the final PDF preview was submitted. Please redo from the login page and capture every navigation step. The menu path in Notes is also incomplete.',
      errorTags: [
        etag('task-etag-002', 'major', 'missing-critical-step', 'Missing Critical Steps', mutua, 'Screenshots 2–4', 20),
        etag('task-etag-003', 'minor', 'missing-minor-context',  'Missing Minor Context',  mutua, 'Notes', 5),
      ],
      startedAt: ago(d(2)), submittedAt: ago(h(10)), actualDuration: 35,
      notes: 'PIN certificate downloaded successfully.',
      activityLog: [
        log('claimed',            kipchoge, undefined,                                               ago(d(2))),
        log('submitted',          kipchoge, 'Certificate downloaded',                               ago(h(10))),
        log('in-review',          mutua,    'Review started',                                        ago(h(8))),
        log('tag-added',          mutua,    'Major: navigation screenshots 2–4 missing',            ago(h(7))),
        log('tag-added',          mutua,    'Minor: menu path not documented in notes',             ago(h(7))),
        log('revision-requested', mutua,    'Screenshots missing for steps 2–4. Redo from login.',  ago(h(6))),
      ],
    })

    const t6 = await Task.create({
      batchId: batchWebEC._id, batchTitle: batchWebEC.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Search and wishlist a laptop on eBay',
      description: 'Go to eBay.com, search for "HP laptop", filter by price range $300–$600, open the top-rated result, and add it to your watchlist. Document the complete product discovery and watchlist-add flow with detailed notes about search results, filtering process, product details, and watchlist confirmation.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.83,
      difficulty: 'easy', languageTags: ['en'],
      externalUrl: 'https://www.ebay.com', estimatedDuration: 18,
      sla: new Date(now + d(5)),
      objective: 'Capture product discovery and wishlist-add flow on Kilimall',
      successCriteria: [
        'Search results with price filter applied',
        'Product detail page with rating and price visible',
        'Wishlist page or confirmation toast showing the laptop was added',
      ],
    })

    const t7 = await Task.create({
      batchId: batchWebEC._id, batchTitle: batchWebEC.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Book a domestic flight on Delta Airlines website',
      description: 'Go to Delta.com, search for a New York LGA → Los Angeles LAX flight next week (one-way, 1 adult), select the cheapest available fare, fill in passenger details with test data, and document the booking summary process with detailed notes about flight selection, fare options, and passenger information forms. Do NOT proceed to payment.',
      taskType: 'agentic-ai', status: 'data-ready', isLocked: true, priority: 0.85,
      difficulty: 'medium', languageTags: ['en'],
      externalUrl: 'https://www.delta.com', estimatedDuration: 25,
      annotatorId: odhiambo._id, annotatorEmail: odhiambo.email,
      reviewerId: amina._id, reviewerEmail: amina.email,
      qualityScore: 93,
      feedback: 'All required steps captured clearly. Booking summary shows itinerary, price, and passenger details. Excellent work.',
      startedAt: ago(d(4)), submittedAt: ago(d(3) + h(3)),
      completedAt: ago(d(2)), signedOffAt: ago(d(2)), actualDuration: 22,
      notes: 'Cheapest fare: KSh 3,999. All four steps captured in sequence.',
      activityLog: [
        log('claimed',    odhiambo, undefined,                                       ago(d(4))),
        log('submitted',  odhiambo, 'Cheapest fare KSh 3,999. All steps captured',  ago(d(3) + h(3))),
        log('in-review',  amina,    'Review started',                                ago(d(2) + h(6))),
        log('signed-off', amina,    'All steps clearly captured. Ready for dataset.', ago(d(2))),
      ],
    })

    const t8 = await Task.create({
      batchId: batchWebEC._id, batchTitle: batchWebEC.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Find and apply a discount coupon on Target website',
      description: 'Go to Target.com, browse the Deals section, find a product with an active discount coupon, add it to your cart, and apply the coupon at checkout. Document each step of the coupon discovery and application process with detailed notes about the deals navigation, cart interactions, coupon field usage, and discounted total calculation.',
      taskType: 'agentic-ai', status: 'rejected', priority: 0.80,
      difficulty: 'medium', languageTags: ['en', 'sw'],
      externalUrl: 'https://www.target.com', estimatedDuration: 28,
      annotatorId: njeri._id, annotatorEmail: njeri.email,
      reviewerId: mutua._id, reviewerEmail: mutua.email,
      feedback: 'Annotator used the search bar instead of navigating via the Offers section, bypassing the required flow. The coupon field was never reached. Wrong navigation path — rejected.',
      errorTags: [
        etag('task-etag-004', 'major', 'wrong-navigation',   'Completely Wrong Navigation Path', mutua, 'Screenshot 1', 20),
        etag('task-etag-005', 'major', 'task-not-completed', 'Task Not Completed Correctly',     mutua, 'Screenshot 4', 20),
      ],
      startedAt: ago(d(3)), submittedAt: ago(d(1) + h(8)), actualDuration: 30,
      activityLog: [
        log('claimed',   njeri,  undefined,                                         ago(d(3))),
        log('submitted', njeri,  'Coupon applied, discount confirmed',              ago(d(1) + h(8))),
        log('in-review', mutua,  'Review started',                                  ago(d(1) + h(6))),
        log('tag-added', mutua,  'Major: used search bar, not Offers section',     ago(d(1) + h(5))),
        log('tag-added', mutua,  'Major: coupon flow never reached',               ago(d(1) + h(5))),
        log('rejected',  mutua,  'Wrong navigation — Offers section bypassed.',    ago(d(1) + h(4))),
      ],
    })

    const t9 = await Task.create({
      batchId: batchWebEC._id, batchTitle: batchWebEC.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Browse electronics and compare listings on Craigslist',
      description: 'Go to Craigslist.org, navigate to Electronics → Computers, find at least 3 laptop listings, and compare their prices and specifications side-by-side. Document the multi-listing comparison flow with detailed notes about category navigation, individual listing details, and the comparison process.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.78,
      difficulty: 'easy', languageTags: ['en'],
      externalUrl: 'https://www.craigslist.org', estimatedDuration: 22,
      objective: 'Capture the multi-listing comparison flow on Pigiame from category navigation to the comparison table',
      successCriteria: [
        'Electronics → Computers & Tablets category page with listings visible',
        'Three individual laptop listing pages open in sequence',
        'Comparison view showing specifications side-by-side',
      ],
    })

    const t10 = await Task.create({
      batchId: batchWebEC._id, batchTitle: batchWebEC.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Get a motor insurance quote on State Farm portal',
      description: 'Visit the State Farm website, navigate to Personal Insurance → Auto Insurance, fill in the online quote form for a 2019 Honda Civic (1.5L, private use), get a comprehensive cover quote, and document each step of the quote generation process with detailed notes about form completion, coverage options, and pricing details.',
      taskType: 'agentic-ai', status: 'submitted', priority: 0.76,
      difficulty: 'medium', languageTags: ['en'],
      externalUrl: 'https://www.statefarm.com', estimatedDuration: 30,
      annotatorId: kipchoge._id, annotatorEmail: kipchoge.email,
      startedAt: ago(h(4)), submittedAt: ago(h(1)), actualDuration: 27,
      notes: 'Quote generated: KSh 42,500/year for comprehensive cover on the 2019 Toyota Axio. All steps screenshotted.',
      activityLog: [
        log('claimed',   kipchoge, undefined,                                      ago(h(4))),
        log('submitted', kipchoge, 'Quote KSh 42,500/yr. All steps captured',     ago(h(1))),
      ],
    })

    // ════════════════════════════════════════════════════════════════════════
    // BATCH 2 — Government & Fintech  (7 tasks)
    // ════════════════════════════════════════════════════════════════════════

    const t11 = await Task.create({
      batchId: batchWebGov._id, batchTitle: batchWebGov.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Apply for Social Security Number on SSA portal',
      description: 'Visit SSA.gov, navigate to the Social Security Number application section, and begin an SSN application. Fill in the personal details form using placeholder values only. Document the complete application flow with detailed notes about each step, form validation, and confirmation process.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.80,
      difficulty: 'medium', languageTags: ['en', 'sw'],
      externalUrl: 'https://www.ssa.gov', estimatedDuration: 30,
      sla: new Date(now + d(7)),
      objective: 'Capture the full Huduma Number application flow from portal homepage to confirmation',
      successCriteria: [
        'eCitizen homepage with Huduma Centre section highlighted',
        'Application form with all fields filled using placeholder data',
        'Confirmation page with application reference number visible',
      ],
    })

    const t12 = await Task.create({
      batchId: batchWebGov._id, batchTitle: batchWebGov.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Search property records on County Assessor portal',
      description: 'Log into a County Assessor portal with test credentials, search for property parcel 123-456-789 in California, view the property history, and document the complete property information retrieval process with detailed notes about search functionality, data display, and navigation paths.',
      taskType: 'agentic-ai', status: 'paused', priority: 0.78,
      difficulty: 'hard', languageTags: ['en'],
      externalUrl: 'https://www.county-assessor.org', estimatedDuration: 45,
      annotatorId: wanjiru._id, annotatorEmail: wanjiru.email,
      startedAt: ago(h(3)),
      notes: 'Login and parcel search completed. Ownership timeline page timing out — paused to retry once connection stabilises.',
      activityLog: [
        log('claimed', wanjiru, undefined,                                  ago(h(3))),
        log('paused',  wanjiru, 'Ownership timeline page loading timeout', ago(h(1))),
      ],
    })

    const t13 = await Task.create({
      batchId: batchWebGov._id, batchTitle: batchWebGov.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Send money via PayPal Developer Simulator',
      description: 'Using the PayPal API simulator on the PayPal Developer Portal, initiate a $50 transaction. Document the complete API interaction process with detailed notes about the request payload, simulated confirmation prompt, transaction success response, and reference ID generation.',
      taskType: 'agentic-ai', status: 'data-ready', isLocked: true, priority: 0.92,
      difficulty: 'easy', languageTags: ['en', 'sw'],
      externalUrl: 'https://developer.paypal.com', estimatedDuration: 20,
      annotatorId: njeri._id, annotatorEmail: njeri.email,
      reviewerId: amina._id, reviewerEmail: amina.email,
      qualityScore: 96,
      feedback: 'All three screenshots captured in the correct sequence with transaction reference clearly visible. Perfect execution.',
      startedAt: ago(d(3)), submittedAt: ago(d(2) + h(4)),
      completedAt: ago(d(1)), signedOffAt: ago(d(1)), actualDuration: 18,
      notes: 'Transaction reference: MPC1234XYZ.',
      activityLog: [
        log('claimed',    njeri,  undefined,                                           ago(d(3))),
        log('submitted',  njeri,  'All steps captured. Ref: MPC1234XYZ',              ago(d(2) + h(4))),
        log('in-review',  amina,  'Review started',                                   ago(d(1) + h(6))),
        log('signed-off', amina,  'All steps clearly captured. Excellent execution.', ago(d(1))),
      ],
    })

    const t14 = await Task.create({
      batchId: batchWebGov._id, batchTitle: batchWebGov.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Renew a business license on City Hall portal',
      description: 'Visit the City Hall services portal, navigate to Business License Renewal, and initiate a renewal using fictional small business test data. Document each form step and the payment summary page with detailed notes about the renewal process, fee calculations, and required documentation. Do NOT complete payment.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.76,
      difficulty: 'medium', languageTags: ['en', 'sw'],
      externalUrl: 'https://www.cityhall.gov', estimatedDuration: 35,
      sla: new Date(now + d(10)),
      objective: 'Capture the business permit renewal flow from the county portal to the payment screen',
      successCriteria: [
        'Nairobi County portal with Business Permit Renewal option visible',
        'Renewal form with fictional business test data filled in',
        'Fee summary page showing permit costs',
        'Payment page — do not submit',
      ],
    })

    const t15 = await Task.create({
      batchId: batchWebGov._id, batchTitle: batchWebGov.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Apply for driver\'s license replacement on DMV portal',
      description: 'Go to the DMV portal, navigate to Driver Services → Request Replacement for lost/damaged license, fill in the application form with test data, and document every step through to the submission confirmation with detailed notes about the form fields, verification process, and confirmation details.',
      taskType: 'agentic-ai', status: 'in-progress', priority: 0.74,
      difficulty: 'hard', languageTags: ['en'],
      externalUrl: 'https://www.dmv.gov', estimatedDuration: 40,
      annotatorId: odhiambo._id, annotatorEmail: odhiambo.email,
      startedAt: ago(h(1.5)),
      notes: 'Login completed. Currently on the license category selection step.',
      activityLog: [log('claimed', odhiambo, undefined, ago(h(1.5)))],
    })

    const t16 = await Task.create({
      batchId: batchWebGov._id, batchTitle: batchWebGov.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Pay utility bill via the electric company portal',
      description: 'Go to the electric company self-service portal, log in with test credentials, navigate to Bill Payment, enter a test meter number, and document the bill payment flow with detailed notes about the account lookup, bill details display, and payment form. Do NOT complete payment.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.72,
      difficulty: 'easy', languageTags: ['en', 'sw'],
      externalUrl: 'https://www.electriccompany.com', estimatedDuration: 20,
      sla: new Date(now + d(12)),
      objective: 'Capture the bill payment flow on the Kenya Power self-service portal',
      successCriteria: [
        'Kenya Power portal login page with test credentials entered',
        'Bill details page showing the outstanding balance for the test meter',
        'Payment form with amount pre-filled — do not submit',
      ],
    })

    const t17 = await Task.create({
      batchId: batchWebGov._id, batchTitle: batchWebGov.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Request insurance card replacement via the provider portal',
      description: 'Visit the insurance provider member portal, log in with test credentials, navigate to Card Services → Request Replacement Card, fill in the reason and delivery address using placeholder data, and document all steps through to the confirmation with detailed notes about the replacement process and verification steps.',
      taskType: 'agentic-ai', status: 'submitted', priority: 0.70,
      difficulty: 'medium', languageTags: ['en'],
      externalUrl: 'https://www.insuranceprovider.com', estimatedDuration: 25,
      annotatorId: njeri._id, annotatorEmail: njeri.email,
      startedAt: ago(h(3)), submittedAt: ago(h(0.5)), actualDuration: 22,
      notes: 'Replacement request submitted. Reason: lost card. All 5 steps screenshotted including the SMS confirmation code screen.',
      activityLog: [
        log('claimed',   njeri,  undefined,                                     ago(h(3))),
        log('submitted', njeri,  'Card replacement form submitted. 5 steps done', ago(h(0.5))),
      ],
    })

    // ════════════════════════════════════════════════════════════════════════
    // BATCH 3 — Social Commerce & Delivery  (7 tasks)
    // ════════════════════════════════════════════════════════════════════════

    const t18 = await Task.create({
      batchId: batchSocial._id, batchTitle: batchSocial.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Order food on Uber Eats and reach the checkout confirmation',
      description: 'Go to Uber Eats, navigate to a fast food restaurant (McDonald\'s or Burger King), add at least two items to your cart, proceed to checkout with test address: Times Square, New York, and document the complete ordering process with detailed notes about restaurant selection, menu navigation, cart management, and checkout flow. Do NOT complete payment.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.78,
      difficulty: 'easy', languageTags: ['en'],
      externalUrl: 'https://www.ubereats.com', estimatedDuration: 22,
      sla: new Date(now + d(6)),
      objective: 'Capture the full food ordering flow from restaurant selection to the checkout summary',
      successCriteria: [
        'Restaurant page with menu visible',
        'Cart showing at least two items with prices',
        'Checkout page with test delivery address and order total',
        'Order summary screen — do not confirm',
      ],
    })

    const t19 = await Task.create({
      batchId: batchSocial._id, batchTitle: batchSocial.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Create a product listing for a used smartphone on Facebook Marketplace',
      description: 'Go to Facebook Marketplace, navigate to Electronics → Phones, and create a new listing for a fictional used Samsung Galaxy A54 at $250. Fill all required fields with test data and document each step through to the listing preview with detailed notes about category selection, form completion, photo upload process, and preview generation.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.75,
      difficulty: 'medium', languageTags: ['en'],
      externalUrl: 'https://www.facebook.com/marketplace', estimatedDuration: 30,
      objective: 'Capture the seller listing creation flow from category selection to listing preview',
      successCriteria: [
        'Category path Electronics → Phones visible',
        'Listing form with test data (title, price, description) filled',
        'Photo upload step reached',
        'Listing preview page showing the completed listing',
      ],
    })

    const t20 = await Task.create({
      batchId: batchSocial._id, batchTitle: batchSocial.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Track a courier parcel on FedEx tracking portal',
      description: 'Go to the FedEx tracking portal, enter test tracking number 1234567890, view the full shipment history timeline, and document each step of the tracking flow with detailed notes about the tracking process, status updates, location history, and final delivery status information.',
      taskType: 'agentic-ai', status: 'in-progress', priority: 0.72,
      difficulty: 'easy', languageTags: ['en'],
      externalUrl: 'https://www.fedex.com/tracking', estimatedDuration: 15,
      annotatorId: kipchoge._id, annotatorEmail: kipchoge.email,
      startedAt: ago(h(0.5)),
      activityLog: [log('claimed', kipchoge, undefined, ago(h(0.5)))],
    })

    const t21 = await Task.create({
      batchId: batchSocial._id, batchTitle: batchSocial.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Search and save property listings on Zillow',
      description: 'Go to Zillow.com, search for 2-bedroom apartments for rent in Manhattan, New York ($3,000–$5,000/month), open the top three results, and save each one. Document the complete property search and saving process with detailed notes about search filters, property details, comparison features, and saved listings management.',
      taskType: 'agentic-ai', status: 'submitted', priority: 0.70,
      difficulty: 'medium', languageTags: ['en'],
      externalUrl: 'https://www.zillow.com', estimatedDuration: 28,
      annotatorId: wanjiru._id, annotatorEmail: wanjiru.email,
      startedAt: ago(h(4)), submittedAt: ago(h(0.5)), actualDuration: 26,
      notes: 'Three properties saved. All within KSh 30,000–50,000 range. One listing had no interior photos — noted.',
      activityLog: [
        log('claimed',   wanjiru, undefined,                                           ago(h(4))),
        log('submitted', wanjiru, 'Three properties saved. One listing had no photos', ago(h(0.5))),
      ],
    })

    const t22 = await Task.create({
      batchId: batchSocial._id, batchTitle: batchSocial.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Book a ride via the Uber web booking portal',
      description: 'Go to Uber web booking, enter pickup: Times Square, New York and drop-off: JFK Airport, select the UberX category, review the fare estimate, and document all steps through to the booking confirmation with detailed notes about location input, ride options, pricing, and confirmation process. Do NOT confirm the ride.',
      taskType: 'agentic-ai', status: 'data-ready', isLocked: true, priority: 0.74,
      difficulty: 'easy', languageTags: ['en'],
      externalUrl: 'https://www.uber.com', estimatedDuration: 18,
      annotatorId: njeri._id, annotatorEmail: njeri.email,
      reviewerId: mutua._id, reviewerEmail: mutua.email,
      qualityScore: 90,
      feedback: 'Pickup, drop-off, category selection, and fare estimate all clearly captured. Clean submission.',
      startedAt: ago(d(5)), submittedAt: ago(d(4) + h(2)),
      completedAt: ago(d(3)), signedOffAt: ago(d(3)), actualDuration: 16,
      notes: 'Fare estimate: KSh 1,200–1,450 for Bolt Go.',
      activityLog: [
        log('claimed',    njeri,  undefined,                             ago(d(5))),
        log('submitted',  njeri,  'Fare estimate KSh 1,200. All done',  ago(d(4) + h(2))),
        log('in-review',  mutua,  'Review started',                      ago(d(3) + h(4))),
        log('signed-off', mutua,  'Clean capture. Ready for dataset.',   ago(d(3))),
      ],
    })

    const t23 = await Task.create({
      batchId: batchSocial._id, batchTitle: batchSocial.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Search and book a hotel room on Booking.com',
      description: 'Go to Booking.com, search for hotels in Manhattan, New York for next weekend (1 night, 1 adult), open the top 2 results, compare amenities and prices, and add one to your booking cart. Document the complete hotel search and booking process with detailed notes about search filters, hotel comparisons, and cart management.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.68,
      difficulty: 'easy', languageTags: ['en'],
      externalUrl: 'https://www.booking.com', estimatedDuration: 25,
      objective: 'Capture the hotel search and booking cart flow on Jumia Travel',
      successCriteria: [
        'Nairobi CBD hotel search results page with filters applied',
        'Two hotel detail pages showing amenities and room prices',
        'Booking cart or checkout page with selected hotel visible',
      ],
    })

    const t24 = await Task.create({
      batchId: batchSocial._id, batchTitle: batchSocial.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Register as a service provider on TaskRabbit',
      description: 'Go to TaskRabbit.com, navigate to the service provider registration flow, fill in a test profile as a handyman, upload a placeholder portfolio image, and complete the registration form. Document every step through to the profile preview with detailed notes about the registration process, form completion, and profile setup.',
      taskType: 'agentic-ai', status: 'submitted', priority: 0.66,
      difficulty: 'medium', languageTags: ['en'],
      externalUrl: 'https://www.taskrabbit.com', estimatedDuration: 30,
      annotatorId: odhiambo._id, annotatorEmail: odhiambo.email,
      startedAt: ago(h(5)), submittedAt: ago(h(2)), actualDuration: 28,
      notes: 'Registered as a plumber with test profile. Placeholder image uploaded. Profile preview captured.',
      activityLog: [
        log('claimed',   odhiambo, undefined,                                         ago(h(5))),
        log('submitted', odhiambo, 'Test plumber profile registered. Preview done',   ago(h(2))),
      ],
    })

    // ════════════════════════════════════════════════════════════════════════
    // BATCH 4 — Mobile Money & Banking  (6 tasks)
    // ════════════════════════════════════════════════════════════════════════

    const t25 = await Task.create({
      batchId: batchFintech._id, batchTitle: batchFintech.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Log in and check account balance on Chase Bank',
      description: 'Go to Chase Bank online banking, log in with test credentials, navigate to Account Summary, and document the complete account access process with detailed notes about login procedures, security verification, account overview display, and balance information. Do NOT initiate any transactions.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.82,
      difficulty: 'easy', languageTags: ['en'],
      externalUrl: 'https://www.chase.com', estimatedDuration: 15,
      sla: new Date(now + d(8)),
      objective: 'Capture the login and account summary flow on KCB Internet Banking',
      successCriteria: [
        'KCB Internet Banking login page with credentials entered',
        'Account Summary page showing account name and balance',
        'Any 2FA or security confirmation step if encountered',
      ],
    })

    const t26 = await Task.create({
      batchId: batchFintech._id, batchTitle: batchFintech.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Apply for a personal loan via Wells Fargo online portal',
      description: 'Go to the Wells Fargo website, navigate to the personal loan application section, and fill in the application form using test data (loan amount: $50,000). Document each step of the multi-page form with detailed notes about form fields, validation processes, and loan summary generation.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.79,
      difficulty: 'hard', languageTags: ['en'],
      externalUrl: 'https://www.wellsfargo.com', estimatedDuration: 40,
      objective: 'Capture the full loan application flow from the NCBA Loop homepage to the summary screen',
      successCriteria: [
        'NCBA Loop homepage with loan application entry visible',
        'Personal and employment details form with test data',
        'Loan summary page showing amount, interest rate, and repayment terms',
      ],
    })

    const t27 = await Task.create({
      batchId: batchFintech._id, batchTitle: batchFintech.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Initiate a wire transfer on Bank of America portal',
      description: 'Log into the Bank of America online portal with test credentials, navigate to Fund Transfers → Wire Transfer, fill in a test transfer ($5,000 to a fictitious recipient), and document each step through to the transfer confirmation with detailed notes about the wire transfer process, recipient information, and verification steps. Do NOT submit the transfer.',
      taskType: 'agentic-ai', status: 'in-progress', priority: 0.77,
      difficulty: 'hard', languageTags: ['en'],
      externalUrl: 'https://www.bankofamerica.com', estimatedDuration: 35,
      annotatorId: odhiambo._id, annotatorEmail: odhiambo.email,
      startedAt: ago(h(1)),
      notes: 'Login successful. Fund Transfers → Pesalink located.',
      activityLog: [log('claimed', odhiambo, undefined, ago(h(1)))],
    })

    const t28 = await Task.create({
      batchId: batchFintech._id, batchTitle: batchFintech.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Download a 3-month bank statement on Wells Fargo online',
      description: 'Log into Wells Fargo online banking with test credentials, navigate to Statements, select the last 3 months date range, generate the PDF statement, and document the statement generation process with detailed notes about navigation paths, date selection, PDF preview, and download procedures.',
      taskType: 'agentic-ai', status: 'submitted', priority: 0.75,
      difficulty: 'medium', languageTags: ['en'],
      externalUrl: 'https://www.wellsfargo.com', estimatedDuration: 25,
      annotatorId: kipchoge._id, annotatorEmail: kipchoge.email,
      startedAt: ago(h(3)), submittedAt: ago(h(0.5)), actualDuration: 23,
      notes: 'Navigation: Dashboard → Accounts → Statements → Date Range → Generate. PDF preview captured.',
      activityLog: [
        log('claimed',   kipchoge, undefined,                                      ago(h(3))),
        log('submitted', kipchoge, 'Statement PDF generated and screenshotted',    ago(h(0.5))),
      ],
    })

    const t29 = await Task.create({
      batchId: batchFintech._id, batchTitle: batchFintech.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Send money internationally via Western Union online',
      description: 'Go to the Western Union website, navigate to Send Money → International Transfer, select United Kingdom as the destination, fill in test recipient details (name, address), and document each step through to the fee summary page with detailed notes about the international transfer setup, exchange rates, and fee calculations. Do NOT confirm the transfer.',
      taskType: 'agentic-ai', status: 'unclaimed', priority: 0.73,
      difficulty: 'hard', languageTags: ['en'],
      externalUrl: 'https://www.westernunion.com', estimatedDuration: 35,
      objective: 'Capture the international money transfer setup flow on M-Pesa GlobalPay',
      successCriteria: [
        'GlobalPay portal with Send Money section visible',
        'Country selection page with UK selected',
        'Test recipient details form filled',
        'Fee summary page showing exchange rate and transfer fee — do not confirm',
      ],
    })

    const t30 = await Task.create({
      batchId: batchFintech._id, batchTitle: batchFintech.title,
      workflowId: agenticWF._id, workflowName: 'Agentic AI Evaluation',
      title: 'Check and repay a personal loan balance online',
      description: 'Log into the personal loan portal via the bank website, navigate to Loans → Active Loans, view the outstanding balance and repayment schedule, and document the loan management process with detailed notes about account access, loan details display, repayment options, and payment form. Do NOT submit repayment.',
      taskType: 'agentic-ai', status: 'in-progress', priority: 0.71,
      difficulty: 'medium', languageTags: ['en', 'sw'],
      externalUrl: 'https://www.wellsfargo.com', estimatedDuration: 22,
      annotatorId: wanjiru._id, annotatorEmail: wanjiru.email,
      startedAt: ago(h(0.5)),
      activityLog: [log('claimed', wanjiru, undefined, ago(h(0.5)))],
    })

    // ── Update batch task counts ──────────────────────────────────────────────
    await Promise.all([
      Batch.findByIdAndUpdate(batchWebEC._id,   { tasksTotal: 10, tasksCompleted: 1 }),
      Batch.findByIdAndUpdate(batchWebGov._id,  { tasksTotal: 7,  tasksCompleted: 1 }),
      Batch.findByIdAndUpdate(batchSocial._id,  { tasksTotal: 7,  tasksCompleted: 1 }),
      Batch.findByIdAndUpdate(batchFintech._id, { tasksTotal: 6,  tasksCompleted: 0 }),
    ])

    // ── Reviews (12 — all review statuses covered) ────────────────────────────

    // R1 — PENDING (t3, Odhiambo — Safaricom Paybill)
    await Review.create({
      taskId: t3._id, taskTitle: t3.title,
      batchId: batchWebEC._id, batchTitle: batchWebEC.title, workflowId: agenticWF._id,
      annotatorId: odhiambo._id, annotatorEmail: odhiambo.email, annotatorName: odhiambo.name,
      status: 'pending', submittedAt: ago(h(1)),
    })

    // R2 — IN-REVIEW (t4, Wanjiru / Amina — Policyhouse insurance)
    await Review.create({
      taskId: t4._id, taskTitle: t4.title,
      batchId: batchWebEC._id, batchTitle: batchWebEC.title, workflowId: agenticWF._id,
      annotatorId: wanjiru._id, annotatorEmail: wanjiru.email, annotatorName: wanjiru.name,
      reviewerId: amina._id, reviewerEmail: amina.email, reviewerName: amina.name,
      status: 'in-review', submittedAt: ago(h(4)),
    })

    // R3 — REVISION-REQUESTED (t5, Kipchoge / Mutua — KRA iTax)
    await Review.create({
      taskId: t5._id, taskTitle: t5.title,
      batchId: batchWebEC._id, batchTitle: batchWebEC.title, workflowId: agenticWF._id,
      annotatorId: kipchoge._id, annotatorEmail: kipchoge.email, annotatorName: kipchoge.name,
      reviewerId: mutua._id, reviewerEmail: mutua.email, reviewerName: mutua.name,
      status: 'revision-requested', decision: 'request-rework',
      comments: 'Navigation screenshots for steps 2–4 are missing — only the final PDF was submitted. Redo from the login page and capture every screen. Menu path in Notes is also incomplete.',
      reasonCode: 'incomplete',
      errorTags: [
        { tagId: 'rev-etag-001', severity: 'major', category: 'missing-critical-step',
          message: 'Missing Critical Steps', stepReference: 'Screenshots 2–4',
          scoreDeduction: 20, status: 'open', createdBy: mutua._id.toString(), createdByEmail: mutua.email },
        { tagId: 'rev-etag-002', severity: 'minor', category: 'missing-minor-context',
          message: 'Missing Minor Context', stepReference: 'Notes',
          scoreDeduction: 5, status: 'open', createdBy: mutua._id.toString(), createdByEmail: mutua.email },
      ],
      submittedAt: ago(h(10)), reviewedAt: ago(h(6)),
    })

    // R4 — APPROVED (t7, Odhiambo / Amina — Jambojet)
    await Review.create({
      taskId: t7._id, taskTitle: t7.title,
      batchId: batchWebEC._id, batchTitle: batchWebEC.title, workflowId: agenticWF._id,
      annotatorId: odhiambo._id, annotatorEmail: odhiambo.email, annotatorName: odhiambo.name,
      reviewerId: amina._id, reviewerEmail: amina.email, reviewerName: amina.name,
      status: 'approved', decision: 'approve',
      qualityScore: 93, criteriaScores: { accuracy: 94, completeness: 92, adherence: 93 },
      comments: 'All required steps captured clearly. Booking summary shows itinerary, price, and passenger details.',
      submittedAt: ago(d(3) + h(3)), reviewedAt: ago(d(2)),
    })

    // R5 — REJECTED (t8, Njeri / Mutua — Naivas coupon)
    await Review.create({
      taskId: t8._id, taskTitle: t8.title,
      batchId: batchWebEC._id, batchTitle: batchWebEC.title, workflowId: agenticWF._id,
      annotatorId: njeri._id, annotatorEmail: njeri.email, annotatorName: njeri.name,
      reviewerId: mutua._id, reviewerEmail: mutua.email, reviewerName: mutua.name,
      status: 'rejected', decision: 'reject',
      comments: 'Task required navigating via the Offers section, but annotator used the search bar instead. The coupon field was never reached. Wrong navigation path — cannot be used for training.',
      reasonCode: 'inaccurate',
      errorTags: [
        { tagId: 'rev-etag-003', severity: 'major', category: 'wrong-navigation',
          message: 'Completely Wrong Navigation Path', stepReference: 'Screenshot 1',
          scoreDeduction: 20, status: 'open', createdBy: mutua._id.toString(), createdByEmail: mutua.email },
        { tagId: 'rev-etag-004', severity: 'major', category: 'task-not-completed',
          message: 'Task Not Completed Correctly', stepReference: 'Screenshot 4',
          scoreDeduction: 20, status: 'open', createdBy: mutua._id.toString(), createdByEmail: mutua.email },
      ],
      submittedAt: ago(d(1) + h(8)), reviewedAt: ago(d(1) + h(4)),
    })

    // R6 — APPROVED (t13, Njeri / Amina — M-Pesa simulator)
    await Review.create({
      taskId: t13._id, taskTitle: t13.title,
      batchId: batchWebGov._id, batchTitle: batchWebGov.title, workflowId: agenticWF._id,
      annotatorId: njeri._id, annotatorEmail: njeri.email, annotatorName: njeri.name,
      reviewerId: amina._id, reviewerEmail: amina.email, reviewerName: amina.name,
      status: 'approved', decision: 'approve',
      qualityScore: 96, criteriaScores: { accuracy: 97, completeness: 95, adherence: 96 },
      comments: 'All three screenshots captured in the correct sequence with transaction reference clearly visible.',
      submittedAt: ago(d(2) + h(4)), reviewedAt: ago(d(1)),
    })

    // R7 — ESCALATED (t10, Kipchoge / Amina — Jubilee Insurance quote)
    await Review.create({
      taskId: t10._id, taskTitle: t10.title,
      batchId: batchWebEC._id, batchTitle: batchWebEC.title, workflowId: agenticWF._id,
      annotatorId: kipchoge._id, annotatorEmail: kipchoge.email, annotatorName: kipchoge.name,
      reviewerId: amina._id, reviewerEmail: amina.email, reviewerName: amina.name,
      status: 'escalated', decision: 'escalate',
      comments: 'The quote figures captured (KSh 42,500/yr) do not match the published rates on the Jubilee website for a 2019 Toyota Axio. Escalating — underwriting specialist needed to verify accuracy before this can be approved or rejected.',
      reasonCode: 'needs-clarification',
      submittedAt: ago(h(1)), reviewedAt: ago(h(0.5)),
    })

    // R8 — FLAGGED (t17, Njeri / Mutua — NHIF card replacement)
    await Review.create({
      taskId: t17._id, taskTitle: t17.title,
      batchId: batchWebGov._id, batchTitle: batchWebGov.title, workflowId: agenticWF._id,
      annotatorId: njeri._id, annotatorEmail: njeri.email, annotatorName: njeri.name,
      reviewerId: mutua._id, reviewerEmail: mutua.email, reviewerName: mutua.name,
      status: 'flagged', decision: 'flag',
      comments: 'Activity log shows all 5 navigation steps completed in under 90 seconds, including page loads. This timing is inconsistent with normal browser navigation — possible that screenshots were fabricated or sourced externally. Flagged for data integrity investigation.',
      reasonCode: 'inaccurate',
      errorTags: [
        { tagId: 'rev-etag-005', severity: 'major', category: 'fabricated-results',
          message: 'Fabricated or Unsupported Results', stepReference: 'Activity log',
          scoreDeduction: 20, status: 'open', createdBy: mutua._id.toString(), createdByEmail: mutua.email },
        { tagId: 'rev-etag-006', severity: 'minor', category: 'timing-irregularity',
          message: 'Timing Irregularity', stepReference: 'Screenshots 1–5',
          scoreDeduction: 5, status: 'open', createdBy: mutua._id.toString(), createdByEmail: mutua.email },
      ],
      submittedAt: ago(h(0.5)), reviewedAt: ago(h(0.25)),
    })

    // R9 — ON-HOLD (t24, Odhiambo / Amina — Lynk registration)
    await Review.create({
      taskId: t24._id, taskTitle: t24.title,
      batchId: batchSocial._id, batchTitle: batchSocial.title, workflowId: agenticWF._id,
      annotatorId: odhiambo._id, annotatorEmail: odhiambo.email, annotatorName: odhiambo.name,
      reviewerId: amina._id, reviewerEmail: amina.email, reviewerName: amina.name,
      status: 'on-hold', decision: 'hold',
      comments: 'The portfolio image uploaded in step 4 does not appear to be a generated placeholder — it looks like a real person\'s photograph. Holding pending admin guidance on whether real photos are permitted as test data in this batch.',
      reasonCode: 'needs-clarification',
      submittedAt: ago(h(2)), reviewedAt: ago(h(1)),
    })

    // R10 — PENDING (t21, Wanjiru — BuyRentKenya)
    await Review.create({
      taskId: t21._id, taskTitle: t21.title,
      batchId: batchSocial._id, batchTitle: batchSocial.title, workflowId: agenticWF._id,
      annotatorId: wanjiru._id, annotatorEmail: wanjiru.email, annotatorName: wanjiru.name,
      status: 'pending', submittedAt: ago(h(0.5)),
    })

    // R11 — APPROVED (t22, Njeri / Mutua — Bolt ride booking)
    await Review.create({
      taskId: t22._id, taskTitle: t22.title,
      batchId: batchSocial._id, batchTitle: batchSocial.title, workflowId: agenticWF._id,
      annotatorId: njeri._id, annotatorEmail: njeri.email, annotatorName: njeri.name,
      reviewerId: mutua._id, reviewerEmail: mutua.email, reviewerName: mutua.name,
      status: 'approved', decision: 'approve',
      qualityScore: 90, criteriaScores: { accuracy: 91, completeness: 89, adherence: 90 },
      comments: 'Pickup, drop-off, category selection, and fare estimate all clearly captured. Clean submission.',
      submittedAt: ago(d(4) + h(2)), reviewedAt: ago(d(3)),
    })

    // R12 — PENDING (t28, Kipchoge — Equity Bank statement)
    await Review.create({
      taskId: t28._id, taskTitle: t28.title,
      batchId: batchFintech._id, batchTitle: batchFintech.title, workflowId: agenticWF._id,
      annotatorId: kipchoge._id, annotatorEmail: kipchoge.email, annotatorName: kipchoge.name,
      status: 'pending', submittedAt: ago(h(0.5)),
    })

    // ── Notifications ─────────────────────────────────────────────────────────
    await Notification.insertMany([
      {
        userId: wanjiru._id, type: 'batch-assigned',
        title: 'New Batch Available',
        message: `You have been assigned to "${batchWebEC.title}". High-priority tasks are ready to claim.`,
        actionUrl: `/dashboard/workflows/${agenticWF._id}`, read: false,
      },
      {
        userId: wanjiru._id, type: 'review-needed',
        title: 'Task Under Review',
        message: `Your task "${t4.title}" is being reviewed by Amina Hassan.`,
        actionUrl: `/dashboard/tasks/${t4._id}`, read: true,
      },
      {
        userId: odhiambo._id, type: 'task-approved',
        title: 'Task Signed Off — Data Ready',
        message: `Your task "${t7.title}" scored 93% and is now in the training dataset.`,
        actionUrl: `/dashboard/tasks/${t7._id}`, read: false,
      },
      {
        userId: odhiambo._id, type: 'escalation',
        title: 'Task Escalated for Specialist Review',
        message: `Your task "${t10.title}" has been escalated. An underwriting specialist will review the quote figures.`,
        actionUrl: `/dashboard/tasks/${t10._id}`, read: false,
      },
      {
        userId: njeri._id, type: 'task-approved',
        title: 'Task Signed Off — Data Ready',
        message: `Your task "${t13.title}" scored 96% and is now in the training dataset.`,
        actionUrl: `/dashboard/tasks/${t13._id}`, read: false,
      },
      {
        userId: njeri._id, type: 'task-approved',
        title: 'Task Signed Off — Data Ready',
        message: `Your task "${t22.title}" scored 90% and has been added to the training dataset.`,
        actionUrl: `/dashboard/tasks/${t22._id}`, read: true,
      },
      {
        userId: njeri._id, type: 'task-rejected',
        title: 'Task Rejected',
        message: `Your task "${t8.title}" was rejected. The Offers section navigation path was not followed.`,
        actionUrl: `/dashboard/tasks/${t8._id}`, read: false,
      },
      {
        userId: njeri._id, type: 'priority-warning',
        title: 'Task Flagged for Investigation',
        message: `Your task "${t17.title}" was flagged. Activity log timing appears inconsistent with real navigation.`,
        actionUrl: `/dashboard/tasks/${t17._id}`, read: false,
      },
      {
        userId: kipchoge._id, type: 'task-rejected',
        title: 'Rework Required',
        message: `Your task "${t5.title}" needs rework. Navigation screenshots for steps 2–4 are missing.`,
        actionUrl: `/dashboard/tasks/${t5._id}`, read: false,
      },
      {
        userId: kipchoge._id, type: 'review-needed',
        title: 'Task Submitted — Awaiting Reviewer',
        message: `Your task "${t28.title}" has been submitted and is waiting for a reviewer.`,
        actionUrl: `/dashboard/tasks/${t28._id}`, read: false,
      },
      {
        userId: odhiambo._id, type: 'system',
        title: 'Review On Hold',
        message: `Your task "${t24.title}" is on hold pending admin guidance on acceptable test images.`,
        actionUrl: `/dashboard/tasks/${t24._id}`, read: false,
      },
      {
        userId: amina._id, type: 'review-needed',
        title: 'New Tasks Ready for Review',
        message: `"${t3.title}" and "${t21.title}" are awaiting review.`,
        actionUrl: `/dashboard/reviews`, read: false,
      },
      {
        userId: mutua._id, type: 'review-needed',
        title: 'New Task Ready for Review',
        message: `"${t28.title}" submitted by Kipchoge Ruto is awaiting review.`,
        actionUrl: `/dashboard/reviews`, read: false,
      },
      {
        userId: zawadi._id, type: 'escalation',
        title: 'Escalated Review Requires Admin Action',
        message: `Review for "${t10.title}" escalated by Amina Hassan — underwriting specialist needed.`,
        actionUrl: `/dashboard/reviews`, read: false,
      },
      {
        userId: zawadi._id, type: 'priority-warning',
        title: 'Flagged Task — Investigation Required',
        message: `"${t17.title}" flagged by Mutua Kibet for timing inconsistency. Please investigate.`,
        actionUrl: `/dashboard/tasks/${t17._id}`, read: false,
      },
      {
        userId: zawadi._id, type: 'deadline',
        title: 'Batch Deadline Approaching',
        message: `"${batchWebEC.title}" has 9 incomplete tasks with a deadline in 14 days.`,
        actionUrl: `/dashboard/workflows/${agenticWF._id}`, read: false,
      },
      {
        userId: zawadi._id, type: 'system',
        title: 'Database Seeded',
        message: '30 agentic-AI tasks across 4 batches. All task and review statuses represented.',
        read: false,
      },
    ])

    return NextResponse.json({
      message: 'Database seeded successfully',
      summary: {
        users: 7, workflows: 5, batches: 8, tasks: 30, reviews: 12, notifications: 17,
        activeWorkflow: 'agentic-ai',
        taskStatuses: ['unclaimed(10)', 'in-progress(5)', 'paused(1)', 'submitted(5)', 'in-review(1)', 'revision-requested(1)', 'rejected(1)', 'data-ready(3) [t7,t13,t22]'],
        reviewStatuses: ['pending(3)', 'in-review(1)', 'revision-requested(1)', 'rejected(1)', 'approved(3)', 'escalated(1)', 'flagged(1)', 'on-hold(1)'],
        note: 'LLM, Multimodal, Evaluation, and Preference-Ranking batches are defined but empty.',
      },
      credentials: {
        annotator:  { email: 'wanjiru.kamau@labelforge.ai',   password: 'annotator123!' },
        annotator2: { email: 'odhiambo.otieno@labelforge.ai', password: 'annotator123!' },
        annotator3: { email: 'njeri.mwangi@labelforge.ai',    password: 'annotator123!' },
        annotator4: { email: 'kipchoge.ruto@labelforge.ai',   password: 'annotator123!' },
        reviewer:   { email: 'amina.hassan@labelforge.ai',    password: 'reviewer123!'  },
        reviewer2:  { email: 'mutua.kibet@labelforge.ai',     password: 'reviewer123!'  },
        admin:      { email: 'zawadi.ndungu@labelforge.ai',   password: 'admin123!'     },
      },
    })
  } catch (err) {
    console.error('[seed]', err)
    return NextResponse.json({ error: 'Seed failed', details: String(err) }, { status: 500 })
  }
}

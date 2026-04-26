'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Plus, Award, UserPlus, Workflow, Layers, X, Check,
  Upload, FileJson, FileText, ChevronDown, ChevronRight,
  ListTodo, ExternalLink, AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TopBar } from '@/components/top-bar'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import type { User, Workflow as WorkflowType, Batch } from '@/lib/types'

const TASK_TYPES = ['agentic-ai', 'llm-training', 'multimodal', 'evaluation', 'benchmarking', 'preference-ranking', 'red-teaming', 'data-collection']

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [workflows, setWorkflows] = useState<WorkflowType[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialogs
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'annotator', department: '' })
  const [isCreating, setIsCreating] = useState(false)

  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '', type: 'agentic-ai' })
  const [isCreatingWF, setIsCreatingWF] = useState(false)

  const [showCreateBatch, setShowCreateBatch] = useState(false)
  const [newBatchWorkflowId, setNewBatchWorkflowId] = useState('')
  const [newBatch, setNewBatch] = useState({ title: '', description: '', instructions: '', taskType: 'agentic-ai', priority: '0.8', workloadEstimate: '10', deadline: '' })
  const [isCreatingBatch, setIsCreatingBatch] = useState(false)

  const [badgeUser, setBadgeUser] = useState<User | null>(null)
  const [newBadge, setNewBadge] = useState({ type: 'expertise', name: '', description: '' })

  const [assignWorkflow, setAssignWorkflow] = useState<WorkflowType | null>(null)

  // Batch import dialog
  const [importBatch, setImportBatch] = useState<Batch | null>(null)
  const [importText, setImportText] = useState('')
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json')
  const [importMeta, setImportMeta] = useState({ priority: '', difficulty: '', languageTags: '', sla: '', estimatedDuration: '' })
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState<{ created: number; errors: number } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Expanded workflows in batch tab
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user && user.role !== 'admin') { router.push('/dashboard'); return }
    Promise.all([api.users.list(), api.workflows.list(), api.batches.list()])
      .then(([u, w, b]) => { setUsers(u); setWorkflows(w); setBatches(b) })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [user])

  if (!user || user.role !== 'admin') return null

  // ─── handlers ────────────────────────────────────────────────────────────────

  const handleCreateUser = async () => {
    setIsCreating(true)
    try {
      const created = await api.users.create(newUser)
      setUsers(prev => [...prev, created])
      setShowCreateUser(false)
      setNewUser({ name: '', email: '', password: '', role: 'annotator', department: '' })
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed') }
    finally { setIsCreating(false) }
  }

  const handleCreateWorkflow = async () => {
    setIsCreatingWF(true)
    try {
      const created = await api.workflows.create(newWorkflow)
      setWorkflows(prev => [...prev, created])
      setShowCreateWorkflow(false)
      setNewWorkflow({ name: '', description: '', type: 'agentic-ai' })
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed') }
    finally { setIsCreatingWF(false) }
  }

  const handleCreateBatch = async () => {
    if (!newBatchWorkflowId) return
    setIsCreatingBatch(true)
    const wf = workflows.find(w => w.id === newBatchWorkflowId)
    try {
      const created = await api.batches.create({
        workflowId: newBatchWorkflowId,
        workflowName: wf?.name ?? '',
        title: newBatch.title,
        description: newBatch.description,
        instructions: newBatch.instructions,
        taskType: newBatch.taskType,
        priority: parseFloat(newBatch.priority),
        workloadEstimate: parseInt(newBatch.workloadEstimate),
        deadline: newBatch.deadline || undefined,
        status: 'available',
        tasksTotal: 0,
        tasksCompleted: 0,
      })
      setBatches(prev => [...prev, created])
      setShowCreateBatch(false)
      setNewBatch({ title: '', description: '', instructions: '', taskType: 'agentic-ai', priority: '0.8', workloadEstimate: '10', deadline: '' })
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed') }
    finally { setIsCreatingBatch(false) }
  }

  const handleToggleUserStatus = async (u: User) => {
    try {
      const updated = await api.users.update(u.id, { isActive: !u.isActive })
      setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, isActive: updated.isActive } : usr))
    } catch { /* noop */ }
  }

  const handleAwardBadge = async () => {
    if (!badgeUser || !newBadge.name) return
    try {
      const updated = await api.users.awardBadge(badgeUser.id, newBadge)
      setUsers(prev => prev.map(u => u.id === badgeUser.id ? { ...u, badges: updated.badges } : u))
      setBadgeUser(null)
      setNewBadge({ type: 'expertise', name: '', description: '' })
    } catch { /* noop */ }
  }

  const handleRemoveBadge = async (userId: string, badge: { type: string; name: string }) => {
    try {
      const updated = await api.users.removeBadge(userId, badge)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, badges: updated.badges } : u))
    } catch { /* noop */ }
  }

  const handleAssignUser = async (workflowId: string, userId: string) => {
    try {
      const updated = await api.workflows.assign(workflowId, userId)
      setWorkflows(prev => prev.map(w => w.id === workflowId ? { ...w, assignedUsers: updated.assignedUsers } : w))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed') }
  }

  const handleUnassignUser = async (workflowId: string, userId: string) => {
    try {
      const updated = await api.workflows.unassign(workflowId, userId)
      setWorkflows(prev => prev.map(w => w.id === workflowId ? { ...w, assignedUsers: updated.assignedUsers } : w))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed') }
  }

  const parseCsvToJson = (csv: string): Record<string, unknown>[] => {
    const lines = csv.trim().split('\n').filter(Boolean)
    if (lines.length < 2) throw new Error('CSV needs a header row + at least one data row')
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj: Record<string, unknown> = {}
      headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
      return obj
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isCsv = file.name.endsWith('.csv')
    setImportFormat(isCsv ? 'csv' : 'json')
    const reader = new FileReader()
    reader.onload = ev => setImportText(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!importBatch) return
    setImportError('')
    setImportResult(null)
    let tasks: Record<string, unknown>[]
    try {
      tasks = importFormat === 'csv' ? parseCsvToJson(importText) : JSON.parse(importText)
      if (!Array.isArray(tasks)) throw new Error('Must be a JSON array')
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : 'Parse error')
      return
    }
    setIsImporting(true)
    const metadata: Record<string, unknown> = {}
    if (importMeta.priority) metadata.priority = parseFloat(importMeta.priority)
    if (importMeta.difficulty) metadata.difficulty = importMeta.difficulty
    if (importMeta.estimatedDuration) metadata.estimatedDuration = parseInt(importMeta.estimatedDuration)
    if (importMeta.sla) metadata.sla = importMeta.sla
    if (importMeta.languageTags) metadata.languageTags = importMeta.languageTags
    try {
      const result = await api.tasks.bulkImport(importBatch.id, tasks, metadata)
      setImportResult({ created: result.created, errors: result.errors })
      // Refresh batches to update task counts
      const updated = await api.batches.list()
      setBatches(updated)
      if (result.errors === 0) {
        setTimeout(() => { setImportBatch(null); setImportText(''); setImportResult(null) }, 2000)
      }
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : 'Import failed')
    } finally { setIsImporting(false) }
  }

  // ─── helpers ─────────────────────────────────────────────────────────────────

  const badgeTypeColors: Record<string, string> = {
    role: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    expertise: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    level: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }

  const toggleExpand = (id: string) => {
    setExpandedWorkflows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Group batches by workflow
  const batchesByWorkflow = batches.reduce<Record<string, Batch[]>>((acc, b) => {
    const key = b.workflowId
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <TopBar title="Admin Panel" subtitle="Manage users, workflows, batches, and task pipelines" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Tabs defaultValue="workflows" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-1.5 text-xs"><Workflow className="h-3.5 w-3.5" />Workflows</TabsTrigger>
            <TabsTrigger value="batches" className="flex items-center gap-1.5 text-xs"><ListTodo className="h-3.5 w-3.5" />Batches & Tasks</TabsTrigger>
            <TabsTrigger value="seed" className="flex items-center gap-1.5 text-xs"><Layers className="h-3.5 w-3.5" />Seed Data</TabsTrigger>
          </TabsList>

          {/* ── Users ──────────────────────────────────────────── */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{users.length} total users</h3>
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowCreateUser(true)}>
                <UserPlus className="h-3.5 w-3.5" />Create User
              </Button>
            </div>
            {isLoading ? <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
              : error ? <div className="text-destructive text-sm text-center py-12">{error}</div>
              : (
                <div className="space-y-3">
                  {users.map(u => (
                    <Card key={u.id} className="border-border bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium shrink-0">
                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-sm">{u.name}</span>
                              <Badge variant="outline" className="text-[10px] capitalize">{u.role}</Badge>
                              {!u.isActive && <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive">Inactive</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{u.email}</p>
                            {u.badges && u.badges.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {u.badges.map((badge, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <Badge variant="outline" className={`text-[10px] ${badgeTypeColors[badge.type] || ''}`}>{badge.name}</Badge>
                                    <button onClick={() => handleRemoveBadge(u.id, badge)} className="text-muted-foreground hover:text-destructive">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setBadgeUser(u)}>
                              <Award className="h-3.5 w-3.5" />Badge
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleToggleUserStatus(u)}>
                              {u.isActive ? <><X className="h-3.5 w-3.5" />Deactivate</> : <><Check className="h-3.5 w-3.5" />Activate</>}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
          </TabsContent>

          {/* ── Workflows ──────────────────────────────────────── */}
          <TabsContent value="workflows" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{workflows.length} workflows</h3>
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowCreateWorkflow(true)}>
                <Plus className="h-3.5 w-3.5" />Create Workflow
              </Button>
            </div>
            <div className="space-y-3">
              {workflows.map(w => {
                const assigned = (w.assignedUsers || []) as string[]
                const assignedObjs = users.filter(u => assigned.includes(u.id))
                return (
                  <Card key={w.id} className="border-border bg-card">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm">{w.name}</span>
                            <Badge variant="outline" className="text-[10px]">{w.type}</Badge>
                            <Badge variant="outline" className="text-[10px]">{w.batchCount} batch{w.batchCount !== 1 ? 'es' : ''}</Badge>
                            <Badge variant="outline" className="text-[10px]">{w.taskCount} tasks</Badge>
                            {!w.isActive && <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Inactive</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{w.description}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAssignWorkflow(w)}>
                            <Users className="h-3.5 w-3.5 mr-1" />Assign
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                            <Link href={`/dashboard/workflows/${w.id}`}><ExternalLink className="h-3.5 w-3.5 mr-1" />Manage</Link>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() =>
                            api.workflows.update(w.id, { isActive: !w.isActive })
                              .then(upd => setWorkflows(prev => prev.map(wf => wf.id === w.id ? { ...wf, isActive: upd.isActive } : wf)))
                          }>
                            {w.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                      {assignedObjs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedObjs.map(u => (
                            <div key={u.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                              <span className="text-[10px] text-primary">{u.name}</span>
                              <button onClick={() => handleUnassignUser(w.id, u.id)} className="text-primary/60 hover:text-destructive">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {assignedObjs.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">No users assigned — not visible to annotators or reviewers</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* ── Batches & Tasks (full hierarchy) ───────────────── */}
          <TabsContent value="batches" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                {batches.length} batches · {batches.reduce((s, b) => s + b.tasksTotal, 0)} tasks total
              </h3>
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => { setNewBatchWorkflowId(workflows[0]?.id ?? ''); setShowCreateBatch(true) }}>
                <Plus className="h-3.5 w-3.5" />New Batch
              </Button>
            </div>

            {isLoading ? <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
              : error ? <div className="text-destructive text-sm text-center py-12">{error}</div>
              : workflows.length === 0 ? (
                <Card className="border-border bg-card">
                  <CardContent className="flex flex-col items-center justify-center py-10 gap-2">
                    <p className="text-muted-foreground text-sm">No workflows yet. Create one first.</p>
                    <Button size="sm" onClick={() => setShowCreateWorkflow(true)}><Plus className="h-4 w-4 mr-1" />Create Workflow</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {workflows.map(wf => {
                    const wfBatches = batchesByWorkflow[wf.id] ?? []
                    const expanded = expandedWorkflows.has(wf.id)
                    const totalTasks = wfBatches.reduce((s, b) => s + b.tasksTotal, 0)
                    const completedTasks = wfBatches.reduce((s, b) => s + b.tasksCompleted, 0)
                    return (
                      <Card key={wf.id} className="border-border bg-card">
                        {/* Workflow header row */}
                        <button className="w-full text-left" onClick={() => toggleExpand(wf.id)}>
                          <div className="flex items-center gap-3 p-4">
                            {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{wf.name}</span>
                                <Badge variant="outline" className="text-[10px]">{wf.type}</Badge>
                                {!wf.isActive && <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Inactive</Badge>}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                              <span>{wfBatches.length} batch{wfBatches.length !== 1 ? 'es' : ''}</span>
                              <span>{completedTasks}/{totalTasks} tasks</span>
                            </div>
                          </div>
                        </button>

                        {/* Batches under this workflow */}
                        {expanded && (
                          <div className="border-t border-border">
                            {wfBatches.length === 0 ? (
                              <div className="px-4 py-3 flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">No batches yet</p>
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                  onClick={() => { setNewBatchWorkflowId(wf.id); setShowCreateBatch(true) }}>
                                  <Plus className="h-3.5 w-3.5" />Add Batch
                                </Button>
                              </div>
                            ) : (
                              <>
                                {wfBatches.map((batch, i) => {
                                  const pct = batch.tasksTotal > 0 ? Math.round((batch.tasksCompleted / batch.tasksTotal) * 100) : 0
                                  return (
                                    <div key={batch.id} className={`px-4 py-3 ${i < wfBatches.length - 1 ? 'border-b border-border' : ''}`}>
                                      <div className="flex items-center gap-3">
                                        <div className="w-3 shrink-0" /> {/* indent */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-sm font-medium">{batch.title}</span>
                                            <Badge variant="outline" className="text-[10px]">{batch.taskType}</Badge>
                                            {batch.deadline && (
                                              <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                                                Due {new Date(batch.deadline).toLocaleDateString()}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>{batch.tasksCompleted}/{batch.tasksTotal} completed</span>
                                            <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-secondary overflow-hidden">
                                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span>{pct}%</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                            onClick={() => { setImportBatch(batch); setImportText(''); setImportFormat('json'); setImportMeta({ priority: '', difficulty: '', languageTags: '', sla: '', estimatedDuration: '' }); setImportResult(null) }}>
                                            <Upload className="h-3.5 w-3.5" />Import Tasks
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                                            <Link href={`/dashboard/workflows/${wf.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                                <div className="px-4 py-2 border-t border-border/50">
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                    onClick={() => { setNewBatchWorkflowId(wf.id); setShowCreateBatch(true) }}>
                                    <Plus className="h-3.5 w-3.5" />Add Batch
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
          </TabsContent>

          {/* ── Seed ───────────────────────────────────────────── */}
          <TabsContent value="seed">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Database Seed</CardTitle>
                <CardDescription className="text-xs">Populate with test data. Clears all existing data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-sm text-warning font-medium">Warning: This will delete all existing data!</p>
                  <p className="text-xs text-muted-foreground mt-1">Creates 7 users (4 annotators, 2 reviewers, 1 admin), 3 workflows, 4 batches, 15 tasks across varied statuses, 6 reviews, and 9 notifications — all with Kenyan context.</p>
                </div>
                <Button variant="destructive" size="sm" onClick={async () => {
                  if (!confirm('Are you sure? This will delete all data.')) return
                  try {
                    const result = await api.seed()
                    const c = result.credentials
                    alert(
                      `Seeded! ${result.summary.tasks} tasks · ${result.summary.batches} batches · ${result.summary.workflows} workflows\n\n` +
                      `Annotators (password: annotator123!):\n  ${c.annotator.email}\n  ${c.annotator2.email}\n  ${c.annotator3.email}\n  ${c.annotator4.email}\n\n` +
                      `Reviewers (password: reviewer123!):\n  ${c.reviewer.email}\n  ${c.reviewer2.email}\n\n` +
                      `Admin (password: admin123!):\n  ${c.admin.email}`
                    )
                  } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Seed failed') }
                }}>Seed Database</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Create User ── */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create User</DialogTitle><DialogDescription>Add a new team member</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Full Name</Label><Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs mb-1 block">Email</Label><Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs mb-1 block">Password</Label><Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs mb-1 block">Role</Label>
              <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annotator">Annotator</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Department (optional)</Label><Input value={newUser.department} onChange={e => setNewUser(p => ({ ...p, department: e.target.value }))} className="h-9" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUser(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>{isCreating ? 'Creating...' : 'Create User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Workflow ── */}
      <Dialog open={showCreateWorkflow} onOpenChange={setShowCreateWorkflow}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Name</Label><Input value={newWorkflow.name} onChange={e => setNewWorkflow(p => ({ ...p, name: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs mb-1 block">Description</Label><Textarea value={newWorkflow.description} onChange={e => setNewWorkflow(p => ({ ...p, description: e.target.value }))} className="min-h-[80px]" /></div>
            <div><Label className="text-xs mb-1 block">Type</Label>
              <Select value={newWorkflow.type} onValueChange={v => setNewWorkflow(p => ({ ...p, type: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateWorkflow(false)}>Cancel</Button>
            <Button onClick={handleCreateWorkflow} disabled={isCreatingWF}>{isCreatingWF ? 'Creating...' : 'Create Workflow'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Batch ── */}
      <Dialog open={showCreateBatch} onOpenChange={setShowCreateBatch}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Batch</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <div><Label className="text-xs mb-1 block">Workflow *</Label>
              <Select value={newBatchWorkflowId} onValueChange={setNewBatchWorkflowId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select workflow..." /></SelectTrigger>
                <SelectContent>{workflows.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Title *</Label><Input value={newBatch.title} onChange={e => setNewBatch(p => ({ ...p, title: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs mb-1 block">Description</Label><Textarea value={newBatch.description} onChange={e => setNewBatch(p => ({ ...p, description: e.target.value }))} className="min-h-[60px]" /></div>
            <div><Label className="text-xs mb-1 block">Annotator Instructions</Label>
              <Textarea value={newBatch.instructions} onChange={e => setNewBatch(p => ({ ...p, instructions: e.target.value }))} className="min-h-[80px]" placeholder="Step-by-step instructions shown to annotators..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Task Type</Label>
                <Select value={newBatch.taskType} onValueChange={v => setNewBatch(p => ({ ...p, taskType: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs mb-1 block">Priority (0–1)</Label>
                <Input type="number" min="0" max="1" step="0.1" value={newBatch.priority} onChange={e => setNewBatch(p => ({ ...p, priority: e.target.value }))} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Est. Hours</Label>
                <Input type="number" value={newBatch.workloadEstimate} onChange={e => setNewBatch(p => ({ ...p, workloadEstimate: e.target.value }))} className="h-9" />
              </div>
              <div><Label className="text-xs mb-1 block">Deadline (optional)</Label>
                <Input type="date" value={newBatch.deadline} onChange={e => setNewBatch(p => ({ ...p, deadline: e.target.value }))} className="h-9" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBatch(false)}>Cancel</Button>
            <Button onClick={handleCreateBatch} disabled={isCreatingBatch || !newBatch.title || !newBatchWorkflowId}>
              {isCreatingBatch ? 'Creating...' : 'Create Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Task Import Pipeline ── */}
      <Dialog open={!!importBatch} onOpenChange={open => { if (!open) { setImportBatch(null); setImportText(''); setImportResult(null) } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Task Import Pipeline</DialogTitle>
            <DialogDescription>Import tasks into <strong>{importBatch?.title}</strong> via JSON or CSV</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

            {/* Format + file select */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {(['json', 'csv'] as const).map(f => (
                  <Button key={f} size="sm" variant={importFormat === f ? 'default' : 'outline'} className="h-7 text-xs uppercase gap-1"
                    onClick={() => { setImportFormat(f); setImportText('') }}>
                    {f === 'json' ? <FileJson className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}{f}
                  </Button>
                ))}
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 ml-auto" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" />Upload File
              </Button>
              <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFileSelect} />
            </div>

            {/* Format guide */}
            <div className="p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                {importFormat === 'json' ? 'JSON array — one object per task:' : 'CSV — first row is headers:'}
              </p>
              {importFormat === 'json' ? (
                <code className="block whitespace-pre font-mono">{`[ { "title": "...", "externalUrl": "https://...", "estimatedDuration": 30 }, ... ]`}</code>
              ) : (
                <>
                  <code className="block font-mono">title,externalUrl,estimatedDuration,description</code>
                  <code className="block font-mono">Navigate Amazon,https://www.amazon.com,30,Search for headphones</code>
                </>
              )}
              <p className="text-[10px] pt-1">Per-task fields override global metadata. Supported: title, externalUrl, description, estimatedDuration, priority, difficulty, languageTags</p>
            </div>

            <Textarea value={importText} onChange={e => { setImportText(e.target.value); setImportError(''); setImportResult(null) }}
              className="min-h-[150px] font-mono text-xs bg-secondary/30"
              placeholder={importFormat === 'json' ? '[{"title":"...","externalUrl":"https://..."}]' : 'title,externalUrl\nTask 1,https://example.com'} />

            {/* Global metadata */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Global Metadata <span className="text-muted-foreground font-normal">(applied to all tasks unless overridden per-task)</span></p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><Label className="text-[10px] mb-1 block">Priority (0–1)</Label>
                  <Input type="number" min="0" max="1" step="0.1" placeholder="Batch default" value={importMeta.priority}
                    onChange={e => setImportMeta(p => ({ ...p, priority: e.target.value }))} className="h-8 text-xs bg-secondary/30" /></div>
                <div><Label className="text-[10px] mb-1 block">Difficulty</Label>
                  <Select value={importMeta.difficulty || 'none'} onValueChange={v => setImportMeta(p => ({ ...p, difficulty: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-8 text-xs bg-secondary/30"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-[10px] mb-1 block">Est. Duration (min)</Label>
                  <Input type="number" placeholder="30" value={importMeta.estimatedDuration}
                    onChange={e => setImportMeta(p => ({ ...p, estimatedDuration: e.target.value }))} className="h-8 text-xs bg-secondary/30" /></div>
                <div><Label className="text-[10px] mb-1 block">Language Tags (comma-sep)</Label>
                  <Input placeholder="en, es, fr" value={importMeta.languageTags}
                    onChange={e => setImportMeta(p => ({ ...p, languageTags: e.target.value }))} className="h-8 text-xs bg-secondary/30" /></div>
                <div><Label className="text-[10px] mb-1 block">SLA Deadline</Label>
                  <Input type="date" value={importMeta.sla}
                    onChange={e => setImportMeta(p => ({ ...p, sla: e.target.value }))} className="h-8 text-xs bg-secondary/30" /></div>
              </div>
            </div>

            {importError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{importError}</p>
              </div>
            )}
            {importResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${importResult.errors === 0 ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
                <Check className={`h-4 w-4 shrink-0 ${importResult.errors === 0 ? 'text-success' : 'text-warning'}`} />
                <p className={`text-xs font-medium ${importResult.errors === 0 ? 'text-success' : 'text-warning'}`}>
                  {importResult.created} task{importResult.created !== 1 ? 's' : ''} created
                  {importResult.errors > 0 && ` · ${importResult.errors} error${importResult.errors !== 1 ? 's' : ''}`}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportBatch(null); setImportText(''); setImportResult(null) }}>Cancel</Button>
            <Button onClick={handleImport} disabled={isImporting || !importText.trim()}>
              <Upload className="h-4 w-4 mr-2" />{isImporting ? `Importing…` : 'Import Tasks'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Users ── */}
      <Dialog open={!!assignWorkflow} onOpenChange={open => { if (!open) setAssignWorkflow(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Users</DialogTitle>
            <DialogDescription>Control who can see "{assignWorkflow?.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {users.filter(u => u.role === 'annotator' || u.role === 'reviewer').map(u => {
              const isAssigned = ((assignWorkflow?.assignedUsers || []) as string[]).includes(u.id)
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email} · {u.role}</p>
                  </div>
                  <Button size="sm" variant={isAssigned ? 'destructive' : 'outline'} className="h-7 text-xs"
                    onClick={() => assignWorkflow && (isAssigned ? handleUnassignUser(assignWorkflow.id, u.id) : handleAssignUser(assignWorkflow.id, u.id))}>
                    {isAssigned ? <><X className="h-3.5 w-3.5 mr-1" />Remove</> : <><Check className="h-3.5 w-3.5 mr-1" />Assign</>}
                  </Button>
                </div>
              )
            })}
            {users.filter(u => u.role === 'annotator' || u.role === 'reviewer').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No annotators or reviewers yet</p>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAssignWorkflow(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Award Badge ── */}
      <Dialog open={!!badgeUser} onOpenChange={open => { if (!open) setBadgeUser(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Award Badge</DialogTitle><DialogDescription>Award a badge to {badgeUser?.name}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Badge Type</Label>
              <Select value={newBadge.type} onValueChange={v => setNewBadge(p => ({ ...p, type: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="expertise">Expertise</SelectItem>
                  <SelectItem value="level">Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Badge Name</Label>
              <Input value={newBadge.name} onChange={e => setNewBadge(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Agentic AI Specialist" className="h-9" /></div>
            <div><Label className="text-xs mb-1 block">Description</Label>
              <Input value={newBadge.description} onChange={e => setNewBadge(p => ({ ...p, description: e.target.value }))} className="h-9" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBadgeUser(null)}>Cancel</Button>
            <Button onClick={handleAwardBadge} disabled={!newBadge.name}>Award Badge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

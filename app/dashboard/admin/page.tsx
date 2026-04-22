'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Plus, Pencil, Shield, Award, Trash2, UserPlus,
  Workflow, Layers, X, Check,
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
import type { User, Workflow as WorkflowType } from '@/lib/types'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [workflows, setWorkflows] = useState<WorkflowType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create user dialog
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'annotator', department: '' })
  const [isCreating, setIsCreating] = useState(false)

  // Create workflow dialog
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '', type: 'agentic-ai' })
  const [isCreatingWF, setIsCreatingWF] = useState(false)

  // Badge dialog
  const [badgeUser, setBadgeUser] = useState<User | null>(null)
  const [newBadge, setNewBadge] = useState({ type: 'expertise', name: '', description: '' })

  // Assign users to workflow
  const [assignWorkflow, setAssignWorkflow] = useState<WorkflowType | null>(null)

  useEffect(() => {
    if (user && user.role !== 'admin') { router.push('/dashboard'); return }
    Promise.all([api.users.list(), api.workflows.list()])
      .then(([u, w]) => { setUsers(u); setWorkflows(w) })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [user])

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

  if (!user || user.role !== 'admin') return null

  const badgeTypeColors: Record<string, string> = {
    role: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    expertise: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    level: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }

  return (
    <>
      <TopBar title="Admin Panel" subtitle="Manage users, roles, badges, and workflows" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-1.5 text-xs"><Workflow className="h-3.5 w-3.5" />Workflows</TabsTrigger>
            <TabsTrigger value="seed" className="flex items-center gap-1.5 text-xs"><Layers className="h-3.5 w-3.5" />Seed Data</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{users.length} total users</h3>
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowCreateUser(true)}>
                <UserPlus className="h-3.5 w-3.5" />Create User
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-destructive text-sm">{error}</div>
            ) : (
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

          {/* Workflows Tab */}
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
                const assignedUserObjs = users.filter(u => assigned.includes(u.id))
                const annotators = users.filter(u => u.role === 'annotator')
                return (
                  <Card key={w.id} className="border-border bg-card">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm">{w.name}</span>
                            <Badge variant="outline" className="text-[10px]">{w.type}</Badge>
                            {!w.isActive && <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Inactive</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{w.description}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAssignWorkflow(w)}>
                            <Users className="h-3.5 w-3.5 mr-1" />Assign
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() =>
                            api.workflows.update(w.id, { isActive: !w.isActive })
                              .then(updated => setWorkflows(prev => prev.map(wf => wf.id === w.id ? { ...wf, isActive: updated.isActive } : wf)))
                          }>
                            {w.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                      {assignedUserObjs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedUserObjs.map(u => (
                            <div key={u.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                              <span className="text-[10px] text-primary">{u.name}</span>
                              <button onClick={() => handleUnassignUser(w.id, u.id)} className="text-primary/60 hover:text-destructive">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {assignedUserObjs.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">No annotators assigned — not visible to annotators</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Seed Tab */}
          <TabsContent value="seed">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Database Seed</CardTitle>
                <CardDescription className="text-xs">
                  Populate the database with test data. This will clear all existing data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-sm text-warning font-medium">Warning: This will delete all existing data!</p>
                  <p className="text-xs text-muted-foreground mt-1">Creates 3 users, 2 workflows, 2 batches, 5 tasks, and sample reviews/notifications.</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (!confirm('Are you sure? This will delete all data.')) return
                    try {
                      const result = await api.seed()
                      alert(`Seeded successfully!\n\nAnnotator: ${result.credentials.annotator.email}\nReviewer: ${result.credentials.reviewer.email}\nAdmin: ${result.credentials.admin.email}`)
                    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Seed failed') }
                  }}
                >
                  Seed Database
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Add a new team member to LabelForge</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Full Name</Label>
              <Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs mb-1 block">Email</Label>
              <Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs mb-1 block">Password</Label>
              <Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} className="h-9" /></div>
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
            <div><Label className="text-xs mb-1 block">Department (optional)</Label>
              <Input value={newUser.department} onChange={e => setNewUser(p => ({ ...p, department: e.target.value }))} className="h-9" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUser(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>{isCreating ? 'Creating...' : 'Create User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Workflow Dialog */}
      <Dialog open={showCreateWorkflow} onOpenChange={setShowCreateWorkflow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Name</Label>
              <Input value={newWorkflow.name} onChange={e => setNewWorkflow(p => ({ ...p, name: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs mb-1 block">Description</Label>
              <Textarea value={newWorkflow.description} onChange={e => setNewWorkflow(p => ({ ...p, description: e.target.value }))} className="min-h-[80px]" /></div>
            <div><Label className="text-xs mb-1 block">Type</Label>
              <Select value={newWorkflow.type} onValueChange={v => setNewWorkflow(p => ({ ...p, type: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agentic-ai">Agentic AI</SelectItem>
                  <SelectItem value="llm-training">LLM Training</SelectItem>
                  <SelectItem value="multimodal">Multimodal</SelectItem>
                  <SelectItem value="evaluation">Evaluation</SelectItem>
                  <SelectItem value="benchmarking">Benchmarking</SelectItem>
                  <SelectItem value="preference-ranking">Preference Ranking</SelectItem>
                  <SelectItem value="red-teaming">Red Teaming</SelectItem>
                  <SelectItem value="data-collection">Data Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateWorkflow(false)}>Cancel</Button>
            <Button onClick={handleCreateWorkflow} disabled={isCreatingWF}>{isCreatingWF ? 'Creating...' : 'Create Workflow'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={!!assignWorkflow} onOpenChange={open => { if (!open) setAssignWorkflow(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Annotators</DialogTitle>
            <DialogDescription>Control who can see and work on "{assignWorkflow?.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {users.filter(u => u.role === 'annotator').map(u => {
              const isAssigned = ((assignWorkflow?.assignedUsers || []) as string[]).includes(u.id)
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isAssigned ? 'destructive' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => assignWorkflow && (isAssigned
                      ? handleUnassignUser(assignWorkflow.id, u.id)
                      : handleAssignUser(assignWorkflow.id, u.id))}
                  >
                    {isAssigned ? <><X className="h-3.5 w-3.5 mr-1" />Remove</> : <><Check className="h-3.5 w-3.5 mr-1" />Assign</>}
                  </Button>
                </div>
              )
            })}
            {users.filter(u => u.role === 'annotator').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No annotators in the system yet</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignWorkflow(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Badge Dialog */}
      <Dialog open={!!badgeUser} onOpenChange={open => { if (!open) setBadgeUser(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Badge</DialogTitle>
            <DialogDescription>Award a badge to {badgeUser?.name}</DialogDescription>
          </DialogHeader>
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

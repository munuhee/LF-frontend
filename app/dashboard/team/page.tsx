'use client'

import { useEffect, useState } from 'react'
import { Users, Shield, Star, UserCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TopBar } from '@/components/top-bar'
import { api } from '@/lib/api'
import type { User } from '@/lib/types'

const roleColors: Record<string, string> = {
  super_admin:       'bg-destructive/10 text-destructive border-destructive/20',
  client_admin:      'bg-warning/10 text-warning border-warning/20',
  qa_lead:           'bg-success/10 text-success border-success/20',
  reviewer:          'bg-primary/10 text-primary border-primary/20',
  reviewer_annotator:'bg-primary/20 text-primary border-primary/30',
  annotator:         'bg-muted text-foreground border-border',
}

const badgeTypeColors: Record<string, string> = {
  role:      'bg-primary/10 text-primary border-primary/20',
  expertise: 'bg-success/10 text-success border-success/20',
  level:     'bg-warning/10 text-warning border-warning/20',
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.users.list(), api.analytics.get()])
      .then(([u, a]) => { setUsers(u); setAnalytics(a) })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const annotators = users.filter(u => u.role === 'annotator')
  const reviewers = users.filter(u => u.role === 'reviewer' || u.role === 'qa_lead')
  const admins = users.filter(u => u.role === 'client_admin' || u.role === 'super_admin')

  const annotatorPerf = (analytics?.annotatorPerformance as Record<string, unknown>[]) || []
  const reviewerAct = (analytics?.reviewerActivity as Record<string, unknown>[]) || []

  const getPerfForUser = (userId: string) => annotatorPerf.find(a => a.id === userId)
  const getActForUser = (userId: string) => reviewerAct.find(r => r.id === userId)

  const UserCard = ({ user }: { user: User }) => {
    const perf = user.role === 'annotator' ? getPerfForUser(user.id) : null
    const act = user.role === 'reviewer' ? getActForUser(user.id) : null
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-medium shrink-0">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-medium text-sm text-foreground">{user.name}</p>
                <Badge variant="outline" className={`text-[10px] ${roleColors[user.role]}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                {!user.isActive && <Badge variant="outline" className="text-[10px] bg-muted">Inactive</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{user.email}</p>
              {user.department && <p className="text-xs text-muted-foreground mb-2">{user.department}</p>}

              {/* Performance stats */}
              {perf && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span>{perf.tasksCompleted as number} tasks</span>
                  <span className={Number(perf.averageQuality) >= 90 ? 'text-success' : 'text-warning'}>{perf.averageQuality as number}% quality</span>
                  <span>{perf.averageTimeMinutes as number}m avg</span>
                </div>
              )}
              {act && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span>{act.reviewsCompleted as number} reviews</span>
                  <span className={Number(act.approvalRate) >= 85 ? 'text-success' : 'text-warning'}>{act.approvalRate as number}% approval</span>
                </div>
              )}

              {/* Badges */}
              {user.badges && user.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {user.badges.map((badge, i) => (
                    <Badge key={i} variant="outline" className={`text-[10px] ${badgeTypeColors[badge.type] || ''}`}>
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <TopBar title="Team" subtitle="View team members, roles, and performance" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Annotators', count: annotators.length, icon: UserCheck, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Reviewers', count: reviewers.length, icon: Shield, color: 'text-success',  bg: 'bg-success/10'  },
            { label: 'Admins',    count: admins.length,    icon: Star,   color: 'text-warning',  bg: 'bg-warning/10'  },
          ].map(s => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${s.bg}`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
                  <div>
                    <p className="text-xl font-bold">{s.count}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive text-sm">{error}</div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="bg-card border border-border h-9">
              <TabsTrigger value="all" className="text-xs">All ({users.length})</TabsTrigger>
              <TabsTrigger value="annotators" className="text-xs">Annotators ({annotators.length})</TabsTrigger>
              <TabsTrigger value="reviewers" className="text-xs">Reviewers ({reviewers.length})</TabsTrigger>
              <TabsTrigger value="admins" className="text-xs">Admins ({admins.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="grid md:grid-cols-2 gap-3">{users.map(u => <UserCard key={u.id} user={u} />)}</div>
            </TabsContent>
            <TabsContent value="annotators">
              <div className="grid md:grid-cols-2 gap-3">{annotators.map(u => <UserCard key={u.id} user={u} />)}</div>
            </TabsContent>
            <TabsContent value="reviewers">
              <div className="grid md:grid-cols-2 gap-3">{reviewers.map(u => <UserCard key={u.id} user={u} />)}</div>
            </TabsContent>
            <TabsContent value="admins">
              <div className="grid md:grid-cols-2 gap-3">{admins.map(u => <UserCard key={u.id} user={u} />)}</div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </>
  )
}

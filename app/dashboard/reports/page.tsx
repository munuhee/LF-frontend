'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, Clock, Award } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TopBar } from '@/components/top-bar'
import { api } from '@/lib/api'
import {
  Bar, BarChart, Line, LineChart, Pie, PieChart, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.analytics.get()
      .then(setAnalytics)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return (
    <>
      <TopBar title="Reports & Analytics" subtitle="Performance insights and metrics" />
      <main className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></main>
    </>
  )

  if (error) return (
    <>
      <TopBar title="Reports & Analytics" subtitle="Performance insights and metrics" />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center py-12 text-destructive text-sm">{error}</div>
      </main>
    </>
  )

  const summary = (analytics?.summary as Record<string, number>) || {}
  const tasksCompletedByDay = (analytics?.tasksCompletedByDay as { date: string; count: number }[]) || []
  const qualityScoresTrend = (analytics?.qualityScoresTrend as { date: string; score: number }[]) || []
  const tasksByType = (analytics?.tasksByType as { type: string; count: number }[]) || []

  const taskTypeData = tasksByType.map(item => ({
    name: item.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: item.count,
  }))

  const totalTasksThisWeek = tasksCompletedByDay.reduce((s, d) => s + d.count, 0)

  return (
    <>
      <TopBar title="Reports & Analytics" subtitle="Performance insights and metrics" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Select defaultValue="7d">
            <SelectTrigger className="w-[200px] bg-card border-border">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tasks This Week', value: totalTasksThisWeek, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Avg. Quality', value: `${summary.averageQualityScore || 0}%`, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Avg. Task Time', value: '18m', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Active Annotators', value: summary.totalAnnotators || 0, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map(s => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${s.bg}`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Tasks Completed</CardTitle>
              <CardDescription>Daily completion trend</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer config={{ count: { label: 'Tasks', color: 'hsl(var(--chart-1))' } }} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tasksCompletedByDay} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="2 2" className="stroke-border/50" />
                    <XAxis dataKey="date" tickFormatter={v => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })}
                      tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Quality Score Trend</CardTitle>
              <CardDescription>Average quality over time</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer config={{ score: { label: 'Quality (%)', color: 'hsl(var(--chart-2))' } }} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qualityScoresTrend} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="2 2" className="stroke-border/50" />
                    <XAxis dataKey="date" tickFormatter={v => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })}
                      tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="natural" dataKey="score" stroke="hsl(var(--chart-2))" strokeWidth={3}
                      dot={{ r: 4, fill: 'hsl(var(--chart-2))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {taskTypeData.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Tasks by Type</CardTitle>
              <CardDescription>Distribution of annotation task types</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskTypeData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} dataKey="value" nameKey="name">
                      {taskTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}

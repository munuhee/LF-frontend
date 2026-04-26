'use client'

import { useEffect, useState } from 'react'
import { Download, Clock, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TopBar } from '@/components/top-bar'
import { FilterInput } from '@/components/filter-input'
import { api } from '@/lib/api'
import type { User, Workflow } from '@/lib/types'

interface HoursRow {
  userId: string; name: string; email: string; role: string; workflow: string
  tasksCompleted: number; totalMinutes: number; totalHours: string; avgMinutesPerTask: number
}

type ParsedFilter = {
  role?: string; annotator?: string[]; reviewer?: string[]
  workflow?: string[]; dateFrom?: string; dateTo?: string
}

function parseHoursFilter(raw: string): ParsedFilter {
  const f: ParsedFilter = {}
  if (!raw.trim()) return f
  const tokens = raw.split(/\bAND\b|\bOR\b/i).map(t => t.trim()).filter(Boolean)
  for (const token of tokens) {
    const inner = token.replace(/[()]/g, '').trim()
    const m = inner.match(/^(workflow|annotator|reviewer|role|date)(>=|<=|:)(.+)$/i)
    if (!m) continue
    const [, key, op, val] = m
    const k = key.toLowerCase()
    if (k === 'workflow') f.workflow = [...(f.workflow || []), val]
    else if (k === 'annotator') f.annotator = [...(f.annotator || []), val]
    else if (k === 'reviewer') f.reviewer = [...(f.reviewer || []), val]
    else if (k === 'role') f.role = val
    else if (k === 'date') {
      if (op === '>=') f.dateFrom = val
      else if (op === '<=') f.dateTo = val
    }
  }
  return f
}

const FILTER_KEYS = [
  { key: 'workflow:name', description: 'filter by workflow name (e.g. agentic-ai)' },
  { key: 'annotator:email', description: 'filter by annotator email' },
  { key: 'reviewer:email', description: 'filter by reviewer email' },
  { key: 'role:annotator', description: 'filter by role (annotator or reviewer)' },
  { key: 'date>=YYYY-MM-DD', description: 'work submitted on or after' },
  { key: 'date<=YYYY-MM-DD', description: 'work submitted on or before' },
]

const EXAMPLES = [
  'workflow:agentic-ai',
  'annotator:alex@labelforge.ai',
  'role:annotator AND date>=2026-01-01',
  'workflow:agentic-ai AND date>=2026-01-01 AND date<=2026-12-31',
  'annotator:alex@labelforge.ai AND workflow:agentic-ai',
]

export default function HoursPage() {
  const [users, setUsers] = useState<User[]>([])
  const [allTasks, setAllTasks] = useState<Record<string, unknown>[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ParsedFilter>({})
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    Promise.all([api.users.list(), api.tasks.list({})])
      .then(([u, t]) => { setUsers(u); setAllTasks(t) })
      .catch((e: unknown) => setFetchError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsFetching(false))
  }, [])

  const runSearch = (q: string) => {
    setActiveFilter(parseHoursFilter(q))
    setSearched(true)
  }

  const flexMatch = (value: string, terms: string[]) =>
    terms.some(t => new RegExp(t.split(/[-_\s]+/).join('[\\s\\-_]+'), 'i').test(value))

  const buildRows = (): HoursRow[] => {
    const rowMap: Record<string, HoursRow> = {}
    const f = activeFilter

    for (const task of allTasks) {
      const annotatorId = task.annotatorId as string | null
      if (!annotatorId) continue
      const annotator = users.find(u => u.id === annotatorId)
      if (!annotator) continue

      if (f.role && annotator.role !== f.role) continue
      if (f.annotator?.length && !f.annotator.some(e => annotator.email.toLowerCase().includes(e.toLowerCase()))) continue
      if (f.workflow?.length && !flexMatch(task.workflowName as string, f.workflow)) continue
      if (f.dateFrom && task.submittedAt && new Date(task.submittedAt as string) < new Date(f.dateFrom)) continue
      if (f.dateTo && task.submittedAt && new Date(task.submittedAt as string) > new Date(f.dateTo + 'T23:59:59')) continue

      const key = `${annotatorId}_${task.workflowName as string}`
      if (!rowMap[key]) {
        rowMap[key] = { userId: annotatorId, name: annotator.name, email: annotator.email, role: annotator.role, workflow: task.workflowName as string, tasksCompleted: 0, totalMinutes: 0, totalHours: '', avgMinutesPerTask: 0 }
      }
      rowMap[key].tasksCompleted++
      rowMap[key].totalMinutes += (task.actualDuration as number) || (task.estimatedDuration as number) || 0
    }

    return Object.values(rowMap).map(row => {
      const h = Math.floor(row.totalMinutes / 60), m = row.totalMinutes % 60
      return { ...row, totalHours: `${h}h ${m}m`, avgMinutesPerTask: row.tasksCompleted ? Math.round(row.totalMinutes / row.tasksCompleted) : 0 }
    }).sort((a, b) => b.totalMinutes - a.totalMinutes)
  }

  const rows = searched ? buildRows() : []
  const totalMinutes = rows.reduce((s, r) => s + r.totalMinutes, 0)

  const exportPDF = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>Hours Report</title><style>body{font-family:Arial;font-size:12px;margin:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;border:1px solid #ddd}th{background:#f5f5f5;font-weight:600}</style></head><body>
      <h2>Hours Tracking Report</h2><p>Generated ${new Date().toLocaleString()} · Filter: ${query || 'None'}</p>
      <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Workflow</th><th>Tasks</th><th>Total Hours</th><th>Avg/Task</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r.name}</td><td>${r.email}</td><td>${r.role}</td><td>${r.workflow}</td><td>${r.tasksCompleted}</td><td>${r.totalHours}</td><td>${r.avgMinutesPerTask}m</td></tr>`).join('')}</tbody>
      </table></body></html>`)
    w.document.close(); w.print()
  }

  return (
    <>
      <TopBar title="Hours Tracking" subtitle="Time worked per annotator and workflow" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <FilterInput
              value={query} onChange={setQuery} onSearch={runSearch}
              keys={FILTER_KEYS} pageExamples={EXAMPLES}
              placeholder="workflow:agentic-ai AND date>=2026-01-01"
            />
          </CardContent>
        </Card>

        {searched && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Hours', value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'People', value: new Set(rows.map(r => r.userId)).size, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Tasks', value: rows.reduce((s, r) => s + r.tasksCompleted, 0), icon: Clock, color: 'text-success', bg: 'bg-success/10' },
              ].map(c => (
                <Card key={c.label} className="border-border bg-card">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${c.bg}`}><c.icon className={`h-4 w-4 ${c.color}`} /></div>
                      <div><p className="text-xl font-bold">{c.value}</p><p className="text-[10px] text-muted-foreground">{c.label}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-sm">{rows.length} record{rows.length !== 1 ? 's' : ''}</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={exportPDF}>
                  <Download className="h-3.5 w-3.5" />Export PDF
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {isFetching ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : fetchError ? (
                  <div className="text-destructive text-sm text-center py-8">{fetchError}</div>
                ) : rows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No data matches this filter</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        {['Name', 'Email', 'Role', 'Workflow', 'Tasks', 'Total Hours', 'Avg/Task'].map(h => (
                          <TableHead key={h} className={`text-xs ${['Tasks', 'Total Hours', 'Avg/Task'].includes(h) ? 'text-right' : ''}`}>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={i} className="border-border">
                          <TableCell className="font-medium text-sm">{row.name}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{row.email}</TableCell>
                          <TableCell className="text-xs capitalize">{row.role}</TableCell>
                          <TableCell className="text-xs max-w-[180px] truncate">{row.workflow}</TableCell>
                          <TableCell className="text-right text-sm">{row.tasksCompleted}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{row.totalHours}</TableCell>
                          <TableCell className="text-right text-sm">{row.avgMinutesPerTask}m</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!searched && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-muted-foreground text-sm">Enter a filter above to view hours data</p>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}

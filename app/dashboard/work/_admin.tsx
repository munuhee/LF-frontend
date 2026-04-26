'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/top-bar'
import { StatusBadge } from '@/components/status-badge'
import { FilterInput } from '@/components/filter-input'
import { api } from '@/lib/api'
import type { Task } from '@/lib/types'

// ─── Filter parser ────────────────────────────────────────────────────────────
type FilterMap = {
  workflow?: string[]; annotator?: string[]; reviewer?: string[]
  status?: string[]; dateFrom?: string; dateTo?: string; dateExact?: string
}

function parseFilter(raw: string): FilterMap {
  const map: FilterMap = {}
  if (!raw.trim()) return map
  const tokens = raw.split(/\bAND\b|\bOR\b/i).map(t => t.trim()).filter(Boolean)
  for (const token of tokens) {
    const inner = token.replace(/[()]/g, '').trim()
    const m = inner.match(/^(workflow|annotator|reviewer|status|date)(>=|<=|:)(.+)$/i)
    if (!m) continue
    const [, key, op, val] = m
    const k = key.toLowerCase()
    if (k === 'workflow') { map.workflow = [...(map.workflow || []), val] }
    else if (k === 'annotator') { map.annotator = [...(map.annotator || []), val] }
    else if (k === 'reviewer') { map.reviewer = [...(map.reviewer || []), val] }
    else if (k === 'status') { map.status = [...(map.status || []), val.replace(/_/g, '-')] }
    else if (k === 'date') {
      if (op === '>=') map.dateFrom = val
      else if (op === '<=') map.dateTo = val
      else map.dateExact = val
    }
  }
  return map
}

function buildQueryParams(f: FilterMap): Record<string, string> {
  const p: Record<string, string> = {}
  if (f.workflow?.length) p.workflow = f.workflow.join(',')
  if (f.annotator?.length) p.annotatorEmail = f.annotator.join(',')
  if (f.reviewer?.length) p.reviewerEmail = f.reviewer.join(',')
  if (f.status?.length) p.status = f.status.join(',')
  if (f.dateFrom) p.dateFrom = f.dateFrom
  if (f.dateTo) p.dateTo = f.dateTo
  if (f.dateExact) p.dateExact = f.dateExact
  return p
}

const FILTER_KEYS = [
  { key: 'workflow:name', description: 'filter by workflow name or type (e.g. agentic-ai)' },
  { key: 'annotator:email', description: 'filter by annotator email' },
  { key: 'reviewer:email', description: 'filter by reviewer email' },
  { key: 'status:value', description: 'unclaimed, in-progress, submitted, approved, rejected, revision-requested' },
  { key: 'date:YYYY-MM-DD', description: 'exact submission date' },
  { key: 'date>=YYYY-MM-DD', description: 'submitted on or after' },
  { key: 'date<=YYYY-MM-DD', description: 'submitted on or before' },
]

const EXAMPLES = [
  'workflow:agentic-ai',
  'workflow:agentic-ai AND status:approved',
  'workflow:agentic-ai AND annotator:alex@labelforge.ai',
  'status:submitted AND date>=2026-01-01',
  'annotator:alex@labelforge.ai AND (status:approved OR status:submitted)',
  'workflow:agentic-ai AND reviewer:sarah@labelforge.ai AND status:approved',
]

export default function AdminWork() {
  const [query, setQuery] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setTasks([]); setSearched(false); return }
    setIsSearching(true)
    setError(null)
    setSearched(true)
    try {
      const f = parseFilter(q)
      const results = await api.tasks.list(buildQueryParams(f))
      setTasks(results)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setTasks([])
    } finally { setIsSearching(false) }
  }, [])

  return (
    <>
      <TopBar title="Work" subtitle="Filter and browse tasks across all workflows" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        <FilterInput
          value={query}
          onChange={setQuery}
          onSearch={runSearch}
          isSearching={isSearching}
          keys={FILTER_KEYS}
          pageExamples={EXAMPLES}
          placeholder="workflow:agentic-ai AND status:submitted"
        />

        {error && <div className="text-destructive text-sm text-center py-4">{error}</div>}

        {searched && !isSearching && !error && (
          <>
            <p className="text-xs text-muted-foreground">{tasks.length} result{tasks.length !== 1 ? 's' : ''}</p>
            {tasks.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="flex items-center justify-center py-10">
                  <p className="text-sm text-muted-foreground">No tasks match this filter</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <Card key={task.id} className="border-border bg-card">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <Link href={`/dashboard/tasks/${task.id}`} className="font-medium text-sm text-foreground hover:text-primary truncate">
                              {task.title}
                            </Link>
                            <StatusBadge status={task.status} />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{task.workflowName} › {task.batchTitle}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                            {task.annotatorEmail && <span>Annotator: {task.annotatorEmail}</span>}
                            {task.reviewerEmail && <span>Reviewer: {task.reviewerEmail}</span>}
                            {task.submittedAt && <span>Submitted: {new Date(task.submittedAt).toLocaleDateString()}</span>}
                            {task.qualityScore && <span className="text-success font-medium">Quality: {task.qualityScore}%</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {task.externalUrl && (
                            <Button size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => window.open(task.externalUrl, '_blank', 'noopener,noreferrer')}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" asChild>
                            <Link href={`/dashboard/tasks/${task.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {!searched && !isSearching && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-muted-foreground text-sm">Enter a filter above and press Search or Enter</p>
              <p className="text-xs text-muted-foreground">Click "Filter syntax guide" to see available keys and examples</p>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}

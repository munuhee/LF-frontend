"use client"

import Link from "next/link"
import { Clock, Activity, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TopBar } from "@/components/top-bar"
import { sessions } from "@/lib/dummy-data"

export default function SessionsPage() {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  const activeSessions = sessions.filter(s => s.status === "active")
  const completedSessions = sessions.filter(s => s.status === "completed")
  const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0)
  const totalEvents = sessions.reduce((acc, s) => acc + s.eventsRecorded, 0)

  return (
    <>
      <TopBar title="Sessions" subtitle="Track your work sessions and activity" />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Active Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Clock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Completed Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatDuration(totalDuration)}</p>
                  <p className="text-xs text-muted-foreground">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Activity className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
                  <p className="text-xs text-muted-foreground">Events Recorded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <Card className="border-border bg-card mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <CardTitle className="text-lg">Active Sessions</CardTitle>
              </div>
              <CardDescription>Currently running work sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{session.taskTitle}</h4>
                        <p className="text-sm text-muted-foreground">{session.batchTitle}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Started: {new Date(session.startTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">
                          {formatDuration(session.duration)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.eventsRecorded} events
                        </p>
                        <Button size="sm" variant="outline" className="mt-2" asChild>
                          <Link href={`/dashboard/tasks/${session.taskId}`}>
                            View Task
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session History */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Session History</CardTitle>
            <CardDescription>All your recorded work sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Task</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} className="border-border">
                    <TableCell className="font-medium">{session.taskTitle}</TableCell>
                    <TableCell className="text-muted-foreground">{session.batchTitle}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(session.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>{formatDuration(session.duration)}</TableCell>
                    <TableCell>{session.eventsRecorded}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.status === "active"
                          ? "bg-primary/20 text-primary"
                          : session.status === "paused"
                          ? "bg-warning/20 text-warning"
                          : "bg-success/20 text-success"
                      }`}>
                        {session.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/tasks/${session.taskId}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  )
}

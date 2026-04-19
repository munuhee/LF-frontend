"use client"

import { TrendingUp, Users, Clock, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TopBar } from "@/components/top-bar"
import { analyticsData, dashboardStats } from "@/lib/dummy-data"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
]

export default function ReportsPage() {
  const taskTypeData = analyticsData.tasksByType.map((item) => ({
    name: item.type.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    value: item.count,
  }))

  const performanceData = analyticsData.annotatorPerformance.map((item) => ({
    name: item.name.split(" ")[0],
    tasks: item.tasksCompleted,
    quality: item.averageQuality,
    time: item.averageTime,
  }))

  return (
    <>
      <TopBar title="Reports & Analytics" subtitle="Performance insights and metrics" />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Select defaultValue="7d">
              <SelectTrigger className="w-[180px] bg-card border-border">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {analyticsData.tasksCompletedByDay.reduce((acc, d) => acc + d.count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Tasks This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Award className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {dashboardStats.averageQualityScore}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg. Quality Score</p>
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
                  <p className="text-2xl font-bold text-foreground">18m</p>
                  <p className="text-xs text-muted-foreground">Avg. Task Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {analyticsData.annotatorPerformance.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Active Annotators</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Tasks Completed Over Time */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Tasks Completed</CardTitle>
              <CardDescription>Daily task completion over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Tasks",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.tasksCompletedByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { weekday: "short" })}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Quality Score Trend */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Quality Score Trend</CardTitle>
              <CardDescription>Average quality scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  score: {
                    label: "Quality Score",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.qualityScoresTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { weekday: "short" })}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      domain={[80, 100]}
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tasks by Type */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Tasks by Type</CardTitle>
              <CardDescription>Distribution of completed tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {taskTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                              <p className="text-sm font-medium">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">
                                {payload[0].value} tasks
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-sm text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Annotator Performance */}
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Annotator Performance</CardTitle>
              <CardDescription>Comparison of team performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  tasks: {
                    label: "Tasks Completed",
                    color: "hsl(var(--primary))",
                  },
                  quality: {
                    label: "Quality Score",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                    <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend
                      formatter={(value) => (
                        <span className="text-sm text-muted-foreground">{value}</span>
                      )}
                    />
                    <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="quality" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Performance Table */}
        <Card className="border-border bg-card mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Team Leaderboard</CardTitle>
            <CardDescription>Top performers this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Annotator</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tasks Completed</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Avg. Quality</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Avg. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.annotatorPerformance
                    .sort((a, b) => b.averageQuality - a.averageQuality)
                    .map((annotator, index) => (
                      <tr key={annotator.id} className="border-b border-border">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                            index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                            index === 1 ? "bg-gray-400/20 text-gray-400" :
                            index === 2 ? "bg-orange-500/20 text-orange-400" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">{annotator.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{annotator.tasksCompleted}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            annotator.averageQuality >= 90 ? "text-success" :
                            annotator.averageQuality >= 80 ? "text-warning" :
                            "text-destructive"
                          }`}>
                            {annotator.averageQuality}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{annotator.averageTime}m</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}

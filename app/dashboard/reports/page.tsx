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
]

export default function ReportsPage() {
  const taskTypeData = analyticsData.tasksByType.map((item) => ({
    name: item.type
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    value: item.count,
  }))

  const totalTasksThisWeek = analyticsData.tasksCompletedByDay.reduce(
    (acc, d) => acc + d.count,
    0
  )

  return (
    <>
      <TopBar title="Reports & Analytics" subtitle="Performance insights and metrics" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between">
          <Select defaultValue="7d">
            <SelectTrigger className="w-[200px] bg-card border-border">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats - Smaller fonts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {totalTasksThisWeek}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tasks This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                  <Award className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {dashboardStats.averageQualityScore}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Avg. Quality Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">18m</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Avg. Task Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {analyticsData.annotatorPerformance.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Active Annotators</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tasks Completed Over Time - Bar Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Tasks Completed</CardTitle>
              <CardDescription>Daily completion trend over the past week</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer
                config={{
                  count: {
                    label: "Tasks Completed",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[320px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.tasksCompletedByDay} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="2 2" className="stroke-border/50" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", { weekday: "short" })
                      }
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--chart-1))"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Quality Score Trend - Line Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Quality Score Trend</CardTitle>
              <CardDescription>Average quality over the past week</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer
                config={{
                  score: {
                    label: "Quality Score (%)",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[320px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.qualityScoresTrend} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="2 2" className="stroke-border/50" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", { weekday: "short" })
                      }
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      domain={[80, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="natural"
                      dataKey="score"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "hsl(var(--chart-2))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tasks by Type - Pie Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Tasks by Type</CardTitle>
            <CardDescription>Distribution of annotation task types</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={140}
                    dataKey="value"
                    nameKey="name"
                  >
                    {taskTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </main>
    </>
  )
}

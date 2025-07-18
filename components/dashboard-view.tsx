"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

const kpiData = [
  { name: "Reach", target: 25, current: 10 },
  { name: "Engagement", target: 3.5, current: 2.1 },
  { name: "CTR", target: 2.0, current: 1.1 },
  { name: "Revenue", target: 20, current: 8 },
]

const chartConfig = {
  target: {
    label: "Target",
    color: "hsl(var(--chart-1))",
  },
  current: {
    label: "Current",
    color: "hsl(var(--chart-2))",
  },
}

export function DashboardView() {
  const isKVAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          This is your at-a-glance overview of this month's key performance indicators, strategic goals, and major
          events. Use this page to quickly assess progress and anticipate upcoming launches and promotions.
        </p>
      </div>

      {/* Database Status Notice */}
      {!isKVAvailable && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> This application is running with sample data. To use Vercel KV database, add
            your KV_REST_API_URL and KV_REST_API_TOKEN environment variables.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reach Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+25%</div>
            <p className="text-xs text-muted-foreground">Month-over-Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">3.5%</div>
            <p className="text-xs text-muted-foreground">Average Target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">2.0%</div>
            <p className="text-xs text-muted-foreground">To Site/Etsy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+20%</div>
            <p className="text-xs text-muted-foreground">From Social</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Monthly Goal Progress</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="target" fill="var(--color-target)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="current" fill="var(--color-current)" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Major Events */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Major August Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Aug 4: "The Study Sanctuary" Launch</p>
                <p className="text-sm text-muted-foreground">New collection for dorms & offices.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Aug 16-17: Weekend Flash Sale</p>
                <p className="text-sm text-muted-foreground">15% off all textiles.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Aug 18: "Harvest Moon" Candle Launch</p>
                <p className="text-sm text-muted-foreground">New signature fall scents.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Aug 28: Labor Day Sale Begins</p>
                <p className="text-sm text-muted-foreground">Early access for subscribers.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

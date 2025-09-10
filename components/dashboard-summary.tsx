"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, Calendar, DollarSign, PieChartIcon, BarChart3 } from "lucide-react"

interface ExpenseSummary {
  totalExpenses: number
  totalAmount: number
  categoryBreakdown: Array<{
    category: string
    amount: number
    count: number
    color: string
    percentage: number
  }>
  monthlyTotal: number
  weeklyTotal: number
  dailyTrend: Array<{
    date: string
    amount: number
    count: number
  }>
  monthlyTrend: Array<{
    month: string
    amount: number
    count: number
  }>
}

interface DashboardSummaryProps {
  refreshTrigger?: number
}

export function DashboardSummary({ refreshTrigger }: DashboardSummaryProps) {
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalExpenses: 0,
    totalAmount: 0,
    categoryBreakdown: [],
    monthlyTotal: 0,
    weeklyTotal: 0,
    dailyTrend: [],
    monthlyTrend: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadSummary()
  }, [refreshTrigger])

  const loadSummary = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get all expenses for the user
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (expensesError) throw expensesError

      // Get categories for color mapping
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)

      if (categoriesError) throw categoriesError

      const categoryColorMap =
        categories?.reduce(
          (acc, cat) => {
            acc[cat.name] = cat.color
            return acc
          },
          {} as Record<string, string>,
        ) || {}

      // Calculate summary data
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const totalAmount = expenses?.reduce((sum, expense) => sum + Number(expense.expense_amount), 0) || 0
      const totalExpenses = expenses?.length || 0

      const weeklyTotal =
        expenses
          ?.filter((expense) => new Date(expense.created_at) >= oneWeekAgo)
          .reduce((sum, expense) => sum + Number(expense.expense_amount), 0) || 0

      const monthlyTotal =
        expenses
          ?.filter((expense) => new Date(expense.created_at) >= oneMonthAgo)
          .reduce((sum, expense) => sum + Number(expense.expense_amount), 0) || 0

      // Category breakdown
      const categoryTotals =
        expenses?.reduce(
          (acc, expense) => {
            const category = expense.category
            if (!acc[category]) {
              acc[category] = { amount: 0, count: 0 }
            }
            acc[category].amount += Number(expense.expense_amount)
            acc[category].count += 1
            return acc
          },
          {} as Record<string, { amount: number; count: number }>,
        ) || {}

      const categoryBreakdown = Object.entries(categoryTotals)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
          color: categoryColorMap[category] || "#6B7280",
          percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount)

      const dailyTrend = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split("T")[0]
        const dayExpenses = expenses?.filter((expense) => expense.created_at.split("T")[0] === dateStr) || []

        dailyTrend.push({
          date: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
          amount: dayExpenses.reduce((sum, expense) => sum + Number(expense.expense_amount), 0),
          count: dayExpenses.length,
        })
      }

      const monthlyTrend = []
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

        const monthExpenses =
          expenses?.filter((expense) => {
            const expenseDate = new Date(expense.created_at)
            return expenseDate >= date && expenseDate < nextMonth
          }) || []

        monthlyTrend.push({
          month: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
          amount: monthExpenses.reduce((sum, expense) => sum + Number(expense.expense_amount), 0),
          count: monthExpenses.length,
        })
      }

      setSummary({
        totalExpenses,
        totalAmount,
        categoryBreakdown,
        monthlyTotal,
        weeklyTotal,
        dailyTrend,
        monthlyTrend,
      })
    } catch (error) {
      console.error("Error loading summary:", error)
      toast({
        title: "Error",
        description: "Failed to load expense summary",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const weeklyChange =
    summary.dailyTrend.length >= 14
      ? ((summary.weeklyTotal - summary.dailyTrend.slice(0, 7).reduce((sum, day) => sum + day.amount, 0)) /
          (summary.dailyTrend.slice(0, 7).reduce((sum, day) => sum + day.amount, 0) || 1)) *
        100
      : 0

  const monthlyChange =
    summary.monthlyTrend.length >= 2
      ? (((summary.monthlyTrend[summary.monthlyTrend.length - 1]?.amount || 0) -
          (summary.monthlyTrend[summary.monthlyTrend.length - 2]?.amount || 0)) /
          (summary.monthlyTrend[summary.monthlyTrend.length - 2]?.amount || 1)) *
        100
      : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Expenses</CardTitle>
            <BarChart3 className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalExpenses}</div>
            <p className="text-xs opacity-90">All time expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-accent text-accent-foreground border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.totalAmount.toFixed(2)}</div>
            <p className="text-xs opacity-90">All time spending</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary text-secondary-foreground border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">This Month</CardTitle>
            <div className="flex items-center gap-1">
              {monthlyChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-400" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.monthlyTotal.toFixed(2)}</div>
            <p className="text-xs opacity-90 flex items-center gap-1">
              Last 30 days
              {Math.abs(monthlyChange) > 0 && (
                <span className={monthlyChange >= 0 ? "text-red-400" : "text-green-400"}>
                  {monthlyChange >= 0 ? "+" : ""}
                  {monthlyChange.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted text-muted-foreground border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <div className="flex items-center gap-1">
              {weeklyChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.weeklyTotal.toFixed(2)}</div>
            <p className="text-xs flex items-center gap-1">
              Last 7 days
              {Math.abs(weeklyChange) > 0 && (
                <span className={weeklyChange >= 0 ? "text-red-500" : "text-green-500"}>
                  {weeklyChange >= 0 ? "+" : ""}
                  {weeklyChange.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {summary.totalExpenses > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Daily Spending Trend */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Daily Spending Trend (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={summary.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    fontSize={12}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toFixed(2)}`, "Amount"]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution Pie Chart */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="bg-accent text-accent-foreground rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={summary.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                    labelLine={false}
                  >
                    {summary.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toFixed(2)}`, "Amount"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend Bar Chart */}
          <Card className="bg-card border-border shadow-lg md:col-span-2">
            <CardHeader className="bg-secondary text-secondary-foreground rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monthly Spending Trend (12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    fontSize={12}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "amount" ? `₹${value.toFixed(2)}` : value,
                      name === "amount" ? "Amount" : "Expenses",
                    ]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      {summary.categoryBreakdown.length > 0 && (
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="bg-muted text-muted-foreground rounded-t-lg">
            <CardTitle>Detailed Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {summary.categoryBreakdown.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="font-medium">{category.category}</span>
                    <span className="text-muted-foreground">
                      ({category.count} {category.count === 1 ? "expense" : "expenses"})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{category.amount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</div>
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {summary.totalExpenses === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No expenses yet</h3>
              <p className="text-muted-foreground">Start by adding your first expense using the form above.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

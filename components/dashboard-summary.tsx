"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

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

      setSummary({
        totalExpenses,
        totalAmount,
        categoryBreakdown,
        monthlyTotal,
        weeklyTotal,
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
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalExpenses}</div>
            <p className="text-xs text-blue-100">All time expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-green-100">All time spending</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.monthlyTotal.toFixed(2)}</div>
            <p className="text-xs text-purple-100">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-100">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.weeklyTotal.toFixed(2)}</div>
            <p className="text-xs text-pink-100">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {summary.categoryBreakdown.length > 0 && (
        <Card className="bg-gradient-to-br from-white to-indigo-50/50 border-indigo-200/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <p className="text-muted-foreground">Start by adding your first expense using the form on the left.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

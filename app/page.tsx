"use client"

import { createClient } from "@/lib/supabase/client"
import { ExpenseForm } from "@/components/expense-form"
import { DashboardSummary } from "@/components/dashboard-summary"
import { ExpensesList } from "@/components/expenses-list"
import { CategoryManagement } from "@/components/category-management"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, []) // Empty dependency array to avoid re-creating client

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-md w-full space-y-6 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gradient mb-2">Expense Tracker</h1>
            <p className="text-gray-600 mt-2">Track your expenses and manage your budget with style</p>
          </div>
          <div className="space-y-4">
            <Button
              asChild
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-12 text-lg font-medium"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 h-12 text-lg font-medium"
            >
              <Link href="/auth/sign-up">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <header className="border-b border-white/20 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gradient">Expense Tracker</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400"
              >
                <Link href="/auth/signout">Sign Out</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExpenseTracker />
      </main>
    </div>
  )
}

function ExpenseTracker() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleDataChange = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ExpenseForm onExpenseAdded={handleDataChange} />
          </div>
          <div className="lg:col-span-2">
            <DashboardSummary refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="expenses">
        <ExpensesList refreshTrigger={refreshTrigger} onExpenseUpdated={handleDataChange} />
      </TabsContent>

      <TabsContent value="categories">
        <CategoryManagement onCategoryUpdated={handleDataChange} />
      </TabsContent>
    </Tabs>
  )
}

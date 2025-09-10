"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Category, ExpenseFormData } from "@/lib/types"

interface ExpenseFormProps {
  onExpenseAdded?: () => void
}

export function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    expense_name: "",
    expense_amount: 0,
    category: "",
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("categories").select("*").eq("user_id", user.id).order("name")

      if (error) throw error

      if (data.length === 0) {
        // Create default categories if none exist
        await createDefaultCategories(user.id)
        await loadCategories()
        return
      }

      setCategories(data)
    } catch (error) {
      console.error("Error loading categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const createDefaultCategories = async (userId: string) => {
    const defaultCategories = [
      { name: "Food & Dining", color: "#EF4444" },
      { name: "Transportation", color: "#3B82F6" },
      { name: "Shopping", color: "#8B5CF6" },
      { name: "Entertainment", color: "#F59E0B" },
      { name: "Bills & Utilities", color: "#10B981" },
      { name: "Healthcare", color: "#EC4899" },
      { name: "Travel", color: "#06B6D4" },
      { name: "Other", color: "#6B7280" },
    ]

    const { error } = await supabase
      .from("categories")
      .insert(defaultCategories.map((cat) => ({ ...cat, user_id: userId })))

    if (error) {
      console.error("Error creating default categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add expenses",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("expenses").insert({
        expense_name: formData.expense_name,
        expense_amount: formData.expense_amount,
        category: formData.category,
        user_id: user.id,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Expense added successfully!",
      })

      // Reset form
      setFormData({
        expense_name: "",
        expense_amount: 0,
        category: "",
      })

      // Notify parent component
      onExpenseAdded?.()
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/50 border border-blue-200/50 shadow-lg rounded-xl overflow-hidden">
      <div className="bg-blue-700 text-white px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Add New Expense</h2>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="expense_name">Expense Name</Label>
            <Input
              id="expense_name"
              type="text"
              placeholder="e.g., Lunch at restaurant"
              required
              value={formData.expense_name}
              onChange={(e) => setFormData({ ...formData, expense_name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expense_amount">Amount (₹)</Label>
            <Input
              id="expense_amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              value={formData.expense_amount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expense_amount: Number.parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={isLoadingCategories}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 h-12 text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add Expense"}
          </Button>
        </form>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Trash2, Calendar, DollarSign, FileDown } from "lucide-react" // Added FileDown icon
import type { Expense, Category } from "@/lib/types"

interface ExpensesListProps {
  refreshTrigger?: number
  onExpenseUpdated?: () => void
}

export function ExpensesList({ refreshTrigger, onExpenseUpdated }: ExpensesListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editForm, setEditForm] = useState({
    expense_name: "",
    expense_amount: 0,
    category: "",
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadExpenses()
    loadCategories()
  }, [refreshTrigger])

  const loadExpenses = async () => {
    // ... (This function remains unchanged)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error("Error loading expenses:", error)
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    // ... (This function remains unchanged)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("categories").select("*").eq("user_id", user.id).order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const handleEdit = (expense: Expense) => {
    // ... (This function remains unchanged)
    setEditingExpense(expense)
    setEditForm({
      expense_name: expense.expense_name,
      expense_amount: Number(expense.expense_amount),
      category: expense.category,
    })
  }

  const handleUpdate = async () => {
    // ... (This function remains unchanged)
    if (!editingExpense) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          expense_name: editForm.expense_name,
          expense_amount: editForm.expense_amount,
          category: editForm.category,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingExpense.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Expense updated successfully!",
      })

      setEditingExpense(null)
      loadExpenses()
      onExpenseUpdated?.()
    } catch (error) {
      console.error("Error updating expense:", error)
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (expenseId: string) => {
    // ... (This function remains unchanged)
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", expenseId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Expense deleted successfully!",
      })

      loadExpenses()
      onExpenseUpdated?.()
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    }
  }

  const getCategoryColor = (categoryName: string) => {
    // ... (This function remains unchanged)
    const category = categories.find((cat) => cat.name === categoryName)
    return category?.color || "#6B7280"
  }

  // --- New CSV Export Function (No external packages needed) ---
  const exportToCSV = (data: Expense[], fileName: string) => {
    if (!data.length) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
        variant: "destructive",
      })
      return
    }

    const headers = ["Expense Name", "Amount", "Category", "Date"]

    // Escape commas and quotes for CSV format
    const sanitizeCell = (cellData: string) => `"${String(cellData).replace(/"/g, '""')}"`

    const csvRows = [
      headers.join(","), // Header row
      ...data.map((item) =>
        [
          sanitizeCell(item.expense_name),
          item.expense_amount, // Numbers don't need quotes
          sanitizeCell(item.category),
          new Date(item.created_at).toLocaleDateString(),
        ].join(",")
      ),
    ]

    const csvString = csvRows.join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })

    // Create a temporary link element to trigger the download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${fileName}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  // ------------------------------------------------------------------

  const filteredExpenses =
    filterCategory === "all" ? expenses : expenses.filter((expense) => expense.category === filterCategory)

  if (isLoading) {
    // ... (This section remains unchanged)
    return (
      <Card className="bg-gradient-to-br from-white to-orange-50/50 border-orange-200/50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                </div>
                <div className="h-6 bg-muted rounded w-16 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-white to-orange-50/50 border-orange-200/50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <CardTitle>Recent Expenses</CardTitle>
          <div className="flex items-center gap-2">
            {/* --- New Export Button for CSV --- */}
            <Button
              size="sm"
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => exportToCSV(filteredExpenses, "expenses")}
              disabled={filteredExpenses.length === 0}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            {/* --------------------------------- */}
            <Select value={filterCategory} onValuechange={setFilterCategory}>
              <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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
        </div>
      </CardHeader>
      <CardContent>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {filterCategory === "all"
                ? "No expenses found. Add your first expense to get started!"
                : `No expenses found in the "${filterCategory}" category.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                // ... The rest of the mapping and dialogs remain unchanged
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{expense.expense_name}</h3>
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium"
                      style={{
                        backgroundColor: `${getCategoryColor(expense.category)}20`,
                        color: getCategoryColor(expense.category),
                        borderColor: getCategoryColor(expense.category),
                      }}
                    >
                      {expense.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700">₹{Number(expense.expense_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{new Date(expense.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                        onClick={() => handleEdit(expense)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    {/* ... Edit Dialog Content remains unchanged ... */}
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-name">Expense Name</Label>
                          <Input
                            id="edit-name"
                            value={editForm.expense_name}
                            onChange={(e) => setEditForm({ ...editForm, expense_name: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-amount">Amount (₹)</Label>
                          <Input
                            id="edit-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={editForm.expense_amount || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                expense_amount: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-category">Category</Label>
                          <Select
                            value={editForm.category}
                            onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.name}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: category.color }}
                                    />
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                          >
                            {isUpdating ? "Updating..." : "Update Expense"}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingExpense(null)} className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    {/* ... Delete Alert Dialog Content remains unchanged ... */}
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{expense.expense_name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(expense.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

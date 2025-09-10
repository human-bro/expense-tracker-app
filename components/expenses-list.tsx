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
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import {
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  ChevronDown,
  Search,
  SortAsc,
  SortDesc,
  X,
  Edit3,
  Trash,
} from "lucide-react"
import type { Expense, Category } from "@/lib/types"
import { prepareExpenseData, exportToCSV, exportToXLSX } from "@/lib/export-utils"

interface ExpensesListProps {
  refreshTrigger?: number
  onExpenseUpdated?: () => void
}

interface FilterState {
  category: string
  searchTerm: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  sortBy: "date" | "amount" | "name"
  sortOrder: "asc" | "desc"
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
  const [isExporting, setIsExporting] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
  const [isBulkOperating, setIsBulkOperating] = useState(false)
  const [bulkEditCategory, setBulkEditCategory] = useState("")
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
    sortBy: "date",
    sortOrder: "desc",
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadExpenses()
    loadCategories()
  }, [refreshTrigger])

  useEffect(() => {
    setSelectedExpenses(new Set())
  }, [expenses])

  const loadExpenses = async () => {
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
    setEditingExpense(expense)
    setEditForm({
      expense_name: expense.expense_name,
      expense_amount: Number(expense.expense_amount),
      category: expense.category,
    })
  }

  const handleUpdate = async () => {
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

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const exportData = prepareExpenseData(expenses)
      exportToCSV(exportData, "my_expenses")
      toast({
        title: "Success",
        description: "Expenses exported to CSV successfully!",
      })
    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast({
        title: "Error",
        description: "Failed to export CSV file",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportXLSX = async () => {
    setIsExporting(true)
    try {
      const exportData = prepareExpenseData(expenses)
      await exportToXLSX(exportData, "my_expenses")
      toast({
        title: "Success",
        description: "Expenses exported to Excel successfully!",
      })
    } catch (error) {
      console.error("Error exporting XLSX:", error)
      toast({
        title: "Error",
        description: "Failed to export Excel file",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleSelectExpense = (expenseId: string, checked: boolean) => {
    const newSelected = new Set(selectedExpenses)
    if (checked) {
      newSelected.add(expenseId)
    } else {
      newSelected.delete(expenseId)
    }
    setSelectedExpenses(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(new Set(filteredExpenses.map((expense) => expense.id)))
    } else {
      setSelectedExpenses(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedExpenses.size === 0) return

    setIsBulkOperating(true)
    try {
      const { error } = await supabase.from("expenses").delete().in("id", Array.from(selectedExpenses))

      if (error) throw error

      toast({
        title: "Success",
        description: `${selectedExpenses.size} expense(s) deleted successfully!`,
      })

      setSelectedExpenses(new Set())
      loadExpenses()
      onExpenseUpdated?.()
    } catch (error) {
      console.error("Error bulk deleting expenses:", error)
      toast({
        title: "Error",
        description: "Failed to delete selected expenses",
        variant: "destructive",
      })
    } finally {
      setIsBulkOperating(false)
    }
  }

  const handleBulkEditCategory = async () => {
    if (selectedExpenses.size === 0 || !bulkEditCategory) return

    setIsBulkOperating(true)
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          category: bulkEditCategory,
          updated_at: new Date().toISOString(),
        })
        .in("id", Array.from(selectedExpenses))

      if (error) throw error

      toast({
        title: "Success",
        description: `${selectedExpenses.size} expense(s) updated successfully!`,
      })

      setSelectedExpenses(new Set())
      setShowBulkEditDialog(false)
      setBulkEditCategory("")
      loadExpenses()
      onExpenseUpdated?.()
    } catch (error) {
      console.error("Error bulk updating expenses:", error)
      toast({
        title: "Error",
        description: "Failed to update selected expenses",
        variant: "destructive",
      })
    } finally {
      setIsBulkOperating(false)
    }
  }

  const handleBulkExportCSV = async () => {
    if (selectedExpenses.size === 0) return

    setIsExporting(true)
    try {
      const selectedExpenseData = expenses.filter((expense) => selectedExpenses.has(expense.id))
      const exportData = prepareExpenseData(selectedExpenseData)
      exportToCSV(exportData, "selected_expenses")
      toast({
        title: "Success",
        description: `${selectedExpenses.size} selected expenses exported to CSV successfully!`,
      })
    } catch (error) {
      console.error("Error exporting selected expenses:", error)
      toast({
        title: "Error",
        description: "Failed to export selected expenses",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleBulkExportXLSX = async () => {
    if (selectedExpenses.size === 0) return

    setIsExporting(true)
    try {
      const selectedExpenseData = expenses.filter((expense) => selectedExpenses.has(expense.id))
      const exportData = prepareExpenseData(selectedExpenseData)
      await exportToXLSX(exportData, "selected_expenses")
      toast({
        title: "Success",
        description: `${selectedExpenses.size} selected expenses exported to Excel successfully!`,
      })
    } catch (error) {
      console.error("Error exporting selected expenses:", error)
      toast({
        title: "Error",
        description: "Failed to export selected expenses",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName)
    return category?.color || "#6B7280"
  }

  const filteredExpenses = expenses
    .filter((expense) => {
      if (filters.category !== "all" && expense.category !== filters.category) {
        return false
      }

      if (filters.searchTerm && !expense.expense_name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false
      }

      const expenseDate = new Date(expense.created_at)
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom)
        if (expenseDate < fromDate) return false
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (expenseDate > toDate) return false
      }

      const amount = Number(expense.expense_amount)
      if (filters.amountMin && amount < Number(filters.amountMin)) {
        return false
      }
      if (filters.amountMax && amount > Number(filters.amountMax)) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case "amount":
          comparison = Number(a.expense_amount) - Number(b.expense_amount)
          break
        case "name":
          comparison = a.expense_name.localeCompare(b.expense_name)
          break
      }

      return filters.sortOrder === "asc" ? comparison : -comparison
    })

  const clearFilters = () => {
    setFilters({
      category: "all",
      searchTerm: "",
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
      sortBy: "date",
      sortOrder: "desc",
    })
  }

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.searchTerm ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.amountMin ||
    filters.amountMax

  const isAllSelected =
    filteredExpenses.length > 0 && filteredExpenses.every((expense) => selectedExpenses.has(expense.id))
  const isPartiallySelected = selectedExpenses.size > 0 && !isAllSelected

  if (isLoading) {
    return (
      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
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
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Recent Expenses ({filteredExpenses.length})
            {selectedExpenses.size > 0 && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                {selectedExpenses.size} selected
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-3">
            {selectedExpenses.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-foreground/20 rounded-lg">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkExportCSV}
                  disabled={isExporting}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkExportXLSX}
                  disabled={isExporting}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  Export Excel
                </Button>
                <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/40"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Edit Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Change category for {selectedExpenses.size} selected expense(s)
                      </p>
                      <div className="grid gap-2">
                        <Label htmlFor="bulk-category">New Category</Label>
                        <Select value={bulkEditCategory} onValueChange={setBulkEditCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
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
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleBulkEditCategory}
                          disabled={isBulkOperating || !bulkEditCategory}
                          className="flex-1"
                        >
                          {isBulkOperating ? "Updating..." : "Update Category"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowBulkEditDialog(false)} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-destructive/20 text-destructive hover:bg-destructive/30"
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      Delete Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Expenses</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedExpenses.size} selected expense(s)? This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete {selectedExpenses.size} Expense(s)
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {filteredExpenses.length > 0 && selectedExpenses.size === 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportXLSX}
                  disabled={isExporting}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  Excel
                </Button>
              </div>
            )}
            <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                      !
                    </Badge>
                  )}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        {filteredExpenses.length > 0 && (
          <div className="mt-4 flex items-center gap-3 px-4 py-2 bg-primary-foreground/10 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="border-primary-foreground/30 data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
              />
              <Label htmlFor="select-all" className="text-sm text-primary-foreground/80 cursor-pointer">
                {isAllSelected
                  ? "Deselect All"
                  : isPartiallySelected
                    ? `Select All (${selectedExpenses.size} selected)`
                    : "Select All"}
              </Label>
            </div>
            {selectedExpenses.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedExpenses(new Set())}
                className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Selection
              </Button>
            )}
          </div>
        )}

        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <CollapsibleContent className="mt-4">
            <div className="bg-primary-foreground/10 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-primary-foreground/80 text-sm">Search Expenses</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-foreground/60" />
                    <Input
                      placeholder="Search by name..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                      className="pl-10 bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-primary-foreground/80 text-sm">Category</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({ ...filters, category: value })}
                  >
                    <SelectTrigger className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground">
                      <SelectValue />
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

                <div className="space-y-2">
                  <Label className="text-primary-foreground/80 text-sm">From Date</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-primary-foreground/80 text-sm">To Date</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-primary-foreground/80 text-sm">Min Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.amountMin}
                    onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                    className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-primary-foreground/80 text-sm">Max Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={filters.amountMax}
                    onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                    className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-primary-foreground/80 text-sm">Sort By</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value: "date" | "amount" | "name") => setFilters({ ...filters, sortBy: value })}
                  >
                    <SelectTrigger className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-primary-foreground/80 text-sm">Sort Order</Label>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })}
                    className="w-full bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 justify-start"
                  >
                    {filters.sortOrder === "asc" ? (
                      <>
                        <SortAsc className="w-4 h-4 mr-2" />
                        Ascending
                      </>
                    ) : (
                      <>
                        <SortDesc className="w-4 h-4 mr-2" />
                        Descending
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearFilters}
                    className="bg-destructive/20 text-destructive hover:bg-destructive/30"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
      <CardContent className="p-6">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "No expenses match your current filters. Try adjusting your search criteria."
                : expenses.length === 0
                  ? "No expenses found. Add your first expense to get started!"
                  : "No expenses found."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-2 bg-transparent">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className={`flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-all duration-200 shadow-sm hover:shadow-md ${
                  selectedExpenses.has(expense.id) ? "bg-accent/10 border-accent" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedExpenses.has(expense.id)}
                    onCheckedChange={(checked) => handleSelectExpense(expense.id, checked as boolean)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-card-foreground">{expense.expense_name}</h3>
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
                        <DollarSign className="w-4 h-4 text-accent" />
                        <span className="font-medium text-accent">₹{Number(expense.expense_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{new Date(expense.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                        onClick={() => handleEdit(expense)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
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
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
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
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
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

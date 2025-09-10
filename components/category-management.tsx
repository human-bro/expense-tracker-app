"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Pencil, Trash2, Palette } from "lucide-react"
import type { Category, CategoryFormData } from "@/lib/types"

interface CategoryManagementProps {
  onCategoryUpdated?: () => void
}

const DEFAULT_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
  "#6B7280",
  "#374151",
  "#1F2937",
]

export function CategoryManagement({ onCategoryUpdated }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryForm, setNewCategoryForm] = useState<CategoryFormData>({
    name: "",
    color: DEFAULT_COLORS[0],
  })
  const [editForm, setEditForm] = useState<CategoryFormData>({
    name: "",
    color: DEFAULT_COLORS[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      setCategories(data || [])
    } catch (error) {
      console.error("Error loading categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async () => {
    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add categories",
          variant: "destructive",
        })
        return
      }

      // Check if category name already exists
      const existingCategory = categories.find((cat) => cat.name.toLowerCase() === newCategoryForm.name.toLowerCase())

      if (existingCategory) {
        toast({
          title: "Error",
          description: "A category with this name already exists",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("categories").insert({
        name: newCategoryForm.name,
        color: newCategoryForm.color,
        user_id: user.id,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Category added successfully!",
      })

      setNewCategoryForm({ name: "", color: DEFAULT_COLORS[0] })
      setIsAddingCategory(false)
      loadCategories()
      onCategoryUpdated?.()
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setEditForm({
      name: category.name,
      color: category.color,
    })
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    setIsSubmitting(true)
    try {
      // Check if category name already exists (excluding current category)
      const existingCategory = categories.find(
        (cat) => cat.name.toLowerCase() === editForm.name.toLowerCase() && cat.id !== editingCategory.id,
      )

      if (existingCategory) {
        toast({
          title: "Error",
          description: "A category with this name already exists",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("categories")
        .update({
          name: editForm.name,
          color: editForm.color,
        })
        .eq("id", editingCategory.id)

      if (error) throw error

      // Update expenses that use the old category name
      if (editForm.name !== editingCategory.name) {
        const { error: expenseError } = await supabase
          .from("expenses")
          .update({ category: editForm.name })
          .eq("category", editingCategory.name)

        if (expenseError) {
          console.error("Error updating expense categories:", expenseError)
        }
      }

      toast({
        title: "Success",
        description: "Category updated successfully!",
      })

      setEditingCategory(null)
      loadCategories()
      onCategoryUpdated?.()
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    try {
      // Check if category is being used by any expenses
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: expensesUsingCategory, error: checkError } = await supabase
        .from("expenses")
        .select("id")
        .eq("user_id", user.id)
        .eq("category", categoryName)

      if (checkError) throw checkError

      if (expensesUsingCategory && expensesUsingCategory.length > 0) {
        toast({
          title: "Cannot Delete Category",
          description: `This category is being used by ${expensesUsingCategory.length} expense(s). Please reassign or delete those expenses first.`,
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("categories").delete().eq("id", categoryId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Category deleted successfully!",
      })

      loadCategories()
      onCategoryUpdated?.()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-white to-violet-50/50 border-violet-200/50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle>Manage Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-muted rounded-full animate-pulse" />
                  <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-white to-violet-50/50 border-violet-200/50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle>Manage Categories</CardTitle>
          <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-category-name">Category Name</Label>
                  <Input
                    id="new-category-name"
                    placeholder="e.g., Groceries"
                    value={newCategoryForm.name}
                    onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-10 gap-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newCategoryForm.color === color
                            ? "border-foreground scale-110"
                            : "border-border hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategoryForm({ ...newCategoryForm, color })}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleAddCategory}
                    disabled={isSubmitting || !newCategoryForm.name.trim()}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                  >
                    {isSubmitting ? "Adding..." : "Add Category"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingCategory(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <Palette className="w-12 h-12 mx-auto text-violet-400 mb-4" />
            <p className="text-muted-foreground">No categories found. Add your first category to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
                    {new Date(category.created_at).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-category-name">Category Name</Label>
                          <Input
                            id="edit-category-name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Color</Label>
                          <div className="grid grid-cols-10 gap-2">
                            {DEFAULT_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                  editForm.color === color
                                    ? "border-foreground scale-110"
                                    : "border-border hover:scale-105"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => setEditForm({ ...editForm, color })}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={handleUpdateCategory}
                            disabled={isSubmitting || !editForm.name.trim()}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                          >
                            {isSubmitting ? "Updating..." : "Update Category"}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingCategory(null)} className="flex-1">
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
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the "{category.name}" category? This action cannot be undone.
                          Make sure no expenses are using this category.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCategory(category.id, category.name)}
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

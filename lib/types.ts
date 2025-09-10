export interface Expense {
  id: string
  expense_name: string
  expense_amount: number
  category: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

export interface ExpenseFormData {
  expense_name: string
  expense_amount: number
  category: string
}

export interface CategoryFormData {
  name: string
  color: string
}

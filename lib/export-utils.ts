export interface ExportExpense {
  expense_name: string
  expense_amount: number
  category: string
  created_at: string
  formatted_date: string
  formatted_amount: string
}

export function prepareExpenseData(expenses: any[]): ExportExpense[] {
  return expenses.map((expense) => ({
    expense_name: expense.expense_name,
    expense_amount: Number(expense.expense_amount),
    category: expense.category,
    created_at: expense.created_at,
    formatted_date: new Date(expense.created_at).toLocaleDateString("en-IN"),
    formatted_amount: `₹${Number(expense.expense_amount).toFixed(2)}`,
  }))
}

export function exportToCSV(expenses: ExportExpense[], filename = "expenses") {
  const headers = ["Expense Name", "Amount (₹)", "Category", "Date"]
  const csvContent = [
    headers.join(","),
    ...expenses.map((expense) =>
      [
        `"${expense.expense_name}"`,
        expense.expense_amount,
        `"${expense.category}"`,
        `"${expense.formatted_date}"`,
      ].join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportToXLSX(expenses: ExportExpense[], filename = "expenses") {
  // Dynamic import to reduce bundle size
  const XLSX = await import("xlsx")

  const worksheet = XLSX.utils.json_to_sheet(
    expenses.map((expense) => ({
      "Expense Name": expense.expense_name,
      "Amount (₹)": expense.expense_amount,
      Category: expense.category,
      Date: expense.formatted_date,
    })),
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses")

  // Auto-size columns
  const colWidths = [
    { wch: 25 }, // Expense Name
    { wch: 15 }, // Amount
    { wch: 20 }, // Category
    { wch: 12 }, // Date
  ]
  worksheet["!cols"] = colWidths

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`)
}

import { redirect } from "next/navigation"

export default function ProtectedPage() {
  // Redirect to main app since we handle auth in the main page
  redirect("/")
}

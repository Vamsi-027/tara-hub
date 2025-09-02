import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

const LoginErrorDisplay = () => {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check URL params for error messages
    const params = new URLSearchParams(window.location.search)
    const errorType = params.get("error")
    const errorMessage = params.get("message")

    if (errorType === "unauthorized" && errorMessage) {
      setError(decodeURIComponent(errorMessage))
      
      // Clean up URL without reload
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)
    } else if (errorType === "auth_failed") {
      setError("Authentication failed. Please try again.")
      
      // Clean up URL without reload
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)
    }
  }, [])

  if (!error) return null

  return (
    <div className="w-full max-w-md mx-auto mb-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    </div>
  )
}

// Place widget before the login form to show errors prominently
export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginErrorDisplay
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button } from "@medusajs/ui"
import { Google } from "@medusajs/icons"
import { useState } from "react"

const GoogleSignInWidget = () => {
  const [showInfo, setShowInfo] = useState(false)
  
  const handleGoogleLogin = () => {
    // Use Medusa's built-in Google auth endpoint
    window.location.href = "/auth/google"
  }

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <Button
        onClick={handleGoogleLogin}
        variant="secondary"
        size="large"
        className="w-full flex items-center justify-center gap-2"
      >
        <Google className="h-5 w-5" />
        Sign in with Google
      </Button>
      
      {/* Optional: Show authorized domains info */}
      <div className="mt-2 text-center">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Google sign-in requirements
        </button>
        {showInfo && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
            Only authorized email addresses can access the admin panel via Google sign-in.
            Contact your administrator for access.
          </div>
        )}
      </div>
    </div>
  )
}

// Place widget after the default login form
export const config = defineWidgetConfig({
  zone: "login.after",
})

export default GoogleSignInWidget

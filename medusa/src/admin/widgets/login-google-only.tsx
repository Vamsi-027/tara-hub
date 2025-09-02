import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { Google } from "@medusajs/icons"
import { useEffect } from "react"

const GoogleOnlyLoginWidget = () => {
  useEffect(() => {
    // Hide the default Medusa login form
    const hideDefaultLogin = () => {
      // Hide email/password form
      const forms = document.querySelectorAll('form')
      forms.forEach(form => {
        const hasEmailInput = form.querySelector('input[type="email"]')
        if (hasEmailInput) {
          form.style.display = 'none'
        }
      })
      
      // Hide "Sign in with email" text/buttons
      const elements = document.querySelectorAll('button, span, div')
      elements.forEach(element => {
        const text = element.textContent?.toLowerCase() || ''
        if (text.includes('sign in with email') || text.includes('email')) {
          if (element.tagName === 'BUTTON' || element.parentElement?.tagName === 'BUTTON') {
            (element as HTMLElement).style.display = 'none'
          }
        }
      })
      
      // Hide dividers
      const dividers = document.querySelectorAll('hr')
      dividers.forEach(divider => {
        (divider as HTMLElement).style.display = 'none'
      })
    }
    
    // Run immediately and after a delay to catch dynamically added elements
    hideDefaultLogin()
    setTimeout(hideDefaultLogin, 100)
    setTimeout(hideDefaultLogin, 500)
  }, [])

  const handleGoogleLogin = () => {
    window.location.href = "/admin/auth/google"
  }

  return (
    <Container className="w-full max-w-md mx-auto mt-8">
      <div className="space-y-6">
        <div className="text-center">
          <Heading level="h1" className="text-2xl font-bold mb-2">
            Tara Hub Admin
          </Heading>
          <Text className="text-ui-fg-subtle">
            Sign in with your authorized Google account
          </Text>
        </div>

        <Button
          onClick={handleGoogleLogin}
          variant="primary"
          size="large"
          className="w-full flex items-center justify-center gap-3 py-3"
        >
          <Google className="h-5 w-5" />
          Sign in with Google
        </Button>

        <div className="p-4 bg-ui-bg-subtle rounded-lg">
          <Text className="text-ui-fg-subtle text-xs text-center">
            Only whitelisted Google accounts can access this admin panel.
            Contact your administrator if you need access.
          </Text>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default GoogleOnlyLoginWidget
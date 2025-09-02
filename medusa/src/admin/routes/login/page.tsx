import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { Google } from "@medusajs/icons"

const LoginPage = () => {
  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = "/auth/google"
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-bg-base">
      <Container className="flex flex-col items-center justify-center max-w-md w-full p-8">
        <div className="w-full">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <Heading level="h1" className="text-3xl font-bold mb-2">
              Tara Hub Admin
            </Heading>
            <Text className="text-ui-fg-subtle">
              Sign in to access the admin dashboard
            </Text>
          </div>

          {/* Google Sign In Button */}
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              variant="primary"
              size="large"
              className="w-full flex items-center justify-center gap-3 py-3"
            >
              <Google className="h-5 w-5" />
              Sign in with Google
            </Button>
          </div>

          {/* Info Text */}
          <div className="mt-8 text-center">
            <Text className="text-ui-fg-subtle text-sm">
              Only authorized Google accounts can access this admin panel.
            </Text>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-ui-bg-subtle rounded-lg">
            <Text className="text-ui-fg-subtle text-xs text-center">
              This is a secure admin area. All login attempts are monitored and logged.
            </Text>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default LoginPage

export const config = defineRouteConfig({
  label: "Login",
  icon: null,
  hidden: true, // Hide from navigation
})
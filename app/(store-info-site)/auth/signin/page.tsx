"use client"

import { signIn, getSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignIn() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push("/admin")
      }
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn("google", { callbackUrl: "/admin" })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      await signIn("email", { email, callbackUrl: "/admin" })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Google Sign-in */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Email Sign-in Form */}
          <form onSubmit={handleEmailSignIn} className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="admin@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              disabled={loading}
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending magic link..." : "Sign in with Email"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
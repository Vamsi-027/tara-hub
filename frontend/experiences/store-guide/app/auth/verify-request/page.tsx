import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function VerifyRequest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            A sign in link has been sent to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Click the link in your email to sign in to your account.</p>
          <p className="mt-4">If you don't see the email, please check your spam folder.</p>
        </CardContent>
      </Card>
    </div>
  )
}
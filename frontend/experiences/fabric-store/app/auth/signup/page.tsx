'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Phone,
  Mail,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Sparkles,
  User,
  Building,
  CheckCircle
} from 'lucide-react'

interface PasswordStrength {
  score: number
  message: string
  color: string
}

export default function SignUpPage() {
  const router = useRouter()

  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    accountType: 'personal' as 'personal' | 'business',
    acceptTerms: false,
    subscribeNewsletter: false
  })

  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    message: '',
    color: 'bg-gray-200'
  })
  const [otpTimer, setOtpTimer] = useState(0)

  // Password requirements
  const passwordRequirements = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[A-Z]/, text: 'One uppercase letter' },
    { regex: /[a-z]/, text: 'One lowercase letter' },
    { regex: /[0-9]/, text: 'One number' },
    { regex: /[^A-Za-z0-9]/, text: 'One special character' }
  ]

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpTimer])

  // Check password strength
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength({ score: 0, message: '', color: 'bg-gray-200' })
      return
    }

    let score = 0
    passwordRequirements.forEach(req => {
      if (req.regex.test(formData.password)) score++
    })

    const strengthLevels = [
      { score: 0, message: '', color: 'bg-gray-200' },
      { score: 1, message: 'Very Weak', color: 'bg-red-500' },
      { score: 2, message: 'Weak', color: 'bg-orange-500' },
      { score: 3, message: 'Fair', color: 'bg-yellow-500' },
      { score: 4, message: 'Good', color: 'bg-blue-500' },
      { score: 5, message: 'Strong', color: 'bg-green-500' }
    ]

    setPasswordStrength(strengthLevels[score])
  }, [formData.password])

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: true
      })
      if (result?.error) {
        setError('Failed to sign up with Google. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const validateEmailForm = () => {
    if (!formData.firstName || !formData.lastName) {
      setError('Please enter your full name')
      return false
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (passwordStrength.score < 3) {
      setError('Please choose a stronger password')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions')
      return false
    }

    return true
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmailForm()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          company: formData.company,
          accountType: formData.accountType,
          subscribeNewsletter: formData.subscribeNewsletter
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      // Auto sign in after successful signup
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.ok) {
        router.push('/auth/welcome')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    if (!formData.phone) {
      setError('Please enter a phone number')
      return
    }

    if (!formData.firstName || !formData.lastName) {
      setError('Please enter your full name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          firstName: formData.firstName,
          lastName: formData.lastName,
          isSignup: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setOtpSent(true)
      setOtpTimer(60)

      if (data.otp && process.env.NODE_ENV === 'development') {
        console.log('Dev OTP:', data.otp)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          otp,
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company,
          accountType: formData.accountType,
          subscribeNewsletter: formData.subscribeNewsletter
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP')
      }

      // Auto sign in
      const result = await signIn('phone-otp', {
        phone: formData.phone,
        otp,
        redirect: false
      })

      if (result?.ok) {
        router.push('/auth/welcome')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else if (digits.length <= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    } else {
      return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    setFormData({ ...formData, phone: formatted })
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col items-center justify-center px-12 text-white">
          <div className="max-w-lg">
            <Sparkles className="w-16 h-16 mb-6" />
            <h2 className="text-4xl font-bold mb-4">Join Our Fabric Community</h2>
            <p className="text-lg text-blue-100 mb-8">
              Get exclusive access to premium fabrics, special discounts, and expert design consultation.
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-blue-200 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Free Sample Service</p>
                  <p className="text-sm text-blue-100">Order up to 5 fabric samples free of charge</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-blue-200 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Trade Discounts</p>
                  <p className="text-sm text-blue-100">Special pricing for interior designers and businesses</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-blue-200 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Priority Support</p>
                  <p className="text-sm text-blue-100">Get expert advice from our fabric specialists</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-blue-500/30">
              <div>
                <div className="text-3xl font-bold mb-1">15K+</div>
                <div className="text-sm text-blue-200">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">500+</div>
                <div className="text-sm text-blue-200">Fabric Options</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">4.9/5</div>
                <div className="text-sm text-blue-200">Customer Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Custom Fabric</span>
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {!authMethod ? (
            <div className="space-y-4">
              {/* Account Type Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setFormData({ ...formData, accountType: 'personal' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    formData.accountType === 'personal'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Personal</span>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, accountType: 'business' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    formData.accountType === 'business'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span className="text-sm font-medium">Business</span>
                </button>
              </div>

              {/* Google Sign Up */}
              <button
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                <span className="font-medium text-gray-700">Continue with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 text-gray-500">Or sign up with</span>
                </div>
              </div>

              {/* Email Option */}
              <button
                onClick={() => setAuthMethod('email')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Email & Password</span>
              </button>

              {/* Phone Option */}
              <button
                onClick={() => setAuthMethod('phone')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <Phone className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Phone Number</span>
              </button>
            </div>
          ) : authMethod === 'email' ? (
            /* Email Sign Up Form */
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {formData.accountType === 'business' && (
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company name
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.message && (
                      <p className={`text-xs font-medium ${
                        passwordStrength.score < 3 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {passwordStrength.message}
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          {req.regex.test(formData.password) ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 text-gray-400" />
                          )}
                          <span className={req.regex.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                    required
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.subscribeNewsletter}
                    onChange={(e) => setFormData({ ...formData, subscribeNewsletter: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Send me exclusive offers and fabric updates
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.acceptTerms}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod(null)
                  setError('')
                  setFormData({
                    ...formData,
                    email: '',
                    password: '',
                    confirmPassword: ''
                  })
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to sign up options
              </button>
            </form>
          ) : (
            /* Phone Sign Up Form */
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  {formData.accountType === 'business' && (
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                        Company name
                      </label>
                      <input
                        type="text"
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    />
                  </div>

                  <button
                    onClick={handleSendOTP}
                    disabled={loading || !formData.phone || !formData.firstName || !formData.lastName}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send verification code</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                      Verification code
                    </label>
                    <p className="text-sm text-gray-600 mb-4">
                      Enter the 6-digit code sent to {formData.phone}
                    </p>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={handleOtpChange}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-4 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl tracking-[0.5em] font-mono transition-all duration-200"
                    />
                  </div>

                  {otpTimer > 0 ? (
                    <p className="text-sm text-gray-600 text-center">
                      Resend code in {otpTimer} seconds
                    </p>
                  ) : (
                    <button
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Resend verification code
                    </button>
                  )}

                  <div className="space-y-3">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                        required
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        I agree to the{' '}
                        <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                          Privacy Policy
                        </Link>
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.subscribeNewsletter}
                        onChange={(e) => setFormData({ ...formData, subscribeNewsletter: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Send me exclusive offers and fabric updates
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6 || !formData.acceptTerms}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Create account</span>
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setAuthMethod(null)
                  setOtpSent(false)
                  setFormData({ ...formData, phone: '' })
                  setOtp('')
                  setError('')
                  setOtpTimer(0)
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to sign up options
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'

import React, { useState, useRef, useEffect } from 'react'
import Header from '@/components/header'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Sparkles,
  Shield,
  Users,
  Award,
  MessageSquare,
  Star
} from 'lucide-react'

type FormData = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  orderNumber?: string
}

type FormErrors = {
  [K in keyof FormData]?: string
}

// Luxury floating label input component
function LuxuryInput({ 
  id, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  error,
  className = ''
}: {
  id: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  required?: boolean
  error?: string
  className?: string
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  useEffect(() => {
    setHasValue(value.length > 0)
  }, [value])

  return (
    <div className={`relative ${className}`}>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full h-14 px-4 pt-6 pb-2 bg-white border-2 rounded-xl font-body
                   transition-all duration-300 outline-none peer
                   ${error 
                     ? 'border-red-300 focus:border-red-500 bg-red-50/30' 
                     : 'border-warm-300 focus:border-navy-800 hover:border-gold-800'
                   }
                   ${isFocused || hasValue ? 'pt-6' : 'pt-4'}`}
        placeholder=""
        required={required}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <label
        htmlFor={id}
        className={`absolute left-4 font-body font-medium transition-all duration-300 pointer-events-none
                   ${isFocused || hasValue 
                     ? 'top-2 text-xs text-warm-600' 
                     : 'top-1/2 -translate-y-1/2 text-base text-warm-500'
                   }
                   ${error ? 'text-red-500' : ''}`}
      >
        {placeholder}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Luxury textarea component
function LuxuryTextarea({ 
  id, 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  error,
  rows = 6,
  maxLength = 500
}: {
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder: string
  required?: boolean
  error?: string
  rows?: number
  maxLength?: number
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  useEffect(() => {
    setHasValue(value.length > 0)
  }, [value])

  return (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows={rows}
        maxLength={maxLength}
        className={`w-full px-4 pt-8 pb-4 bg-white border-2 rounded-xl font-body resize-none
                   transition-all duration-300 outline-none
                   ${error 
                     ? 'border-red-300 focus:border-red-500 bg-red-50/30' 
                     : 'border-warm-300 focus:border-navy-800 hover:border-gold-800'
                   }`}
        placeholder=""
        required={required}
        aria-describedby={error ? `${id}-error` : `${id}-counter`}
      />
      <label
        htmlFor={id}
        className={`absolute left-4 font-body font-medium transition-all duration-300 pointer-events-none
                   ${isFocused || hasValue 
                     ? 'top-2 text-xs text-warm-600' 
                     : 'top-6 text-base text-warm-500'
                   }
                   ${error ? 'text-red-500' : ''}`}
      >
        {placeholder}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex justify-between items-center mt-2">
        {error ? (
          <p id={`${id}-error`} className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        ) : (
          <div></div>
        )}
        <p id={`${id}-counter`} className="text-xs text-warm-500">
          {value.length}/{maxLength}
        </p>
      </div>
    </div>
  )
}

// Luxury select component
function LuxurySelect({ 
  id, 
  name, 
  value, 
  onChange, 
  options, 
  placeholder, 
  required = false, 
  error 
}: {
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  placeholder: string
  required?: boolean
  error?: string
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  useEffect(() => {
    setHasValue(value.length > 0)
  }, [value])

  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full h-14 px-4 pt-6 pb-2 bg-white border-2 rounded-xl font-body
                   transition-all duration-300 outline-none appearance-none cursor-pointer
                   ${error 
                     ? 'border-red-300 focus:border-red-500 bg-red-50/30' 
                     : 'border-warm-300 focus:border-navy-800 hover:border-gold-800'
                   }`}
        required={required}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <label
        htmlFor={id}
        className={`absolute left-4 font-body font-medium transition-all duration-300 pointer-events-none
                   ${isFocused || hasValue 
                     ? 'top-2 text-xs text-warm-600' 
                     : 'top-1/2 -translate-y-1/2 text-base text-warm-500'
                   }
                   ${error ? 'text-red-500' : ''}`}
      >
        {placeholder}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {/* Custom dropdown arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-5 h-5 text-warm-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Luxury contact info card
function LuxuryInfoCard({ 
  icon: Icon, 
  title, 
  children, 
  accentColor = 'navy' 
}: { 
  icon: React.ElementType
  title: string
  children: React.ReactNode
  accentColor?: 'navy' | 'gold' | 'green' | 'purple'
}) {
  const colors = {
    navy: 'bg-navy-50 text-navy-800 border-navy-200',
    gold: 'bg-gold-50 text-gold-800 border-gold-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200'
  }

  return (
    <div className="group p-6 bg-white border border-warm-200 rounded-2xl hover:shadow-lg 
                   hover:border-gold-800/30 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center
                        transition-all duration-300 group-hover:scale-110 ${colors[accentColor]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-medium text-navy-800 mb-2">{title}</h3>
          <div className="space-y-1 font-body text-warm-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main contact page component
export default function LuxuryContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    orderNumber: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  // Subject options
  const subjectOptions = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'product', label: 'Product Information' },
    { value: 'order', label: 'Order Support' },
    { value: 'custom', label: 'Custom Design Request' },
    { value: 'wholesale', label: 'Wholesale Inquiry' },
    { value: 'returns', label: 'Returns & Exchanges' },
    { value: 'feedback', label: 'Feedback & Testimonials' },
    { value: 'partnership', label: 'Partnership Opportunities' },
    { value: 'other', label: 'Other' }
  ]

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phone.length >= 10 && phoneRegex.test(phone)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your full name'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select an inquiry type'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please tell us how we can help you'
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Please provide more details (minimum 20 characters)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0]
      const element = document.getElementById(firstErrorField)
      element?.focus()
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setStatusMessage(data.message || 'Thank you for reaching out! Our fabric experts will respond within 24 hours.')
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          orderNumber: ''
        })
        
        // Scroll to success message
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        setSubmitStatus('error')
        setStatusMessage(data.error || 'Unable to send your message. Please try again or contact us directly.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setStatusMessage('Connection error. Please check your internet connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-navy-800 to-navy-900 text-white pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2523ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-gold-800" />
              <span className="text-gold-800 font-body font-medium uppercase tracking-wide text-sm">
                Expert Consultation
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-semibold mb-4 tracking-tight">
              Get in Touch
            </h1>
            <p className="text-xl text-navy-100 max-w-2xl mx-auto font-body leading-relaxed">
              Our fabric specialists are here to help you find the perfect textiles 
              for your design vision. Let's create something extraordinary together.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-navy-800 mb-6">
                Let's Connect
              </h2>
              <p className="font-body text-warm-700 leading-relaxed">
                Whether you're an interior designer, architect, or fabric enthusiast, 
                we're here to provide personalized guidance and exceptional service.
              </p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-6">
              <LuxuryInfoCard icon={Mail} title="Email Support" accentColor="navy">
                <p className="font-medium">hello@customfabricdesigns.com</p>
                <p className="font-medium">orders@customfabricdesigns.com</p>
                <p className="text-sm text-warm-600 mt-1">Response within 24 hours</p>
              </LuxuryInfoCard>

              <LuxuryInfoCard icon={Phone} title="Expert Consultation" accentColor="gold">
                <p className="font-medium">+1 (555) 123-4567</p>
                <p className="text-sm text-warm-600">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                <p className="text-sm text-warm-600">Saturday: 10:00 AM - 4:00 PM EST</p>
              </LuxuryInfoCard>

              <LuxuryInfoCard icon={MapPin} title="Design Showroom" accentColor="green">
                <p className="font-medium">1234 Design District</p>
                <p className="font-medium">New York, NY 10013</p>
                <p className="text-sm text-warm-600 mt-1">By appointment only</p>
              </LuxuryInfoCard>

              <LuxuryInfoCard icon={Clock} title="Response Times" accentColor="purple">
                <p className="font-medium">Email: Within 24 hours</p>
                <p className="font-medium">Phone: Immediate during business hours</p>
                <p className="text-sm text-warm-600 mt-1">Emergency orders: Same day response</p>
              </LuxuryInfoCard>
            </div>

            {/* Trust Elements */}
            <div className="bg-navy-50 border border-navy-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-navy-800" />
                <h3 className="font-display text-lg font-medium text-navy-800">
                  Our Commitment
                </h3>
              </div>
              <ul className="space-y-2 font-body text-navy-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gold-800 rounded-full" />
                  Personalized fabric recommendations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gold-800 rounded-full" />
                  Free sample coordination
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gold-800 rounded-full" />
                  Expert design consultation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gold-800 rounded-full" />
                  Dedicated account management
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-warm-200 rounded-2xl p-8 shadow-sm">
              <div className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-navy-800 mb-2">
                  Send Us a Message
                </h2>
                <p className="font-body text-warm-600">
                  Tell us about your project and we'll help you find the perfect fabrics.
                </p>
              </div>
              
              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-body font-semibold text-green-800 mb-1">
                        Message Sent Successfully!
                      </h3>
                      <p className="font-body text-green-700 text-sm leading-relaxed">
                        {statusMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-body font-semibold text-red-800 mb-1">
                        Unable to Send Message
                      </h3>
                      <p className="font-body text-red-700 text-sm leading-relaxed">
                        {statusMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LuxuryInput
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    required
                    error={errors.name}
                  />

                  <LuxuryInput
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    required
                    error={errors.email}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LuxuryInput
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    error={errors.phone}
                  />

                  <LuxuryInput
                    id="orderNumber"
                    name="orderNumber"
                    type="text"
                    value={formData.orderNumber}
                    onChange={handleChange}
                    placeholder="Order Number (Optional)"
                  />
                </div>

                <LuxurySelect
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  options={subjectOptions}
                  placeholder="How can we help you?"
                  required
                  error={errors.subject}
                />

                <LuxuryTextarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your project, timeline, or any specific requirements..."
                  required
                  error={errors.message}
                  rows={6}
                  maxLength={500}
                />

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full h-14 rounded-xl font-body font-semibold text-lg
                               transition-all duration-300 flex items-center justify-center gap-3
                               shadow-lg hover:shadow-xl disabled:cursor-not-allowed
                               ${isSubmitting
                                 ? 'bg-warm-300 text-warm-600 cursor-not-allowed'
                                 : 'bg-navy-800 text-white hover:bg-navy-700 hover:-translate-y-0.5'
                               }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 pt-16 border-t border-warm-200">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-semibold text-navy-800 mb-4">
              Why Designers Choose Us
            </h2>
            <p className="font-body text-warm-700 max-w-2xl mx-auto">
              Join thousands of satisfied designers who trust us for their fabric needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-navy-50 border-2 border-navy-200 rounded-2xl 
                           flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-navy-800" />
              </div>
              <h3 className="font-display text-xl font-medium text-navy-800 mb-2">
                Expert Support
              </h3>
              <p className="font-body text-warm-700">
                Dedicated fabric specialists with 15+ years of design experience 
                provide personalized recommendations.
              </p>
              <div className="flex items-center justify-center gap-1 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-gold-800 text-gold-800" />
                ))}
                <span className="font-body text-sm text-warm-600 ml-2">4.9/5 from 2,400+ reviews</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gold-50 border-2 border-gold-200 rounded-2xl 
                           flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-gold-800" />
              </div>
              <h3 className="font-display text-xl font-medium text-navy-800 mb-2">
                Premium Quality
              </h3>
              <p className="font-body text-warm-700">
                Curated collection of premium fabrics from renowned mills worldwide, 
                each piece inspected for exceptional quality.
              </p>
              <div className="mt-3">
                <span className="bg-gold-100 text-gold-800 px-3 py-1 rounded-full font-body text-sm font-medium">
                  Quality Guaranteed
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-2xl 
                           flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-800" />
              </div>
              <h3 className="font-display text-xl font-medium text-navy-800 mb-2">
                Rapid Response
              </h3>
              <p className="font-body text-warm-700">
                Quick turnaround on samples and inquiries. Most emails answered 
                within 4 hours during business days.
              </p>
              <div className="mt-3">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-body text-sm font-medium">
                  24hr Response Promise
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
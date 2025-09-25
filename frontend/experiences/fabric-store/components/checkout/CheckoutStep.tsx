import React from 'react'

interface CheckoutStepProps {
  title: string
  isActive: boolean
  isCompleted?: boolean
  disabled?: boolean
  onEdit?: () => void
  children: React.ReactNode
}

export function CheckoutStep({ title, isActive, isCompleted, disabled, onEdit, children }: CheckoutStepProps) {
  return (
    <section className={`mb-6 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {isCompleted && onEdit && (
          <button className="text-sm text-blue-600" onClick={onEdit}>Edit</button>
        )}
      </header>
      <div className={`rounded-md border p-4 ${isActive ? '' : isCompleted ? 'bg-green-50' : 'bg-gray-50'}`}>
        {children}
      </div>
    </section>
  )
}


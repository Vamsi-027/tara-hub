'use client'

import React from 'react'
import { Toaster } from 'react-hot-toast'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <Toaster />
      {children}
    </>
  )
}
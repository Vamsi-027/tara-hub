'use client'

import { useEffect, useState } from 'react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ClientIconProps {
  icon: LucideIcon
  className?: string
  size?: number
}

export function ClientIcon({ icon: Icon, className, size }: ClientIconProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return <div className={className} style={{ width: size || 24, height: size || 24 }} />
  }

  return <Icon className={className} size={size} />
}

// Export individual icon components for convenience
export function MenuIcon(props: Omit<ClientIconProps, 'icon'>) {
  return <ClientIcon icon={Icons.Menu} {...props} />
}

export function XIcon(props: Omit<ClientIconProps, 'icon'>) {
  return <ClientIcon icon={Icons.X} {...props} />
}

export function SearchIcon(props: Omit<ClientIconProps, 'icon'>) {
  return <ClientIcon icon={Icons.Search} {...props} />
}

export function TruckIcon(props: Omit<ClientIconProps, 'icon'>) {
  return <ClientIcon icon={Icons.Truck} {...props} />
}

export function PackageIcon(props: Omit<ClientIconProps, 'icon'>) {
  return <ClientIcon icon={Icons.Package} {...props} />
}

export function ClockIcon(props: Omit<ClientIconProps, 'icon'>) {
  return <ClientIcon icon={Icons.Clock} {...props} />
}

export function ArrowRightIcon(props: Omit<ClientIconProps, 'icon'>) {
  return <ClientIcon icon={Icons.ArrowRight} {...props} />
}

export function StarIcon(props: Omit<ClientIconProps, 'icon'>) {
  return <ClientIcon icon={Icons.Star} {...props} />
}

export function ShoppingBagIcon(props: Omit<ClientIconProps, 'icon'>) {
  return <ClientIcon icon={Icons.ShoppingBag} {...props} />
}
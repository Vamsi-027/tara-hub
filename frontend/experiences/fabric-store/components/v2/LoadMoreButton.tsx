'use client'

import { ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoadMoreButtonProps {
  onClick: () => void
  loading: boolean
  className?: string
}

export function LoadMoreButton({ onClick, loading, className = '' }: LoadMoreButtonProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Button
        onClick={onClick}
        disabled={loading}
        variant="outline"
        size="lg"
        className="group px-8 py-6 rounded-full border-2 hover:border-gray-400
                   transition-all duration-300 hover:shadow-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span>Loading more fabrics...</span>
          </>
        ) : (
          <>
            <span>Load More Products</span>
            <ChevronDown className="w-5 h-5 ml-2 group-hover:translate-y-1 transition-transform" />
          </>
        )}
      </Button>
    </div>
  )
}
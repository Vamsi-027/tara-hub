import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function Pagination({ currentPage, totalPages, onPageChange, isLoading }: PaginationProps) {
  if (totalPages <= 1) return null

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 2 // Pages to show around current page
    const range: (number | string)[] = []
    const rangeWithDots: (number | string)[] = []
    let l: number | undefined

    // Always show first page
    range.push(1)

    // Calculate range around current page
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i)
      }
    }

    // Always show last page
    if (totalPages > 1) {
      range.push(totalPages)
    }

    // Add dots where there are gaps
    range.forEach((i) => {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i as number
    })

    return rangeWithDots
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-1 mt-8 mb-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg transition-all
          ${currentPage === 1 || isLoading
            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
          }
        `}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-10 h-10 text-gray-400"
              >
                …
              </span>
            )
          }

          const page = pageNum as number
          const isActive = page === currentPage

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              className={`
                flex items-center justify-center min-w-[40px] h-10 px-3 rounded-lg
                font-medium transition-all
                ${isActive
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : isLoading
                  ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
                }
              `}
              aria-label={`Go to page ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          )
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg transition-all
          ${currentPage === totalPages || isLoading
            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
          }
        `}
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
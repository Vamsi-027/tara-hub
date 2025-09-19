'use client'

import { useState, useEffect } from 'react'
import { Calculator, Info, ChevronDown, Ruler, Scissors, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface FabricEstimatorProps {
  fabricWidth: number // fabric width in inches
  pricePerYard: number
  onQuantityChange?: (yards: number, totalPrice: number) => void
  className?: string
}

interface ProjectType {
  id: string
  name: string
  icon: string
  description: string
  calculator: (dimensions: any) => number
}

const projectTypes: ProjectType[] = [
  {
    id: 'sofa',
    name: 'Sofa/Couch',
    icon: '🛋️',
    description: 'Standard 3-seat sofa',
    calculator: ({ length, depth, cushions }) => {
      const baseYardage = (length * depth * 2) / 1296 // sq inches to sq yards
      const cushionYardage = cushions * 1.5
      return Math.ceil((baseYardage + cushionYardage) * 1.2) // 20% waste factor
    }
  },
  {
    id: 'chair',
    name: 'Armchair',
    icon: '🪑',
    description: 'Single armchair or accent chair',
    calculator: ({ width, depth }) => {
      const yardage = (width * depth * 3) / 1296 // includes back and arms
      return Math.ceil(yardage * 1.15) // 15% waste factor
    }
  },
  {
    id: 'curtains',
    name: 'Curtains/Drapes',
    icon: '🪟',
    description: 'Window treatments',
    calculator: ({ width, length, panels, fullness }) => {
      const actualWidth = width * (fullness / 100)
      const yardage = (actualWidth * length * panels) / 1296
      return Math.ceil(yardage * 1.1) // 10% waste factor
    }
  },
  {
    id: 'pillows',
    name: 'Throw Pillows',
    icon: '🛏️',
    description: 'Decorative cushions',
    calculator: ({ size, quantity }) => {
      const yardagePerPillow = (size * size * 2) / 1296 // front and back
      return Math.ceil((yardagePerPillow * quantity) * 1.1)
    }
  },
  {
    id: 'custom',
    name: 'Custom Project',
    icon: '📐',
    description: 'Enter dimensions manually',
    calculator: ({ width, length }) => {
      return Math.ceil((width * length) / 1296 * 1.1)
    }
  }
]

export function FabricEstimator({ fabricWidth, pricePerYard, onQuantityChange, className = '' }: FabricEstimatorProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectType>(projectTypes[0])
  const [isExpanded, setIsExpanded] = useState(false)
  const [dimensions, setDimensions] = useState<any>({
    length: 84, // Default sofa length
    depth: 36,
    cushions: 3,
    width: 84,
    panels: 2,
    fullness: 150,
    size: 18,
    quantity: 4
  })
  const [manualYards, setManualYards] = useState([3])
  const [showTooltip, setShowTooltip] = useState('')

  const [estimatedYards, setEstimatedYards] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  // Calculate yardage based on selected project
  useEffect(() => {
    const calculatedYards = selectedProject.calculator(dimensions)
    setEstimatedYards(calculatedYards)
    setTotalPrice(calculatedYards * pricePerYard)
    onQuantityChange?.(calculatedYards, calculatedYards * pricePerYard)
  }, [selectedProject, dimensions, pricePerYard, onQuantityChange])

  // Manual yardage override
  useEffect(() => {
    if (selectedProject.id === 'manual') {
      const yards = manualYards[0]
      setEstimatedYards(yards)
      setTotalPrice(yards * pricePerYard)
      onQuantityChange?.(yards, yards * pricePerYard)
    }
  }, [manualYards, selectedProject.id, pricePerYard, onQuantityChange])

  const updateDimension = (key: string, value: number) => {
    setDimensions(prev => ({ ...prev, [key]: value }))
  }

  const renderProjectInputs = () => {
    switch (selectedProject.id) {
      case 'sofa':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Length (inches)
              </label>
              <input
                type="number"
                value={dimensions.length}
                onChange={(e) => updateDimension('length', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="60"
                max="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Depth (inches)
              </label>
              <input
                type="number"
                value={dimensions.depth}
                onChange={(e) => updateDimension('depth', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="30"
                max="48"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cushions
              </label>
              <input
                type="number"
                value={dimensions.cushions}
                onChange={(e) => updateDimension('cushions', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="2"
                max="5"
              />
            </div>
          </div>
        )

      case 'chair':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Width (inches)
              </label>
              <input
                type="number"
                value={dimensions.width}
                onChange={(e) => updateDimension('width', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="24"
                max="48"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Depth (inches)
              </label>
              <input
                type="number"
                value={dimensions.depth}
                onChange={(e) => updateDimension('depth', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="24"
                max="42"
              />
            </div>
          </div>
        )

      case 'curtains':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Window Width (inches)
              </label>
              <input
                type="number"
                value={dimensions.width}
                onChange={(e) => updateDimension('width', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Length (inches)
              </label>
              <input
                type="number"
                value={dimensions.length}
                onChange={(e) => updateDimension('length', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Panels
              </label>
              <input
                type="number"
                value={dimensions.panels}
                onChange={(e) => updateDimension('panels', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fullness (%)
                <button
                  onClick={() => setShowTooltip(showTooltip === 'fullness' ? '' : 'fullness')}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <HelpCircle className="w-3 h-3" />
                </button>
              </label>
              <input
                type="number"
                value={dimensions.fullness}
                onChange={(e) => updateDimension('fullness', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="100"
                max="300"
              />
              {showTooltip === 'fullness' && (
                <p className="text-xs text-gray-600 mt-1">
                  150% = 1.5x fullness (recommended), 200% = very full, 100% = flat
                </p>
              )}
            </div>
          </div>
        )

      case 'pillows':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pillow Size (inches)
              </label>
              <select
                value={dimensions.size}
                onChange={(e) => updateDimension('size', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={12}>12" x 12"</option>
                <option value={14}>14" x 14"</option>
                <option value={16}>16" x 16"</option>
                <option value={18}>18" x 18"</option>
                <option value={20}>20" x 20"</option>
                <option value={22}>22" x 22"</option>
                <option value={24}>24" x 24"</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={dimensions.quantity}
                onChange={(e) => updateDimension('quantity', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="20"
              />
            </div>
          </div>
        )

      case 'custom':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Width (inches)
              </label>
              <input
                type="number"
                value={dimensions.width}
                onChange={(e) => updateDimension('width', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Length (inches)
              </label>
              <input
                type="number"
                value={dimensions.length}
                onChange={(e) => updateDimension('length', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Fabric Calculator</h3>
            <p className="text-sm text-gray-600">
              {isExpanded ? 'Calculate yardage for your project' : `${estimatedYards} yards needed • $${totalPrice.toFixed(2)}`}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {/* Project Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What are you making?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {projectTypes.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-center
                    ${selectedProject.id === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{project.icon}</div>
                  <div className="text-xs font-medium">{project.name}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">{selectedProject.description}</p>
          </div>

          {/* Project-specific inputs */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Dimensions</h4>
            {renderProjectInputs()}
          </div>

          {/* Manual Override */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Or set yardage manually:
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProject({ ...selectedProject, id: 'manual' })
                }}
                className={selectedProject.id === 'manual' ? 'bg-blue-50 border-blue-500' : ''}
              >
                Manual
              </Button>
            </div>
            <div className="space-y-3">
              <Slider
                value={manualYards}
                onValueChange={setManualYards}
                min={0.5}
                max={20}
                step={0.25}
                className="w-full"
                disabled={selectedProject.id !== 'manual'}
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>0.5 yards</span>
                <span className="font-medium">{manualYards[0]} yards</span>
                <span>20 yards</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{estimatedYards}</div>
                <div className="text-sm text-gray-600">Yards Needed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">${totalPrice.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{fabricWidth}"</div>
                <div className="text-sm text-gray-600">Fabric Width</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Estimate includes waste factor</p>
                  <p>Actual yardage may vary based on pattern matching, fabric direction, and cutting layout. Consider ordering 10-15% extra for complex projects.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
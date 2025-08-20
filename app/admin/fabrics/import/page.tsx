"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  FileText, 
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Eye,
  Trash2
} from "lucide-react"
import { useFabricImport } from "@/modules/fabrics"
import { toast } from "sonner"
import Link from "next/link"

interface ImportError {
  row: number;
  data: any;
  error: string;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: ImportError[];
  duplicateSkus: string[];
  warnings: string[];
}

export default function FabricImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importFabrics, downloadTemplate, loading, error, result, reset } = useFabricImport()
  
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    const validExtensions = ['csv', 'xls', 'xlsx']
    const fileExtension = file.name.toLowerCase().split('.').pop()

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension || '')) {
      toast.error('Please select a CSV or Excel file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    reset()
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  // Start import
  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    try {
      await importFabrics(selectedFile)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon
  const getFileIcon = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop()
    if (extension === 'csv') return <FileText className="h-8 w-8 text-green-500" />
    if (['xls', 'xlsx'].includes(extension || '')) return <FileSpreadsheet className="h-8 w-8 text-blue-500" />
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/fabrics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import Fabrics</h1>
            <p className="text-muted-foreground">
              Upload CSV or Excel files to bulk import fabric data
            </p>
          </div>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">Before you start:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Download the template to see the required format and column headers</li>
              <li>Ensure your data includes at minimum: SKU, Name, Manufacturer Name, and Retail Price</li>
              <li>File size limit: 5MB, formats supported: CSV, XLS, XLSX</li>
              <li>The system will automatically map common column names to fabric fields</li>
              <li><strong>New inventory fields:</strong> Stock quantity, Reserved quantity, Available quantity, Reorder points, Warehouse locations</li>
              <li><strong>Images are NOT handled via CSV:</strong> Upload images separately after import through the fabric edit interface</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Inventory Management Guide */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <FileSpreadsheet className="h-5 w-5" />
            Inventory Management Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-800 mb-2">Stock Tracking:</h4>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li><strong>stock_quantity:</strong> Total inventory on hand</li>
                <li><strong>reserved_quantity:</strong> Allocated to orders</li>
                <li><strong>available_quantity:</strong> Free for new orders</li>
                <li><strong>minimum_order:</strong> Minimum purchase quantity</li>
                <li><strong>increment_quantity:</strong> Order multiples (e.g., 0.5 yards)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-800 mb-2">Reorder Management:</h4>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li><strong>reorder_point:</strong> Trigger for reordering</li>
                <li><strong>reorder_quantity:</strong> Amount to reorder</li>
                <li><strong>lead_time_days:</strong> Supplier delivery time</li>
                <li><strong>warehouse_location:</strong> Storage area code</li>
                <li><strong>bin_location:</strong> Specific shelf/bin</li>
                <li><strong>roll_count:</strong> Number of physical rolls</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
            <p className="font-semibold text-yellow-800 mb-1">⚠️ Important Note:</p>
            <p className="text-yellow-700">
              Images are no longer handled through CSV import. After importing your fabric data, 
              use the individual fabric edit pages to upload and manage images. This provides better 
              control over image quality and organization.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>1. Select File</CardTitle>
            <CardDescription>
              Choose a CSV or Excel file containing your fabric data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drop your file here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:text-blue-600 underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports CSV, XLS, XLSX files up to 5MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  {getFileIcon(selectedFile.name)}
                  <div className="flex-1">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      reset()
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle>2. Start Import</CardTitle>
            <CardDescription>
              Process the selected file and import fabric data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm">Processing file...</span>
                </div>
                <Progress value={undefined} className="w-full" />
              </div>
            )}

            {error && (
              <Alert className="border-red-500 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-4">
                <Alert className={`border-green-500 bg-green-50`}>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="font-semibold mb-2">Import Summary:</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Rows:</span> {result.totalRows}
                      </div>
                      <div>
                        <span className="font-medium text-green-600">Successful:</span> {result.successCount}
                      </div>
                      <div>
                        <span className="font-medium text-red-600">Failed:</span> {result.failureCount}
                      </div>
                      <div>
                        <span className="font-medium text-yellow-600">Warnings:</span> {result.warnings?.length || 0}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {result.failureCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowErrors(!showErrors)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {showErrors ? 'Hide' : 'Show'} Error Details
                  </Button>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleImport}
                disabled={!selectedFile || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Fabrics
                  </>
                )}
              </Button>
              
              {result && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/fabrics')}
                >
                  View Fabrics
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Details */}
      {result && showErrors && result.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Import Errors ({result.errors.length})
            </CardTitle>
            <CardDescription>
              Review the errors below to fix your data and try again
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {result.errors.map((error, index) => (
                  <div key={index} className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="destructive" className="text-xs">
                        Row {error.row}
                      </Badge>
                    </div>
                    <p className="text-sm text-red-800 mb-2">{error.error}</p>
                    {error.data && (
                      <div className="text-xs text-red-700 bg-red-100 p-2 rounded font-mono">
                        {typeof error.data === 'object' 
                          ? JSON.stringify(error.data, null, 2)
                          : String(error.data)
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {result && result.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.warnings.map((warning, index) => (
                <Alert key={index} className="border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    {warning}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestImportPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testWithSampleData = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Create a test CSV in memory
      const csvContent = `sku,name,description,type,manufacturer_name,collection,fiber_content,width,weight,pattern,primary_color,secondary_colors,retail_price,currency,price_unit,stock_quantity,reserved_quantity,available_quantity,minimum_order,increment_quantity,reorder_point,reorder_quantity,lead_time_days,is_custom_order,warehouse_location,bin_location,roll_count,status,durability_rating,martindale,wyzenbeek,lightfastness,pilling_resistance,stain_resistant,fade_resistant,water_resistant,pet_friendly,outdoor_safe,fire_retardant,bleach_cleanable,antimicrobial,cleaning_code
TEST-001,Test Fabric,Test Description,Upholstery,Test Manufacturer,Test Collection,100% Cotton,54,12.5,Solid,Blue,Red,99.99,USD,per_yard,100,10,90,1,0.5,20,50,7,FALSE,A-1,B-2,5,Active,Heavy Duty,25000,40000,5,4,TRUE,TRUE,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE,S`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);

      // Test the simple endpoint
      const response = await fetch('/api/v1/fabrics/import-simple', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        setError(`Server error: ${data.error || 'Unknown error'}`);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testWithFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Test the simple endpoint
      const response = await fetch('/api/v1/fabrics/import-simple', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        setError(`Server error: ${data.error || 'Unknown error'}`);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">CSV Import Debug Test</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test with Sample Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testWithSampleData} disabled={loading}>
              {loading ? 'Testing...' : 'Test with In-Memory CSV'}
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              This creates a CSV in memory with known good data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test with File Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".csv"
              onChange={testWithFile}
              disabled={loading}
              className="mb-4"
            />
            <p className="text-sm text-gray-600">
              Upload your fabric_import_template.csv file
            </p>
          </CardContent>
        </Card>

        {error && (
          <Alert className="border-red-500">
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
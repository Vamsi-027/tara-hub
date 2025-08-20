/**
 * SIMPLIFIED FABRIC IMPORT - Testing version
 * This version has minimal processing to isolate the issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkJWTAuth, PERMISSIONS } from '@/modules/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { allowed, error } = await checkJWTAuth(PERMISSIONS.CREATE);
    if (!allowed) {
      return error!;
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file as text
    const text = await file.text();
    console.log('[Simple Import] File received:', file.name, 'Size:', text.length);
    
    // Simple split by lines
    const lines = text.split('\n').filter(line => line.trim());
    console.log('[Simple Import] Total lines:', lines.length);
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File is empty or has no data rows' }, { status: 400 });
    }
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    console.log('[Simple Import] Headers:', headers);
    
    // Find critical columns
    const retailPriceIndex = headers.findIndex(h => h === 'retail_price');
    const stockQuantityIndex = headers.findIndex(h => h === 'stock_quantity');
    const skuIndex = headers.findIndex(h => h === 'sku');
    const nameIndex = headers.findIndex(h => h === 'name');
    
    console.log('[Simple Import] Column indices:', {
      sku: skuIndex,
      name: nameIndex,
      retail_price: retailPriceIndex,
      stock_quantity: stockQuantityIndex
    });
    
    // Process first data row for debugging
    if (lines.length > 1) {
      const firstDataLine = lines[1];
      console.log('[Simple Import] First data line raw:', firstDataLine);
      
      // Parse CSV line (handle quoted values)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < firstDataLine.length; i++) {
        const char = firstDataLine[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add last value
      
      console.log('[Simple Import] First row parsed values:', values);
      console.log('[Simple Import] First row value count:', values.length);
      
      // Extract key values
      const sku = values[skuIndex] || 'UNDEFINED';
      const name = values[nameIndex] || 'UNDEFINED';
      const retailPrice = values[retailPriceIndex] || 'UNDEFINED';
      const stockQuantity = values[stockQuantityIndex] || 'UNDEFINED';
      
      console.log('[Simple Import] Extracted values:', {
        sku,
        name,
        retailPrice,
        stockQuantity,
        retailPriceRaw: values[retailPriceIndex],
        stockQuantityRaw: values[stockQuantityIndex]
      });
      
      // Try to parse as numbers
      const retailPriceNum = parseFloat(retailPrice);
      const stockQuantityNum = parseFloat(stockQuantity);
      
      console.log('[Simple Import] Parsed numbers:', {
        retailPriceNum,
        stockQuantityNum,
        retailPriceIsNaN: isNaN(retailPriceNum),
        stockQuantityIsNaN: isNaN(stockQuantityNum)
      });
      
      return NextResponse.json({
        success: true,
        debug: {
          fileSize: text.length,
          lineCount: lines.length,
          headerCount: headers.length,
          firstRowValueCount: values.length,
          columnIndices: {
            sku: skuIndex,
            name: nameIndex,
            retail_price: retailPriceIndex,
            stock_quantity: stockQuantityIndex
          },
          extractedValues: {
            sku,
            name,
            retailPrice,
            stockQuantity
          },
          parsedNumbers: {
            retailPrice: retailPriceNum,
            stockQuantity: stockQuantityNum
          },
          firstRowRaw: firstDataLine.substring(0, 200),
          headers: headers.slice(0, 20)
        }
      });
    }
    
    return NextResponse.json({ 
      error: 'No data rows found',
      debug: { headers, lineCount: lines.length }
    }, { status: 400 });

  } catch (error: any) {
    console.error('[Simple Import] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}
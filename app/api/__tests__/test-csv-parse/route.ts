/**
 * TEST ENDPOINT - NO AUTH REQUIRED
 * Tests CSV parsing without authentication
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      // If no file, test with hardcoded CSV
      const testCSV = `sku,name,description,type,manufacturer_name,collection,fiber_content,width,weight,pattern,primary_color,secondary_colors,retail_price,currency,price_unit,stock_quantity,reserved_quantity,available_quantity,minimum_order,increment_quantity,reorder_point,reorder_quantity,lead_time_days,is_custom_order,warehouse_location,bin_location,roll_count,status,durability_rating,martindale,wyzenbeek,lightfastness,pilling_resistance,stain_resistant,fade_resistant,water_resistant,pet_friendly,outdoor_safe,fire_retardant,bleach_cleanable,antimicrobial,cleaning_code
FAB-TEST,Test Fabric,Test Description,Upholstery,Test Mfg,Test Col,100% Cotton,54,12.5,Solid,Blue,Red,99.99,USD,per_yard,100.5,10,90.5,1,0.5,20,50,7,FALSE,A-1,B-2,5,Active,Heavy Duty,25000,40000,5,4,TRUE,TRUE,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE,S`;
      
      const lines = testCSV.split('\n');
      const headers = lines[0].split(',');
      const dataLine = lines[1];
      const values = dataLine.split(',');
      
      return NextResponse.json({
        success: true,
        source: 'hardcoded',
        headers: headers.length,
        values: values.length,
        retailPriceIndex: headers.indexOf('retail_price'),
        stockQuantityIndex: headers.indexOf('stock_quantity'),
        retailPriceValue: values[headers.indexOf('retail_price')],
        stockQuantityValue: values[headers.indexOf('stock_quantity')]
      });
    }

    // Read file as text
    const text = await file.text();
    console.log('[Test Parse] File size:', text.length);
    
    // Simple split by lines
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'No data rows' }, { status: 400 });
    }
    
    // Parse headers - handle potential BOM
    let headerLine = lines[0];
    if (headerLine.charCodeAt(0) === 0xFEFF) {
      headerLine = headerLine.substring(1);
    }
    
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Parse first data row
    const dataLine = lines[1];
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < dataLine.length; i++) {
      const char = dataLine[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    // Find indices
    const retailPriceIndex = headers.findIndex(h => h === 'retail_price' || h === 'retail price');
    const stockQuantityIndex = headers.findIndex(h => h === 'stock_quantity' || h === 'stock quantity');
    
    return NextResponse.json({
      success: true,
      source: 'uploaded file',
      fileName: file.name,
      fileSize: text.length,
      lineCount: lines.length,
      headers: {
        count: headers.length,
        first5: headers.slice(0, 5),
        containsRetailPrice: headers.includes('retail_price'),
        containsStockQuantity: headers.includes('stock_quantity')
      },
      firstRow: {
        valueCount: values.length,
        first5: values.slice(0, 5)
      },
      criticalFields: {
        retailPrice: {
          headerIndex: retailPriceIndex,
          headerName: headers[retailPriceIndex],
          value: values[retailPriceIndex],
          parsedNumber: parseFloat(values[retailPriceIndex] || '0')
        },
        stockQuantity: {
          headerIndex: stockQuantityIndex,
          headerName: headers[stockQuantityIndex],
          value: values[stockQuantityIndex],
          parsedNumber: parseFloat(values[stockQuantityIndex] || '0')
        }
      },
      debug: {
        headerLine: headerLine.substring(0, 100),
        dataLine: dataLine.substring(0, 100),
        headerCharCodes: headerLine.substring(0, 10).split('').map(c => c.charCodeAt(0))
      }
    });

  } catch (error: any) {
    console.error('[Test Parse] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Parse failed' },
      { status: 500 }
    );
  }
}
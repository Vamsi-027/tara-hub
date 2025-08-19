/**
 * FABRIC IMPORT API ENDPOINT
 * Handles CSV/Excel file uploads and bulk fabric creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { fabricService } from '@/lib/services/fabric.service';
import { checkJWTAuth, PERMISSIONS } from '@/lib/auth-utils-jwt';
import { insertFabricSchema } from '@/lib/db/schema/fabrics-simple.schema';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Types
interface ImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  duplicateSkus: string[];
  warnings: string[];
}

interface ParsedFabricData {
  sku: string;
  name: string;
  description?: string;
  type: string;
  brand?: string;
  collection?: string;
  material?: string;
  width?: number;
  weight?: number;
  pattern?: string;
  colors?: string[];
  retailPrice: number;
  wholesalePrice?: number;
  salePrice?: number;
  cost?: number;
  stockQuantity: number;
  stockUnit?: string;
  lowStockThreshold?: number;
  status?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

// CSV Column mappings
const columnMappings: Record<string, string> = {
  // Basic Info
  'sku': 'sku',
  'product_sku': 'sku',
  'item_sku': 'sku',
  'code': 'sku',
  
  'name': 'name',
  'product_name': 'name',
  'fabric_name': 'name',
  'title': 'name',
  
  'description': 'description',
  'product_description': 'description',
  'details': 'description',
  
  // Type & Category
  'type': 'type',
  'fabric_type': 'type',
  'category': 'type',
  'product_type': 'type',
  
  'brand': 'brand',
  'manufacturer': 'brand',
  'supplier': 'brand',
  
  'collection': 'collection',
  'series': 'collection',
  'line': 'collection',
  
  // Specifications
  'material': 'material',
  'fabric_material': 'material',
  'composition': 'material',
  'content': 'material',
  
  'width': 'width',
  'fabric_width': 'width',
  'width_inches': 'width',
  
  'weight': 'weight',
  'fabric_weight': 'weight',
  'weight_oz': 'weight',
  
  'pattern': 'pattern',
  'design': 'pattern',
  'print': 'pattern',
  
  // Colors
  'colors': 'colors',
  'available_colors': 'colors',
  'color_options': 'colors',
  'colorways': 'colors',
  
  // Images
  'images': 'images',
  'image_urls': 'images',
  'photos': 'images',
  'pictures': 'images',
  'image_url': 'images',
  'photo_url': 'images',
  'primary_image': 'images',
  'main_image': 'images',
  
  'swatch_image': 'swatchImage',
  'swatch_url': 'swatchImage',
  'thumbnail': 'swatchImage',
  
  // Pricing
  'retail_price': 'retailPrice',
  'price': 'retailPrice',
  'list_price': 'retailPrice',
  'msrp': 'retailPrice',
  
  'wholesale_price': 'wholesalePrice',
  'trade_price': 'wholesalePrice',
  'cost_price': 'wholesalePrice',
  
  'sale_price': 'salePrice',
  'special_price': 'salePrice',
  'promo_price': 'salePrice',
  
  'cost': 'cost',
  'unit_cost': 'cost',
  'our_cost': 'cost',
  
  // Inventory
  'stock_quantity': 'stockQuantity',
  'quantity': 'stockQuantity',
  'inventory': 'stockQuantity',
  'stock': 'stockQuantity',
  'qty': 'stockQuantity',
  
  'stock_unit': 'stockUnit',
  'unit': 'stockUnit',
  'uom': 'stockUnit',
  
  'low_stock_threshold': 'lowStockThreshold',
  'reorder_point': 'lowStockThreshold',
  'min_stock': 'lowStockThreshold',
  
  // Status
  'status': 'status',
  'product_status': 'status',
  'availability': 'status',
  
  'active': 'isActive',
  'is_active': 'isActive',
  'enabled': 'isActive',
  
  'featured': 'isFeatured',
  'is_featured': 'isFeatured',
  'highlight': 'isFeatured'
};

// Normalize column name for mapping
function normalizeColumnName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Parse colors from string
function parseColors(colorString: string): string[] {
  if (!colorString) return [];
  
  // Handle various delimiters
  const delimiters = [',', ';', '|', '/', '\n'];
  let colors = [colorString];
  
  for (const delimiter of delimiters) {
    if (colorString.includes(delimiter)) {
      colors = colorString.split(delimiter);
      break;
    }
  }
  
  return colors
    .map(color => color.trim())
    .filter(color => color.length > 0)
    .slice(0, 10); // Limit to 10 colors
}

// Parse images from string (URLs separated by delimiters)
function parseImages(imageString: string): string[] {
  if (!imageString) return [];
  
  // Handle various delimiters
  const delimiters = [',', ';', '|', '\n'];
  let images = [imageString];
  
  for (const delimiter of delimiters) {
    if (imageString.includes(delimiter)) {
      images = imageString.split(delimiter);
      break;
    }
  }
  
  return images
    .map(url => url.trim())
    .filter(url => {
      // Basic URL validation
      if (!url) return false;
      try {
        new URL(url);
        return url.match(/\.(jpg|jpeg|png|webp|gif)$/i) !== null;
      } catch {
        return false;
      }
    })
    .slice(0, 20); // Limit to 20 images
}

// Validate and clean image URL
function validateImageUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const validatedUrl = new URL(url.trim());
    // Check if it's a valid image extension
    if (validatedUrl.pathname.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      return validatedUrl.toString();
    }
  } catch {
    // Invalid URL
  }
  
  return null;
}

// Convert string to boolean
function parseBoolean(value: string): boolean {
  if (typeof value === 'boolean') return value;
  const str = String(value).toLowerCase().trim();
  return ['true', '1', 'yes', 'y', 'on', 'active', 'enabled'].includes(str);
}

// Convert string to number
function parseNumber(value: string, allowNull: boolean = true): number | null {
  if (!value || value === '') return allowNull ? null : 0;
  const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? (allowNull ? null : 0) : num;
}

// Map fabric type to valid enum value
function mapFabricType(type: string): string {
  if (!type) return 'Upholstery';
  
  const typeMap: Record<string, string> = {
    'upholstery': 'Upholstery',
    'drapery': 'Drapery',
    'drapes': 'Drapery',
    'curtain': 'Drapery',
    'multi_purpose': 'Multi-Purpose',
    'multipurpose': 'Multi-Purpose',
    'multi': 'Multi-Purpose',
    'outdoor': 'Outdoor',
    'exterior': 'Outdoor',
    'trim': 'Trim',
    'leather': 'Leather',
    'vinyl': 'Vinyl',
    'sheer': 'Sheer',
    'blackout': 'Blackout',
    'lining': 'Lining'
  };
  
  const normalized = type.toLowerCase().replace(/[^a-z]/g, '_');
  return typeMap[normalized] || 'Upholstery';
}

// Map status to valid enum value
function mapStatus(status: string): string {
  if (!status) return 'Active';
  
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'available': 'Active',
    'in_stock': 'Active',
    'discontinued': 'Discontinued',
    'inactive': 'Discontinued',
    'out_of_stock': 'Out of Stock',
    'oos': 'Out of Stock',
    'coming_soon': 'Coming Soon',
    'coming': 'Coming Soon',
    'sale': 'Sale',
    'on_sale': 'Sale',
    'clearance': 'Clearance'
  };
  
  const normalized = status.toLowerCase().replace(/[^a-z]/g, '_');
  return statusMap[normalized] || 'Active';
}

// Parse a single row of data
function parseRow(row: any, headers: string[], rowIndex: number): ParsedFabricData | null {
  const fabric: any = {};
  
  // Map columns to fabric fields
  headers.forEach((header, index) => {
    const normalizedHeader = normalizeColumnName(header);
    const mappedField = columnMappings[normalizedHeader];
    
    if (mappedField && row[index] !== undefined && row[index] !== '') {
      const value = String(row[index]).trim();
      
      switch (mappedField) {
        case 'colors':
          fabric.colors = parseColors(value);
          break;
        case 'images':
          fabric.images = parseImages(value);
          break;
        case 'swatchImage':
          fabric.swatchImage = validateImageUrl(value);
          break;
        case 'retailPrice':
        case 'wholesalePrice':
        case 'salePrice':
        case 'cost':
          fabric[mappedField] = parseNumber(value, mappedField !== 'retailPrice');
          break;
        case 'width':
        case 'weight':
          fabric[mappedField] = parseNumber(value, true);
          break;
        case 'stockQuantity':
        case 'lowStockThreshold':
          fabric[mappedField] = parseNumber(value, false) || 0;
          break;
        case 'isActive':
        case 'isFeatured':
          fabric[mappedField] = parseBoolean(value);
          break;
        case 'type':
          fabric.type = mapFabricType(value);
          break;
        case 'status':
          fabric.status = mapStatus(value);
          break;
        default:
          fabric[mappedField] = value;
      }
    }
  });
  
  // Set defaults
  fabric.type = fabric.type || 'Upholstery';
  fabric.status = fabric.status || 'Active';
  fabric.stockUnit = fabric.stockUnit || 'yards';
  fabric.lowStockThreshold = fabric.lowStockThreshold || 10;
  fabric.isActive = fabric.isActive !== undefined ? fabric.isActive : true;
  fabric.isFeatured = fabric.isFeatured !== undefined ? fabric.isFeatured : false;
  fabric.colors = fabric.colors || [];
  fabric.stockQuantity = fabric.stockQuantity || 0;
  
  return fabric as ParsedFabricData;
}

// Parse CSV file
async function parseCSV(fileBuffer: Buffer): Promise<{ data: any[][]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    const csvText = fileBuffer.toString('utf-8');
    
    Papa.parse(csvText, {
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          return;
        }
        
        const data = results.data as string[][];
        if (data.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row.some(cell => cell && cell.trim()));
        
        resolve({ data: rows, headers });
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

// Parse Excel file
async function parseExcel(fileBuffer: Buffer): Promise<{ data: any[][]; headers: string[] }> {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      throw new Error('Excel file contains no sheets');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    if (jsonData.length === 0) {
      throw new Error('Excel sheet is empty');
    }
    
    const data = jsonData as string[][];
    const headers = data[0];
    const rows = data.slice(1).filter(row => row.some(cell => cell && String(cell).trim()));
    
    return { data: rows, headers };
  } catch (error: any) {
    throw new Error(`Excel parsing error: ${error.message}`);
  }
}

// Main import handler
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { allowed, error, userId } = await checkJWTAuth(PERMISSIONS.CREATE);
    if (!allowed) {
      return error!;
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: { message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: { message: 'Invalid file type. Please upload CSV or Excel files.' } },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: { message: 'File too large. Maximum size is 5MB.' } },
        { status: 400 }
      );
    }

    // Read file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Parse file based on type
    let parsedData: { data: any[][]; headers: string[] };
    
    if (fileExtension === 'csv') {
      parsedData = await parseCSV(fileBuffer);
    } else {
      parsedData = await parseExcel(fileBuffer);
    }

    const { data: rows, headers } = parsedData;

    // Process each row
    const result: ImportResult = {
      totalRows: rows.length,
      successCount: 0,
      failureCount: 0,
      errors: [],
      duplicateSkus: [],
      warnings: []
    };

    const processedSkus = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      try {
        const fabricData = parseRow(rows[i], headers, i + 2); // +2 for 1-based + header row
        
        if (!fabricData) {
          result.errors.push({
            row: i + 2,
            data: rows[i],
            error: 'Failed to parse row data'
          });
          result.failureCount++;
          continue;
        }

        // Check for required fields
        if (!fabricData.sku || !fabricData.name || !fabricData.retailPrice) {
          result.errors.push({
            row: i + 2,
            data: fabricData,
            error: 'Missing required fields: SKU, Name, and Retail Price are required'
          });
          result.failureCount++;
          continue;
        }

        // Check for duplicate SKU in this batch
        if (processedSkus.has(fabricData.sku)) {
          result.duplicateSkus.push(fabricData.sku);
          result.errors.push({
            row: i + 2,
            data: fabricData,
            error: `Duplicate SKU in file: ${fabricData.sku}`
          });
          result.failureCount++;
          continue;
        }

        processedSkus.add(fabricData.sku);

        // Validate against schema
        const validated = insertFabricSchema.parse(fabricData);

        // Create fabric
        await fabricService.create(validated, session.user.id || 'admin');
        result.successCount++;

      } catch (error: any) {
        result.errors.push({
          row: i + 2,
          data: rows[i],
          error: error.message
        });
        result.failureCount++;
      }
    }

    // Add warnings if any
    if (result.duplicateSkus.length > 0) {
      result.warnings.push(`Found ${result.duplicateSkus.length} duplicate SKUs in file`);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Import completed: ${result.successCount} successful, ${result.failureCount} failed`
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Import failed' } },
      { status: 500 }
    );
  }
}

// Export template endpoint
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { allowed, error, userId } = await checkJWTAuth(PERMISSIONS.CREATE);
    if (!allowed) {
      return error!;
    }

    // Create sample CSV template
    const template = [
      [
        'sku', 'name', 'description', 'type', 'brand', 'collection',
        'material', 'width', 'weight', 'pattern', 'colors',
        'retail_price', 'wholesale_price', 'sale_price', 'cost',
        'stock_quantity', 'stock_unit', 'low_stock_threshold',
        'status', 'is_active', 'is_featured', 'images', 'swatch_image'
      ],
      [
        'FAB-001', 'Premium Velvet - Emerald Green', 'Luxurious velvet perfect for upholstery',
        'Upholstery', 'Luxury Textiles', 'Spring 2024', '100% Cotton Velvet',
        '54', '12.5', 'Solid', 'Emerald Green,Forest Green',
        '45.99', '35.99', '', '28.50',
        '100', 'yards', '10', 'Active', 'true', 'true',
        'https://example.com/fabric1_main.jpg,https://example.com/fabric1_detail.jpg',
        'https://example.com/fabric1_swatch.jpg'
      ],
      [
        'FAB-002', 'Linen Blend - Natural', 'Natural linen blend for drapery',
        'Drapery', 'Natural Fibers Co', 'Classics', '55% Linen, 45% Cotton',
        '60', '8.2', 'Plain Weave', 'Natural,Cream,Off-White',
        '32.50', '24.99', '29.99', '18.75',
        '75', 'yards', '15', 'Sale', 'true', 'false',
        'https://example.com/fabric2_main.jpg',
        'https://example.com/fabric2_swatch.jpg'
      ]
    ];

    // Convert to CSV
    const csvContent = template
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="fabric_import_template.csv"'
      }
    });

  } catch (error: any) {
    console.error('Template export error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to generate template' } },
      { status: 500 }
    );
  }
}
/**
 * FABRIC IMPORT API ENDPOINT
 * Handles CSV/Excel file uploads and bulk fabric creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { fabricService } from '@/lib/services/fabric.service';
import { checkJWTAuth, PERMISSIONS } from '@/lib/auth-utils-jwt';
import { insertFabricSchema } from '@/lib/db/schema/fabrics.schema';
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
  manufacturerName?: string;
  brand?: string;
  supplierName?: string;
  collection?: string;
  fiberContent?: string;
  width?: number;
  weight?: number;
  pattern?: string;
  primaryColor?: string;
  secondaryColors?: string[];
  retailPrice: number;
  wholesalePrice?: number;
  costPrice?: number;
  procurementCost?: number;
  currency?: string;
  priceUnit?: string;
  stockQuantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  minimumOrder?: number;
  incrementQuantity?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  leadTimeDays?: number;
  isCustomOrder?: boolean;
  warehouseLocation?: string;
  binLocation?: string;
  rollCount?: number;
  status?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  // Performance fields
  durabilityRating?: string;
  martindale?: number;
  wyzenbeek?: number;
  lightfastness?: number;
  pillingResistance?: number;
  isStainResistant?: boolean;
  isFadeResistant?: boolean;
  isWaterResistant?: boolean;
  isPetFriendly?: boolean;
  isOutdoorSafe?: boolean;
  isFireRetardant?: boolean;
  isBleachCleanable?: boolean;
  isAntimicrobial?: boolean;
  cleaningCode?: string;
  performanceMetrics?: any;
  usageSuitability?: any;
  additionalFeatures?: any;
  technicalDocuments?: any;
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
  
  // Manufacturer Information
  'manufacturer_name': 'manufacturerName',
  'manufacturer': 'manufacturerName',
  'brand': 'manufacturerName',
  'maker': 'manufacturerName',
  
  'supplier_name': 'supplierName',
  'supplier': 'supplierName',
  'vendor': 'supplierName',
  
  'collection': 'collection',
  'series': 'collection',
  'line': 'collection',
  
  // Specifications
  'fiber_content': 'fiberContent',
  'material': 'fiberContent',
  'fabric_material': 'fiberContent',
  'composition': 'fiberContent',
  'content': 'fiberContent',
  
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
  'primary_color': 'primaryColor',
  'main_color': 'primaryColor',
  'color': 'primaryColor',
  
  'secondary_colors': 'secondaryColors',
  'colors': 'secondaryColors',
  'available_colors': 'secondaryColors',
  'color_options': 'secondaryColors',
  'colorways': 'secondaryColors',
  
  // Images - EXCLUDED FROM IMPORT (handled separately)
  // 'images': 'images',
  // 'image_urls': 'images',
  // 'photos': 'images',
  // 'pictures': 'images',
  // 'image_url': 'images',
  // 'photo_url': 'images',
  // 'primary_image': 'images',
  // 'main_image': 'images',
  // 'swatch_image': 'swatchImage',
  // 'swatch_url': 'swatchImage',
  // 'thumbnail': 'swatchImage',
  
  // Pricing
  'retail_price': 'retailPrice',
  'price': 'retailPrice',
  'list_price': 'retailPrice',
  'msrp': 'retailPrice',
  
  'wholesale_price': 'wholesalePrice',
  'trade_price': 'wholesalePrice',
  
  'cost_price': 'costPrice',
  'cost': 'costPrice',
  'unit_cost': 'costPrice',
  
  'procurement_cost': 'procurementCost',
  'currency': 'currency',
  'price_unit': 'priceUnit',
  
  // Inventory Management
  'stock_quantity': 'stockQuantity',
  'quantity': 'stockQuantity',
  'inventory': 'stockQuantity',
  'stock': 'stockQuantity',
  'qty': 'stockQuantity',
  
  'reserved_quantity': 'reservedQuantity',
  'reserved': 'reservedQuantity',
  'allocated': 'reservedQuantity',
  
  'available_quantity': 'availableQuantity',
  'available': 'availableQuantity',
  'free_stock': 'availableQuantity',
  
  'minimum_order': 'minimumOrder',
  'min_order': 'minimumOrder',
  'moq': 'minimumOrder',
  
  'increment_quantity': 'incrementQuantity',
  'increment': 'incrementQuantity',
  'order_increment': 'incrementQuantity',
  
  // Reorder Management
  'reorder_point': 'reorderPoint',
  'min_stock': 'reorderPoint',
  'low_stock_threshold': 'reorderPoint',
  
  'reorder_quantity': 'reorderQuantity',
  'reorder_qty': 'reorderQuantity',
  
  'lead_time_days': 'leadTimeDays',
  'lead_time': 'leadTimeDays',
  'delivery_days': 'leadTimeDays',
  
  'is_custom_order': 'isCustomOrder',
  'custom_order': 'isCustomOrder',
  'made_to_order': 'isCustomOrder',
  
  // Location & Storage
  'warehouse_location': 'warehouseLocation',
  'warehouse': 'warehouseLocation',
  'location': 'warehouseLocation',
  
  'bin_location': 'binLocation',
  'bin': 'binLocation',
  'shelf': 'binLocation',
  
  'roll_count': 'rollCount',
  'rolls': 'rollCount',
  'pieces': 'rollCount',
  
  // Status
  'status': 'status',
  'product_status': 'status',
  'availability': 'status',
  
  'active': 'isActive',
  'is_active': 'isActive',
  'enabled': 'isActive',
  
  'featured': 'isFeatured',
  'is_featured': 'isFeatured',
  'highlight': 'isFeatured',
  
  // Performance Ratings
  'durability_rating': 'durabilityRating',
  'durability': 'durabilityRating',
  'martindale': 'martindale',
  'martindale_rating': 'martindale',
  'wyzenbeek': 'wyzenbeek',
  'wyzenbeek_rating': 'wyzenbeek',
  'lightfastness': 'lightfastness',
  'light_fastness': 'lightfastness',
  'pilling_resistance': 'pillingResistance',
  'pilling': 'pillingResistance',
  
  // Treatment Features
  'stain_resistant': 'isStainResistant',
  'is_stain_resistant': 'isStainResistant',
  'fade_resistant': 'isFadeResistant',
  'is_fade_resistant': 'isFadeResistant',
  'water_resistant': 'isWaterResistant',
  'is_water_resistant': 'isWaterResistant',
  'pet_friendly': 'isPetFriendly',
  'is_pet_friendly': 'isPetFriendly',
  'outdoor_safe': 'isOutdoorSafe',
  'is_outdoor_safe': 'isOutdoorSafe',
  'fire_retardant': 'isFireRetardant',
  'is_fire_retardant': 'isFireRetardant',
  'bleach_cleanable': 'isBleachCleanable',
  'is_bleach_cleanable': 'isBleachCleanable',
  'antimicrobial': 'isAntimicrobial',
  'is_antimicrobial': 'isAntimicrobial',
  
  // Care
  'cleaning_code': 'cleaningCode',
  'care_code': 'cleaningCode',
  'cleaning': 'cleaningCode',
  
  // JSON fields (handled specially)
  'performance_metrics': 'performanceMetrics',
  'usage_suitability': 'usageSuitability',
  'additional_features': 'additionalFeatures',
  'technical_documents': 'technicalDocuments',
  'certifications': 'certifications'
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
        case 'primaryColor':
          fabric.primaryColor = value;
          break;
        case 'secondaryColors':
          fabric.secondaryColors = parseColors(value);
          break;
        // Images are excluded from CSV import - handle separately
        // case 'images':
        // case 'swatchImage':
        //   break;
        case 'retailPrice':
        case 'wholesalePrice':
        case 'costPrice':
        case 'procurementCost':
          // For retailPrice, we must ensure it's never undefined/null
          const parsedPrice = parseNumber(value, mappedField !== 'retailPrice');
          fabric[mappedField] = parsedPrice !== null ? parsedPrice : 0;
          // Debug logging for price fields
          if (mappedField === 'retailPrice') {
            console.log(`[parseRow] retailPrice processing:`, {
              originalValue: value,
              parsedPrice,
              finalValue: fabric[mappedField],
              header,
              normalizedHeader
            });
          }
          break;
        case 'currency':
        case 'priceUnit':
          fabric[mappedField] = value || (mappedField === 'currency' ? 'USD' : 'per_yard');
          break;
        case 'width':
        case 'weight':
          fabric[mappedField] = parseNumber(value, true);
          break;
        case 'stockQuantity':
        case 'reservedQuantity':
        case 'availableQuantity':
        case 'minimumOrder':
        case 'incrementQuantity':
        case 'reorderPoint':
        case 'reorderQuantity':
          // Ensure numeric inventory fields are never undefined/null
          const parsedQty = parseNumber(value, false);
          fabric[mappedField] = parsedQty !== null ? parsedQty : 0;
          break;
        case 'leadTimeDays':
        case 'rollCount':
          fabric[mappedField] = parseNumber(value, true);
          break;
        case 'warehouseLocation':
        case 'binLocation':
        case 'manufacturerName':
        case 'supplierName':
        case 'fiberContent':
          fabric[mappedField] = value;
          break;
        case 'isCustomOrder':
          fabric[mappedField] = parseBoolean(value);
          break;
        case 'isActive':
        case 'isFeatured':
        case 'isStainResistant':
        case 'isFadeResistant':
        case 'isWaterResistant':
        case 'isPetFriendly':
        case 'isOutdoorSafe':
        case 'isFireRetardant':
        case 'isBleachCleanable':
        case 'isAntimicrobial':
          fabric[mappedField] = parseBoolean(value);
          break;
        case 'martindale':
        case 'wyzenbeek':
        case 'lightfastness':
        case 'pillingResistance':
          fabric[mappedField] = parseNumber(value, true);
          break;
        case 'durabilityRating':
          fabric[mappedField] = value.toUpperCase();
          break;
        case 'performanceMetrics':
        case 'usageSuitability':
        case 'additionalFeatures':
        case 'technicalDocuments':
        case 'certifications':
          // Try to parse as JSON if it's a string
          try {
            fabric[mappedField] = typeof value === 'string' ? JSON.parse(value) : value;
          } catch {
            // If JSON parsing fails, store as is
            fabric[mappedField] = value;
          }
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
  
  // Set defaults and ensure required fields
  fabric.type = fabric.type || 'Upholstery';
  fabric.status = fabric.status || 'Active';
  fabric.stockUnit = fabric.stockUnit || 'yards';
  fabric.lowStockThreshold = fabric.lowStockThreshold || 10;
  fabric.isActive = fabric.isActive !== undefined ? fabric.isActive : true;
  fabric.isFeatured = fabric.isFeatured !== undefined ? fabric.isFeatured : false;
  fabric.colors = fabric.colors || [];
  
  // Ensure required fields have values (even if 0)
  if (fabric.stockQuantity === undefined || fabric.stockQuantity === null) {
    fabric.stockQuantity = 0;
  }
  if (fabric.retailPrice === undefined || fabric.retailPrice === null) {
    fabric.retailPrice = 0;
  }
  
  // Debug logging to trace the issue
  if (fabric.retailPrice === undefined || fabric.retailPrice === null || 
      fabric.stockQuantity === undefined || fabric.stockQuantity === null) {
    console.log('Missing required fields in parsed row:', {
      sku: fabric.sku,
      retailPrice: fabric.retailPrice,
      stockQuantity: fabric.stockQuantity,
      headers: headers,
      row: row
    });
  }
  
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
        
        // Enhanced debugging
        console.log(`[Row ${i + 2}] Parsed data:`, {
          sku: fabricData?.sku,
          name: fabricData?.name,
          retailPrice: fabricData?.retailPrice,
          stockQuantity: fabricData?.stockQuantity,
          hasRetailPrice: fabricData?.retailPrice !== undefined && fabricData?.retailPrice !== null,
          retailPriceType: typeof fabricData?.retailPrice,
          stockQuantityType: typeof fabricData?.stockQuantity
        });
        
        if (!fabricData) {
          result.errors.push({
            row: i + 2,
            data: rows[i],
            error: 'Failed to parse row data'
          });
          result.failureCount++;
          continue;
        }

        // Check for required fields (allow 0 for numeric fields)
        if (!fabricData.sku || !fabricData.name || 
            fabricData.retailPrice === undefined || fabricData.retailPrice === null) {
          console.error(`[Row ${i + 2}] Validation failed:`, {
            hasSku: !!fabricData.sku,
            hasName: !!fabricData.name,
            retailPrice: fabricData.retailPrice,
            retailPriceUndefined: fabricData.retailPrice === undefined,
            retailPriceNull: fabricData.retailPrice === null
          });
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

        // Map parsed data to database schema format
        const dbFabricData = {
          sku: fabricData.sku,
          name: fabricData.name,
          description: fabricData.description,
          type: fabricData.type,
          manufacturer_name: fabricData.manufacturerName || fabricData.brand,
          supplier_name: fabricData.supplierName,
          collection: fabricData.collection,
          fiber_content: fabricData.fiberContent ? 
            (typeof fabricData.fiberContent === 'string' ? 
              [{ fiber: fabricData.fiberContent, percentage: 100 }] : 
              fabricData.fiberContent) : undefined,
          width: fabricData.width,
          weight: fabricData.weight,
          pattern: fabricData.pattern,
          primary_color: fabricData.primaryColor,
          secondary_colors: fabricData.secondaryColors,
          retail_price: fabricData.retailPrice,
          wholesale_price: fabricData.wholesalePrice,
          cost_price: fabricData.costPrice,
          procurement_cost: fabricData.procurementCost,
          currency: fabricData.currency || 'USD',
          price_unit: fabricData.priceUnit || 'per_yard',
          stock_quantity: fabricData.stockQuantity || 0,
          reserved_quantity: fabricData.reservedQuantity || 0,
          available_quantity: fabricData.availableQuantity || 0,
          minimum_order: fabricData.minimumOrder || 1,
          increment_quantity: fabricData.incrementQuantity || 1,
          reorder_point: fabricData.reorderPoint,
          reorder_quantity: fabricData.reorderQuantity,
          lead_time_days: fabricData.leadTimeDays,
          is_custom_order: fabricData.isCustomOrder || false,
          warehouse_location: fabricData.warehouseLocation,
          bin_location: fabricData.binLocation,
          roll_count: fabricData.rollCount,
          status: fabricData.status || 'Active',
          durability_rating: fabricData.durabilityRating,
          martindale: fabricData.martindale,
          wyzenbeek: fabricData.wyzenbeek,
          lightfastness: fabricData.lightfastness,
          pilling_resistance: fabricData.pillingResistance,
          is_stain_resistant: fabricData.isStainResistant || false,
          is_fade_resistant: fabricData.isFadeResistant || false,
          is_water_resistant: fabricData.isWaterResistant || false,
          is_pet_friendly: fabricData.isPetFriendly || false,
          is_outdoor_safe: fabricData.isOutdoorSafe || false,
          is_fire_retardant: fabricData.isFireRetardant || false,
          is_bleach_cleanable: fabricData.isBleachCleanable || false,
          is_antimicrobial: fabricData.isAntimicrobial || false,
          cleaning_code: fabricData.cleaningCode
        };

        // Create fabric using service (which will handle its own validation)
        await fabricService.create(dbFabricData, userId || 'admin');
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

    // Create sample CSV template with inventory fields (no image fields)
    const template = [
      [
        'sku', 'name', 'description', 'type', 'manufacturer_name', 'collection',
        'fiber_content', 'width', 'weight', 'pattern', 'primary_color', 'secondary_colors',
        'retail_price', 'currency', 'price_unit',
        'stock_quantity', 'reserved_quantity', 'available_quantity', 'minimum_order', 'increment_quantity',
        'reorder_point', 'reorder_quantity', 'lead_time_days', 'is_custom_order',
        'warehouse_location', 'bin_location', 'roll_count',
        'status', 'durability_rating', 'martindale', 'wyzenbeek', 'lightfastness', 'pilling_resistance',
        'stain_resistant', 'fade_resistant', 'water_resistant', 'pet_friendly', 'outdoor_safe',
        'fire_retardant', 'bleach_cleanable', 'antimicrobial', 'cleaning_code'
      ],
      [
        'FAB-001', 'Premium Velvet - Emerald Green', 'Luxurious velvet perfect for upholstery',
        'Upholstery', 'Luxury Textiles', 'Spring 2024', '100% Cotton Velvet',
        '54', '12.5', 'Solid', 'Emerald Green', 'Forest Green,Dark Green',
        '45.99', 'USD', 'per_yard',
        '250.5', '25', '225.5', '1', '0.5',
        '50', '100', '14', 'false',
        'A-12', 'B-34-5', '3',
        'Active', 'Heavy Duty', '30000', '50000', '6', '4',
        'true', 'true', 'false', 'true', 'false',
        'false', 'false', 'false', 'S'
      ],
      [
        'FAB-002', 'Linen Blend - Natural', 'Natural linen blend for drapery',
        'Drapery', 'Natural Fibers Co', 'Classics', '55% Linen, 45% Cotton',
        '60', '8.2', 'Plain Weave', 'Natural', 'Cream,Off-White',
        '32.50', 'USD', 'per_yard',
        '175', '10', '165', '2', '1',
        '30', '75', '21', 'false',
        'C-08', 'D-15-2', '2',
        'Sale', 'Medium Duty', '15000', '30000', '5', '3',
        'false', 'true', 'false', 'false', 'false',
        'false', 'false', 'false', 'W-S'
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
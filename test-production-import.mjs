import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testProductionImport() {
  console.log('🚀 Testing CSV import on production (Vercel)...\n');
  
  // Test 1: Simple endpoint with in-memory CSV
  console.log('📝 Test 1: Simple endpoint with in-memory CSV');
  try {
    const csvContent = `sku,name,description,type,manufacturer_name,collection,fiber_content,width,weight,pattern,primary_color,secondary_colors,retail_price,currency,price_unit,stock_quantity,reserved_quantity,available_quantity,minimum_order,increment_quantity,reorder_point,reorder_quantity,lead_time_days,is_custom_order,warehouse_location,bin_location,roll_count,status,durability_rating,martindale,wyzenbeek,lightfastness,pilling_resistance,stain_resistant,fade_resistant,water_resistant,pet_friendly,outdoor_safe,fire_retardant,bleach_cleanable,antimicrobial,cleaning_code
TEST-001,Test Fabric,Test Description,Upholstery,Test Manufacturer,Test Collection,100% Cotton,54,12.5,Solid,Blue,Red,99.99,USD,per_yard,100,10,90,1,0.5,20,50,7,FALSE,A-1,B-2,5,Active,Heavy Duty,25000,40000,5,4,TRUE,TRUE,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE,S`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', blob, 'test.csv');

    const response = await fetch('https://tara-pqnkse1d3-rajesh-vankayalapatis-projects.vercel.app/api/v1/fabrics/import-simple', {
      method: 'POST',
      body: formData,
      headers: {
        // No auth for this test - will get auth error but can see if endpoint exists
      }
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    console.log('---\n');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('---\n');
  }

  // Test 2: Original endpoint with actual CSV file
  console.log('📝 Test 2: Original endpoint with actual CSV file');
  try {
    const csvPath = path.join(__dirname, 'fabric_import_template.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('CSV file not found at:', csvPath);
      return;
    }

    const fileBuffer = fs.readFileSync(csvPath);
    const blob = new Blob([fileBuffer], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', blob, 'fabric_import_template.csv');

    const response = await fetch('https://tara-pqnkse1d3-rajesh-vankayalapatis-projects.vercel.app/api/v1/fabrics/import', {
      method: 'POST',
      body: formData,
      headers: {
        // No auth - will fail but we can see the response
      }
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    console.log('---\n');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('---\n');
  }

  // Test 3: Check if test page loads
  console.log('📝 Test 3: Check test page availability');
  try {
    const response = await fetch('https://tara-pqnkse1d3-rajesh-vankayalapatis-projects.vercel.app/admin/fabrics/test-import');
    console.log('Test page status:', response.status);
    if (response.status === 200) {
      console.log('✅ Test page is available');
    } else {
      console.log('❌ Test page returned status:', response.status);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProductionImport();
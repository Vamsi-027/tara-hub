# 📋 Manual Testing Guide - Fabric Library CRUD System

## 🚀 Quick Start Testing

### Prerequisites
- Server running at `http://localhost:3000` ✅
- Database has 5 sample fabrics ✅
- Admin account: `varaku@gmail.com` (Google OAuth)

---

## 1️⃣ Test API Endpoints (No Auth Required for GET)

### Test 1.1: List All Fabrics
```bash
# Basic list
curl http://localhost:3000/api/v1/fabrics

# With pagination
curl "http://localhost:3000/api/v1/fabrics?page=1&limit=2"

# With filtering
curl "http://localhost:3000/api/v1/fabrics?type=Upholstery&status=Active"

# With sorting
curl "http://localhost:3000/api/v1/fabrics?sortBy=price&sortDirection=desc"

# Search by name
curl "http://localhost:3000/api/v1/fabrics?search=velvet"
```

**Expected**: Returns JSON with fabrics array and pagination metadata

### Test 1.2: Get Single Fabric
```bash
# Get by ID (use actual ID from list)
curl http://localhost:3000/api/v1/fabrics/b9655d48-5d39-4191-b7f8-003d77fbf309

# Get by SKU
curl http://localhost:3000/api/v1/fabrics/sku/FAB-001

# Get by slug
curl http://localhost:3000/api/v1/fabrics/slug/premium-velvet-emerald-green
```

**Expected**: Returns single fabric object or 404 if not found

### Test 1.3: Special Endpoints
```bash
# Featured fabrics
curl "http://localhost:3000/api/v1/fabrics?special=featured"

# Low stock items
curl "http://localhost:3000/api/v1/fabrics?special=low-stock"

# Statistics
curl "http://localhost:3000/api/v1/fabrics?special=statistics"
```

---

## 2️⃣ Test Admin UI (Browser)

### Test 2.1: Access Admin Panel
1. Open browser to `http://localhost:3000/admin`
2. If not logged in, redirects to `/auth/signin`
3. Login with Google account: `varaku@gmail.com`
4. Should redirect back to admin panel

### Test 2.2: Fabric List Page
Navigate to: `http://localhost:3000/admin/fabrics`

**Test these features:**
- [ ] See list of 5 fabrics
- [ ] Search box - type "velvet" - should filter to 1 result
- [ ] Type filter - select "Upholstery" - filters results
- [ ] Status filter - select "Sale" - shows sale items
- [ ] Sort dropdown - try different options
- [ ] Pagination (if more than 20 items)
- [ ] Stats cards show correct counts

### Test 2.3: Create New Fabric
Click "Add New Fabric" button or navigate to: `http://localhost:3000/admin/fabrics/new`

**Test form fields:**
```
Required Fields:
- SKU: TEST-006
- Name: Test Cotton Fabric
- Type: Select "Upholstery"
- Retail Price: 59.99

Optional Fields:
- Description: Test description
- Brand: Test Brand
- Collection: Summer 2024
- Colors: Add "Blue", "Green"
- Stock Quantity: 100
- Width: 54
- Sale Price: 49.99
```

**Test validations:**
- [ ] Try submitting without SKU - should show error
- [ ] Try submitting without name - should show error
- [ ] Try negative price - should show error
- [ ] Submit valid form - should redirect to fabrics list

### Test 2.4: Edit Existing Fabric
1. From fabrics list, click edit icon on any fabric
2. Or navigate to: `http://localhost:3000/admin/fabrics/[id]/edit`

**Test edit operations:**
- [ ] Change name and save
- [ ] Update price
- [ ] Add/remove colors
- [ ] Toggle featured status
- [ ] Change stock quantity
- [ ] Save changes - should show success message

### Test 2.5: Delete Fabric
From the fabrics list:
- [ ] Click dropdown menu (three dots)
- [ ] Select "Delete"
- [ ] Confirm deletion
- [ ] Fabric should disappear from list

---

## 3️⃣ Test Authentication & Security

### Test 3.1: Protected Endpoints (Requires Auth)
```bash
# Try POST without auth - should return 401
curl -X POST http://localhost:3000/api/v1/fabrics \
  -H "Content-Type: application/json" \
  -d '{"sku":"TEST","name":"Test","type":"Upholstery","retailPrice":99}'

# Try PUT without auth - should return 401
curl -X PUT http://localhost:3000/api/v1/fabrics/[id] \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated"}'

# Try DELETE without auth - should return 401
curl -X DELETE http://localhost:3000/api/v1/fabrics/[id]
```

**Expected**: All should return 401 Unauthorized

### Test 3.2: Admin-Only Access
1. Logout from admin panel
2. Try accessing `http://localhost:3000/admin/fabrics`
3. Should redirect to login page
4. Login with non-admin account (if available)
5. Should show "unauthorized" message

---

## 4️⃣ Test Data Persistence

### Test 4.1: Verify Database Storage
```bash
# Check database directly
npx tsx scripts/test-db.ts
```

### Test 4.2: Persistence After Refresh
1. Create a new fabric in admin UI
2. Note the SKU (e.g., TEST-007)
3. Refresh the page (F5)
4. Verify fabric still exists
5. Restart server (`Ctrl+C` then `npm run dev`)
6. Check fabric still exists

---

## 5️⃣ Test Search & Filters

### Test 5.1: Search Functionality
In admin fabrics page:
- [ ] Search "velvet" - should find 1 result
- [ ] Search "FAB" - should find all (SKU match)
- [ ] Search "leather" - should find leather fabric
- [ ] Search "xyz123" - should show "No fabrics found"

### Test 5.2: Filter Combinations
Try these filter combinations:
- [ ] Type: "Upholstery" + Status: "Active"
- [ ] Status: "Out of Stock" - should show 1 result
- [ ] Type: "Leather" + Search: "cognac"

### Test 5.3: Sorting
Test each sort option:
- [ ] Newest First (default)
- [ ] Oldest First
- [ ] Name (A-Z)
- [ ] Name (Z-A)
- [ ] Price (Low to High)
- [ ] Price (High to Low)
- [ ] Stock (Low to High)

---

## 6️⃣ Test Edge Cases

### Test 6.1: Invalid Data
- [ ] Create fabric with duplicate SKU - should fail
- [ ] Enter very long name (300+ chars) - should truncate/error
- [ ] Enter special characters in SKU - should handle
- [ ] Leave optional fields empty - should work

### Test 6.2: Concurrent Operations
1. Open two browser tabs with fabrics list
2. Edit same fabric in both tabs
3. Save in first tab
4. Save in second tab - check version conflict handling

### Test 6.3: Large Data
- [ ] Create 50+ fabrics (use bulk API if needed)
- [ ] Test pagination works
- [ ] Test search performance
- [ ] Test filters with large dataset

---

## 7️⃣ Test Bulk Operations

### Test 7.1: Bulk Selection (UI)
In fabrics list:
- [ ] Select multiple items using checkboxes
- [ ] "Delete Selected" button appears
- [ ] Bulk delete works

### Test 7.2: Bulk API Operations
```bash
# Bulk create
curl -X POST http://localhost:3000/api/v1/fabrics/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "create",
    "items": [
      {"sku":"BULK-001","name":"Bulk 1","type":"Upholstery","retailPrice":50},
      {"sku":"BULK-002","name":"Bulk 2","type":"Drapery","retailPrice":60}
    ]
  }'
```

---

## 8️⃣ Performance Testing

### Test 8.1: Response Times
- [ ] List page loads < 2 seconds
- [ ] Search results < 500ms
- [ ] Create/Edit form submit < 1 second
- [ ] API responses < 100ms

### Test 8.2: Check Browser Console
Open DevTools (F12) and check:
- [ ] No JavaScript errors
- [ ] No 404s for resources
- [ ] No failed API calls
- [ ] No warnings about keys in lists

---

## ✅ Testing Checklist Summary

### Core CRUD Operations
- [ ] ✅ **Create**: New fabric via form
- [ ] ✅ **Read**: List and single fabric view
- [ ] ✅ **Update**: Edit existing fabric
- [ ] ✅ **Delete**: Remove fabric

### Features Working
- [ ] ✅ Authentication/Authorization
- [ ] ✅ Search functionality
- [ ] ✅ Filter by type/status
- [ ] ✅ Sorting options
- [ ] ✅ Pagination
- [ ] ✅ Data persistence
- [ ] ✅ Form validation
- [ ] ✅ Error handling

### Known Issues to Test
- [ ] Image upload (R2 not integrated yet)
- [ ] Export functionality
- [ ] Import CSV
- [ ] Email notifications

---

## 🐛 How to Report Issues

If you find any issues during testing:

1. **Note the error**:
   - What were you doing?
   - What did you expect?
   - What actually happened?

2. **Check console**:
   - Browser console (F12)
   - Server terminal for errors

3. **Document steps to reproduce**:
   - Exact sequence of actions
   - Data entered
   - Browser/OS used

---

## 🎯 Quick Test Scenarios

### Scenario 1: Happy Path
1. Login as admin
2. View fabrics list
3. Create new fabric
4. Edit the fabric
5. Delete the fabric
✅ All operations should work smoothly

### Scenario 2: Search & Filter
1. Search for "velvet"
2. Filter by "Upholstery"
3. Sort by price
4. Clear filters
✅ Results update correctly

### Scenario 3: Validation
1. Try to create fabric without SKU
2. Try duplicate SKU
3. Try negative price
4. Fix errors and submit
✅ Proper error messages shown

---

## 📝 Test Results Log

| Test | Status | Notes |
|------|--------|-------|
| API GET /fabrics | ✅ | Returns 5 fabrics |
| Admin Login | ⬜ | Test pending |
| Create Fabric | ⬜ | Test pending |
| Edit Fabric | ⬜ | Test pending |
| Delete Fabric | ⬜ | Test pending |
| Search | ⬜ | Test pending |
| Filters | ⬜ | Test pending |
| Authentication | ⬜ | Test pending |

---

**Ready to test!** Start with the API endpoints, then move to the UI testing. The system should be fully functional for CRUD operations.
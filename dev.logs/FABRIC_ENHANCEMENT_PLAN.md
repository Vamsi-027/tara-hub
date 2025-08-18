# Fabric Library Enhancement Implementation Plan

## Executive Summary
This document outlines a comprehensive plan to transform the current Fabric Library admin module from a prototype state to a production-ready enterprise system using modern architecture patterns and best practices.

## Current State Analysis

### Critical Issues
1. **No Data Persistence**: Admin UI uses React state only - all changes are lost on refresh
2. **Disconnected Architecture**: API routes exist but aren't connected to the UI
3. **Wrong Database Usage**: Using Redis (Vercel KV) for relational data instead of PostgreSQL
4. **No Image Management**: R2 storage configured but not integrated
5. **Security Vulnerabilities**: No input validation, CSRF protection, or rate limiting

### Technical Debt
- Client-side only CRUD operations
- No pagination or performance optimization
- Missing bulk operations and import/export
- No audit logging or version history
- Hardcoded placeholder images

## Target Architecture

### Technology Stack
```
┌─────────────────────────────────────────────┐
│            Next.js Admin UI                 │
│         (React + TypeScript + TailwindCSS)  │
└─────────────────┬───────────────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────────────┐
│          Next.js API Routes                 │
│         (Input Validation Layer)            │
└─────────────────┬───────────────────────────┘
                  │ HTTP/2
┌─────────────────▼───────────────────────────┐
│          NestJS Middleware                  │
│    (Business Logic + Authorization)         │
├──────────────┬──────────────┬───────────────┤
│   Drizzle    │   S3 Client  │   Redis       │
│     ORM      │              │   Client      │
└──────┬───────┴──────┬───────┴───────┬───────┘
       │              │               │
┌──────▼────┐  ┌──────▼────┐  ┌──────▼────┐
│   Neon    │  │Cloudflare │  │  Vercel   │
│PostgreSQL │  │    R2     │  │    KV     │
│(Primary)  │  │ (Images)  │  │  (Cache)  │
└───────────┘  └───────────┘  └───────────┘
```

### Data Flow Architecture
```
User Action → UI Component → API Route → Validation
    ↓
NestJS Service → Business Logic → Data Layer
    ↓
PostgreSQL (Write) → KV Cache (Invalidate) → R2 (Upload)
    ↓
Response → UI Update → Cache Update
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Fix critical data persistence issues and connect existing components

#### Database Setup
1. Create PostgreSQL schema for fabrics
2. Implement Drizzle ORM models
3. Set up database migrations
4. Create indexes for performance

#### API Integration
1. Connect admin UI to existing API routes
2. Implement proper error handling
3. Add loading states and optimistic updates
4. Fix authentication checks

### Phase 2: Core CRUD Enhancement (Week 2)
**Goal**: Implement complete CRUD operations with proper architecture

#### Backend Development
1. Create NestJS middleware layer
2. Implement DTOs and validation
3. Add transaction support
4. Create service layer abstractions

#### Frontend Enhancement
1. Refactor fabric modal with form validation
2. Add real-time search and filtering
3. Implement pagination and virtualization
4. Add bulk selection and operations

### Phase 3: Image Management (Week 3)
**Goal**: Full integration with Cloudflare R2 for image storage

#### R2 Integration
1. Implement image upload in fabric modal
2. Add drag-and-drop functionality
3. Create image optimization pipeline
4. Generate responsive image URLs

#### UI Components
1. Build image gallery component
2. Add image preview and zoom
3. Implement image reordering
4. Create fallback mechanisms

### Phase 4: Advanced Features (Week 4)
**Goal**: Enterprise features for production readiness

#### Business Features
1. Inventory tracking system
2. Supplier management
3. Price history tracking
4. Automated reorder points

#### Technical Features
1. Advanced caching strategies
2. Real-time synchronization
3. Export/Import functionality
4. Audit logging system

## Detailed Technical Implementation

### 1. PostgreSQL Schema Design

```sql
-- Core fabric table
CREATE TABLE fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Classification
  type VARCHAR(50) NOT NULL CHECK (type IN ('Upholstery', 'Drapery', 'Both')),
  category VARCHAR(100) NOT NULL,
  pattern VARCHAR(100),
  color VARCHAR(100),
  color_hex VARCHAR(7),
  
  -- Supplier Info
  manufacturer_id UUID REFERENCES manufacturers(id),
  collection VARCHAR(255),
  
  -- Pricing
  price_per_yard DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  cost DECIMAL(10,2),
  
  -- Specifications
  width_inches INTEGER NOT NULL,
  weight_oz_per_yard DECIMAL(8,2),
  content JSONB, -- {cotton: 60, polyester: 40}
  
  -- Stock Management
  stock_yards DECIMAL(10,2) DEFAULT 0,
  min_order_yards DECIMAL(10,2) DEFAULT 1,
  reorder_point DECIMAL(10,2),
  lead_time_days INTEGER,
  
  -- Durability Ratings
  martindale_rubs INTEGER,
  wyzenbeek_rubs INTEGER,
  
  -- Features (as boolean flags)
  is_stain_resistant BOOLEAN DEFAULT FALSE,
  is_fade_resistant BOOLEAN DEFAULT FALSE,
  is_water_resistant BOOLEAN DEFAULT FALSE,
  is_pet_friendly BOOLEAN DEFAULT FALSE,
  is_outdoor_safe BOOLEAN DEFAULT FALSE,
  is_fire_retardant BOOLEAN DEFAULT FALSE,
  
  -- Care
  care_instructions TEXT[],
  cleaning_code VARCHAR(10),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_custom_order BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  tags TEXT[],
  meta_title VARCHAR(255),
  meta_description TEXT,
  search_vector tsvector,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Images table (linked to R2 storage)
CREATE TABLE fabric_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_id UUID REFERENCES fabrics(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- thumbnail, main, detail, room, swatch
  url TEXT NOT NULL,
  r2_key VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  width INTEGER,
  height INTEGER,
  size_bytes BIGINT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory transactions
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_id UUID REFERENCES fabrics(id),
  type VARCHAR(50) NOT NULL, -- purchase, sale, adjustment, return
  quantity_yards DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_type VARCHAR(50), -- order, adjustment, return
  reference_id VARCHAR(255),
  notes TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE fabric_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_id UUID REFERENCES fabrics(id),
  action VARCHAR(50) NOT NULL, -- create, update, delete
  changes JSONB,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_fabrics_sku ON fabrics(sku);
CREATE INDEX idx_fabrics_slug ON fabrics(slug);
CREATE INDEX idx_fabrics_active ON fabrics(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_fabrics_category ON fabrics(category);
CREATE INDEX idx_fabrics_color ON fabrics(color);
CREATE INDEX idx_fabrics_search ON fabrics USING GIN(search_vector);
CREATE INDEX idx_fabric_images_fabric ON fabric_images(fabric_id);
CREATE INDEX idx_inventory_fabric ON inventory_transactions(fabric_id);
```

### 2. NestJS Middleware Architecture

```typescript
// src/middleware/fabrics/fabric.module.ts
import { Module } from '@nestjs/common';
import { FabricController } from './fabric.controller';
import { FabricService } from './fabric.service';
import { ImageService } from './services/image.service';
import { CacheService } from './services/cache.service';
import { AuditService } from './services/audit.service';

@Module({
  imports: [
    DrizzleModule,
    R2Module,
    RedisModule,
    AuthModule,
  ],
  controllers: [FabricController],
  providers: [
    FabricService,
    ImageService,
    CacheService,
    AuditService,
  ],
  exports: [FabricService],
})
export class FabricModule {}

// src/middleware/fabrics/fabric.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FabricService } from './fabric.service';
import { CreateFabricDto, UpdateFabricDto, FabricQueryDto } from './dto';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { RolesGuard } from '@/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { CacheInterceptor } from '@/interceptors/cache.interceptor';
import { AuditInterceptor } from '@/interceptors/audit.interceptor';

@ApiTags('fabrics')
@Controller('api/v1/fabrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class FabricController {
  constructor(private readonly fabricService: FabricService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get all fabrics with filtering and pagination' })
  async findAll(@Query() query: FabricQueryDto) {
    return this.fabricService.findAll(query);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get fabric by ID' })
  async findOne(@Param('id') id: string) {
    return this.fabricService.findOne(id);
  }

  @Post()
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Create new fabric' })
  async create(@Body() createFabricDto: CreateFabricDto) {
    return this.fabricService.create(createFabricDto);
  }

  @Put(':id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Update fabric' })
  async update(
    @Param('id') id: string,
    @Body() updateFabricDto: UpdateFabricDto
  ) {
    return this.fabricService.update(id, updateFabricDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete fabric' })
  async remove(@Param('id') id: string) {
    return this.fabricService.remove(id);
  }

  @Post(':id/images')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Upload fabric images' })
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    return this.fabricService.uploadImages(id, files);
  }
}

// src/middleware/fabrics/fabric.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DrizzleService } from '@/database/drizzle.service';
import { ImageService } from './services/image.service';
import { CacheService } from './services/cache.service';
import { AuditService } from './services/audit.service';
import { fabrics, fabricImages } from '@/database/schema';
import { eq, and, or, ilike, sql } from 'drizzle-orm';

@Injectable()
export class FabricService {
  constructor(
    private db: DrizzleService,
    private imageService: ImageService,
    private cacheService: CacheService,
    private auditService: AuditService,
  ) {}

  async findAll(query: FabricQueryDto) {
    const cacheKey = `fabrics:${JSON.stringify(query)}`;
    
    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    // Build query
    const { page = 1, limit = 20, search, category, color, inStock, sortBy = 'name', sortOrder = 'asc' } = query;
    
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(fabrics.name, `%${search}%`),
          ilike(fabrics.description, `%${search}%`),
          ilike(fabrics.sku, `%${search}%`)
        )
      );
    }
    if (category) conditions.push(eq(fabrics.category, category));
    if (color) conditions.push(eq(fabrics.color, color));
    if (inStock !== undefined) {
      conditions.push(
        inStock ? sql`${fabrics.stockYards} > 0` : sql`${fabrics.stockYards} = 0`
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Execute query with pagination
    const [items, total] = await Promise.all([
      this.db.db
        .select()
        .from(fabrics)
        .where(where)
        .orderBy(
          sortOrder === 'desc' 
            ? sql`${fabrics[sortBy]} DESC` 
            : sql`${fabrics[sortBy]} ASC`
        )
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.db
        .select({ count: sql`count(*)` })
        .from(fabrics)
        .where(where)
    ]);

    // Load images for each fabric
    const fabricsWithImages = await Promise.all(
      items.map(async (fabric) => {
        const images = await this.db.db
          .select()
          .from(fabricImages)
          .where(eq(fabricImages.fabricId, fabric.id))
          .orderBy(fabricImages.displayOrder);
        
        return { ...fabric, images };
      })
    );

    const result = {
      items: fabricsWithImages,
      total: Number(total[0].count),
      page,
      limit,
      totalPages: Math.ceil(Number(total[0].count) / limit),
    };

    // Cache result
    await this.cacheService.set(cacheKey, result, 300); // 5 minutes
    
    return result;
  }

  async create(createFabricDto: CreateFabricDto) {
    // Validate unique SKU
    const existing = await this.db.db
      .select()
      .from(fabrics)
      .where(eq(fabrics.sku, createFabricDto.sku))
      .limit(1);
    
    if (existing.length > 0) {
      throw new BadRequestException('SKU already exists');
    }

    // Generate slug
    const slug = this.generateSlug(createFabricDto.name);

    // Start transaction
    const result = await this.db.db.transaction(async (tx) => {
      // Create fabric
      const [fabric] = await tx
        .insert(fabrics)
        .values({
          ...createFabricDto,
          slug,
          searchVector: sql`to_tsvector('english', ${createFabricDto.name} || ' ' || ${createFabricDto.description})`,
        })
        .returning();

      // Log audit
      await this.auditService.log({
        fabricId: fabric.id,
        action: 'create',
        changes: createFabricDto,
      });

      // Invalidate cache
      await this.cacheService.invalidatePattern('fabrics:*');

      return fabric;
    });

    return result;
  }

  async uploadImages(fabricId: string, files: Express.Multer.File[]) {
    // Verify fabric exists
    const fabric = await this.findOne(fabricId);
    if (!fabric) {
      throw new NotFoundException('Fabric not found');
    }

    const uploadedImages = [];

    for (const file of files) {
      // Upload to R2
      const { url, key } = await this.imageService.upload(file, `fabrics/${fabricId}`);
      
      // Determine image type based on filename or order
      const imageType = this.determineImageType(file.originalname, uploadedImages.length);
      
      // Save to database
      const [image] = await this.db.db
        .insert(fabricImages)
        .values({
          fabricId,
          type: imageType,
          url,
          r2Key: key,
          altText: `${fabric.name} - ${imageType}`,
          width: 0, // Will be updated after processing
          height: 0,
          sizeBytes: file.size,
          displayOrder: uploadedImages.length,
        })
        .returning();
      
      uploadedImages.push(image);
    }

    // Process images asynchronously (resize, optimize)
    this.imageService.processImagesAsync(uploadedImages);

    // Invalidate cache
    await this.cacheService.invalidate(`fabric:${fabricId}`);

    return uploadedImages;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private determineImageType(filename: string, index: number): string {
    if (filename.includes('thumb')) return 'thumbnail';
    if (filename.includes('main')) return 'main';
    if (filename.includes('detail')) return 'detail';
    if (filename.includes('room')) return 'room';
    if (filename.includes('swatch')) return 'swatch';
    
    // Default based on order
    return index === 0 ? 'main' : 'detail';
  }
}
```

### 3. Enhanced React Components

```typescript
// components/admin/fabrics/FabricDataTable.tsx
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { FabricModal } from './FabricModal';
import { ImageUploadModal } from './ImageUploadModal';
import { BulkOperationsBar } from './BulkOperationsBar';
import { useDebounce } from '@/hooks/use-debounce';
import { fabricsApi } from '@/lib/api/fabrics';
import { toast } from 'sonner';

export function FabricDataTable() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    color: '',
    inStock: undefined,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const debouncedSearch = useDebounce(search, 300);

  // Fetch fabrics with react-query
  const { data, isLoading, error } = useQuery({
    queryKey: ['fabrics', { 
      page, 
      limit: pageSize, 
      search: debouncedSearch, 
      ...filters 
    }],
    queryFn: () => fabricsApi.getAll({ 
      page, 
      limit: pageSize, 
      search: debouncedSearch, 
      ...filters 
    }),
    keepPreviousData: true,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: fabricsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['fabrics']);
      toast.success('Fabric deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete fabric');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: fabricsApi.bulkDelete,
    onSuccess: () => {
      queryClient.invalidateQueries(['fabrics']);
      setSelectedIds([]);
      toast.success('Fabrics deleted successfully');
    },
  });

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      accessorKey: 'images',
      header: 'Image',
      cell: ({ row }) => {
        const mainImage = row.original.images?.find(img => img.type === 'main');
        return (
          <div className="relative h-16 w-16">
            <Image
              src={mainImage?.url || '/fabric-placeholder.jpg'}
              alt={row.original.name}
              fill
              className="object-cover rounded"
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.sku}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.category} • {row.original.color}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'pricePerYard',
      header: 'Price',
      cell: ({ row }) => (
        <div className="text-right">
          ${row.original.pricePerYard.toFixed(2)}
          {row.original.salePrice && (
            <div className="text-sm text-green-600">
              Sale: ${row.original.salePrice.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'stockYards',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.original.stockYards;
        const reorderPoint = row.original.reorderPoint;
        
        return (
          <div className="text-right">
            <Badge 
              variant={
                stock === 0 ? 'destructive' : 
                stock <= reorderPoint ? 'warning' : 
                'default'
              }
            >
              {stock} yards
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUploadImages(row.original)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(row.original)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => deleteMutation.mutate(row.original.id)}
              className="text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [deleteMutation]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fabrics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <FabricFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fabric
        </Button>
      </div>

      {/* Bulk Operations */}
      {selectedIds.length > 0 && (
        <BulkOperationsBar
          selectedCount={selectedIds.length}
          onDelete={() => bulkDeleteMutation.mutate(selectedIds)}
          onExport={() => handleBulkExport(selectedIds)}
          onUpdatePrices={() => handleBulkPriceUpdate(selectedIds)}
        />
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        pagination={{
          pageIndex: page - 1,
          pageSize,
          pageCount: data?.totalPages || 0,
          onPageChange: (pageIndex) => setPage(pageIndex + 1),
          onPageSizeChange: setPageSize,
        }}
        onRowSelectionChange={(rows) => {
          setSelectedIds(rows.map(r => r.original.id));
        }}
      />
    </div>
  );
}
```

### 4. R2 Image Upload Implementation

```typescript
// components/admin/fabrics/ImageUploadZone.tsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface ImageUploadZoneProps {
  fabricId?: string;
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export function ImageUploadZone({ 
  fabricId, 
  onUpload, 
  maxFiles = 10,
  maxSize = 10 
}: ImageUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Generate previews
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);

    // Upload files
    setUploading(true);
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onUpload(acceptedFiles);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success(`${acceptedFiles.length} images uploaded successfully`);
      
      // Clean up previews after successful upload
      setTimeout(() => {
        newPreviews.forEach(URL.revokeObjectURL);
        setPreviews([]);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      toast.error('Failed to upload images');
      console.error('Upload error:', error);
      
      // Clean up on error
      newPreviews.forEach(URL.revokeObjectURL);
      setPreviews(prev => prev.filter(p => !newPreviews.includes(p)));
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, rejectedFiles } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif']
    },
    maxFiles,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    disabled: uploading,
  });

  // Show errors for rejected files
  useEffect(() => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map(e => {
          if (e.code === 'file-too-large') return `${file.name} is larger than ${maxSize}MB`;
          if (e.code === 'file-invalid-type') return `${file.name} is not a valid image`;
          if (e.code === 'too-many-files') return `Maximum ${maxFiles} files allowed`;
          return e.message;
        }).join(', ');
        return errorMessages;
      });
      
      errors.forEach(error => toast.error(error));
    }
  }, [rejectedFiles, maxFiles, maxSize]);

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading images...</p>
            <Progress value={uploadProgress} className="max-w-xs mx-auto" />
          </div>
        ) : isDragActive ? (
          <div className="space-y-2">
            <Upload className="mx-auto h-12 w-12 text-primary" />
            <p className="text-sm font-medium">Drop images here</p>
          </div>
        ) : (
          <div className="space-y-2">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag & drop images here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} files, up to {maxSize}MB each
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: JPEG, PNG, WebP, AVIF
            </p>
          </div>
        )}
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={preview} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                onClick={() => {
                  URL.revokeObjectURL(preview);
                  setPreviews(prev => prev.filter(p => p !== preview));
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// lib/api/fabrics.ts - R2 Upload Integration
export const fabricsApi = {
  async uploadImages(fabricId: string, files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await fetch(`/api/fabrics/${fabricId}/images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload images');
    }

    return response.json();
  },

  async uploadWithProgress(
    fabricId: string, 
    files: File[], 
    onProgress: (progress: number) => void
  ) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('images', file);
      });

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `/api/fabrics/${fabricId}/images`);
      xhr.send(formData);
    });
  },
};
```

## Performance Optimizations

### 1. Database Optimizations
- Implement database indexing strategy
- Use materialized views for complex queries
- Implement connection pooling
- Add query result caching

### 2. Caching Strategy
```typescript
// Cache Layers:
// L1: Browser Cache (React Query) - 5 minutes
// L2: Edge Cache (Vercel) - 10 minutes  
// L3: Redis Cache (KV) - 30 minutes
// L4: Database Query Cache - 1 hour

const cacheStrategy = {
  fabrics: {
    list: 300, // 5 minutes
    detail: 600, // 10 minutes
    filters: 3600, // 1 hour
  },
  images: {
    cdn: 86400, // 24 hours
    thumbnails: 604800, // 7 days
  },
};
```

### 3. Image Optimization
- Automatic resizing on upload
- WebP/AVIF generation
- Lazy loading implementation
- CDN distribution via R2

## Security Measures

### 1. Input Validation
```typescript
// DTO Validation with class-validator
export class CreateFabricDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @Matches(/^[A-Z0-9-]+$/, { message: 'SKU must be alphanumeric with hyphens' })
  sku: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => sanitizeHtml(value))
  name: string;

  @IsNumber()
  @Min(0)
  @Max(10000)
  pricePerYard: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => sanitizeHtml(value))
  description?: string;
}
```

### 2. Rate Limiting
```typescript
// Rate limiting configuration
const rateLimits = {
  api: {
    read: '100/minute',
    write: '20/minute',
    upload: '10/minute',
  },
  auth: {
    login: '5/minute',
    register: '3/hour',
  },
};
```

### 3. Audit Logging
- Track all CRUD operations
- Store user IP and user agent
- Implement change history
- Regular security audits

## Monitoring & Analytics

### 1. Performance Monitoring
- API response times
- Database query performance
- Image upload/processing times
- Cache hit rates

### 2. Business Metrics
- Most viewed fabrics
- Conversion rates
- Inventory turnover
- Search patterns

### 3. Error Tracking
- Sentry integration
- Custom error boundaries
- Automated alerts
- Error recovery mechanisms

## Deployment Strategy

### 1. Environment Setup
```bash
# Development
npm run dev:db:migrate
npm run dev:seed
npm run dev

# Staging
npm run staging:deploy
npm run staging:test

# Production
npm run build
npm run db:migrate
npm run start
```

### 2. CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run type-check
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run db:migrate
      - uses: vercel/action@v3
```

## Success Metrics

### Technical Metrics
- Page load time < 2 seconds
- API response time < 200ms
- 99.9% uptime
- Zero critical security vulnerabilities

### Business Metrics
- 50% reduction in data entry time
- 90% accuracy in inventory tracking
- 30% increase in fabric discovery
- 25% reduction in order errors

## Risk Mitigation

### 1. Data Loss Prevention
- Automated backups every 6 hours
- Point-in-time recovery
- Soft deletes with 30-day retention
- Export functionality

### 2. Scalability Planning
- Horizontal scaling ready
- Database sharding strategy
- CDN for global distribution
- Microservices architecture ready

### 3. Vendor Lock-in Prevention
- Standard SQL queries
- S3-compatible storage
- Portable Docker containers
- Open-source alternatives identified

## Timeline & Milestones

### Week 1: Foundation
- ✅ Database schema implementation
- ✅ Basic CRUD operations
- ✅ API integration
- ✅ Error handling

### Week 2: Core Features
- ✅ NestJS middleware
- ✅ Advanced filtering
- ✅ Pagination
- ✅ Bulk operations

### Week 3: Image Management
- ✅ R2 integration
- ✅ Upload interface
- ✅ Image optimization
- ✅ CDN setup

### Week 4: Polish & Deploy
- ✅ Performance optimization
- ✅ Security hardening
- ✅ Documentation
- ✅ Production deployment

## Conclusion

This implementation plan transforms the Fabric Library from a prototype to a production-ready enterprise system. The architecture is scalable, secure, and maintainable, with clear separation of concerns and modern best practices.

Key benefits:
1. **Data Integrity**: PostgreSQL ensures ACID compliance
2. **Performance**: Multi-layer caching and CDN distribution
3. **Scalability**: Microservices-ready architecture
4. **Security**: Input validation, rate limiting, and audit logging
5. **User Experience**: Fast, responsive, and intuitive interface

The system is designed to handle thousands of fabrics with millions of page views while maintaining sub-second response times and 99.9% availability.
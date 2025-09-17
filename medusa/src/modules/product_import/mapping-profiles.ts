/*
  Mapping Profiles CRUD Service

  Stores and manages column mapping profiles in the database,
  allowing users to save and reuse mappings for consistent imports.
*/

import { MedusaService } from "@medusajs/framework/utils";
import { Injectable } from "@medusajs/framework/utils";

export interface MappingProfile {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  mapping: Record<string, string>; // Source column -> target field
  settings: {
    skip_unmapped: boolean;
    auto_detect: boolean;
    case_sensitive: boolean;
    trim_values: boolean;
  };
  is_default: boolean;
  is_shared: boolean; // Available to all users
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface CreateMappingProfileInput {
  name: string;
  description?: string;
  mapping: Record<string, string>;
  settings?: Partial<MappingProfile['settings']>;
  is_default?: boolean;
  is_shared?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateMappingProfileInput {
  name?: string;
  description?: string;
  mapping?: Record<string, string>;
  settings?: Partial<MappingProfile['settings']>;
  is_default?: boolean;
  is_shared?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class MappingProfileService extends MedusaService {
  protected container_: any;

  constructor(container: any) {
    super(container);
    this.container_ = container;
  }

  async list(
    userId: string,
    filters: { is_shared?: boolean; search?: string } = {}
  ): Promise<MappingProfile[]> {
    const manager = this.container_.resolve("manager");
    const profileRepo = manager.getRepository("MappingProfile");

    const query = profileRepo.createQueryBuilder("profile")
      .where("(profile.user_id = :userId OR profile.is_shared = true)", { userId });

    if (filters.is_shared !== undefined) {
      query.andWhere("profile.is_shared = :isShared", { isShared: filters.is_shared });
    }

    if (filters.search) {
      query.andWhere(
        "(profile.name ILIKE :search OR profile.description ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    query.orderBy("profile.is_default", "DESC")
      .addOrderBy("profile.updated_at", "DESC");

    return query.getMany();
  }

  async retrieve(
    profileId: string,
    userId: string
  ): Promise<MappingProfile | null> {
    const manager = this.container_.resolve("manager");
    const profileRepo = manager.getRepository("MappingProfile");

    const profile = await profileRepo.findOne({
      where: [
        { id: profileId, user_id: userId },
        { id: profileId, is_shared: true }
      ]
    });

    return profile || null;
  }

  async create(
    userId: string,
    data: CreateMappingProfileInput
  ): Promise<MappingProfile> {
    const manager = this.container_.resolve("manager");
    const profileRepo = manager.getRepository("MappingProfile");

    // If setting as default, unset other defaults for this user
    if (data.is_default) {
      await profileRepo.update(
        { user_id: userId, is_default: true },
        { is_default: false }
      );
    }

    const profile = profileRepo.create({
      ...data,
      user_id: userId,
      settings: {
        skip_unmapped: data.settings?.skip_unmapped ?? false,
        auto_detect: data.settings?.auto_detect ?? true,
        case_sensitive: data.settings?.case_sensitive ?? false,
        trim_values: data.settings?.trim_values ?? true,
        ...data.settings
      }
    });

    await profileRepo.save(profile);
    return profile;
  }

  async update(
    profileId: string,
    userId: string,
    data: UpdateMappingProfileInput
  ): Promise<MappingProfile> {
    const manager = this.container_.resolve("manager");
    const profileRepo = manager.getRepository("MappingProfile");

    const profile = await this.retrieve(profileId, userId);
    if (!profile) {
      throw new Error(`Mapping profile ${profileId} not found`);
    }

    // Only owner can update
    if (profile.user_id !== userId) {
      throw new Error("You can only update your own mapping profiles");
    }

    // If setting as default, unset other defaults
    if (data.is_default && !profile.is_default) {
      await profileRepo.update(
        { user_id: userId, is_default: true },
        { is_default: false }
      );
    }

    const updated = await profileRepo.save({
      ...profile,
      ...data,
      settings: data.settings ? {
        ...profile.settings,
        ...data.settings
      } : profile.settings,
      updated_at: new Date()
    });

    return updated;
  }

  async delete(
    profileId: string,
    userId: string
  ): Promise<void> {
    const manager = this.container_.resolve("manager");
    const profileRepo = manager.getRepository("MappingProfile");

    const profile = await this.retrieve(profileId, userId);
    if (!profile) {
      throw new Error(`Mapping profile ${profileId} not found`);
    }

    // Only owner can delete
    if (profile.user_id !== userId) {
      throw new Error("You can only delete your own mapping profiles");
    }

    // Check if profile is in use by any active jobs
    const inUseCheck = await this.isProfileInUse(profileId);
    if (inUseCheck.inUse) {
      throw new Error(
        `Cannot delete profile: currently in use by ${inUseCheck.activeJobs} active import job(s)`
      );
    }

    await profileRepo.remove(profile);
  }

  private async isProfileInUse(profileId: string): Promise<{ inUse: boolean; activeJobs: number }> {
    try {
      const batchJobService = this.container_.resolve("batchJobService");
      const jobs = await batchJobService.listAndCount(
        {
          type: "product-import",
          status: ["created", "pre_processed", "confirmed", "processing"],
          context: { options: { mapping_profile_id: profileId } },
        },
        { take: 1 }
      );
      return {
        inUse: jobs[1] > 0,
        activeJobs: jobs[1]
      };
    } catch (error) {
      console.error("Failed to check profile usage:", error);
      return { inUse: false, activeJobs: 0 };
    }
  }

  async getDefault(userId: string): Promise<MappingProfile | null> {
    const manager = this.container_.resolve("manager");
    const profileRepo = manager.getRepository("MappingProfile");

    const profile = await profileRepo.findOne({
      where: { user_id: userId, is_default: true }
    });

    return profile || null;
  }

  async duplicateProfile(
    profileId: string,
    userId: string,
    newName: string
  ): Promise<MappingProfile> {
    const profile = await this.retrieve(profileId, userId);
    if (!profile) {
      throw new Error(`Mapping profile ${profileId} not found`);
    }

    return this.create(userId, {
      name: newName,
      description: `Duplicated from ${profile.name}`,
      mapping: { ...profile.mapping },
      settings: { ...profile.settings },
      is_default: false,
      is_shared: false,
      metadata: {
        ...profile.metadata,
        duplicated_from: profileId,
        duplicated_at: new Date().toISOString(),
        version: 1
      }
    });
  }

  async exportProfile(
    profileId: string,
    userId: string
  ): Promise<string> {
    const profile = await this.retrieve(profileId, userId);
    if (!profile) {
      throw new Error(`Mapping profile ${profileId} not found`);
    }

    const exportData = {
      version: "1.0",
      exported_at: new Date().toISOString(),
      profile: {
        name: profile.name,
        description: profile.description,
        mapping: profile.mapping,
        settings: profile.settings,
        metadata: profile.metadata
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importProfile(
    userId: string,
    exportData: string,
    newName?: string
  ): Promise<MappingProfile> {
    try {
      const data = JSON.parse(exportData);

      if (!data.version || !data.profile) {
        throw new Error("Invalid profile export format");
      }

      return this.create(userId, {
        name: newName || `${data.profile.name} (Imported)`,
        description: data.profile.description || `Imported on ${new Date().toISOString()}`,
        mapping: data.profile.mapping,
        settings: data.profile.settings,
        metadata: {
          ...data.profile.metadata,
          imported_at: new Date().toISOString(),
          import_version: data.version
        }
      });
    } catch (error) {
      throw new Error(`Failed to import profile: ${error.message}`);
    }
  }

  // Built-in profiles for common formats
  async getBuiltInProfiles(): Promise<Partial<MappingProfile>[]> {
    return [
      {
        id: 'builtin-shopify',
        name: 'Shopify Export Format',
        description: 'Standard Shopify product export mapping',
        mapping: {
          'Handle': 'handle',
          'Title': 'title',
          'Vendor': 'vendor',
          'Type': 'type',
          'Tags': 'tags',
          'Published': 'status',
          'Option1 Name': 'option_1_title',
          'Option1 Value': 'option_1_value',
          'Option2 Name': 'option_2_title',
          'Option2 Value': 'option_2_value',
          'Option3 Name': 'option_3_title',
          'Option3 Value': 'option_3_value',
          'Variant SKU': 'sku',
          'Variant Grams': 'weight',
          'Variant Inventory Qty': 'inventory_quantity',
          'Variant Price': 'retail_price',
          'Variant Compare At Price': 'compare_at_price',
          'Image Src': 'image_urls',
          'SEO Title': 'seo_title',
          'SEO Description': 'seo_description'
        },
        settings: {
          skip_unmapped: false,
          auto_detect: false,
          case_sensitive: false,
          trim_values: true
        },
        is_shared: true
      },
      {
        id: 'builtin-woocommerce',
        name: 'WooCommerce Export Format',
        description: 'Standard WooCommerce CSV export mapping',
        mapping: {
          'SKU': 'sku',
          'Name': 'title',
          'Published': 'status',
          'Short description': 'subtitle',
          'Description': 'description',
          'Categories': 'category_handles',
          'Tags': 'tags',
          'Regular price': 'retail_price',
          'Sale price': 'sale_price',
          'Weight (kg)': 'weight',
          'Length (cm)': 'length',
          'Width (cm)': 'width',
          'Height (cm)': 'height',
          'Stock': 'inventory_quantity',
          'Backorders allowed?': 'allow_backorder',
          'Images': 'image_urls'
        },
        settings: {
          skip_unmapped: false,
          auto_detect: false,
          case_sensitive: false,
          trim_values: true
        },
        is_shared: true
      },
      {
        id: 'builtin-fabric',
        name: 'Fabric Product Format',
        description: 'Optimized for fabric and textile products',
        mapping: {
          'SKU': 'sku',
          'Product Name': 'title',
          'Product Handle': 'handle',
          'Material': 'material',
          'Color': 'color',
          'Pattern': 'pattern',
          'Width': 'width',
          'Weight': 'weight',
          'Price per Yard': 'retail_price',
          'Swatch Price': 'swatch_price',
          'Minimum Order': 'min_order_quantity',
          'Care Instructions': 'care_instructions',
          'Country of Origin': 'origin_country',
          'Certifications': 'certifications',
          'Collection': 'collection_handles',
          'Tags': 'tags',
          'Images': 'image_urls',
          'In Stock': 'inventory_quantity',
          'Lead Time': 'fulfillment_time'
        },
        settings: {
          skip_unmapped: false,
          auto_detect: true,
          case_sensitive: false,
          trim_values: true
        },
        is_shared: true
      }
    ];
  }

  async applyProfile(
    profileId: string,
    headers: string[],
    userId: string
  ): Promise<Record<string, string>> {
    let profile: Partial<MappingProfile> | null;

    // Check if it's a built-in profile
    if (profileId.startsWith('builtin-')) {
      const builtInProfiles = await this.getBuiltInProfiles();
      profile = builtInProfiles.find(p => p.id === profileId) || null;
    } else {
      profile = await this.retrieve(profileId, userId);
    }

    if (!profile || !profile.mapping) {
      throw new Error(`Mapping profile ${profileId} not found`);
    }

    const appliedMapping: Record<string, string> = {};

    // Apply the profile mapping
    headers.forEach(header => {
      const normalized = profile.settings?.case_sensitive
        ? header
        : header.toLowerCase();

      const trimmed = profile.settings?.trim_values
        ? normalized.trim()
        : normalized;

      // Check if this header exists in the profile mapping
      for (const [sourceCol, targetField] of Object.entries(profile.mapping!)) {
        const sourceMatcher = profile.settings?.case_sensitive
          ? sourceCol
          : sourceCol.toLowerCase();

        if (trimmed === sourceMatcher || header === sourceCol) {
          appliedMapping[header] = targetField;
          break;
        }
      }

      // If not mapped and skip_unmapped is false, keep original
      if (!appliedMapping[header] && !profile.settings?.skip_unmapped) {
        appliedMapping[header] = header;
      }
    });

    return appliedMapping;
  }
}
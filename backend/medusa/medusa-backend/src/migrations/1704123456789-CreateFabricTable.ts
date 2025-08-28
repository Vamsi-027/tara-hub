import { MigrationInterface, QueryRunner, Table, Index } from "typeorm"

export class CreateFabricTable1704123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "fabric",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "sku",
            type: "varchar",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "category",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "color",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "color_family",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "pattern",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "usage",
            type: "enum",
            enum: ["Indoor", "Outdoor", "Both"],
            default: "'Indoor'",
          },
          {
            name: "properties",
            type: "text",
            isNullable: false,
          },
          {
            name: "swatch_image_url",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "color_hex",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "composition",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "width",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "weight",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "durability",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "care_instructions",
            type: "text",
            isNullable: false,
          },
          {
            name: "in_stock",
            type: "boolean",
            default: true,
          },
          {
            name: "collection",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "price",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "stock_quantity",
            type: "int",
            default: 0,
          },
          {
            name: "metadata",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp with time zone",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    )

    // Create indexes
    await queryRunner.createIndex(
      "fabric",
      new Index({
        name: "IDX_fabric_category",
        columnNames: ["category"],
      })
    )

    await queryRunner.createIndex(
      "fabric",
      new Index({
        name: "IDX_fabric_collection",
        columnNames: ["collection"],
      })
    )

    await queryRunner.createIndex(
      "fabric",
      new Index({
        name: "IDX_fabric_color_family",
        columnNames: ["color_family"],
      })
    )

    await queryRunner.createIndex(
      "fabric",
      new Index({
        name: "IDX_fabric_metadata",
        columnNames: ["metadata"],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("fabric")
  }
}
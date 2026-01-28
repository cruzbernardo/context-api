import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreatePropertiesTables1754400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create properties table
    await queryRunner.createTable(
      new Table({
        name: 'properties',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'neighborhood',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'area_m2',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'property_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create property_notes table
    await queryRunner.createTable(
      new Table({
        name: 'property_notes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'property_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'note_text',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'ai_output',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create property_features table
    await queryRunner.createTable(
      new Table({
        name: 'property_features',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'property_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'near_subway',
            type: 'boolean',
            default: false,
          },
          {
            name: 'needs_renovation',
            type: 'boolean',
            default: false,
          },
          {
            name: 'estimated_capacity_people',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'recommended_use',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'property_notes',
      new TableForeignKey({
        columnNames: ['property_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'properties',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'property_notes',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'property_features',
      new TableForeignKey({
        columnNames: ['property_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'properties',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const propertyNotesTable = await queryRunner.getTable('property_notes');
    const propertyFeaturesTable =
      await queryRunner.getTable('property_features');

    if (propertyNotesTable) {
      const foreignKeys = propertyNotesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('property_notes', fk);
      }
    }

    if (propertyFeaturesTable) {
      const foreignKeys = propertyFeaturesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('property_features', fk);
      }
    }

    // Drop tables
    await queryRunner.dropTable('property_features');
    await queryRunner.dropTable('property_notes');
    await queryRunner.dropTable('properties');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedProperties1754500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO properties (id, title, city, neighborhood, price, area_m2, property_type, created_at, updated_at)
      VALUES
        (
          'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          'Modern Downtown Office Space',
          'New York',
          'Midtown Manhattan',
          850000.00,
          250.00,
          'office',
          NOW(),
          NOW()
        ),
        (
          'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
          'Prime Retail Storefront',
          'Los Angeles',
          'Beverly Hills',
          1200000.00,
          180.00,
          'retail',
          NOW(),
          NOW()
        ),
        (
          'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
          'Industrial Warehouse Complex',
          'Chicago',
          'West Loop',
          2500000.00,
          1500.00,
          'warehouse',
          NOW(),
          NOW()
        ),
        (
          'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a',
          'Tech Startup Office Hub',
          'San Francisco',
          'SoMa',
          1800000.00,
          400.00,
          'office',
          NOW(),
          NOW()
        ),
        (
          'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b',
          'Boutique Shopping Space',
          'Miami',
          'Wynwood',
          650000.00,
          120.00,
          'retail',
          NOW(),
          NOW()
        ),
        (
          'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c',
          'Distribution Center Warehouse',
          'Dallas',
          'Deep Ellum',
          3200000.00,
          2500.00,
          'warehouse',
          NOW(),
          NOW()
        ),
        (
          'a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d',
          'Creative Agency Office',
          'Austin',
          'East Austin',
          550000.00,
          200.00,
          'office',
          NOW(),
          NOW()
        ),
        (
          'b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e',
          'Corner Retail Property',
          'Seattle',
          'Capitol Hill',
          780000.00,
          150.00,
          'retail',
          NOW(),
          NOW()
        ),
        (
          'c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f',
          'Cold Storage Warehouse',
          'Denver',
          'RiNo District',
          1900000.00,
          1200.00,
          'warehouse',
          NOW(),
          NOW()
        ),
        (
          'd0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a',
          'Executive Office Suite',
          'Boston',
          'Back Bay',
          1100000.00,
          300.00,
          'office',
          NOW(),
          NOW()
        )
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM properties
      WHERE id IN (
        'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
        'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
        'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a',
        'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b',
        'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c',
        'a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d',
        'b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e',
        'c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f',
        'd0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a'
      );
    `);
  }
}

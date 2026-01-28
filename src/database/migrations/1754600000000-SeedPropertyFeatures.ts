import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPropertyFeatures1754600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed property features for SOME properties (not all)
    // This simulates properties that have had notes analyzed by AI
    // Properties without features: Beverly Hills retail, Miami Wynwood, Austin East Austin
    await queryRunner.query(`
      INSERT INTO property_features (id, property_id, near_subway, needs_renovation, estimated_capacity_people, recommended_use, created_at, updated_at)
      VALUES
        (
          '11111111-1111-1111-1111-111111111111',
          'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          true,
          false,
          50,
          'office',
          NOW(),
          NOW()
        ),
        (
          '22222222-2222-2222-2222-222222222222',
          'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
          false,
          true,
          120,
          'warehouse',
          NOW(),
          NOW()
        ),
        (
          '33333333-3333-3333-3333-333333333333',
          'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a',
          true,
          false,
          80,
          'office',
          NOW(),
          NOW()
        ),
        (
          '44444444-4444-4444-4444-444444444444',
          'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c',
          false,
          false,
          200,
          'warehouse',
          NOW(),
          NOW()
        ),
        (
          '55555555-5555-5555-5555-555555555555',
          'b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e',
          true,
          false,
          25,
          'retail',
          NOW(),
          NOW()
        ),
        (
          '66666666-6666-6666-6666-666666666666',
          'c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f',
          false,
          true,
          100,
          'warehouse',
          NOW(),
          NOW()
        ),
        (
          '77777777-7777-7777-7777-777777777777',
          'd0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a',
          true,
          false,
          60,
          'office',
          NOW(),
          NOW()
        )
      ON CONFLICT (property_id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM property_features
      WHERE id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555',
        '66666666-6666-6666-6666-666666666666',
        '77777777-7777-7777-7777-777777777777'
      );
    `);
  }
}

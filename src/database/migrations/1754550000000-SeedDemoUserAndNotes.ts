import { MigrationInterface, QueryRunner } from 'typeorm';
import { createCipheriv } from 'crypto';

export class SeedDemoUserAndNotes1754550000000 implements MigrationInterface {
  private encryptPassword(password: string): string {
    const algorithm = process.env.ALGORITHM || 'aes-256-cbc';
    const secretKey = process.env.ENCRYPT_SECRET_KEY;
    const iv = process.env.ENCRYPT_IV;

    if (!secretKey || !iv) {
      throw new Error(
        'ENCRYPT_SECRET_KEY and ENCRYPT_IV must be set in environment',
      );
    }

    const cipher = createCipheriv(
      algorithm,
      Buffer.from(secretKey, 'hex'),
      Buffer.from(iv, 'hex'),
    );
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const demoUserId = 'de000000-0000-0000-0000-000000000001';
    const encryptedPassword = this.encryptPassword('demouser');

    // Seed demo user
    await queryRunner.query(`
      INSERT INTO users (id, name, email, password, created_at, updated_at)
      VALUES (
        '${demoUserId}',
        'Demo User',
        'demo@context.com',
        '${encryptedPassword}',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    // Seed notes for properties with features
    // Each note text matches the expected feature extraction
    await queryRunner.query(`
      INSERT INTO property_notes (id, property_id, user_id, note_text, ai_output, created_at, updated_at)
      VALUES
        (
          'a0000000-0000-0000-0000-000000000001',
          'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          '${demoUserId}',
          'Great office space in downtown Manhattan. The building is well maintained and does not need any renovation. Can comfortably fit around 50 people. Not near subway but has good parking.',
          '{"nearSubway": false, "needsRenovation": false, "estimatedCapacityPeople": 50, "recommendedUse": "office"}',
          NOW(),
          NOW()
        ),
        (
          'a0000000-0000-0000-0000-000000000002',
          'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
          '${demoUserId}',
          'Large industrial warehouse in West Loop. The space needs some renovation work but has great potential. Capacity for about 120 workers. Good for manufacturing or distribution.',
          '{"nearSubway": false, "needsRenovation": true, "estimatedCapacityPeople": 120, "recommendedUse": "warehouse"}',
          NOW(),
          NOW()
        ),
        (
          'a0000000-0000-0000-0000-000000000003',
          'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a',
          '${demoUserId}',
          'Modern tech office in SoMa district. Very close to BART subway station. Recently renovated, no work needed. Open floor plan that can accommodate 80 employees easily.',
          '{"nearSubway": true, "needsRenovation": false, "estimatedCapacityPeople": 80, "recommendedUse": "office"}',
          NOW(),
          NOW()
        ),
        (
          'a0000000-0000-0000-0000-000000000004',
          'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c',
          '${demoUserId}',
          'Massive distribution center warehouse in Deep Ellum. Excellent condition, no renovation required. Can handle operations with up to 200 staff members. Perfect for logistics.',
          '{"nearSubway": false, "needsRenovation": false, "estimatedCapacityPeople": 200, "recommendedUse": "warehouse"}',
          NOW(),
          NOW()
        ),
        (
          'a0000000-0000-0000-0000-000000000005',
          'b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e',
          '${demoUserId}',
          'Corner retail property in Capitol Hill. Steps away from the light rail subway station. Move-in ready condition. Ideal for a boutique store with capacity for about 25 customers.',
          '{"nearSubway": true, "needsRenovation": false, "estimatedCapacityPeople": 25, "recommendedUse": "retail"}',
          NOW(),
          NOW()
        ),
        (
          'a0000000-0000-0000-0000-000000000006',
          'c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f',
          '${demoUserId}',
          'Cold storage warehouse facility in RiNo District. Needs renovation to update refrigeration systems. Can support operations with about 100 workers. Great for food distribution.',
          '{"nearSubway": false, "needsRenovation": true, "estimatedCapacityPeople": 100, "recommendedUse": "warehouse"}',
          NOW(),
          NOW()
        ),
        (
          'a0000000-0000-0000-0000-000000000007',
          'd0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a',
          '${demoUserId}',
          'Executive office suite in Back Bay. Walking distance to the T subway. Pristine condition with modern finishes. Designed for a team of approximately 60 professionals.',
          '{"nearSubway": true, "needsRenovation": false, "estimatedCapacityPeople": 60, "recommendedUse": "office"}',
          NOW(),
          NOW()
        )
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete notes first (foreign key constraint)
    await queryRunner.query(`
      DELETE FROM property_notes
      WHERE id IN (
        'a0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000005',
        'a0000000-0000-0000-0000-000000000006',
        'a0000000-0000-0000-0000-000000000007'
      );
    `);

    // Delete demo user
    await queryRunner.query(`
      DELETE FROM users WHERE id = 'de000000-0000-0000-0000-000000000001';
    `);
  }
}

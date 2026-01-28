import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { PropertyType } from 'src/modules/properties/enums';
import { Property } from './property.entity';

@Entity('property_features')
export class PropertyFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id', type: 'uuid' })
  propertyId: string;

  @Column({ name: 'near_subway', type: 'boolean', default: false })
  nearSubway: boolean;

  @Column({ name: 'needs_renovation', type: 'boolean', default: false })
  needsRenovation: boolean;

  @Column({ name: 'estimated_capacity_people', type: 'int', nullable: true })
  estimatedCapacityPeople: number;

  @Column({
    name: 'recommended_use',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  recommendedUse: PropertyType;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToOne(() => Property, (property) => property.feature)
  @JoinColumn({ name: 'property_id' })
  property: Property;
}

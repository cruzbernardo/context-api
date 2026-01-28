import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { PropertyType } from 'src/modules/properties/enums';
import { PropertyNote } from './property-note.entity';
import { PropertyFeature } from './property-feature.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  neighborhood: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @Column({ name: 'area_m2', type: 'decimal', precision: 10, scale: 2 })
  areaM2: number;

  @Column({
    name: 'property_type',
    type: 'varchar',
    length: 100,
  })
  propertyType: PropertyType;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => PropertyNote, (note) => note.property, {
    cascade: ['soft-remove'],
  })
  notes: PropertyNote[];

  @OneToOne(() => PropertyFeature, (feature) => feature.property, {
    cascade: ['soft-remove'],
  })
  feature: PropertyFeature;
}

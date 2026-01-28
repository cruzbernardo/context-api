import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { User } from './user.entity';

@Entity('property_notes')
export class PropertyNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id', type: 'uuid' })
  propertyId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'note_text', type: 'text' })
  noteText: string;

  @Column({ name: 'ai_output', type: 'jsonb', nullable: true })
  aiOutput: Record<string, any>;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Property, (property) => property.notes)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

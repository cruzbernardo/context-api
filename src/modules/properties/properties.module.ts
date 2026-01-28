import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property, PropertyNote, PropertyFeature } from 'src/database/entities';

// LLM Module
import { LlmModule } from '../llm';

// Property sub-module
import { PropertyService } from './property/domain/property.service';
import { PropertyController } from './property/http/property.controller';

// PropertyNotes sub-module
import { PropertyNoteService } from './propertyNotes/domain/property-note.service';
import { PropertyNoteController } from './propertyNotes/http/property-note.controller';
import { NoteProcessingListener } from './propertyNotes/listeners/note-processing.listener';

// PropertyFeatures sub-module
import { PropertyFeatureService } from './propertyFeatures/domain/property-feature.service';
import { PropertyFeatureController } from './propertyFeatures/http/property-feature.controller';
import { PropertyFeatureListener } from './propertyFeatures/listeners/property-feature.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyNote, PropertyFeature]),
    LlmModule,
  ],
  controllers: [
    PropertyController,
    PropertyNoteController,
    PropertyFeatureController,
  ],
  providers: [
    PropertyService,
    PropertyNoteService,
    PropertyFeatureService,
    NoteProcessingListener,
    PropertyFeatureListener,
  ],
  exports: [PropertyService, PropertyNoteService, PropertyFeatureService],
})
export class PropertiesModule {}

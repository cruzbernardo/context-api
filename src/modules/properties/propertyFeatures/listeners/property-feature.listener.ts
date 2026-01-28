import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyNote } from 'src/database/entities';
import { PropertyFeatureService } from '../domain/property-feature.service';
import {
  aggregateAiOutputs,
  AiOutputForAggregation,
} from '../domain/aggregation.util';
import { Logger } from 'winston';

interface NoteProcessedEventPayload {
  noteId: string;
  propertyId: string;
}

@Injectable()
export class PropertyFeatureListener {
  constructor(
    @InjectRepository(PropertyNote)
    private readonly propertyNoteRepository: Repository<PropertyNote>,

    private readonly propertyFeatureService: PropertyFeatureService,

    @Inject('winston')
    private readonly logger: Logger,
  ) {}

  @OnEvent('note.processed', { async: true })
  async handleNoteProcessed(event: NoteProcessedEventPayload): Promise<void> {
    try {
      const notes = await this.propertyNoteRepository.find({
        where: { propertyId: event.propertyId },
        order: { createdAt: 'ASC' },
      });

      const aiOutputs = notes
        .filter((note) => note.aiOutput !== null && note.aiOutput !== undefined)
        .map((note) => note.aiOutput as AiOutputForAggregation);

      if (aiOutputs.length === 0) {
        this.logger.warn(
          `No AI outputs found for property: ${event.propertyId}`,
          {
            context: PropertyFeatureListener.name,
          },
        );
        return;
      }

      const aggregated = aggregateAiOutputs(aiOutputs);

      await this.propertyFeatureService.upsert(event.propertyId, aggregated);

      this.logger.info(
        `Property feature updated for property: ${event.propertyId}`,
        {
          context: PropertyFeatureListener.name,
          notesCount: aiOutputs.length,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to update property feature for property: ${event.propertyId}`,
        {
          context: PropertyFeatureListener.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
    }
  }
}

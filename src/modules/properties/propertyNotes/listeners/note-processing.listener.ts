import { Injectable, Inject } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyNote } from 'src/database/entities';
import { LlmService } from 'src/modules/llm';
import { Logger } from 'winston';

export interface NoteCreatedEvent {
  noteId: string;
  propertyId: string;
}

export interface NoteProcessedEvent {
  noteId: string;
  propertyId: string;
}

@Injectable()
export class NoteProcessingListener {
  constructor(
    @InjectRepository(PropertyNote)
    private readonly propertyNoteRepository: Repository<PropertyNote>,

    private readonly llmService: LlmService,
    private readonly eventEmitter: EventEmitter2,

    @Inject('winston')
    private readonly logger: Logger,
  ) {}

  @OnEvent('note.created', { async: true })
  async handleNoteCreated(event: NoteCreatedEvent): Promise<void> {
    try {
      const note = await this.propertyNoteRepository.findOne({
        where: { id: event.noteId },
      });

      if (!note) {
        this.logger.warn(`Note not found: ${event.noteId}`, {
          context: NoteProcessingListener.name,
        });
        return;
      }

      const aiOutput = await this.llmService.analyzePropertyNote(note.noteText);

      await this.propertyNoteRepository.update(event.noteId, {
        aiOutput: aiOutput as unknown as Record<string, any>,
        updatedAt: new Date(),
      });

      this.logger.info(`Note processed successfully: ${event.noteId}`, {
        context: NoteProcessingListener.name,
      });

      this.eventEmitter.emit('note.processed', {
        noteId: event.noteId,
        propertyId: event.propertyId,
      } as NoteProcessedEvent);
    } catch (error) {
      this.logger.error(`Failed to process note: ${event.noteId}`, {
        context: NoteProcessingListener.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

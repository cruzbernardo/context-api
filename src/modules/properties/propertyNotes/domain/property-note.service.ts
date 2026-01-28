import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { PropertyNote } from 'src/database/entities';
import {
  RequestCreatePropertyNote,
  ResponsePropertyNote,
} from '../http/interfaces';
import { Logger } from 'winston';
import { NoteCreatedEvent } from '../listeners/note-processing.listener';

@Injectable()
export class PropertyNoteService {
  constructor(
    @InjectRepository(PropertyNote)
    private readonly propertyNoteRepository: Repository<PropertyNote>,

    private readonly eventEmitter: EventEmitter2,

    @Inject('winston')
    private readonly logger: Logger,
  ) {}

  private toResponse(note: PropertyNote): ResponsePropertyNote {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { aiOutput, user, ...safeNote } = note;

    return {
      ...safeNote,
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        : undefined,
    };
  }

  async create(data: RequestCreatePropertyNote): Promise<ResponsePropertyNote> {
    this.logger.debug(
      `Creating property note for property: ${data.propertyId}`,
      {
        context: PropertyNoteService.name,
      },
    );

    const note = await this.propertyNoteRepository.save(
      this.propertyNoteRepository.create(data),
    );

    this.logger.info(`Property note created: id=${note.id}`, {
      context: PropertyNoteService.name,
    });

    this.eventEmitter.emit('note.created', {
      noteId: note.id,
      propertyId: note.propertyId,
    } as NoteCreatedEvent);

    return this.toResponse(note);
  }

  async findAllByProperty(propertyId: string): Promise<ResponsePropertyNote[]> {
    this.logger.debug(`Fetching notes for property: ${propertyId}`, {
      context: PropertyNoteService.name,
    });

    const notes = await this.propertyNoteRepository.find({
      where: { propertyId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return notes.map((note) => this.toResponse(note));
  }

  async findOne(id: string): Promise<ResponsePropertyNote> {
    this.logger.debug(`Fetching property note by id: ${id}`, {
      context: PropertyNoteService.name,
    });

    const note = await this.propertyNoteRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!note) {
      this.logger.warn(`Property note not found with id: ${id}`, {
        context: PropertyNoteService.name,
      });
      throw new NotFoundException('Nota nao encontrada');
    }

    return this.toResponse(note);
  }

  async remove(id: string): Promise<void> {
    this.logger.debug(`Soft deleting property note with id: ${id}`, {
      context: PropertyNoteService.name,
    });

    const note = await this.propertyNoteRepository.findOne({ where: { id } });

    if (!note) {
      this.logger.warn(`Property note not found with id: ${id}`, {
        context: PropertyNoteService.name,
      });
      throw new NotFoundException('Nota nao encontrada');
    }

    await this.propertyNoteRepository.softDelete(id);

    this.logger.info(`Property note soft deleted: id=${id}`, {
      context: PropertyNoteService.name,
    });
  }
}

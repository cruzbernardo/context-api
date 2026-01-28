import { Test, TestingModule } from '@nestjs/testing';
import { PropertyNoteService } from './property-note.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PropertyNote } from 'src/database/entities';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from 'winston';

describe('PropertyNoteService', () => {
  let service: PropertyNoteService;
  let propertyNoteRepository: jest.Mocked<Repository<PropertyNote>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let logger: jest.Mocked<Logger>;

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockPropertyNoteRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockPropertyNote: PropertyNote = {
    id: 'note-123',
    propertyId: 'property-123',
    userId: 'user-123',
    noteText: 'Great location near subway',
    aiOutput: { nearSubway: true, needsRenovation: false },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    property: null,
    user: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyNoteService,
        {
          provide: getRepositoryToken(PropertyNote),
          useValue: mockPropertyNoteRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: 'winston',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PropertyNoteService>(PropertyNoteService);
    propertyNoteRepository = module.get(getRepositoryToken(PropertyNote));
    eventEmitter = module.get(EventEmitter2);
    logger = module.get('winston');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    const createData = {
      propertyId: 'property-123',
      userId: 'user-123',
      noteText: 'New note about the property',
    };

    it('should create a note successfully', async () => {
      const createdNote = { ...mockPropertyNote, ...createData };

      mockPropertyNoteRepository.create.mockReturnValue(createdNote);
      mockPropertyNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(createData);

      expect(propertyNoteRepository.create).toHaveBeenCalledWith(createData);
      expect(propertyNoteRepository.save).toHaveBeenCalledWith(createdNote);
      expect(result).not.toHaveProperty('aiOutput');
      expect(result).toHaveProperty('id', createdNote.id);
      expect(result).toHaveProperty('noteText', createdNote.noteText);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Property note created'),
        expect.any(Object),
      );
    });

    it('should emit note.created event after creation', async () => {
      const createdNote = { ...mockPropertyNote, ...createData };

      mockPropertyNoteRepository.create.mockReturnValue(createdNote);
      mockPropertyNoteRepository.save.mockResolvedValue(createdNote);

      await service.create(createData);

      expect(eventEmitter.emit).toHaveBeenCalledWith('note.created', {
        noteId: createdNote.id,
        propertyId: createdNote.propertyId,
      });
    });

    it('should exclude aiOutput from response', async () => {
      const createdNote = { ...mockPropertyNote, ...createData };

      mockPropertyNoteRepository.create.mockReturnValue(createdNote);
      mockPropertyNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(createData);

      expect(result).not.toHaveProperty('aiOutput');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('propertyId');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('noteText');
    });

    it('should handle database errors', async () => {
      mockPropertyNoteRepository.create.mockReturnValue(mockPropertyNote);
      mockPropertyNoteRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create(createData)).rejects.toThrow(
        'Database error',
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('findAllByProperty', () => {
    const propertyId = 'property-123';

    it('should return all notes for a property', async () => {
      const notes = [
        mockPropertyNote,
        { ...mockPropertyNote, id: 'note-456', noteText: 'Another note' },
      ];
      mockPropertyNoteRepository.find.mockResolvedValue(notes);

      const result = await service.findAllByProperty(propertyId);

      expect(propertyNoteRepository.find).toHaveBeenCalledWith({
        where: { propertyId },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('aiOutput');
      expect(result[1]).not.toHaveProperty('aiOutput');
    });

    it('should return empty array when no notes exist', async () => {
      mockPropertyNoteRepository.find.mockResolvedValue([]);

      const result = await service.findAllByProperty(propertyId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should exclude aiOutput from all notes', async () => {
      const notes = [mockPropertyNote];
      mockPropertyNoteRepository.find.mockResolvedValue(notes);

      const result = await service.findAllByProperty(propertyId);

      result.forEach((note) => {
        expect(note).not.toHaveProperty('aiOutput');
      });
    });
  });

  describe('findOne', () => {
    const noteId = 'note-123';

    it('should return a note by id', async () => {
      mockPropertyNoteRepository.findOne.mockResolvedValue(mockPropertyNote);

      const result = await service.findOne(noteId);

      expect(propertyNoteRepository.findOne).toHaveBeenCalledWith({
        where: { id: noteId },
        relations: ['user'],
      });
      expect(result).not.toHaveProperty('aiOutput');
      expect(result).toHaveProperty('id', mockPropertyNote.id);
      expect(result).toHaveProperty('noteText', mockPropertyNote.noteText);
    });

    it('should throw NotFoundException when note not found', async () => {
      mockPropertyNoteRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(noteId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(noteId)).rejects.toThrow(
        'Nota nao encontrada',
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Property note not found'),
        expect.any(Object),
      );
    });
  });

  describe('remove', () => {
    const noteId = 'note-123';

    it('should soft delete a note successfully', async () => {
      mockPropertyNoteRepository.findOne.mockResolvedValue(mockPropertyNote);
      mockPropertyNoteRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove(noteId);

      expect(propertyNoteRepository.findOne).toHaveBeenCalledWith({
        where: { id: noteId },
      });
      expect(propertyNoteRepository.softDelete).toHaveBeenCalledWith(noteId);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Property note soft deleted'),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when note not found', async () => {
      mockPropertyNoteRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(noteId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(noteId)).rejects.toThrow(
        'Nota nao encontrada',
      );

      expect(propertyNoteRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('toResponse (private method through public methods)', () => {
    it('should consistently exclude aiOutput from all responses', async () => {
      mockPropertyNoteRepository.findOne.mockResolvedValue(mockPropertyNote);
      mockPropertyNoteRepository.find.mockResolvedValue([mockPropertyNote]);
      mockPropertyNoteRepository.create.mockReturnValue(mockPropertyNote);
      mockPropertyNoteRepository.save.mockResolvedValue(mockPropertyNote);

      const findOneResult = await service.findOne('note-123');
      const findAllResult = await service.findAllByProperty('property-123');
      const createResult = await service.create({
        propertyId: 'property-123',
        userId: 'user-123',
        noteText: 'Test',
      });

      expect(findOneResult).not.toHaveProperty('aiOutput');
      expect(findAllResult[0]).not.toHaveProperty('aiOutput');
      expect(createResult).not.toHaveProperty('aiOutput');
    });
  });
});

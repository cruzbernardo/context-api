import { Test, TestingModule } from '@nestjs/testing';
import { PropertyFeatureService } from './property-feature.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PropertyFeature } from 'src/database/entities';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Logger } from 'winston';
import { PropertyType } from '../../enums';

describe('PropertyFeatureService', () => {
  let service: PropertyFeatureService;
  let propertyFeatureRepository: jest.Mocked<Repository<PropertyFeature>>;
  let logger: jest.Mocked<Logger>;

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockPropertyFeatureRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockPropertyFeature: PropertyFeature = {
    id: 'feature-123',
    propertyId: 'property-123',
    nearSubway: true,
    needsRenovation: false,
    estimatedCapacityPeople: 50,
    recommendedUse: PropertyType.OFFICE,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    property: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyFeatureService,
        {
          provide: getRepositoryToken(PropertyFeature),
          useValue: mockPropertyFeatureRepository,
        },
        {
          provide: 'winston',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PropertyFeatureService>(PropertyFeatureService);
    propertyFeatureRepository = module.get(getRepositoryToken(PropertyFeature));
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
      nearSubway: true,
      needsRenovation: false,
      estimatedCapacityPeople: 50,
      recommendedUse: PropertyType.OFFICE,
    };

    it('should create a property feature successfully', async () => {
      const createdFeature = { ...mockPropertyFeature, ...createData };

      mockPropertyFeatureRepository.findOne.mockResolvedValue(null);
      mockPropertyFeatureRepository.create.mockReturnValue(createdFeature);
      mockPropertyFeatureRepository.save.mockResolvedValue(createdFeature);

      const result = await service.create(createData);

      expect(propertyFeatureRepository.findOne).toHaveBeenCalledWith({
        where: { propertyId: createData.propertyId },
      });
      expect(propertyFeatureRepository.create).toHaveBeenCalledWith(createData);
      expect(propertyFeatureRepository.save).toHaveBeenCalledWith(
        createdFeature,
      );
      expect(result).toEqual(createdFeature);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Property feature created'),
        expect.any(Object),
      );
    });

    it('should throw ConflictException when feature already exists', async () => {
      mockPropertyFeatureRepository.findOne.mockResolvedValue(
        mockPropertyFeature,
      );

      await expect(service.create(createData)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createData)).rejects.toThrow(
        'Feature ja existe para este imovel',
      );

      expect(propertyFeatureRepository.create).not.toHaveBeenCalled();
      expect(propertyFeatureRepository.save).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Feature already exists'),
        expect.any(Object),
      );
    });
  });

  describe('findByProperty', () => {
    const propertyId = 'property-123';

    it('should return a feature for a property', async () => {
      mockPropertyFeatureRepository.findOne.mockResolvedValue(
        mockPropertyFeature,
      );

      const result = await service.findByProperty(propertyId);

      expect(propertyFeatureRepository.findOne).toHaveBeenCalledWith({
        where: { propertyId },
      });
      expect(result).toEqual(mockPropertyFeature);
    });

    it('should throw NotFoundException when feature not found', async () => {
      mockPropertyFeatureRepository.findOne.mockResolvedValue(null);

      await expect(service.findByProperty(propertyId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByProperty(propertyId)).rejects.toThrow(
        'Feature nao encontrada para este imovel',
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Property feature not found for property'),
        expect.any(Object),
      );
    });
  });

  describe('findOne', () => {
    const featureId = 'feature-123';

    it('should return a feature by id', async () => {
      mockPropertyFeatureRepository.findOne.mockResolvedValue(
        mockPropertyFeature,
      );

      const result = await service.findOne(featureId);

      expect(propertyFeatureRepository.findOne).toHaveBeenCalledWith({
        where: { id: featureId },
      });
      expect(result).toEqual(mockPropertyFeature);
    });

    it('should throw NotFoundException when feature not found', async () => {
      mockPropertyFeatureRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(featureId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(featureId)).rejects.toThrow(
        'Feature nao encontrada',
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Property feature not found with id'),
        expect.any(Object),
      );
    });
  });

  describe('upsert', () => {
    const propertyId = 'property-123';
    const upsertData = {
      nearSubway: false,
      needsRenovation: true,
      estimatedCapacityPeople: 100,
      recommendedUse: PropertyType.WAREHOUSE,
    };

    it('should update existing feature', async () => {
      const updatedFeature = { ...mockPropertyFeature, ...upsertData };

      mockPropertyFeatureRepository.findOne.mockResolvedValue(
        mockPropertyFeature,
      );
      mockPropertyFeatureRepository.save.mockResolvedValue(updatedFeature);

      const result = await service.upsert(propertyId, upsertData);

      expect(propertyFeatureRepository.findOne).toHaveBeenCalledWith({
        where: { propertyId },
      });
      expect(propertyFeatureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockPropertyFeature,
          ...upsertData,
          updatedAt: expect.any(Date),
        }),
      );
      expect(result).toEqual(updatedFeature);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Property feature updated'),
        expect.any(Object),
      );
    });

    it('should create new feature when not exists', async () => {
      const newFeature = {
        ...mockPropertyFeature,
        propertyId,
        ...upsertData,
      };

      mockPropertyFeatureRepository.findOne.mockResolvedValue(null);
      mockPropertyFeatureRepository.create.mockReturnValue(newFeature);
      mockPropertyFeatureRepository.save.mockResolvedValue(newFeature);

      const result = await service.upsert(propertyId, upsertData);

      expect(propertyFeatureRepository.create).toHaveBeenCalledWith({
        propertyId,
        ...upsertData,
      });
      expect(propertyFeatureRepository.save).toHaveBeenCalled();
      expect(result).toEqual(newFeature);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Property feature created'),
        expect.any(Object),
      );
    });

    it('should preserve existing id when updating', async () => {
      mockPropertyFeatureRepository.findOne.mockResolvedValue(
        mockPropertyFeature,
      );
      mockPropertyFeatureRepository.save.mockResolvedValue({
        ...mockPropertyFeature,
        ...upsertData,
      });

      await service.upsert(propertyId, upsertData);

      expect(propertyFeatureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockPropertyFeature.id,
        }),
      );
    });

    it('should update timestamp when updating', async () => {
      mockPropertyFeatureRepository.findOne.mockResolvedValue(
        mockPropertyFeature,
      );
      mockPropertyFeatureRepository.save.mockResolvedValue({
        ...mockPropertyFeature,
        ...upsertData,
      });

      await service.upsert(propertyId, upsertData);

      expect(propertyFeatureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        }),
      );
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { nearSubway: true };

      mockPropertyFeatureRepository.findOne.mockResolvedValue(
        mockPropertyFeature,
      );
      mockPropertyFeatureRepository.save.mockResolvedValue({
        ...mockPropertyFeature,
        ...partialUpdate,
      });

      await service.upsert(propertyId, partialUpdate as any);

      expect(propertyFeatureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          nearSubway: true,
          needsRenovation: mockPropertyFeature.needsRenovation,
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle optional fields as undefined', async () => {
      const createData = {
        propertyId: 'property-123',
        nearSubway: true,
        needsRenovation: false,
      };

      const createdFeature = {
        ...mockPropertyFeature,
        estimatedCapacityPeople: undefined,
        recommendedUse: undefined,
      };

      mockPropertyFeatureRepository.findOne.mockResolvedValue(null);
      mockPropertyFeatureRepository.create.mockReturnValue(createdFeature);
      mockPropertyFeatureRepository.save.mockResolvedValue(createdFeature);

      const result = await service.create(createData as any);

      expect(result).toBeDefined();
    });
  });
});

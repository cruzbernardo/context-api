import { Test, TestingModule } from '@nestjs/testing';
import { PropertyService } from './property.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Property } from 'src/database/entities';
import { NotFoundException } from '@nestjs/common';
import { Logger } from 'winston';
import { PropertyType } from '../../enums';
import { LlmService } from 'src/modules/llm';

describe('PropertyService', () => {
  let service: PropertyService;
  let propertyRepository: jest.Mocked<Repository<Property>>;
  let llmService: jest.Mocked<LlmService>;
  let logger: jest.Mocked<Logger>;

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockLlmService = {
    extractPropertyFiltersFromUserText: jest.fn(),
    analyzePropertyNote: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockPropertyRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockProperty: Property = {
    id: 'property-123',
    title: 'Modern Office Space',
    city: 'New York',
    neighborhood: 'Manhattan',
    price: 500000,
    areaM2: 200,
    propertyType: PropertyType.OFFICE,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    notes: [],
    feature: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        {
          provide: getRepositoryToken(Property),
          useValue: mockPropertyRepository,
        },
        {
          provide: LlmService,
          useValue: mockLlmService,
        },
        {
          provide: 'winston',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    propertyRepository = module.get(getRepositoryToken(Property));
    llmService = module.get(LlmService);
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
      title: 'New Office',
      city: 'Los Angeles',
      neighborhood: 'Downtown',
      price: 300000,
      areaM2: 150,
      propertyType: PropertyType.OFFICE,
    };

    it('should create a property successfully', async () => {
      const createdProperty = { ...mockProperty, ...createData };

      mockPropertyRepository.create.mockReturnValue(createdProperty);
      mockPropertyRepository.save.mockResolvedValue(createdProperty);

      const result = await service.create(createData);

      expect(propertyRepository.create).toHaveBeenCalledWith(createData);
      expect(propertyRepository.save).toHaveBeenCalledWith(createdProperty);
      expect(result).toEqual(createdProperty);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Creating property with title'),
        expect.any(Object),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Property created successfully'),
        expect.any(Object),
      );
    });

    it('should handle database errors on create', async () => {
      mockPropertyRepository.create.mockReturnValue(mockProperty);
      mockPropertyRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create(createData)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockQueryBuilder.leftJoin.mockReturnThis();
      mockQueryBuilder.andWhere.mockReturnThis();
    });

    it('should return all properties without filters', async () => {
      const properties = [
        mockProperty,
        { ...mockProperty, id: 'property-456' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(properties);

      const result = await service.findAll();

      expect(propertyRepository.createQueryBuilder).toHaveBeenCalledWith(
        'property',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'property.feature',
        'feature',
      );
      expect(result).toEqual(properties);
      expect(result).toHaveLength(2);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Found 2 properties'),
        expect.any(Object),
      );
    });

    it('should return empty array when no properties exist', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Found 0 properties'),
        expect.any(Object),
      );
    });

    it('should filter by city', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProperty]);

      await service.findAll({ city: 'New York' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(property.city) LIKE LOWER(:city)',
        { city: '%New York%' },
      );
    });

    it('should filter by neighborhood', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProperty]);

      await service.findAll({ neighborhood: 'Manhattan' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(property.neighborhood) LIKE LOWER(:neighborhood)',
        { neighborhood: '%Manhattan%' },
      );
    });

    it('should filter by propertyType', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProperty]);

      await service.findAll({ propertyType: PropertyType.OFFICE });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'property.propertyType = :propertyType',
        { propertyType: PropertyType.OFFICE },
      );
    });

    it('should filter by price range', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProperty]);

      await service.findAll({ minPrice: 100000, maxPrice: 500000 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'property.price >= :minPrice',
        { minPrice: 100000 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'property.price <= :maxPrice',
        { maxPrice: 500000 },
      );
    });

    it('should filter by area range', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProperty]);

      await service.findAll({ minArea: 50, maxArea: 200 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'property.areaM2 >= :minArea',
        { minArea: 50 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'property.areaM2 <= :maxArea',
        { maxArea: 200 },
      );
    });

    it('should filter by nearSubway feature', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProperty]);

      await service.findAll({ nearSubway: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'feature.nearSubway = :nearSubway',
        { nearSubway: true },
      );
    });

    it('should filter by needsRenovation feature', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProperty]);

      await service.findAll({ needsRenovation: false });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'feature.needsRenovation = :needsRenovation',
        { needsRenovation: false },
      );
    });

    it('should filter by recommendedUse feature', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProperty]);

      await service.findAll({ recommendedUse: PropertyType.WAREHOUSE });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'feature.recommendedUse = :recommendedUse',
        { recommendedUse: PropertyType.WAREHOUSE },
      );
    });

    it('should apply multiple filters', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProperty]);

      await service.findAll({
        city: 'New York',
        propertyType: PropertyType.OFFICE,
        minPrice: 100000,
        nearSubway: true,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4);
    });
  });

  describe('findOne', () => {
    const propertyId = 'property-123';

    it('should return a property by id', async () => {
      mockPropertyRepository.findOne.mockResolvedValue(mockProperty);

      const result = await service.findOne(propertyId);

      expect(propertyRepository.findOne).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(result).toEqual(mockProperty);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Property found'),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when property not found', async () => {
      mockPropertyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(propertyId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(propertyId)).rejects.toThrow(
        'Imovel nao encontrado',
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Property not found'),
        expect.any(Object),
      );
    });
  });

  describe('update', () => {
    const propertyId = 'property-123';
    const updateData = {
      title: 'Updated Title',
      price: 600000,
    };

    it('should update a property successfully', async () => {
      const updatedProperty = { ...mockProperty, ...updateData };

      mockPropertyRepository.findOne.mockResolvedValue(mockProperty);
      mockPropertyRepository.save.mockResolvedValue(updatedProperty);

      const result = await service.update(propertyId, updateData);

      expect(propertyRepository.findOne).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(propertyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockProperty,
          ...updateData,
          updatedAt: expect.any(Date),
        }),
      );
      expect(result).toEqual(updatedProperty);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Property updated successfully'),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when property not found', async () => {
      mockPropertyRepository.findOne.mockResolvedValue(null);

      await expect(service.update(propertyId, updateData)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(propertyId, updateData)).rejects.toThrow(
        'Imovel nao encontrado',
      );

      expect(propertyRepository.save).not.toHaveBeenCalled();
    });

    it('should preserve unchanged fields', async () => {
      mockPropertyRepository.findOne.mockResolvedValue(mockProperty);
      mockPropertyRepository.save.mockResolvedValue({
        ...mockProperty,
        title: updateData.title,
      });

      await service.update(propertyId, { title: updateData.title });

      expect(propertyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          city: mockProperty.city,
          neighborhood: mockProperty.neighborhood,
          propertyType: mockProperty.propertyType,
        }),
      );
    });
  });

  describe('remove', () => {
    const propertyId = 'property-123';

    it('should soft delete a property successfully', async () => {
      mockPropertyRepository.findOne.mockResolvedValue(mockProperty);
      mockPropertyRepository.softRemove.mockResolvedValue(mockProperty);

      await service.remove(propertyId);

      expect(propertyRepository.findOne).toHaveBeenCalledWith({
        where: { id: propertyId },
        relations: ['notes', 'feature'],
      });
      expect(propertyRepository.softRemove).toHaveBeenCalledWith(mockProperty);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Property soft deleted successfully'),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException when property not found', async () => {
      mockPropertyRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(propertyId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(propertyId)).rejects.toThrow(
        'Imovel nao encontrado',
      );

      expect(propertyRepository.softRemove).not.toHaveBeenCalled();
    });

    it('should load relations for cascade delete', async () => {
      mockPropertyRepository.findOne.mockResolvedValue(mockProperty);
      mockPropertyRepository.softRemove.mockResolvedValue(mockProperty);

      await service.remove(propertyId);

      expect(propertyRepository.findOne).toHaveBeenCalledWith({
        where: { id: propertyId },
        relations: ['notes', 'feature'],
      });
    });
  });

  describe('rankProperties', () => {
    const mockPropertyWithFeature = {
      ...mockProperty,
      feature: {
        id: 'feature-123',
        propertyId: 'property-123',
        nearSubway: true,
        needsRenovation: false,
        estimatedCapacityPeople: 20,
        recommendedUse: PropertyType.OFFICE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const mockLlmResponse = JSON.stringify({
      city: 'New York',
      neighborhood: null,
      minPrice: null,
      maxPrice: 500000,
      minArea: null,
      maxArea: null,
      nearSubway: true,
      needsRenovation: false,
      recommendedUse: 'office',
      estimatedCapacityPeople: 20,
    });

    beforeEach(() => {
      mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
      mockQueryBuilder.andWhere.mockReturnThis();
    });

    it('should rank properties with matching features', async () => {
      mockLlmService.extractPropertyFiltersFromUserText.mockResolvedValue(
        mockLlmResponse,
      );
      mockQueryBuilder.getMany.mockResolvedValue([mockPropertyWithFeature]);

      const result = await service.rankProperties(
        'office near subway in New York',
      );

      expect(
        llmService.extractPropertyFiltersFromUserText,
      ).toHaveBeenCalledWith('office near subway in New York');
      expect(propertyRepository.createQueryBuilder).toHaveBeenCalledWith(
        'property',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'property.feature',
        'feature',
      );
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(10);
    });

    it('should return empty array when no properties match filters', async () => {
      mockLlmService.extractPropertyFiltersFromUserText.mockResolvedValue(
        mockLlmResponse,
      );
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.rankProperties('warehouse in Chicago');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should calculate partial score for partially matching features', async () => {
      const partialMatchProperty = {
        ...mockPropertyWithFeature,
        feature: {
          ...mockPropertyWithFeature.feature,
          nearSubway: false,
          needsRenovation: true,
        },
      };

      mockLlmService.extractPropertyFiltersFromUserText.mockResolvedValue(
        mockLlmResponse,
      );
      mockQueryBuilder.getMany.mockResolvedValue([partialMatchProperty]);

      const result = await service.rankProperties('office near subway');

      expect(result).toHaveLength(1);
      expect(result[0].score).toBeLessThan(10);
    });

    it('should sort properties by score descending', async () => {
      const highScoreProperty = {
        ...mockPropertyWithFeature,
        id: 'property-high',
      };

      const lowScoreProperty = {
        ...mockPropertyWithFeature,
        id: 'property-low',
        feature: {
          ...mockPropertyWithFeature.feature,
          nearSubway: false,
          needsRenovation: true,
          recommendedUse: PropertyType.WAREHOUSE,
        },
      };

      mockLlmService.extractPropertyFiltersFromUserText.mockResolvedValue(
        mockLlmResponse,
      );
      mockQueryBuilder.getMany.mockResolvedValue([
        lowScoreProperty,
        highScoreProperty,
      ]);

      const result = await service.rankProperties('office near subway');

      expect(result[0].id).toBe('property-high');
      expect(result[1].id).toBe('property-low');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('should handle properties without features gracefully', async () => {
      const propertyWithoutFeature = {
        ...mockProperty,
        feature: null,
      };

      mockLlmService.extractPropertyFiltersFromUserText.mockResolvedValue(
        mockLlmResponse,
      );
      mockQueryBuilder.getMany.mockResolvedValue([propertyWithoutFeature]);

      const result = await service.rankProperties('office near subway');

      expect(result).toHaveLength(1);
      // Property gets partial score from property field matches (city, price)
      // but no points from features since feature is null
      expect(result[0].score).toBeLessThan(10);
      expect(result[0].score).toBeGreaterThanOrEqual(0);
    });

    it('should apply city filter from LLM response', async () => {
      mockLlmService.extractPropertyFiltersFromUserText.mockResolvedValue(
        mockLlmResponse,
      );
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.rankProperties('office in New York');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(property.city) LIKE LOWER(:city)',
        { city: '%New York%' },
      );
    });

    it('should apply price filter from LLM response', async () => {
      mockLlmService.extractPropertyFiltersFromUserText.mockResolvedValue(
        mockLlmResponse,
      );
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.rankProperties('budget up to 500k');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'property.price <= :maxPrice',
        { maxPrice: 500000 },
      );
    });

    it('should handle LLM service errors', async () => {
      mockLlmService.extractPropertyFiltersFromUserText.mockRejectedValue(
        new Error('LLM API error'),
      );

      await expect(service.rankProperties('office')).rejects.toThrow(
        'LLM API error',
      );
    });
  });
});

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from 'src/database/entities';
import {
  RequestCreateProperty,
  RequestUpdateProperty,
  RequestFilterProperty,
  ResponseProperty,
  ResponsePropertyWithFeatureAndScore,
} from '../http/interfaces';
import { Logger } from 'winston';
import { LlmService } from 'src/modules/llm';
import { parsePropertyFeatureResponse } from 'src/shared/utils';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,

    private readonly llmService: LlmService,

    @Inject('winston')
    private readonly logger: Logger,
  ) {}

  async create(data: RequestCreateProperty): Promise<ResponseProperty> {
    this.logger.debug(`Creating property with title: ${data.title}`, {
      context: PropertyService.name,
    });

    const property = await this.propertyRepository.save(
      this.propertyRepository.create(data),
    );

    this.logger.info(
      `Property created successfully: id=${property.id} title=${property.title}`,
      { context: PropertyService.name },
    );

    return property;
  }

  async findAll(filters?: RequestFilterProperty): Promise<ResponseProperty[]> {
    this.logger.debug('Fetching properties with filters', {
      context: PropertyService.name,
      filters,
    });

    const query = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoin('property.feature', 'feature');

    // Property filters
    if (filters?.city) {
      query.andWhere('LOWER(property.city) LIKE LOWER(:city)', {
        city: `%${filters.city}%`,
      });
    }

    if (filters?.neighborhood) {
      query.andWhere('LOWER(property.neighborhood) LIKE LOWER(:neighborhood)', {
        neighborhood: `%${filters.neighborhood}%`,
      });
    }

    if (filters?.propertyType) {
      query.andWhere('property.propertyType = :propertyType', {
        propertyType: filters.propertyType,
      });
    }

    if (filters?.minPrice !== undefined) {
      query.andWhere('property.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters?.maxPrice !== undefined) {
      query.andWhere('property.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters?.minArea !== undefined) {
      query.andWhere('property.areaM2 >= :minArea', {
        minArea: filters.minArea,
      });
    }

    if (filters?.maxArea !== undefined) {
      query.andWhere('property.areaM2 <= :maxArea', {
        maxArea: filters.maxArea,
      });
    }

    // Feature filters (requires join)
    if (filters?.nearSubway !== undefined) {
      query.andWhere('feature.nearSubway = :nearSubway', {
        nearSubway: filters.nearSubway,
      });
    }

    if (filters?.needsRenovation !== undefined) {
      query.andWhere('feature.needsRenovation = :needsRenovation', {
        needsRenovation: filters.needsRenovation,
      });
    }

    if (filters?.recommendedUse) {
      query.andWhere('feature.recommendedUse = :recommendedUse', {
        recommendedUse: filters.recommendedUse,
      });
    }

    const properties = await query.getMany();

    this.logger.info(`Found ${properties.length} properties`, {
      context: PropertyService.name,
    });

    return properties;
  }

  async findOne(id: string): Promise<ResponseProperty> {
    this.logger.debug(`Fetching property by id: ${id}`, {
      context: PropertyService.name,
    });

    const property = await this.propertyRepository.findOne({
      where: { id },
    });

    if (!property) {
      this.logger.warn(`Property not found with id: ${id}`, {
        context: PropertyService.name,
      });
      throw new NotFoundException('Imovel nao encontrado');
    }

    this.logger.info(`Property found: id=${id} title=${property.title}`, {
      context: PropertyService.name,
    });

    return property;
  }

  async update(
    id: string,
    data: RequestUpdateProperty,
  ): Promise<ResponseProperty> {
    this.logger.debug(`Updating property with id: ${id}`, {
      context: PropertyService.name,
    });

    const property = await this.propertyRepository.findOne({ where: { id } });

    if (!property) {
      this.logger.warn(`Property not found with id: ${id}`, {
        context: PropertyService.name,
      });
      throw new NotFoundException('Imovel nao encontrado');
    }

    const updated = await this.propertyRepository.save({
      ...property,
      ...data,
      updatedAt: new Date(),
    });

    this.logger.info(`Property updated successfully: id=${id}`, {
      context: PropertyService.name,
    });

    return updated;
  }

  async remove(id: string): Promise<void> {
    this.logger.debug(`Soft deleting property with id: ${id}`, {
      context: PropertyService.name,
    });

    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ['notes', 'feature'],
    });

    if (!property) {
      this.logger.warn(`Property not found with id: ${id}`, {
        context: PropertyService.name,
      });
      throw new NotFoundException('Imovel nao encontrado');
    }

    await this.propertyRepository.softRemove(property);

    this.logger.info(`Property soft deleted successfully: id=${id}`, {
      context: PropertyService.name,
    });
  }

  async rankProperties(
    text: string,
  ): Promise<ResponsePropertyWithFeatureAndScore[]> {
    this.logger.debug('Ranking properties based on the text', {
      context: PropertyService.name,
    });

    const content =
      await this.llmService.extractPropertyFiltersFromUserText(text);
    const filters = JSON.parse(content);
    let propertyFields = 0;

    const query = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.feature', 'feature');

    if (filters?.city) {
      propertyFields++;
      query.andWhere('LOWER(property.city) LIKE LOWER(:city)', {
        city: `%${String(filters.city)}%`,
      });
    }

    if (filters?.neighborhood) {
      propertyFields++;
      query.andWhere('LOWER(property.neighborhood) LIKE LOWER(:neighborhood)', {
        neighborhood: `%${String(filters.neighborhood)}%`,
      });
    }

    if (filters?.propertyType) {
      propertyFields++;
      query.andWhere('property.propertyType = :propertyType', {
        propertyType: filters.propertyType,
      });
    }

    if (filters?.minPrice || filters?.maxPrice) {
      propertyFields++;
      if (filters?.minPrice != null) {
        query.andWhere('property.price >= :minPrice', {
          minPrice: Number(filters.minPrice),
        });
      }

      if (filters?.maxPrice != null) {
        query.andWhere('property.price <= :maxPrice', {
          maxPrice: Number(filters.maxPrice),
        });
      }
    }

    if (filters?.minArea || filters?.maxArea) {
      propertyFields++;
      if (filters?.minArea != null) {
        query.andWhere('property.areaM2 >= :minArea', {
          minArea: Number(filters.minArea),
        });
      }

      if (filters?.maxArea != null) {
        query.andWhere('property.areaM2 <= :maxArea', {
          maxArea: Number(filters.maxArea),
        });
      }
    }

    const properties = await query.getMany();
    const expectedFeatures = parsePropertyFeatureResponse(content);

    const relevantFeatures = Object.entries(expectedFeatures).filter(
      ([key, value]) => {
        if (key === 'estimatedCapacityPeople') {
          return value !== undefined && value > 0;
        }
        return value !== undefined;
      },
    );
    const totalFields = relevantFeatures.length + propertyFields;

    const scoredProperties = properties.map((property) => {
      let matchCount = propertyFields;
      for (const [key, expectedValue] of relevantFeatures) {
        if (
          property.feature?.[key as keyof typeof property.feature] ===
          expectedValue
        ) {
          matchCount++;
        }
      }

      const score =
        totalFields > 0 ? Math.round((matchCount / totalFields) * 10) : 0;

      return {
        ...property,
        score,
      } as ResponsePropertyWithFeatureAndScore;
    });

    this.logger.info(`Ranked ${scoredProperties.length} properties`, {
      context: PropertyService.name,
    });

    return scoredProperties.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
}

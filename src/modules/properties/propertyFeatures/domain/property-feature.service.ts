import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyFeature } from 'src/database/entities';
import { PropertyType } from '../../enums';
import { Logger } from 'winston';

export interface RequestCreatePropertyFeature {
  propertyId: string;
  nearSubway: boolean;
  needsRenovation: boolean;
  estimatedCapacityPeople?: number;
  recommendedUse?: PropertyType;
}

export interface ResponsePropertyFeature {
  id: string;
  propertyId: string;
  nearSubway: boolean;
  needsRenovation: boolean;
  estimatedCapacityPeople?: number;
  recommendedUse?: PropertyType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

@Injectable()
export class PropertyFeatureService {
  constructor(
    @InjectRepository(PropertyFeature)
    private readonly propertyFeatureRepository: Repository<PropertyFeature>,

    @Inject('winston')
    private readonly logger: Logger,
  ) {}

  async create(data: RequestCreatePropertyFeature): Promise<PropertyFeature> {
    this.logger.debug(
      `Creating property feature for property: ${data.propertyId}`,
      {
        context: PropertyFeatureService.name,
      },
    );

    // Check if feature already exists for this property (OneToOne)
    const existing = await this.propertyFeatureRepository.findOne({
      where: { propertyId: data.propertyId },
    });

    if (existing) {
      this.logger.warn(
        `Feature already exists for property: ${data.propertyId}`,
        {
          context: PropertyFeatureService.name,
        },
      );
      throw new ConflictException('Feature ja existe para este imovel');
    }

    const feature = await this.propertyFeatureRepository.save(
      this.propertyFeatureRepository.create(data),
    );

    this.logger.info(`Property feature created: id=${feature.id}`, {
      context: PropertyFeatureService.name,
    });

    return feature;
  }

  async findByProperty(propertyId: string): Promise<PropertyFeature> {
    this.logger.debug(`Fetching feature for property: ${propertyId}`, {
      context: PropertyFeatureService.name,
    });

    const feature = await this.propertyFeatureRepository.findOne({
      where: { propertyId },
    });

    if (!feature) {
      this.logger.warn(
        `Property feature not found for property: ${propertyId}`,
        {
          context: PropertyFeatureService.name,
        },
      );
      throw new NotFoundException('Feature nao encontrada para este imovel');
    }

    return feature;
  }

  async findOne(id: string): Promise<PropertyFeature> {
    this.logger.debug(`Fetching property feature by id: ${id}`, {
      context: PropertyFeatureService.name,
    });

    const feature = await this.propertyFeatureRepository.findOne({
      where: { id },
    });

    if (!feature) {
      this.logger.warn(`Property feature not found with id: ${id}`, {
        context: PropertyFeatureService.name,
      });
      throw new NotFoundException('Feature nao encontrada');
    }

    return feature;
  }

  async upsert(
    propertyId: string,
    data: Omit<RequestCreatePropertyFeature, 'propertyId'>,
  ): Promise<PropertyFeature> {
    this.logger.debug(
      `Upserting property feature for property: ${propertyId}`,
      {
        context: PropertyFeatureService.name,
        data,
      },
    );

    const existing = await this.propertyFeatureRepository.findOne({
      where: { propertyId },
    });

    if (existing) {
      const updated = await this.propertyFeatureRepository.save({
        ...existing,
        ...data,
        updatedAt: new Date(),
      });

      this.logger.info(`Property feature updated: id=${updated.id}`, {
        context: PropertyFeatureService.name,
      });

      return updated;
    }

    const feature = await this.propertyFeatureRepository.save(
      this.propertyFeatureRepository.create({
        propertyId,
        ...data,
      }),
    );

    this.logger.info(`Property feature created: id=${feature.id}`, {
      context: PropertyFeatureService.name,
    });

    return feature;
  }
}

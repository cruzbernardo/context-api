import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '../../../enums';
import { ResponsePropertyFeature } from '../interfaces';

export class GetPropertyFeatureModel implements ResponsePropertyFeature {
  @ApiProperty()
  id: string;

  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  nearSubway: boolean;

  @ApiProperty()
  needsRenovation: boolean;

  @ApiProperty({ required: false })
  estimatedCapacityPeople?: number;

  @ApiProperty({ enum: PropertyType, required: false })
  recommendedUse?: PropertyType;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

import { PropertyType } from '../../../enums';

export interface ResponsePropertyFeature {
  id: string;
  propertyId: string;
  nearSubway: boolean;
  needsRenovation: boolean;
  estimatedCapacityPeople?: number;
  recommendedUse?: PropertyType;
  createdAt: Date;
  updatedAt: Date;
}

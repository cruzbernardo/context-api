import { PropertyType } from '../../../enums';

export interface AiOutput {
  nearSubway: boolean;
  needsRenovation: boolean;
  estimatedCapacityPeople: number;
  recommendedUse: PropertyType;
}

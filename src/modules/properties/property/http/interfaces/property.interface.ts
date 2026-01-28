import { ResponsePropertyFeature } from 'src/modules/properties/propertyFeatures/domain/property-feature.service';
import { PropertyType } from '../../../enums';

export interface RequestCreateProperty {
  title: string;
  city: string;
  neighborhood: string;
  price: number;
  areaM2: number;
  propertyType: PropertyType;
}

export interface RequestUpdateProperty {
  title?: string;
  city?: string;
  neighborhood?: string;
  price?: number;
  areaM2?: number;
  propertyType?: PropertyType;
}

export interface RequestFilterProperty {
  // Property filters
  city?: string;
  neighborhood?: string;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  // Feature filters
  nearSubway?: boolean;
  needsRenovation?: boolean;
  recommendedUse?: PropertyType;
}

export interface ResponseProperty {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  price: number;
  areaM2: number;
  propertyType: PropertyType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
export interface ResponsePropertyWithFeatureAndScore {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  price: number;
  areaM2: number;
  propertyType: PropertyType;
  feature: ResponsePropertyFeature;
  createdAt: Date;
  updatedAt: Date;
  score?: number;
  deletedAt?: Date;
}

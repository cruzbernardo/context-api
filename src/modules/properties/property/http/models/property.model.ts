import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PropertyType } from '../../../enums';
import {
  RequestCreateProperty,
  RequestUpdateProperty,
  RequestFilterProperty,
  ResponseProperty,
  ResponsePropertyWithFeatureAndScore,
} from '../interfaces';
import { GetPropertyFeatureModel } from '../../../propertyFeatures/http/models';

export class CreatePropertyModel implements RequestCreateProperty {
  @ApiProperty({
    description: 'Titulo do imovel',
    example: 'Escritorio comercial no centro',
    minLength: 3,
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'O titulo e obrigatorio.' })
  @IsString({ message: 'O titulo deve ser uma string.' })
  @MinLength(3, { message: 'O titulo deve ter no minimo 3 caracteres.' })
  @MaxLength(200, { message: 'O titulo nao pode ter mais de 200 caracteres.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({
    description: 'Cidade do imovel',
    example: 'Sao Paulo',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'A cidade e obrigatoria.' })
  @IsString({ message: 'A cidade deve ser uma string.' })
  @MaxLength(100, { message: 'A cidade nao pode ter mais de 100 caracteres.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city: string;

  @ApiProperty({
    description: 'Bairro do imovel',
    example: 'Pinheiros',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'O bairro e obrigatorio.' })
  @IsString({ message: 'O bairro deve ser uma string.' })
  @MaxLength(100, { message: 'O bairro nao pode ter mais de 100 caracteres.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  neighborhood: string;

  @ApiProperty({
    description: 'Preco do imovel',
    example: 150000.0,
  })
  @IsNotEmpty({ message: 'O preco e obrigatorio.' })
  @IsNumber({}, { message: 'O preco deve ser um numero.' })
  @Min(0, { message: 'O preco deve ser positivo.' })
  price: number;

  @ApiProperty({
    description: 'Area em metros quadrados',
    example: 120.5,
  })
  @IsNotEmpty({ message: 'A area e obrigatoria.' })
  @IsNumber({}, { message: 'A area deve ser um numero.' })
  @Min(0, { message: 'A area deve ser positiva.' })
  areaM2: number;

  @ApiProperty({
    description: 'Tipo do imovel',
    enum: PropertyType,
    example: PropertyType.OFFICE,
  })
  @IsNotEmpty({ message: 'O tipo do imovel e obrigatorio.' })
  @IsEnum(PropertyType, { message: 'Tipo de imovel invalido.' })
  propertyType: PropertyType;
}

export class UpdatePropertyModel implements RequestUpdateProperty {
  @ApiPropertyOptional({
    description: 'Titulo do imovel',
    example: 'Escritorio comercial no centro',
  })
  @IsOptional()
  @IsString({ message: 'O titulo deve ser uma string.' })
  @MinLength(3, { message: 'O titulo deve ter no minimo 3 caracteres.' })
  @MaxLength(200, { message: 'O titulo nao pode ter mais de 200 caracteres.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({
    description: 'Cidade do imovel',
    example: 'Sao Paulo',
  })
  @IsOptional()
  @IsString({ message: 'A cidade deve ser uma string.' })
  @MaxLength(100, { message: 'A cidade nao pode ter mais de 100 caracteres.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city?: string;

  @ApiPropertyOptional({
    description: 'Bairro do imovel',
    example: 'Pinheiros',
  })
  @IsOptional()
  @IsString({ message: 'O bairro deve ser uma string.' })
  @MaxLength(100, { message: 'O bairro nao pode ter mais de 100 caracteres.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  neighborhood?: string;

  @ApiPropertyOptional({
    description: 'Preco do imovel',
    example: 150000.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'O preco deve ser um numero.' })
  @Min(0, { message: 'O preco deve ser positivo.' })
  price?: number;

  @ApiPropertyOptional({
    description: 'Area em metros quadrados',
    example: 120.5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'A area deve ser um numero.' })
  @Min(0, { message: 'A area deve ser positiva.' })
  areaM2?: number;

  @ApiPropertyOptional({
    description: 'Tipo do imovel',
    enum: PropertyType,
    example: PropertyType.OFFICE,
  })
  @IsOptional()
  @IsEnum(PropertyType, { message: 'Tipo de imovel invalido.' })
  propertyType?: PropertyType;
}

export class GetPropertyModel implements ResponseProperty {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  neighborhood: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  areaM2: number;

  @ApiProperty({ enum: PropertyType })
  propertyType: PropertyType;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}

export class FilterPropertyModel implements RequestFilterProperty {
  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'New York',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by neighborhood',
    example: 'Manhattan',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  neighborhood?: string;

  @ApiPropertyOptional({
    description: 'Filter by property type',
    enum: PropertyType,
    example: PropertyType.OFFICE,
  })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({
    description: 'Minimum price',
    example: 100000,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price',
    example: 500000,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Minimum area in m2',
    example: 50,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  minArea?: number;

  @ApiPropertyOptional({
    description: 'Maximum area in m2',
    example: 500,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  maxArea?: number;

  @ApiPropertyOptional({
    description: 'Filter by near subway (from AI features)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  nearSubway?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by needs renovation (from AI features)',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  needsRenovation?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by recommended use (from AI features)',
    enum: PropertyType,
    example: PropertyType.OFFICE,
  })
  @IsOptional()
  @IsEnum(PropertyType)
  recommendedUse?: PropertyType;
}

export class RankPropertiesModel {
  @ApiProperty({
    description: 'Natural language search text describing the desired property',
    example:
      'Client is looking for an office near the subway, budget up to $500k, for 15-20 people',
  })
  @IsNotEmpty({ message: 'O texto de busca e obrigatorio.' })
  @IsString({ message: 'O texto de busca deve ser uma string.' })
  text: string;
}

export class GetPropertyWithScoreModel implements Omit<
  ResponsePropertyWithFeatureAndScore,
  'feature'
> {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  neighborhood: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  areaM2: number;

  @ApiProperty({ enum: PropertyType })
  propertyType: PropertyType;

  @ApiProperty({ type: () => GetPropertyFeatureModel })
  feature: GetPropertyFeatureModel;

  @ApiProperty({ description: 'Match score (0-10)', example: 7.5 })
  score: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}

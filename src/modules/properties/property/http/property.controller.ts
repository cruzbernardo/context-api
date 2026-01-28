import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreatePropertyDocs,
  GetPropertyDocs,
  GetAllPropertiesDocs,
  UpdatePropertyDocs,
  DeletePropertyDocs,
  RankPropertiesDocs,
} from './docs';
import { PropertyService } from '../domain/property.service';
import {
  CreatePropertyModel,
  UpdatePropertyModel,
  FilterPropertyModel,
  RankPropertiesModel,
} from './models';
import {
  ResponseProperty,
  ResponsePropertyWithFeatureAndScore,
} from './interfaces';

@ApiTags('Properties')
@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @CreatePropertyDocs()
  async create(@Body() dto: CreatePropertyModel): Promise<ResponseProperty> {
    return this.propertyService.create(dto);
  }

  @Get()
  @GetAllPropertiesDocs()
  async findAll(
    @Query() filters: FilterPropertyModel,
  ): Promise<ResponseProperty[]> {
    return this.propertyService.findAll(filters);
  }

  @Post('rank')
  @RankPropertiesDocs()
  async rankProperties(
    @Body() dto: RankPropertiesModel,
  ): Promise<ResponsePropertyWithFeatureAndScore[]> {
    return this.propertyService.rankProperties(dto.text);
  }

  @Get(':id')
  @GetPropertyDocs()
  async findOne(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) id: string,
  ): Promise<ResponseProperty> {
    return this.propertyService.findOne(id);
  }

  @Patch(':id')
  @UpdatePropertyDocs()
  async update(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) id: string,
    @Body() dto: UpdatePropertyModel,
  ): Promise<ResponseProperty> {
    return this.propertyService.update(id, dto);
  }

  @Delete(':id')
  @DeletePropertyDocs()
  async remove(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) id: string,
  ): Promise<void> {
    return this.propertyService.remove(id);
  }
}

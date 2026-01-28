import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetPropertyFeatureByPropertyDocs } from './docs';
import { PropertyFeatureService } from '../domain/property-feature.service';
import { ResponsePropertyFeature } from './interfaces';

@ApiTags('Property Features')
@Controller('property-features')
export class PropertyFeatureController {
  constructor(
    private readonly propertyFeatureService: PropertyFeatureService,
  ) {}

  @Get('property/:propertyId')
  @GetPropertyFeatureByPropertyDocs()
  async findByProperty(
    @Param('propertyId', new ParseUUIDPipe({ errorHttpStatusCode: 400 }))
    propertyId: string,
  ): Promise<ResponsePropertyFeature> {
    return this.propertyFeatureService.findByProperty(propertyId);
  }
}

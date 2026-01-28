import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreatePropertyNoteDocs,
  GetPropertyNoteDocs,
  GetAllPropertyNotesDocs,
  DeletePropertyNoteDocs,
} from './docs';
import { PropertyNoteService } from '../domain/property-note.service';
import { CreatePropertyNoteModel } from './models';
import { ResponsePropertyNote } from './interfaces';
import type { UserRequestWithData } from 'src/shared/interfaces';

@ApiTags('Property Notes')
@Controller('property-notes')
export class PropertyNoteController {
  constructor(private readonly propertyNoteService: PropertyNoteService) {}

  @Post()
  @CreatePropertyNoteDocs()
  async create(
    @Req() request: UserRequestWithData,
    @Body() dto: CreatePropertyNoteModel,
  ): Promise<ResponsePropertyNote> {
    return this.propertyNoteService.create({
      ...dto,
      userId: request.user.id,
    });
  }

  @Get('property/:propertyId')
  @GetAllPropertyNotesDocs()
  async findAllByProperty(
    @Param('propertyId', new ParseUUIDPipe({ errorHttpStatusCode: 400 }))
    propertyId: string,
  ): Promise<ResponsePropertyNote[]> {
    return this.propertyNoteService.findAllByProperty(propertyId);
  }

  @Get(':id')
  @GetPropertyNoteDocs()
  async findOne(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) id: string,
  ): Promise<ResponsePropertyNote> {
    return this.propertyNoteService.findOne(id);
  }

  @Delete(':id')
  @DeletePropertyNoteDocs()
  async remove(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) id: string,
  ): Promise<void> {
    return this.propertyNoteService.remove(id);
  }
}

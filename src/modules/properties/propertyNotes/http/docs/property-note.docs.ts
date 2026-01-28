import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ExceptionModel, HttpExceptionModel } from 'src/shared/exceptions';
import { GetPropertyNoteModel } from '../models';

export function CreatePropertyNoteDocs() {
  return applyDecorators(
    ApiCreatedResponse({ type: GetPropertyNoteModel }),
    ApiBadRequestResponse({ type: HttpExceptionModel }),
    ApiInternalServerErrorResponse({ type: ExceptionModel }),
  );
}

export function GetPropertyNoteDocs() {
  return applyDecorators(
    ApiOkResponse({ type: GetPropertyNoteModel }),
    ApiNotFoundResponse({ type: HttpExceptionModel }),
    ApiInternalServerErrorResponse({ type: ExceptionModel }),
  );
}

export function GetAllPropertyNotesDocs() {
  return applyDecorators(
    ApiOkResponse({ type: [GetPropertyNoteModel] }),
    ApiInternalServerErrorResponse({ type: ExceptionModel }),
  );
}

export function UpdatePropertyNoteDocs() {
  return applyDecorators(
    ApiOkResponse({ type: GetPropertyNoteModel }),
    ApiNotFoundResponse({ type: HttpExceptionModel }),
    ApiBadRequestResponse({ type: HttpExceptionModel }),
    ApiInternalServerErrorResponse({ type: ExceptionModel }),
  );
}

export function DeletePropertyNoteDocs() {
  return applyDecorators(
    ApiOkResponse({ description: 'Nota excluida com sucesso' }),
    ApiNotFoundResponse({ type: HttpExceptionModel }),
    ApiInternalServerErrorResponse({ type: ExceptionModel }),
  );
}

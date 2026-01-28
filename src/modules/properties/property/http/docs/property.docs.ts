import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ExceptionModel, HttpExceptionModel } from 'src/shared/exceptions';
import { GetPropertyModel, GetPropertyWithScoreModel } from '../models';

export function CreatePropertyDocs() {
  return applyDecorators(
    ApiCreatedResponse({
      type: GetPropertyModel,
    }),
    ApiBadRequestResponse({
      type: HttpExceptionModel,
    }),
    ApiInternalServerErrorResponse({
      type: ExceptionModel,
    }),
  );
}

export function GetPropertyDocs() {
  return applyDecorators(
    ApiOkResponse({
      type: GetPropertyModel,
    }),
    ApiNotFoundResponse({
      type: HttpExceptionModel,
    }),
    ApiInternalServerErrorResponse({
      type: ExceptionModel,
    }),
  );
}

export function GetAllPropertiesDocs() {
  return applyDecorators(
    ApiOkResponse({
      type: [GetPropertyModel],
    }),
    ApiInternalServerErrorResponse({
      type: ExceptionModel,
    }),
  );
}

export function UpdatePropertyDocs() {
  return applyDecorators(
    ApiOkResponse({
      type: GetPropertyModel,
    }),
    ApiNotFoundResponse({
      type: HttpExceptionModel,
    }),
    ApiBadRequestResponse({
      type: HttpExceptionModel,
    }),
    ApiInternalServerErrorResponse({
      type: ExceptionModel,
    }),
  );
}

export function DeletePropertyDocs() {
  return applyDecorators(
    ApiOkResponse({
      description: 'Imovel excluido com sucesso',
    }),
    ApiNotFoundResponse({
      type: HttpExceptionModel,
    }),
    ApiInternalServerErrorResponse({
      type: ExceptionModel,
    }),
  );
}

export function RankPropertiesDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Rank properties by natural language query',
      description:
        'Analyzes the text using AI to extract search criteria and returns properties ranked by match score (highest first).',
    }),
    ApiOkResponse({
      type: [GetPropertyWithScoreModel],
      description: 'Properties ranked by match score (0-10)',
    }),
    ApiBadRequestResponse({
      type: HttpExceptionModel,
    }),
    ApiInternalServerErrorResponse({
      type: ExceptionModel,
    }),
  );
}

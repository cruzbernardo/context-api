import { applyDecorators } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ExceptionModel, HttpExceptionModel } from 'src/shared/exceptions';
import { GetPropertyFeatureModel } from '../models';

export function GetPropertyFeatureByPropertyDocs() {
  return applyDecorators(
    ApiOkResponse({
      type: GetPropertyFeatureModel,
    }),
    ApiNotFoundResponse({
      type: HttpExceptionModel,
    }),
    ApiInternalServerErrorResponse({
      type: ExceptionModel,
    }),
  );
}

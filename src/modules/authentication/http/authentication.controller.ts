import { Body, Controller, HttpCode, Post, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticationService } from '../domain/authentication.service';
import { Public } from 'src/shared/validators/decorators';
import { SignInDocs, GetMeDocs } from './docs';
import { SignIn } from './interfaces';
import { RequestSignInModel } from './models';
import { Throttle } from '@nestjs/throttler';

import type { PartialUser, UserRequestWithData } from 'src/shared/interfaces';
import { RegisterUserModel } from 'src/modules/users/http/models';

@ApiTags('Authentication')
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('sign-in')
  @Public()
  @HttpCode(200)
  @SignInDocs()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 tentativas por minuto
  async signIn(@Body() body: RequestSignInModel): Promise<SignIn> {
    return this.authenticationService.signIn(body);
  }

  @Post('sign-up')
  @Public()
  @HttpCode(201)
  @SignInDocs()
  @Throttle({ short: { limit: 3, ttl: 3600000 } }) // 3 tentativas por hora
  async signUp(@Body() body: RegisterUserModel): Promise<SignIn> {
    return this.authenticationService.signUp(body);
  }

  @Get('me')
  @HttpCode(200)
  @GetMeDocs()
  getMe(@Req() request: UserRequestWithData): PartialUser {
    return request.user;
  }
}

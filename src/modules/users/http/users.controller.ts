import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GetUserDocs } from './docs/user.docs';
import { UsersService } from '../domain/users.service';
import { RegisterUserModel } from './models';
import { ResponseGetUserWithoutPassword } from './interfaces';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('register')
  @GetUserDocs()
  async register(
    @Body() dto: RegisterUserModel,
  ): Promise<ResponseGetUserWithoutPassword> {
    return this.userService.register(dto);
  }

  @Get(':id')
  @GetUserDocs()
  async get(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) id: string,
  ): Promise<ResponseGetUserWithoutPassword> {
    return this.userService.get(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ForgotService } from './forgot.service';
import { ApiQuery } from '@nestjs/swagger';

@Controller('forgot')
export class ForgotController {
  constructor(private readonly forgotService: ForgotService) {}

  @ApiQuery({ name: 'email', required: true, type: 'string' })
  @Post('email')
  forgotEmail(@Query() args: { email: string }) {
    return this.forgotService.forgotEmail(args.email);
  }

  @ApiQuery({ name: 'email', required: true, type: 'string' })
  @ApiQuery({ name: 'code', required: true, type: 'string' })
  @Post('code')
  forgotCode(@Query() args: { email: string; code: string }) {
    return this.forgotService.forgotCode(args.email, args.code);
  }
}

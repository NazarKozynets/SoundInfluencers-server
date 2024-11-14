import { Body, Controller, Get, Res, Response } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Res() res) {
    // return res.redirect('/api');
    return res.redirect('/api-nazar');
  }
}

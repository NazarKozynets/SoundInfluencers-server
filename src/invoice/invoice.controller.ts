import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { UpdateInvoiceDetailsDto } from './dto/update-invoice-details';
import { ApiQuery } from '@nestjs/swagger';
import { CreateClientDto } from 'src/auth/dto/create-client.dto';
import { CreateInvoiceDtoDto } from './dto/create-invoice.dto';
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @ApiQuery({ name: 'userId', required: true })
  @Get('details/one')
  getInvoiceDetails(@Query() args: { userId: string }) {
    return this.invoiceService.getInvoiceDetails(args.userId);
  }

  @Put('details')
  updateInvoiceDetails(@Body() data: UpdateInvoiceDetailsDto) {
    return this.invoiceService.updateInvoiceDetails(data);
  }

  @Post('create')
  createInvoice(@Body() data: CreateInvoiceDtoDto) {
    return this.invoiceService.createInvoice(data);
  }

  @ApiQuery({ name: 'influencerId' })
  @Get()
  getInvoices(@Query() args: { influencerId: string }) {
    return this.invoiceService.getInvoices(args.influencerId);
  }

  @ApiQuery({ name: 'influencerId' })
  @Get('saved')
  getInvoiceSave(@Query() args: { influencerId: string }) {
    return this.invoiceService.getInvoiceSave(args.influencerId);
  }

  
}

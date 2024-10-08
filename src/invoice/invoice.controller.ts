import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Put,
    Param,
    Delete,
    Query, Res,
} from '@nestjs/common';
import {InvoiceService} from './invoice.service';
import {UpdateInvoiceDetailsDto} from './dto/update-invoice-details';
import {ApiQuery} from '@nestjs/swagger';
import {CreateClientDto} from 'src/auth/dto/create-client.dto';
import {CreateInvoiceDtoDto} from './dto/create-invoice.dto';
import { Response } from 'express'; // Это может вызывать ошибку

@Controller('invoice')
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {
    }

    @ApiQuery({name: 'userId', required: true})
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

    @ApiQuery({name: 'influencerId'})
    @Get()
    getInvoices(@Query() args: { influencerId: string }) {
        return this.invoiceService.getInvoices(args.influencerId);
    }

    @ApiQuery({name: 'influencerId'})
    @Get('saved')
    getInvoiceSave(@Query() args: { influencerId: string }) {
        return this.invoiceService.getInvoiceSave(args.influencerId);
    }

    @Get('download')
    @ApiQuery({ name: 'invoiceId' })
    downloadInvoice(@Query() args: { invoiceId: string }, @Res() res: Response) {
        return this.invoiceService.downloadInvoice(args.invoiceId, res);
    }
}

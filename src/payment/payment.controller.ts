import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    Res,
} from '@nestjs/common';
import {PaymentService} from './payment.service';
import {CreateOrderStripe, CreateOrderTransfer} from './dto/create-payment.dto';
import {Response} from 'express';
import {ApiQuery} from "@nestjs/swagger";

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {
    }

    @Post('create-order-stripe')
    createOrderStripe(@Body() data: CreateOrderStripe) {
        return this.paymentService.createOrderStripe(data);
    }

    @Post('create-order-tranfer')
    createOrderTransfer(@Body() data: CreateOrderTransfer) {
        return this.paymentService.createOrderTransfer(data);
    }

    @Get('accept-order-gocardless')
    acceptOrderStripe(@Query() args: { orderId: string, redirect_flow_id: string }, @Res() res: Response) {
        return this.paymentService.acceptOrderStripe(args.orderId, args.redirect_flow_id, res);
    }

    @Get('cancel-order-gocardless')
    cancelOrderStripe(@Query() args: { orderId: string }, @Res() res: Response) {
        return this.paymentService.cancelOrderStripe(args.orderId, res);
    }

    @Get('download')
    @ApiQuery({name: 'invoiceId'})
    downloadPaymentInvoice(@Query() args: { invoiceId: string }, @Res() res: Response) {
        return this.paymentService.downloadPaymentInvoice(args.invoiceId, res);
    }
}

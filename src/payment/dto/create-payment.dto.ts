import {ApiProperty} from '@nestjs/swagger';

export class CreateOrderStripe {
    @ApiProperty({required: true})
    nameProduct: string;

    @ApiProperty({required: true})
    userId: string;

    @ApiProperty({required: true})
    amount: string;

    @ApiProperty({default: 'stripe'})
    paymentMethod: string;
}

export class CreateOrderTransfer {
    @ApiProperty({required: true})
    nameProduct: string;

    @ApiProperty({required: true})
    userId: string;

    @ApiProperty({required: true})
    country: string;

    @ApiProperty({required: true})
    amount: string;

    @ApiProperty({default: 'stripe'})
    paymentMethod: string;

    @ApiProperty({required: false, description: 'Email for sending the invoice, if specified'})
    emailForSendingInvoice?: string;

    @ApiProperty({required: false, description: 'po number'})
    poNumber?: string;

    @ApiProperty({required: false, description: 'campaign name'})
    campaignName?: string;
}

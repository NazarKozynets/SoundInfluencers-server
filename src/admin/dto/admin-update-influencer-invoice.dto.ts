import {ApiProperty} from "@nestjs/swagger";

export class AdminUpdateInfluencerInvoiceDto {
    @ApiProperty({required: true})
    _id: string;

    @ApiProperty({required: false})
    companyName: string;

    @ApiProperty({required: false})
    contactEmail: string;

    @ApiProperty({required: false})
    amount: string;
    
    @ApiProperty({required: false})
    selectedPaymentMethod: string;
    
    @ApiProperty({required: false})
    status: string;
}